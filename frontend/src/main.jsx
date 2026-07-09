import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, CheckCircle2, Clock3, FileText, Filter, Plus, Save, Search, Trash2, X, Zap, ClipboardList, PackageCheck } from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'promapparat_workspace_sprint4';
const SOURCES = ['Тендер', 'Сайт', 'Холодный звонок', 'Повторный клиент', 'Email', 'Другое'];
const WORK_STATES = ['Новая', 'Анализ', 'Решение участвовать', 'Расчет', 'Ожидаем ТКП', 'КП готовится', 'КП отправлено', 'Переговоры', 'Договор', 'Производство', 'Отгрузка', 'Закрыто успешно', 'Закрыто проиграно', 'Архив'];
const POSITION_STATES = ['Не начато', 'Нужен поставщик', 'Запрос отправлен', 'Ожидаем ТКП', 'ТКП получено', 'Цена рассчитана', 'В КП', 'Заказано', 'В производстве', 'Готово досрочно', 'Готово', 'Частично отгружено', 'Отгружено', 'Закрыто'];

const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
const money = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v || 0)) + ' ₽';
const pct = (v) => v == null || Number.isNaN(Number(v)) ? '—' : `${Number(v).toFixed(1)}%`;
const todayPlus = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const demoData = () => ({
  works: [
    { id: 'w1', code: 'PA-2026-0001', title: 'Клапаны 46 шт', source: 'Тендер', customer: 'НкНПЗ', objectName: 'Клапаны и запорная арматура', manager: 'Иванов', deadline: todayPlus(1), state: 'Расчет', comment: 'Объемная заявка по тендерной документации' },
    { id: 'w2', code: 'PA-2026-0002', title: 'Расходомеры и КИП', source: 'Тендер', customer: 'СИБУР', objectName: 'Модернизация линии учета', manager: 'Петров', deadline: todayPlus(3), state: 'Ожидаем ТКП', comment: '' },
    { id: 'w3', code: 'PA-2026-0003', title: 'Регулирующая арматура', source: 'Сайт', customer: 'ООО СеверХим', objectName: 'Производственный участок', manager: 'Иванов', deadline: todayPlus(7), state: 'Новая', comment: 'Входящая заявка с сайта' },
  ],
  suppliers: [
    { id: 's1', name: 'ООО Арматура-Сервис', city: 'Москва', contact: 'Алексей', phone: '+7 900 111-22-33' },
    { id: 's2', name: 'Завод ПромКлапан', city: 'Санкт-Петербург', contact: 'Ирина', phone: '+7 900 222-33-44' },
    { id: 's3', name: 'ТД КИП Комплект', city: 'Екатеринбург', contact: 'Олег', phone: '+7 900 333-44-55' },
  ],
  documents: [
    { id: 'd1', workId: 'w1', positionId: null, type: 'ТЗ', name: 'Техническое задание НкНПЗ.pdf' },
    { id: 'd2', workId: 'w1', positionId: 'p1', type: 'ТКП', name: 'ТКП Арматура-Сервис.pdf' },
    { id: 'd3', workId: 'w2', positionId: null, type: 'ТЗ', name: 'Ведомость КИП.xlsx' },
  ],
  positions: [
    { id: 'p1', workId: 'w1', rowNo: 1, group: 'Клапаны', name: 'Клапан запорный DN50 PN40', qty: 8, unit: 'шт', supplierId: 's1', purchasePrice: 18500, salePrice: 24800, productionDays: 15, deliveryDays: 3, shipmentPlace: 'Москва', status: 'Цена рассчитана', comment: '' },
    { id: 'p2', workId: 'w1', rowNo: 2, group: 'Клапаны', name: 'Клапан обратный DN100 PN16', qty: 12, unit: 'шт', supplierId: 's2', purchasePrice: 31200, salePrice: 36000, productionDays: 25, deliveryDays: 5, shipmentPlace: 'Санкт-Петербург', status: 'ТКП получено', comment: 'Проверить маржу' },
    { id: 'p3', workId: 'w1', rowNo: 3, group: 'Арматура', name: 'Задвижка клиновая DN150 PN16', qty: 6, unit: 'шт', supplierId: '', purchasePrice: '', salePrice: '', productionDays: '', deliveryDays: '', shipmentPlace: '', status: 'Нужен поставщик', comment: '' },
    { id: 'p4', workId: 'w2', rowNo: 1, group: 'КИП', name: 'Расходомер электромагнитный DN80', qty: 4, unit: 'шт', supplierId: 's3', purchasePrice: 94000, salePrice: '', productionDays: 20, deliveryDays: '', shipmentPlace: 'Екатеринбург', status: 'Ожидаем ТКП', comment: '' },
    { id: 'p5', workId: 'w3', rowNo: 1, group: 'Регулирующая арматура', name: 'Клапан регулирующий DN25', qty: 2, unit: 'шт', supplierId: '', purchasePrice: '', salePrice: '', productionDays: '', deliveryDays: '', shipmentPlace: '', status: 'Не начато', comment: '' },
  ]
});

