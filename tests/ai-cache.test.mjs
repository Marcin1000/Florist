// Regresja: klucz cache w Pracowni AI musi opisywac wszystko, co wplywa na prompt.
// Siec jest zaslepiona, wiec liczymy same wywolania API.
//   chat/completions   -> rozpoznawanie zdjecia (visionDetect)
//   images/generations -> generowanie trzech propozycji

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { launch, openApp } from './helpers/browser.mjs'

let browser
before(async () => { browser = await launch() })
after(async () => { await browser?.close() })

// zaslepka sieci + licznik wywolan, wstrzykiwana do strony
const stubNetwork = () => {
  window.__calls = []
  localStorage.setItem('floraklos_oai', 'sk-test')
  window.fetch = async url => {
    const u = String(url)
    window.__calls.push(u)
    if (u.includes('chat/completions')) {
      return { ok: true, json: async () => ({ choices: [{ message: { content: '3 x roza (90%), 2 x eukaliptus' } }] }) }
    }
    return { ok: true, json: async () => ({ data: [{ b64_json: 'aGk=' }, { b64_json: 'aGk=' }, { b64_json: 'aGk=' }] }) }
  }
}

test('cache dziala dla niezmienionego zdjecia, ale nie przezywa zmiany liczby sztuk', async () => {
  const { page, errors } = await openApp(browser, { initScript: stubNetwork })
  const out = await page.evaluate(async () => {
    const n = () => window.__calls.length
    matDataUri = 'data:image/png;base64,' + 'A'.repeat(400)
    go('ai')

    await generate()
    const pierwsza = n()

    await generate()
    const druga = n() - pierwsza

    stepDetected(0, 1)          // uzytkownik poprawia liczbe lodyg
    await generate()
    const poZmianie = n() - pierwsza - druga

    const rozpoznania = window.__calls.filter(u => u.includes('chat/completions')).length
    return { pierwsza, druga, poZmianie, rozpoznania }
  })
  // pierwsze uruchomienie: rozpoznanie + generowanie
  assert.equal(out.pierwsza, 2)
  // drugie klikniecie bez zmian: nic nie leci do API
  assert.equal(out.druga, 0, 'cache przestal dzialac dla niezmienionego zdjecia')
  // po korekcie liczby: generujemy ponownie, ale bez ponownego rozpoznawania
  assert.equal(out.poZmianie, 1, 'zmiana liczby sztuk nie wymusila nowego generowania')
  assert.equal(out.rozpoznania, 1, 'zdjecie rozpoznane wiecej niz raz - to koszt bez powodu')
  assert.deepEqual(errors, [])
  await page.close()
})

test('dwa rozne zdjecia o tej samej dlugosci nie wpadaja do jednego wpisu cache', async () => {
  const { page, errors } = await openApp(browser, { initScript: stubNetwork })
  const out = await page.evaluate(async () => {
    const n = () => window.__calls.length
    go('ai')
    matDataUri = 'data:image/png;base64,' + 'A'.repeat(400)
    await generate()
    const pierwsze = n()

    // inne zdjecie, dokladnie ta sama dlugosc data URI
    matDataUri = 'data:image/png;base64,' + 'B'.repeat(400)
    detectedItems = null; detectedFor = null
    await generate()
    return { pierwsze, drugie: n() - pierwsze }
  })
  assert.equal(out.pierwsze, 2)
  assert.equal(out.drugie, 2, 'drugie zdjecie trafilo w cache pierwszego')
  assert.deepEqual(errors, [])
  await page.close()
})

test('sciezka z samym opisem nadal korzysta z cache', async () => {
  const { page, errors } = await openApp(browser, { initScript: stubNetwork })
  const out = await page.evaluate(async () => {
    const n = () => window.__calls.length
    go('ai')
    matDataUri = null
    document.getElementById('aiDesc').value = 'romantyczny bukiet z rozami'
    await generate()
    const pierwsza = n()
    await generate()
    const druga = n() - pierwsza
    document.getElementById('aiDesc').value = 'zupelnie inny opis'
    await generate()
    return { pierwsza, druga, poZmianieOpisu: n() - pierwsza - druga }
  })
  assert.equal(out.pierwsza, 1, 'sam opis nie powinien wolac rozpoznawania zdjecia')
  assert.equal(out.druga, 0, 'cache dla opisu przestal dzialac')
  assert.equal(out.poZmianieOpisu, 1, 'zmiana opisu powinna generowac na nowo')
  assert.deepEqual(errors, [])
  await page.close()
})
