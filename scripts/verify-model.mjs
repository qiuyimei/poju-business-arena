import assert from 'node:assert/strict';
import {Sim,PERSONAS} from '../lib/engine.mjs';
import {insights} from '../lib/analysis.mjs';
let seasons=0,experiments=0;
for(const scenario of Object.keys(Sim.SCENARIOS))for(const seed of [0,7,41,123456789,4294967295]){
 const state={scenario,seed,setup:Sim.defaultSetup(),decisions:[]},w=Sim.replay(state);
 assert.equal(w.companies.length,25);assert.equal(PERSONAS.length,24);
 for(let q=1;q<=8;q++){
  const prior=Sim.clone(w),d=Sim.heuristic(w.companies[0],w,Sim.market(scenario,seed,q),q);
  assert.equal(Sim.validate(w.companies[0],d),'');
  for(const c of w.companies.slice(1).filter(c=>c.active))assert.equal(Sim.validate(c,Sim.heuristic(c,w,Sim.market(scenario,seed,q),q)),'');
  Sim.step(w,d);state.decisions.push(d);seasons++;
  const r=w.history[q-1].records[0],out=Object.values(r.costs).reduce((a,b)=>a+b,0)+r.interest+r.shipping+r.storage;
  assert.ok(Math.abs(r.cash-(r.openingCash+r.arCollected+d.finance+r.emergency+r.revenue*.6-out))<.001,'cash bridge');
  assert.ok(Math.abs(r.profit-(r.revenue-r.costOfSales-r.periodExpenses))<.001,'profit bridge');
  for(let i=0;i<25;i++)if(w.history[q-1].records[i])assert.ok(insights(w,q,i));
  const alt=Sim.clone(prior);Sim.step(alt,{...d,price:Math.min(2500,d.price+60)});
  for(let i=1;i<25;i++)assert.deepEqual(alt.history[q-1].records[i]?.decision,w.history[q-1].records[i]?.decision,'same rival decisions in controlled lab');
  experiments++;
 }
 assert.deepEqual(Sim.replay(state),w,'deterministic replay');
}
const edge=Sim.replay({scenario:'base',seed:42,setup:{lines:1,workers:8,raw:0,rd:0},decisions:[]});
for(let q=1;q<=8&&edge.companies[0].active;q++)Sim.step(edge,{price:600,produce:12000,urgent:12000,order:12000,hire:40,lines:3,marketing:100,rd:100,green:100,finance:0,carbon:0});
assert.equal(edge.companies[0].active,false,'stress run must terminate');
console.log(JSON.stringify({scenarios:4,seeds:5,seasons,experiments,companies:25,checks:'accounting, valid opponent plans, replay, fixed rival decisions, insolvency'}));