function calcPosition(p, docs) {
  const hasTkp = docs.some((d) => d.positionId === p.id && d.type === 'ТКП');
  const qty = Number(p.qty || 0);
  const purchase = Number(p.purchasePrice || 0);
  const sale = Number(p.salePrice || 0);
  const purchaseTotal = purchase * qty;
  const saleTotal = sale * qty;
  const profit = saleTotal - purchaseTotal;
  const margin = saleTotal ? profit / saleTotal * 100 : null;
  let progress = 0;
  if (p.name) progress += 10;
  if (qty) progress += 10;
  if (p.supplierId) progress += 15;
  if (hasTkp) progress += 15;
  if (purchase) progress += 15;
  if (sale) progress += 15;
  if (p.productionDays || p.deliveryDays) progress += 10;
  if (p.shipmentPlace) progress += 10;
  const warnings = [];
  if (!p.supplierId) warnings.push('нет поставщика');
  if (!purchase) warnings.push('нет закупки');
  if (!sale) warnings.push('нет продажи');
  if (!p.productionDays && !p.deliveryDays) warnings.push('нет срока');
  if (!p.shipmentPlace) warnings.push('нет отгрузки');
  if (!hasTkp) warnings.push('нет ТКП');
  if (margin !== null && margin < 15) warnings.push('низкая маржа');
  return { ...p, qty, purchase, sale, purchaseTotal, saleTotal, profit, margin, progress, warnings, hasTkp };
}

function calcWork(work, positions, docs) {
  const list = positions.filter((p) => p.workId === work.id).map((p) => calcPosition(p, docs));
  const progress = list.length ? Math.round(list.reduce((s, p) => s + p.progress, 0) / list.length) : 0;
  const saleTotal = list.reduce((s, p) => s + p.saleTotal, 0);
  const purchaseTotal = list.reduce((s, p) => s + p.purchaseTotal, 0);
  const profit = saleTotal - purchaseTotal;
  const margin = saleTotal ? profit / saleTotal * 100 : null;
  const risks = [...new Set(list.flatMap((p) => p.warnings))];
  const nextAction = !docs.some((d) => d.workId === work.id) ? 'Загрузить документацию'
    : !list.length ? 'Создать позиции'
    : list.some((p) => !p.supplierId) ? 'Назначить поставщиков'
    : list.some((p) => !p.hasTkp) ? 'Получить ТКП'
    : list.some((p) => !p.purchase) ? 'Внести цены закупки'
    : list.some((p) => !p.sale) ? 'Рассчитать цены продажи'
    : list.some((p) => !p.productionDays && !p.deliveryDays) ? 'Проверить сроки'
    : 'Сформировать КП';
  return { ...work, positions: list, progress, totals: { saleTotal, purchaseTotal, profit, margin }, risks, nextAction };
}

function useStore() {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || demoData(); } catch { return demoData(); }
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data]);
  return [data, setData];
}

