# Projekt: LERNWERK Thüringen – Aufgabenblätter & Lern-Webapp (Gymnasium)

## 1. Ziel

Ein lokales Projekt, das für Fächer des Thüringer Gymnasiums (Start: Latein, Geschichte, Mathematik; später Deutsch, Biologie, Englisch u. a.) lehrplanbasierte Lernmaterialien erzeugt:

1. **Themen-Aufgabenblatt** (druckfertig, A4, PDF + HTML)
2. **Testübung: genau 1 A4-Seite** pro Thema (inkl. Lösungsblatt für Eltern, separate Datei)
3. **Webapp (reines HTML/CSS/JS, offlinefähig)** mit denselben und weiteren Aufgaben, Duolingo-ähnlich (Herzen, XP, Streak, Lektionen)

Nutzer: Ein Elternteil erzeugt Material für Schülerinnen und Schüler der Klasse 5 an einem Thüringer Gymnasium. Sprache der Oberfläche und aller Materialien: **Deutsch**. Tonalität: kindgerecht, ermutigend, klar.

## 2. Lehrplanbasis (verbindlich)

- Quelle: **Thüringer Lehrpläne für Gymnasium** (Thüringer Ministerium für Bildung, Wissenschaft und Kultur / Schulportal Thüringen, schulportal-thueringen.de). Vor Beginn je Fach den aktuellen Lehrplan per Websuche/WebFetch beschaffen, Kompetenzbereiche und Themenfelder je Klassenstufe extrahieren.
- Ergebnis pro Fach als `curriculum/<fach>.yaml` ablegen (Klassenstufe → Themenfelder → Lernziele → Schlüsselbegriffe), jeweils mit `quelle:` (URL, Abrufdatum).
- **Keine erfundenen Lehrplanbezüge.** Was nicht verifiziert werden konnte, bekommt `verifiziert: false` und wird im Material nicht als „lehrplankonform" ausgewiesen. Bei Latein zusätzlich beachten: Das Lehrwerk (Schulbuch) der Schule bestimmt Reihenfolge und Lernwortschatz; Lehrwerk beim Nutzer erfragen und Vokabelreihenfolge daran ausrichten.
- Bereits vorhandener Prototyp: `legacy/LATINA_App.html` (Latein Kl. 5, 21 Einheiten, 248 Vokabeln). Inhalte daraus nach `content/latein/` migrieren und **fachlich gegen Lehrplan/Lehrbuch prüfen** (Fehler korrigieren, nicht blind übernehmen; der Prototyp wurde ohne Lehrplan-Volltext und ohne Lehrwerk erstellt).

## 3. Architektur

```
lernwerk/
├─ CLAUDE.md
├─ curriculum/            # Lehrplan-Extrakte je Fach (YAML)
├─ content/               # Einzige Wahrheitsquelle für Inhalte (YAML)
│  └─ <fach>/<klasse>/<thema>.yaml
├─ schema/                # JSON-Schema für Inhaltsdateien + Validator
├─ generator/             # Node.js Build-Skripte
│  ├─ worksheet.js        # Aufgabenblatt -> HTML -> PDF
│  ├─ test-page.js        # 1-Seiten-Test + Lösung
│  └─ webapp.js           # Statische Webapp bauen
├─ templates/             # HTML/CSS-Templates (print.css mit @page A4)
├─ output/
│  ├─ blaetter/<fach>/<thema>.pdf
│  ├─ tests/<fach>/<thema>_test.pdf + _loesung.pdf
│  └─ web/                # index.html + Assets, offline nutzbar
├─ legacy/LATINA_App.html # Prototyp als Inhaltsquelle
└─ tests/                 # Automatische Qualitätstests
```

Grundregel: **Inhalte einmal erfassen, mehrfach ausgeben.** Eine Inhaltsdatei erzeugt Arbeitsblatt, Test und Webapp-Lektion.

### Inhaltsformat (Beispiel)

