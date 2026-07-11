import React,{useMemo,useState}from'react';
import{calculateWork,uid,USER_ROLES}from'./domain/workspace.js';
import{recordActivity}from'./domain/activity.js';
import{useWorkspace}from'./store/useWorkspace.js';
import{WorkRail}from'./components/WorkRail.jsx';
import{WorkspaceView}from'./components/WorkspaceView.jsx';
import{PositionPanel}from'./components/PositionPanel.jsx';
import{NewWorkModal}from'./components/NewWorkModal.jsx';
import{SuppliersView}from'./components/SuppliersView.jsx';
import{DashboardView}from'./components/DashboardView.jsx';
import{FormulaDashboard}from'./components/FormulaDashboard.jsx';

export default function App(){
 const{data,setData}=useWorkspace();
 const[section,setSection]=useState('dashboard');
 const[activeId,setActiveId]=useState('w1');
 const[selectedId,setSelectedId]=useState(null);
 const[query,setQuery]=useState('');
 const[showNew,setShowNew]=useState(false);
 const currentUser=data.currentUser||{id:'u-admin',name:'Администратор',role:USER_ROLES.ADMIN};
 const isAdmin=currentUser.role===USER_ROLES.ADMIN;
 const visibleSection=section==='formulas'&&!isAdmin?'dashboard':section;
 const works=useMemo(()=>data.works.map(work=>calculateWork(work,data.positions,data.suppliers)),[data]);
 const filtered=works.filter(work=>`${work.customer} ${work.title} ${work.code}`.toLowerCase().includes(query.toLowerCase()));
 const active=works.find(work=>work.id===activeId)||works[0];
 const selected=active?.positions.find(position=>position.id===selectedId)||null;
 const createWork=form=>{
  const work={id:uid(),code:`PA-2026-${String(data.works.length+1).padStart(4,'0')}`,...form};
  setData(current=>recordActivity({...current,works:[work,...current.works]},{workId:work.id,type:'work',title:work.source==='Тендер'?'Создан тендер':'Создана заявка',detail:`${work.customer} — ${work.title} · источник: ${work.source}`,author:currentUser.name||work.manager||'Менеджер'}));
  setActiveId(work.id);setSection('works');setShowNew(false);
 };
 const openWork=id=>{setActiveId(id);setSelectedId(null);setSection('works')};
 const navigate=value=>{setSection(value==='formulas'&&!isAdmin?'dashboard':value);setSelectedId(null)};
 const wide=['suppliers','dashboard','formulas'].includes(visibleSection);
 return <div className={`app ${wide?'app-wide':''}`}>
  <WorkRail works={filtered} activeId={active?.id} onSelect={openWork} onNew={()=>setShowNew(true)} query={query} setQuery={setQuery} section={visibleSection} setSection={navigate} currentUser={currentUser} isAdmin={isAdmin}/>
  {visibleSection==='dashboard'&&<DashboardView works={works} onOpenWork={openWork}/>} 
  {visibleSection==='works'&&<><WorkspaceView work={active} data={data} setData={setData} selectedId={selectedId} setSelectedId={setSelectedId}/><PositionPanel position={selected} data={data} setData={setData} onClose={()=>setSelectedId(null)}/></>}
  {visibleSection==='suppliers'&&<SuppliersView data={data} setData={setData}/>} 
  {visibleSection==='formulas'&&isAdmin&&<FormulaDashboard data={data} setData={setData} currentUser={currentUser}/>} 
  {showNew&&<NewWorkModal onClose={()=>setShowNew(false)} onSave={createWork}/>} 
 </div>;
}