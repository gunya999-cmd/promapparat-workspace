import{describe,expect,it}from'vitest';
import{normalizeWorkspaceUsers,userForRole}from'./users.js';

describe('workspace users',()=>{
 it('repairs a workspace that only contains a director',()=>{
  const state=normalizeWorkspaceUsers({users:[{id:'d1',name:'Директор',role:'director',active:true}],currentUser:{id:'d1',name:'Директор',role:'director'},works:[{id:'w1',manager:'Иванов'}],opportunities:[]});
  expect(state.users.some(user=>user.role==='director')).toBe(true);
  expect(state.users.some(user=>user.role==='manager'&&user.name==='Иванов')).toBe(true);
  expect(userForRole(state,'manager')?.name).toBe('Иванов');
 });

 it('creates a fallback manager when operational data has no owner',()=>{
  const state=normalizeWorkspaceUsers({users:[],works:[],opportunities:[]});
  expect(userForRole(state,'director')).toBeTruthy();
  expect(userForRole(state,'manager')).toBeTruthy();
 });
});
