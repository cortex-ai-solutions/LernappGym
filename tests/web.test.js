// Webapp im Handy-Format: jede Lektion komplett durchspielen, Lernstand prüfen, danach offline neu laden.
// Voraussetzung: npm run web (docs/ ist gebaut).
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DOCS = path.join(__dirname, '..', 'docs');
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };

// statischer Server unter /LernappGym/ wie bei GitHub Pages; s.swZusatz hängt Text an sw.js (simuliert ein Deploy)
function server() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/LernappGym/, '');
      if (p.endsWith('/')) p += 'index.html';
      const datei = path.join(DOCS, p);
      if (!datei.startsWith(DOCS) || !fs.existsSync(datei)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
      if (p === '/sw.js' && s.swZusatz) return res.end(fs.readFileSync(datei, 'utf8') + s.swZusatz);
      fs.createReadStream(datei).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
}

async function beantworte(page, richtig) {
  const t = await page.evaluate(() => window.LERNWERK_TEST.loesung());
  if (t.eingabe === 'paare') {
    for (const [l, r] of t.paare) {
      await page.click(`.paare [data-seite="l"][data-wert="${l}"]`);
      await page.click(`.paare [data-seite="r"][data-wert="${r}"]`);
    }
    return;
  }
  if (t.eingabe === 'felder') {
    const felder = await page.$$('.felder input');
    for (let i = 0; i < felder.length; i++) await felder[i].fill(richtig ? String(t.loesung[i]) : '999');
  } else if (t.eingabe === 'zahl' || t.eingabe === 'wort') {
    // Kommazahlen so eintippen, wie ein Kind es tut: mit Komma
    await page.fill('#antwort', richtig ? String(t.loesung).replace('.', ',') : '999999999');
  } else {
    const wert = t.eingabe === 'richtig_falsch' ? (t.loesung ? 'richtig' : 'falsch') : t.loesung; // die richtige Option
    if (richtig) await page.click(`.optionen [data-wert="${String(wert).replace(/"/g, '\\"')}"]`);
    else await page.click(`.optionen .option:not([data-wert="${String(wert).replace(/"/g, '\\"')}"])`);
  }
  await page.click('#pruefen');
}

test('Webapp: alle Mathe-Themen durchspielen, offline nutzbar', { timeout: 180000 }, async () => {
  const s = await server();
  const basis = `http://127.0.0.1:${s.address().port}/LernappGym/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE' });
  const page = await context.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
  try {
    await page.goto(basis);
    await page.click('a[href="mathe/"]');
    await page.waitForSelector('.thema');
    const themen = await page.$$eval('.thema', (els) => els.map((e) => e.dataset.thema));
    assert.ok(themen.length >= 8, `${themen.length} Themen`);
    assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth), 393, 'kein seitliches Scrollen');

    for (const thema of themen) {
      // Blatt-Vorrat: ↻ schaltet A → B → … → A, Blatt und Lösung passen zusammen, alle PDFs vorhanden
      const druckLinks = () => page.$$eval(`[data-thema="${thema}"] .reihe-druck a`, (as) => as.map((a) => [a.getAttribute('href'), a.textContent]));
      const gesehen = [];
      for (let i = 0; i < 6; i++) {
        const [[blatt, blattText], [loesung, loesungText]] = await druckLinks();
        const v = blattText.slice(-1);
        assert.strictEqual(loesungText.slice(-1), v, `${thema}: Lösung passt nicht zum Blatt`);
        assert.strictEqual(loesung, blatt.replace('.pdf', '_loesung.pdf'));
        for (const href of [blatt, loesung]) assert.ok(fs.existsSync(path.join(DOCS, 'mathe', href)), `${thema}: ${href} fehlt`);
        gesehen.push(v);
        await page.click(`[data-thema="${thema}"] [data-aktion="neues-blatt"]`);
      }
      assert.strictEqual(gesehen.join(''), 'ABCDEA', `${thema}: Reihenfolge der Varianten`);
      await page.click(`[data-thema="${thema}"] [data-aktion="ueben"]`);
      let n = 0;
      while (await page.$('.lektion')) {
        await page.waitForSelector('.uebung');
        const breite = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(breite <= 393, `${thema}, Übung ${n + 1}: Seite ${breite} px breit (ragt über den Rand)`);
        // bei der zweiten Übung einmal falsch antworten: Herz weg, Lösung wird gezeigt
        const falsch = n === 1;
        await beantworte(page, !falsch);
        await page.waitForSelector('#weiter');
        const klasse = await page.getAttribute('#leiste', 'class');
        const t = await page.evaluate(() => window.LERNWERK_TEST.loesung());
        if (t.eingabe !== 'paare') assert.match(klasse, falsch ? /fehler/ : /ok/, `${thema}, Übung ${n + 1} (${t.eingabe}): ${t.text}`);
        await page.click('#weiter');
        n++;
        assert.ok(n < 40, 'Lektion endet nicht');
      }
      await page.waitForSelector('.ende');
      assert.match(await page.textContent('.ende h1'), /Geschafft/, `${thema}: Lektion nicht geschafft`);
      await page.click('#uebersicht');
      await page.waitForSelector('.thema');
    }
    const stand = await page.evaluate(() => JSON.parse(localStorage.getItem('lernwerk_v1')));
    assert.ok(stand.xp > 0 && stand.streak.tage === 1, 'XP und Streak gespeichert');
    for (const thema of themen) assert.strictEqual(stand.themen[`mathematik/${thema}`].lektionen, 1);
    // gewählte Variante bleibt gespeichert (nach 6× 🔄 wieder bei B)
    await page.reload();
    await page.waitForSelector('.thema');
    assert.match(await page.textContent(`[data-thema="${themen[0]}"] [data-rolle="blatt"]`), /Blatt B$/);

    // offline: Service Worker muss alles gecacht haben
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 }).catch(() => page.reload());
    await context.setOffline(true);
    await page.goto(`${basis}mathe/`);
    await page.waitForSelector('.thema');
    await page.goto(basis);
    await page.waitForSelector('a[href="latein/"]');
    const pdf = await page.evaluate(async (u) => (await fetch(u)).status, `${basis}blaetter/mathematik/runden_A.pdf`);
    assert.strictEqual(pdf, 200, 'PDF offline verfügbar');
    assert.deepStrictEqual(fehler, [], 'keine JavaScript-Fehler');
  } finally {
    await browser.close();
    s.close();
  }
});

test('Webapp: neue Version wird per Banner angeboten und nach Tippen geladen', { timeout: 60000 }, async () => {
  const s = await server();
  const basis = `http://127.0.0.1:${s.address().port}/LernappGym/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    for (const seite of ['', 'mathe/', 'latein/', 'geschichte/']) {
      await page.goto(basis + seite);
      await page.evaluate(() => navigator.serviceWorker.ready);
      assert.ok(await page.$('#update-banner[hidden]'), `${seite || 'Start'}: Banner fehlt oder ist beim ersten Besuch sichtbar`);
    }
    await page.goto(`${basis}mathe/`);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    s.swZusatz = '\n// Deploy-Simulation\n';
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
    await page.waitForSelector('#update-banner:not([hidden])', { timeout: 20000 });
    await Promise.all([page.waitForEvent('load'), page.click('#update-banner')]);
    await page.waitForSelector('.thema');
    await page.waitForFunction(() => navigator.serviceWorker.getRegistration().then((r) => !r.waiting));
    assert.ok(await page.$('#update-banner[hidden]'), 'nach dem Aktualisieren kein Banner mehr');
  } finally {
    await browser.close();
    s.close();
  }
});
