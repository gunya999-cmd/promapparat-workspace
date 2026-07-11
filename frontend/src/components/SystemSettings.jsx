import React,{useRef,useState}from'react';
import{AlertTriangle,Database,Download,FileUp,HardDriveDownload,RefreshCcw,Save,ShieldCheck}from'lucide-react';
import'./system.css';

export function SystemSettings({data,storageError,exportBackup,importBackup,restoreBackup,createSnapshot,reset}){
 const inputRef=useRef(null),[message,setMessage]=useState('');
 const download=()=>{const blob=new Blob([exportBackup()],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`promapparat-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);setMessage('Резервная копия скачана')};
 const upload=async file=>{if(!file)return;try{if(!window.confirm('Импорт заменит текущие данные. Перед импортом будет создан локальный snapshot. Продолжить?'))return;importBackup(await file.text());setMessage('Данные успешно восстановлены из файла')}catch(error){setMessage(error?.message||'Ошибка импорта')}finally{inputRef.current.value=''}};
 const restore=()=>{try{if(!window.confirm('Восстановить последнюю локальную резервную копию?'))return;restoreBackup();setMessage('Локальная копия восстановлена')}catch(error){setMessage(error?.message||'Копия не найдена')}};
 const clear=()=>{if(!window.confirm('Сбросить рабочие данные к демо-набору? Перед сбросом будет создана резервная копия.'))return;reset();setMessage('Данные сброшены')};
 return<main className="system-page">
  <header className="system-head"><div><span>Только администратор</span><h1>Система и безопасность данных</h1><p>Резервные копии, восстановление, версия схемы и контроль локального хранилища.</p></div><ShieldCheck/></header>
  {storageError&&<div className="system-alert"><AlertTriangle/><div><b>Ошибка сохранения</b><span>{storageError}</span></div></div>}
  {message&&<div className="system-message">{message}</div>}
  <section className="system-stats"><article><Database/><div><span>Версия схемы</span><b>{data.schemaVersion}</b></div></article><article><Save/><div><span>Ревизия</span><b>{data.meta?.revision||0}</b></div></article><article><HardDriveDownload/><div><span>Работы / позиции</span><b>{data.works.length} / {data.positions.length}</b></div></article><article><ShieldCheck/><div><span>Пользователи</span><b>{data.users?.length||0}</b></div></article></section>
  <section className="system-grid">
   <article><Download/><div><h2>Скачать backup</h2><p>Полная JSON-копия работ, позиций, документов, формул и истории.</p></div><button className="primary" onClick={download}>Скачать</button></article>
   <article><FileUp/><div><h2>Импортировать backup</h2><p>Проверка структуры и миграция старой версии выполняются автоматически.</p></div><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={event=>upload(event.target.files?.[0])}/><button onClick={()=>inputRef.current?.click()}>Выбрать файл</button></article>
   <article><HardDriveDownload/><div><h2>Локальный snapshot</h2><p>Создать контрольную точку перед крупным изменением данных.</p></div><button onClick={()=>{createSnapshot();setMessage('Локальный snapshot создан')}}>Создать</button></article>
   <article><RefreshCcw/><div><h2>Восстановление</h2><p>Вернуться к последней локальной контрольной точке.</p></div><button onClick={restore}>Восстановить</button></article>
  </section>
  <section className="system-danger"><AlertTriangle/><div><h2>Сброс данных</h2><p>Текущие данные заменятся демонстрационным набором. Перед сбросом создается snapshot.</p></div><button onClick={clear}>Сбросить</button></section>
 </main>;
}
