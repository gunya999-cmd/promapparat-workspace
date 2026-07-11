import React from'react';
import{AlertTriangle,Clock3,Mail,Target,Zap}from'lucide-react';
import{daysLeft}from'../domain/workspace.js';

const deadlineLabel=value=>{const days=daysLeft(value);if(days<0)return`просрочено ${Math.abs(days)} дн.`;if(days===0)return'сегодня';if(days===1)return'завтра';return`${days} дн.`};

export function Autopilot({work}){
 return <div className="autopilot">
  <div className="autopilot-main"><div className="pulse"><Zap/></div><div><span>Автопилот</span><strong>{work.nextAction}</strong></div><button>Начать</button></div>
  <div className="signal"><Clock3/><span>До подачи</span><b>{deadlineLabel(work.deadline)}</b></div>
  <div className="signal"><AlertTriangle/><span>Проблемные</span><b>{work.blockers}</b></div>
  <div className="signal"><Mail/><span>Ждем ТКП</span><b>{work.waiting}</b></div>
  <div className="signal"><Target/><span>Готовность</span><b>{work.progress}%</b></div>
 </div>;
}
