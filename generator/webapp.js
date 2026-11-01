// Baut die Webapp nach docs/ (GitHub Pages): Startseite (Fächerwahl), je Fach eine App mit Themenkarten
// (Üben + Arbeitsblatt/Lösung als PDF), Manifest, Service Worker (offline) und App-Icons.
// npm run web
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const { marked } = require('marked');
const { bundle } = require('./bundle');
const { baueBlatt, VARIANTEN } = require('./worksheet');
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

// Service Worker registrieren + Update-Banner (Muster aus dem Busplan): Sobald eine neue Version geladen ist,
// erscheint unten „Neue Inhalte – Aktualisieren“. Gesucht wird beim Start und bei jeder Rückkehr in die App.
// Wird in jede Seite eingebaut, auch in die Bestands-Apps, damit die installierte App nie veraltet.
function updateBanner(prefix) {
  return `<style>
.update-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:60;max-width:456px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:14px 16px;min-height:52px;border:1px solid #C9A84C;border-radius:14px;background:#002B36;color:#F5F0E6;font:600 15px/1.3 Inter,system-ui,sans-serif;text-align:left;box-shadow:0 8px 24px rgba(0,0,0,.45);cursor:pointer;animation:ub-rein .25s ease-out}
.update-banner[hidden]{display:none}.update-banner:disabled{opacity:.7}
.update-banner .ub-text{flex:1;min-width:0}
.update-banner .ub-aktion{flex-shrink:0;padding:6px 12px;border-radius:999px;background:linear-gradient(135deg,#B8922A,#E8C97D);color:#000;font-weight:700}
@keyframes ub-rein{from{transform:translateY(140%);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.update-banner{animation:none}}
</style>
<button id="update-banner" class="update-banner" type="button" hidden><span aria-hidden="true">⬆️</span><span class="ub-text">Neue Inhalte verfügbar</span><span class="ub-aktion">Aktualisieren</span></button>
<script>
(function () {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  var banner = document.getElementById('update-banner');
  function zeigen() { banner.hidden = false; }
  // erst neu laden, wenn die neue Version übernommen hat – ein Neuladen mitten im Wechsel kann hängen bleiben
  var neuLaden = function () { neuLaden = function () {}; location.reload(); };
  banner.addEventListener('click', function () {
    banner.disabled = true;
    banner.querySelector('.ub-aktion').textContent = '…';
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg || !reg.waiting) return neuLaden();
      navigator.serviceWorker.addEventListener('controllerchange', function () { neuLaden(); });
      setTimeout(function () { neuLaden(); }, 3000);
      reg.waiting.postMessage('SKIP_WAITING');
    }).catch(function () { neuLaden(); });
  });
  navigator.serviceWorker.register('${prefix}sw.js', { scope: '${prefix}' }).then(function (reg) {
    // beim allerersten Besuch (noch kein Controller) gibt es nichts zu aktualisieren
    var hatteController = !!navigator.serviceWorker.controller;
    if (reg.waiting && hatteController) zeigen();
    reg.addEventListener('updatefound', function () {
      var neu = reg.installing;
      if (neu) neu.addEventListener('statechange', function () { if (neu.state === 'installed' && hatteController) zeigen(); });
    });
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (hatteController) zeigen(); });
    reg.update().catch(function () {});
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
  }).catch(function () {});
})();
</script>`;
}

// Gemeinsamer Teil aller Seiten: Name, Lernprotokoll, Bericht an die Eltern (templates/lernwerk.js).
// Kinder-Seiten fragen beim ersten Besuch nach dem Namen, die Elternansicht nicht.
// Mit katze kommt die Lernkatze dazu (templates/katze.js); sie stellt sich nach dem Namen vor.
function lernwerkSkript({ nameFragen, katze = false }) {
  const lw = `<script>${fs.readFileSync(path.join(TPL, 'lernwerk.js'), 'utf8')}</script>`;
  const kz = katze ? `\n<script>${fs.readFileSync(path.join(TPL, 'katze.js'), 'utf8')}</script>` : '';
  const start = !nameFragen ? '' : katze ? '\n<script>LERNWERK.start(function () { KATZE.start(); });</script>' : '\n<script>LERNWERK.start();</script>';
  return lw + kz + start;
}

