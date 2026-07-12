import React,{useMemo,useState}from'react';
import{Bell,Command,Plus,Search,UserRound}from'lucide-react';

export function CommandBar({works,currentUser,onOpenWork,onNew,section}){
 const[query,setQuery]=useState(''),[open,setOpen]=useState(false);
 const results=useMemo(()=>{const value=query.trim().toLowerCase();if(!value)return[];return works.filter(work=>`${work.code} ${work.customer} ${work.title} ${work.objectName||''}`.toLowerCase().includes(value)).slice(0,7)},[works,query]);
 const choose=id=>{onOpenWork(id);setQuery('');setOpen(false)};
 return <header className="command-bar">
  <div className="command-context"><span>PromApparat Workspace v2</span><b>{section==='dashboard'?'Рабочий день':section==='works'?'Рабочее пространство тендера':section==='suppliers'?'Поставщики':section==='formulas'?'Финансовые правила':'Система'}</b></div>
  <div className="command-search"><Search/><input value={query} onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true)}} placeholder="Найти тендер, заказчика или номер…"/><kbd><Command/>K</kbd>{open&&query&&<div className="command-results">{results.map(work=><button key={work.id} onMouseDown={()=>choose(work.id)}><div><b>{work.customer}</b><span>{work.code} · {work.title}</span></div></button>)}{!results.length&&<div className="command-empty">Ничего не найдено</div>}</div>}</div>
  <div className="command-actions"><button className="command-new" onClick={onNew}><Plus/>Новая работа</button><button className="command-icon" title="Уведомления"><Bell/></button><div className="command-user"><UserRound/><div><b>{currentUser?.name||'Пользователь'}</b><span>{currentUser?.role==='admin'?'Администратор':currentUser?.role==='head'?'Руководитель':'Менеджер'}</span></div></div></div>
 </header>;
}
