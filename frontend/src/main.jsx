import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, CheckCircle2, Clock, FileText, Plus, Search, Zap, Pencil, Trash2, X, Save } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SOURCES = ['Тендер', 'Сайт', 'Холодный звонок', 'Повторный клиент', 'Email', 'Другое'];
const STATES = ['Новая', 'Найдена', 'Анализ', 'Решение участвовать', 'Расчет', 'Ожидаем ТКП', 'КП готовится', 'КП отправлено', 'Переговоры', 'Договор', 'Производство', 'Отгрузка', 'Закрыто успешно', 'Закрыто проиграно', 'Архив'];

const money = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value || 0) + ' ₽';
const percent = (value) => value == null ? '—' : `${Number(value).toFixed(1)}%`;
const toLocalInput = (iso) => iso ? new Date(iso).toISOString().slice(0,16) : '';
const fromLocalInput = (value) => value ? new Date(value).toISOString() : null;

function WorkCard({ work, active, onClick }) {
  const deadline = work.deadline ? new Date(work.deadline) : null;
  const hoursLeft = deadline ? Math.round((deadline - new Date()) / 36e5) : null;
  const danger = hoursLeft !== null && hoursLeft <= 24;
  const overdue = hoursLeft !== null && hoursLeft < 0;
  return (
    <button className={`work-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="work-card-top">
        <span className={`dot ${overdue || danger ? 'red' : work.warnings_count ? 'yellow' : 'green'}`} />
        <span className="code">{work.code}</span>
        <span className="source-pill">{work.source}</span>
      </div>
      <strong>{work.customer}</strong>
      <span>{work.title}</span>
      <div className="progress-row">
        <div className="progress"><i style={{ width: `${work.progress}%` }} /></div>
        <b>{work.progress}%</b>
      </div>
      <small>{work.positions_count} поз. · {work.next_action}</small>
    </button>
  );
}

function WorkForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    source: initial?.source || 'Тендер',
    customer: initial?.customer || '',
    object_name: initial?.object_name || '',
    manager_name: initial?.manager_name || 'Менеджер',
    deadline: toLocalInput(initial?.deadline),
    state: initial?.state || 'Новая',
    comment: initial?.comment || '',
  }));
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.customer.trim()) return;
    setSaving(true);
    const payload = { ...form, deadline: fromLocalInput(form.deadline) };
    const url = initial ? `${API}/api/works/${initial.id}` : `${API}/api/works`;
    const method = initial ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const saved = await res.json();
    setSaving(false);
    onSaved(saved);
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="modal-backdrop">
      <form className="work-modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>{initial ? 'Редактировать работу' : 'Новая работа'}</h2>
          <button type="button" className="icon-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <label>Название<input value={form.title} onChange={e=>set('title', e.target.value)} placeholder="Клапаны 46 шт" /></label>
        <div className="grid-2">
          <label>Источник<select value={form.source} onChange={e=>set('source', e.target.value)}>{SOURCES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Статус<select value={form.state} onChange={e=>set('state', e.target.value)}>{STATES.map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
        <label>Заказчик<input value={form.customer} onChange={e=>set('customer', e.target.value)} placeholder="Газпром / СИБУР / НкНПЗ" /></label>
        <label>Объект<input value={form.object_name} onChange={e=>set('object_name', e.target.value)} placeholder="Объект, установка, участок" /></label>
        <div className="grid-2">
          <label>Менеджер<input value={form.manager_name} onChange={e=>set('manager_name', e.target.value)} /></label>
          <label>Дедлайн<input type="datetime-local" value={form.deadline} onChange={e=>set('deadline', e.target.value)} /></label>
        </div>
        <label>Комментарий<textarea value={form.comment || ''} onChange={e=>set('comment', e.target.value)} /></label>
        <div className="modal-actions"><button type="button" onClick={onClose}>Отмена</button><button className="primary" disabled={saving}><Save size={16}/>{saving ? 'Сохранение...' : 'Сохранить'}</button></div>
      </form>
    </div>
  );
}

function AssistantPanel({ detail, onEdit, onDelete }) {
  if (!detail) return <aside className="assistant empty">Выберите работу</aside>;
  const uniqueRisks = [...new Set(detail.risks)].slice(0, 8);
  return (
    <aside className="assistant">
      <section className="hero-action">
        <div className="section-title"><Zap size={16}/> Следующее действие</div>
        <h2>{detail.next_action}</h2>
        <button>Выполнить</button>
      </section>

      <section className="work-controls">
        <div className="section-title">Работа</div>
        <button onClick={onEdit}><Pencil size={16}/> Редактировать</button>
        <button className="danger-btn" onClick={onDelete}><Trash2 size={16}/> Удалить</button>
      </section>

      <section>
        <div className="section-title"><AlertTriangle size={16}/> Риски</div>
        {uniqueRisks.length ? uniqueRisks.map((r) => <div className="risk" key={r}>{r}</div>) : <div className="ok"><CheckCircle2 size={16}/> Критичных рисков нет</div>}
      </section>

      <section>
        <div className="section-title"><FileText size={16}/> Документы</div>
        {detail.documents.length ? detail.documents.map((d) => <div className="doc" key={d.id}>{d.type}: {d.name}</div>) : <div className="muted">Документы не загружены</div>}
      </section>

      <section className="totals">
        <div><span>Продажа</span><b>{money(detail.totals.sale_total)}</b></div>
        <div><span>Прибыль</span><b>{money(detail.totals.profit)}</b></div>
        <div><span>Маржа</span><b>{percent(detail.totals.margin)}</b></div>
      </section>
    </aside>
  );
}

function PositionsTable({ detail, suppliers, onUpdated }) {
  const [draft, setDraft] = useState({ name: '', qty: 1, unit: 'шт' });
  if (!detail) return <main className="workspace-empty">Нет выбранной работы</main>;

  async function updatePosition(id, patch) {
    await fetch(`${API}/api/positions/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    onUpdated();
  }

  async function addPosition() {
    if (!draft.name.trim()) return;
    await fetch(`${API}/api/works/${detail.work.id}/positions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
    });
    setDraft({ name: '', qty: 1, unit: 'шт' });
    onUpdated();
  }

  return (
    <main className="workspace">
      <header className="work-header">
        <div>
          <span className="eyebrow">{detail.work.code} · {detail.work.source} · {detail.work.state}</span>
          <h1>{detail.work.customer} — {detail.work.title}</h1>
          <p>{detail.work.object_name || 'Объект не указан'}</p>
        </div>
        <div className="big-progress"><span>{detail.progress}%</span><small>готовность</small></div>
      </header>

      <div className="toolbar">
        <button className="primary"><Plus size={16}/> Новая позиция</button>
        <button>Импорт Excel позже</button>
        <button>Сформировать КП позже</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>№</th><th>Группа</th><th>Позиция</th><th>Кол-во</th><th>Поставщик</th><th>Закупка</th><th>Продажа</th><th>Маржа</th><th>Срок</th><th>Отгрузка</th><th>Готово</th><th>Риски</th></tr></thead>
          <tbody>
            {detail.positions.map((p) => (
              <tr key={p.id}>
                <td>{p.row_no}</td>
                <td><input defaultValue={p.group_name || ''} onBlur={(e)=>updatePosition(p.id,{group_name:e.target.value})}/></td>
                <td className="wide"><input defaultValue={p.name} onBlur={(e)=>updatePosition(p.id,{name:e.target.value})}/></td>
                <td><input type="number" defaultValue={p.qty} onBlur={(e)=>updatePosition(p.id,{qty:Number(e.target.value)})}/></td>
                <td><select value={p.supplier_id || ''} onChange={(e)=>updatePosition(p.id,{supplier_id:e.target.value || null})}><option value="">—</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                <td><input type="number" defaultValue={p.purchase_price || ''} onBlur={(e)=>updatePosition(p.id,{purchase_price:e.target.value ? Number(e.target.value) : null})}/></td>
                <td><input type="number" defaultValue={p.sale_price || ''} onBlur={(e)=>updatePosition(p.id,{sale_price:e.target.value ? Number(e.target.value) : null})}/></td>
                <td className={p.margin !== null && p.margin < 15 ? 'bad' : 'good'}>{percent(p.margin)}</td>
                <td><input type="number" defaultValue={p.production_days || ''} onBlur={(e)=>updatePosition(p.id,{production_days:e.target.value ? Number(e.target.value) : null})}/></td>
                <td><input defaultValue={p.shipment_place || ''} onBlur={(e)=>updatePosition(p.id,{shipment_place:e.target.value})}/></td>
                <td><div className="mini-progress"><i style={{width:`${p.progress}%`}}/></div>{p.progress}%</td>
                <td>{p.warnings.slice(0,2).map(w => <span className="tag" key={w}>{w}</span>)}</td>
              </tr>
            ))}
            <tr className="new-row">
              <td>+</td><td><input placeholder="Группа" value={draft.group_name || ''} onChange={e=>setDraft({...draft, group_name:e.target.value})}/></td><td><input placeholder="Новая позиция" value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/></td><td><input type="number" value={draft.qty} onChange={e=>setDraft({...draft, qty:Number(e.target.value)})}/></td><td colSpan="8"><button onClick={addPosition}>Добавить строку</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}

function App() {
  const [works, setWorks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [q, setQ] = useState('');
  const [source, setSource] = useState('Все');
  const [urgency, setUrgency] = useState('Все');
  const [modal, setModal] = useState(null);

  async function loadWorks(nextActive = activeId) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (source !== 'Все') params.set('source', source);
    if (urgency !== 'Все') params.set('urgency', urgency);
    const res = await fetch(`${API}/api/works?${params}`);
    const data = await res.json();
    setWorks(data);
    if (nextActive && data.some(w => w.id === nextActive)) setActiveId(nextActive);
    else if (data[0]) setActiveId(data[0].id);
    else { setActiveId(null); setDetail(null); }
  }
  async function loadSuppliers() { const res = await fetch(`${API}/api/suppliers`); setSuppliers(await res.json()); }
  async function loadDetail(id = activeId) { if (!id) return; const res = await fetch(`${API}/api/works/${id}`); setDetail(await res.json()); loadWorks(id); }
  async function deleteActive() {
    if (!detail) return;
    if (!confirm(`Удалить работу ${detail.work.code}?`)) return;
    await fetch(`${API}/api/works/${detail.work.id}`, { method: 'DELETE' });
    setDetail(null); setActiveId(null); loadWorks(null);
  }

  useEffect(() => { loadWorks(); loadSuppliers(); }, []);
  useEffect(() => { const t = setTimeout(() => loadWorks(activeId), 250); return () => clearTimeout(t); }, [q, source, urgency]);
  useEffect(() => { loadDetail(activeId); }, [activeId]);

  const activeWork = useMemo(() => works.find(w => w.id === activeId), [works, activeId]);

  return (
    <div className="app">
      <aside className="left-rail">
        <div className="brand">PromApparat <b>Workspace</b></div>
        <button className="new-work" onClick={()=>setModal({mode:'create'})}><Plus size={16}/> Новая работа</button>
        <div className="search"><Search size={16}/><input placeholder="Поиск работы" value={q} onChange={e=>setQ(e.target.value)} /></div>
        <div className="filters"><select value={source} onChange={e=>setSource(e.target.value)}><option>Все</option>{SOURCES.map(x=><option key={x}>{x}</option>)}</select><select value={urgency} onChange={e=>setUrgency(e.target.value)}><option>Все</option><option>Горит</option><option>Сегодня</option><option>Просрочено</option></select></div>
        <div className="rail-title"><Clock size={16}/> Активные работы · {works.length}</div>
        <div className="work-list">{works.map(w => <WorkCard key={w.id} work={w} active={w.id===activeId} onClick={()=>setActiveId(w.id)} />)}</div>
      </aside>
      <PositionsTable detail={detail} suppliers={suppliers} onUpdated={()=>loadDetail(activeId)} />
      <AssistantPanel detail={detail} onEdit={()=>setModal({mode:'edit', work: detail.work})} onDelete={deleteActive} />
      {modal && <WorkForm initial={modal.mode === 'edit' ? modal.work : null} onClose={()=>setModal(null)} onSaved={(saved)=>{ setModal(null); loadWorks(saved.id); setActiveId(saved.id); }} />}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
