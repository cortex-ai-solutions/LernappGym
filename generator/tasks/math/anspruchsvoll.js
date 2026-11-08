// Anspruchsvollere Aufgaben für Klassenarbeiten (Anforderungsbereich II/III):
// Fehler finden und berichtigen, Ziffernkarten, vorteilhaft rechnen (Rechengesetze), Überschlag und genaue Rechnung.
// Jede Aufgabe trägt ihre Ausgangswerte in "pruefung", damit Tests unabhängig nachrechnen.
const { fmt, runden, STELLEN, STELLEN_NAME } = require('../../lib/zahlen');
const { gr } = require('./groessen');
const { text: dezText } = require('./kommazahlen');

const NAMEN = ['Mia', 'Tim', 'Lena', 'Ben', 'Sophie', 'Finn'];

// ---------- Fehler finden ----------
// Ein Kind hat gerechnet. Stimmt das Ergebnis? Wenn nicht: richtiges Ergebnis angeben.
// Falsche Ergebnisse folgen typischen Fehlern aus dem Unterricht, damit das Prüfen etwas lehrt.

function fehlerRunden(rng) {
  const stelle = rng.pick(['hunderter', 'tausender', 'zehntausender']);
  const k = STELLEN[stelle];
  const n = rng.int(10 ** (k + 1), 10 ** (k + 2) - 1);
  const richtig = runden(n, stelle);
  const f = 10 ** k;
  const fehler = [
    Math.floor(n / f) * f, // einfach abgeschnitten statt aufgerundet
    runden(n, Object.keys(STELLEN).find((s) => STELLEN[s] === k - 1)), // eine Stelle zu weit rechts gerundet
    Math.floor(n / f) * f + f, // aufgerundet, obwohl abzurunden war
  ].filter((w) => w !== richtig);
  return {
    richtig, fehler, darstellen: (w) => `${fmt(n)} auf ${STELLEN_NAME[stelle]} gerundet ergibt ${fmt(w)}.`,
    loesungText: (w) => fmt(w), einheit: '', pruefung: { art: 'runden', n, stelle },
  };
}

// Kommazahl mal/durch 10, 100, 1000 – exakt über ganze Zahlen (z, d) = z / 10^d
function normal(z, d) {
  while (d > 0 && z % 10 === 0) { z /= 10; d--; }
  return { z, d };
}
function schieben({ z, d }, k) {
  // k > 0: Komma k Stellen nach rechts (mal 10^k), k < 0: nach links
  return k >= 0 ? (d >= k ? normal(z, d - k) : normal(z * 10 ** (k - d), 0)) : normal(z, d - k);
}
function fehlerKomma(rng) {
  const d = rng.int(1, 2);
  let z;
  do z = rng.int(10 ** d + 1, 999); while (z % 10 === 0);
  const x = { z, d }; // z. B. 3,45 oder 27,8
  const mal = rng.next() < 0.5;
  // höchstens 4 Nachkommastellen im richtigen Ergebnis
  const k = rng.int(1, mal ? 3 : Math.min(3, 4 - x.d));
  const richtig = schieben(x, mal ? k : -k);
  const kandidaten = [schieben(x, mal ? -k : k), schieben(x, mal ? k - 1 : -(k - 1)), schieben(x, mal ? k + 1 : -(k + 1))];
  const fehler = kandidaten.map((w) => w.z / 10 ** w.d).filter((w) => w !== richtig.z / 10 ** richtig.d);
  const op = mal ? '·' : ':';
  const zehner = fmt(10 ** k);
  return {
    richtig: richtig.z / 10 ** richtig.d, fehler,
    darstellen: (w) => `${dezText(x)} ${op} ${zehner} = ${dezText(normal(Math.round(w * 10 ** 6), 6))}`,
    loesungText: (w) => dezText(normal(Math.round(w * 10 ** 6), 6)), komma: true, pruefung: { art: 'komma', z: x.z, d: x.d, k, mal },
  };
}

