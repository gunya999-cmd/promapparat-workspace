import{uid}from'./workspace.js';

export const FORMULA_CATEGORIES=['Маржа','Наценка','Премии','Кредиты','Налоги','НДС','Логистика','Зарплата','Прибыль','Прочее'];
export const FORMULA_ROLES=[
 {value:'custom',label:'Пользовательский показатель'},
 {value:'grossMargin',label:'Валовая маржа'},
 {value:'markup',label:'Наценка'},
 {value:'bonus',label:'Премия менеджера'},
 {value:'creditCost',label:'Стоимость кредита'},
 {value:'tax',label:'Налоговая нагрузка'},
 {value:'vat',label:'НДС'},
 {value:'logistics',label:'Логистика'},
 {value:'netProfit',label:'Чистая прибыль'}
];

const FUNCTION_NAMES=['IF','ROUND','ROUNDUP','ROUNDDOWN','MIN','MAX','ABS','SUM','AVERAGE','AND','OR','NOT','POWER'];
const FUNCTIONS={
 IF:(condition,yes,no)=>condition?yes:no,
 ROUND:(value,digits=0)=>{const power=10**Number(digits||0);return Math.round(Number(value||0)*power)/power},
 ROUNDUP:(value,digits=0)=>{const power=10**Number(digits||0);return Math.ceil(Number(value||0)*power)/power},
 ROUNDDOWN:(value,digits=0)=>{const power=10**Number(digits||0);return Math.floor(Number(value||0)*power)/power},
 MIN:(...values)=>Math.min(...values.flat().map(Number)),
 MAX:(...values)=>Math.max(...values.flat().map(Number)),
 ABS:value=>Math.abs(Number(value||0)),
 SUM:(...values)=>values.flat().reduce((sum,value)=>sum+Number(value||0),0),
 AVERAGE:(...values)=>{const list=values.flat().map(Number);return list.length?list.reduce((sum,value)=>sum+value,0)/list.length:0},
 AND:(...values)=>values.every(Boolean),
 OR:(...values)=>values.some(Boolean),
 NOT:value=>!value,
 POWER:(value,power)=>Number(value||0)**Number(power||0)
};

export function guessFormulaCategory(text=''){
 const value=text.toLowerCase();
 if(/марж|margin/.test(value))return'Маржа';
 if(/нацен|markup/.test(value))return'Наценка';
 if(/прем|бонус|bonus/.test(value))return'Премии';
 if(/кредит|процент|loan|interest/.test(value))return'Кредиты';
 if(/ндс|vat/.test(value))return'НДС';
 if(/налог|tax/.test(value))return'Налоги';
 if(/логист|достав|транспорт/.test(value))return'Логистика';
 if(/зарплат|оклад|фот/.test(value))return'Зарплата';
 if(/прибыл|profit/.test(value))return'Прибыль';
 return'Прочее';
}

export function createManualFormula(){
 const now=new Date().toISOString();
 return{
  id:uid(),name:'Новая формула маржи',category:'Маржа',role:'grossMargin',expression:'=(B2-A2)/B2*100',
  sourceFile:'Ручной ввод',sourceSheet:'',sourceCell:'',cachedValue:null,active:false,version:1,
  inputs:[{ref:'A2',label:'Закупочная цена',value:0},{ref:'B2',label:'Цена продажи',value:0}],
  notes:'',createdAt:now,updatedAt:now
 };
}

export function normalizeFormula(item){
 return{
  id:item.id||uid(),name:item.name||'Формула',category:item.category||'Прочее',role:item.role||'custom',expression:item.expression||'=',
  sourceFile:item.sourceFile||'Ручной ввод',sourceSheet:item.sourceSheet||'',sourceCell:item.sourceCell||'',cachedValue:item.cachedValue??null,
  active:!!item.active,version:Number(item.version||1),inputs:Array.isArray(item.inputs)?item.inputs:[],notes:item.notes||'',
  createdAt:item.createdAt||new Date().toISOString(),updatedAt:item.updatedAt||new Date().toISOString()
 };
}

