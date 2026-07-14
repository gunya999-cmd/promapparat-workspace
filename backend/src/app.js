import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {config} from './config.js';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspace.js';
import fileRoutes from './routes/files.js';

export const app=express();
app.disable('x-powered-by');
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin(origin,callback){if(!origin||config.corsOrigins.includes(origin))return callback(null,true);callback(new Error('Origin is not allowed by CORS'))},credentials:false,methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization']}));
app.use(express.json({limit:'20mb'}));

app.get('/health',(req,res)=>res.json({ok:true,service:'promapparat-api',time:new Date().toISOString()}));
app.use('/api/auth',authRoutes);
app.use('/api/workspace',workspaceRoutes);
app.use('/api/files',fileRoutes);

app.use((req,res)=>res.status(404).json({error:'NOT_FOUND',message:'Маршрут не найден'}));
app.use((error,req,res,next)=>{console.error(error);if(error?.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'FILE_TOO_LARGE',message:'Файл превышает допустимый размер'});if(String(error?.message||'').includes('CORS'))return res.status(403).json({error:'CORS_DENIED',message:'Источник запроса не разрешён'});res.status(500).json({error:'INTERNAL_ERROR',message:config.nodeEnv==='production'?'Внутренняя ошибка сервера':error?.message||'Внутренняя ошибка сервера'})});
