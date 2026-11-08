// Klassenarbeit: Zusammenstellung über alle Kombinationen der Lernbereiche, Notentabelle, Druck-HTML und PDF.
const test = require('node:test');
const assert = require('node:assert');
const { stelleZusammen, notentabelle, ZIEL_BE, TOLERANZ } = require('../generator/klassenarbeit');
const { ladeInhalte, klassenarbeitHtml } = require('../generator/klassenarbeit-pdf');
const { instanz } = require('../generator/generate');
const { htmlZuPdf, schliessen } = require('../generator/pdf');

const { themen, uebergreifend } = ladeInhalte('mathematik', 5);

// alle 2^n − 1 Auswahlen der Lernbereiche
function* auswahlen() {
  for (let m = 1; m < 2 ** themen.length; m++) yield themen.filter((_, i) => (m >> i) & 1);
}

test('Inhalte: jeder Lernbereich hat genug Klassenarbeitsaufgaben aller Anforderungsbereiche', () => {
  assert.ok(themen.length >= 8, `${themen.length} Lernbereiche`);
  for (const t of themen) {
    const be = t.klassenarbeit.reduce((s, a) => s + a.be, 0);
    assert.ok(be >= 14, `${t.thema}: nur ${be} BE im Pool`);
    for (const afb of [1, 2, 3]) assert.ok(t.klassenarbeit.some((a) => a.afb === afb), `${t.thema}: keine Aufgabe in AFB ${afb}`);
  }
  for (const a of uebergreifend) for (const id of a.themen) assert.ok(themen.some((t) => t.thema === id), `${a.id}: ${id} unbekannt`);
});

test(`Zusammenstellung: alle ${2 ** themen.length - 1} Auswahlen × 3 Varianten`, () => {
  const anteil = [0, 0, 0];
  for (const auswahl of auswahlen()) {
    const ids = new Set(auswahl.map((t) => t.thema));
    for (const seed of ['A1', 'B2', 'C3']) {
      const ka = stelleZusammen({ themen: auswahl, uebergreifend, seed });
      const wo = `${[...ids].join(',')} / ${seed}`;
      assert.ok(ka.gesamtBe >= ZIEL_BE - TOLERANZ && ka.gesamtBe <= ZIEL_BE + TOLERANZ, `${wo}: ${ka.gesamtBe} BE`);
      assert.strictEqual(ka.aufgaben.reduce((s, a) => s + a.be, 0), ka.gesamtBe);
      assert.strictEqual(new Set(ka.aufgaben.map((a) => a.id)).size, ka.aufgaben.length, `${wo}: Aufgabe doppelt`);
      for (const t of ka.themen) assert.ok(t.be > 0, `${wo}: ${t.thema} kommt nicht vor`);
      for (const a of ka.aufgaben) {
        if (!a.thema) assert.ok(a.themen.every((t) => ids.has(t)), `${wo}: ${a.id} passt nicht zur Auswahl`);
        else assert.ok(ids.has(a.thema), `${wo}: ${a.id} aus nicht gewähltem Bereich`);
        assert.ok([1, 2, 3].includes(a.afb), `${wo}: ${a.id} ohne AFB`);
      }
      // Grundwissen vorn, Begründen und übergreifende Aufgaben hinten
      const gruppe = ka.aufgaben.map((a) => (a.afb === 1 ? 0 : a.afb === 3 || !a.thema ? 2 : 1));
      assert.deepStrictEqual(gruppe, [...gruppe].sort(), `${wo}: Reihenfolge`);
      ka.afb.forEach((be, i) => { anteil[i] += be; });
      // gleiche Auswahl und Variante → gleiche Arbeit (Arbeit und Lösung passen zusammen)
      if (seed === 'A1') assert.deepStrictEqual(stelleZusammen({ themen: [...auswahl].reverse(), uebergreifend, seed }), ka, `${wo}: nicht reproduzierbar`);
    }
  }
  const summe = anteil.reduce((a, b) => a + b, 0);
  const prozent = anteil.map((x) => Math.round((100 * x) / summe));
  assert.ok(prozent[0] >= 20 && prozent[0] <= 40 && prozent[1] >= 50 && prozent[2] >= 5 && prozent[2] <= 15, `AFB-Anteile ${prozent.join('/')} %`);
});

