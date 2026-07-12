import{changeEvent,recordActivity}from'./activity.js';

const allowed=new Set(['currency','vatRate','targetMargin']);
const labels={currency:'Валюта',vatRate:'НДС',targetMargin:'Целевая маржа'};

export function updateFinancialSettingsCommand(state,changes,actor){
 const sanitized={};
 for(const[key,value]of Object.entries(changes||{})){
  if(!allowed.has(key))continue;
  if(key==='currency'){
   if(!['RUB','USD','EUR','ILS'].includes(value))throw new Error('Неподдерживаемая валюта');
   sanitized[key]=value;
  }else{
   const number=Number(value);if(!Number.isFinite(number)||number<0||number>100)throw new Error(`${labels[key]}: требуется значение от 0 до 100`);sanitized[key]=number;
  }
 }
 let next={...state,settings:{...state.settings,...sanitized}};
 for(const[key,value]of Object.entries(sanitized)){
  const oldValue=state.settings?.[key];if(String(oldValue??'')===String(value??''))continue;
  next=recordActivity(next,changeEvent({type:'system',title:'Изменены финансовые настройки',detail:`${labels[key]}: ${oldValue??'—'} → ${value}`,entityType:'settings',entityId:'financial',field:key,oldValue:oldValue??null,newValue:value,actor,source:'ui'}));
 }
 return next;
}
