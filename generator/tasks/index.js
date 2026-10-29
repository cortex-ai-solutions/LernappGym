// Verzeichnis aller Aufgabengeneratoren: name → { pruefe(parameter), erzeuge(parameter, rng) }
const MODULE = [
  require('./math/runden'),
  require('./math/zahldarstellung'),
  require('./math/rechnen'),
  require('./math/sachaufgaben'),
  require('./math/diagramm'),
  require('./math/groessen'),
  require('./math/kommazahlen'),
];

const GENERATOREN = {};
for (const g of MODULE.flat()) {
  if (GENERATOREN[g.name]) throw new Error(`Generator "${g.name}" doppelt registriert`);
  GENERATOREN[g.name] = g;
}

module.exports = { GENERATOREN };
