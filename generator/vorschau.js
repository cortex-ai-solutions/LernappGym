// Zeigt die Aufgaben eines Themas mit Lösungen im Terminal.
// npm run vorschau -- --fach mathematik --klasse 5 --thema runden [--seed 42]
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { erzeugeThema } = require('./generate');

function arg(name, standard) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : standard;
}

const fach = arg('fach', 'mathematik');
const klasse = arg('klasse', '5');
const thema = arg('thema');
const seed = arg('seed', String(Date.now() % 100000));
const ordner = path.join(__dirname, '..', 'content', fach, klasse);

if (!thema) {
  console.log(`Themen in ${fach}/${klasse}: ${fs.readdirSync(ordner).map((f) => f.replace(/\.ya?ml$/, '')).join(', ')}`);
  console.log('Aufruf: npm run vorschau -- --thema <thema> [--seed 42]');
  process.exit(0);
}

const doc = yaml.load(fs.readFileSync(path.join(ordner, `${thema}.yaml`), 'utf8'));
console.log(`\n${doc.titel}  (Seed ${seed})\n`);
erzeugeThema(doc, seed).forEach((a, i) => {
  console.log(`Aufgabe ${i + 1} [${a.be} BE, Stufe ${a.schwierigkeit}${a.nur ? `, nur ${a.nur}` : ''}]: ${a.anweisung}`);
  for (const t of a.teile) {
    const opt = t.optionen ? `   (${t.optionen.join(' | ')})` : '';
    console.log(`   ${t.label ? `${t.label} ` : ''}${t.text}${opt}\n      ✓ ${t.antwort}`);
  }
  if (a.weg) console.log(`   Weg: ${a.weg}\n   Antwort: ${a.antwortsatz}`);
  console.log();
});
