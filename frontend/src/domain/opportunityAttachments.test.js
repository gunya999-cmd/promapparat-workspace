import{describe,expect,it}from'vitest';
import{acceptOpportunity}from'./opportunities.js';
import{createDemoWorkspace}from'./workspace.js';

const actor={id:'u-manager-1',name:'Иванов',role:'manager'};

describe('tender attachments',()=>{
 it('moves captured files into the created deal and document register',()=>{
  const base=createDemoWorkspace(),attachment={storageKey:'local-spec-1',name:'specification.xlsx',size:42000,type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',storedLocally:true,addedAt:'2026-07-14T10:00:00.000Z'};
  const state={...base,opportunities:base.opportunities.map(item=>item.id==='opp-1'?{...item,attachments:[attachment],captureIncomplete:false}:item)};
  const result=acceptOpportunity(state,'opp-1',actor),document=result.state.documents.find(item=>item.workId===result.work.id);
  expect(result.work.tenderAttachments).toEqual([attachment]);
  expect(document).toMatchObject({name:'specification.xlsx',type:'Спецификация',storageKey:'local-spec-1',source:'tender-capture',storedLocally:true});
  expect(result.opportunity.workId).toBe(result.work.id);
 });
});
