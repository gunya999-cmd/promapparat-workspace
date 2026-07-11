import{uid}from'./workspace.js';

export const ACTIVITY_TYPES=[
 {value:'all',label:'Все события'},{value:'work',label:'Тендер'},{value:'position',label:'Позиции'},{value:'offer',label:'Предложения'},{value:'price',label:'Цены'},{value:'document',label:'Документы'},{value:'shipment',label:'Логистика'},{value:'comment',label:'Комментарии'},{value:'system',label:'Система'}
];

export function createActivity(event){
 return{
  id:uid(),type:'work',title:'Событие',detail:'',author:'Менеджер',actorId:null,positionId:null,supplierId:null,
  entityType:event.entityType||event.type||'work',entityId:event.entityId||event.positionId||event.workId||null,
  field:event.field||null,oldValue:event.oldValue??null,newValue:event.newValue??null,source:event.source||'ui',operationId:event.operationId||uid(),
  createdAt:new Date().toISOString(),...event
 };
}

export function recordActivity(workspace,event){return{...workspace,events:[createActivity(event),...(workspace.events||[])]}}

export function changeEvent({type='position',title,detail='',entityType='position',entityId,field,oldValue,newValue,workId,positionId,supplierId,actor,source='ui'}){
 return{type,title,detail,entityType,entityId,field,oldValue,newValue,workId,positionId,supplierId,author:actor?.name||'Менеджер',actorId:actor?.id||null,source};
}
