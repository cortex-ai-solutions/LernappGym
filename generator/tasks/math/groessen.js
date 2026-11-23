// Größen umrechnen: Länge, Masse, Zeit, Geld. Gerechnet wird immer in der kleinsten Einheit als ganze Zahl
// (mm, mg, s, ct); Kommazahlen entstehen erst beim Teilen durch die Umrechnungszahl.
// "pruefung" trägt den Wert in der Grundeinheit, damit Tests unabhängig nachrechnen.
const { fmt } = require('../../lib/zahlen');

// Faktor zur kleinsten Einheit, von klein nach groß
const GROESSEN = {
  laenge: { mm: 1, cm: 10, dm: 100, m: 1000, km: 1000000 },
  masse: { mg: 1, g: 1000, kg: 1000000, t: 1000000000 },
  zeit: { s: 1, min: 60, h: 3600, d: 86400 },
  geld: { ct: 1, '€': 100 },
};
const STANDARD = { laenge: ['mm', 'cm', 'dm', 'm', 'km'], masse: ['g', 'kg', 't'], zeit: ['s', 'min', 'h', 'd'], geld: ['ct', '€'] };
const MODI = ['ganz', 'komma', 'gemischt', 'zerlegen'];

const NB = ' '; // geschütztes Leerzeichen zwischen Maßzahl und Einheit
const gr = (zahl, einheit) => `${fmt(zahl)}${NB}${einheit}`;
// Geld immer mit zwei Nachkommastellen: 2,40 €
const euro = (ct) => `${fmt(Math.floor(ct / 100))},${String(ct % 100).padStart(2, '0')}${NB}€`;
const istZehnerpotenz = (f) => /^10*$/.test(String(f));
const stellen = (f) => String(f).length - 1;
// Zeitreste lieber in 5er-Schritten (15 min, 40 s), bei Stunden eines Tages beliebig
const glatterRest = (rng, f) => (f % 5 === 0 ? 5 * rng.int(1, f / 5 - 1) : rng.int(1, f - 1));

function pruefeGroesse(p) {
  const groessen = p.groessen || [p.groesse];
  for (const g of groessen) {
    if (!GROESSEN[g]) throw new Error(`groesse: unbekannt "${g}"`);
    for (const e of p.einheiten || []) if (!(e in GROESSEN[g]) && groessen.length === 1) throw new Error(`einheiten: "${e}" passt nicht zu ${g}`);
  }
  if (p.modus && !MODI.includes(p.modus)) throw new Error(`modus: unbekannt "${p.modus}"`);
  if (p.modus === 'komma' && groessen.includes('zeit')) throw new Error('modus komma: Zeit hat keine Kommaschreibweise in Klasse 5');
  // mindestens ein erlaubtes Einheitenpaar je Größe
  for (const g of groessen) if (!paare(g, p).length) throw new Error(`${g}: kein Einheitenpaar für modus ${p.modus || 'ganz'}`);
}

// erlaubte (klein, groß)-Paare: benachbart, Umrechnungszahl ≤ maxFaktor, bei Komma nur Zehnerpotenzen
function paare(g, p) {
  const tab = GROESSEN[g];
  const liste = (p.einheiten || STANDARD[g]).filter((e) => e in tab);
  const max = p.maxFaktor || (g === 'zeit' ? 60 : 1000);
  const ergebnis = [];
  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      if (p.nachbarn !== false && j !== i + 1) continue;
      const f = tab[liste[j]] / tab[liste[i]];
      if (f > max) continue;
      if ((p.modus === 'komma' || g === 'geld') && !istZehnerpotenz(f)) continue;
      ergebnis.push({ klein: liste[i], gross: liste[j], f });
    }
  }
  return ergebnis;
}

// Darstellung eines Werts (in Einheiten von "klein") in der großen Einheit mit Komma
const alsGross = (wert, { gross, f }, g) => (g === 'geld' ? euro(wert) : gr(wert / f, gross));

