// HTML → PDF mit headless Chromium (Playwright). Ein Browser wird für alle Seiten eines Laufs geteilt.
const { chromium } = require('playwright');

let browserPromise;
function browser() {
  browserPromise ??= chromium.launch();
  return browserPromise;
}

async function schliessen() {
  if (browserPromise) (await browserPromise).close();
  browserPromise = undefined;
}

const FUSS = `<div style="width:100%;font-family:Arial,sans-serif;font-size:7.5pt;color:#555;padding:0 15mm;display:flex;justify-content:space-between">
  <span>LERNWERK · eigene Übungen, keine Schulbuchtexte</span><span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span></div>`;

// Seitenzahl direkt aus dem PDF lesen (jedes Seitenobjekt hat /Type /Page)
function seitenzahl(pdf) {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}

async function htmlZuPdf(html) {
  const page = await (await browser()).newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: FUSS });
    return { pdf, seiten: seitenzahl(pdf) };
  } finally {
    await page.close();
  }
}

// Höhe des Inhalts in mm bei A4-Satzbreite (180 mm) – für die 1-Seiten-Prüfung des Tests
async function inhaltshoeheMm(html) {
  const page = await (await browser()).newPage({ viewport: { width: 680, height: 1000 } });
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    return await page.evaluate(() => {
      const mm = document.createElement('div');
      mm.style.height = '100mm';
      document.body.appendChild(mm);
      const pxProMm = mm.getBoundingClientRect().height / 100;
      mm.remove();
      document.body.style.width = '180mm';
      return document.body.scrollHeight / pxProMm;
    });
  } finally {
    await page.close();
  }
}

module.exports = { htmlZuPdf, inhaltshoeheMm, seitenzahl, schliessen };
