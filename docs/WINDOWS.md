# Florist for Windows (Electron)

A standalone desktop application. The app file is bundled inside it, so it works offline
with no hosting. The internet is only needed for the AI features, exactly as in the
browser version.

Building produces two things:

- an NSIS installer, `Florist Setup 1.0.0.exe`, with desktop and Start menu shortcuts,
- a portable build, `FloristAI-portable.exe`, that runs without installing.

## Requirements

- Windows 10 or 11
- [Node.js LTS](https://nodejs.org) - that is all; electron-builder fetches the rest itself

## Build

```powershell
cd path\to\repo\platforms\windows
npm install     # once, needs the internet
npm run dist
```

The results land in `dist\`. To run the app without building an installer:

```powershell
npm install
npm start
```

`npm start` and `npm run dist` both refresh the bundled copy of `app/index.html` first, so
there is no separate sync step to remember.

## Installing

Run `Florist Setup 1.0.0.exe` and pick an installation directory. The application is not
code-signed, so SmartScreen may warn on first run - choose **More info** → **Run anyway**.
Removing that warning permanently requires buying a code signing certificate, which is
optional.

## AI features

- Require an OpenAI key, entered in the app under **AI Studio → Set API key**.
- **Upload** opens the standard file picker. **Take photo** behaves as a file picker on
  desktop, since a PC has no camera in the mobile sense.
- Downloading generated images and exporting CSV both go through the Windows save dialog.

## Stored data

The app uses the `localStorage` of the Chromium engine bundled with Electron. The profile
lives in `C:\Users\<you>\AppData\Roaming\Florist`.

Persistent across restarts:

- `floraklos_wyceny` - quote history: items, prices, margin, season, date
- `floraklos_presets` - ingredient presets
- `floraklos_oai` - the OpenAI key
- `floraklos_lang` - selected language

Not persistent: the AI generation history in the AI Studio strip. It is held in memory
only, because every generation is three full PNG images in base64 and a dozen of those
would exceed the `localStorage` quota. The browser and Android versions behave the same
way. See [DEVELOPMENT.md](DEVELOPMENT.md) for the note on moving it to IndexedDB.

Data is lost when the application is uninstalled and the profile folder removed.

## Updating the app content

Edit `app/index.html` in the repository root and rebuild. The copy under
`platforms/windows/app/` is generated automatically by `npm run dist`.

## Lighter alternative, without building

If you do not need an installer, Edge can pin the file as a windowed app:

1. Open `app/index.html` in Microsoft Edge.
2. Menu **(...)** → **Apps** → **Install this site as an app**.

This creates a Start menu shortcut that opens the app in its own window, and works
offline. It is a thin shortcut into the browser engine - no icon of its own, no packaging.
Electron gives a full standalone application with an installer.
