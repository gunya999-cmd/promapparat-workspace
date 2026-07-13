import{uid,todayPlus}from'./workspace.js';
import{createWorkCommand}from'./commands.js';

export const PLATFORM_STATUSES=['Не проверено','Проверяется','Проверено','Требует проверки'];
export const OPPORTUNITY_STATUSES=['Новая','На оценке','Взята в работу','Отказ'];
export const REJECTION_REASONS=['Не наш профиль','Нет производителя','Не успеваем по сроку','Низкая потенциальная маржа','Маленькая сумма','Высокий риск заказчика','Недостаточно ресурсов','Другое'];

export const demoPlatforms=()=>[
 {id:'pl-zakupki',name:'Zakupki.gov.ru',url:'https://zakupki.gov.ru',owner:'Иванов',status:'Проверяется',frequency:'Ежедневно',lastCheckedAt:new Date(Date.now()-35*60000).toISOString(),newCount:18,checkedToday:true},
 {id:'pl-b2b',name:'B2B-Center',url:'https://www.b2b-center.ru',owner:'Петров',status:'Проверено',frequency:'Ежедневно',lastCheckedAt:new Date(Date.now()-90*60000).toISOString(),newCount:9,checkedToday:true},
 {id:'pl-gazprom',name:'ЭТП Газпром',url:'',owner:'Иванов',status:'Не проверено',frequency:'Ежедневно',lastCheckedAt:new Date(Date.now()-86400000).toISOString(),newCount:5,checkedToday:false},
 {id:'pl-rosneft',name:'Роснефть',url:'',owner:'',status:'Требует проверки',frequency:'Ежедневно',lastCheckedAt:new Date(Date.now()-2*86400000).toISOString(),newCount:11,checkedToday:false},
 {id:'pl-sibur',name:'СИБУР',url:'',owner:'',status:'Требует проверки',frequency:'Ежедневно',lastCheckedAt:new Date(Date.now()-3*86400000).toISOString(),newCount:4,checkedToday:false}
];

export const demoOpportunities=()=>[
 {id:'opp-1',platformId:'pl-zakupki',externalId:'32414555',customer:'ПАО НК Роснефть',title:'Шаровые краны DN300',estimatedAmount:14000000,deadline:todayPlus(8),status:'Новая',owner:'Иванов',profileFit:null,manufacturerAvailable:null,timeFeasible:null,commercialInterest:null,notes:'',createdAt:new Date().toISOString()},
 {id:'opp-2',platformId:'pl-b2b',externalId:'B2B-77621',customer:'Газпром переработка',title:'Регулирующие клапаны и приводы',estimatedAmount:38000000,deadline:todayPlus(12),status:'На оценке',owner:'Петров',profileFit:true,manufacturerAvailable:true,timeFeasible:true,commercialInterest:true,notes:'Есть подходящие заводы',createdAt:new Date().toISOString()},
 {id:'opp-3',platformId:'pl-sibur',externalId:'SIB-9041',customer:'СИБУР',title:'Расходомеры электромагнитные',estimatedAmount:9200000,deadline:todayPlus(5),status:'Новая',owner:'Иванов',profileFit:null,manufacturerAvailable:null,timeFeasible:null,commercialInterest:null,notes:'',createdAt:new Date().toISOString()}
];

const actorName=actor=>actor?.name||'Пользователь';
const now=()=>new Date().toISOString();
const event=(type,title,detail,actor,extra={})=>({id:uid(),type,title,detail,author:actorName(actor),actorId:actor?.id||null,entityType:'opportunity',source:'ui',createdAt:now(),...extra});
const today=value=>String(value||'').slice(0,10)===new Date().toISOString().slice(0,10);

export function beginPlatformCheck(state,platformId,actor){
 const platform=(state.platforms||[]).find(item=>item.id===platformId);if(!platform)throw new Error('Площадка не найдена');
 const startedAt=now(),platforms=state.platforms.map(item=>item.id===platformId?{...item,status:'Проверяется',checkStartedAt:startedAt,checkStartedBy:actor?.id||null,owner:item.owner||actorName(actor)}:item);
 return{...state,platforms,events:[event('platform','Начата проверка площадки',platform.name,actor,{entityType:'platform',entityId:platform.id}),...(state.events||[])]};
}

