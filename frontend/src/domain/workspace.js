export const STORAGE_KEY='promapparat_workspace_sprint65';
export const SOURCES=['Тендер','Сайт','Холодный звонок','Повторный клиент','Email','Другое'];
export const WORK_STATES=['Новая','Анализ','Решение участвовать','Расчет','Ожидаем ТКП','КП готовится','КП отправлено','Переговоры','Договор','Производство','Отгрузка','Закрыто успешно','Закрыто проиграно','Архив'];
export const POSITION_STATES=['Не начато','Нужен поставщик','Запрос отправлен','Ожидаем ТКП','ТКП получено','Цена рассчитана','В КП','Заказано','В производстве','Готово досрочно','Готово','Частично отгружено','Отгружено','Закрыто'];
export const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
export const money=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Number(v||0))+' ₽';
export const pct=v=>v==null||Number.isNaN(Number(v))?'—':`${Number(v).toFixed(1)}%`;
export const todayPlus=d=>new Date(Date.now()+d*86400000).toISOString().slice(0,10);
export const daysLeft=d=>d?Math.ceil((new Date(d)-new Date())/86400000):999;
const minutesAgo=value=>new Date(Date.now()-value*60000).toISOString();

export const createDemoWorkspace=()=>({
 works:[
  {id:'w1',code:'PA-2026-0001',title:'Клапаны 46 шт',source:'Тендер',customer:'НкНПЗ',objectName:'Клапаны и запорная арматура',manager:'Иванов',deadline:todayPlus(1),state:'Расчет'},
  {id:'w2',code:'PA-2026-0002',title:'Расходомеры и КИП',source:'Тендер',customer:'СИБУР',objectName:'Модернизация линии учета',manager:'Петров',deadline:todayPlus(3),state:'Ожидаем ТКП'},
  {id:'w3',code:'PA-2026-0003',title:'Регулирующая арматура',source:'Сайт',customer:'ООО СеверХим',objectName:'Производственный участок',manager:'Иванов',deadline:todayPlus(7),state:'Новая'}],
 suppliers:[
  {id:'s1',name:'ООО Арматура-Сервис',city:'Москва',contact:'Алексей',phone:'+7 900 111-22-33'},
  {id:'s2',name:'Завод ПромКлапан',city:'Санкт-Петербург',contact:'Ирина',phone:'+7 900 222-33-44'},
  {id:'s3',name:'ТД КИП Комплект',city:'Екатеринбург',contact:'Олег',phone:'+7 900 333-44-55'}],
 positions:[
  {id:'p1',workId:'w1',rowNo:1,group:'Клапаны',name:'Клапан запорный DN50 PN40',qty:8,unit:'шт',salePrice:24800,status:'Цена рассчитана',offers:[{id:'o1',supplierId:'s1',price:18500,productionDays:15,deliveryDays:3,shipmentPlace:'Москва',paymentTerms:'50% предоплата',hasTkp:true,selected:true},{id:'o2',supplierId:'s2',price:17900,productionDays:25,deliveryDays:5,shipmentPlace:'Санкт-Петербург',paymentTerms:'100% предоплата',hasTkp:true,selected:false},{id:'o3',supplierId:'s3',price:20100,productionDays:0,deliveryDays:2,shipmentPlace:'Екатеринбург',paymentTerms:'Постоплата 10 дней',hasTkp:false,selected:false}],batches:[{id:'b1',qty:3,readyDate:todayPlus(8),shipDate:'',place:'Москва',status:'В производстве'},{id:'b2',qty:5,readyDate:todayPlus(15),shipDate:'',place:'Москва',status:'Запланировано'}]},
  {id:'p2',workId:'w1',rowNo:2,group:'Клапаны',name:'Клапан обратный DN100 PN16',qty:12,unit:'шт',salePrice:36000,status:'ТКП получено',offers:[{id:'o4',supplierId:'s2',price:31200,productionDays:25,deliveryDays:5,shipmentPlace:'Санкт-Петербург',paymentTerms:'70% предоплата',hasTkp:true,selected:true}],batches:[]},
  {id:'p3',workId:'w1',rowNo:3,group:'Арматура',name:'Задвижка клиновая DN150 PN16',qty:6,unit:'шт',salePrice:'',status:'Нужен поставщик',offers:[],batches:[]},
  {id:'p4',workId:'w2',rowNo:1,group:'КИП',name:'Расходомер электромагнитный DN80',qty:4,unit:'шт',salePrice:'',status:'Ожидаем ТКП',offers:[{id:'o5',supplierId:'s3',price:94000,productionDays:20,deliveryDays:4,shipmentPlace:'Екатеринбург',paymentTerms:'50/50',hasTkp:false,selected:true}],batches:[]},
  {id:'p5',workId:'w3',rowNo:1,group:'Регулирующая арматура',name:'Клапан регулирующий DN25',qty:2,unit:'шт',salePrice:'',status:'Не начато',offers:[],batches:[]}],
 documents:[],tasks:[],customers:[],
 events:[
  {id:'e1',workId:'w1',positionId:'p1',type:'price',title:'Рассчитана цена продажи',detail:'24 800 ₽ за единицу',author:'Иванов',createdAt:minutesAgo(35)},
  {id:'e2',workId:'w1',positionId:'p1',supplierId:'s1',type:'offer',title:'Выбрано предложение поставщика',detail:'ООО Арматура-Сервис · 18 500 ₽ · срок 18 дней',author:'Иванов',createdAt:minutesAgo(70)},
  {id:'e3',workId:'w1',positionId:'p1',supplierId:'s1',type:'document',title:'Получено ТКП',detail:'Предложение от ООО Арматура-Сервис',author:'Иванов',createdAt:minutesAgo(105)},
  {id:'e4',workId:'w1',positionId:'p3',type:'position',title:'Добавлена позиция',detail:'Задвижка клиновая DN150 PN16 · 6 шт',author:'Иванов',createdAt:minutesAgo(180)},
  {id:'e5',workId:'w1',type:'work',title:'Создан тендер',detail:'НкНПЗ — Клапаны 46 шт',author:'Иванов',createdAt:minutesAgo(260)},
  {id:'e6',workId:'w2',positionId:'p4',type:'offer',title:'Отправлен запрос поставщику',detail:'ТД КИП Комплект · расходомер DN80',author:'Петров',createdAt:minutesAgo(50)},
  {id:'e7',workId:'w2',type:'work',title:'Создан тендер',detail:'СИБУР — Расходомеры и КИП',author:'Петров',createdAt:minutesAgo(320)},
  {id:'e8',workId:'w3',type:'work',title:'Создана входящая заявка',detail:'ООО СеверХим · источник: сайт',author:'Иванов',createdAt:minutesAgo(90)}]
});

