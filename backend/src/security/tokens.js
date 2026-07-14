import crypto from 'node:crypto';
import {SignJWT,jwtVerify} from 'jose';
import {config} from '../config.js';

const secret=new TextEncoder().encode(config.jwtSecret);
export const hashToken=value=>crypto.createHash('sha256').update(value).digest('hex');
export const createRefreshToken=()=>crypto.randomBytes(48).toString('base64url');

export async function signAccessToken(user){return new SignJWT({role:user.role,organizationId:user.organization_id,name:user.name,email:user.email}).setProtectedHeader({alg:'HS256'}).setSubject(user.id).setIssuer(config.jwtIssuer).setAudience(config.jwtAudience).setIssuedAt().setExpirationTime('15m').sign(secret)}
export async function verifyAccessToken(token){const{payload}=await jwtVerify(token,secret,{issuer:config.jwtIssuer,audience:config.jwtAudience});return payload}
