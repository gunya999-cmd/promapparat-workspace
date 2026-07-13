import React,{useState}from'react';
import{ArrowRight,Check,X}from'lucide-react';
import{money}from'../domain/workspace.js';
import{REJECTION_REASONS}from'../domain/opportunities.js';

const answerLabel=value=>value===true?'Да':value===false?'Нет':'—';

export function OpportunityDecisionPanel({selected,platform,data,onQualify,onAccept,onReject,onOpenWork}){
 const[rejectReason,setRejectReason]=useState(''),[rejectNote,setRejectNote]=useState('');
 if(!selected)return <aside className="qualification-panel"><div className="qualification-empty">Выберите строку в таблице</div></aside>;
 const reject=()=>{onReject(rejectReason,rejectNote);setRejectReason('');setRejectNote('')};
 return <aside className="qualification-panel">
  <div className="qualification-head"><span>Экспресс-анализ</span><h2>{selected.customer}</h2><p>{selected.title}</p></div>
  <div className="qualification-summary"><div><span>Площадка</span><b>{platform?.name||'—'}</b></div><div><span>Сумма</span><b>{money(selected.estimatedAmount,data.settings?.currency||'RUB')}</b></div><div><span>Дедлайн</span><b>{selected.deadline||'—'}</b></div></div>
  {['profileFit','manufacturerAvailable','timeFeasible','commercialInterest'].map((field,index)=>{const labels=['Наш профиль','Есть производитель','Успеваем по сроку','Коммерчески интересно'];return <div className="qualification-question" key={field}><div><b>{labels[index]}</b><span>{answerLabel(selected[field])}</span></div><div><button className={selected[field]===true?'active yes':''} onClick={()=>onQualify(field,true)}>Да</button><button className={selected[field]===false?'active no':''} onClick={()=>onQualify(field,false)}>Нет</button></div></div>})}
  <label className="qualification-notes">Комментарий<textarea defaultValue={selected.notes||''} key={`${selected.id}-${selected.updatedAt||''}`} onBlur={event=>onQualify('notes',event.target.value)}/></label>
  {!['Взята в работу','Отказ'].includes(selected.status)&&<><button className="accept-opportunity" onClick={onAccept}><Check/>Взять в работу <ArrowRight/></button><div className="reject-box"><select value={rejectReason} onChange={event=>setRejectReason(event.target.value)}><option value="">Причина отказа</option>{REJECTION_REASONS.map(item=><option key={item}>{item}</option>)}</select><input value={rejectNote} onChange={event=>setRejectNote(event.target.value)} placeholder="Комментарий к отказу"/><button onClick={reject}><X/>Отказаться</button></div></>}
  {selected.status==='Взята в работу'&&<button className="linked-work" onClick={()=>onOpenWork(selected.workId)}>Открыть созданный проект <ArrowRight/></button>}
  {selected.status==='Отказ'&&<div className="rejected-note"><b>{selected.rejectionReason}</b><span>{selected.rejectionNote}</span></div>}
 </aside>;
}
