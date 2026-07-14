import{describe,expect,it}from'vitest';
import{createDemoWorkspace}from'./workspace.js';
import{createShipment,deleteShipment,updateShipment}from'./logistics.js';

const actor={id:'u-manager-1',name:'Иванов',role:'manager'};

const stateWithReadyBatch=()=>{const base=createDemoWorkspace(),batch={id:'batch-ready',qty:2,readyDate:'2026-07-20',shipDate:'',place:'Завод',status:'Готово'};return{...base,positions:base.positions.map(position=>position.id==='p5'?{...position,status:'Готово',batches:[batch]}:position)}};

describe('logistics workflow',()=>{
 it('creates a shipment from a ready batch',()=>{
  const result=createShipment(stateWithReadyBatch(),{batchId:'batch-ready',carrier:'Деловые линии',tracking:'TRACK-1',destination:'Склад заказчика',shipDate:'2026-07-21',plannedDeliveryDate:'2026-07-25'},actor),position=result.state.positions.find(item=>item.id==='p5'),work=result.state.works.find(item=>item.id==='w3');
  expect(result.shipment.status).toBe('В пути');
  expect(position.batches[0].status).toBe('Отгружено');
  expect(work.state).toBe('Отгрузка');
  expect(work.nextAction).toContain('Контролировать доставку');
 });
 it('marks delivery complete and can cancel an active shipment',()=>{
  const created=createShipment(stateWithReadyBatch(),{batchId:'batch-ready',carrier:'Собственная машина',plannedDeliveryDate:'2026-07-25'},actor),delivered=updateShipment(created.state,created.shipment.id,{status:'Доставлена'},actor),work=delivered.works.find(item=>item.id==='w3');
  expect(delivered.shipments[0].actualDeliveryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(work.deliveryComplete).toBe(true);
  expect(work.nextAction).toBe('Выставить счёт и контролировать оплату');
  const createdAgain=createShipment(stateWithReadyBatch(),{batchId:'batch-ready',carrier:'Собственная машина'},actor),cancelled=deleteShipment(createdAgain.state,createdAgain.shipment.id,actor),position=cancelled.positions.find(item=>item.id==='p5');
  expect(cancelled.shipments).toHaveLength(0);
  expect(position.batches[0].status).toBe('Готово');
 });
});
