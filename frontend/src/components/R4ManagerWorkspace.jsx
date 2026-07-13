import React,{useMemo,useState}from'react';
import{AlertTriangle,ArrowRight,BriefcaseBusiness,CheckCircle2,Clock3,Compass,Filter,Plus,Search,WalletCards,X}from'lucide-react';
import{WORK_STATES,daysLeft,money,uid}from'../domain/workspace.js';

const stageForWork=state=>{
 if(['Новая','Анализ','Решение участвовать'].includes(state))return'Анализ';
 if(['Расчет','Ожидаем ТКП'].includes(state))return'Закупка и ТКП';
 if(['КП готовится','КП отправлено'].includes(state))return'Коммерческое предложение';
 if(state==='Переговоры')return'Переговоры';
 if(state==='Договор')return'Контракт';
 if(state==='Производство')return'Производство';
 if(state==='Отгрузка')return'Поставка';
 if(['Закрыто успешно','Закрыто проиграно','Архив'].includes(state))return'Завершено';
 return state||'Без стадии';
};
const stageClass=stage=>({Поиск:'search',Квалификация:'qualify','Анализ':'analysis','Закупка и ТКП':'supply','Коммерческое предложение':'quote','Переговоры':'negotiation','Контракт':'contract','Производство':'production','Поставка':'delivery','Завершено':'done'}[stage]||'analysis');
const deadlineText=value=>{const days=daysLeft(value);if(days===999)return'Без срока';if(days<0)return`Просрочено ${Math.abs(days)} дн.`;if(days===0)return'Сегодня';if(days===1)return'Завтра';return`${days} дн.`};
const compact=value=>new Intl.NumberFormat('ru-RU',{notation:'compact',maximumFractionDigits:1}).format(Number(value||0));
const paymentOptions=['Не выставлен','Счет выставлен','Частичная оплата','Оплачено','Просрочено'];

