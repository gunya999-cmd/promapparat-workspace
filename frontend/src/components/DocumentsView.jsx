import React,{useMemo,useRef,useState}from'react';
import{AlertTriangle,File,FileCheck2,FileSpreadsheet,FileText,Image,Paperclip,Search,Trash2,UploadCloud}from'lucide-react';
import{uid}from'../domain/workspace.js';

const TYPES=['ТЗ','Спецификация','ТКП','Опросный лист','Паспорт','Сертификат','КП','Договор','Счет','Отгрузочные документы','Прочее'];
const REQUIRED=['ТЗ','Спецификация','КП'];
const formatSize=size=>{if(!size)return'—';if(size<1024)return`${size} Б`;if(size<1048576)return`${(size/1024).toFixed(1)} КБ`;return`${(size/1048576).toFixed(1)} МБ`};
const iconFor=name=>{const ext=(name.split('.').pop()||'').toLowerCase();if(['xlsx','xls','csv'].includes(ext))return<FileSpreadsheet/>;if(['png','jpg','jpeg','webp'].includes(ext))return<Image/>;if(['pdf','doc','docx','txt'].includes(ext))return<FileText/>;return<File/>};

export function DocumentsView({work,data,setData}){
 const inputRef=useRef(null);
 const[query,setQuery]=useState('');
 const[type,setType]=useState('Все типы');
 const[target,setTarget]=useState('work');
 const[selectedType,setSelectedType]=useState('ТЗ');
 const[required,setRequired]=useState(false);
 const[dragging,setDragging]=useState(false);
 const docs=(data.documents||[]).filter(doc=>doc.workId===work.id);
 const missingRequired=REQUIRED.filter(item=>!docs.some(doc=>doc.type===item));
 const filtered=useMemo(()=>docs.filter(doc=>{
  const hay=`${doc.name} ${doc.type}`.toLowerCase();
  return(!query||hay.includes(query.toLowerCase()))&&(type==='Все типы'||doc.type===type);
 }),[docs,query,type]);
 const addFiles=files=>{
  const list=[...files];if(!list.length)return;
  const positionId=target==='work'?null:target;
  const additions=list.map(file=>({id:uid(),workId:work.id,positionId,type:selectedType,name:file.name,size:file.size,mime:file.type||'',uploadedAt:new Date().toISOString(),required}));
  setData(current=>({...current,documents:[...(current.documents||[]),...additions]}));
 };
 const remove=id=>setData(current=>({...current,documents:(current.documents||[]).filter(doc=>doc.id!==id)}));
 return <section className="documents-view">
  <div className="documents-summary">
   <div><span>Документы</span><b>{docs.length}</b></div>
   <div><span>Обязательных не хватает</span><b className={missingRequired.length?'bad':'good'}>{missingRequired.length}</b></div>
   <div><span>Привязано к позициям</span><b>{docs.filter(doc=>doc.positionId).length}</b></div>
  </div>
  {missingRequired.length>0&&<div className="documents-alert"><AlertTriangle/><div><b>Не хватает обязательных документов</b><p>{missingRequired.join(', ')}</p></div></div>}
  <div className="documents-controls">
   <label><span>Тип</span><select value={selectedType} onChange={e=>setSelectedType(e.target.value)}>{TYPES.map(item=><option key={item}>{item}</option>)}</select></label>
   <label><span>Привязка</span><select value={target} onChange={e=>setTarget(e.target.value)}><option value="work">Вся работа</option>{work.positions.map(position=><option key={position.id} value={position.id}>Позиция №{position.rowNo}: {position.name}</option>)}</select></label>
   <label className="required-check"><input type="checkbox" checked={required} onChange={e=>setRequired(e.target.checked)}/><span>Обязательный</span></label>
  </div>
  <div className={`drop-zone ${dragging?'dragging':''}`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files)}} onClick={()=>inputRef.current?.click()}>
   <UploadCloud/><b>Перетащите документы сюда</b><span>или нажмите для выбора файлов</span><small>На Cloudflare сохраняются только карточки файлов. Содержимое будет храниться на локальном сервере.</small>
   <input ref={inputRef} type="file" multiple hidden onChange={e=>addFiles(e.target.files)}/>
  </div>
  <div className="document-toolbar"><label className="document-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по названию"/></label><select value={type} onChange={e=>setType(e.target.value)}><option>Все типы</option>{TYPES.map(item=><option key={item}>{item}</option>)}</select></div>
  <div className="documents-list">
   {filtered.length?filtered.map(doc=>{
    const position=work.positions.find(item=>item.id===doc.positionId);
    return <article className="document-card" key={doc.id}><div className="document-icon">{iconFor(doc.name)}</div><div className="document-main"><div className="document-title"><b>{doc.name}</b>{doc.required&&<span><FileCheck2/>обязательный</span>}</div><p>{doc.type} · {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleString('ru-RU')}</p><small>{position?`Позиция №${position.rowNo}: ${position.name}`:'Вся работа'}</small></div><button className="document-delete" onClick={()=>remove(doc.id)}><Trash2/></button></article>
   }):<div className="documents-empty"><Paperclip/><b>Документы не найдены</b><span>Добавьте первый файл или измените фильтр.</span></div>}
  </div>
 </section>
}
