# Florist for Android (.apk)

A native Android shell (WebView) that loads the application from the APK's own assets
(`assets/index.html`, a generated copy of `app/index.html`). Everything works offline with
no hosting. The internet is only needed for the AI features, exactly as in the browser
version.

## Requirements

- Android Studio, current release
- A phone running Android 10 or newer (`minSdk 29`)

The repository carries `gradle/wrapper/gradle-wrapper.properties` but not `gradlew` or
`gradle-wrapper.jar`. Android Studio fetches the wrapper on first open. For command-line
builds, generate it once with `gradle wrapper`.

## Build

1. Clone the repository.
2. Android Studio: **File → Open** and select `platforms/android`.
3. Wait for the Gradle sync. The first open downloads Gradle and the dependencies, so the
   internet is needed at this stage.
4. Run on a phone over USB debugging, or build the file:
   **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

   The debug APK appears in `app/build/outputs/apk/debug/app-debug.apk`, which is enough to
   install on your own device.

The Gradle task `syncFloristApp` copies `app/index.html` into the assets before every
build, so there is no separate sync step.

## Signed APK, for distribution or a stable install

1. **Build → Generate Signed Bundle / APK → APK**.
2. **Create new...** if you have no keystore. Save the `.jks` file and its passwords -
   that is your signing key, and without it you cannot ship updates to the same app.
3. Choose the **release** variant and finish.
4. The APK is written to `app/release/`, or the directory you chose.

## Installing on a phone

1. Copy the `.apk` to the phone.
2. Open it with a file manager. Android will ask permission to install from unknown
   sources for that app - accept.
3. The Florist icon appears on the home screen.

## AI features

- Require an OpenAI key, entered in the app under **AI Studio → Set API key**.
- The camera and photo picker work through the native file chooser, handled in
  `MainActivity`. The first camera use prompts for the `CAMERA` permission.
- Downloaded images and CSV exports go to the Downloads folder.

## Stored data

The app uses the WebView `localStorage`, enabled through `domStorageEnabled` in
`MainActivity`. The data lives in the app's private data directory on the phone.

Persistent across app restarts and phone reboots:

- `floraklos_wyceny` - quote history: items, prices, margin, season, date
- `floraklos_presets` - ingredient presets
- `floraklos_oai` - the OpenAI key
- `floraklos_lang` - selected language

Not persistent: the AI generation history in the AI Studio strip. It is held in memory
only, because every generation is three full PNG images in base64 and a dozen of those
would exceed the `localStorage` quota. The browser and desktop versions behave the same
way. See [DEVELOPMENT.md](DEVELOPMENT.md) for the note on moving it to IndexedDB.

Data is cleared by **Settings → Apps → Florist → Clear data**, or by uninstalling. Android
backup may or may not carry it between phones (`allowBackup=true`).

## Package name and version

- `applicationId` and `namespace`: `com.floristai.app` in `app/build.gradle.kts`. The
  manifest needs no change - it uses `${applicationId}`.
- `versionCode` / `versionName`: `app/build.gradle.kts`.

## Updating the app content

Edit `app/index.html` in the repository root and rebuild. The copy in `assets/` is
regenerated automatically by the `syncFloristApp` Gradle task.
