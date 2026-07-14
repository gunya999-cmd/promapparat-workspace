import{describe,expect,it}from'vitest';
import{createDemoWorkspace,normalizeWorkspace}from'./workspace.js';
import{createSupplierRequest,updateSupplierRequestStatus}from'./supplierRequests.js';
import{applyTargetMarginPrices,markQuoteSent,saveQuote}from'./quotes.js';
import{createProductionBatch,updateProductionBatch}from'./production.js';
import{createShipment,updateShipment}from'./logistics.js';
import{createInvoice,recordInvoicePayment}from'./payments.js';

const actor={id:'u-manager-1',name:'Иванов',role:'manager'};

describe('complete manager lifecycle',()=>{
 it('moves one deal from TКП request through quote, production, delivery and full payment',()=>{
  let state=normalizeWorkspace(createDemoWorkspace());
  const request=createSupplierRequest(state,{workId:'w3',supplierId:'s1',positionIds:['p5'],responseDueDate:'2026-08-01'},actor);state=request.state;
  state=updateSupplierRequestStatus(state,request.request.id,'ТКП получено',actor);
  state={...state,positions:state.positions.map(position=>position.id==='p5'?{...position,offers:position.offers.map(offer=>({...offer,price:15000,selected:true}))}:position)};
  state=applyTargetMarginPrices(state,'w3',20,actor).state;
  const quote=saveQuote(state,'w3',{validityDays:10,paymentTerms:'50/50',deliveryTerms:'30 дней',vatIncluded:true},actor);state=markQuoteSent(quote.state,quote.quote.id,actor);
  const production=createProductionBatch(state,{positionId:'p5',qty:2,readyDate:'2026-08-15',place:'Завод'},actor);state=updateProductionBatch(production.state,'p5',production.batch.id,{status:'Готово'},actor);
  const shipment=createShipment(state,{batchId:production.batch.id,carrier:'Деловые линии',destination:'Склад заказчика',plannedDeliveryDate:'2026-08-20'},actor);state=updateShipment(shipment.state,shipment.shipment.id,{status:'Доставлена'},actor);
  const saleTotal=state.positions.filter(position=>position.workId==='w3').reduce((sum,position)=>sum+Number(position.salePrice||0)*Number(position.qty||0),0),invoice=createInvoice(state,'w3',{number:'W3-FINAL',amount:saleTotal,dueDate:'2026-09-01'},actor);state=recordInvoicePayment(invoice.state,invoice.invoice.id,{amount:saleTotal,date:'2026-08-25'},actor).state;
  const work=state.works.find(item=>item.id==='w3'),position=state.positions.find(item=>item.id==='p5');
  expect(position.offers[0].hasTkp).toBe(true);
  expect(quote.quote.status).toBe('Черновик');
  expect(state.shipments[0].status).toBe('Доставлена');
  expect(state.invoices[0].status).toBe('Оплачен');
  expect(work.state).toBe('Закрыто успешно');
  expect(work.paymentStatus).toBe('Оплачено');
  expect(work.nextAction).toBe('Работа закрыта');
 });
});
