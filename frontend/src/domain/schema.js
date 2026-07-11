export const CURRENT_SCHEMA_VERSION=4;

const arrays=['works','suppliers','positions','documents','tasks','customers','events','formulas','formulaImports','users'];

function ensureArrays(data){
 const next={...data};
 arrays.forEach(key=>{if(!Array.isArray(next[key]))next[key]=[]});
 return next;
}

function migrateV1(data){return ensureArrays({...data,schemaVersion:1})}
function migrateV2(data){return ensureArrays({...data,schemaVersion:2,formulas:data.formulas||[],formulaImports:data.formulaImports||[]})}
function migrateV3(data){
 const users=data.users?.length?data.users:[{id:'u-admin',name:'Администратор',role:'admin',active:true}];
 return ensureArrays({...data,schemaVersion:3,users,currentUser:data.currentUser||users[0]});
}
function migrateV4(data){
 const now=new Date().toISOString();
 const sequence=Math.max(0,...(data.works||[]).map(work=>Number(String(work.code||'').match(/(\d+)$/)?.[1]||0)));
 const events=(data.events||[]).map(event=>({entityType:event.entityType||event.type||'work',entityId:event.entityId||event.positionId||event.workId||null,field:event.field||null,oldValue:event.oldValue??null,newValue:event.newValue??null,source:event.source||'ui',actorId:event.actorId||null,...event}));
 return ensureArrays({...data,schemaVersion:4,events,settings:{currency:'RUB',vatRate:20,targetMargin:15,...data.settings},counters:{workSequence:sequence,...data.counters},meta:{revision:Number(data.meta?.revision||0),updatedAt:data.meta?.updatedAt||now,...data.meta}});
}

export function migrateWorkspace(raw){
 let data=raw&&typeof raw==='object'?{...raw}:{};
 let version=Number(data.schemaVersion||0);
 if(version<1){data=migrateV1(data);version=1}
 if(version<2){data=migrateV2(data);version=2}
 if(version<3){data=migrateV3(data);version=3}
 if(version<4){data=migrateV4(data);version=4}
 return ensureArrays({...data,schemaVersion:CURRENT_SCHEMA_VERSION});
}

export function validateWorkspace(data){
 const errors=[];
 if(!data||typeof data!=='object')errors.push('Корневой объект данных отсутствует');
 arrays.forEach(key=>{if(!Array.isArray(data?.[key]))errors.push(`${key}: ожидается массив`)});
 const ids=new Set();
 for(const collection of ['works','suppliers','positions','documents','events'])for(const item of data?.[collection]||[]){if(!item?.id)errors.push(`${collection}: запись без id`);else if(ids.has(`${collection}:${item.id}`))errors.push(`${collection}: повтор id ${item.id}`);else ids.add(`${collection}:${item.id}`)}
 for(const position of data?.positions||[]){if(!position.workId)errors.push(`Позиция ${position.id}: нет workId`);if(Number(position.qty||0)<0)errors.push(`Позиция ${position.id}: отрицательное количество`)}
 return{ok:errors.length===0,errors};
}
