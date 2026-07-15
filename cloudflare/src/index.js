import{isWorkspaceEmpty,mergeWorkspaceByRole,publicWorkspace,validateWorkspacePayload}from'./policies.js';

const encoder=new TextEncoder();
const now=()=>new Date().toISOString();
const uid=()=>crypto.randomUUID();
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}});
const parseJson=async request=>{try{return await request.json()}catch{return{}}};
const bytesToBase64Url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const base64UrlToBytes=value=>{const normalized=String(value).replace(/-/g,'+').replace(/_/g,'/'),padding='='.repeat((4-normalized.length%4)%4),binary=atob(normalized+padding);return Uint8Array.from(binary,char=>char.charCodeAt(0))};
const hex=bytes=>[...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');
const randomToken=()=>bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
const sha256=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(String(value)))));
const safeUser=row=>({id:row.id,email:row.email,name:row.name,role:row.role,active:Boolean(row.active)});
const roleAllowed=(user,...roles)=>roles.includes(user?.role);
const emptyWorkspace={schemaVersion:10,works:[],suppliers:[],positions:[],documents:[],tasks:[],customers:[],events:[],formulas:[],formulaImports:[],specificationImports:[],platforms:[],opportunities:[],platformChecks:[],supplierRequests:[],quotes:[],shipments:[],invoices:[],settings:{currency:'RUB',vatRate:20,targetMargin:15,managerBonusRate:5,taxRate:20,creditRate:18,bankFeeRate:1,guaranteeRate:1.5,riskReserveRate:2,fixedOverheadRate:3,dividendRate:30,managerCanSeeNetProfit:true,managerCanEnterParticipantBonus:true},counters:{workSequence:0},meta:{revision:0,serverManaged:true}};

function corsHeaders(request,env){
 const origin=request.headers.get('Origin')||'',allowed=String(env.CORS_ORIGINS||'').split(',').map(item=>item.trim()).filter(Boolean);
 if(!origin)return{};
 if(!allowed.includes(origin))return null;
 return{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Bootstrap-Secret','Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, DELETE, OPTIONS','Vary':'Origin'};
}

async function hashPassword(password){
 const iterations=50000,salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',encoder.encode(String(password)),'PBKDF2',false,['deriveBits']),derived=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256));
 return`pbkdf2$${iterations}$${bytesToBase64Url(salt)}$${bytesToBase64Url(derived)}`;
}
async function verifyPassword(encoded,password){
 try{const[algorithm,iterationsRaw,saltRaw,hashRaw]=String(encoded||'').split('$');if(algorithm!=='pbkdf2')return false;const salt=base64UrlToBytes(saltRaw),expected=base64UrlToBytes(hashRaw),key=await crypto.subtle.importKey('raw',encoder.encode(String(password)),'PBKDF2',false,['deriveBits']),actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:Number(iterationsRaw)},key,expected.length*8));if(actual.length!==expected.length)return false;let diff=0;for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];return diff===0}catch{return false}
}

async function createSessionPair(env,user){
 const accessToken=randomToken(),refreshToken=randomToken(),created=now(),accessExpires=new Date(Date.now()+15*60*1000).toISOString(),refreshExpires=new Date(Date.now()+30*24*60*60*1000).toISOString();
 await env.DB.batch([
  env.DB.prepare('INSERT INTO sessions(id,user_id,token_hash,kind,expires_at,created_at) VALUES(?,?,?,?,?,?)').bind(uid(),user.id,await sha256(accessToken),'access',accessExpires,created),
  env.DB.prepare('INSERT INTO sessions(id,user_id,token_hash,kind,expires_at,created_at) VALUES(?,?,?,?,?,?)').bind(uid(),user.id,await sha256(refreshToken),'refresh',refreshExpires,created)
 ]);
 return{accessToken,refreshToken,user:safeUser(user)};
}

async function authenticatedUser(request,env){
 const header=request.headers.get('Authorization')||'',token=header.startsWith('Bearer ')?header.slice(7):'';if(!token)return null;
 return env.DB.prepare(`SELECT u.id,u.email,u.name,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.kind='access' AND s.expires_at>? AND u.active=1 LIMIT 1`).bind(await sha256(token),now()).first();
}

