// node shoot-usage-plan.js <outDir> <tag> [tabs]
const { chromium, openApp, fullHeight } = require('./app.js')
const [out, tag, tabsArg] = process.argv.slice(2)
require('fs').mkdirSync(out, { recursive: true })
const ready = '[data-testid="token-analytics-kpis"]'
async function full(page, width, file) {
  const extra = await fullHeight(page)
  await page.setViewportSize({ width, height: 800 + extra })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: file, fullPage: true })
  await page.setViewportSize({ width, height: 800 })
  await page.waitForTimeout(500)
}
;(async () => {
  const b = await chromium.launch()
  for (const width of [1280, 1440]) {
    const { ctx, page } = await openApp(b, { width, path: '/stats' })
    await page.locator(ready).waitFor({ timeout: 30000 })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${out}/${tag}-${width}-top.png` })
    await full(page, width, `${out}/${tag}-${width}-full.png`)
    if (tabsArg && width === 1280) {
      for (const tab of tabsArg.split(',')) {
        await page.getByRole('tab', { name: tab }).first().click().catch(async () => { await page.getByText(tab, { exact: true }).first().click() })
        await page.waitForTimeout(1200)
        await full(page, width, `${out}/${tag}-${width}-tab-${tab}-full.png`)
      }
    }
    await ctx.close()
  }
  // popover open + filtered (1280)
  const { ctx, page } = await openApp(b, { width: 1280, path: '/stats' })
  await page.locator(ready).waitFor({ timeout: 30000 })
  await page.waitForTimeout(1200)
  const btn = page.getByTestId('token-analytics-filter-btn')
  if (await btn.count()) {
    await btn.click(); await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}/${tag}-1280-filter-open.png`, clip: { x: 300, y: 0, width: 980, height: 560 } })
    for (const [key, label] of [['modelKey', 'gpt-5'], ['status', '失败']]) {
      await page.getByTestId(`token-analytics-fx-${key}`).click(); await page.waitForTimeout(300)
      await page.getByRole('option', { name: label, exact: true }).first().click(); await page.waitForTimeout(300)
    }
    await page.mouse.click(1270, 790); await page.waitForTimeout(1500)
    await page.screenshot({ path: `${out}/${tag}-1280-filtered.png`, clip: { x: 300, y: 0, width: 980, height: 560 } })
  }
  await ctx.close()
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
