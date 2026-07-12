import React from'react';
import{BriefcaseBusiness,Building2,Calculator,LayoutDashboard,Plus,Search,Settings,ShieldCheck,Zap}from'lucide-react';
import{daysLeft}from'../domain/workspace.js';

const deadlineLabel=value=>{const days=daysLeft(value);if(days<0)return`проср. ${Math.abs(days)} дн.`;if(days===0)return'сегодня';if(days===1)return'завтра';return days===999?'без срока':`${days} дн.`};

export function WorkRail({works,activeId,onSelect,onNew,query,setQuery,section,setSection,currentUser,isAdmin}){
 const isHead=currentUser?.role==='head',roleLabel=isAdmin?'Администратор':isHead?'Руководитель отдела':'Тендерный менеджер';
 return <aside className="rail">
  <div className="brand"><div className="logo">PA</div><div><b>PromApparat</b><span>Workspace v2</span></div></div>
  <div className="rail-nav"><button className={section==='dashboard'?'active':''} onClick={()=>setSection('dashboard')}><LayoutDashboard/>{isHead||isAdmin?'Центр управления':'Рабочий день'}</button><button className={section==='works'?'active':''} onClick={()=>setSection('works')}><BriefcaseBusiness/>{isHead||isAdmin?'Поток работ':'Мои тендеры'}</button><button className={section==='suppliers'?'active':''} onClick={()=>setSection('suppliers')}><Building2/>Поставщики</button>{isAdmin&&<><button className={section==='formulas'?'active':''} onClick={()=>setSection('formulas')}><Calculator/>Формулы <ShieldCheck size={13}/></button><button className={section==='system'?'active':''} onClick={()=>setSection('system')}><Settings/>Администрирование <ShieldCheck size={13}/></button></>}</div>
  {section==='works'&&<><button className="primary full" onClick={onNew}><Plus size={16}/> Новая работа</button><label className="search"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск работ"/></label><div className="work-list">{works.map(work=><button key={work.id} className={`work-card ${activeId===work.id?'active':''}`} onClick={()=>onSelect(work.id)}><div className="work-top"><span>{work.code}</span><em>{deadlineLabel(work.deadline)}</em></div><strong>{work.customer}</strong><small>{work.title}</small><div className="progress"><i style={{width:`${work.progress}%`}}/></div><div className="work-meta"><span>{work.positions.length} поз.</span><span>{work.progress}%</span></div><p><Zap size={13}/>{work.nextAction}</p></button>)}</div></>}
  {section==='dashboard'&&<div className="rail-section-note"><LayoutDashboard/><b>{isHead||isAdmin?'Диспетчерская отдела':'Мой рабочий день'}</b><span>Приоритеты, риски, сроки и следующее действие.</span></div>}
  {section==='suppliers'&&<div className="rail-section-note"><Building2/><b>База поставщиков</b><span>Карточки, история ТКП и надежность.</span></div>}
  {section==='formulas'&&isAdmin&&<div className="rail-section-note"><ShieldCheck/><b>Только для администратора</b><span>Финансовые правила и версии расчетов.</span></div>}
  {section==='system'&&isAdmin&&<div className="rail-section-note"><Settings/><b>Администрирование</b><span>Пользователи, backup, настройки и безопасность.</span></div>}
  <div className="rail-user"><div className="rail-user-avatar">{String(currentUser?.name||'П').slice(0,1).toUpperCase()}</div><div><b>{currentUser?.name||'Пользователь'}</b><span>{roleLabel}</span></div></div>
 </aside>;
}
