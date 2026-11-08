// Klassenarbeit aus mehreren Lernbereichen zusammenstellen (läuft im Build und im Browser, ohne Dateizugriff).
// Grundlage: die Abschnitte "klassenarbeit:" der gewählten Themen und die übergreifenden Aufgaben (_uebergreifend.yaml).
// Gleiche Auswahl + gleicher Seed → gleiche Klassenarbeit, damit Arbeit und Lösung zusammenpassen.
const { instanz } = require('./generate');
const { makeRng, hashString } = require('./lib/rng');

const DAUER_MIN = 45;
const ZIEL_BE = 40;
const TOLERANZ = 3;
// Anteile der Anforderungsbereiche I/II/III, wie in Fachschafts-Leistungskonzepten der Sek. I üblich (ca. 30/60/10)
const AFB_ANTEIL = { 1: 0.3, 2: 0.6, 3: 0.1 };
// Übergreifende Aufgaben höchstens bis zu diesem Anteil der BE
const UEBERGREIFEND_ANTEIL = 0.3;

// Notenschlüssel der Schule (Klassen 5 bis 10, Tabelle der Eltern vom 08.11.2026): 1 ab 96 %, 2 ab 80 %, 3 ab 64 %,
// 4 ab 48 %, 5 ab 32 %, darunter 6. Die Grenze in BE ist der Prozentwert der Gesamt-BE, kaufmännisch gerundet.
// Das reproduziert alle 53 Spalten (8 bis 60 BE) der Schultabelle, ein Test prüft das.
const NOTENSCHLUESSEL = [
  { note: 1, wort: 'sehr gut', prozent: 96 },
  { note: 2, wort: 'gut', prozent: 80 },
  { note: 3, wort: 'befriedigend', prozent: 64 },
  { note: 4, wort: 'genügend', prozent: 48 },
  { note: 5, wort: 'mangelhaft', prozent: 32 },
  { note: 6, wort: 'ungenügend', prozent: 0 },
];

// Notentabelle in ganzen BE: [{ note, wort, prozent, ab, bis }]
function notentabelle(gesamt) {
  let bis = gesamt;
  return NOTENSCHLUESSEL.map(({ note, wort, prozent }) => {
    const ab = Math.min(bis, Math.round((prozent * gesamt) / 100));
    const zeile = { note, wort, prozent, ab, bis };
    bis = ab - 1;
    return zeile;
  });
}

// Note zu erreichten BE (auch halbe BE), nach der Notentabelle
function note(erreicht, gesamt) {
  const zeile = notentabelle(gesamt).find((z) => erreicht >= z.ab) || notentabelle(gesamt)[5];
  return { note: zeile.note, wort: zeile.wort };
}

// ---------- Belohnungscode für die Klassenarbeit (ab Note 3) ----------
// Die Eltern tragen am PC die erreichten BE ein, die App rechnet die Note und zeigt einen Code MIAU-XXXXXX.
// 3 Zeichen kennen die Arbeit (Variante + Lernbereiche), 3 Zeichen sind eine Prüfsumme über Kennung und Note.
// Das Katzenalbum (templates/katze.js, gleiche Rechnung) erkennt daran die Note, ohne die Arbeit zu kennen.
// Bewusst einfacher Schutz für Kinder, nicht gegen Angreifer.
const CODE_ZEICHEN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_NOTEN = [1, 2, 3];
function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}
function dreiZeichen(h) { return CODE_ZEICHEN[h & 31] + CODE_ZEICHEN[(h >>> 5) & 31] + CODE_ZEICHEN[(h >>> 10) & 31]; }
function kaKennung(seed, themen) { return dreiZeichen(fnv(`ka|${seed}|${[...themen].sort().join(',')}`)); }
function kaCode({ seed, themen, note: n }) {
  if (!CODE_NOTEN.includes(n)) return null;
  const k = kaKennung(seed, themen);
  return `MIAU-${k}${dreiZeichen(fnv(`miau-ka|${k}|${n}`))}`;
}

