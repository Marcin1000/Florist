// Podstawy: aplikacja sie laduje, nawigacja dziala, wycena liczy, jezyk sie przelacza.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { launch, openApp } from './helpers/browser.mjs'

let browser
before(async () => { browser = await launch() })
after(async () => { await browser?.close() })

test('aplikacja laduje sie bez bledow JS i ma cztery zakladki', async () => {
  const { page, errors } = await openApp(browser)
  const info = await page.evaluate(() => ({
    title: document.title,
    nav: [...document.querySelectorAll('#nav button')].map(b => b.dataset.v),
    presets: document.querySelectorAll('#presets .preset').length,
    rows: document.querySelectorAll('#rows .row').length,
  }))
  assert.equal(info.title, 'Florist')
  assert.deepEqual(info.nav, ['wycena', 'ai', 'zakupy', 'historia'])
  assert.ok(info.presets > 20, `oczekiwano wielu presetow, jest ${info.presets}`)
  assert.ok(info.rows > 0, 'wycena startowa powinna miec pozycje')
  assert.deepEqual(errors, [])
  await page.close()
})

test('przejscie po wszystkich zakladkach nie wywala bledow', async () => {
  const { page, errors } = await openApp(browser)
  for (const v of ['ai', 'zakupy', 'historia', 'wycena']) {
    await page.evaluate(v => go(v), v)
    await page.waitForTimeout(120)
    const on = await page.evaluate(() => document.querySelector('.view.on')?.id)
    assert.equal(on, 'v-' + v)
  }
  assert.deepEqual(errors, [])
  await page.close()
})

test('wycena dolicza marze i sumuje pozycje', async () => {
  const { page, errors } = await openApp(browser)
  const out = await page.evaluate(() => {
    rows.length = 0
    addRow('Roza', 10, 3)     // 30
    addRow('Papier', 5, 2)    // 10
    setMarza(100)
    calc()
    const base = rows.reduce((a, r) => a + rowSum(r), 0)
    return { base, marza, stems: rows.reduce((a, r) => a + (parseInt(r.qty) || 0), 0) }
  })
  assert.equal(out.base, 40)
  assert.equal(out.marza, 100)
  assert.equal(out.stems, 5)
  assert.deepEqual(errors, [])
  await page.close()
})

test('przelacznik jezyka zmienia interfejs i wraca', async () => {
  const { page, errors } = await openApp(browser)
  const out = await page.evaluate(() => {
    const pl = document.querySelector('#nav button[data-v="wycena"]').textContent.trim()
    toggleLang()
    const en = document.querySelector('#nav button[data-v="wycena"]').textContent.trim()
    const htmlLang = document.documentElement.lang
    toggleLang()
    return { pl, en, htmlLang, back: document.documentElement.lang }
  })
  assert.equal(out.pl, 'Wycena')
  assert.equal(out.en, 'Pricing')
  assert.equal(out.htmlLang, 'en')
  assert.equal(out.back, 'pl')
  assert.deepEqual(errors, [])
  await page.close()
})
