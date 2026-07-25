// Mostek iOS to JavaScript zapisany w pliku Swift - Xcode nie sprawdzi go w zaden sposob,
// a blad skladni po cichu zabija cala komunikacje z aplikacja natywna. Test wyciaga ten
// kod ze zrodla i uruchamia go na zaslepce webkit.messageHandlers.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { launch, repoRoot } from './helpers/browser.mjs'

const swiftPath = join(repoRoot, 'platforms', 'ios', 'FloristAI', 'WebView.swift')

function extractBridgeJs() {
  const src = readFileSync(swiftPath, 'utf8')
  const marker = 'static let bridgeJS = """'
  const start = src.indexOf(marker)
  assert.notEqual(start, -1, 'nie znaleziono bridgeJS w WebView.swift')
  const from = start + marker.length
  const end = src.indexOf('"""', from)
  assert.notEqual(end, -1, 'niedomkniety literal bridgeJS')
  const js = src.slice(from, end)
  assert.ok(!js.includes('\\('), 'bridgeJS zawiera interpolacje Swifta - test nie moze go uruchomic')
  return js
}

let browser, page
before(async () => {
  browser = await launch()
  page = await browser.newPage()
  await page.goto('about:blank')
  await page.evaluate(() => {
    window.__posted = []
    window.webkit = { messageHandlers: { bridge: { postMessage: m => window.__posted.push(m) } } }
    window.toast = () => {}
  })
  await page.evaluate(extractBridgeJs())   // rzuci, jesli skladnia jest zla
})
after(async () => { await browser?.close() })

test('eksport CSV przez oderwany element <a> dochodzi do mostka jako data URI', async () => {
  const msg = await page.evaluate(async () => {
    window.__posted = []
    const blob = new Blob(['Nazwa;Ilosc\nRoza;3\n'], { type: 'text/csv' })
    const a = document.createElement('a')            // celowo bez dodania do DOM,
    a.href = URL.createObjectURL(blob)               // dokladnie jak w exportZakCsv()
    a.download = 'lista-zakupow-floraklos.csv'
    a.click()
    await new Promise(r => setTimeout(r, 300))
    return window.__posted[0] || null
  })
  assert.ok(msg, 'CSV nie dotarl do mostka - programowe a.click() znowu jest pomijane')
  assert.equal(msg.action, 'save')
  assert.equal(msg.name, 'lista-zakupow-floraklos.csv')
  assert.ok(msg.url.startsWith('data:'), 'blob: musi byc zamieniony na data URI przed wyslaniem do Swifta')
})

test('klikniecie w link z data: trafia do mostka', async () => {
  const msg = await page.evaluate(async () => {
    window.__posted = []
    const a = document.createElement('a')
    a.href = 'data:image/png;base64,aGk='
    a.download = 'bukiet-1.png'
    document.body.appendChild(a)
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(r => setTimeout(r, 100))
    return window.__posted[0] || null
  })
  assert.ok(msg, 'pobieranie grafiki nie dotarlo do mostka')
  assert.equal(msg.action, 'save')
  assert.equal(msg.name, 'bukiet-1.png')
})

test('zwykly link nie jest przechwytywany', async () => {
  const count = await page.evaluate(() => {
    window.__posted = []
    const a = document.createElement('a')
    a.href = '#gdzies'
    document.body.appendChild(a)
    a.click()
    return window.__posted.length
  })
  assert.equal(count, 0, 'mostek przechwytuje linki bez atrybutu download')
})

test('copyText oddaje tekst do natywnego schowka', async () => {
  const msg = await page.evaluate(() => {
    window.__posted = []
    window.copyText('lista do skopiowania', 'ok', 'blad')
    return window.__posted[0] || null
  })
  assert.ok(msg, 'copyText nie odwolal sie do mostka')
  assert.equal(msg.action, 'copy')
  assert.equal(msg.text, 'lista do skopiowania')
})
