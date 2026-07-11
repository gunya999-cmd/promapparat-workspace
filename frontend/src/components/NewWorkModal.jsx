import React,{useState}from'react';
import{Save,X}from'lucide-react';
import{SOURCES,WORK_STATES,todayPlus}from'../domain/workspace.js';

export function NewWorkModal({onClose,onSave}){
 const[form,setForm]=useState({title:'',source:'Тендер',customer:'',objectName:'',manager:'Менеджер',deadline:todayPlus(3),state:'Новая'});
 return <div className="modal-bg"><form className="modal" onSubmit={event=>{event.preventDefault();if(form.title&&form.customer)onSave(form)}}>
  <div className="modal-head"><h2>Новая работа</h2><button type="button" onClick={onClose}><X/></button></div>
  <label>Название<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
  <label>Заказчик<input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/></label>
  <div className="grid2"><label>Источник<select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>{SOURCES.map(source=><option key={source}>{source}</option>)}</select></label><label>Статус<select value={form.state} onChange={e=>setForm({...form,state:e.target.value})}>{WORK_STATES.map(state=><option key={state}>{state}</option>)}</select></label></div>
  <label>Объект<input value={form.objectName} onChange={e=>setForm({...form,objectName:e.target.value})}/></label>
  <label>Дедлайн<input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></label>
  <div className="modal-actions"><button type="button" onClick={onClose}>Отмена</button><button className="primary"><Save/>Создать</button></div>
 </form></div>
}
