// Klassenarbeit + Lösung als PDF (für Tests und zum lokalen Drucken). In der Webapp entsteht dieselbe Arbeit im Browser.
// npm run klassenarbeit -- --themen runden,zeit,kommazahlen [--seed 42] [--fach mathematik --klasse 5]
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { stelleZusammen } = require('./klassenarbeit');
const { klassenarbeitKoerper } = require('./render/klassenarbeit');
const { fontFaceCss } = require('./render/fonts');
const { htmlZuPdf, schliessen } = require('./pdf');

const ROOT = path.join(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'templates', 'print.css'), 'utf8');

// Themen mit Klassenarbeitsaufgaben und die übergreifenden Aufgaben eines Fachs/einer Klasse
function ladeInhalte(fach = 'mathematik', klasse = '5') {
  const ordner = path.join(ROOT, 'content', fach, String(klasse));
  const themen = [];
  let uebergreifend = [];
  for (const f of fs.readdirSync(ordner)) {
    const doc = yaml.load(fs.readFileSync(path.join(ordner, f), 'utf8'));
    if (f.startsWith('_')) uebergreifend = uebergreifend.concat(doc.aufgaben);
    else if (doc.klassenarbeit && doc.klassenarbeit.length) themen.push({ thema: doc.thema, titel: doc.titel, reihenfolge: doc.reihenfolge || 99, klassenarbeit: doc.klassenarbeit });
  }
  return { themen: themen.sort((a, b) => a.reihenfolge - b.reihenfolge), uebergreifend };
}

function htmlDokument(koerper, { titel, loesung }) {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${titel}</title>
<style>${fontFaceCss()}\n${CSS}</style></head><body class="${loesung ? 'loesung' : ''}">${koerper}</body></html>`;
}

function klassenarbeitHtml({ themen: auswahl, seed, fach = 'mathematik', klasse = '5' }) {
  const inhalte = ladeInhalte(fach, klasse);
  const themen = auswahl.map((id) => {
    const t = inhalte.themen.find((x) => x.thema === id);
    if (!t) throw new Error(`Lernbereich "${id}" gibt es nicht (vorhanden: ${inhalte.themen.map((x) => x.thema).join(', ')})`);
    return t;
  });
  const ka = stelleZusammen({ themen, uebergreifend: inhalte.uebergreifend, seed });
  return {
    ka,
    arbeit: htmlDokument(klassenarbeitKoerper(ka, { fach, klasse }), { titel: 'Klassenarbeit', loesung: false }),
    loesung: htmlDokument(klassenarbeitKoerper(ka, { loesung: true, fach, klasse }), { titel: 'Klassenarbeit – Lösung', loesung: true }),
  };
}

async function baueKlassenarbeit(optionen) {
  const { ka, arbeit, loesung } = klassenarbeitHtml(optionen);
  const ordner = path.join(ROOT, 'output', 'klassenarbeiten');
  fs.mkdirSync(ordner, { recursive: true });
  const name = `klassenarbeit_${optionen.seed}`;
  const ergebnis = { ka };
  for (const [art, html] of [['arbeit', arbeit], ['loesung', loesung]]) {
    const datei = path.join(ordner, `${name}${art === 'loesung' ? '_loesung' : ''}.pdf`);
    fs.writeFileSync(datei.replace(/\.pdf$/, '.html'), html);
    const { pdf, seiten } = await htmlZuPdf(html);
    fs.writeFileSync(datei, pdf);
    ergebnis[art] = { datei, seiten };
  }
  return ergebnis;
}

function arg(name, standard) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : standard;
}

if (require.main === module) {
  (async () => {
    const themen = (arg('themen') || '').split(',').filter(Boolean);
    if (!themen.length) throw new Error('--themen thema1,thema2 angeben');
    const r = await baueKlassenarbeit({ themen, seed: arg('seed', String(Date.now() % 100000)), fach: arg('fach', 'mathematik'), klasse: arg('klasse', '5') });
    console.log(`✓ Klassenarbeit ${r.ka.seed}: ${r.ka.aufgaben.length} Aufgaben, ${r.ka.gesamtBe} BE (AFB ${r.ka.afb.join('/')}), Arbeit ${r.arbeit.seiten} S., Lösung ${r.loesung.seiten} S. → ${path.relative(process.cwd(), r.arbeit.datei)}`);
    await schliessen();
  })().catch(async (e) => {
    console.error(`✗ ${e.message}`);
    await schliessen();
    process.exit(1);
  });
}

module.exports = { ladeInhalte, klassenarbeitHtml, baueKlassenarbeit };
