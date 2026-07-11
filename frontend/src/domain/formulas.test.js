import{describe,expect,it}from'vitest';
import{createManualFormula,isFormulaEffective,publishFormula,unpublishFormula}from'./formulas.js';

describe('formula lifecycle',()=>{
 it('publishes a valid formula only after validation',()=>{
  const formula=createManualFormula();
  formula.inputs=[{ref:'A2',value:100},{ref:'B2',value:150}];
  const published=publishFormula(formula,{id:'admin'});
  expect(published.status).toBe('published');
  expect(published.active).toBe(true);
  expect(published.publishedBy).toBe('admin');
  expect(isFormulaEffective(published,new Date('2026-07-11T12:00:00Z'))).toBe(true);
 });

 it('rejects invalid formulas',()=>{
  const formula={...createManualFormula(),expression:'=UNSUPPORTED(A2)'};
  expect(()=>publishFormula(formula,{id:'admin'})).toThrow('Формулу нельзя опубликовать');
 });

 it('respects formula validity dates and unpublishing',()=>{
  const formula={...createManualFormula(),inputs:[{ref:'A2',value:100},{ref:'B2',value:150}],validFrom:'2026-08-01',validTo:'2026-08-31'};
  const published=publishFormula(formula,{id:'admin'});
  expect(isFormulaEffective(published,new Date('2026-07-11T12:00:00Z'))).toBe(false);
  expect(isFormulaEffective(published,new Date('2026-08-15T12:00:00Z'))).toBe(true);
  expect(unpublishFormula(published).active).toBe(false);
 });
});
