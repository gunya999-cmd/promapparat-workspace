import{useEffect,useState}from'react';
import{workspaceRepository}from'../data/workspaceRepository.js';

export function useWorkspace(){
 const[data,setData]=useState(()=>workspaceRepository.load());
 useEffect(()=>workspaceRepository.save(data),[data]);
 const reset=()=>{workspaceRepository.clear();setData(workspaceRepository.load())};
 return{data,setData,reset};
}
