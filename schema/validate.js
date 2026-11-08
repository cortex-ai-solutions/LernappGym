// Prüft alle Inhaltsdateien content/<fach>/<klasse>/<thema>.yaml gegen das Schema
// und gegen fachliche Regeln, die ein JSON-Schema nicht ausdrücken kann.
// Aufruf: node schema/validate.js [verzeichnis]   → Exit 1 bei Fehlern
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const { instanz } = require('../generator/generate');

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
ajv.addSchema(require('./content.schema.json'));
const validateThema = ajv.getSchema('lernwerk/content.schema.json');
// Dateien mit "_" am Anfang (z. B. _uebergreifend.yaml) sind keine Themen, sondern Aufgaben für Klassenarbeiten
const validateUebergreifend = ajv.compile(require('./uebergreifend.schema.json'));
const istSonderdatei = (file) => path.basename(file).startsWith('_');

function findYaml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return findYaml(p);
    return /\.ya?ml$/.test(e.name) ? [p] : [];
  });
}

// Regeln je Aufgabe; ids zählen über Arbeitsblatt- und Klassenarbeitsaufgaben eines Themas hinweg
function pruefeAufgaben(liste, ids, errors) {
  for (const a of liste) {
    const wo = `Aufgabe "${a.id}"`;
    if (ids.has(a.id)) errors.push(`${wo}: id doppelt`);
    ids.add(a.id);
    if (a.generator) {
      // Generator muss existieren und mit den Parametern eine Aufgabe erzeugen können
      try {
        instanz(a, 'validate');
      } catch (e) {
        errors.push(`${wo}: ${e.message}`);
      }
      continue;
    }
    if (a.typ === 'multiple_choice' || (a.typ === 'freitext' && a.optionen)) {
      if (!a.optionen || a.optionen.length < 2) errors.push(`${wo}: ${a.typ} braucht mindestens 2 Optionen`);
      else {
        const norm = a.optionen.map((o) => String(o).trim().toLowerCase());
        if (new Set(norm).size !== norm.length) errors.push(`${wo}: doppelte Optionen`);
        if (!norm.includes(String(a.loesung).trim().toLowerCase())) errors.push(`${wo}: Lösung steht nicht unter den Optionen`);
      }
    }
    if (a.typ === 'freitext' && a.optionen && !a.erwartung) errors.push(`${wo}: Begründungsaufgabe braucht einen Erwartungshorizont („erwartung:“)`);
    if (a.typ === 'richtig_falsch' && typeof a.loesung !== 'boolean') errors.push(`${wo}: richtig_falsch braucht loesung true/false`);
  }
}

function checkRules(doc, file) {
  const errors = [];
  const [fach, klasse, datei] = path.relative(path.join(file, '..', '..', '..'), file).split(path.sep);
  if (doc.fach !== fach) errors.push(`fach "${doc.fach}" passt nicht zum Ordner "${fach}"`);
  if (String(doc.klasse) !== klasse) errors.push(`klasse ${doc.klasse} passt nicht zum Ordner "${klasse}"`);
  if (doc.verifiziert && !doc.quelle) errors.push('verifiziert: true braucht eine quelle');
  if (istSonderdatei(file)) {
    // übergreifende Aufgaben: genannte Lernbereiche müssen als Themendatei im selben Ordner liegen
    const themen = fs.readdirSync(path.dirname(file)).filter((f) => !f.startsWith('_')).map((f) => f.replace(/\.ya?ml$/, ''));
    for (const a of doc.aufgaben) {
      for (const t of a.themen || []) if (!themen.includes(t)) errors.push(`Aufgabe "${a.id}": Lernbereich "${t}" gibt es nicht`);
    }
  } else if (doc.thema !== datei.replace(/\.ya?ml$/, '')) errors.push(`thema "${doc.thema}" passt nicht zum Dateinamen`);
  const ids = new Set();
  pruefeAufgaben(doc.aufgaben, ids, errors);
  pruefeAufgaben(doc.klassenarbeit || [], ids, errors);
  return errors;
}

function validateAll(root) {
  const files = findYaml(root);
  const report = [];
  for (const file of files) {
    let doc;
    try {
      doc = yaml.load(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      report.push({ file, errors: [`YAML-Fehler: ${e.message}`] });
      continue;
    }
    const validateSchema = istSonderdatei(file) ? validateUebergreifend : validateThema;
    const errors = validateSchema(doc)
      ? checkRules(doc, file)
      : validateSchema.errors.map((e) => `${e.instancePath || '/'} ${e.message}`);
    report.push({ file, errors });
  }
  return report;
}

if (require.main === module) {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'content'));
  const report = validateAll(root);
  let failed = 0;
  for (const { file, errors } of report) {
    const rel = path.relative(process.cwd(), file);
    if (errors.length) {
      failed++;
      console.error(`✗ ${rel}`);
      errors.forEach((e) => console.error(`    ${e}`));
    } else {
      console.log(`✓ ${rel}`);
    }
  }
  console.log(`\n${report.length} Datei(en) geprüft, ${failed} fehlerhaft.`);
  if (!report.length || failed) process.exit(1);
}

module.exports = { validateAll };
