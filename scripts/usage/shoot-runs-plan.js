// node shoot-runs-plan.js <outDir> <plan>
const { chromium, openApp, fullHeight } = require('./app.js')
const [out, plan] = process.argv.slice(2)
require('fs').mkdirSync(out, { recursive: true })
;(async () => {
  const b = await chromium.launch()
  for (const width of [1280, 1440]) {
    for (const hidden of [false, true]) {
      if (hidden && width === 1440) continue
      const { ctx, page } = await openApp(b, { width, path: '/runs', sidebarHidden: hidden })
      await page.locator('[data-testid="run-list-fade-desktop"]').waitFor({ timeout: 30000 })
      await page.waitForTimeout(1500)
      const tag = `${plan}-${width}${hidden ? '-sidebar-hidden' : ''}`
      await page.screenshot({ path: `${out}/${tag}-top.png` })
      if (!hidden) {
        // hover + menu states on 1280 only
        if (width === 1280) {
          const row = page.locator('[data-testid="run-list-fade-desktop"] tbody tr').nth(1)
          await row.hover(); await page.waitForTimeout(400)
          const bb = await row.boundingBox()
          const clip = { x: Math.max(0, bb.x - 8), y: Math.max(0, bb.y - 60), width: Math.min(width - bb.x + 8, bb.width + 16), height: bb.height + 200 }
          await page.screenshot({ path: `${out}/${tag}-hover.png`, clip })
          const more = row.locator('[data-testid="run-more-btn"], [data-testid="cancel-run-btn"], [data-testid="delete-run-btn"]').first()
          if (await page.locator('[data-testid="run-more-btn"]').count()) {
            await more.click(); await page.waitForTimeout(400)
            await page.screenshot({ path: `${out}/${tag}-menu.png`, clip })
            await page.mouse.click(5, 5)
          }
          const filt = page.locator('[data-testid="run-filter-btn"]')
          if (await filt.count()) {
            await filt.click(); await page.waitForTimeout(500)
            await page.screenshot({ path: `${out}/${tag}-filter-open.png`, clip: { x: 300, y: 0, width: width - 300, height: 520 } })
            await page.mouse.click(5, 790); await page.waitForTimeout(300)
          }
        }
        const extra = await fullHeight(page)
        await page.setViewportSize({ width, height: 800 + extra })
        await page.waitForTimeout(1200)
        await page.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true })
      }
      await ctx.close()
    }
  }
  // selected-filter state (1280)
  const { ctx, page } = await openApp(b, { width: 1280, path: '/runs?status=completed&tag=' + encodeURIComponent('研发') })
  await page.locator('[data-testid="run-list-fade-desktop"]').waitFor({ timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${out}/${plan}-1280-filtered.png` })
  await ctx.close()
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
