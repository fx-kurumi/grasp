const wf=['产品研发','代码审查','自动化回归','需求澄清','数据分析','发布检查','文档维护','安全扫描']
const titles=['优化工作流审批交互','修复回归测试中的不稳定用例','补充 API 接口说明与示例代码','检查发布前配置','整理产品需求与验收条件','重构支付失败重试流程，保留订单状态并提供明确的重试入口','更新周报与执行记录','排查夜间构建超时','迁移旧版通知渠道配置','安全扫描结果复核','统一列表页筛选样式','补齐权限变更的审计日志','评估缓存命中率下降原因','整理十月版本发布说明','为工作区助手增加引用来源','修复移动端侧栏遮挡','梳理定时任务失败告警','升级依赖并验证构建','清理过期沙箱与产物','核对模型单价配置']
const st=['running','waiting_human','completed','completed','failed','completed','queued','completed','cancelled','completed']
const pr=['high','normal','normal','low','normal']
const tags=[['研发'],['测试','回归'],[],['发布'],['研发','体验'],[],['测试'],['发布','安全'],[],['研发']]
const trig=['manual','pm_mcp','manual','api','manual']
const items=titles.map((title,i)=>{const s=st[i%10];return{id:`run-${(0x3fa2c1+i*7919).toString(16)}e${i}`,workflowId:`wf-${i%8+1}`,workflowName:wf[i%8],workflowVersion:3+(i%3),title,status:s,trigger:trig[i%5],priority:pr[i%5],tags:tags[i%10],
 createdAt:`2026-10-20T0${9-(i%9)}:1${i%6}:00Z`,startedAt:s==='queued'?'':`2026-10-${String(20-Math.floor(i/3)).padStart(2,'0')}T0${9-(i%9)}:1${i%6}:00Z`,
 durationSec:s==='queued'?0:[320,1840,95,4210,760,2280,0,610,45,1500][i%10],progress:s==='completed'?1:s==='running'?0.45:s==='waiting_human'?0.6:s==='failed'?0.7:s==='cancelled'?0.3:0,
 currentNodeLabel:s==='running'?'执行开发任务':s==='waiting_human'?'等待审批：方案评审':'',nodeRuns:{},artifacts:[]}})
module.exports={items,total:57,page:1,pageSize:20}
