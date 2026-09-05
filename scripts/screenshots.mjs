// Generuje zrzuty ekranu do README. Interfejs przelaczony na angielski,
// dane wypelnione realistycznym bukietem. Uruchomienie:
//   FLORIST_CHROME=/sciezka/do/chrome node scripts/screenshots.mjs

import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appUrl = pathToFileURL(join(root, 'app', 'index.html')).href
const outDir = join(root, 'assets', 'screenshots')
mkdirSync(outDir, { recursive: true })

// Realistyczny bukiet: ceny hurtowe w PLN za sztuke
const BOUQUET = [
  ['Róża', 4.5, 12],
  ['Piwonia', 9, 5],
  ['Eustoma', 6, 6],
  ['Eukaliptus', 4, 7],
  ['Gipsówka', 4, 3],
  ['Papier', 3.5, 2],
  ['Wstążka', 2.5, 1],
]

// Kilka zapisanych wycen, zeby Historia i Lista zakupow nie byly puste
const HISTORY = [
  { name: 'Wedding bouquet - Kowalscy', days: 2, rows: [['Róża', 4.5, 18], ['Eustoma', 6, 8], ['Eukaliptus', 4, 9], ['Wstążka', 2.5, 1]], marza: 110 },
  { name: 'Mother\'s Day - flower box', days: 5, rows: [['Piwonia', 9, 7], ['Jaskier', 5, 6], ['Gipsówka', 4, 4], ['Pojemnik', 12, 1]], marza: 100 },
  { name: 'Reception centrepiece', days: 9, rows: [['Hortensja', 12, 5], ['Ruskus', 3, 8], ['Gąbka florystyczna', 6, 2]], marza: 95 },
  { name: 'Anniversary - roses only', days: 14, rows: [['Róża', 4.5, 25], ['Papier', 3.5, 2], ['Wstążka', 2.5, 1]], marza: 120 },
]

const seed = data => {
  const quotes = data.map((q, i) => {
    const rows = q.rows.map(([name, price, qty], j) => ({ id: 1000 + i * 10 + j, name, price, qty }))
    const cost = rows.reduce((a, r) => a + r.price * r.qty, 0)
    const total = Math.round(cost * (1 + q.marza / 100) / 5) * 5
    return {
      id: Date.now() - i * 86400000, name: q.name, total, cost: Math.round(cost),
      date: new Date(Date.now() - q.days * 86400000).toISOString(),
      rows, marza: q.marza, roundOn: true, season: 'standard',
    }
  })
  localStorage.setItem('floraklos_wyceny', JSON.stringify(quotes))
  localStorage.setItem('floraklos_lang', 'en')
}

const shot = async (page, name, opts = {}) => {
  await page.waitForTimeout(450)
  await page.screenshot({ path: join(outDir, name + '.png'), ...opts })
  console.log('  ->', name + '.png')
}

const browser = await chromium.launch(process.env.FLORIST_CHROME ? { executablePath: process.env.FLORIST_CHROME } : {})

// ---------- desktop ----------
const page = await browser.newPage({ viewport: { width: 1340, height: 1160 }, deviceScaleFactor: 2 })
await page.addInitScript(seed, HISTORY)
await page.goto(appUrl)
await page.waitForFunction(() => typeof window.go === 'function')

await page.evaluate(bouquet => {
  rows.length = 0
  bouquet.forEach(([name, price, qty]) => addRow(name, price, qty))
  setMarza(105)
  calc()
}, BOUQUET)

await shot(page, 'pricing')

// sama karta dla klienta, bez przyciemnionego tla
await page.evaluate(() => openCard())
await page.waitForTimeout(400)
await page.locator('#quoteCard').screenshot({ path: join(outDir, 'quote-card.png') })
console.log('  -> quote-card.png')
await page.evaluate(() => closeCard())

await page.evaluate(() => go('ai'))
await page.evaluate(() => {
  // panel rozpoznanych skladnikow - prawdziwy interfejs, bez podszywania sie pod wynik modelu
  detectedItems = [
    { count: 12, name: 'Róża', pct: 94 },
    { count: 5, name: 'Piwonia', pct: 88 },
    { count: 7, name: 'Eukaliptus', pct: 91 },
    { count: 3, name: 'Gipsówka', pct: 76 },
  ]
  renderDetectedUI()
  document.getElementById('aiDesc').value = 'romantic bouquet with roses and eucalyptus in a powdery palette'
})
await page.waitForTimeout(300)
await page.locator('#detected').screenshot({ path: join(outDir, 'ai-detected.png') })
console.log('  -> ai-detected.png')

await page.evaluate(() => go('zakupy'))
await shot(page, 'shopping-list', { clip: { x: 0, y: 0, width: 1340, height: 900 } })

await page.evaluate(() => go('historia'))
await shot(page, 'history', { clip: { x: 0, y: 0, width: 1340, height: 900 } })

await page.close()

// ---------- mobile ----------
const phone = await browser.newPage({ viewport: { width: 414, height: 860 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await phone.addInitScript(seed, HISTORY)
await phone.goto(appUrl)
await phone.waitForFunction(() => typeof window.go === 'function')
await phone.evaluate(bouquet => {
  rows.length = 0
  bouquet.forEach(([name, price, qty]) => addRow(name, price, qty))
  setMarza(105)
  calc()
}, BOUQUET)
await shot(phone, 'mobile-pricing')
await phone.evaluate(() => go('zakupy'))
await shot(phone, 'mobile-shopping')
await phone.close()

await browser.close()
console.log('gotowe')
