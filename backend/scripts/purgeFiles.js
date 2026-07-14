import fs from'node:fs/promises';
import path from'node:path';
import{config}from'../src/config.js';
import{pool,query}from'../src/db.js';

const retentionDays=Math.max(1,Number(process.env.FILE_RETENTION_DAYS||30));

async function main(){
 const result=await query(`SELECT id,organization_id,storage_name FROM files WHERE deleted_at IS NOT NULL AND deleted_at < now()-($1::text||' days')::interval ORDER BY deleted_at LIMIT 1000`,[retentionDays]);
 let removed=0;
 for(const file of result.rows){try{await fs.rm(path.join(config.fileStorageDir,file.organization_id,file.storage_name),{force:true});await query('DELETE FROM files WHERE id=$1 AND deleted_at IS NOT NULL',[file.id]);removed++}catch(error){console.error(`Failed to purge file ${file.id}`,error)}}
 console.log(`Purged ${removed} archived file(s); retention ${retentionDays} day(s)`);
}

main().then(()=>pool.end()).catch(async error=>{console.error(error);await pool.end();process.exit(1)});
