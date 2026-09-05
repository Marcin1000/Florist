# Florist for macOS (Electron)

The macOS desktop application. It matches the Windows build and behaves the same way on
the desktop: AI Studio keeps image upload only (no **Take photo**), and OpenAI calls work
because CORS is relaxed for the locally loaded page.

## Requirements

- macOS - the mac build has to be produced on a Mac
- Node.js 18 or newer, and npm

## Build

```bash
cd path/to/repo/platforms/macos
npm install
npm run dist
```

Results in `dist/`:

- `Florist-1.0.0-universal.dmg` - installer
- `Florist-1.0.0-universal-mac.zip` - zipped application

The universal binary runs on both Apple Silicon (arm64) and Intel (x64).

To run without building an installer:

```bash
npm install
npm start
```

`npm start` and `npm run dist` refresh the bundled copy of `app/index.html` first, so there
is no separate sync step.

## Gatekeeper (unsigned application)

The app is not signed with an Apple Developer certificate, so macOS may block it on first
launch. Either:

- right-click the application and choose **Open**, or
- clear the quarantine attribute:

  ```bash
  xattr -dr com.apple.quarantine /Applications/Florist.app
  ```

With an Apple Developer account you can add signing and notarization in the `mac` section
of `package.json` (`identity`, `hardenedRuntime`, `notarize`).

## Updating the app content

Edit `app/index.html` in the repository root and rebuild. The copy under
`platforms/macos/app/` is generated automatically.

## Layout

| Path | Purpose |
|---|---|
| `main.js` | Electron main process: window, `is-desktop` flag, CORS, external links |
| `package.json` | dependencies and the electron-builder configuration for the mac target |
| `app/index.html` | generated copy of the application - do not edit |
| `build/icon.png` | 1024 px icon; electron-builder derives the `.icns` from it |

## Alternative: Mac Catalyst

The iOS project can also produce a Mac application through Mac Catalyst - see
[IOS.md](IOS.md). Electron is the simpler route if you only want a desktop build.
