# Florist

Aplikacja dla florysty: wycena bukietow z marza, podglad kompozycji (SVG), Pracownia AI
(propozycje i rozpoznawanie roslin przez OpenAI), lista zakupow do hurtowni i historia
wycen z zyskiem. Interfejs po polsku i angielsku (przelacznik w naglowku).

Calosc to **jedna strona HTML dzialajaca offline** - bez serwera, bez budowania,
bez zaleznosci. Czcionki (Cormorant Garamond, Jost) sa wbudowane w plik jako base64.
Internet jest potrzebny tylko dla funkcji AI (klucz OpenAI wpisywany w aplikacji).

## Struktura

```
.
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

```bash
git clone https://github.com/Marcin1000/Florist.git
cd Florist
```

Najszybsza petla: otworz `app/index.html` w przegladarce i odswiezaj (F5).
Nie trzeba serwera ani instalacji.

```bash
# Windows
start app\index.html
# macOS
open app/index.html
# Linux
xdg-open app/index.html
```

Po zmianach, przed zbudowaniem paczki na dana platforme:

```bash
cd sciezka/do/repo
node scripts/sync-app.mjs
```

Wersje Electron (windows, macos) robia to same - `npm start` i `npm run dist` maja
`sync` w prescriptach. Android odswieza kopie zadaniem Gradle `syncFloristApp`
przy kazdym budowaniu. iOS ma faze "Sync Florist app", ale **przed pierwszym
`xcodegen generate`** trzeba uruchomic `node scripts/sync-app.mjs` recznie
(inaczej plik nie trafi do "Copy Bundle Resources").

## Testy

```bash
npm install     # jednorazowo
npm test
```

Testy uruchamiaja aplikacje w Chromium (Playwright) i pilnuja rzeczy, ktore latwo
zepsuc nie zauwazajac tego:

- **`app.test.mjs`** - aplikacja startuje bez bledow JS, nawigacja po zakladkach,
  liczenie wyceny z marza, przelacznik PL/EN.
- **`security.test.mjs`** - nazwy wpisywane przez uzytkownika (wycena, skladnik, preset)
  i nazwy z odpowiedzi modelu nie moga wykonywac sie jako HTML. Dodajac nowe miejsce,
  ktore wstawia takie dane do `innerHTML`, przepusc je przez `esc()` - inaczej ten
  test padnie.
- **`ai-cache.test.mjs`** - z zaslepiona siecia liczy wywolania API: cache dziala dla
  niezmienionego zdjecia, ale zmiana liczby sztuk generuje na nowo, a rozpoznawanie
  nie powtarza sie bez potrzeby.
- **`ios-bridge.test.mjs`** - wyciaga JavaScript mostka ze `WebView.swift` i uruchamia
  go na zaslepce `webkit.messageHandlers`. Xcode nie sprawdzi tego kodu, a blad skladni
  po cichu zabija cala komunikacje z warstwa natywna.
- **`sync.test.mjs`** - kopie w otoczkach sa identyczne ze zrodlem, sa poza gitem,
  a kazda otoczka wskazuje na `index.html`.

Jesli lokalnie masz Chromium w innej wersji niz oczekuje Playwright, podaj sciezke:
`FLORIST_CHROME=/sciezka/do/chrome npm test`.

Wszystko to chodzi w CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) przy kazdym
pushu i pull requescie, razem z budowaniem debugowego APK.

## Budowanie aplikacji

| Platforma | Katalog                | Wynik                                  | Instrukcja                    |
|-----------|------------------------|----------------------------------------|-------------------------------|
| Windows   | `platforms/windows`    | `Florist Setup 1.0.0.exe`, portable    | [docs/WINDOWS.md](docs/WINDOWS.md) |
| macOS     | `platforms/macos`      | `Florist-1.0.0-universal.dmg`          | [docs/MACOS.md](docs/MACOS.md)     |
| Android   | `platforms/android`    | `app-debug.apk` / podpisany APK        | [docs/ANDROID.md](docs/ANDROID.md) |
| iOS       | `platforms/ios`        | aplikacja z Xcode (wymaga konta Apple) | [docs/IOS.md](docs/IOS.md)         |

Electron w skrocie:

```bash
cd platforms/windows   # albo macos
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
