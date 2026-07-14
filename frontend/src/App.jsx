import React,{useEffect,useMemo,useRef,useState}from'react';
import{calculateWork}from'./domain/workspace.js';
import{createWorkCommand}from'./domain/commands.js';
import{demoOpportunities,demoPlatforms}from'./domain/opportunities.js';
import{userForRole}from'./domain/users.js';
import{useWorkspace}from'./store/useWorkspace.js';
import{WorkRail}from'./components/WorkRail.jsx';
import{CommandBar}from'./components/CommandBar.jsx';
import{WorkContextPanel}from'./components/WorkContextPanel.jsx';
import{WorkspaceView}from'./components/WorkspaceView.jsx';
import{PositionPanel}from'./components/PositionPanel.jsx';
import{NewWorkModal}from'./components/NewWorkModal.jsx';
import{QuickTenderCapture}from'./components/QuickTenderCapture.jsx';
import{SuppliersView}from'./components/SuppliersView.jsx';
import{DashboardView}from'./components/DashboardView.jsx';
import{OpportunityEngine}from'./components/OpportunityEngine.jsx';
import{R4ManagerWorkspace}from'./components/R4ManagerWorkspace.jsx';
import{DirectorView}from'./components/DirectorView.jsx';
import{DirectorFinanceCenter}from'./components/DirectorFinanceCenter.jsx';
import{FormulaDashboard}from'./components/FormulaDashboard.jsx';
import{SystemSettings}from'./components/SystemSettings.jsx';

