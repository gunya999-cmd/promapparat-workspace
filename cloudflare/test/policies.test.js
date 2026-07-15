import test from'node:test';
import assert from'node:assert/strict';
import{isWorkspaceEmpty,mergeWorkspaceByRole,publicWorkspace,validateWorkspacePayload}from'../src/policies.js';

const current={works:[{id:'w1'}],settings:{targetMargin:15},formulas:[],users:[{id:'hidden'}],currentUser:{role:'director'},meta:{serverManaged:true}};

test('manager cannot modify financial or system sections',()=>{const result=mergeWorkspaceByRole(current,{works:[{id:'w2'}],settings:{targetMargin:1},users:[]},'manager');assert.deepEqual(result.data.works,[{id:'w2'}]);assert.equal(result.data.settings.targetMargin,15);assert.deepEqual(result.data.users,current.users);assert.deepEqual(result.changedSections,['works'])});

test('director cannot modify operational sections',()=>{const result=mergeWorkspaceByRole(current,{works:[],settings:{targetMargin:22},formulas:[{id:'f1'}]},'director');assert.deepEqual(result.data.works,current.works);assert.equal(result.data.settings.targetMargin,22);assert.deepEqual(result.data.formulas,[{id:'f1'}]);assert.deepEqual(result.changedSections,['settings','formulas'])});

test('public workspace injects server identity',()=>{const data=publicWorkspace({works:[]},{id:'u1',name:'Иванов',role:'manager',email:'m@example.ru'},[{id:'u1',name:'Иванов',role:'manager',active:1,email:'m@example.ru'}],7);assert.equal(data.currentUser.id,'u1');assert.equal(data.currentUser.role,'manager');assert.equal(data.meta.serverManaged,true);assert.equal(data.meta.serverRevision,7);assert.equal(data.users[0].email,undefined)});

test('payload validation enforces role section types',()=>{assert.deepEqual(validateWorkspacePayload({works:{}},'manager'),['works: ожидается массив']);assert.deepEqual(validateWorkspacePayload({settings:[]},'director'),['settings: ожидается объект'])});

test('empty workspace ignores settings but detects business data',()=>{assert.equal(isWorkspaceEmpty({works:[],settings:{targetMargin:15}}),true);assert.equal(isWorkspaceEmpty({works:[{id:'w1'}]}),false)});
