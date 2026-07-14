import{describe,expect,it}from'vitest';
import{analyzeTenderPaste,buildManualTenderDraft,extractTenderReference}from'./manualTenderCapture.js';
import{createOpportunity}from'./opportunities.js';

const platforms=[{id:'pl-zakupki',name:'Zakupki.gov.ru',url:'https://zakupki.gov.ru'},{id:'pl-b2b',name:'B2B-Center',url:'https://www.b2b-center.ru'}],actor={id:'u-manager',name:'Иванов',role:'manager'};

describe('manual tender capture',()=>{
 it('extracts title, platform and reference from pasted browser text',()=>{const result=analyzeTenderPaste('Поставка шаровых кранов\nhttps://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789',platforms);expect(result.title).toBe('Поставка шаровых кранов');expect(result.platformId).toBe('pl-zakupki');expect(result.externalId).toBe('0123456789')});
 it('creates a safe incomplete draft from only a link',()=>{const draft=buildManualTenderDraft({pastedText:'https://www.b2b-center.ru/market/view.html?id=778899',attachments:[{name:'spec.xlsx',size:1200,type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}]},platforms,actor);expect(draft.owner).toBe('Иванов');expect(draft.platformId).toBe('pl-b2b');expect(draft.externalId).toBe('778899');expect(draft.captureIncomplete).toBe(true);expect(draft.customer).toBe('Заказчик не указан');expect(draft.attachments[0].name).toBe('spec.xlsx')});
 it('extracts a reference from a path when query parameters are absent',()=>{expect(extractTenderReference('https://example.ru/tender/ABC-123456')).toBe('ABC-123456')});
 it('rejects a duplicate source URL even when the second link has a hash',()=>{const state={opportunities:[],events:[]},draft=buildManualTenderDraft({pastedText:'Клапаны\nhttps://zakupki.gov.ru/epz/order/notice?regNumber=99887766',customer:'Заказчик',title:'Клапаны',deadline:'2026-08-01'},platforms,actor),first=createOpportunity(state,draft,actor);expect(()=>createOpportunity(first.state,{...draft,sourceUrl:`${draft.sourceUrl}#details`},actor)).toThrow('Этот тендер уже добавлен в систему')});
});
