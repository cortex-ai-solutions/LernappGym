// Baut die Webapp nach docs/ (GitHub Pages): Startseite (Fächerwahl), je Fach eine App mit Themenkarten
// (Üben + Arbeitsblatt/Lösung als PDF), Manifest, Service Worker (offline) und App-Icons.
// npm run web
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const { marked } = require('marked');
const { bundle } = require('./bundle');
const { baueBlatt } = require('./worksheet');
const { schliessen } = require('./pdf');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const TPL = path.join(ROOT, 'templates');
const THEME = '#002B36';

// Fächer mit eigener Generator-App; Latein und Geschichte laufen vorerst als Bestands-Apps (legacy/)
const FAECHER = [
  { id: 'mathematik', ordner: 'mathe', titel: 'Mathematik', icon: '🧮', info: 'Üben und Arbeitsblätter je Thema' },
];
const BESTAND = [
  { ordner: 'latein', titel: 'Latein', icon: '🦉', info: 'Vokabeln, Grammatik, Römer', quelle: 'LATINA_App.html' },
  { ordner: 'geschichte', titel: 'Geschichte', icon: '📜', info: 'Lektionen, Quiz, Karteikarten', quelle: 'geschichte-lernapp.html' },
];

const SCHRIFTEN = [
  ['Montserrat', 'montserrat', [400, 600, 700]],
  ['Inter', 'inter', [400, 500, 600]],
];
const fontCss = (prefix) => SCHRIFTEN.flatMap(([f, d, ws]) => ws.map((w) =>
  `@font-face{font-family:'${f}';font-weight:${w};font-display:swap;src:url(${prefix}fonts/${d}-latin-${w}-normal.woff2) format('woff2')}`)).join('\n');

// JSON sicher in <script> einbetten
const LS = new RegExp(String.fromCharCode(0x2028, 124, 0x2029), 'g'); // Zeilentrenner, die in <script> stören
const jsonScript = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(LS, (c) => '\\u' + c.charCodeAt(0).toString(16));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><radialGradient id="bg" cx="0.2" cy="0.1" r="1.1"><stop offset="0" stop-color="#004D5C"/><stop offset="0.55" stop-color="#002B36"/><stop offset="1" stop-color="#001820"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B6914"/><stop offset="0.4" stop-color="#C9A84C"/><stop offset="0.7" stop-color="#E8C97D"/><stop offset="1" stop-color="#C9A84C"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <path d="M96 268 C 150 120, 214 120, 256 268 S 362 416, 416 268" fill="none" stroke="url(#gold)" stroke-width="44" stroke-linecap="round"/>
</svg>`;

function kopf({ titel, prefix, beschreibung }) {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${THEME}"><meta name="description" content="${esc(beschreibung)}">
<link rel="manifest" href="${prefix}manifest.webmanifest"><link rel="icon" href="${prefix}icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${prefix}icons/icon-192.png"><title>${esc(titel)}</title>
<style>${fontCss(prefix)}\n${fs.readFileSync(path.join(TPL, 'web.css'), 'utf8')}</style></head>`;
}

function ladeFach(fachId, prefixZurWurzel) {
  const ordner = path.join(ROOT, 'content', fachId);
  const themen = [];
  for (const klasse of fs.readdirSync(ordner)) {
    for (const f of fs.readdirSync(path.join(ordner, klasse))) {
      const doc = yaml.load(fs.readFileSync(path.join(ordner, klasse, f), 'utf8'));
      themen.push({
        thema: doc.thema, titel: doc.titel, icon: doc.icon || '📘', reihenfolge: doc.reihenfolge || 99, klasse: doc.klasse,
        erklaerungHtml: marked.parse(doc.erklaerung), wissenswertes: doc.wissenswertes || [], aufgaben: doc.aufgaben,
        blatt: `${prefixZurWurzel}blaetter/${fachId}/${doc.thema}.pdf`, loesung: `${prefixZurWurzel}blaetter/${fachId}/${doc.thema}_loesung.pdf`,
      });
    }
  }
  return themen.sort((a, b) => a.reihenfolge - b.reihenfolge);
}

function fachSeite(fach, lwBundle) {
  const daten = { id: fach.id, titel: fach.titel, themen: ladeFach(fach.id, '../'), sw: '../sw.js', swScope: '../' };
  return `${kopf({ titel: `${fach.titel} – LERNWERK`, prefix: '../', beschreibung: `${fach.titel} üben, Klasse 5` })}
<body><div id="app"><p class="wrap">Die App wird geladen …</p></div>
<noscript><p class="wrap">Bitte JavaScript aktivieren.</p></noscript>
<script>${lwBundle}</script>
<script>window.FACH = ${jsonScript(daten)};</script>
<script>${fs.readFileSync(path.join(TPL, 'app.js'), 'utf8')}</script></body></html>`;
}

