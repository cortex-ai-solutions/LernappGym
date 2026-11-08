// Einstieg für das Browser-Bundle der Webapp (window.LW)
const { instanz } = require('./generate');
const { fmt, parseZahl, gleich } = require('./lib/zahlen');
const { stelleZusammen, notentabelle } = require('./klassenarbeit');
const { klassenarbeitKoerper } = require('./render/klassenarbeit');

module.exports = { instanz, fmt, parseZahl, gleich, stelleZusammen, notentabelle, klassenarbeitKoerper };
