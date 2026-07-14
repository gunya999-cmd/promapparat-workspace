const DB_NAME='promapparat-workspace-files';
const DB_VERSION=1;
const STORE_NAME='attachments';

const makeId=()=>globalThis.crypto?.randomUUID?.()||`file-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const openDb=()=>new Promise((resolve,reject)=>{
 if(!globalThis.indexedDB){reject(new Error('Локальное хранилище файлов недоступно'));return}
 const request=indexedDB.open(DB_NAME,DB_VERSION);
 request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:'id'})};
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error||new Error('Не удалось открыть локальное хранилище файлов'));
});

const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Ошибка локального хранилища файлов'))});

async function putRecord(record){const db=await openDb();try{const transaction=db.transaction(STORE_NAME,'readwrite');await requestResult(transaction.objectStore(STORE_NAME).put(record))}finally{db.close()}}
async function getRecord(id){if(!id)return null;const db=await openDb();try{return await requestResult(db.transaction(STORE_NAME,'readonly').objectStore(STORE_NAME).get(id))||null}finally{db.close()}}
async function deleteRecord(id){if(!id)return;const db=await openDb();try{await requestResult(db.transaction(STORE_NAME,'readwrite').objectStore(STORE_NAME).delete(id))}finally{db.close()}}

export async function persistAttachmentEntries(entries=[]){
 const result=[];
 for(const entry of entries){
  const file=entry?.file||((typeof File!=='undefined'&&entry instanceof File)?entry:null),storageKey=entry?.storageKey||makeId(),name=String(entry?.name||file?.name||'Файл'),size=Number(entry?.size??file?.size??0),type=String(entry?.type||file?.type||''),addedAt=entry?.addedAt||new Date().toISOString();
  if(!file){result.push({storageKey,name,size,type,addedAt,storedLocally:!!entry?.storedLocally});continue}
  try{await putRecord({id:storageKey,blob:file,name,size,type,lastModified:file.lastModified||Date.now(),savedAt:new Date().toISOString()});result.push({storageKey,name,size,type,addedAt,storedLocally:true})}
  catch(error){result.push({storageKey,name,size,type,addedAt,storedLocally:false,storageError:error?.message||'Файл не сохранён локально'})}
 }
 return result;
}

export async function getStoredAttachment(metaOrKey){
 const storageKey=typeof metaOrKey==='string'?metaOrKey:metaOrKey?.storageKey,record=await getRecord(storageKey);
 if(!record)return null;
 const name=record.name||metaOrKey?.name||'Файл',type=record.type||metaOrKey?.type||record.blob?.type||'';
 return new File([record.blob],name,{type,lastModified:record.lastModified||Date.now()});
}

export async function hasStoredAttachment(metaOrKey){try{return!!(await getRecord(typeof metaOrKey==='string'?metaOrKey:metaOrKey?.storageKey))}catch{return false}}

export async function downloadStoredAttachment(meta){
 const file=await getStoredAttachment(meta);if(!file)throw new Error('Файл не найден на этом компьютере');
 const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function removeStoredAttachment(metaOrKey){try{await deleteRecord(typeof metaOrKey==='string'?metaOrKey:metaOrKey?.storageKey)}catch{/* metadata can still be removed */}}
