import{evaluateFormula,isFormulaEffective,normalizeFormula}from'./formulas.js';

const aliases={
 purchasePrice:['purchase','purchaseprice','закупка','закупочнаяцена','цена закупки'],
 salePrice:['sale','saleprice','продажа','ценапродажи','цена продажи'],
 quantity:['qty','quantity','количество'],
 logisticsCost:['logistics','logisticscost','логистика','доставка'],
 otherCosts:['othercosts','прочиерасходы','прочие расходы'],
 unitCost:['unitcost','себестоимость','себестоимостьединицы'],
 saleTotal:['saletotal','суммапродажи','выручка'],
 purchaseTotal:['purchasetotal','суммазакупки','затраты'],
 grossProfit:['grossprofit','валоваяприбыль','валовая прибыль'],
 grossMargin:['grossmargin','маржа','валоваямаржа'],
 markup:['markup','наценка'],
 vatAmount:['vat','vatamount','ндс'],
 vatRate:['vatrate','ставкандс','ставка ндс']
};

const normalizeKey=value=>String(value||'').toLowerCase().replace(/[^a-zа-яё0-9]+/g,'').trim();

function resolveValue(input,context){
 const keys=[input.ref,input.label].map(normalizeKey).filter(Boolean);
 for(const[name,items]of Object.entries(aliases))if(keys.some(key=>key===normalizeKey(name)||items.some(item=>key===normalizeKey(item))))return context[name];
 return input.value;
}

export function applyFinancialFormulas(base,formulas=[],context={}){
 const active=(formulas||[]).map(normalizeFormula).filter(formula=>isFormulaEffective(formula));
 const values={creditCost:0,taxAmount:0,bonusAmount:0,netProfit:null,grossMargin:base.grossMargin,markup:base.markup};
 const formulaResults=[];
 for(const formula of active){
  const prepared={...formula,inputs:(formula.inputs||[]).map(input=>({...input,value:resolveValue(input,{...context,...base,...values})}))};
  const result=evaluateFormula(prepared);
  formulaResults.push({id:formula.id,role:formula.role,name:formula.name,...result});
  if(!result.ok||typeof result.value!=='number')continue;
  if(formula.role==='creditCost')values.creditCost=result.value;
  if(formula.role==='tax')values.taxAmount=result.value;
  if(formula.role==='bonus')values.bonusAmount=result.value;
  if(formula.role==='netProfit')values.netProfit=result.value;
  if(formula.role==='grossMargin')values.grossMargin=result.value;
  if(formula.role==='markup')values.markup=result.value;
 }
 const defaultNet=base.grossProfit-values.creditCost-values.taxAmount-values.bonusAmount;
 return{...values,netProfit:values.netProfit??defaultNet,formulaResults,appliedFormulaCount:formulaResults.filter(item=>item.ok).length};
}
