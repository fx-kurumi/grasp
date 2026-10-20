// Real-entry mock: index.html + src/main.ts from vite; /api/** via page.route, WS via routeWebSocket.
export const state = { gates: [], run: null, ctx: null, sandbox: null, sockets: [], log: [], unhandled: new Set() }
const now = () => new Date().toISOString()
export const WF = { id: 'wf-1', name: '默认工作流', description: '从需求到交付', status: 'published', version: 1, publishedVersion: 1, updatedAt: '2026-10-20T10:00:00Z', needsRepo: false, showOnHome: true, notifyPolicy: { mode: 'inherit', events: [] }, nodes: [{ id: 'input', type: 'input', label: '输入', config: {} }, { id: 'ap', type: 'clarify', label: '澄清', config: {} }, { id: 'end', type: 'end', label: '完成', config: {} }], edges: [] }
const page20 = (items) => ({ items, total: items.length, page: 1, pageSize: 20 })
export function handler(path, method) {
  if (path === '/auth/me') return { username: 'cocofhu', expires_at: '2099-01-01T00:00:00Z', is_admin: true }
  if (path === '/health') return { status: 'ok', accepting: true }
  if (path === '/settings/brand') return { product_name: 'Grasp', home_subtitle: '让工作流协调每一次交付' }
  if (path === '/settings') return { items: [] }
  if (path === '/gates') return page20(state.gates)
  if (path === '/notifications') return { items: [], total: 0, unreadCount: 0, page: 1, pageSize: 20 }
  if (/^\/runs\/[^/]+\/nodes\/[^/]+\/sandbox$/.test(path)) return state.sandbox ? state.sandbox : { __status: 404, error: 'not found' }
  if (/^\/runs\/[^/]+$/.test(path) && state.run) return state.run
  if (path === '/runs') return page20(state.run ? [state.run] : [])
  if (path === '/workflows' || path === '/workflows/catalog') return [WF]
  if (path === '/agents') return [{ name: 'manager', description: '协调团队与执行工作流', acpBackend: 'opencode', configRoot: '/config', workspaceDir: '/workspace', env: {}, mcp: [], capabilities: { outlets: [] } }]
  if (path === '/sandboxes' || path === '/agent-teams/templates') return []
  if (path === '/stats/platform-status') return { cumulativeTokens: 182340, todayTokens: 5210, runningCount: 1, queuedCount: 0, asOf: now() }
  if (/\/inbox-context$/.test(path)) return state.ctx || { items: [] }
  if (path === '/workspace') return { name: '工作区', description: '', variables: [], pmLeaderEnabled: false, notifyPolicy: { enabled: false, defaultEvents: [], channelIds: [] } }
  if (path === '/workspace/pm-leader') return { enabled: false, agentAvailable: false, agentConfigRef: '', enabledMcps: [] }
  if (path === '/stats/dashboard') return { total: 1, running: 1, waitingHuman: 0, completed: 0, failed: 0, totalWorkflows: 1 }
  state.unhandled.add(method + ' ' + path)
  return path.endsWith('s') ? [] : {}
}
export async function install(page) {
  await page.route((u) => u.pathname.startsWith('/api/'), async (route) => {
    const req = route.request(); const url = new URL(req.url())
    const path = url.pathname.replace(/^\/api/, '')
    state.log.push(req.method() + ' ' + path + url.search)
    const data = handler(path, req.method())
    const status = data && data.__status ? data.__status : 200
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  })
  await page.routeWebSocket((u) => u.pathname.startsWith('/api/'), (ws) => { state.sockets.push(ws); ws.onMessage(() => {}) })
}
export function wsSend(m) { for (const ws of state.sockets) { try { ws.send(JSON.stringify(m)) } catch {} } }
