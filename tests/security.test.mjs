// Regresja: nazwy wpisywane przez uzytkownika i nazwy z odpowiedzi modelu nie moga
// wykonywac sie jako HTML. Kazde nowe miejsce, ktore wstawia takie dane do innerHTML,
// musi przechodzic przez esc() - inaczej ten test padnie.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { launch, openApp } from './helpers/browser.mjs'

const PAYLOAD = '<img src=x onerror="window.__xss=1">'

let browser
before(async () => { browser = await launch() })
after(async () => { await browser?.close() })

function seedEvilQuote() {
  const payload = '<img src=x onerror="window.__xss=1">'
  localStorage.setItem('floraklos_wyceny', JSON.stringify([{
    id: 1, name: payload + 'ZLA NAZWA', total: 100, cost: 50,
    date: new Date().toISOString(),
    rows: [{ id: 1, name: payload, price: 5, qty: 2 }],
    marza: 100, roundOn: true, season: 'standard',
  }]))
}

test('nazwa wyceny w historii renderuje sie jako tekst', async () => {
  const { page, errors } = await openApp(browser, { initScript: seedEvilQuote })
  await page.evaluate(() => go('historia'))
  await page.waitForTimeout(150)
  const out = await page.evaluate(() => ({
    xss: !!window.__xss,
    text: document.querySelector('#histList .nm')?.textContent,
    injected: document.querySelectorAll('#histList img').length,
  }))
  assert.equal(out.xss, false, 'payload wykonal sie przy renderowaniu historii')
  assert.equal(out.injected, 0, 'payload utworzyl element w historii')
  assert.ok(out.text.includes(PAYLOAD), 'nazwa powinna byc widoczna doslownie')
  assert.deepEqual(errors, [])
  await page.close()
})

test('nazwa skladnika nie wykonuje sie w wierszach, karcie klienta ani liscie zakupow', async () => {
  const { page, errors } = await openApp(browser, { initScript: seedEvilQuote })
  const out = await page.evaluate(() => {
    recall(1)
    openCard()
    const r = {
      xss: !!window.__xss,
      inputValue: document.querySelector('#rows input.nm')?.value,
      cardInjected: document.querySelectorAll('#quoteCard img').length,
    }
    closeCard()
    go('zakupy')
    toggleZakCurrent()
    return { ...r, zakInjected: document.querySelectorAll('#zakList img').length, xssAfter: !!window.__xss }
  })
  assert.equal(out.xss, false)
  assert.equal(out.xssAfter, false)
  assert.equal(out.cardInjected, 0, 'payload utworzyl element w karcie klienta')
  assert.equal(out.zakInjected, 0, 'payload utworzyl element w liscie zakupow')
  assert.equal(out.inputValue, PAYLOAD, 'wartosc pola powinna byc doslowna')
  assert.deepEqual(errors, [])
  await page.close()
})

test('nazwa presetu nie wykonuje sie, a preset nadal dodaje pozycje', async () => {
  const { page, errors } = await openApp(browser)
  const out = await page.evaluate(payload => {
    PRESETS.push([payload + 'PWN', 9, 'kwiaty'])
    renderPresets()
    const evil = [...document.querySelectorAll('#presets .preset')].find(b => b.textContent.includes('PWN'))
    evil.click()
    return {
      xss: !!window.__xss,
      injected: document.querySelectorAll('#presets img').length,
      addedName: rows[rows.length - 1].name,
    }
  }, PAYLOAD)
  assert.equal(out.xss, false, 'payload wykonal sie przy renderowaniu presetow')
  assert.equal(out.injected, 0)
  // preset przekazuje nazwe przez indeks (addPresetRow), nie przez atrybut onclick,
  // wiec nazwa dochodzi w calosci - takze z cudzyslowami
  assert.equal(out.addedName, PAYLOAD + 'PWN')
  assert.deepEqual(errors, [])
  await page.close()
})

test('nazwy rozpoznanych roslin z odpowiedzi modelu nie wykonuja sie', async () => {
  const { page, errors } = await openApp(browser)
  const out = await page.evaluate(payload => {
    detectedItems = [{ count: 3, name: payload, pct: 90 }]
    renderDetectedUI()
    return { xss: !!window.__xss, injected: document.querySelectorAll('#detected img').length }
  }, PAYLOAD)
  assert.equal(out.xss, false, 'payload z odpowiedzi modelu wykonal sie w panelu rozpoznanych')
  assert.equal(out.injected, 0)
  assert.deepEqual(errors, [])
  await page.close()
})