export function completePlatformCheck(state,platformId,result={},actor){
 const platform=(state.platforms||[]).find(item=>item.id===platformId);if(!platform)throw new Error('Площадка не найдена');
 const checkedAt=now(),reviewedCount=Math.max(0,Number(result.reviewedCount||0)),foundCount=Math.max(0,Number(result.foundCount||0)),session={id:uid(),platformId,startedAt:platform.checkStartedAt||checkedAt,completedAt:checkedAt,reviewedCount,foundCount,notes:String(result.notes||''),actorId:actor?.id||null,actorName:actorName(actor)};
 const platforms=state.platforms.map(item=>item.id===platformId?{...item,status:'Проверено',checkedToday:true,lastCheckedAt:checkedAt,lastCheckedBy:actor?.id||null,newCount:foundCount,checkStartedAt:null,checkStartedBy:null}:item);
 return{...state,platforms,platformChecks:[session,...(state.platformChecks||[])],events:[event('platform','Площадка проверена',`${platform.name} · просмотрено ${reviewedCount} · найдено ${foundCount}`,actor,{entityType:'platform',entityId:platform.id,newValue:session}),...(state.events||[])]};
}

export function markPlatformChecked(state,platformId,actor){return completePlatformCheck(state,platformId,{},actor)}

export function createOpportunity(state,draft,actor){
 const customer=String(draft.customer||'').trim(),title=String(draft.title||'').trim();if(!customer||!title)throw new Error('Заказчик и предмет закупки обязательны');
 const duplicate=(state.opportunities||[]).find(item=>item.platformId===draft.platformId&&String(item.externalId||'').trim()&&String(item.externalId||'').trim()===String(draft.externalId||'').trim());if(duplicate)throw new Error('Эта закупка уже добавлена из выбранной площадки');
 const opportunity={id:uid(),platformId:draft.platformId||'',externalId:String(draft.externalId||'').trim(),customer,title,estimatedAmount:Math.max(0,Number(draft.estimatedAmount||0)),deadline:draft.deadline||'',status:'Новая',owner:draft.owner||actorName(actor),profileFit:null,manufacturerAvailable:null,timeFeasible:null,commercialInterest:null,notes:String(draft.notes||''),createdAt:now(),createdBy:actor?.id||null};
 return{state:{...state,opportunities:[opportunity,...(state.opportunities||[])],events:[event('opportunity','Найдена новая возможность',`${customer} · ${title}`,actor,{entityId:opportunity.id,newValue:opportunity}),...(state.events||[])]},opportunity};
}

export function updateOpportunityQualification(state,id,patch,actor){
 const current=(state.opportunities||[]).find(item=>item.id===id);if(!current)throw new Error('Возможность не найдена');
 const next={...current,...patch,status:current.status==='Новая'?'На оценке':current.status,updatedAt:now(),updatedBy:actor?.id||null};
 return{...state,opportunities:state.opportunities.map(item=>item.id===id?next:item),events:[event('qualification','Обновлен экспресс-анализ',`${next.customer} · ${next.title}`,actor,{entityId:id,oldValue:current,newValue:next}),...(state.events||[])]};
}

export function updateOpportunityFields(state,id,patch,actor){
 const current=(state.opportunities||[]).find(item=>item.id===id);if(!current)throw new Error('Возможность не найдена');
 const allowed=['customer','title','externalId','platformId','estimatedAmount','deadline','owner','notes'];
 const safe={};for(const key of allowed)if(key in patch)safe[key]=key==='estimatedAmount'?Math.max(0,Number(patch[key]||0)):String(patch[key]??'');
 if('customer'in safe&&!safe.customer.trim())throw new Error('Заказчик обязателен');if('title'in safe&&!safe.title.trim())throw new Error('Предмет закупки обязателен');
 const next={...current,...safe,updatedAt:now(),updatedBy:actor?.id||null};
 const changed=Object.keys(safe).filter(key=>String(current[key]??'')!==String(next[key]??''));if(!changed.length)return state;
 return{...state,opportunities:state.opportunities.map(item=>item.id===id?next:item),events:[event('opportunity','Изменена возможность',`${next.customer} · ${changed.join(', ')}`,actor,{entityId:id,oldValue:current,newValue:next}),...(state.events||[])]};
}

