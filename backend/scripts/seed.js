import 'dotenv/config';
import {pool,transaction} from '../src/db.js';
import {hashPassword} from '../src/security/passwords.js';

const organizationName=process.env.SEED_ORGANIZATION_NAME||'ПО Промаппарат';
const director={email:(process.env.SEED_DIRECTOR_EMAIL||'director@promapparat.local').toLowerCase(),password:process.env.SEED_DIRECTOR_PASSWORD||'ChangeMe-Director-2026',name:'Директор',role:'director'};
const manager={email:(process.env.SEED_MANAGER_EMAIL||'manager@promapparat.local').toLowerCase(),password:process.env.SEED_MANAGER_PASSWORD||'ChangeMe-Manager-2026',name:'Иванов',role:'manager'};

const emptyWorkspace={schemaVersion:10,works:[],suppliers:[],positions:[],documents:[],tasks:[],customers:[],events:[],formulas:[],formulaImports:[],specificationImports:[],platforms:[],opportunities:[],platformChecks:[],supplierRequests:[],quotes:[],shipments:[],invoices:[],settings:{currency:'RUB',vatRate:20,targetMargin:15,managerBonusRate:5,taxRate:20,creditRate:18,bankFeeRate:1,guaranteeRate:1.5,riskReserveRate:2,fixedOverheadRate:3,dividendRate:30,managerCanSeeNetProfit:true,managerCanEnterParticipantBonus:true},counters:{workSequence:0},meta:{revision:0,serverManaged:true}};

async function upsertUser(client,organizationId,user){
 const passwordHash=await hashPassword(user.password);
 await client.query(`INSERT INTO users(organization_id,email,name,role,password_hash,active) VALUES($1,$2,$3,$4,$5,true) ON CONFLICT(organization_id,email) DO UPDATE SET name=excluded.name,role=excluded.role,password_hash=excluded.password_hash,active=true,updated_at=now()`,[organizationId,user.email,user.name,user.role,passwordHash]);
}

async function main(){
 await transaction(async client=>{
  let organization=(await client.query('SELECT id FROM organizations WHERE name=$1 LIMIT 1',[organizationName])).rows[0];
  if(!organization)organization=(await client.query('INSERT INTO organizations(name) VALUES($1) RETURNING id',[organizationName])).rows[0];
  await upsertUser(client,organization.id,director);await upsertUser(client,organization.id,manager);
  const directorId=(await client.query('SELECT id FROM users WHERE organization_id=$1 AND role=$2 ORDER BY created_at LIMIT 1',[organization.id,'director'])).rows[0].id;
  await client.query(`INSERT INTO workspace_states(organization_id,revision,schema_version,data,updated_by) VALUES($1,0,10,$2::jsonb,$3) ON CONFLICT(organization_id) DO NOTHING`,[organization.id,JSON.stringify(emptyWorkspace),directorId]);
  console.log(`Seeded organization: ${organizationName}`);console.log(`Director: ${director.email}`);console.log(`Manager: ${manager.email}`);
 });
}

main().then(()=>pool.end()).catch(async error=>{console.error(error);await pool.end();process.exit(1)});
