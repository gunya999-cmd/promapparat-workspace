import{daysLeft,isWorkClosed}from'./workspace.js';

const priorityWeight={critical:0,high:1,medium:2,low:3};
const actionMeta={
 supplier:{title:'Найти поставщика',estimate:10,kind:'supplier'},
 tkp:{title:'Получить ТКП',estimate:8,kind:'tkp'},
 offer:{title:'Выбрать предложение',estimate:6,kind:'offer'},
 price:{title:'Рассчитать цену продажи',estimate:7,kind:'price'},
 margin:{title:'Согласовать низкую маржу',estimate:12,kind:'margin'},
 quote:{title:'Сформировать и отправить КП',estimate:15,kind:'quote'},
 followup:{title:'Связаться с клиентом',estimate:5,kind:'followup'}
};

const lastEventAt=(events,workId)=>{
 const values=(events||[]).filter(event=>event.workId===workId).map(event=>new Date(event.createdAt).getTime()).filter(Number.isFinite);
 return values.length?Math.max(...values):0;
};

const staleDays=(events,workId)=>{const value=lastEventAt(events,workId);return value?Math.floor((Date.now()-value)/86400000):999};

export function actionForPosition(work,position,events=[]){
 if(position.closed)return null;
 let code='quote';
 if(!position.offers.length)code='supplier';
 else if(!position.offers.some(offer=>offer.supplierId))code='supplier';
 else if(!position.offers.some(offer=>offer.hasTkp))code='tkp';
 else if(!position.selected)code='offer';
 else if(!position.sale)code='price';
 else if(position.grossMargin!==null&&position.warnings.includes('низкая маржа'))code='margin';
 else if(['КП отправлено','Переговоры'].includes(work.state)&&staleDays(events,work.id)>=2)code='followup';
 const days=daysLeft(work.deadline),meta=actionMeta[code];
 let priority='low';
 if(days<0)priority='critical';
 else if(days===0)priority='critical';
 else if(days===1||code==='margin')priority='high';
 else if(days<=3||['supplier','tkp'].includes(code))priority='medium';
 return{id:`${work.id}:${position.id}:${code}`,workId:work.id,positionId:position.id,work,position,code,...meta,priority,deadlineDays:days,profit:Number(position.netProfit??position.grossProfit??0),subtitle:`${work.customer} · позиция №${position.rowNo} · ${position.name}`};
}

export function buildManagerDesk({works=[],events=[],currentUser,scope='mine'}){
 const active=works.filter(work=>!isWorkClosed(work));
 const scoped=scope==='all'||currentUser?.role==='admin'&&scope!=='mine'?active:active.filter(work=>work.manager===currentUser?.name);
 const actions=scoped.flatMap(work=>work.activePositions.map(position=>actionForPosition(work,position,events)).filter(Boolean)).sort((a,b)=>priorityWeight[a.priority]-priorityWeight[b.priority]||a.deadlineDays-b.deadlineDays||b.profit-a.profit);
 const positions=scoped.flatMap(work=>work.activePositions.map(position=>({...position,work})));
 const stats={
  activeWorks:scoped.length,
  overdue:scoped.filter(work=>daysLeft(work.deadline)<0).length,
  today:scoped.filter(work=>daysLeft(work.deadline)===0).length,
  noSupplier:positions.filter(position=>!position.offers.some(offer=>offer.supplierId)).length,
  waitingTkp:positions.filter(position=>position.offers.some(offer=>offer.supplierId)&&!position.offers.some(offer=>offer.hasTkp)).length,
  readyForQuote:actions.filter(action=>action.code==='quote').length,
  clientWaiting:actions.filter(action=>action.code==='followup').length,
  lowMargin:actions.filter(action=>action.code==='margin').length,
  netProfit:scoped.reduce((sum,work)=>sum+Number(work.totals.netProfit||0),0),
  estimatedMinutes:actions.reduce((sum,action)=>sum+action.estimate,0)
 };
 const focus=actions[0]||null;
 const mostProfitable=scoped.slice().sort((a,b)=>Number(b.totals.netProfit||0)-Number(a.totals.netProfit||0))[0]||null;
 const workload=(currentUser?.role==='admin'?active:scoped).reduce((map,work)=>{const name=work.manager||'Не назначен';const item=map.get(name)||{manager:name,works:0,actions:0,overdue:0,profit:0};item.works+=1;item.actions+=work.activePositions.filter(position=>actionForPosition(work,position,events)).length;item.overdue+=daysLeft(work.deadline)<0?1:0;item.profit+=Number(work.totals.netProfit||0);map.set(name,item);return map},new Map());
 return{works:scoped,actions,stats,focus,mostProfitable,workload:[...workload.values()].sort((a,b)=>b.actions-a.actions)};
}

export const managerDeskPriorityWeight=priorityWeight;
