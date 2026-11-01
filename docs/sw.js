// Offline-Cache für LERNWERK – automatisch erzeugt von generator/webapp.js
const CACHE = 'lernwerk-92c8e39ccc';
const DATEIEN = [
  "./",
  "eltern/",
  "geschichte/",
  "latein/",
  "mathe/",
  "blaetter/mathematik/daten-diagramme_A.pdf",
  "blaetter/mathematik/daten-diagramme_A_loesung.pdf",
  "blaetter/mathematik/grosse-zahlen_A.pdf",
  "blaetter/mathematik/grosse-zahlen_A_loesung.pdf",
  "blaetter/mathematik/grundrechenarten_A.pdf",
  "blaetter/mathematik/grundrechenarten_A_loesung.pdf",
  "blaetter/mathematik/kommazahlen_A.pdf",
  "blaetter/mathematik/kommazahlen_A_loesung.pdf",
  "blaetter/mathematik/laengen-massen_A.pdf",
  "blaetter/mathematik/laengen-massen_A_loesung.pdf",
  "blaetter/mathematik/runden_A.pdf",
  "blaetter/mathematik/runden_A_loesung.pdf",
  "blaetter/mathematik/sachaufgaben_A.pdf",
  "blaetter/mathematik/sachaufgaben_A_loesung.pdf",
  "blaetter/mathematik/zeit_A.pdf",
  "blaetter/mathematik/zeit_A_loesung.pdf",
  "eltern/index.html",
  "fonts/inter-latin-400-normal.woff2",
  "fonts/inter-latin-500-normal.woff2",
  "fonts/inter-latin-600-normal.woff2",
  "fonts/montserrat-latin-400-normal.woff2",
  "fonts/montserrat-latin-600-normal.woff2",
  "fonts/montserrat-latin-700-normal.woff2",
  "geschichte/index.html",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon.svg",
  "index.html",
  "latein/index.html",
  "manifest.webmanifest",
  "mathe/index.html"
];

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
