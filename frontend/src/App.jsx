import React,{useMemo,useState}from'react';
import{calculateWork,USER_ROLES}from'./domain/workspace.js';
import{createWorkCommand}from'./domain/commands.js';
import{useWorkspace}from'./store/useWorkspace.js';
import{WorkRail}from'./components/WorkRail.jsx';
import{WorkspaceView}from'./components/WorkspaceView.jsx';
import{PositionPanel}from'./components/PositionPanel.jsx';
import{NewWorkModal}from'./components/NewWorkModal.jsx';
import{SuppliersView}from'./components/SuppliersView.jsx';
import{DashboardView}from'./components/DashboardView.jsx';
import{FormulaDashboard}from'./components/FormulaDashboard.jsx';
import{SystemSettings}from'./components/SystemSettings.jsx';

export default function App(){
 const workspace=useWorkspace(),{data,setData}=workspace;
 const[section,setSection]=useState('dashboard'),[activeId,setActiveId]=useState('w1'),[selectedId,setSelectedId]=useState(null),[query,setQuery]=useState(''),[showNew,setShowNew]=useState(false);
 const currentUser=data.currentUser||{id:'u-admin',name:'Администратор',role:USER_ROLES.ADMIN},isAdmin=currentUser.role===USER_ROLES.ADMIN;
 const protectedSections=new Set(['formulas','system']),visibleSection=protectedSections.has(section)&&!isAdmin?'dashboard':section;
 const works=useMemo(()=>data.works.map(work=>calculateWork(work,data.positions,data.suppliers,data.settings)),[data]);
 const filtered=works.filter(work=>`${work.customer} ${work.title} ${work.code}`.toLowerCase().includes(query.toLowerCase()));
 const active=works.find(work=>work.id===activeId)||works[0],selected=active?.positions.find(position=>position.id===selectedId)||null;
 const createWork=form=>{try{const result=createWorkCommand(data,form,currentUser);setData(result.state);setActiveId(result.work.id);setSection('works');setShowNew(false)}catch(error){window.alert(error?.message||'Не удалось создать работу')}};
 const openWork=id=>{setActiveId(id);setSelectedId(null);setSection('works')};
 const navigate=value=>{setSection(protectedSections.has(value)&&!isAdmin?'dashboard':value);setSelectedId(null)};
 const wide=['suppliers','dashboard','formulas','system'].includes(visibleSection);
 return <div className={`app ${wide?'app-wide':''}`}>
  <WorkRail works={filtered} activeId={active?.id} onSelect={openWork} onNew={()=>setShowNew(true)} query={query} setQuery={setQuery} section={visibleSection} setSection={navigate} currentUser={currentUser} isAdmin={isAdmin}/>
  {visibleSection==='dashboard'&&<DashboardView works={works} onOpenWork={openWork}/>} 
  {visibleSection==='works'&&active&&<><WorkspaceView work={active} data={data} setData={setData} selectedId={selectedId} setSelectedId={setSelectedId} currentUser={currentUser}/><PositionPanel position={selected} data={data} setData={setData} onClose={()=>setSelectedId(null)} currentUser={currentUser}/></>}
  {visibleSection==='suppliers'&&<SuppliersView data={data} setData={setData} currentUser={currentUser}/>} 
  {visibleSection==='formulas'&&isAdmin&&<FormulaDashboard data={data} setData={setData} currentUser={currentUser}/>} 
  {visibleSection==='system'&&isAdmin&&<SystemSettings data={data} setData={setData} storageError={workspace.storageError} exportBackup={workspace.exportBackup} importBackup={workspace.importBackup} restoreBackup={workspace.restoreBackup} createSnapshot={workspace.createSnapshot} reset={workspace.reset}/>} 
  {showNew&&<NewWorkModal onClose={()=>setShowNew(false)} onSave={createWork}/>} 
 </div>;
}
