import{describe,expect,it}from'vitest';
import{createDemoWorkspace,calculateWork}from'./workspace.js';
import{buildDirectorAnalytics}from'./directorAnalytics.js';

describe('director analytics',()=>{
 it('aggregates opportunities, projects, managers and platforms',()=>{const data=createDemoWorkspace(),works=data.works.map(work=>calculateWork(work,data.positions,data.suppliers,data.settings,data.formulas)),result=buildDirectorAnalytics({data,works});expect(result.summary.found).toBe(data.opportunities.length);expect(result.pipeline.length).toBeGreaterThan(4);expect(result.managers.length).toBeGreaterThan(0);expect(result.platforms.length).toBe(data.platforms.length)});
 it('keeps risk records linked to source projects',()=>{const data=createDemoWorkspace(),works=data.works.map(work=>calculateWork(work,data.positions,data.suppliers,data.settings,data.formulas)),result=buildDirectorAnalytics({data,works});for(const risk of result.risks)expect(works.some(work=>work.id===risk.id)).toBe(true)});
});
