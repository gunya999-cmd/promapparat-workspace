import{useCallback,useEffect,useRef,useState}from'react';
import{workspaceRepository}from'../data/workspaceRepository.js';

export function useWorkspace(){
 const[data,setData]=useState(()=>workspaceRepository.load());
 const[storageError,setStorageError]=useState('');
 const suppressSave=useRef(false),revisionRef=useRef(Number(data.meta?.revision||0));
 useEffect(()=>{
  if(suppressSave.current){suppressSave.current=false;revisionRef.current=Number(data.meta?.revision||revisionRef.current);return}
  try{const saved=workspaceRepository.save(data);revisionRef.current=Number(saved.meta?.revision||0);setStorageError('');if(Number(data.meta?.revision||0)!==revisionRef.current){suppressSave.current=true;setData(saved)}}catch(error){setStorageError(error?.message||'Не удалось сохранить данные')}
 },[data]);
 useEffect(()=>workspaceRepository.subscribe(external=>{const revision=Number(external.meta?.revision||0);if(revision>revisionRef.current){revisionRef.current=revision;suppressSave.current=true;setData(external)}}),[]);
 const replaceData=useCallback(value=>{suppressSave.current=true;revisionRef.current=Number(value.meta?.revision||0);setData(value)},[]);
 const reset=useCallback(()=>{workspaceRepository.clear();replaceData(workspaceRepository.load())},[replaceData]);
 const exportBackup=useCallback(()=>workspaceRepository.exportText(data),[data]);
 const importBackup=useCallback(text=>{const restored=workspaceRepository.importText(text);replaceData(restored);return restored},[replaceData]);
 const restoreBackup=useCallback(()=>{const restored=workspaceRepository.restoreBackup();replaceData(restored);return restored},[replaceData]);
 const createSnapshot=useCallback(()=>workspaceRepository.snapshot(data,'manual'),[data]);
 return{data,setData,reset,storageError,exportBackup,importBackup,restoreBackup,createSnapshot};
}
