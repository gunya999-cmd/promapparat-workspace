import React,{useMemo,useRef,useState}from'react';
import*as XLSX from'xlsx';
import{AlertTriangle,Calculator,CheckCircle2,Copy,Download,FileSpreadsheet,Filter,Plus,Search,ToggleLeft,ToggleRight,Trash2,Upload,Variable,XCircle}from'lucide-react';
import{uid}from'../domain/workspace.js';
import{FORMULA_CATEGORIES,FORMULA_ROLES,createManualFormula,evaluateFormula,guessFormulaCategory,normalizeFormula,validateFormula}from'../domain/formulas.js';
import'./formulas.css';

const roleForCategory=category=>({Маржа:'grossMargin',Наценка:'markup',Премии:'bonus',Кредиты:'creditCost',Налоги:'tax',НДС:'vat',Логистика:'logistics',Прибыль:'netProfit'}[category]||'custom');
const displayValue=value=>typeof value==='number'?new Intl.NumberFormat('ru-RU',{maximumFractionDigits:4}).format(value):String(value??'—');
const getCellLabel=(sheet,address)=>{
 try{const point=XLSX.utils.decode_cell(address);const candidates=[];if(point.c>0)candidates.push(XLSX.utils.encode_cell({r:point.r,c:point.c-1}));if(point.r>0)candidates.push(XLSX.utils.encode_cell({r:point.r-1,c:point.c}));for(const ref of candidates){const value=sheet[ref]?.v;if(typeof value==='string'&&value.trim())return value.trim()}}catch{}
 return'';
};
const collectInputs=(workbook,defaultSheet,expression)=>{
 const inputs=new Map();
 const pattern=/(?:(?:'([^']+)'|([^'!]+))!)?\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?/g;
 let match;
 const add=(sheetName,address)=>{
  const sheet=workbook.Sheets[sheetName];if(!sheet)return;
  const key=sheetName===defaultSheet?address:`${sheetName}!${address}`;
  if(inputs.has(key))return;
  const cell=sheet[address];
  inputs.set(key,{ref:key,label:getCellLabel(sheet,address)||key,value:cell?.v??0});
 };
 while((match=pattern.exec(expression))){
  const sheetName=(match[1]||match[2]||defaultSheet).trim();
  const start=`${match[3]}${match[4]}`;const end=match[5]?`${match[5]}${match[6]}`:start;
  try{const range=XLSX.utils.decode_range(`${start}:${end}`);let count=0;for(let row=range.s.r;row<=range.e.r;row++){for(let col=range.s.c;col<=range.e.c;col++){if(count++>300)break;add(sheetName,XLSX.utils.encode_cell({r:row,c:col}))}}}catch{add(sheetName,start)}
 }
 return[...inputs.values()];
};