// gemischte Größe → kleinere Einheit; typischer Fehler: Ziffern zusammengeschrieben (3 kg 50 g = 350 g, 2 h 15 min = 215 min)
const GROESSEN_PAARE = [
  ['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['t', 'kg', 1000], ['cm', 'mm', 10], ['h', 'min', 60], ['min', 's', 60], ['€', 'ct', 100],
];
function fehlerGroessen(rng, p) {
  const paare = GROESSEN_PAARE.filter(([g]) => !p.einheiten || p.einheiten.includes(g));
  const [gross, klein, f] = rng.pick(paare);
  const x = rng.int(1, 9);
  // kleine Reste (unter 100) machen den Zusammenschreib-Fehler sichtbar: 3 kg 50 g
  const y = f >= 100 && rng.next() < 0.6 ? 5 * rng.int(1, 19) : rng.int(1, f - 1);
  const richtig = x * f + y;
  // typische Verwechslungen: Zeit mit 100 statt 60, 100 und 1 000 vertauscht, 10 statt 100 bei cm/mm
  const falscheZahl = { 10: 100, 60: 100, 100: 1000, 1000: 100 }[f];
  const fehler = [Number(`${x}${y}`), x * falscheZahl + y].filter((w) => w !== richtig);
  const links = `${gr(x, gross)} ${gr(y, klein)}`;
  return {
    richtig, fehler, einheit: klein,
    darstellen: (w) => `${links} = ${gr(w, klein)}`,
    loesungText: (w) => gr(w, klein), pruefung: { art: 'groessen', x, y, f, gross, klein },
  };
}

const ARTEN = { runden: fehlerRunden, komma: fehlerKomma, groessen: fehlerGroessen };

const fehlerFinden = {
  name: 'fehler-finden',
  pruefe(p) {
    if (!ARTEN[p.art]) throw new Error(`art: ${Object.keys(ARTEN).join(', ')} erwartet`);
    if (p.einheiten && !p.einheiten.some((e) => GROESSEN_PAARE.some(([g]) => g === e))) throw new Error('einheiten: keine passende Größe');
  },
  erzeuge(p, rng) {
    const name = rng.pick(NAMEN);
    const a = ARTEN[p.art](rng, p);
    // etwa jede dritte Behauptung stimmt: Prüfen heißt nicht, dass immer ein Fehler drin ist
    const stimmt = !a.fehler.length || rng.next() < 0.3;
    const behauptet = stimmt ? a.richtig : rng.pick(a.fehler);
    const zeile = a.darstellen(behauptet);
    return {
      anweisung: `${name} rechnet: ${zeile}${/[.]$/.test(zeile) ? '' : '.'} Prüfe, ob das stimmt. Wenn nicht, gib das richtige Ergebnis an.`,
      teile: [
        { text: 'Stimmt das?', loesung: stimmt, antwort: stimmt ? 'richtig' : 'falsch', eingabe: 'richtig_falsch' },
        {
          text: `Richtiges Ergebnis${a.einheit ? ` (in ${a.einheit})` : ''}`, loesung: a.richtig, antwort: a.loesungText(a.richtig), eingabe: 'zahl',
          ...(a.komma ? { komma: true } : {}),
        },
      ],
      pruefung: { ...a.pruefung, behauptet, stimmt },
    };
  },
};

// ---------- Ziffernkarten ----------
// "Bilde aus den Karten 7, 0, 3, 9, 1, 5 die größte und die kleinste sechsstellige Zahl." (Null nie vorn)
const ziffernkarten = {
  name: 'ziffernkarten',
  pruefe(p) {
    if (p.karten && (p.karten < 4 || p.karten > 7)) throw new Error('karten: 4–7');
  },
  erzeuge(p, rng) {
    const n = p.karten || 6;
    let ziffern;
    // mit Null (die Falle beim Kleinsten) und mit zwei ungeraden Ziffern (sonst ist „ungerade“ zu leicht)
    do ziffern = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n);
    while (!ziffern.includes(0) || ziffern.filter((z) => z % 2 === 1).length < 2);
    const ab = [...ziffern].sort((a, b) => b - a);
    const auf = [...ziffern].sort((a, b) => a - b);
    const groesste = Number(ab.join(''));
    // kleinste: kleinste Ziffer ungleich 0 nach vorn, dann der Rest aufsteigend
    const erste = auf.find((z) => z > 0);
    const kleinste = Number([erste, ...auf.filter((z) => z !== erste)].join(''));
    // größte ungerade Zahl: kleinste ungerade Ziffer ans Ende, der Rest absteigend davor
    const ende = auf.find((z) => z % 2 === 1);
    const ungerade = Number([...ab.filter((z) => z !== ende), ende].join(''));
    return {
      anweisung: `Du hast ${n} Ziffernkarten: ${ziffern.join(', ')}. Jede Karte darfst du genau einmal benutzen. Bilde ${n}-stellige Zahlen (keine Null vorn).`,
      teile: [
        { text: 'die größte Zahl', loesung: groesste, antwort: fmt(groesste), eingabe: 'zahl' },
        { text: 'die kleinste Zahl', loesung: kleinste, antwort: fmt(kleinste), eingabe: 'zahl' },
        { text: 'die größte ungerade Zahl', loesung: ungerade, antwort: fmt(ungerade), eingabe: 'zahl' },
      ],
      pruefung: { ziffern },
    };
  },
};

