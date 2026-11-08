// Druck-HTML (Inhalt von <body>) für Klassenarbeit und Lösung. Ohne Dateizugriff: läuft im Build (PDF) und im Browser
// (Druckseite der Webapp). Kopf wie bei den echten Arbeiten: Name, Datum, BE und Note; auf der Lösung Punkteübersicht
// und Notentabelle nach dem Schlüssel der Schule. Die Note rechnet erst die App aus, wenn die Eltern am PC die BE eintragen.
const { aufgabeHtml, esc, WELLE, FACH } = require('./aufgabe');

const SMILEY = '<svg class="smiley" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="#000" stroke-width="1.6"/><circle cx="8.5" cy="10" r="1.3"/><circle cx="15.5" cy="10" r="1.3"/><path d="M7.5 14.5 Q12 18.5 16.5 14.5" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>';
const AFB_NAME = { 1: 'I', 2: 'II', 3: 'III' };

function punkteTabelle(ka) {
  const nr = ka.aufgaben.map((_, i) => `<td>${i + 1}</td>`).join('');
  const be = ka.aufgaben.map((a) => `<td>${a.be}</td>`).join('');
  const leer = ka.aufgaben.map(() => '<td></td>').join('');
  return `<table class="be-tabelle"><tr><th>Aufgabe</th>${nr}<th>Summe</th></tr><tr><th>BE</th>${be}<td><b>${ka.gesamtBe}</b></td></tr><tr><th>erreicht</th>${leer}<td></td></tr></table>`;
}

function notenTabelle(ka) {
  const zeilen = ka.noten.map((n) => `<tr><td><b>${n.note}</b> (${esc(n.wort)})</td><td>${n.ab === n.bis ? n.ab : `${n.ab} – ${n.bis}`} BE</td></tr>`).join('');
  return `<div class="noten"><table class="noten-tabelle"><tr><th>Note</th><th>BE (von ${ka.gesamtBe})</th></tr>${zeilen}</table>
<p>Notenschlüssel der Schule (Klassen 5 bis 10): 1 ab 96 %, 2 ab 80 %, 3 ab 64 %, 4 ab 48 %, 5 ab 32 %, darunter 6. Grenzen auf ganze BE gerundet.</p>
<p>Belohnungscode ab Note 3: In der App unter „Klassenarbeit“ am PC die erreichten BE eintragen.</p></div>`;
}

function klassenarbeitKoerper(ka, { loesung = false, fach = 'mathematik', klasse = 5 } = {}) {
  const kopf = `<header class="kopf"><div><div class="fach">${FACH[fach] || fach} · Klasse ${klasse}${loesung ? ' · Lösung und Bewertung' : ''}</div><h1>Klassenarbeit</h1></div><div class="marke">${WELLE}LERNWERK</div></header>`;
  const themen = `<p class="ka-info"><b>Lernbereiche:</b> ${ka.themen.map((t) => esc(t.titel)).join(' · ')}</p>`;
  const namen = loesung ? '' : `<div class="namenszeile"><span>Name:</span><span class="kurz">Datum:</span><span class="punkte">BE: ____ / ${ka.gesamtBe}</span><span class="punkte note">Note:</span></div>
<p class="ka-info">Arbeitszeit: ${ka.dauer} Minuten · Hilfsmittel: Lineal, Geodreieck · kein Taschenrechner · Schreibe deine Rechenwege auf.</p>`;
  const liste = ka.aufgaben.map((a, i) => aufgabeHtml(a, i + 1, { loesung, mitBe: true })).join('');
  const schluss = loesung
    ? `<section class="bewertung"><h2>Bewertung</h2>${punkteTabelle(ka)}${notenTabelle(ka)}
<p class="ka-info">Anforderungsbereiche: I Reproduzieren ${ka.afb[0]} BE · II Zusammenhänge herstellen ${ka.afb[1]} BE · III Verallgemeinern und Reflektieren ${ka.afb[2]} BE. Für richtige Teilschritte mit Folgefehler können Teil-BE vergeben werden.</p></section>`
    : `<p class="viel-erfolg">Viel Erfolg! ${SMILEY}</p>`;
  return `${kopf}${themen}${namen}<main>${liste}</main>${schluss}
<p class="fuss-hinweis">Lehrplan Mathematik Gymnasium Thüringen, Klassenstufen 5/6 · eigene Aufgaben · Variante ${esc(ka.seed)}</p>`;
}

module.exports = { klassenarbeitKoerper, AFB_NAME };
