import{describe,expect,it}from'vitest';
import{createDemoWorkspace}from'./workspace.js';
import{analyzeImportRows,guessColumnMapping,importSpecificationCommand,rollbackSpecificationImportCommand}from'./specificationImport.js';

describe('specification import',()=>{
 it('detects common Excel columns and skips duplicates',()=>{const headers=['№','Наименование','Кол-во','Ед. изм.'],mapping=guessColumnMapping(headers),state=createDemoWorkspace(),rows=[['1','Клапан запорный DN50 PN40','8','шт'],['2','Новая позиция','3','шт']];const analysis=analyzeImportRows(rows,mapping,state.positions.filter(position=>position.workId==='w1'));expect(mapping[1]).toBe('name');expect(mapping[2]).toBe('qty');expect(analysis[0].duplicate).toBe(true);expect(analysis[1].valid).toBe(true)});
 it('imports valid positions and rolls them back',()=>{const state=createDemoWorkspace(),mapping={0:'name',1:'qty',2:'unit'},analysis=analyzeImportRows([['Насос промышленный','2','шт']],mapping,[]),result=importSpecificationCommand(state,'w1',analysis,{fileName:'spec.xlsx',sheetName:'Лист1'},state.currentUser);expect(result.record.added).toBe(1);expect(result.state.positions.some(position=>position.importId===result.record.id)).toBe(true);const restored=rollbackSpecificationImportCommand(result.state,result.record.id,state.currentUser);expect(restored.positions.some(position=>position.importId===result.record.id)).toBe(false);expect(restored.specificationImports[0].rolledBackAt).toBeTruthy()});
 it('rejects rows without name or positive quantity',()=>{const analysis=analyzeImportRows([['',0]],{0:'name',1:'qty'},[]);expect(analysis[0].valid).toBe(false);expect(analysis[0].errors.length).toBe(2)});
});
