# Entscheidungen

Neueste oben. Format: Datum · Entscheidung · Grund.

## 2026-10-29
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
