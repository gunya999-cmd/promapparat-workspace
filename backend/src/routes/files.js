import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Router} from 'express';
import multer from 'multer';
import {config} from '../config.js';
import {query} from '../db.js';
import {requireAuth,requireRole} from '../middleware/auth.js';

const router=Router(),upload=multer({storage:multer.memoryStorage(),limits:{fileSize:config.maxFileSizeBytes,files:10}});
const safeName=value=>String(value||'file').replace(/[\\/:*?"<>|\u0000-\u001F]/g,'_').slice(0,240);

router.post('/',requireAuth,requireRole('manager'),upload.array('files',10),async(req,res,next)=>{try{
 const files=req.files||[];if(!files.length)return res.status(400).json({error:'NO_FILES',message:'Файлы не выбраны'});
 const entityType=String(req.body?.entityType||''),entityId=String(req.body?.entityId||''),dir=path.join(config.fileStorageDir,req.user.organizationId);await fs.mkdir(dir,{recursive:true});
 const created=[];
 for(const file of files){
  const storageName=`${crypto.randomUUID()}-${safeName(file.originalname)}`,fullPath=path.join(dir,storageName),sha256=crypto.createHash('sha256').update(file.buffer).digest('hex');
  await fs.writeFile(fullPath,file.buffer,{flag:'wx'});
  try{const result=await query(`INSERT INTO files(organization_id,uploaded_by,entity_type,entity_id,original_name,storage_name,mime_type,size_bytes,sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,entity_type,entity_id,original_name,mime_type,size_bytes,sha256,created_at`,[req.user.organizationId,req.user.id,entityType||null,entityId||null,file.originalname,storageName,file.mimetype||null,file.size,sha256]);created.push(result.rows[0])}catch(error){await fs.rm(fullPath,{force:true});throw error}
 }
 await query('INSERT INTO audit_log(organization_id,user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[req.user.organizationId,req.user.id,'file.upload',entityType||'file',entityId||null,JSON.stringify({count:created.length,fileIds:created.map(item=>item.id)})]);
 res.status(201).json({files:created});
 }catch(error){next(error)}});

router.get('/:id',requireAuth,async(req,res,next)=>{try{
 const result=await query('SELECT * FROM files WHERE id=$1 AND organization_id=$2',[req.params.id,req.user.organizationId]),file=result.rows[0];
 if(!file)return res.status(404).json({error:'FILE_NOT_FOUND',message:'Файл не найден'});
 const fullPath=path.join(config.fileStorageDir,req.user.organizationId,file.storage_name);
 res.setHeader('Content-Type',file.mime_type||'application/octet-stream');res.setHeader('Content-Length',String(file.size_bytes));res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);if(file.deleted_at)res.setHeader('X-Promapparat-Archived','true');res.sendFile(fullPath,error=>{if(error&&!res.headersSent)next(error)});
 }catch(error){next(error)}});

router.delete('/:id',requireAuth,requireRole('manager'),async(req,res,next)=>{try{
 const result=await query('UPDATE files SET deleted_at=COALESCE(deleted_at,now()),deleted_by=COALESCE(deleted_by,$3) WHERE id=$1 AND organization_id=$2 RETURNING id,original_name,deleted_at',[req.params.id,req.user.organizationId,req.user.id]),file=result.rows[0];
 if(!file)return res.status(404).json({error:'FILE_NOT_FOUND',message:'Файл не найден'});
 await query('INSERT INTO audit_log(organization_id,user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[req.user.organizationId,req.user.id,'file.archive','file',file.id,JSON.stringify({name:file.original_name,purgeAfterDays:30})]);res.status(204).end();
 }catch(error){next(error)}});

export default router;
