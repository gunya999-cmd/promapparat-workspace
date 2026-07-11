import React,{useMemo,useState}from'react';
import{Building2,Mail,MapPin,Phone,Plus,Search,Star,Trash2}from'lucide-react';
import{money,uid}from'../domain/workspace.js';

const emptySupplier=()=>({id:uid(),name:'',city:'',contact:'',phone:'',email:'',website:'',inn:'',specialization:'',brands:'',rating:4,reliability:80,comment:''});

export function SuppliersView({data,setData}){
 const[query,setQuery]=useState('');
 const[selectedId,setSelectedId]=useState(data.suppliers[0]?.id||null);
 const suppliers=useMemo(()=>data.suppliers.map(s=>{
  const offers=data.positions.flatMap(p=>(p.offers||[]).filter(o=>o.supplierId===s.id).map(o=>({...o,position:p})));
  const selectedOffers=offers.filter(o=>o.selected);
  const averagePrice=offers.length?offers.reduce((sum,o)=>sum+Number(o.price||0),0)/offers.length:0;
  return{...s,offers,selectedOffers,averagePrice};
 }),[data]);
 const filtered=suppliers.filter(s=>`${s.name} ${s.city} ${s.contact} ${s.specialization||''} ${s.brands||''}`.toLowerCase().includes(query.toLowerCase()));
 const selected=suppliers.find(s=>s.id===selectedId)||filtered[0]||null;
 const patch=change=>setData(current=>({...current,suppliers:current.suppliers.map(s=>s.id===selected.id?{...s,...change}:s)}));
 const add=()=>{const supplier=emptySupplier();setData(current=>({...current,suppliers:[supplier,...current.suppliers]}));setSelectedId(supplier.id)};
 const remove=()=>{if(!selected)return;setData(current=>({...current,suppliers:current.suppliers.filter(s=>s.id!==selected.id),positions:current.positions.map(p=>({...p,offers:(p.offers||[]).map(o=>o.supplierId===selected.id?{...o,supplierId:''}:o)}))}));setSelectedId(null)};
 return <main className="suppliers-page">
  <div className="suppliers-head"><div><span>Справочник</span><h1>Поставщики</h1><p>Контакты, специализация, надежность и история предложений.</p></div><button className="primary" onClick={add}><Plus/> Новый поставщик</button></div>
  <div className="suppliers-layout">
   <section className="supplier-list-panel"><label className="supplier-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Название, город, бренд"/></label><div className="supplier-list">{filtered.map(s=><button key={s.id} className={`supplier-row ${selected?.id===s.id?'active':''}`} onClick={()=>setSelectedId(s.id)}><div className="supplier-avatar"><Building2/></div><div><b>{s.name||'Новый поставщик'}</b><span>{s.city||'Город не указан'} · {s.offers.length} предлож.</span><small>{s.specialization||'Специализация не указана'}</small></div><em>{s.reliability??80}%</em></button>)}</div></section>
   {selected?<section className="supplier-card"><div className="supplier-card-head"><div><span>Карточка поставщика</span><h2>{selected.name||'Новый поставщик'}</h2></div><button className="supplier-delete" onClick={remove}><Trash2/></button></div>
    <div className="supplier-score"><div><Star/><b>{selected.rating??4}/5</b><span>оценка</span></div><div><b>{selected.reliability??80}%</b><span>надежность</span></div><div><b>{selected.offers.length}</b><span>ТКП / предложений</span></div><div><b>{selected.selectedOffers.length}</b><span>выбрано</span></div></div>
    <div className="supplier-form"><label className="wide-field">Название<input value={selected.name||''} onChange={e=>patch({name:e.target.value})}/></label><label>ИНН<input value={selected.inn||''} onChange={e=>patch({inn:e.target.value})}/></label><label>Город<input value={selected.city||''} onChange={e=>patch({city:e.target.value})}/></label><label>Контакт<input value={selected.contact||''} onChange={e=>patch({contact:e.target.value})}/></label><label>Телефон<input value={selected.phone||''} onChange={e=>patch({phone:e.target.value})}/></label><label>Email<input value={selected.email||''} onChange={e=>patch({email:e.target.value})}/></label><label>Сайт<input value={selected.website||''} onChange={e=>patch({website:e.target.value})}/></label><label>Рейтинг<input type="number" min="1" max="5" value={selected.rating??4} onChange={e=>patch({rating:Number(e.target.value)})}/></label><label>Надежность, %<input type="number" min="0" max="100" value={selected.reliability??80} onChange={e=>patch({reliability:Number(e.target.value)})}/></label><label className="wide-field">Специализация<input value={selected.specialization||''} onChange={e=>patch({specialization:e.target.value})} placeholder="Клапаны, КИПиА, расходомеры"/></label><label className="wide-field">Бренды<input value={selected.brands||''} onChange={e=>patch({brands:e.target.value})} placeholder="Бренды через запятую"/></label><label className="wide-field">Комментарий<textarea value={selected.comment||''} onChange={e=>patch({comment:e.target.value})}/></label></div>
    <div className="supplier-actions">{selected.phone&&<button><Phone/>Позвонить</button>}{selected.email&&<button><Mail/>Написать</button>}{selected.city&&<button><MapPin/>{selected.city}</button>}</div>
    <div className="supplier-history"><div className="section-head"><h3>История предложений</h3><span>{selected.offers.length}</span></div>{selected.offers.length?selected.offers.map(o=><article key={o.id}><div><b>{o.position.name}</b><span>{o.position.qty} {o.position.unit} · {o.hasTkp?'ТКП получено':'ожидаем ТКП'}</span></div><strong>{money(o.price)}</strong><small>{o.productionDays||0}+{o.deliveryDays||0} дней · {o.shipmentPlace||'место не указано'}</small></article>):<div className="supplier-empty">Предложений пока нет</div>}</div>
   </section>:<section className="supplier-card supplier-empty">Создайте или выберите поставщика</section>}
  </div>
 </main>
}
