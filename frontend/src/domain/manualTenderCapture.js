const trim=value=>String(value??'').trim();
const URL_RE=/https?:\/\/[^\s<>"']+/i;

const platformHints=[
 {pattern:'zakupki.gov.ru',terms:['zakupki','госзакуп']},
 {pattern:'b2b-center.ru',terms:['b2b-center','b2b']},
 {pattern:'etpgpb.ru',terms:['газпромбанк','гпб']},
 {pattern:'tektorg.ru',terms:['тэк-торг','тек-торг']},
 {pattern:'rosneft',terms:['роснефть']},
 {pattern:'sibur',terms:['сибур']}
];

export const normalizeTenderUrl=value=>{const raw=trim(value);if(!raw)return'';try{const url=new URL(raw);url.hash='';return url.toString()}catch{return raw}};

export function detectPlatformId(value,platforms=[]){
 const normalized=trim(value).toLowerCase();if(!normalized)return'';
 const direct=platforms.find(item=>{const candidate=normalizeTenderUrl(item.url).toLowerCase();if(!candidate)return false;try{return normalized.includes(new URL(candidate).hostname)}catch{return false}});if(direct)return direct.id;
 const hint=platformHints.find(item=>normalized.includes(item.pattern)||item.terms.some(term=>normalized.includes(term)));if(!hint)return'';
 return platforms.find(item=>hint.terms.some(term=>`${item.name} ${item.url}`.toLowerCase().includes(term)))?.id||'';
}

export function extractTenderReference(url){
 const normalized=normalizeTenderUrl(url);if(!normalized)return'';
 try{
  const parsed=new URL(normalized),keys=['regNumber','purchaseNumber','noticeInfoId','auctionId','tenderId','number','id'];
  for(const key of keys){const value=trim(parsed.searchParams.get(key));if(value&&/[0-9]/.test(value))return value}
  const segments=parsed.pathname.split('/').filter(Boolean).reverse();
  return segments.find(segment=>/[0-9]/.test(segment)&&segment.length>=5)?.replace(/\.(html?|aspx?)$/i,'')||'';
 }catch{return''}
}

const lineValue=(raw,labels)=>{const pattern=new RegExp(`(?:^|\\n)\\s*(?:${labels.join('|')})\\s*[:№#–—-]+\\s*(.+)`,`i`),match=raw.match(pattern);return trim(match?.[1]?.split(/\r?\n/)[0])};
const normalizeDate=value=>{const raw=trim(value);if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;const match=raw.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);return match?`${match[3]}-${match[2]}-${match[1]}`:''};
const extractAmount=raw=>{const cleaned=raw.replace(/\u00a0/g,' '),match=cleaned.match(/(?:нмцк|начальная(?:\s+максимальная)?\s+цена|ориентировочная\s+сумма|сумма\s+закупки)\D{0,30}([\d][\d\s]*(?:[.,]\d+)?)/i);return match?Number(match[1].replace(/\s/g,'').replace(',','.'))||0:0};

export function analyzeTenderPaste(text,platforms=[]){
 const raw=trim(text),url=raw.match(URL_RE)?.[0]||'',lines=raw.split(/\r?\n/).map(trim).filter(Boolean),textLines=lines.filter(line=>!URL_RE.test(line)),labelledTitle=lineValue(raw,['предмет закупки','наименование закупки','наименование']),customer=lineValue(raw,['заказчик','организатор','покупатель']),deadlineRaw=lineValue(raw,['срок подачи','окончание подачи','дедлайн','прием заявок до']),reference=lineValue(raw,['номер процедуры','номер закупки','номер извещения','извещение']);
 const title=labelledTitle||textLines.find(line=>! /^(заказчик|организатор|покупатель|нмцк|начальная цена|сумма закупки|срок подачи|окончание подачи|дедлайн|номер процедуры|номер закупки|номер извещения)/i.test(line))||'';
 return{
  sourceUrl:normalizeTenderUrl(url),
  platformId:detectPlatformId(raw,platforms),
  externalId:extractTenderReference(url)||reference,
  title,
  customer,
  estimatedAmount:extractAmount(raw),
  deadline:normalizeDate(deadlineRaw),
  originalText:raw
 };
}

export function buildManualTenderDraft(input,platforms=[],actor={}){
 const parsed=analyzeTenderPaste(input.pastedText||input.sourceUrl||'',platforms),customer=trim(input.customer||parsed.customer),title=trim(input.title||parsed.title),deadline=trim(input.deadline||parsed.deadline),sourceUrl=normalizeTenderUrl(input.sourceUrl||parsed.sourceUrl),attachments=(input.attachments||[]).map(file=>({storageKey:trim(file.storageKey),name:trim(file.name),size:Number(file.size||0),type:trim(file.type),addedAt:file.addedAt||new Date().toISOString(),storedLocally:file.storedLocally!==false,storageError:trim(file.storageError)}));
 return{
  platformId:input.platformId||parsed.platformId||'',
  externalId:trim(input.externalId||parsed.externalId),
  customer:customer||'Заказчик не указан',
  title:title||'Новый тендер — уточнить предмет закупки',
  estimatedAmount:Math.max(0,Number(input.estimatedAmount||parsed.estimatedAmount||0)),
  deadline,
  owner:actor?.name||trim(input.owner)||'Менеджер',
  notes:trim(input.notes),
  sourceUrl,
  captureMethod:'manual',
  captureIncomplete:!customer||!title||!deadline,
  attachments,
  originalCaptureText:trim(input.pastedText||parsed.originalText)
 };
}
