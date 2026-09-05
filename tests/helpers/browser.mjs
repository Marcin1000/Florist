// Wspolny start Chromium dla testow.
//
// W CI Playwright sam pobiera przegladarke (npx playwright install chromium) i zwykly
// chromium.launch() wystarcza. Lokalnie przegladarka moze byc juz w systemie pod inna
// wersja niz oczekuje biblioteka - wtedy podaj sciezke w FLORIST_CHROME, np.
//   FLORIST_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm test

import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const appUrl = pathToFileURL(join(repoRoot, 'app', 'index.html')).href

export async function launch() {
  const exe = process.env.FLORIST_CHROME
  return chromium.launch(exe ? { executablePath: exe } : {})
}

// Strona aplikacji plus zbieranie bledow. Kazdy test powinien na koncu sprawdzic
// errors: pusta tablica - blad w konsoli zwykle znaczy, ze cos w aplikacji jest zepsute.
export async function openApp(browser, { initScript } = {}) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push('pageerror: ' + e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  if (initScript) await page.addInitScript(initScript)
  await page.goto(appUrl)
  await page.waitForFunction(() => typeof window.go === 'function' && document.querySelectorAll('#rows .row').length > 0)
  return { page, errors }
}