export default function App(){
 const workspace=useWorkspace(),{data,setData}=workspace,captureHandled=useRef(false);
 const currentUser=data.currentUser||{id:'u-director',name:'Директор',role:'director'},isDirector=currentUser.role==='director';
 const[section,setSection]=useState(isDirector?'director':'manager'),[activeId,setActiveId]=useState('w1'),[selectedId,setSelectedId]=useState(null),[query,setQuery]=useState(''),[showNew,setShowNew]=useState(false),[showTenderCapture,setShowTenderCapture]=useState(false),[captureInput,setCaptureInput]=useState(''),[focusOpportunityId,setFocusOpportunityId]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{setSection(isDirector?'director':'manager');setSelectedId(null);setShowNew(false);setShowTenderCapture(false)},[currentUser.id,currentUser.role,isDirector]);
 useEffect(()=>{if(!data.meta?.opportunityInitialized&&!(data.platforms||[]).length&&!(data.opportunities||[]).length)setData(current=>({...current,platforms:demoPlatforms(),opportunities:demoOpportunities(),meta:{...current.meta,opportunityInitialized:true}}))},[data.meta?.opportunityInitialized,data.platforms?.length,data.opportunities?.length,setData]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),2600);return()=>clearTimeout(timer)},[notice]);
 useEffect(()=>{const hotkey=event=>{if(isDirector)return;if(event.ctrlKey&&event.altKey&&event.key.toLowerCase()==='t'){event.preventDefault();setCaptureInput('');setShowTenderCapture(true)}};window.addEventListener('keydown',hotkey);return()=>window.removeEventListener('keydown',hotkey)},[isDirector]);
 useEffect(()=>{if(captureHandled.current)return;const params=new URLSearchParams(window.location.search);if(params.get('capture')!=='1')return;captureHandled.current=true;const text=[params.get('title'),params.get('text'),params.get('url')].filter(Boolean).join('\n');setCaptureInput(text);const manager=userForRole(data,'manager');if(isDirector&&manager)setData(current=>({...current,currentUser:manager,meta:{...current.meta,updatedAt:new Date().toISOString()}}));params.delete('capture');params.delete('title');params.delete('text');params.delete('url');const next=`${window.location.pathname}${params.toString()?`?${params}`:''}${window.location.hash}`;window.history.replaceState({},'',next)},[data,isDirector,setData]);
 useEffect(()=>{if(captureInput&&!isDirector)setShowTenderCapture(true)},[captureInput,isDirector]);
 const protectedSections=new Set(['director','finance','formulas','system']);
 const visibleSection=!isDirector&&protectedSections.has(section)?'manager':isDirector&&section==='manager'?'director':section;
 const works=useMemo(()=>data.works.map(work=>calculateWork(work,data.positions,data.suppliers,data.settings,data.formulas)),[data]);
 const roleWorks=isDirector?works:works.filter(work=>work.manager===currentUser.name);
 const filtered=roleWorks.filter(work=>`${work.customer} ${work.title} ${work.code}`.toLowerCase().includes(query.toLowerCase()));
 const active=roleWorks.find(work=>work.id===activeId)||roleWorks[0]||null,selected=active?.positions.find(position=>position.id===selectedId)||null;
 const createWork=form=>{if(isDirector)return;try{const result=createWorkCommand(data,form,currentUser);setData(result.state);setActiveId(result.work.id);setSection('works');setShowNew(false);setNotice('Сделка создана')}catch(error){setNotice(error?.message||'Не удалось создать сделку')}};
 const openWork=id=>{setActiveId(id);setSelectedId(null);setSection('works')};
 const navigate=value=>{if(!isDirector&&protectedSections.has(value))value='manager';if(isDirector&&value==='manager')value='director';setSection(value);setSelectedId(null)};
 const switchRole=role=>{const user=userForRole(data,role);if(!user)return;setData(current=>({...current,currentUser:user,meta:{...current.meta,updatedAt:new Date().toISOString()}}));setNotice(role==='manager'?`Открыт рабочий стол: ${user.name}`:'Открыта сводка компании')};
 const openTenderCapture=()=>{if(isDirector)return;setCaptureInput('');setShowTenderCapture(true)};
 const closeTenderCapture=()=>{setShowTenderCapture(false);setCaptureInput('')};
 const tenderSaved=opportunity=>{closeTenderCapture();setFocusOpportunityId(opportunity?.id||'');setSection('opportunities');setSelectedId(null);setNotice(opportunity?.captureIncomplete?'Тендер сохранён. Дополните карточку перед оценкой.':'Тендер добавлен в очередь «Новые»')};
 const showContext=visibleSection==='works'&&active;
 return <div className={`v2-shell ${showContext?'with-context':''}`}>
  <WorkRail works={filtered} activeId={active?.id} onSelect={openWork} onNew={()=>!isDirector&&setShowNew(true)} query={query} setQuery={setQuery} section={visibleSection} setSection={navigate} currentUser={currentUser} isAdmin={isDirector}/>
  <CommandBar works={roleWorks} users={data.users||[]} currentUser={currentUser} onOpenWork={openWork} onAddTender={openTenderCapture} onSwitchRole={switchRole} section={visibleSection}/>
  <div className="v2-content">
   {visibleSection==='manager'&&!isDirector&&<R4ManagerWorkspace data={data} setData={setData} works={roleWorks} currentUser={currentUser} onOpenWork={openWork} onOpenOpportunities={()=>navigate('opportunities')} onNew={()=>setShowNew(true)}/>} 
   {visibleSection==='opportunities'&&<OpportunityEngine data={data} setData={setData} currentUser={currentUser} onOpenWork={openWork} onAddTender={openTenderCapture} focusOpportunityId={focusOpportunityId}/>} 
   {visibleSection==='director'&&isDirector&&<DirectorView data={data} works={works} onOpenWork={openWork}/>} 
   {visibleSection==='finance'&&isDirector&&<DirectorFinanceCenter data={data} setData={setData} works={works} onOpenWork={openWork} currentUser={currentUser}/>} 
   {visibleSection==='dashboard'&&!isDirector&&<DashboardView works={roleWorks} data={data} currentUser={currentUser} settings={data.settings} onOpenWork={openWork}/>} 
   {visibleSection==='works'&&active&&<WorkspaceView work={active} data={data} setData={setData} selectedId={selectedId} setSelectedId={setSelectedId} currentUser={currentUser}/>} 
   {visibleSection==='suppliers'&&<SuppliersView data={data} setData={setData} currentUser={currentUser}/>} 
   {visibleSection==='formulas'&&isDirector&&<FormulaDashboard data={data} setData={setData} currentUser={currentUser}/>} 
   {visibleSection==='system'&&isDirector&&<SystemSettings data={data} setData={setData} currentUser={currentUser} storageError={workspace.storageError} exportBackup={workspace.exportBackup} importBackup={workspace.importBackup} restoreBackup={workspace.restoreBackup} createSnapshot={workspace.createSnapshot} reset={workspace.reset}/>} 
  </div>
  {showContext&&(selected&&!isDirector?<PositionPanel position={selected} data={data} setData={setData} onClose={()=>setSelectedId(null)} currentUser={currentUser}/>:<WorkContextPanel work={active} data={data} readOnly={isDirector} onSelectPosition={setSelectedId}/>)}
  {showNew&&!isDirector&&<NewWorkModal currentUser={currentUser} onClose={()=>setShowNew(false)} onSave={createWork}/>} 
  {showTenderCapture&&!isDirector&&<QuickTenderCapture data={data} setData={setData} currentUser={currentUser} initialCapture={captureInput} onClose={closeTenderCapture} onSaved={tenderSaved}/>} 
  {notice&&<div className="app-toast" role="status">{notice}</div>}
 </div>;
}