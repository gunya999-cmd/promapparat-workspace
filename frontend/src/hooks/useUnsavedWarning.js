import{useEffect}from'react';

export function useUnsavedWarning(dirty){
 useEffect(()=>{
  const handler=event=>{if(!dirty)return;event.preventDefault();event.returnValue=''};
  window.addEventListener('beforeunload',handler);
  return()=>window.removeEventListener('beforeunload',handler);
 },[dirty]);
}
