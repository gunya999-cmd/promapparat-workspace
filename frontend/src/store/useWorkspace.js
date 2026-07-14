import{useCallback,useEffect,useRef,useState}from'react';
import{getWorkspace,saveWorkspace,serverMode}from'../api/client.js';
import{workspaceRepository}from'../data/workspaceRepository.js';
import{normalizeWorkspace}from'../domain/workspace.js';
import{normalizeWorkspaceUsers}from'../domain/users.js';

export function useWorkspace({serverSession=null}={}){
 const remoteEnabled=serverMode&&!!serverSession;
 const[data,setData]=useState(()=>normalizeWorkspaceUsers(workspaceRepository.load()));
 const[storageError,setStorageError]=useState(''),[loading,setLoading]=useState(remoteEnabled),[syncState,setSyncState]=useState(remoteEnabled?'loading':'local');
 const suppressSave=useRef(false),revisionRef=useRef(Number(data.meta?.revision||0)),remoteReady=useRef(false),pendingData=useRef(null),saving=useRef(false),timer=useRef(null),conflict=useRef(false),dataRef=useRef(data);
 useEffect(()=>{dataRef.current=data},[data]);

 const normalize=useCallback(value=>remoteEnabled?normalizeWorkspace(value):normalizeWorkspaceUsers(value),[remoteEnabled]);
 const replaceData=useCallback(value=>{const normalized=normalize(value);suppressSave.current=true;dataRef.current=normalized;setData(normalized)},[normalize]);
 const loadRemote=useCallback(async()=>{if(!remoteEnabled)return;setLoading(true);setSyncState('loading');conflict.current=false;try{const result=await getWorkspace();revisionRef.current=Number(result.revision||0);remoteReady.current=true;replaceData(result.data);setStorageError('');setSyncState('synced')}catch(error){setStorageError(error?.message||'Не удалось загрузить данные с сервера');setSyncState('error')}finally{setLoading(false)}},[remoteEnabled,serverSession?.user?.id,replaceData]);

 const flushRemote=useCallback(async()=>{if(!remoteEnabled||!remoteReady.current||saving.current||conflict.current||!pendingData.current)return;const snapshot=pendingData.current;pendingData.current=null;saving.current=true;setSyncState('saving');try{const result=await saveWorkspace(revisionRef.current,snapshot);revisionRef.current=Number(result.revision||revisionRef.current);setStorageError('');setSyncState('synced');if(!pendingData.current)replaceData(result.data)}catch(error){if(error?.status===409){pendingData.current=snapshot;conflict.current=true;setSyncState('conflict');setStorageError('Данные изменены другим пользователем. Обновите рабочее пространство перед продолжением.')}else{pendingData.current=snapshot;setSyncState('error');setStorageError(error?.message||'Не удалось сохранить данные на сервере')}}finally{saving.current=false;if(pendingData.current&&!conflict.current){clearTimeout(timer.current);timer.current=setTimeout(flushRemote,800)}}},[remoteEnabled,replaceData]);

 const pollRemote=useCallback(async()=>{if(!remoteEnabled||!remoteReady.current||saving.current||conflict.current)return;try{const result=await getWorkspace(),revision=Number(result.revision||0),usersChanged=JSON.stringify(result.data?.users||[])!==JSON.stringify(dataRef.current?.users||[]);if(revision===revisionRef.current&&!usersChanged)return;if(pendingData.current){if(revision>revisionRef.current){conflict.current=true;setSyncState('conflict');setStorageError('На сервере появились изменения другого пользователя. Сначала обновите рабочее пространство.')}return}revisionRef.current=revision;replaceData(result.data);setStorageError('');setSyncState('synced')}catch(error){setSyncState('error');setStorageError(error?.message||'Не удалось проверить обновления сервера')}},[remoteEnabled,replaceData]);

 useEffect(()=>{if(remoteEnabled){remoteReady.current=false;pendingData.current=null;clearTimeout(timer.current);loadRemote();return}setLoading(false);setSyncState('local')},[remoteEnabled,serverSession?.user?.id,loadRemote]);
 useEffect(()=>{if(!remoteEnabled)return;const interval=setInterval(pollRemote,15000),visible=()=>{if(document.visibilityState==='visible')pollRemote()};document.addEventListener('visibilitychange',visible);return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',visible)}},[remoteEnabled,pollRemote]);

 useEffect(()=>{
  if(suppressSave.current){suppressSave.current=false;return}
  if(remoteEnabled){if(!remoteReady.current||conflict.current)return;pendingData.current=data;setSyncState('pending');clearTimeout(timer.current);timer.current=setTimeout(flushRemote,650);return()=>clearTimeout(timer.current)}
  try{const saved=workspaceRepository.save(data);revisionRef.current=Number(saved.meta?.revision||0);setStorageError('');if(Number(data.meta?.revision||0)!==revisionRef.current){suppressSave.current=true;setData(saved)}}catch(error){setStorageError(error?.message||'Не удалось сохранить данные')}
 },[data,remoteEnabled,flushRemote]);

 useEffect(()=>{if(remoteEnabled)return;return workspaceRepository.subscribe(external=>{const normalized=normalizeWorkspaceUsers(external),revision=Number(normalized.meta?.revision||0);if(revision>revisionRef.current){revisionRef.current=revision;suppressSave.current=true;setData(normalized)}})},[remoteEnabled]);

 const reloadFromServer=useCallback(()=>{pendingData.current=null;conflict.current=false;return loadRemote()},[loadRemote]);
 const reset=useCallback(()=>{if(remoteEnabled)throw new Error('Сброс серверного рабочего пространства выполняется администратором базы');workspaceRepository.clear();replaceData(workspaceRepository.load())},[remoteEnabled,replaceData]);
 const exportBackup=useCallback(()=>workspaceRepository.exportText(data),[data]);
 const importBackup=useCallback(text=>{const restored=workspaceRepository.importText(text);replaceData(restored);return restored},[replaceData]);
 const restoreBackup=useCallback(()=>{if(remoteEnabled)throw new Error('Локальное восстановление недоступно в серверном режиме');const restored=workspaceRepository.restoreBackup();replaceData(restored);return restored},[remoteEnabled,replaceData]);
 const createSnapshot=useCallback(()=>workspaceRepository.snapshot(data,remoteEnabled?'server-manual':'manual'),[data,remoteEnabled]);
 return{data,setData,reset,storageError,loading,syncState,reloadFromServer,serverManaged:remoteEnabled,exportBackup,importBackup,restoreBackup,createSnapshot};
}
