const MANAGER_SECTIONS=new Set(['works','suppliers','positions','documents','tasks','customers','events','specificationImports','platforms','opportunities','platformChecks','supplierRequests','quotes','shipments','invoices','counters']);
const DIRECTOR_SECTIONS=new Set(['settings','formulas','formulaImports']);
const SYSTEM_SECTIONS=new Set(['schemaVersion','users','currentUser','meta']);
const ARRAY_SECTIONS=new Set(['works','suppliers','positions','documents','tasks','customers','events','specificationImports','platforms','opportunities','platformChecks','supplierRequests','quotes','shipments','invoices','formulas','formulaImports']);
const OBJECT_SECTIONS=new Set(['settings','counters']);

const isObject=value=>value&&typeof value==='object'&&!Array.isArray(value);
const object=value=>isObject(value)?value:{};
export const allowedSectionsForRole=role=>role==='director'?DIRECTOR_SECTIONS:MANAGER_SECTIONS;

export function validateWorkspacePayload(incoming,role){
 if(!isObject(incoming))return['data должен быть объектом'];const allowed=allowedSectionsForRole(role),errors=[];
 for(const key of allowed){if(!(key in incoming))continue;if(ARRAY_SECTIONS.has(key)&&!Array.isArray(incoming[key]))errors.push(`${key}: ожидается массив`);if(OBJECT_SECTIONS.has(key)&&!isObject(incoming[key]))errors.push(`${key}: ожидается объект`)}
 if(Array.isArray(incoming.works)&&incoming.works.length>50000)errors.push('works: превышен допустимый размер');if(Array.isArray(incoming.positions)&&incoming.positions.length>500000)errors.push('positions: превышен допустимый размер');
 return errors;
}

export function mergeWorkspaceByRole(current,incoming,role){
 const base=object(current),candidate=object(incoming),allowed=allowedSectionsForRole(role),next={...base},changed=[];
 for(const key of allowed){
  if(!(key in candidate))continue;
  const before=JSON.stringify(base[key]??null),after=JSON.stringify(candidate[key]??null);
  if(before===after)continue;
  next[key]=candidate[key];changed.push(key);
 }
 for(const key of SYSTEM_SECTIONS)if(key in base)next[key]=base[key];
 return{data:next,changedSections:changed,ignoredSections:Object.keys(candidate).filter(key=>!allowed.has(key)&&!SYSTEM_SECTIONS.has(key))};
}

export function publicWorkspace(data,user,users=[],revision=null){return{...object(data),users:users.map(item=>({id:item.id,name:item.name,role:item.role,active:item.active})),currentUser:{id:user.id,name:user.name,role:user.role,email:user.email},meta:{...object(data?.meta),serverManaged:true,serverRevision:revision}}}
