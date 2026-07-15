import React,{useMemo,useState}from'react';
import{AlertTriangle,ArrowRight,CheckCircle2,Compass,ExternalLink,FilePlus2,Flame,Search,Target,WalletCards}from'lucide-react';
import{daysLeft,money}from'../domain/workspace.js';

const stageForWork=state=>{if(['Новая','Анализ','Решение участвовать'].includes(state))return'Анализ';if(['Расчет','Ожидаем ТКП'].includes(state))return'ТКП';if(['КП готовится','КП отправлено','Переговоры','Договор'].includes(state))return'КП и договор';if(state==='Производство')return'Производство';if(state==='Отгрузка')return'Поставка и оплата';if(['Закрыто успешно','Закрыто проиграно','Архив'].includes(state))return'Завершено';return state||'Без стадии'};
const deadlineLabel=value=>{const days=daysLeft(value);if(days===999)return'Без срока';if(days<0)return`Просрочено ${Math.abs(days)} дн.`;if(days===0)return'Сегодня';if(days===1)return'Завтра';return`${days} дн.`};
const workflowTab=(work,data)=>{const action=String(work.nextAction||'').toLowerCase();if(action.includes('ткп')||action.includes('поставщик'))return'suppliers';if(action.includes('кп')||action.includes('цен'))return'quote';if(action.includes('производ')||action.includes('парт'))return'production';if(action.includes('достав')||action.includes('отгруз'))return'logistics';if(action.includes('оплат')||action.includes('счёт')||action.includes('счет'))return'payments';if(['Новая','Анализ','Решение участвовать'].includes(work.state))return(data.positions||[]).some(position=>position.workId===work.id)?'overview':'import';if(work.state==='Ожидаем ТКП')return'suppliers';if(['Расчет','КП готовится','КП отправлено','Переговоры','Договор'].includes(work.state))return'quote';if(work.state==='Производство')return'production';if(work.state==='Отгрузка')return'logistics';return'overview'};
const priorityScore=item=>{const days=daysLeft(item.actionDate);return(days<0?1000+Math.abs(days)*20:days===0?800:days===1?500:Math.max(0,200-days*10))+(item.blockers||0)*80+(item.paymentStatus==='Просрочено'?500:0)+(item.type==='opportunity'?30:0)};
const sameItem=(left,right)=>left&&right&&left.id===right.id&&left.type===right.type;

