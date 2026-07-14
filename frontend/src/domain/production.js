import{changeEvent,recordActivity}from'./activity.js';
import{todayPlus,uid}from'./workspace.js';

export const PRODUCTION_STATUSES=['Запланировано','В производстве','Готово','Отгружено'];
const now=()=>new Date().toISOString();

const workBatches=(state,workId)=>state.positions.filter(position=>position.workId===workId).flatMap(position=>(position.batches||[]).map(batch=>({position,batch})));
const nextWorkProductionState=(state,workId)=>{
 const entries=workBatches(state,workId),active=entries.filter(({batch})=>batch.status!=='Отгружено'),ready=entries.filter(({batch})=>batch.status==='Готово'),inProduction=entries.filter(({batch})=>batch.status==='В производстве'),nearest=active.map(({batch})=>batch.readyDate).filter(Boolean).sort()[0]||todayPlus(1);
 if(ready.length)return{state:'Отгрузка',nextAction:`Организовать отгрузку: ${ready.length} готовых партий`,nextActionDate:todayPlus(1)};
 if(inProduction.length)return{state:'Производство',nextAction:`Контролировать производство: ${inProduction.length} партий`,nextActionDate:nearest};
 if(active.length)return{state:'Производство',nextAction:'Запустить запланированные партии в производство',nextActionDate:nearest};
 return{state:'Отгрузка',nextAction:'Проверить завершение поставки',nextActionDate:todayPlus(1)};
};

export function createProductionBatch(state,draft,actor){
 const position=state.positions.find(item=>item.id===draft.positionId);if(!position)throw new Error('Выберите позицию');
 const work=state.works.find(item=>item.id===position.workId);if(!work)throw new Error('Сделка не найдена');
 const qty=Number(draft.qty);if(!Number.isFinite(qty)||qty<=0)throw new Error('Количество партии должно быть больше нуля');
 const planned=(position.batches||[]).reduce((sum,batch)=>sum+Number(batch.qty||0),0);if(planned+qty>Number(position.qty||0))throw new Error(`Количество партий превышает позицию. Доступно: ${Math.max(0,Number(position.qty||0)-planned)} ${position.unit}`);
 const batch={id:uid(),qty,readyDate:draft.readyDate||'',shipDate:'',place:String(draft.place||''),status:draft.status||'В производстве',createdAt:now(),createdBy:actor?.id||null};
 let next={...state,positions:state.positions.map(item=>item.id===position.id?{...item,status:batch.status,batches:[...(item.batches||[]),batch],updatedAt:now()}:item)};
 const workflow=nextWorkProductionState(next,work.id);next={...next,works:next.works.map(item=>item.id===work.id?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:work.id,positionId:position.id,type:'production',title:'Создана производственная партия',detail:`№${position.rowNo} · ${qty} ${position.unit} · готовность ${batch.readyDate||'не указана'}`,entityType:'batch',entityId:batch.id,newValue:batch,actor,source:'ui'}));
 return{state:next,batch}
}

export function updateProductionBatch(state,positionId,batchId,changes,actor){
 const position=state.positions.find(item=>item.id===positionId),batch=position?.batches?.find(item=>item.id===batchId);if(!position||!batch)throw new Error('Партия не найдена');
 const safe={...changes};if('qty'in safe){safe.qty=Number(safe.qty);if(!Number.isFinite(safe.qty)||safe.qty<=0)throw new Error('Количество партии должно быть больше нуля');const other=(position.batches||[]).filter(item=>item.id!==batchId).reduce((sum,item)=>sum+Number(item.qty||0),0);if(other+safe.qty>Number(position.qty||0))throw new Error('Количество партий превышает количество позиции')}if('status'in safe&&!PRODUCTION_STATUSES.includes(safe.status))throw new Error('Неизвестный статус партии');
 const updated={...batch,...safe,updatedAt:now()},batches=position.batches.map(item=>item.id===batchId?updated:item),shipped=batches.filter(item=>item.status==='Отгружено').reduce((sum,item)=>sum+Number(item.qty||0),0),ready=batches.some(item=>item.status==='Готово'),inProduction=batches.some(item=>item.status==='В производстве'),positionStatus=shipped>=Number(position.qty||0)?'Отгружено':shipped>0?'Частично отгружено':ready?'Готово':inProduction?'В производстве':'Запланировано';
 let next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,batches,status:positionStatus,updatedAt:now()}:item)};const workflow=nextWorkProductionState(next,position.workId);next={...next,works:next.works.map(item=>item.id===position.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:position.workId,positionId,type:'production',title:'Обновлена производственная партия',detail:Object.entries(safe).map(([key,value])=>`${key}: ${batch[key]??'—'} → ${value}`).join(' · '),entityType:'batch',entityId:batchId,oldValue:batch,newValue:updated,actor,source:'ui'}));
 return next
}

export function deleteProductionBatch(state,positionId,batchId,actor){
 const position=state.positions.find(item=>item.id===positionId),batch=position?.batches?.find(item=>item.id===batchId);if(!position||!batch)throw new Error('Партия не найдена');if(batch.status==='Отгружено')throw new Error('Отгруженную партию удалить нельзя');
 let next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,batches:item.batches.filter(value=>value.id!==batchId),updatedAt:now()}:item)};const workflow=nextWorkProductionState(next,position.workId);next={...next,works:next.works.map(item=>item.id===position.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:position.workId,positionId,type:'production',title:'Удалена производственная партия',detail:`${batch.qty} ${position.unit}`,entityType:'batch',entityId:batchId,oldValue:batch,actor,source:'ui'}));return next
}
