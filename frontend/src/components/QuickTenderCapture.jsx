import React,{useEffect,useRef,useState}from'react';
import{Clipboard,Download,ExternalLink,Link2,Paperclip,Plus,UploadCloud,X}from'lucide-react';
import{createOpportunity}from'../domain/opportunities.js';
import{analyzeTenderPaste,buildManualTenderDraft}from'../domain/manualTenderCapture.js';
import{persistAttachmentEntries}from'../domain/attachmentStore.js';

const blank=()=>({pastedText:'',sourceUrl:'',platformId:'',externalId:'',customer:'',title:'',estimatedAmount:'',deadline:'',notes:'',attachments:[]});

export function QuickTenderCapture({data,setData,currentUser,onClose,onSaved,initialCapture=''}){
 const fileRef=useRef(null),[form,setForm]=useState(blank),[error,setError]=useState(''),[busy,setBusy]=useState(false),[dragging,setDragging]=useState(false),platforms=data.platforms||[];
 const detectedPlatform=platforms.find(item=>item.id===form.platformId);
 const applyPaste=value=>{const next=analyzeTenderPaste(value,platforms);setForm(current=>({...current,pastedText:value,sourceUrl:next.sourceUrl,platformId:next.platformId,externalId:next.externalId,title:current.title||next.title,customer:current.customer||next.customer,estimatedAmount:current.estimatedAmount||next.estimatedAmount||'',deadline:current.deadline||next.deadline||''}));setError('')};
 const paste=async()=>{try{applyPaste(await navigator.clipboard.readText())}catch{setError('Не удалось прочитать буфер. Нажмите Ctrl+V в большом поле.')}};
 const addFiles=files=>{const additions=Array.from(files||[]).map(file=>({file,name:file.name,size:file.size,type:file.type}));if(!additions.length)return;setForm(current=>{const existing=new Set(current.attachments.map(item=>`${item.name}|${item.size}`));return{...current,attachments:[...current.attachments,...additions.filter(item=>!existing.has(`${item.name}|${item.size}`))]}});setDragging(false);if(fileRef.current)fileRef.current.value=''};
 const removeFile=index=>setForm(current=>({...current,attachments:current.attachments.filter((_,itemIndex)=>itemIndex!==index)}));
 const save=async()=>{if(busy)return;if(!form.pastedText.trim()&&!form.sourceUrl.trim()&&!form.customer.trim()&&!form.title.trim()){setError('Вставьте ссылку или укажите хотя бы заказчика либо предмет закупки.');return}setBusy(true);try{const attachments=await persistAttachmentEntries(form.attachments),draft=buildManualTenderDraft({...form,attachments},data.platforms||[],currentUser),result=createOpportunity(data,draft,currentUser);setData(result.state);onSaved?.(result.opportunity)}catch(exception){setError(exception?.message||'Не удалось добавить тендер');setBusy(false)}};
 useEffect(()=>{if(initialCapture)applyPaste(initialCapture)},[initialCapture]);
 useEffect(()=>{const keyboard=event=>{if(event.key==='Escape')onClose?.();if(event.ctrlKey&&event.key==='Enter'){event.preventDefault();save()}};window.addEventListener('keydown',keyboard);return()=>window.removeEventListener('keydown',keyboard)});
 return <div className={`capture-backdrop ${dragging?'is-dragging':''}`} onDragEnter={event=>{event.preventDefault();setDragging(true)}} onDragOver={event=>event.preventDefault()} onDragLeave={event=>{if(event.target===event.currentTarget)setDragging(false)}} onDrop={event=>{event.preventDefault();addFiles(event.dataTransfer.files)}} onMouseDown={event=>event.target===event.currentTarget&&onClose?.()}>
  <section className="tender-capture" role="dialog" aria-modal="true" aria-labelledby="capture-title">
   {dragging&&<div className="capture-drop-overlay"><UploadCloud/><b>Отпустите файлы</b><span>PDF, Excel, Word, архивы и изображения</span></div>}
   <header className="capture-head"><div><span>Windows · быстрый ввод</span><h2 id="capture-title">Добавить тендер</h2><p>Ctrl+V — вставить, Ctrl+Enter — сохранить, Esc — закрыть.</p></div><div className="capture-head-actions"><a href="/install-promapparat-extension.ps1" download><Download/>Расширение Edge</a><button aria-label="Закрыть" onClick={onClose}><X/></button></div></header>
   <div className="capture-paste">
    <div className="capture-paste-title"><Link2/><div><b>Вставьте ссылку или скопированный текст</b><span>Можно вставить несколько строк из браузера, письма или карточки площадки.</span></div></div>
    <textarea autoFocus value={form.pastedText} onChange={event=>applyPaste(event.target.value)} placeholder={'Ctrl+V\nПоставка шаровых кранов DN300\nhttps://zakupki.gov.ru/...'} />
    <div className="capture-paste-actions"><button onClick={paste}><Clipboard/>Вставить из буфера</button>{form.sourceUrl&&<a href={form.sourceUrl} target="_blank" rel="noreferrer">Проверить ссылку <ExternalLink/></a>}{detectedPlatform&&<em>Определено: {detectedPlatform.name}</em>}</div>
   </div>
   {error&&<div className="capture-error">{error}</div>}
   <div className="capture-grid">
    <label className="wide"><span>Предмет закупки</span><input value={form.title} onChange={event=>setForm({...form,title:event.value})} placeholder="Можно заполнить позже"/></label>
    <label><span>Заказчик</span><input value={form.customer} onChange={event=>setForm({...form,customer:event.target.value})} placeholder="Необязательно на первом шаге"/></label>
    <label><span>Площадка</span><select value={form.platformId} onChange={event=>setForm({...form,platformId:event.target.value})}><option value="">Другая / не определена</option>{platforms.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label><span>Номер процедуры</span><input value={form.externalId} onChange={event=>setForm({...form,externalId:event.target.value})} placeholder="Определяется из ссылки"/></label>
    <label><span>Срок подачи</span><input type="date" value={form.deadline} onChange={event=>setForm({...form,deadline:event.target.value})}/></label>
    <label><span>Ориентировочная сумма</span><input type="number" min="0" value={form.estimatedAmount} onChange={event=>setForm({...form,estimatedAmount:event.target.value})} placeholder="Необязательно"/></label>
   </div>
   <section className={`capture-files ${dragging?'dragging':''}`} onClick={()=>fileRef.current?.click()}><div><Paperclip/><div><b>Перетащите документы из Проводника</b><span>Файлы сохранятся локально на этом компьютере и перейдут в карточку сделки.</span></div></div><input ref={fileRef} hidden type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg" onChange={event=>addFiles(event.target.files)}/><button type="button" onClick={event=>{event.stopPropagation();fileRef.current?.click()}}><UploadCloud/>Выбрать файлы</button></section>
   {form.attachments.length>0&&<div className="capture-file-list">{form.attachments.map((file,index)=><div key={`${file.name}-${file.size}-${index}`}><Paperclip/><span>{file.name}</span><button aria-label={`Удалить ${file.name}`} onClick={()=>removeFile(index)}><X/></button></div>)}</div>}
   <details className="capture-more"><summary>Комментарий и дополнительные сведения</summary><textarea value={form.notes} onChange={event=>setForm({...form,notes:event.target.value})} placeholder="Что важно проверить, контакт, условия, примечание…"/></details>
   <footer className="capture-footer"><div><b>Быстрое сохранение</b><span>Файлы останутся на этом Windows-компьютере. Нажмите Ctrl+Enter.</span></div><button onClick={onClose}>Отмена</button><button className="primary" disabled={busy} onClick={save}><Plus/>{busy?'Сохранение…':'Сохранить тендер'}<kbd>Ctrl+Enter</kbd></button></footer>
  </section>
 </div>;
}
