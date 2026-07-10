import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, CheckCircle2, Clock3, FileText, Filter, Plus, Save, Search, Trash2, X, Zap, ClipboardList, PackageCheck, Phone, Mail, Target, CircleDollarSign } from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'promapparat_workspace_sprint5';
const SOURCES = ['Тендер', 'Сайт', 'Холодный звонок', 'Повторный клиент', 'Email', 'Другое'];
const WORK_STATES = ['Новая', 'Анализ', 'Решение участвовать', 'Расчет', 'Ожидаем ТКП', 'КП готовится', 'КП отправлено', 'Переговоры', 'Договор', 'Производство', 'Отгрузка', 'Закрыто успешно', 'Закрыто проиграно', 'Архив'];
const POSITION_STATES = ['Не начато', 'Нужен поставщик', 'Запрос отправлен', 'Ожидаем ТКП', 'ТКП получено', 'Цена рассчитана', 'В КП', 'Заказано', 'В производстве', 'Готово досрочно', 'Готово', 'Частично отгружено', 'Отгружено', 'Закрыто'];

const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
const money = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v || 0)) + ' ₽';
const pct = (v) => v == null || Number.isNaN(Number(v)) ? '—' : `${Number(v).toFixed(1)}%`;
const todayPlus = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const daysLeft = (date) => date ? Math.ceil((new Date(date) - new Date()) / 86400000) : 999;

const demoData = () => ({
  works: [
    { id:'w1', code:'PA-2026-0001', title:'Клапаны 46 шт', source:'Тендер', customer:'НкНПЗ', objectName:'Клапаны и запорная арматура', manager:'Иванов', deadline:todayPlus(1), state:'Расчет', comment:'Объемная заявка' },
    { id:'w2', code:'PA-2026-0002', title:'Расходомеры и КИП', source:'Тендер', customer:'СИБУР', objectName:'Модернизация линии учета', manager:'Петров', deadline:todayPlus(3), state:'Ожидаем ТКП', comment:'' },
    { id:'w3', code:'PA-2026-0003', title:'Регулирующая арматура', source:'Сайт', customer:'ООО СеверХим', objectName:'Производственный участок', manager:'Иванов', deadline:todayPlus(7), state:'Новая', comment:'Входящая заявка' }
  ],
  suppliers: [
    { id:'s1', name:'ООО Арматура-Сервис', city:'Москва', contact:'Алексей', phone:'+7 900 111-22-33' },
    { id:'s2', name:'Завод ПромКлапан', city:'Санкт-Петербург', contact:'Ирина', phone:'+7 900 222-33-44' },
    { id:'s3', name:'ТД КИП Комплект', city:'Екатеринбург', contact:'Олег', phone:'+7 900 333-44-55' }
  ],
  documents: [
    { id:'d1', workId:'w1', positionId:null, type:'ТЗ', name:'Техническое задание НкНПЗ.pdf' },
    { id:'d2', workId:'w1', positionId:'p1', type:'ТКП', name:'ТКП Арматура-Сервис.pdf' },
    { id:'d3', workId:'w2', positionId:null, type:'ТЗ', name:'Ведомость КИП.xlsx' }
  ],
  positions: [
    { id:'p1', workId:'w1', rowNo:1, group:'Клапаны', name:'Клапан запорный DN50 PN40', qty:8, unit:'шт', supplierId:'s1', purchasePrice:18500, salePrice:24800, productionDays:15, deliveryDays:3, shipmentPlace:'Москва', status:'Цена рассчитана', comment:'' },
    { id:'p2', workId:'w1', rowNo:2, group:'Клапаны', name:'Клапан обратный DN100 PN16', qty:12, unit:'шт', supplierId:'s2', purchasePrice:31200, salePrice:36000, productionDays:25, deliveryDays:5, shipmentPlace:'Санкт-Петербург', status:'ТКП получено', comment:'Проверить маржу' },
    { id:'p3', workId:'w1', rowNo:3, group:'Арматура', name:'Задвижка клиновая DN150 PN16', qty:6, unit:'шт', supplierId:'', purchasePrice:'', salePrice:'', productionDays:'', deliveryDays:'', shipmentPlace:'', status:'Нужен поставщик', comment:'' },
    { id:'p4', workId:'w2', rowNo:1, group:'КИП', name:'Расходомер электромагнитный DN80', qty:4, unit:'шт', supplierId:'s3', purchasePrice:94000, salePrice:'', productionDays:20, deliveryDays:'', shipmentPlace:'Екатеринбург', status:'Ожидаем ТКП', comment:'' },
    { id:'p5', workId:'w3', rowNo:1, group:'Регулирующая арматура', name:'Клапан регулирующий DN25', qty:2, unit:'шт', supplierId:'', purchasePrice:'', salePrice:'', productionDays:'', deliveryDays:'', shipmentPlace:'', status:'Не начато', comment:'' }
  ]
});

