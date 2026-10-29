// Packt CommonJS-Module (nur relative require-Aufrufe) in ein einzelnes Browser-Skript.
// So laufen dieselben Generatoren wie im Build auch in der Webapp – jede Übung bekommt neue Zahlen, auch offline.
const fs = require('fs');
const path = require('path');

function aufloesen(von, spec) {
  const basis = path.resolve(path.dirname(von), spec);
  for (const kandidat of [basis, `${basis}.js`, path.join(basis, 'index.js')]) {
    if (fs.existsSync(kandidat) && fs.statSync(kandidat).isFile()) return kandidat;
  }
  throw new Error(`bundle: ${spec} aus ${von} nicht gefunden`);
}

function bundle(einstieg, globalName) {
  const module = new Map();
  const sammeln = (datei) => {
    if (module.has(datei)) return;
    const code = fs.readFileSync(datei, 'utf8');
    const abh = {};
    module.set(datei, { code, abh });
    for (const [, spec] of code.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      if (!spec.startsWith('.')) throw new Error(`bundle: externes Modul "${spec}" in ${datei} ist im Browser nicht verfügbar`);
      const ziel = aufloesen(datei, spec);
      abh[spec] = ziel;
      sammeln(ziel);
    }
  };
  sammeln(path.resolve(einstieg));
  const ids = new Map([...module.keys()].map((d, i) => [d, i]));
  const defs = [...module.entries()].map(([datei, { code, abh }]) => {
    const karte = JSON.stringify(Object.fromEntries(Object.entries(abh).map(([s, z]) => [s, ids.get(z)])));
    return `/* ${path.basename(datei)} */ [function (module, exports, require) {\n${code}\n}, ${karte}]`;
  });
  return `(function () {
  var defs = [${defs.join(',\n')}];
  var cache = {};
  function load(id) {
    if (cache[id]) return cache[id].exports;
    var m = (cache[id] = { exports: {} });
    defs[id][0](m, m.exports, function (spec) { return load(defs[id][1][spec]); });
    return m.exports;
  }
  window[${JSON.stringify(globalName)}] = load(${ids.get(path.resolve(einstieg))});
})();`;
}

module.exports = { bundle };
