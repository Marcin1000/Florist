FLORIST AI - wersja Windows (Electron)
=======================================

Co to jest
----------
Samodzielna aplikacja desktop dla Windows. Wersja lawendowa jest wbudowana
w aplikacje (app/index.html). Dziala offline, bez hostingu.
Internet potrzebny tylko do funkcji AI (OpenAI), tak jak w wersji webowej.

Po zbudowaniu dostajesz:
- instalator NSIS (Florist Setup x.y.z.exe) - klasyczna instalacja ze
  skrotem na pulpicie i w menu Start,
- wersje portable (FloristAI-portable.exe) - uruchamiana bez instalacji.

Wymagania do zbudowania
-----------------------
- Windows 10 lub 11.
- Node.js LTS (https://nodejs.org) - to wszystko, electron-builder dociaga
  reszte sam.

Build (krok po kroku, w PowerShell lub CMD)
-------------------------------------------
1. Sklonuj repozytorium.
2. Wejdz do folderu:
     cd sciezka\do\repo\florist\platforms\windows
3. Zainstaluj zaleznosci (jednorazowo, potrzebny internet):
     npm install
4. Zbuduj instalator:
     npm run dist
5. Gotowe pliki znajdziesz w podfolderze dist\
   - "Florist Setup 1.0.0.exe"  -> instalator
   - "FloristAI-portable.exe"        -> wersja bez instalacji

Szybki podglad bez budowania instalatora:
     npm install
     npm start
   (uruchamia aplikacje od razu w trybie deweloperskim)

Instalacja
----------
Uruchom "Florist Setup 1.0.0.exe". Mozesz wybrac katalog instalacji.
Powstanie skrot na pulpicie i w menu Start. Aplikacja nie jest podpisana
cyfrowo, wiec Windows SmartScreen moze pokazac ostrzezenie - wybierz
"Wiecej informacji" > "Uruchom mimo to". Aby usunac ostrzezenie na stale,
trzeba kupic certyfikat do podpisu kodu (opcjonalne).

Funkcja AI (OpenAI)
-------------------
- Wymaga klucza OpenAI, wpisywanego w aplikacji (Pracownia AI > Ustaw klucz API).
- "Wgraj" otwiera zwykly wybor pliku. "Zrob zdjecie" na desktopie zachowa sie
  jak wybor pliku (brak aparatu na PC).
- Pobieranie obrazow i eksport CSV zapisuja sie przez okno zapisu Windows.

ZAPISYWANIE DANYCH (pamiec) - tak samo jak w wersji web i Android
-----------------------------------------------------------------
Aplikacja uzywa localStorage silnika Chromium (wbudowanego w Electron).
Dane leza w profilu aplikacji:
  C:\Users\<Ty>\AppData\Roaming\Florist

Trwale (przezywaja zamkniecie aplikacji i restart komputera):
- Historia wycen (zakladka Historia) - klucz "floraklos_wyceny".
  Czysty tekst: pozycje, ceny, marza, sezon, data. Lekki, bez limitow.
- Klucz OpenAI - klucz "floraklos_oai".
- Wybrany jezyk PL/EN - klucz "floraklos_lang".

Nietrwale (tylko w trakcie sesji, znika po zamknieciu lub odswiezeniu):
- Historia generacji AI (pasek miniatur w Pracowni AI).
  Trzymana wylacznie w pamieci, NIE w localStorage. Tak samo dziala wersja
  web i Android. Powod: kazda generacja to trzy pelne obrazy PNG w base64;
  zapis kilkunastu takich przekroczylby limit localStorage.

Kiedy dane znikaja:
- Odinstalowanie aplikacji i usuniecie folderu profilu
  (C:\Users\<Ty>\AppData\Roaming\Florist).

Jesli chcesz, zeby historia generacji tez przezywala restart, trzeba ja
przeniesc z localStorage na IndexedDB albo zapis do pliku. To osobna zmiana
w pliku HTML, do zrobienia na zyczenie.

Aktualizacja tresci aplikacji
-----------------------------
Edytuj florist/app/index.html i zbuduj ponownie - kopia do app/ powstaje
automatycznie (npm run dist wywoluje najpierw npm run sync).

ALTERNATYWA BEZ BUDOWANIA (najszybsza, ale lzejsza forma)
---------------------------------------------------------
Jesli nie chcesz instalatora, mozesz "zainstalowac" plik HTML jako aplikacje
oknową wprost z przegladarki:
1. Otworz florist/app/index.html w Microsoft Edge.
2. Menu (...) > Aplikacje > Zainstaluj te witryne jako aplikacje
   (lub: ... > Wiecej narzedzi > Utworz skrot > zaznacz "Otworz jako okno").
3. Powstanie skrot w menu Start otwierajacy aplikacje w osobnym oknie.
Roznica: to cienki skrot do pliku w silniku przegladarki, bez wlasnej ikony
instalatora i bez pakowania. Dziala offline. Electron daje pelna, samodzielna
aplikacje z ikona i instalatorem.
