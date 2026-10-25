import {Sim} from './engine.mjs';
import {fmt,insights} from './analysis.mjs';
const median=values=>{const a=values.filter(Number.isFinite).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:1200;};
export function strategyProfile(c,d,w,q,index=0,record=null){
 const history=w.history?.find(h=>h.q===q),past=w.history?.find(h=>h.q===q-1);
 const comparable=history||past,prices=comparable?.records.filter(Boolean).map(r=>r.decision.price)||[];
 const reference=median(prices),cap=record?.opening?Math.min(record.opening.lines*1000,record.opening.workers*125):Sim.capacity(c);
 const scores={'价格进攻':0,'品质溢价':0,'品牌经营':0,'扩张进攻':0,'精益经营':0,'现金稳健':0,'低碳领先':0,'成本领先':0};
 const evidence=[];
 if(d.price<reference*.93){scores['价格进攻']+=4;evidence.push(`售价 ${d.price} 元，比可比公司中位价 ${reference} 元低 ${fmt((1-d.price/reference)*100)}%。`);}
 else if(d.price>reference*1.07){scores['品质溢价']+=2;evidence.push(`售价 ${d.price} 元，比中位价高 ${fmt((d.price/reference-1)*100)}%，正在争取单位毛利。`);}
 else evidence.push(`售价 ${d.price} 元，接近同场中位价 ${reference} 元。`);
 if(d.rd>=10){scores['品质溢价']+=4;evidence.push(`研发 ${fmt(d.rd)} 万，主要提升品质吸引力。`);}
 if(d.marketing>=10){scores['品牌经营']+=4;evidence.push(`营销 ${fmt(d.marketing)} 万，依赖品牌积累获取需求。`);}
 if(d.lines>0||d.hire>0){scores['扩张进攻']+=5;evidence.push(`新增 ${d.lines} 条线、${d.hire} 名员工，产能从下一季释放。`);}
 if(d.green>=10){scores['低碳领先']+=4;evidence.push(`绿色投入 ${fmt(d.green)} 万，下季碳强度下降，需后续经营季回收。`);}
 if(cap&&d.produce<cap*.85){scores['精益经营']+=3;evidence.push(`计划使用 ${fmt(d.produce/cap*100,0)}% 现有产能，主动控制生产与库存。`);}
 if(d.finance<0){scores['现金稳健']+=4;evidence.push(`主动还款 ${fmt(-d.finance)} 万，降低负债与利息。`);}
 if(d.finance>0&&d.lines>0)scores['扩张进攻']+=2;
 if(d.rd+d.marketing+d.green<=12){scores['成本领先']+=3;evidence.push(`营销、研发、绿色投入合计 ${fmt(d.rd+d.marketing+d.green)} 万，费用较克制。`);}
 if(!record&&c.cash+c.ar>150&&d.finance<=0)scores['现金稳健']+=2;
 if(record&&record.emergency>0)evidence.push(`实际新增应急融资 ${fmt(record.emergency)} 万，说明当前资金安排尚未守住现金。`);
 const order=Object.entries(scores).sort((a,b)=>b[1]-a[1]),primary=order[0][1]?order[0][0]:'均衡经营',secondary=order[1][1]>=2?order[1][0]:null;
 const intent=primary+(secondary?' + '+secondary:'');
 return {primary,secondary,label:intent,evidence,scores,confidence:order[0][1]>=4?'特征较明显':'混合路线，特征有限',reference,
   verdict:record?record.profit>0?`这条路线本季赚 ${fmt(record.profit)} 万；是否优于替代方案，继续看同季回测。`:`这条路线本季亏 ${fmt(-record.profit)} 万；路线名称不能替代结果检验。`:'这是当前草稿表现出的倾向，改动数字后会重新识别；尚未结算，不能断言赚钱。'};
}
export function quarterWorld(w,q){return Sim.replay({modelVersion:w.modelVersion,difficulty:w.difficulty,scenario:w.scenario,seed:w.seed,setup:w.setup,decisions:w.history.slice(0,q).map(h=>h.records[0].decision)});}
export function detailedCoach(w,q,index=0){
 const a=insights(w,q,index);if(!a)return null;
 const h=w.history[q-1],r=a.r,d=r.decision,view=quarterWorld(w,q),prior=quarterWorld(w,q-1),c=prior.companies[index];
 const own=Sim.preview(c,d,prior),profile=strategyProfile(c,d,w,q,index,r);
 const ratio=r.sales/Math.max(1,r.produced+c.fg),rawAvailable=c.raw+d.urgent,cap=Sim.capacity(c);
 const reasons=[
  {title:'需求与销量',text:`市场预测 ${h.market.forecast.toLocaleString()} 件，实际 ${h.market.actual.toLocaleString()} 件（${fmt((h.market.actual/h.market.forecast-1)*100)}% 波动）。本公司可售 ${r.produced+c.fg} 件，卖出 ${r.sales} 件，售出率 ${fmt(ratio*100)}%。${r.allocatedDemand!=null?`模型分配需求 ${r.allocatedDemand} 件，需求与供货共同限制销量。`:''}`},
  {title:'为什么只生产这些',text:`现有产能 ${cap} 件，期初原料 ${c.raw} 件，紧急补入 ${d.urgent} 件。实际产量取计划 ${d.produce}、产能 ${cap}、可用原料 ${rawAvailable} 的最小值，得到 ${r.produced} 件。普通订货 ${d.order} 件属于下一季资源。`},
  {title:'利润是否来自低价多卖',text:`每件贡献 ${fmt(a.unit,0)} 元，${r.sales} 件形成 ${fmt(a.unit*r.sales/10000)} 万贡献；再覆盖工资、研发、营销、利息等 ${fmt(a.fixed+r.storage)} 万费用，才得到 ${fmt(r.profit)} 万利润。${a.breakeven?`至少售出 ${a.breakeven} 件才能保本。`:'单位贡献非正，增加销量也不能覆盖固定费用。'}`},
  {title:'现金压力具体发生在哪',text:`期初现金 ${fmt(r.openingCash)} 万，上季应收回款 ${fmt(r.arCollected)} 万。本季销售前现金预估 ${fmt(own.cash)} 万；本季销售收入只收回 60%（${fmt(r.revenue*.6)} 万），另外 ${fmt(r.ar)} 万下季到账。实际新增应急资金 ${fmt(r.emergency)} 万，期末现金 ${fmt(r.cash)} 万。`}
 ];
 const leader=a.leader,deltaSales=(leader.sales-r.sales)*d.price/10000,deltaPrice=leader.sales*(leader.decision.price-d.price)/10000;
 const bridge=[{name:'销量差带来的收入差',value:deltaSales},{name:'售价差带来的收入差',value:deltaPrice},{name:'销售成本差',value:-(leader.costOfSales-r.costOfSales)},{name:'期间费用差',value:-(leader.periodExpenses-r.periodExpenses)}];
 const trials=[['提价 5%',{...d,price:Math.min(2500,Math.round(d.price*1.05))}],['降价 5%',{...d,price:Math.max(600,Math.round(d.price*.95))}],['少生产 15%',{...d,produce:Math.floor(d.produce*.85),urgent:Math.max(0,Math.floor(d.produce*.85)-c.raw)}],['营销少投 5 万',{...d,marketing:Math.max(0,d.marketing-5)}]];
 if(q===8)trials.push(['取消末季下季资源',{...d,order:0,hire:0,lines:0,green:0}]);
 const experiments=trials.map(([title,decision])=>{if(Sim.validate(c,decision))return null;const result=Sim.fixedQuarter(prior,h,index,decision);return {title,decision,result,profitChange:result.profit-r.profit,cashChange:result.cash-r.cash,stockChange:result.fg-r.fg};}).filter(Boolean).sort((x,y)=>y.profitChange-x.profitChange);
 const best=experiments[0];
 const action=best&&best.profitChange>.1?`已验证的当季改进是“${best.title}”：利润多 ${fmt(best.profitChange)} 万，现金变化 ${fmt(best.cashChange)} 万，库存变化 ${best.stockChange} 件。进入实验室继续检验边界，下一季需求和对手会变，不能直接照搬。`:'这几种常见改动没有带来明显的当季增益。保留当前有效安排，再到实验室分别改变售价、规模与投入；不要为了换路线而换路线。';
 return {profile,reasons,bridge,leader,gap:a.gap,experiments,action,trajectory:w.history.slice(0,q).map(h=>h.records[index]?{q:h.q,profit:h.records[index].profit,...strategyProfile(view.companies[index],h.records[index].decision,w,h.q,index,h.records[index])}:null).filter(Boolean)};
}
