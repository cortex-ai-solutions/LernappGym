// Sachaufgaben als Vorlagen: Zahlen werden gezogen, "loese" rechnet die Lösung aus.
// Eigene Formulierungen im Stil der Klassenarbeiten, keine Aufgaben aus dem Unterricht.
const { fmt } = require('../../lib/zahlen');

const { gr, euro: euroCt } = require('./groessen');

const { runden } = require('../../lib/zahlen');

const euro = (x) => `${fmt(x)} €`;
// Portostufen (ausgedacht, keine echten Preise): [bis Gramm, Preis in ct]
const PORTO = [[1000, 450], [2000, 590], [5000, 740], [10000, 990]];
const SCHULWEG = ['zu Fuß', 'Fahrrad', 'Bus', 'Auto', 'Straßenbahn'];
// Abfahrt/Ankunft über eine volle Stunde hinweg (wie in „fahrzeit“), auch für übergreifende Aufgaben
const VORLAGEN_ZEIT = {
  fahrzeit: (rng) => {
    const ab = 60 * rng.int(7, 16) + 5 * rng.int(1, 11);
    return { ab, an: ab + 5 * rng.int(Math.ceil((60 - (ab % 60)) / 5) + 1, 34) };
  },
};
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
    ziehe: VORLAGEN_ZEIT.fahrzeit,
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

  // ---------- Klassenarbeit: mehrere Rechenschritte (Lehrplan 2.1.2 „mehrere Rechenoperationen verknüpfen“) ----------
  // Divisoren bleiben bei einstelligen Zahlen und 10, 12, 20, 25, 30, 50 (Lernausgangslage Grundschule).

  klassenfahrt: {
    ziehe: (rng) => {
      const kinder = rng.pick([20, 25, 30]);
      const busJeKind = rng.int(8, 20);
      return { kinder, busJeKind, bus: kinder * busJeKind, eintritt: rng.int(3, 9), naechte: rng.int(2, 4), nacht: rng.int(18, 32), ziel: rng.pick(['an die Ostsee', 'in den Harz', 'in den Thüringer Wald', 'nach Berlin']) };
    },
    loese: ({ kinder, bus, eintritt, naechte, nacht }) => {
      const proKind = bus / kinder + naechte * nacht + eintritt;
      return { proKind, klasse: proKind * kinder };
    },
    text: ({ kinder, bus, eintritt, naechte, nacht, ziel }) =>
      `Die Klasse 5b fährt mit ${kinder} Kindern ${ziel}. Der Bus kostet für alle zusammen ${euro(bus)}. Jedes Kind bezahlt außerdem ${naechte} Übernachtungen zu je ${euro(nacht)} und ${euro(eintritt)} Eintritt für ein Museum. Wie viel muss jedes Kind bezahlen? Wie viel kostet die Fahrt für die ganze Klasse?`,
    weg: ({ kinder, bus, busJeKind, eintritt, naechte, nacht }, l) =>
      `Bus je Kind: ${fmt(bus)} : ${kinder} = ${busJeKind}; Übernachtungen: ${naechte} · ${nacht} = ${naechte * nacht}; ${busJeKind} + ${naechte * nacht} + ${eintritt} = ${l.proKind}; ganze Klasse: ${l.proKind} · ${kinder} = ${fmt(l.klasse)}`,
    satz: (_, l) => `Jedes Kind bezahlt ${euro(l.proKind)}. Die Fahrt kostet für die ganze Klasse ${euro(l.klasse)}.`,
    teile: (l) => [
      { text: 'Preis für ein Kind (in €)', loesung: l.proKind },
      { text: 'Preis für die ganze Klasse (in €)', loesung: l.klasse },
    ],
  },

  bretter: {
    // Rest ist nie 0, sonst fehlt der Schritt „Rest deuten“
    ziehe: (rng) => {
      let cm, stueck;
      do { cm = 10 * rng.int(15, 40); stueck = rng.pick([12, 15, 20, 25, 30, 40, 50]); } while (cm % stueck === 0 || cm < 3 * stueck);
      return { cm, stueck, name: rng.pick(['Lukas', 'Mila', 'Ole', 'Hanna']) };
    },
    loese: ({ cm, stueck }) => ({ stuecke: Math.floor(cm / stueck), rest: cm % stueck }),
    text: ({ cm, stueck, name }) =>
      `Ein Brett ist ${gr(cm / 100, 'm')} lang. ${name} sägt davon Stücke von je ${gr(stueck, 'cm')} ab. Wie viele ganze Stücke bekommt ${name}? Wie viele Zentimeter bleiben übrig?`,
    weg: ({ cm, stueck }, l) => `${gr(cm / 100, 'm')} = ${gr(cm, 'cm')}; ${cm} : ${stueck} = ${l.stuecke} Rest ${l.rest}`,
    satz: ({ name }, l) => `${name} bekommt ${l.stuecke} Stücke, es bleiben ${gr(l.rest, 'cm')} übrig.`,
    teile: (l) => [
      { text: 'Anzahl der Stücke', loesung: l.stuecke },
      { text: 'Rest (in cm)', loesung: l.rest },
    ],
  },

  umstieg: {
    ziehe: (rng) => {
      let f1, warte, f2;
      do { f1 = rng.int(25, 75); warte = rng.int(6, 25); f2 = rng.int(20, 59); } while ((f1 + warte + f2) % 60 === 0);
      return { ab: 60 * rng.int(6, 15) + rng.int(0, 59), f1, warte, f2, name: rng.pick(['Emma', 'Paul', 'Greta', 'Milan']) };
    },
    loese: ({ ab, f1, warte, f2 }) => {
      const dauer = f1 + warte + f2;
      return { dauer, an: ab + dauer };
    },
    text: ({ ab, f1, warte, f2, name }) =>
      `${name} fährt mit dem Zug zu den Großeltern. Der erste Zug fährt um ${uhr(ab)} Uhr ab und braucht ${f1} Minuten. Beim Umsteigen wartet ${name} ${warte} Minuten. Der zweite Zug braucht ${f2} Minuten. Wie lange ist ${name} insgesamt unterwegs? Um wie viel Uhr kommt ${name} an?`,
    weg: ({ ab, f1, warte, f2 }, l) =>
      `${f1} min + ${warte} min + ${f2} min = ${l.dauer} min = ${zeitspanne(l.dauer)}; ${uhr(ab)} Uhr + ${zeitspanne(l.dauer)} = ${uhr(l.an)} Uhr`,
    satz: ({ name }, l) => `${name} ist ${zeitspanne(l.dauer)} unterwegs und kommt um ${uhr(l.an)} Uhr an.`,
    teile: (l) => [
      { text: 'Fahrzeit: ∎ h ∎ min', eingabe: 'felder', felder: ['h', 'min'], loesung: [Math.floor(l.dauer / 60), l.dauer % 60], antwort: zeitspanne(l.dauer) },
      { text: 'Ankunft: ∎ Uhr ∎ min', eingabe: 'felder', felder: ['Uhr', 'min'], loesung: [Math.floor(l.an / 60), l.an % 60], antwort: `${uhr(l.an)} Uhr` },
    ],
  },

  preisvergleich: {
    // Stückpreise sind ganze Cent und verschieden, damit genau eine Packung günstiger ist
    ziehe: (rng) => {
      const [cA, cB] = rng.distinct(2, 5, 19).map((x) => 5 * x);
      const nA = rng.int(3, 6);
      const nB = rng.pick([8, 10, 12]);
      return { ding: rng.pick(['Müsliriegel', 'Joghurts', 'Bleistifte', 'Brötchen']), nA, nB, pA: nA * cA, pB: nB * cB };
    },
    loese: ({ nA, nB, pA, pB }) => {
      const cA = pA / nA, cB = pB / nB;
      return { guenstiger: cA < cB ? 'Packung A' : 'Packung B', ersparnis: Math.abs(cA - cB), cA, cB };
    },
    text: ({ ding, nA, nB, pA, pB }) =>
      `Im Supermarkt gibt es ${ding} in zwei Packungen. Packung A: ${nA} Stück für ${euroCt(pA)}. Packung B: ${nB} Stück für ${euroCt(pB)}. Welche Packung ist günstiger, wenn man den Preis für ein Stück vergleicht? Wie viel Cent spart man pro Stück?`,
    weg: ({ nA, nB, pA, pB }, l) =>
      `A: ${fmt(pA)} ct : ${nA} = ${l.cA} ct; B: ${fmt(pB)} ct : ${nB} = ${l.cB} ct; ${Math.max(l.cA, l.cB)} ct − ${Math.min(l.cA, l.cB)} ct = ${l.ersparnis} ct`,
    satz: (_, l) => `${l.guenstiger} ist günstiger. Man spart ${l.ersparnis} ct pro Stück.`,
    teile: (l) => [
      { text: 'Günstiger ist', eingabe: 'wahl', optionen: ['Packung A', 'Packung B'], loesung: l.guenstiger, antwort: l.guenstiger },
      { text: 'Ersparnis pro Stück (in ct)', loesung: l.ersparnis },
    ],
  },

  // ---------- übergreifend: verbinden zwei Lernbereiche ----------

  einwohner: {
    ziehe: (rng) => {
      const [nameA, nameB] = rng.shuffle(['Lindenau', 'Birkenfeld', 'Eichenrode', 'Ahornstadt', 'Weidenbach']).slice(0, 2);
      let a, b;
      // beide Zahlen werden beim Runden wirklich verändert, und mindestens eine wird aufgerundet
      do { a = rng.int(100000, 899999); b = rng.int(100000, 899999); } while (a === b || a % 1000 === 0 || b % 1000 === 0 || (a % 1000 < 500 && b % 1000 < 500));
      return { nameA, nameB, a, b };
    },
    loese: ({ a, b }) => {
      const rA = runden(a, 'tausender'), rB = runden(b, 'tausender');
      return { rA, rB, summe: rA + rB, unterschied: Math.abs(a - b) };
    },
    text: ({ nameA, nameB, a, b }) =>
      `Die Stadt ${nameA} hat ${fmt(a)} Einwohner, die Stadt ${nameB} hat ${fmt(b)} Einwohner. Runde beide Einwohnerzahlen auf Tausender. Berechne mit den gerundeten Zahlen, wie viele Einwohner beide Städte ungefähr zusammen haben. Berechne dann genau, wie viele Einwohner ${a > b ? nameA : nameB} mehr hat.`,
    weg: ({ a, b }, l) =>
      `${fmt(a)} ≈ ${fmt(l.rA)}; ${fmt(b)} ≈ ${fmt(l.rB)}; ${fmt(l.rA)} + ${fmt(l.rB)} = ${fmt(l.summe)}; ${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))} = ${fmt(l.unterschied)}`,
    satz: ({ nameA, nameB, a, b }, l) => `Zusammen haben beide Städte ungefähr ${fmt(l.summe)} Einwohner. ${a > b ? nameA : nameB} hat ${fmt(l.unterschied)} Einwohner mehr.`,
    teile: (l, { nameA, nameB }) => [
      { text: `${nameA} ≈`, loesung: l.rA },
      { text: `${nameB} ≈`, loesung: l.rB },
      { text: 'zusammen ≈', loesung: l.summe },
      { text: 'Unterschied', loesung: l.unterschied },
    ],
  },

  ausflug: {
    ziehe: (rng) => ({
      ...VORLAGEN_ZEIT.fahrzeit(rng),
      erwachsene: rng.int(1, 2),
      kinder: rng.int(1, 3),
      erw: 10 * rng.int(60, 190), // 6,00 € bis 19,00 €, Kinderpreis bleibt auf 5 ct genau
      familie: rng.pick(['Berger', 'Schmidt', 'Yilmaz', 'Wagner']),
    }),
    loese: ({ ab, an, erwachsene, kinder, erw }) => ({ dauer: an - ab, kosten: (erwachsene * erw + kinder * (erw / 2)) / 100 }),
    komma: true,
    text: ({ ab, an, erwachsene, kinder, erw, familie }) =>
      `Familie ${familie} fährt mit ${erwachsene === 1 ? 'einem Erwachsenen' : `${erwachsene} Erwachsenen`} und ${kinder === 1 ? 'einem Kind' : `${kinder} Kindern`} mit dem Zug in den Zoo. Der Zug fährt um ${uhr(ab)} Uhr ab und kommt um ${uhr(an)} Uhr an. Eine Fahrkarte kostet für Erwachsene ${euroCt(erw)}, Kinder zahlen die Hälfte. Wie lange dauert die Fahrt? Wie viel bezahlt die Familie für die Fahrkarten?`,
    weg: (d, l) => {
      const { erwachsene, kinder, erw } = d;
      const kind = erw / 2;
      return `${VORLAGEN.fahrzeit.weg(d, l.dauer)}; Kind: ${euroCt(erw)} : 2 = ${euroCt(kind)}; ${erwachsene} · ${euroCt(erw)} + ${kinder} · ${euroCt(kind)} = ${euroCt(erwachsene * erw)} + ${euroCt(kinder * kind)} = ${euroCt(Math.round(l.kosten * 100))}`;
    },
    satz: ({ familie }, l) => `Die Fahrt dauert ${l.dauer} Minuten. Familie ${familie} bezahlt ${euroCt(Math.round(l.kosten * 100))}.`,
    teile: (l) => [
      { text: 'Fahrzeit (in min)', loesung: l.dauer, komma: false },
      { text: 'Preis für alle (in €)', loesung: l.kosten, antwort: euroCt(Math.round(l.kosten * 100)) },
    ],
  },

  porto: {
    // Gewicht nie genau auf einer Stufengrenze, damit die Portostufe eindeutig ist
    ziehe: (rng) => {
      let d;
      do d = { buch: 100 * rng.int(8, 25), spiel: 50 * rng.int(6, 18), schuhe: 50 * rng.int(10, 20), karton: 50 * rng.int(4, 8), name: rng.pick(['Lina', 'Jonas', 'Ida', 'Theo']) };
      while ((d.buch + d.spiel + d.schuhe + d.karton) % 1000 === 0);
      return d;
    },
    loese: ({ buch, spiel, schuhe, karton }) => {
      const g = buch + spiel + schuhe + karton;
      return { kg: g / 1000, porto: PORTO.find(([bis]) => g <= bis)[1] / 100 };
    },
    komma: true,
    text: ({ buch, spiel, schuhe, karton, name }) =>
      `${name} verschickt ein Paket mit einem Buch (${gr(buch / 1000, 'kg')}), einem Spiel (${gr(spiel, 'g')}) und einem Paar Schuhe (${gr(schuhe, 'g')}). Der Karton selbst wiegt ${gr(karton, 'g')}. Das Porto kostet: ${PORTO.map(([bis, ct]) => `bis ${gr(bis / 1000, 'kg')}: ${euroCt(ct)}`).join('; ')}. Wie schwer ist das Paket? Wie viel Porto muss ${name} bezahlen?`,
    weg: ({ buch, spiel, schuhe, karton }, l) =>
      `${gr(buch / 1000, 'kg')} = ${gr(buch, 'g')}; ${fmt(buch)} g + ${fmt(spiel)} g + ${fmt(schuhe)} g + ${fmt(karton)} g = ${gr(Math.round(l.kg * 1000), 'g')} = ${gr(l.kg, 'kg')}; Stufe ${PORTO.find(([bis]) => Math.round(l.kg * 1000) <= bis).map((x, i) => (i ? euroCt(x) : `bis ${gr(x / 1000, 'kg')}`)).join(': ')}`,
    satz: ({ name }, l) => `Das Paket wiegt ${gr(l.kg, 'kg')}. ${name} bezahlt ${euroCt(Math.round(l.porto * 100))} Porto.`,
    teile: (l) => [
      { text: 'Gewicht (in kg)', loesung: l.kg },
      { text: 'Porto (in €)', loesung: l.porto, antwort: euroCt(Math.round(l.porto * 100)) },
    ],
  },

  laufen: {
    ziehe: (rng) => ({ runden: rng.int(5, 15), min: rng.int(1, 3), s: 5 * rng.int(1, 11), name: rng.pick(['Jana', 'Lio', 'Frieda', 'Karl']) }),
    loese: ({ runden: r, min, s }) => {
      const sek = r * (60 * min + s);
      return { km: (r * 400) / 1000, min: Math.floor(sek / 60), s: sek % 60, sek };
    },
    text: ({ runden: r, min, s, name }) =>
      `Beim Sportfest läuft ${name} ${r} Runden auf der 400-m-Bahn. Für jede Runde braucht ${name} ${min} min ${s} s. Wie viele Kilometer läuft ${name}? Wie lange ist ${name} insgesamt unterwegs?`,
    weg: ({ runden: r, min, s }, l) =>
      `${r} · 400 m = ${gr(r * 400, 'm')} = ${gr(l.km, 'km')}; ${min} min ${s} s = ${60 * min + s} s; ${r} · ${60 * min + s} s = ${fmt(l.sek)} s = ${l.min} min ${l.s} s`,
    satz: ({ name }, l) => `${name} läuft ${gr(l.km, 'km')} und braucht ${l.min} min ${l.s} s.`,
    teile: (l) => [
      { text: 'Strecke (in km)', loesung: l.km, komma: true },
      { text: 'Zeit: ∎ min ∎ s', eingabe: 'felder', felder: ['min', 's'], loesung: [l.min, l.s], antwort: `${l.min} min ${l.s} s` },
    ],
  },

  monatskarten: {
    // Diagramm ablesen und mit den abgelesenen Werten weiterrechnen
    ziehe: (rng) => ({ werte: rng.distinct(5, 2, 12), preis: rng.pick([15, 18, 22, 25, 28, 32]), klasse: rng.pick(['5a', '5b', '5c']) }),
    loese: ({ werte, preis }) => ({ befragt: werte.reduce((a, b) => a + b, 0), kosten: (werte[2] + werte[4]) * preis, karten: werte[2] + werte[4] }),
    daten: ({ werte, klasse }) => ({ titel: `Schulweg der Klasse ${klasse}`, merkmal: 'Verkehrsmittel', kategorien: SCHULWEG, werte, art: 'saeule', zeigen: 'diagramm' }),
    text: ({ preis, klasse }) =>
      `Die Klasse ${klasse} hat eine Umfrage zum Schulweg gemacht. Wer mit dem Bus oder mit der Straßenbahn fährt, braucht eine Monatskarte für ${preis} €. Wie viele Kinder wurden befragt? Wie viel kosten die Monatskarten für alle Kinder der Klasse zusammen?`,
    weg: ({ werte, preis }, l) => `${werte.join(' + ')} = ${l.befragt}; Bus und Straßenbahn: ${werte[2]} + ${werte[4]} = ${l.karten}; ${l.karten} · ${preis} = ${fmt(l.kosten)}`,
    satz: (_, l) => `Es wurden ${l.befragt} Kinder befragt. Die Monatskarten kosten zusammen ${euro(l.kosten)}.`,
    teile: (l) => [
      { text: 'Anzahl der befragten Kinder', loesung: l.befragt },
      { text: 'Kosten der Monatskarten (in €)', loesung: l.kosten },
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
    // Teilantworten sind Zahlen; Ausnahmen (Auswahl, Felder wie „∎ h ∎ min“) bringen eingabe und antwort selbst mit
    const teile = (v.teile ? v.teile(l, daten) : [{ text: 'Ergebnis', loesung: l }]).map((t) => {
      const { komma, ...rest } = t;
      const eingabe = t.eingabe || 'zahl';
      return { antwort: fmt(t.loesung), ...rest, eingabe, ...(eingabe === 'zahl' && (komma ?? v.komma) ? { komma: true } : {}) };
    });
    return {
      ...(v.daten ? { daten: v.daten(daten) } : {}),
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
