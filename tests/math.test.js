// Mathe-Generatoren: (1) Handrechnungen aus dem Unterricht, (2) unabhängige Nachrechnung über 1000 Seeds,
// (3) Regeln für alle Inhaltsdateien (Lösung unter den Optionen, keine doppelten Optionen, keine Lücken im Text).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { makeRng } = require('../generator/lib/rng');
const { zahlwort, runden, fmt, parseZahl } = require('../generator/lib/zahlen');
const { GENERATOREN } = require('../generator/tasks');
const { VORLAGEN } = require('../generator/tasks/math/sachaufgaben');
const { erzeugeThema } = require('../generator/generate');

const SEEDS = 1000;

// ---------- unabhängige Referenzen ----------

// Runden über die Ziffernfolge statt über Arithmetik
function rundenRef(n, k) {
  const s = String(n).padStart(k + 1, '0');
  const kopf = s.slice(0, s.length - k);
  const entscheidend = Number(s[s.length - k] ?? 0);
  const kopfZahl = BigInt(kopf) + (k > 0 && entscheidend >= 5 ? 1n : 0n);
  return Number(kopfZahl * 10n ** BigInt(k));
}
const K = { zehner: 1, hunderter: 2, tausender: 3, zehntausender: 4, hunderttausender: 5 };

// Zahlwort → Zahl (eigener Parser, kennt nur die Wortbausteine)
const W = { ein: 1, eins: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
  elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
  zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
function klein(w) {
  if (!w) return 0;
  const t = w.split('tausend');
  if (t.length === 2) return (t[0] ? klein(t[0]) : 1) * 1000 + klein(t[1]);
  const h = w.split('hundert');
  if (h.length === 2) return (h[0] ? W[h[0]] : 1) * 100 + klein(h[1]);
  if (W[w] !== undefined) return W[w];
  const u = w.match(/^(.+)und(.+)$/);
  if (u && W[u[1]] && W[u[2]]) return W[u[1]] + W[u[2]];
  throw new Error(`unbekannt: ${w}`);
}
function wortZuZahl(satz) {
  const GROSS = { billion: 1e12, billionen: 1e12, milliarde: 1e9, milliarden: 1e9, million: 1e6, millionen: 1e6 };
  const woerter = satz.split(' ');
  let summe = 0;
  for (let i = 0; i < woerter.length; i++) {
    const naechstes = woerter[i + 1]?.toLowerCase();
    if (naechstes && GROSS[naechstes]) {
      summe += klein(woerter[i]) * GROSS[naechstes];
      i++;
    } else summe += klein(woerter[i]);
  }
  return summe;
}

const ref = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, ':': (a, b) => a / b };

function erzeuge(name, parameter, anzahl, seed) {
  const g = GENERATOREN[name];
  const p = { ...parameter, anzahl };
  g.pruefe(p);
  return g.erzeuge(p, makeRng(seed));
}

// ---------- (1) Handrechnungen ----------

test('Runden: Beispiele wie in der 1. TÜ', () => {
  assert.strictEqual(runden(34761, 'hunderter'), 34800);
  assert.strictEqual(runden(34721, 'zehner'), 34720);
  assert.strictEqual(runden(4500, 'tausender'), 5000);
  const n = 7359894;
  assert.deepStrictEqual(
    ['zehner', 'hunderter', 'tausender', 'zehntausender', 'hunderttausender'].map((s) => runden(n, s)),
    [7359890, 7359900, 7360000, 7360000, 7400000],
  );
  assert.strictEqual(runden(34961, 'hunderter'), 35000);
  assert.strictEqual(runden(99960, 'hunderter'), 100000);
});

