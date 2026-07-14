import 'dotenv/config';
import path from 'node:path';

const required=(name,value)=>{if(!value)throw new Error(`Missing environment variable: ${name}`);return value};
const bool=value=>String(value||'').toLowerCase()==='true';
const list=value=>String(value||'').split(',').map(item=>item.trim()).filter(Boolean);

export const config={
 nodeEnv:process.env.NODE_ENV||'development',
 port:Number(process.env.PORT||8787),
 databaseUrl:required('DATABASE_URL',process.env.DATABASE_URL),
 databaseSsl:bool(process.env.DATABASE_SSL),
 jwtSecret:required('JWT_SECRET',process.env.JWT_SECRET),
 jwtIssuer:process.env.JWT_ISSUER||'promapparat-workspace',
 jwtAudience:process.env.JWT_AUDIENCE||'promapparat-web',
 corsOrigins:list(process.env.CORS_ORIGINS||'http://localhost:5173'),
 fileStorageDir:path.resolve(process.env.FILE_STORAGE_DIR||'./storage'),
 maxFileSizeBytes:Number(process.env.MAX_FILE_SIZE_MB||50)*1024*1024
};

if(config.jwtSecret.length<32)throw new Error('JWT_SECRET must contain at least 32 characters');
