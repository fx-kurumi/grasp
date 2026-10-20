// node vid.js <out.webm> : env BASE THEME. /runs hover + more menu → /stats scroll + filter popover.
const fs = require('fs'), path = require('path')
const { chromium, openApp } = require('./app.js')
const out = process.argv[2]
;(async () => {
  const b = await chromium.launch()
  const raw = out + '.raw'; fs.mkdirSync(raw, { recursive: true })
  const { ctx, page } = await openApp(b, { width: 1280, path: '/runs', video: raw })
  const W = (ms) => page.waitForTimeout(ms)
  await page.locator('[data-testid="run-list-fade-desktop"]').first().waitFor({ timeout: 30000 }); await W(1500)
  const rows = page.locator('[data-testid="run-list-fade-desktop"] tbody tr')
  for (const i of [1, 2, 3]) { await rows.nth(i).hover(); await W(700) }
  const more = page.locator('[data-testid="run-more-btn"]')
  if (await more.count()) { await rows.nth(3).locator('[data-testid="run-more-btn"]').click().catch(() => {}); await W(1200); await page.keyboard.press('Escape'); await W(500) }
  const filt = page.locator('[data-testid="run-filter-btn"]'); if (await filt.count()) { await filt.click(); await W(1200); await page.keyboard.press('Escape'); await W(500) }
  await page.goto(process.env.BASE + '/stats'); await page.locator('[data-testid="token-analytics-kpis"]').waitFor({ timeout: 30000 }); await W(1800)
  const fb = page.getByTestId('token-analytics-filter-btn'); if (await fb.count()) { await fb.click(); await W(1500); await page.mouse.click(1270, 790); await W(500) }
  await page.mouse.move(800, 500)
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 350); await W(450) }
  await W(1000)
  await ctx.close(); await b.close()
  fs.renameSync(path.join(raw, fs.readdirSync(raw)[0]), out); fs.rmSync(raw, { recursive: true })
})().catch((e) => { console.error(e); process.exit(1) })
