import React,{useState}from'react';
import{Save,X}from'lucide-react';
import{SOURCES,WORK_STATES,todayPlus}from'../domain/workspace.js';

export function NewWorkModal({onClose,onSave}){
 const[form,setForm]=useState({title:'',source:'Тендер',customer:'',objectName:'',manager:'',deadline:todayPlus(3),state:'Новая'});
 return <div className="modal-bg"><form className="modal" onSubmit={event=>{event.preventDefault();onSave(form)}}>
  <div className="modal-head"><h2>Новая работа</h2><button type="button" onClick={onClose}><X/></button></div>
  <label>Название<input required maxLength="200" value={form.title} onChange={event=>setForm({...form,title:event.target.value})}/></label>
  <label>Заказчик<input required maxLength="200" value={form.customer} onChange={event=>setForm({...form,customer:event.target.value})}/></label>
  <div className="grid2"><label>Источник<select value={form.source} onChange={event=>setForm({...form,source:event.target.value})}>{SOURCES.map(source=><option key={source}>{source}</option>)}</select></label><label>Статус<select value={form.state} onChange={event=>setForm({...form,state:event.target.value})}>{WORK_STATES.map(state=><option key={state}>{state}</option>)}</select></label></div>
  <label>Объект<input maxLength="300" value={form.objectName} onChange={event=>setForm({...form,objectName:event.target.value})}/></label>
  <label>Дедлайн<input required type="date" value={form.deadline} onChange={event=>setForm({...form,deadline:event.target.value})}/></label>
  <div className="modal-actions"><button type="button" onClick={onClose}>Отмена</button><button className="primary"><Save/>Создать</button></div>
 </form></div>;
}