function calcPosition(p, docs) {
  const hasTkp = docs.some(d => d.positionId === p.id && d.type === 'ТКП');
  const qty = Number(p.qty || 0), purchase = Number(p.purchasePrice || 0), sale = Number(p.salePrice || 0);
  const purchaseTotal = purchase * qty, saleTotal = sale * qty, profit = saleTotal - purchaseTotal;
  const margin = saleTotal ? profit / saleTotal * 100 : null;
  let progress = (p.name?10:0)+(qty?10:0)+(p.supplierId?15:0)+(hasTkp?15:0)+(purchase?15:0)+(sale?15:0)+((p.productionDays||p.deliveryDays)?10:0)+(p.shipmentPlace?10:0);
  const warnings = [];
  if (!p.supplierId) warnings.push('нет поставщика');
  if (!purchase) warnings.push('нет закупки');
  if (!sale) warnings.push('нет продажи');
  if (!p.productionDays && !p.deliveryDays) warnings.push('нет срока');
  if (!p.shipmentPlace) warnings.push('нет отгрузки');
  if (!hasTkp) warnings.push('нет ТКП');
  if (margin !== null && margin < 15) warnings.push('низкая маржа');
  const nextStep = !p.supplierId ? 'Найти поставщика' : !hasTkp ? 'Получить ТКП' : !purchase ? 'Внести закупку' : !sale ? 'Рассчитать продажу' : (!p.productionDays&&!p.deliveryDays) ? 'Уточнить срок' : margin!==null&&margin<15 ? 'Согласовать цену' : 'Готово к КП';
  const tone = nextStep === 'Готово к КП' ? 'ready' : warnings.includes('низкая маржа') ? 'danger' : warnings.length > 2 ? 'warning' : 'progressing';
  return { ...p, qty, purchase, sale, purchaseTotal, saleTotal, profit, margin, progress, warnings, hasTkp, nextStep, tone };
}

function calcWork(work, positions, docs) {
  const list = positions.filter(p=>p.workId===work.id).map(p=>calcPosition(p,docs));
  const progress = list.length ? Math.round(list.reduce((s,p)=>s+p.progress,0)/list.length) : 0;
  const saleTotal=list.reduce((s,p)=>s+p.saleTotal,0), purchaseTotal=list.reduce((s,p)=>s+p.purchaseTotal,0), profit=saleTotal-purchaseTotal;
  const margin=saleTotal?profit/saleTotal*100:null;
  const blockers = list.filter(p=>p.warnings.length).length;
  const waitingTkp = list.filter(p=>!p.hasTkp && p.supplierId).length;
  const noSupplier = list.filter(p=>!p.supplierId).length;
  const nextAction = noSupplier ? `Найти поставщиков для ${noSupplier} поз.` : waitingTkp ? `Получить ${waitingTkp} ТКП` : list.some(p=>!p.sale) ? 'Рассчитать цены продажи' : 'Сформировать КП';
  return {...work, positions:list, progress, blockers, waitingTkp, noSupplier, nextAction, totals:{saleTotal,purchaseTotal,profit,margin}};
}

function useStore(){
  const [data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||demoData()}catch{return demoData()}});
  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data)),[data]);
  return [data,setData];
}