export function R4ManagerWorkspace({data,setData,works,currentUser,onOpenWork,onOpenOpportunities,onNew}){
 const isDirector=currentUser?.role==='director';
 const[query,setQuery]=useState(''),[stage,setStage]=useState('Все стадии'),[attentionOnly,setAttentionOnly]=useState(false),[selectedKey,setSelectedKey]=useState('');
 const rows=useMemo(()=>{
  const ownWorks=isDirector?works:works.filter(work=>work.manager===currentUser?.name);
  const ownOpps=(data.opportunities||[]).filter(item=>!item.workId&&(isDirector||item.owner===currentUser?.name));
  return[
   ...ownOpps.map(item=>({key:`opp:${item.id}`,type:'opportunity',id:item.id,code:item.externalId||'Новая',customer:item.customer,title:item.title,stage:item.status==='На оценке'?'Квалификация':'Поиск',deadline:item.deadline,nextAction:item.status==='На оценке'?'Принять решение об участии':'Провести экспресс-анализ',progress:item.status==='На оценке'?20:8,revenue:Number(item.estimatedAmount||0),grossProfit:0,netProfit:0,margin:null,manager:item.owner||'—',blockers:item.status==='На оценке'?0:1,paymentStatus:'—',source:item.platformId,status:item.status,raw:item})),
   ...ownWorks.map(work=>({key:`work:${work.id}`,type:'work',id:work.id,code:work.code,customer:work.customer,title:work.title,stage:stageForWork(work.state),deadline:work.deadline,nextAction:work.nextAction,progress:work.progress,revenue:Number(work.totals?.saleTotal||0),grossProfit:Number(work.totals?.grossProfit||0),netProfit:Number(work.totals?.netProfit||0),margin:work.totals?.saleTotal?Number(work.totals.grossProfit||0)/Number(work.totals.saleTotal)*100:null,manager:work.manager||'—',blockers:Number(work.blockers||0),paymentStatus:work.paymentStatus||(['Закрыто успешно'].includes(work.state)?'Оплачено':'Не выставлен'),source:work.source,status:work.state,raw:work}))
  ].sort((a,b)=>{const ar=daysLeft(a.deadline),br=daysLeft(b.deadline);return ar-br||b.blockers-a.blockers});
 },[data.opportunities,works,currentUser?.name,isDirector]);
 const stages=['Все стадии',...new Set(rows.map(item=>item.stage))];
 const filtered=rows.filter(item=>{
  const text=`${item.code} ${item.customer} ${item.title} ${item.manager} ${item.stage}`.toLowerCase();
  const needsAttention=item.blockers>0||daysLeft(item.deadline)<=1||item.paymentStatus==='Просрочено';
  return(!query||text.includes(query.toLowerCase()))&&(stage==='Все стадии'||item.stage===stage)&&(!attentionOnly||needsAttention);
 });
 const selected=rows.find(item=>item.key===selectedKey)||filtered[0]||null;
 const today=new Date().toISOString().slice(0,10),foundToday=(data.opportunities||[]).filter(item=>String(item.createdAt||'').slice(0,10)===today&&(isDirector||item.owner===currentUser?.name)).length;
 const activeCount=rows.filter(item=>item.stage!=='Завершено').length,attentionCount=rows.filter(item=>item.blockers>0||daysLeft(item.deadline)<=1||item.paymentStatus==='Просрочено').length,quoteToday=rows.filter(item=>item.stage==='Коммерческое предложение').length,paymentCount=rows.filter(item=>['Счет выставлен','Частичная оплата','Просрочено'].includes(item.paymentStatus)).length,overdue=rows.filter(item=>daysLeft(item.deadline)<0&&item.stage!=='Завершено').length;
 const updateWork=(id,patch,label)=>setData(current=>{const work=current.works.find(item=>item.id===id);if(!work)return current;const next={...work,...patch,updatedAt:new Date().toISOString()};return{...current,works:current.works.map(item=>item.id===id?next:item),events:[{id:uid(),workId:id,entityType:'work',entityId:id,type:'r4',title:label,detail:Object.entries(patch).map(([key,value])=>`${key}: ${value}`).join(' · '),author:currentUser?.name||'Пользователь',actorId:currentUser?.id||null,createdAt:new Date().toISOString(),source:'r4-manager'},...(current.events||[])]}});
 const openSelected=()=>{if(!selected)return;if(selected.type==='work')onOpenWork(selected.id);else onOpenOpportunities()};
 return <main className="r4-manager-page">
  <header className="r4-manager-head"><div><span>R4.0 Alpha · Manager Workspace</span><h1>{isDirector?'Рабочий стол сделок':'Мой рабочий стол'}</h1><p>Единый поток от найденной закупки до поставки и оплаты.</p></div><div className="r4-head-actions"><button onClick={onOpenOpportunities}><Compass/>Найти тендер</button><button className="primary" onClick={onNew}><Plus/>Новая сделка</button></div></header>
  <section className="r4-day-strip">
   <article><Compass/><div><span>Найдено сегодня</span><b>{foundToday}</b></div></article>
   <article><BriefcaseBusiness/><div><span>Активных сделок</span><b>{activeCount}</b></div></article>
   <article className={attentionCount?'warn':''}><AlertTriangle/><div><span>Требуют внимания</span><b>{attentionCount}</b></div></article>
   <article><ArrowRight/><div><span>КП в работе</span><b>{quoteToday}</b></div></article>
   <article><WalletCards/><div><span>Ожидают оплату</span><b>{paymentCount}</b></div></article>
   <article className={overdue?'danger':''}><Clock3/><div><span>Просрочено</span><b>{overdue}</b></div></article>
  </section>
  <section className="r4-workbench">
   <div className="r4-deal-register">
    <div className="r4-register-toolbar"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск по сделкам, заказчикам и номерам"/></label><select value={stage} onChange={event=>setStage(event.target.value)}>{stages.map(item=><option key={item}>{item}</option>)}</select><button className={attentionOnly?'active':''} onClick={()=>setAttentionOnly(value=>!value)}><Filter/>Только внимание</button></div>
    <div className="r4-table-wrap"><table className="r4-deals-table"><thead><tr><th>Сделка</th><th>Заказчик / предмет</th><th>Стадия</th><th>Следующее действие</th><th>Срок</th><th>Выручка</th><th>Маржа</th><th>Оплата</th><th>Ответственный</th></tr></thead><tbody>{filtered.map(item=>{const urgent=daysLeft(item.deadline)<=1&&item.stage!=='Завершено';return <tr key={item.key} className={`${selected?.key===item.key?'selected':''} ${urgent?'urgent':''}`} onClick={()=>setSelectedKey(item.key)}><td><b>{item.code}</b><small>{item.type==='opportunity'?'Возможность':'Проект'}</small></td><td><b>{item.customer}</b><small>{item.title}</small></td><td><span className={`r4-stage ${stageClass(item.stage)}`}>{item.stage}</span></td><td><span className="r4-next">{item.blockers>0&&<AlertTriangle/>}{item.nextAction}</span></td><td className={urgent?'bad':''}>{deadlineText(item.deadline)}</td><td><b>{item.revenue?compact(item.revenue):'—'}</b><small>{item.revenue?money(item.revenue,data.settings?.currency||'RUB'):'Нет расчета'}</small></td><td>{item.margin==null?'—':`${item.margin.toFixed(1)}%`}</td><td><span className={`r4-payment ${item.paymentStatus==='Оплачено'?'paid':item.paymentStatus==='Просрочено'?'late':''}`}>{item.paymentStatus}</span></td><td>{item.manager}</td></tr>})}</tbody></table>{!filtered.length&&<div className="r4-empty">По выбранным условиям сделок нет.</div>}</div>
    <footer className="r4-register-footer"><span>{filtered.length} сделок</span><span>{filtered.filter(item=>item.type==='opportunity').length} возможностей</span><span>{filtered.filter(item=>item.type==='work').length} проектов</span><span>{money(filtered.reduce((sum,item)=>sum+item.revenue,0),data.settings?.currency||'RUB')} в выборке</span></footer>
   </div>
   <aside className="r4-deal-panel">{selected?<>
    <div className="r4-panel-top"><div><span>{selected.type==='opportunity'?'Найденная возможность':selected.code}</span><h2>{selected.customer}</h2><p>{selected.title}</p></div><button onClick={()=>setSelectedKey('')}><X/></button></div>
    <div className="r4-panel-stage"><span className={`r4-stage ${stageClass(selected.stage)}`}>{selected.stage}</span><b>{selected.progress}%</b><div><i style={{width:`${selected.progress}%`}}/></div></div>
    <section className="r4-action-card"><span>Следующее действие</span><h3>{selected.nextAction}</h3><div><Clock3/><b>{deadlineText(selected.deadline)}</b>{selected.blockers>0&&<em>{selected.blockers} блокеров</em>}</div><button className="primary" onClick={openSelected}>Перейти к работе <ArrowRight/></button></section>
    {selected.type==='work'?<>
     <section className="r4-panel-section"><div className="r4-section-title"><span>Оперативные данные</span><b>Менеджер вводит факты</b></div><label>Стадия сделки<select value={selected.status} onChange={event=>updateWork(selected.id,{state:event.target.value},'Изменена стадия сделки')}>{WORK_STATES.map(item=><option key={item}>{item}</option>)}</select></label><label>Статус оплаты<select value={selected.paymentStatus} onChange={event=>updateWork(selected.id,{paymentStatus:event.target.value},'Изменен статус оплаты')}>{paymentOptions.map(item=><option key={item}>{item}</option>)}</select></label><label>Плановая дата оплаты<input type="date" value={selected.raw.expectedPaymentDate||''} onChange={event=>updateWork(selected.id,{expectedPaymentDate:event.target.value},'Изменена плановая дата оплаты')}/></label></section>
     <section className="r4-economy"><div><span>Продажа</span><b>{money(selected.revenue,data.settings?.currency||'RUB')}</b></div><div><span>Валовая прибыль</span><b>{money(selected.grossProfit,data.settings?.currency||'RUB')}</b></div><div><span>Чистая прибыль</span><b>{money(selected.netProfit,data.settings?.currency||'RUB')}</b></div><div><span>Маржа сделки</span><b>{selected.margin==null?'—':`${selected.margin.toFixed(1)}%`}</b></div></section>
    </>:<section className="r4-panel-section opportunity"><Compass/><h3>Сначала оценить возможность</h3><p>Проверьте профиль, производителя, срок и коммерческий интерес. После решения «Взять в работу» здесь автоматически появится проект.</p></section>}
    <section className="r4-lifecycle"><span>Путь сделки</span>{['Поиск','Анализ','ТКП','КП','Контракт','Производство','Поставка','Оплата'].map((item,index)=><div key={item} className={index<=Math.round(selected.progress/100*7)?'done':''}><i>{index<Math.round(selected.progress/100*7)?<CheckCircle2/>:index+1}</i><b>{item}</b></div>)}</section>
   </>:<div className="r4-panel-empty"><BriefcaseBusiness/><h2>Выберите сделку</h2><p>Справа появятся следующее действие, экономика и оперативные поля.</p></div>}</aside>
  </section>
 </main>;
}
