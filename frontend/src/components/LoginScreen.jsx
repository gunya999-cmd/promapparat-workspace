import React,{useState}from'react';
import{ArrowRight,LockKeyhole,ShieldCheck,UserRound}from'lucide-react';
import{login}from'../api/client.js';
import'./login.css';

export function LoginScreen({onAuthenticated}){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const submit=async event=>{event.preventDefault();if(busy)return;setBusy(true);setError('');try{const session=await login(email,password);onAuthenticated(session)}catch(exception){setError(exception?.message||'Не удалось войти')}finally{setBusy(false)}};
 return <main className="login-page"><section className="login-card"><div className="login-brand"><div>PA</div><span>PromApparat Workspace</span></div><div className="login-copy"><span>Рабочая система компании</span><h1>Вход в рабочее пространство</h1><p>Роль и доступ определяются сервером. Менеджер видит свои сделки, директор — сводку и финансовые настройки.</p></div><form onSubmit={submit}><label><span>Email</span><div><UserRound/><input autoFocus type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@company.ru" required/></div></label><label><span>Пароль</span><div><LockKeyhole/><input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Введите пароль" required/></div></label>{error&&<div className="login-error">{error}</div>}<button className="primary" disabled={busy}>{busy?'Вход…':'Войти'}<ArrowRight/></button></form><footer><ShieldCheck/><span>Данные хранятся в общей PostgreSQL-базе. Все изменения фиксируются в журнале.</span></footer></section></main>
}
