const MANAGER_SECTIONS=new Set(['works','suppliers','positions','documents','tasks','customers','events','specificationImports','platforms','opportunities','platformChecks','supplierRequests','quotes','shipments','invoices','counters']);
const DIRECTOR_SECTIONS=new Set(['settings','formulas','formulaImports']);
const SYSTEM_SECTIONS=new Set(['schemaVersion','users','currentUser','meta']);

const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
export const allowedSectionsForRole=role=>role==='director'?DIRECTOR_SECTIONS:MANAGER_SECTIONS;

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

export function publicWorkspace(data,user,users=[]){return{...object(data),users:users.map(item=>({id:item.id,name:item.name,role:item.role,active:item.active})),currentUser:{id:user.id,name:user.name,role:user.role,email:user.email},meta:{...object(data?.meta),serverManaged:true}}}