export function FormulaDashboard({data,setData}){
 const inputRef=useRef(null);
 const[query,setQuery]=useState('');
 const[category,setCategory]=useState('Все категории');
 const[selectedId,setSelectedId]=useState(data.formulas?.[0]?.id||null);
 const[uploading,setUploading]=useState(false);
 const[message,setMessage]=useState('');
 const formulas=useMemo(()=>(data.formulas||[]).map(normalizeFormula),[data.formulas]);
 const filtered=formulas.filter(formula=>(category==='Все категории'||formula.category===category)&&`${formula.name} ${formula.expression} ${formula.sourceFile} ${formula.sourceSheet}`.toLowerCase().includes(query.toLowerCase()));
 const selected=formulas.find(formula=>formula.id===selectedId)||filtered[0]||null;
 const checks=useMemo(()=>formulas.map(formula=>({id:formula.id,...validateFormula(formula)})),[formulas]);
 const invalidCount=checks.filter(check=>!check.ok).length;
 const patch=(id,change)=>setData(current=>({...current,formulas:(current.formulas||[]).map(formula=>formula.id===id?{...formula,...change,updatedAt:new Date().toISOString()}:formula)}));
 const addManual=()=>{const formula=createManualFormula();setData(current=>({...current,formulas:[formula,...(current.formulas||[])]}));setSelectedId(formula.id)};
 const duplicate=()=>{if(!selected)return;const copy={...selected,id:uid(),name:`${selected.name} — копия`,active:false,version:Number(selected.version||1)+1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};setData(current=>({...current,formulas:[copy,...(current.formulas||[])]}));setSelectedId(copy.id)};
 const remove=()=>{if(!selected||!window.confirm(`Удалить формулу «${selected.name}»?`))return;setData(current=>({...current,formulas:(current.formulas||[]).filter(formula=>formula.id!==selected.id)}));setSelectedId(null)};
 const patchInput=(index,change)=>patch(selected.id,{inputs:selected.inputs.map((input,itemIndex)=>itemIndex===index?{...input,...change}:input)});
 const addInput=()=>patch(selected.id,{inputs:[...selected.inputs,{ref:`X${selected.inputs.length+1}`,label:'Новая переменная',value:0}]});
 const removeInput=index=>patch(selected.id,{inputs:selected.inputs.filter((_,itemIndex)=>itemIndex!==index)});
 const exportJson=()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),formulas,formulaImports:data.formulaImports||[]},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`promapparat-formulas-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url)};
 const importExcel=async file=>{
  if(!file)return;setUploading(true);setMessage('');
  try{
   const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellFormula:true,cellNF:true,cellText:true});
   const imported=[];
   for(const sheetName of workbook.SheetNames){
    const sheet=workbook.Sheets[sheetName];
    for(const[address,cell]of Object.entries(sheet)){if(address.startsWith('!')||!cell?.f)continue;
     const expression=`=${cell.f}`;const label=getCellLabel(sheet,address);const name=label||`${sheetName}!${address}`;const formulaCategory=guessFormulaCategory(`${sheetName} ${name} ${expression}`);
     imported.push(normalizeFormula({id:uid(),name,category:formulaCategory,role:roleForCategory(formulaCategory),expression,sourceFile:file.name,sourceSheet:sheetName,sourceCell:address,cachedValue:cell.v??null,active:false,version:1,inputs:collectInputs(workbook,sheetName,expression),notes:'Импортировано из Excel',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}));
     if(imported.length>=1000)break;
    }
    if(imported.length>=1000)break;
   }
   if(!imported.length)throw new Error('В книге не найдено ячеек с формулами');
   const batch={id:uid(),fileName:file.name,sheets:workbook.SheetNames.length,formulaCount:imported.length,importedAt:new Date().toISOString()};
   setData(current=>({...current,formulas:[...imported,...(current.formulas||[])],formulaImports:[batch,...(current.formulaImports||[])]}));
   setSelectedId(imported[0].id);setMessage(`Загружено формул: ${imported.length}`);
  }catch(error){setMessage(error?.message||'Не удалось прочитать Excel-файл')}finally{setUploading(false);if(inputRef.current)inputRef.current.value=''}
 };
 const result=selected?evaluateFormula(selected):null;
 return<main className="formula-page">
  <header className="formula-head"><div><span>Финансовая модель</span><h1>Формулы и правила расчета</h1><p>Загружайте Excel-модели, проверяйте формулы и назначайте их для маржи, премий, кредитов, налогов и прибыли.</p></div><div className="formula-head-actions"><input ref={inputRef} type="file" accept=".xlsx,.xls,.xlsm" hidden onChange={event=>importExcel(event.target.files?.[0])}/><button className="formula-secondary" onClick={exportJson}><Download/>Экспорт</button><button className="formula-secondary" onClick={addManual}><Plus/>Новая формула</button><button className="primary" disabled={uploading} onClick={()=>inputRef.current?.click()}><Upload/>{uploading?'Чтение Excel…':'Загрузить Excel'}</button></div></header>
  {message&&<div className={`formula-message ${message.startsWith('Загружено')?'success':'error'}`}>{message.startsWith('Загружено')?<CheckCircle2/>:<AlertTriangle/>}{message}</div>}
  <section className="formula-stats"><article><Calculator/><div><span>Всего формул</span><b>{formulas.length}</b></div></article><article><ToggleRight/><div><span>Активных</span><b>{formulas.filter(formula=>formula.active).length}</b></div></article><article><FileSpreadsheet/><div><span>Импортов Excel</span><b>{(data.formulaImports||[]).length}</b></div></article><article className={invalidCount?'risk':''}><AlertTriangle/><div><span>Требуют проверки</span><b>{invalidCount}</b></div></article></section>
  <section className="formula-layout">
   <aside className="formula-list-panel"><div className="formula-filters"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск формулы"/></label><select value={category} onChange={event=>setCategory(event.target.value)}><option>Все категории</option>{FORMULA_CATEGORIES.map(item=><option key={item}>{item}</option>)}</select></div><div className="formula-list">{filtered.map(formula=>{const check=checks.find(item=>item.id===formula.id);return<button key={formula.id} className={`formula-row ${selected?.id===formula.id?'active':''}`} onClick={()=>setSelectedId(formula.id)}><div className={`formula-status ${check?.ok?'ok':'bad'}`}>{check?.ok?<CheckCircle2/>:<XCircle/>}</div><div><b>{formula.name}</b><span>{formula.category} · {formula.sourceFile}</span><code>{formula.expression}</code></div>{formula.active?<ToggleRight className="formula-active"/>:<ToggleLeft/>}</button>})}{!filtered.length&&<div className="formula-list-empty"><Filter/><b>Формулы не найдены</b><span>Измените фильтр или загрузите Excel.</span></div>}</div></aside>
   {selected?<section className="formula-editor"><div className="formula-editor-head"><div><span>{selected.sourceFile}{selected.sourceSheet?` · ${selected.sourceSheet}!${selected.sourceCell}`:''}</span><input value={selected.name} onChange={event=>patch(selected.id,{name:event.target.value})}/></div><div className="formula-editor-actions"><button title="Создать копию" onClick={duplicate}><Copy/></button><button className="danger" title="Удалить" onClick={remove}><Trash2/></button><button className={`formula-toggle ${selected.active?'active':''}`} onClick={()=>patch(selected.id,{active:!selected.active})}>{selected.active?<ToggleRight/>:<ToggleLeft/>}{selected.active?'Активна':'Выключена'}</button></div></div>
    <div className="formula-meta"><label>Категория<select value={selected.category} onChange={event=>patch(selected.id,{category:event.target.value})}>{FORMULA_CATEGORIES.map(item=><option key={item}>{item}</option>)}</select></label><label>Назначение<select value={selected.role} onChange={event=>patch(selected.id,{role:event.target.value})}>{FORMULA_ROLES.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Версия<input type="number" min="1" value={selected.version} onChange={event=>patch(selected.id,{version:Number(event.target.value)})}/></label></div>
    <label className="formula-expression">Формула Excel<textarea spellCheck="false" value={selected.expression} onChange={event=>patch(selected.id,{expression:event.target.value})}/></label>
    <div className={`formula-check ${result?.ok?'ok':'bad'}`}>{result?.ok?<><CheckCircle2/><div><b>Формула рассчитана</b><span>Поддерживаемый синтаксис Excel</span></div><strong>{displayValue(result.value)}</strong></>:<><AlertTriangle/><div><b>Нужна проверка</b><span>{result?.error}</span></div></>}</div>
    {selected.cachedValue!==null&&<div className="formula-cache"><span>Результат, сохраненный в Excel</span><b>{displayValue(selected.cachedValue)}</b></div>}
    <div className="formula-input-head"><div><Variable/><div><b>Входные переменные</b><span>Измените значения и сразу проверьте результат.</span></div></div><button onClick={addInput}><Plus/>Переменная</button></div>
    <div className="formula-inputs">{selected.inputs.map((input,index)=><div className="formula-input" key={`${input.ref}-${index}`}><input className="ref" value={input.ref} onChange={event=>patchInput(index,{ref:event.target.value})}/><input className="label" value={input.label||''} onChange={event=>patchInput(index,{label:event.target.value})}/><input className="value" type="number" value={input.value??0} onChange={event=>patchInput(index,{value:Number(event.target.value)})}/><button onClick={()=>removeInput(index)}><Trash2/></button></div>)}{!selected.inputs.length&&<div className="formula-no-inputs">У формулы не обнаружено ссылок на ячейки.</div>}</div>
    <label className="formula-notes">Комментарий<textarea value={selected.notes||''} onChange={event=>patch(selected.id,{notes:event.target.value})} placeholder="Условия применения, НДС, лимиты, источник ставки…"/></label>
   </section>:<section className="formula-editor formula-empty"><Calculator/><h2>Формулы еще не загружены</h2><p>Загрузите вашу Excel-таблицу. Система извлечет ячейки с формулами и создаст редактируемый каталог расчетов.</p><button className="primary" onClick={()=>inputRef.current?.click()}><Upload/>Загрузить Excel</button></section>}
  </section>
 </main>;
}
