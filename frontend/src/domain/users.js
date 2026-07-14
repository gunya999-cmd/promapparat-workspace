const normalizedRole=value=>['admin','head','director'].includes(value)?'director':'manager';
const clean=value=>String(value||'').trim();
const unique=values=>[...new Set(values.map(clean).filter(Boolean))];
const safeId=(prefix,value,index)=>`${prefix}-${clean(value).toLowerCase().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-|-$/g,'')||index}`;

export function normalizeWorkspaceUsers(data={}){
 const original=Array.isArray(data.users)?data.users:[];
 let users=original.map(user=>({...user,role:normalizedRole(user.role),active:user.active!==false}));
 if(!users.some(user=>user.role==='director'))users.unshift({id:'u-director',name:'Директор',role:'director',active:true});
 const managerNames=unique([...(data.works||[]).map(item=>item.manager),...(data.opportunities||[]).map(item=>item.owner)]);
 managerNames.forEach((name,index)=>{if(!users.some(user=>user.role==='manager'&&clean(user.name)===name))users.push({id:safeId('u-manager-auto',name,index+1),name,role:'manager',active:true})});
 if(!users.some(user=>user.role==='manager'))users.push({id:'u-manager',name:'Менеджер',role:'manager',active:true});
 const rawCurrent=data.currentUser?{...data.currentUser,role:normalizedRole(data.currentUser.role)}:null;
 const currentUser=users.find(user=>user.id===rawCurrent?.id)||users.find(user=>user.role===rawCurrent?.role&&clean(user.name)===clean(rawCurrent?.name))||users.find(user=>user.role==='director')||users[0];
 return{...data,users,currentUser};
}

export function userForRole(data,role){
 const normalized=normalizeWorkspaceUsers(data);
 return normalized.users.find(user=>user.role===role&&user.active!==false)||normalized.users.find(user=>user.role===role)||null;
}
