import{describe,expect,it}from'vitest';
import{createDemoWorkspace}from'./workspace.js';
import{createProductionBatch,deleteProductionBatch,updateProductionBatch}from'./production.js';

const actor={id:'u-manager-1',name:'Иванов',role:'manager'};

describe('production workflow',()=>{
 it('creates a production batch and updates the deal',()=>{
  const state=createDemoWorkspace(),result=createProductionBatch(state,{positionId:'p5',qty:2,readyDate:'2026-08-01',place:'Завод'},actor),work=result.state.works.find(item=>item.id==='w3');
  expect(result.batch.status).toBe('В производстве');
  expect(result.state.positions.find(item=>item.id==='p5').batches).toHaveLength(1);
  expect(work.state).toBe('Производство');
  expect(work.nextAction).toContain('Контролировать производство');
 });
 it('marks a ready party for shipment and preserves empty production stage after deletion',()=>{
  const state=createDemoWorkspace(),created=createProductionBatch(state,{positionId:'p5',qty:2,readyDate:'2026-08-01'},actor),ready=updateProductionBatch(created.state,'p5',created.batch.id,{status:'Готово'},actor),readyWork=ready.works.find(item=>item.id==='w3');
  expect(readyWork.state).toBe('Отгрузка');
  expect(readyWork.nextAction).toContain('Организовать отгрузку');
  const createdAgain=createProductionBatch(state,{positionId:'p5',qty:2,readyDate:'2026-08-01'},actor),deleted=deleteProductionBatch(createdAgain.state,'p5',createdAgain.batch.id,actor),emptyWork=deleted.works.find(item=>item.id==='w3');
  expect(emptyWork.state).toBe('Производство');
  expect(emptyWork.nextAction).toBe('Создать производственные партии');
 });
});
