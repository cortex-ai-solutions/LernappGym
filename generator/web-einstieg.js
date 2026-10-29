// Einstieg für das Browser-Bundle der Webapp (window.LW)
const { instanz } = require('./generate');
const { fmt, parseZahl, gleich } = require('./lib/zahlen');

module.exports = { instanz, fmt, parseZahl, gleich };
