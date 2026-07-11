import{changeEvent,recordActivity}from'./activity.js';
import{uid}from'./workspace.js';

const now=()=>new Date().toISOString();
const actorOf=(state,actor)=>actor||state.currentUser||{id:null,name:'Менеджер'};
const nonNegative=(value,label)=>{const number=Number(value);if(!Number.isFinite(number)||number<0)throw new Error(`${label}: требуется число не меньше нуля`);return number};
const required=(value,label)=>{if(!String(value??'').trim())throw new Error(`${label}: поле обязательно`);return String(value).trim()};
const event=(state,actor,payload)=>changeEvent({...payload,actor:actorOf(state,actor)});

export function nextWorkCode(state,date=new Date()){
 const year=date.getFullYear(),sequence=Math.max(Number(state.counters?.workSequence||0),...(state.works||[]).map(work=>Number(String(work.code||'').match(/(\d+)$/)?.[1]||0)))+1;
 return{code:`PA-${year}-${String(sequence).padStart(4,'0')}`,sequence};
}

export function createWorkCommand(state,form,actor){
 const customer=required(form.customer,'Заказчик'),title=required(form.title,'Название'),{code,sequence}=nextWorkCode(state);
 const work={id:uid(),code,title,customer,source:form.source||'Тендер',objectName:form.objectName||'',manager:form.manager||actorOf(state,actor).name,deadline:form.deadline||'',state:form.state||'Новая',createdAt:now()};
 const next={...state,works:[work,...state.works],counters:{...state.counters,workSequence:sequence}};
 return{state:recordActivity(next,event(state,actor,{workId:work.id,type:'work',title:work.source==='Тендер'?'Создан тендер':'Создана заявка',detail:`${customer} — ${title}`,entityType:'work',entityId:work.id,newValue:work})),work};
}

export function addPositionCommand(state,workId,draft,actor){
 const work=state.works.find(item=>item.id===workId);if(!work)throw new Error('Работа не найдена');
 const name=required(draft.name,'Позиция'),qty=nonNegative(draft.qty,'Количество');if(qty===0)throw new Error('Количество должно быть больше нуля');
 const rowNo=Math.max(0,...state.positions.filter(position=>position.workId===workId).map(position=>Number(position.rowNo||0)))+1;
 const position={id:uid(),workId,rowNo,group:draft.group||'',name,qty,unit:draft.unit||'шт',status:'Не начато',salePrice:'',vatRate:Number(state.settings?.vatRate??20),logisticsCost:0,otherCosts:0,offers:[],batches:[]};
 const next={...state,positions:[...state.positions,position]};
 return{state:recordActivity(next,event(state,actor,{workId,positionId:position.id,type:'position',title:'Добавлена позиция',detail:`${name} · ${qty} ${position.unit}`,entityType:'position',entityId:position.id,newValue:position})),position};
}

export function updatePositionCommand(state,positionId,changes,actor,source='ui'){
 const old=state.positions.find(item=>item.id===positionId);if(!old)throw new Error('Позиция не найдена');
 const sanitized={...changes};
 for(const key of ['qty','salePrice','logisticsCost','otherCosts','vatRate'])if(key in sanitized&&sanitized[key]!=='')sanitized[key]=nonNegative(sanitized[key],key);
 const nextPosition={...old,...sanitized};
 let next={...state,positions:state.positions.map(item=>item.id===positionId?nextPosition:item)};
 const changed=Object.keys(sanitized).filter(key=>String(old[key]??'')!==String(nextPosition[key]??''));
 for(const field of changed)next=recordActivity(next,event(state,actor,{workId:old.workId,positionId,type:field==='salePrice'?'price':'position',title:field==='salePrice'?'Изменена цена продажи':'Изменена позиция',detail:`${field}: ${old[field]??'—'} → ${nextPosition[field]??'—'}`,entityType:'position',entityId:positionId,field,oldValue:old[field]??null,newValue:nextPosition[field]??null,source}));
 return next;
}

