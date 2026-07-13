import{LEGACY_STORAGE_KEYS,STORAGE_KEY,createDemoWorkspace,normalizeWorkspace}from'../domain/workspace.js';
import{CURRENT_SCHEMA_VERSION,validateWorkspace}from'../domain/schema.js';

const BACKUP_KEY=`${STORAGE_KEY}_backup`;
const CORRUPT_KEY=`${STORAGE_KEY}_corrupt`;
const COLLECTIONS=['works','suppliers','positions','documents','tasks','customers','events','formulas','formulaImports','specificationImports','platforms','opportunities','platformChecks','users'];
const preserveCollections=(normalized,source)=>{const next={...normalized};for(const key of COLLECTIONS)if(Array.isArray(source?.[key]))next[key]=source[key];return next};
const normalizeRoles=data=>{const role=value=>['admin','head','director'].includes(value)?'director':'manager',users=(data.users||[]).map(user=>({...user,role:role(user.role)})),currentUser=data.currentUser?{...data.currentUser,role:role(data.currentUser.role)}:(users[0]||null);return{...data,users,currentUser}};
const prepare=data=>normalizeRoles(preserveCollections(normalizeWorkspace(data),data));

export class LocalWorkspaceRepository{
 readRaw(){let raw=localStorage.getItem(STORAGE_KEY);if(!raw)for(const key of LEGACY_STORAGE_KEYS){raw=localStorage.getItem(key);if(raw)break}return raw}
 load(){const raw=this.readRaw();if(!raw)return prepare(createDemoWorkspace());try{const parsed=JSON.parse(raw),beforeVersion=Number(parsed.schemaVersion||0),data=prepare(parsed);if(beforeVersion<CURRENT_SCHEMA_VERSION){this.snapshot(parsed,'before-migration');localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}return data}catch(error){localStorage.setItem(CORRUPT_KEY,JSON.stringify({savedAt:new Date().toISOString(),raw,error:String(error)}));return prepare(createDemoWorkspace())}}
 save(data){const normalized=prepare(data),check=validateWorkspace(normalized);if(!check.ok)throw new Error(`Данные не сохранены: ${check.errors.join('; ')}`);const current=this.safeParse(localStorage.getItem(STORAGE_KEY)),revision=Math.max(Number(current?.meta?.revision||0),Number(normalized.meta?.revision||0))+1,payload={...normalized,meta:{...normalized.meta,revision,updatedAt:new Date().toISOString()}};localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));return payload}
 safeParse(raw){try{return raw?JSON.parse(raw):null}catch{return null}}
 snapshot(data,reason='manual'){const backup={reason,savedAt:new Date().toISOString(),data:prepare(data)};localStorage.setItem(BACKUP_KEY,JSON.stringify(backup));return backup}
 getBackup(){return this.safeParse(localStorage.getItem(BACKUP_KEY))}
 restoreBackup(){const backup=this.getBackup();if(!backup?.data)throw new Error('Резервная копия не найдена');const data=prepare(backup.data);localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data}
 exportText(data){return JSON.stringify({format:'promapparat-workspace',schemaVersion:CURRENT_SCHEMA_VERSION,exportedAt:new Date().toISOString(),data:prepare(data)},null,2)}
 importText(text){const parsed=JSON.parse(text),source=parsed?.format==='promapparat-workspace'?parsed.data:parsed,data=prepare(source),check=validateWorkspace(data);if(!check.ok)throw new Error(check.errors.join('; '));this.snapshot(this.load(),'before-import');localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data}
 clear(){this.snapshot(this.load(),'before-reset');localStorage.removeItem(STORAGE_KEY);for(const key of LEGACY_STORAGE_KEYS)localStorage.removeItem(key)}
 subscribe(listener){const handler=event=>{if(event.key===STORAGE_KEY&&event.newValue){const parsed=this.safeParse(event.newValue);if(parsed)listener(prepare(parsed))}};window.addEventListener('storage',handler);return()=>window.removeEventListener('storage',handler)}
}

export const workspaceRepository=new LocalWorkspaceRepository();