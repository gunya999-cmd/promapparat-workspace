import React,{useEffect,useRef,useState}from'react';
import{Clipboard,ExternalLink,Link2,Paperclip,Plus,UploadCloud,X}from'lucide-react';
import{createOpportunity}from'../domain/opportunities.js';
import{analyzeTenderPaste,buildManualTenderDraft}from'../domain/manualTenderCapture.js';

const blank=()=>({pastedText:'',sourceUrl:'',platformId:'',externalId:'',customer:'',title:'',estimatedAmount:'',deadline:'',notes:'',attachments:[]});

export function QuickTenderCapture({data,setData,currentUser,onClose,onSaved}){
 const fileRef=useRef(null),[form,setForm]=useState(blank),[error,setError]=useState(''),[busy,setBusy]=useState(false),platforms=data.platforms||[];
 useEffect(()=>{const close=event=>event.key==='Escape'&&onClose?.();window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onClose]);
 const detectedPlatform=platforms.find(item=>item.id===form.platformId);
 const applyPaste=value=>{const next=analyzeTenderPaste(value,platforms);setForm(current=>({...current,pastedText:value,sourceUrl:next.sourceUrl,platformId:next.platformId,externalId:next.externalId,title:current.title||next.title,customer:current.customer||next.customer}));setError('')};
 const paste=async()=>{try{applyPaste(await navigator.clipboard.readText())}catch{setError('Не удалось прочитать буфер. Вставьте ссылку или текст вручную.')}};
 const addFiles=files=>{const additions=Array.from(files||[]).map(file=>({name:file.name,size:file.size,type:file.type}));setForm(current=>({...current,attachments:[...current.attachments,...additions]}));if(fileRef.current)fileRef.current.value=''};
 const removeFile=index=>setForm(current=>({...current,attachments:current.attachments.filter((_,itemIndex)=>itemIndex!==index)}));
 const save=()=>{if(!form.pastedText.trim()&&!form.sourceUrl.trim()&&!form.customer.trim()&&!form.title.trim()){setError('Вставьте ссылку или укажите хотя бы заказчика либо предмет закупки.');return}setBusy(true);try{const draft=buildManualTenderDraft(form,data.platforms||[],currentUser),result=createOpportunity(data,draft,currentUser);setData(result.state);onSaved?.(result.opportunity)}catch(exception){setError(exception?.message||'Не удалось добавить тендер');setBusy(false)}};
 return <div className="capture-backdrop" onMouseDown={event=>event.target===event.currentTarget&&onClose?.()}>
  <section className="tender-capture" role="dialog" aria-modal="true" aria-labelledby="capture-title">
   <header className="capture-head"><div><span>Ручное добавление · 20–30 секунд</span><h2 id="capture-title">Добавить тендер</h2><p>Сначала просто сохраните находку. Детали можно дополнить позже, ничего не потеряется.</p></div><button aria-label="Закрыть" onClick={onClose}><X/></button></header>
   <div className="capture-paste">
    <div className="capture-paste-title"><Link2/><div><b>Вставьте ссылку или скопированный текст</b><span>Подойдут ссылка с площадки, заголовок из письма или несколько строк из браузера.</span></div></div>
    <textarea autoFocus value={form.pastedText} onChange={event=>applyPaste(event.target.value)} placeholder={'Например:\nПоставка шаровых кранов DN300\nhttps://zakupki.gov.ru/...'} />
    <div className="capture-paste-actions"><button onClick={paste}><Clipboard/>Вставить из буфера</button>{form.sourceUrl&&<a href={form.sourceUrl} target="_blank" rel="noreferrer">Проверить ссылку <ExternalLink/></a>}{detectedPlatform&&<em>Определено: {detectedPlatform.name}</em>}</div>
   </div>
   {error&&<div className="capture-error">{error}</div>}
   <div className="capture-grid">
    <label className="wide"><span>Предмет закупки</span><input value={form.title} onChange={event=>setForm({...form,title:event.target.value})} placeholder="Можно оставить пустым и заполнить позже"/></label>
    <label><span>Заказчик</span><input value={form.customer} onChange={event=>setForm({...form,customer:event.target.value})} placeholder="Необязательно на первом шаге"/></label>
    <label><span>Площадка</span><select value={form.platformId} onChange={event=>setForm({...form,platformId:event.target.value})}><option value="">Другая / не определена</option>{platforms.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label><span>Номер процедуры</span><input value={form.externalId} onChange={event=>setForm({...form,externalId:event.target.value})} placeholder="Определяется из ссылки"/></label>
    <label><span>Срок подачи</span><input type="date" value={form.deadline} onChange={event=>setForm({...form,deadline:event.target.value})}/></label>
    <label><span>Ориентировочная сумма</span><input type="number" min="0" value={form.estimatedAmount} onChange={event=>setForm({...form,estimatedAmount:event.target.value})} placeholder="Необязательно"/></label>
   </div>
   <section className="capture-files"><div><Paperclip/><div><b>Документы и скриншоты</b><span>Пока сохраняются названия файлов; после создания сделки их можно импортировать в спецификацию.</span></div></div><input ref={fileRef} hidden type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg" onChange={event=>addFiles(event.target.files)}/><button onClick={()=>fileRef.current?.click()}><UploadCloud/>Добавить файлы</button></section>
   {form.attachments.length>0&&<div className="capture-file-list">{form.attachments.map((file,index)=><div key={`${file.name}-${index}`}><Paperclip/><span>{file.name}</span><button aria-label={`Удалить ${file.name}`} onClick={()=>removeFile(index)}><X/></button></div>)}</div>}
   <details className="capture-more"><summary>Комментарий и дополнительные сведения</summary><textarea value={form.notes} onChange={event=>setForm({...form,notes:event.target.value})} placeholder="Что важно проверить, контакт, условия, примечание…"/></details>
   <footer className="capture-footer"><div><b>После сохранения</b><span>Тендер появится в очереди «Новые» у текущего менеджера.</span></div><button onClick={onClose}>Отмена</button><button className="primary" disabled={busy} onClick={save}><Plus/>{busy?'Сохранение…':'Сохранить тендер'}</button></footer>
  </section>
 </div>;
}
