import React,{useState}from'react';
import{AlertTriangle,ArrowRight,Check,Download,ExternalLink,Paperclip,X}from'lucide-react';
import{downloadServerFile}from'../api/client.js';
import{money}from'../domain/workspace.js';
import{REJECTION_REASONS}from'../domain/opportunities.js';
import{downloadStoredAttachment}from'../domain/attachmentStore.js';

const answerLabel=value=>value===true?'Да':value===false?'Нет':'—';

export function OpportunityDecisionPanel({selected,platform,data,onQualify,onAccept,onReject,onOpenWork,readOnly=false}){
 const[rejectReason,setRejectReason]=useState(''),[rejectNote,setRejectNote]=useState(''),[fileError,setFileError]=useState(''),serverManaged=data.meta?.serverManaged===true;
 if(!selected)return <aside className="qualification-panel"><div className="qualification-empty">Выберите строку в таблице</div></aside>;
 const reject=()=>{if(!rejectReason)return;onReject(rejectReason,rejectNote);setRejectReason('');setRejectNote('')};
 const openFile=async attachment=>{try{if(attachment.serverFileId)await downloadServerFile(attachment.serverFileId,attachment.name);else await downloadStoredAttachment(attachment);setFileError('')}catch(exception){setFileError(exception?.message||'Файл недоступен')}};
 const missing=[!selected.customer||selected.customer==='Заказчик не указан'?'заказчик':'',!selected.title||selected.title.startsWith('Новый тендер')?'предмет закупки':'',!selected.deadline?'срок подачи':''].filter(Boolean);
 return <aside className="qualification-panel">
  <div className="qualification-head"><span>{readOnly?'Контроль директора':'Экспресс-анализ'}</span><h2>{selected.customer}</h2><p>{selected.title}</p></div>
  <div className="qualification-summary"><div><span>Площадка</span><b>{platform?.name||'Другая'}</b></div><div><span>Сумма</span><b>{money(selected.estimatedAmount,data.settings?.currency||'RUB')}</b></div><div><span>Дедлайн</span><b>{selected.deadline||'Не указан'}</b></div></div>
  {missing.length>0&&<div className="capture-incomplete"><AlertTriangle/><div><b>Нужно дополнить карточку</b><span>{missing.join(', ')}. Измените данные прямо в строке таблицы.</span></div></div>}
  {fileError&&<div className="capture-file-error"><AlertTriangle/>{fileError}</div>}
  {(selected.sourceUrl||(selected.attachments||[]).length>0)&&<section className="opportunity-source">{selected.sourceUrl&&<a href={selected.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink/><div><b>Открыть оригинал</b><span>{selected.externalId||selected.sourceUrl}</span></div></a>}{(selected.attachments||[]).length>0&&<div className="opportunity-attachments"><div className="opportunity-attachments-head"><Paperclip/><div><b>Приложения: {selected.attachments.length}</b><span>{serverManaged?'Доступны сотрудникам через сервер':'Сохранены локально на Windows-компьютере'}</span></div></div><div className="opportunity-file-list">{selected.attachments.map((item,index)=>{const available=item.serverFileId||item.storageKey&&item.storedLocally!==false;return <button key={item.serverFileId||item.storageKey||`${item.name}-${index}`} disabled={!available} onClick={()=>openFile(item)}><Download/><span><b>{item.name}</b><small>{item.serverFileId?'Скачать с сервера':available?'Скачать':'Доступна только карточка'}</small></span></button>})}</div></div>}</section>}
  {readOnly&&<div className="readonly-note">Решение и комментарии редактирует ответственный менеджер.</div>}
  {['profileFit','manufacturerAvailable','timeFeasible','commercialInterest'].map((field,index)=>{const labels=['Наш профиль','Есть производитель','Успеваем по сроку','Коммерчески интересно'];return <div className="qualification-question" key={field}><div><b>{labels[index]}</b><span>{answerLabel(selected[field])}</span></div>{!readOnly&&<div><button className={selected[field]===true?'active yes':''} onClick={()=>onQualify(field,true)}>Да</button><button className={selected[field]===false?'active no':''} onClick={()=>onQualify(field,false)}>Нет</button></div>}</div>})}
  {readOnly?<div className="qualification-notes"><span>Комментарий</span><p>{selected.notes||'Комментария нет'}</p></div>:<label className="qualification-notes">Комментарий<textarea defaultValue={selected.notes||''} key={`${selected.id}-${selected.updatedAt||''}`} onBlur={event=>onQualify('notes',event.target.value)}/></label>}
  {!readOnly&&!['Взята в работу','Отказ'].includes(selected.status)&&<><button className="accept-opportunity" disabled={missing.length>0} onClick={onAccept}><Check/>{missing.length?'Сначала дополните карточку':'Взять в работу'} <ArrowRight/></button><div className="reject-box"><select value={rejectReason} onChange={event=>setRejectReason(event.target.value)}><option value="">Причина отказа</option>{REJECTION_REASONS.map(item=><option key={item}>{item}</option>)}</select><input value={rejectNote} onChange={event=>setRejectNote(event.target.value)} placeholder="Комментарий к отказу"/><button disabled={!rejectReason} onClick={reject}><X/>Отказаться</button></div></>}
  {selected.status==='Взята в работу'&&<button className="linked-work" onClick={()=>onOpenWork(selected.workId)}>Открыть созданную сделку <ArrowRight/></button>}
  {selected.status==='Отказ'&&<div className="rejected-note"><b>{selected.rejectionReason}</b><span>{selected.rejectionNote}</span></div>}
 </aside>;
}