// Themen-Titel für die Elternansicht (für Stände von vor dem Protokoll, die nur die id kennen)
function titelKatalog() {
  const katalog = {};
  for (const fach of FAECHER) {
    katalog[fach.id] = Object.fromEntries(ladeFach(fach.id, '').map((t) => [t.thema, t.titel]));
  }
  // Geschichte: Lektionen aus der Bestands-App lesen (id, week, title stehen dort direkt untereinander)
  const ge = fs.readFileSync(path.join(ROOT, 'legacy', 'geschichte-lernapp.html'), 'utf8');
  katalog.geschichte = Object.fromEntries([...ge.matchAll(/id: "(l\d+)",\s*week: \d+,\s*title: "([^"]+)"/g)].map((m) => [m[1], m[2]]));
  if (!Object.keys(katalog.geschichte).length) throw new Error('Geschichte: keine Lektionstitel gefunden');
  return katalog;
}

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
        blaetter: VARIANTEN.map((v) => ({
          variante: v, blatt: `${prefixZurWurzel}blaetter/${fachId}/${doc.thema}_${v}.pdf`, loesung: `${prefixZurWurzel}blaetter/${fachId}/${doc.thema}_${v}_loesung.pdf`,
        })),
      });
    }
  }
  return themen.sort((a, b) => a.reihenfolge - b.reihenfolge);
}

function fachSeite(fach, lwBundle) {
  const daten = { id: fach.id, titel: fach.titel, themen: ladeFach(fach.id, '../') };
  return `${kopf({ titel: `${fach.titel} – LERNWERK`, prefix: '../', beschreibung: `${fach.titel} üben, Klasse 5` })}
<body><div id="app"><p class="wrap">Die App wird geladen …</p></div>
<noscript><p class="wrap">Bitte JavaScript aktivieren.</p></noscript>
<script>${lwBundle}</script>
${lernwerkSkript({ nameFragen: true, katze: true })}
<script>window.FACH = ${jsonScript(daten)};</script>
<script>${fs.readFileSync(path.join(TPL, 'app.js'), 'utf8')}</script>
${updateBanner('../')}</body></html>`;
}

function elternSeite() {
  return `${kopf({ titel: 'Elternansicht – LERNWERK', prefix: '../', beschreibung: 'Lernberichte der Kinder ansehen' })}
<body><div id="app"><p class="wrap">Die Elternansicht wird geladen …</p></div>
<noscript><p class="wrap">Bitte JavaScript aktivieren.</p></noscript>
${lernwerkSkript({ nameFragen: false })}
<script>window.TITEL = ${jsonScript(titelKatalog())};</script>
<script>${fs.readFileSync(path.join(TPL, 'eltern.js'), 'utf8')}</script>
${updateBanner('../')}</body></html>`;
}

function startSeite() {
  const karten = [...FAECHER.map((f) => ({ ...f, href: `${f.ordner}/` })), ...BESTAND.map((b) => ({ ...b, href: `${b.ordner}/` }))]
    .map((f) => `<a class="thema" href="${f.href}" style="display:block;text-decoration:none;color:inherit"><div class="thema-kopf"><span class="thema-icon" aria-hidden="true">${f.icon}</span><div><h2>${esc(f.titel)}</h2><div class="meta">${esc(f.info)}</div></div></div></a>`)
    .join('\n');
  return `${kopf({ titel: 'LERNWERK – Lernen Klasse 5', prefix: '', beschreibung: 'Üben für Klasse 5: Mathematik, Latein, Geschichte' })}
<body><div class="wrap"><header style="margin:20px 0 22px"><h1 class="gold" style="font-size:32px;letter-spacing:.05em">LERNWERK</h1>
<p class="hallo" id="hallo">Üben für Klasse 5 – such dir ein Fach aus!</p></header>
<section class="katze-karte" id="katze-karte" hidden></section>
${karten}
<footer class="fuss"><button class="btn btn-ghost btn-breit" id="bericht">📤 Bericht an deine Eltern</button>
<p>Kein Konto, keine Werbung – dein Lernstand bleibt auf diesem Gerät.</p><p><a class="eltern-link" href="eltern/">Für Eltern: Berichte ansehen</a></p></footer></div>
${lernwerkSkript({ nameFragen: false, katze: true })}
<script>
(function () {
  var p = document.getElementById('hallo');
  function hallo() {
    var name = LERNWERK.profil().name;
    if (!name) return;
    p.innerHTML = '<span>Hallo, ' + LERNWERK.esc(name) + '! Such dir ein Fach aus.</span><button aria-label="Name ändern">✎</button>';
    p.querySelector('button').onclick = function () { LERNWERK.frageName(hallo); };
  }
  var kk = document.getElementById('katze-karte');
  function katze() {
    if (!KATZE.lies().name) return;
    kk.hidden = false;
    kk.innerHTML = KATZE.svg({ stimmung: 'hallo' }) + '<div><b>' + LERNWERK.esc(KATZE.name()) + '</b><p>' + LERNWERK.esc(KATZE.spruch('hallo')) + '</p>' +
      '<button class="btn btn-ghost">🎨 Anpassen</button></div>';
    kk.querySelector('button').onclick = function () { KATZE.anpassen(); };
  }
  window.addEventListener('katze-geaendert', katze);
  hallo();
  katze();
  LERNWERK.start(function () { hallo(); KATZE.start(); });
  document.getElementById('bericht').onclick = function () { LERNWERK.senden(''); };
})();
</script>
${updateBanner('')}</body></html>`;
}

