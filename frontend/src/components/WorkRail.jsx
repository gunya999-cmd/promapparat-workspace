import React from'react';
import{BriefcaseBusiness,Building2,Plus,Search,Zap}from'lucide-react';
import{daysLeft}from'../domain/workspace.js';

export function WorkRail({works,activeId,onSelect,onNew,query,setQuery,section,setSection}){
 return <aside className="rail">
  <div className="brand"><div className="logo">PA</div><div><b>PromApparat</b><span>Workspace</span></div></div>
  <div className="rail-nav"><button className={section==='works'?'active':''} onClick={()=>setSection('works')}><BriefcaseBusiness/>Работы</button><button className={section==='suppliers'?'active':''} onClick={()=>setSection('suppliers')}><Building2/>Поставщики</button></div>
  {section==='works'&&<><button className="primary full" onClick={onNew}><Plus size={16}/> Новая работа</button><label className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск"/></label><div className="work-list">{works.map(work=><button key={work.id} className={`work-card ${activeId===work.id?'active':''}`} onClick={()=>onSelect(work.id)}><div className="work-top"><span>{work.code}</span><em>{daysLeft(work.deadline)<=1?'сегодня':`${daysLeft(work.deadline)} дн.`}</em></div><strong>{work.customer}</strong><small>{work.title}</small><div className="progress"><i style={{width:`${work.progress}%`}}/></div><div className="work-meta"><span>{work.positions.length} поз.</span><span>{work.progress}%</span></div><p><Zap size={13}/>{work.nextAction}</p></button>)}</div></>}
  {section==='suppliers'&&<div className="rail-section-note"><Building2/><b>База поставщиков</b><span>Карточки, история ТКП и надежность.</span></div>}
 </aside>
}
