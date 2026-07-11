import React from'react';
import{Phone,Plus,Trash2,X}from'lucide-react';
import{pct,uid}from'../domain/workspace.js';

export function PositionPanel({position,data,setData,onClose}){
 if(!position)return <aside className="assistant"><section><h3>Выберите позицию</h3><p>Справа появятся предложения поставщиков и партии отгрузки.</p></section></aside>;
 const raw=data.positions.find(item=>item.id===position.id);
 const patch=change=>setData(current=>({...current,positions:current.positions.map(item=>item.id===position.id?{...item,...change}:item)}));
 const addOffer=()=>patch({offers:[...(raw.offers||[]),{id:uid(),supplierId:'',price:'',productionDays:'',deliveryDays:'',shipmentPlace:'',paymentTerms:'',hasTkp:false,selected:!(raw.offers||[]).length}]});
 const patchOffer=(id,change)=>patch({offers:(raw.offers||[]).map(offer=>offer.id===id?{...offer,...change}:change.selected?{...offer,selected:false}:offer)});
 const deleteOffer=id=>patch({offers:(raw.offers||[]).filter(offer=>offer.id!==id)});
 const addBatch=()=>patch({batches:[...(raw.batches||[]),{id:uid(),qty:1,readyDate:'',shipDate:'',place:position.selected?.shipmentPlace||'',status:'Запланировано'}]});
 const patchBatch=(id,change)=>patch({batches:(raw.batches||[]).map(batch=>batch.id===id?{...batch,...change}:batch)});
 const deleteBatch=id=>patch({batches:(raw.batches||[]).filter(batch=>batch.id!==id)});
 return <aside className="assistant">
  <div className="panel-head"><div><span>Позиция №{position.rowNo}</span><h2>{position.name}</h2></div><button onClick={onClose}><X/></button></div>
  <div className="scoreline"><div><b>{position.progress}%</b><span>готовность</span></div><div><b>{pct(position.margin)}</b><span>маржа</span></div></div>
  <section><div className="section-head"><h3>Предложения поставщиков</h3><button onClick={addOffer}><Plus/>Добавить</button></div>{(raw.offers||[]).map((offer,index)=>{const supplier=data.suppliers.find(item=>item.id===offer.supplierId);return <div className={`offer-card ${offer.selected?'chosen':''}`} key={offer.id}>
   <div className="offer-top"><b>Вариант {index+1}</b><label><input type="radio" checked={!!offer.selected} onChange={()=>patchOffer(offer.id,{selected:true})}/> выбрать</label><button onClick={()=>deleteOffer(offer.id)}><Trash2/></button></div>
   <select value={offer.supplierId||''} onChange={e=>patchOffer(offer.id,{supplierId:e.target.value})}><option value="">Поставщик</option>{data.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
   <div className="grid3"><label>Цена<input type="number" value={offer.price||''} onChange={e=>patchOffer(offer.id,{price:e.target.value})}/></label><label>Изг., дн.<input type="number" value={offer.productionDays||''} onChange={e=>patchOffer(offer.id,{productionDays:e.target.value})}/></label><label>Доставка<input type="number" value={offer.deliveryDays||''} onChange={e=>patchOffer(offer.id,{deliveryDays:e.target.value})}/></label></div>
   <input placeholder="Место отгрузки" value={offer.shipmentPlace||''} onChange={e=>patchOffer(offer.id,{shipmentPlace:e.target.value})}/><input placeholder="Условия оплаты" value={offer.paymentTerms||''} onChange={e=>patchOffer(offer.id,{paymentTerms:e.target.value})}/><label className="check"><input type="checkbox" checked={!!offer.hasTkp} onChange={e=>patchOffer(offer.id,{hasTkp:e.target.checked})}/> ТКП получено</label>{supplier&&<small><Phone/> {supplier.contact} · {supplier.phone}</small>}
  </div>})}</section>
  <section><label className="sale-label">Цена продажи<input type="number" value={raw.salePrice||''} onChange={e=>patch({salePrice:e.target.value})}/></label></section>
  <section><div className="section-head"><h3>Готовность и отгрузки</h3><button onClick={addBatch}><Plus/>Партия</button></div>{(raw.batches||[]).map((batch,index)=><div className="batch-card" key={batch.id}><div className="batch-top"><b>Партия {index+1}</b><button onClick={()=>deleteBatch(batch.id)}><Trash2/></button></div><div className="grid2"><label>Количество<input type="number" value={batch.qty||''} onChange={e=>patchBatch(batch.id,{qty:e.target.value})}/></label><label>Статус<select value={batch.status} onChange={e=>patchBatch(batch.id,{status:e.target.value})}><option>Запланировано</option><option>В производстве</option><option>Готово</option><option>Отгружено</option></select></label><label>Готовность<input type="date" value={batch.readyDate||''} onChange={e=>patchBatch(batch.id,{readyDate:e.target.value})}/></label><label>Отгрузка<input type="date" value={batch.shipDate||''} onChange={e=>patchBatch(batch.id,{shipDate:e.target.value})}/></label></div><input placeholder="Место отгрузки" value={batch.place||''} onChange={e=>patchBatch(batch.id,{place:e.target.value})}/></div>)}</section>
 </aside>
}
