import assert from 'node:assert/strict';
import {Sim} from '../lib/engine.mjs';
import {decisionGuide,quarterStandings,profitRanks} from '../lib/decision-guide.mjs';
import {quarterWorld} from '../lib/coach.mjs';
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
const session={modelVersion:2,difficulty:3,scenario:'base',seed:93,setup:Sim.defaultSetup(),decisions:[]};
const prior=Sim.newWorld(session),d={...Sim.defaultDecision(),hire:8,lines:1,finance:400};
const before=JSON.stringify(prior),w=Sim.step(Sim.clone(prior),d),r=w.history[0].records[0];
const guide=decisionGuide(prior,d,1,0,r,w.history[0]);
check(guide.length===11,'all 11 fields');check(new Set(guide.map(x=>x.key)).size===11,'unique fields');
for(const x of guide){check(['meaning','timing','cash','mechanism','result','next','experimentText'].every(k=>typeof x[k]==='string'&&x[k].length>15),x.key+' complete teaching');if(x.experiment){const actual=Sim.fixedQuarter(prior,w.history[0],0,{...d,[x.key]:x.experiment.value});check(Math.abs(x.experiment.profitChange-(actual.profit-r.profit))<1e-8,x.key+' exact profit experiment');check(Math.abs(x.experiment.cashChange-(actual.cash-r.cash))<1e-8,x.key+' exact cash experiment');}}
check(JSON.stringify(prior)===before,'guide and experiments never mutate formal state');
check(r.produced<=2000,'new line and staff unavailable this quarter');check(r.wages===(16+8)*.8,'new staff wage immediately expensed');check(r.costs.people===8*.9,'recruitment cost');check(r.depreciation===360*.05,'new line no current depreciation');check(r.intensity===.3&&r.nextIntensity<.3,'green affects next quarter only');check(r.raw===1800-r.produced+d.order,'ordinary order added after production');
check(guide.find(x=>x.key==='lines').cash.includes('不是本季一次性费用'),'equipment capital vs expense');check(guide.find(x=>x.key==='order').cash.includes('不直接等于本季利润减少额'),'normal orders not immediate expense');check(guide.find(x=>x.key==='hire').comparisonScope.includes('不包含下季'),'capacity experiment limited horizon');
const draft1=decisionGuide(prior,d,1),draft2=decisionGuide({...prior,seed:441},d,1);assert.deepEqual(draft1,draft2);checks++;check(draft1.every(x=>!x.experiment),'no actual experiment in draft');
const zero={...d,produce:0,urgent:0,order:0,carbon:0,hire:0,lines:0,marketing:0,rd:0,green:0,finance:0};const zeroWorld=Sim.step(Sim.clone(prior),zero);check(decisionGuide(prior,zero,1,0,zeroWorld.history[0].records[0],zeroWorld.history[0]).every(x=>!JSON.stringify(x).includes('NaN')),'zero-sales and zero-investment explanations');
for(let q=2;q<=8;q++){const c=w.companies[0],m=Sim.market(w.scenario,w.seed,q);Sim.step(w,Sim.heuristic(c,w,m,q));}
const opening8=quarterWorld(w,7),endGuide=decisionGuide(opening8,w.history[7].records[0].decision,8,0,w.history[7].records[0],w.history[7]);for(const key of ['order','lines','hire','green'])check(endGuide.find(x=>x.key===key).result.includes('后续经营季度'),key+' final-quarter timing');
const opponent=decisionGuide(prior,w.history[0].records[2].decision,1,2,w.history[0].records[2],w.history[0]);check(opponent.length===11,'opponent complete breakdown');
const legacy=Sim.replay({...session,modelVersion:1,decisions:[Sim.defaultDecision()]});const lg=decisionGuide(quarterWorld(legacy,0),legacy.history[0].records[0].decision,1,0,legacy.history[0].records[0],legacy.history[0]);check(lg.length===11&&lg.every(x=>Number.isFinite(x.value)),'legacy history readable');
const table=quarterStandings(w,1,quarterWorld(w,1));check(table.length===25,'full quarter standings');check(table[0].profit===Math.max(...w.history[0].records.map(x=>x?.profit??-Infinity)),'quarter leader is profit leader');check(table.every(x=>x.totalProfit===quarterWorld(w,1).companies[x.i].totalProfit),'cumulative numbers stop at selected quarter');
const ranks=profitRanks([{i:0,profit:10},{i:1,profit:10},{i:2,profit:5},{i:3}], 'profit');check(ranks.get(0)===1&&ranks.get(1)===1&&ranks.get(2)===3&&!ranks.has(3),'ties and missing records');
const ended=[{i:0,totalProfit:100,profit:20,active:false},{i:1,totalProfit:10,profit:10,active:true}];check(profitRanks(ended,'profit').get(0)===1,'current quarter uses profit even at termination');check(profitRanks(ended,'totalProfit',true).get(1)===1,'cumulative retains original termination rule');check(profitRanks([{i:0,totalProfit:10,active:false},{i:1,totalProfit:10,active:true}],'totalProfit',true).get(0)===2,'different status is not a cumulative tie');
const missing=Sim.clone(w);missing.history[1].records[2]=null;const mr=quarterStandings(missing,2,quarterWorld(w,2)).find(x=>x.i===2);check(mr.rank===null&&mr.profit===undefined,'no stale last-quarter result for inactive company');
for(let q=2;q<=8;q++){const current=quarterStandings(w,q,quarterWorld(w,q)),prev=quarterStandings(w,q-1,quarterWorld(w,q-1));for(const x of current.filter(x=>x.rank!=null&&x.previousRank!=null))check(x.change===prev.find(p=>p.i===x.i).rank-x.rank,'rank movement Q'+q);}
console.log(JSON.stringify({checks,fields:11,companies:25,legacy:true,quarterTiming:true,exactSingleFieldExperiments:true,forecastIsolation:true}));
