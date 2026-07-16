import React from'react';
import{ManagerTenderWorkspace}from'./ManagerTenderWorkspace.jsx';

export function R4ManagerWorkspace({data,setData,currentUser,onOpenWork}){
 return <ManagerTenderWorkspace data={data} setData={setData} currentUser={currentUser} onOpenWork={onOpenWork}/>;
}