function WorkRail({works,activeId,setActiveId,query,setQuery,source,setSource,urgency,setUrgency,onNewWork}){
  return <aside className="rail">
    <div className="brand"><div className="logo">PA</div><div><b>PromApparat</b><span>Workspace</span></div></div>
    <button className="primary full" onClick={onNewWork}><Plus size={16}/> Новая работа</button>
    <label className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Тендер, заказчик, позиция"/></label>
    <div className="filters"><Filter size={14}/><select value={source} onChange={e=>setSource(e.target.value)}><option value="all">Все источники</option>{SOURCES.map(s=><option key={s}>{s}</option>)}</select><select value={urgency} onChange={e=>setUrgency(e.target.value)}><option value="all">Все сроки</option><option value="hot">Горит</option><option value="week">7 дней</option></select></div>
    <div className="rail-title">Активные работы <span>{works.length}</span></div>
    <div className="work-list">{works.map(w=>{
      const days=daysLeft(w.deadline); const tone=days<=1?'red':w.blockers?'yellow':'green';
      return <button key={w.id} onClick={()=>setActiveId(w.id)} className={`work-card ${activeId===w.id?'active':''}`}>
        <div className="work-top"><span className={`dot ${tone}`}/><span>{w.code}</span><em>{days<=1?'сегодня':days<999?`${days} дн.`:w.source}</em></div>
        <strong>{w.customer}</strong><small>{w.title}</small>
        <div className="progress"><i style={{width:`${w.progress}%`}}/></div>
        <div className="work-meta"><span>{w.positions.length} поз.</span><span>{w.progress}%</span></div>
        <p><Zap size={13}/>{w.nextAction}</p>
      </button>})}</div>
  </aside>
}

function Autopilot({work}){
  const days=daysLeft(work.deadline);
  return <div className="autopilot">
    <div className="autopilot-main"><div className="pulse"><Zap size={18}/></div><div><span>Автопилот</span><strong>{work.nextAction}</strong></div><button>Начать</button></div>
    <div className="signal"><Clock3/><span>До подачи</span><b className={days<=1?'hot':''}>{days<=0?'сегодня':`${days} дн.`}</b></div>
    <div className="signal"><AlertTriangle/><span>Проблемные позиции</span><b>{work.blockers}</b></div>
    <div className="signal"><Mail/><span>Ожидаем ТКП</span><b>{work.waitingTkp}</b></div>
    <div className="signal"><Target/><span>Готовность</span><b>{work.progress}%</b></div>
  </div>
}

function WorkModal({onClose,onSave}){
  const [f,setF]=useState({title:'',source:'Тендер',customer:'',objectName:'',manager:'Менеджер',deadline:todayPlus(3),state:'Новая',comment:''});
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  return <div className="modal-bg"><form className="modal" onSubmit={e=>{e.preventDefault();if(f.title&&f.customer)onSave(f)}}>
    <div className="modal-head"><h2>Новая работа</h2><button type="button" onClick={onClose}><X size={18}/></button></div>
    <label>Название<input value={f.title} onChange={e=>set('title',e.target.value)}/></label>
    <div className="grid2"><label>Источник<select value={f.source} onChange={e=>set('source',e.target.value)}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></label><label>Статус<select value={f.state} onChange={e=>set('state',e.target.value)}>{WORK_STATES.map(s=><option key={s}>{s}</option>)}</select></label></div>
    <label>Заказчик<input value={f.customer} onChange={e=>set('customer',e.target.value)}/></label><label>Объект<input value={f.objectName} onChange={e=>set('objectName',e.target.value)}/></label>
    <div className="grid2"><label>Менеджер<input value={f.manager} onChange={e=>set('manager',e.target.value)}/></label><label>Дедлайн<input type="date" value={f.deadline} onChange={e=>set('deadline',e.target.value)}/></label></div>
    <div className="modal-actions"><button type="button" onClick={onClose}>Отмена</button><button className="primary"><Save size={16}/> Создать</button></div>
  </form></div>
}

