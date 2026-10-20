// Deterministic, realistic mock for GET /api/stats/token (used only by screenshot script).
function rng(seed){let s=seed;return()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
const r=rng(42)
const parts=(total,cacheShare=0.38)=>{const out=Math.round(total*(0.07+r()*0.04));const cr=Math.round(total*cacheShare);const cw=Math.round(total*0.05);return{inputTokens:total-out-cr-cw,outputTokens:out,cacheReadTokens:cr,cacheWriteTokens:cw}}
const models=[
 ['anthropic/claude-sonnet-4.5','claude-sonnet-4.5',41200000,3.0],
 ['openai/gpt-5','gpt-5',22800000,1.25],
 ['google/gemini-2.5-pro','gemini-2.5-pro',13100000,1.25],
 ['deepseek/deepseek-v3.2','deepseek-v3.2',9600000,0.28],
 ['qwen/qwen3-coder-plus','qwen3-coder-plus',6200000,0.6],
 ['anthropic/claude-haiku-4.5','claude-haiku-4.5',3900000,1.0],
]
const modelRanking=models.map(([k,n,t,p])=>({modelKey:k,name:n,total:t,...parts(t),cost:+(t/1e6*p*1.9).toFixed(2)}))
modelRanking.push({name:'未知/未分桶',total:1350000,unknown:true,...parts(1350000),cost:0})
const total=modelRanking.reduce((a,m)=>a+m.total,0)
const sum=(k)=>modelRanking.reduce((a,m)=>a+(m[k]||0),0)
const cost=+sum('cost').toFixed(2)
const wfNames=['产品研发','代码审查','自动化回归','需求澄清','数据分析','发布检查','文档维护','安全扫描']
const wfShares=[0.31,0.19,0.13,0.08,0.06,0.04,0.03,0.02]
const pmTotal=Math.round(total*0.09), studioTotal=Math.round(total*0.05)
const workflowTotal=total-pmTotal-studioTotal
const workflows=wfNames.map((n,i)=>{const t=Math.round(total*wfShares[i]);return{workflowId:`wf-${i+1}`,name:n,total:t,kind:'workflow',...parts(t),cost:+(cost*wfShares[i]).toFixed(2)}})
workflows.push({name:'工作区助手',total:pmTotal,kind:'pm',...parts(pmTotal),cost:+(cost*0.09).toFixed(2)})
const otherT=workflowTotal-workflows.slice(0,8).reduce((a,w)=>a+w.total,0)
workflows.push({name:'其他工作流',total:otherT,kind:'other',other:true,...parts(otherT),cost:+(cost*0.05).toFixed(2)})
const ntNames=[['agent','Agent 节点',0.58],['llm','LLM 节点',0.21],['review','评审节点',0.1],['clarify','澄清节点',0.07],['code','代码节点',0.04]]
const nodeTypes=ntNames.map(([k,n,s])=>{const t=Math.round(workflowTotal*s);return{key:k,name:n,total:t,...parts(t),cost:+(cost*0.86*s).toFixed(2)}})
const sources=[['workflow',workflowTotal,0.86],['pm',pmTotal,0.09],['studio',studioTotal,0.05]].map(([k,t,s])=>({key:k,name:k,total:t,...parts(t),cost:+(cost*s).toFixed(2)}))
const failedTotal=Math.round(total*0.034)
const statuses=[['ok',total-failedTotal-420000],['failed',failedTotal],['cancelled',420000]].map(([k,t])=>({key:k,name:k,total:t,...parts(t),cost:+(cost*t/total).toFixed(2)}))
const phases=[['production',0.64],['interactive',0.27],['chat',0.09]].map(([k,s])=>{const t=Math.round(total*s);return{key:k,name:k,total:t,...parts(t),cost:+(cost*s).toFixed(2)}})
const days=30, end=new Date('2026-10-20T00:00:00+08:00')
const trend=[],prevTrend=[]
for(let i=days-1;i>=0;i--){const d=new Date(end);d.setDate(end.getDate()-i);const wk=d.getDay();const base=total/days*(wk===0||wk===6?0.45:1.18)*(0.75+r()*0.5)*(0.8+0.4*(days-i)/days);const t=Math.round(base);const iso=d.toISOString().slice(0,10)
 trend.push({bucket:iso,total:t,workflowTotal:Math.round(t*0.86),pmTotal:Math.round(t*0.09),studioTotal:Math.round(t*0.05),failedTotal:Math.round(t*0.034),cost:+(cost*t/total).toFixed(2),...parts(t)})
 const pt=Math.round(t*(0.7+r()*0.3));prevTrend.push({bucket:iso,total:pt,cost:+(cost*pt/total).toFixed(2),...parts(pt)})}
const modelTrends=modelRanking.filter(m=>!m.unknown).slice(0,5).map(m=>({key:m.modelKey,name:m.name,trend:trend.map(b=>({...b,total:Math.round(b.total*m.total/total)}))}))
const weekHour=Array.from({length:7},(_,d)=>Array.from({length:24},(_,h)=>{const work=h>=9&&h<=20?1:0.12;const wk=d>=5?0.35:1;return Math.round(total/7/24*work*wk*2.2*(0.6+r()*0.8))}))
const tree=[...workflows.slice(0,6).map(w=>({key:w.workflowId,name:w.name,kind:'workflow',value:w.total,cost:w.cost,children:ntNames.slice(0,3).map(([k,n,s])=>({key:k,name:n,kind:'nodeType',value:Math.round(w.total*s/0.89),cost:+(w.cost*s).toFixed(2)}))})),{key:'pm',name:'工作区助手',kind:'pm',value:pmTotal},{key:'studio',name:'Agent Studio',kind:'studio',value:studioTotal}]
const runTitles=['优化工作流审批交互','修复回归测试中的不稳定用例','补充 API 接口说明与示例代码','检查发布前配置','整理产品需求与验收条件','重构支付失败重试流程，保留订单状态并提供明确的重试入口','更新周报与执行记录','排查夜间构建超时','迁移旧版通知渠道配置','安全扫描结果复核']
const topRuns=runTitles.map((title,i)=>{const t=Math.round(3800000/(1+i*0.42));const m=modelRanking[i%5];return{runId:`run-${String(i+1).padStart(2,'0')}a7c9e${i}`,title,workflowId:`wf-${(i%8)+1}`,workflowName:wfNames[i%8],modelKey:m.modelKey,modelName:m.name,total:t,...parts(t),cost:+(t/1e6*2.4).toFixed(2),nodeCount:4+(i%6),status:i===3?'failed':'ok',firstAt:`2026-10-${String(19-i).padStart(2,'0')}T02:1${i}:00Z`}})
const kpi={total,prevTotal:Math.round(total*0.82),deltaPct:21.9,inputTokens:sum('inputTokens'),outputTokens:sum('outputTokens'),cacheReadTokens:sum('cacheReadTokens'),cacheWriteTokens:sum('cacheWriteTokens'),workflowTotal,pmTotal,studioTotal,failedTotal,runCount:486,threadCount:73,modelCount:7,eventCount:18342,avgPerRun:Math.round(workflowTotal/486),cost,prevCost:+(cost*0.85).toFixed(2),costDeltaPct:17.6,unpricedTotal:1350000}
kpi.cacheHitRate=kpi.cacheReadTokens/(kpi.inputTokens+kpi.cacheReadTokens+kpi.cacheWriteTokens)
const stats={window:'all',bucketWidth:'day',timezone:'Asia/Shanghai',range:{start:'2026-09-21T00:00:00+08:00',end:'2026-10-20T23:59:59+08:00'},currency:'CNY',empty:false,kpi,trend,prevTrend,
 composition:{inputTokens:kpi.inputTokens,outputTokens:kpi.outputTokens,cacheReadTokens:kpi.cacheReadTokens,cacheWriteTokens:kpi.cacheWriteTokens,total},
 modelRanking,nodeTypes,sources,statuses,phases,workflows,weekHour,tree,topRuns,modelTrends,unpricedModels:['qwen/qwen3-coder-plus'],
 filterOptions:{models:modelRanking.filter(m=>m.modelKey).map(m=>({key:m.modelKey,name:m.name})),workflows:wfNames.map((n,i)=>({key:`wf-${i+1}`,name:n})),nodeTypes:ntNames.map(([k,n])=>({key:k,name:n}))}}
module.exports=stats
