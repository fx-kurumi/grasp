// Real entry (index.html + src/main.ts) with page.route API mocks.
const { chromium } = require('/home/ubuntu/code/grasp-pr-notif/web/node_modules/playwright')
const runs = require('./mock-runs.js')
const stats = require('./mock-token-stats.js')
const statsOld = require('./mock-token-stats-old.js')
const BASE = process.env.BASE || 'http://127.0.0.1:5293'
const unmocked = new Set()
async function openApp(browser, { width = 1280, height = 800, sidebarHidden = false, theme = process.env.THEME || 'light', path = '/runs', extraRoutes, old = false, base, video } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'zh-CN', deviceScaleFactor: 1, ...(video ? { recordVideo: { dir: video, size: { width, height } } } : {}) })
  await ctx.addInitScript(([h, th]) => {
    localStorage.setItem('grasp-sidebar-hidden', h ? 'true' : 'false')
    localStorage.setItem('grasp-theme', th)
    localStorage.setItem('grasp-locale', 'zh-CN')
  }, [sidebarHidden, theme])
  await ctx.route('**/api/**', async (route) => {
    const u = new URL(route.request().url())
    const p = u.pathname
    if (!p.startsWith('/api/')) return route.continue()
    if (extraRoutes) { const r = await extraRoutes(p, u, route); if (r) return }
    if (p === '/api/auth/me') return route.fulfill({ json: { username: 'cocofhu', expires_at: '2099-01-01T00:00:00Z', is_admin: true } })
    if (p === '/api/runs') {
      const q = u.searchParams; let items = runs.items
      const st = (q.get('status') || '').split(',').filter(Boolean); if (st.length) items = items.filter((r) => st.includes(r.status))
      if (q.get('wf')) items = items.filter((r) => r.workflowId === q.get('wf'))
      if (q.get('tag')) items = items.filter((r) => (r.tags || []).includes(q.get('tag')))
      const filtered = items.length !== runs.items.length
      return route.fulfill({ json: { ...runs, items: items.slice(0, Number(q.get('pageSize') || 20)), total: filtered ? items.length : runs.total } })
    }
    if (p === '/api/workflows/catalog') return route.fulfill({ json: ['产品研发','代码审查','自动化回归','需求澄清','数据分析','发布检查'].map((name, i) => ({ id: `wf-${i + 1}`, name, description: '', status: 'published', version: 3 + (i % 3), updatedAt: '2026-10-18T08:00:00Z', showOnHome: true })) })
    if (p === '/api/workspace') return route.fulfill({ json: { name: 'Grasp', description: '', variables: [], workflowCount: 8 } })
    if (p === '/api/stats/token') return route.fulfill({ json: old ? statsOld : stats })
    if (old && p === '/api/projects') return route.fulfill({ json: [{ id: 'p-1', name: 'Grasp 平台', description: '', variables: [], workflowCount: 8 }, { id: 'p-2', name: '移动端', description: '', variables: [] }, { id: 'p-3', name: '数据中台', description: '', variables: [] }, { id: 'p-4', name: '官网', description: '', variables: [] }] })
    if (p === '/api/workflows') return route.fulfill({ json: [...new Set(runs.items.map((r) => r.workflowId))].map((id) => { const r = runs.items.find((x) => x.workflowId === id); return { id, name: r.workflowName, version: r.workflowVersion, status: 'published', nodes: [], edges: [], updatedAt: '2026-10-18T08:00:00Z' } }) })
    if (p === '/api/workspace/run-tags') return route.fulfill({ json: { tags: ['研发', '测试', '回归', '发布', '体验', '安全'] } })
    unmocked.add(p)
    return route.fulfill({ json: {} })
  })
  await ctx.route('**/ws/**', (r) => r.abort())
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text().slice(0, 300)))
  page.on('pageerror', (e) => console.log('pageerror:', String(e).slice(0, 300)))
  await page.goto((base || BASE) + path)
  return { ctx, page }
}
async function fullHeight(page) {
  return page.evaluate(() => { let m = 0; for (const el of document.querySelectorAll('#app *')) { const s = getComputedStyle(el); if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2) m = Math.max(m, el.scrollHeight - el.clientHeight) } return m })
}
module.exports = { chromium, openApp, fullHeight, unmocked, runs, stats }
