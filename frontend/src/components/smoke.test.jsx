import React from'react';
import{describe,expect,it}from'vitest';
import{renderToString}from'react-dom/server';
import{calculateWork,createDemoWorkspace}from'../domain/workspace.js';
import{DashboardView}from'./DashboardView.jsx';
import{WorkspaceView}from'./WorkspaceView.jsx';

describe('main workspace smoke render',()=>{
 const data=createDemoWorkspace();
 const works=data.works.map(work=>calculateWork(work,data.positions,data.suppliers,data.settings));
 it('renders the manager dashboard',()=>{
  const manager={...(data.users||[]).find(user=>user.role==='manager'),role:'manager',name:'Менеджер'};
  const html=renderToString(<DashboardView works={works} data={data} currentUser={manager} settings={data.settings} onOpenWork={()=>{}}/>);
  expect(html).toContain('Рабочий стол менеджера');
  expect(html).toContain('Очередь рабочего дня');
 });
 it('renders a tender workspace with positions',()=>{
  const html=renderToString(<WorkspaceView work={works[0]} data={data} setData={()=>{}} selectedId={null} setSelectedId={()=>{}} currentUser={data.currentUser}/>);
  expect(html).toContain('Позиции');
  expect(html).toContain(works[0].customer);
 });
});