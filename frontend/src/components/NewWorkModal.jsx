import React,{useState}from'react';
import{Save,X}from'lucide-react';
import{SOURCES,todayPlus}from'../domain/workspace.js';

export function NewWorkModal({onClose,onSave,currentUser}){
 const[form,setForm]=useState({title:'',source:'Тендер',customer:'',objectName:'',manager:currentUser?.name||'',deadline:todayPlus(3),state:'Новая'});
 return <div className="modal-bg" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="new-deal-title" onSubmit={event=>{event.preventDefault();onSave(form)}}>
  <div className="modal-head"><div><h2 id="new-deal-title">Новая сделка</h2><p>Создайте карточку — позиции и документы добавляются следующим шагом.</p></div><button type="button" aria-label="Закрыть" onClick={onClose}><X/></button></div>
  <label>Заказчик<input autoFocus required maxLength="200" placeholder="Например, ПАО НК Роснефть" value={form.customer} onChange={event=>setForm({...form,customer:event.target.value})}/></label>
  <label>Предмет сделки<input required maxLength="200" placeholder="Например, шаровые краны DN300" value={form.title} onChange={event=>setForm({...form,title:event.target.value})}/></label>
  <div className="grid2"><label>Источник<select value={form.source} onChange={event=>setForm({...form,source:event.target.value})}>{SOURCES.map(source=><option key={source}>{source}</option>)}</select></label><label>Крайний срок<input required type="date" value={form.deadline} onChange={event=>setForm({...form,deadline:event.target.value})}/></label></div>
  <label>Объект или проект<input maxLength="300" placeholder="Необязательно" value={form.objectName} onChange={event=>setForm({...form,objectName:event.target.value})}/></label>
  <div className="modal-owner"><span>Ответственный</span><b>{currentUser?.name||'Текущий менеджер'}</b></div>
  <div className="modal-actions"><button type="button" onClick={onClose}>Отмена</button><button className="primary"><Save/>Создать сделку</button></div>
 </form></div>;
}
