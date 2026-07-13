import React,{useMemo,useState}from'react';
import{CheckSquare,ChevronRight,Filter,Search,Square,Users}from'lucide-react';
import{money}from'../domain/workspace.js';
import{bulkUpdateOpportunities,OPPORTUNITY_STATUSES,updateOpportunityFields}from'../domain/opportunities.js';

const compact=value=>new Intl.NumberFormat('ru-RU',{notation:'compact',maximumFractionDigits:1}).format(Number(value||0));
const statusClass=status=>status==='Взята в работу'?'accepted':status==='Отказ'?'rejected':status==='На оценке'?'review':'new';

export function OpportunitySpreadsheet({data,setData,currentUser,selectedId,setSelectedId,onOpenWork}){
 const[query,setQuery]=useState(''),[status,setStatus]=useState('Все'),[platform,setPlatform]=useState('Все'),[owner,setOwner]=useState('Все'),[selectedIds,setSelectedIds]=useState([]),[bulkOwner,setBulkOwner]=useState(''),[error,setError]=useState('');
 const platformMap=useMemo(()=>new Map((data.platforms||[]).map(item=>[item.id,item])),[data.platforms]);
 const owners=useMemo(()=>[...new Set([...(data.users||[]).map(user=>user.name),...(data.opportunities||[]).map(item=>item.owner)].filter(Boolean))],[data.users,data.opportunities]);
 const list=(data.opportunities||[]).filter(item=>(status==='Все'||item.status===status)&&(platform==='Все'||item.platformId===platform)&&(owner==='Все'||item.owner===owner)&&`${item.customer} ${item.title} ${item.externalId} ${platformMap.get(item.platformId)?.name||''}`.toLowerCase().includes(query.toLowerCase()));
 const allSelected=list.length>0&&list.every(item=>selectedIds.includes(item.id));
 const run=operation=>{try{setData(current=>operation(current));setError('')}catch(exception){setError(exception?.message||'Не удалось сохранить изменения')}};
 const update=(id,patch)=>run(current=>updateOpportunityFields(current,id,patch,currentUser));
 const commitText=(item,field,value)=>{if(String(item[field]??'')!==String(value??''))update(item.id,{[field]:value})};
 const toggle=id=>setSelectedIds(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
 const toggleAll=()=>setSelectedIds(allSelected?selectedIds.filter(id=>!list.some(item=>item.id===id)):[...new Set([...selectedIds,...list.map(item=>item.id)])]);
 const assign=()=>{if(!bulkOwner)return;run(current=>bulkUpdateOpportunities(current,selectedIds,{owner:bulkOwner},currentUser));setSelectedIds([]);setBulkOwner('')};
 return <section className="opp-sheet-shell">
  {error&&<div className="inline-error">{error}</div>}
  <div className="opp-sheet-toolbar">
   <label className="opp-sheet-search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск по заказчику, закупке, номеру или площадке"/></label>
   <select value={status} onChange={event=>setStatus(event.target.value)}><option value="Все">Все статусы</option>{OPPORTUNITY_STATUSES.map(item=><option key={item}>{item}</option>)}</select>
   <select value={platform} onChange={event=>setPlatform(event.target.value)}><option value="Все">Все площадки</option>{(data.platforms||[]).map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select>
   <select value={owner} onChange={event=>setOwner(event.target.value)}><option value="Все">Все сотрудники</option>{owners.map(item=><option key={item}>{item}</option>)}</select>
   <Filter/>
  </div>
  {selectedIds.length>0&&<div className="opp-bulkbar"><b>{selectedIds.length} выбрано</b><span>Назначить ответственного</span><select value={bulkOwner} onChange={event=>setBulkOwner(event.target.value)}><option value="">Выберите сотрудника</option>{owners.map(item=><option key={item}>{item}</option>)}</select><button onClick={assign}><Users/>Назначить</button><button className="ghost" onClick={()=>setSelectedIds([])}>Снять выбор</button></div>}
  <div className="opp-sheet-wrap">
   <table className="opp-sheet">
    <thead><tr><th className="check-cell"><button onClick={toggleAll}>{allSelected?<CheckSquare/>:<Square/>}</button></th><th>Заказчик</th><th>Предмет закупки</th><th>Площадка</th><th>№ закупки</th><th>Сумма</th><th>Дедлайн</th><th>Ответственный</th><th>Статус</th><th></th></tr></thead>
    <tbody>{list.map(item=><tr key={`${item.id}-${item.updatedAt||''}`} className={selectedId===item.id?'active-row':''} onClick={()=>setSelectedId(item.id)}>
     <td className="check-cell" onClick={event=>event.stopPropagation()}><button onClick={()=>toggle(item.id)}>{selectedIds.includes(item.id)?<CheckSquare/>:<Square/>}</button></td>
     <td><input defaultValue={item.customer} onBlur={event=>commitText(item,'customer',event.target.value)} onClick={event=>event.stopPropagation()}/></td>
     <td><textarea defaultValue={item.title} onBlur={event=>commitText(item,'title',event.target.value)} onClick={event=>event.stopPropagation()}/></td>
     <td><select value={item.platformId||''} onChange={event=>update(item.id,{platformId:event.target.value})} onClick={event=>event.stopPropagation()}>{(data.platforms||[]).map(option=><option value={option.id} key={option.id}>{option.name}</option>)}</select></td>
     <td><input defaultValue={item.externalId||''} onBlur={event=>commitText(item,'externalId',event.target.value)} onClick={event=>event.stopPropagation()}/></td>
     <td><div className="money-cell"><input type="number" min="0" defaultValue={item.estimatedAmount||''} onBlur={event=>commitText(item,'estimatedAmount',event.target.value)} onClick={event=>event.stopPropagation()}/><small>{compact(item.estimatedAmount)} · {money(item.estimatedAmount,data.settings?.currency||'RUB')}</small></div></td>
     <td><input type="date" value={item.deadline||''} onChange={event=>update(item.id,{deadline:event.target.value})} onClick={event=>event.stopPropagation()}/></td>
     <td><select value={item.owner||''} onChange={event=>update(item.id,{owner:event.target.value})} onClick={event=>event.stopPropagation()}><option value="">Не назначен</option>{owners.map(option=><option key={option}>{option}</option>)}</select></td>
     <td><span className={`opp-status ${statusClass(item.status)}`}>{item.status}</span></td>
     <td className="row-actions"><button onClick={event=>{event.stopPropagation();setSelectedId(item.id)}}><ChevronRight/></button>{item.status==='Взята в работу'&&item.workId&&<button onClick={event=>{event.stopPropagation();onOpenWork(item.workId)}}>Проект</button>}</td>
    </tr>)}</tbody>
   </table>
   {!list.length&&<div className="opportunity-empty">По выбранным фильтрам ничего не найдено</div>}
  </div>
  <footer className="opp-sheet-footer"><span>{list.length} строк</span><span>{list.filter(item=>item.status==='Новая').length} новых</span><span>{list.filter(item=>item.status==='На оценке').length} на оценке</span><span>{list.filter(item=>item.status==='Взята в работу').length} в работе</span></footer>
 </section>;
}
