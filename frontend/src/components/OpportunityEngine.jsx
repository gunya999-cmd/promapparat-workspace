import React,{useEffect,useMemo,useState}from'react';
import{Clipboard,ExternalLink,ShieldCheck}from'lucide-react';
import{acceptOpportunity,rejectOpportunity,updateOpportunityQualification}from'../domain/opportunities.js';
import{OpportunitySpreadsheet}from'./OpportunitySpreadsheet.jsx';
import{OpportunityDecisionPanel}from'./OpportunityDecisionPanel.jsx';

const hasExcelAttachment=opportunity=>(opportunity?.attachments||[]).some(item=>/\.(xlsx|xls)$/i.test(String(item.name||'')));

export function OpportunityEngine({data,setData,currentUser,onOpenWork,onAddTender,focusOpportunityId=''}){
 const readOnly=currentUser?.role==='director';
 const[selectedId,setSelectedId]=useState(data.opportunities?.[0]?.id||null);
 const[error,setError]=useState('');
 useEffect(()=>{if(focusOpportunityId&&(data.opportunities||[]).some(item=>item.id===focusOpportunityId))setSelectedId(focusOpportunityId)},[focusOpportunityId,data.opportunities]);
 const platformMap=useMemo(()=>new Map((data.platforms||[]).map(item=>[item.id,item])),[data.platforms]);
 const selected=(data.opportunities||[]).find(item=>item.id===selectedId)||null;
 const run=operation=>{if(readOnly)return;try{setData(current=>operation(current));setError('')}catch(exception){setError(exception?.message||'Не удалось выполнить действие')}};
 const qualify=(field,value)=>selected&&!readOnly&&run(current=>updateOpportunityQualification(current,selected.id,{[field]:value},currentUser));
 const accept=()=>{if(readOnly||!selected)return;try{let work;setData(current=>{const result=acceptOpportunity(current,selected.id,currentUser);work=result.work;return result.state});if(work)onOpenWork(work.id,hasExcelAttachment(selected)?'import':'overview')}catch(exception){setError(exception?.message||'Не удалось взять тендер в работу')}};
 const reject=(reason,note)=>selected&&!readOnly&&run(current=>rejectOpportunity(current,selected.id,reason,note,currentUser));
 return <main className="opportunity-page">
  <header className="opportunity-head"><div><span>{readOnly?'Контроль директора':'Менеджер'} · тендеры</span><h1>{readOnly?'Тендеры компании':'Тендеры'}</h1><p>{readOnly?'Просмотр карточек без редактирования.':'Добавляйте и заполняйте карточки вручную прямо в таблице.'}</p></div>{!readOnly&&<button className="primary" onClick={onAddTender}><Clipboard/>Добавить тендер</button>}</header>
  {readOnly&&<div className="readonly-note"><ShieldCheck/> Изменения вносит менеджер.</div>}
  {error&&<div className="inline-error">{error}</div>}
  <section className="opportunity-workspace spreadsheet-mode">
   <OpportunitySpreadsheet data={data} setData={setData} currentUser={currentUser} selectedId={selectedId} setSelectedId={setSelectedId} onOpenWork={onOpenWork} readOnly={readOnly}/>
   <OpportunityDecisionPanel selected={selected} platform={selected?platformMap.get(selected.platformId):null} data={data} onQualify={qualify} onAccept={accept} onReject={reject} onOpenWork={onOpenWork} readOnly={readOnly}/>
  </section>
  {selected?.sourceUrl&&<a className="opportunity-source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink/>Открыть исходный тендер</a>}
 </main>;
}