import{describe,expect,it}from'vitest';
import{createDemoWorkspace}from'./workspace.js';
import{createSupplierRequest,updateSupplierRequestStatus}from'./supplierRequests.js';

const actor={id:'u-manager-1',name:'Иванов',role:'manager'};

describe('supplier quotation requests',()=>{
 it('creates supplier offers for selected positions and updates the deal',()=>{
  const state=createDemoWorkspace(),result=createSupplierRequest(state,{workId:'w3',supplierId:'s1',positionIds:['p5'],responseDueDate:'2026-07-20',note:'Запросить срок производства'},actor),position=result.state.positions.find(item=>item.id==='p5'),work=result.state.works.find(item=>item.id==='w3');
  expect(result.request.status).toBe('Отправлен');
  expect(position.status).toBe('Ожидаем ТКП');
  expect(position.offers[0]).toMatchObject({supplierId:'s1',requestId:result.request.id,hasTkp:false});
  expect(work.state).toBe('Ожидаем ТКП');
  expect(work.nextAction).toContain('Арматура-Сервис');
 });
 it('marks the linked offer as received and moves the deal to calculation',()=>{
  const state=createDemoWorkspace(),created=createSupplierRequest(state,{workId:'w3',supplierId:'s1',positionIds:['p5'],responseDueDate:'2026-07-20'},actor),updated=updateSupplierRequestStatus(created.state,created.request.id,'ТКП получено',actor),position=updated.positions.find(item=>item.id==='p5'),work=updated.works.find(item=>item.id==='w3');
  expect(position.status).toBe('ТКП получено');
  expect(position.offers[0].hasTkp).toBe(true);
  expect(work.state).toBe('Расчет');
  expect(work.nextAction).toBe('Внести цены и выбрать предложения');
 });
});