// themen: [{ thema, titel, reihenfolge, klassenarbeit: [Aufgaben] }], uebergreifend: [Aufgaben mit themen]
function stelleZusammen({ themen, uebergreifend = [], seed, ziel = ZIEL_BE }) {
  if (!themen.length) throw new Error('Klassenarbeit: mindestens einen Lernbereich auswählen');
  for (const t of themen) if (!t.klassenarbeit || !t.klassenarbeit.length) throw new Error(`Klassenarbeit: ${t.thema} hat keine Klassenarbeitsaufgaben`);
  const gewaehlt = [...themen].sort((a, b) => (a.reihenfolge || 99) - (b.reihenfolge || 99));
  const ids = new Set(gewaehlt.map((t) => t.thema));
  const rng = makeRng(hashString(`ka|${seed}|${[...ids].sort().join(',')}`));
  const budget = { 1: AFB_ANTEIL[1] * ziel, 2: AFB_ANTEIL[2] * ziel, 3: AFB_ANTEIL[3] * ziel };
  const liste = [];
  let summe = 0;

  const nimm = (a, thema, runde) => {
    const inst = instanz({ ...a, id: `${thema || 'uebergreifend'}/${a.id}${runde > 1 ? `-${runde}` : ''}`, thema: thema || undefined }, runde > 1 ? `${seed}#${runde}` : String(seed));
    liste.push(inst);
    summe += a.be;
    budget[a.afb] -= a.be;
  };

  // 1. übergreifende Aufgaben, deren Lernbereiche alle gewählt sind (ab 2 Bereichen; ab 4 Bereichen bis zu zwei)
  if (gewaehlt.length >= 2) {
    const passend = rng.shuffle(uebergreifend.filter((a) => a.themen.every((t) => ids.has(t))));
    let anzahl = 0;
    for (const a of passend) {
      if (anzahl >= (gewaehlt.length >= 4 ? 2 : 1) || summe + a.be > UEBERGREIFEND_ANTEIL * ziel) continue;
      nimm(a, null, 1);
      anzahl++;
    }
  }

  // 2. reihum je Lernbereich eine Aufgabe, bis das BE-Ziel erreicht ist. Gewählt wird jeweils die Aufgabe,
  //    deren Anforderungsbereich am meisten fehlt. Ist ein Pool leer, kommen Generator-Aufgaben mit neuen Zahlen dazu.
  const warteschlangen = rng.shuffle(gewaehlt.map((t) => ({ t, pool: rng.shuffle(t.klassenarbeit), benutzt: new Set(), runde: 1 })));
  for (let schritt = 0; schritt < 50 && summe < ziel - TOLERANZ; schritt++) {
    let weiter = false;
    for (const q of warteschlangen) {
      if (summe >= ziel - TOLERANZ) break;
      if (q.pool.every((a) => q.benutzt.has(a.id))) {
        const neu = q.pool.filter((a) => a.generator);
        if (!neu.length) continue;
        q.runde++;
        q.benutzt = new Set(q.pool.filter((a) => !a.generator).map((a) => a.id));
      }
      const kandidaten = q.pool.filter((a) => !q.benutzt.has(a.id) && summe + a.be <= ziel + TOLERANZ);
      if (!kandidaten.length) continue;
      const a = kandidaten.reduce((best, k) => (budget[k.afb] > budget[best.afb] ? k : best));
      q.benutzt.add(a.id);
      nimm(a, q.t.thema, q.runde);
      weiter = true;
    }
    if (!weiter) break;
  }

  // 3. Reihenfolge: zuerst Grundwissen (AFB I), dann je Lernbereich, zum Schluss Begründen und übergreifende Aufgaben
  const rang = Object.fromEntries(gewaehlt.map((t, i) => [t.thema, i]));
  const gruppe = (a) => (a.afb === 1 ? 0 : a.afb === 3 || !a.thema ? 2 : 1);
  const aufgaben = liste
    .map((a, i) => ({ a, i }))
    .sort((x, y) => gruppe(x.a) - gruppe(y.a) || (rang[x.a.thema] ?? 99) - (rang[y.a.thema] ?? 99) || x.a.afb - y.a.afb || x.i - y.i)
    .map((x) => x.a);

  const beJeThema = gewaehlt.map((t) => ({ thema: t.thema, titel: t.titel, be: aufgaben.filter((a) => a.thema === t.thema || (a.themen || []).includes(t.thema)).reduce((s, a) => s + a.be, 0) }));
  const afb = [1, 2, 3].map((n) => aufgaben.filter((a) => a.afb === n).reduce((s, a) => s + a.be, 0));
  return { seed: String(seed), aufgaben, gesamtBe: summe, themen: beJeThema, afb, dauer: DAUER_MIN, noten: notentabelle(summe) };
}

module.exports = { stelleZusammen, notentabelle, note, kaCode, kaKennung, CODE_NOTEN, NOTENSCHLUESSEL, ZIEL_BE, TOLERANZ, DAUER_MIN };
