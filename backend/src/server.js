import {app} from './app.js';
import {config} from './config.js';
import {pool} from './db.js';

const server=app.listen(config.port,()=>console.log(`PromApparat API listening on :${config.port}`));

async function shutdown(signal){console.log(`${signal}: shutting down`);server.close(async()=>{await pool.end();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGINT',()=>shutdown('SIGINT'));
process.on('SIGTERM',()=>shutdown('SIGTERM'));