export function bulkUpdateOpportunities(state,ids,patch,actor){
 const unique=[...new Set(ids||[])],existing=new Set((state.opportunities||[]).map(item=>item.id)),valid=unique.filter(id=>existing.has(id));if(!valid.length)throw new Error('Не выбраны возможности');
 let next=state;for(const id of valid)next=updateOpportunityFields(next,id,patch,actor);
 return{...next,events:[event('opportunity','Массовое изменение возможностей',`${valid.length} записей`,actor,{entityId:null,newValue:{ids:valid,patch}}),...(next.events||[])]};
}

export function rejectOpportunity(state,id,reason,note,actor){
 const current=(state.opportunities||[]).find(item=>item.id===id);if(!current)throw new Error('Возможность не найдена');if(!REJECTION_REASONS.includes(reason))throw new Error('Укажите причину отказа');
 const next={...current,status:'Отказ',rejectionReason:reason,rejectionNote:String(note||''),decidedAt:now(),decidedBy:actor?.id||null};
 return{...state,opportunities:state.opportunities.map(item=>item.id===id?next:item),events:[event('rejection','Отказ от возможности',`${next.customer}: ${reason}`,actor,{entityId:id,newValue:{reason,note}}),...(state.events||[])]};
}

export function acceptOpportunity(state,id,actor){
 const current=(state.opportunities||[]).find(item=>item.id===id);if(!current)throw new Error('Возможность не найдена');if(current.status==='Взята в работу')throw new Error('Возможность уже взята в работу');
 const created=createWorkCommand(state,{customer:current.customer,title:current.title,objectName:current.title,source:'Тендер',deadline:current.deadline,manager:current.owner||actorName(actor)},actor),work={...created.work,opportunityId:id,sourcePlatformId:current.platformId,externalTenderId:current.externalId};
 const works=created.state.works.map(item=>item.id===work.id?work:item),next={...current,status:'Взята в работу',workId:work.id,decidedAt:now(),decidedBy:actor?.id||null};
 return{state:{...created.state,works,opportunities:(created.state.opportunities||state.opportunities||[]).map(item=>item.id===id?next:item),events:[event('conversion','Возможность взята в работу',`${next.customer} → ${work.code}`,actor,{entityId:id,workId:work.id,newValue:{workId:work.id}}),...(created.state.events||[])]},work,opportunity:next};
}

export function opportunityAnalytics(state){
 const list=state.opportunities||[],platforms=state.platforms||[],checks=state.platformChecks||[],accepted=list.filter(item=>item.status==='Взята в работу'),rejected=list.filter(item=>item.status==='Отказ'),active=list.filter(item=>['Новая','На оценке'].includes(item.status)),todayChecks=checks.filter(item=>today(item.completedAt));
 const reasons=rejected.reduce((map,item)=>{map[item.rejectionReason||'Не указано']=(map[item.rejectionReason||'Не указано']||0)+1;return map},{});
 return{total:list.length,newCount:list.filter(item=>item.status==='Новая').length,inReview:list.filter(item=>item.status==='На оценке').length,accepted:accepted.length,rejected:rejected.length,active:active.length,conversion:list.length?accepted.length/list.length*100:0,checkedPlatforms:platforms.filter(item=>item.checkedToday).length,totalPlatforms:platforms.length,reasons,reviewedToday:todayChecks.reduce((sum,item)=>sum+Number(item.reviewedCount||0),0),foundToday:todayChecks.reduce((sum,item)=>sum+Number(item.foundCount||0),0),checksToday:todayChecks.length};
}
