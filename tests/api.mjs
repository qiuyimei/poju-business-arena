import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname,basename,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {Sim} from '../lib/engine.mjs';
import {CASES} from '../lib/cases.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),temporaryRoot=resolve(tmpdir());
const data=await mkdtemp(join(temporaryRoot,'poju-api-'));
const reserve=createServer();reserve.listen(0,'127.0.0.1');await once(reserve,'listening');
const port=reserve.address().port;await new Promise(r=>reserve.close(r));
const origin='http://127.0.0.1:'+port;
const env={...process.env,HOST:'127.0.0.1',PORT:String(port),APP_ORIGIN:origin,DATA_DIR:data};
delete env.OWNER_CODE;delete env.TRUST_LOCAL_PROXY;delete env.TRUST_PRIVATE_GATEWAY;
const child=spawn(process.execPath,['server.mjs'],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='',checks=0;child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
const closed=once(child,'close');
function check(condition,message){assert.ok(condition,message);checks++;}
async function request(action,body={},cookie='',method='POST',expected=200,source=origin){
 const url=origin+'/api/platform'+(method==='GET'&&action?'?'+new URLSearchParams({action,...body}):'');
 const res=await fetch(url,{method,headers:{'Content-Type':'application/json','X-Arena-Version':'2',...(cookie?{cookie}:{}),...(source?{Origin:source}:{})},...(method==='POST'?{body:JSON.stringify({action,...body})}:{})});
 const json=await res.json();check(res.status===expected,action+' status '+res.status+' (expected '+expected+')');
 return {json,cookie:res.headers.get('set-cookie')?.split(';')[0],headers:res.headers};
}
try{
 let ready=false;for(let i=0;i<100;i++){
  if(child.exitCode!==null)throw Error('Test server exited before readiness: '+output);
  try{ready=(await fetch(origin+'/healthz')).ok;}catch{}
  if(ready)break;await delay(75);
 }
 check(ready,'test server ready');
 check((await request('',{},'','GET')).json.user===null,'anonymous bootstrap');
 await request('admin',{},'','GET',200); // anonymous bootstrap never returns a member list
 await request('new_run',{scenario:'base'},'','POST',401);
 const code=(await readFile(resolve(data,'owner-code.txt'),'utf8')).trim();check(code.length>=24,'fresh random owner code');
 await request('login',{name:'负责人',code,access:'owner'},'','POST',403,'https://foreign.example');
 const ownerLogin=await request('login',{name:'负责人',code,access:'owner'}),owner=ownerLogin.cookie;
 check(!!owner&&ownerLogin.headers.get('set-cookie').includes('HttpOnly'),'owner session HttpOnly');
 const quick=(await request('create_owner_quick',{},owner)).json.code;
 check(quick.replaceAll('-','').length===12,'12-character owner quick code');
 await request('create_owner_quick',{},owner,'POST',409);
 await request('login',{name:'负责人',code:quick,access:'owner'});
 const member=(await request('create_member',{name:'回归测试成员'},owner)).json;
 check(!!member.id&&member.code.length>=12,'independent member credential');
 const login=await request('login',{name:member.name,code:member.code}),cookie=login.cookie;
 check((await request('',{},cookie,'GET')).json.user.role==='member','member identity');
 await request('admin',{},cookie,'GET',403);
 await request('create_member',{name:'不应创建'},cookie,'POST',403);
 await request('login',{name:member.name,code:member.code,access:'owner'},'','POST',401);
 for(const difficulty of [0,11,1.5])await request('new_run',{scenario:'base',difficulty},cookie,'POST',400);
 let run=(await request('new_run',{scenario:'base',difficulty:3,mode:'rapid'},cookie)).json.run;
 check(run.state.difficulty===3&&run.state.modelVersion===2,'difficulty persisted');
 const command='setup-regression';const submitted={id:run.id,version:run.version,command,decision:run.draft};
 run=(await request('settle',submitted,cookie)).json.run;
 const duplicate=(await request('settle',submitted,cookie)).json.run;
 check(duplicate.version===run.version,'repeated command does not settle twice');
 await request('settle',{...submitted,command:'stale-version'},cookie,'POST',409);
 const activity=(await request('begin_activity',{runId:run.id},cookie)).json;
 await request('heartbeat',{id:activity.id,sequence:1,visible:true,acted:true},cookie);
 await request('heartbeat',{id:activity.id,sequence:1,visible:true,acted:true},cookie,'POST',409);
 const nextActivity=(await request('begin_activity',{runId:run.id,takeover:true},cookie)).json;
 await request('heartbeat',{id:activity.id,sequence:2,visible:true},cookie,'POST',409);
 await request('heartbeat',{id:nextActivity.id,sequence:1,visible:true},cookie);
 for(let q=1;q<=8;q++){
  const world=Sim.replay(run.state),decision=Sim.heuristic(world.companies[0],world,Sim.market(world.scenario,world.seed,q),q);
  check(!Sim.validate(world.companies[0],decision),'heuristic valid Q'+q);
  run=(await request('settle',{id:run.id,version:run.version,command:'quarter-'+q,decision},cookie)).json.run;
  check(run.quarter===q,'quarter persisted Q'+q);
 }
 check(run.completed===1,'full eight-quarter run complete');
 const replay=Sim.replay(run.state);
 check(replay.companies.length===25&&replay.history.length===8,'25 companies in replay');
 check(Math.abs(replay.companies[0].totalProfit-run.profit)<1e-6,'stored result equals deterministic replay');
 const own=(await request('run',{id:run.id},cookie,'GET')).json.run;check(own.quarter===8,'own run readable');
 const answers=CASES.toyota.questions.map(q=>q.correct);
 check((await request('case_quiz',{caseId:'toyota',answers},cookie)).json.score===100,'case quiz feedback');
 const admin=(await request('admin',{},owner,'GET')).json;
 const tracked=admin.members.find(m=>m.id===member.id);
 check(tracked?.completed_runs===1&&tracked?.live?.quarter===8,'team sees member progress');
 check(tracked.learning.some(x=>x.caseId==='toyota'&&x.score===100),'team sees case learning');
 check(tracked.active_seconds>=0&&tracked.online_seconds>=tracked.active_seconds,'time fields valid');
 const detail=(await request('member',{id:member.id},owner,'GET')).json;
 check(detail.runs.length===1&&detail.activity.length===2,'owner detail and activity retained');
 const other=(await request('create_member',{name:'隔离测试成员'},owner)).json;
 const otherCookie=(await request('login',{name:other.name,code:other.code})).cookie;
 await request('run',{id:run.id},otherCookie,'GET',404);
 const page=await fetch(origin);check(page.ok&&(await page.text()).includes('root'),'static application served');
 check((await fetch(origin+'/data/owner-code.txt')).status===404,'private data not publicly served');
 await request('disable_member',{id:member.id,disabled:true},owner);
 check((await request('',{},cookie,'GET')).json.user===null,'disabled session no longer authenticated');
 console.log(JSON.stringify({apiChecks:checks,eightQuarters:true,companies:25,permissions:true,isolatedTestData:true}));
}finally{
 child.kill('SIGTERM');await closed;
 // Remove only the fresh directory created by mkdtemp directly under the OS temp root.
 if(dirname(resolve(data))!==temporaryRoot||!basename(data).startsWith('poju-api-'))throw Error('Unsafe test cleanup target');
 await rm(data,{recursive:true,force:true});
}
