// Zahlen schreiben wie in der Schule: Dreiergruppen mit schmalem Leerzeichen, Zahlwörter nach
// deutscher Rechtschreibung (unter einer Million zusammen, Million/Milliarde/Billion getrennt).
const GRUPPE = ' '; // schmales geschütztes Leerzeichen: 34 761

// Kommazahlen mit Dezimalkomma: 3.45 → "3,45". Generatoren rechnen intern mit ganzen Zahlen
// (z. B. Gramm statt Kilogramm) und teilen erst am Ende durch 10^k, damit keine Rundungsfehler entstehen.
function fmt(n) {
  const [ganz, dez] = String(n).split('.');
  const g = ganz.replace(/\B(?=(\d{3})+(?!\d))/g, GRUPPE);
  return dez === undefined ? g : `${g},${dez}`;
}

const EINER = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const ZEHNER = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

// 1–99; alleinstehend am Ende "eins", sonst "ein" (einundzwanzig, eintausend, hunderteins)
function bis99(n, amEnde) {
  if (n === 0) return '';
  if (n === 1) return amEnde ? 'eins' : 'ein';
  if (n < 20) return EINER[n];
  const e = n % 10;
  const z = ZEHNER[Math.floor(n / 10)];
  return e === 0 ? z : `${e === 1 ? 'ein' : EINER[e]}und${z}`;
}

function bis999(n, amEnde) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hundert = h === 0 ? '' : `${h === 1 ? 'ein' : EINER[h]}hundert`;
  return hundert + bis99(rest, amEnde);
}

const GROSS = [
  [1e12, 'Billion', 'Billionen'],
  [1e9, 'Milliarde', 'Milliarden'],
  [1e6, 'Million', 'Millionen'],
];

// Zahlwort für 0 ≤ n ≤ 10^12. Blöcke wie 101 Millionen ("hunderteine Million") sind
// sprachlich uneinheitlich und werden abgelehnt; Generatoren ziehen dann neu.
function zahlwort(n) {
  if (!Number.isInteger(n) || n < 0 || n > 1e12) throw new RangeError(`zahlwort: ${n} außerhalb 0–10^12`);
  if (n === 0) return 'null';
  const teile = [];
  let rest = n;
  for (const [wert, einzahl, mehrzahl] of GROSS) {
    const block = Math.floor(rest / wert);
    rest %= wert;
    if (block === 0) continue;
    if (block === 1) teile.push(`eine ${einzahl}`);
    else if (block % 100 === 1) throw new RangeError(`zahlwort: ${block} ${mehrzahl} ist mehrdeutig`);
    else teile.push(`${bis999(block, false)} ${mehrzahl}`);
  }
  const tausender = Math.floor(rest / 1000);
  const einer = rest % 1000;
  const klein = (tausender ? `${bis999(tausender, false)}tausend` : '') + (einer ? bis999(einer, true) : '');
  if (klein) teile.push(klein);
  return teile.join(' ');
}

const STELLEN = {
  einer: 0, zehner: 1, hunderter: 2, tausender: 3, zehntausender: 4, hunderttausender: 5,
  millionen: 6, zehnmillionen: 7, hundertmillionen: 8, milliarden: 9,
};
const STELLEN_NAME = {
  einer: 'Einer', zehner: 'Zehner', hunderter: 'Hunderter', tausender: 'Tausender',
  zehntausender: 'Zehntausender', hunderttausender: 'Hunderttausender', millionen: 'Millionen',
  zehnmillionen: 'Zehnmillionen', hundertmillionen: 'Hundertmillionen', milliarden: 'Milliarden',
};

// kaufmännisches Runden natürlicher Zahlen auf 10^k
function runden(n, stelle) {
  const k = STELLEN[stelle];
  if (k === undefined) throw new Error(`runden: unbekannte Stelle "${stelle}"`);
  const f = 10 ** k;
  return Math.floor((n + f / 2) / f) * f;
}

// Eingaben tolerant lesen: "34 761", "34.761", "34761" → 34761; "3,45" → 3.45.
// Ein Punkt gilt als Tausenderpunkt, außer punktIstKomma ist gesetzt (erwartete Lösung ist eine Kommazahl):
// dann ist "3.45" dasselbe wie "3,45", weil manche Handy-Tastaturen nur einen Punkt anbieten.
function parseZahl(s, punktIstKomma = false) {
  let t = String(s).replace(/[\s  ]/g, '');
  if (punktIstKomma && !t.includes(',') && (t.match(/\./g) || []).length === 1) t = t.replace('.', ',');
  t = t.replace(/\./g, '');
  return /^(\d+,?\d*|,\d+)$/.test(t) ? Number(t.replace(',', '.')) : NaN;
}

// gleiche Zahl? Eingabe und Generator-Lösung können bei Kommazahlen im letzten Bit abweichen
const gleich = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

module.exports = { fmt, zahlwort, runden, parseZahl, gleich, STELLEN, STELLEN_NAME, GRUPPE };
