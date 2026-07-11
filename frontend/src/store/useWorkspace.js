import{useCallback,useEffect,useState}from'react';
import{workspaceRepository}from'../data/workspaceRepository.js';

export function useWorkspace(){
 const[data,setData]=useState(()=>workspaceRepository.load());
 const[storageError,setStorageError]=useState('');
 useEffect(()=>{try{workspaceRepository.save(data);setStorageError('')}catch(error){setStorageError(error?.message||'Не удалось сохранить данные')}},[data]);
 useEffect(()=>workspaceRepository.subscribe(external=>setData(current=>Number(external.meta?.revision||0)>Number(current.meta?.revision||0)?external:current)),[]);
 const reset=useCallback(()=>{workspaceRepository.clear();setData(workspaceRepository.load())},[]);
 const exportBackup=useCallback(()=>workspaceRepository.exportText(data),[data]);
 const importBackup=useCallback(text=>{const restored=workspaceRepository.importText(text);setData(restored);return restored},[]);
 const restoreBackup=useCallback(()=>{const restored=workspaceRepository.restoreBackup();setData(restored);return restored},[]);
 const createSnapshot=useCallback(()=>workspaceRepository.snapshot(data,'manual'),[data]);
 return{data,setData,reset,storageError,exportBackup,importBackup,restoreBackup,createSnapshot};
}
