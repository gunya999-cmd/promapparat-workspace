import {Router} from 'express';
import {query,transaction} from '../db.js';
import {requireAuth} from '../middleware/auth.js';
import {verifyPassword} from '../security/passwords.js';
import {createRefreshToken,hashToken,signAccessToken} from '../security/tokens.js';

const router=Router(),refreshLifetimeMs=30*24*60*60*1000;
const safeUser=row=>({id:row.id,organizationId:row.organization_id,email:row.email,name:row.name,role:row.role});

async function issueSession(user,client={query}){
 const accessToken=await signAccessToken(user),refreshToken=createRefreshToken(),expiresAt=new Date(Date.now()+refreshLifetimeMs);
 await client.query('INSERT INTO refresh_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3)',[user.id,hashToken(refreshToken),expiresAt]);
 return{accessToken,refreshToken,expiresAt:expiresAt.toISOString(),user:safeUser(user)};
}

router.post('/login',async(req,res,next)=>{try{
 const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');
 if(!email||!password)return res.status(400).json({error:'INVALID_INPUT',message:'Введите email и пароль'});
 const result=await query('SELECT * FROM users WHERE lower(email)=lower($1) AND active=true LIMIT 1',[email]),user=result.rows[0];
 if(!user||!await verifyPassword(user.password_hash,password))return res.status(401).json({error:'INVALID_CREDENTIALS',message:'Неверный email или пароль'});
 res.json(await issueSession(user));
 }catch(error){next(error)}});

router.post('/refresh',async(req,res,next)=>{try{
 const refreshToken=String(req.body?.refreshToken||'');if(!refreshToken)return res.status(400).json({error:'INVALID_INPUT',message:'Отсутствует токен обновления'});
 const session=await transaction(async client=>{
  const found=await client.query(`SELECT rt.*,u.* FROM refresh_tokens rt JOIN users u ON u.id=rt.user_id WHERE rt.token_hash=$1 AND rt.revoked_at IS NULL AND rt.expires_at>now() AND u.active=true FOR UPDATE`,[hashToken(refreshToken)]),user=found.rows[0];
  if(!user)return null;
  await client.query('UPDATE refresh_tokens SET revoked_at=now() WHERE id=$1',[user.id_1||user.id]);
  return issueSession(user,client);
 });
 if(!session)return res.status(401).json({error:'INVALID_REFRESH_TOKEN',message:'Сессия истекла. Войдите снова'});
 res.json(await session);
 }catch(error){next(error)}});

router.post('/logout',async(req,res,next)=>{try{const token=String(req.body?.refreshToken||'');if(token)await query('UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL',[hashToken(token)]);res.status(204).end()}catch(error){next(error)}});
router.get('/me',requireAuth,(req,res)=>res.json({user:req.user}));

export default router;
