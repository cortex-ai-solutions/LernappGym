# Entscheidungen

Neueste oben. Format: Datum · Entscheidung · Grund.

## 2026-10-29
- **Struktur der App (Vorgabe Nutzer):** Startseite = Fächerwahl. Im Fach eine Karte je Aufgabengebiet mit „Üben“ (interaktiv), „Merke“, „Arbeitsblatt“ und „Lösung“ (PDF zum Drucken). Die Blätter liegen beim Fach, nicht auf der Startseite.
- **Generatoren laufen im Browser** (`generator/bundle.js` packt sie in die Seite): jede Übung hat neue Zahlen, auch offline. Herzen gelten je Übung (5), XP und Tages-Streak gesamt, Sterne je Thema (bester Durchgang).
- **Zahlwörter in der App:** „einhundert“ = „hundert“, Leerzeichen egal, ein Tippfehler wird bei langen Wörtern mit Hinweis akzeptiert.
- **Service Worker** cached alle Dateien in `docs/` inklusive PDFs (≈ 1,2 MB), Cache-Version = Hash über den Inhalt.
- **Arbeitsblatt:** 6–10 Aufgaben, nach Schwierigkeit sortiert (●○○ statt BE). Reicht die Inhaltsdatei nicht, werden Generator-Aufgaben mit neuen Zahlen wiederholt. Besser ist, die Datei zu ergänzen; der Test prüft das ab 6 Aufgaben. Lösungsblatt ohne Namenszeile, Antworten an der Stelle der Felder.
- **Kästchenraster als SVG**, weil CSS-Verlaufsraster im Chromium-PDF verschwinden. Diagramme: 4 mm je Einheit, Zeichenraster: 5 mm (Heftkästchen).
- **PDFs auf der GitHub Page** (`npm run blatt -- --alle --veroeffentlichen` → `docs/blaetter/`), damit vom Handy aus gedruckt werden kann.
- **Generatoren liefern ein gemeinsames Instanz-Format** (`anweisung`, `teile[]` mit `loesung`/`antwort`/`eingabe`, optional `daten`, `weg`, `antwortsatz`). Druck und Webapp rendern daraus, damit eine Aufgabe überall gleich gelöst wird. Jede Instanz trägt ihre Rohdaten in `pruefung`, damit Tests unabhängig nachrechnen.
- **Zahlwörter:** Blöcke wie „101 Millionen“ (hunderteine Million) werden nicht erzeugt, weil die Schreibweise uneinheitlich ist. Hunderter werden mit „ein“ geschrieben (einhundert).
- **Diagramm zeichnen ist nur für den Druck** (`nur: druck`). In der Webapp gibt es Diagramme zum Ablesen.
- **Übergangs-Startseite** in `docs/` verlinkt die bestehenden Apps, bis der Webapp-Generator (Schritt 6) sie ersetzt.
- **Lehrplanbasis Mathe = Erprobungsfassung 2026** (Stand 25.08.2026, in Kraft ab 2026/27 für Kl. 5/6), nicht der Lehrplan 2018. Lehrplanbezüge in `content/` verweisen auf die Kapitelnummern 2.1.x.
- **Mathematik zuerst** (statt Latein wie in CLAUDE.md §8). Grund: Es gibt aktuelles Unterrichtsmaterial (Stand 09/2026), und die Latein- und Geschichts-Apps sind bereits im Einsatz.
- **Bestehende Apps als Vorlage:** `LATINA_App.html` und `geschichte-lernapp.html` liegen jetzt in `legacy/`. Übernommen werden die bewährten Mechaniken (Screens Home → Lektion → Übung → Abschluss, Herzen, XP, Karteikarte, MC, Zuordnung, Lückentext) und die Lektionsstruktur der Geschichts-App (Abschnitte mit Erklärung vor den Übungen). Inhalte werden später migriert und geprüft.
- **Punkte heißen `be`** (Bewertungseinheiten) statt `punkte`. So steht es auf den Tests der Schule.
- **Mathe-Aufgaben sind Vorlagen** (`generator` + `parameter`). Zahlen werden per Seed gezogen, Lösungen berechnet. Eigene Aufgaben im Stil der Schule, keine Kopien der TÜ-Aufgaben.
- **Design:** Cortex-CI (`design.md` im Hub) für die Webapp, Druck in Schwarz-Weiß. Schriften lokal als woff2.
- **GitHub wie bei den übrigen Pages-Projekten** (omni-weather-hub, busplan, steuerspirale, Haushaltsviewer): öffentliches Repo unter `cortex-ai-solutions`, Pages per Branch-Deploy aus `main:/docs`. Die gebaute Webapp wird deshalb nach `docs/` geschrieben und eingecheckt. Das ist eine bewusste Ausnahme von „Ausgaben nur in `output/`“. PDFs und Zwischenstände bleiben in `output/`.
- **`Materialien/` ist gitignored.** Grund: Urheberrecht der Lehrkraft, Scans mit Handschrift und Namen.

