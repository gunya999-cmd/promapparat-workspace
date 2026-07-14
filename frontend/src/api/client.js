const API_URL=String(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
const SESSION_KEY='promapparat_server_session';

export const serverMode=Boolean(API_URL);
export const getSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
export const saveSession=session=>{if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(SESSION_KEY);window.dispatchEvent(new CustomEvent('promapparat:session',{detail:session}))};

async function refreshSession(){
 const current=getSession();if(!current?.refreshToken)throw new Error('AUTH_REQUIRED');
 const response=await fetch(`${API_URL}/api/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:current.refreshToken})});
 if(!response.ok){saveSession(null);throw new Error('AUTH_REQUIRED')}
 const next=await response.json();saveSession(next);return next;
}

async function authorizedFetch(path,options={},retry=true){
 const session=getSession(),headers=new Headers(options.headers||{});if(!(options.body instanceof FormData)&&options.body!==undefined&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');if(session?.accessToken)headers.set('Authorization',`Bearer ${session.accessToken}`);
 const response=await fetch(`${API_URL}${path}`,{...options,headers});
 if(response.status===401&&retry&&session?.refreshToken){await refreshSession();return authorizedFetch(path,options,false)}
 return response;
}

async function serverFileResponse(id){const response=await authorizedFetch(`/api/files/${id}`);if(!response.ok){const payload=await response.json().catch(()=>({}));throw new Error(payload.message||'Не удалось получить файл')}return response}

export async function apiRequest(path,options={},retry=true){
 const response=await authorizedFetch(path,options,retry);if(response.status===204)return null;
 const payload=await response.json().catch(()=>({}));if(!response.ok){const error=new Error(payload.message||`HTTP ${response.status}`);error.status=response.status;error.code=payload.error;error.payload=payload;throw error}return payload;
}

export async function login(email,password){const session=await apiRequest('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})},false);saveSession(session);return session}
export async function logout(){const session=getSession();try{if(session?.refreshToken)await apiRequest('/api/auth/logout',{method:'POST',body:JSON.stringify({refreshToken:session.refreshToken})},false)}finally{saveSession(null)}}
export const getWorkspace=()=>apiRequest('/api/workspace');
export const saveWorkspace=(baseRevision,data)=>apiRequest('/api/workspace',{method:'PUT',body:JSON.stringify({baseRevision,data})});
export const bootstrapWorkspace=data=>apiRequest('/api/workspace/bootstrap',{method:'POST',body:JSON.stringify({data})});
export const getAuditLog=(limit=50)=>apiRequest(`/api/workspace/audit?limit=${encodeURIComponent(limit)}`);
export const listUsers=()=>apiRequest('/api/users');
export const createUser=data=>apiRequest('/api/users',{method:'POST',body:JSON.stringify(data)});
export const updateUser=(id,data)=>apiRequest(`/api/users/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export async function uploadServerFiles(files,entityType,entityId){const body=new FormData();for(const file of files||[])body.append('files',file);body.append('entityType',entityType||'');body.append('entityId',entityId||'');return apiRequest('/api/files',{method:'POST',body})}
export async function getServerFile(id,name='file'){const response=await serverFileResponse(id),blob=await response.blob();return new File([blob],name,{type:blob.type||response.headers.get('content-type')||'application/octet-stream'})}
export async function downloadServerFile(id,name='file'){const response=await serverFileResponse(id),blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export const deleteServerFile=id=>apiRequest(`/api/files/${id}`,{method:'DELETE'});
