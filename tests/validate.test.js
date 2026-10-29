const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { validateAll } = require('../schema/validate');

test('alle Inhaltsdateien sind gültig', () => {
  const report = validateAll(path.join(__dirname, '..', 'content'));
  assert.ok(report.length > 0, 'keine Inhaltsdateien gefunden');
  for (const { file, errors } of report) assert.deepStrictEqual(errors, [], file);
});

test('Validator erkennt fehlerhafte Inhalte', () => {
  const report = validateAll(path.join(__dirname, 'fixtures', 'content'));
  const errors = report.flatMap((r) => r.errors).join('\n');
  assert.match(errors, /Lösung steht nicht unter den Optionen/);
  assert.match(errors, /doppelte Optionen/);
  assert.match(errors, /id doppelt/);
  assert.match(errors, /verifiziert: true braucht eine quelle/);
});
