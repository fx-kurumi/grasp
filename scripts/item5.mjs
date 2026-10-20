// node rec.mjs <before|after> [video]
// Real entry (index.html + src/main.ts, full theme) served by vite; Playwright mocks /api + WS.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('/home/ubuntu/code/grasp-pr-notif/web/package.json')
const { chromium } = require('playwright')
const [mode = 'after', video = ''] = process.argv.slice(2)
const BASE = process.env.BASE
const OUT = process.env.OUT; fs.mkdirSync(OUT + '/shots', { recursive: true }); fs.mkdirSync(OUT + '/video', { recursive: true })
const NOW = Date.now()
const ago = (m) => new Date(NOW - m * 60000).toISOString()
const CLARIFY_CAPS = { interaction: 'clarify', tools: ['ask_question'], reads: ['*'], writes: [{ schema: 'clarified_requirement', required: true }] }
const REVIEW_CAPS = { interaction: 'auto', review: true, tools: [], reads: ['*'], writes: [] }
let seq = 0
function item(title, kind, minutesAgo) {
  seq++
  return { type: 'clarify', kind, runId: `run-c${seq}`, nodeId: kind === 'review' ? 'implement' : 'clarify', iteration: 1, workflowId: 'wf-1', workflowName: '产品研发', runTitle: title, label: kind === 'review' ? '实现' : '需求澄清', done: false, requestedAt: ago(minutesAgo), updatedAt: ago(minutesAgo), tags: [] }
}
const items = [
  ['完成首次引导后没有刷新工作流', 'clarify'], ['检查发布前配置', 'review'], ['补充 API 接口说明', 'clarify'], ['修复回归测试中的不稳定用例', 'review'],
  ['整理产品需求与验收条件', 'clarify'], ['更新周报与执行记录', 'clarify'], ['安全扫描结果复核', 'review'], ['体验优化走查', 'clarify'],
].map(([t, k], i) => item(t, k, 30 + i * 7))
function turns(it) {
  if (it.runTitle === '完成首次引导后没有刷新工作流') return [
    { role: 'human', text: '完成首次引导后没有刷新工作流', at: ago(40) },
    { role: 'agent', at: ago(38), thought: '先确认现象：首次引导完成后侧栏工作流列表没有更新。',
      text: '已定位：引导向导完成后没有触发 workflowCatalogRevision，侧栏目录不会重新加载。修复方式是在向导完成回调里 bump revision。请确认：引导结束后应立即在侧栏看到新建的工作流，对吗？',
      tools: [{ title: '读取文件', status: 'completed' }, { title: '搜索代码', status: 'completed' }, { title: '运行命令', status: 'failed' }],
      parts: [
        { kind: 'thought', text: '先确认现象：首次引导完成后侧栏工作流列表没有更新。' },
        { kind: 'tool', title: '读取文件', status: 'completed' }, { kind: 'tool', title: '搜索代码', status: 'completed' }, { kind: 'tool', title: '运行命令', status: 'failed' },
        { kind: 'message', text: '已定位：引导向导完成后没有触发 workflowCatalogRevision，侧栏目录不会重新加载。修复方式是在向导完成回调里 bump revision。请确认：引导结束后应立即在侧栏看到新建的工作流，对吗？' },
      ] },
  ]
  return [{ role: 'human', text: `请处理「${it.runTitle}」`, at: ago(60) }, { role: 'agent', text: `已整理「${it.runTitle}」的现状，请确认下一步。`, at: ago(55) }]
}
const raw = path.join(OUT, 'raw-' + mode + '-' + Date.now())
const b = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN', timezoneId: 'Asia/Hong_Kong', ...(video ? { recordVideo: { dir: raw, size: { width: 1280, height: 800 } } } : {}) })
await ctx.addInitScript((t) => { localStorage.setItem('grasp-theme', t); localStorage.setItem('grasp-locale', 'zh-CN'); localStorage.setItem('grasp-onboarding-suppress', '1') }, process.env.THEME || 'light')
const unknown = new Set()
await ctx.route('**/api/**', async (route) => {
  const url = new URL(route.request().url())
  if (!url.pathname.startsWith('/api/')) return route.continue()
  const p = url.pathname, m = route.request().method()
  const page = (list) => ({ items: list, total: list.length, page: 1, pageSize: 100, hasMore: false })
  let body = page([])
  if (p === '/api/gates') { const ps = Number(url.searchParams.get('pageSize') || 20), pg = Number(url.searchParams.get('page') || 1); body = { items: items.slice((pg - 1) * ps, pg * ps), total: items.length, page: pg, pageSize: ps, hasMore: pg * ps < items.length } }
  else if (/^\/api\/runs\/[^/]+\/inbox-context$/.test(p)) {
    const it = items.find((x) => x.runId === p.split('/')[3])
    if (!it) return route.fulfill({ status: 404, json: { error: 'not pending' } })
    body = { type: 'clarify', status: 'waiting_human', nodes: [{ id: it.nodeId, type: 'agent', caps: it.kind === 'review' ? REVIEW_CAPS : CLARIFY_CAPS, label: it.label, position: { x: 0, y: 0 }, config: {} }], artifacts: [], nodeExecutions: { [it.nodeId]: [{ nodeId: it.nodeId, iteration: 1, status: 'waiting_human', outputs: {} }] }, clarify: { nodeId: it.nodeId, iteration: 1, turns: turns(it), done: false, label: it.label } }
  } else if (/^\/api\/runs\/[^/]+$/.test(p)) {
    const it = items.find((x) => x.runId === p.split('/')[3]) || items[0]
    body = { id: it.runId, workflowId: 'wf-1', workflowName: '产品研发', title: it.runTitle, status: 'waiting_human', trigger: 'manual', startedAt: ago(90), durationSec: 0, progress: 50, nodes: [{ id: it.nodeId, type: 'agent', caps: it.kind === 'review' ? REVIEW_CAPS : CLARIFY_CAPS, label: it.label, position: { x: 0, y: 0 }, config: {} }], edges: [], nodeRuns: { [it.nodeId]: { nodeId: it.nodeId, iteration: 1, status: 'waiting_human', outputs: {} } }, artifacts: [], clarifyByNode: { [it.nodeId]: { nodeId: it.nodeId, iteration: 1, turns: turns(it), done: false, label: it.label } } }
  }
  else if (p === '/api/auth/me' || p === '/api/me') body = { username: 'cocofhu', expires_at: '2099-01-01T00:00:00Z', is_admin: true }
  else if (p === '/api/workspace') body = { name: '工作区', description: '', variables: [] }
  else if (p === '/api/health') body = { status: 'ok', accepting: true }
  else if (p === '/api/settings/brand') body = { productName: 'Grasp' }
  else if (p === '/api/workflows/catalog') body = ['产品研发', '代码审查', '自动化回归', '需求澄清'].map((n, i) => ({ id: `wf-${i + 1}`, name: n, description: '', status: 'published', version: 1, updatedAt: ago(1000 + i) }))
  else if (p === '/api/workflows' || p === '/api/agents') body = []
  else if (p === '/api/workspace/pm-leader') body = { enabled: false, agentAvailable: false }
  else if (p === '/api/workspace/shared-agent-config') body = { env: {}, mcp: [], files: [], layout: {} }
  else if (p === '/api/workspace/channels') body = { items: [], freeAgents: [], secretsKeyConfigured: true }
  else if (p === '/api/workspace/run-tags') body = { tags: [] }
  else if (p === '/api/stats/dashboard') body = { totalRuns: 0, runningRuns: 0, pendingGates: 0, totalWorkflows: 0 }
  else if (/previews|preview-issues|live-sessions/.test(p)) body = { ports: [], items: [], sessions: [] }
  else unknown.add(m + ' ' + p)
  await route.fulfill({ json: body })
})
await ctx.routeWebSocket(/\/api\//, () => {})
const pg = await ctx.newPage()
pg.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 200)))
const w = (ms) => pg.waitForTimeout(ms)
const shot = async (n) => { await pg.screenshot({ path: `${OUT}/shots/${n}-${mode}.png` }); console.log('shot', n) }
const peek = () => pg.evaluate(() => window.dispatchEvent(new Event('focus')))
await pg.goto(`${BASE}/gates?run=run-c1&node=clarify`)
await pg.getByTestId('clarify-input').waitFor({ timeout: 20000 })
await w(2000); await shot('00-initial')
// 01: typing while a new approval arrives
const input = pg.getByTestId('clarify-input')
await input.click()
await pg.keyboard.type('对，引导结束后侧栏应立即出现新建的工作流，', { delay: 60 })
items.unshift(item('新需求：导出 CSV', 'clarify', 0))
await peek(); await w(1500)
await pg.keyboard.type('并保持当前选中项。', { delay: 60 })
await w(1200)
console.log('state01', await pg.evaluate(() => ({ focus: document.activeElement?.getAttribute('data-testid'), value: document.querySelector('[data-testid=clarify-input]')?.value, rows: [...document.querySelectorAll('[data-testid=nav-pending-row]')].length })))
await shot('01-typing-new-item')
// 02: clear draft and blur -> after: applies
await input.fill(''); await pg.evaluate(() => document.activeElement?.blur())
await w(2500)
console.log('state02', await pg.evaluate(() => [...document.querySelectorAll('[data-testid=nav-pending-row]')].length))
await shot('02-after-edit')
// 03: idle: one more arrives, one removed
items.unshift(item('新需求：搜索支持拼音', 'review', 0)); items.splice(items.findIndex((x) => x.runTitle === '更新周报与执行记录'), 1)
await peek(); await w(2500)
console.log('state03', await pg.evaluate(() => ({ rows: [...document.querySelectorAll('[data-testid=nav-pending-row]')].map((r) => r.textContent.trim()).join(' | '), active: document.querySelector('[data-testid=nav-pending-row][aria-current=true]')?.textContent.trim() })))
await shot('03-idle-new-and-removed')
await w(1500)
console.log('unknown api', [...unknown].join(', '))
await ctx.close(); await b.close()
if (video) { const f = fs.readdirSync(raw)[0]; fs.renameSync(path.join(raw, f), `${OUT}/video/gates-auto-refresh-${mode}.webm`); fs.rmSync(raw, { recursive: true }); console.log('video saved') }
