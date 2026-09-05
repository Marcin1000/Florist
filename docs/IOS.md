# Florist for iOS (iPhone / iPad)

The native iOS shell. Inside it is the same single-file application (`index.html`) loaded
in a WKWebView - the counterpart of the Android wrapper.

## What works

- The full application - pricing, AI Studio, shopping, history - in a WKWebView.
- Camera and photo library for the image picker, through the native iOS picker.
- Saving generated images through the share sheet, to Photos or Files.
- Copying the shopping list and the quote through the native clipboard.
- Durable `localStorage`, thanks to a custom `appres://` URL scheme. It gives the page a
  stable origin; `file://` in WKWebView is unreliable for `localStorage`.
- Fonts work offline - they are embedded in the HTML as base64.

**Take photo** stays available on iOS, since this is a mobile device. The camera-less
desktop behaviour applies only to the Windows and macOS Electron builds.

## Requirements

- macOS with Xcode 15 or newer
- An Apple Developer account to run on a physical device; the simulator does not need one

## Build - route A (recommended, XcodeGen)

XcodeGen generates the project from `project.yml`, so there is no `.xcodeproj` to assemble
by hand.

1. Install XcodeGen, once:

   ```bash
   brew install xcodegen
   ```

2. Copy the current application into `Resources`. Do this **before** generating the
   project, so the file exists when XcodeGen collects sources and lands in *Copy Bundle
   Resources*. From the repository root:

   ```bash
   node scripts/sync-app.mjs
   ```

3. Generate the project, in `platforms/ios` where `project.yml` lives:

   ```bash
   xcodegen generate
   ```

4. Open it:

   ```bash
   open FloristAI.xcodeproj
   ```

5. In **Signing & Capabilities**, select your Team.
6. Choose a device or simulator and run (⌘R).

From then on, the `Sync Florist app` build phase refreshes the bundled copy on every
build.

## Build - route B (by hand in Xcode, without XcodeGen)

1. Xcode: **File → New → Project → iOS → App**
   - Product Name: `FloristAI`
   - Interface: SwiftUI, Language: Swift
2. Delete the default `ContentView` file - it is replaced by the files below.
3. Drag into the project, with **Copy items if needed** and the `FloristAI` target:
   - `FloristAI/FloristApp.swift`
   - `FloristAI/WebView.swift`
   - `FloristAI/Resources/index.html` - confirm it appears under **Build Phases → Copy
     Bundle Resources**
   - `FloristAI/Assets.xcassets` - icon and accent colour; can be merged into an existing
     catalogue
4. In the target settings, add the permission descriptions:
   - Privacy - Camera Usage Description
   - Privacy - Photo Library Usage Description
   - Privacy - Photo Library Additions Usage Description

   The wording can be taken from `project.yml`, keys `INFOPLIST_KEY_NS...UsageDescription`.
5. Set your Team in **Signing & Capabilities** and run.

## Updating the app content

Edit `app/index.html` in the repository root - that is the only source. The copy at
`FloristAI/Resources/index.html` is refreshed by the `Sync Florist app` build phase on
every Xcode build, and can also be refreshed by hand with `node scripts/sync-app.mjs`.

## Layout

| Path | Purpose |
|---|---|
| `project.yml` | project definition for XcodeGen |
| `FloristAI/FloristApp.swift` | entry point (SwiftUI App) |
| `FloristAI/WebView.swift` | WKWebView, the `appres` scheme, the save and clipboard bridge |
| `FloristAI/Resources/index.html` | generated copy of the application - do not edit |
| `FloristAI/Assets.xcassets` | app icon and accent colour |

The JavaScript bridge inside `WebView.swift` is covered by `tests/ios-bridge.test.mjs`.
Xcode cannot check code that lives in a Swift string literal, and a syntax error there
disables downloads, sharing and the clipboard silently - so the test extracts it and runs
it. Run `npm test` after touching that bridge.

## macOS from the same code

Two routes to a Mac application:

- **Mac Catalyst** - enable **Mac (Mac Catalyst)** in the target settings. It usually works
  unchanged, share sheet and clipboard included. Test the photo picker.
- **Electron** - `platforms/macos` already builds a native macOS application (dmg or zip)
  and is the simpler option. See [MACOS.md](MACOS.md). It has to be built on a Mac.

## Notes

- The first use of the camera or photo library triggers the system permission prompt.
- The OpenAI key is stored locally in the browser's `localStorage` on the device.
