import React,{useMemo,useState}from'react';
import{calculateWork,uid}from'./domain/workspace.js';
import{useWorkspace}from'./store/useWorkspace.js';
import{WorkRail}from'./components/WorkRail.jsx';
import{WorkspaceView}from'./components/WorkspaceView.jsx';
import{PositionPanel}from'./components/PositionPanel.jsx';
import{NewWorkModal}from'./components/NewWorkModal.jsx';

export default function App(){
 const{data,setData}=useWorkspace();
 const[activeId,setActiveId]=useState('w1');
 const[selectedId,setSelectedId]=useState(null);
 const[query,setQuery]=useState('');
 const[showNew,setShowNew]=useState(false);
 const works=useMemo(()=>data.works.map(work=>calculateWork(work,data.positions,data.suppliers)),[data]);
 const filtered=works.filter(work=>`${work.customer} ${work.title} ${work.code}`.toLowerCase().includes(query.toLowerCase()));
 const active=works.find(work=>work.id===activeId)||works[0];
 const selected=active?.positions.find(position=>position.id===selectedId)||null;
 const createWork=form=>{
  const work={id:uid(),code:`PA-2026-${String(data.works.length+1).padStart(4,'0')}`,...form};
  setData(current=>({...current,works:[work,...current.works]}));
  setActiveId(work.id);
  setShowNew(false);
 };
 return <div className="app">
  <WorkRail works={filtered} activeId={active?.id} onSelect={id=>{setActiveId(id);setSelectedId(null)}} onNew={()=>setShowNew(true)} query={query} setQuery={setQuery}/>
  {active&&<WorkspaceView work={active} data={data} setData={setData} selectedId={selectedId} setSelectedId={setSelectedId}/>} 
  <PositionPanel position={selected} data={data} setData={setData} onClose={()=>setSelectedId(null)}/>
  {showNew&&<NewWorkModal onClose={()=>setShowNew(false)} onSave={createWork}/>} 
 </div>
}
