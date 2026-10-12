import fs from 'node:fs';
const src=fs.readFileSync('C:/Users/Zllyh/.codex/visualizations/2026/10/12/01a12e79-9431-79d0-bd96-b6ef39e4bfbc/enterprise-training.html','utf8');
let engine=src.split('/* ENGINE-BEGIN */')[1].split('/* ENGINE-END */')[0];
engine=engine.replace("const names = ['你的公司','薄利快跑','品质经营','低碳稳健'];",`const names=['你的公司',...PERSONAS.map(p=>p.name)];`);
engine=engine.replace('Math.round(base*(scenario', 'Math.round(base*6.25*(scenario');
engine=engine.replace('companies:[0,1,2,3].map(blank)','companies:Array.from({length:25},(_,i)=>blank(i))');
engine=engine.replace('for(let i=1;i<4;i++){const d=defaultSetup();d.rd=i===2?35:i===1?5:20;setup(w.companies[i],d);}',`for(let i=1;i<25;i++){const p=PERSONAS[i-1],d=defaultSetup();d.rd=p.rd*1.5;if(p.type==='精益经营'){d.lines=1;d.workers=8;d.raw=1100;}if(p.type==='扩张进攻'){d.lines=3;d.workers=24;d.raw=1100;d.rd=0;}setup(w.companies[i],d);}`);
engine=engine.replace('const weights=w.companies','const weights=w.companies');
engine=engine.replace('totalWeight=.9+sum(weights)','totalWeight=.9*w.companies.length/4+sum(weights)');
engine=engine.replace('/(.9+sum(priorWeights)+own)','/(.9*w.companies.length/4+sum(priorWeights)+own)');
const a=engine.indexOf('function heuristic(c,w,m,q){');const b=engine.indexOf('function newWorld(session)',a);
if(a<0||b<0)throw new Error('engine markers not found');
engine=engine.slice(0,a)+`function heuristic(c,w,m,q){
  const p=PERSONAS[Math.max(0,c.i-1)],remaining=8-q,cap=capacity(c);
  const others=w.companies.filter(x=>x.i!==c.i&&x.active);
  const prior=sum(others.map(x=>appeal(x,x.last?.decision||defaultDecision())));
  let best=null,bestUtility=-Infinity;
  const basePrice=1200+p.bias+(w.scenario==='raw'?(q-1)*35:0)+(w.scenario==='war'?-(q-1)*25:0);
  for(const delta of [-180,-100,-30,40,120,200]){
    const d=defaultDecision();d.price=Math.max(650,Math.min(2300,Math.round(basePrice+delta)));
    d.marketing=p.marketing;d.rd=p.rd;d.green=remaining?p.green:0;d.hire=0;d.lines=0;d.finance=0;
    const own=appeal(c,d),expected=m.forecast*own/(prior+.9*w.companies.length/4+own);
    const target=Math.min(cap,Math.round(expected*p.stock));
    d.produce=Math.max(0,target-c.fg);d.urgent=Math.max(0,d.produce-c.raw);
    const nextForecast=q<8?market(w.scenario,w.seed,q+1).forecast:m.forecast;
    const nextTarget=Math.min(cap,Math.round(expected*nextForecast/m.forecast));
    d.order=q<8?Math.max(0,nextTarget-(c.raw+d.urgent-d.produce)):0;
    if(p.type==='扩张进攻'&&q<5&&expected>cap*1.12&&c.cash>290){d.lines=1;d.hire=8;}
    d.carbon=Math.ceil(Math.max(0,d.produce*c.intensity-c.carbonFree-400-c.carbonPaid));
    const pre=productionPlan(c,d,m),normal=Math.min(credit(c),Math.max(0,p.buffer-pre.cashBeforeInterest));
    if(pre.cashBeforeInterest<p.buffer)d.finance=Math.floor(normal*10)/10;
    else if(pre.cashBeforeInterest>p.buffer+120&&debt(c)>0)d.finance=-Math.floor(Math.min(debt(c),pre.cashBeforeInterest-p.buffer-80)*10)/10;
    const sold=Math.min(expected,c.fg+pre.qty),revenue=sold*d.price/10000;
    const unit=(c.fgValue+pre.qty*pre.rawAvg+pre.costs.processing+pre.carbonConsumed+pre.costs.topup)/Math.max(1,c.fg+pre.qty);
    const fixed=pre.costs.wages+pre.costs.people+d.marketing+d.rd+d.green+10+c.equipment*.05+(debt(c)+Math.max(0,d.finance))*.02;
    const predicted=revenue-sold*(unit+.004)-fixed;
    const emergency=Math.max(0,-pre.cashBeforeInterest-Math.max(0,d.finance));
    const excess=Math.max(0,c.fg+pre.qty-expected);
    const utility=predicted-emergency*.3-excess*unit*.12+(p.type==='品质溢价'?remaining*d.rd*.12:0)+(p.type==='低碳领先'?remaining*d.green*.16:0);
    if(utility>bestUtility){bestUtility=utility;best=d;}
  }
  return best;
}
`+engine.slice(b);
const personas=`export const PERSONAS=[
 {name:'砺锋制造',type:'成本领先',bias:-120,marketing:5,rd:2,green:4,stock:1.02,buffer:65},
 {name:'星云工坊',type:'品质溢价',bias:170,marketing:14,rd:22,green:8,stock:.95,buffer:90},
 {name:'青禾实业',type:'低碳领先',bias:40,marketing:10,rd:8,green:22,stock:.96,buffer:90},
 {name:'远航工业',type:'扩张进攻',bias:-40,marketing:13,rd:3,green:4,stock:1.12,buffer:40},
 {name:'衡川制造',type:'精益经营',bias:20,marketing:4,rd:3,green:6,stock:.88,buffer:140},
 {name:'铂金科技',type:'品牌经营',bias:100,marketing:25,rd:12,green:5,stock:1.02,buffer:85},
 {name:'守正实业',type:'现金稳健',bias:70,marketing:8,rd:5,green:8,stock:.90,buffer:160},
 {name:'破浪制造',type:'价格进攻',bias:-180,marketing:9,rd:1,green:2,stock:1.06,buffer:45},
 {name:'迅驰工贸',type:'成本领先',bias:-90,marketing:7,rd:4,green:3,stock:.96,buffer:70},
 {name:'极光科技',type:'品质溢价',bias:210,marketing:18,rd:26,green:6,stock:.92,buffer:80},
 {name:'森源工业',type:'低碳领先',bias:70,marketing:12,rd:9,green:28,stock:.92,buffer:95},
 {name:'擎岳制造',type:'扩张进攻',bias:0,marketing:17,rd:5,green:7,stock:1.06,buffer:50},
 {name:'一苇工坊',type:'精益经营',bias:-20,marketing:6,rd:5,green:9,stock:.92,buffer:120},
 {name:'蓝图科技',type:'品牌经营',bias:130,marketing:28,rd:15,green:6,stock:.96,buffer:85},
 {name:'安澜实业',type:'现金稳健',bias:40,marketing:5,rd:4,green:10,stock:.86,buffer:180},
 {name:'飞驰工贸',type:'价格进攻',bias:-150,marketing:11,rd:2,green:3,stock:1.10,buffer:50},
 {name:'锐进制造',type:'成本领先',bias:-70,marketing:8,rd:5,green:6,stock:1,buffer:75},
 {name:'曜石科技',type:'品质溢价',bias:140,marketing:12,rd:18,green:10,stock:1.02,buffer:100},
 {name:'绿洲实业',type:'低碳领先',bias:10,marketing:8,rd:6,green:18,stock:1.04,buffer:100},
 {name:'鲲鹏工业',type:'扩张进攻',bias:-70,marketing:14,rd:4,green:5,stock:1.16,buffer:30},
 {name:'知行工坊',type:'精益经营',bias:50,marketing:7,rd:7,green:8,stock:.85,buffer:150},
 {name:'新象科技',type:'品牌经营',bias:80,marketing:21,rd:10,green:7,stock:1.08,buffer:100},
 {name:'长青实业',type:'现金稳健',bias:100,marketing:9,rd:6,green:12,stock:.94,buffer:150},
 {name:'凌云制造',type:'价格进攻',bias:-210,marketing:6,rd:3,green:2,stock:1.08,buffer:60}
];\n`;
fs.mkdirSync('lib',{recursive:true});
fs.writeFileSync('lib/engine.mjs',personas+engine+'\nexport {Sim};\n');
console.log('Imported a 25-company deterministic engine.');
