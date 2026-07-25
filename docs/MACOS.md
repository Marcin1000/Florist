Florist - wersja macOS (Electron)

Aplikacja desktopowa Florist na macOS. Odpowiednik wersji Windows, to samo zachowanie
desktop: w Pracowni AI zostaje samo wgrywanie grafiki (bez "Zrob zdjecie"), a wywolania
OpenAI dzialaja dzieki wylaczonej blokadzie CORS dla strony lokalnej.

Wymagania
- macOS (build aplikacji mac trzeba wykonac na Macu).
- Node.js 18 lub nowszy oraz npm.

Budowanie
1. W katalogu projektu:
   npm install
2. Zbuduj aplikacje:
   npm run dist
3. Wynik w katalogu dist/:
   - Florist-1.0.0-universal.dmg   (instalator)
   - Florist-1.0.0-universal-mac.zip (aplikacja spakowana)
   Binarka universal dziala na Apple Silicon (arm64) i Intel (x64).

Uruchomienie do testow bez budowania
   npm install
   npm start

Gatekeeper (aplikacja niepodpisana)
Aplikacja nie jest podpisana certyfikatem Apple Developer, wiec przy pierwszym
uruchomieniu macOS moze ja zablokowac. Wtedy:
- kliknij aplikacje prawym przyciskiem i wybierz "Open", albo
- usun kwarantanne w Terminalu:
  xattr -dr com.apple.quarantine /Applications/Florist.app
Jesli masz konto Apple Developer, mozesz dodac podpis i notaryzacje w sekcji "mac"
pliku package.json (pola identity, hardenedRuntime, notarize).

Aktualizacja aplikacji (nowy build HTML)
Podmien plik:
   app/index.html (kopia do app/ powstaje automatycznie: npm run sync)
na najnowszy z paczki glownej i zbuduj ponownie.

Struktura
- main.js        - proces glowny Electron (okno, is-desktop, CORS, linki zewnetrzne)
- package.json   - zaleznosci i konfiguracja electron-builder (target mac)
- app/index.html - aplikacja Florist (jeden plik)
- build/icon.png - ikona 1024 (electron-builder sam zrobi z niej icns)

Uwaga
W calym projekcie obowiazuje konwencja: tylko dywizy, bez dlugich myslnikow.
