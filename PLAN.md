# LERNWERK Thüringen: Umsetzungsplan

Stand: 29.10.2026 · Grundlage: `CLAUDE.md`, Ordnerprüfung, jüngste Nachbarprojekte, `design.md` im Hub

## 0. Befund der Ordnerprüfung

| Erwartet laut CLAUDE.md | Tatsächlich vorhanden |
|---|---|
| `legacy/LATINA_App.html` (Latein-Prototyp, 248 Vokabeln) | **fehlt** |
| Lehrwerk Latein | unbekannt |
| – | `Materialien/`: **Mathematik Kl. 5**: 1. TÜ (08.09.26), 2. TÜ (02.10.26), zwei Verbesserungen (Scans), Tafelbild-Export „II Natürliche Zahlen" (28 S.) |

Inhalt der echten Tests (gibt Niveau und Format der Schule vor):
- **1. TÜ (24 BE):** Strichliste → Säulen-/Balkendiagramm, Runden (Zehner bis Hunderttausender), große Zahlen Wort ↔ Ziffer
- **2. TÜ (27 BE, 40 min):** Kopfrechnen, Fachbegriffe Summe/Differenz/Produkt/Quotient, Platzhalteraufgaben (47 − ∎ = 23), Textaufgaben mit Antwortsatz
- Bewertung in **BE** (Bewertungseinheiten), Kopf „Klasse / Datum / Name / BE / Note", Abschluss „Viel Erfolg 😊"

**Folge:** Ich schlage vor, **mit Mathematik zu starten** statt mit Latein. Für Mathe gibt es echtes Material und einen laufenden Bedarf; für Latein fehlen Prototyp und Lehrwerk.

## 1. Orientierung an den Nachbarprojekten

| Muster | Quelle | Übernahme |
|---|---|---|
| Repo unter Org `cortex-ai-solutions`, `gh` ist eingeloggt | Förderlotse, Haushalt, Wetter | Repo `cortex-ai-solutions/LernappGym` |
| GitHub Pages + GitHub Actions | Omni-Weather-Hub (`.github/workflows/`) | Build + Deploy per Actions, kein manueller Push von Build-Dateien |
| Single-File-HTML aus Template + eingebetteten Daten | Förderlotse `dashboard/build_dashboard.py` | Webapp als eine `index.html` + `sw.js` + `manifest.webmanifest` |
| README mit Tabellen „Struktur / Betrieb / Grundsätze" | Förderlotse | gleiche Gliederung, plus Abschnitt für Nicht-Entwickler |
| `status.md` (Scanner v1) + Wiki-Stub | Hub-Checkliste | nach Dashboard-Anlage (Schritt 9) |
| Strenge `.gitignore` für Rohmaterial | Förderlotse (`quellen/`, `.env`) | `Materialien/` bleibt lokal (siehe 5.) |

## 2. Design: Cortex-CI kindgerecht umgesetzt

Grundlage `design.md` (Hub). Die App ist ein Eigenprojekt, darum gilt das Cortex-CI und keine fremde Marke.