function WorkRail({ works, activeId, setActiveId, query, setQuery, urgency, setUrgency, source, setSource, onNewWork }) {
  return <aside className="rail">
    <div className="brand"><div className="logo">PA</div><div><b>PromApparat</b><span>Workspace</span></div></div>
    <button className="primary full" onClick={onNewWork}><Plus size={16}/> Новая работа</button>
    <label className="search"><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Поиск"/></label>
    <div className="filters"><Filter size={14}/><select value={source} onChange={(e)=>setSource(e.target.value)}><option value="all">Все источники</option>{SOURCES.map((s)=><option key={s}>{s}</option>)}</select><select value={urgency} onChange={(e)=>setUrgency(e.target.value)}><option value="all">Все сроки</option><option value="hot">Горит</option><option value="week">7 дней</option></select></div>
    <div className="work-list">
      {works.map((w) => {
        const days = w.deadline ? Math.ceil((new Date(w.deadline) - new Date()) / 86400000) : 999;
        const tone = days <= 1 ? 'red' : w.risks.length ? 'yellow' : 'green';
        return <button key={w.id} onClick={()=>setActiveId(w.id)} className={`work-card ${activeId===w.id?'active':''}`}>
          <div className="work-top"><span className={`dot ${tone}`}/><span>{w.code}</span><em>{w.source}</em></div>
          <strong>{w.customer}</strong><small>{w.title}</small>
          <div className="progress"><i style={{width:`${w.progress}%`}}/></div>
          <div className="work-meta"><span>{w.positions.length} поз.</span><span>{w.progress}%</span></div>
          <p>{w.nextAction}</p>
        </button>
      })}
    </div>
  </aside>
}

function WorkModal({ onClose, onSave }) {
  const [f, setF] = useState({ title: '', source: 'Тендер', customer: '', objectName: '', manager: 'Менеджер', deadline: todayPlus(3), state: 'Новая', comment: '' });
  const set = (k, v) => setF((x)=>({...x,[k]:v}));
  return <div className="modal-bg"><form className="modal" onSubmit={(e)=>{e.preventDefault(); if(!f.title || !f.customer) return; onSave(f);}}>
    <div className="modal-head"><h2>Новая работа</h2><button type="button" onClick={onClose}><X size={18}/></button></div>
    <label>Название<input value={f.title} onChange={(e)=>set('title',e.target.value)} placeholder="Клапаны 46 шт"/></label>
    <div className="grid2"><label>Источник<select value={f.source} onChange={(e)=>set('source',e.target.value)}>{SOURCES.map((s)=><option key={s}>{s}</option>)}</select></label><label>Статус<select value={f.state} onChange={(e)=>set('state',e.target.value)}>{WORK_STATES.map((s)=><option key={s}>{s}</option>)}</select></label></div>
    <label>Заказчик<input value={f.customer} onChange={(e)=>set('customer',e.target.value)} placeholder="НкНПЗ / СИБУР / Газпром"/></label>
    <label>Объект<input value={f.objectName} onChange={(e)=>set('objectName',e.target.value)}/></label>
    <div className="grid2"><label>Менеджер<input value={f.manager} onChange={(e)=>set('manager',e.target.value)}/></label><label>Дедлайн<input type="date" value={f.deadline} onChange={(e)=>set('deadline',e.target.value)}/></label></div>
    <label>Комментарий<textarea value={f.comment} onChange={(e)=>set('comment',e.target.value)}/></label>
    <div className="modal-actions"><button type="button" onClick={onClose}>Отмена</button><button className="primary"><Save size={16}/> Создать</button></div>
  </form></div>
}

