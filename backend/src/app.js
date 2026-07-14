import fs from'node:fs/promises';
import{constants as fsConstants}from'node:fs';
import express from'express';
import cors from'cors';
import helmet from'helmet';
import{config}from'./config.js';
import{query}from'./db.js';
import authRoutes from'./routes/auth.js';
import workspaceRoutes from'./routes/workspace.js';
import fileRoutes from'./routes/files.js';
import userRoutes from'./routes/users.js';

export const app=express();
app.disable('x-powered-by');
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin(origin,callback){if(!origin||config.corsOrigins.includes(origin))return callback(null,true);callback(new Error('Origin is not allowed by CORS'))},credentials:false,methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization']}));
app.use(express.json({limit:'20mb'}));

app.get('/health',(req,res)=>res.json({ok:true,service:'promapparat-api',time:new Date().toISOString()}));
app.get('/ready',async(req,res)=>{try{await query('SELECT 1');await fs.mkdir(config.fileStorageDir,{recursive:true});await fs.access(config.fileStorageDir,fsConstants.R_OK|fsConstants.W_OK);res.json({ok:true,database:'ready',fileStorage:'ready',time:new Date().toISOString()})}catch(error){res.status(503).json({ok:false,database:'unavailable',fileStorage:'unavailable',message:config.nodeEnv==='production'?'Service is not ready':error?.message||'Service is not ready'})}});
app.use('/api/auth',authRoutes);
app.use('/api/workspace',workspaceRoutes);
app.use('/api/files',fileRoutes);
app.use('/api/users',userRoutes);

app.use((req,res)=>res.status(404).json({error:'NOT_FOUND',message:'Маршрут не найден'}));
app.use((error,req,res,next)=>{console.error(error);if(error?.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'FILE_TOO_LARGE',message:'Файл превышает допустимый размер'});if(String(error?.message||'').includes('CORS'))return res.status(403).json({error:'CORS_DENIED',message:'Источник запроса не разрешён'});res.status(500).json({error:'INTERNAL_ERROR',message:config.nodeEnv==='production'?'Внутренняя ошибка сервера':error?.message||'Внутренняя ошибка сервера'})});
