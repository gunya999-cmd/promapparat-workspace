import{changeEvent,recordActivity}from'./activity.js';
import{todayPlus,uid}from'./workspace.js';

const now=()=>new Date().toISOString();
const selectedOffer=position=>(position.offers||[]).find(offer=>offer.selected);
const unitCost=position=>{const offer=selectedOffer(position);return offer?Math.max(0,Number(offer.price||0))+Math.max(0,Number(position.logisticsCost||0))+Math.max(0,Number(position.otherCosts||0)):null};
export const recommendedSalePrice=(position,targetMargin=15)=>{const cost=unitCost(position),margin=Math.min(95,Math.max(0,Number(targetMargin||0)));return cost==null?null:Math.ceil(cost/(1-margin/100))};

export function applyTargetMarginPrices(state,workId,targetMargin,actor){
 const ids=(state.positions||[]).filter(position=>position.workId===workId&&!Number(position.salePrice||0)&&selectedOffer(position)).map(position=>position.id);if(!ids.length)throw new Error('Нет позиций с выбранным предложением и пустой ценой продажи');
 const idSet=new Set(ids),positions=state.positions.map(position=>idSet.has(position.id)?{...position,salePrice:recommendedSalePrice(position,targetMargin),updatedAt:now()}:position),work=state.works.find(item=>item.id===workId),nextAction='Проверить цены и сформировать КП';
 let next={...state,positions,works:state.works.map(item=>item.id===workId?{...item,state:'КП готовится',nextAction,nextActionDate:todayPlus(1),updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId,type:'quote',title:'Рассчитаны цены для КП',detail:`${ids.length} поз. · целевая маржа ${Number(targetMargin||0)}%`,entityType:'work',entityId:workId,newValue:{positionIds:ids,targetMargin},actor,source:'ui'}));
 return{state:next,positionIds:ids}
}

export function quoteReadiness(state,workId){
 const positions=(state.positions||[]).filter(position=>position.workId===workId),issues=[];
 for(const position of positions){if(!selectedOffer(position))issues.push(`№${position.rowNo}: не выбрано предложение`);if(!Number(position.salePrice||0))issues.push(`№${position.rowNo}: нет цены продажи`)}
 return{positions,ready:positions.length>0&&!issues.length,issues}
}

export function saveQuote(state,workId,draft,actor){
 const work=state.works.find(item=>item.id===workId);if(!work)throw new Error('Сделка не найдена');
 const readiness=quoteReadiness(state,workId);if(!readiness.positions.length)throw new Error('В сделке нет позиций');if(!readiness.ready)throw new Error(`КП не готово: ${readiness.issues.slice(0,3).join('; ')}`);
 const existing=(state.quotes||[]).filter(item=>item.workId===workId),version=Math.max(0,...existing.map(item=>Number(item.version||0)))+1,createdAt=now(),positions=readiness.positions.map(position=>{const offer=selectedOffer(position),cost=unitCost(position),salePrice=Number(position.salePrice||0);return{id:position.id,rowNo:position.rowNo,name:position.name,qty:Number(position.qty||0),unit:position.unit||'шт',supplierId:offer?.supplierId||'',purchasePrice:Number(offer?.price||0),unitCost:cost,salePrice,total:salePrice*Number(position.qty||0),margin:salePrice&&cost!=null?(salePrice-cost)/salePrice*100:null}}),total=positions.reduce((sum,item)=>sum+item.total,0),quote={id:uid(),workId,version,status:'Черновик',customer:work.customer,title:work.title,validityDays:Math.max(1,Number(draft.validityDays||10)),deliveryTerms:String(draft.deliveryTerms||''),paymentTerms:String(draft.paymentTerms||''),note:String(draft.note||''),vatIncluded:draft.vatIncluded!==false,currency:state.settings?.currency||'RUB',positions,total,createdAt,createdBy:actor?.id||null,createdByName:actor?.name||'Менеджер'};
 let next={...state,quotes:[quote,...(state.quotes||[])],works:state.works.map(item=>item.id===workId?{...item,state:'КП готовится',nextAction:'Проверить и отправить КП',nextActionDate:todayPlus(1),updatedAt:createdAt}:item)};
 next=recordActivity(next,changeEvent({workId,type:'quote',title:`Сохранено КП №${version}`,detail:`${positions.length} поз. · сумма ${total}`,entityType:'quote',entityId:quote.id,newValue:quote,actor,source:'ui'}));
 return{state:next,quote}
}

export function markQuoteSent(state,quoteId,actor){
 const quote=(state.quotes||[]).find(item=>item.id===quoteId);if(!quote)throw new Error('КП не найдено');if(quote.status==='Отправлено')return state;
 const sentAt=now(),updated={...quote,status:'Отправлено',sentAt,sentBy:actor?.id||null};
 let next={...state,quotes:(state.quotes||[]).map(item=>item.id===quoteId?updated:item),works:state.works.map(item=>item.id===quote.workId?{...item,state:'КП отправлено',nextAction:'Получить обратную связь по КП',nextActionDate:todayPlus(3),updatedAt:sentAt}:item)};
 next=recordActivity(next,changeEvent({workId:quote.workId,type:'quote',title:`КП №${quote.version} отправлено`,detail:`${quote.customer} · сумма ${quote.total}`,entityType:'quote',entityId:quote.id,oldValue:quote.status,newValue:'Отправлено',actor,source:'ui'}));
 return next
}
