// Arbeitsblätter: 6–10 Aufgaben, steigende Schwierigkeit, sauberes HTML, PDF mit erwarteter Seitenzahl.
const test = require('node:test');
const assert = require('node:assert');
const { waehleAufgaben, ladeThema, alleThemen } = require('../generator/worksheet');
const { seite } = require('../generator/render/print');
const { htmlZuPdf, schliessen } = require('../generator/pdf');
const { fmt } = require('../generator/lib/zahlen');
const { esc } = require('../generator/render/svg');

test('Aufgabenauswahl: 6–10 Aufgaben, aufsteigend sortiert, nichts nur für die Webapp', () => {
  for (const { fach, klasse, thema } of alleThemen()) {
    const doc = ladeThema(fach, klasse, thema);
    for (const seed of ['blatt', '1', '2', '3']) {
      const liste = waehleAufgaben(doc, seed);
      assert.ok(liste.length >= 6 && liste.length <= 10, `${thema}: ${liste.length} Aufgaben`);
      for (let i = 1; i < liste.length; i++) assert.ok(liste[i - 1].schwierigkeit <= liste[i].schwierigkeit, `${thema}: Reihenfolge`);
      assert.ok(liste.every((a) => a.nur !== 'web'));
      // Aufgaben sollen sich nicht wiederholen, solange die Inhaltsdatei genug hergibt
      if (doc.aufgaben.length >= 6) assert.strictEqual(new Set(liste.map((a) => a.id)).size, liste.length, `${thema}: doppelte Aufgabe`);
    }
  }
});

test('Druck-HTML: keine Platzhalterreste, Lösungsblatt enthält die Antworten', () => {
  for (const { fach, klasse, thema } of alleThemen()) {
    const doc = ladeThema(fach, klasse, thema);
    const aufgaben = waehleAufgaben(doc, 'blatt');
    const blatt = seite({ doc, aufgaben, art: 'blatt', loesung: false, seed: 'blatt' });
    const loesung = seite({ doc, aufgaben, art: 'blatt', loesung: true, seed: 'blatt' });
    for (const html of [blatt, loesung]) assert.doesNotMatch(html.replace(/base64,[^)]+/g, ''), /undefined|NaN|\[object Object\]/, thema);
    assert.match(blatt, /Name:/);
    assert.doesNotMatch(loesung, /Name:/);
    for (const a of aufgaben) {
      for (const t of a.teile) {
        if (t.eingabe === 'zeichnung' || t.eingabe === 'paare') continue;
        const erwartet = String(t.eingabe === 'richtig_falsch' ? (t.loesung ? 'richtig' : 'falsch') : t.antwort).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Kästchen-Aufgaben (∎) zeigen im Lösungsblatt nur die Werte im Kästchen, z. B. "3 kg 760 g" → "3" und "760"
        const kaestchen = t.text.includes('∎') && [].concat(t.loesung).every((w) => loesung.includes(`<span class="antwort">${typeof w === 'number' ? fmt(w) : esc(String(w))}</span>`));
        if (a.weg === undefined) assert.ok(loesung.includes(erwartet) || loesung.includes(String(t.loesung)) || kaestchen, `${thema}/${a.id}: Antwort ${erwartet} fehlt im Lösungsblatt`);
      }
    }
  }
});

test('PDF: Arbeitsblatt Runden hat 1–3 Seiten im A4-Format', async () => {
  const doc = ladeThema('mathematik', '5', 'runden');
  const { pdf, seiten } = await htmlZuPdf(seite({ doc, aufgaben: waehleAufgaben(doc, 'blatt'), art: 'blatt', loesung: false, seed: 'blatt' }));
  await schliessen();
  assert.ok(seiten >= 1 && seiten <= 3, `${seiten} Seiten`);
  // A4 in PostScript-Punkten: 595 × 842 (Chromium schreibt 594.96 × 841.92)
  const boxen = [...pdf.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
  assert.strictEqual(boxen.length, seiten);
  for (const [, b, h] of boxen) assert.ok(Math.abs(b - 595) < 1 && Math.abs(h - 842) < 1, `Seitenformat ${b} × ${h}`);
});
