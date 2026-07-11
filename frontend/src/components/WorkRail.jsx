import React from'react';
import{BriefcaseBusiness,Building2,Calculator,LayoutDashboard,Plus,Search,Zap}from'lucide-react';
import{daysLeft}from'../domain/workspace.js';

export function WorkRail({works,activeId,onSelect,onNew,query,setQuery,section,setSection}){
 return <aside className="rail">
  <div className="brand"><div className="logo">PA</div><div><b>PromApparat</b><span>Workspace</span></div></div>
  <div className="rail-nav"><button className={section==='dashboard'?'active':''} onClick={()=>setSection('dashboard')}><LayoutDashboard/>Центр управления</button><button className={section==='works'?'active':''} onClick={()=>setSection('works')}><BriefcaseBusiness/>Работы</button><button className={section==='suppliers'?'active':''} onClick={()=>setSection('suppliers')}><Building2/>Поставщики</button><button className={section==='formulas'?'active':''} onClick={()=>setSection('formulas')}><Calculator/>Формулы</button></div>
  {section==='works'&&<><button className="primary full" onClick={onNew}><Plus size={16}/> Новая работа</button><label className="search"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск"/></label><div className="work-list">{works.map(work=><button key={work.id} className={`work-card ${activeId===work.id?'active':''}`} onClick={()=>onSelect(work.id)}><div className="work-top"><span>{work.code}</span><em>{daysLeft(work.deadline)<=1?'сегодня':`${daysLeft(work.deadline)} дн.`}</em></div><strong>{work.customer}</strong><small>{work.title}</small><div className="progress"><i style={{width:`${work.progress}%`}}/></div><div className="work-meta"><span>{work.positions.length} поз.</span><span>{work.progress}%</span></div><p><Zap size={13}/>{work.nextAction}</p></button>)}</div></>}
  {section==='dashboard'&&<div className="rail-section-note"><LayoutDashboard/><b>Рабочий день</b><span>Приоритеты, сроки и следующая задача.</span></div>}
  {section==='suppliers'&&<div className="rail-section-note"><Building2/><b>База поставщиков</b><span>Карточки, история ТКП и надежность.</span></div>}
  {section==='formulas'&&<div className="rail-section-note"><Calculator/><b>Финансовые правила</b><span>Маржа, премии, кредиты, налоги и прибыль.</span></div>}
 </aside>;
}
