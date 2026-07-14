import React from'react';
import{AlertTriangle,ArrowRight,CalendarClock,CheckCircle2,FileText,Target,TrendingUp}from'lucide-react';
import{daysLeft,money}from'../domain/workspace.js';

const deadline=value=>{const days=daysLeft(value);if(days<0)return`Просрочено на ${Math.abs(days)} дн.`;if(days===0)return'Дедлайн сегодня';if(days===1)return'Дедлайн завтра';return days===999?'Срок не указан':`До дедлайна ${days} дн.`};

export function WorkContextPanel({work,data,onSelectPosition,readOnly=false}){
 if(!work)return null;const currency=data.settings?.currency||'RUB',risk=work.positions.filter(position=>position.warnings.length),next=risk[0]||work.activePositions[0]||null;
 return <aside className="context-panel"><div className="context-head"><span>{readOnly?'Контроль сделки':'Контекст сделки'}</span><h2>{work.customer}</h2><p>{work.code} · {work.state}</p></div>
  {readOnly&&<div className="readonly-note">Директор видит показатели и риски. Детали позиции редактирует менеджер.</div>}
  <section className="context-action"><div><Target/><span>Следующее действие</span></div><h3>{next?.nextStep||work.nextAction}</h3>{next&&<p>Позиция №{next.rowNo} · {next.name}</p>}{next&&!readOnly&&<button onClick={()=>onSelectPosition(next.id)}>Открыть позицию<ArrowRight/></button>}</section>
  <section><div className="context-title"><CalendarClock/>Срок</div><b className={daysLeft(work.deadline)<0?'context-danger':''}>{deadline(work.deadline)}</b></section>
  <section><div className="context-title"><TrendingUp/>Экономика</div><div className="context-metric"><span>Чистая прибыль</span><b>{money(work.totals.netProfit,currency)}</b></div><div className="context-metric"><span>Валовая прибыль</span><b>{money(work.totals.grossProfit,currency)}</b></div></section>
  <section><div className="context-title"><AlertTriangle/>Риски</div>{risk.slice(0,4).map(position=>readOnly?<div className="context-risk static" key={position.id}><div><b>№{position.rowNo} {position.name}</b><span>{position.warnings.join(' · ')}</span></div></div>:<button className="context-risk" key={position.id} onClick={()=>onSelectPosition(position.id)}><div><b>№{position.rowNo} {position.name}</b><span>{position.warnings.join(' · ')}</span></div><ArrowRight/></button>)}{!risk.length&&<div className="context-ok"><CheckCircle2/>Критических рисков нет</div>}</section>
  <section><div className="context-title"><FileText/>Комплектность</div><div className="context-metric"><span>Позиции</span><b>{work.positions.length}</b></div><div className="context-metric"><span>Документы</span><b>{(data.documents||[]).filter(item=>item.workId===work.id).length}</b></div></section>
 </aside>;
}