async function requireUser(request,env,roles=[]){
 const user=await authenticatedUser(request,env);if(!user)return{error:json({error:'AUTH_REQUIRED',message:'Требуется вход в систему'},401)};
 if(roles.length&&!roleAllowed(user,...roles))return{error:json({error:'FORBIDDEN',message:'Недостаточно прав'},403)};
 return{user};
}

async function bootstrap(request,env){
 if(!env.BOOTSTRAP_SECRET)return json({error:'BOOTSTRAP_DISABLED',message:'Начальная настройка отключена'},503);
 if(request.headers.get('X-Bootstrap-Secret')!==env.BOOTSTRAP_SECRET)return json({error:'FORBIDDEN',message:'Неверный секрет начальной настройки'},403);
 const existing=await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();if(Number(existing?.count||0)>0)return json({error:'ALREADY_BOOTSTRAPPED',message:'Первый пользователь уже создан'},409);
 const body=await parseJson(request),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||''),name=String(body.name||'Директор').trim();if(!email||password.length<10)return json({error:'INVALID_INPUT',message:'Укажите email и пароль не короче 10 символов'},400);
 const user={id:uid(),email,name,role:'director',active:1},created=now();
 await env.DB.batch([
  env.DB.prepare('INSERT INTO users(id,email,name,role,password_hash,active,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)').bind(user.id,email,name,'director',await hashPassword(password),created,created),
  env.DB.prepare('INSERT INTO workspace_state(id,revision,schema_version,data,updated_by,updated_at) VALUES(1,0,10,?,?,?)').bind(JSON.stringify(emptyWorkspace),user.id,created),
  env.DB.prepare('INSERT INTO audit_log(id,user_id,action,entity_type,metadata,created_at) VALUES(?,?,?,?,?,?)').bind(uid(),user.id,'system.bootstrap','workspace',JSON.stringify({email}),created)
 ]);
 return json({ok:true,user:safeUser(user)},201);
}

