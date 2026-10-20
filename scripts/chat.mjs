// node chat.mjs : env BASE OUT THEME. Real index.html + src/main.ts; /api via page.route, WS via routeWebSocket.
// /gates?run=run-7&node=ap : sandbox absent → pulling → creating → running → agent busy → streaming → turn_done → composer.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { install, state, wsSend } from './chat-mock.mjs'
const require = createRequire('/home/ubuntu/code/grasp-pr-notif/web/package.json')
const { chromium } = require('playwright')
const { BASE, OUT, THEME = 'light' } = process.env
fs.mkdirSync(OUT, { recursive: true })
const NODES = [{ id: 'input', type: 'input', label: '输入', config: {} }, { id: 'ap', type: 'clarify', label: '澄清', config: {} }]
const HUMAN = '完成首次引导后没有刷新工作流'
let T0 = ''
const ROW = (st, at) => ({ type: 'clarify', ...(st ? { state: st } : {}), runId: 'run-7', nodeId: 'ap', iteration: 1, workflowId: 'wf-1', workflowName: '默认工作流', runTitle: HUMAN, label: '澄清', done: false, requestedAt: T0, updatedAt: at })
const SB = (status, c, u) => ({ id: 41, name: 'grasp-sbx-7f3a', profile: 'manager', purpose: 'run', status, runId: 'run-7', nodeId: 'ap', createdAt: c, updatedAt: u, containerStatus: status === 'running' ? 'running' : 'not_found', busy: true, connected: false, hasCodeServer: status === 'running', hasAcp: status === 'running' })
const STEPS = [
  { kind: 'thought', text: '先确认用户描述的现象：首次引导完成后侧栏工作流列表没有更新。' },
  { kind: 'message', text: '先对齐需求：我会读取检查清单、附件截图和仓库现状，确认「首次引导完成后未刷新工作流」具体指什么。' },
  { kind: 'tool', title: '读取文件', status: 'completed' },
  { kind: 'tool', title: '搜索代码', status: 'completed' },
  { kind: 'thought', text: '截图里侧栏仍显示「还没有工作流」，需要看引导完成后是否触发了目录刷新。' },
  { kind: 'message', text: '截图显示首次引导结束后侧栏仍是空的。接下来我会查引导完成逻辑，以及工作流列表何时刷新。' },
]
const FINAL = { kind: 'message', text: '已定位：引导向导完成后没有触发 `workflowCatalogRevision`，侧栏目录不会重新加载。修复方式是在向导完成回调里 bump revision。\n\n请确认：引导结束后应立即在侧栏看到新建的工作流，对吗？' }
function acp(parts, streaming = true) {
  const th = parts.filter((p) => p.kind === 'thought').map((p) => p.text).pop() || ''
  const msg = parts.filter((p) => p.kind === 'message').map((p) => p.text).pop() || ''
  wsSend({ type: 'acp', runId: 'run-7', nodeId: 'ap', busy: true, events: [
    ...(th ? [{ kind: 'thought', text: th }] : []), ...(msg ? [{ kind: 'message', text: msg }] : []),
    ...parts.filter((p) => p.kind === 'tool').map((p) => ({ kind: 'tool_call', title: p.title, status: streaming ? p.status : 'completed' })),
    { kind: 'timeline', parts: parts.map((p) => ({ ...p })) }] })
}
function scene() {
  T0 = new Date(Date.now() - 1500).toISOString(); state.sandbox = null
  state.gates = [ROW('starting', T0)]
  state.ctx = { type: 'clarify', status: 'running', nodes: NODES, artifacts: [], clarify: { nodeId: 'ap', iteration: 1, turns: [], done: false, label: '澄清', starting: true } }
  state.run = { id: 'run-7', workflowId: 'wf-1', workflowName: '默认工作流', title: HUMAN, status: 'running', trigger: 'manual', startedAt: T0, progress: 10, nodeRuns: { ap: { status: 'running' } }, nodes: NODES, artifacts: [] }
}
const raw = path.join(OUT, 'raw-' + Date.now())
const b = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN', timezoneId: 'Asia/Hong_Kong', recordVideo: { dir: raw, size: { width: 1280, height: 800 } } })
await ctx.addInitScript((t) => { localStorage.setItem('grasp-theme', t); localStorage.setItem('grasp-locale', 'zh-CN'); localStorage.setItem('grasp-onboarding-suppress', '1') }, THEME)
const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 200)))
const W = (ms) => p.waitForTimeout(ms)
const shot = async (n) => { await p.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n) }
await install(p); scene()
await p.goto(`${BASE}/gates?run=run-7&node=ap`)
await W(2500); await shot('01-connecting')
let c = new Date().toISOString(); state.sandbox = SB('pulling', c, c)
await W(3500); await shot('02-pulling')
state.sandbox = SB('creating', c, new Date().toISOString())
await W(3500); await shot('03-creating')
state.sandbox = SB('running', c, new Date().toISOString())
await W(3000)
// agent connected + busy
let at = new Date().toISOString()
state.run = { ...state.run, status: 'waiting_human', nodeRuns: { ap: { status: 'waiting_human' } }, clarify: { nodeId: 'ap', iteration: 1, done: false, turns: [{ role: 'human', text: HUMAN, at }] } }
state.ctx = { type: 'clarify', status: 'waiting_human', nodes: NODES, artifacts: [], reactSessions: { ap: { busy: true, waiting: 0, activeItem: { id: 'op-1', text: HUMAN } } }, clarify: { nodeId: 'ap', iteration: 1, turns: [], done: false, label: '澄清' } }
state.gates = [ROW('replying', at)]
wsSend({ type: 'status', runId: 'run-7', status: 'waiting_human' })
await W(1200)
wsSend({ type: 'review', event: 'queue_state', nodeId: 'ap', busy: true, waiting: 0, items: [] })
wsSend({ type: 'review', event: 'turn_begin', nodeId: 'ap', item: { text: HUMAN } })
await W(2500); await shot('04-react-thinking')
for (let i = 1; i <= STEPS.length; i++) { acp(STEPS.slice(0, i)); await W(1300); if (i === 5) await shot('05-streaming') }
acp([...STEPS, FINAL], false); await W(1200)
at = new Date().toISOString()
const agentTurn = { role: 'agent', at, thought: STEPS[4].text, text: FINAL.text, tools: [{ title: '读取文件', status: 'completed' }, { title: '搜索代码', status: 'completed' }], parts: [...STEPS, FINAL] }
state.ctx = { ...state.ctx, reactSessions: { ap: { busy: false, waiting: 0 } }, clarify: { ...state.ctx.clarify, turns: [{ role: 'human', text: HUMAN, at: T0 }, agentTurn] } }
state.run = { ...state.run, clarify: { ...state.run.clarify, turns: state.ctx.clarify.turns } }
state.gates = [ROW('', at)]
wsSend({ type: 'review', event: 'turn_done', nodeId: 'ap', waiting: 0 })
wsSend({ type: 'review', event: 'queue_state', nodeId: 'ap', busy: false, waiting: 0, items: [] })
await W(3000); await shot('06-done')
const input = p.getByTestId('clarify-input')
if (await input.count()) { await input.click(); await p.keyboard.type('对，引导结束后侧栏应立即出现新建的工作流', { delay: 50 }); await W(800); await shot('07-draft'); await input.fill(''); await p.evaluate(() => document.activeElement?.blur()); await W(800) }
await W(1000)
await ctx.close()
const vf = fs.readdirSync(raw)[0]; fs.renameSync(path.join(raw, vf), `${OUT}/flow.webm`); fs.rmSync(raw, { recursive: true })
// scrollbar: long transcript, idle hover over the chat column
scene()
const long = []; for (let i = 0; i < 9; i++) { long.push({ role: 'human', text: `第 ${i + 1} 轮补充：${HUMAN}`, at: new Date(Date.now() - (9 - i) * 6e5).toISOString() }); long.push({ role: 'agent', text: `第 ${i + 1} 轮回复：已记录，接下来检查引导完成后的目录刷新路径，并核对侧栏工作流列表的加载时机与缓存。`, at: new Date(Date.now() - (9 - i) * 5.9e5).toISOString() }) }
state.gates = [ROW('', T0)]
state.ctx = { type: 'clarify', status: 'waiting_human', nodes: NODES, artifacts: [], clarify: { nodeId: 'ap', iteration: 1, turns: long, done: false, label: '澄清' } }
state.run = { ...state.run, status: 'waiting_human', clarify: state.ctx.clarify }
const ctx2 = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: 'zh-CN', timezoneId: 'Asia/Hong_Kong' })
await ctx2.addInitScript((t) => { localStorage.setItem('grasp-theme', t); localStorage.setItem('grasp-onboarding-suppress', '1') }, THEME)
const p2 = await ctx2.newPage(); state.sockets.length = 0; await install(p2)
await p2.goto(`${BASE}/gates?run=run-7&node=ap`); await p2.waitForTimeout(3000)
await p2.mouse.move(1000, 400); await p2.mouse.wheel(0, -400); await p2.waitForTimeout(400)
await p2.screenshot({ path: `${OUT}/08-scrollbar.png` })
await p2.screenshot({ path: `${OUT}/08-scrollbar-zoom.png`, clip: { x: 1080, y: 120, width: 200, height: 360 } })
await b.close()
console.log('done', THEME, [...state.unhandled].join(','))
