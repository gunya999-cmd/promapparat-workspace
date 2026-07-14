import{describe,expect,it}from'vitest';
import{analyzeTenderPaste,buildManualTenderDraft,extractTenderReference}from'./manualTenderCapture.js';

const platforms=[{id:'pl-zakupki',name:'Zakupki.gov.ru',url:'https://zakupki.gov.ru'},{id:'pl-b2b',name:'B2B-Center',url:'https://www.b2b-center.ru'}];

describe('manual tender capture',()=>{
 it('extracts title, platform and reference from pasted browser text',()=>{const result=analyzeTenderPaste('Поставка шаровых кранов\nhttps://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=0123456789',platforms);expect(result.title).toBe('Поставка шаровых кранов');expect(result.platformId).toBe('pl-zakupki');expect(result.externalId).toBe('0123456789')});
 it('creates a safe incomplete draft from only a link',()=>{const draft=buildManualTenderDraft({pastedText:'https://www.b2b-center.ru/market/view.html?id=778899'},platforms,{name:'Иванов'});expect(draft.owner).toBe('Иванов');expect(draft.platformId).toBe('pl-b2b');expect(draft.externalId).toBe('778899');expect(draft.captureIncomplete).toBe(true);expect(draft.customer).toBe('Заказчик не указан')});
 it('extracts a reference from a path when query parameters are absent',()=>{expect(extractTenderReference('https://example.ru/tender/ABC-123456')).toBe('ABC-123456')});
});
