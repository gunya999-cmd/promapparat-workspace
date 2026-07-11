import{changeEvent,recordActivity}from'./activity.js';

export function addCommentCommand(state,workId,text,actor){
 const value=String(text||'').trim();if(!value)throw new Error('Комментарий пустой');
 return recordActivity(state,changeEvent({workId,type:'comment',title:'Добавлен комментарий',detail:value,entityType:'work',entityId:workId,field:'comment',oldValue:null,newValue:value,actor:actor||state.currentUser,source:'ui'}));
}
