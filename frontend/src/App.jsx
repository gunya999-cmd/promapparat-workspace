import React,{useEffect,useMemo,useRef,useState}from'react';
import{ArrowDown,ArrowUp,Copy,FilePlus2,Plus,Search,Save,Trash2}from'lucide-react';
import{logout}from'./api/client.js';
import{useWorkspace}from'./store/useWorkspace.js';

const DRAFT_KEY='promapparat-request-draft-v3';
const makeId=()=>globalThis.crypto?.randomUUID?.()||`req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const blankPosition=()=>({id:makeId(),name:'',description:'',quantity:'1',unit:'шт.',comment:''});
const emptyForm=()=>({id:'',number:'',date:new Date().toISOString().slice(0,10),customer:'',title:'',sourceUrl:'',deadline:'',processBy:'',requestType:'Тендер',status:'Новая',notes:'',positions:[blankPosition()]});
const normalizeForm=value=>({...emptyForm(),...(value||{}),positions:Array.isArray(value?.positions)&&value.positions.length?value.positions.map(item=>({...blankPosition(),...item,id:item.id||makeId()})):[blankPosition()]});
const draftHasContent=form=>Boolean(form.id||form.number||form.customer||form.title||form.sourceUrl||form.deadline||form.processBy||form.notes||(form.positions||[]).some(item=>item.name||item.description||item.comment));

export default function App({serverSession=null}){
 const workspace=useWorkspace({serverSession}),{data,setData}=workspace;
 const customerRef=useRef(null);
 const[form,setForm]=useState(()=>{try{const saved=localStorage.getItem(DRAFT_KEY);return saved?normalizeForm(JSON.parse(saved)):emptyForm()}catch{return emptyForm()}});
 const[query,setQuery]=useState(''),[statusFilter,setStatusFilter]=useState('Все'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[draftSavedAt,setDraftSavedAt]=useState(null);
 const rows=useMemo(()=>Array.isArray(data.requestsV1)?data.requestsV1:[],[data.requestsV1]);
 const filtered=useMemo(()=>rows.filter(item=>(statusFilter==='Все'||item.status===statusFilter)&&`${item.number||''} ${item.customer||''} ${item.title||''} ${item.sourceUrl||''}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>String(b.updatedAt||b.date||'').localeCompare(String(a.updatedAt||a.date||''))),[rows,query,statusFilter]);
 const filledPositions=(form.positions||[]).filter(item=>item.name||item.description||item.comment);

 useEffect(()=>{const timer=setTimeout(()=>{try{if(draftHasContent(form)){localStorage.setItem(DRAFT_KEY,JSON.stringify(form));setDraftSavedAt(new Date())}else localStorage.removeItem(DRAFT_KEY)}catch{}},350);return()=>clearTimeout(timer)},[form]);
 useEffect(()=>{const beforeUnload=event=>{if(!draftHasContent(form))return;event.preventDefault();event.returnValue=''};window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload)},[form]);

 const change=(field,value)=>{setForm(current=>({...current,[field]:value}));setError('');setNotice('')};
 const focusCustomer=()=>setTimeout(()=>customerRef.current?.focus(),0);
 const clear=()=>{setForm(emptyForm());setError('');setNotice('');setDraftSavedAt(null);try{localStorage.removeItem(DRAFT_KEY)}catch{}focusCustomer()};
 const edit=item=>{setForm(normalizeForm(item));setError('');setNotice('');window.scrollTo({top:0,behavior:'smooth'});focusCustomer()};
 const duplicateRequest=item=>{const copy=normalizeForm({...item,id:'',number:'',date:new Date().toISOString().slice(0,10),status:'Новая',updatedAt:'',createdAt:'',positions:(item.positions||[]).map(position=>({...position,id:makeId()}))});setForm(copy);setError('');setNotice('Создана копия заявки. Проверьте номер и даты перед сохранением.');focusCustomer()};
 const remove=id=>{if(!window.confirm('Удалить эту заявку?'))return;setData(current=>({...current,requestsV1:(current.requestsV1||[]).filter(item=>item.id!==id)}));if(form.id===id)clear()};

 const updatePosition=(id,field,value)=>setForm(current=>({...current,positions:current.positions.map(item=>item.id===id?{...item,[field]:value}:item)}));
 const addPosition=()=>setForm(current=>({...current,positions:[...current.positions,blankPosition()]}));
 const duplicatePosition=id=>setForm(current=>{const index=current.positions.findIndex(item=>item.id===id);if(index<0)return current;const next=[...current.positions];next.splice(index+1,0,{...current.positions[index],id:makeId()});return{...current,positions:next}});
 const removePosition=id=>setForm(current=>{const next=current.positions.filter(item=>item.id!==id);return{...current,positions:next.length?next:[blankPosition()]}});
 const movePosition=(id,direction)=>setForm(current=>{const index=current.positions.findIndex(item=>item.id===id),target=index+direction;if(index<0||target<0||target>=current.positions.length)return current;const next=[...current.positions];[next[index],next[target]]=[next[target],next[index]];return{...current,positions:next}});

 const persist=createNext=>{const customer=form.customer.trim(),title=form.title.trim();if(!customer||!title){setError('Заполните заказчика и предмет закупки.');return false}const now=new Date().toISOString(),id=form.id||makeId(),record={...form,id,customer,title,positions:(form.positions||[]).filter(item=>item.name||item.description||item.comment).map(item=>({...item,quantity:String(item.quantity||'1').trim()||'1',unit:String(item.unit||'шт.').trim()||'шт.'})),createdAt:form.createdAt||now,updatedAt:now};setData(current=>{const list=Array.isArray(current.requestsV1)?current.requestsV1:[],exists=list.some(item=>item.id===id);return{...current,requestsV1:exists?list.map(item=>item.id===id?record:item):[record,...list]}});try{localStorage.removeItem(DRAFT_KEY)}catch{}if(createNext){setForm(emptyForm());setNotice('Заявка сохранена. Можно вводить следующую.');focusCustomer()}else{setForm(normalizeForm(record));setNotice('Заявка сохранена.');setDraftSavedAt(new Date())}setError('');return true};
 const save=event=>{event.preventDefault();persist(false)};
 const hotkeys=event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();persist(false)}};

 if(workspace.loading)return <main className="manual-loading">Загрузка…</main>;
 return <main className="manual-app">
  <header className="manual-topbar"><div><b>Промаппарат</b><span>Ручной ввод заявок</span></div><div className="topbar-actions"><span>{draftSavedAt?`Черновик сохранён ${draftSavedAt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}`:'Новый черновик'}</span>{serverSession&&<button onClick={()=>logout()}>Выйти</button>}</div></header>
  <section className="manual-workspace">
   <aside className="request-register">
    <div className="register-title"><div><h2>Заявки</h2><span>{rows.length}</span></div><button className="primary" onClick={clear}><FilePlus2/>Новая</button></div>
    <label className="register-search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск по заявкам"/></label>
    <div className="register-filters">{['Все','Новая','В работе','Отложена','Закрыта'].map(status=><button key={status} className={statusFilter===status?'active':''} onClick={()=>setStatusFilter(status)}>{status}</button>)}</div>
    <div className="request-list">{filtered.map(item=><article key={item.id} className={form.id===item.id?'selected':''} onClick={()=>edit(item)}><div className="request-line"><b>{item.customer||'Без заказчика'}</b><em>{item.status||'Новая'}</em></div><strong>{item.title||'Предмет не указан'}</strong><div className="request-meta"><span>{item.number||'Без номера'}</span><span>{item.deadline?`до ${item.deadline}`:'Без срока'}</span><span>{(item.positions||[]).length} поз.</span></div><div className="request-row-actions"><button title="Создать копию" onClick={event=>{event.stopPropagation();duplicateRequest(item)}}><Copy/></button><button className="danger" title="Удалить" onClick={event=>{event.stopPropagation();remove(item.id)}}><Trash2/></button></div></article>)}{!filtered.length&&<div className="register-empty"><FilePlus2/><b>Заявок нет</b><span>Создайте первую заявку справа.</span></div>}</div>
   </aside>
   <form className="request-editor" onSubmit={save} onKeyDown={hotkeys}>
    <header className="editor-head"><div><span>{form.id?'Редактирование заявки':'Новая заявка'}</span><h1>{form.customer||'Ввод данных'}</h1><p>{form.title||'Заполните основные поля и добавьте позиции оборудования.'}</p></div><div className="editor-actions"><button type="button" onClick={clear}>Очистить</button><button type="button" onClick={()=>persist(true)}><Save/>Сохранить и новая</button><button className="primary" type="submit"><Save/>Сохранить</button></div></header>
    {error&&<div className="manual-error">{error}</div>}{notice&&<div className="manual-notice">{notice}</div>}
    <section className="request-section">
     <div className="section-heading"><div><span>01</span><h2>Основные данные</h2></div><small>* обязательные поля</small></div>
     <div className="request-grid">
      <label>№ заявки<input value={form.number} onChange={event=>change('number',event.target.value)} placeholder="Например, 1443"/></label>
      <label>Дата<input type="date" value={form.date} onChange={event=>change('date',event.target.value)}/></label>
      <label>Обработать до<input type="date" value={form.processBy} onChange={event=>change('processBy',event.target.value)}/></label>
      <label>Срок подачи<input type="date" value={form.deadline} onChange={event=>change('deadline',event.target.value)}/></label>
      <label className="wide">Заказчик *<input ref={customerRef} value={form.customer} onChange={event=>change('customer',event.target.value)} placeholder="Название организации"/></label>
      <label className="wide">Предмет закупки *<input value={form.title} onChange={event=>change('title',event.target.value)} placeholder="Кратко: что закупают"/></label>
      <label>Характер заявки<select value={form.requestType} onChange={event=>change('requestType',event.target.value)}><option>Тендер</option><option>Запрос цены</option><option>Текущая потребность</option><option>Другое</option></select></label>
      <label>Статус<select value={form.status} onChange={event=>change('status',event.target.value)}><option>Новая</option><option>В работе</option><option>Отложена</option><option>Закрыта</option></select></label>
      <label className="full">Ссылка на тендер <span className="optional">необязательно</span><input type="url" value={form.sourceUrl} onChange={event=>change('sourceUrl',event.target.value)} placeholder="Вставляется вручную, без автоматической загрузки"/></label>
      <label className="full">Комментарий<textarea value={form.notes} onChange={event=>change('notes',event.target.value)} rows="3" placeholder="Важные условия, контакты, особенности заявки"/></label>
     </div>
    </section>
    <section className="request-section positions-section">
     <div className="section-heading"><div><span>02</span><h2>Позиции заявки</h2><b>{filledPositions.length}</b></div><button type="button" onClick={addPosition}><Plus/>Добавить позицию</button></div>
     <div className="positions-help">Заполняйте строки сверху вниз. Пустые строки при сохранении автоматически не записываются.</div>
     <div className="positions-wrap"><table className="positions-table"><thead><tr><th>№</th><th>Наименование</th><th>Техническое описание</th><th>Кол-во</th><th>Ед.</th><th>Комментарий</th><th></th></tr></thead><tbody>{form.positions.map((position,index)=><tr key={position.id}><td className="position-number">{index+1}</td><td><input value={position.name} onChange={event=>updatePosition(position.id,'name',event.target.value)} placeholder="Клапан, расходомер…"/></td><td><textarea value={position.description} onChange={event=>updatePosition(position.id,'description',event.target.value)} rows="2" placeholder="Тип, DN, PN, материал, исполнение, комплектность"/></td><td><input className="quantity" value={position.quantity} onChange={event=>updatePosition(position.id,'quantity',event.target.value)} inputMode="decimal"/></td><td><input className="unit" value={position.unit} onChange={event=>updatePosition(position.id,'unit',event.target.value)}/></td><td><textarea value={position.comment} onChange={event=>updatePosition(position.id,'comment',event.target.value)} rows="2" placeholder="Примечание"/></td><td><div className="position-actions"><button type="button" title="Выше" disabled={index===0} onClick={()=>movePosition(position.id,-1)}><ArrowUp/></button><button type="button" title="Ниже" disabled={index===form.positions.length-1} onClick={()=>movePosition(position.id,1)}><ArrowDown/></button><button type="button" title="Дублировать" onClick={()=>duplicatePosition(position.id)}><Copy/></button><button type="button" className="danger" title="Удалить" onClick={()=>removePosition(position.id)}><Trash2/></button></div></td></tr>)}</tbody></table></div>
     <button type="button" className="add-position-bottom" onClick={addPosition}><Plus/>Добавить ещё позицию</button>
    </section>
    <footer className="editor-footer"><span>Быстрое сохранение: <kbd>Ctrl</kbd> + <kbd>Enter</kbd></span><div><button type="button" onClick={()=>persist(true)}>Сохранить и новая</button><button className="primary" type="submit">Сохранить заявку</button></div></footer>
   </form>
  </section>
 </main>;
}
