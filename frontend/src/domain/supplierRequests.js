import{changeEvent,recordActivity}from'./activity.js';
import{todayPlus,uid}from'./workspace.js';

export const SUPPLIER_REQUEST_STATUSES=['Отправлен','ТКП получено','Отказ поставщика','Отменён'];

const now=()=>new Date().toISOString();
const allowedStatus=status=>SUPPLIER_REQUEST_STATUSES.includes(status);

export function createSupplierRequest(state,draft,actor){
 const work=(state.works||[]).find(item=>item.id===draft.workId);if(!work)throw new Error('Сделка не найдена');
 const supplier=(state.suppliers||[]).find(item=>item.id===draft.supplierId);if(!supplier)throw new Error('Выберите поставщика');
 const unique=[...new Set(draft.positionIds||[])],positions=(state.positions||[]).filter(item=>item.workId===work.id&&unique.includes(item.id));if(!positions.length)throw new Error('Выберите хотя бы одну позицию');
 const id=uid(),createdAt=now(),responseDueDate=draft.responseDueDate||todayPlus(3),request={id,workId:work.id,supplierId:supplier.id,positionIds:positions.map(item=>item.id),status:'Отправлен',responseDueDate,contact:String(draft.contact||supplier.contact||''),note:String(draft.note||''),createdAt,createdBy:actor?.id||null,createdByName:actor?.name||'Менеджер'};
 const positionIds=new Set(request.positionIds),nextPositions=state.positions.map(position=>{
  if(!positionIds.has(position.id))return position;
  const offers=position.offers||[],existing=offers.find(offer=>offer.supplierId===supplier.id);
  const nextOffers=existing?offers.map(offer=>offer.id===existing.id?{...offer,requestId:id,requestedAt:createdAt}:offer):[...offers,{id:uid(),supplierId:supplier.id,price:'',productionDays:'',deliveryDays:'',shipmentPlace:supplier.city||'',paymentTerms:'',hasTkp:false,selected:false,requestId:id,requestedAt:createdAt}];
  return{...position,status:'Ожидаем ТКП',offers:nextOffers,updatedAt:createdAt};
 });
 const nextAction=`Получить ТКП от ${supplier.name}`,updatedWork={...work,state:'Ожидаем ТКП',nextAction,nextActionDate:responseDueDate,updatedAt:createdAt};
 let next={...state,works:state.works.map(item=>item.id===work.id?updatedWork:item),positions:nextPositions,supplierRequests:[request,...(state.supplierRequests||[])]};
 next=recordActivity(next,changeEvent({workId:work.id,supplierId:supplier.id,type:'supplier-request',title:'Запрос ТКП отправлен',detail:`${supplier.name} · ${positions.length} поз. · ответ до ${responseDueDate}`,entityType:'supplierRequest',entityId:id,newValue:request,actor,source:'ui'}));
 return{state:next,request}
}

export function updateSupplierRequestStatus(state,requestId,status,actor){
 if(!allowedStatus(status))throw new Error('Неизвестный статус запроса');
 const request=(state.supplierRequests||[]).find(item=>item.id===requestId);if(!request)throw new Error('Запрос ТКП не найден');
 const supplier=(state.suppliers||[]).find(item=>item.id===request.supplierId),changedAt=now(),updatedRequest={...request,status,updatedAt:changedAt,updatedBy:actor?.id||null};
 const ids=new Set(request.positionIds||[]),received=status==='ТКП получено';
 const positions=(state.positions||[]).map(position=>{
  if(!ids.has(position.id))return position;
  const offers=(position.offers||[]).map(offer=>offer.supplierId===request.supplierId?{...offer,hasTkp:received||offer.hasTkp,tkpReceivedAt:received?changedAt:offer.tkpReceivedAt}:offer);
  const hasAnyTkp=offers.some(offer=>offer.hasTkp),nextStatus=hasAnyTkp?'ТКП получено':status==='Отказ поставщика'?'Нужен поставщик':position.status;
  return{...position,offers,status:nextStatus,updatedAt:changedAt};
 });
 const work=(state.works||[]).find(item=>item.id===request.workId),nextAction=received?'Внести цены и выбрать предложения':status==='Отказ поставщика'?'Выбрать другого поставщика':work?.nextAction,nextActionDate=received||status==='Отказ поставщика'?todayPlus(1):work?.nextActionDate;
 const works=(state.works||[]).map(item=>item.id===request.workId?{...item,state:received?'Расчет':item.state,nextAction,nextActionDate,updatedAt:changedAt}:item);
 let next={...state,works,positions,supplierRequests:(state.supplierRequests||[]).map(item=>item.id===requestId?updatedRequest:item)};
 next=recordActivity(next,changeEvent({workId:request.workId,supplierId:request.supplierId,type:'supplier-request',title:`Запрос ТКП: ${status}`,detail:`${supplier?.name||'Поставщик'} · ${(request.positionIds||[]).length} поз.`,entityType:'supplierRequest',entityId:requestId,oldValue:request.status,newValue:status,actor,source:'ui'}));
 return next
}
