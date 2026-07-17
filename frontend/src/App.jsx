import React,{useMemo,useState}from'react';
import{Plus,Search,Trash2}from'lucide-react';
import{logout}from'./api/client.js';
import{useWorkspace}from'./store/useWorkspace.js';

const emptyForm=()=>({id:'',number:'',date:new Date().toISOString().slice(0,10),customer:'',title:'',sourceUrl:'',deadline:'',processBy:'',requestType:'Тендер',status:'Новая',notes:''});
const makeId=()=>globalThis.crypto?.randomUUID?.()||`req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App({serverSession=null}){
 const workspace=useWorkspace({serverSession}),{data,setData}=workspace;
 const[form,setForm]=useState(emptyForm),[query,setQuery]=useState(''),[error,setError]=useState('');
 const rows=useMemo(()=>Array.isArray(data.requestsV1)?data.requestsV1:[],[data.requestsV1]);
 const filtered=rows.filter(item=>`${item.number} ${item.customer} ${item.title} ${item.sourceUrl}`.toLowerCase().includes(query.toLowerCase()));
 const change=(field,value)=>setForm(current=>({...current,[field]:value}));
 const clear=()=>{setForm(emptyForm());setError('')};
 const edit=item=>{setForm({...emptyForm(),...item});setError('');window.scrollTo({top:0,behavior:'smooth'})};
 const save=event=>{event.preventDefault();const customer=form.customer.trim(),title=form.title.trim();if(!customer||!title){setError('Заполните заказчика и предмет закупки.');return}const record={...form,id:form.id||makeId(),customer,title,updatedAt:new Date().toISOString()};setData(current=>{const list=Array.isArray(current.requestsV1)?current.requestsV1:[],exists=list.some(item=>item.id===record.id);return{...current,requestsV1:exists?list.map(item=>item.id===record.id?record:item):[record,...list]}});clear()};
 const remove=id=>{if(!window.confirm('Удалить эту заявку?'))return;setData(current=>({...current,requestsV1:(current.requestsV1||[]).filter(item=>item.id!==id)}));if(form.id===id)clear()};
 if(workspace.loading)return <main className="input-loading">Загрузка…</main>;
 return <main className="input-app">
  <header className="input-topbar"><div><b>Промаппарат</b><span>Этап 1 · ввод заявок</span></div>{serverSession&&<button onClick={()=>logout()}>Выйти</button>}</header>
  <section className="input-layout">
   <form className="input-form" onSubmit={save}>
    <div className="input-form-head"><div><span>{form.id?'Редактирование':'Новая заявка'}</span><h1>Ввод данных</h1></div>{form.id&&<button type="button" onClick={clear}>Новая</button>}</div>
    {error&&<div className="input-error">{error}</div>}
    <div className="input-grid">
     <label>№ заявки<input value={form.number} onChange={e=>change('number',e.target.value)}/></label>
     <label>Дата<input type="date" value={form.date} onChange={e=>change('date',e.target.value)}/></label>
     <label>Обработать до<input type="date" value={form.processBy} onChange={e=>change('processBy',e.target.value)}/></label>
     <label>Срок подачи<input type="date" value={form.deadline} onChange={e=>change('deadline',e.target.value)}/></label>
     <label className="wide">Заказчик *<input value={form.customer} onChange={e=>change('customer',e.target.value)} placeholder="Название организации"/></label>
     <label className="wide">Предмет закупки *<input value={form.title} onChange={e=>change('title',e.target.value)} placeholder="Что закупают"/></label>
     <label>Характер заявки<select value={form.requestType} onChange={e=>change('requestType',e.target.value)}><option>Тендер</option><option>Запрос цены</option><option>Текущая потребность</option><option>Другое</option></select></label>
     <label>Статус<select value={form.status} onChange={e=>change('status',e.target.value)}><option>Новая</option><option>В работе</option><option>Отложена</option><option>Закрыта</option></select></label>
     <label className="full">Ссылка<input type="url" value={form.sourceUrl} onChange={e=>change('sourceUrl',e.target.value)} placeholder="https://"/></label>
     <label className="full">Комментарий<textarea value={form.notes} onChange={e=>change('notes',e.target.value)} rows="4"/></label>
    </div>
    <div className="input-actions"><button type="button" onClick={clear}>Очистить</button><button className="primary" type="submit">{form.id?'Сохранить изменения':'Сохранить заявку'}</button></div>
   </form>
   <section className="input-register">
    <div className="input-register-head"><div><h2>Заявки</h2><span>{rows.length}</span></div><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск"/></label></div>
    <div className="input-table-wrap"><table><thead><tr><th>№</th><th>Дата</th><th>Заказчик</th><th>Предмет</th><th>Срок</th><th>Статус</th><th></th></tr></thead><tbody>{filtered.map(item=><tr key={item.id} onDoubleClick={()=>edit(item)}><td>{item.number||'—'}</td><td>{item.date||'—'}</td><td><button className="row-open" onClick={()=>edit(item)}>{item.customer}</button></td><td>{item.title}</td><td>{item.deadline||'—'}</td><td>{item.status}</td><td><button className="row-delete" onClick={()=>remove(item.id)} title="Удалить"><Trash2/></button></td></tr>)}</tbody></table>{!filtered.length&&<div className="input-empty"><Plus/><b>Заявок пока нет</b><span>Заполните форму и нажмите «Сохранить заявку».</span></div>}</div>
   </section>
  </section>
 </main>;
}
