const { fmt, runden, STELLEN, STELLEN_NAME } = require('../../lib/zahlen');

const BUCHSTABEN = 'abcdefghij';

function pruefeStellen(p) {
  if (!Array.isArray(p.stellen) || !p.stellen.length) throw new Error('stellen: Liste fehlt');
  for (const s of p.stellen) if (STELLEN[s] === undefined) throw new Error(`stellen: unbekannt "${s}"`);
  if (!Array.isArray(p.ziffern) || !p.ziffern.length) throw new Error('ziffern: Liste fehlt');
  // Rundungsstelle muss mindestens eine Ziffer links von sich haben
  const maxK = Math.max(...p.stellen.map((s) => STELLEN[s]));
  if (Math.min(...p.ziffern) < maxK + 2) throw new Error(`ziffern ${p.ziffern} zu kurz für Stelle mit 10^${maxK}`);
}

// Zufallszahl mit genau d Ziffern; mit uebertrag wird ein Übertrag über die Rundungsstelle erzwungen
// (z. B. 34 961 → 35 000 beim Runden auf Hunderter)
function ziehe(rng, d, k, uebertrag) {
  const ziffern = [rng.int(1, 9), ...Array.from({ length: d - 1 }, () => rng.int(0, 9))];
  const pos = d - 1 - k; // Index der Rundungsstelle von links
  if (uebertrag) {
    ziffern[pos] = 9;
    ziffern[pos + 1] = rng.int(5, 9);
    if (pos > 0 && ziffern[pos - 1] === 9) ziffern[pos - 1] = rng.int(1, 8);
  } else if (ziffern.slice(pos + 1).every((z) => z === 0)) {
    ziffern[pos + 1] = rng.int(1, 9); // keine schon gerundete Zahl
  }
  return Number(ziffern.join(''));
}

const rundenEinzeln = {
  name: 'runden',
  pruefe: pruefeStellen,
  erzeuge(p, rng) {
    const anzahl = p.anzahl || 1;
    const teile = [];
    const gesehen = new Set();
    while (teile.length < anzahl) {
      const stelle = rng.pick(p.stellen);
      const n = ziehe(rng, rng.pick(p.ziffern), STELLEN[stelle], p.uebertrag);
      if (gesehen.has(n)) continue;
      gesehen.add(n);
      const r = runden(n, stelle);
      teile.push({
        text: `Runde ${fmt(n)} auf ${STELLEN_NAME[stelle]}.`,
        loesung: r,
        antwort: `${fmt(n)} ≈ ${fmt(r)}`,
        eingabe: 'zahl',
        pruefung: { n, stelle },
      });
    }
    return { anweisung: anzahl > 1 ? 'Runde die Zahlen.' : 'Runde die Zahl.', teile };
  },
};

const rundenReihe = {
  name: 'runden-reihe',
  pruefe: pruefeStellen,
  erzeuge(p, rng) {
    const kMax = Math.max(...p.stellen.map((s) => STELLEN[s]));
    const n = ziehe(rng, rng.pick(p.ziffern), kMax, false);
    return {
      anweisung: `Runde die Zahl ${fmt(n)} auf …`,
      teile: p.stellen.map((stelle, i) => {
        const r = runden(n, stelle);
        return {
          label: `${BUCHSTABEN[i]})`,
          text: `${STELLEN_NAME[stelle]}`,
          frageWeb: `Runde ${fmt(n)} auf ${STELLEN_NAME[stelle]}.`,
          loesung: r,
          antwort: `${fmt(n)} ≈ ${fmt(r)}`,
          eingabe: 'zahl',
          pruefung: { n, stelle },
        };
      }),
    };
  },
};

module.exports = [rundenEinzeln, rundenReihe];
