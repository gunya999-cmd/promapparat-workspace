import{changeEvent,recordActivity}from'./activity.js';
import{uid}from'./workspace.js';

const normalizeName=value=>String(value||'').trim();
const assertUnique=(state,name,exceptId=null)=>{if(!name)throw new Error('Название поставщика обязательно');if((state.suppliers||[]).some(item=>item.id!==exceptId&&normalizeName(item.name).toLowerCase()===name.toLowerCase()))throw new Error('Поставщик с таким названием уже существует')};

export function createSupplierCommand(state,name,actor){
 const normalized=normalizeName(name);assertUnique(state,normalized);
 const supplier={id:uid(),name:normalized,city:'',contact:'',phone:'',email:'',website:'',inn:'',specialization:'',brands:'',rating:4,reliability:80,comment:'',createdAt:new Date().toISOString()};
 const next={...state,suppliers:[supplier,...state.suppliers]};
 return{state:recordActivity(next,changeEvent({type:'system',title:'Создана карточка поставщика',detail:normalized,entityType:'supplier',entityId:supplier.id,newValue:supplier,actor,source:'ui'})),supplier};
}

export function updateSupplierNameCommand(state,supplierId,name,actor){
 const supplier=(state.suppliers||[]).find(item=>item.id===supplierId);if(!supplier)throw new Error('Поставщик не найден');
 const normalized=normalizeName(name);assertUnique(state,normalized,supplierId);if(supplier.name===normalized)return state;
 const next={...state,suppliers:state.suppliers.map(item=>item.id===supplierId?{...item,name:normalized}:item)};
 return recordActivity(next,changeEvent({type:'system',title:'Изменено название поставщика',detail:`${supplier.name} → ${normalized}`,entityType:'supplier',entityId:supplierId,field:'name',oldValue:supplier.name,newValue:normalized,actor,source:'ui'}));
}