export function R4ManagerWorkspace({data,works,currentUser,onOpenWork,onOpenOpportunities,onNew}){
 const[query,setQuery]=useState('');
 const isManager=currentUser?.role==='manager';
 const items=useMemo(()=>{
  const ownWorks=isManager?works.filter(work=>work.manager===currentUser?.name):works;
  const ownOpps=(data.opportunities||[]).filter(item=>!item.workId&&(!isManager||item.owner===currentUser?.name));
  return[
   ...ownOpps.map(item=>({id:item.id,type:'opportunity',customer:item.customer||'Заказчик не указан',title:item.title||'Новый тендер',code:item.externalId||'Новая находка',stage:item.captureIncomplete?'Нужно дополнить':item.status||'На оценке',action:item.captureIncomplete?'Дополнить карточку тендера':'Принять решение об участии',actionDate:item.deadline,blockers:item.captureIncomplete?1:0,value:Number(item.estimatedAmount||0),paymentStatus:'',route:'opportunities'})),
   ...ownWorks.map(work=>({id:work.id,type:'work',customer:work.customer||'Заказчик не указан',title:work.title||'Без названия',code:work.code||'Сделка',stage:stageForWork(work.state),action:work.nextAction||'Уточнить следующее действие',actionDate:work.nextActionDate||work.deadline,blockers:Number(work.blockers||0),value:Number(work.totals?.saleTotal||0),paymentStatus:work.paymentStatus||'',route:workflowTab(work,data)}))
  ].filter(item=>item.stage!=='Завершено').sort((a,b)=>priorityScore(b)-priorityScore(a));
 },[data,works,currentUser?.name,isManager]);
 const filtered=items.filter(item=>`${item.code} ${item.customer} ${item.title} ${item.action} ${item.stage}`.toLowerCase().includes(query.toLowerCase()));
 const primary=filtered[0]||null;
 const overdue=filtered.filter(item=>daysLeft(item.actionDate)<0);
 const today=filtered.filter(item=>daysLeft(item.actionDate)===0);
 const urgent=[...overdue,...today];
 const nextUrgent=urgent.filter(item=>!sameItem(item,primary));
 const upcoming=filtered.filter(item=>daysLeft(item.actionDate)>0&&daysLeft(item.actionDate)<=3);
 const findings=filtered.filter(item=>item.type==='opportunity');
 const portfolio=filtered.filter(item=>item.type==='work');
 const uncheckedPlatforms=(data.platforms||[]).filter(item=>!item.checkedToday).slice(0,5);
 const waitingPayment=portfolio.filter(item=>['Счет выставлен','Частичная оплата','Просрочено'].includes(item.paymentStatus));
 const attentionCount=portfolio.filter(item=>item.blockers>0||daysLeft(item.actionDate)<=1||item.paymentStatus==='Просрочено').length;
 const open=item=>item.type==='opportunity'?onOpenOpportunities():onOpenWork(item.id,item.route);
 const actionCard=(item,index)=><button key={`${item.type}:${item.id}`} className={`day-action ${daysLeft(item.actionDate)<0?'overdue':''}`} onClick={()=>open(item)}><span className="day-action-index">{index+1}</span><div className="day-action-copy"><b>{item.action}</b><span>{item.customer} · {item.title}</span><small>{item.stage} · {deadlineLabel(item.actionDate)}</small></div><ArrowRight/></button>;
 return <main className="daydesk-page">
  <header className="daydesk-header">
   <div><span>Рабочий день</span><h1>{currentUser?.name||'Менеджер'}, вот что важно сейчас</h1><p>Главное действие, срочная очередь и поиск тендеров — на одном экране.</p></div>
   <div className="daydesk-header-actions"><button onClick={onOpenOpportunities}><Compass/>Все тендеры</button><button className="primary" onClick={onNew}><FilePlus2/>Добавить тендер</button></div>
  </header>

  <section className="daydesk-search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Найти тендер, заказчика, сделку или действие"/><kbd>Ctrl K</kbd></section>

  <section className="daydesk-summary">
   <article className={overdue.length?'danger':''}><AlertTriangle/><div><span>Просрочено</span><b>{overdue.length}</b></div></article>
   <article className={urgent.length?'required':''}><Flame/><div><span>Сегодня обязательно</span><b>{urgent.length}</b></div></article>
   <article><Compass/><div><span>Новые тендеры</span><b>{findings.length}</b></div></article>
   <article><WalletCards/><div><span>Ждём оплату</span><b>{waitingPayment.length}</b></div></article>
   <article><Target/><div><span>Активные сделки</span><b>{portfolio.length}</b></div></article>
  </section>

  <section className="daydesk-grid">
   <div className="daydesk-main">
    <section className="daydesk-primary">
     <div className="section-label"><Flame/>Начать с главного</div>
     {primary?<article><div><span>{primary.code} · {primary.stage}</span><h2>{primary.action}</h2><p>{primary.customer} · {primary.title}</p><div className="primary-meta"><b>{deadlineLabel(primary.actionDate)}</b>{primary.blockers>0&&<em>{primary.blockers} блокеров</em>}{primary.value>0&&<small>{money(primary.value,data.settings?.currency||'RUB')}</small>}</div></div><button onClick={()=>open(primary)}>Сделать сейчас <ArrowRight/></button></article>:<div className="daydesk-empty"><CheckCircle2/><b>Очередь разобрана</b><span>На сегодня нет активных действий.</span></div>}
    </section>

    <section className="daydesk-block urgent-block">
     <div className="daydesk-block-head"><div><span>Сегодня обязательно</span><h2>{urgent.length} действий</h2></div><small>{overdue.length?`Просрочено: ${overdue.length}`:'Срочные задачи на сегодня'}</small></div>
     <div className="day-action-list">{nextUrgent.slice(0,3).map(actionCard)}{urgent.length>0&&!nextUrgent.length&&<div className="daydesk-empty compact"><CheckCircle2/><span>Главное действие показано выше.</span></div>}{!urgent.length&&<div className="daydesk-empty compact"><CheckCircle2/><span>Срочных действий нет.</span></div>}</div>
    </section>

    <section className="daydesk-block upcoming-block">
     <div className="daydesk-block-head"><div><span>Следующие 3 дня</span><h2>Ближайшая работа</h2></div><small>{upcoming.length} действий</small></div>
     <div className="day-action-list">{upcoming.slice(0,4).map(actionCard)}{!upcoming.length&&<div className="daydesk-empty compact"><CheckCircle2/><span>Ближайшая очередь свободна.</span></div>}</div>
    </section>
   </div>

   <aside className="daydesk-side">
    <section className="search-round"><div className="section-label"><Search/>Поиск тендеров</div><h2>Что проверить сейчас</h2>{uncheckedPlatforms.length?uncheckedPlatforms.map(platform=><button key={platform.id} onClick={onOpenOpportunities}><span><b>{platform.name}</b><small>{platform.url||'Открыть площадку и проверить новые закупки'}</small></span><ExternalLink/></button>):<div className="daydesk-empty compact"><CheckCircle2/><span>Все площадки сегодня проверены.</span></div>}<button className="search-all" onClick={onOpenOpportunities}>Открыть журнал поиска <ArrowRight/></button></section>

    <section className="new-findings"><div className="section-label"><Compass/>Новые находки</div><h2>{findings.length} ждут решения</h2>{findings.slice(0,4).map(item=><button key={item.id} onClick={()=>open(item)}><div><b>{item.customer}</b><span>{item.title}</span><small>{item.stage} · {deadlineLabel(item.actionDate)}</small></div><ArrowRight/></button>)}{!findings.length&&<div className="daydesk-empty compact"><span>Новых тендеров пока нет.</span></div>}</section>

    <section className="daydesk-kpi"><div className="section-label"><Target/>Мой портфель</div><div><span>Сделок</span><b>{portfolio.length}</b></div><div><span>Сумма в работе</span><b>{money(portfolio.reduce((sum,item)=>sum+item.value,0),data.settings?.currency||'RUB')}</b></div><div><span>Требуют внимания</span><b>{attentionCount}</b></div></section>
   </aside>
  </section>
 </main>;
}