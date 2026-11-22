// Römische Zahlen (Lehrplan 2.1.2, Querschnittsaufgabe KB: Vergleich zu historischen Zahlendarstellungen).
// Heute übliche Schreibweise mit Subtraktion (IV, IX, XL, XC, CD, CM), Zahlen von 1 bis 3 999.
const { fmt } = require('../../lib/zahlen');

const ZEICHEN = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];
const WERT = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function roemisch(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) throw new RangeError(`römisch: ${n} liegt nicht zwischen 1 und 3 999`);
  let s = '';
  for (const [w, z] of ZEICHEN) while (n >= w) { s += z; n -= w; }
  return s;
}

// typische Fehler, die Kinder machen (für Ablenker und „Fehler finden“)
// 1) nur addieren: 49 = XXXXVIIII
function nurAddiert(n) {
  return roemisch(n).replace('CM', 'DCCCC').replace('CD', 'CCCC').replace('XC', 'LXXXX')
    .replace('XL', 'XXXX').replace('IX', 'VIIII').replace('IV', 'IIII');
}
// 2) falsch abgezogen: 49 = IL, 99 = IC, 1990 = MXM (I, X oder C vor jedem größeren Zeichen)
const FALSCH_ZEICHEN = (() => {
  const basis = Object.entries(WERT).map(([z, w]) => [w, z]);
  const paare = [];
  for (const [wk, k] of basis) for (const [wg, g] of basis) if ('IXC'.includes(k) && wk < wg) paare.push([wg - wk, k + g]);
  return [...basis, ...paare].sort((a, b) => b[0] - a[0] || a[1].length - b[1].length);
})();
function falschAbgezogen(n) {
  let s = '';
  for (const [w, z] of FALSCH_ZEICHEN) while (n >= w) { s += z; n -= w; }
  return s;
}

// ist s die übliche Schreibweise einer Zahl? (für vertauschte Ablenker: XVI ja, CMLXVX nein)
function istGueltig(s) {
  let summe = 0;
  for (let i = 0; i < s.length; i++) {
    const w = WERT[s[i]], danach = WERT[s[i + 1]] || 0;
    summe += w < danach ? -w : w;
  }
  return summe >= 1 && summe <= 3999 && roemisch(summe) === s;
}

function pruefeBereich(p) {
  const [min, max] = p.bereich || [];
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 3999 || min >= max) {
    throw new Error('bereich: [min, max] mit 1 ≤ min < max ≤ 3 999 erwartet');
  }
}

// Zahlen mit 4 oder 9 sind spannender (dort wird abgezogen): mit Wahrscheinlichkeit p bevorzugt
function zieheZahl(rng, [min, max], spannend = 0.6) {
  for (let i = 0; i < 20; i++) {
    const n = rng.int(min, max);
    if (rng.next() > spannend || /[49]/.test(String(n))) return n;
  }
  return rng.int(min, max);
}

function mehrere(p, rng, baue) {
  const teile = [];
  const gesehen = new Set();
  let versuche = 0;
  while (teile.length < (p.anzahl || 1)) {
    const t = baue(rng);
    if (gesehen.has(t.text) && versuche++ < 50) continue;
    gesehen.add(t.text);
    teile.push(t);
  }
  return teile;
}

// XLIV → 44 (oder als Jahreszahl: „Über einer Tür steht MDCCCXCVI.“)
const inZahl = {
  name: 'roemisch-in-zahl',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: p.jahr ? 'Welche Jahreszahl ist das? Schreibe sie mit unseren Ziffern.' : 'Schreibe die römische Zahl mit unseren Ziffern.',
      teile: mehrere(p, rng, () => {
        const n = zieheZahl(rng, p.bereich);
        const r = roemisch(n);
        return { text: r, loesung: n, antwort: p.jahr ? String(n) : fmt(n), eingabe: 'zahl', pruefung: { n } };
      }),
    };
  },
};

// 44 → XLIV
const inRoemisch = {
  name: 'zahl-in-roemisch',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: p.jahr ? 'Schreibe die Jahreszahl als römische Zahl.' : 'Schreibe als römische Zahl.',
      teile: mehrere(p, rng, () => {
        const n = zieheZahl(rng, p.bereich);
        const r = roemisch(n);
        return { text: p.jahr ? String(n) : fmt(n), loesung: r, antwort: r, eingabe: 'roemisch', pruefung: { n } };
      }),
    };
  },
};

