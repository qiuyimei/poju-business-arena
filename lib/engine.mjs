import {Sim as LegacySim} from './engine-v1.mjs';
export const PERSONAS=[
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
];

  const Sim = (() => {
    const CFG = {initial:650,lineCost:180,lineCap:1000,workerCap:125,wage:.8,hire:.9,processing:.018,shipping:.004,admin:10,depreciation:.05,storage:.01,receivable:.4,interest:.02,emergencyInterest:.04,freeCarbon:400,initialIntensity:.3,discount:.08};
    const SCENARIOS = {base:'基础对抗',war:'价格战',raw:'原料涨价',carbon:'碳价上行'};
    const names=['你的公司',...PERSONAS.map(p=>p.name)];
    const clone = x => JSON.parse(JSON.stringify(x));
    const round = (v,n=6) => Math.round(v*10**n)/10**n;
    const sum = a => a.reduce((x,y)=>x+y,0);
    function noise(seed,q){let t=(seed ^ Math.imul(q+19,2654435761))>>>0;t^=t<<13;t^=t>>>17;t^=t<<5;return (t>>>0)/4294967296;}
    function market(scenario,seed,q){
      const base=[9000,9600,10800,12000,11100,11700,12600,13800][Math.min(7,Math.max(0,q-1))];
      const forecast=Math.round(base*6.25*(scenario==='war'?.95:1));
      return {forecast,actual:Math.round(forecast*(.9+.2*noise(seed,q))),raw:.04*(scenario==='raw'?1+.12*(q-1):1+.015*(q-1)),carbon:.05*(scenario==='carbon'?1+.25*(q-1):1+.03*(q-1))};
    }
    function blank(i){return {i,name:names[i],cash:650,ar:0,raw:0,rawValue:0,fg:0,fgValue:0,lines:0,equipment:0,workers:0,normalDebt:0,emergencyDebt:0,quality:1,brand:0,intensity:.3,carbonFree:0,carbonPaid:0,carbonValue:0,penalty:0,totalSales:0,totalProfit:0,active:true,bankruptQ:null,last:null,marketingTail:[]};}
    function assets(c){return c.cash+c.ar+c.rawValue+c.fgValue+c.equipment+c.carbonValue;}
    function debt(c){return c.normalDebt+c.emergencyDebt;}
    function equity(c){return assets(c)-debt(c);}
    function capacity(c){return Math.min(c.lines*CFG.lineCap,c.workers*CFG.workerCap);}
    function credit(c){return Math.max(0,.8*Math.max(0,equity(c))-debt(c));}
    const defaultSetup=()=>({lines:2,workers:16,raw:1800,rd:20});
    const defaultDecision=()=>({price:1200,produce:1700,urgent:0,order:1800,hire:0,lines:0,marketing:12,rd:8,green:10,finance:30,carbon:120});
    function setup(c,d){
      const costs={equipment:d.lines*180,raw:d.raw*.04,people:d.workers*1.7,rd:d.rd};
      c.cash-=sum(Object.values(costs));c.lines=d.lines;c.equipment=costs.equipment;c.raw=d.raw;c.rawValue=costs.raw;c.workers=d.workers;c.quality+=.035*Math.sqrt(d.rd);c.totalProfit=-costs.people-d.rd;
      return costs;
    }
    function validateSetup(d){
      if(!Number.isInteger(d.lines)||d.lines<1||d.lines>3)return '生产线应为 1–3 条。';
      if(!Number.isInteger(d.workers)||d.workers<1||d.workers>48)return '员工应为 1–48 人。';
      if(!Number.isInteger(d.raw)||d.raw<0||d.raw>8000||!Number.isFinite(d.rd)||d.rd<0||d.rd>100)return '请检查原料和研发投入范围。';
      if(d.lines*180+d.raw*.04+d.workers*1.7+d.rd>650+1e-7)return '筹备支出超过 650 万元，请减少设备、原料或人员投入。';
      return '';
    }
    function validate(c,d){
      if(d.reason!==undefined&&(typeof d.reason!=='string'||d.reason.length>400))return '决策理由请填写不超过 400 字的文字。';
      const bounds={price:[600,2500],produce:[0,12000],urgent:[0,12000],order:[0,12000],hire:[0,40],lines:[0,3],marketing:[0,100],rd:[0,100],green:[0,100],finance:[-2000,2000],carbon:[0,6000]};
      for(const [k,[lo,hi]] of Object.entries(bounds))if(!Number.isFinite(d[k])||d[k]<lo||d[k]>hi)return '请检查所有决策的数值范围。';
      for(const k of ['produce','urgent','order','hire','lines','carbon'])if(!Number.isInteger(d[k]))return '数量和人数必须为整数。';
      if(d.finance>credit(c)+1e-7)return '借款超过当前信用上限 '+round(credit(c),2)+' 万元。';
      if(-d.finance>debt(c)+1e-7)return '还款超过现有负债。';
      return '';
    }
    function productionPlan(c,d,m){
      const qty=Math.max(0,Math.min(d.produce,capacity(c),c.raw+d.urgent));
      const rawAvg=(c.rawValue+d.urgent*m.raw*1.5)/Math.max(1,c.raw+d.urgent);
      const emissions=qty*c.intensity;
      const free=Math.min(c.carbonFree+400,emissions);
      const rest=emissions-free;
      const boughtValue=c.carbonValue+d.carbon*m.carbon;
      const boughtQty=c.carbonPaid+d.carbon;
      const carbonUsed=Math.min(rest,boughtQty);
      const carbonConsumed=carbonUsed*boughtValue/Math.max(1,boughtQty);
      const shortage=Math.max(0,rest-boughtQty);
      const topup=shortage*m.carbon*3;
      const costs={urgent:d.urgent*m.raw*1.5,order:d.order*m.raw,machine:d.lines*180,people:d.hire*.9,wages:(c.workers+d.hire)*.8,processing:qty*.018,marketing:d.marketing,rd:d.rd,green:d.green,carbon:d.carbon*m.carbon,topup,admin:10};
      const loan=Math.max(0,d.finance),repay=Math.max(0,-d.finance);
      const cashBeforeInterest=c.cash+c.ar+loan-repay-sum(Object.values(costs));
      return {qty,rawAvg,emissions,free,carbonUsed,carbonConsumed,shortage,costs,cashBeforeInterest};
    }
    function appeal(c,d){return (1200/d.price)**2.3*(1+.5*(c.quality+.035*Math.sqrt(d.rd)-1))*(1+.5*(c.brand*.82+.07*Math.sqrt(d.marketing)));}
    function prepare(c,d,m,q){
      const openingEquity=equity(c),openingCash=c.cash,openingAr=c.ar;
      const opening={lines:c.lines,workers:c.workers,raw:c.raw,fg:c.fg,quality:c.quality,brand:c.brand};
      const p=productionPlan(c,d,m),startingIntensity=c.intensity;
      let repayment=Math.max(0,-d.finance),repayEmergency=Math.min(c.emergencyDebt,repayment);
      c.emergencyDebt-=repayEmergency;c.normalDebt-=repayment-repayEmergency;c.normalDebt+=Math.max(0,d.finance);
      c.cash=p.cashBeforeInterest;c.ar=0;
      let freshEmergency=0;
      function fill(){let amt=0;if(c.cash<0){amt=-c.cash;freshEmergency+=amt;c.emergencyDebt+=amt;c.cash=0;}return amt;}
      fill();
      const interest=c.normalDebt*.02+c.emergencyDebt*.04;c.cash-=interest;fill();
      const rawCost=p.qty*p.rawAvg;c.raw=c.raw+d.urgent-p.qty;c.rawValue=Math.max(0,c.rawValue+d.urgent*m.raw*1.5-rawCost);
      const productionCost=rawCost+p.costs.processing+p.carbonConsumed+p.costs.topup;
      c.fg+=p.qty;c.fgValue+=productionCost;
      c.carbonFree=c.carbonFree+400-p.free;c.carbonPaid=c.carbonPaid+d.carbon-p.carbonUsed;c.carbonValue=Math.max(0,c.carbonValue+d.carbon*m.carbon-p.carbonConsumed);
      const depreciation=c.equipment*.05;c.equipment-=depreciation;
      c.quality+=.035*Math.sqrt(d.rd);c.brand=c.brand*.82+.07*Math.sqrt(d.marketing);
      if(d.urgent>0)c.penalty+=1.5;
      if(d.produce-p.qty>=10)c.penalty+=1;
      c.marketingTail.push(d.marketing);c.marketingTail=c.marketingTail.slice(-3);
      return {c,d,p,q,opening,openingEquity,openingCash,openingAr,interest,depreciation,rawCost,productionCost,startingIntensity,freshEmergency,fill};
    }
    function finish(r,sales,m){
      const {c,d,p}=r;
      sales=Math.min(c.fg,Math.max(0,Math.floor(sales)));
      const costOfSales=sales*c.fgValue/Math.max(1,c.fg);c.fg-=sales;c.fgValue=Math.max(0,c.fgValue-costOfSales);
      const revenue=sales*d.price/10000,shipping=sales*.004,storage=(c.rawValue+c.fgValue)*.01;
      c.cash+=revenue*.6-shipping-storage;c.ar=revenue*.4;r.freshEmergency+=r.fill();
      // A fresh emergency amount is penalized once per quarter, including interest and storage shortfalls.
      if(r.freshEmergency>1e-7)c.penalty+=Math.min(2.5,Math.ceil(r.freshEmergency/50)*.5);
      const periodExpenses=p.costs.wages+p.costs.people+d.marketing+d.rd+d.green+10+r.interest+r.depreciation+shipping+storage;
      const profit=revenue-costOfSales-periodExpenses;
      c.totalProfit+=profit;c.totalSales+=sales;
      // Prepaid normal materials, machines and trained workers become available for the next quarter.
      c.raw+=d.order;c.rawValue+=p.costs.order;c.lines+=d.lines;c.equipment+=p.costs.machine;c.workers+=d.hire;
      c.intensity=Math.max(.08,c.intensity*Math.exp(-d.green/80));
      const npv=(equity(c)+c.carbonFree*m.carbon)/(1+.08/4)**r.q-650;
      const out={q:r.q,opening:r.opening,allocatedDemand:Math.floor(arguments[1]),lines:c.lines,workers:c.workers,totalProfit:c.totalProfit,decision:clone(d),produced:p.qty,sales,revenue,costOfSales,profit,openingCash:r.openingCash,arCollected:r.openingAr,cash:c.cash,ar:c.ar,equity:equity(c),debt:debt(c),raw:c.raw,fg:c.fg,emissions:p.emissions,shortage:p.shortage,carbonBalance:c.carbonFree+c.carbonPaid,carbonValue:c.carbonValue,freeCarbon:c.carbonFree,npv,interest:r.interest,depreciation:r.depreciation,wages:p.costs.wages,shipping,storage,periodExpenses,emergency:r.freshEmergency,quality:c.quality,brand:c.brand,intensity:r.startingIntensity,nextIntensity:c.intensity,penalty:c.penalty,score:0,components:null,costs:p.costs};
      c.last=out;
      if(equity(c)<=0||debt(c)/Math.max(.00001,equity(c))>=3){c.active=false;c.bankruptQ=r.q;}
      // Double-entry invariant: every modeled profit/loss changes owners' equity by the same amount.
      if(Math.abs(equity(c)-r.openingEquity-profit)>.001)throw new Error('账务不平衡');
      return out;
    }
    function scores(w,q,m){
      const alive=w.companies.filter(c=>c.active),mx=key=>Math.max(0,...alive.map(key));
      const maxNPV=mx(c=>c.last?.npv||0),maxQuality=mx(c=>c.quality),maxBrand=mx(c=>c.brand),maxSales=mx(c=>c.totalSales);
      const minIntensity=Math.min(...alive.map(c=>c.last?.intensity||c.intensity));
      for(const c of w.companies){
        if(!c.last)continue;
        const ratio=debt(c)/Math.max(.00001,assets(c)),solvency=ratio<=.6?5:ratio<=.7?4:ratio<=.8?3:ratio<=.9?2:ratio<=1?1:0;
        const profitability=c.last.npv>0&&maxNPV>0?70*c.last.npv/maxNPV:0;
        const brandEligible=q<8||c.marketingTail.some(x=>x>0);
        const growth=(maxQuality?3*c.quality/maxQuality:0)+(maxBrand&&brandEligible?3*c.brand/maxBrand:0)+(maxSales?4*c.totalSales/maxSales:0);
        const team=Math.max(0,10-c.penalty),carbon=Number.isFinite(minIntensity)?5*minIntensity/c.last.intensity:0;
        c.last.components={profitability,solvency,growth,team,carbon};c.last.score=c.active?profitability+solvency+growth+team+carbon:0;
      }
    }
    function heuristic(c,w,m,q){
  if(w.modelVersion===2)return trainedPlan(c,w,{forecast:m.forecast,raw:m.raw,carbon:m.carbon},q,c.i===0?4:w.difficulty);
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

    function difficultySpec(level){
      const n=Math.max(1,Math.min(10,Number(level)||5));
      return {level:n,label:n<=2?'入门':n<=4?'进阶':n<=6?'熟练':n<=8?'强队':'极限',horizon:n>=8?3:n>=5?2:1,
        search:n<=2?5:n<=4?8:n<=6?11:15,forecastError:(10-n)*.035,passes:n>=9?3:n>=6?2:1,
        description:n<=2?'短视决策，预测误差较大，适合熟悉流程。':n<=4?'改善定价和采购，开始判断扩产回收。':n<=6?'同时比较价格、投入与扩产，规划后续季度现金。':n<=8?'滚动规划三季，依据公开销量调整竞争预期。':'多轮估计对手动作、滚动三季规划，兼顾价格、投资回收和现金风险。'};
    }
    function publicGuess(c,w,q,level){
      const p=PERSONAS[Math.max(0,c.i-1)];
      if(c.last){
        const d=clone(c.last.decision);
        if(level>=7&&q<8){
          // Only prior public results are used. No current player draft or realised demand.
          const stockout=c.last.allocatedDemand>c.last.sales+50;
          if(stockout)d.price=Math.min(2500,d.price+55);
          else if(c.last.fg>c.last.sales*.4)d.price=Math.max(600,d.price-45);
        }
        return d;
      }
      return {...defaultDecision(),price:Math.min(2500,Math.max(900,1450+level*85+p.bias*.5)),marketing:level>=5?6:p.marketing,rd:level>=5?4:p.rd};
    }
    function fitPlan(c,w,m,q,price,budget,expand,weightOthers,level){
      const p=PERSONAS[Math.max(0,c.i-1)],d={...defaultDecision(),price,marketing:budget.marketing,rd:budget.rd,green:q===8?0:budget.green,lines:expand,hire:expand*8,finance:0};
      const spec=difficultySpec(level),own=appeal(c,d);
      const perturb=(noise(w.seed^Math.imul(c.i+11,197933),q+43)-.5)*2*spec.forecastError;
      const demand=m.forecast*(1+perturb)*own/(weightOthers+own);
      const reserve=level>=7?1.02:Math.min(1.2,p.stock+(5-level)*.025);
      d.produce=Math.max(0,Math.min(capacity(c),Math.round(demand*reserve-c.fg)));
      d.urgent=Math.max(0,d.produce-c.raw);
      const nextForecast=q<8?market(w.scenario,w.seed,q+1).forecast:m.forecast;
      const nextCapacity=Math.min((c.lines+expand)*1000,(c.workers+d.hire)*125);
      const nextTarget=Math.min(nextCapacity,Math.round(demand*nextForecast/m.forecast*reserve));
      d.order=q<8?Math.max(0,nextTarget-(c.raw+d.urgent-d.produce)):0;
      d.carbon=Math.ceil(Math.max(0,d.produce*c.intensity-c.carbonFree-400-c.carbonPaid));
      const pre=productionPlan(c,d,m),buffer=level>=6?45+(c.i%4)*8:p.buffer;
      if(pre.cashBeforeInterest<buffer)d.finance=Math.floor(Math.min(credit(c),Math.max(0,buffer-pre.cashBeforeInterest))*10)/10;
      else if(pre.cashBeforeInterest>buffer+70&&debt(c)>0)d.finance=-Math.floor(Math.min(debt(c),pre.cashBeforeInterest-buffer-35)*10)/10;
      return {d,demand};
    }
    function trainedPlan(c,w,m,q,level,beliefs=null){
      if(level===1)return LegacySim.heuristic(c,w,m,q);
      const spec=difficultySpec(level),p=PERSONAS[Math.max(0,c.i-1)];
      const weights=.9*w.companies.length/4+sum(w.companies.filter(x=>x.i!==c.i&&x.active).map(x=>appeal(x,beliefs?.[x.i]||publicGuess(x,w,q,level))));
      const budgets=level<=3?[{marketing:p.marketing,rd:p.rd,green:p.green}]:[
        {marketing:0,rd:0,green:0},{marketing:5,rd:3,green:4},
        {marketing:p.type==='品牌经营'?18:8,rd:p.type==='品质溢价'?16:5,green:p.type==='低碳领先'?15:6},
        {marketing:level>=7?2:12,rd:level>=7?1:8,green:0}
      ];
      let best=null,bestValue=-Infinity;
      const candidatePrices=Array.from({length:spec.search},(_,i)=>Math.round(750+i*1750/(spec.search-1)));
      if(c.last)candidatePrices.push(c.last.decision.price,Math.max(600,c.last.decision.price-60),Math.min(2500,c.last.decision.price+60));
      const expansions=level>=4&&q<=6?[0,1]:[0];
      for(const price of candidatePrices)for(const budget of budgets)for(const expand of expansions){
        const {d,demand}=fitPlan(c,w,m,q,price,budget,expand,weights,level);
        if(validate(c,d))continue;
        const trial=clone(c),prepared=prepare(trial,d,m,q),result=finish(prepared,Math.floor(demand),m);
        let utility=result.profit-result.emergency*(level>=6?.8:.2)-trial.fgValue*.005;
        if(!trial.active)utility-=2000;
        let forward=trial;
        for(let h=1;h<spec.horizon&&q+h<=8&&forward.active;h++){
          const futureMarket=market(w.scenario,w.seed,q+h);
          const future=fitPlan(forward,w,{forecast:futureMarket.forecast,raw:futureMarket.raw,carbon:futureMarket.carbon},q+h,price,{marketing:budget.marketing*.7,rd:budget.rd*.5,green:budget.green*.4},0,weights*(1+.025*h),level);
          const fr=finish(prepare(forward,future.d,{raw:futureMarket.raw,carbon:futureMarket.carbon},q+h),Math.floor(future.demand),futureMarket);
          utility+=(fr.profit-fr.emergency*.8)/Math.pow(1.06,h);
          if(!forward.active)utility-=2000;
        }
        // Diverse preferences affect the choice slightly, without privileged cash or capacity.
        utility-=Math.abs(price-(1700+p.bias))*Math.max(0,(11-level))*.003;
        if(utility>bestValue){bestValue=utility;best=d;}
      }
      return best||{...defaultDecision(),price:1200,produce:0,urgent:0,order:0,hire:0,lines:0,marketing:0,rd:0,green:0,finance:0,carbon:0};
    }
    function planRivals(w,m,q){
      const spec=difficultySpec(w.difficulty),safeMarket={forecast:m.forecast,raw:m.raw,carbon:m.carbon};
      let beliefs=w.companies.map(c=>c.active?publicGuess(c,w,q,w.difficulty):null),plans=[];
      for(let pass=0;pass<spec.passes;pass++){
        plans=w.companies.map(c=>c.i&&c.active?trainedPlan(c,w,safeMarket,q,w.difficulty,beliefs):null);
        beliefs=plans.map((d,i)=>d||beliefs[i]);
      }
      return plans;
    }
function newWorld(session){
      if(session.modelVersion!==2)return LegacySim.newWorld(session);
      const w={modelVersion:2,difficulty:Math.max(1,Math.min(10,session.difficulty||5)),scenario:session.scenario,seed:session.seed,q:0,companies:Array.from({length:25},(_,i)=>blank(i)),history:[],setup:null};
      if(!session.setup)return w;
      w.setup=clone(session.setup);setup(w.companies[0],w.setup);
      for(let i=1;i<25;i++){const p=PERSONAS[i-1],d=defaultSetup();if(w.difficulty<4){d.rd=p.rd;if(p.type==='精益经营'){d.lines=1;d.workers=8;d.raw=1100;}}else{d.raw=2000;d.rd=p.type==='品质溢价'?12:p.type==='品牌经营'?6:2;}setup(w.companies[i],d);}
      return w;
    }
    function step(w,playerDecision){
      if(w.modelVersion!==2)return LegacySim.step(w,playerDecision);
      const q=w.q+1;if(q>8)throw new Error('八季已结束');if(!w.companies[0].active)throw new Error('公司已破产');
      const m=market(w.scenario,w.seed,q),rivalPlans=planRivals(w,{forecast:m.forecast,raw:m.raw,carbon:m.carbon},q),plans=w.companies.map(c=>c.active?(c.i===0?clone(playerDecision):rivalPlans[c.i]):null);
      const valid=validate(w.companies[0],playerDecision);if(valid)throw new Error(valid);
      const weights=w.companies.map((c,i)=>plans[i]?appeal(c,plans[i]):0),totalWeight=.9*w.companies.length/4+sum(weights);
      const reps=w.companies.map((c,i)=>plans[i]?prepare(c,plans[i],m,q):null);
      const records=reps.map((r,i)=>r?finish(r,Math.floor(m.actual*weights[i]/totalWeight),m):null);
      scores(w,q,m);
      w.history.push({q,market:m,records:clone(records)});w.q=q;return w;
    }
    function replay(session){if(session.modelVersion!==2)return LegacySim.replay(session);const w=newWorld(session);for(const d of session.decisions)step(w,d);return w;}
    function fixedQuarter(prior,history,index,decision){
      const valid=validate(prior.companies[index],decision);if(valid)throw new Error(valid);
      const companies=clone(prior.companies),plans=history.records.map(r=>r?clone(r.decision):null),m=history.market;
      plans[index]=clone(decision);
      const weights=companies.map((c,i)=>plans[i]?appeal(c,plans[i]):0),total=.9*companies.length/4+sum(weights);
      const records=companies.map((c,i)=>plans[i]?finish(prepare(c,plans[i],m,history.q),Math.floor(m.actual*weights[i]/total),m):null);
      return records[index];
    }
    function preview(c,d,w){
      const q=w.q+1,m=market(w.scenario,w.seed,q),p=productionPlan(c,d,m);
      const rivals=w.companies.slice(1).filter(x=>x.active);
      const priorWeights=rivals.map(x=>appeal(x,x.last?.decision||defaultDecision()));
      const own=appeal(c,d),estimatedSales=Math.min(c.fg+p.qty,Math.floor(m.forecast*own/(.9*w.companies.length/4+sum(priorWeights)+own)));
      const unitCost=(c.fgValue+p.qty*p.rawAvg+p.costs.processing+p.carbonConsumed+p.costs.topup)/Math.max(1,c.fg+p.qty);
      const repayment=Math.max(0,-d.finance);
      const normalAfter=c.normalDebt+Math.max(0,d.finance)-Math.max(0,repayment-c.emergencyDebt);
      const emergencyAfter=Math.max(0,c.emergencyDebt-repayment)+Math.max(0,-p.cashBeforeInterest);
      const interest=normalAfter*.02+emergencyAfter*.04;
      const fixed=p.costs.wages+p.costs.people+d.marketing+d.rd+d.green+10+interest+c.equipment*.05;
      const margin=d.price/10000-unitCost-.004;
      const breakeven=margin>0?Math.ceil(fixed/margin):null;
      let warning='预估销量 '+estimatedSales+' 件；对手本季决策与需求波动在结算后揭晓。';
      if(p.cashBeforeInterest-interest<0)warning='销售回款前预计缺现金 '+round(-(p.cashBeforeInterest-interest),1)+' 万元，将触发应急融资。';
      else if(d.produce-p.qty>=10)warning='计划产量超过原料或产能，预计少产 '+(d.produce-p.qty)+' 件。';
      else if(p.shortage>0)warning='预计缺碳配额 '+round(p.shortage,1)+' 吨，补足成本 '+round(p.costs.topup,1)+' 万元。';
      else if(q===8&&(d.order>0||d.hire>0||d.lines>0||d.green>0))warning='第 8 季投入的下季资源，没有后续经营季度可用。';
      else if(breakeven&&estimatedSales<breakeven)warning='预估销量 '+estimatedSales+' 件，低于保本销量 '+breakeven+' 件。';
      return {p,m,estimatedSales,breakeven,cash:p.cashBeforeInterest-interest,warning};
    }
    return {CFG,SCENARIOS,clone,round,market,assets,debt,equity,capacity,credit,defaultSetup,defaultDecision,validateSetup,validate,setup,replay,step,preview,newWorld,heuristic,planRivals,difficultySpec,fixedQuarter};
  })();

export {Sim};
