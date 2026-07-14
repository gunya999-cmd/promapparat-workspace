import{describe,expect,it}from'vitest';
import{normalizeWorkspace}from'./workspace.js';
import{validateWorkspace}from'./schema.js';

describe('role compatibility',()=>{
 it('normalizes legacy admin and head roles to director',()=>{
  const data=normalizeWorkspace({schemaVersion:10,currentUser:{id:'old-admin',name:'Старый администратор',role:'admin'},users:[{id:'old-admin',name:'Старый администратор',role:'admin',active:true},{id:'old-head',name:'Руководитель',role:'head',active:true},{id:'manager',name:'Менеджер',role:'manager',active:true}],works:[],suppliers:[],positions:[],documents:[],tasks:[],customers:[],events:[],formulas:[],formulaImports:[],specificationImports:[],platforms:[],opportunities:[],platformChecks:[],supplierRequests:[],quotes:[],shipments:[],invoices:[]});
  expect(data.currentUser.role).toBe('director');
  expect(data.users.find(user=>user.id==='old-admin').role).toBe('director');
  expect(data.users.find(user=>user.id==='old-head').role).toBe('director');
  expect(data.users.find(user=>user.id==='manager').role).toBe('manager');
  expect(validateWorkspace(data).ok).toBe(true);
 });
});
