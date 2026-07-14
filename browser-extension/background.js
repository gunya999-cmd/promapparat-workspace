const APP_URL='https://promapparat-workspace.pages.dev/';

function captureUrl({url='',title='',text=''}){
 const target=new URL(APP_URL);
 target.searchParams.set('capture','1');
 if(url)target.searchParams.set('url',url);
 if(title)target.searchParams.set('title',title);
 if(text)target.searchParams.set('text',text.slice(0,5000));
 return target.toString();
}

async function openCapture(tab,text=''){
 if(!tab)return;
 await chrome.tabs.create({url:captureUrl({url:tab.url||'',title:tab.title||'',text})});
}

chrome.runtime.onInstalled.addListener(()=>{
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