import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),data=resolve(process.env.DATA_DIR||resolve(root,'data'));
mkdirSync(data,{recursive:true,mode:0o700});
const sqlite=new DatabaseSync(resolve(data,'arena.sqlite'));
sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
sqlite.exec('CREATE TABLE IF NOT EXISTS _schema_migrations(name TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at INTEGER NOT NULL)');
for(const name of readdirSync(resolve(root,'drizzle')).filter(n=>n.endsWith('.sql')).sort()){
 const sql=readFileSync(resolve(root,'drizzle',name),'utf8'),hash=createHash('sha256').update(sql).digest('hex'),prior=sqlite.prepare('SELECT sha256 FROM _schema_migrations WHERE name=?').get(name);
 if(prior){if(prior.sha256!==hash)throw new Error('已应用的数据库迁移发生变化：'+name);continue;}
 sqlite.exec('BEGIN IMMEDIATE');try{sqlite.exec(sql);sqlite.prepare('INSERT INTO _schema_migrations VALUES(?,?,?)').run(name,hash,Math.floor(Date.now()/1000));sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}
}
const codeFile=resolve(data,'owner-code.txt');
if(!process.env.OWNER_CODE&&!existsSync(codeFile))writeFileSync(codeFile,randomBytes(24).toString('base64url')+'\n',{mode:0o600,flag:'wx'});
const code=(process.env.OWNER_CODE||readFileSync(codeFile,'utf8')).trim();
if(code.length<24)throw new Error('OWNER_CODE 应至少 24 个字符。');
class Prepared{
 constructor(sql,values=[]){this.sql=sql;this.values=values;}
 bind(...values){return new Prepared(this.sql,values);}
 async first(){return sqlite.prepare(this.sql).get(...this.values)||null;}
 async all(){return {results:sqlite.prepare(this.sql).all(...this.values)};}
 execute(){const r=sqlite.prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
 async run(){return this.execute();}
}
const DB={prepare:sql=>new Prepared(sql),async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const out=statements.map(s=>s.execute());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
export const env={DB,OWNER_CODE:code};
export const databaseFile=resolve(data,'arena.sqlite');
export const ownerCodeFile=process.env.OWNER_CODE?'环境变量 OWNER_CODE':codeFile;
export const closeDatabase=()=>sqlite.close();
export function backupDatabase(){const filename=resolve(data,'arena-backup-'+new Date().toISOString().replaceAll(':','-')+'.sqlite');sqlite.prepare('VACUUM INTO ?').run(filename);return filename;}
