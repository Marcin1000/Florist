#!/usr/bin/env node
// Kopiuje jedno zrodlo prawdy (app/index.html) do wszystkich otoczek platformowych.
// Uruchom po kazdej zmianie aplikacji, przed budowaniem paczki na dana platforme:
//   node scripts/sync-app.mjs
// Wersje Electron (windows/macos) robia to same w prestart i predist.

import { copyFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'app', 'index.html')

const targets = [
  'platforms/android/app/src/main/assets/index.html',
  'platforms/ios/FloristAI/Resources/index.html',
  'platforms/macos/app/index.html',
  'platforms/windows/app/index.html',
]

try {
  statSync(source)
} catch {
  console.error(`Brak pliku zrodlowego: ${source}`)
  process.exit(1)
}

const kb = (statSync(source).size / 1024).toFixed(0)
for (const rel of targets) {
  const dest = join(root, rel)
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(source, dest)
  console.log(`  -> ${rel}`)
}
console.log(`Zsynchronizowano app/index.html (${kb} kB) do ${targets.length} otoczek.`)
