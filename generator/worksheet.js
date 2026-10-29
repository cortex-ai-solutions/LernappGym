// Arbeitsblatt (A4, HTML + PDF) samt Lösungsblatt für ein Thema.
// npm run blatt -- --fach mathematik --klasse 5 --thema runden [--seed 42]
// npm run blatt -- --alle            (alle Themen aller Fächer)
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { instanz } = require('./generate');
const { seite } = require('./render/print');
const { htmlZuPdf, schliessen } = require('./pdf');

const ROOT = path.join(__dirname, '..');
const MIN = 6;
const MAX = 10;

function ladeThema(fach, klasse, thema) {
  return yaml.load(fs.readFileSync(path.join(ROOT, 'content', fach, String(klasse), `${thema}.yaml`), 'utf8'));
}

// 6–10 Aufgaben mit steigender Schwierigkeit. Zu wenige: Generator-Aufgaben mit neuen Zahlen wiederholen.
// Zu viele: die mit der niedrigsten Priorität (3) fallen zuerst weg.
function waehleAufgaben(doc, seed) {
  const druckbar = doc.aufgaben.filter((a) => a.nur !== 'web');
  let liste = druckbar.map((a) => instanz(a, seed)).filter((i) => i.nur !== 'web');
  for (let runde = 2; liste.length < MIN; runde++) {
    const nachschub = druckbar.filter((a) => a.generator).map((a) => instanz(a, `${seed}#${runde}`));
    if (!nachschub.length) break;
    liste = liste.concat(nachschub.slice(0, MIN - liste.length));
  }
  while (liste.length > MAX) {
    const schwaechste = liste.reduce((m, a, i) => (a.prioritaet >= liste[m].prioritaet ? i : m), 0);
    liste.splice(schwaechste, 1);
  }
  return liste
    .map((a, i) => ({ a, i }))
    .sort((x, y) => x.a.schwierigkeit - y.a.schwierigkeit || x.i - y.i)
    .map((x) => x.a);
}

async function baueBlatt({ fach, klasse, thema, seed = 'blatt' }) {
  const doc = ladeThema(fach, klasse, thema);
  const aufgaben = waehleAufgaben(doc, seed);
  const ordner = path.join(ROOT, 'output', 'blaetter', fach);
  fs.mkdirSync(ordner, { recursive: true });
  const ergebnis = {};
  for (const loesung of [false, true]) {
    const html = seite({ doc, aufgaben, art: 'blatt', loesung, seed });
    const name = `${thema}${loesung ? '_loesung' : ''}`;
    fs.writeFileSync(path.join(ordner, `${name}.html`), html);
    const { pdf, seiten } = await htmlZuPdf(html);
    fs.writeFileSync(path.join(ordner, `${name}.pdf`), pdf);
    ergebnis[loesung ? 'loesung' : 'blatt'] = { datei: path.join(ordner, `${name}.pdf`), seiten };
  }
  return { thema, aufgaben: aufgaben.length, ...ergebnis };
}

function alleThemen() {
  const liste = [];
  for (const fach of fs.readdirSync(path.join(ROOT, 'content'))) {
    for (const klasse of fs.readdirSync(path.join(ROOT, 'content', fach))) {
      for (const f of fs.readdirSync(path.join(ROOT, 'content', fach, klasse))) {
        liste.push({ fach, klasse, thema: f.replace(/\.ya?ml$/, '') });
      }
    }
  }
  return liste;
}

function arg(name, standard) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : standard;
}

if (require.main === module) {
  (async () => {
    const ziele = process.argv.includes('--alle')
      ? alleThemen()
      : [{ fach: arg('fach', 'mathematik'), klasse: arg('klasse', '5'), thema: arg('thema') }];
    if (!ziele[0].thema) throw new Error('--thema <name> oder --alle angeben');
    const seed = arg('seed', 'blatt');
    const veroeffentlichen = process.argv.includes('--veroeffentlichen');
    for (const z of ziele) {
      const r = await baueBlatt({ ...z, seed });
      console.log(`✓ ${z.fach}/${r.thema}: ${r.aufgaben} Aufgaben, Blatt ${r.blatt.seiten} S., Lösung ${r.loesung.seiten} S. → ${path.relative(process.cwd(), r.blatt.datei)}`);
      // PDFs auf die GitHub Page (docs/) legen, damit sie vom Handy aus druckbar sind
      if (veroeffentlichen) {
        const ziel = path.join(ROOT, 'docs', 'blaetter', z.fach);
        fs.mkdirSync(ziel, { recursive: true });
        for (const d of [r.blatt.datei, r.loesung.datei]) fs.copyFileSync(d, path.join(ziel, path.basename(d)));
      }
    }
    await schliessen();
  })().catch(async (e) => {
    console.error(`✗ ${e.message}`);
    await schliessen();
    process.exit(1);
  });
}

module.exports = { baueBlatt, waehleAufgaben, ladeThema, alleThemen };
