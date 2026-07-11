import React from'react';
import{Phone,Plus,Trash2,X}from'lucide-react';
import{money,pct,uid}from'../domain/workspace.js';
import{recordActivity}from'../domain/activity.js';

export function PositionPanel({position,data,setData,onClose}){
 if(!position)return <aside className="assistant"><section><h3>Выберите позицию</h3><p>Справа появятся предложения поставщиков и партии отгрузки.</p></section></aside>;
 const raw=data.positions.find(item=>item.id===position.id);
 const work=data.works.find(item=>item.id===raw.workId);
 const author=work?.manager||'Менеджер';
 const activity=event=>({workId:raw.workId,positionId:raw.id,author,...event});
 const patch=(change,event)=>setData(current=>{
  const next={...current,positions:current.positions.map(item=>item.id===raw.id?{...item,...change}:item)};
  return event?recordActivity(next,activity(event)):next;
 });
 const updateOffer=(id,change,event)=>setData(current=>{
  const currentPosition=current.positions.find(item=>item.id===raw.id);
  const offers=(currentPosition.offers||[]).map(offer=>offer.id===id?{...offer,...change}:change.selected?{...offer,selected:false}:offer);
  const next={...current,positions:current.positions.map(item=>item.id===raw.id?{...item,offers}:item)};
  return event?recordActivity(next,activity(event)):next;
 });
 const updateBatch=(id,change,event)=>setData(current=>{
  const currentPosition=current.positions.find(item=>item.id===raw.id);
  const batches=(currentPosition.batches||[]).map(batch=>batch.id===id?{...batch,...change}:batch);
  const next={...current,positions:current.positions.map(item=>item.id===raw.id?{...item,batches}:item)};
  return event?recordActivity(next,activity(event)):next;
 });
 const addOffer=()=>{
  const offer={id:uid(),supplierId:'',price:'',productionDays:'',deliveryDays:'',shipmentPlace:'',paymentTerms:'',hasTkp:false,selected:!(raw.offers||[]).length};
  patch({offers:[...(raw.offers||[]),offer]},{type:'offer',title:'Добавлено предложение поставщика',detail:`${position.name} · вариант ${(raw.offers||[]).length+1}`});
 };
 const deleteOffer=offer=>patch({offers:(raw.offers||[]).filter(item=>item.id!==offer.id)},{type:'offer',title:'Удалено предложение поставщика',detail:offer.supplierId?(data.suppliers.find(item=>item.id===offer.supplierId)?.name||'Поставщик'):'Поставщик не был выбран'});
 const addBatch=()=>{
  const batch={id:uid(),qty:1,readyDate:'',shipDate:'',place:position.selected?.shipmentPlace||'',status:'Запланировано'};
  patch({batches:[...(raw.batches||[]),batch]},{type:'shipment',title:'Создана партия',detail:`${position.name} · 1 ${position.unit}`});
 };
 const deleteBatch=batch=>patch({batches:(raw.batches||[]).filter(item=>item.id!==batch.id)},{type:'shipment',title:'Удалена партия',detail:`${batch.qty||0} ${position.unit} · ${batch.status}`});
 return <aside className="assistant">
  <div className="panel-head"><div><span>Позиция №{position.rowNo}</span><h2>{position.name}</h2></div><button onClick={onClose}><X/></button></div>
  <div className="scoreline"><div><b>{position.progress}%</b><span>готовность</span></div><div><b>{pct(position.margin)}</b><span>маржа</span></div></div>
  <section><div className="section-head"><h3>Предложения поставщиков</h3><button onClick={addOffer}><Plus/>Добавить</button></div>{(raw.offers||[]).map((offer,index)=>{const supplier=data.suppliers.find(item=>item.id===offer.supplierId);return <div className={`offer-card ${offer.selected?'chosen':''}`} key={offer.id}>
   <div className="offer-top"><b>Вариант {index+1}</b><label><input type="radio" checked={!!offer.selected} onChange={()=>updateOffer(offer.id,{selected:true},{type:'offer',title:'Выбрано предложение поставщика',detail:`${supplier?.name||'Поставщик не указан'} · ${money(offer.price)}`,supplierId:offer.supplierId||null})}/> выбрать</label><button onClick={()=>deleteOffer(offer)}><Trash2/></button></div>
   <select value={offer.supplierId||''} onChange={event=>{const supplierId=event.target.value;const name=data.suppliers.find(item=>item.id===supplierId)?.name||'Поставщик не указан';updateOffer(offer.id,{supplierId},{type:'offer',title:'Назначен поставщик',detail:name,supplierId:supplierId||null})}}><option value="">Поставщик</option>{data.suppliers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
   <div className="grid3"><label>Цена<input type="number" value={offer.price||''} onChange={event=>updateOffer(offer.id,{price:event.target.value})} onBlur={()=>setData(current=>recordActivity(current,activity({type:'price',title:'Изменена закупочная цена',detail:`${supplier?.name||'Поставщик'} · ${money(offer.price)}`,supplierId:offer.supplierId||null})))}/></label><label>Изг., дн.<input type="number" value={offer.productionDays||''} onChange={event=>updateOffer(offer.id,{productionDays:event.target.value})}/></label><label>Доставка<input type="number" value={offer.deliveryDays||''} onChange={event=>updateOffer(offer.id,{deliveryDays:event.target.value})}/></label></div>
   <input placeholder="Место отгрузки" value={offer.shipmentPlace||''} onChange={event=>updateOffer(offer.id,{shipmentPlace:event.target.value})}/><input placeholder="Условия оплаты" value={offer.paymentTerms||''} onChange={event=>updateOffer(offer.id,{paymentTerms:event.target.value})}/><label className="check"><input type="checkbox" checked={!!offer.hasTkp} onChange={event=>updateOffer(offer.id,{hasTkp:event.target.checked},{type:'document',title:event.target.checked?'Получено ТКП':'Снята отметка о ТКП',detail:supplier?.name||'Поставщик не указан',supplierId:offer.supplierId||null})}/> ТКП получено</label>{supplier&&<small><Phone/> {supplier.contact} · {supplier.phone}</small>}
  </div>})}</section>
  <section><label className="sale-label">Цена продажи<input type="number" value={raw.salePrice||''} onChange={event=>patch({salePrice:event.target.value})} onBlur={()=>setData(current=>recordActivity(current,activity({type:'price',title:'Изменена цена продажи',detail:`${money(raw.salePrice)} за единицу`})))}/></label></section>
  <section><div className="section-head"><h3>Готовность и отгрузки</h3><button onClick={addBatch}><Plus/>Партия</button></div>{(raw.batches||[]).map((batch,index)=><div className="batch-card" key={batch.id}><div className="batch-top"><b>Партия {index+1}</b><button onClick={()=>deleteBatch(batch)}><Trash2/></button></div><div className="grid2"><label>Количество<input type="number" value={batch.qty||''} onChange={event=>updateBatch(batch.id,{qty:event.target.value})}/></label><label>Статус<select value={batch.status} onChange={event=>updateBatch(batch.id,{status:event.target.value},{type:'shipment',title:'Изменен статус партии',detail:`${batch.qty||0} ${position.unit} · ${batch.status} → ${event.target.value}`})}><option>Запланировано</option><option>В производстве</option><option>Готово</option><option>Отгружено</option></select></label><label>Готовность<input type="date" value={batch.readyDate||''} onChange={event=>updateBatch(batch.id,{readyDate:event.target.value})}/></label><label>Отгрузка<input type="date" value={batch.shipDate||''} onChange={event=>updateBatch(batch.id,{shipDate:event.target.value})}/></label></div><input placeholder="Место отгрузки" value={batch.place||''} onChange={event=>updateBatch(batch.id,{place:event.target.value})}/></div>)}</section>
 </aside>;
}
