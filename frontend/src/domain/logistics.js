import{changeEvent,recordActivity}from'./activity.js';
import{todayPlus,uid}from'./workspace.js';

export const SHIPMENT_STATUSES=['Запланирована','В пути','Доставлена','Проблема'];
const now=()=>new Date().toISOString();

const positionShipmentStatus=(position,batches)=>{const shipped=batches.filter(item=>item.status==='Отгружено').reduce((sum,item)=>sum+Number(item.qty||0),0);return shipped>=Number(position.qty||0)?'Отгружено':shipped>0?'Частично отгружено':batches.some(item=>item.status==='Готово')?'Готово':position.status};
const updateWorkDelivery=(state,workId)=>{
 const shipments=(state.shipments||[]).filter(item=>item.workId===workId),active=shipments.filter(item=>!['Доставлена'].includes(item.status)),problem=shipments.filter(item=>item.status==='Проблема'),allDelivered=shipments.length>0&&!active.length,nearest=active.map(item=>item.plannedDeliveryDate).filter(Boolean).sort()[0]||todayPlus(1);
 if(problem.length)return{state:'Отгрузка',nextAction:`Решить проблемы доставки: ${problem.length}`,nextActionDate:todayPlus(1),deliveryComplete:false};
 if(allDelivered)return{state:'Отгрузка',nextAction:'Выставить счёт и контролировать оплату',nextActionDate:todayPlus(1),deliveryComplete:true};
 if(active.length)return{state:'Отгрузка',nextAction:`Контролировать доставку: ${active.length} отправок`,nextActionDate:nearest,deliveryComplete:false};
 return{state:'Отгрузка',nextAction:'Организовать отгрузку готовых партий',nextActionDate:todayPlus(1),deliveryComplete:false};
};

export function createShipment(state,draft,actor){
 const position=state.positions.find(item=>(item.batches||[]).some(batch=>batch.id===draft.batchId)),batch=position?.batches?.find(item=>item.id===draft.batchId);if(!position||!batch)throw new Error('Выберите готовую партию');if(batch.status!=='Готово')throw new Error('Отгрузить можно только готовую партию');
 const existing=(state.shipments||[]).find(item=>item.batchId===batch.id&&item.status!=='Отменена');if(existing)throw new Error('Для этой партии уже создана отправка');
 const carrier=String(draft.carrier||'').trim();if(!carrier)throw new Error('Укажите перевозчика или способ доставки');
 const shipment={id:uid(),workId:position.workId,positionId:position.id,batchId:batch.id,qty:Number(batch.qty||0),carrier,vehicle:String(draft.vehicle||''),tracking:String(draft.tracking||''),destination:String(draft.destination||''),shipDate:draft.shipDate||new Date().toISOString().slice(0,10),plannedDeliveryDate:draft.plannedDeliveryDate||todayPlus(7),actualDeliveryDate:'',status:'В пути',note:String(draft.note||''),createdAt:now(),createdBy:actor?.id||null,createdByName:actor?.name||'Менеджер'};
 const batches=position.batches.map(item=>item.id===batch.id?{...item,status:'Отгружено',shipDate:shipment.shipDate,place:shipment.destination||item.place,shipmentId:shipment.id,updatedAt:now()}:item),positionStatus=positionShipmentStatus(position,batches);
 let next={...state,shipments:[shipment,...(state.shipments||[])],positions:state.positions.map(item=>item.id===position.id?{...item,batches,status:positionStatus,updatedAt:now()}:item)};const workflow=updateWorkDelivery(next,position.workId);next={...next,works:next.works.map(item=>item.id===position.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:position.workId,positionId:position.id,type:'logistics',title:'Партия передана в доставку',detail:`${carrier} · ${shipment.qty} ${position.unit} · доставка до ${shipment.plannedDeliveryDate}`,entityType:'shipment',entityId:shipment.id,newValue:shipment,actor,source:'ui'}));
 return{state:next,shipment}
}

export function updateShipment(state,shipmentId,changes,actor){
 const shipment=(state.shipments||[]).find(item=>item.id===shipmentId);if(!shipment)throw new Error('Отправка не найдена');const safe={...changes};if('status'in safe&&!SHIPMENT_STATUSES.includes(safe.status))throw new Error('Неизвестный статус доставки');if(safe.status==='Доставлена'&&!safe.actualDeliveryDate)safe.actualDeliveryDate=new Date().toISOString().slice(0,10);
 const updated={...shipment,...safe,updatedAt:now(),updatedBy:actor?.id||null};let next={...state,shipments:state.shipments.map(item=>item.id===shipmentId?updated:item)};const workflow=updateWorkDelivery(next,shipment.workId);next={...next,works:next.works.map(item=>item.id===shipment.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:shipment.workId,positionId:shipment.positionId,type:'logistics',title:`Доставка: ${updated.status}`,detail:`${updated.carrier} · ${updated.tracking||updated.vehicle||'без номера'}`,entityType:'shipment',entityId:shipmentId,oldValue:shipment,newValue:updated,actor,source:'ui'}));return next
}

export function deleteShipment(state,shipmentId,actor){
 const shipment=(state.shipments||[]).find(item=>item.id===shipmentId);if(!shipment)throw new Error('Отправка не найдена');if(shipment.status==='Доставлена')throw new Error('Доставленную отправку удалить нельзя');
 const position=state.positions.find(item=>item.id===shipment.positionId),batches=(position?.batches||[]).map(batch=>batch.id===shipment.batchId?{...batch,status:'Готово',shipmentId:null,shipDate:''}:batch),positions=state.positions.map(item=>item.id===shipment.positionId?{...item,batches,status:positionShipmentStatus(item,batches),updatedAt:now()}:item);let next={...state,shipments:state.shipments.filter(item=>item.id!==shipmentId),positions};const workflow=updateWorkDelivery(next,shipment.workId);next={...next,works:next.works.map(item=>item.id===shipment.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:shipment.workId,positionId:shipment.positionId,type:'logistics',title:'Отправка отменена',detail:`${shipment.carrier} · ${shipment.qty}`,entityType:'shipment',entityId:shipmentId,oldValue:shipment,actor,source:'ui'}));return next
}
