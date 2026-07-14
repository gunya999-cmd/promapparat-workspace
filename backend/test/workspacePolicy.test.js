import test from'node:test';
import assert from'node:assert/strict';
import{buildBootstrapWorkspace,isWorkspaceEmpty,mergeWorkspaceByRole,publicWorkspace,validateBootstrapPayload,validateWorkspacePayload}from'../src/policies/workspacePolicy.js';

const current={works:[{id:'w1'}],settings:{targetMargin:15},formulas:[],users:[{id:'hidden'}],currentUser:{role:'director'},meta:{serverManaged:true}};

test('manager cannot modify financial or system sections',()=>{const result=mergeWorkspaceByRole(current,{works:[{id:'w2'}],settings:{targetMargin:1},users:[],currentUser:{role:'director'}},'manager');assert.deepEqual(result.data.works,[{id:'w2'}]);assert.equal(result.data.settings.targetMargin,15);assert.deepEqual(result.data.users,current.users);assert.equal(result.data.currentUser.role,'director');assert.deepEqual(result.changedSections,['works'])});

test('director cannot modify operational sections',()=>{const result=mergeWorkspaceByRole(current,{works:[],settings:{targetMargin:22},formulas:[{id:'f1'}]},'director');assert.deepEqual(result.data.works,current.works);assert.equal(result.data.settings.targetMargin,22);assert.deepEqual(result.data.formulas,[{id:'f1'}]);assert.deepEqual(result.changedSections,['settings','formulas'])});

test('public workspace injects authenticated identity and revision',()=>{const data=publicWorkspace({works:[]},{id:'u1',name:'Иванов',role:'manager',email:'m@example.ru'},[{id:'u1',name:'Иванов',role:'manager',active:true,email:'m@example.ru'}],7);assert.equal(data.currentUser.id,'u1');assert.equal(data.currentUser.role,'manager');assert.equal(data.meta.serverManaged,true);assert.equal(data.meta.serverRevision,7);assert.equal(data.users[0].email,undefined)});

test('bootstrap imports operational and financial sections but not client identity',()=>{const base={schemaVersion:10,works:[],positions:[],settings:{targetMargin:15},users:[{id:'server-user'}],currentUser:{id:'server-user'},meta:{serverManaged:true}},incoming={schemaVersion:10,works:[{id:'w2'}],positions:[{id:'p2'}],settings:{targetMargin:20},users:[{id:'client-user'}],currentUser:{id:'client-user'},meta:{revision:99}};const result=buildBootstrapWorkspace(base,incoming);assert.deepEqual(result.works,[{id:'w2'}]);assert.deepEqual(result.positions,[{id:'p2'}]);assert.equal(result.settings.targetMargin,20);assert.deepEqual(result.users,[{id:'server-user'}]);assert.equal(result.currentUser.id,'server-user');assert.ok(result.meta.bootstrappedAt)});

test('empty workspace detection ignores settings but detects business data',()=>{assert.equal(isWorkspaceEmpty({works:[],positions:[],settings:{targetMargin:15}}),true);assert.equal(isWorkspaceEmpty({works:[{id:'w1'}],positions:[]}),false)});

test('payload validation enforces section types',()=>{assert.deepEqual(validateWorkspacePayload({works:{}},'manager'),['works: ожидается массив']);assert.deepEqual(validateWorkspacePayload({settings:[]},'director'),['settings: ожидается объект']);assert.deepEqual(validateBootstrapPayload({works:[],settings:{}}),[])});
