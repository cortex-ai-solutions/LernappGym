// Offline-Cache für LERNWERK – automatisch erzeugt von generator/webapp.js
const CACHE = 'lernwerk-03ea892196';
const DATEIEN = [
  "./",
  "geschichte/",
  "latein/",
  "mathe/",
  "blaetter/mathematik/daten-diagramme.pdf",
  "blaetter/mathematik/daten-diagramme_loesung.pdf",
  "blaetter/mathematik/grosse-zahlen.pdf",
  "blaetter/mathematik/grosse-zahlen_loesung.pdf",
  "blaetter/mathematik/grundrechenarten.pdf",
  "blaetter/mathematik/grundrechenarten_loesung.pdf",
  "blaetter/mathematik/runden.pdf",
  "blaetter/mathematik/runden_loesung.pdf",
  "blaetter/mathematik/sachaufgaben.pdf",
  "blaetter/mathematik/sachaufgaben_loesung.pdf",
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
