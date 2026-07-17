const clean=value=>String(value||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g,' ').trim();
const first=(source,patterns)=>{for(const pattern of patterns){const match=source.match(pattern);if(match?.[1])return clean(match[1])}return''};
const isoDate=value=>{if(!value)return'';const normalized=String(value).trim();const direct=normalized.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);if(direct)return`${direct[1]}-${direct[2].padStart(2,'0')}-${direct[3].padStart(2,'0')}`;const ru=normalized.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})/);if(ru)return`${ru[3]}-${ru[2].padStart(2,'0')}-${ru[1].padStart(2,'0')}`;const parsed=new Date(normalized);return Number.isNaN(parsed.getTime())?'':parsed.toISOString().slice(0,10)};
const meta=(html,name)=>first(html,[new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,'i'),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,'i')]);
const label=(plain,names)=>{for(const name of names){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=plain.match(new RegExp(`${escaped}\\s*[:№]?\\s*([^|;]{2,220}?)(?=\\s{2,}|(?:Заказчик|Организатор|Предмет|Наименование|Дата|Срок|Номер|Цена|Начальная цена|Подача заявок)\\s*[:№]|$)`,'i'));if(match?.[1])return match[1].trim()}return''};
const procedureId=url=>first(url,[/\/procedures\/(\d+)/i,/[?&](?:procedureId|id)=(\d+)/i]);

async function parseTekTorg(url,target){
 const id=procedureId(url);if(!id)throw new Error('Не удалось определить номер процедуры Tek-Torg.');
 const canonical=`https://www.tektorg.ru${target.pathname}`;
 const readerUrl=`https://r.jina.ai/http://${canonical.replace(/^https?:\/\//,'')}`;
 const response=await fetch(readerUrl,{headers:{accept:'text/plain','user-agent':'PromapparatTenderAdapter/1.0'}});
 if(!response.ok)throw new Error(`Адаптер Tek-Torg не получил страницу: ${response.status}.`);
 const source=await response.text();
 if(!source||/session|сеанс работы|защит[аы] от ботов|captcha|ddos/i.test(source))throw new Error('Tek-Torg не отдал данные даже через адаптер.');
 const plain=clean(source.replace(/[#*_`>\[\]()]/g,' '));
 const title=label(plain,['Наименование процедуры','Наименование закупки','Предмет закупки','Наименование'])||first(source,[/^Title:\s*(.+)$/mi,/^#\s+(.+)$/m]);
 const customer=label(plain,['Заказчик','Организатор закупки','Организатор','Наименование заказчика']);
 const deadlineRaw=label(plain,['Дата и время окончания подачи заявок','Окончание подачи заявок','Срок подачи заявок','Прием заявок до']);
 const publishRaw=label(plain,['Дата публикации','Дата размещения','Размещено','Опубликовано']);
 const notes=label(plain,['Описание','Краткое описание','Дополнительная информация']);
 const data={number:id,customer,title,date:isoDate(publishRaw)||new Date().toISOString().slice(0,10),deadline:isoDate(deadlineRaw),processBy:'',requestType:'Тендер',status:'Новая',sourceUrl:url,notes};
 const filled=Object.entries(data).filter(([,value])=>Boolean(value)).map(([key])=>key);
 if(!customer&&!title&&!deadlineRaw)throw new Error('Адаптер Tek-Torg открыл страницу, но не нашёл карточку процедуры.');
 return{data,filled,source:'Tek-Torg adapter'};
}

async function fetchHtml(url){
 const visited=new Set();let current=url;
 for(let step=0;step<6;step++){
  const normalized=current.replace(/^https:\/\/www\.tektorg\.ru/i,'https://tektorg.ru');
  if(visited.has(normalized))throw new Error('Площадка зациклила перенаправление.');
  visited.add(normalized);
  const response=await fetch(normalized,{redirect:'manual',headers:{'user-agent':'Mozilla/5.0 (compatible; PromapparatTenderParser/1.0)',accept:'text/html,application/xhtml+xml'}});
  if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');if(!location)throw new Error('Площадка вернула пустое перенаправление.');current=new URL(location,normalized).toString();continue}
  return response;
 }
 throw new Error('Слишком много перенаправлений.');
}

export async function onRequestPost({request}){
 try{
  const body=await request.json();const url=String(body?.url||'').trim();
  if(!/^https?:\/\//i.test(url))return Response.json({error:'Укажите корректную ссылку.'},{status:400});
  const target=new URL(url);if(['localhost','127.0.0.1','0.0.0.0'].includes(target.hostname)||target.hostname.endsWith('.local'))return Response.json({error:'Этот адрес недоступен.'},{status:400});
  if(/(^|\.)tektorg\.ru$/i.test(target.hostname)&&/\/procedures\//i.test(target.pathname))return Response.json(await parseTekTorg(url,target));
  const response=await fetchHtml(url);
  if(!response.ok)return Response.json({error:`Площадка вернула ошибку ${response.status}.`},{status:422});
  const type=response.headers.get('content-type')||'';if(!type.includes('text/html'))return Response.json({error:'По ссылке открывается не веб-страница.'},{status:422});
  const html=await response.text();if(html.length>5_000_000)return Response.json({error:'Страница слишком большая для обработки.'},{status:422});
  const plain=clean(html),title=meta(html,'og:title')||first(html,[/<h1[^>]*>([\s\S]*?)<\/h1>/i,/<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description=meta(html,'og:description')||meta(html,'description')||'';
  const number=label(plain,['Номер закупки','Номер извещения','Номер тендера','Закупка №','Извещение №','Номер процедуры'])||first(url, [/[?&](?:noticeId|purchaseNumber|tenderId|id)=([^&]+)/i,/\/(\d{6,})(?:\/|$|\?)/]);
  const customer=label(plain,['Заказчик','Наименование заказчика','Организатор закупки','Организатор']);
  const deadlineRaw=label(plain,['Окончание подачи заявок','Дата окончания подачи заявок','Срок подачи заявок','Прием заявок до','Дата и время окончания подачи']);
  const publishRaw=label(plain,['Дата публикации','Размещено','Дата размещения','Опубликовано']);
  const subject=label(plain,['Предмет закупки','Наименование закупки','Объект закупки'])||title;
  const data={number,customer,title:subject,date:isoDate(publishRaw)||new Date().toISOString().slice(0,10),deadline:isoDate(deadlineRaw),processBy:'',requestType:'Тендер',status:'Новая',sourceUrl:url,notes:description};
  return Response.json({data,filled:Object.entries(data).filter(([,value])=>Boolean(value)).map(([key])=>key),source:target.hostname});
 }catch(error){return Response.json({error:error?.message||'Не удалось обработать ссылку.'},{status:500})}
}