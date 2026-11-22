// Römische Zahlen: Handbeispiele und 1000 Seeds je Generator gegen eine unabhängige Referenz
// (eigener Parser + Muster der gültigen Schreibweise, ohne den Generator-Code zu benutzen).
const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../generator/lib/rng');
const { parseZahl } = require('../generator/lib/zahlen');
const { GENERATOREN } = require('../generator/tasks');
const { roemisch, nurAddiert, falschAbgezogen } = require('../generator/tasks/math/roemisch');

const SEEDS = 1000;
const GUELTIG = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
const W = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
function wert(s) {
  assert.match(s, /^[IVXLCDM]+$/, `kein römisches Zeichen in ${s}`);
  let summe = 0;
  for (let i = 0; i < s.length; i++) summe += W[s[i]] < (W[s[i + 1]] || 0) ? -W[s[i]] : W[s[i]];
  return summe;
}
const istRichtig = (s, n) => s !== '' && GUELTIG.test(s) && wert(s) === n;

function erzeuge(name, parameter, anzahl, seed) {
  const g = GENERATOREN[name];
  const p = { ...parameter, anzahl };
  g.pruefe(p);
  return g.erzeuge(p, makeRng(seed));
}

test('Römische Zahlen: Handbeispiele', () => {
  const beispiele = { 1: 'I', 4: 'IV', 9: 'IX', 14: 'XIV', 40: 'XL', 49: 'XLIX', 90: 'XC', 99: 'XCIX', 388: 'CCCLXXXVIII',
    400: 'CD', 444: 'CDXLIV', 900: 'CM', 1984: 'MCMLXXXIV', 2026: 'MMXXVI', 3999: 'MMMCMXCIX' };
  for (const [n, r] of Object.entries(beispiele)) assert.strictEqual(roemisch(Number(n)), r);
  assert.throws(() => roemisch(0), RangeError);
  assert.throws(() => roemisch(4000), RangeError);
  assert.strictEqual(nurAddiert(49), 'XXXXVIIII');
  assert.strictEqual(nurAddiert(1994), 'MDCCCCLXXXXIIII');
  assert.strictEqual(falschAbgezogen(49), 'IL');
  assert.strictEqual(falschAbgezogen(99), 'IC');
  assert.strictEqual(falschAbgezogen(1990), 'MXM');
});

test('Römische Zahlen: alle Zahlen 1 bis 3999 hin und zurück', () => {
  for (let n = 1; n <= 3999; n++) {
    const r = roemisch(n);
    assert.ok(istRichtig(r, n), `${n} → ${r}`);
    // typische Fehler sind nie zufällig die richtige Schreibweise
    for (const f of [nurAddiert(n), falschAbgezogen(n)]) if (f !== r) assert.ok(!GUELTIG.test(f), `${n}: Fehlerform ${f} ist gültig`);
  }
});

test(`Römische Zahlen: ${SEEDS} Seeds je Generator nachgeprüft`, () => {
  const BEREICHE = [[1, 39], [40, 399], [4, 99], [1, 3999], [1000, 2026]];
  for (const bereich of BEREICHE) {
    for (let s = 0; s < SEEDS; s++) {
      for (const t of erzeuge('roemisch-in-zahl', { bereich }, 4, s).teile) {
        assert.ok(t.loesung >= bereich[0] && t.loesung <= bereich[1]);
        assert.strictEqual(wert(t.text), t.loesung, t.text);
        assert.ok(GUELTIG.test(t.text), t.text);
        assert.strictEqual(parseZahl(t.antwort), t.loesung);
      }
      for (const t of erzeuge('zahl-in-roemisch', { bereich }, 4, s).teile) {
        assert.strictEqual(t.eingabe, 'roemisch');
        assert.ok(istRichtig(t.loesung, parseZahl(t.text)), `${t.text} → ${t.loesung}`);
      }
      for (const t of erzeuge('roemisch-schreibweise', { bereich }, 2, s).teile) {
        const n = parseZahl(t.text.replace('Die Zahl ', ''));
        assert.ok(t.optionen.length >= 3, `${n}: nur ${t.optionen}`);
        assert.strictEqual(new Set(t.optionen).size, t.optionen.length);
        assert.deepStrictEqual(t.optionen.filter((o) => istRichtig(o, n)), [t.loesung], `${n}: ${t.optionen}`);
      }
      for (const t of erzeuge('roemisch-vergleichen', { bereich }, 3, s).teile) {
        const [a, b] = t.text.split(' ∎ ').map(wert);
        assert.strictEqual(t.loesung, a < b ? '<' : a > b ? '>' : '=', t.text);
        assert.ok(a >= bereich[0] && b <= bereich[1] && b >= bereich[0] && a <= bereich[1]);
      }
      for (const t of erzeuge('roemisch-fehler', { bereich: [Math.max(4, bereich[0]), bereich[1]] }, 3, s).teile) {
        const m = t.text.match(/schreibt: ([\d ]+) = ([IVXLCDM]+)$/);
        assert.ok(m, t.text);
        const n = parseZahl(m[1]);
        assert.ok(!GUELTIG.test(m[2]), `${t.text}: „Fehler“ ist richtig`);
        assert.ok(istRichtig(t.loesung, n), `${t.text} → ${t.loesung}`);
      }
    }
  }
  for (const bereich of [[1, 50], [1, 100]]) {
    for (let s = 0; s < SEEDS; s++) {
      for (const t of erzeuge('roemisch-rechnen', { bereich }, 3, s).teile) {
        const m = t.text.match(/^([IVXLCDM]+) ([+−]) ([IVXLCDM]+) = ∎$/);
        assert.ok(m, t.text);
        const e = m[2] === '+' ? wert(m[1]) + wert(m[3]) : wert(m[1]) - wert(m[3]);
        assert.ok(e >= 1 && e <= bereich[1], t.text);
        assert.ok(istRichtig(t.loesung, e), `${t.text} → ${t.loesung}`);
      }
    }
  }
});
