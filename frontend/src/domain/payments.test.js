import{describe,expect,it}from'vitest';
import{createDemoWorkspace}from'./workspace.js';
import{createInvoice,recordInvoicePayment}from'./payments.js';

const actor={id:'u-manager-1',name:'Иванов',role:'manager'};
const payableState=()=>{const base=createDemoWorkspace();return{...base,positions:base.positions.map(position=>position.id==='p5'?{...position,salePrice:20000}:position)}};

describe('payment workflow',()=>{
 it('creates an invoice and keeps the deal in delivery until payment',()=>{
  const result=createInvoice(payableState(),'w3',{number:'W3-1',amount:40000,issueDate:'2026-07-20',dueDate:'2026-08-01'},actor),work=result.state.works.find(item=>item.id==='w3');
  expect(result.invoice.status).toBe('Выставлен');
  expect(work.state).toBe('Отгрузка');
  expect(work.paymentStatus).toBe('Счет выставлен');
 });
 it('supports partial payment and closes the fully paid deal',()=>{
  const invoice=createInvoice(payableState(),'w3',{number:'W3-1',amount:40000,dueDate:'2026-08-01'},actor),partial=recordInvoicePayment(invoice.state,invoice.invoice.id,{amount:15000,date:'2026-07-25'},actor),partialWork=partial.state.works.find(item=>item.id==='w3');
  expect(partialWork.paymentStatus).toBe('Частичная оплата');
  expect(partialWork.state).toBe('Отгрузка');
  const completed=recordInvoicePayment(partial.state,invoice.invoice.id,{amount:25000,date:'2026-07-28'},actor),closed=completed.state.works.find(item=>item.id==='w3');
  expect(closed.paymentStatus).toBe('Оплачено');
  expect(closed.state).toBe('Закрыто успешно');
  expect(closed.nextAction).toBe('Работа закрыта');
 });
});
