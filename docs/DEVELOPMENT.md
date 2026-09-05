# Development

Everything a contributor needs that does not belong in the product README.

## Repository layout

```
.
  app/index.html            <- THE single source of truth: the entire application
  scripts/
    sync-app.mjs            copies app/index.html into the platform shells
    screenshots.mjs         regenerates the README screenshots
    brand-assets.mjs        regenerates the banner and flow diagram
  tests/                    Chromium tests (node --test + Playwright)
  platforms/
    android/                Android Studio + WebView (Kotlin)
    ios/                    Xcode + WKWebView (SwiftUI, XcodeGen)
    macos/                  Electron (dmg / zip)
    windows/                Electron (NSIS installer + portable)
  docs/                     build guides per platform, and this file
  assets/                   brand graphics and screenshots used by the README
```

The application has **no bundler, no framework, no build step and no runtime
dependencies**. `app/index.html` is loaded by the browser exactly as it is written, fonts
included as base64. Node and npm are needed only for the tests and the helper scripts.

## One source of truth

Each platform shell needs its own copy of the application file in a location its build
system understands. Those copies are **generated and git-ignored** - there is exactly one
file to edit:

```bash
node scripts/sync-app.mjs
```

The sync happens automatically wherever it can:

| Platform | When the copy is refreshed |
|---|---|
| Windows, macOS | `npm start` and `npm run dist` run it via `prestart` / `predist` |
| Android | the Gradle task `syncFloristApp` runs before `preBuild` |
| iOS | the `Sync Florist app` build phase, on every Xcode build |

One exception worth remembering: on iOS, run `node scripts/sync-app.mjs` **once before the
first `xcodegen generate`**. XcodeGen only picks up files that exist when it runs, so
without it the app file never lands in *Copy Bundle Resources*.

## Working loop

The fastest loop is a browser:

```bash
open app/index.html     # then just refresh after each edit
```

No server, no watcher, no install.

## Tests

```bash
npm install     # once
npm test
```

The suite runs the real application in headless Chromium:

| File | What it protects |
|---|---|
| `tests/app.test.mjs` | the app boots without JS errors, tab navigation, pricing maths with margin, the PL/EN switch |
| `tests/security.test.mjs` | user-entered names (quote, ingredient, preset) and names coming back from the model never execute as HTML |
| `tests/ai-cache.test.mjs` | with the network stubbed, counts API calls: the cache hits for an unchanged photo, a changed stem count regenerates, recognition is not repeated needlessly |
| `tests/ios-bridge.test.mjs` | extracts the bridge JavaScript from `WebView.swift` and runs it against a stubbed `webkit.messageHandlers` |
| `tests/sync.test.mjs` | shell copies match the source, stay out of git, and every shell points at `index.html` |

If your local Chromium is a different build from the one Playwright expects, point at it:

```bash
FLORIST_CHROME=/path/to/chrome npm test
```

CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) runs the suite on every push
to `main` and every pull request, and builds a debug APK as an artifact.

### Why the iOS bridge is tested from JavaScript

The bridge that connects the web app to the native iOS layer lives inside a Swift string
literal. Xcode does not parse it, lint it, or type-check it in any way. A syntax error
there compiles perfectly and then silently disables downloading, sharing and the
clipboard on the device, with no visible symptom. The test pulls that string out of the
`.swift` file and executes it, so the failure surfaces in CI instead of on a phone.

## Conventions

- **Escape everything that a person or a model can type.** Any user-supplied or
  model-supplied string going into `innerHTML` must pass through `esc()`. There is a test
  for this; it will fail if a new render path forgets.
- **Every UI string is translated.** Text goes through `tr()` or the `data-i18n`,
  `data-i18n-html`, `data-i18n-ph` attributes, and needs an entry in both the `pl` and `en`
  dictionaries. A missing English key silently falls back to Polish.
- **Ingredient names have one canonical form.** Polish is canonical in `NAMES` / `CANON`;
  `dispName()` handles display and translation. Do not compare raw user strings.
- **Hyphens only.** No em dashes anywhere in the project - code, comments or documentation.
- **The AI is optional.** Every feature that calls OpenAI must degrade to something useful
  without a key and without a network.

## Regenerating README assets

Screenshots and brand graphics are generated, so they stay in step with the app:

```bash
node scripts/screenshots.mjs     # assets/screenshots/*.png
node scripts/brand-assets.mjs    # assets/brand/*.png, light and dark
```

`screenshots.mjs` switches the interface to English and fills in a realistic bouquet and a
few saved quotes. `brand-assets.mjs` pulls the fonts and the logo straight out of
`app/index.html`, so the banner cannot drift away from the product's typography.

Screenshots show the real interface. The AI Studio proposal images are not included,
because generating them requires a live OpenAI key - the recognition panel shown in the
README is the genuine UI with example data.

## Data stored on the device

Persistent, in `localStorage`:

| Key | Contents |
|---|---|
| `floraklos_wyceny` | quote history: items, prices, margin, season, date |
| `floraklos_presets` | ingredient presets with prices |
| `floraklos_oai` | the OpenAI API key |
| `floraklos_lang` | selected language |

Not persistent, by design: the AI generation history in the AI Studio strip lives in
memory only. Each generation is three full PNG images in base64, and a dozen of those
would exceed the `localStorage` quota. Moving it to IndexedDB is a known, separate piece
of work.

## Platform build guides

[Windows](WINDOWS.md) · [macOS](MACOS.md) · [Android](ANDROID.md) · [iOS](IOS.md)

Note for Android: the repository carries `gradle/wrapper/gradle-wrapper.properties` but not
`gradlew` or `gradle-wrapper.jar`. Android Studio fetches the wrapper on first open; for
command-line builds generate it once with `gradle wrapper`.
