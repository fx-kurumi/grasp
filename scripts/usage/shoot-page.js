// node shoot-page.js <path> <outPrefix> [widths=1280,1440] [hidden=0]
const { chromium, openApp, fullHeight } = require('./app.js')
const [path, prefix, widthsArg = '1280,1440', hidden = '0'] = process.argv.slice(2)
const ready = path.startsWith('/stats') ? '[data-testid="token-analytics-kpis"]' : '[data-testid="run-list-fade-desktop"]'
;(async () => {
  const b = await chromium.launch()
  for (const width of widthsArg.split(',').map(Number)) {
    const { ctx, page } = await openApp(b, { width, path, sidebarHidden: hidden === '1', ...(process.env.OLD ? { old: true, base: 'http://127.0.0.1:5294' } : {}) })
    await page.locator(ready).first().waitFor({ timeout: 30000 })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${prefix}-${width}-top.png` })
    const extra = await fullHeight(page)
    await page.setViewportSize({ width, height: 800 + extra })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${prefix}-${width}-full.png`, fullPage: true })
    await ctx.close()
  }
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
