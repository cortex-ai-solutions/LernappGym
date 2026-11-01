// Lernkatze: Motive je Thema, Zeichnungen ohne Lücken, Belohnungscodes eindeutig und in App und Generator gleich geprüft.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ladeThema, waehleAufgaben, alleThemen, VARIANTEN } = require('../generator/worksheet');
const { belohnungscode, pruefsumme, ZEICHEN } = require('../generator/belohnung');

// katze.js wie im Browser laden, mit leerem Speicher
function ladeKatze(daten) {
  const speicher = {};
  const fenster = { KATZE_DATEN: daten, dispatchEvent() {} };
  const kontext = {
    window: fenster, Event: function Event() {}, Math, JSON, Array, String, Object,
    localStorage: { getItem: (k) => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'templates', 'katze.js'), 'utf8'), kontext);
  return { KATZE: fenster.KATZE, speicher };
}

const themen = alleThemen();

test('Katzenalbum: jedes Thema hat ein eigenes Motiv, alle Bilder sind vollständig gezeichnet', () => {
  const daten = { themen: themen.map((t) => ({ fach: t.fach, fachTitel: t.fach, thema: t.thema, titel: t.thema })), codes: {} };
  const { KATZE } = ladeKatze(daten);
  for (const t of themen) {
    const motiv = KATZE.MOTIV[`${t.fach}/${t.thema}`];
    assert.ok(motiv, `${t.fach}/${t.thema}: kein Motiv in templates/katze.js (MOTIV) – bitte eins zeichnen`);
    assert.ok(KATZE.REQUISITEN[motiv], `${t.fach}/${t.thema}: Requisit „${motiv}“ fehlt`);
  }
  const bilder = [];
  for (const t of themen) for (const s of ['1', '3', 'gold']) bilder.push(KATZE.beschreibe(`motiv:${t.fach}/${t.thema}:${s}`).bild);
  for (const [art, tabelle] of [['kopf', KATZE.KOPF], ['hals', KATZE.HALS]]) {
    for (const id of Object.keys(tabelle)) {
      bilder.push(KATZE.svg({ [art]: id }));
      if (!tabelle[id].frei) assert.ok(tabelle[id].hinweis && tabelle[id].bedingung, `${art}:${id} braucht hinweis und bedingung`);
    }
  }
  for (const fell of Object.keys(KATZE.FELLE)) for (const decke of Object.keys(KATZE.DECKEN)) {
    for (const stimmung of ['hallo', 'froh', 'troest', 'schlaf']) bilder.push(KATZE.svg({ stimmung, aussehen: { fell, decke, augen: 'blau', kopf: 'muetze', hals: 'schal' } }));
  }
  for (const b of bilder) {
    assert.match(b, /^<svg class="katze"/);
    assert.doesNotMatch(b, /undefined|NaN|null/, 'Lücke in einer Zeichnung');
  }
});

test('Freischalten: Sterne, Streak und Latein schalten Bilder und Teile frei, gesperrte Teile lassen sich nicht anziehen', () => {
  const { KATZE, speicher } = ladeKatze({ themen: [{ fach: 'mathematik', fachTitel: 'Mathematik', thema: 'runden', titel: 'Runden' }], codes: {} });
  assert.deepStrictEqual([...KATZE.aktualisiere()], []);
  speicher.lernwerk_v1 = JSON.stringify({ streak: { tage: 3 }, themen: { 'mathematik/runden': { lektionen: 1, sterne: 3 } } });
  speicher.latina_state = JSON.stringify({ completedLessons: ['1a'] });
  assert.deepStrictEqual([...KATZE.aktualisiere()].sort(), ['hals:schal', 'kopf:lorbeer', 'kopf:muetze', 'motiv:mathematik/runden:1', 'motiv:mathematik/runden:3']);
  assert.deepStrictEqual([...KATZE.aktualisiere()], [], 'nur einmal neu');
  // Fortschritt verloren (z. B. Streak gerissen): Freigeschaltetes bleibt
  speicher.lernwerk_v1 = JSON.stringify({ streak: { tage: 0 }, themen: {} });
  KATZE.aktualisiere();
  speicher.lernwerk_katze_v1 = JSON.stringify({ ...JSON.parse(speicher.lernwerk_katze_v1), kopf: 'muetze', hals: 'gloeckchen' });
  assert.strictEqual(KATZE.lies().kopf, 'muetze');
  assert.strictEqual(KATZE.lies().hals, 'aus', 'gesperrtes Glöckchen fällt auf „Nichts“ zurück');
});

test('Belohnungscodes: Format, eindeutig je Blatt, Prüfsumme in App und Generator gleich', () => {
  const codes = new Map();
  const daten = { themen: [], codes: {} };
  for (const t of themen) {
    const doc = ladeThema(t.fach, t.klasse, t.thema);
    for (const v of VARIANTEN) {
      const code = belohnungscode({ fach: t.fach, thema: t.thema, variante: v, aufgaben: waehleAufgaben(doc, v) });
      assert.match(code, new RegExp(`^MIAU-[${ZEICHEN}]{4}$`));
      assert.ok(!codes.has(code), `${code} doppelt`);
      codes.set(code, `${t.fach}/${t.thema}/${v}`);
      daten.codes[pruefsumme(code)] = `${t.fach}/${t.thema}/${v}`;
    }
  }
  assert.strictEqual(Object.keys(daten.codes).length, codes.size, 'Prüfsummen eindeutig');
  daten.themen = themen.map((t) => ({ fach: t.fach, fachTitel: t.fach, thema: t.thema, titel: t.thema }));
  const { KATZE } = ladeKatze(daten);
  const [code, ziel] = [...codes][0];
  assert.strictEqual(KATZE.pruefsumme(code), pruefsumme(code));
  // Eingabe mit Kleinbuchstaben, ohne Bindestrich oder ohne MIAU
  for (const eingabe of [code.toLowerCase(), code.replace('-', ' '), code.slice(5)]) {
    assert.strictEqual(KATZE.einloesen(eingabe).ziel, ziel, eingabe);
  }
  const r = KATZE.einloesen(code);
  assert.ok(r.ok && r.schon, 'zweites Einlösen');
  assert.strictEqual(KATZE.einloesen('MIAU-ZZZZ').ok, false);
  assert.strictEqual(KATZE.einloesen('MIAU').ok, false);
  assert.ok(KATZE.lies().frei.includes('kopf:krone'), 'Krone nach dem ersten Code');
  assert.ok(KATZE.lies().frei.includes(`motiv:${ziel.split('/').slice(0, 2).join('/')}:gold`), 'Gold-Bild des Themas');
  // derselbe Code ändert sich, wenn sich das Blatt ändert
  assert.notStrictEqual(belohnungscode({ fach: 'm', thema: 't', variante: 'A', aufgaben: [1] }), belohnungscode({ fach: 'm', thema: 't', variante: 'A', aufgaben: [2] }));
});
