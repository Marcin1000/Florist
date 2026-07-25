FLORIST AI - projekt Android (.apk)
====================================

Co to jest
----------
Natywna nakladka Android (WebView), ktora laduje wersje lawendowa aplikacji
wbudowana w plik aplikacji (assets/index.html, kopia app/index.html). Calosc
dziala offline, bez hostingu. Internet jest potrzebny tylko do funkcji AI
(OpenAI), tak jak w wersji webowej.

Wymagania
---------
- Android Studio (aktualne wydanie).
- Telefon z Androidem 10 lub nowszym (minSdk 29).

Uwaga: w repo jest tylko gradle/wrapper/gradle-wrapper.properties, bez gradlew
i gradle-wrapper.jar. Android Studio dociaga wrapper samo przy pierwszym otwarciu.
Jesli chcesz budowac z linii komend, wygeneruj go raz: gradle wrapper.

Build (krok po kroku)
---------------------
1. Sklonuj repozytorium.
2. Android Studio: File > Open > wskaz folder platforms/android w klonie.
3. Poczekaj na Gradle Sync (przy pierwszym otwarciu Studio dociagnie Gradle
   i zaleznosci - potrzebny internet tylko na tym etapie).
4. Szybki test na telefonie: podlacz telefon (debugowanie USB) i wcisnij Run,
   albo zbuduj plik:
   - APK debugowy: Build > Build Bundle(s) / APK(s) > Build APK(s).
     Plik powstanie w app/build/outputs/apk/debug/app-debug.apk
     (wystarczy do instalacji u siebie).

APK podpisany (do dystrybucji lub stabilnej instalacji)
-------------------------------------------------------
1. Build > Generate Signed Bundle / APK > APK.
2. Create new... (jesli nie masz keystore) - zapisz plik .jks i hasla.
   To Twoj klucz podpisu, trzymaj go - bez niego nie zaktualizujesz apki.
3. Wybierz wariant release > Finish.
4. APK powstanie w app/release/ (lub wskazanym katalogu).

Instalacja na telefonie
-----------------------
1. Skopiuj plik .apk na telefon.
2. Otworz go menedzerem plikow. Android poprosi o zgode
   "instaluj z nieznanych zrodel" dla tej aplikacji - zaakceptuj.
3. Po instalacji ikona Florist pojawi sie na ekranie.

Funkcja AI (OpenAI)
-------------------
- Wymaga klucza OpenAI, wpisywanego w aplikacji (Pracownia AI > Ustaw klucz API).
- Aparat i wybor zdjecia dzialaja przez natywny selektor pliku (obsluzony w
  MainActivity). Przy pierwszym uzyciu aparatu aplikacja poprosi o zgode CAMERA.
- Pobieranie wygenerowanych obrazow i eksport CSV trafiaja do folderu Pobrane.

ZAPISYWANIE DANYCH (pamiec) - wazne
-----------------------------------
Aplikacja korzysta z localStorage WebView (wlaczone w MainActivity przez
domStorageEnabled). Dane siedza w katalogu danych aplikacji na telefonie.

Trwale (przezywaja zamkniecie aplikacji i restart telefonu):
- Historia wycen (zakladka Historia) - klucz "floraklos_wyceny".
  To czysty tekst: pozycje, ceny, marza, sezon, data. Lekki, bez limitow.
- Klucz OpenAI - klucz "floraklos_oai".
- Wybrany jezyk PL/EN - klucz "floraklos_lang".

Nietrwale (tylko w trakcie sesji, znika po zamknieciu lub odswiezeniu):
- Historia generacji AI (pasek miniatur w Pracowni AI).
  Trzymana wylacznie w pamieci JavaScript, NIE w localStorage. Tak samo
  zachowuje sie wersja webowa. Powod: kazda generacja to trzy pelne obrazy
  PNG w base64; zapisanie kilkunastu takich przekroczyloby limit localStorage
  (kilka MB). Dlatego swiadomie nie jest zapisywana.

Kiedy dane znikaja:
- Ustawienia > Aplikacje > Florist > Wyczysc dane.
- Odinstalowanie aplikacji.
Backup/restore Androida moze, ale nie musi, przenosic te dane miedzy
telefonami (allowBackup=true).

Jesli chcesz, zeby historia generacji tez przezywala restart, trzeba ja
przeniesc z localStorage na IndexedDB albo zapis do pliku w aplikacji
(obrazy sa za duze na localStorage). To osobna zmiana w pliku HTML, do
zrobienia na zyczenie.

Zmiana nazwy paczki / wersji
----------------------------
- applicationId i namespace: com.floristai.app (app/build.gradle.kts,
  AndroidManifest nie wymaga zmian - korzysta z ${applicationId}).
- versionCode / versionName: app/build.gradle.kts.

Aktualizacja tresci aplikacji
-----------------------------
Edytuj app/index.html. Kopia w assets powstaje automatycznie
przy budowaniu (zadanie Gradle syncFloristApp).
