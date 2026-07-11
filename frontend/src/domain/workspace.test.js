import{describe,expect,it}from'vitest';
import{calculatePosition,createDemoWorkspace,deadlineBucket,nextWorkCode as missing,isPositionClosed,todayPlus}from'./workspace.js';
import{createWorkCommand,nextWorkCode}from'./commands.js';
import{migrateWorkspace,validateWorkspace}from'./schema.js';

describe('workspace calculations',()=>{
 it('does not silently choose the first supplier offer',()=>{
  const position={id:'p',workId:'w',name:'Test',qty:2,salePrice:150,status:'Не начато',offers:[{id:'o',supplierId:'s',price:100,selected:false,hasTkp:true}],batches:[]};
  const result=calculatePosition(position,[{id:'s',name:'Supplier'}],{targetMargin:15,vatRate:20});
  expect(result.selected).toBeNull();
  expect(result.purchase).toBeNull();
  expect(result.profit).toBeNull();
  expect(result.warnings).toContain('не выбрано предложение');
 });

 it('calculates gross margin and markup separately',()=>{
  const position={id:'p',workId:'w',name:'Test',qty:2,salePrice:150,status:'Цена рассчитана',logisticsCost:10,otherCosts:0,offers:[{id:'o',supplierId:'s',price:90,selected:true,hasTkp:true}],batches:[]};
  const result=calculatePosition(position,[{id:'s',name:'Supplier'}],{targetMargin:15,vatRate:20});
  expect(result.unitCost).toBe(100);
  expect(result.profit).toBe(100);
  expect(result.grossMargin).toBeCloseTo(33.333,2);
  expect(result.markup).toBeCloseTo(50,2);
 });

 it('marks closed positions as complete',()=>{
  const position={id:'p',workId:'w',name:'Test',qty:1,salePrice:0,status:'Закрыто',offers:[],batches:[]};
  const result=calculatePosition(position,[],{});
  expect(isPositionClosed(position)).toBe(true);
  expect(result.progress).toBe(100);
  expect(result.nextStep).toBe('Готово');
 });

 it('separates overdue, today and tomorrow deadlines',()=>{
  expect(deadlineBucket(todayPlus(-1))).toBe('overdue');
  expect(deadlineBucket(todayPlus(0))).toBe('today');
  expect(deadlineBucket(todayPlus(1))).toBe('tomorrow');
 });
});

describe('schema and commands',()=>{
 it('migrates old data and validates the result',()=>{
  const migrated=migrateWorkspace({works:[],positions:[],suppliers:[]});
  expect(migrated.schemaVersion).toBe(4);
  expect(Array.isArray(migrated.events)).toBe(true);
  expect(validateWorkspace(migrated).ok).toBe(true);
 });

 it('generates a monotonic work number independent of deletion',()=>{
  const state=createDemoWorkspace();
  state.counters.workSequence=11;
  state.works=state.works.slice(0,1);
  const result=nextWorkCode(state,new Date('2027-01-05T00:00:00Z'));
  expect(result.code).toBe('PA-2027-0012');
 });

 it('creates a work and a structured audit event together',()=>{
  const state=createDemoWorkspace();
  const actor=state.currentUser;
  const result=createWorkCommand(state,{customer:'Заказчик',title:'Новый тендер',source:'Тендер'},actor);
  expect(result.state.works[0].id).toBe(result.work.id);
  expect(result.state.events[0].entityType).toBe('work');
  expect(result.state.events[0].actorId).toBe(actor.id);
 });
});
