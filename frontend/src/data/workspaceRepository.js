import{STORAGE_KEY,createDemoWorkspace,normalizeWorkspace}from'../domain/workspace.js';

export class LocalWorkspaceRepository{
 load(){try{return normalizeWorkspace(JSON.parse(localStorage.getItem(STORAGE_KEY))||createDemoWorkspace())}catch{return createDemoWorkspace()}}
 save(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
 clear(){localStorage.removeItem(STORAGE_KEY)}
}

// Позже этот интерфейс будет заменен на ApiWorkspaceRepository без изменения UI.
export const workspaceRepository=new LocalWorkspaceRepository();
