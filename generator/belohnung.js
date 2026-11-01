// Belohnungscode auf dem Lösungsblatt: Hat das Kind auf dem Papier volle Punktzahl, geben die Eltern den Code weiter.
// Im Katzenalbum eingetippt, schaltet er das Gold-Bild des Themas frei (templates/katze.js).
// Der Code hängt an Fach, Thema, Variante und Inhalt des Blatts: Ändert sich das Blatt, ändert sich auch der Code.
// Die App kennt nur Prüfsummen der Codes, keine Klartexte.
const crypto = require('crypto');

const ZEICHEN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O und 1/I, die man leicht verwechselt

function belohnungscode({ fach, thema, variante, aufgaben }) {
  const h = crypto.createHash('sha256').update(`${fach}/${thema}/${variante}/${JSON.stringify(aufgaben)}`).digest();
  let s = '';
  for (let i = 0; i < 4; i++) s += ZEICHEN[h[i] % ZEICHEN.length];
  return `MIAU-${s}`;
}

// gleiche Normalisierung und Prüfsumme (FNV-1a) wie in templates/katze.js
function normCode(c) { return String(c).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^MIAU/, ''); }
function pruefsumme(c) {
  let h = 0x811c9dc5;
  for (const z of normCode(c)) { h ^= z.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

module.exports = { belohnungscode, pruefsumme, normCode, ZEICHEN };
