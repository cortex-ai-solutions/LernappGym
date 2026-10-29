// Kommazahlen (Dezimalbrüche): Komma verschieben bei · und : 10/100/1000, addieren, subtrahieren,
// mit einer einstelligen Zahl multiplizieren und dividieren, vergleichen, Stellenwerte.
// Eine Kommazahl ist intern { z, d } = z / 10^d mit ganzem z; erst die Lösung wird zur JS-Zahl.
const { fmt } = require('../../lib/zahlen');

const ZEICHEN = { '+': '+', '-': '−', '*': '·', ':': ':' };
const wert = ({ z, d }) => z / 10 ** d;
// mit festen Nachkommastellen, auch mit Endnullen: { z: 210, d: 2 } → "2,10"
const text = ({ z, d }) => (d === 0 ? fmt(z) : `${fmt(Math.floor(z / 10 ** d))},${String(z % 10 ** d).padStart(d, '0')}`);
// auf gemeinsame Nachkommastellen bringen
const auf = ({ z, d }, D) => z * 10 ** (D - d);

// Kommazahl mit genau d Nachkommastellen (letzte Ziffer ≠ 0), Ganzteil in [0, maxGanz]
function zieheDez(rng, d, maxGanz) {
  if (d === 0) return { z: rng.int(2, maxGanz), d: 0 };
  let rest;
  do rest = rng.int(1, 10 ** d - 1); while (rest % 10 === 0);
  return { z: rng.int(0, maxGanz) * 10 ** d + rest, d };
}

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

function pruefeListe(werte, erlaubt, name) {
  for (const w of werte) if (!erlaubt.includes(w)) throw new Error(`${name}: unbekannt "${w}"`);
}

// 3,45 · 100 = 345   |   72,5 : 10 = 7,25   |   3,45 · ∎ = 345
const verschieben = {
  name: 'komma-verschieben',
  pruefe(p) {
    pruefeListe(p.faktoren || [10, 100, 1000], [10, 100, 1000], 'faktoren');
    pruefeListe(p.operationen || ['*', ':'], ['*', ':'], 'operationen');
  },
  erzeuge(p, rng) {
    const faktoren = p.faktoren || [10, 100, 1000];
    const ops = p.operationen || ['*', ':'];
    const luecke = p.modus === 'platzhalter';
    return {
      anweisung: luecke ? 'Mit welcher Zahl wurde gerechnet? Wähle für ∎.' : 'Berechne. Verschiebe das Komma.',
      teile: mehrere(p, rng, () => {
        const d = rng.int(0, p.stellen ?? 2);
        const a = zieheDez(rng, d, d === 0 ? 999 : 99);
        const op = rng.pick(ops);
        // beim Teilen höchstens 3 Nachkommastellen im Ergebnis
        const f = rng.pick(op === ':' ? faktoren.filter((x) => a.d + String(x).length - 1 <= 3) : faktoren);
        const k = String(f).length - 1;
        const c = op === '*' ? { z: a.z * f, d: a.d } : { z: a.z, d: a.d + k };
        const loesung = wert(c);
        const gleichung = `${text(a)} ${ZEICHEN[op]} ${fmt(f)} = ${fmt(loesung)}`;
        if (luecke) {
          return {
            text: `${text(a)} ${ZEICHEN[op]} ∎ = ${fmt(loesung)}`,
            loesung: fmt(f),
            antwort: gleichung,
            eingabe: 'wahl',
            optionen: faktoren.map(fmt),
            pruefung: { a: wert(a), op, f, c: loesung },
          };
        }
        return {
          text: `${text(a)} ${ZEICHEN[op]} ${fmt(f)} =`,
          loesung,
          antwort: gleichung,
          eingabe: 'zahl',
          komma: true,
          pruefung: { a: wert(a), op, f, c: loesung },
        };
      }),
    };
  },
};