export function addOfferCommand(state,positionId,actor){
 const position=state.positions.find(item=>item.id===positionId);if(!position)throw new Error('Позиция не найдена');
 const offer={id:uid(),supplierId:'',price:'',productionDays:'',deliveryDays:'',shipmentPlace:'',paymentTerms:'',hasTkp:false,selected:false};
 const next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,offers:[...(item.offers||[]),offer]}:item)};
 return recordActivity(next,event(state,actor,{workId:position.workId,positionId,type:'offer',title:'Добавлено предложение поставщика',detail:position.name,entityType:'offer',entityId:offer.id,newValue:offer}));
}

export function updateOfferCommand(state,positionId,offerId,changes,actor,source='ui'){
 const position=state.positions.find(item=>item.id===positionId),old=position?.offers?.find(item=>item.id===offerId);if(!position||!old)throw new Error('Предложение не найдено');
 const sanitized={...changes};for(const key of ['price','productionDays','deliveryDays'])if(key in sanitized&&sanitized[key]!=='')sanitized[key]=nonNegative(sanitized[key],key);
 const updated={...old,...sanitized};
 let next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,offers:item.offers.map(offer=>offer.id===offerId?updated:offer)}:item)};
 for(const field of Object.keys(sanitized).filter(key=>String(old[key]??'')!==String(updated[key]??''))){
  const supplier=state.suppliers.find(item=>item.id===updated.supplierId);
  next=recordActivity(next,event(state,actor,{workId:position.workId,positionId,supplierId:updated.supplierId||null,type:field==='price'?'price':field==='hasTkp'?'document':'offer',title:field==='price'?'Изменена закупочная цена':field==='hasTkp'?(updated.hasTkp?'Получено ТКП':'Снята отметка о ТКП'):'Изменено предложение',detail:`${supplier?.name||'Поставщик'} · ${field}: ${old[field]??'—'} → ${updated[field]??'—'}`,entityType:'offer',entityId:offerId,field,oldValue:old[field]??null,newValue:updated[field]??null,source}));
 }
 return next;
}

export function selectOfferCommand(state,positionId,offerId,actor){
 const position=state.positions.find(item=>item.id===positionId),offer=position?.offers?.find(item=>item.id===offerId);if(!position||!offer)throw new Error('Предложение не найдено');
 if(!offer.supplierId)throw new Error('Сначала выберите поставщика');
 const previous=position.offers.find(item=>item.selected)?.id||null;
 const next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,offers:item.offers.map(value=>({...value,selected:value.id===offerId}))}:item)};
 const supplier=state.suppliers.find(item=>item.id===offer.supplierId);
 return recordActivity(next,event(state,actor,{workId:position.workId,positionId,supplierId:offer.supplierId,type:'offer',title:'Выбрано предложение поставщика',detail:`${supplier?.name||'Поставщик'} · ${offer.price||0} ₽`,entityType:'position',entityId:positionId,field:'selectedOfferId',oldValue:previous,newValue:offerId}));
}

export function deleteOfferCommand(state,positionId,offerId,actor){
 const position=state.positions.find(item=>item.id===positionId),offer=position?.offers?.find(item=>item.id===offerId);if(!position||!offer)throw new Error('Предложение не найдено');
 const next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,offers:item.offers.filter(value=>value.id!==offerId)}:item)};
 return recordActivity(next,event(state,actor,{workId:position.workId,positionId,type:'offer',title:'Удалено предложение поставщика',detail:state.suppliers.find(item=>item.id===offer.supplierId)?.name||'Поставщик не указан',entityType:'offer',entityId:offerId,oldValue:offer}));
}

export function addBatchCommand(state,positionId,actor){
 const position=state.positions.find(item=>item.id===positionId);if(!position)throw new Error('Позиция не найдена');
 const batch={id:uid(),qty:1,readyDate:'',shipDate:'',place:'',status:'Запланировано'};
 const next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,batches:[...(item.batches||[]),batch]}:item)};
 return recordActivity(next,event(state,actor,{workId:position.workId,positionId,type:'shipment',title:'Создана партия',detail:`1 ${position.unit}`,entityType:'batch',entityId:batch.id,newValue:batch}));
}

