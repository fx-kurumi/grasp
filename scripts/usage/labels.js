// node labels.js outDir w1:text1 w2:text2 ...  -> outDir/label-<i>.png
const { chromium } = require('./app.js')
const [out, ...items] = process.argv.slice(2)
;(async () => {
  const b = await chromium.launch(); const p = await b.newPage()
  for (const [i, it] of items.entries()) {
    const k = it.indexOf(':'); const w = +it.slice(0, k); const t = it.slice(k + 1)
    await p.setViewportSize({ width: w, height: 56 })
    await p.setContent(`<body style="margin:0;background:#fff;font:600 26px 'Noto Sans CJK SC','Noto Serif CJK SC',sans-serif;color:#18181b;padding:12px 16px">${t}</body>`)
    await p.screenshot({ path: `${out}/label-${i}.png` })
  }
  await b.close()
})()