test('Zahlwörter: Beispiele und Sonderfälle', () => {
  assert.strictEqual(zahlwort(7958014), 'sieben Millionen neunhundertachtundfünfzigtausendvierzehn');
  assert.strictEqual(zahlwort(867531), 'achthundertsiebenundsechzigtausendfünfhunderteinunddreißig');
  assert.strictEqual(zahlwort(1), 'eins');
  assert.strictEqual(zahlwort(101), 'einhunderteins');
  assert.strictEqual(zahlwort(1000), 'eintausend');
  assert.strictEqual(zahlwort(1001), 'eintausendeins');
  assert.strictEqual(zahlwort(21000), 'einundzwanzigtausend');
  assert.strictEqual(zahlwort(1000000), 'eine Million');
  assert.strictEqual(zahlwort(2000017), 'zwei Millionen siebzehn');
  assert.strictEqual(zahlwort(2045300018), 'zwei Milliarden fünfundvierzig Millionen dreihunderttausendachtzehn');
  assert.strictEqual(zahlwort(1e12), 'eine Billion');
  assert.throws(() => zahlwort(101000000), /mehrdeutig/);
  assert.throws(() => zahlwort(1e12 + 1), RangeError);
});

test('Zahlen formatieren und Eingaben lesen', () => {
  assert.strictEqual(fmt(34761), '34 761');
  assert.strictEqual(fmt(999), '999');
  assert.strictEqual(fmt(1234567), '1 234 567');
  assert.strictEqual(parseZahl('34 761'), 34761);
  assert.strictEqual(parseZahl('34.761'), 34761);
  assert.ok(Number.isNaN(parseZahl('34,7')));
});

test('Sachaufgaben: Beispiele wie in der 2. TÜ', () => {
  const tiere = [{ anzahl: 5, beine: 4 }, { anzahl: 4, beine: 4 }, { anzahl: 11, beine: 2 }];
  assert.strictEqual(VORLAGEN.tierbeine.loese({ tiere }), 58);
  assert.strictEqual(VORLAGEN.mitglieder.loese({ verloren: 30, neu: 109, jetzt: 534 }), 455);
  assert.deepStrictEqual(VORLAGEN.fahrkarten.loese({ erwachsene: 2, kinder: 3, gesamt: 84 }), { erwachsener: 24, kind: 12 });
  assert.strictEqual(VORLAGEN.busse.loese({ plaetze: 40, kinder: 169 }), 5);
  assert.strictEqual(VORLAGEN.rueckgeld.loese({ a: { anzahl: 6, preis: 3 }, b: { anzahl: 1, preis: 12 }, schein: 50 }), 20);
  assert.strictEqual(VORLAGEN.sparen.loese({ rate: 8, erspart: 20, preis: 140 }), 15);
});

// ---------- (2) Nachrechnen über viele Seeds ----------

test(`runden / runden-reihe: ${SEEDS} Seeds gegen Ziffern-Referenz`, () => {
  for (let s = 0; s < SEEDS; s++) {
    for (const uebertrag of [false, true]) {
      const inst = erzeuge('runden', { stellen: ['zehner', 'hunderter', 'tausender'], ziffern: [5, 6, 7], uebertrag }, 3, s);
      for (const t of inst.teile) {
        const { n, stelle } = t.pruefung;
        assert.strictEqual(t.loesung, rundenRef(n, K[stelle]), `${n} auf ${stelle}`);
        if (uebertrag) {
          // Übertrag: Ziffer an der Rundungsstelle war 9 und wird 0, die Stelle links davon erhöht sich
          const f = 10 ** (K[stelle] + 1);
          assert.strictEqual(Math.floor(t.loesung / f), Math.floor(n / f) + 1, `${n} auf ${stelle}: kein Übertrag`);
        }
      }
    }
    const reihe = erzeuge('runden-reihe', { stellen: Object.keys(K), ziffern: [7] }, undefined, s);
    for (const t of reihe.teile) assert.strictEqual(t.loesung, rundenRef(t.pruefung.n, K[t.pruefung.stelle]));
    // rückwärts: Lösung rundet auf den Wert, die Nachbarzahl außen nicht mehr
    for (const t of erzeuge('runden-rueckwaerts', { stellen: ['zehner', 'hunderter', 'tausender'] }, 2, s).teile) {
      const { gerundet, stelle, groesste } = t.pruefung;
      const k = K[stelle];
      assert.strictEqual(rundenRef(t.loesung, k), gerundet, t.text);
      assert.notStrictEqual(rundenRef(t.loesung + (groesste ? 1 : -1), k), gerundet, `${t.text}: ${t.loesung} ist nicht die ${groesste ? 'größte' : 'kleinste'}`);
    }
  }
});

