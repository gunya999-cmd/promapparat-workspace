import React,{useMemo,useState}from'react';
import{Bell,Command,Plus,Search,ShieldCheck,UserRound}from'lucide-react';

const sectionTitle=section=>({manager:'Рабочий стол менеджера',opportunities:'Поиск тендеров',dashboard:'Рабочий день',works:'Карточка сделки',suppliers:'Поставщики',director:'Панель директора',finance:'Финансовый центр директора',formulas:'Конструктор формул',system:'Система'}[section]||'PromApparat Workspace');

export function CommandBar({works,currentUser,onOpenWork,onNew,onSwitchRole,section}){
 const[query,setQuery]=useState(''),[open,setOpen]=useState(false),isDirector=currentUser?.role==='director';
 const results=useMemo(()=>{const value=query.trim().toLowerCase();if(!value)return[];return works.filter(work=>`${work.code} ${work.customer} ${work.title} ${work.objectName||''}`.toLowerCase().includes(value)).slice(0,7)},[works,query]);
 const choose=id=>{onOpenWork(id);setQuery('');setOpen(false)};
 return <header className="command-bar">
  <div className="command-context"><span>PromApparat Workspace R4 Alpha</span><b>{sectionTitle(section)}</b></div>
  <div className="command-search"><Search/><input value={query} onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true)}} placeholder="Найти сделку, заказчика или номер…"/><kbd><Command/>K</kbd>{open&&query&&<div className="command-results">{results.map(work=><button key={work.id} onMouseDown={()=>choose(work.id)}><div><b>{work.customer}</b><span>{work.code} · {work.title}</span></div></button>)}{!results.length&&<div className="command-empty">Ничего не найдено</div>}</div>}</div>
  <div className="command-actions"><div className="command-mode-switch" role="group" aria-label="Переключение режима"><button className={!isDirector?'active manager':''} onClick={()=>onSwitchRole?.('manager')} title="Открыть рабочее место менеджера"><UserRound/><span>Менеджер</span></button><button className={isDirector?'active director':''} onClick={()=>onSwitchRole?.('director')} title="Открыть кабинет директора"><ShieldCheck/><span>Директор</span></button></div>{!isDirector&&<button className="command-new" onClick={onNew}><Plus/>Новая сделка</button>}<button className="command-icon" title="Уведомления"><Bell/></button><div className="command-user"><UserRound/><div><b>{currentUser?.name||'Пользователь'}</b><span>{isDirector?'Директор':'Менеджер'}</span></div></div></div>
 </header>;
}