import{describe,expect,it}from'vitest';
import{createDemoWorkspace}from'./workspace.js';
import{acceptOpportunity,createOpportunity,markPlatformChecked,rejectOpportunity,updateOpportunityQualification}from'./opportunities.js';

describe('Opportunity Engine',()=>{
 it('records a platform check',()=>{const state=createDemoWorkspace(),platform=state.platforms.find(item=>!item.checkedToday),next=markPlatformChecked(state,platform.id,state.currentUser);expect(next.platforms.find(item=>item.id===platform.id).checkedToday).toBe(true);expect(next.events[0].entityType).toBe('platform')});
 it('creates and qualifies an opportunity',()=>{const state=createDemoWorkspace(),result=createOpportunity(state,{platformId:state.platforms[0].id,customer:'Заказчик',title:'Клапаны',estimatedAmount:5000000},state.currentUser),qualified=updateOpportunityQualification(result.state,result.opportunity.id,{profileFit:true,manufacturerAvailable:true},state.currentUser),item=qualified.opportunities.find(entry=>entry.id===result.opportunity.id);expect(item.status).toBe('На оценке');expect(item.profileFit).toBe(true);expect(item.manufacturerAvailable).toBe(true)});
 it('requires a refusal reason',()=>{const state=createDemoWorkspace();expect(()=>rejectOpportunity(state,state.opportunities[0].id,'','',state.currentUser)).toThrow('Укажите причину отказа')});
 it('converts an opportunity into a linked work',()=>{const state=createDemoWorkspace(),id=state.opportunities[0].id,result=acceptOpportunity(state,id,state.currentUser),opportunity=result.state.opportunities.find(item=>item.id===id),work=result.state.works.find(item=>item.id===opportunity.workId);expect(opportunity.status).toBe('Взята в работу');expect(work.opportunityId).toBe(id);expect(work.customer).toBe(opportunity.customer)});
});
