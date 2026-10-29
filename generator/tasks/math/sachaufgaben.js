// Sachaufgaben als Vorlagen: Zahlen werden gezogen, "loese" rechnet die Lösung aus.
// Eigene Formulierungen im Stil der Klassenarbeiten, keine Aufgaben aus dem Unterricht.
const { fmt } = require('../../lib/zahlen');

const { gr, euro: euroCt } = require('./groessen');

const euro = (x) => `${fmt(x)} €`;
const uhr = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
const zeitspanne = (min) => (min % 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min / 60} h`);

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
      `Lena kauft ${a.anzahl} ${a.ding} für je ${euro(a.preis)} und ${b.anzahl} ${b.ding} für je ${euro(b.preis)}. Sie bezahlt mit einem ${schein}‑€‑Schein. Wie viel Geld bekommt sie zurück?`,
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

  sparen: {
    // Wochen = (Preis − Erspartes) : Rate, geht ohne Rest auf
    ziehe: (rng) => {
      const rate = rng.pick([4, 5, 6, 8, 10, 12, 15]);
      const wochen = rng.int(5, 20);
      const erspart = rng.int(1, 8) * 5;
      return { rate, erspart, preis: erspart + rate * wochen, ding: rng.pick(['ein Fahrrad', 'ein Skateboard', 'Inliner', 'ein Zelt']) };
    },
    loese: ({ rate, erspart, preis }) => (preis - erspart) / rate,
    text: ({ rate, erspart, preis, ding }) =>
      `Mia möchte sich ${ding} für ${euro(preis)} kaufen. Sie hat schon ${euro(erspart)} gespart. Jede Woche legt sie ${euro(rate)} dazu. Nach wie vielen Wochen hat sie genug Geld?`,
    weg: ({ rate, erspart, preis }, l) => `${preis} − ${erspart} = ${preis - erspart}; ${preis - erspart} : ${rate} = ${l}`,
    satz: (_, l) => `Mia hat nach ${l} Wochen genug Geld.`,
  },

  // ---------- Größen und Kommazahlen: gerechnet wird in g, m, ct, min ----------

  pakete: {
    ziehe: (rng) => ({
      buecher: 100 * rng.int(12, 48), // 1,2 kg bis 4,8 kg
      dinge: rng.shuffle([['Schuhe', 50 * rng.int(8, 19)], ['eine Dose Kekse', 50 * rng.int(4, 12)], ['ein Spiel', 50 * rng.int(6, 16)]]).slice(0, 2),
    }),
    loese: ({ buecher, dinge }) => (buecher + dinge[0][1] + dinge[1][1]) / 1000,
    komma: true,
    text: ({ buecher, dinge }) =>
      `Tom packt ein Paket: Bücher mit ${gr(buecher / 1000, 'kg')}, ${dinge[0][0]} mit ${gr(dinge[0][1], 'g')} und ${dinge[1][0]} mit ${gr(dinge[1][1], 'g')}. Wie schwer ist das Paket insgesamt? Gib das Ergebnis in kg an.`,
    weg: ({ buecher, dinge }, l) =>
      `${gr(buecher / 1000, 'kg')} = ${gr(buecher, 'g')}; ${fmt(buecher)} g + ${fmt(dinge[0][1])} g + ${fmt(dinge[1][1])} g = ${gr(l * 1000, 'g')} = ${gr(l, 'kg')}`,
    satz: (_, l) => `Das Paket wiegt ${gr(l, 'kg')}.`,
    teile: (l) => [{ text: 'Ergebnis (in kg)', loesung: l }],
  },

  schulweg: {
    ziehe: (rng) => ({ meter: 50 * rng.int(13, 39), tage: rng.pick([4, 5]) }), // 650 m bis 1,95 km
    loese: ({ meter, tage }) => (meter * 2 * tage) / 1000,
    komma: true,
    text: ({ meter, tage }) =>
      `Paulas Schulweg ist ${gr(meter / 1000, 'km')} lang. Sie geht ihn an ${tage} Schultagen hin und zurück. Wie viele Kilometer läuft sie in dieser Woche?`,
    weg: ({ meter, tage }, l) => `${gr(meter / 1000, 'km')} = ${gr(meter, 'm')}; ${fmt(meter)} m · 2 · ${tage} = ${gr(l * 1000, 'm')} = ${gr(l, 'km')}`,
    satz: (_, l) => `Paula läuft in dieser Woche ${gr(l, 'km')}.`,
    teile: (l) => [{ text: 'Ergebnis (in km)', loesung: l }],
  },

  einkauf: {
    ziehe: (rng) => {
      const a = { ding: rng.pick(['Hefte', 'Bleistifte', 'Radiergummis']), anzahl: rng.int(2, 5), preis: 5 * rng.int(9, 50) };
      const b = { ding: rng.pick(['einen Zirkel', 'ein Geodreieck', 'einen Füller']), preis: 10 * rng.int(12, 89) };
      const kosten = a.anzahl * a.preis + b.preis;
      return { a, b, schein: [10, 20, 50].find((s) => s * 100 > kosten) };
    },
    loese: ({ a, b, schein }) => (schein * 100 - a.anzahl * a.preis - b.preis) / 100,
    komma: true,
    text: ({ a, b, schein }) =>
      `Ben kauft ${a.anzahl} ${a.ding} zu je ${euroCt(a.preis)} und ${b.ding} für ${euroCt(b.preis)}. Er bezahlt mit einem ${schein}‑€‑Schein. Wie viel Geld bekommt er zurück?`,
    weg: ({ a, b, schein }, l) => {
      const k = a.anzahl * a.preis + b.preis;
      return `${a.anzahl} · ${euroCt(a.preis)} = ${euroCt(a.anzahl * a.preis)}; ${euroCt(a.anzahl * a.preis)} + ${euroCt(b.preis)} = ${euroCt(k)}; ${euroCt(schein * 100)} − ${euroCt(k)} = ${euroCt(Math.round(l * 100))}`;
    },
    satz: (_, l) => `Ben bekommt ${euroCt(Math.round(l * 100))} zurück.`,
    teile: (l) => [{ text: 'Rückgeld (in €)', loesung: l, antwort: euroCt(Math.round(l * 100)) }],
  },

  fahrzeit: {
    // Zeitspanne zwischen zwei Uhrzeiten, über die volle Stunde gerechnet
    ziehe: (rng) => {
      const ab = 60 * rng.int(7, 16) + 5 * rng.int(1, 11);
      return { ab, an: ab + 5 * rng.int(Math.ceil((60 - (ab % 60)) / 5) + 1, 34) };
    },
    loese: ({ ab, an }) => an - ab,
    text: ({ ab, an }) =>
      `Der Zug fährt um ${uhr(ab)} Uhr ab und kommt um ${uhr(an)} Uhr an. Wie lange dauert die Fahrt? Gib die Dauer in Minuten an.`,
    weg: ({ ab, an }, l) => {
      const schritte = [];
      const voll = Math.ceil(ab / 60) * 60;
      schritte.push([ab, voll]);
      let t = voll;
      while (t + 60 <= an) { schritte.push([t, t + 60]); t += 60; }
      if (t < an) schritte.push([t, an]);
      return `${schritte.map(([x, y]) => `${uhr(x)} → ${uhr(y)}: ${y - x} min`).join('; ')}; ${schritte.map(([x, y]) => y - x).join(' + ')} = ${l} min`;
    },
    satz: (_, l) => `Die Fahrt dauert ${l} Minuten${l >= 60 ? ` (${zeitspanne(l)})` : ''}.`,
    teile: (l) => [{ text: 'Dauer (in min)', loesung: l }],
  },

  training: {
    // Gesamtzeit über 1 h und mit Minutenrest, sonst ist das Zerlegen zu leicht
    ziehe: (rng) => {
      let mal, minuten;
      do { mal = rng.int(2, 5); minuten = 5 * rng.int(6, 15); } while (mal * minuten <= 60 || (mal * minuten) % 60 === 0);
      return { mal, minuten, name: rng.pick(['Jonas', 'Emma', 'Noah', 'Lea']), sport: rng.pick(['Fußball', 'Schwimmen', 'Turnen', 'Judo']) };
    },
    loese: ({ mal, minuten }) => {
      const gesamt = mal * minuten;
      return { h: Math.floor(gesamt / 60), min: gesamt % 60 };
    },
    text: ({ mal, minuten, name, sport }) =>
      `${name} hat ${mal}-mal in der Woche ${sport}. Jedes Training dauert ${minuten} Minuten. Wie lange trainiert ${name} in einer Woche? Gib das Ergebnis in Stunden und Minuten an.`,
    weg: ({ mal, minuten }, l) => `${mal} · ${minuten} min = ${mal * minuten} min = ${zeitspanne(mal * minuten)}`,
    satz: ({ name }, l) => `${name} trainiert in einer Woche ${zeitspanne(l.h * 60 + l.min)}.`,
    teile: (l) => [
      { text: 'Stunden (h)', loesung: l.h },
      { text: 'Minuten (min)', loesung: l.min },
    ],
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
    const teile = (v.teile ? v.teile(l) : [{ text: 'Ergebnis', loesung: l }])
      .map((t) => ({ antwort: fmt(t.loesung), ...t, eingabe: 'zahl', ...(v.komma ? { komma: true } : {}) }));
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