**Webapp (Bildschirm):**
- Teal-Dunkel als Fläche (`#002B36` → `#004D5C`, radialer Body-Gradient), Gold-Gradient für Primär-Buttons, XP-Anzeige und Fortschrittsbalken; Text `#F5F0E8` / `#E8C97D`
- Montserrat für Überschriften und Buttons, Inter für Aufgabentexte, JetBrains Mono für Rechnungen (Stellenwerte stehen untereinander). **Schriften lokal als woff2** (OFL-Lizenz), kein Google-CDN, wegen Offline und Datenschutz
- Kindgerecht trotz Premium-CI: größere Schrift (Aufgaben ≥ 20 px), Tippflächen ≥ 56 px, runde Karten (16 px), Goldwelle als Deko im Abschluss-Screen, freundliche Mikrotexte
- Feedback-Leiste: `--color-status-live` (#2D9E6B) für richtig, `--color-status-danger` (#B84040) für falsch, **immer mit Symbol + Text** (✓ Richtig! / ✗ Fast …), damit Farbe nie allein trägt
- Kontraste nach WCAG AA prüfen (Gold auf Teal reicht für große Schrift, Fließtext in Warmweiß)
- Gemeinsame CSS-Tokens in `templates/tokens.css`, eingebettet aus dem Hub-Design (keine Kopie mit Abweichungen)

**Druck (Arbeitsblatt, Test, Lösung):** Das dunkle CI ist auf Papier ungeeignet (Toner, S/W-Drucker). Deshalb weißes Blatt, Schwarz, Montserrat/Inter, kleines Cortex-Wellensymbol in Graustufen in der Fußzeile. Testkopf wie in der Schule: *Klasse · Datum · Name · BE: __ / xx · Note* (das Notenfeld bleibt leer).

## 3. Architektur (Repo-Wurzel = dieser Ordner)

```
Lernapp Gym/                     → Repo cortex-ai-solutions/LernappGym
├─ CLAUDE.md, PLAN.md, README.md, DECISIONS.md, OFFEN.md, status.md
├─ curriculum/mathematik.yaml   # Thüringer Lehrplan Gym., Kl. 5/6, mit quelle + abrufdatum
├─ content/mathematik/5/
│  ├─ grosse-zahlen.yaml        # Stellenwerte, Wort↔Ziffer
│  ├─ runden.yaml
│  ├─ daten-diagramme.yaml      # Strichliste, Säulen-/Balkendiagramm
│  ├─ grundrechenarten.yaml     # Kopfrechnen, Fachbegriffe, Platzhalter
│  └─ textaufgaben.yaml
├─ schema/content.schema.json + validate.js   (ajv)
├─ generator/
│  ├─ tasks/math/*.js           # parametrische Aufgabengeneratoren (seedbar, Lösung berechnet)
│  ├─ render/print/*.js         # je Aufgabentyp: HTML für Papier
│  ├─ render/web/*.js           # je Aufgabentyp: Daten für die Webapp
│  ├─ worksheet.js  test-page.js  webapp.js  build.js  neu.js
├─ templates/  tokens.css  print.css  web.css  app.html  fonts/*.woff2
├─ tests/                        # node:test
├─ .github/workflows/pages.yml
├─ Materialien/                  # NUR LOKAL (gitignored)
└─ output/                       # gitignored, entsteht in CI und lokal
```

**Technik:** Node 24 (lokal vorhanden), `js-yaml`, `ajv`, `playwright` (Chromium für PDF und Seitenmessung), `seedrandom`. Kein Framework; Webapp in Vanilla JS wie bei den Nachbarprojekten.

**Mathe-Aufgaben parametrisch:** Inhaltsdateien beschreiben *Aufgabenvorlagen* statt fester Zahlen, z. B.
```yaml
- typ: rechnung
  generator: platzhalter          # 47 − ∎ = 23
  parameter: { operation: [+, −, ·, :], bereich: [10, 200] }
  be: 1
  schwierigkeit: 2
```
Der Generator zieht Zahlen per Seed, berechnet die Lösung und prüft Bedingungen (ganzzahlige Division, kein negatives Ergebnis, Klasse-5-Zahlenraum). Textaufgaben sind eigene Vorlagen im Stil der Schule (Tierbeine, Bahnfahrt, Verein), **nicht** die Originalaufgaben der Lehrerin.

## 4. Ausgaben

1. **Arbeitsblatt** (A4, 15 mm, ≥ 12 pt): Kopf, Merkkasten, 6–10 Aufgaben steigend, Kästchen-/Linienraster zum Rechnen, Diagrammraster zum Zeichnen
2. **Test, genau 1 Seite**, plus Lösungsblatt: Zufallsauswahl per Seed (Seed steht klein in der Fußzeile, damit sich ein Test genau wiederholen lässt). Playwright misst `scrollHeight` gegen 267 mm Nutzhöhe; ist der Test zu lang, fliegt die Aufgabe mit der niedrigsten Priorität raus, bis er passt. Danach wird die PDF-Seitenzahl geprüft (muss 1 sein).
3. **Webapp (PWA):** Fächerwahl → Einheiten-Pfad → Lektion (10–12 Aufgaben aus dem Generator, jedes Mal neue Zahlen) → Abschluss mit XP und „Wusstest du schon?". Herzen (5, eins pro Stunde zurück), Tages-Streak, Fortschritt in `localStorage`, Export/Import als JSON. Übungstypen: Multiple Choice, Eingabe (Zahlen exakt, Wörter mit Tippfehler-Toleranz), Zuordnung, Lückentext, Richtig/Falsch, Karteikarte, **Diagramm ablesen** (SVG). Service Worker mit Cache-Versionierung pro Build.
4. **Druckzentrale in der Webapp:** Die in der CI gebauten PDFs liegen mit auf der Page (`/pdf/...`), damit sich vom Handy aus ein frischer Test drucken lässt.

## 5. GitHub-Repo und GitHub Pages

- Repo `cortex-ai-solutions/LernappGym`, **öffentlich**, Pages per Branch-Deploy aus `main:/docs`. So sind auch omni-weather-hub, busplan, steuerspirale und Haushaltsviewer eingerichtet (geprüft am 29.10.2026). `npm run web` schreibt die Webapp samt PDFs nach `docs/`, und dieser Ordner wird eingecheckt.
- Workflow `check.yml`: bei jedem Push `npm ci` → `npm run validate` → `npm test`. Ein roter Haken zeigt kaputte Inhalte an.
- URL: `https://cortex-ai-solutions.github.io/LernappGym/` (alle Pfade relativ, Manifest-`scope` passend gesetzt)
- **Nicht ins Repo:** `Materialien/` (Arbeitsblätter der Lehrerin sind urheberrechtlich geschützt; die Scans der Verbesserungen enthalten Handschrift und Namen). Keine Namen, keine Schule und keine Klassenbezeichnung im Code. Die Klasse ist im Testkopf ein freies Eingabefeld.
- Optional später: Wenn die Seite nicht frei auffindbar sein soll, Verschlüsselung per StatiCrypt wie bei `lotse-suhl`. Das verträgt sich aber schlecht mit Offline-PWA und Service Worker, deshalb ist es nicht der Standard.

## 6. Qualitätssicherung (automatisch, bricht den Build ab)

- Schema-Validierung aller `content/**/*.yaml`
- Mathe: 1 000 Seeds je Generator → Lösung gegen unabhängige Referenzrechnung; Zahlenraum- und Ganzzahligkeitsregeln
- Multiple Choice: Lösung unter den Optionen, keine doppelten Distraktoren
- Test-PDF hat genau 1 Seite, Arbeitsblatt-PDF hat die erwartete Seitenzahl
- Visuelle Kontrolle: erste PDF-Seite als PNG rendern, von mir angesehen vor jeder Abnahme
- Webapp: Playwright-Smoke-Test mit Mobil-Viewport (Pixel 7) inklusive Offline-Modus (`context.setOffline(true)` nach dem ersten Laden)
- Lehrplanbezug nur mit `verifiziert: true`, wenn die Quelle tatsächlich geprüft wurde

## 7. Schritte (je Schritt: lauffähig, Build + Tests grün, kurzer Bericht)

| # | Schritt | Ergebnis |
|---|---|---|
| 1 | Gerüst: `package.json`, Schema, Validator, `.gitignore`, `git init`, `DECISIONS.md`, `OFFEN.md` | `npm run validate` läuft |
| 2 | Lehrplan Mathematik Thüringen Gym. Kl. 5/6 recherchieren → `curriculum/mathematik.yaml` | Quelle + Abrufdatum, Themenfelder |
| 3 | Mathe-Generatoren für die 5 Themen aus TÜ 1/2 + Tests | 1 000-Seed-Test grün |
| 4 | Arbeitsblatt-Generator (HTML → PDF), visuelle Prüfung | `output/blaetter/mathematik/*.pdf` |
| 5 | 1-Seiten-Test + Lösung, Seitenlängen-Automatik, Seed | `output/tests/...` |
| 6 | Webapp im Cortex-Design, PWA, Mobil-/Offline-Test | `output/web/` |
| 7 | GitHub-Repo anlegen, Actions-Workflow, Pages aktivieren | Live-URL |
| 8 | README für Nicht-Entwickler (neues Thema, drucken, App aufs Handy) | Abnahme |
| 9 | Hub-Pflege: Dashboard-ID → `status.md` → Sync → `wiki/projects/<id>.md`, `wiki/index.md`, `wiki/log.md` | Projekt im Dashboard |
| 10 | Latein (sobald Lehrwerk und Prototyp da sind), danach Geschichte | je 3 Themen |

## 8. Offene Fragen (gehen in `OFFEN.md`)

1. **Startfach:** Mathe zuerst (Material vorhanden) statt Latein wie in CLAUDE.md vorgesehen?
2. **Latein:** Wo liegt `LATINA_App.html`? Welches Lehrwerk nutzt die Schule (z. B. Campus, Prima, Adeamus, Pontes)?
3. **Mathe-Lehrbuch:** Welches Buch ist „LB" (Verlag/Titel)? Danach richte ich Reihenfolge und Begriffe aus, ohne Inhalte zu kopieren.
4. **Öffentlichkeit:** Ist ein öffentliches Repo samt offener Page in Ordnung, oder soll sie geschützt sein (mit den Abstrichen bei Offline)?
5. **Dashboard-ID:** Bitte das Projekt im Cortex-Dashboard über „+ Neues Projekt" anlegen und mir die `id` geben (ich darf sie nicht selbst vergeben).
6. **Verbesserungen auswerten?** Die Scans der Verbesserungen könnte ich lokal ansehen, um Fehlerschwerpunkte zu erkennen und die Übungen darauf zu gewichten. Dabei würde nichts davon ins Repo gelangen.
