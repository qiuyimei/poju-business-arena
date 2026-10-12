import {Sim,PERSONAS} from './engine.mjs';
export const fmt=(n,d=1)=>Number(n||0).toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d});
export const strategy={
 '成本领先':{logic:'优先控制价格与经常性费用，利用稳定产能争取销量；采购按预计销售衔接下一季。',strength:'营销、研发支出相对克制，较容易守住现金和贡献毛利。',risk:'价格竞争会压缩单位利润，品质与品牌可能逐季落后。',counter:'不要只跟着降价。先比较单位贡献、可售数量和保本销量，尝试以小幅提价保住利润。'},
 '品质溢价':{logic:'连续研发提高产品吸引力，以高价回收品质投入；资金不足时优先维持研发路线。',strength:'在需求与品质优势足够时，较高售价能带来更高单位贡献。',risk:'研发费用立即计入损益，销售不足时会亏损，后期投入回收期很短。',counter:'观察它的品质和价格共同变化。用实验室比较你的提价空间，避免投入与它同等研发却没有相应售价。'},
 '低碳领先':{logic:'前期持续绿色投入，使下一季碳强度下降，减少后续购买碳配额的需求。',strength:'碳价上行时，后续成本及低碳参考分较有优势。',risk:'前期费用较大；末季新增绿色投入没有下一季回收机会。',counter:'比较本季碳支出与绿色投入的回收期，早期做适量减排，后期按实际配额缺口采购。'},
 '扩张进攻':{logic:'开局配备较大产能，在早期需求预计超过产能且现金充足时再扩产。',strength:'可以接住需求上升与市场份额转移，销量上限较高。',risk:'设备、工资、折旧占用资金；没有需求支撑会出现闲置和存货。',counter:'先看它真实销量与产量，不要照抄产能。用你的销量、单位贡献测算增加一条线是否能覆盖工资与折旧。'},
 '精益经营':{logic:'开局小产能，降低备货比例和固定支出，保持较高现金缓冲。',strength:'存货和融资压力较小，需求下行时防守能力较好。',risk:'可能错失高需求市场，受产能上限约束难以迅速抢占份额。',counter:'借鉴按销量订货的习惯；若你的现金和需求足够，可用更大产能争取它未覆盖的市场。'},
 '品牌经营':{logic:'较高营销投入形成品牌积累，辅以研发，并尝试以较高售价实现品牌溢价。',strength:'品牌会影响后续需求吸引力，持续投入能够积累优势。',risk:'营销的边际增益递减；费用可能先于销售收益出现。',counter:'比较每多花 10 万营销能增加多少销量与利润，选择值得覆盖的投入区间，不必跟随其预算。'},
 '现金稳健':{logic:'保持较高现金储备，生产与订单偏保守，资金宽裕后偿还负债。',strength:'应急融资风险较低，借款和利息容易控制。',risk:'资金可能闲置，保守产量可能减少可赚取的利润。',counter:'学习它的现金预算，但同时计算闲置现金可支持的有效投资；有正贡献和真实需求时再增加生产。'},
 '价格进攻':{logic:'以较低价格和较积极备货争取销量，研发和减排投入较少。',strength:'前期低价会提高市场吸引力，能够向其他公司施加价格压力。',risk:'单位贡献容易下降，存货、现金短缺及低碳表现可能拖累结果。',counter:'先检查你的保本价格与保本销量。跟随降价前，在同季实验中确认增加的销量足以覆盖毛利下降。'}
};
export function rank(w){return [...w.companies].sort((a,b)=>Number(b.active)-Number(a.active)||b.totalProfit-a.totalProfit);}
export function insights(w,q,index=0){
 const h=w.history[q-1],r=h?.records[index];if(!r)return null;
 const records=h.records.map((x,i)=>x?{...x,i,name:w.companies[i].name}:null).filter(Boolean),leader=[...records].sort((a,b)=>b.profit-a.profit)[0];
 const d=r.decision,unit=r.sales?(r.revenue-r.costOfSales-r.shipping)/r.sales*10000:0,fixed=r.periodExpenses-r.shipping-r.storage;
 const margin=d.price-unit;const issues=[],wins=[],next=[];
 if(r.profit>0)wins.push(`本季赚 ${fmt(r.profit)} 万元，收入 ${fmt(r.revenue)} − 销售成本 ${fmt(r.costOfSales)} − 期间费用 ${fmt(r.periodExpenses)} = 本季利润。`);
 else issues.push(`本季亏损 ${fmt(-r.profit)} 万元。先区分单位贡献不足，还是销量不足以覆盖 ${fmt(fixed)} 万元固定及投入费用。`);
 if(r.emergency>0){issues.push(`销售回款前后触发 ${fmt(r.emergency)} 万元应急融资。本季收入有 40% 下季到账，利润不能替代现金预算。`);next.push('先做销售前现金预算，减少无效备货或延期扩产；信用额度允许时，提前安排普通贷款。');}
 else wins.push('本季没有新增应急融资，销售前现金安排能够覆盖经营支出。');
 if(d.produce-r.produced>=10){issues.push(`计划生产 ${d.produce}，实际生产 ${r.produced}，缺口 ${d.produce-r.produced} 件；当季普通订货与扩产不能立即使用。`);next.push('让计划产量同时满足现有员工、生产线和期初原料三个约束，提前一季采购与扩产。');}
 if(d.urgent>0){issues.push(`紧急采购 ${d.urgent} 件，价格为普通采购的 1.5 倍，并产生训练模型中的应急采购扣分。`);next.push('检查上季普通订货量，按下季需求和期末原料滚动采购，减少紧急采购。');}
 const excess=r.fg/Math.max(1,r.sales);
 if(excess>.3){issues.push(`期末产成品 ${r.fg} 件，约为本季销量的 ${fmt(excess*100,0)}%；利润与现金被存货占用。`);next.push('下一季先消化存货，再决定新增产量；用实验室比较减少生产与提价的结果。');}
 else wins.push(`期末产成品 ${r.fg} 件，相比本季销量 ${r.sales} 件，库存负担${r.fg?'相对有限':'已清空'}。`);
 if(r.sales===r.produced+(q>1?w.history[q-2].records[index]?.fg||0:0)&&r.sales>0)next.push('可售商品已经全部卖出，先验证需求空间，再评估扩产；增加营销可能无法提高本季销量。');
 if(r.shortage>0){issues.push(`碳配额缺口 ${fmt(r.shortage)} 吨，以 3 倍碳价补足；绿色投入从下一季改变碳强度。`);next.push('按计划产量 × 本季碳强度 − 现有配额 − 400 吨免费配额，提前核算配额采购。');}
 if(q===8&&(d.order||d.hire||d.lines||d.green))issues.push('末季仍投入下一季资源，普通订单、招工、设备与绿色改造没有后续经营季回收机会。');
 const gap=leader.profit-r.profit,revGap=leader.revenue-r.revenue,costGap=leader.costOfSales-r.costOfSales,expenseGap=leader.periodExpenses-r.periodExpenses;
 if(gap>.1)next.push(`本季利润第一 ${leader.name} 比你多赚 ${fmt(gap)} 万。利润差 = 收入差 ${fmt(revGap)} − 销售成本差 ${fmt(costGap)} − 费用差 ${fmt(expenseGap)}；按最大差项优先调整。`);
 if(next.length===0)next.push('用同季实验分别尝试提价 5%、减少产量 10%、减少营销 5 万；比较利润、现金和库存，再保留有证据的改进。');
 return {r,leader,records,unit,margin,fixed,breakeven:unit>0?Math.ceil((fixed+r.storage)*10000/unit):null,wins,issues,next,gap};
}
export const fieldNames={price:'售价',produce:'计划生产',order:'普通订货',urgent:'紧急采购',hire:'新增员工',lines:'新增生产线',marketing:'营销',rd:'研发',green:'绿色投入',carbon:'购买碳配额',finance:'借款 / 还款'};