// ---------- Vorteilhaft rechnen (Rechengesetze, Lehrplan 2.1.2) ----------
const PAARE_MAL = [[25, 4], [50, 2], [20, 5], [125, 8], [4, 25], [2, 50]];
const FORMEN = {
  // 25 · 17 · 4 = 25 · 4 · 17 = 100 · 17
  vertauschen: (rng) => {
    const [a, c] = rng.pick(PAARE_MAL);
    const b = rng.int(3, 49);
    return { term: `${a} · ${b} · ${c}`, loesung: a * b * c, weg: `${a} · ${c} · ${b} = ${fmt(a * c)} · ${b} = ${fmt(a * b * c)}`, pruefung: { a, b, c, op: '***' } };
  },
  // 163 + 478 + 37 = (163 + 37) + 478
  summe: (rng) => {
    const h = 100 * rng.int(2, 9);
    const a = rng.int(11, h - 11);
    const c = h - a;
    if (a % 10 === 0) return FORMEN.summe(rng);
    const b = rng.int(101, 899);
    return { term: `${a} + ${b} + ${c}`, loesung: a + b + c, weg: `${a} + ${c} + ${b} = ${h} + ${b} = ${fmt(a + b + c)}`, pruefung: { a, b, c, op: '++' } };
  },
  // 17 · 6 + 17 · 4 = 17 · (6 + 4) = 17 · 10
  ausklammern: (rng) => {
    const a = rng.int(12, 49);
    const s = rng.pick([10, 100]);
    const b = rng.int(2, s - 2);
    return { term: `${a} · ${b} + ${a} · ${s - b}`, loesung: a * s, weg: `${a} · (${b} + ${s - b}) = ${a} · ${s} = ${fmt(a * s)}`, pruefung: { a, b, c: s - b, op: '*+*' } };
  },
  // 99 · 23 = 100 · 23 − 23
  fastHundert: (rng) => {
    const b = rng.int(12, 79);
    const a = rng.pick([99, 101]);
    const l = a * b;
    return { term: `${a} · ${b}`, loesung: l, weg: `100 · ${b} ${a === 99 ? '−' : '+'} ${b} = ${fmt(100 * b)} ${a === 99 ? '−' : '+'} ${b} = ${fmt(l)}`, pruefung: { a, b, op: '*' } };
  },
};

const vorteilhaft = {
  name: 'vorteilhaft',
  pruefe(p) {
    for (const f of p.formen || []) if (!FORMEN[f]) throw new Error(`formen: unbekannt "${f}"`);
  },
  erzeuge(p, rng) {
    const formen = rng.shuffle(p.formen || Object.keys(FORMEN));
    const teile = [];
    for (let i = 0; i < (p.anzahl || 2); i++) {
      const r = FORMEN[formen[i % formen.length]](rng);
      teile.push({ text: `${r.term} =`, loesung: r.loesung, antwort: r.weg, eingabe: 'zahl', voll: true, pruefung: r.pruefung });
    }
    return { anweisung: 'Rechne vorteilhaft im Kopf. Schreibe deinen Rechenweg auf.', teile, schreibzeilen: 1 };
  },
};

// ---------- Überschlag und genaue Rechnung ----------
// Überschlag: beide Zahlen auf die angegebene Stelle runden und damit rechnen; danach genau rechnen.
const ueberschlag = {
  name: 'ueberschlag',
  pruefe(p) {
    for (const o of p.operationen || []) if (!['+', '-', '*'].includes(o)) throw new Error(`operationen: nur + − ·, nicht "${o}"`);
  },
  erzeuge(p, rng) {
    const op = rng.pick(p.operationen || ['+', '-', '*']);
    let a, b, stelleA, stelleB, ra, rb;
    if (op === '*') {
      // dreistellig mal einstellig: nur die dreistellige Zahl wird gerundet
      do { a = rng.int(112, 989); b = rng.int(3, 9); } while (a % 100 === 0);
      stelleA = 'hunderter'; stelleB = 'einer';
    } else {
      do { a = rng.int(10001, 89999); b = rng.int(1001, 9999 + (op === '+' ? 80000 : 0)); } while (op === '-' && b >= a || a % 1000 === 0 || b % 1000 === 0);
      stelleA = stelleB = 'tausender';
    }
    ra = runden(a, stelleA); rb = runden(b, stelleB);
    const f = { '+': (x, y) => x + y, '-': (x, y) => x - y, '*': (x, y) => x * y }[op];
    const z = { '+': '+', '-': '−', '*': '·' }[op];
    const ueber = f(ra, rb), genau = f(a, b);
    const wie = op === '*' ? `Runde ${fmt(a)} dafür auf Hunderter.` : 'Runde dafür beide Zahlen auf Tausender.';
    return {
      anweisung: `Berechne ${fmt(a)} ${z} ${fmt(b)}. Mache zuerst einen Überschlag. ${wie} Rechne dann genau und vergleiche.`,
      teile: [
        { text: 'Überschlag', loesung: ueber, antwort: `${fmt(ra)} ${z} ${fmt(rb)} = ${fmt(ueber)}`, eingabe: 'zahl' },
        { text: 'Genaues Ergebnis', loesung: genau, antwort: fmt(genau), eingabe: 'zahl' },
      ],
      pruefung: { a, b, op, stelleA, stelleB },
    };
  },
};

module.exports = [fehlerFinden, ziffernkarten, vorteilhaft, ueberschlag];
module.exports.GROESSEN_PAARE = GROESSEN_PAARE;