test('Klassenarbeitsaufgaben: 100 Seeds ohne Fehler, Bezeichnung für den Elternbericht', () => {
  const alle = [...themen.flatMap((t) => t.klassenarbeit.map((a) => ({ ...a, wo: t.thema }))), ...uebergreifend.map((a) => ({ ...a, wo: 'übergreifend' }))];
  for (const a of alle) {
    const texte = new Set();
    for (let s = 0; s < 100; s++) {
      const inst = instanz(a, `ka${s}`);
      texte.add(inst.anweisung);
      assert.doesNotMatch(JSON.stringify(inst), /undefined|NaN/, `${a.wo}/${a.id}`);
      for (const t of inst.teile) if (t.optionen && t.eingabe !== 'begruendung') assert.ok(t.optionen.map(String).includes(String(t.loesung)), `${a.wo}/${a.id}: Lösung nicht unter den Optionen`);
    }
    if (texte.size > 1) assert.ok(a.bezeichnung, `${a.wo}/${a.id}: „bezeichnung:“ fehlt (Anweisung mit Zufallswerten)`);
  }
});

test('Notentabelle: lückenlos, ausreichend ab der Hälfte, ungenügend unter einem Fünftel', () => {
  for (let g = 20; g <= 50; g++) {
    const tab = notentabelle(g);
    assert.deepStrictEqual(tab.map((z) => z.note), [1, 2, 3, 4, 5, 6]);
    assert.strictEqual(tab[0].bis, g);
    assert.strictEqual(tab[5].ab, 0);
    for (let i = 1; i < 6; i++) assert.strictEqual(tab[i].bis, tab[i - 1].ab - 1, `${g} BE: Lücke vor Note ${i + 1}`);
    assert.strictEqual(tab[3].ab, Math.ceil(g / 2), `${g} BE: ausreichend ab der Hälfte`);
    assert.ok(tab[5].bis < g / 5 && tab[4].ab >= g / 5, `${g} BE: ungenügend unter einem Fünftel`);
  }
});

test('Druck-HTML: Arbeit mit Namenszeile und Platz, Lösung mit Antworten, Punkteübersicht und Notentabelle', () => {
  let n = 0;
  for (const auswahl of auswahlen()) {
    if (n++ % 9) continue; // jede neunte Auswahl reicht hier
    const { ka, arbeit, loesung } = klassenarbeitHtml({ themen: auswahl.map((t) => t.thema), seed: `H${n}` });
    for (const html of [arbeit, loesung]) assert.doesNotMatch(html.replace(/base64,[^)]+/g, ''), /undefined|NaN|\[object Object\]/);
    assert.match(arbeit, /Name:/);
    assert.ok(arbeit.includes(`BE: ____ / ${ka.gesamtBe}`));
    assert.match(arbeit, /Viel Erfolg/);
    assert.doesNotMatch(arbeit.split('</style>')[1], /Erwartung:|noten-tabelle/, 'Arbeit verrät keine Lösung');
    assert.doesNotMatch(loesung, /Name:/);
    assert.match(loesung, /class="noten-tabelle"/);
    assert.strictEqual((loesung.match(/<section class="aufgabe">/g) || []).length, ka.aufgaben.length);
    for (const a of ka.aufgaben) {
      for (const t of a.teile) if (t.eingabe === 'begruendung') assert.ok(loesung.includes(t.antwort.slice(0, 40).replace(/&/g, '&amp;')), `${a.id}: Erwartungshorizont fehlt`);
      if (a.weg) assert.ok(loesung.includes('Rechnung'), `${a.id}: Rechenweg fehlt`);
    }
  }
});

test('PDF: Klassenarbeiten in A4 mit höchstens 6 Seiten, Lösung höchstens 7 Seiten', async () => {
  try {
    const faelle = [['runden', 'zeit', 'kommazahlen'], themen.map((t) => t.thema), ['daten-diagramme'], ['grosse-zahlen', 'sachaufgaben']];
    for (const [i, auswahl] of faelle.entries()) {
      const { arbeit, loesung } = klassenarbeitHtml({ themen: auswahl, seed: `P${i}` });
      for (const [art, html] of [['Arbeit', arbeit], ['Lösung', loesung]]) {
        const { pdf, seiten } = await htmlZuPdf(html);
        assert.ok(seiten >= 2 && seiten <= (art === 'Arbeit' ? 6 : 7), `${auswahl.join(',')}: ${art} hat ${seiten} Seiten`);
        for (const [, b, h] of pdf.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)) {
          assert.ok(Math.abs(b - 595) < 1 && Math.abs(h - 842) < 1, `Seitenformat ${b} × ${h}`);
        }
      }
    }
  } finally {
    await schliessen();
  }
});