function PositionTable({ work, data, setData, selectedPositionId, setSelectedPositionId }) {
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState({ group: '', name: '', qty: 1, unit: 'шт' });
  const suppliers = data.suppliers;
  const positions = filter === 'all' ? work.positions : work.positions.filter((p) => p.warnings.includes(filter) || p.status === filter);

  const patchPosition = (id, patch) => setData((d) => ({ ...d, positions: d.positions.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  const deletePosition = (id) => setData((d) => ({ ...d, positions: d.positions.filter((p) => p.id !== id), documents: d.documents.filter((doc) => doc.positionId !== id) }));
  const addPosition = () => {
    if (!draft.name.trim()) return;
    const rowNo = Math.max(0, ...data.positions.filter((p)=>p.workId===work.id).map((p)=>p.rowNo || 0)) + 1;
    setData((d)=>({ ...d, positions: [...d.positions, { id: uid(), workId: work.id, rowNo, group: draft.group, name: draft.name, qty: Number(draft.qty || 1), unit: draft.unit, supplierId: '', purchasePrice: '', salePrice: '', productionDays: '', deliveryDays: '', shipmentPlace: '', status: 'Не начато', comment: '' }] }));
    setDraft({ group: '', name: '', qty: 1, unit: 'шт' });
  };
  const addTkp = (p) => {
    setData((d)=>({ ...d, documents: [...d.documents, { id: uid(), workId: work.id, positionId: p.id, type: 'ТКП', name: `ТКП ${p.name}.pdf` }] }));
  };

  return <section className="positions">
    <div className="work-header">
      <div><span className="eyebrow">{work.code} · {work.source} · {work.state}</span><h1>{work.customer} — {work.title}</h1><p>{work.objectName || 'Объект не указан'}</p></div>
      <div className="kpi"><b>{work.progress}%</b><span>готовность</span></div>
      <div className="kpi"><b>{money(work.totals.profit)}</b><span>прибыль</span></div>
    </div>
    <div className="toolbar"><select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">Все позиции</option><option value="нет поставщика">Без поставщика</option><option value="нет закупки">Без закупки</option><option value="нет продажи">Без продажи</option><option value="нет ТКП">Без ТКП</option><option value="низкая маржа">Низкая маржа</option></select><button onClick={()=>setData(demoData())}>Сбросить демо</button><button disabled>Импорт Excel позже</button><button disabled>КП позже</button></div>
    <div className="add-row"><input value={draft.group} onChange={(e)=>setDraft({...draft, group:e.target.value})} placeholder="Группа"/><input className="grow" value={draft.name} onChange={(e)=>setDraft({...draft, name:e.target.value})} placeholder="Новая позиция"/><input type="number" value={draft.qty} onChange={(e)=>setDraft({...draft, qty:e.target.value})}/><input value={draft.unit} onChange={(e)=>setDraft({...draft, unit:e.target.value})}/><button className="primary" onClick={addPosition}><Plus size={16}/> Добавить</button></div>
    <div className="table-wrap"><table><thead><tr><th>№</th><th>Группа</th><th>Позиция</th><th>Кол-во</th><th>Поставщик</th><th>Закупка</th><th>Продажа</th><th>Маржа</th><th>Срок</th><th>Отгрузка</th><th>Статус</th><th>Готово</th><th>Риски</th><th></th></tr></thead><tbody>
      {positions.map((p)=><tr key={p.id} onClick={()=>setSelectedPositionId(p.id)} className={`${p.warnings.length?'has-risk':''} ${selectedPositionId===p.id?'selected-row':''}`}>
        <td>{p.rowNo}</td>
        <td><input value={p.group || ''} onChange={(e)=>patchPosition(p.id,{group:e.target.value})}/></td>
        <td className="wide"><input value={p.name} onChange={(e)=>patchPosition(p.id,{name:e.target.value})}/></td>
        <td><input type="number" value={p.qty} onChange={(e)=>patchPosition(p.id,{qty:e.target.value})}/></td>
        <td><select value={p.supplierId || ''} onChange={(e)=>patchPosition(p.id,{supplierId:e.target.value})}><option value="">—</option>{suppliers.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
        <td><input type="number" value={p.purchasePrice || ''} onChange={(e)=>patchPosition(p.id,{purchasePrice:e.target.value})}/></td>
        <td><input type="number" value={p.salePrice || ''} onChange={(e)=>patchPosition(p.id,{salePrice:e.target.value})}/></td>
        <td className={p.margin !== null && p.margin < 15 ? 'bad' : 'good'}>{pct(p.margin)}</td>
        <td><input type="number" value={p.productionDays || ''} onChange={(e)=>patchPosition(p.id,{productionDays:e.target.value})}/></td>
        <td><input value={p.shipmentPlace || ''} onChange={(e)=>patchPosition(p.id,{shipmentPlace:e.target.value})}/></td>
        <td><select value={p.status} onChange={(e)=>patchPosition(p.id,{status:e.target.value})}>{POSITION_STATES.map((s)=><option key={s}>{s}</option>)}</select></td>
        <td><div className="mini"><i style={{width:`${p.progress}%`}}/></div><span>{p.progress}%</span></td>
        <td className="warnings">{p.warnings.slice(0,3).map((w)=><button key={w} onClick={()=>w==='нет ТКП' && addTkp(p)} className="tag">{w}</button>)}</td>
        <td><button className="icon danger" onClick={(e)=>{e.stopPropagation(); deletePosition(p.id)}}><Trash2 size={15}/></button></td>
      </tr>)}
    </tbody></table></div>
  </section>
}


function PositionCard({ work, position, data, setData, onClose }) {
  if (!position) return null;
  const suppliers = data.suppliers;
  const docs = data.documents.filter((d) => d.positionId === position.id);
  const supplier = suppliers.find((s) => s.id === position.supplierId);
  const patchPosition = (patch) => setData((d) => ({ ...d, positions: d.positions.map((p) => p.id === position.id ? { ...p, ...patch } : p) }));
  const addDoc = (type) => setData((d) => ({ ...d, documents: [...d.documents, { id: uid(), workId: work.id, positionId: position.id, type, name: `${type} · ${position.name}` }] }));
  const duplicate = () => {
    const rowNo = Math.max(0, ...data.positions.filter((p)=>p.workId===work.id).map((p)=>p.rowNo || 0)) + 1;
    setData((d)=>({ ...d, positions: [...d.positions, { ...position, id: uid(), rowNo, name: `${position.name} — копия`, status: 'Не начато' }] }));
  };
  const setRecommendedSale = () => {
    const purchase = Number(position.purchasePrice || 0);
    if (!purchase) return;
    patchPosition({ salePrice: Math.ceil(purchase / 0.82) });
  };

  return <section className="position-card">
    <div className="card-head">
      <div><span className="eyebrow">Позиция №{position.rowNo}</span><h2>{position.name || 'Без названия'}</h2></div>
      <button className="icon" onClick={onClose}><X size={16}/></button>
    </div>

    <div className="scoreline"><div><b>{position.progress}%</b><span>готовность</span></div><div><b>{pct(position.margin)}</b><span>маржа</span></div></div>

    <div className="detail-grid">
      <label>Группа<input value={position.group || ''} onChange={(e)=>patchPosition({group:e.target.value})}/></label>
      <label>Количество<input type="number" value={position.qty || ''} onChange={(e)=>patchPosition({qty:e.target.value})}/></label>
      <label>Ед. изм.<input value={position.unit || ''} onChange={(e)=>patchPosition({unit:e.target.value})}/></label>
      <label>Статус<select value={position.status} onChange={(e)=>patchPosition({status:e.target.value})}>{POSITION_STATES.map((s)=><option key={s}>{s}</option>)}</select></label>
    </div>

    <label className="full-label">Техническое описание<textarea value={position.description || ''} onChange={(e)=>patchPosition({description:e.target.value})} placeholder="DN, PN, материал, среда, температура, требования"/></label>

    <div className="section-title"><ClipboardList size={16}/> Поставщик и ТКП</div>
    <div className="detail-grid">
      <label>Поставщик<select value={position.supplierId || ''} onChange={(e)=>patchPosition({supplierId:e.target.value})}><option value="">—</option>{suppliers.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label>Производитель<input value={position.manufacturer || ''} onChange={(e)=>patchPosition({manufacturer:e.target.value})}/></label>
      <label>Контакт<input value={position.supplierContact || supplier?.contact || ''} onChange={(e)=>patchPosition({supplierContact:e.target.value})}/></label>
      <label>Артикул / модель<input value={position.article || ''} onChange={(e)=>patchPosition({article:e.target.value})}/></label>
    </div>

    <div className="section-title"><PackageCheck size={16}/> Цена, сроки, отгрузка</div>
    <div className="detail-grid">
      <label>Закупка<input type="number" value={position.purchasePrice || ''} onChange={(e)=>patchPosition({purchasePrice:e.target.value})}/></label>
      <label>Продажа<input type="number" value={position.salePrice || ''} onChange={(e)=>patchPosition({salePrice:e.target.value})}/></label>
      <label>Изготовление, дней<input type="number" value={position.productionDays || ''} onChange={(e)=>patchPosition({productionDays:e.target.value})}/></label>
      <label>Доставка, дней<input type="number" value={position.deliveryDays || ''} onChange={(e)=>patchPosition({deliveryDays:e.target.value})}/></label>
      <label>План готовности<input type="date" value={position.readinessDate || ''} onChange={(e)=>patchPosition({readinessDate:e.target.value})}/></label>
      <label>План отгрузки<input type="date" value={position.deliveryDate || ''} onChange={(e)=>patchPosition({deliveryDate:e.target.value})}/></label>
      <label>Город отгрузки<input value={position.shipmentPlace || ''} onChange={(e)=>patchPosition({shipmentPlace:e.target.value})}/></label>
      <label>Адрес / склад<input value={position.shipmentAddress || ''} onChange={(e)=>patchPosition({shipmentAddress:e.target.value})}/></label>
    </div>
    <label className="full-label">Условия оплаты<textarea value={position.paymentTerms || ''} onChange={(e)=>patchPosition({paymentTerms:e.target.value})} placeholder="Предоплата, постоплата, отсрочка, условия поставщика"/></label>

    <div className="doc-row"><button onClick={()=>addDoc('ТКП')}>+ ТКП</button><button onClick={()=>addDoc('Паспорт')}>+ Паспорт</button><button onClick={()=>addDoc('Сертификат')}>+ Сертификат</button></div>
    <div className="docs-list">{docs.length ? docs.map((d)=><span key={d.id}>{d.type}: {d.name}</span>) : <em>Документы по позиции не добавлены</em>}</div>

    <div className="helper-box">
      <b>Подсказки</b>
      {position.warnings.length ? position.warnings.map((w)=><p key={w}>⚠ {w}</p>) : <p>✓ Позиция заполнена без критичных рисков</p>}
    </div>
    <div className="card-actions"><button onClick={setRecommendedSale}>Рассчитать продажу с маржей 18%</button><button onClick={duplicate}>Копировать позицию</button></div>
  </section>
}

function Assistant({ work, selectedPosition, data, setData, setSelectedPositionId }) {
  if (!work) return <aside className="assistant"><p>Выберите работу</p></aside>;
  const risks = work.risks.slice(0, 8);
  return <aside className="assistant">
    {selectedPosition && <PositionCard work={work} position={selectedPosition} data={data} setData={setData} onClose={()=>setSelectedPositionId(null)}/>}
    <section className="action"><div className="section-title"><Zap size={16}/> Следующее действие</div><h2>{work.nextAction}</h2><button className="primary full">Выполнить</button></section>
    <section><div className="section-title"><AlertTriangle size={16}/> Риски</div>{risks.length ? risks.map((r)=><div className="risk" key={r}>{r}</div>) : <div className="ok"><CheckCircle2 size={16}/> Рисков нет</div>}</section>
    <section><div className="section-title"><Clock3 size={16}/> Дедлайн</div><b>{work.deadline || '—'}</b><p>{work.manager}</p></section>
    <section className="totals"><div><span>Продажа</span><b>{money(work.totals.saleTotal)}</b></div><div><span>Закупка</span><b>{money(work.totals.purchaseTotal)}</b></div><div><span>Прибыль</span><b>{money(work.totals.profit)}</b></div><div><span>Маржа</span><b>{pct(work.totals.margin)}</b></div></section>
    <section><div className="section-title"><FileText size={16}/> Документы</div><p>Документы в следующем спринте.</p></section>
  </aside>
}

function App() {
  const [data, setData] = useStore();
  const [activeId, setActiveId] = useState(() => data.works[0]?.id);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);

  const works = useMemo(() => data.works.map((w)=>calcWork(w, data.positions, data.documents)), [data]);
  const filteredWorks = works.filter((w) => {
    const q = query.trim().toLowerCase();
    const days = w.deadline ? Math.ceil((new Date(w.deadline) - new Date()) / 86400000) : 999;
    return (!q || `${w.customer} ${w.title} ${w.code}`.toLowerCase().includes(q)) && (source === 'all' || w.source === source) && (urgency === 'all' || (urgency === 'hot' && days <= 1) || (urgency === 'week' && days <= 7));
  });
  const active = works.find((w)=>w.id===activeId) || works[0];
  const selectedPosition = active?.positions.find((p)=>p.id===selectedPositionId) || null;

  useEffect(() => { setSelectedPositionId(null); }, [activeId]);

  const createWork = (f) => {
    const n = data.works.length + 1;
    const work = { id: uid(), code: `PA-2026-${String(n).padStart(4,'0')}`, ...f };
    setData((d)=>({ ...d, works: [work, ...d.works] }));
    setActiveId(work.id);
    setShowModal(false);
  };

  return <div className="app">
    <WorkRail works={filteredWorks} activeId={active?.id} setActiveId={setActiveId} query={query} setQuery={setQuery} urgency={urgency} setUrgency={setUrgency} source={source} setSource={setSource} onNewWork={()=>setShowModal(true)}/>
    {active ? <PositionTable work={active} data={data} setData={setData} selectedPositionId={selectedPositionId} setSelectedPositionId={setSelectedPositionId}/> : <main className="empty">Нет работ</main>}
    <Assistant work={active} selectedPosition={selectedPosition} data={data} setData={setData} setSelectedPositionId={setSelectedPositionId}/>
    {showModal && <WorkModal onClose={()=>setShowModal(false)} onSave={createWork}/>}  
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
