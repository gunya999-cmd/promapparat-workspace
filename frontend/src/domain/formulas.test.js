import{describe,expect,it}from'vitest';
import{createManualFormula,evaluateFormula,isFormulaEffective,publishFormula,unpublishFormula}from'./formulas.js';

describe('formula lifecycle',()=>{
 it('publishes a valid formula only after validation',()=>{const formula=createManualFormula();formula.inputs=[{ref:'A2',value:100},{ref:'B2',value:150}];const published=publishFormula(formula,{id:'admin'});expect(published.status).toBe('published');expect(published.active).toBe(true);expect(published.publishedBy).toBe('admin');expect(isFormulaEffective(published,new Date('2026-07-11T12:00:00Z'))).toBe(true)});
 it('rejects invalid formulas',()=>{const formula={...createManualFormula(),expression:'=UNSUPPORTED(A2)'};expect(()=>publishFormula(formula,{id:'admin'})).toThrow('Формулу нельзя опубликовать')});
 it('rejects unsupported horizontal ranges instead of replacing them with zero',()=>{const formula={...createManualFormula(),expression:'=SUM(B2:E2)',inputs:[{ref:'B2',value:1},{ref:'C2',value:2},{ref:'D2',value:3},{ref:'E2',value:4}]};const result=evaluateFormula(formula);expect(result.ok).toBe(false);expect(result.error).toContain('Неподдерживаемый диапазон')});
 it('rejects missing referenced cells',()=>{const formula={...createManualFormula(),expression:'=A2+B2',inputs:[{ref:'A2',value:1}]};const result=evaluateFormula(formula);expect(result.ok).toBe(false);expect(result.error).toContain('B2')});
 it('respects formula validity dates and unpublishing',()=>{const formula={...createManualFormula(),inputs:[{ref:'A2',value:100},{ref:'B2',value:150}],validFrom:'2026-08-01',validTo:'2026-08-31'},published=publishFormula(formula,{id:'admin'});expect(isFormulaEffective(published,new Date('2026-07-11T12:00:00Z'))).toBe(false);expect(isFormulaEffective(published,new Date('2026-08-15T12:00:00Z'))).toBe(true);expect(unpublishFormula(published).active).toBe(false)});
});