## 2026-10-29 – Größen und Kommazahlen

- Drei neue Aufgabengebiete auf Wunsch der Eltern: **Längen und Massen**, **Zeit**, **Kommazahlen** (Komma verschieben, plus/minus, mal/geteilt durch einstellige Zahl, vergleichen, Stellenwerte, Euro/Cent). Lehrplanbezug 2.1.3 Größen und 2.1.5 Gebrochene Zahlen (Dezimalbrüche).
- Generatoren rechnen intern ganzzahlig in der kleinsten Einheit (mm, mg, s, ct) bzw. als Ganzzahl mit Stellenzahl; erst die Lösung wird durch 10^k geteilt. So entstehen keine Rundungsfehler wie 0,30000000000000004.
- Höchstens 3 Nachkommastellen in Lösungen (Klasse 5). Zeit ohne Kommaschreibweise (kein „2,5 h“), stattdessen „2 h 30 min“.
- Neue Eingabeart `felder` für „217 min = ∎ h ∎ min“: ein Feld je Einheit, im Druck ein Kästchen je Einheit.
- Eingabe von Kommazahlen: Komma ist immer Dezimalkomma; ein Punkt gilt nur dann als Komma, wenn die erwartete Lösung eine Kommazahl ist (manche Handy-Tastaturen haben kein Komma). Sonst bleibt der Punkt Tausenderpunkt.
- Tests lesen die Aufgabentexte zurück und rechnen mit eigener Einheitentabelle bzw. exakt mit BigInt nach (je 1000 Seeds).


## 2026-10-31 – Arbeitsblatt-Vorrat und Update-Banner

- **Arbeitsblatt-Vorrat statt Zufall im Browser:** Je Thema liegen 5 feste Varianten (A–E) mit Lösung auf der Page (`<thema>_<V>.pdf`, Seed = Buchstabe). Der Knopf ↻ auf der Karte schaltet zur nächsten Variante; die Wahl wird im Lernstand gespeichert. Grund: Blatt und Lösung passen über den Buchstaben (steht auch im Fuß des Blatts) sicher zusammen, und jede Variante ist im Build geprüft. Mehr Varianten: `VARIANTEN` in `generator/worksheet.js`.
- Der Service Worker lädt vom Vorrat nur Variante A vorab; B–E landen beim ersten Öffnen im Cache. So bleibt die Installation auf dem Handy klein.
- **Update-Banner wie im Busplan:** Neue Versionen werden beim Start und bei jeder Rückkehr in die App gesucht. Ist eine geladen, erscheint unten „Neue Inhalte verfügbar – Aktualisieren“; erst der Tipp aktiviert sie (`SKIP_WAITING`) und lädt neu. Die Installation umgeht dabei den HTTP-Cache von GitHub Pages (`cache: 'reload'`). Das Banner wird in alle Seiten eingebaut, auch in die Latein- und Geschichts-App.

## 2026-10-31 – Elternbericht per Link

- **Fortschritt für Eltern ohne Server und ohne Konten** (Wunsch der Eltern; die App kann auch bei Freundinnen installiert sein). Das Kind gibt beim ersten Start seinen Namen ein, die App protokolliert je Fach und Thema Runden, Anteil richtig, geschafft, Verlauf und Fehlerschwerpunkte (`templates/lernwerk.js`, Speicher `lernwerk_protokoll_v1`). „📤 Bericht an deine Eltern“ (Startseite und Mathe) öffnet das Teilen-Menü mit einem Link auf `eltern/`. Die Daten stecken komprimiert im `#`-Teil, der nie an einen Server geht. Die Grundregel „keine Datenübertragung“ bleibt so gewahrt: Es wird nur geteilt, was das Kind selbst abschickt.
- **Kein Eltern-Login:** Ein Eltern-Handy ist das Gerät, auf dem Berichte geöffnet werden. Dort werden sie gespeichert (`lernwerk_eltern_v1`, bis 40 je Kind); daraus entstehen Verlauf und „+n seit dem letzten Bericht“. Kein Elternbereich auf dem Handy des Kindes (Entscheidung der Eltern).
- **Gedruckte Arbeitsblätter bleiben außen vor**, die Eltern bewerten sie selbst.
- **Latein und Geschichte** melden über kleine Haken in `legacy/` an dasselbe Protokoll (Latein je Einheit und Vokabel, Geschichte je Lektion und Quizfrage). Stände von vor der Aufzeichnung kommen als Zusammenfassung mit.
- Mathe-Aufgaben haben jetzt ein optionales Feld `bezeichnung`, wenn die Anweisung Zufallswerte enthält oder im Thema doppelt ist. Ein Test erzwingt das.
- **Update-Banner korrigiert:** Neu geladen wird erst nach `controllerchange`. Vorher konnte ein Neuladen mitten im Versionswechsel hängen bleiben (im Test etwa jedes vierte bis zehnte Mal). Dasselbe Muster steckt im Busplan.
