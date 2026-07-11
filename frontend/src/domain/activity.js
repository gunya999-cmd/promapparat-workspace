import{uid}from'./workspace.js';

export const ACTIVITY_TYPES=[
 {value:'all',label:'Все события'},
 {value:'work',label:'Тендер'},
 {value:'position',label:'Позиции'},
 {value:'offer',label:'Предложения'},
 {value:'price',label:'Цены'},
 {value:'document',label:'Документы'},
 {value:'shipment',label:'Логистика'},
 {value:'comment',label:'Комментарии'}
];

export function createActivity(event){
 return{
  id:uid(),
  type:'work',
  title:'Событие',
  detail:'',
  author:'Менеджер',
  positionId:null,
  supplierId:null,
  createdAt:new Date().toISOString(),
  ...event
 };
}

export function recordActivity(workspace,event){
 return{...workspace,events:[createActivity(event),...(workspace.events||[])]};
}
