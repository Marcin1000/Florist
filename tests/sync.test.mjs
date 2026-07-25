// Pilnuje zasady jednego zrodla prawdy: app/index.html jest jedynym miejscem do edycji,
// a kopie w otoczkach powstaja ze skryptu i nie leza w gicie.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot } from './helpers/browser.mjs'

const COPIES = [
  'platforms/android/app/src/main/assets/index.html',
  'platforms/ios/FloristAI/Resources/index.html',
  'platforms/macos/app/index.html',
  'platforms/windows/app/index.html',
]

test('sync-app.mjs rozsyla identyczna kopie do wszystkich otoczek', () => {
  execFileSync(process.execPath, [join(repoRoot, 'scripts', 'sync-app.mjs')], { cwd: repoRoot })
  const source = readFileSync(join(repoRoot, 'app', 'index.html'))
  for (const rel of COPIES) {
    const copy = readFileSync(join(repoRoot, rel))
    assert.ok(source.equals(copy), `${rel} rozni sie od app/index.html`)
  }
})

test('kopie w otoczkach sa poza gitem', () => {
  const ignored = execFileSync('git', ['check-ignore', ...COPIES], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n').filter(Boolean)
  assert.equal(ignored.length, COPIES.length,
    'kopia otoczki nie jest ignorowana - grozi to rozjechaniem sie wersji miedzy platformami')
})

test('kazda otoczka wskazuje na index.html', () => {
  const refs = {
    'platforms/android/app/src/main/java/com/floristai/app/MainActivity.kt': 'file:///android_asset/index.html',
    'platforms/ios/FloristAI/WebView.swift': 'private let entryFile = "index.html"',
    'platforms/macos/main.js': "'app', 'index.html'",
    'platforms/windows/main.js': "'app', 'index.html'",
  }
  for (const [file, needle] of Object.entries(refs)) {
    const src = readFileSync(join(repoRoot, file), 'utf8')
    assert.ok(src.includes(needle), `${file} nie wskazuje na index.html (brak: ${needle})`)
  }
})

test('otoczki Electron wolaja sync przed uruchomieniem i budowaniem', () => {
  for (const p of ['platforms/macos/package.json', 'platforms/windows/package.json']) {
    const pkg = JSON.parse(readFileSync(join(repoRoot, p), 'utf8'))
    assert.equal(pkg.scripts.prestart, 'npm run sync', `${p}: brak prestart`)
    assert.equal(pkg.scripts.predist, 'npm run sync', `${p}: brak predist`)
  }
})
