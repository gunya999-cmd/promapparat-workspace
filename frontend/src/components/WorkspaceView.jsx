import React,{useState}from'react';
import{Files,History,Plus,Table2}from'lucide-react';
import{money,pct,uid}from'../domain/workspace.js';
import{recordActivity}from'../domain/activity.js';
import{Autopilot}from'./Autopilot.jsx';
import{DocumentsView}from'./DocumentsView.jsx';
import{TimelineView}from'./TimelineView.jsx';

export function WorkspaceView({work,data,setData,selectedId,setSelectedId}){
 const[draft,setDraft]=useState({group:'',name:'',qty:1,unit:'шт'});
 const[tab,setTab]=useState('positions');
 const selectTab=value=>{setSelectedId(null);setTab(value)};
 const addPosition=()=>{
  if(!draft.name.trim())return;
  const rowNo=Math.max(0,...data.positions.filter(position=>position.workId===work.id).map(position=>position.rowNo||0))+1;
  const position={id:uid(),workId:work.id,rowNo,...draft,status:'Не начато',salePrice:'',offers:[],batches:[]};
  setData(current=>recordActivity({...current,positions:[...current.positions,position]},{workId:work.id,positionId:position.id,type:'position',title:'Добавлена позиция',detail:`${position.name} · ${position.qty} ${position.unit}`,author:work.manager||'Менеджер'}));
  setDraft({group:'',name:'',qty:1,unit:'шт'});
 };
 const eventCount=(data.events||[]).filter(event=>event.workId===work.id).length;
 return <main className="workspace">
  <Autopilot work={work}/>
  <div className="work-heading"><div><span>{work.code} · {work.source} · {work.state}</span><h1>{work.customer} — {work.title}</h1><p>{work.objectName}</p></div><div className="finance"><b>{money(work.totals.profit)}</b><span>ожидаемая прибыль</span></div></div>
  <div className="workspace-tabs">
   <button className={tab==='positions'?'active':''} onClick={()=>selectTab('positions')}><Table2/>Позиции <span>{work.positions.length}</span></button>
   <button className={tab==='documents'?'active':''} onClick={()=>selectTab('documents')}><Files/>Документы <span>{(data.documents||[]).filter(document=>document.workId===work.id).length}</span></button>
   <button className={tab==='history'?'active':''} onClick={()=>selectTab('history')}><History/>История <span>{eventCount}</span></button>
  </div>
  {tab==='documents'&&<DocumentsView work={work} data={data} setData={setData}/>} 
  {tab==='history'&&<TimelineView work={work} data={data} setData={setData}/>} 
  {tab==='positions'&&<>
   <div className="add-row"><input placeholder="Группа" value={draft.group} onChange={event=>setDraft({...draft,group:event.target.value})}/><input className="grow" placeholder="Новая позиция" value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/><input type="number" value={draft.qty} onChange={event=>setDraft({...draft,qty:Number(event.target.value)})}/><input value={draft.unit} onChange={event=>setDraft({...draft,unit:event.target.value})}/><button className="primary" onClick={addPosition}><Plus size={16}/>Добавить</button></div>
   <div className="table-wrap"><table><thead><tr><th>№</th><th>Позиция</th><th>Кол-во</th><th>Предложения</th><th>Выбрано</th><th>Экономика</th><th>Срок</th><th>Следующий шаг</th><th>Партии</th></tr></thead><tbody>{work.positions.map(position=><tr key={position.id} className={`${position.warnings.length?'risk-row':''} ${selectedId===position.id?'selected-row':''}`} onClick={()=>setSelectedId(position.id)}>
    <td>{position.rowNo}</td><td><b>{position.name}</b><small>{position.group}</small></td><td>{position.qty} {position.unit}</td><td><span className="count-pill">{position.offers.length}</span>{position.offers.length>1&&<small>есть выбор</small>}</td><td>{position.selected?<><b>{position.selected.supplier?.name||'Поставщик'}</b><small>{money(position.selected.price)}</small></>:<span className="bad">не выбрано</span>}</td><td><b>{money(position.purchase)} → {money(position.sale)}</b><small className={position.margin!==null&&position.margin<15?'bad':'good'}>{pct(position.margin)} · {money(position.profit)}</small></td><td>{position.selected?<>{position.selected.productionDays||0}+{position.selected.deliveryDays||0} дн.<small>{position.selected.shipmentPlace}</small></>:'—'}</td><td><span className={`step ${position.nextStep==='Готово к КП'?'ok-step':''}`}>{position.nextStep}</span></td><td>{position.batches?.length||0}<small>{position.shippedQty}/{position.qty} отгр.</small></td>
   </tr>)}</tbody></table></div>
  </>}
 </main>;
}
