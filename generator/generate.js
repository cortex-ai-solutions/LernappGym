// Macht aus einer Aufgabe der Inhaltsdatei eine konkrete Aufgabe (Instanz) – für Druck und Webapp gleich:
// { id, typ, be, schwierigkeit, prioritaet, anweisung, teile: [{ label, text, loesung, antwort, eingabe, optionen? }],
//   daten?, weg?, antwortsatz?, schreibzeilen?, nur? }
const { makeRng, hashString } = require('./lib/rng');
const { GENERATOREN } = require('./tasks');

const BUCHSTABEN = 'abcdefghijkl';

function feste(a) {
  const eingabe = a.typ === 'multiple_choice' ? 'wahl' : a.typ === 'richtig_falsch' ? 'richtig_falsch' : a.paare ? 'paare' : 'text';
  const antwort = a.typ === 'richtig_falsch' ? (a.loesung ? 'richtig' : 'falsch') : a.paare ? a.paare.map((p) => p.join(' – ')).join('; ') : String(a.loesung);
  return {
    anweisung: a.frage,
    teile: [{ text: '', loesung: a.paare || a.loesung, antwort, eingabe, optionen: a.optionen, paare: a.paare }],
  };
}

function instanz(aufgabe, seed) {
  const basis = { id: aufgabe.id, typ: aufgabe.typ, be: aufgabe.be, schwierigkeit: aufgabe.schwierigkeit, prioritaet: aufgabe.prioritaet || 2, nur: aufgabe.nur };
  let inhalt;
  if (aufgabe.generator) {
    const g = GENERATOREN[aufgabe.generator];
    if (!g) throw new Error(`Aufgabe "${aufgabe.id}": Generator "${aufgabe.generator}" unbekannt`);
    const p = { ...(aufgabe.parameter || {}), anzahl: aufgabe.anzahl };
    g.pruefe(p);
    inhalt = g.erzeuge(p, makeRng(hashString(`${seed}|${aufgabe.id}`)));
  } else {
    inhalt = feste(aufgabe);
  }
  const teile = inhalt.teile.map((t, i) => ({ ...t, label: t.label || (inhalt.teile.length > 1 ? `${BUCHSTABEN[i]})` : '') }));
  return { ...basis, nur: inhalt.nur || basis.nur, ...inhalt, teile };
}

// alle Aufgaben eines Themas
function erzeugeThema(doc, seed) {
  return doc.aufgaben.map((a) => instanz(a, seed));
}

module.exports = { instanz, erzeugeThema };
