import React from'react';
import{AlertTriangle,Clock3,Mail,Target,Zap}from'lucide-react';
import{daysLeft}from'../domain/workspace.js';

export function Autopilot({work}){
 return <div className="autopilot">
  <div className="autopilot-main"><div className="pulse"><Zap/></div><div><span>Автопилот</span><strong>{work.nextAction}</strong></div><button>Начать</button></div>
  <div className="signal"><Clock3/><span>До подачи</span><b>{daysLeft(work.deadline)} дн.</b></div>
  <div className="signal"><AlertTriangle/><span>Проблемные</span><b>{work.blockers}</b></div>
  <div className="signal"><Mail/><span>Ждем ТКП</span><b>{work.waiting}</b></div>
  <div className="signal"><Target/><span>Готовность</span><b>{work.progress}%</b></div>
 </div>
}