test(`Zahlwörter: ${SEEDS} Seeds hin und zurück`, () => {
  for (let s = 0; s < SEEDS; s++) {
    for (const name of ['zahl-in-ziffern', 'zahl-in-worten']) {
      const inst = erzeuge(name, { bereich: [1, 1e12] }, 2, s);
      for (const t of inst.teile) {
        const { n, wort } = t.pruefung;
        assert.strictEqual(wortZuZahl(wort), n, `${n} ↔ ${wort}`);
        assert.strictEqual(name === 'zahl-in-ziffern' ? t.loesung : wortZuZahl(t.loesung), n);
      }
    }
  }
});

test(`Stellenwert, Vergleichen, Vorgänger/Nachfolger: ${SEEDS} Seeds`, () => {
  const NAMEN = ['Einer', 'Zehner', 'Hunderter', 'Tausender', 'Zehntausender', 'Hunderttausender', 'Millionen', 'Zehnmillionen', 'Hundertmillionen', 'Milliarden'];
  for (let s = 0; s < SEEDS; s++) {
    for (const t of erzeuge('stellenwert', { bereich: [100, 9999999999] }, 3, s).teile) {
      const { n, idx } = t.pruefung;
      const str = String(n);
      assert.strictEqual(t.loesung, NAMEN[str.length - 1 - idx]);
      assert.strictEqual(t.optionen.length, 4);
    }
    for (const t of erzeuge('vergleichen', { bereich: [10, 1e9] }, 4, s).teile) {
      const { a, b } = t.pruefung;
      assert.strictEqual(t.loesung, a < b ? '<' : a > b ? '>' : '=');
    }
    for (const t of erzeuge('vorgaenger-nachfolger', { bereich: [10, 1e7] }, 3, s).teile) {
      const { n, nach } = t.pruefung;
      assert.strictEqual(t.loesung, nach ? n + 1 : n - 1);
      assert.ok(t.loesung >= 0);
    }
  }
});

test(`Rechnen (Kopfrechnen, Platzhalter, Fachbegriffe, verkettet, wie oft): ${SEEDS} Seeds`, () => {
  const p = { operationen: ['+', '-', '*', ':'], bereich: [0, 500], faktor: [2, 25] };
  for (let s = 0; s < SEEDS; s++) {
    for (const name of ['kopfrechnen', 'fachbegriffe', 'wie-oft']) {
      for (const t of erzeuge(name, p, 4, s).teile) {
        const { a, op, b, c } = t.pruefung;
        assert.strictEqual(ref[op](a, b), c, `${a} ${op} ${b}`);
        assert.ok(Number.isInteger(c) && c >= 0, `${a} ${op} ${b} = ${c} ist keine natürliche Zahl`);
        assert.strictEqual(t.loesung, c);
      }
    }
    for (const t of erzeuge('platzhalter', p, 4, s).teile) {
      const { a, op, b, c, luecke } = t.pruefung;
      const werte = { a, b };
      werte[luecke] = t.loesung;
      assert.strictEqual(ref[op](werte.a, werte.b), c, t.text);
      assert.strictEqual((t.text.match(/∎/g) || []).length, 1);
    }
    for (const t of erzeuge('verkettet', { bereich: [1, 100] }, 1, s).teile) {
      const { a, op, b, nachher } = t.pruefung;
      const zw = ref[op](a, b);
      const f = { verdoppelt: 2, verdreifacht: 3, halbiert: 0.5 }[nachher];
      assert.strictEqual(t.loesung, zw * f);
      assert.ok(Number.isInteger(t.loesung));
    }
  }
});