function PositionTable({work,data,setData,selectedPositionId,setSelectedPositionId}){
  const [filter,setFilter]=useState('all'); const [draft,setDraft]=useState({group:'',name:'',qty:1,unit:'шт'});
  const positions=filter==='all'?work.positions:work.positions.filter(p=>p.warnings.includes(filter)||p.status===filter);
  const patch=(id,patch)=>setData(d=>({...d,positions:d.positions.map(p=>p.id===id?{...p,...patch}:p)}));
  const remove=id=>setData(d=>({...d,positions:d.positions.filter(p=>p.id!==id),documents:d.documents.filter(x=>x.positionId!==id)}));
  const add=()=>{if(!draft.name.trim())return;const rowNo=Math.max(0,...data.positions.filter(p=>p.workId===work.id).map(p=>p.rowNo||0))+1;setData(d=>({...d,positions:[...d.positions,{id:uid(),workId:work.id,rowNo,...draft,qty:Number(draft.qty||1),supplierId:'',purchasePrice:'',salePrice:'',productionDays:'',deliveryDays:'',shipmentPlace:'',status:'Не начато'}]}));setDraft({group:'',name:'',qty:1,unit:'шт'})};
  return <main className="positions">
    <div className="work-header"><div><span className="eyebrow">{work.code} · {work.source} · {work.state}</span><h1>{work.customer} — {work.title}</h1><p>{work.objectName}</p></div><div className="header-finance"><span>Ожидаемая прибыль</span><b>{money(work.totals.profit)}</b><small>маржа {pct(work.totals.margin)}</small></div></div>
    <Autopilot work={work}/>
    <div className="toolbar"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Все позиции</option><option value="нет поставщика">Без поставщика</option><option value="нет ТКП">Без ТКП</option><option value="нет продажи">Без продажи</option><option value="низкая маржа">Низкая маржа</option></select><button onClick={()=>setData(demoData())}>Сбросить демо</button><button disabled>Импорт позже</button></div>
    <div className="add-row"><input value={draft.group} onChange={e=>setDraft({...draft,group:e.target.value})} placeholder="Группа"/><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Новая позиция"/><input type="number" value={draft.qty} onChange={e=>setDraft({...draft,qty:e.target.value})}/><input value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value})}/><button className="primary" onClick={add}><Plus size={16}/> Добавить</button></div>
    <div className="table-wrap"><table><thead><tr><th>№</th><th>Позиция</th><th>Кол-во</th><th>Поставщик</th><th>Экономика</th><th>Срок</th><th>Следующий шаг</th><th></th></tr></thead><tbody>{positions.map(p=>{
      const supplier=data.suppliers.find(s=>s.id===p.supplierId);
      return <tr key={p.id} className={`row-${p.tone} ${selectedPositionId===p.id?'selected-row':''}`} onClick={()=>setSelectedPositionId(p.id)}>
        <td><span className={`state-dot ${p.tone}`}/>{p.rowNo}</td>
        <td className="position-name"><b>{p.name}</b><small>{p.group}</small></td>
        <td>{p.qty} {p.unit}</td>
        <td>{supplier?<><b>{supplier.name}</b><small>{supplier.city}</small></>:<span className="missing">Не выбран</span>}</td>
        <td><div className="economy"><span>{p.purchase?money(p.purchase):'—'} → {p.sale?money(p.sale):'—'}</span><b className={p.margin!==null&&p.margin<15?'bad':'good'}>{pct(p.margin)}</b></div></td>
        <td>{p.productionDays?<b>{p.productionDays} дн.</b>:<span className="missing">Не указан</span>}</td>
        <td><button className={`next-step ${p.tone}`}>{p.nextStep}</button></td>
        <td><button className="icon danger" onClick={e=>{e.stopPropagation();remove(p.id)}}><Trash2 size={15}/></button></td>
      </tr>})}</tbody></table></div>
  </main>
}

