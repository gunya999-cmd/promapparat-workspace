import crypto from 'node:crypto';
import {promisify} from 'node:util';

const scrypt=promisify(crypto.scrypt),keyLength=64,params={N:16384,r:8,p:1,maxmem:64*1024*1024};

export async function hashPassword(password){const salt=crypto.randomBytes(16),derived=await scrypt(String(password),salt,keyLength,params);return`scrypt$${params.N}$${params.r}$${params.p}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`}
export async function verifyPassword(encoded,password){try{const[algorithm,n,r,p,saltValue,hashValue]=String(encoded||'').split('$');if(algorithm!=='scrypt')return false;const salt=Buffer.from(saltValue,'base64url'),expected=Buffer.from(hashValue,'base64url'),derived=Buffer.from(await scrypt(String(password),salt,expected.length,{N:Number(n),r:Number(r),p:Number(p),maxmem:64*1024*1024}));return expected.length===derived.length&&crypto.timingSafeEqual(expected,derived)}catch{return false}}