test(`Sachaufgaben: ${SEEDS} Seeds je Vorlage, Probe am Sachverhalt`, () => {
  for (const vorlage of Object.keys(VORLAGEN)) {
    for (let s = 0; s < SEEDS; s++) {
      const inst = erzeuge('sachaufgabe', { vorlagen: [vorlage] }, undefined, s);
      const d = inst.pruefung.daten;
      for (const t of inst.teile) assert.ok(Number.isInteger(t.loesung) && t.loesung > 0, `${vorlage}: ${t.loesung}`);
      const l = inst.teile.map((t) => t.loesung);
      switch (vorlage) {
        case 'tierbeine': {
          let beine = 0;
          for (const t of d.tiere) beine += t.anzahl * (['Hühner', 'Gänse', 'Enten'].includes(t.name) ? 2 : 4);
          assert.strictEqual(l[0], beine);
          break;
        }
        case 'mitglieder':
          assert.strictEqual(l[0] - d.verloren + d.neu, d.jetzt);
          break;
        case 'fahrkarten':
          assert.strictEqual(l[0], 2 * l[1]);
          assert.strictEqual(d.erwachsene * l[0] + d.kinder * l[1], d.gesamt);
          break;
        case 'rueckgeld':
          assert.ok(l[0] < d.schein);
          assert.strictEqual(d.a.anzahl * d.a.preis + d.b.anzahl * d.b.preis + l[0], d.schein);
          break;
        case 'busse':
          assert.ok((l[0] - 1) * d.plaetze < d.kinder && d.kinder <= l[0] * d.plaetze);
          break;
        case 'sparen':
          assert.strictEqual(d.erspart + l[0] * d.rate, d.preis);
          assert.ok(d.erspart + (l[0] - 1) * d.rate < d.preis, 'eine Woche früher reicht es noch nicht');
          break;
        default:
          assert.fail(`keine Probe für Vorlage ${vorlage}`);
      }
      assert.doesNotMatch(inst.anweisung + inst.antwortsatz + inst.weg, /undefined|NaN|,\d/);
    }
  }
});

test(`Diagramm: ${SEEDS} Seeds, Ablesefragen stimmen mit den Daten`, () => {
  for (let s = 0; s < SEEDS; s++) {
    const inst = erzeuge('diagramm', { modus: 'ablesen' }, 4, s);
    const { kategorien, werte } = inst.daten;
    assert.strictEqual(new Set(werte).size, werte.length, 'Häufigkeiten müssen verschieden sein');
    for (const t of inst.teile) {
      if (t.text.startsWith('Wie viele Kinder wurden')) assert.strictEqual(t.loesung, werte.reduce((a, b) => a + b, 0));
      else if (t.eingabe === 'wahl') assert.strictEqual(werte[kategorien.indexOf(t.loesung)], Math.max(...werte));
      else assert.ok(Number.isInteger(t.loesung) && t.loesung >= 1);
    }
    const z = erzeuge('diagramm', { modus: 'zeichnen', art: 'saeule' }, undefined, s);
    assert.strictEqual(z.nur, 'druck');
    assert.deepStrictEqual(z.teile[0].loesung, z.daten.werte);
  }
});

// ---------- (3) Regeln für alle Inhaltsdateien ----------

function inhaltsdateien() {
  const root = path.join(__dirname, '..', 'content', 'mathematik');
  const dateien = [];
  for (const klasse of fs.readdirSync(root)) {
    for (const f of fs.readdirSync(path.join(root, klasse))) dateien.push(path.join(root, klasse, f));
  }
  return dateien;
}

test('Alle Mathe-Themen: 200 Seeds ohne Fehler, Auswahlaufgaben korrekt', () => {
  for (const datei of inhaltsdateien()) {
    const doc = yaml.load(fs.readFileSync(datei, 'utf8'));
    for (let s = 0; s < 200; s++) {
      for (const inst of erzeugeThema(doc, s)) {
        const wo = `${doc.thema}/${inst.id} (Seed ${s})`;
        assert.ok(inst.teile.length > 0, wo);
        assert.doesNotMatch(JSON.stringify(inst), /undefined|NaN/, wo);
        for (const t of inst.teile) {
          if (!t.optionen) continue;
          const norm = t.optionen.map((o) => String(o).trim().toLowerCase());
          assert.strictEqual(new Set(norm).size, norm.length, `${wo}: doppelte Optionen ${t.optionen}`);
          assert.ok(norm.includes(String(t.loesung).trim().toLowerCase()), `${wo}: Lösung ${t.loesung} fehlt in ${t.optionen}`);
        }
      }
    }
  }
});
