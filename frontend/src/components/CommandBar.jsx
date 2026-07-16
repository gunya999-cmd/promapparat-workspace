import React,{useMemo,useState}from'react';
import{Bell,Clipboard,Cloud,Command,LogOut,RefreshCw,Search,ShieldCheck,UserRound}from'lucide-react';

const sectionTitle=section=>({manager:'Тендеры',opportunities:'Тендеры и площадки',dashboard:'Рабочий день',works:'Карточка сделки',suppliers:'Поставщики',director:'Сводка компании',finance:'Финансовый центр',formulas:'Формулы',system:'Система и данные'}[section]||'PromApparat Workspace');
const syncLabel=value=>({loading:'Загрузка',pending:'Ожидает сохранения',saving:'Сохранение…',synced:'Сохранено',conflict:'Конфликт данных',error:'Ошибка синхронизации'}[value]||'Локальный режим');

export function CommandBar({works,currentUser,onOpenWork,onAddTender,onLogout,serverManaged=false,syncState='',onReload,section}){
 const[query,setQuery]=useState(''),[open,setOpen]=useState(false),isDirector=currentUser?.role==='director';
 const results=useMemo(()=>{const value=query.trim().toLowerCase();if(!value)return[];return works.filter(work=>`${work.code} ${work.customer} ${work.title} ${work.objectName||''}`.toLowerCase().includes(value)).slice(0,7)},[works,query]);
 const choose=id=>{onOpenWork(id);setQuery('');setOpen(false)};
 return <header className="command-bar">
  <div className="command-context"><span>PromApparat Workspace</span><b>{sectionTitle(section)}</b></div>
  <div className="command-search"><Search/><input value={query} onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true)}} placeholder="Найти сделку, заказчика или номер…"/><kbd><Command/>K</kbd>{open&&query&&<div className="command-results">{results.map(work=><button key={work.id} onMouseDown={()=>choose(work.id)}><div><b>{work.customer}</b><span>{work.code} · {work.title}</span></div></button>)}{!results.length&&<div className="command-empty">Ничего не найдено</div>}</div>}</div>
  <div className="command-actions">{serverManaged?<><div className={`server-sync ${syncState}`} title={syncLabel(syncState)}><Cloud/><span>{syncLabel(syncState)}</span>{syncState==='conflict'&&<button onClick={onReload} title="Загрузить актуальные данные"><RefreshCw/></button>}</div><div className="server-user"><span><b>{currentUser?.name}</b><small>{isDirector?'Директор':'Менеджер'}</small></span>{isDirector?<ShieldCheck/>:<UserRound/>}</div><button className="command-icon" onClick={onLogout} title="Выйти"><LogOut/></button></>:<div className="server-user"><span><b>{currentUser?.name||'Пользователь'}</b><small>{isDirector?'Директор':'Менеджер'}</small></span>{isDirector?<ShieldCheck/>:<UserRound/>}</div>}{!isDirector&&section!=='manager'&&<button className="command-new" onClick={onAddTender}><Clipboard/>Добавить тендер</button>}<button className="command-icon" title="Уведомления"><Bell/></button></div>
 </header>;
}
