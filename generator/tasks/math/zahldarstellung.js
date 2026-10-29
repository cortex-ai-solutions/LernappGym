const { fmt, zahlwort, STELLEN_NAME } = require('../../lib/zahlen');

function pruefeBereich(p) {
  const [min, max] = p.bereich || [];
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 1e12 || min >= max) {
    throw new Error('bereich: [min, max] mit 1 ≤ min < max ≤ 10^12 erwartet');
  }
}

// Zahl mit Zahlwort ziehen; mehrdeutige Zahlwörter (z. B. 101 Millionen) werden übersprungen.
// Gleichverteilt über die Stellenanzahl, damit nicht fast nur 12-stellige Zahlen entstehen.
function zieheMitWort(rng, [min, max]) {
  for (;;) {
    const dMin = String(min).length;
    const dMax = String(max).length;
    const d = rng.int(dMin, dMax);
    const lo = Math.max(min, 10 ** (d - 1));
    const hi = Math.min(max, 10 ** d - 1);
    const n = lo + Math.floor(rng.next() * (hi - lo + 1));
    try {
      return { n, wort: zahlwort(n) };
    } catch {
      /* neu ziehen */
    }
  }
}

// gleiche Aufgabe nicht zweimal; nach Text unterscheiden, weil manche Lösungen nur wenige Werte haben (<, >, =)
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

const inZiffern = {
  name: 'zahl-in-ziffern',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: 'Schreibe die Zahl in Ziffern.',
      teile: mehrere(p, rng, () => {
        const { n, wort } = zieheMitWort(rng, p.bereich);
        return { text: wort, loesung: n, antwort: fmt(n), eingabe: 'zahl', pruefung: { n, wort } };
      }),
    };
  },
};

const inWorten = {
  name: 'zahl-in-worten',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: 'Schreibe die Zahl als Wort.',
      teile: mehrere(p, rng, () => {
        const { n, wort } = zieheMitWort(rng, p.bereich);
        return { text: fmt(n), loesung: wort, antwort: wort, eingabe: 'wort', schreibzeilen: 2, pruefung: { n, wort } };
      }),
    };
  },
};

const STELLEN_REIHE = ['einer', 'zehner', 'hunderter', 'tausender', 'zehntausender', 'hunderttausender',
  'millionen', 'zehnmillionen', 'hundertmillionen', 'milliarden'];

// "Welchen Stellenwert hat die Ziffer 7 in 3 758 214?" – die Ziffer kommt nur einmal vor
const stellenwert = {
  name: 'stellenwert',
  pruefe(p) {
    pruefeBereich(p);
    if (p.bereich[1] >= 1e10) throw new Error('stellenwert: bereich höchstens bis 9 999 999 999 (Stellen bis Milliarden)');
  },
  erzeuge(p, rng) {
    return {
      anweisung: 'Gib den Stellenwert der Ziffer an.',
      teile: mehrere(p, rng, () => {
        for (;;) {
          const { n } = zieheMitWort(rng, p.bereich);
          const s = String(n);
          const idx = rng.int(0, s.length - 1);
          const ziffer = s[idx];
          if (ziffer === '0' || s.split(ziffer).length !== 2) continue;
          const stelle = STELLEN_REIHE[s.length - 1 - idx];
          // richtige Stelle + die 3 nächstgelegenen Stellen der Zahl als Ablenker
          const k = s.length - 1 - idx;
          const nachbarn = STELLEN_REIHE.slice(0, Math.max(s.length, 4))
            .map((x, j) => ({ x, d: Math.abs(j - k) }))
            .filter((o) => o.d > 0)
            .sort((o1, o2) => o1.d - o2.d || rng.next() - 0.5)
            .slice(0, 3)
            .map((o) => o.x);
          const optionen = rng.shuffle([stelle, ...nachbarn].map((x) => STELLEN_NAME[x]));
          return {
            text: `Welchen Stellenwert hat die Ziffer ${ziffer} in ${fmt(n)}?`,
            loesung: STELLEN_NAME[stelle],
            antwort: STELLEN_NAME[stelle],
            eingabe: 'wahl',
            optionen,
            pruefung: { n, idx },
          };
        }
      }),
    };
  },
};

const vergleichen = {
  name: 'vergleichen',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: 'Setze <, > oder = ein.',
      teile: mehrere(p, rng, () => {
        const a = zieheMitWort(rng, p.bereich).n;
        // knappe Vergleiche: gleiche Stellenanzahl, nur eine Ziffer verschieden
        const s = String(a).split('');
        const i = rng.int(1, s.length - 1);
        s[i] = String(rng.pick([...'0123456789'].filter((z) => z !== s[i])));
        const b = rng.next() < 0.1 ? a : Number(s.join(''));
        const zeichen = a < b ? '<' : a > b ? '>' : '=';
        return {
          text: `${fmt(a)} ∎ ${fmt(b)}`,
          loesung: zeichen,
          antwort: `${fmt(a)} ${zeichen} ${fmt(b)}`,
          eingabe: 'wahl',
          optionen: ['<', '>', '='],
          pruefung: { a, b },
        };
      }),
    };
  },
};

const vorgaengerNachfolger = {
  name: 'vorgaenger-nachfolger',
  pruefe: pruefeBereich,
  erzeuge(p, rng) {
    return {
      anweisung: 'Gib den Vorgänger oder Nachfolger an.',
      teile: mehrere(p, rng, () => {
        // gern an Stufen wie 40 000 oder 1 299 999, wo es spannend wird
        let n = zieheMitWort(rng, p.bereich).n;
        if (rng.next() < 0.5) n = Math.max(2, Math.round(n / 1000) * 1000 - (rng.next() < 0.5 ? 1 : 0));
        const nach = rng.next() < 0.5;
        const loesung = nach ? n + 1 : n - 1;
        return {
          text: `${nach ? 'Nachfolger' : 'Vorgänger'} von ${fmt(n)}`,
          loesung,
          antwort: fmt(loesung),
          eingabe: 'zahl',
          pruefung: { n, nach },
        };
      }),
    };
  },
};

module.exports = [inZiffern, inWorten, stellenwert, vergleichen, vorgaengerNachfolger];
