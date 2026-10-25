
import { env } from './runtime.mjs';
import { Sim } from '../lib/engine.mjs';
import {CASES,gradeCase} from '../lib/cases.mjs';
export const dynamic='force-dynamic';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const db=()=>env.DB;
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),v=>v.toString(16).padStart(2,'0')).join('');
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
const now=()=>Math.floor(Date.now()/1000);
const cookie=(req,value,age)=>`arena_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
const readCookie=req=>req.headers.get('cookie')?.match(/(?:^|;\s*)arena_session=([a-f0-9]{48})/)?.[1];
async function identity(req){const t=readCookie(req);if(!t)return null;return db().prepare('SELECT m.* FROM auth_sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=? AND s.expires_at>? AND m.disabled=0').bind(await hash(t),now()).first();}
const requireOwner=u=>{if(u.role!=='owner')throw Object.assign(new Error('此操作仅限负责人。'),{status:403});};
const currentClient=(req,r=null)=>{if((!r||JSON.parse(r.state).modelVersion===2)&&req.headers.get('x-arena-version')!=='2')throw Object.assign(new Error('训练场已升级到 2.0，请刷新网页后继续新版本实战。'),{status:409});};
async function setting(key,fallback){const r=await db().prepare('SELECT value FROM settings WHERE key=?').bind(key).first();return r?JSON.parse(r.value):fallback;}
async function audit(memberId,runId,kind,detail){await db().prepare('INSERT INTO events(id,member_id,run_id,kind,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),memberId,runId||null,kind,JSON.stringify(detail),now()).run();}
const parseRun=r=>({...r,state:JSON.parse(r.state),draft:JSON.parse(r.draft)});
async function getRun(u,id){const r=await db().prepare('SELECT * FROM runs WHERE id=? AND member_id=?').bind(id,u.id).first();if(!r)throw Object.assign(new Error('训练记录不存在。'),{status:404});return r;}
function rank(w){return [...w.companies].sort((a,b)=>(Number(b.active)-Number(a.active))||(b.totalProfit-a.totalProfit));}
async function settle(u,r,decision,command,automatic=false){
 if(r.last_command===command)return parseRun(r);
 const state=JSON.parse(r.state),w=Sim.replay(state);
 if(!state.setup){const msg=Sim.validateSetup(decision);if(msg)throw new Error(msg);state.setup=decision;}
 else{const msg=Sim.validate(w.companies[0],decision);if(msg)throw new Error(msg);Sim.step(w,decision);state.decisions.push(decision);}
 const next=Sim.replay(state),mine=next.companies[0],complete=next.q>=8||!mine.active;
 state.playerSnapshot=mine;
 const draft=state.setup?(!complete?Sim.heuristic(mine,next,Sim.market(state.scenario,state.seed,next.q+1),next.q+1):decision):Sim.defaultSetup();
 const result=await db().prepare('UPDATE runs SET state=?,draft=?,version=version+1,quarter=?,completed=?,score=?,profit=?,rank=?,deadline=?,last_command=?,updated_at=? WHERE id=? AND member_id=? AND version=?').bind(JSON.stringify(state),JSON.stringify(draft),next.q,complete?1:0,mine.last?.score||0,mine.totalProfit,rank(next).findIndex(x=>x.i===0)+1,r.mode==='timed'&&!complete?now()+1800:null,command,now(),r.id,u.id,r.version).run();
 if(!result.meta.changes){const latest=await getRun(u,r.id);if(latest.last_command===command)return parseRun(latest);throw Object.assign(new Error('这一季已被另一个窗口更新，请刷新。'),{status:409});}
 await audit(u.id,r.id,automatic?'timeout':'settle',{quarter:next.q,profit:mine.last?.profit||0,decision});
 return parseRun(await getRun(u,r.id));
}
async function syncExpired(u,r){if(r.mode==='timed'&&r.deadline&&r.deadline<=now()&&!r.completed){try{return await settle(u,r,JSON.parse(r.draft),'timeout-'+r.id+'-'+r.version,true);}catch{}}return parseRun(r);}
async function summary(u){
 const stats=await db().prepare('SELECT COALESCE(SUM(active_seconds),0) active_seconds, COALESCE(SUM(online_seconds),0) online_seconds FROM activity WHERE member_id=?').bind(u.id).first();
 const records=(await db().prepare("SELECT id,scenario,mode,version,quarter,completed,profit,score,rank,created_at,updated_at,json_extract(state,'$.difficulty') difficulty,json_extract(state,'$.caseId') caseId FROM runs WHERE member_id=? ORDER BY updated_at DESC LIMIT 100").bind(u.id).all()).results;
 const learning=(await db().prepare("SELECT e.detail,e.created_at FROM events e WHERE e.member_id=? AND e.kind='case_quiz' AND NOT EXISTS (SELECT 1 FROM events newer WHERE newer.member_id=e.member_id AND newer.kind='case_quiz' AND json_extract(newer.detail,'$.caseId')=json_extract(e.detail,'$.caseId') AND (newer.created_at>e.created_at OR (newer.created_at=e.created_at AND newer.rowid>e.rowid))) ORDER BY e.created_at DESC").bind(u.id).all()).results;
 const caseProgress=[];for(const e of learning){const d=JSON.parse(e.detail);if(!caseProgress.some(x=>x.caseId===d.caseId))caseProgress.push({...d,updated_at:e.created_at});}
 return {user:{id:u.id,name:u.name,role:u.role},stats,runs:records,caseProgress,requirements:await setting('requirements',{minutes:120,runs:3}),notice:await setting('notice','先完成一局八季，再用策略实验室检验你的改进。')};
}
export async function GET(req){try{
 const u=await identity(req);if(!u)return json({user:null});const url=new URL(req.url),action=url.searchParams.get('action');
 if(action==='run'){const r=await getRun(u,url.searchParams.get('id'));currentClient(req,r);return json({run:await syncExpired(u,r)});}
 if(action==='admin'){
  requireOwner(u);
  const members=(await db().prepare(`SELECT m.id,m.name,m.role,m.disabled,m.created_at,m.lease_seen,
   COALESCE((SELECT SUM(a.active_seconds) FROM activity a WHERE a.member_id=m.id),0) active_seconds,
   COALESCE((SELECT SUM(a.online_seconds) FROM activity a WHERE a.member_id=m.id),0) online_seconds,
   (SELECT COUNT(*) FROM runs r WHERE r.member_id=m.id AND r.completed=1 AND r.quarter=8) completed_runs,
   (SELECT COUNT(*) FROM runs r WHERE r.member_id=m.id) total_runs,
   (SELECT MAX(r.profit) FROM runs r WHERE r.member_id=m.id AND r.quarter=8) best_profit,
   (SELECT MIN(r.rank) FROM runs r WHERE r.member_id=m.id AND r.quarter=8) best_rank,
   (SELECT r.quarter FROM runs r WHERE r.member_id=m.id ORDER BY r.updated_at DESC LIMIT 1) current_quarter
   FROM members m ORDER BY m.created_at`).all()).results;
  const events=(await db().prepare('SELECT e.*,m.name FROM events e JOIN members m ON e.member_id=m.id ORDER BY e.created_at DESC LIMIT 100').all()).results;
  const latest=(await db().prepare('SELECT r.* FROM runs r WHERE r.id=(SELECT x.id FROM runs x WHERE x.member_id=r.member_id ORDER BY x.updated_at DESC,x.created_at DESC LIMIT 1)').all()).results;
  const learning=(await db().prepare("SELECT e.member_id,e.detail,e.created_at FROM events e WHERE e.kind='case_quiz' AND NOT EXISTS (SELECT 1 FROM events newer WHERE newer.member_id=e.member_id AND newer.kind='case_quiz' AND json_extract(newer.detail,'$.caseId')=json_extract(e.detail,'$.caseId') AND (newer.created_at>e.created_at OR (newer.created_at=e.created_at AND newer.rowid>e.rowid))) ORDER BY e.created_at DESC").all()).results;
  for(const member of members){member.learning=[];for(const e of learning.filter(e=>e.member_id===member.id)){const d=JSON.parse(e.detail);if(!member.learning.some(x=>x.caseId===d.caseId))member.learning.push({...d,updated_at:e.created_at});}const r=latest.find(r=>r.member_id===member.id);if(r){const state=JSON.parse(r.state);member.live={id:r.id,quarter:r.quarter,completed:r.completed,updated_at:r.updated_at,draft:JSON.parse(r.draft),player:state.playerSnapshot||Sim.replay(state).companies[0],difficulty:state.difficulty||null,modelVersion:state.modelVersion||1,caseId:state.caseId||null};}}
  return json({members,events,requirements:await setting('requirements',{minutes:120,runs:3}),notice:await setting('notice',''),quickLogin:!!(await setting('owner_quick_hash',null))});
 }
 if(action==='member'){
  requireOwner(u);const id=url.searchParams.get('id');
  const runs=(await db().prepare('SELECT * FROM runs WHERE member_id=? ORDER BY updated_at DESC LIMIT 20').bind(id).all()).results.map(parseRun);
  const activity=(await db().prepare('SELECT created_at,last_seen,active_seconds,online_seconds,run_id FROM activity WHERE member_id=? ORDER BY created_at DESC LIMIT 30').bind(id).all()).results;
  return json({runs,activity});
 }
 return json(await summary(u));
}catch(e){return json({error:e.status?e.message:'读取失败，请稍后重试。'},e.status||500);}}
export async function POST(req){try{
 const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)return json({error:'请求来源不匹配。'},403);
 const raw=await req.text();if(raw.length>32000)return json({error:'请求过大。'},413);const body=JSON.parse(raw),action=body.action;
 if(action==='login'){
  const code=String(body.code||'').trim(),name=String(body.name||'').trim();if(code.length<12||code.length>100||!name||name.length>30)return json({error:'请填写姓名和完整成员码。'},400);
  const ipHash=await hash((req.headers.get('cf-connecting-ip')||'local')+String(env.OWNER_CODE));
  const fails=await db().prepare("SELECT COUNT(*) n FROM events WHERE member_id='anonymous' AND kind='login_fail' AND detail=? AND created_at>?").bind(JSON.stringify(ipHash),now()-600).first();
  if(fails.n>=12)return json({error:'尝试次数过多，请 10 分钟后再试。'},429);
  const ch=await hash(code);let member;
  const quickHash=await setting('owner_quick_hash',null),quick=quickHash&&await hash(code.replace(/[-\s]/g,'').toUpperCase())===quickHash;
  if((env.OWNER_CODE&&ch===await hash(env.OWNER_CODE))||quick){
   await db().prepare("INSERT OR IGNORE INTO members(id,name,role,code_hash,disabled,created_at,lease_seen) VALUES('owner',?,'owner',?,0,?,0)").bind(name,ch,now()).run();
   member=await db().prepare("SELECT * FROM members WHERE id='owner'").first();
  }else member=await db().prepare('SELECT * FROM members WHERE code_hash=? AND name=? AND disabled=0').bind(ch,name).first();
  if(!member||(body.access==='owner'&&member.role!=='owner')){await audit('anonymous',null,'login_fail',ipHash);return json({error:body.access==='owner'?'负责人登录码不正确；成员码不能进入负责人后台。':'姓名或成员码不正确。'},401);}
  const t=token();await db().prepare('INSERT INTO auth_sessions(token_hash,member_id,expires_at) VALUES(?,?,?)').bind(await hash(t),member.id,now()+7*86400).run();
  await audit(member.id,null,'login',{});return json({ok:true},200,{'Set-Cookie':cookie(req,t,7*86400)});
 }
 const u=await identity(req);if(!u)return json({error:'请先登录。'},401);
 if(action==='case_quiz'){
  if(typeof body.caseId!=='string'||!Object.hasOwn(CASES,body.caseId))throw new Error('请选择有效的企业案例。');
  const result=gradeCase(body.caseId,body.answers);await audit(u.id,null,'case_quiz',{caseId:result.caseId,score:result.score,correct:result.correct,total:result.total,answers:body.answers});return json(result);
 }
 if(action==='create_owner_quick'){
  requireOwner(u);if(await setting('owner_quick_hash',null))return json({error:'快捷码已经生成。原负责人码仍可登录。'},409);
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(12)),code=Array.from(bytes,x=>alphabet[x%alphabet.length]).join('');
  await db().prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind('owner_quick_hash',JSON.stringify(await hash(code))).run();
  await audit(u.id,null,'owner_quick_created',{});return json({code:code.match(/.{4}/g).join('-')});
 }
 if(action==='logout'){const t=readCookie(req);if(t)await db().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await hash(t)).run();return json({ok:true},200,{'Set-Cookie':cookie(req,'',0)});}
 if(action==='create_member'){
  requireOwner(u);const name=String(body.name||'').trim();if(!name||name.length>30)throw new Error('姓名应为 1–30 个字。');
  const code=token(),id=crypto.randomUUID();await db().prepare("INSERT INTO members(id,name,role,code_hash,disabled,created_at,lease_seen) VALUES(?,?,'member',?,0,?,0)").bind(id,name,await hash(code),now()).run();await audit(u.id,null,'create_member',{name});return json({id,name,code});
 }
 if(action==='reset_code'){
  requireOwner(u);if(body.id==='owner')throw new Error('负责人码不能在这里重置。');const code=token();
  await db().batch([db().prepare('UPDATE members SET code_hash=? WHERE id=?').bind(await hash(code),body.id),db().prepare('DELETE FROM auth_sessions WHERE member_id=?').bind(body.id)]);return json({code});
 }
 if(action==='disable_member'){requireOwner(u);if(body.id==='owner')throw new Error('不能停用负责人。');await db().prepare('UPDATE members SET disabled=? WHERE id=?').bind(body.disabled?1:0,body.id).run();return json({ok:true});}
 if(action==='requirements'){
  requireOwner(u);const minutes=Number(body.minutes),runs=Number(body.runs);if(!Number.isInteger(minutes)||minutes<1||minutes>10000||!Number.isInteger(runs)||runs<1||runs>100)throw new Error('请检查训练目标。');
  await db().prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('requirements',JSON.stringify({minutes,runs})).run();
  const notice=String(body.notice||'').slice(0,300);await db().prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('notice',JSON.stringify(notice)).run();return json({ok:true});
 }
 if(action==='new_run'){
  currentClient(req);
  const n=await db().prepare('SELECT COUNT(*) n FROM runs WHERE member_id=? AND created_at>?').bind(u.id,now()-86400).first();if(n.n>=100)throw new Error('今天已创建 100 局，请先复盘已有训练。');
  if(!Sim.SCENARIOS[body.scenario])throw new Error('请选择训练情景。');if(body.caseId&&(typeof body.caseId!=='string'||!Object.hasOwn(CASES,body.caseId)))throw new Error('请选择有效的企业案例。');const scenario=body.caseId?CASES[body.caseId].scenario:body.scenario,mode=body.mode==='timed'?'timed':'rapid',id=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0];
  const difficulty=body.difficulty===undefined?5:Number(body.difficulty);if(!Number.isInteger(difficulty)||difficulty<1||difficulty>10)throw new Error('请选择 1–10 级难度。');
  const state={modelVersion:2,difficulty,caseId:body.caseId||null,scenario,seed,setup:null,decisions:[]};
  await db().prepare('INSERT INTO runs(id,member_id,scenario,mode,state,draft,version,quarter,completed,score,profit,created_at,updated_at) VALUES(?,?,?,?,?,?,0,0,0,0,0,?,?)').bind(id,u.id,scenario,mode,JSON.stringify(state),JSON.stringify(Sim.defaultSetup()),now(),now()).run();
  await audit(u.id,id,'new_run',{scenario,mode,caseId:body.caseId||null,difficulty});return json({run:parseRun(await getRun(u,id))});
 }
 if(action==='draft'){
  const r=await getRun(u,body.id);currentClient(req,r);if(r.completed)throw new Error('本局已结束。');if(r.deadline&&r.deadline<=now())throw Object.assign(new Error('本季时间已到，请刷新查看结算。'),{status:409});const s=JSON.parse(r.state),w=Sim.replay(s),msg=s.setup?Sim.validate(w.companies[0],body.draft):Sim.validateSetup(body.draft);if(msg)throw new Error(msg);
  const result=await db().prepare('UPDATE runs SET draft=? WHERE id=? AND member_id=? AND version=?').bind(JSON.stringify(body.draft),r.id,u.id,body.version).run();if(!result.meta.changes)throw Object.assign(new Error('这一季已更新，请刷新。'),{status:409});return json({ok:true});
 }
 if(action==='settle'){
  const r=await getRun(u,body.id);currentClient(req,r);if(r.last_command===body.command)return json({run:parseRun(r)});if(r.completed)throw new Error('本局已结束。');
  if(r.deadline&&r.deadline<=now())return json({run:await syncExpired(u,r)});
  if(r.version!==body.version&&r.last_command!==body.command)throw Object.assign(new Error('这一季已更新，请刷新后再操作。'),{status:409});
  if(typeof body.command!=='string'||body.command.length>80)throw new Error('提交标识无效。');return json({run:await settle(u,r,body.decision,body.command)});
 }
 if(action==='lab'){
  const r=await getRun(u,body.id),s=JSON.parse(r.state),q=Number(body.quarter);if(!Number.isInteger(q)||q<1||q>s.decisions.length)throw new Error('只能检验已经结算的季度。');
  const original=Sim.replay(s),prior={...s,decisions:s.decisions.slice(0,q-1)},w=Sim.replay(prior);const result=Sim.fixedQuarter(w,original.history[q-1],0,body.decision);await audit(u.id,r.id,'lab',{quarter:q});return json({result});
 }
 if(action==='begin_activity'){
  const r=await getRun(u,body.runId);const id=crypto.randomUUID(),t=now();
  const update=await db().prepare('UPDATE members SET active_lease=?,lease_seen=? WHERE id=? AND (lease_seen<? OR active_lease IS NULL OR ?=1 OR active_lease=?)').bind(id,t,u.id,t-45,body.takeover?1:0,body.previousLease||'').run();
  if(!update.meta.changes)return json({error:'另一个窗口正在计时。关闭它，或点击接管计时。'},409);
  await db().prepare('INSERT INTO activity(id,member_id,run_id,created_at,last_seen,last_action,sequence,visible,active_seconds,online_seconds) VALUES(?,?,?,?,?,?,0,1,0,0)').bind(id,u.id,r.id,t,t,t).run();return json({id});
 }
 if(action==='heartbeat'){
  const t=now(),visible=body.visible?1:0,seq=Number(body.sequence);if(!Number.isInteger(seq)||seq<1||seq>1e9)throw new Error('计时序号无效。');
  const result=await db().prepare(`UPDATE activity SET
   active_seconds=active_seconds+CASE WHEN visible=1 AND ?=1 AND last_seen>=?-30 AND last_action>=?-120 THEN MIN(20,MAX(0,?-last_seen)) ELSE 0 END,
   online_seconds=online_seconds+CASE WHEN visible=1 AND ?=1 AND last_seen>=?-30 THEN MIN(20,MAX(0,?-last_seen)) ELSE 0 END,
   last_action=CASE WHEN ?=1 THEN ? ELSE last_action END,last_seen=?,visible=?,sequence=?
   WHERE id=? AND member_id=? AND sequence<? AND EXISTS(SELECT 1 FROM members WHERE id=? AND active_lease=?)`).bind(visible,t,t,t,visible,t,t,body.acted?1:0,t,t,visible,seq,body.id,u.id,seq,u.id,body.id).run();
  if(!result.meta.changes)return json({error:'计时窗口已变化，请接管或刷新。'},409);
  await db().prepare('UPDATE members SET lease_seen=? WHERE id=? AND active_lease=?').bind(t,u.id,body.id).run();return json({ok:true,serverTime:t});
 }
 return json({error:'未知操作。'},400);
}catch(e){const status=e.status||400;return json({error:status>=500?'服务暂时不可用，请稍后重试。':e.message||'请求失败。'},status);}}
