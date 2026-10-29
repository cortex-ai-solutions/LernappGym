// Schwarz-Weiß-taugliche SVG-Grafiken für den Druck: Diagramme, Strichlisten, Kästchenraster.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Säulen- oder Balkendiagramm; 1 Einheit = 1 Kästchen (5 mm)
function diagramm({ titel, kategorien, werte, art }, { breiteMm = 150 } = {}) {
  const max = Math.max(...werte);
  const top = Math.ceil((max + 1) / 2) * 2; // gerade Achsenhöhe, etwas Luft
  const E = 4; // mm pro Einheit
  const n = kategorien.length;
  if (art === 'balken') {
    const labelB = 32;
    const zeile = 8;
    const b = labelB + top * E + 6;
    const h = n * zeile + 16;
    const x0 = labelB;
    const y0 = 4;
    const raster = Array.from({ length: top + 1 }, (_, i) =>
      `<line x1="${x0 + i * E}" y1="${y0}" x2="${x0 + i * E}" y2="${y0 + n * zeile}" stroke="#bbb" stroke-width="0.2"/>` +
      (i % 2 === 0 ? `<text x="${x0 + i * E}" y="${y0 + n * zeile + 4.5}" font-size="3.2" text-anchor="middle">${i}</text>` : ''),
    ).join('');
    const balken = kategorien.map((k, i) => {
      const y = y0 + i * zeile + 2;
      return `<text x="${x0 - 2}" y="${y + 3.8}" font-size="3.4" text-anchor="end">${esc(k)}</text>` +
        `<rect x="${x0}" y="${y}" width="${werte[i] * E}" height="5" fill="#9a9a9a" stroke="#000" stroke-width="0.35"/>`;
    }).join('');
    return `<svg class="grafik" viewBox="0 0 ${b} ${h}" width="${Math.min(breiteMm, b)}mm" role="img" aria-label="${esc(titel)}">
      <g font-family="Inter, sans-serif">${raster}${balken}
      <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + n * zeile}" stroke="#000" stroke-width="0.5"/>
      <line x1="${x0}" y1="${y0 + n * zeile}" x2="${x0 + top * E + 3}" y2="${y0 + n * zeile}" stroke="#000" stroke-width="0.5"/>
      <text x="${x0 + (top * E) / 2}" y="${h - 1}" font-size="3.2" text-anchor="middle">Anzahl</text></g></svg>`;
  }
  const spalte = 23;
  const x0 = 12;
  const y0 = 8;
  const b = x0 + n * spalte + 4;
  const h = y0 + top * E + 12;
  const yBasis = y0 + top * E;
  const raster = Array.from({ length: top + 1 }, (_, i) =>
    `<line x1="${x0}" y1="${yBasis - i * E}" x2="${x0 + n * spalte}" y2="${yBasis - i * E}" stroke="#bbb" stroke-width="0.2"/>` +
    (i % 2 === 0 ? `<text x="${x0 - 2}" y="${yBasis - i * E + 1.2}" font-size="3.2" text-anchor="end">${i}</text>` : ''),
  ).join('');
  const saeulen = kategorien.map((k, i) => {
    const x = x0 + i * spalte + 6.5;
    return `<rect x="${x}" y="${yBasis - werte[i] * E}" width="10" height="${werte[i] * E}" fill="#9a9a9a" stroke="#000" stroke-width="0.35"/>` +
      `<text x="${x + 5}" y="${yBasis + 4.5}" font-size="3.2" text-anchor="middle">${esc(k)}</text>`;
  }).join('');
  return `<svg class="grafik" viewBox="0 0 ${b} ${h}" width="${Math.min(breiteMm, b)}mm" role="img" aria-label="${esc(titel)}">
    <g font-family="Inter, sans-serif">${raster}${saeulen}
    <line x1="${x0}" y1="${y0 - 2}" x2="${x0}" y2="${yBasis}" stroke="#000" stroke-width="0.5"/>
    <line x1="${x0}" y1="${yBasis}" x2="${x0 + n * spalte + 2}" y2="${yBasis}" stroke="#000" stroke-width="0.5"/>
    <text x="${x0 + 2}" y="${y0 - 3}" font-size="3.2">Anzahl</text></g></svg>`;
}

// Strichliste: Fünferbündel (vier Striche, der fünfte quer)
function striche(anzahl) {
  const parts = [];
  let x = 1;
  for (let rest = anzahl; rest > 0; rest -= 5) {
    const k = Math.min(5, rest);
    for (let i = 0; i < Math.min(4, k); i++) parts.push(`<line x1="${x + i * 1.6}" y1="0.6" x2="${x + i * 1.6}" y2="5.4" stroke="#000" stroke-width="0.4"/>`);
    if (k === 5) parts.push(`<line x1="${x - 0.7}" y1="4.8" x2="${x + 3 * 1.6 + 0.7}" y2="1.2" stroke="#000" stroke-width="0.4"/>`);
    x += 8.5;
  }
  const breite = Math.max(10, x);
  return `<svg viewBox="0 0 ${breite} 6" width="${breite}mm" height="6mm" aria-label="${anzahl} Striche">${parts.join('')}</svg>`;
}

// leeres Kästchenraster zum Zeichnen/Rechnen (echte Linien – CSS-Verläufe gehen im PDF verloren)
function raster(spalten, zeilen) {
  const w = spalten * 5;
  const h = zeilen * 5;
  const linien = [];
  for (let x = 0; x <= w; x += 5) linien.push(`M${x} 0V${h}`);
  for (let y = 0; y <= h; y += 5) linien.push(`M0 ${y}H${w}`);
  return `<svg class="raster" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" aria-hidden="true"><path d="${linien.join('')}" stroke="#bdbdbd" stroke-width="0.18" fill="none"/></svg>`;
}

module.exports = { diagramm, striche, raster, esc };