// 4,5 + 2,37   |   8,2 − 3,65   |   2,35 · 4   |   9,6 : 3
const rechnen = {
  name: 'komma-rechnen',
  pruefe(p) { pruefeListe(p.operationen || ['+', '-'], Object.keys(ZEICHEN), 'operationen'); },
  erzeuge(p, rng) {
    const ops = p.operationen || ['+', '-'];
    const maxGanz = p.maxGanz || 50;
    return {
      anweisung: 'Berechne.',
      teile: mehrere(p, rng, () => {
        const op = rng.pick(ops);
        let a, b, c;
        if (op === '+' || op === '-') {
          a = zieheDez(rng, rng.int(1, 2), maxGanz);
          b = zieheDez(rng, rng.int(op === '-' ? 1 : 0, 2), maxGanz);
          const D = Math.max(a.d, b.d);
          if (op === '-' && auf(a, D) < auf(b, D)) [a, b] = [b, a];
          c = { z: op === '+' ? auf(a, D) + auf(b, D) : auf(a, D) - auf(b, D), d: D };
          b = text(b);
        } else {
          const n = rng.int(2, 9);
          const x = zieheDez(rng, rng.int(1, 2), Math.min(maxGanz, 20));
          // Division geht auf: (x · n) : n = x
          if (op === '*') { a = x; c = { z: x.z * n, d: x.d }; } else { a = { z: x.z * n, d: x.d }; c = x; }
          b = String(n);
        }
        const loesung = wert(c);
        return {
          text: `${text(a)} ${ZEICHEN[op]} ${b} =`,
          loesung,
          antwort: `${text(a)} ${ZEICHEN[op]} ${b} = ${fmt(loesung)}`,
          eingabe: 'zahl',
          komma: true,
          pruefung: { a: wert(a), op, b, c: loesung },
        };
      }),
    };
  },
};

// 3,5 ∎ 3,45 – mehr Ziffern heißt nicht größer; Endnullen ändern nichts
const vergleichen = {
  name: 'komma-vergleichen',
  pruefe() {},
  erzeuge(p, rng) {
    return {
      anweisung: 'Setze <, > oder = ein.',
      teile: mehrere(p, rng, () => {
        const a = zieheDez(rng, rng.int(1, 2), 9);
        let b;
        if (rng.next() < 0.2) b = { z: a.z * 10, d: a.d + 1 }; // 2,1 = 2,10
        else {
          const ganz = Math.floor(a.z / 10 ** a.d) + (rng.next() < 0.15 ? rng.pick([-1, 1]) : 0);
          const d = rng.int(1, 3);
          do b = zieheDez(rng, d, 0); while (b.z === 0);
          b = { z: Math.max(0, ganz) * 10 ** d + b.z, d };
        }
        const D = Math.max(a.d, b.d);
        const [x, y] = rng.next() < 0.5 ? [a, b] : [b, a];
        const zeichen = auf(x, D) < auf(y, D) ? '<' : auf(x, D) > auf(y, D) ? '>' : '=';
        return {
          text: `${text(x)} ∎ ${text(y)}`,
          loesung: zeichen,
          antwort: `${text(x)} ${zeichen} ${text(y)}`,
          eingabe: 'wahl',
          optionen: ['<', '>', '='],
          pruefung: { links: text(x), rechts: text(y) },
        };
      }),
    };
  },
};

const STELLEN = ['Zehner', 'Einer', 'Zehntel', 'Hundertstel', 'Tausendstel'];

// "Welchen Stellenwert hat die Ziffer 3 in 25,738?" – alle Ziffern verschieden, damit es eindeutig ist
const stellenwert = {
  name: 'stellenwert-komma',
  pruefe() {},
  erzeuge(p, rng) {
    return {
      anweisung: 'Bestimme den Stellenwert der Ziffer.',
      teile: mehrere(p, rng, () => {
        const ziffern = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5);
        const zahl = `${ziffern[0]}${ziffern[1]},${ziffern.slice(2).join('')}`;
        const i = rng.int(1, 4); // nicht die Zehnerstelle vorn, die ist zu leicht
        const richtig = STELLEN[i];
        const andere = rng.shuffle(STELLEN.filter((s) => s !== richtig)).slice(0, 3);
        return {
          text: `Welchen Stellenwert hat die Ziffer ${ziffern[i]} in ${zahl}?`,
          loesung: richtig,
          antwort: `${ziffern[i]} steht an der ${richtig}stelle.`,
          eingabe: 'wahl',
          optionen: STELLEN.filter((s) => s === richtig || andere.includes(s)),
          pruefung: { zahl, ziffer: ziffern[i], stelle: i },
        };
      }),
    };
  },
};

module.exports = [verschieben, rechnen, vergleichen, stellenwert];
module.exports.text = text;
