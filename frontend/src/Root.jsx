import React,{useEffect,useState}from'react';
import App from'./App.jsx';
import{getSession,serverMode}from'./api/client.js';
import{LoginScreen}from'./components/LoginScreen.jsx';

export default function Root(){
 const[session,setSession]=useState(()=>getSession());
 useEffect(()=>{const handler=event=>setSession(event.detail||null);window.addEventListener('promapparat:session',handler);return()=>window.removeEventListener('promapparat:session',handler)},[]);
 if(serverMode&&!session)return<LoginScreen onAuthenticated={setSession}/>;
 return<App serverSession={serverMode?session:null}/>;
}
