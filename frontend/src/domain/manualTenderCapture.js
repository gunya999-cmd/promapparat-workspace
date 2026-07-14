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

export function detectPlatformId(url,platforms=[]){
 const normalized=normalizeTenderUrl(url).toLowerCase();if(!normalized)return'';
 const direct=platforms.find(item=>{const candidate=normalizeTenderUrl(item.url).toLowerCase();return candidate&&normalized.includes(new URL(candidate).hostname)});if(direct)return direct.id;
 const hint=platformHints.find(item=>normalized.includes(item.pattern));if(!hint)return'';
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

export function analyzeTenderPaste(text,platforms=[]){
 const raw=trim(text),url=raw.match(URL_RE)?.[0]||'',lines=raw.split(/\r?\n/).map(trim).filter(Boolean),textLines=lines.filter(line=>!URL_RE.test(line));
 return{
  sourceUrl:normalizeTenderUrl(url),
  platformId:detectPlatformId(url,platforms),
  externalId:extractTenderReference(url),
  title:textLines[0]||'',
  customer:textLines.length>1?textLines[1]:'',
  originalText:raw
 };
}

export function buildManualTenderDraft(input,platforms=[],actor={}){
 const parsed=analyzeTenderPaste(input.pastedText||input.sourceUrl||'',platforms),customer=trim(input.customer||parsed.customer),title=trim(input.title||parsed.title),deadline=trim(input.deadline),sourceUrl=normalizeTenderUrl(input.sourceUrl||parsed.sourceUrl),attachments=(input.attachments||[]).map(file=>({name:trim(file.name),size:Number(file.size||0),type:trim(file.type),addedAt:new Date().toISOString()}));
 return{
  platformId:input.platformId||parsed.platformId||'',
  externalId:trim(input.externalId||parsed.externalId),
  customer:customer||'Заказчик не указан',
  title:title||'Новый тендер — уточнить предмет закупки',
  estimatedAmount:Math.max(0,Number(input.estimatedAmount||0)),
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
