import test from'node:test';
import assert from'node:assert/strict';
import{mergeWorkspaceByRole,publicWorkspace}from'../src/policies/workspacePolicy.js';

const current={works:[{id:'w1'}],settings:{targetMargin:15},formulas:[],users:[{id:'hidden'}],currentUser:{role:'director'},meta:{serverManaged:true}};

test('manager cannot modify financial or system sections',()=>{const result=mergeWorkspaceByRole(current,{works:[{id:'w2'}],settings:{targetMargin:1},users:[],currentUser:{role:'director'}},'manager');assert.deepEqual(result.data.works,[{id:'w2'}]);assert.equal(result.data.settings.targetMargin,15);assert.deepEqual(result.data.users,current.users);assert.equal(result.data.currentUser.role,'director');assert.deepEqual(result.changedSections,['works'])});

test('director cannot modify operational sections',()=>{const result=mergeWorkspaceByRole(current,{works:[],settings:{targetMargin:22},formulas:[{id:'f1'}]},'director');assert.deepEqual(result.data.works,current.works);assert.equal(result.data.settings.targetMargin,22);assert.deepEqual(result.data.formulas,[{id:'f1'}]);assert.deepEqual(result.changedSections,['settings','formulas'])});

test('public workspace injects authenticated identity',()=>{const data=publicWorkspace({works:[]},{id:'u1',name:'Иванов',role:'manager',email:'m@example.ru'},[{id:'u1',name:'Иванов',role:'manager',active:true,email:'m@example.ru'}]);assert.equal(data.currentUser.id,'u1');assert.equal(data.currentUser.role,'manager');assert.equal(data.meta.serverManaged,true);assert.equal(data.users[0].email,undefined)});