```yaml
fach: latein
klasse: 5
thema: domus
titel: "Das römische Haus"
lehrplanbezug: ["<Themenfeld laut Lehrplan>"]
verifiziert: false
vokabeln:
  - lat: domus
    info: "domus, -us f."
    de: "Haus"
    beispiel: "Familia in domo habitat."
erklaerung: "Kurzer Merkkasten in Markdown"
aufgaben:
  - typ: zuordnung | multiple_choice | lueckentext | uebersetzung | richtig_falsch | freitext | rechnung | zeitleiste
    frage: "..."
    optionen: [...]
    loesung: "..."
    schwierigkeit: 1-3
    punkte: 1
```

Jeder Aufgabentyp muss sowohl **druckbar** (Schreibzeilen, Kästchen, Lückenstriche) als auch **interaktiv** (Webapp) renderbar sein.

## 4. Ausgabeformate

### 4.1 Aufgabenblatt (Druck)
- A4 hochkant, 15 mm Rand, `@page { size: A4; margin: 15mm }`, serifenlose, gut lesbare Schrift (≥ 12 pt, großzügiger Zeilenabstand), Schwarz-Weiß-tauglich (Drucker).
- Aufbau: Kopf (Fach, Thema, Name/Datum-Zeile), Merkkasten, 6–10 Aufgaben steigender Schwierigkeit, Platz zum Schreiben.
- PDF-Erzeugung per headless Chromium (Puppeteer/Playwright) aus dem HTML. Saubere Seitenumbrüche (`break-inside: avoid`).

### 4.2 Testübung (genau 1 A4-Seite)
- **Harte Grenze: 1 Seite.** Der Generator misst die gerenderte Höhe und bricht mit Fehler ab bzw. kürzt automatisch (Aufgaben nach Priorität), wenn > 1 Seite.
- Punkteschema pro Aufgabe, Gesamtpunkte, Feld für Punktzahl (Note nicht automatisch vergeben).
- Eigene **Lösungsdatei** (separates PDF) mit Erwartungshorizont.
- Jeder Test wird aus dem Aufgabenpool **zufällig variiert** (Seed speichern), damit Wiederholungen möglich sind.