export function updateBatchCommand(state,positionId,batchId,changes,actor){
 const position=state.positions.find(item=>item.id===positionId),old=position?.batches?.find(item=>item.id===batchId);if(!position||!old)throw new Error('Партия не найдена');
 const sanitized={...changes};if('qty'in sanitized)sanitized.qty=nonNegative(sanitized.qty,'Количество партии');const updated={...old,...sanitized};
 let next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,batches:item.batches.map(batch=>batch.id===batchId?updated:batch)}:item)};
 for(const field of Object.keys(sanitized).filter(key=>String(old[key]??'')!==String(updated[key]??'')))next=recordActivity(next,event(state,actor,{workId:position.workId,positionId,type:'shipment',title:field==='status'?'Изменен статус партии':'Изменена партия',detail:`${field}: ${old[field]??'—'} → ${updated[field]??'—'}`,entityType:'batch',entityId:batchId,field,oldValue:old[field]??null,newValue:updated[field]??null}));
 return next;
}

export function deleteBatchCommand(state,positionId,batchId,actor){
 const position=state.positions.find(item=>item.id===positionId),batch=position?.batches?.find(item=>item.id===batchId);if(!position||!batch)throw new Error('Партия не найдена');
 const next={...state,positions:state.positions.map(item=>item.id===positionId?{...item,batches:item.batches.filter(value=>value.id!==batchId)}:item)};
 return recordActivity(next,event(state,actor,{workId:position.workId,positionId,type:'shipment',title:'Удалена партия',detail:`${batch.qty} ${position.unit}`,entityType:'batch',entityId:batchId,oldValue:batch}));
}

export function addDocumentsCommand(state,workId,documents,actor){
 if(!documents.length)return state;const next={...state,documents:[...state.documents,...documents]};
 return recordActivity(next,event(state,actor,{workId,positionId:documents[0].positionId||null,type:'document',title:documents.length===1?'Добавлен документ':`Добавлены документы: ${documents.length}`,detail:documents.map(item=>item.name).join(', '),entityType:'document',entityId:documents[0].id,newValue:documents}));
}

export function deleteDocumentCommand(state,documentId,actor){
 const document=state.documents.find(item=>item.id===documentId);if(!document)throw new Error('Документ не найден');
 const next={...state,documents:state.documents.filter(item=>item.id!==documentId)};
 return recordActivity(next,event(state,actor,{workId:document.workId,positionId:document.positionId||null,type:'document',title:'Удален документ',detail:`${document.type} · ${document.name}`,entityType:'document',entityId:documentId,oldValue:document}));
}

export function addSupplierCommand(state,actor){
 const supplier={id:uid(),name:'',city:'',contact:'',phone:'',email:'',website:'',inn:'',specialization:'',brands:'',rating:4,reliability:80,comment:''};
 const next={...state,suppliers:[supplier,...state.suppliers]};
 return{state:recordActivity(next,event(state,actor,{type:'system',title:'Создана карточка поставщика',entityType:'supplier',entityId:supplier.id,newValue:supplier})),supplier};
}

export function updateSupplierCommand(state,supplierId,changes,actor){
 const old=state.suppliers.find(item=>item.id===supplierId);if(!old)throw new Error('Поставщик не найден');const updated={...old,...changes};
 let next={...state,suppliers:state.suppliers.map(item=>item.id===supplierId?updated:item)};
 for(const field of Object.keys(changes).filter(key=>String(old[key]??'')!==String(updated[key]??'')))next=recordActivity(next,event(state,actor,{type:'system',title:'Изменена карточка поставщика',detail:`${field}: ${old[field]??'—'} → ${updated[field]??'—'}`,entityType:'supplier',entityId:supplierId,field,oldValue:old[field]??null,newValue:updated[field]??null}));
 return next;
}

export function deleteSupplierCommand(state,supplierId,actor){
 const supplier=state.suppliers.find(item=>item.id===supplierId);if(!supplier)throw new Error('Поставщик не найден');
 const used=state.positions.some(position=>position.offers?.some(offer=>offer.supplierId===supplierId));if(used)throw new Error('Поставщик используется в предложениях. Сначала замените его в позициях.');
 const next={...state,suppliers:state.suppliers.filter(item=>item.id!==supplierId)};
 return recordActivity(next,event(state,actor,{type:'system',title:'Удален поставщик',detail:supplier.name,entityType:'supplier',entityId:supplierId,oldValue:supplier}));
}
