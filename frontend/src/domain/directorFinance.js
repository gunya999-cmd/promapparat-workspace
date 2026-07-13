const n=value=>Math.max(0,Number(value||0));
export const FINANCE_SETTING_FIELDS=[
 {key:'managerBonusRate',label:'Премия менеджеру',unit:'% от прибыли',group:'Премии'},
 {key:'taxRate',label:'Налоговые отчисления',unit:'% от прибыли',group:'Налоги'},
 {key:'creditRate',label:'Ставка банковского кредита',unit:'% годовых',group:'Финансирование'},
 {key:'bankFeeRate',label:'Банковские комиссии',unit:'% от выручки',group:'Финансирование'},
 {key:'guaranteeRate',label:'Банковские гарантии',unit:'% от выручки',group:'Финансирование'},
 {key:'riskReserveRate',label:'Резерв риска',unit:'% от прибыли',group:'Резервы'},
 {key:'fixedOverheadRate',label:'Накладные расходы',unit:'% от выручки',group:'Компания'},
 {key:'dividendRate',label:'Дивиденды',unit:'% от распределяемой прибыли',group:'Компания'},
 {key:'targetMargin',label:'Целевая маржа',unit:'%',group:'Маржинальность'},
 {key:'vatRate',label:'НДС',unit:'%',group:'Налоги'}
];
export const financeDefaults={managerBonusRate:5,taxRate:20,creditRate:18,bankFeeRate:1,guaranteeRate:1.5,riskReserveRate:2,fixedOverheadRate:3,dividendRate:30,targetMargin:15,vatRate:20};
export function calculateDealFinance(work,settings={}){
 const s={...financeDefaults,...settings},revenue=n(work?.totals?.saleTotal),purchase=n(work?.totals?.purchaseTotal),grossProfit=n(work?.totals?.grossProfit),creditBase=n(work?.finance?.creditAmount||purchase),creditDays=n(work?.finance?.creditDays||90),manualParticipantBonus=n(work?.finance?.participantBonus||0);
 const creditCost=creditBase*n(s.creditRate)/100*creditDays/365,bankFees=revenue*n(s.bankFeeRate)/100,guarantees=revenue*n(s.guaranteeRate)/100,riskReserve=grossProfit*n(s.riskReserveRate)/100,overhead=revenue*n(s.fixedOverheadRate)/100;
 const profitBeforeTax=Math.max(0,grossProfit-creditCost-bankFees-guarantees-riskReserve-overhead),tax=profitBeforeTax*n(s.taxRate)/100,managerBonus=Math.max(0,profitBeforeTax-tax)*n(s.managerBonusRate)/100,totalBonus=managerBonus+manualParticipantBonus,netProfit=Math.max(0,profitBeforeTax-tax-totalBonus),margin=revenue?netProfit/revenue*100:0;
 return{revenue,purchase,grossProfit,creditCost,bankFees,guarantees,riskReserve,overhead,profitBeforeTax,tax,managerBonus,manualParticipantBonus,totalBonus,netProfit,margin,creditBase,creditDays};
}
export function calculateCompanyFinance(works=[],settings={}){
 const deals=works.map(work=>({work,finance:calculateDealFinance(work,settings)})),sum=key=>deals.reduce((total,item)=>total+n(item.finance[key]),0),revenue=sum('revenue'),grossProfit=sum('grossProfit'),netBeforeDividends=sum('netProfit'),dividends=netBeforeDividends*n({...financeDefaults,...settings}.dividendRate)/100,retainedProfit=Math.max(0,netBeforeDividends-dividends);
 return{deals,revenue,grossProfit,creditCost:sum('creditCost'),bankFees:sum('bankFees'),guarantees:sum('guarantees'),riskReserve:sum('riskReserve'),overhead:sum('overhead'),tax:sum('tax'),managerBonus:sum('managerBonus'),participantBonus:sum('manualParticipantBonus'),netBeforeDividends,dividends,retainedProfit,margin:revenue?netBeforeDividends/revenue*100:0};
}