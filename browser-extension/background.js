const DEFAULT_APP_URL='https://promapparat-workspace.pages.dev/';

async function getAppUrl(){
 const{appUrl}=await chrome.storage.sync.get({appUrl:DEFAULT_APP_URL});
 try{return new URL(appUrl||DEFAULT_APP_URL).toString()}catch{return DEFAULT_APP_URL}
}

function captureUrl(appUrl,{url='',title='',text=''}){
 const target=new URL(appUrl);
 target.searchParams.set('capture','1');
 if(url)target.searchParams.set('url',url);
 if(title)target.searchParams.set('title',title);
 if(text)target.searchParams.set('text',text.slice(0,5000));
 return target.toString();
}

async function openCapture(tab,text=''){
 if(!tab)return;
 const appUrl=await getAppUrl(),targetUrl=captureUrl(appUrl,{url:tab.url||'',title:tab.title||'',text}),origin=new URL(appUrl).origin;
 const tabs=await chrome.tabs.query({});
 const existing=tabs.find(item=>item.id&&item.url?.startsWith(origin));
 if(existing){
  await chrome.tabs.update(existing.id,{url:targetUrl,active:true});
  if(existing.windowId)await chrome.windows.update(existing.windowId,{focused:true});
  return;
 }
 await chrome.tabs.create({url:targetUrl});
}

chrome.runtime.onInstalled.addListener(async()=>{
 const stored=await chrome.storage.sync.get('appUrl');
 if(!stored.appUrl)await chrome.storage.sync.set({appUrl:DEFAULT_APP_URL});
 await chrome.contextMenus.removeAll();
 chrome.contextMenus.create({id:'promapparat-page',title:'Добавить страницу в PromApparat',contexts:['page']});
 chrome.contextMenus.create({id:'promapparat-selection',title:'Добавить выделенное в PromApparat',contexts:['selection']});
});

chrome.action.onClicked.addListener(tab=>openCapture(tab));
chrome.commands.onCommand.addListener(async command=>{
 if(command!=='capture-tender')return;
 const[tab]=await chrome.tabs.query({active:true,currentWindow:true});
 await openCapture(tab);
});
chrome.contextMenus.onClicked.addListener((info,tab)=>openCapture(tab,info.selectionText||''));