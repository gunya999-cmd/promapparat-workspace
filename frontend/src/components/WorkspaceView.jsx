import React,{useState}from'react';
import{Files,Plus,Table2}from'lucide-react';
import{money,pct,uid}from'../domain/workspace.js';
import{Autopilot}from'./Autopilot.jsx';
import{DocumentsView}from'./DocumentsView.jsx';

export function WorkspaceView({work,data,setData,selectedId,setSelectedId}){
 const[draft,setDraft]=useState({group:'',name:'',qty:1,unit:'шт'});
 const[tab,setTab]=useState('positions');
 const addPosition=()=>{
  if(!draft.name.trim())return;
  const rowNo=Math.max(0,...data.positions.filter(p=>p.workId===work.id).map(p=>p.rowNo||0))+1;
  setData(current=>({...current,positions:[...current.positions,{id:uid(),workId:work.id,rowNo,...draft,status:'Не начато',salePrice:'',offers:[],batches:[]}]}));
  setDraft({group:'',name:'',qty:1,unit:'шт'});
 };
 return <main className="workspace">
  <Autopilot work={work}/>
  <div className="work-heading"><div><span>{work.code} · {work.source} · {work.state}</span><h1>{work.customer} — {work.title}</h1><p>{work.objectName}</p></div><div className="finance"><b>{money(work.totals.profit)}</b><span>ожидаемая прибыль</span></div></div>
  <div className="workspace-tabs"><button className={tab==='positions'?'active':''} onClick={()=>tab!=='positions'&&setSelectedId(null)||setTab('positions')}><Table2/>Позиции <span>{work.positions.length}</span></button><button className={tab==='documents'?'active':''} onClick={()=>{setSelectedId(null);setTab('documents')}}><Files/>Документы <span>{(data.documents||[]).filter(doc=>doc.workId===work.id).length}</span></button></div>
  {tab==='documents'?<DocumentsView work={work} data={data} setData={setData}/>:<>
   <div className="add-row"><input placeholder="Группа" value={draft.group} onChange={e=>setDraft({...draft,group:e.target.value})}/><input className="grow" placeholder="Новая позиция" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input type="number" value={draft.qty} onChange={e=>setDraft({...draft,qty:Number(e.target.value)})}/><input value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value})}/><button className="primary" onClick={addPosition}><Plus size={16}/>Добавить</button></div>
   <div className="table-wrap"><table><thead><tr><th>№</th><th>Позиция</th><th>Кол-во</th><th>Предложения</th><th>Выбрано</th><th>Экономика</th><th>Срок</th><th>Следующий шаг</th><th>Партии</th></tr></thead><tbody>{work.positions.map(position=><tr key={position.id} className={`${position.warnings.length?'risk-row':''} ${selectedId===position.id?'selected-row':''}`} onClick={()=>setSelectedId(position.id)}>
    <td>{position.rowNo}</td><td><b>{position.name}</b><small>{position.group}</small></td><td>{position.qty} {position.unit}</td><td><span className="count-pill">{position.offers.length}</span>{position.offers.length>1&&<small>есть выбор</small>}</td><td>{position.selected?<><b>{position.selected.supplier?.name||'Поставщик'}</b><small>{money(position.selected.price)}</small></>:<span className="bad">не выбрано</span>}</td><td><b>{money(position.purchase)} → {money(position.sale)}</b><small className={position.margin!==null&&position.margin<15?'bad':'good'}>{pct(position.margin)} · {money(position.profit)}</small></td><td>{position.selected?<>{position.selected.productionDays||0}+{position.selected.deliveryDays||0} дн.<small>{position.selected.shipmentPlace}</small></>:'—'}</td><td><span className={`step ${position.nextStep==='Готово к КП'?'ok-step':''}`}>{position.nextStep}</span></td><td>{position.batches?.length||0}<small>{position.shippedQty}/{position.qty} отгр.</small></td>
   </tr>)}</tbody></table></div>
  </>}
 </main>
}