const literal=value=>{
 if(value===null||value===undefined||value==='')return'0';
 if(typeof value==='number')return Number.isFinite(value)?String(value):'0';
 if(typeof value==='boolean')return value?'true':'false';
 const numeric=Number(String(value).replace(',','.'));
 if(Number.isFinite(numeric))return String(numeric);
 return JSON.stringify(String(value));
};

export function evaluateFormula(formula){
 try{
  const inputs=new Map((formula.inputs||[]).map(input=>[String(input.ref||'').replace(/\$/g,'').toUpperCase(),input.value]));
  let expression=String(formula.expression||'').trim();
  if(expression.startsWith('='))expression=expression.slice(1);
  if(!expression)return{ok:false,error:'Формула пустая'};
  if(expression.length>2000)return{ok:false,error:'Формула слишком длинная'};
  expression=expression.replace(/\$/g,'').replace(/;/g,',').replace(/<>/g,'!=').replace(/\^/g,'**');
  expression=expression.replace(/(\d+(?:[.,]\d+)?)%/g,(_,number)=>`(${String(number).replace(',','.')}/100)`);
  expression=expression.replace(/(?:(?:'([^']+)'|([A-Za-zА-Яа-я0-9_ .-]+))!)?([A-Z]{1,3}\d+):([A-Z]{1,3}\d+)/g,(match,quoted,sheet,start,end)=>{
   const prefix=(quoted||sheet)?`${quoted||sheet}!`:'';
   const startColumn=start.match(/[A-Z]+/)[0],endColumn=end.match(/[A-Z]+/)[0];
   const startRow=Number(start.match(/\d+/)[0]),endRow=Number(end.match(/\d+/)[0]);
   if(startColumn!==endColumn||endRow-startRow>200)return'0';
   const values=[];for(let row=startRow;row<=endRow;row++)values.push(literal(inputs.get(`${prefix}${startColumn}${row}`.toUpperCase())));
   return values.join(',');
  });
  expression=expression.replace(/(?:(?:'([^']+)'|([A-Za-zА-Яа-я0-9_ .-]+))!)?([A-Z]{1,3}\d+)/g,(match,quoted,sheet,address)=>{
   const key=`${quoted||sheet?`${quoted||sheet}!`:''}${address}`.toUpperCase();
   return literal(inputs.get(key)??inputs.get(address.toUpperCase()));
  });
  expression=expression.replace(/\bTRUE\b/gi,'true').replace(/\bFALSE\b/gi,'false');
  expression=expression.replace(/(?<![<>=!])=(?!=)/g,'==');
  if(!/^[0-9A-Za-z_+\-*/%().,<>=!?:\s"'А-Яа-яёЁ]*$/.test(expression))return{ok:false,error:'В формуле есть неподдерживаемые символы'};
  const identifiers=expression.match(/[A-Za-z_][A-Za-z0-9_]*/g)||[];
  const allowed=new Set([...FUNCTION_NAMES,'true','false']);
  const unsupported=[...new Set(identifiers.filter(name=>!allowed.has(name.toUpperCase())&&!allowed.has(name)))];
  if(unsupported.length)return{ok:false,error:`Неподдерживаемые функции или имена: ${unsupported.join(', ')}`};
  const names=Object.keys(FUNCTIONS),values=Object.values(FUNCTIONS);
  const result=Function(...names,`"use strict";return (${expression});`)(...values);
  if(typeof result==='number'&&!Number.isFinite(result))return{ok:false,error:'Результат не является конечным числом'};
  return{ok:true,value:result,normalized:expression};
 }catch(error){return{ok:false,error:error?.message||'Не удалось вычислить формулу'}}
}

export function validateFormula(formula){
 const result=evaluateFormula(formula);
 const functions=(String(formula.expression||'').match(/[A-ZА-Я_][A-ZА-Я0-9_]*(?=\()/gi)||[]).map(name=>name.toUpperCase());
 const unsupported=[...new Set(functions.filter(name=>!FUNCTION_NAMES.includes(name)))];
 if(unsupported.length)return{ok:false,error:`Пока не поддерживаются: ${unsupported.join(', ')}`};
 return result;
}
