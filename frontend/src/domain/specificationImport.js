import{changeEvent,recordActivity}from'./activity.js';
import{todayPlus,uid}from'./workspace.js';

export const IMPORT_FIELDS=[
 {value:'',label:'Не импортировать'},
 {value:'rowNo',label:'Номер позиции'},
 {value:'group',label:'Группа'},
 {value:'name',label:'Наименование'},
 {value:'qty',label:'Количество'},
 {value:'unit',label:'Единица'},
 {value:'model',label:'Марка / модель'},
 {value:'specification',label:'Технические параметры'},
 {value:'manufacturer',label:'Производитель'},
 {value:'desiredDate',label:'Желаемый срок'},
 {value:'note',label:'Примечание'}
];

const aliases={
 rowNo:['№','номер','позиция','поз.','item'],group:['группа','раздел','категория'],name:['наименование','название','товар','оборудование','description'],qty:['количество','кол-во','кол во','qty'],unit:['ед.','единица','ед. изм.','unit'],model:['марка','модель','тип','model'],specification:['характеристики','технические параметры','параметры','описание','specification'],manufacturer:['производитель','изготовитель','brand'],desiredDate:['срок','желаемый срок','дата поставки'],note:['примечание','комментарий','note']
};
const norm=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
export function guessColumnMapping(headers=[]){const result={};headers.forEach((header,index)=>{const value=norm(header);for(const[field,names]of Object.entries(aliases))if(names.some(name=>value===norm(name)||value.includes(norm(name)))){if(!Object.values(result).includes(field))result[index]=field;break}});return result}
export function normalizeImportRow(row,mapping){const get=field=>{const index=Object.keys(mapping).find(key=>mapping[key]===field);return index===undefined?'':row[Number(index)]};const name=String(get('name')||'').trim(),qtyRaw=String(get('qty')??'').replace(',','.'),qty=Number(qtyRaw);return{sourceRow:row.__row||null,rowNo:get('rowNo'),group:String(get('group')||'').trim(),name,qty:Number.isFinite(qty)?qty:NaN,unit:String(get('unit')||'шт').trim()||'шт',model:String(get('model')||'').trim(),specification:String(get('specification')||'').trim(),manufacturer:String(get('manufacturer')||'').trim(),desiredDate:String(get('desiredDate')||'').trim(),note:String(get('note')||'').trim()}}
export function analyzeImportRows(rows,mapping,existing=[]){const existingKeys=new Set(existing.map(item=>`${norm(item.name)}|${Number(item.qty||0)}|${norm(item.unit)}`)),seen=new Set();return rows.map((row,index)=>{const item=normalizeImportRow({...row,__row:index+2},mapping);const errors=[];if(!item.name)errors.push('Нет наименования');if(!Number.isFinite(item.qty)||item.qty<=0)errors.push('Некорректное количество');const key=`${norm(item.name)}|${Number(item.qty||0)}|${norm(item.unit)}`,duplicate=existingKeys.has(key)||seen.has(key);seen.add(key);return{...item,key,duplicate,errors,valid:errors.length===0&&!duplicate}})}
export function importSpecificationCommand(state,workId,analysis,meta,actor){
 const work=state.works.find(item=>item.id===workId);if(!work)throw new Error('Работа не найдена');
 const valid=analysis.filter(item=>item.valid);if(!valid.length)throw new Error('Нет строк для импорта');
 const start=Math.max(0,...state.positions.filter(position=>position.workId===workId).map(position=>Number(position.rowNo||0))),importId=uid();
 const positions=valid.map((item,index)=>({id:uid(),workId,rowNo:start+index+1,group:item.group,name:item.name,qty:item.qty,unit:item.unit,status:'Не начато',salePrice:'',vatRate:Number(state.settings?.vatRate??20),logisticsCost:0,otherCosts:0,offers:[],batches:[],model:item.model,specification:item.specification,manufacturer:item.manufacturer,desiredDate:item.desiredDate,note:item.note,importId,sourceRow:item.sourceRow}));
 const record={id:importId,workId,fileName:meta.fileName||'',sheetName:meta.sheetName||'',createdAt:new Date().toISOString(),createdBy:actor?.id||null,positionIds:positions.map(item=>item.id),added:positions.length,skipped:analysis.length-positions.length,rolledBackAt:null};
 const nextAction='Проверить позиции и запросить ТКП',nextActionDate=todayPlus(1),updatedWork={...work,state:work.state==='Новая'?'Анализ':work.state,nextAction,nextActionDate,updatedAt:new Date().toISOString()};
 let next={...state,works:state.works.map(item=>item.id===workId?updatedWork:item),positions:[...state.positions,...positions],specificationImports:[record,...(state.specificationImports||[])]};
 next=recordActivity(next,changeEvent({workId,type:'position',title:'Импортирована спецификация',detail:`${record.fileName} · лист ${record.sheetName} · добавлено ${record.added}, пропущено ${record.skipped} · следующее действие: ${nextAction}`,entityType:'specificationImport',entityId:importId,newValue:{...record,nextAction,nextActionDate},actor,source:'excel'}));
 return{state:next,record,positionIds:record.positionIds,nextAction,nextActionDate}
}
export function rollbackSpecificationImportCommand(state,importId,actor){const record=(state.specificationImports||[]).find(item=>item.id===importId);if(!record)throw new Error('Импорт не найден');if(record.rolledBackAt)throw new Error('Импорт уже отменен');const ids=new Set(record.positionIds||[]),used=state.positions.filter(position=>ids.has(position.id)&&((position.offers||[]).length||(position.batches||[]).length));if(used.length)throw new Error('Нельзя отменить импорт: по части позиций уже есть предложения или партии');const rolledBackAt=new Date().toISOString();let next={...state,positions:state.positions.filter(position=>!ids.has(position.id)),specificationImports:(state.specificationImports||[]).map(item=>item.id===importId?{...item,rolledBackAt}:item)};next=recordActivity(next,changeEvent({workId:record.workId,type:'position',title:'Отменен импорт спецификации',detail:`${record.fileName} · удалено позиций: ${(record.positionIds||[]).length}`,entityType:'specificationImport',entityId:importId,oldValue:record,newValue:{...record,rolledBackAt},actor,source:'ui'}));return next}