export function normalizeWorkspace(data){
 const base=createDemoWorkspace();
 return{...base,...data,works:data?.works||base.works,suppliers:data?.suppliers||base.suppliers,positions:(data?.positions||base.positions).map(position=>({...position,offers:position.offers||[],batches:position.batches||[]})),documents:data?.documents||[],tasks:data?.tasks||[],customers:data?.customers||[],events:data?.events||base.events};
}

export function calculatePosition(position,suppliers){
 const offers=(position.offers||[]).map(offer=>({...offer,supplier:suppliers.find(supplier=>supplier.id===offer.supplierId)}));
 const selected=offers.find(offer=>offer.selected)||offers[0]||null;
 const purchase=Number(selected?.price||0),sale=Number(position.salePrice||0),qty=Number(position.qty||0);
 const profit=(sale-purchase)*qty,margin=sale?((sale-purchase)/sale)*100:null;
 const readyQty=(position.batches||[]).filter(batch=>['Готово','Отгружено'].includes(batch.status)).reduce((sum,batch)=>sum+Number(batch.qty||0),0);
 const shippedQty=(position.batches||[]).filter(batch=>batch.status==='Отгружено').reduce((sum,batch)=>sum+Number(batch.qty||0),0);
 const warnings=[];
 if(!offers.length)warnings.push('нет предложений');
 if(offers.length&&!offers.some(offer=>offer.hasTkp))warnings.push('нет ТКП');
 if(!sale)warnings.push('нет цены продажи');
 if(margin!==null&&margin<15)warnings.push('низкая маржа');
 const progress=Math.min(100,(position.name?15:0)+(qty?10:0)+(offers.length?20:0)+(offers.some(offer=>offer.hasTkp)?15:0)+(purchase?10:0)+(sale?15:0)+(selected?.shipmentPlace?10:0)+(position.status?5:0));
 const nextStep=!offers.length?'Добавить предложение':!offers.some(offer=>offer.hasTkp)?'Получить ТКП':!sale?'Рассчитать продажу':margin!==null&&margin<15?'Согласовать цену':'Готово к КП';
 return{...position,offers,selected,purchase,sale,profit,margin,progress,warnings,nextStep,readyQty,shippedQty};
}

export function calculateWork(work,positions,suppliers){
 const list=positions.filter(position=>position.workId===work.id).map(position=>calculatePosition(position,suppliers));
 const progress=list.length?Math.round(list.reduce((sum,position)=>sum+position.progress,0)/list.length):0;
 const blockers=list.filter(position=>position.warnings.length).length;
 const waiting=list.filter(position=>position.offers.length&&!position.offers.some(offer=>offer.hasTkp)).length;
 const noOffers=list.filter(position=>!position.offers.length).length;
 const saleTotal=list.reduce((sum,position)=>sum+position.sale*position.qty,0),purchaseTotal=list.reduce((sum,position)=>sum+position.purchase*position.qty,0);
 const nextAction=noOffers?`Найти поставщиков для ${noOffers} поз.`:waiting?`Получить ${waiting} ТКП`:list.some(position=>!position.sale)?'Рассчитать цены продажи':'Сформировать КП';
 return{...work,positions:list,progress,blockers,waiting,noOffers,nextAction,totals:{saleTotal,purchaseTotal,profit:saleTotal-purchaseTotal}};
}