function startSeite() {
  const karten = [...FAECHER.map((f) => ({ ...f, href: `${f.ordner}/` })), ...BESTAND.map((b) => ({ ...b, href: `${b.ordner}/` }))]
    .map((f) => `<a class="thema" href="${f.href}" style="display:block;text-decoration:none;color:inherit"><div class="thema-kopf"><span class="thema-icon" aria-hidden="true">${f.icon}</span><div><h2>${esc(f.titel)}</h2><div class="meta">${esc(f.info)}</div></div></div></a>`)
    .join('\n');
  return `${kopf({ titel: 'LERNWERK – Lernen Klasse 5', prefix: '', beschreibung: 'Üben für Klasse 5: Mathematik, Latein, Geschichte' })}
<body><div class="wrap"><header style="margin:20px 0 22px"><h1 class="gold" style="font-size:32px;letter-spacing:.05em">LERNWERK</h1>
<p style="color:var(--text-secondary)">Üben für Klasse 5 – such dir ein Fach aus!</p></header>
${karten}
<footer class="fuss"><p>Kein Konto, keine Werbung – dein Lernstand bleibt auf diesem Gerät.</p></footer></div>
<script>if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js', { scope: './' });</script></body></html>`;
}

function serviceWorker(dateien, version) {
  return `// Offline-Cache für LERNWERK – automatisch erzeugt von generator/webapp.js
const CACHE = 'lernwerk-${version}';
const DATEIEN = ${JSON.stringify(dateien, null, 2)};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// zuerst Cache (offline), sonst Netz; neue Antworten werden für das nächste Mal gemerkt
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((treffer) => treffer || fetch(e.request).then((antwort) => {
      if (antwort.ok) { const kopie = antwort.clone(); caches.open(CACHE).then((c) => c.put(e.request, kopie)); }
      return antwort;
    })),
  );
});
`;
}

async function icons() {
  const { chromium } = require('playwright');
  const ziel = path.join(DOCS, 'icons');
  fs.mkdirSync(ziel, { recursive: true });
  fs.writeFileSync(path.join(ziel, 'icon.svg'), ICON_SVG);
  const browser = await chromium.launch();
  for (const groesse of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: groesse, height: groesse } });
    await page.setContent(`<html><body style="margin:0">${ICON_SVG.replace('<svg ', `<svg width="${groesse}" height="${groesse}" `)}</body></html>`);
    await page.screenshot({ path: path.join(ziel, `icon-${groesse}.png`) });
    await page.close();
  }
  await browser.close();
}

function alleDateien(ordner, basis = ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(ordner, e.name);
    return e.isDirectory() ? alleDateien(p, basis) : [path.relative(basis, p).split(path.sep).join('/')];
  });
}

async function baueWeb() {
  fs.mkdirSync(DOCS, { recursive: true });
  // Schriften
  fs.mkdirSync(path.join(DOCS, 'fonts'), { recursive: true });
  for (const [, d, ws] of SCHRIFTEN) for (const w of ws) fs.copyFileSync(path.join(TPL, 'fonts', `${d}-latin-${w}-normal.woff2`), path.join(DOCS, 'fonts', `${d}-latin-${w}-normal.woff2`));
  await icons();

  // Arbeitsblätter je Thema (PDF) – werden aus den Themenkarten verlinkt
  for (const fach of FAECHER) {
    for (const t of ladeFach(fach.id, '')) {
      const r = await baueBlatt({ fach: fach.id, klasse: t.klasse, thema: t.thema, seed: 'blatt' });
      const ziel = path.join(DOCS, 'blaetter', fach.id);
      fs.mkdirSync(ziel, { recursive: true });
      for (const d of [r.blatt.datei, r.loesung.datei]) fs.copyFileSync(d, path.join(ziel, path.basename(d)));
      console.log(`  Blatt ${fach.id}/${t.thema}: ${r.blatt.seiten} + ${r.loesung.seiten} Seiten`);
    }
  }
  await schliessen();

  // Fach-Apps
  const lw = bundle(path.join(__dirname, 'web-einstieg.js'), 'LW');
  for (const fach of FAECHER) {
    fs.mkdirSync(path.join(DOCS, fach.ordner), { recursive: true });
    fs.writeFileSync(path.join(DOCS, fach.ordner, 'index.html'), fachSeite(fach, lw));
  }
  // Bestands-Apps unverändert übernehmen
  for (const b of BESTAND) {
    fs.mkdirSync(path.join(DOCS, b.ordner), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'legacy', b.quelle), path.join(DOCS, b.ordner, 'index.html'));
  }
  fs.writeFileSync(path.join(DOCS, 'index.html'), startSeite());
  fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
  fs.writeFileSync(path.join(DOCS, 'manifest.webmanifest'), JSON.stringify({
    name: 'LERNWERK – Lernen Klasse 5', short_name: 'LERNWERK', lang: 'de', start_url: './', scope: './', display: 'standalone',
    background_color: THEME, theme_color: THEME,
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }, null, 2));

  // Service Worker zuletzt: Version = Hash über alle ausgelieferten Dateien
  const dateien = alleDateien(DOCS).filter((d) => d !== 'sw.js' && !d.startsWith('.'));
  const hash = crypto.createHash('sha256');
  for (const d of dateien.sort()) hash.update(d).update(fs.readFileSync(path.join(DOCS, d)));
  const version = hash.digest('hex').slice(0, 10);
  const precache = ['./', ...dateien.filter((d) => d.endsWith('index.html')).map((d) => d.replace(/index\.html$/, '')).filter(Boolean), ...dateien];
  fs.writeFileSync(path.join(DOCS, 'sw.js'), serviceWorker([...new Set(precache)], version));
  console.log(`✓ Webapp gebaut: ${dateien.length} Dateien, Cache-Version ${version}`);
}

if (require.main === module) {
  baueWeb().catch(async (e) => {
    console.error(`✗ ${e.stack || e.message}`);
    await schliessen();
    process.exit(1);
  });
}

module.exports = { baueWeb };
