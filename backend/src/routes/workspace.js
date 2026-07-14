import {Router} from 'express';
import {query,transaction} from '../db.js';
import {requireAuth} from '../middleware/auth.js';
import {mergeWorkspaceByRole,publicWorkspace} from '../policies/workspacePolicy.js';

const router=Router();
const loadUsers=(client,organizationId)=>client.query('SELECT id,name,email,role,active FROM users WHERE organization_id=$1 ORDER BY role,name',[organizationId]);

router.get('/',requireAuth,async(req,res,next)=>{try{
 const[stateResult,usersResult]=await Promise.all([
  query('SELECT revision,schema_version,data,updated_at FROM workspace_states WHERE organization_id=$1',[req.user.organizationId]),
  query('SELECT id,name,email,role,active FROM users WHERE organization_id=$1 ORDER BY role,name',[req.user.organizationId])
 ]),state=stateResult.rows[0];
 if(!state)return res.status(404).json({error:'WORKSPACE_NOT_FOUND',message:'Рабочее пространство не создано'});
 res.json({revision:Number(state.revision),schemaVersion:state.schema_version,updatedAt:state.updated_at,data:publicWorkspace(state.data,req.user,usersResult.rows)});
 }catch(error){next(error)}});

router.put('/',requireAuth,async(req,res,next)=>{try{
 const baseRevision=Number(req.body?.baseRevision),incoming=req.body?.data;
 if(!Number.isInteger(baseRevision)||!incoming||typeof incoming!=='object')return res.status(400).json({error:'INVALID_INPUT',message:'Нужны baseRevision и data'});
 const result=await transaction(async client=>{
  const locked=await client.query('SELECT revision,schema_version,data FROM workspace_states WHERE organization_id=$1 FOR UPDATE',[req.user.organizationId]),current=locked.rows[0];
  if(!current)return{status:404};
  if(Number(current.revision)!==baseRevision)return{status:409,currentRevision:Number(current.revision)};
  const merged=mergeWorkspaceByRole(current.data,incoming,req.user.role);
  if(!merged.changedSections.length){const users=await loadUsers(client,req.user.organizationId);return{status:200,revision:Number(current.revision),schemaVersion:current.schema_version,data:publicWorkspace(current.data,req.user,users.rows),changedSections:[]}}
  const nextRevision=Number(current.revision)+1,schemaVersion=Math.max(Number(current.schema_version||10),Number(incoming.schemaVersion||10));
  await client.query('UPDATE workspace_states SET revision=$2,schema_version=$3,data=$4::jsonb,updated_by=$5,updated_at=now() WHERE organization_id=$1',[req.user.organizationId,nextRevision,schemaVersion,JSON.stringify(merged.data),req.user.id]);
  await client.query('INSERT INTO audit_log(organization_id,user_id,action,entity_type,changed_sections,old_revision,new_revision,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[req.user.organizationId,req.user.id,'workspace.sync','workspace',merged.changedSections,baseRevision,nextRevision,JSON.stringify({role:req.user.role,ignoredSections:merged.ignoredSections})]);
  const users=await loadUsers(client,req.user.organizationId);
  return{status:200,revision:nextRevision,schemaVersion,data:publicWorkspace(merged.data,req.user,users.rows),changedSections:merged.changedSections};
 });
 if(result.status===409)return res.status(409).json({error:'REVISION_CONFLICT',message:'Данные изменены другим пользователем. Обновите рабочее пространство.',currentRevision:result.currentRevision});
 if(result.status===404)return res.status(404).json({error:'WORKSPACE_NOT_FOUND',message:'Рабочее пространство не создано'});
 res.json(result);
 }catch(error){next(error)}});

router.get('/audit',requireAuth,async(req,res,next)=>{try{const limit=Math.min(200,Math.max(1,Number(req.query.limit||50))),result=await query(`SELECT a.id,a.action,a.entity_type,a.entity_id,a.changed_sections,a.old_revision,a.new_revision,a.metadata,a.created_at,u.name AS user_name,u.role AS user_role FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE a.organization_id=$1 ORDER BY a.created_at DESC LIMIT $2`,[req.user.organizationId,limit]);res.json({items:result.rows})}catch(error){next(error)}});

export default router;