async function authRoute(request,env,path){
 if(path==='/api/auth/login'&&request.method==='POST'){
  const body=await parseJson(request),email=String(body.email||'').trim().toLowerCase(),user=await env.DB.prepare('SELECT * FROM users WHERE email=? AND active=1 LIMIT 1').bind(email).first();
  if(!user||!await verifyPassword(user.password_hash,body.password))return json({error:'INVALID_CREDENTIALS',message:'Неверный email или пароль'},401);
  return json(await createSessionPair(env,user));
 }
 if(path==='/api/auth/refresh'&&request.method==='POST'){
  const body=await parseJson(request),token=String(body.refreshToken||''),row=token?await env.DB.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.kind='refresh' AND s.expires_at>? AND u.active=1 LIMIT 1`).bind(await sha256(token),now()).first():null;
  if(!row)return json({error:'INVALID_TOKEN',message:'Сессия недействительна'},401);
  await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(row.id).run();return json(await createSessionPair(env,row));
 }
 if(path==='/api/auth/logout'&&request.method==='POST'){
  const body=await parseJson(request);if(body.refreshToken)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(body.refreshToken)).run();return new Response(null,{status:204});
 }
 return null;
}

async function workspaceRoute(request,env,path){
 const auth=await requireUser(request,env);if(auth.error)return auth.error;const user=auth.user;
 if(path==='/api/workspace'&&request.method==='GET'){
  const state=await env.DB.prepare('SELECT * FROM workspace_state WHERE id=1').first();if(!state)return json({error:'WORKSPACE_NOT_FOUND',message:'Рабочее пространство не создано'},404);
  const users=(await env.DB.prepare('SELECT id,email,name,role,active FROM users ORDER BY role,name').all()).results||[];
  return json({revision:Number(state.revision),schemaVersion:Number(state.schema_version),updatedAt:state.updated_at,data:publicWorkspace(JSON.parse(state.data),user,users,Number(state.revision))});
 }
 if(path==='/api/workspace'&&request.method==='PUT'){
  const body=await parseJson(request),baseRevision=Number(body.baseRevision),incoming=body.data;if(!Number.isInteger(baseRevision)||!incoming||typeof incoming!=='object')return json({error:'INVALID_INPUT',message:'Нужны baseRevision и data'},400);
  const errors=validateWorkspacePayload(incoming,user.role);if(errors.length)return json({error:'INVALID_WORKSPACE',message:'Некорректная структура рабочего пространства',details:errors},422);
  const current=await env.DB.prepare('SELECT * FROM workspace_state WHERE id=1').first();if(!current)return json({error:'WORKSPACE_NOT_FOUND',message:'Рабочее пространство не создано'},404);if(Number(current.revision)!==baseRevision)return json({error:'REVISION_CONFLICT',message:'Данные изменены другим пользователем. Обновите рабочее пространство.',currentRevision:Number(current.revision)},409);
  const merged=mergeWorkspaceByRole(JSON.parse(current.data),incoming,user.role);if(!merged.changedSections.length){const users=(await env.DB.prepare('SELECT id,email,name,role,active FROM users ORDER BY role,name').all()).results||[];return json({revision:baseRevision,schemaVersion:Number(current.schema_version),data:publicWorkspace(JSON.parse(current.data),user,users,baseRevision),changedSections:[]})}
  const nextRevision=baseRevision+1,updated=now(),result=await env.DB.prepare('UPDATE workspace_state SET revision=?,schema_version=?,data=?,updated_by=?,updated_at=? WHERE id=1 AND revision=?').bind(nextRevision,Math.max(Number(current.schema_version||10),Number(incoming.schemaVersion||10)),JSON.stringify(merged.data),user.id,updated,baseRevision).run();
  if(Number(result.meta?.changes||0)!==1)return json({error:'REVISION_CONFLICT',message:'Данные изменены другим пользователем. Обновите рабочее пространство.'},409);
  await env.DB.prepare('INSERT INTO audit_log(id,user_id,action,entity_type,changed_sections,old_revision,new_revision,metadata,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(uid(),user.id,'workspace.sync','workspace',JSON.stringify(merged.changedSections),baseRevision,nextRevision,JSON.stringify({role:user.role,ignoredSections:merged.ignoredSections}),updated).run();
  const users=(await env.DB.prepare('SELECT id,email,name,role,active FROM users ORDER BY role,name').all()).results||[];return json({revision:nextRevision,schemaVersion:Math.max(Number(current.schema_version||10),Number(incoming.schemaVersion||10)),data:publicWorkspace(merged.data,user,users,nextRevision),changedSections:merged.changedSections});
 }
 if(path==='/api/workspace/bootstrap'&&request.method==='POST'){
  if(!roleAllowed(user,'director'))return json({error:'FORBIDDEN',message:'Недостаточно прав'},403);const current=await env.DB.prepare('SELECT * FROM workspace_state WHERE id=1').first(),body=await parseJson(request),incoming=body.data;if(!current||!incoming||typeof incoming!=='object')return json({error:'INVALID_INPUT',message:'Нужны данные для переноса'},400);if(!isWorkspaceEmpty(JSON.parse(current.data)))return json({error:'WORKSPACE_NOT_EMPTY',message:'Перенос разрешён только в пустое рабочее пространство'},409);
  const clean={...incoming,users:undefined,currentUser:undefined,meta:{...(incoming.meta||{}),serverManaged:true,bootstrappedAt:now()}},revision=1;delete clean.users;delete clean.currentUser;
  await env.DB.prepare('UPDATE workspace_state SET revision=?,schema_version=?,data=?,updated_by=?,updated_at=? WHERE id=1').bind(revision,Math.max(10,Number(incoming.schemaVersion||10)),JSON.stringify(clean),user.id,now()).run();return json({ok:true,revision});
 }
 if(path==='/api/workspace/audit'&&request.method==='GET'){
  const rows=(await env.DB.prepare(`SELECT a.*,u.name AS user_name,u.role AS user_role FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 100`).all()).results||[];return json({items:rows.map(row=>({...row,changed_sections:row.changed_sections?JSON.parse(row.changed_sections):[],metadata:row.metadata?JSON.parse(row.metadata):{}}))});
 }
 return null;
}

async function usersRoute(request,env,path){
 const auth=await requireUser(request,env,['director']);if(auth.error)return auth.error;const currentUser=auth.user;
 if(path==='/api/users'&&request.method==='GET'){const users=(await env.DB.prepare('SELECT id,email,name,role,active,created_at,updated_at FROM users ORDER BY role,name').all()).results||[];return json({users:users.map(safeUser)})}
 if(path==='/api/users'&&request.method==='POST'){
  const body=await parseJson(request),email=String(body.email||'').trim().toLowerCase(),name=String(body.name||'').trim(),role=String(body.role||'manager'),password=String(body.password||'');if(!email||!name||!['director','manager'].includes(role)||password.length<10)return json({error:'INVALID_INPUT',message:'Укажите имя, email, роль и пароль не короче 10 символов'},400);
  const user={id:uid(),email,name,role,active:1},created=now();try{await env.DB.prepare('INSERT INTO users(id,email,name,role,password_hash,active,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)').bind(user.id,email,name,role,await hashPassword(password),created,created).run()}catch(error){if(String(error).includes('UNIQUE'))return json({error:'EMAIL_EXISTS',message:'Пользователь с таким email уже существует'},409);throw error}return json({user:safeUser(user)},201);
 }
 const match=path.match(/^\/api\/users\/([^/]+)$/);if(match&&request.method==='PATCH'){
  const id=decodeURIComponent(match[1]),current=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();if(!current)return json({error:'USER_NOT_FOUND',message:'Пользователь не найден'},404);const body=await parseJson(request),sets=[],values=[];
  if('name'in body){const name=String(body.name||'').trim();if(!name)return json({error:'INVALID_NAME',message:'Имя не может быть пустым'},400);sets.push('name=?');values.push(name)}
  if('role'in body){const role=String(body.role);if(!['director','manager'].includes(role))return json({error:'INVALID_ROLE',message:'Неизвестная роль'},400);if(id===currentUser.id&&role!=='director')return json({error:'SELF_ROLE',message:'Нельзя снять роль директора у текущего пользователя'},400);sets.push('role=?');values.push(role)}
  if('active'in body){const active=body.active?1:0;if(id===currentUser.id&&!active)return json({error:'SELF_DISABLE',message:'Нельзя отключить собственный аккаунт'},400);sets.push('active=?');values.push(active)}
  let passwordChanged=false;if('password'in body){const password=String(body.password||'');if(password.length<10)return json({error:'WEAK_PASSWORD',message:'Пароль должен содержать не менее 10 символов'},400);sets.push('password_hash=?');values.push(await hashPassword(password));passwordChanged=true}
  if(!sets.length)return json({user:safeUser(current)});sets.push('updated_at=?');values.push(now(),id);await env.DB.prepare(`UPDATE users SET ${sets.join(',')} WHERE id=?`).bind(...values).run();if(passwordChanged||body.active===false)await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id).run();const updated=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();return json({user:safeUser(updated)});
 }
 return null;
}

async function filesRoute(request,env,path){
 const match=path.match(/^\/api\/files\/([^/]+)$/);
 if(path==='/api/files'&&request.method==='POST'){
  const auth=await requireUser(request,env,['manager']);if(auth.error)return auth.error;const form=await request.formData(),files=form.getAll('files').filter(item=>item instanceof File),maxBytes=Number(env.MAX_FILE_SIZE_MB||20)*1024*1024,total=files.reduce((sum,file)=>sum+file.size,0);if(!files.length)return json({error:'NO_FILES',message:'Файлы не выбраны'},400);if(total>maxBytes)return json({error:'FILE_TOO_LARGE',message:`Общий размер файлов превышает ${env.MAX_FILE_SIZE_MB||20} МБ`},413);
  const created=[];for(const file of files){const id=uid(),buffer=new Uint8Array(await file.arrayBuffer()),chunkSize=512*1024,chunkCount=Math.ceil(buffer.length/chunkSize),createdAt=now();await env.DB.prepare('INSERT INTO files(id,uploaded_by,entity_type,entity_id,original_name,mime_type,size_bytes,chunk_count,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,auth.user.id,String(form.get('entityType')||'')||null,String(form.get('entityId')||'')||null,file.name,file.type||null,file.size,chunkCount,createdAt).run();const statements=[];for(let index=0;index<chunkCount;index++)statements.push(env.DB.prepare('INSERT INTO file_chunks(file_id,chunk_index,content) VALUES(?,?,?)').bind(id,index,buffer.slice(index*chunkSize,Math.min(buffer.length,(index+1)*chunkSize))));if(statements.length)await env.DB.batch(statements);created.push({id,entity_type:String(form.get('entityType')||''),entity_id:String(form.get('entityId')||''),original_name:file.name,mime_type:file.type||'',size_bytes:file.size,created_at:createdAt})}return json({files:created},201);
 }
 if(match&&request.method==='GET'){
  const auth=await requireUser(request,env);if(auth.error)return auth.error;const id=decodeURIComponent(match[1]),meta=await env.DB.prepare('SELECT * FROM files WHERE id=? AND archived_at IS NULL').bind(id).first();if(!meta)return json({error:'FILE_NOT_FOUND',message:'Файл не найден'},404);const rows=(await env.DB.prepare('SELECT content FROM file_chunks WHERE file_id=? ORDER BY chunk_index').bind(id).all()).results||[],result=new Uint8Array(Number(meta.size_bytes)),offset={value:0};for(const row of rows){const chunk=row.content instanceof ArrayBuffer?new Uint8Array(row.content):new Uint8Array(row.content||[]);result.set(chunk,offset.value);offset.value+=chunk.length}return new Response(result,{headers:{'Content-Type':meta.mime_type||'application/octet-stream','Content-Length':String(meta.size_bytes),'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(meta.original_name)}`}});
 }
 if(match&&request.method==='DELETE'){
  const auth=await requireUser(request,env,['manager']);if(auth.error)return auth.error;const result=await env.DB.prepare('UPDATE files SET archived_at=? WHERE id=? AND archived_at IS NULL').bind(now(),decodeURIComponent(match[1])).run();if(Number(result.meta?.changes||0)!==1)return json({error:'FILE_NOT_FOUND',message:'Файл не найден'},404);return new Response(null,{status:204});
 }
 return null;
}

