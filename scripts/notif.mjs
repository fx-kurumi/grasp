// node shot10.mjs <label> <light|dark> <read|mixed> <outdir> [query]
// Real index.html + src/main.ts on :5183, /api mocked via page.route. Opens the sidebar bell popover.
import path from 'node:path'
import { createRequire } from 'node:module'
import { install, state } from './notif-mock.mjs'
const require = createRequire('/home/ubuntu/code/grasp-pr-notif/web/package.json')
const { chromium } = require('playwright')
const [label, theme, data, out, query = ''] = process.argv.slice(2)
const ago = (m) => new Date(Date.now() - m * 60000).toISOString()
const n = (runId, status, title, finishedMin, unread) => ({ runId, status, title, titleNeutral: false, workflowName: '默认工作流', startedAt: ago(finishedMin + 6), finishedApprox: ago(finishedMin), unread, beforeBaseline: false })
state.notifications = data === 'read'
  ? [n('run-7f3a', 'completed', '完成首次引导后没有刷新工作流', 0.2, false), n('run-6c21', 'completed', '补充 API 接口说明', 42, false), n('run-5b90', 'completed', '检查发布前配置', 180, false)]
  : [n('run-7f3a', 'completed', '完成首次引导后没有刷新工作流', 0.2, true), n('run-6d02', 'failed', '修复回归测试中的不稳定用例', 12, true), n('run-6c21', 'completed', '补充 API 接口说明', 42, false), n('run-5b90', 'completed', '检查发布前配置', 180, false), n('run-4a11', 'completed', '更新周报与执行记录', 1500, false)]
state.unread = state.notifications.filter((x) => x.unread).length
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: 'zh-CN' })
await ctx.addInitScript((t) => { localStorage.setItem('grasp-theme', t); localStorage.setItem('grasp-onboarding-suppress', '1') }, theme)
const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message))
await install(p)
await p.goto(process.env.BASE + '/runs' + query)
await p.getByTestId('run-notifications-bell').first().waitFor()
await p.waitForTimeout(1200)
await p.getByTestId('run-notifications-bell').first().click()
const panel = p.getByTestId('run-notifications-panel')
await panel.waitFor(); await p.waitForTimeout(500)
const bb = await panel.boundingBox()
const base = path.join(out, `${label}-${theme}-${data}`)
await p.screenshot({ path: base + '-full.png' })
await p.screenshot({ path: base + '.png', clip: { x: Math.max(0, bb.x - 20), y: Math.max(0, bb.y - 20), width: bb.width + 40, height: Math.min(800 - Math.max(0, bb.y - 20), bb.height + 80) } })
console.log('ok', label, theme, data, JSON.stringify(bb), [...state.unhandled].join(','))
await b.close()
