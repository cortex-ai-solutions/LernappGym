// Sachaufgaben als Vorlagen: Zahlen werden gezogen, "loese" rechnet die Lösung aus.
// Eigene Formulierungen im Stil der Klassenarbeiten, keine Aufgaben aus dem Unterricht.
const { fmt } = require('../../lib/zahlen');

const euro = (x) => `${fmt(x)} €`;

const VORLAGEN = {
  tierbeine: {
    ziehe: (rng) => {
      const tiere = rng.shuffle([
        ['Schafe', 4], ['Kühe', 4], ['Ziegen', 4], ['Pferde', 4], ['Hühner', 2], ['Gänse', 2], ['Enten', 2],
      ]).slice(0, 3);
      return { tiere: tiere.map(([name, beine]) => ({ name, beine, anzahl: rng.int(2, 15) })) };
    },
    loese: ({ tiere }) => tiere.reduce((s, t) => s + t.anzahl * t.beine, 0),
    text: ({ tiere }) => {
      const liste = tiere.map((t) => `${t.anzahl} ${t.name}`);
      return `Auf einem Bauernhof leben ${liste.slice(0, -1).join(', ')} und ${liste.at(-1)}. Berechne, wie viele Tierbeine auf dem Hof herumlaufen.`;
    },
    weg: ({ tiere }, l) => `${tiere.map((t) => `${t.anzahl} · ${t.beine}`).join(' + ')} = ${fmt(l)}`,
    satz: (_, l) => `Auf dem Hof laufen ${fmt(l)} Tierbeine herum.`,
  },

  mitglieder: {
    // rückwärts rechnen: Anfang = jetzt + verloren − neu
    ziehe: (rng) => {
      const verloren = rng.int(10, 60);
      const neu = rng.int(verloren + 5, 150);
      const anfang = rng.int(150, 800);
      return { verloren, neu, jetzt: anfang - verloren + neu, art: rng.pick(['Sportverein', 'Chor', 'Schachclub', 'Wanderverein']) };
    },
    loese: ({ verloren, neu, jetzt }) => jetzt + verloren - neu,
    text: ({ verloren, neu, jetzt, art }) =>
      `Ein ${art} hat in einem Jahr ${fmt(verloren)} Mitglieder verloren und ${fmt(neu)} neue Mitglieder aufgenommen. Jetzt hat er ${fmt(jetzt)} Mitglieder. Wie viele Mitglieder hatte er am Jahresanfang?`,
    weg: ({ verloren, neu, jetzt }, l) => `${fmt(jetzt)} + ${fmt(verloren)} − ${fmt(neu)} = ${fmt(l)}`,
    satz: ({ art }, l) => `Am Jahresanfang hatte der ${art} ${fmt(l)} Mitglieder.`,
  },

  fahrkarten: {
    // Kinder zahlen die Hälfte: gesamt = e·p + k·p/2, p gerade
    ziehe: (rng) => {
      const erwachsene = rng.int(1, 3);
      const kinder = rng.int(1, 4);
      const preis = 2 * rng.int(4, 20);
      return { erwachsene, kinder, gesamt: erwachsene * preis + (kinder * preis) / 2, mittel: rng.pick(['der Bahn', 'dem Bus', 'dem Schiff']) };
    },
    loese: ({ erwachsene, kinder, gesamt }) => {
      const preis = (2 * gesamt) / (2 * erwachsene + kinder);
      return { erwachsener: preis, kind: preis / 2 };
    },
    text: ({ erwachsene, kinder, gesamt, mittel }) =>
      `${erwachsene === 1 ? 'Ein Erwachsener' : `${erwachsene} Erwachsene`} und ${kinder === 1 ? 'ein Kind' : `${kinder} Kinder`} fahren mit ${mittel}. Die Fahrt kostet zusammen ${euro(gesamt)}. Kinder zahlen die Hälfte. Berechne, wie viel die Fahrt für einen Erwachsenen und für ein Kind kostet.`,
    // in Kinderpreisen rechnen, damit keine Kommazahlen entstehen
    weg: ({ erwachsene, kinder, gesamt }, l) =>
      `Ein Erwachsener zahlt so viel wie 2 Kinder: ${erwachsene} · 2 + ${kinder} = ${2 * erwachsene + kinder} Kinderpreise; ${euro(gesamt)} : ${2 * erwachsene + kinder} = ${euro(l.kind)} (Kind); ${euro(l.kind)} · 2 = ${euro(l.erwachsener)} (Erwachsener)`,
    satz: (_, l) => `Ein Erwachsener zahlt ${euro(l.erwachsener)}, ein Kind zahlt ${euro(l.kind)}.`,
    teile: (l) => [
      { text: 'Preis für einen Erwachsenen (in €)', loesung: l.erwachsener },
      { text: 'Preis für ein Kind (in €)', loesung: l.kind },
    ],
  },

  rueckgeld: {
    ziehe: (rng) => {
      const a = { ding: rng.pick(['Hefte', 'Bleistifte', 'Radiergummis']), anzahl: rng.int(2, 6), preis: rng.int(1, 4) };
      const [eins, viele] = rng.pick([['Buch', 'Bücher'], ['Malblock', 'Malblöcke'], ['Füller', 'Füller']]);
      const anzahl = rng.int(1, 3);
      const b = { ding: anzahl === 1 ? eins : viele, anzahl, preis: rng.int(5, 12) };
      const kosten = a.anzahl * a.preis + b.anzahl * b.preis;
      const schein = [20, 50, 100].find((s) => s > kosten);
      return { a, b, schein };
    },
    loese: ({ a, b, schein }) => schein - (a.anzahl * a.preis + b.anzahl * b.preis),
    text: ({ a, b, schein }) =>
      `Lena kauft ${a.anzahl} ${a.ding} für je ${euro(a.preis)} und ${b.anzahl} ${b.ding} für je ${euro(b.preis)}. Sie bezahlt mit einem ${schein}-€-Schein. Wie viel Geld bekommt sie zurück?`,
    weg: ({ a, b, schein }, l) => `${a.anzahl} · ${a.preis} + ${b.anzahl} · ${b.preis} = ${schein - l}; ${schein} − ${schein - l} = ${l}`,
    satz: (_, l) => `Lena bekommt ${euro(l)} zurück.`,
  },

  busse: {
    // aufrunden: Rest braucht noch einen Bus
    ziehe: (rng) => {
      const plaetze = rng.pick([30, 40, 45, 50]);
      let kinder;
      do kinder = rng.int(plaetze + 1, plaetze * 5); while (kinder % plaetze === 0);
      return { plaetze, kinder };
    },
    loese: ({ plaetze, kinder }) => Math.ceil(kinder / plaetze),
    text: ({ plaetze, kinder }) =>
      `${fmt(kinder)} Kinder fahren ins Schullandheim. In einen Bus passen ${plaetze} Kinder. Wie viele Busse werden mindestens gebraucht?`,
    weg: ({ plaetze, kinder }, l) => `${fmt(kinder)} : ${plaetze} = ${Math.floor(kinder / plaetze)} Rest ${kinder % plaetze}; für den Rest braucht man noch einen Bus → ${l}`,
    satz: (_, l) => `Es werden mindestens ${l} Busse gebraucht.`,
  },
};

const sachaufgabe = {
  name: 'sachaufgabe',
  pruefe(p) {
    const v = p.vorlagen || Object.keys(VORLAGEN);
    for (const name of v) if (!VORLAGEN[name]) throw new Error(`vorlagen: unbekannt "${name}"`);
  },
  erzeuge(p, rng) {
    const name = rng.pick(p.vorlagen || Object.keys(VORLAGEN));
    const v = VORLAGEN[name];
    const daten = v.ziehe(rng);
    const l = v.loese(daten);
    const teile = v.teile
      ? v.teile(l).map((t) => ({ ...t, antwort: fmt(t.loesung), eingabe: 'zahl' }))
      : [{ text: 'Ergebnis', loesung: l, antwort: fmt(l), eingabe: 'zahl' }];
    return {
      anweisung: v.text(daten),
      teile,
      weg: v.weg(daten, l),
      antwortsatz: v.satz(daten, l),
      schreibzeilen: 4,
      pruefung: { vorlage: name, daten },
    };
  },
};

module.exports = [sachaufgabe];
module.exports.VORLAGEN = VORLAGEN;
