import{changeEvent,recordActivity}from'./activity.js';
import{uid}from'./workspace.js';

export function createSupplierCommand(state,name,actor){
 const normalized=String(name||'').trim();if(!normalized)throw new Error('Название поставщика обязательно');
 if((state.suppliers||[]).some(item=>String(item.name||'').trim().toLowerCase()===normalized.toLowerCase()))throw new Error('Поставщик с таким названием уже существует');
 const supplier={id:uid(),name:normalized,city:'',contact:'',phone:'',email:'',website:'',inn:'',specialization:'',brands:'',rating:4,reliability:80,comment:'',createdAt:new Date().toISOString()};
 const next={...state,suppliers:[supplier,...state.suppliers]};
 return{state:recordActivity(next,changeEvent({type:'system',title:'Создана карточка поставщика',detail:normalized,entityType:'supplier',entityId:supplier.id,newValue:supplier,actor,source:'ui'})),supplier};
}
