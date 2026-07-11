import{beforeEach,describe,expect,it}from'vitest';
import{createDemoWorkspace}from'../domain/workspace.js';
import{LocalWorkspaceRepository}from'./workspaceRepository.js';

class MemoryStorage{constructor(){this.values=new Map()}getItem(key){return this.values.has(key)?this.values.get(key):null}setItem(key,value){this.values.set(key,String(value))}removeItem(key){this.values.delete(key)}clear(){this.values.clear()}}

describe('workspace repository backups',()=>{
 let repository;
 beforeEach(()=>{globalThis.localStorage=new MemoryStorage();repository=new LocalWorkspaceRepository()});
 it('exports and imports a validated workspace',()=>{const original=createDemoWorkspace();original.works[0].customer='Проверочный заказчик';const text=repository.exportText(original),restored=repository.importText(text);expect(restored.works[0].customer).toBe('Проверочный заказчик');expect(restored.schemaVersion).toBe(4)});
 it('restores the latest local snapshot',()=>{const original=createDemoWorkspace();repository.snapshot(original,'test');const changed={...original,works:[],positions:[],documents:[],events:[]};repository.save(changed);const restored=repository.restoreBackup();expect(restored.works.length).toBe(original.works.length)});
 it('preserves intentionally empty collections',()=>{const data=createDemoWorkspace();data.works=[];data.positions=[];data.documents=[];data.events=[];repository.save(data);const loaded=repository.load();expect(loaded.works).toEqual([]);expect(loaded.positions).toEqual([]);expect(loaded.events).toEqual([])});
});
