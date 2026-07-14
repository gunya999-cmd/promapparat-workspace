import{describe,expect,it}from'vitest';
import{createDemoWorkspace}from'./workspace.js';
import{applyTargetMarginPrices,markQuoteSent,saveQuote}from'./quotes.js';

const actor={id:'u-manager-1',name:'Иванов',role:'manager'};

describe('commercial proposals',()=>{
 it('fills empty sales prices from target margin',()=>{
  const base=createDemoWorkspace(),state={...base,positions:base.positions.map(position=>position.id==='p1'?{...position,salePrice:''}:position)},result=applyTargetMarginPrices(state,'w1',20,actor),position=result.state.positions.find(item=>item.id==='p1');
  expect(position.salePrice).toBeGreaterThan(position.offers.find(item=>item.selected).price);
  expect(result.state.works.find(item=>item.id==='w1').state).toBe('КП готовится');
 });
 it('saves and sends a ready quote',()=>{
  const base=createDemoWorkspace(),positions=base.positions.map(position=>position.workId==='w3'?{...position,salePrice:20000,offers:[{id:'offer-ready',supplierId:'s1',price:15000,hasTkp:true,selected:true}]}:position),state={...base,positions},saved=saveQuote(state,'w3',{validityDays:10,paymentTerms:'50/50',deliveryTerms:'30 дней',vatIncluded:true},actor),sent=markQuoteSent(saved.state,saved.quote.id,actor),work=sent.works.find(item=>item.id==='w3');
  expect(saved.quote.status).toBe('Черновик');
  expect(saved.quote.total).toBe(40000);
  expect(sent.quotes.find(item=>item.id===saved.quote.id).status).toBe('Отправлено');
  expect(work.state).toBe('КП отправлено');
  expect(work.nextAction).toBe('Получить обратную связь по КП');
 });
});
