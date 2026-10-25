export const CASES={
 toyota:{id:'toyota',company:'丰田',tag:'生产与库存协同',scenario:'base',period:'TPS 官方生产体系说明',checked:'2026-10-13',
  title:'库存少，也要供得上',facts:[{label:'生产体系',value:'Just-in-Time 与 jidoka',note:'官方将按需生产与发现异常时停止并改善列为两项支柱。'},{label:'补货逻辑',value:'按销售节奏补充',note:'官方说明各工序保持必要的最低部件储备，再按下游取用补充；不是把库存一律降到零。'}],
  source:{title:'丰田官方：Toyota Production System',url:'https://global.toyota/en/company/vision-and-philosophy/production-system/'},
  lesson:'先让采购、产能和预计销售衔接，再压缩无效库存。减少库存必须与缺货风险一起判断。',
  transfer:['本季原料能支持多少产量？普通订单下一季才可用。','先消化成品，再订新增原料；不能仅凭上季销量机械地买货。','把紧急采购和产成品占用放在同一张表里比较。'],
  caveat:'本训练是单产品、季度经营模型；没有实现丰田真实的万件零部件协同、质量停线、供应商日级节拍。库存阈值属于练习目标。',
  exercise:'在基础对抗中，争取八季盈利、减少急采，同时避免为了压库存而错失正贡献的销售。',
  questions:[{question:'“按需生产”更接近哪种做法？',choices:['永远零库存，也不准备安全储备','让工序与需求同步，准备必要储备并滚动补充','把所有工厂持续开满'],correct:1,explanation:'官方描述包含必要的最低储备和按取用补充，关键是同步与减少浪费。'},
   {question:'模拟中本季下的普通原料订单，何时能支持生产？',choices:['本季立即可用','下一季可用','只有整局结束才可用'],correct:1,explanation:'训练模型规定普通采购下季可用。必须先检查期初原料、当季急采和现有产能。'},
   {question:'成品库存下降，但急采和断供增加，应该怎样判断？',choices:['库存少就一定更好','只看排名，不看原因','把资金占用、缺货和急采成本一起比较'],correct:2,explanation:'教学推论：单一库存指标不能代表系统效率。应合并比较库存资金、加价采购与销售机会。'}]},
 byd:{id:'byd',company:'比亚迪',tag:'规模、研发与现金',scenario:'war',period:'2025 全年；公司 2026-07-28 新闻稿口径',checked:'2026-10-13',
  title:'规模大，仍要算每一笔投入',facts:[{label:'全年收入',value:'约 8040 亿元人民币',note:'公司官方新闻稿披露的 2025 年全年收入。'},{label:'净利润',value:'约 326 亿元人民币',note:'采用同一新闻稿的净利润口径，不能与营业收入或现金流混同。'},{label:'研发投入',value:'约 634 亿元人民币',note:'公司披露同比增长 17%；研发投入与财报费用口径不能简单等同。'}],
  source:{title:'比亚迪官方媒体：2025 年经营与研发数据',url:'https://media.byd.com/byd-ranks-91st-in-2026-fortune-global-500/?lang=eng'},
  extraSource:{title:'2025 年报原文（港交所披露）',url:'https://www.hkexnews.hk/listedco/listconews/sehk/2026/0327/2026032702645_c.pdf'},
  lesson:'公开规模和研发数据提供分析起点。操盘时要分别判断销量、单位贡献、投入回收与现金时点，不能按真实公司的研发比例直接复制预算。',
  transfer:['扩产前，估计新增销量能否覆盖工资、折旧和资金成本。','做研发方案对比，同时检查售价和需求能否补偿当季费用。','有利润仍可能缺现金：本模型 40% 销售回款下一季到账。'],
  caveat:'这里用“价格战”作为教学压力情景，不复现比亚迪的车型、供应链、研发资本化、海外市场或真实定价系统。650 万启动资金与需求参数均为训练设定。',
  exercise:'在价格压力下比较“降价抢量”和“守毛利”，在八季里控制现金缺口并记录投资回收的理由。',
  questions:[{question:'按同一新闻稿的 326 / 8040 计算，利润与收入的比例约多少？',choices:['约 4.1%','约 41%','约 58.3%'],correct:0,explanation:'326 ÷ 8040 ≈ 4.05%。这是按新闻稿数值计算的比值，不是公司的全部经营解释。'},
   {question:'把真实公司的研发占比直接搬到本训练公司，是否可靠？',choices:['可靠，知名公司的比例永远最优','需要先比较模型中的费用、需求、回收期和现金','只要比对手多投就一定赢'],correct:1,explanation:'教学推论：规模、产品、会计处理与回收周期不同；比例不能直接转化为本局最优预算。'},
   {question:'本季销售有利润，但采购前现金不足，应该优先检查什么？',choices:['只看净利润','继续把产量全部调满','回款时点、投入付款和融资安排'],correct:2,explanation:'训练规则中只有 60% 本季回款。应先看销售前现金桥，再选择采购、投资或正常融资。'}]},
 inditex:{id:'inditex',company:'Inditex · Zara 母公司',tag:'需求响应与费用纪律',scenario:'raw',period:'Inditex 2025 年报 CEO 信',checked:'2026-10-13',
  title:'毛利高，仍要管费用与库存',facts:[{label:'全年收入',value:'约 399 亿欧元',note:'年报 CEO 信采用约 399 亿欧元口径，同比增长 3.2%。'},{label:'毛利率',value:'58.3%',note:'毛利仍需覆盖经营费用等项目，不等同于净利率。'},{label:'费用增长',value:'2.8%',note:'年报披露经营费用增速低于销售收入增速。'}],
  source:{title:'Inditex 2025 年报：Letter from our CEO',url:'https://annualreport.inditex.com/anrpxxvui/en/ceo-statement'},
  lesson:'把需求响应和费用纪律一起看：商品受到欢迎、毛利较高，也要控制营销、运营投入和存货资金。',
  transfer:['在成本上涨时重新计算单位贡献和保本销量。','比较涨价后销量减少，与单位毛利增加谁的影响更大。','营销投入看增量利润，不把营业收入增长当作投入成功的唯一证据。'],
  caveat:'训练仍是单产品制造模型，没有实现款式生命周期、门店渠道、促销清仓或 Inditex 的周级补货系统；原料上涨属于教学压力设定。',
  exercise:'在成本上升情景下保住单位贡献，避免无效营销和积压，用同季回测验证提价与投入的效果。',
  questions:[{question:'毛利率 58.3% 是否意味着收入的 58.3% 都成为净利润？',choices:['是，毛利就是净利','不是，还要考虑经营费用等后续项目','只要库存少，两者就一样'],correct:1,explanation:'年报同时列示毛利与净利润。两者处在利润表不同层级；营销、运营等费用会进一步影响利润。'},
   {question:'原料变贵以后，只维持原售价和原产量，主要风险是什么？',choices:['单位贡献下降，原来的保本点可能改变','净利润一定会上升','研发会自动补偿所有成本'],correct:0,explanation:'教学推论：先更新单位成本，再算贡献和保本销量；是否涨价还需要验证需求变化。'},
   {question:'多投 10 万营销带来更多收入，是否足以证明这次投入值得？',choices:['足以，收入增加就成功','只要高于对手投入就成功','不够，还要比较新增贡献、费用与现金'],correct:2,explanation:'教学推论：新增收入需要扣除新增销售成本与费用；现金回收也会影响投入能否持续。'}]}
};
export function gradeCase(id,answers){const c=CASES[id];if(!c)throw Error('案例不存在。');if(!Array.isArray(answers)||answers.length!==c.questions.length||answers.some((n,i)=>!Number.isInteger(n)||n<0||n>=c.questions[i].choices.length))throw Error('请完成全部案例理解题。');const correct=answers.filter((n,i)=>n===c.questions[i].correct).length;return {caseId:id,score:Math.round(correct/c.questions.length*100),correct,total:c.questions.length,feedback:c.questions.map((q,i)=>({question:q.question,correct:answers[i]===q.correct,answer:q.choices[q.correct],explanation:q.explanation}))};}
export function caseMetrics(w,id){if(!CASES[id])return null;const records=w.history.map(h=>h.records[0]).filter(Boolean),sales=records.reduce((s,r)=>s+r.sales,0),inventoryRatio=records.length?records.reduce((s,r)=>s+r.fg/Math.max(1,r.sales),0)/records.length:0,urgent=records.reduce((s,r)=>s+r.decision.urgent,0),produced=records.reduce((s,r)=>s+r.produced,0),notes=records.filter(r=>typeof r.decision.reason==='string'&&r.decision.reason.trim().length>=8).length,emergencies=records.filter(r=>r.emergency>.01).length;
 const checks=[{name:'完成八季，并保持累计利润为正',ok:w.q===8&&w.companies[0].totalProfit>0,value:`${w.q} / 8 季 · ${w.companies[0].totalProfit.toFixed(1)} 万`},{name:'至少记录三个季度的决策理由',ok:notes>=3,value:`${notes} 季已写理由；仅记录，不自动判断文字对错`}];
 if(id==='toyota')checks.push({name:'平均成品库存 / 当季销量不超过 20%',ok:records.length>0&&inventoryRatio<=.2,value:(inventoryRatio*100).toFixed(1)+'%'},{name:'急采不超过累计产量的 5%',ok:produced>0&&urgent/produced<=.05,value:produced?(urgent/produced*100).toFixed(1)+'%':'尚未生产'});
 else if(id==='byd')checks.push({name:'发生应急融资的季度不超过一次',ok:records.length>0&&emergencies<=1,value:emergencies+' 次'},{name:'末季不再购买下季资源',ok:w.q===8&&records.at(-1).decision.order===0&&records.at(-1).decision.lines===0&&records.at(-1).decision.hire===0&&records.at(-1).decision.green===0,value:w.q===8?'检查 Q8 订单、设备、招工和绿色投入':'待 Q8 检查'});
 else checks.push({name:'平均成品库存 / 当季销量不超过 25%',ok:records.length>0&&inventoryRatio<=.25,value:(inventoryRatio*100).toFixed(1)+'%'},{name:'每个已经营季度保持正的单位贡献',ok:records.length>0&&records.every(r=>r.sales>0&&(r.revenue-r.costOfSales-r.shipping)>0),value:records.filter(r=>r.sales>0&&(r.revenue-r.costOfSales-r.shipping)>0).length+' / '+records.length+' 季'});
 return {checks,passed:checks.filter(x=>x.ok).length,total:checks.length,sales};}
