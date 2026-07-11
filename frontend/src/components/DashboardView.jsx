import React,{useMemo}from'react';
import{AlertTriangle,ArrowRight,CheckCircle2,Clock3,FileCheck2,Mail,PackageCheck,Target,TrendingUp,Zap}from'lucide-react';
import{daysLeft,money}from'../domain/workspace.js';

export function DashboardView({works,onOpenWork}){
 const stats=useMemo(()=>{
  const allPositions=works.flatMap(work=>work.positions.map(position=>({...position,work})));
  const deadlinesToday=works.filter(work=>daysLeft(work.deadline)<=0).length;
  const waitingTkp=allPositions.filter(position=>position.offers.length&&!position.offers.some(offer=>offer.hasTkp)).length;
  const noSupplier=allPositions.filter(position=>!position.offers.length).length;
  const readyForQuote=allPositions.filter(position=>position.nextStep==='Готово к КП').length;
  const blocked=allPositions.filter(position=>position.warnings.length).length;
  const potentialProfit=works.reduce((sum,work)=>sum+Number(work.totals.profit||0),0);
  return{deadlinesToday,waitingTkp,noSupplier,readyForQuote,blocked,potentialProfit,allPositions};
 },[works]);
 const actions=useMemo(()=>{
  const items=[];
  works.forEach(work=>{
   work.positions.forEach(position=>{
    const days=daysLeft(work.deadline);
    let priority=3;
    if(days<=0)priority=0;else if(days<=1)priority=1;else if(position.warnings.length>2)priority=2;
    items.push({id:`${work.id}-${position.id}`,work,position,priority,title:position.nextStep,subtitle:`${work.customer} · позиция №${position.rowNo} · ${position.name}`,deadline:days});
   });
  });
  return items.sort((a,b)=>a.priority-b.priority||a.deadline-b.deadline).slice(0,8);
 },[works]);
 const hotWork=works.slice().sort((a,b)=>daysLeft(a.deadline)-daysLeft(b.deadline)||b.blockers-a.blockers)[0];
 return <main className="dashboard-page">
  <section className="dashboard-hero"><div><span>Центр управления</span><h1>Сегодня нужно выполнить {actions.length} приоритетных действий</h1><p>Система собрала тендеры, позиции и поставщиков в одну рабочую очередь.</p></div>{hotWork&&<button onClick={()=>onOpenWork(hotWork.id)}><Zap/>Начать с {hotWork.customer}<ArrowRight/></button>}</section>
  <section className="dashboard-signals">
   <article className="signal-card critical"><Clock3/><div><span>Дедлайны сегодня</span><b>{stats.deadlinesToday}</b></div></article>
   <article className="signal-card warning"><Mail/><div><span>ТКП не получено</span><b>{stats.waitingTkp}</b></div></article>
   <article className="signal-card warning"><AlertTriangle/><div><span>Нет поставщика</span><b>{stats.noSupplier}</b></div></article>
   <article className="signal-card success"><FileCheck2/><div><span>Готово к КП</span><b>{stats.readyForQuote}</b></div></article>
   <article className="signal-card info"><TrendingUp/><div><span>Потенциальная прибыль</span><b>{money(stats.potentialProfit)}</b></div></article>
  </section>
  <section className="dashboard-grid">
   <div className="dashboard-main-card"><div className="dashboard-section-head"><div><span>Автопилот менеджера</span><h2>Очередь действий</h2></div><em>{stats.blocked} позиций требуют внимания</em></div><div className="action-queue">{actions.map((item,index)=><button key={item.id} onClick={()=>onOpenWork(item.work.id)} className={`queue-item priority-${item.priority}`}><span className="queue-number">{index+1}</span><div><b>{item.title}</b><p>{item.subtitle}</p></div><small>{item.deadline<=0?'сегодня':`${item.deadline} дн.`}</small><ArrowRight/></button>)}</div></div>
   <aside className="dashboard-side">
    <section><div className="mini-title"><Target/>Состояние отдела</div><div className="health-line"><span>Активные тендеры</span><b>{works.length}</b></div><div className="health-line"><span>Проблемные позиции</span><b>{stats.blocked}</b></div><div className="health-line"><span>Готовность к КП</span><b>{stats.readyForQuote}</b></div></section>
    <section><div className="mini-title"><PackageCheck/>Ближайшие тендеры</div>{works.slice().sort((a,b)=>daysLeft(a.deadline)-daysLeft(b.deadline)).slice(0,4).map(work=><button className="deadline-row" key={work.id} onClick={()=>onOpenWork(work.id)}><div><b>{work.customer}</b><span>{work.title}</span></div><em>{daysLeft(work.deadline)<=0?'сегодня':`${daysLeft(work.deadline)} дн.`}</em></button>)}</section>
    <section className="dashboard-ready"><CheckCircle2/><div><b>{stats.readyForQuote} позиций готовы</b><span>Можно переходить к формированию коммерческих предложений.</span></div></section>
   </aside>
  </section>
 </main>
}