function serviceWorker(dateien, version) {
  return `// Offline-Cache für LERNWERK – automatisch erzeugt von generator/webapp.js
const CACHE = 'lernwerk-${version}';
const DATEIEN = ${JSON.stringify(dateien, null, 2)};

// cache: 'reload' umgeht den HTTP-Cache (GitHub Pages liefert max-age=600), sonst landen kurz nach
// einem Deploy alte Dateien im neuen Cache. Die neue Version wartet, bis das Update-Banner sie aktiviert.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN.map((d) => new Request(d, { cache: 'reload' })))));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
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

  // Arbeitsblätter je Thema als Vorrat (Varianten A–E, je PDF + Lösung) – werden aus den Themenkarten verlinkt
  for (const fach of FAECHER) {
    const ziel = path.join(DOCS, 'blaetter', fach.id);
    fs.rmSync(ziel, { recursive: true, force: true });
    fs.mkdirSync(ziel, { recursive: true });
    for (const t of ladeFach(fach.id, '')) {
      const seiten = [];
      for (const v of VARIANTEN) {
        const r = await baueBlatt({ fach: fach.id, klasse: t.klasse, thema: t.thema, seed: v, datei: `${t.thema}_${v}` });
        for (const d of [r.blatt.datei, r.loesung.datei]) fs.copyFileSync(d, path.join(ziel, path.basename(d)));
        seiten.push(`${v} ${r.blatt.seiten}+${r.loesung.seiten}`);
      }
      console.log(`  Blätter ${fach.id}/${t.thema}: ${seiten.join(', ')} Seiten`);
    }
  }
  await schliessen();

  // Fach-Apps
  const lw = bundle(path.join(__dirname, 'web-einstieg.js'), 'LW');
  for (const fach of FAECHER) {
    fs.mkdirSync(path.join(DOCS, fach.ordner), { recursive: true });
    fs.writeFileSync(path.join(DOCS, fach.ordner, 'index.html'), fachSeite(fach, lw));
  }
  // Bestands-Apps übernehmen; dazu kommen Lernprotokoll/Name (vor dem App-Skript) und das Update-Banner
  for (const b of BESTAND) {
    fs.mkdirSync(path.join(DOCS, b.ordner), { recursive: true });
    const html = fs.readFileSync(path.join(ROOT, 'legacy', b.quelle), 'utf8');
    const anfang = html.indexOf('<body');
    const ende = html.lastIndexOf('</body>');
    if (anfang < 0 || ende < 0) throw new Error(`${b.quelle}: <body> oder </body> fehlt`);
    const nachBody = html.indexOf('>', anfang) + 1;
    fs.writeFileSync(path.join(DOCS, b.ordner, 'index.html'),
      html.slice(0, nachBody) + lernwerkSkript({ nameFragen: true }) + html.slice(nachBody, ende) + updateBanner('../') + html.slice(ende));
  }
  fs.mkdirSync(path.join(DOCS, 'eltern'), { recursive: true });
  fs.writeFileSync(path.join(DOCS, 'eltern', 'index.html'), elternSeite());
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
  // Vom Blatt-Vorrat nur Variante A vorab laden; B–E landen beim ersten Öffnen im Cache
  const vorab = dateien.filter((d) => !/^blaetter\/.*_[B-Z](_loesung)?\.pdf$/.test(d));
  const precache = ['./', ...vorab.filter((d) => d.endsWith('index.html')).map((d) => d.replace(/index\.html$/, '')).filter(Boolean), ...vorab];
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
