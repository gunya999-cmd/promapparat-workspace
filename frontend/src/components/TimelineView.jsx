import React,{useMemo,useState}from'react';
import{Activity,Building2,CircleDollarSign,FileText,MessageSquare,PackageCheck,Search,Send,Tag,Truck,UserRound}from'lucide-react';
import{ACTIVITY_TYPES,recordActivity}from'../domain/activity.js';
import'./timeline.css';

const iconFor=type=>{
 if(type==='position')return<PackageCheck/>;
 if(type==='offer')return<Building2/>;
 if(type==='price')return<CircleDollarSign/>;
 if(type==='document')return<FileText/>;
 if(type==='shipment')return<Truck/>;
 if(type==='comment')return<MessageSquare/>;
 return<Tag/>;
};
const dayLabel=value=>{
 const date=new Date(value),today=new Date(),yesterday=new Date(Date.now()-86400000);
 const key=date.toDateString();
 if(key===today.toDateString())return'Сегодня';
 if(key===yesterday.toDateString())return'Вчера';
 return date.toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'});
};

export function TimelineView({work,data,setData}){
 const[query,setQuery]=useState('');
 const[type,setType]=useState('all');
 const[comment,setComment]=useState('');
 const events=useMemo(()=>{
  return(data.events||[])
   .filter(event=>event.workId===work.id)
   .filter(event=>type==='all'||event.type===type)
   .filter(event=>!query||`${event.title} ${event.detail} ${event.author}`.toLowerCase().includes(query.toLowerCase()))
   .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
 },[data.events,work.id,type,query]);
 const all=(data.events||[]).filter(event=>event.workId===work.id);
 const todayCount=all.filter(event=>new Date(event.createdAt).toDateString()===new Date().toDateString()).length;
 const addComment=()=>{
  const text=comment.trim();if(!text)return;
  setData(current=>recordActivity(current,{workId:work.id,type:'comment',title:'Добавлен комментарий',detail:text,author:work.manager||'Менеджер'}));
  setComment('');
 };
 let previousDay='';
 return<section className="timeline-view">
  <div className="timeline-summary">
   <div><span>Всего событий</span><b>{all.length}</b></div>
   <div><span>Сегодня</span><b>{todayCount}</b></div>
   <div><span>Комментарии</span><b>{all.filter(event=>event.type==='comment').length}</b></div>
  </div>
  <div className="timeline-compose">
   <div className="timeline-avatar"><UserRound/></div>
   <textarea value={comment} onChange={event=>setComment(event.target.value)} placeholder="Комментарий, поручение или важная заметка по тендеру" onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter')addComment()}}/>
   <button className="primary" onClick={addComment}><Send/>Добавить</button>
  </div>
  <div className="timeline-toolbar">
   <label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск по истории"/></label>
   <select value={type} onChange={event=>setType(event.target.value)}>{ACTIVITY_TYPES.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select>
  </div>
  <div className="timeline-list">
   {events.length?events.map(event=>{
    const label=dayLabel(event.createdAt),showDay=label!==previousDay;previousDay=label;
    return<React.Fragment key={event.id}>
     {showDay&&<div className="timeline-day">{label}</div>}
     <article className={`timeline-event type-${event.type}`}>
      <div className="timeline-icon">{iconFor(event.type)}</div>
      <div className="timeline-body"><div className="timeline-event-head"><b>{event.title}</b><time>{new Date(event.createdAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time></div>{event.detail&&<p>{event.detail}</p>}<small>{event.author}{event.positionId?` · позиция ${work.positions.find(item=>item.id===event.positionId)?.rowNo||''}`:''}</small></div>
     </article>
    </React.Fragment>
   }):<div className="timeline-empty"><Activity/><b>Событий не найдено</b><span>Изменения по тендеру будут появляться здесь автоматически.</span></div>}
  </div>
 </section>;
}
