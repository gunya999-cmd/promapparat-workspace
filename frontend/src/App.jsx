import React,{useEffect,useMemo,useState}from'react';
import{calculateWork,USER_ROLES}from'./domain/workspace.js';
import{createWorkCommand}from'./domain/commands.js';
import{demoOpportunities,demoPlatforms}from'./domain/opportunities.js';
import{useWorkspace}from'./store/useWorkspace.js';
import{WorkRail}from'./components/WorkRail.jsx';
import{CommandBar}from'./components/CommandBar.jsx';
import{WorkContextPanel}from'./components/WorkContextPanel.jsx';
import{WorkspaceView}from'./components/WorkspaceView.jsx';
import{PositionPanel}from'./components/PositionPanel.jsx';
import{NewWorkModal}from'./components/NewWorkModal.jsx';
import{SuppliersView}from'./components/SuppliersView.jsx';
import{DashboardView}from'./components/DashboardView.jsx';
import{OpportunityEngine}from'./components/OpportunityEngine.jsx';
import{DirectorView}from'./components/DirectorView.jsx';
import{DirectorFinanceCenter}from'./components/DirectorFinanceCenter.jsx';
import{FormulaDashboard}from'./components/FormulaDashboard.jsx';
import{SystemSettings}from'./components/SystemSettings.jsx';

export default function App(){
 const workspace=useWorkspace(),{data,setData}=workspace;
 const[section,setSection]=useState('opportunities'),[activeId,setActiveId]=useState('w1'),[selectedId,setSelectedId]=useState(null),[query,setQuery]=useState(''),[showNew,setShowNew]=useState(false);
 const currentUser=data.currentUser||{id:'u-director',name:'Директор',role:'director'},isDirector=['director','admin','head'].includes(currentUser.role);
 useEffect(()=>{if(!data.meta?.opportunityInitialized&&!(data.platforms||[]).length&&!(data.opportunities||[]).length)setData(current=>({...current,platforms:demoPlatforms(),opportunities:demoOpportunities(),meta:{...current.meta,opportunityInitialized:true}}))},[data.meta?.opportunityInitialized,data.platforms?.length,data.opportunities?.length,setData]);
 const protectedSections=new Set(['director','finance','formulas','system']),visibleSection=protectedSections.has(section)&&!isDirector?'opportunities':section;
 const works=useMemo(()=>data.works.map(work=>calculateWork(work,data.positions,data.suppliers,data.settings,data.formulas)),[data]);
 const filtered=works.filter(work=>`${work.customer} ${work.title} ${work.code}`.toLowerCase().includes(query.toLowerCase()));
 const active=works.find(work=>work.id===activeId)||works[0],selected=active?.positions.find(position=>position.id===selectedId)||null;
 const createWork=form=>{try{const result=createWorkCommand(data,form,currentUser);setData(result.state);setActiveId(result.work.id);setSection('works');setShowNew(false)}catch(error){window.alert(error?.message||'Не удалось создать работу')}};
 const openWork=id=>{setActiveId(id);setSelectedId(null);setSection('works')};
 const navigate=value=>{setSection(protectedSections.has(value)&&!isDirector?'opportunities':value);setSelectedId(null)};
 const showContext=visibleSection==='works'&&active;
 return <div className={`v2-shell ${showContext?'with-context':''}`}>
  <WorkRail works={filtered} activeId={active?.id} onSelect={openWork} onNew={()=>setShowNew(true)} query={query} setQuery={setQuery} section={visibleSection} setSection={navigate} currentUser={currentUser} isAdmin={isDirector}/>
  <CommandBar works={works} currentUser={currentUser} onOpenWork={openWork} onNew={()=>setShowNew(true)} section={visibleSection}/>
  <div className="v2-content">
   {visibleSection==='opportunities'&&<OpportunityEngine data={data} setData={setData} currentUser={currentUser} onOpenWork={openWork}/>} 
   {visibleSection==='director'&&isDirector&&<DirectorView data={data} works={works} onOpenWork={openWork}/>} 
   {visibleSection==='finance'&&isDirector&&<DirectorFinanceCenter data={data} setData={setData} works={works} onOpenWork={openWork} currentUser={currentUser}/>} 
   {visibleSection==='dashboard'&&<DashboardView works={works} data={data} currentUser={currentUser} settings={data.settings} onOpenWork={openWork}/>} 
   {visibleSection==='works'&&active&&<WorkspaceView work={active} data={data} setData={setData} selectedId={selectedId} setSelectedId={setSelectedId} currentUser={currentUser}/>} 
   {visibleSection==='suppliers'&&<SuppliersView data={data} setData={setData} currentUser={currentUser}/>} 
   {visibleSection==='formulas'&&isDirector&&<FormulaDashboard data={data} setData={setData} currentUser={currentUser}/>} 
   {visibleSection==='system'&&isDirector&&<SystemSettings data={data} setData={setData} currentUser={currentUser} storageError={workspace.storageError} exportBackup={workspace.exportBackup} importBackup={workspace.importBackup} restoreBackup={workspace.restoreBackup} createSnapshot={workspace.createSnapshot} reset={workspace.reset}/>} 
  </div>
  {showContext&&(selected?<PositionPanel position={selected} data={data} setData={setData} onClose={()=>setSelectedId(null)} currentUser={currentUser}/>:<WorkContextPanel work={active} data={data} onSelectPosition={setSelectedId}/>) }
  {showNew&&<NewWorkModal onClose={()=>setShowNew(false)} onSave={createWork}/>} 
 </div>;
}