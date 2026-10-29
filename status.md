# Projektstatus: Lernapp Gym (LERNWERK Thüringen)
<!-- Cortex AI Dashboard Scanner v1 — wird automatisch durch den Sync-Button eingelesen -->

## Meta
id: lernapp-gym-1793297694589
status: dev
lastUpdate: 2026-10-29
monthlyRevenue: 0
monthlyRunningCost: 0

## Nächste Aktionen
- [x] Projektgerüst, Inhaltsschema und Validator (npm run validate, npm test)
- [x] Lehrplan Mathematik Thüringen Gymnasium Kl. 5/6 extrahieren (Erprobungsfassung 2026)
- [x] Mathe-Generatoren (14 Stück, 5 Themen): große Zahlen, Runden, Grundrechenarten, Sachaufgaben, Diagramme – 1000-Seed-Tests grün
- [x] Arbeitsblatt-PDF + Lösungsblatt (5 Mathe-Themen, auf der GitHub Page druckbar)
- [ ] 1-Seiten-Test + Lösung mit Seitenlängenprüfung
- [ ] Webapp (PWA, offline) im Cortex-Design
- [x] GitHub-Repo cortex-ai-solutions/LernappGym angelegt
- [x] GitHub Pages aktiv (Übergangs-Startseite mit Latein- und Geschichts-App)

## Offene Punkte
🟡 [Mittel] Lehrbuch Mathematik und Lehrwerk Latein klären
🟢 [Niedrig] Latein- und Geschichts-App (legacy/) in das neue Inhaltsformat migrieren

## KPIs
Technologie: Node.js, YAML-Inhalte, Playwright (PDF), Vanilla-JS-PWA
Fächer: Mathematik (im Aufbau), Latein + Geschichte (Bestands-Apps)
Repo: https://github.com/cortex-ai-solutions/LernappGym
URL: https://cortex-ai-solutions.github.io/LernappGym/
Mathe-Themen: 5 (Kl. 5, Lehrplan 2.1.1 + 2.1.2)
Tests: 16 (davon 7 mit je 1000 Zufalls-Seeds, 1 PDF-Test)
Arbeitsblätter: https://cortex-ai-solutions.github.io/LernappGym/#blaetter

## Notizen
Lehrplanbasierte Lernmaterialien für Klasse 5 am Thüringer Gymnasium. Ein Thema wird einmal als YAML erfasst und ergibt Arbeitsblatt, 1-Seiten-Test mit Lösung und eine Webapp-Lektion (Herzen, XP, Streak, offlinefähig). Start mit Mathematik, orientiert an den Unterrichtsthemen Stand 09/2026.
