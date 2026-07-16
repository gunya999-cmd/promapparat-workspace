import React,{useMemo,useState}from'react';
import{ExternalLink,Plus,Search,Trash2}from'lucide-react';
import{uid}from'../domain/workspace.js';
import{deleteOpportunities,setOpportunityStatus,updateOpportunityFields,OPPORTUNITY_STATUSES}from'../domain/opportunities.js';

const newRow=actor=>({id:uid(),platformId:'',externalId:'',customer:'',title:'',estimatedAmount:0,deadline:'',status:'Новая',owner:actor?.name||'',notes:'',sourceUrl:'',captureMethod:'manual',captureIncomplete:true,attachments:[],createdAt:new Date().toISOString(),createdBy:actor?.id||null});

export function ManagerExcelRegister({data,setData,currentUser,onOpenWork}){
 const[query,setQuery]=useState(''),[status,setStatus]=useState('Все'),[error,setError]=useState('');
 const rows=useMemo(()=>(data.opportunities||[]).filter(item=>(status==='Все'||item.status===status)&&`${item.customer} ${item.title} ${item.externalId} ${item.notes}`.toLowerCase().includes(query.toLowerCase())),[data.opportunities,query,status]);
 const platformMap=useMemo(()=>new Map((data.platforms||[]).map(item=>[item.id,item])),[data.platforms]);
 const run=operation=>{try{setData(current=>operation(current));setError('')}catch(exception){setError(exception?.message||'Не удалось сохранить')};};
 const addRow=()=>setData(current=>({...current,opportunities:[newRow(currentUser),...(current.opportunities||[])]}));
 const patch=(id,field,value)=>run(current=>updateOpportunityFields(current,id,{[field]:value},currentUser));
 const changeStatus=(item,value)=>{if(value==='Взята в работу'&&!item.workId){setError('Чтобы создать сделку, сначала заполните карточку и используйте действие «Взять в работу».');return}run(current=>setOpportunityStatus(current,item.id,value,currentUser));};
 const remove=item=>{if(!window.confirm(`Удалить тендер «${item.customer||item.title||'без названия'}»?`))return;run(current=>deleteOpportunities(current,[item.id],currentUser));};
 const commitRequired=(item,field,value)=>{const text=String(value||'').trim();if(!text){setError(field==='customer'?'Укажите заказчика':'Укажите предмет закупки');return}patch(item.id,field,text)};
 return <main className="excel-register-page">
  <header className="excel-register-head"><div><span>Реестр менеджера</span><h1>Тендеры и заявки</h1><p>Вводите данные прямо в таблицу. Все изменения сохраняются автоматически.</p></div><button onClick={addRow}><Plus/>Добавить строку</button></header>
  {error&&<div className="excel-register-error">{error}<button onClick={()=>setError('')}>×</button></div>}
  <section className="excel-register-toolbar"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск по таблице"/></label><select value={status} onChange={event=>setStatus(event.target.value)}><option>Все</option>{OPPORTUNITY_STATUSES.map(item=><option key={item}>{item}</option>)}</select><span>{rows.length} строк</span></section>
  <section className="excel-register-wrap"><table className="excel-register-table"><thead><tr><th>№</th><th>Дата</th><th>Заказчик</th><th>Предмет закупки</th><th>Ссылка</th><th>№ закупки</th><th>Площадка</th><th>Сумма</th><th>Срок подачи</th><th>Статус</th><th>Комментарий</th><th></th></tr></thead><tbody>{rows.map((item,index)=><tr key={`${item.id}-${item.updatedAt||''}`} className={item.captureIncomplete?'incomplete':''}>
   <td className="row-number">{index+1}</td>
   <td><input type="date" value={String(item.createdAt||'').slice(0,10)} onChange={event=>patch(item.id,'createdAt',event.target.value)}/></td>
   <td><input defaultValue={item.customer||''} placeholder="Заказчик" onBlur={event=>commitRequired(item,'customer',event.target.value)}/></td>
   <td><textarea defaultValue={item.title||''} placeholder="Что закупают" onBlur={event=>commitRequired(item,'title',event.target.value)}/></td>
   <td><div className="url-cell"><input defaultValue={item.sourceUrl||''} placeholder="https://" onBlur={event=>patch(item.id,'sourceUrl',event.target.value)}/>{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noreferrer" title="Открыть ссылку"><ExternalLink/></a>}</div></td>
   <td><input defaultValue={item.externalId||''} onBlur={event=>patch(item.id,'externalId',event.target.value)}/></td>
   <td><select value={item.platformId||''} onChange={event=>patch(item.id,'platformId',event.target.value)}><option value="">—</option>{(data.platforms||[]).map(option=><option value={option.id} key={option.id}>{option.name}</option>)}</select><small>{platformMap.get(item.platformId)?.name||''}</small></td>
   <td><input type="number" min="0" defaultValue={item.estimatedAmount||''} onBlur={event=>patch(item.id,'estimatedAmount',event.target.value)}/></td>
   <td><input type="date" value={item.deadline||''} onChange={event=>patch(item.id,'deadline',event.target.value)}/></td>
   <td><select value={item.status||'Новая'} onChange={event=>changeStatus(item,event.target.value)}>{OPPORTUNITY_STATUSES.map(option=><option key={option}>{option}</option>)}</select>{item.workId&&<button className="open-work" onClick={()=>onOpenWork(item.workId)}>Открыть сделку</button>}</td>
   <td><textarea defaultValue={item.notes||''} placeholder="Комментарий" onBlur={event=>patch(item.id,'notes',event.target.value)}/></td>
   <td><button className="delete-row" onClick={()=>remove(item)} disabled={!!item.workId} title={item.workId?'Связанный тендер удаляется через сделку':'Удалить строку'}><Trash2/></button></td>
  </tr>)}</tbody></table>{!rows.length&&<div className="excel-register-empty">Таблица пуста. Нажмите «Добавить строку».</div>}</section>
 </main>;
}
