// Webapp im Handy-Format: jede Lektion komplett durchspielen, Lernstand prüfen, danach offline neu laden.
// Voraussetzung: npm run web (docs/ ist gebaut).
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { belohnungscode } = require('../generator/belohnung');
const { ladeThema, waehleAufgaben } = require('../generator/worksheet');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
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

async function gibNamen(page, name) {
  await page.waitForSelector('#lw-name');
  await page.fill('#lw-name', name);
  await page.click('.lw-dialog [type="submit"]');
  await page.waitForSelector('#lw-name', { state: 'detached' });
}

// Nach dem Namen stellt sich die Lernkatze vor (Kleiderschrank, Name ist Pflicht)
async function gibKatze(page, name) {
  await page.waitForSelector('#kz-name');
  await page.click('.kz-schrank [type="submit"]');
  assert.ok(await page.$('#kz-name'), 'Kleiderschrank schließt nicht ohne Namen');
  await page.fill('#kz-name', name);
  await page.click('.kz-schrank [type="submit"]');
  await page.waitForSelector('.lw-schleier', { state: 'detached' });
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
    await gibNamen(page, 'Testkind');
    await gibKatze(page, 'Mimi');
    assert.match(await page.textContent('#katze-karte'), /Mimi/, 'Startseite zeigt die Katze');
    await page.click('a[href="mathe/"]');
    await page.waitForSelector('.thema');
    assert.strictEqual(await page.$('.lw-schleier'), null, 'Katze wird nur einmal vorgestellt');
    // Kleiderschrank: Fell und Decke wählen, bleibt gespeichert
    await page.click('#katze-karte button');
    await page.click('.kz-knopf[data-feld="fell"][data-wert="rot"]');
    await page.click('.kz-knopf[data-feld="decke"][data-wert="rosa"]');
    await page.click('.kz-knopf[data-feld="kopf"][data-wert="schleife"]');
    assert.ok(await page.$('.kz-knopf[data-feld="kopf"][data-wert="krone"][disabled]'), 'Krone ist am Anfang gesperrt');
    await page.click('.kz-schrank [type="submit"]');
    await page.waitForSelector('.lw-schleier', { state: 'detached' });
    assert.deepStrictEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('lernwerk_katze_v1'))),
      { name: 'Mimi', fell: 'rot', augen: 'gelbgruen', decke: 'rosa', kopf: 'schleife', hals: 'aus' });
    assert.ok(await page.$('#katze-karte svg.katze path[fill="#f6c9d3"]'), 'rosa Decke wird gezeichnet');
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
        assert.ok(await page.$('#leiste .katze-sagt svg.katze'), `${thema}, Übung ${n + 1}: Katze fehlt in der Leiste`);
        const weiter = await page.evaluate(() => document.getElementById('weiter').getBoundingClientRect().toJSON());
        assert.ok(weiter.bottom <= 851, `${thema}, Übung ${n + 1}: „Weiter“ ragt aus dem Bildschirm`);
        assert.ok(weiter.left >= 16 && weiter.right <= 393 - 16, `${thema}, Übung ${n + 1}: Leiste ohne Rand (${weiter.left}–${weiter.right})`);
        await page.click('#weiter');
        n++;
        assert.ok(n < 40, 'Lektion endet nicht');
      }
      await page.waitForSelector('.ende');
      assert.match(await page.textContent('.ende h1'), /Geschafft/, `${thema}: Lektion nicht geschafft`);
      assert.ok(await page.$('.ende-katze svg.katze'), `${thema}: Katze fehlt auf dem Abschluss-Bildschirm`);
      assert.ok(await page.$('.kz-neu-karte .kz-platz'), `${thema}: erstes Schaffen schaltet kein Album-Bild frei`);
      await page.click('#uebersicht');
      await page.waitForSelector('.thema');
    }
    const stand = await page.evaluate(() => JSON.parse(localStorage.getItem('lernwerk_v1')));
    assert.ok(stand.xp > 0 && stand.streak.tage === 1, 'XP und Streak gespeichert');
    for (const thema of themen) assert.strictEqual(stand.themen[`mathematik/${thema}`].lektionen, 1);
    // Katzenalbum: Bilder der geschafften Themen sind neu, Belohnungscode vom Lösungsblatt schaltet Gold und Krone frei
    // je Thema „geschafft“, bei Themen ohne Fehler (z. B. nur Zuordnungen) zusätzlich „3 Sterne“ und dann einmal der Ringelschal
    const neuZahl = Number((await page.textContent('#katze-karte [data-kz="album"]')).match(/(\d+) neu/)[1]);
    const dreiSterne = Object.values(stand.themen).filter((t) => t.sterne === 3).length;
    assert.strictEqual(neuZahl, themen.length + dreiSterne + (dreiSterne ? 1 : 0));
    await page.click('#katze-karte [data-kz="album"]');
    await page.waitForSelector('.kz-album-dialog');
    assert.strictEqual((await page.$$('.kz-album-dialog .kz-platz.neu')).length, neuZahl);
    await page.fill('#kz-code', 'MIAU-ZZZZ');
    await page.click('.kz-code [type="submit"]');
    assert.match(await page.textContent('.kz-meldung'), /kenne ich nicht/);
    const loesung = fs.readFileSync(path.join(ROOT, 'output', 'blaetter', 'mathematik', 'runden_A_loesung.html'), 'utf8');
    const code = loesung.match(/MIAU-[A-Z0-9]{4}/)[0];
    assert.strictEqual(code, belohnungscode({ fach: 'mathematik', thema: 'runden', variante: 'A', aufgaben: waehleAufgaben(ladeThema('mathematik', 5, 'runden'), 'A') }));
    await page.fill('#kz-code', code.toLowerCase());
    await page.click('.kz-code [type="submit"]');
    assert.match(await page.textContent('.kz-meldung'), /Gold-Bild/);
    assert.ok(await page.$('.kz-platz[data-id="motiv:mathematik/runden:gold"]:not(.zu)'), 'Gold-Bild Runden');
    assert.ok(await page.$('.kz-platz[data-id="kopf:krone"]:not(.zu)'), 'Krone im Album');
    await page.click('#kz-zu');
    assert.doesNotMatch(await page.textContent('#katze-karte [data-kz="album"]'), /neu/, 'nach dem Anschauen nichts mehr neu');
    await page.click('#katze-karte [data-kz="anpassen"]');
    await page.click('.kz-knopf[data-feld="kopf"][data-wert="krone"]');
    await page.click('.kz-schrank [type="submit"]');
    assert.ok(await page.$('#katze-karte svg.katze path[fill="#E8C97D"]'), 'Katze trägt die Krone');

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

