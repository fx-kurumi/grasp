// node rec.mjs <before|after> [video] [dark]
// Real entry (index.html + src/main.ts) via vite.rec.config.ts; Playwright mocks /api + WS.
// human_gate cold: reactSessionAlive=false → canReactRevise=false.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('/home/ubuntu/code/grasp-pr-notif/web/package.json')
const { chromium } = require('playwright')
const args = process.argv.slice(2)
const mode = args[0] || 'after', video = args.includes('video'), dark = args.includes('dark'), only = args.find((a) => a.startsWith('scene='))?.slice(6)
const BASE = process.env.BASE
const OUT = process.env.OUT; fs.mkdirSync(OUT + '/shots', { recursive: true }); fs.mkdirSync(OUT + '/video', { recursive: true })
const NOW = Date.now()
const ago = (m) => new Date(NOW - m * 60000).toISOString()
let seq = 0
function gate(title, m) {
  seq++
  return { type: 'gate', nodeType: 'human_gate', runId: `run-g${seq}`, nodeId: 'review', iteration: 1, workflowId: 'wf-1', workflowName: '产品研发', runTitle: title,
    title: '人工评审', bodyMd: `## 交付摘要\n\n请审阅「${title}」的交付内容：\n\n- 已完成接口变更与单元测试\n- 新增导出 CSV 入口，支持筛选条件\n- 回归测试 42/42 通过\n\n确认无误后点「通过」，需要修改请填写评审意见后「打回」。`,
    actions: [{ id: 'approve', label: '通过' }, { id: 'reject', label: '打回', requireForm: true }],
    form: [{ key: 'comment', label: '评审意见' }], reactSessionAlive: false, requestedAt: ago(m), updatedAt: ago(m) }
}
const gates = ['新需求：导出 CSV', '检查发布前配置', '补充 API 接口说明', '安全扫描结果复核'].map((t, i) => gate(t, 20 + i * 9))
const resolved = []
const raw = path.join(OUT, 'raw-' + mode + '-' + Date.now())
const b = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN', colorScheme: dark ? 'dark' : 'light', ...(video ? { recordVideo: { dir: raw, size: { width: 1280, height: 800 } } } : {}) })
await ctx.addInitScript((d) => { localStorage.setItem('grasp-theme', d ? 'dark' : 'light'); localStorage.setItem('grasp-locale', 'zh-CN'); localStorage.setItem('grasp-onboarding-suppress', '1') }, dark)
const unknown = new Set()
await ctx.route('**/api/**', async (route) => {
  const url = new URL(route.request().url())
  if (!url.pathname.startsWith('/api/')) return route.continue()
  const p = url.pathname, m = route.request().method()
  const page = (list) => ({ items: list, total: list.length, page: 1, pageSize: 100, hasMore: false })
  let body = page([])
  const runOf = (id) => gates.find((g) => g.runId === id)
  if (p === '/api/gates') body = { items: gates, total: gates.length, page: 1, pageSize: 20, hasMore: false }
  else if (/^\/api\/runs\/[^/]+\/inbox-context$/.test(p)) {
    const g = runOf(p.split('/')[3])
    if (!g) return route.fulfill({ status: 404, json: { error: 'not pending' } })
    body = { type: 'gate', status: 'waiting_human', nodes: [{ id: 'review', type: 'human_gate', label: '人工评审', position: { x: 0, y: 0 }, config: {} }], artifacts: [], nodeExecutions: { review: [{ nodeId: 'review', iteration: 1, status: 'waiting_human', outputs: {} }] }, gate: g }
  } else if (/^\/api\/runs\/[^/]+\/gates\/[^/]+\/resume$/.test(p) || (/\/resume/.test(p) && m === 'POST')) {
    const post = route.request().postDataJSON?.() ?? null
    resolved.push({ p, post }); console.log('RESUME', p, JSON.stringify(post))
    await new Promise((r) => setTimeout(r, 900))
    const id = p.split('/')[3]; const i = gates.findIndex((g) => g.runId === id); if (i >= 0) gates.splice(i, 1)
    body = { ok: true }
  } else if (/^\/api\/runs\/[^/]+$/.test(p)) {
    const g = runOf(p.split('/')[3]) || gates[0]
    body = { id: g?.runId, workflowId: 'wf-1', workflowName: '产品研发', title: g?.runTitle, status: 'waiting_human', trigger: 'manual', startedAt: ago(90), durationSec: 0, progress: 60, nodes: [{ id: 'review', type: 'human_gate', label: '人工评审', position: { x: 0, y: 0 }, config: {} }], edges: [], nodeRuns: { review: { nodeId: 'review', iteration: 1, status: 'waiting_human', outputs: {} } }, artifacts: [] }
  }
  else if (p === '/api/auth/me' || p === '/api/me') body = { username: 'cocofhu', expires_at: '2099-01-01T00:00:00Z', is_admin: true }
  else if (p === '/api/workspace') body = { name: '工作区', description: '', variables: [] }
  else if (p === '/api/health') body = { status: 'ok', accepting: true }
  else if (p === '/api/settings/brand') body = { productName: 'Grasp' }
  else if (p === '/api/workflows/catalog') body = ['产品研发', '代码审查', '自动化回归'].map((n, i) => ({ id: `wf-${i + 1}`, name: n, description: '', status: 'published', version: 1, updatedAt: ago(1000 + i) }))
  else if (p === '/api/workflows' || p === '/api/agents') body = []
  else if (p === '/api/workspace/pm-leader') body = { enabled: false, agentAvailable: false }
  else if (p === '/api/workspace/run-tags') body = { tags: [] }
  else if (/share/.test(p)) body = { status: 'none' }
  else if (/previews|preview-issues|live-sessions/.test(p)) body = { ports: [], items: [], sessions: [] }
  else unknown.add(m + ' ' + p)
  await route.fulfill({ json: body })
})
await ctx.routeWebSocket(/\/api\//, () => {})
const pg = await ctx.newPage()
pg.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 200)))
const w = (ms) => pg.waitForTimeout(ms)
const tag = dark ? `${mode}-dark` : mode
const shot = async (n) => { await pg.screenshot({ path: `${OUT}/shots/${n}-${tag}.png` }); console.log('shot', n) }
await pg.goto(`${BASE}/gates?run=run-g1&node=review`)
await pg.getByTestId('review-composer-pass').first().waitFor({ timeout: 20000 })
await w(1800); await shot('00-initial')
if (only === 'initial') { await ctx.close(); await b.close(); process.exit(0) }
// 01 reject needs comment: type review comment
const ta = pg.locator('textarea').last()
await ta.click()
await pg.keyboard.type('导出的 CSV 缺少表头说明，筛选条件为空时应导出全部数据，请补充后再提交。', { delay: 45 })
await w(800); await shot('01-comment-filled')
// 02 cold human_gate exposes one exit (确认并流转, main visibleActions); comment rides in form.comment
const reject = pg.getByTestId('review-composer-pass').last()
await reject.hover(); await w(500); await shot('02-confirm-with-comment-hover')
await reject.click(); await w(120); await shot('03-confirming')
await w(2500); await shot('04-after-confirm-next-gate')
// 05 next gate: approve
const pass = pg.getByRole('button', { name: /通过|确认并流转/ }).last()
await pass.waitFor({ timeout: 10000 }); await pass.hover(); await w(600); await shot('05-confirm-no-comment-hover')
await pass.click(); await w(120); await shot('06-confirming')
await w(2500); await shot('07-after-confirm')
console.log('resolved', JSON.stringify(resolved))
console.log('unknown api', [...unknown].join(', '))
await ctx.close(); await b.close()
if (video) { const f = fs.readdirSync(raw)[0]; fs.renameSync(path.join(raw, f), `${OUT}/video/gate-cold-${tag}.webm`); fs.rmSync(raw, { recursive: true }); console.log('video saved') }
