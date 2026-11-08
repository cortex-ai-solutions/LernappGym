// Druck-HTML für Arbeitsblatt, Test und Lösung. Eine Aufgabe (Instanz aus generate.js) wird je nach
// Eingabeart als Schreiblinie, Kästchen, Ankreuzfeld, Kästchenraster oder Diagramm gesetzt.
// Im Lösungsmodus stehen die Antworten an derselben Stelle wie die leeren Felder.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { fontFaceCss } = require('./fonts');
const { aufgabeHtml, zahlenMono, esc, WELLE, FACH } = require('./aufgabe');

const CSS = fs.readFileSync(path.join(__dirname, '..', '..', 'templates', 'print.css'), 'utf8');

function seite({ doc, aufgaben, art, loesung, seed, gesamtBe, code }) {
  const titelZusatz = { blatt: '', test: 'Testübung: ', }[art] ?? '';
  const kopfzeile = `<header class="kopf"><div><div class="fach">${FACH[doc.fach] || doc.fach} · Klasse ${doc.klasse}${loesung ? ' · Lösung' : ''}</div><h1>${esc(titelZusatz + doc.titel)}</h1></div><div class="marke">${WELLE}LERNWERK</div></header>`;
  const namen = loesung ? '<div style="height:4mm"></div>' : art === 'test'
    ? `<div class="namenszeile"><span>Name:</span><span class="kurz">Datum:</span><span class="punkte">Punkte: ____ / ${gesamtBe}</span></div>`
    : `<div class="namenszeile"><span>Name:</span><span class="kurz">Datum:</span></div>`;
  const merke = art === 'blatt' && doc.erklaerung
    ? `<div class="merke"><span class="merke-label">Merke</span>${marked.parse(doc.erklaerung)}</div>` : '';
  const liste = aufgaben.map((a, i) => aufgabeHtml(a, i + 1, { loesung, mitBe: art === 'test' })).join('');
  const lehrplan = doc.verifiziert && doc.lehrplanbezug?.length
    ? `Lehrplanbezug: ${doc.lehrplanbezug.map(esc).join('; ')}` : 'Lehrplanbezug nicht verifiziert';
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${esc(doc.titel)}${loesung ? ' – Lösung' : ''}</title>
<style>${fontFaceCss()}\n${CSS}</style></head>
<body class="${loesung ? 'loesung' : ''}">${kopfzeile}${namen}${merke}<main>${liste}</main>
${loesung && code ? belohnungHtml(aufgaben, code) : ''}
<p class="fuss-hinweis">${lehrplan} · Variante ${esc(seed)}</p></body></html>`;
}

// Belohnungscode ab 90 % richtig gelöster Teilaufgaben (Wunsch der Eltern, 08.11.2026)
const CODE_AB = 0.9;
function erlaubteFehler(aufgaben) {
  const n = aufgaben.reduce((s, a) => s + (a.teile ? a.teile.length : 1), 0);
  return { n, fehler: Math.floor(n * (1 - CODE_AB) + 1e-9) };
}
function belohnungHtml(aufgaben, code) {
  const { n, fehler } = erlaubteFehler(aufgaben);
  const regel = fehler ? `Bei ${n} Teilaufgaben: höchstens ${fehler} Fehler.` : `Bei ${n} Teilaufgaben heißt das: alles richtig.`;
  return `<div class="belohnung"><div><b>Belohnungscode ab 90 % richtig</b><br>${regel} Gebt ihn eurem Kind: Im Katzenalbum der App eingetippt, schaltet er ein Gold-Bild frei.</div><span class="code">${esc(code)}</span></div>`;
}

module.exports = { seite, aufgabeHtml, erlaubteFehler, CODE_AB };
