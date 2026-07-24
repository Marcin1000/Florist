# Florist - wersja iOS (iPhone / iPad)

Natywna otoczka aplikacji Florist na iOS. Wnetrze to ta sama aplikacja jednoplikowa
(index.html) zaladowana w WKWebView. Odpowiednik wrappera Android.

## Co dziala

- Pelna aplikacja Florist (wycena, Pracownia AI, zakupy, historia) w WKWebView.
- Aparat i biblioteka zdjec dla pola wyboru zdjecia (natywny picker iOS).
- Zapis wygenerowanych grafik przez arkusz udostepniania (zapis do Zdjec lub Plikow).
- Kopiowanie listy i wyceny przez natywny schowek iOS.
- Trwaly localStorage (presety, jezyk, klucz API, historia) dzieki wlasnemu schematowi
  URL "appres://" (stabilny origin; file:// w WKWebView bywa zawodny dla localStorage).
- Czcionki dzialaja offline (sa wbudowane w HTML jako base64).

Na iOS pozostaje przycisk "Zrob zdjecie" (to urzadzenie mobilne). Wersja desktop bez
aparatu dotyczy tylko Windows / macOS Electron.

## Wymagania

- macOS z Xcode 15 lub nowszym.
- Konto Apple Developer do uruchomienia na fizycznym urzadzeniu (symulator nie wymaga).

## Budowanie - sciezka A (zalecana, XcodeGen)

XcodeGen generuje projekt z pliku project.yml, dzieki czemu nie trzeba recznie skladac
.xcodeproj.

1. Zainstaluj XcodeGen (jednorazowo):
   brew install xcodegen
2. Wgraj aktualna aplikacje do Resources (raz przed generowaniem projektu, zeby plik
   trafil do "Copy Bundle Resources"). W katalogu florist:
   node scripts/sync-app.mjs
3. W katalogu platforms/ios (tam gdzie project.yml) wygeneruj projekt:
   xcodegen generate
4. Otworz wynikowy projekt:
   open FloristAI.xcodeproj
5. W zakladce "Signing & Capabilities" wybierz swoj Team (podpis).
6. Wybierz urzadzenie lub symulator i uruchom (Cmd R).

## Budowanie - sciezka B (recznie w Xcode, bez XcodeGen)

1. Xcode: File > New > Project > iOS > App.
   - Product Name: FloristAI
   - Interface: SwiftUI, Language: Swift
2. Usun domyslny plik z ContentView (zastapimy go wlasnymi).
3. Przeciagnij do projektu (z opcja "Copy items if needed", target FloristAI):
   - FloristAI/FloristApp.swift
   - FloristAI/WebView.swift
   - FloristAI/Resources/index.html  (upewnij sie, ze jest w
     "Copy Bundle Resources" w zakladce Build Phases)
   - FloristAI/Assets.xcassets  (ikona i kolor akcentu; mozesz tez scalic z istniejacym)
4. W ustawieniach targetu (Info / Build Settings) dodaj opisy uprawnien:
   - Privacy - Camera Usage Description
   - Privacy - Photo Library Usage Description
   - Privacy - Photo Library Additions Usage Description
   (teksty mozesz wziac z project.yml, klucze INFOPLIST_KEY_NS...UsageDescription)
5. Ustaw Team w "Signing & Capabilities" i uruchom.

## Aktualizacja aplikacji (nowy build HTML)

Edytuj florist/app/index.html - to jedyne zrodlo prawdy. Kopia w
FloristAI/Resources/index.html jest odswiezana przez faze "Sync Florist app"
przy kazdym budowaniu w Xcode (mozesz tez wywolac recznie: node scripts/sync-app.mjs).

## Struktura

- project.yml                                 - definicja projektu (XcodeGen)
- FloristAI/FloristApp.swift                  - punkt wejscia (SwiftUI App)
- FloristAI/WebView.swift                     - WKWebView, schemat appres, mostek zapisu i schowka
- FloristAI/Resources/index.html - aplikacja Florist (jeden plik)
- FloristAI/Assets.xcassets                   - ikona aplikacji i kolor akcentu

## macOS

Ten sam kod moze dac aplikacje na Maca dwoma drogami:
- Mac Catalyst: w ustawieniach targetu wlacz "Mac (Mac Catalyst)". Zwykle dziala bez zmian,
  arkusz udostepniania i schowek tez. Warto przetestowac picker zdjec.
- Electron: projekt platforms/macos buduje gotowa aplikacje macOS (dmg lub zip). Wymaga
  budowania na Macu.

Jesli chcesz, przygotuje gotowa konfiguracje pod macOS (Catalyst albo Electron mac) osobno.

## Uwagi

- Pierwsze uzycie aparatu lub biblioteki zdjec wywola systemowe pytanie o zgode.
- Klucz OpenAI jest przechowywany lokalnie w przegladarce (localStorage) na urzadzeniu.
- W całym projekcie obowiazuje konwencja: tylko dywizy, bez dlugich myslnikow.