function einTeil(p, rng) {
  const g = rng.pick(p.groessen || [p.groesse]);
  const paar = rng.pick(paare(g, p));
  const { klein, gross, f } = paar;
  const modus = p.modus || 'ganz';
  const runter = p.richtung === 'runter' ? true : p.richtung === 'hoch' ? false : rng.next() < 0.5; // groß → klein?
  const basis = (w) => ({ groesse: g, klein, gross, f, wert: w });

  if (modus === 'ganz') {
    const k = g === 'zeit' ? rng.int(2, f === 24 ? 7 : 12) : rng.int(2, f >= 1000 ? 30 : 99);
    const w = k * f;
    return runter
      ? { text: `${gr(k, gross)} = ∎ ${klein}`, loesung: w, antwort: `${gr(k, gross)} = ${gr(w, klein)}`, eingabe: 'zahl', breit: true, pruefung: basis(w) }
      : { text: `${gr(w, klein)} = ∎ ${gross}`, loesung: k, antwort: `${gr(w, klein)} = ${gr(k, gross)}`, eingabe: 'zahl', breit: true, pruefung: basis(w) };
  }

  if (modus === 'komma') {
    // Wert mit 1 bis 3 echten Nachkommastellen in der großen Einheit, z. B. 3,45 kg = 3 450 g
    const d = rng.int(1, Math.min(g === 'geld' ? 2 : 3, stellen(f)));
    const z = 10 ** d;
    let rest;
    do rest = rng.int(1, z - 1); while (rest % 10 === 0);
    const ganz = rng.int(0, g === 'geld' ? 20 : 25);
    const w = ((ganz * z + rest) * f) / z; // in kleiner Einheit, ganzzahlig
    const gross_ = alsGross(w, paar, g);
    return runter
      ? { text: `${gross_} = ∎ ${klein}`, loesung: w, antwort: `${gross_} = ${gr(w, klein)}`, eingabe: 'zahl', breit: true, pruefung: basis(w) }
      : { text: `${gr(w, klein)} = ∎ ${gross}`, loesung: w / f, antwort: `${gr(w, klein)} = ${gross_}`, eingabe: 'zahl', komma: true, breit: true, pruefung: basis(w) };
  }

  // gemischt / zerlegen: 3 m 25 cm ↔ 325 cm (bzw. 3,25 m)
  const ganz = rng.int(1, g === 'zeit' ? (f === 24 ? 6 : 9) : 20);
  const rest = g === 'zeit' && rng.next() < 0.6 ? glatterRest(rng, f) : rng.int(1, f - 1);
  const w = ganz * f + rest;
  const zusammen = `${gr(ganz, gross)} ${gr(rest, klein)}`;
  if (modus === 'zerlegen') {
    return {
      text: `${gr(w, klein)} = ∎ ${gross} ∎ ${klein}`,
      loesung: [ganz, rest],
      felder: [gross, klein],
      antwort: `${gr(w, klein)} = ${zusammen}`,
      eingabe: 'felder',
      pruefung: basis(w),
    };
  }
  if (p.komma && istZehnerpotenz(f) && rng.next() < 0.5) {
    return { text: `${zusammen} = ∎ ${gross}`, loesung: w / f, antwort: `${zusammen} = ${alsGross(w, paar, g)}`, eingabe: 'zahl', komma: true, breit: true, pruefung: basis(w) };
  }
  return { text: `${zusammen} = ∎ ${klein}`, loesung: w, antwort: `${zusammen} = ${gr(w, klein)}`, eingabe: 'zahl', breit: true, pruefung: basis(w) };
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

const ANWEISUNG = {
  ganz: 'Rechne in die angegebene Einheit um.',
  komma: 'Rechne um. Achte auf das Komma.',
  gemischt: 'Schreibe in einer Einheit.',
  zerlegen: 'Schreibe mit zwei Einheiten.',
};

const umrechnen = {
  name: 'umrechnen',
  pruefe: pruefeGroesse,
  erzeuge(p, rng) {
    return { anweisung: ANWEISUNG[p.modus || 'ganz'], teile: mehrere(p, rng, () => einTeil(p, rng)) };
  },
};

// 3,5 kg ∎ 3 050 g – mit typischen Fehlern als knappe Gegenwerte
const vergleichen = {
  name: 'groessen-vergleichen',
  pruefe(p) { pruefeGroesse({ ...p, modus: 'gemischt' }); },
  erzeuge(p, rng) {
    return {
      anweisung: 'Setze <, > oder = ein.',
      teile: mehrere(p, rng, () => {
        const g = rng.pick(p.groessen || [p.groesse]);
        const paar = rng.pick(paare(g, { ...p, modus: 'gemischt' }));
        const { klein, f } = paar;
        let links, w, falle;
        if (g === 'zeit') {
          // 1 h 30 min ∎ 130 min: Falle ist "Stunden wie Hunderter lesen"
          const ganz = rng.int(1, 5);
          const rest = glatterRest(rng, f);
          w = ganz * f + rest;
          links = `${gr(ganz, paar.gross)} ${gr(rest, klein)}`;
          falle = ganz * 100 + rest;
        } else {
          // 3,5 kg ∎ 3 050 g: Falle ist "Nachkommaziffern als kleine Einheit lesen"
          const d = Math.min(2, stellen(f));
          const z = 10 ** d;
          let rest;
          do rest = rng.int(1, z - 1); while (rest % 10 === 0 && d > 1 && rng.next() < 0.5);
          const ganz = rng.int(1, 9);
          w = ((ganz * z + rest) * f) / z;
          links = alsGross(w, paar, g);
          falle = ganz * f + rest;
        }
        const schritt = g === 'zeit' ? 5 : f / 10;
        const kandidaten = [...new Set([w, w + schritt, w - schritt, falle])].filter((x) => x > 0);
        const rechtsWert = rng.pick(kandidaten);
        const zeichen = w < rechtsWert ? '<' : w > rechtsWert ? '>' : '=';
        const rechts = gr(rechtsWert, klein);
        return {
          text: `${links} ∎ ${rechts}`,
          loesung: zeichen,
          antwort: `${links} ${zeichen} ${rechts}`,
          eingabe: 'wahl',
          optionen: ['<', '>', '='],
          pruefung: { groesse: g, links: w, rechts: rechtsWert, f },
        };
      }),
    };
  },
};

// ---------- Mit Größen rechnen (gemischte Einheiten) ----------
// modus ganz:  7 kg + 39 mg = ∎ mg, 85 t − 30 kg = ∎ kg (Ergebnis in der kleineren Einheit, wie in der Klassenarbeit)
// modus komma: 2,7 m − 6 dm = ∎ m, 2,5 km + 380 m = ∎ km (Ergebnis in Kommaschreibweise der größeren Einheit)
// modus mal:   5 · 2,6 cm = ∎ cm, 3,6 m : 4 = ∎ m (Kommazahl mal/durch natürliche Zahl)
const RECHNEN_MODI = ['ganz', 'komma', 'mal'];
const MINUS = '−';
function pruefeRechnen(p) {
  const groessen = p.groessen || [p.groesse];
  if (!groessen.length || groessen.some((g) => !['laenge', 'masse'].includes(g))) throw new Error('groessen: nur laenge und masse');
  if (p.modus && !RECHNEN_MODI.includes(p.modus)) throw new Error(`modus: unbekannt "${p.modus}"`);
  for (const g of groessen) if (einheitenVon(g, p).length < 2) throw new Error(`${g}: zu wenige Einheiten`);
}
const einheitenVon = (g, p) => (p.einheiten || STANDARD[g]).filter((e) => e in GROESSEN[g]);

function rechnenTeil(p, rng) {
  const g = rng.pick(p.groessen || [p.groesse]);
  const tab = GROESSEN[g];
  const liste = einheitenVon(g, p);
  const modus = p.modus || 'ganz';

  if (modus === 'mal') {
    const u = rng.pick(liste.filter((e) => e !== 'mm' && e !== 'mg'));
    const d = rng.int(1, 2);
    const z = 10 ** d;
    const n = rng.int(2, 9);
    let q;
    do q = rng.int(z + 1, 9 * z); while (q % 10 === 0);
    const mal = rng.next() < 0.5;
    // mal: a · n; geteilt: (q · n) : n = q – gerechnet in Zehnteln bzw. Hundertsteln
    const a = mal ? q : q * n;
    const e = mal ? q * n : q;
    const links = mal ? `${n} · ${gr(a / z, u)}` : `${gr(a / z, u)} : ${n}`;
    return { text: `${links} = ∎ ${u}`, loesung: e / z, antwort: `${links} = ${gr(e / z, u)}`, eingabe: 'zahl', komma: true, breit: true,
      pruefung: { groesse: g, einheit: u, a: (a / z) * tab[u], n, op: mal ? '·' : ':', ergebnis: (e / z) * tab[u] } };
  }

  if (modus === 'komma') {
    const paar = rng.pick(paare(g, { ...p, modus: 'komma' }));
    const { klein, gross, f } = paar;
    const d = rng.int(1, Math.min(2, stellen(f)));
    const z = 10 ** d;
    for (;;) {
      let A;
      do A = rng.int(z + 1, 30 * z); while (A % 10 === 0);
      const a = (A * f) / z; // in "klein"
      const b = f >= 100 && rng.next() < 0.5 ? rng.int(11, 99) * (f / 100) : rng.int(1, 9) * (f / 10);
      const plus = rng.next() < 0.5;
      const r = plus ? a + b : a - b;
      if (r <= 0 || r % f === 0) continue;
      const text = `${gr(a / f, gross)} ${plus ? '+' : MINUS} ${gr(b, klein)} = ∎ ${gross}`;
      return { text, loesung: r / f, antwort: `${gr(a / f, gross)} ${plus ? '+' : MINUS} ${gr(b, klein)} = ${gr(r / f, gross)}`, eingabe: 'zahl', komma: true, breit: true,
        pruefung: { groesse: g, a: a * tab[klein], b: b * tab[klein], op: plus ? '+' : '-', ergebnis: r * tab[klein] } };
    }
  }

  // ganz: zwei verschiedene Einheiten, Ergebnis in der kleineren
  const moeglich = [];
  for (let i = 0; i < liste.length; i++) for (let j = i + 1; j < liste.length; j++) {
    const f = tab[liste[j]] / tab[liste[i]];
    if (f <= 1e6) moeglich.push({ klein: liste[i], gross: liste[j], f });
  }
  const { klein, gross, f } = rng.pick(moeglich);
  // große Umrechnungszahlen (kg → mg, km → cm) nur mit kleinen Maßzahlen, sonst werden die Ergebnisse unübersichtlich
  const a = rng.int(2, f >= 100000 ? 9 : f >= 1000 ? 99 : 30);
  const b = rng.int(1, Math.min(f - 1, 999));
  const plus = rng.next() < 0.5;
  const r = plus ? a * f + b : a * f - b;
  const links = plus && rng.next() < 0.3 ? `${gr(b, klein)} + ${gr(a, gross)}` : `${gr(a, gross)} ${plus ? '+' : MINUS} ${gr(b, klein)}`;
  return { text: `${links} = ∎ ${klein}`, loesung: r, antwort: `${links} = ${gr(r, klein)}`, eingabe: 'zahl', breit: true,
    pruefung: { groesse: g, a: a * f * tab[klein], b: b * tab[klein], op: plus ? '+' : '-', ergebnis: r * tab[klein] } };
}

const RECHNEN_ANWEISUNG = {
  ganz: 'Berechne. Rechne zuerst in die kleinere Einheit um.',
  komma: 'Berechne. Gib das Ergebnis in der angegebenen Einheit an.',
  mal: 'Berechne.',
};
const groessenRechnen = {
  name: 'groessen-rechnen',
  pruefe: pruefeRechnen,
  erzeuge(p, rng) {
    return { anweisung: RECHNEN_ANWEISUNG[p.modus || 'ganz'], teile: mehrere(p, rng, () => rechnenTeil(p, rng)) };
  },
};

// ---------- Welche Angabe gehört nicht dazu? ----------
// Drei Schreibweisen derselben Größe (6 kg 45 g, 6 045 g, 6,045 kg) und eine mit typischem Fehler (6,45 kg).
const nichtZahlen = (x) => Math.round(x * 1000) / 1000;
function schreibweisen(basis, g, p) {
  const tab = GROESSEN[g];
  const liste = einheitenVon(g, p);
  const r = [];
  for (const u of liste) {
    const v = basis / tab[u];
    if (nichtZahlen(v) === v && v >= 0.01 && v < 100000) r.push(gr(v, u));
  }
  for (const { klein, gross, f } of paare(g, { ...p, modus: 'komma' })) {
    const w = basis / tab[klein];
    if (!Number.isInteger(w)) continue;
    const ganz = Math.floor(w / f), rest = w % f;
    if (ganz > 0 && rest > 0) r.push(`${gr(ganz, gross)} ${gr(rest, klein)}`);
  }
  return [...new Set(r)];
}
const ausreisser = {
  name: 'groessen-ausreisser',
  pruefe(p) { pruefeRechnen({ ...p, modus: 'ganz' }); },
  erzeuge(p, rng) {
    const teile = [];
    const gesehen = new Set();
    while (teile.length < (p.anzahl || 1)) {
      const t = einAusreisser(p, rng);
      if (gesehen.has(t.pruefung.basis)) continue;
      gesehen.add(t.pruefung.basis);
      teile.push(t);
    }
    return { anweisung: 'Drei Angaben sind gleich groß. Welche Angabe gehört nicht dazu?', teile };
  },
};
function einAusreisser(p, rng) {
        for (;;) {
          const g = rng.pick(p.groessen || [p.groesse]);
          const tab = GROESSEN[g];
          const { klein, gross, f } = rng.pick(paare(g, { ...p, modus: 'komma' }));
          const ganz = rng.int(1, 20);
          // Rest mit „Lücke“, damit der Komma-Fehler greift: 45 g von 1000 g (0,045 kg), 5 cm von 100 cm
          const rest = rng.int(1, f >= 1000 ? 99 : f - 1);
          const basis = (ganz * f + rest) * tab[klein];
          const gleich = schreibweisen(basis, g, p);
          if (gleich.length < 3) continue;
          // typische Fehler: Rest direkt hinters Komma (6 kg 45 g → 6,45 kg), Komma um eine Stelle verschoben
          const fehlerWerte = [ganz * tab[gross] + (rest * tab[gross]) / 10 ** String(rest).length, basis * 10, basis / 10];
          const falsch = [];
          for (const w of fehlerWerte) if (w !== basis && Number.isInteger(w)) falsch.push(...schreibweisen(w, g, p));
          const kandidaten = [...new Set(falsch)].filter((s) => !gleich.includes(s));
          if (!kandidaten.length) continue;
          const fehler = rng.pick(kandidaten);
          const optionen = rng.shuffle([...rng.shuffle(gleich).slice(0, 3), fehler]);
          return { text: '', loesung: fehler, antwort: fehler, eingabe: 'wahl', optionen, pruefung: { groesse: g, basis } };
        }
}

module.exports = [umrechnen, vergleichen, groessenRechnen, ausreisser];
module.exports.GROESSEN = GROESSEN;
module.exports.euro = euro;
module.exports.gr = gr;