// „Welche Schreibweise für 49 ist richtig?“ – genau eine Option ist die richtige Schreibweise der Zahl
const richtigeSchreibweise = {
  name: 'roemisch-schreibweise',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: 'Welche Schreibweise ist richtig?',
      teile: mehrere(p, rng, () => {
        const n = zieheZahl(rng, p.bereich, 0.95);
        const r = roemisch(n);
        const [min, max] = p.bereich;
        const kandidaten = [nurAddiert(n), falschAbgezogen(n),
          // vertauschte Reihenfolge: XIV ↔ XVI
          r.length >= 2 ? r.slice(0, -2) + r.slice(-1) + r.slice(-2, -1) : null,
          ...[1, -1, 10, -10, 2].map((d) => (n + d >= 1 && n + d <= 3999 && n + d >= min - 10 && n + d <= max + 10 ? roemisch(n + d) : null))];
        kandidaten[2] = kandidaten[2] && istGueltig(kandidaten[2]) ? kandidaten[2] : null;
        const ablenker = [...new Set(kandidaten.filter((k) => k && k !== r))].slice(0, 3);
        return {
          text: `Die Zahl ${fmt(n)}`,
          loesung: r,
          antwort: r,
          eingabe: 'wahl',
          optionen: rng.shuffle([r, ...ablenker]),
          pruefung: { n },
        };
      }),
    };
  },
};

// XXXVIII ∎ XL – die längere Zahl ist nicht immer die größere
const vergleichen = {
  name: 'roemisch-vergleichen',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    const [min, max] = p.bereich;
    return {
      anweisung: 'Setze <, > oder = ein.',
      teile: mehrere(p, rng, () => {
        for (;;) {
          const a = zieheZahl(rng, p.bereich);
          const b = rng.next() < 0.1 ? a : a + rng.pick([-1, 1]) * rng.int(1, Math.max(2, Math.round((max - min) / 8)));
          if (b < min || b > max) continue;
          const zeichen = a < b ? '<' : a > b ? '>' : '=';
          return {
            text: `${roemisch(a)} ∎ ${roemisch(b)}`,
            loesung: zeichen,
            antwort: `${roemisch(a)} ${zeichen} ${roemisch(b)}`,
            eingabe: 'wahl',
            optionen: ['<', '>', '='],
            pruefung: { a, b },
          };
        }
      }),
    };
  },
};

// XII + IX = XXI – Ergebnis wieder römisch
const rechnen = {
  name: 'roemisch-rechnen',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    const [min, max] = p.bereich;
    return {
      anweisung: 'Rechne. Schreibe das Ergebnis als römische Zahl.',
      teile: mehrere(p, rng, () => {
        for (;;) {
          const a = rng.int(min, max);
          const b = rng.int(min, max);
          const plus = rng.next() < 0.5;
          const e = plus ? a + b : a - b;
          if (e < 1 || e > max || (!plus && b >= a)) continue;
          return {
            text: `${roemisch(a)} ${plus ? '+' : '−'} ${roemisch(b)} = ∎`,
            loesung: roemisch(e),
            antwort: roemisch(e),
            eingabe: 'roemisch',
            breit: true,
            pruefung: { a, b, op: plus ? '+' : '-' },
          };
        }
      }),
    };
  },
};

// Fehler finden: „Tim schreibt 49 = IL.“ → richtig: XLIX
const NAMEN = ['Tim', 'Lea', 'Ben', 'Mia', 'Paul', 'Emma', 'Noah', 'Lina'];
const fehler = {
  name: 'roemisch-fehler',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: 'Hier hat sich jemand verschrieben. Schreibe die Zahl richtig als römische Zahl.',
      teile: mehrere(p, rng, () => {
        for (;;) {
          const n = zieheZahl(rng, p.bereich, 1);
          const r = roemisch(n);
          const falsch = rng.next() < 0.5 ? falschAbgezogen(n) : nurAddiert(n);
          if (falsch === r) continue;
          return {
            text: `${rng.pick(NAMEN)} schreibt: ${fmt(n)} = ${falsch}`,
            loesung: r,
            antwort: r,
            eingabe: 'roemisch',
            pruefung: { n, falsch },
          };
        }
      }),
    };
  },
};

module.exports = [inZahl, inRoemisch, richtigeSchreibweise, vergleichen, rechnen, fehler];
module.exports.roemisch = roemisch;
module.exports.nurAddiert = nurAddiert;
module.exports.falschAbgezogen = falschAbgezogen;
