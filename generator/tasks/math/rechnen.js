// Grundrechenarten: Kopfrechnen, Platzhalter, Fachbegriffe, verkettete Aufgaben.
// Jede Aufgabe trägt ihre Rechnung als { a, op, b, c } in "pruefung", damit Tests sie unabhängig nachrechnen.
const { fmt } = require('../../lib/zahlen');

const ZEICHEN = { '+': '+', '-': '−', '*': '·', ':': ':' };
const OPS = Object.keys(ZEICHEN);

function pruefeOps(p) {
  const ops = p.operationen || OPS;
  for (const o of ops) if (!OPS.includes(o)) throw new Error(`operationen: unbekannt "${o}"`);
  const [min, max] = p.bereich || [];
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || min >= max) throw new Error('bereich: [min, max] erwartet');
  if (p.faktor) {
    const [fmin, fmax] = p.faktor;
    if (!Number.isInteger(fmin) || !Number.isInteger(fmax) || fmin < 2 || fmin > fmax) throw new Error('faktor: [min, max] mit min ≥ 2 erwartet');
  }
}

// a op b = c, alle Zahlen natürlich, Division ohne Rest, Subtraktion ohne negatives Ergebnis
function zieheRechnung(rng, op, p) {
  const [min, max] = p.bereich;
  const [fmin, fmax] = p.faktor || [2, 12];
  switch (op) {
    case '+': {
      const a = rng.int(min, max);
      const b = rng.int(min, max);
      return { a, op, b, c: a + b };
    }
    case '-': {
      const a = rng.int(Math.max(min, 1), max);
      const b = rng.int(min, a);
      return { a, op, b, c: a - b };
    }
    case '*': {
      const a = rng.int(fmin, fmax);
      const b = rng.int(Math.max(min, 2), Math.max(Math.min(max, fmax), Math.max(min, 2)));
      return { a, op, b, c: a * b };
    }
    case ':': {
      const b = rng.int(fmin, fmax);
      const c = rng.int(Math.max(min, 2), Math.max(Math.min(max, fmax), Math.max(min, 2)));
      return { a: b * c, op, b, c };
    }
    default:
      throw new Error(op);
  }
}

const term = ({ a, op, b }) => `${fmt(a)} ${ZEICHEN[op]} ${fmt(b)}`;

function mehrere(p, rng, baue) {
  const teile = [];
  const gesehen = new Set();
  let versuche = 0;
  while (teile.length < (p.anzahl || 1)) {
    const t = baue();
    if (gesehen.has(t.text) && versuche++ < 50) continue;
    gesehen.add(t.text);
    teile.push(t);
  }
  return teile;
}

const kopfrechnen = {
  name: 'kopfrechnen',
  pruefe: pruefeOps,
  erzeuge(p, rng) {
    const ops = p.operationen || OPS;
    return {
      anweisung: 'Berechne.',
      teile: mehrere(p, rng, () => {
        const r = zieheRechnung(rng, rng.pick(ops), p);
        return { text: `${term(r)} =`, loesung: r.c, antwort: `${term(r)} = ${fmt(r.c)}`, eingabe: 'zahl', pruefung: r };
      }),
    };
  },
};

// 47 − ∎ = 23 – das Kästchen sitzt an Stelle a, b oder c
const platzhalter = {
  name: 'platzhalter',
  pruefe: pruefeOps,
  erzeuge(p, rng) {
    const ops = p.operationen || OPS;
    return {
      anweisung: 'Nenne die Zahl im Kästchen ∎.',
      teile: mehrere(p, rng, () => {
        const r = zieheRechnung(rng, rng.pick(ops), p);
        const luecke = rng.pick(['a', 'b']);
        const zeige = (k) => (k === luecke ? '∎' : fmt(r[k]));
        return {
          text: `${zeige('a')} ${ZEICHEN[r.op]} ${zeige('b')} = ${fmt(r.c)}`,
          loesung: r[luecke],
          antwort: `∎ = ${fmt(r[luecke])}`,
          eingabe: 'zahl',
          pruefung: { ...r, luecke },
        };
      }),
    };
  },
};

const BEGRIFF = {
  '+': { wort: 'die Summe', ergebnis: 'Summe' },
  '-': { wort: 'die Differenz', ergebnis: 'Differenz' },
  '*': { wort: 'das Produkt', ergebnis: 'Produkt' },
  ':': { wort: 'den Quotienten', ergebnis: 'Quotient' },
};

// "Berechne das Produkt aus 17 und 11."
const fachbegriffe = {
  name: 'fachbegriffe',
  pruefe: pruefeOps,
  erzeuge(p, rng) {
    const ops = p.operationen || OPS;
    return {
      anweisung: 'Berechne.',
      teile: mehrere(p, rng, () => {
        const r = zieheRechnung(rng, rng.pick(ops), p);
        return {
          text: `Berechne ${BEGRIFF[r.op].wort} aus ${fmt(r.a)} und ${fmt(r.b)}.`,
          loesung: r.c,
          antwort: `${term(r)} = ${fmt(r.c)}`,
          eingabe: 'zahl',
          pruefung: r,
        };
      }),
    };
  },
};

const NACHHER = [
  { wort: 'verdoppelt', f: (x) => x * 2, geht: () => true },
  { wort: 'verdreifacht', f: (x) => x * 3, geht: () => true },
  { wort: 'halbiert', f: (x) => x / 2, geht: (x) => x % 2 === 0 },
];

// "Berechne die Zahl, die man erhält, wenn man die Summe von 13 und 5 verdoppelt."
const verkettet = {
  name: 'verkettet',
  pruefe: pruefeOps,
  erzeuge(p, rng) {
    const ops = (p.operationen || ['+', '-']).filter((o) => o === '+' || o === '-');
    return {
      anweisung: 'Berechne.',
      teile: mehrere(p, rng, () => {
        for (;;) {
          const r = zieheRechnung(rng, rng.pick(ops), p);
          const n = rng.pick(NACHHER);
          if (!n.geht(r.c) || r.c === 0) continue;
          const loesung = n.f(r.c);
          return {
            text: `Berechne die Zahl, die man erhält, wenn man ${BEGRIFF[r.op].wort} von ${fmt(r.a)} und ${fmt(r.b)} ${n.wort}.`,
            loesung,
            antwort: `${term(r)} = ${fmt(r.c)}; ${n.wort}: ${fmt(loesung)}`,
            eingabe: 'zahl',
            pruefung: { ...r, nachher: n.wort },
          };
        }
      }),
    };
  },
};

// "Gib an, wie oft die Zahl 13 in die Zahl 156 passt."
const wieOft = {
  name: 'wie-oft',
  pruefe: pruefeOps,
  erzeuge(p, rng) {
    return {
      anweisung: 'Gib an, wie oft die erste Zahl in die zweite passt.',
      teile: mehrere(p, rng, () => {
        const r = zieheRechnung(rng, ':', p);
        return {
          text: `Wie oft passt ${fmt(r.b)} in ${fmt(r.a)}?`,
          loesung: r.c,
          antwort: `${fmt(r.a)} : ${fmt(r.b)} = ${fmt(r.c)}, also ${fmt(r.c)}-mal`,
          eingabe: 'zahl',
          pruefung: r,
        };
      }),
    };
  },
};

module.exports = [kopfrechnen, platzhalter, fachbegriffe, verkettet, wieOft];
module.exports.ZEICHEN = ZEICHEN;
