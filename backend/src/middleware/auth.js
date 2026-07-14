import {verifyAccessToken} from '../security/tokens.js';

export async function requireAuth(req,res,next){
 try{
  const header=req.headers.authorization||'',token=header.startsWith('Bearer ')?header.slice(7):'';
  if(!token)return res.status(401).json({error:'AUTH_REQUIRED',message:'Требуется вход в систему'});
  const payload=await verifyAccessToken(token);
  req.user={id:payload.sub,organizationId:payload.organizationId,role:payload.role,name:payload.name,email:payload.email};
  next();
 }catch{return res.status(401).json({error:'INVALID_TOKEN',message:'Сессия недействительна или истекла'})}
}

export const requireRole=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({error:'FORBIDDEN',message:'Недостаточно прав'});