function PositionCard({work,position,data,setData,onClose}){
  const supplier=data.suppliers.find(s=>s.id===position.supplierId);
  const patch=x=>setData(d=>({...d,positions:d.positions.map(p=>p.id===position.id?{...p,...x}:p)}));
  const addDoc=type=>setData(d=>({...d,documents:[...d.documents,{id:uid(),workId:work.id,positionId:position.id,type,name:`${type} · ${position.name}`}]}));
  return <section className="position-card">
    <div className="card-head"><div><span className="eyebrow">Позиция №{position.rowNo}</span><h2>{position.name}</h2></div><button className="icon" onClick={onClose}><X size={16}/></button></div>
    <div className={`focus-action ${position.tone}`}><span>Сейчас нужно</span><strong>{position.nextStep}</strong><button>Выполнить</button></div>
    <div className="scoreline"><div><b>{position.progress}%</b><span>готовность</span></div><div><b>{pct(position.margin)}</b><span>маржа</span></div></div>
    <div className="section-title"><ClipboardList size={16}/> Поставщик</div>
    <div className="detail-grid"><label>Поставщик<select value={position.supplierId||''} onChange={e=>patch({supplierId:e.target.value})}><option value="">—</option>{data.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Контакт<input value={position.supplierContact||supplier?.contact||''} onChange={e=>patch({supplierContact:e.target.value})}/></label></div>
    <div className="quick-contact">{supplier&&<><button><Phone size={14}/> {supplier.phone}</button><button><Mail size={14}/> Написать</button></>}</div>
    <div className="section-title"><CircleDollarSign size={16}/> Цена и сроки</div>
    <div className="detail-grid"><label>Закупка<input type="number" value={position.purchasePrice||''} onChange={e=>patch({purchasePrice:e.target.value})}/></label><label>Продажа<input type="number" value={position.salePrice||''} onChange={e=>patch({salePrice:e.target.value})}/></label><label>Изготовление<input type="number" value={position.productionDays||''} onChange={e=>patch({productionDays:e.target.value})}/></label><label>Доставка<input type="number" value={position.deliveryDays||''} onChange={e=>patch({deliveryDays:e.target.value})}/></label></div>
    <label className="full-label">Место отгрузки<input value={position.shipmentPlace||''} onChange={e=>patch({shipmentPlace:e.target.value})}/></label>
    <div className="doc-row"><button onClick={()=>addDoc('ТКП')}>+ ТКП</button><button onClick={()=>addDoc('Паспорт')}>+ Паспорт</button><button onClick={()=>addDoc('Сертификат')}>+ Сертификат</button></div>
    <div className="helper-box"><b>Контроль системы</b>{position.warnings.length?position.warnings.map(w=><p key={w}>⚠ {w}</p>):<p>✓ Критичных проблем нет</p>}</div>
  </section>
}

function Assistant({work,selectedPosition,data,setData,setSelectedPositionId}){
  if(!work)return <aside className="assistant"/>;
  if(selectedPosition)return <aside className="assistant"><PositionCard work={work} position={selectedPosition} data={data} setData={setData} onClose={()=>setSelectedPositionId(null)}/></aside>;
  const priorities=work.positions.filter(p=>p.nextStep!=='Готово к КП').slice(0,5);
  return <aside className="assistant">
    <section className="day-plan"><div className="section-title"><Zap size={16}/> План действий</div><h2>{work.nextAction}</h2><p>Система собрала приоритеты по выбранной работе.</p></section>
    <section className="priority-list">{priorities.map((p,i)=><button key={p.id} onClick={()=>setSelectedPositionId(p.id)}><span>{i+1}</span><div><b>{p.nextStep}</b><small>Поз. {p.rowNo} · {p.name}</small></div></button>)}</section>
    <section className="totals"><div><span>Продажа</span><b>{money(work.totals.saleTotal)}</b></div><div><span>Закупка</span><b>{money(work.totals.purchaseTotal)}</b></div><div><span>Прибыль</span><b>{money(work.totals.profit)}</b></div></section>
    <section><div className="section-title"><FileText size={16}/> Дедлайн</div><b>{work.deadline}</b><p>{work.manager}</p></section>
  </aside>
}

function App(){
  const [data,setData]=useStore(); const [activeId,setActiveId]=useState('w1'); const [query,setQuery]=useState(''); const [source,setSource]=useState('all'); const [urgency,setUrgency]=useState('all'); const [showModal,setShowModal]=useState(false); const [selectedPositionId,setSelectedPositionId]=useState(null);
  const works=useMemo(()=>data.works.map(w=>calcWork(w,data.positions,data.documents)),[data]);
  const filtered=works.filter(w=>{const q=query.toLowerCase();const d=daysLeft(w.deadline);return(!q||`${w.customer} ${w.title} ${w.code} ${w.positions.map(p=>p.name).join(' ')}`.toLowerCase().includes(q))&&(source==='all'||w.source===source)&&(urgency==='all'||urgency==='hot'&&d<=1||urgency==='week'&&d<=7)});
  const active=works.find(w=>w.id===activeId)||works[0]; const selected=active?.positions.find(p=>p.id===selectedPositionId)||null;
  useEffect(()=>setSelectedPositionId(null),[activeId]);
  const createWork=f=>{const work={id:uid(),code:`PA-2026-${String(data.works.length+1).padStart(4,'0')}`,...f};setData(d=>({...d,works:[work,...d.works]}));setActiveId(work.id);setShowModal(false)};
  return <div className="app"><WorkRail works={filtered} activeId={active?.id} setActiveId={setActiveId} query={query} setQuery={setQuery} source={source} setSource={setSource} urgency={urgency} setUrgency={setUrgency} onNewWork={()=>setShowModal(true)}/>{active?<PositionTable work={active} data={data} setData={setData} selectedPositionId={selectedPositionId} setSelectedPositionId={setSelectedPositionId}/>:<main className="empty">Нет работ</main>}<Assistant work={active} selectedPosition={selected} data={data} setData={setData} setSelectedPositionId={setSelectedPositionId}/>{showModal&&<WorkModal onClose={()=>setShowModal(false)} onSave={createWork}/>}</div>
}

createRoot(document.getElementById('root')).render(<App/>);