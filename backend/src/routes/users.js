import {Router} from 'express';
import {query} from '../db.js';
import {requireAuth,requireRole} from '../middleware/auth.js';
import {hashPassword} from '../security/passwords.js';

const router=Router();
const safe=row=>({id:row.id,email:row.email,name:row.name,role:row.role,active:row.active,createdAt:row.created_at,updatedAt:row.updated_at});
const validRole=value=>['director','manager'].includes(value);

router.use(requireAuth,requireRole('director'));
router.get('/',async(req,res,next)=>{try{const result=await query('SELECT id,email,name,role,active,created_at,updated_at FROM users WHERE organization_id=$1 ORDER BY role,name',[req.user.organizationId]);res.json({users:result.rows.map(safe)})}catch(error){next(error)}});

router.post('/',async(req,res,next)=>{try{
 const email=String(req.body?.email||'').trim().toLowerCase(),name=String(req.body?.name||'').trim(),role=String(req.body?.role||'manager'),password=String(req.body?.password||'');
 if(!email||!name||!validRole(role)||password.length<10)return res.status(400).json({error:'INVALID_INPUT',message:'Укажите имя, корректный email, роль и пароль не короче 10 символов'});
 const passwordHash=await hashPassword(password),result=await query('INSERT INTO users(organization_id,email,name,role,password_hash,active) VALUES($1,$2,$3,$4,$5,true) RETURNING id,email,name,role,active,created_at,updated_at',[req.user.organizationId,email,name,role,passwordHash]);
 await query('INSERT INTO audit_log(organization_id,user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[req.user.organizationId,req.user.id,'user.create','user',result.rows[0].id,JSON.stringify({email,name,role})]);
 res.status(201).json({user:safe(result.rows[0])});
 }catch(error){if(error?.code==='23505')return res.status(409).json({error:'EMAIL_EXISTS',message:'Пользователь с таким email уже существует'});next(error)}});

router.patch('/:id',async(req,res,next)=>{try{
 const id=req.params.id,current=(await query('SELECT * FROM users WHERE id=$1 AND organization_id=$2',[id,req.user.organizationId])).rows[0];if(!current)return res.status(404).json({error:'USER_NOT_FOUND',message:'Пользователь не найден'});
 const changes={},values=[],sets=[];const add=(column,value)=>{values.push(value);sets.push(`${column}=$${values.length}`)};
 if('name'in req.body){const name=String(req.body.name||'').trim();if(!name)return res.status(400).json({error:'INVALID_NAME',message:'Имя не может быть пустым'});add('name',name);changes.name=name}
 if('role'in req.body){const role=String(req.body.role);if(!validRole(role))return res.status(400).json({error:'INVALID_ROLE',message:'Неизвестная роль'});if(id===req.user.id&&role!=='director')return res.status(400).json({error:'SELF_ROLE',message:'Нельзя снять роль директора у текущего пользователя'});add('role',role);changes.role=role}
 if('active'in req.body){const active=Boolean(req.body.active);if(id===req.user.id&&!active)return res.status(400).json({error:'SELF_DISABLE',message:'Нельзя отключить собственный аккаунт'});add('active',active);changes.active=active}
 if('password'in req.body){const password=String(req.body.password||'');if(password.length<10)return res.status(400).json({error:'WEAK_PASSWORD',message:'Пароль должен содержать не менее 10 символов'});add('password_hash',await hashPassword(password));changes.passwordChanged=true}
 if(!sets.length)return res.json({user:safe(current)});values.push(id,req.user.organizationId);const result=await query(`UPDATE users SET ${sets.join(',')},updated_at=now() WHERE id=$${values.length-1} AND organization_id=$${values.length} RETURNING id,email,name,role,active,created_at,updated_at`,values);
 await query('INSERT INTO audit_log(organization_id,user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[req.user.organizationId,req.user.id,'user.update','user',id,JSON.stringify(changes)]);res.json({user:safe(result.rows[0])});
 }catch(error){next(error)}});

export default router;