export default{async fetch(request,env){
 const cors=corsHeaders(request,env);if(cors===null)return json({error:'CORS_DENIED',message:'Источник запроса не разрешён'},403);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});const url=new URL(request.url),path=url.pathname;
 try{
  if(path==='/health')return json({ok:true,service:'promapparat-cloudflare-api',time:now()},200,cors);
  if(path==='/ready'){await env.DB.prepare('SELECT 1 AS ok').first();return json({ok:true,database:'D1',time:now()},200,cors)}
  if(path==='/api/bootstrap'&&request.method==='POST')return withCors(await bootstrap(request,env),cors);
  const authResponse=await authRoute(request,env,path);if(authResponse)return withCors(authResponse,cors);
  if(path.startsWith('/api/workspace')){const response=await workspaceRoute(request,env,path);if(response)return withCors(response,cors)}
  if(path.startsWith('/api/users')){const response=await usersRoute(request,env,path);if(response)return withCors(response,cors)}
  if(path.startsWith('/api/files')){const response=await filesRoute(request,env,path);if(response)return withCors(response,cors)}
  return json({error:'NOT_FOUND',message:'Маршрут не найден'},404,cors);
 }catch(error){console.error(error);return json({error:'INTERNAL_ERROR',message:'Внутренняя ошибка сервера'},500,cors)}
}};

function withCors(response,headers){const next=new Headers(response.headers);for(const[key,value]of Object.entries(headers||{}))next.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:next})}
