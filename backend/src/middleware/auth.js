import {query} from '../db.js';
import {verifyAccessToken} from '../security/tokens.js';

export async function requireAuth(req,res,next){
 try{
  const header=req.headers.authorization||'',token=header.startsWith('Bearer ')?header.slice(7):'';
  if(!token)return res.status(401).json({error:'AUTH_REQUIRED',message:'Требуется вход в систему'});
  const payload=await verifyAccessToken(token),result=await query('SELECT id,organization_id,email,name,role,active FROM users WHERE id=$1 AND organization_id=$2 AND active=true',[payload.sub,payload.organizationId]),user=result.rows[0];
  if(!user)return res.status(401).json({error:'USER_DISABLED',message:'Учётная запись отключена'});
  req.user={id:user.id,organizationId:user.organization_id,role:user.role,name:user.name,email:user.email};
  next();
 }catch{return res.status(401).json({error:'INVALID_TOKEN',message:'Сессия недействительна или истекла'})}
}

export const requireRole=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({error:'FORBIDDEN',message:'Недостаточно прав'});
