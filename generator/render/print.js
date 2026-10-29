// Druck-HTML für Arbeitsblatt, Test und Lösung. Eine Aufgabe (Instanz aus generate.js) wird je nach
// Eingabeart als Schreiblinie, Kästchen, Ankreuzfeld, Kästchenraster oder Diagramm gesetzt.
// Im Lösungsmodus stehen die Antworten an derselben Stelle wie die leeren Felder.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { fontFaceCss } = require('./fonts');
const { diagramm, striche, raster, esc } = require('./svg');
const { fmt } = require('../lib/zahlen');

const CSS = fs.readFileSync(path.join(__dirname, '..', '..', 'templates', 'print.css'), 'utf8');
const FACH = { mathematik: 'Mathematik', latein: 'Latein', geschichte: 'Geschichte' };

// Cortex-Wellensymbol, graustufig für den Druck
const WELLE = '<svg viewBox="0 0 36 16" aria-hidden="true"><path d="M1 8 C 6 -2, 11 -2, 15 8 S 24 18, 28 8 S 33 2, 35 4" fill="none" stroke="#555" stroke-width="2.4" stroke-linecap="round"/></svg>';

// Ziffernfolgen (auch mit Gruppenleerzeichen) in Mono-Schrift, damit Stellen untereinander lesbar sind
const zahlenMono = (text) => esc(text).replace(/\d(?:[\d ]*\d)?/g, (z) => `<span class="zahl">${z}</span>`);

const stufe = (s) => '●'.repeat(s) + '○'.repeat(3 - s);

function antwortFeld(t, loesung, voll = false) {
  if (loesung) return `<span class="antwort">${esc(t.antwort)}</span>`;
  return `<span class="linie${voll ? ' voll' : ''}"></span>`;
}

// ∎ im Text wird zum Schreibkästchen (Platzhalter, Vergleiche, Umrechnungen); bei "felder" eins je Wert
function mitKaestchen(t, loesung) {
  const werte = Array.isArray(t.loesung) ? t.loesung : [t.loesung];
  const klasse = t.eingabe === 'wahl' ? ' klein' : t.breit ? ' breit' : '';
  let i = 0;
  return zahlenMono(t.text).replace(/∎/g, () => {
    const w = werte[i++];
    const inhalt = loesung ? esc(typeof w === 'number' ? fmt(w) : String(w)) : '';
    return `<span class="kaestchen${klasse}">${inhalt ? `<span class="antwort">${inhalt}</span>` : ''}</span>`;
  });
}

function wahl(t, loesung) {
  return `<div class="wahl">${t.optionen.map((o) => `<span class="${loesung && String(o) === String(t.loesung) ? 'richtig' : ''}">${esc(o)}</span>`).join('')}</div>`;
}

function teilHtml(t, loesung) {
  const label = t.label ? `<span class="label">${esc(t.label)}</span>` : '';
  if (t.text.includes('∎')) return `<div class="teil">${label}<span>${mitKaestchen(t, loesung)}</span></div>`;
  switch (t.eingabe) {
    case 'wahl':
      return `<div class="teil block">${label}${t.text ? `<span>${zahlenMono(t.text)}</span>` : ''}${wahl(t, loesung)}</div>`;
    case 'richtig_falsch':
      return `<div class="teil block">${label}${wahl({ ...t, optionen: ['richtig', 'falsch'], loesung: t.loesung ? 'richtig' : 'falsch' }, loesung)}</div>`;
    case 'wort':
      return `<div class="teil block">${label}<span>${zahlenMono(t.text)}</span>${loesung ? `<div class="antwort" style="margin-top:1mm">${esc(t.antwort)}</div>` : '<span class="linie voll"></span>'.repeat(t.schreibzeilen || 2)}</div>`;
    case 'zahl':
    default:
      return `<div class="teil">${label}<span>${zahlenMono(t.text)}</span>${antwortFeld(t, loesung)}</div>`;
  }
}

function datenHtml(d, loesung) {
  if (d.zeigen === 'diagramm') return diagramm(d);
  const kopf = d.merkmal === 'Geschwister' ? 'Anzahl der Geschwister' : d.merkmal;
  const zeilen = d.kategorien.map((k, i) =>
    `<tr><td>${esc(k)}</td><td>${d.zeigen === 'strichliste' ? striche(d.werte[i]) : d.werte[i]}</td></tr>`).join('');
  const tabelle = `<table class="datentabelle"><tr><th>${esc(kopf)}</th><th>${d.zeigen === 'strichliste' ? 'Strichliste' : 'Anzahl'}</th></tr>${zeilen}</table>`;
  const flaeche = d.zeichnen ? (loesung ? diagramm(d) : `<div style="margin-left:10mm">${raster(30, d.art === 'balken' ? 9 : 13)}</div>`) : '';
  return tabelle + flaeche;
}

function aufgabeHtml(a, nr, { loesung, mitBe }) {
  const kopf = `<div class="aufgabe-kopf"><span class="nr">${nr}</span><span class="anweisung">${zahlenMono(a.anweisung)}</span>${mitBe ? `<span class="be">${a.be} BE</span>` : `<span class="stufe" title="Schwierigkeit">${stufe(a.schwierigkeit)}</span>`}</div>`;
  let koerper = '';
  if (a.daten) koerper += datenHtml(a.daten, loesung);
  if (a.teile[0].eingabe === 'zeichnung') {
    /* Zeichenfläche steckt schon in datenHtml */
  } else if (a.teile[0].eingabe === 'paare') {
    const paare = a.teile[0].paare;
    const rechts = loesung ? paare.map((p) => p[1]) : [...paare.map((p) => p[1])].sort();
    koerper += `<div class="paare">${paare.map((p, i) => `<span class="punkt">${esc(p[0])}</span><span></span><span class="punkt-l">${esc(rechts[i])}</span>`).join('')}</div>`;
  } else if (a.weg !== undefined) {
    // Sachaufgabe: Rechenfläche + Antwortsatz
    koerper += loesung
      ? `<div class="weg"><b>Rechnung</b><br>${esc(a.weg)}</div><div class="weg"><b>Antwort</b><br>${esc(a.antwortsatz)}</div>`
      : `<div style="margin-left:10mm">${raster(34, a.schreibzeilen ? a.schreibzeilen * 2 : 8)}</div>` +
        (a.teile.length > 1 ? `<div class="teile spalten">${a.teile.map((t) => teilHtml(t, false)).join('')}</div>` : '') +
        `<div class="antwortsatz" style="margin-left:10mm"><span>Antwort:</span><span class="linie voll"></span></div><div style="margin-left:10mm"><span class="linie voll"></span></div>`;
  } else {
    const kurz = a.teile.length >= 3 && a.teile.every((t) => t.eingabe !== "wort" && t.text.length < 26 && t.eingabe !== "wahl");
    koerper += `<div class="teile${kurz ? ' spalten' : ''}">${a.teile.map((t) => teilHtml(t, loesung)).join('')}</div>`;
  }
  return `<section class="aufgabe">${kopf}${koerper}</section>`;
}

function seite({ doc, aufgaben, art, loesung, seed, gesamtBe }) {
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
<p class="fuss-hinweis">${lehrplan} · Variante ${esc(seed)}</p></body></html>`;
}

module.exports = { seite, aufgabeHtml };