### 4.3 Webapp
- Statische Seite (`output/web/index.html`, wenn möglich Single-File), mobil zuerst (Android-Chrome), **offlinefähig** (Service Worker + Web-App-Manifest, „Zum Startbildschirm hinzufügen").
- Duolingo-Mechaniken: Lektionen mit Fortschritt, Herzen, XP, Tages-Streak, Feedback-Leiste, Abschluss-Bildschirm mit Wissenswertem.
- Übungstypen: Karteikarten, Multiple Choice, Zuordnung, Lückentext, Eingabe (mit Toleranz bei Tippfehlern), Richtig/Falsch.
- Fortschritt lokal (`localStorage`), Export/Import des Lernstands als JSON-Datei.
- Fächerwahl auf der Startseite, danach Einheiten; Design warm, kindgerecht, kontrastreich, große Tippflächen (≥ 48 px).
- Keine Tracker, keine Konten, keine Werbung, keine Datenübertragung. Schriftarten lokal einbinden (kein CDN) für Offline-Betrieb und Datenschutz.

## 5. Fachspezifische Hinweise

- **Latein**: Vokabeln mit Genitiv/Genus bzw. Stammformen, Deklinationen/Konjugationen als Tabellen, Übersetzungssätze (lat→dt), Kultur-/Alltagswissen (römisches Leben). Lange Vokale optional markieren.
- **Geschichte**: Zeitleisten, Begriffe, Quellenkurzaufgaben, einfache SVG-Karten, Zuordnung Ereignis↔Zeit.
- **Mathematik**: Aufgaben **parametrisch generieren** (Zahlen zufällig, Lösung berechnet), Kopfrechnen, Textaufgaben, Geometrie mit SVG-Skizzen. Lösungen immer programmatisch berechnen und gegen Handrechnung testen.
- Weitere Fächer analog: erst `curriculum/<fach>.yaml`, dann Inhalte.

## 6. Qualitätsregeln

1. **Fachliche Korrektheit vor Menge.** Jede Aufgabe hat eine eindeutig richtige Lösung. Bei Latein/Geschichte/Fakten: Quellen nennen oder `verifiziert: false` setzen.
2. Altersgerechte Sprache (Klasse 5: kurze Sätze, wenig Fachjargon).
3. Schema-Validierung aller Inhaltsdateien im Build (Fehler = Build bricht ab).
4. Automatische Tests: Testseite = 1 Seite; keine doppelten Distraktoren in Multiple Choice; Lösung ist unter den Optionen; Mathe-Lösungen stimmen; PDF-Seitenzahl korrekt.
5. Barrierearm: ausreichende Kontraste, Farbe nie als einzige Information.
6. Urheberrecht: **keine Schulbuchtexte, Arbeitsblätter oder Bilder Dritter kopieren.** Eigene Formulierungen und Beispiele, selbst erzeugte Grafiken (SVG) oder gemeinfreie Quellen.

## 7. Bedienung (CLI)

```
npm run build -- --fach latein --klasse 5 --thema domus     # Blatt + Test + Web-Lektion
npm run blatt -- --fach latein --thema domus                # nur Aufgabenblatt-PDF
npm run test-seite -- --fach latein --thema domus --seed 42 # nur 1-Seiten-Test + Lösung
npm run web                                                  # komplette Webapp bauen
npm run validate                                             # Inhalte gegen Schema prüfen
npm run neu -- --fach geschichte --klasse 5 --thema "Frühe Kulturen"   # Gerüst für neues Thema
```

## 8. Arbeitsweise für Claude Code

1. Zuerst Plan (Plan-Modus) vorlegen, dann umsetzen. Kleine, lauffähige Schritte; nach jedem Schritt Build + Tests.
2. Reihenfolge:
   1. Projektgerüst, Schema, Validator
   2. Latein-Inhalte aus `legacy/LATINA_App.html` migrieren und prüfen
   3. Generator Aufgabenblatt (PDF) → visuell prüfen (PDF-Seite als Bild rendern)
   4. Generator 1-Seiten-Test + Lösung inkl. Seitenlängenprüfung
   5. Webapp-Generator (Offline/PWA), mobil testen
   6. Lehrplan-Extraktion Geschichte und Mathematik, je 3 Beispielthemen
   7. README mit Bedienung für Nicht-Entwickler
3. Lehrplan-Recherche je Fach vor dem Befüllen; offene Punkte in `OFFEN.md` sammeln (z. B. Lehrwerk, Stundenumfang, schulspezifische Besonderheiten).
4. Bei Unsicherheit über Inhalte nachfragen statt raten. Entscheidungen kurz in `DECISIONS.md` dokumentieren.
5. Ausgaben nur in `output/`, Inhalte nur in `content/`. Keine Geheimnisse oder personenbezogenen Daten ins Repo.

## 9. Abnahmekriterien (Definition of Done)

- [ ] `npm run build` erzeugt für mindestens 3 Latein-Themen: Arbeitsblatt-PDF, 1-Seiten-Test-PDF, Lösungs-PDF, Webapp-Lektion
- [ ] Testseiten sind verlässlich genau 1 A4-Seite (automatisch geprüft)
- [ ] Webapp läuft offline auf Android-Chrome und lässt sich zum Startbildschirm hinzufügen
- [ ] Lehrplan-YAML für Latein, Geschichte, Mathematik (Kl. 5) mit Quellenangabe vorhanden
- [ ] Alle Inhalte schema-valide; nicht verifizierte Inhalte sind gekennzeichnet
- [ ] README erklärt: neues Thema anlegen, Blatt drucken, Webapp aufs Handy bringen
