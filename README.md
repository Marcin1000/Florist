# Florist

Aplikacja dla florysty: wycena bukietow z marza, podglad kompozycji (SVG), Pracownia AI
(propozycje i rozpoznawanie roslin przez OpenAI), lista zakupow do hurtowni i historia
wycen z zyskiem. Interfejs po polsku i angielsku (przelacznik w naglowku).

Calosc to **jedna strona HTML dzialajaca offline** - bez serwera, bez budowania,
bez zaleznosci. Czcionki (Cormorant Garamond, Jost) sa wbudowane w plik jako base64.
Internet jest potrzebny tylko dla funkcji AI (klucz OpenAI wpisywany w aplikacji).

## Struktura

```
florist/
  app/index.html            <- JEDYNE zrodlo prawdy: cala aplikacja
  scripts/sync-app.mjs      <- kopiuje app/index.html do otoczek platformowych
  platforms/
    android/                Android Studio + WebView (Kotlin)
    ios/                    Xcode + WKWebView (SwiftUI, XcodeGen)
    macos/                  Electron (dmg / zip)
    windows/                Electron (instalator NSIS + portable)
  docs/
    ANDROID.md  IOS.md  MACOS.md  WINDOWS.md    <- budowanie krok po kroku
```

Wczesniej kazda platforma miala wlasna kopie pliku HTML (piec kopii, ktore rozjezdzaly
sie miedzy soba). Teraz jest jedna, a kopie w `platforms/*` sa generowane i nie sa
trzymane w gicie.

## Praca nad aplikacja

Najszybsza petla: otworz `app/index.html` w przegladarce i odswiezaj (F5).
Nie trzeba serwera ani instalacji.

```bash
# Windows
start florist\app\index.html
# macOS
open florist/app/index.html
# Linux
xdg-open florist/app/index.html
```

Po zmianach, przed zbudowaniem paczki na dana platforme:

```bash
cd florist
node scripts/sync-app.mjs
```

Wersje Electron (windows, macos) robia to same - `npm start` i `npm run dist` maja
`sync` w prescriptach. Android odswieza kopie zadaniem Gradle `syncFloristApp`
przy kazdym budowaniu. iOS ma faze "Sync Florist app", ale **przed pierwszym
`xcodegen generate`** trzeba uruchomic `node scripts/sync-app.mjs` recznie
(inaczej plik nie trafi do "Copy Bundle Resources").

## Budowanie aplikacji

| Platforma | Katalog                | Wynik                                  | Instrukcja                    |
|-----------|------------------------|----------------------------------------|-------------------------------|
| Windows   | `platforms/windows`    | `Florist Setup 1.0.0.exe`, portable    | [docs/WINDOWS.md](docs/WINDOWS.md) |
| macOS     | `platforms/macos`      | `Florist-1.0.0-universal.dmg`          | [docs/MACOS.md](docs/MACOS.md)     |
| Android   | `platforms/android`    | `app-debug.apk` / podpisany APK        | [docs/ANDROID.md](docs/ANDROID.md) |
| iOS       | `platforms/ios`        | aplikacja z Xcode (wymaga konta Apple) | [docs/IOS.md](docs/IOS.md)         |

Electron w skrocie:

```bash
cd florist/platforms/windows   # albo macos
npm install
npm start                      # podglad
npm run dist                   # instalator w dist/
```

## Zapisywane dane (localStorage)

Trwale, przezywaja restart:

- `floraklos_wyceny` - historia wycen (pozycje, ceny, marza, sezon, data)
- `floraklos_presets` - presety skladnikow z cenami
- `floraklos_oai` - klucz OpenAI
- `floraklos_lang` - wybrany jezyk (pl / en)

Nietrwale, tylko w trakcie sesji:

- historia generacji AI (pasek miniatur w Pracowni AI) - trzymana w pamieci JS,
  bo kazda generacja to trzy pelne obrazy PNG w base64 i kilkanascie takich przekroczyloby
  limit localStorage. Przeniesienie tego na IndexedDB to osobne zadanie.

## Konwencje

- W calym projekcie tylko dywizy, bez dlugich myslnikow.
- Kazdy tekst interfejsu przechodzi przez `tr()` / atrybuty `data-i18n*` - dodajac
  element UI dodaj od razu wpis PL i EN w `I18N`.
- Nazwy skladnikow maja jedna forme kanoniczna (polska) w `NAMES` / `CANON`;
  angielskie tlumaczenie i wyswietlanie robi `dispName()`.
