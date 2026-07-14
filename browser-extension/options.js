const DEFAULT_APP_URL='https://promapparat-workspace.pages.dev/';
const input=document.getElementById('app-url'),status=document.getElementById('status');

async function load(){const{appUrl}=await chrome.storage.sync.get({appUrl:DEFAULT_APP_URL});input.value=appUrl||DEFAULT_APP_URL}
async function save(){
 try{const value=new URL(input.value.trim()||DEFAULT_APP_URL).toString();await chrome.storage.sync.set({appUrl:value});input.value=value;status.textContent='Сохранено';status.className='ok'}
 catch{status.textContent='Укажите корректный адрес';status.className='bad'}
 setTimeout(()=>{status.textContent='';status.className=''},2200);
}

document.getElementById('save').addEventListener('click',save);
document.getElementById('reset').addEventListener('click',()=>{input.value=DEFAULT_APP_URL;save()});
input.addEventListener('keydown',event=>{if(event.key==='Enter')save()});
load();