test('Elternbericht: Kind übt Mathe, Latein, Geschichte → Link → Elternansicht auf anderem Gerät', { timeout: 120000 }, async () => {
  const s = await server();
  const basis = `http://127.0.0.1:${s.address().port}/LernappGym/`;
  const browser = await chromium.launch();
  const handy = { viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, locale: 'de-DE' };
  const kind = await browser.newContext(handy);
  // ohne Teilen-Menü, damit der Link-Dialog erscheint (wie am PC)
  await kind.addInitScript(() => { delete Navigator.prototype.share; });
  const page = await kind.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  try {
    // Name wird auch in einer Bestands-App abgefragt, wenn sie zuerst geöffnet wird
    await page.goto(`${basis}latein/`);
    await gibNamen(page, 'Lena');

    // Latein: Vokabelkarten der 1. Einheit, die erste „Noch nicht“, der Rest „Gewusst“
    await page.evaluate(() => { openLesson(1, '1a'); startExercises(); });
    for (let i = 0; !(await page.$('#results.active')); i++) {
      await page.click('#fc');
      await page.click(i === 0 ? '.btn-didnt' : '.btn-knew');
      assert.ok(i < 20, 'Latein-Lektion endet nicht');
    }

    // Geschichte: Quiz der 1. Lektion, immer die erste Antwort
    await page.goto(`${basis}geschichte/`);
    await page.click('text=Was ist Geschichte?');
    await page.click('.tab-btn:has-text("Quiz")');
    while (await page.$('.opt')) {
      await page.click('.opt');
      await page.click('.next-btn');
    }
    await page.waitForSelector('.quiz-result');
    await page.evaluate(() => render()); // neu zeichnen darf nicht doppelt zählen

    // Mathe: eine Runde Runden mit lauter richtigen Antworten
    await page.goto(`${basis}mathe/`);
    await gibKatze(page, 'Maurice');
    await page.click('[data-thema="runden"] [data-aktion="ueben"]');
    while (await page.$('.lektion')) {
      await page.waitForSelector('.uebung');
      await beantworte(page, true);
      await page.click('#weiter');
    }
    await page.waitForSelector('.ende');
    await page.click('#uebersicht');

    const p = await page.evaluate(() => JSON.parse(localStorage.getItem('lernwerk_protokoll_v1')));
    assert.strictEqual(p.faecher.latein.th.e1.n, 1);
    assert.strictEqual(p.faecher.latein.th.e1.r, 4, 'Latein: 4 von 5 gewusst');
    assert.strictEqual(p.faecher.geschichte.th.l1.n, 1, 'Geschichte nur einmal gezählt');
    assert.strictEqual(p.faecher.mathematik.th.runden.r, p.faecher.mathematik.th.runden.g, 'Mathe: alles richtig');

    // Bericht senden → Link-Dialog
    await page.click('[data-aktion="bericht"]');
    await page.waitForSelector('#lw-link');
    const link = await page.inputValue('#lw-link');
    assert.match(link, /\/LernappGym\/eltern\/#b=z/);
    assert.ok(link.length < 8000, `Link ${link.length} Zeichen lang`);

    // Eltern-Handy: eigener Speicher, öffnet den Link
    const eltern = await browser.newContext(handy);
    const ep = await eltern.newPage();
    ep.on('pageerror', (e) => fehler.push(e.message));
    await ep.goto(link);
    await ep.waitForSelector('.kind');
    assert.match(await ep.textContent('.wrap'), /Neuer Bericht von Lena gespeichert/);
    const text = await ep.textContent('.wrap');
    for (const erwartet of ['Lena', 'Mathematik', 'Natürliche Zahlen runden', '100 % richtig', 'Latein', 'Roma', '80 % richtig', 'Geschichte', 'Was ist Geschichte?']) {
      assert.ok(text.includes(erwartet), `Elternansicht: „${erwartet}“ fehlt`);
    }
    // Fehlerschwerpunkt Latein: die nicht gewusste Vokabel
    assert.match(await ep.innerHTML('.wrap'), /1 von 1 falsch/);
    assert.strictEqual(new URL(ep.url()).hash, '', '#-Teil wird nach dem Speichern entfernt');
    assert.strictEqual(await ep.evaluate(() => document.documentElement.scrollWidth), 393, 'kein seitliches Scrollen');

    // derselbe Link noch einmal: kein doppelter Bericht; ein zweiter Bericht zeigt „+1“
    await ep.goto(link);
    await ep.waitForSelector('text=gibt es schon');
    assert.strictEqual(await ep.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lernwerk_eltern_v1')).kinder)[0].berichte.length), 1);
    await page.click('#lw-zu');
    await page.click('[data-thema="runden"] [data-aktion="ueben"]');
    while (await page.$('.lektion')) { await page.waitForSelector('.uebung'); await beantworte(page, true); await page.click('#weiter'); }
    await page.click('#uebersicht');
    const link2 = await page.evaluate(() => LERNWERK.berichtLink('../'));
    await ep.goto(link2);
    await ep.waitForSelector('.kind');
    assert.match(await ep.textContent('.bericht-thema'), /2 Runden\s*\+1/);

    // die Elternansicht selbst fragt nie nach einem Namen
    await ep.goto(`${basis}eltern/`);
    await ep.waitForSelector('.kind');
    assert.strictEqual(await ep.$('#lw-name'), null, 'Elternansicht fragt nicht nach dem Namen');
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
  await context.addInitScript(() => {
    localStorage.setItem('lernwerk_profil', JSON.stringify({ id: 'test', name: 'Testkind' }));
    localStorage.setItem('lernwerk_katze_v1', JSON.stringify({ name: 'Mimi' }));
  });
  const page = await context.newPage();
  try {
    for (const seite of ['', 'mathe/', 'latein/', 'geschichte/', 'eltern/']) {
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
