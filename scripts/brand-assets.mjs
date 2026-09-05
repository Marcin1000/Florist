// Generuje grafiki marki do README: banner i diagram przeplywu, w wariancie jasnym
// i ciemnym. Czcionki i logo sa wyciagane wprost z app/index.html, zeby grafiki nie
// rozjechaly sie z aplikacja. Uruchomienie:
//   FLORIST_CHROME=/sciezka/do/chrome node scripts/brand-assets.mjs

import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'assets', 'brand')
mkdirSync(outDir, { recursive: true })

const appHtml = readFileSync(join(root, 'app', 'index.html'), 'utf8')

// pierwszy blok <style> w aplikacji to same @font-face z czcionkami w base64
function extractFontCss() {
  const start = appHtml.indexOf('<style>')
  const end = appHtml.indexOf('</style>', start)
  const css = appHtml.slice(start + '<style>'.length, end)
  if (!css.includes('@font-face')) throw new Error('nie znaleziono @font-face w app/index.html')
  return css
}

// znak graficzny z naglowka aplikacji
function extractLogoSvg() {
  const anchor = appHtml.indexOf('<a class="brand"')
  const start = appHtml.indexOf('<svg', anchor)
  const end = appHtml.indexOf('</svg>', start) + '</svg>'.length
  return appHtml.slice(start, end)
}

const FONTS = extractFontCss()
const LOGO = extractLogoSvg()

const THEMES = {
  light: {
    bg: '#F4F2EB', panel: '#FCFBF7', line: '#D9D4C6', lineSoft: '#E3DFD2',
    ink: '#2A332B', ink2: '#5C6358', ink3: '#8A8F82',
    accent: '#8E7AA8', accentDeep: '#6F5B8C', accentSoft: '#ECE6F2',
    sage: '#7E8B6C', rose: '#C89A8F',
    glow1: 'rgba(126,139,108,.10)', glow2: 'rgba(200,154,143,.10)',
  },
  dark: {
    bg: '#16181A', panel: '#1D2023', line: '#2E3338', lineSoft: '#272B2F',
    ink: '#ECEAE3', ink2: '#A8AEA6', ink3: '#7C837E',
    accent: '#B9A6D4', accentDeep: '#C9BAE0', accentSoft: '#2A2436',
    sage: '#9FB089', rose: '#D9AFA3',
    glow1: 'rgba(159,176,137,.10)', glow2: 'rgba(217,175,163,.09)',
  },
}

const shell = (t, body, extraCss = '') => `
<style>
${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${t.bg};color:${t.ink};font-family:'Jost',system-ui,sans-serif;font-weight:300;
  -webkit-font-smoothing:antialiased}
.serif{font-family:'Cormorant Garamond',Georgia,serif}
.stage{position:relative;overflow:hidden;background:${t.bg}}
.stage::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(1100px 560px at 84% -20%,${t.glow1},transparent 60%),
             radial-gradient(820px 460px at -10% 120%,${t.glow2},transparent 55%)}
.eyebrow{font-size:12px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:${t.ink3}}
${extraCss}
</style>
${body}`

// ---------------------------------------------------------------- banner
const banner = t => shell(t, `
<div class="stage" style="width:1280px;height:420px;display:flex;align-items:center;justify-content:center">
  <div style="position:relative;text-align:center;padding:0 60px">
    <div style="display:flex;align-items:center;justify-content:center;gap:22px;margin-bottom:26px">
      <span style="display:block;width:82px;height:82px">${LOGO}</span>
      <span class="serif" style="font-size:82px;font-weight:400;line-height:1;letter-spacing:.005em">Florist</span>
    </div>
    <div class="serif" style="font-size:31px;font-weight:300;font-style:italic;color:${t.accentDeep};margin-bottom:20px">
      AI-assisted pricing and workflow tool for florists
    </div>
    <div style="font-size:16.5px;color:${t.ink2};letter-spacing:.02em">
      Price bouquets, prepare quotes and manage ingredient costs faster
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:34px">
      ${['Windows', 'macOS', 'Android', 'iOS'].map(p => `
        <span style="border:1px solid ${t.line};border-radius:100px;padding:7px 17px;font-size:12px;
          letter-spacing:.14em;text-transform:uppercase;color:${t.ink2}">${p}</span>`).join('')}
    </div>
  </div>
</div>`, `
svg{width:100%;height:100%;overflow:visible}
:root{--accent:${t.accent};--accent-deep:${t.accentDeep};--accent-soft:${t.accentSoft}}`)

// ---------------------------------------------------------------- diagram przeplywu
const STEPS = [
  ['Bouquet', 'what the customer wants'],
  ['Ingredients', 'stems, greenery, wrapping'],
  ['Costs', 'purchase price per unit'],
  ['Margin', 'and seasonal multiplier'],
  ['AI assistance', 'recognition and proposals'],
  ['Quote', 'priced, saved, shareable'],
]

const flow = t => shell(t, `
<div class="stage" style="width:1280px;height:250px;display:flex;align-items:center;justify-content:center">
  <div style="position:relative;display:flex;align-items:stretch;gap:0">
    ${STEPS.map(([name, note], i) => `
      <div style="display:flex;align-items:center">
        <div style="width:172px;text-align:center;padding:0 6px">
          <div style="width:34px;height:34px;margin:0 auto 16px;border-radius:50%;
            border:1px solid ${i === 4 ? t.accent : t.line};
            background:${i === 4 ? t.accentSoft : t.panel};
            display:flex;align-items:center;justify-content:center;
            font-size:12px;letter-spacing:.04em;color:${i === 4 ? t.accentDeep : t.ink3}">${i + 1}</div>
          <div class="serif" style="font-size:21px;line-height:1.15;margin-bottom:9px;
            color:${i === 4 ? t.accentDeep : t.ink}">${name}</div>
          <div style="font-size:11.5px;line-height:1.5;color:${t.ink3};letter-spacing:.01em">${note}</div>
        </div>
        ${i < STEPS.length - 1 ? `
          <svg width="42" height="12" viewBox="0 0 42 12" style="flex:none;margin-bottom:52px">
            <line x1="2" y1="6" x2="30" y2="6" stroke="${t.line}" stroke-width="1"/>
            <path d="M30,2.5 L36,6 L30,9.5" fill="none" stroke="${t.ink3}" stroke-width="1"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>` : ''}
      </div>`).join('')}
  </div>
</div>`)

const browser = await chromium.launch(process.env.FLORIST_CHROME ? { executablePath: process.env.FLORIST_CHROME } : {})

for (const [themeName, t] of Object.entries(THEMES)) {
  for (const [assetName, build, height] of [['banner', banner, 420], ['flow', flow, 250]]) {
    const page = await browser.newPage({ viewport: { width: 1280, height }, deviceScaleFactor: 2 })
    await page.setContent(build(t), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)
    const name = `${assetName}-${themeName}.png`
    await page.locator('.stage').screenshot({ path: join(outDir, name) })
    console.log('  ->', name)
    await page.close()
  }
}

await browser.close()
console.log('gotowe')
