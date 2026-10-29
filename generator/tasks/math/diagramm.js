// Daten erfassen und darstellen: Strichliste/Tabelle → Diagramm zeichnen (Druck) oder ablesen (beides).
const UMFRAGEN = [
  { titel: 'Lieblingsfarben in einer Klasse', merkmal: 'Lieblingsfarbe', meist: 'Welche Farbe wurde am häufigsten genannt?', kategorien: ['Rot', 'Blau', 'Grün', 'Gelb', 'Lila', 'Schwarz'] },
  { titel: 'Anzahl der Geschwister', merkmal: 'Geschwister', meist: 'Wie viele Geschwister haben die meisten Kinder?', kategorien: ['0', '1', '2', '3', '4'] },
  { titel: 'Lieblingstiere', merkmal: 'Lieblingstier', meist: 'Welches Tier wurde am häufigsten genannt?', kategorien: ['Hund', 'Katze', 'Pferd', 'Hamster', 'Vogel'] },
  { titel: 'Schulweg', merkmal: 'Verkehrsmittel', meist: 'Wie kommen die meisten Kinder zur Schule?', kategorien: ['zu Fuß', 'Fahrrad', 'Bus', 'Auto', 'Straßenbahn'] },
  { titel: 'Lieblingssport', merkmal: 'Sportart', meist: 'Welche Sportart wurde am häufigsten genannt?', kategorien: ['Fußball', 'Schwimmen', 'Turnen', 'Reiten', 'Tanzen', 'Handball'] },
];

function ziehe(rng, p) {
  const u = rng.pick(UMFRAGEN);
  const anzahl = Math.min(u.kategorien.length, p.kategorien || 5);
  const kategorien = u.merkmal === 'Geschwister' ? u.kategorien.slice(0, anzahl) : rng.shuffle(u.kategorien).slice(0, anzahl);
  // verschiedene Häufigkeiten → eindeutiges Maximum/Minimum
  const werte = rng.distinct(anzahl, 1, p.max || 12);
  return { titel: u.titel, merkmal: u.merkmal, meist: u.meist, kategorien, werte };
}


function ablesefragen(d, rng) {
  const i = rng.int(0, d.kategorien.length - 1);
  let j;
  do j = rng.int(0, d.kategorien.length - 1); while (j === i);
  const [gross, klein] = d.werte[i] > d.werte[j] ? [i, j] : [j, i];
  const max = d.werte.indexOf(Math.max(...d.werte));
  const summe = d.werte.reduce((a, b) => a + b, 0);
  const k = (x) => (d.merkmal === 'Geschwister' ? `${d.kategorien[x]} Geschwister` : d.kategorien[x]);
  return [
    { text: `Wie oft wurde „${k(i)}“ genannt?`, loesung: d.werte[i], eingabe: 'zahl' },
    { text: d.meist, loesung: d.kategorien[max], eingabe: 'wahl', optionen: d.kategorien.slice() },
    { text: 'Wie viele Kinder wurden insgesamt befragt?', loesung: summe, eingabe: 'zahl' },
    { text: `Wie oft wurde „${k(gross)}“ öfter genannt als „${k(klein)}“?`, loesung: d.werte[gross] - d.werte[klein], eingabe: 'zahl' },
  ].map((t) => ({ ...t, antwort: String(t.loesung) }));
}

const diagramm = {
  name: 'diagramm',
  pruefe(p) {
    if (!['ablesen', 'zeichnen'].includes(p.modus)) throw new Error('modus: "ablesen" oder "zeichnen" erwartet');
    if (p.art && !['saeule', 'balken'].includes(p.art)) throw new Error('art: "saeule" oder "balken" erwartet');
    if (p.max && (p.max < 6 || p.max > 20)) throw new Error('max: 6–20');
  },
  erzeuge(p, rng) {
    const d = ziehe(rng, p);
    const art = p.art || rng.pick(['saeule', 'balken']);
    const artName = art === 'saeule' ? 'Säulendiagramm' : 'Balkendiagramm';
    const quelle = p.quelle || rng.pick(['strichliste', 'tabelle']);
    if (p.modus === 'zeichnen') {
      return {
        anweisung: `${d.titel}: Die ${quelle === 'strichliste' ? 'Strichliste' : 'Tabelle'} zeigt das Ergebnis einer Umfrage. Erstelle dazu ein ${artName}.`,
        daten: { ...d, art, quelle, zeigen: quelle, zeichnen: true },
        teile: [{ text: artName, loesung: d.werte, antwort: `${artName} mit ${d.kategorien.map((k, i) => `${k}: ${d.werte[i]}`).join(', ')}`, eingabe: 'zeichnung' }],
        nur: 'druck',
        pruefung: d,
      };
    }
    const teile = rng.shuffle(ablesefragen(d, rng)).slice(0, p.anzahl || 3);
    return {
      anweisung: `${d.titel}: Lies aus dem ${artName} ab.`,
      daten: { ...d, art, zeigen: 'diagramm' },
      teile,
      pruefung: d,
    };
  },
};

module.exports = [diagramm];
