/* LERNWERK Fach-App (Browser). Erwartet window.LW (Generator-Bundle) und window.FACH (Themen-Daten aus dem Build).
   Ablauf: Übersicht → (Merke) → Lektion mit 5 Herzen → Abschluss. Lernstand nur in localStorage, Export/Import als JSON. */
(function () {
  'use strict';
  var FACH = window.FACH;
  var LW = window.LW;
  var SPEICHER = 'lernwerk_v1';
  var HERZEN = 5;
  var MAX_UEBUNGEN = 12;
  var app = document.getElementById('app');

  // ---------- Lernstand ----------
  function leer() { return { version: 1, xp: 0, streak: { tage: 0, letzterTag: null }, themen: {} }; }
  function laden() {
    try {
      var s = JSON.parse(localStorage.getItem(SPEICHER));
      return s && s.version === 1 ? s : leer();
    } catch (e) { return leer(); }
  }
  var stand = laden();
  function speichern() { try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* privater Modus */ } }
  function themaStand(id) {
    var k = FACH.id + '/' + id;
    stand.themen[k] = stand.themen[k] || { lektionen: 0, sterne: 0 };
    return stand.themen[k];
  }
  function tag(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function streakAktuell() {
    var s = stand.streak;
    if (!s.letzterTag) return 0;
    var gestern = new Date(); gestern.setDate(gestern.getDate() - 1);
    return s.letzterTag === tag() || s.letzterTag === tag(gestern) ? s.tage : 0;
  }
  function streakZaehlen() {
    var heute = tag();
    var gestern = new Date(); gestern.setDate(gestern.getDate() - 1);
    if (stand.streak.letzterTag === heute) return;
    stand.streak.tage = stand.streak.letzterTag === tag(gestern) ? stand.streak.tage + 1 : 1;
    stand.streak.letzterTag = heute;
  }

  // ---------- Klassenarbeit: gewählte Lernbereiche und Variante (Arbeit und Lösung passen über die Variante zusammen) ----------
  var KA_SPEICHER = 'lernwerk_klassenarbeit_v1';
  function neueVariante() { var z = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 4; i++) s += z[Math.floor(Math.random() * z.length)]; return s; }
  function kaLaden() {
    try {
      var s = JSON.parse(localStorage.getItem(KA_SPEICHER));
      if (s && Array.isArray(s.themen) && s.variante) return s;
    } catch (e) { /* leer */ }
    return { themen: [], variante: neueVariante() };
  }
  var KA = kaLaden();
  function kaSpeichern() { try { localStorage.setItem(KA_SPEICHER, JSON.stringify(KA)); } catch (e) { /* privater Modus */ } }
  function kaThemen() { return FACH.themen.filter(function (t) { return KA.themen.indexOf(t.thema) >= 0 && t.klassenarbeit && t.klassenarbeit.length; }); }

  // ---------- Hilfen ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mitBox(s) { return esc(s).replace(/∎/g, '<span class="box">?</span>'); }
  function sterne(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
  function mischen(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function normWort(s) {
    var t = String(s).toLowerCase().replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim();
    // „einhundert“ = „hundert“, „eintausend“ = „tausend“
    for (var i = 0; i < 3; i++) t = t.replace(/(^| |tausend)ein(hundert|tausend)/g, '$1$2');
    return t.replace(/ /g, ''); // „sieben Millionen …“ = „siebenmillionen…“
  }
  function abstand(a, b) {
    var d = [];
    for (var i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (var j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // Säulen-/Balkendiagramm für den Bildschirm (Gold auf Teal)
  function diagrammSvg(d) {
    var max = Math.max.apply(null, d.werte);
    var top = Math.ceil((max + 1) / 2) * 2;
    var n = d.kategorien.length;
    var teile = [];
    if (d.art === 'balken') {
      var lb = 92, zeile = 34, breite = 320, x0 = lb, e = (breite - lb - 12) / top, h = n * zeile + 30;
      for (var i = 0; i <= top; i += 2) teile.push('<line x1="' + (x0 + i * e) + '" y1="4" x2="' + (x0 + i * e) + '" y2="' + (n * zeile + 4) + '" stroke="rgba(255,255,255,.15)"/><text x="' + (x0 + i * e) + '" y="' + (n * zeile + 20) + '" font-size="12" text-anchor="middle">' + i + '</text>');
      d.kategorien.forEach(function (k, j) {
        var y = 4 + j * zeile + 7;
        teile.push('<text x="' + (x0 - 6) + '" y="' + (y + 15) + '" font-size="13" text-anchor="end">' + esc(k) + '</text><rect x="' + x0 + '" y="' + y + '" width="' + d.werte[j] * e + '" height="20" rx="3" fill="url(#g)"/>');
      });
      return '<svg class="diagramm" viewBox="0 0 ' + breite + ' ' + h + '" role="img" aria-label="Balkendiagramm"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#B8922A"/><stop offset="1" stop-color="#E8C97D"/></linearGradient></defs>' + teile.join('') + '<line x1="' + x0 + '" y1="4" x2="' + x0 + '" y2="' + (n * zeile + 4) + '" stroke="#E8C97D" stroke-width="1.5"/></svg>';
    }
    var B = 320, H = 210, x0 = 30, yB = 170, e2 = (yB - 14) / top, sp = (B - x0 - 6) / n;
    for (var k = 0; k <= top; k += 2) teile.push('<line x1="' + x0 + '" y1="' + (yB - k * e2) + '" x2="' + B + '" y2="' + (yB - k * e2) + '" stroke="rgba(255,255,255,.15)"/><text x="' + (x0 - 6) + '" y="' + (yB - k * e2 + 4) + '" font-size="12" text-anchor="end">' + k + '</text>');
    d.kategorien.forEach(function (kat, j) {
      var x = x0 + j * sp + sp * 0.2;
      teile.push('<rect x="' + x + '" y="' + (yB - d.werte[j] * e2) + '" width="' + sp * 0.6 + '" height="' + d.werte[j] * e2 + '" rx="3" fill="url(#g)"/><text x="' + (x + sp * 0.3) + '" y="' + (yB + 18) + '" font-size="12" text-anchor="middle">' + esc(kat) + '</text>');
    });
    return '<svg class="diagramm" viewBox="0 0 ' + B + ' ' + H + '" role="img" aria-label="Säulendiagramm"><defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B8922A"/><stop offset="1" stop-color="#E8C97D"/></linearGradient></defs>' + teile.join('') + '<line x1="' + x0 + '" y1="' + yB + '" x2="' + B + '" y2="' + yB + '" stroke="#E8C97D" stroke-width="1.5"/></svg>';
  }

  // ---------- Übersicht ----------
  function uebersicht() {
    window.scrollTo(0, 0);
    var karten = FACH.themen.map(function (t) {
      var st = themaStand(t.thema);
      return '<article class="thema" data-thema="' + t.thema + '">' +
        '<div class="thema-kopf"><span class="thema-icon" aria-hidden="true">' + t.icon + '</span><div><h2>' + esc(t.titel) + '</h2>' +
        '<div class="meta"><span class="sterne" aria-label="' + st.sterne + ' von 3 Sternen">' + sterne(st.sterne) + '</span> · ' + st.lektionen + ' ' + (st.lektionen === 1 ? 'Übung' : 'Übungen') + '</div></div></div>' +
        '<div class="reihe"><button class="btn btn-gold" data-aktion="ueben">▶ Üben</button><button class="btn btn-ghost" data-aktion="merke">💡 Merke</button></div>' +
        '<div class="reihe-druck"><button class="btn btn-ghost" data-aktion="druck" data-rolle="blatt" aria-expanded="false">🖨 Arbeitsblatt <span aria-hidden="true">▾</span></button>' +
        '<button class="btn btn-ghost" data-aktion="druck" data-rolle="loesung" aria-expanded="false">✓ Lösung <span aria-hidden="true">▾</span></button></div>' +
        '<div class="druck-liste" hidden></div>' +
        (t.klassenarbeit && t.klassenarbeit.length
          ? '<label class="ka-wahl"><input type="checkbox" data-ka="' + t.thema + '"' + (KA.themen.indexOf(t.thema) >= 0 ? ' checked' : '') + '> 📝 In die Klassenarbeit</label>' : '') +
        '</article>';
    }).join('');
    app.innerHTML = '<div class="wrap">' +
      '<header class="kopf"><a class="zurueck" href="../" aria-label="Zur Fächerwahl">←</a><h1 class="gold">' + esc(FACH.titel) + '</h1>' +
      '<div class="chips"><span class="chip" title="Tage in Folge">🔥 ' + streakAktuell() + '</span><span class="chip" title="Erfahrungspunkte">⭐ ' + stand.xp + '</span></div></header>' +
      '<section class="katze-karte" id="katze-karte" hidden></section>' +
      karten +
      '<footer class="fuss"><button class="btn btn-ghost btn-breit" data-aktion="bericht">📤 Bericht an deine Eltern</button><p>Dein Lernstand bleibt auf diesem Gerät.</p><div class="reihe"><button class="btn btn-ghost" data-aktion="export">Lernstand sichern</button><label class="btn btn-ghost">Lernstand laden<input type="file" accept="application/json" class="versteckt" id="import"></label></div></footer></div>' +
      '<div class="ka-leiste" id="ka-leiste" hidden><button class="btn btn-gold" id="ka-oeffnen"></button></div>';
    if (location.hash) history.replaceState(null, '', location.pathname);
    app.querySelectorAll('[data-ka]').forEach(function (k) {
      k.addEventListener('change', function () {
        KA.themen = KA.themen.filter(function (x) { return x !== k.dataset.ka; });
        if (k.checked) KA.themen.push(k.dataset.ka);
        kaSpeichern();
        kaLeiste();
      });
    });
    document.getElementById('ka-oeffnen').onclick = klassenarbeitSeite;
    kaLeiste();
    app.querySelectorAll('[data-aktion]').forEach(function (b) {
      b.addEventListener('click', function () {
        var karte = b.closest('[data-thema]');
        var t = karte && FACH.themen.find(function (x) { return x.thema === karte.dataset.thema; });
        if (b.dataset.aktion === 'ueben') starte(t);
        else if (b.dataset.aktion === 'merke') merke(t);
        else if (b.dataset.aktion === 'druck') druckListe(karte, t, b);
        else if (b.dataset.aktion === 'export') exportieren();
        else if (b.dataset.aktion === 'bericht') LERNWERK.senden('../');
      });
    });
    document.getElementById('import').addEventListener('change', importieren);
    katzeKarte();
  }

  // Lernkatze (templates/katze.js): begrüßt in der Übersicht, „Anpassen“ öffnet den Kleiderschrank
  var KZ = window.KATZE;
  function katzeKarte() { if (KZ) KZ.karte(document.getElementById('katze-karte')); }
  window.addEventListener('katze-geaendert', katzeKarte);
  function katzeMit(stimmung, art, bewegung) {
    if (!KZ) return '';
    return '<div class="katze-sagt">' + KZ.svg({ stimmung: stimmung, bewegung: bewegung }) + '<p>„' + esc(KZ.spruch(art)) + '“</p></div>';
  }

  // Arbeitsblatt-Vorrat: „Arbeitsblatt“ bzw. „Lösung“ klappt die Liste A–E auf, Blatt und Lösung tragen denselben Buchstaben
  function druckListe(karte, t, knopf) {
    var liste = karte.querySelector('.druck-liste'), rolle = knopf.dataset.rolle;
    var offen = knopf.getAttribute('aria-expanded') === 'true';
    karte.querySelectorAll('[data-aktion="druck"]').forEach(function (k) { k.setAttribute('aria-expanded', 'false'); });
    liste.hidden = offen;
    if (offen) return;
    knopf.setAttribute('aria-expanded', 'true');
    liste.innerHTML = t.blaetter.map(function (b) {
      return '<a class="btn btn-ghost" href="' + b[rolle] + '" target="_blank" rel="noopener">' + (rolle === 'blatt' ? '🖨 Blatt ' : '✓ Lösung ') + b.variante + '</a>';
    }).join('');
  }

  // ---------- Klassenarbeit ----------
  function kaLeiste() {
    var leiste = document.getElementById('ka-leiste');
    if (!leiste) return;
    var n = kaThemen().length;
    leiste.hidden = !n;
    document.body.classList.toggle('mit-ka-leiste', n > 0);
    document.getElementById('ka-oeffnen').textContent = '📝 Klassenarbeit mit ' + n + (n === 1 ? ' Lernbereich' : ' Lernbereichen');
  }

  function klassenarbeitSeite() {
    window.scrollTo(0, 0);
    document.body.classList.remove('mit-ka-leiste');
    var themen = kaThemen();
    if (!themen.length) return uebersicht();
    history.replaceState(null, '', '#klassenarbeit');
    var ka = LW.stelleZusammen({ themen: themen, uebergreifend: FACH.uebergreifend || [], seed: KA.variante });
    var ziel = 'klassenarbeit.html#t=' + themen.map(function (t) { return t.thema; }).join(',') + '&s=' + encodeURIComponent(KA.variante);
    var uebergreifend = ka.aufgaben.some(function (a) { return !a.thema; });
    app.innerHTML = '<div class="wrap"><header class="kopf"><button class="zurueck" aria-label="Zurück">←</button><h1>📝 Klassenarbeit</h1></header>' +
      '<section class="karte"><h2>Lernbereiche</h2><div class="ka-themen">' + themen.map(function (t) { return '<span class="chip">' + t.icon + ' ' + esc(t.titel) + '</span>'; }).join('') + '</div>' +
      '<ul class="ka-fakten"><li>' + ka.aufgaben.length + ' Aufgaben, ' + ka.gesamtBe + ' BE, ' + ka.dauer + ' Minuten</li>' +
      '<li>schwerer als die Arbeitsblätter: mehrere Rechenschritte, Fehler finden, Begründen</li>' +
      (uebergreifend ? '<li>mit Aufgaben, die mehrere Lernbereiche verbinden</li>' : (themen.length > 1 ? '' : '<li>Tipp: Mit mehreren Lernbereichen kommen verbindende Aufgaben dazu.</li>')) +
      '<li>Lösung mit Punkteübersicht und Notentabelle</li></ul></section>' +
      '<section class="karte"><h2>Drucken</h2><div class="stapel">' +
      '<a class="btn btn-gold" href="' + ziel + '">🖨 Klassenarbeit</a>' +
      '<a class="btn btn-ghost" href="' + ziel + '&l=1">✓ Lösung und Notentabelle</a>' +
      '<button class="btn btn-ghost" id="ka-neu">↻ Andere Aufgaben</button></div>' +
      '<p class="ka-hinweis">Arbeit und Lösung gehören über die Variante <span class="ka-variante">' + esc(KA.variante) + '</span> zusammen (steht unten auf beiden Blättern). „Andere Aufgaben“ stellt aus denselben Lernbereichen eine neue Arbeit zusammen.</p></section>' +
      '<section class="karte"><h2>Probe am Handy</h2><p>Alle Aufgaben, die am Handy gehen, mit Uhr und ohne Hilfe zwischendurch. Am Ende siehst du, was schon sitzt und was du noch üben solltest.</p>' +
      '<button class="btn btn-gold btn-breit" id="ka-probe" style="margin-top:14px">▶ Probe-Klassenarbeit starten</button>' +
      '<p class="ka-hinweis">Die Probe hat jedes Mal neue Aufgaben, nicht die gedruckte Arbeit.</p></section>' +
      (amPC() ? kaElternHtml() : '') +
      '<button class="btn btn-ghost btn-breit" id="ka-auswahl">Lernbereiche ändern</button></div>';
    app.querySelector('.zurueck').onclick = uebersicht;
    document.getElementById('ka-auswahl').onclick = uebersicht;
    document.getElementById('ka-neu').onclick = function () { KA.variante = neueVariante(); kaSpeichern(); klassenarbeitSeite(); };
    document.getElementById('ka-probe').onclick = function () { starteKA(themen); };
    // geöffnete Arbeiten merken, damit die Eltern sie später bewerten können, auch nach „Andere Aufgaben“
    app.querySelectorAll('a[href^="klassenarbeit.html"]').forEach(function (a) {
      a.addEventListener('click', function () { kaMerken(themen.map(function (t) { return t.thema; }), KA.variante); });
    });
    if (amPC()) kaElternVerbinden();
  }

  // ---------- Klassenarbeit bewerten (nur für Eltern am PC) ----------
  // Am Handy des Kindes erscheint das nicht. Die Note folgt dem Notenschlüssel der Schule (generator/klassenarbeit.js),
  // ab Note 3 gibt es einen Belohnungscode fürs Katzenalbum (Pokal).
  function amPC() {
    return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth >= 700);
  }
  function kaMerken(ids, variante) {
    var alt = Array.isArray(KA.verlauf) ? KA.verlauf : [];
    KA.verlauf = [{ themen: ids, variante: variante }].concat(alt.filter(function (v) { return !(v.variante === variante && v.themen.join() === ids.join()); })).slice(0, 10);
    kaSpeichern();
  }
  // aktuelle Arbeit zuerst, dann früher geöffnete, deren Lernbereiche es noch gibt
  function kaArbeiten() {
    var jetzt = { themen: kaThemen().map(function (t) { return t.thema; }), variante: KA.variante };
    var liste = [jetzt].concat((Array.isArray(KA.verlauf) ? KA.verlauf : []).filter(function (v) {
      return v && Array.isArray(v.themen) && v.themen.length && !(v.variante === jetzt.variante && v.themen.join() === jetzt.themen.join());
    }));
    return liste.map(function (v) {
      var themen = v.themen.map(function (id) { return FACH.themen.find(function (t) { return t.thema === id && t.klassenarbeit && t.klassenarbeit.length; }); });
      if (themen.some(function (t) { return !t; })) return null;
      var ka = LW.stelleZusammen({ themen: themen, uebergreifend: FACH.uebergreifend || [], seed: v.variante });
      return { variante: v.variante, ids: v.themen, ka: ka, titel: 'Variante ' + v.variante + ' · ' + themen.map(function (t) { return t.titel; }).join(', ') + ' (' + ka.gesamtBe + ' BE)' };
    }).filter(Boolean);
  }
  function kaElternHtml() {
    var arbeiten = kaArbeiten();
    return '<section class="karte ka-eltern" id="ka-eltern"><h2>Für Eltern: Arbeit bewerten</h2>' +
      '<p>Erreichte BE eintragen. Die App rechnet die Note nach dem Notenschlüssel der Schule. Ab Note 3 gibt es einen Belohnungscode fürs Katzenalbum.</p>' +
      '<label class="ka-label" for="ka-arbeit">Welche Arbeit? (Die Variante steht unten auf dem Blatt.)</label>' +
      '<select id="ka-arbeit">' + arbeiten.map(function (a, i) { return '<option value="' + i + '">' + esc(a.titel) + '</option>'; }).join('') + '</select>' +
      '<label class="ka-label" for="ka-be">Erreichte BE</label>' +
      '<form class="ka-be-reihe" id="ka-bewerten"><input id="ka-be" inputmode="decimal" autocomplete="off" placeholder="z. B. 35"><span id="ka-von">von ' + arbeiten[0].ka.gesamtBe + '</span>' +
      '<button class="btn btn-gold" type="submit">Note berechnen</button></form>' +
      '<div id="ka-bewertung" role="status"></div></section>';
  }
  function kaElternVerbinden() {
    var arbeiten = kaArbeiten();
    var wahl = document.getElementById('ka-arbeit'), feld = document.getElementById('ka-be'), aus = document.getElementById('ka-bewertung');
    wahl.onchange = function () { document.getElementById('ka-von').textContent = 'von ' + arbeiten[wahl.value].ka.gesamtBe; aus.innerHTML = ''; };
    document.getElementById('ka-bewerten').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = arbeiten[wahl.value], g = a.ka.gesamtBe;
      var be = Number(String(feld.value).trim().replace(',', '.'));
      if (!String(feld.value).trim() || isNaN(be) || be < 0 || be > g || be * 2 !== Math.round(be * 2)) {
        aus.innerHTML = '<p class="ka-fehlertext">Bitte eine Zahl von 0 bis ' + g + ' eintragen (halbe BE gehen auch, z. B. 35,5).</p>';
        return;
      }
      var n = LW.note(be, g), code = LW.kaCode({ seed: a.variante, themen: a.ids, note: n.note });
      var pokal = { 1: 'Gold-Pokal', 2: 'Silber-Pokal', 3: 'Bronze-Pokal' }[n.note];
      aus.innerHTML = '<p class="ka-note">Note <b>' + n.note + '</b> (' + esc(n.wort) + ')</p>' +
        '<p>' + String(be).replace('.', ',') + ' von ' + g + ' BE = ' + Math.round(100 * be / g) + ' %</p>' +
        (code
          ? '<p style="margin-top:10px">Belohnungscode für euer Kind:</p><div class="ka-code" id="ka-code">' + code + '</div>' +
            '<p class="ka-hinweis">Im Katzenalbum unter „Belohnungscode von deinen Eltern“ eintippen. Er schaltet den ' + pokal + ' frei und gilt nur für diese Arbeit.</p>'
          : '<p class="ka-hinweis">Einen Belohnungscode gibt es ab Note 3. Die Probe-Klassenarbeit am Handy zeigt, welcher Lernbereich noch Übung braucht.</p>');
    });
  }

  // Probe-Klassenarbeit: jede Teilaufgabe wird eine Übung; keine Herzen, kein Sofort-Feedback, Uhr läuft rückwärts.
  // BE einer Aufgabe werden gleichmäßig auf ihre Teile verteilt. Zeichnen gibt es nur auf Papier.
  var kaUhr = null;
  function starteKA(themen) {
    var ka = LW.stelleZusammen({ themen: themen, uebergreifend: FACH.uebergreifend || [], seed: 'probe-' + Date.now() + '-' + Math.random() });
    var uebungen = [], nurPapier = [];
    ka.aufgaben.forEach(function (a, i) {
      var teile = a.nur === 'druck' ? [] : a.teile.filter(function (t) { return t.eingabe !== 'zeichnung'; });
      if (!teile.length) { nurPapier.push(a); return; }
      teile.forEach(function (t) { uebungen.push({ a: a, t: t, nr: i + 1, be: a.be / teile.length, teil: teile.length > 1 ? t.label : '' }); });
    });
    L = { modus: 'ka', ka: ka, uebungen: uebungen, nurPapier: nurPapier, i: 0, herzen: HERZEN, fehler: 0, xp: 0, richtig: 0, beantwortet: 0, aufgaben: {}, be: 0, ergebnisse: [], start: Date.now(), themen: themen };
    clearInterval(kaUhr);
    kaUhr = setInterval(uhrZeigen, 1000);
    zeigeUebung();
  }
  function uhrZeigen() {
    var el = document.getElementById('ka-uhr');
    if (!el || !L || L.modus !== 'ka') return;
    var rest = L.ka.dauer * 60 - Math.floor((Date.now() - L.start) / 1000), r = Math.abs(rest);
    el.textContent = (rest < 0 ? '⏱ +' : '⏱ ') + Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0');
    el.classList.toggle('um', rest < 0);
    el.setAttribute('aria-label', rest < 0 ? 'Zeit ist um' : 'noch ' + Math.ceil(rest / 60) + ' Minuten');
  }
  function kaAntwort(erg, u) {
    L.beantwortet++;
    if (erg.richtig) { L.richtig++; L.xp += 10; L.be += u.be; } else L.fehler++;
    L.ergebnisse.push({ u: u, richtig: !!erg.richtig });
    var pa = L.aufgaben[u.a.id] = L.aufgaben[u.a.id] || { l: String(u.a.bezeichnung || u.a.anweisung).slice(0, 80), r: 0, f: 0 };
    if (erg.richtig) pa.r++; else pa.f++;
    L.i++;
    if (L.i >= L.uebungen.length) return kaEnde();
    zeigeUebung();
  }
  function halbe(x) { return String(Math.round(x * 2) / 2).replace('.', ','); }
  function kaEnde() {
    clearInterval(kaUhr);
    window.scrollTo(0, 0);
    var moeglich = L.uebungen.reduce(function (s, u) { return s + u.be; }, 0);
    var anteil = moeglich ? L.be / moeglich : 0;
    var minuten = Math.max(1, Math.round((Date.now() - L.start) / 60000));
    var summe = function (liste, nurRichtig) { return liste.filter(function (e) { return !nurRichtig || e.richtig; }).reduce(function (s, e) { return s + e.u.be; }, 0); };
    var bereiche = L.themen.map(function (t) {
      var es = L.ergebnisse.filter(function (e) { return e.u.a.thema === t.thema; });
      return { t: t, m: summe(es), r: summe(es, true) };
    }).filter(function (b) { return b.m > 0; });
    var ueber = L.ergebnisse.filter(function (e) { return !e.u.a.thema; });
    if (ueber.length) bereiche.push({ t: { titel: 'Verbindende Aufgaben', icon: '🔗' }, m: summe(ueber), r: summe(ueber, true) });
    var schwach = bereiche.filter(function (b) { return b.t.thema && b.r / b.m < 0.8; }).sort(function (a, b) { return a.r / a.m - b.r / b.m; })[0];
    var falsch = L.ergebnisse.filter(function (e) { return !e.richtig; });
    if (window.LERNWERK) LERNWERK.protokolliere({ fach: FACH.id, fachTitel: FACH.titel, thema: 'klassenarbeit', titel: 'Probe-Klassenarbeit', richtig: L.richtig, gesamt: L.beantwortet, geschafft: anteil >= 0.5, aufgaben: L.aufgaben });
    stand.xp += L.xp + 30;
    streakZaehlen();
    speichern();
    var gut = anteil >= 0.5;
    var html = (KZ ? '<div class="ende-katze">' + KZ.svg({ stimmung: gut ? 'froh' : 'troest', bewegung: gut ? 'huepf' : 'wiegen' }) + '</div>' : '') +
      '<h1 class="gold">Probe geschafft!</h1>' +
      '<div class="ka-ergebnis">' + halbe(L.be) + ' / ' + halbe(moeglich) + ' BE</div>' +
      '<p style="margin:6px 0 14px">' + Math.round(anteil * 100) + ' % richtig · ' + minuten + ' von ' + L.ka.dauer + ' Minuten</p>' +
      '<div class="werte"><span class="chip">⭐ +' + (L.xp + 30) + ' XP</span><span class="chip">🔥 ' + streakAktuell() + ' ' + (streakAktuell() === 1 ? 'Tag' : 'Tage') + '</span></div>' +
      (KZ ? KZ.neuHtml(KZ.aktualisiere()) : '') +
      '<section class="karte"><h2>Lernbereiche</h2>' + bereiche.map(function (b) {
        return '<div class="ka-bereich"><div class="zeile"><span>' + (b.t.icon || '') + ' ' + esc(b.t.titel) + '</span><b>' + halbe(b.r) + ' / ' + halbe(b.m) + ' BE</b></div><div class="ka-balken"><span style="width:' + Math.round(100 * b.r / b.m) + '%"></span></div></div>';
      }).join('') +
      (schwach ? '<p style="margin-top:6px">Am meisten bringt dir jetzt: <b>' + esc(schwach.t.titel) + '</b></p><button class="btn btn-gold btn-breit" id="ka-ueben" style="margin-top:10px">▶ ' + esc(schwach.t.titel) + ' üben</button>' : '<p style="margin-top:6px">Alle Lernbereiche sitzen gut. Stark!</p>') + '</section>' +
      (falsch.length ? '<section class="karte"><h2>Das schauen wir uns noch mal an</h2><ol class="ka-fehler">' + falsch.map(function (e) {
        var t = e.u.t, f = frageTexte(e.u);
        var loes = t.eingabe === 'richtig_falsch' ? (t.loesung ? 'richtig' : 'falsch') : t.antwort;
        var kurz = function (s) { return s.length > 140 ? s.slice(0, 140) + ' …' : s; };
        var frage = f.label ? kurz(f.haupt) + ' – ' + f.label : (f.kontext ? kurz(f.kontext) + ' – ' : '') + f.haupt;
        return '<li>' + mitBox(frage) + '<br><span class="richtig">✓ ' + esc(loes) + '</span>' + (e.u.a.weg ? '<br><span class="weg">So geht’s: ' + esc(e.u.a.weg) + '</span>' : '') + '</li>';
      }).join('') + '</ol></section>' : '') +
      (L.nurPapier.length ? '<p class="ka-hinweis">' + L.nurPapier.length + (L.nurPapier.length === 1 ? ' Aufgabe gibt' : ' Aufgaben gibt') + ' es nur auf Papier (z. B. ein Diagramm zeichnen). Sie zählen hier nicht mit.</p>' : '');
    app.innerHTML = '<div class="wrap ende">' + html + '<div class="stapel" style="margin-top:16px"><button class="btn btn-gold btn-breit" id="ka-nochmal">▶ Neue Probe</button>' +
      '<button class="btn btn-ghost btn-breit" id="ka-zurueck">Zur Klassenarbeit</button><button class="btn btn-ghost btn-breit" id="uebersicht">Zur Übersicht</button></div></div>';
    var themen = L.themen;
    document.getElementById('ka-nochmal').onclick = function () { starteKA(themen); };
    document.getElementById('ka-zurueck').onclick = klassenarbeitSeite;
    document.getElementById('uebersicht').onclick = uebersicht;
    var ueben = document.getElementById('ka-ueben');
    if (ueben) ueben.onclick = function () { starte(schwach.t); };
  }

  function merke(t) {
    window.scrollTo(0, 0);
    app.innerHTML = '<div class="wrap"><header class="kopf"><button class="zurueck" aria-label="Zurück">←</button><h1>' + t.icon + ' ' + esc(t.titel) + '</h1></header>' +
      '<section class="karte merke"><h2>Merke</h2>' + t.erklaerungHtml + '</section>' +
      '<button class="btn btn-gold btn-breit">▶ Los geht’s!</button></div>';
    app.querySelector('.zurueck').onclick = uebersicht;
    app.querySelector('.btn-gold').onclick = function () { starte(t); };
  }

  // ---------- Lektion ----------
  var L; // aktuelle Lektion

  // jede Instanz-Teilaufgabe wird eine Übung; „zeichnen“ gibt es nur auf Papier
  function uebungenFuer(t) {
    var seed = String(Date.now()) + Math.random();
    var liste = [];
    t.aufgaben.forEach(function (a) {
      if (a.nur === 'druck') return;
      var inst = LW.instanz(a, seed);
      if (inst.nur === 'druck') return;
      inst.teile.forEach(function (teil) {
        if (teil.eingabe === 'zeichnung') return;
        liste.push({ a: inst, t: teil });
      });
    });
    // gemischt, aber von leicht nach schwer
    liste = mischen(liste).sort(function (x, y) { return x.a.schwierigkeit - y.a.schwierigkeit; });
    if (liste.length > MAX_UEBUNGEN) {
      // aus jeder Aufgabe mindestens eine Übung behalten
      var proAufgabe = {};
      var auswahl = [];
      liste.forEach(function (u) { if (!proAufgabe[u.a.id]) { proAufgabe[u.a.id] = 1; auswahl.push(u); } });
      liste.forEach(function (u) { if (auswahl.length < MAX_UEBUNGEN && auswahl.indexOf(u) < 0) auswahl.push(u); });
      liste = auswahl.slice(0, MAX_UEBUNGEN).sort(function (x, y) { return x.a.schwierigkeit - y.a.schwierigkeit; });
    }
    return liste;
  }

  function starte(t) {
    L = { thema: t, uebungen: uebungenFuer(t), i: 0, herzen: HERZEN, fehler: 0, xp: 0, richtig: 0, beantwortet: 0, aufgaben: {} };
    zeigeUebung();
  }

  function frageTexte(u) {
    var a = u.a, t = u.t;
    if (t.frageWeb) return { haupt: t.frageWeb, kontext: '' };
    // Sachaufgabe: Aufgabentext oben, Teil als Beschriftung („Fahrzeit: ∎ h ∎ min“ → „Fahrzeit“)
    if (a.weg !== undefined) return { haupt: a.anweisung, kontext: '', label: t.text === 'Ergebnis' ? 'Deine Antwort' : t.text.replace(/\s*∎.*$/, '').replace(/:$/, '') };
    if (!t.text) return { haupt: a.anweisung, kontext: '' };
    return { haupt: t.text, kontext: a.anweisung };
  }

  function zeigeUebung() {
    window.scrollTo(0, 0);
    var u = L.uebungen[L.i];
    var f = frageTexte(u);
    var t = u.t;
    var koerper = '';
    if (u.a.daten && u.a.daten.zeigen === 'diagramm') koerper += diagrammSvg(u.a.daten);
    if (t.eingabe === 'zahl' || t.eingabe === 'wort') {
      koerper += (f.label ? '<label class="label" for="antwort">' + esc(f.label) + '</label>' : '') +
        (t.eingabe === 'zahl'
          ? (t.komma
            ? '<input id="antwort" class="eingabe" autocomplete="off" inputmode="decimal" placeholder="Zahl, z. B. 3,5">'
            : '<input id="antwort" class="eingabe" autocomplete="off" inputmode="numeric" placeholder="Zahl eingeben">')
          // Zahlwörter sind lang: mehrzeilig, damit das ganze Wort sichtbar bleibt
          : '<textarea id="antwort" class="eingabe wortfeld" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Als Wort schreiben"></textarea>');
    } else if (t.eingabe === 'felder') {
      // 217 min = ∎ h ∎ min: ein Feld je Einheit
      koerper += (f.label ? '<p class="label">' + esc(f.label) + '</p>' : '') + '<div class="felder">' + t.felder.map(function (e, i) {
        return '<label class="feld"><input class="eingabe" data-i="' + i + '" autocomplete="off" inputmode="numeric" aria-label="' + esc(e) + '"><span class="einheit">' + esc(e) + '</span></label>';
      }).join('') + '</div>';
    } else if (t.eingabe === 'wahl' || t.eingabe === 'richtig_falsch' || t.eingabe === 'begruendung') {
      // Begründung: auf Papier frei geschrieben, hier die passende Erklärung wählen
      var opts = t.eingabe === 'richtig_falsch' ? ['richtig', 'falsch'] : t.optionen;
      var zeichen = opts.every(function (o) { return String(o).length <= 2; });
      var spalten = zeichen && opts.length === 3 ? ' drei' : opts.length <= 4 && (zeichen || t.eingabe === 'richtig_falsch') ? ' zwei' : '';
      koerper += (f.label ? '<p class="label">' + esc(f.label) + '</p>' : '') + '<div class="optionen' + spalten + '">' + opts.map(function (o) {
        var anzeige = t.eingabe === 'richtig_falsch' ? (o === 'richtig' ? '✓ richtig' : '✗ falsch') : o;
        return '<button class="option' + (zeichen ? ' zeichen' : '') + '" data-wert="' + esc(o) + '">' + esc(anzeige) + '</button>';
      }).join('') + '</div>';
    } else if (t.eingabe === 'paare') {
      var links = mischen(t.paare.map(function (p) { return p[0]; }));
      var rechts = mischen(t.paare.map(function (p) { return p[1]; }));
      koerper += '<div class="paare">' + links.map(function (l, i) {
        var gross = function (w) { return String(w).length <= 2 ? ' zeichen' : ''; };
        return '<button class="option' + gross(l) + '" data-seite="l" data-wert="' + esc(l) + '">' + esc(l) + '</button><button class="option' + gross(rechts[i]) + '" data-seite="r" data-wert="' + esc(rechts[i]) + '">' + esc(rechts[i]) + '</button>';
      }).join('') + '</div>';
    }
    var lang = f.haupt.length > 90;
    var ka = L.modus === 'ka';
    app.innerHTML = '<div class="lektion">' +
      '<div class="lektion-kopf"><button class="schliessen" aria-label="' + (ka ? 'Probe beenden' : 'Übung beenden') + '">✕</button>' +
      '<div class="fortschritt" role="progressbar" aria-valuemin="0" aria-valuemax="' + L.uebungen.length + '" aria-valuenow="' + L.i + '"><span style="width:' + (100 * L.i / L.uebungen.length) + '%"></span></div>' +
      (ka ? '<span class="ka-uhr" id="ka-uhr"></span>' : '<span class="herzen" aria-label="' + L.herzen + ' Herzen">♥ ' + L.herzen + '</span>') + '</div>' +
      '<main class="uebung">' + (ka ? '<p class="ka-nr">Aufgabe ' + u.nr + (u.teil ? ' ' + esc(u.teil) : '') + ' · ' + u.a.be + ' BE</p>' : '') +
      (f.kontext ? '<p class="kontext">' + mitBox(f.kontext) + '</p>' : '') +
      '<p class="frage' + (lang ? ' lang' : '') + '">' + mitBox(f.haupt) + '</p>' + koerper + '</main>' +
      '<div class="leiste" id="leiste"><div class="leiste-innen"><button class="btn btn-gold btn-breit" id="pruefen" disabled>' + (ka ? 'Weiter' : 'Prüfen') + '</button>' +
      (ka ? '<button class="btn btn-ghost ka-ueberspringen" id="ka-skip">Weiß ich nicht – weiter</button>' : '') + '</div></div></div>';

    if (ka) {
      uhrZeigen();
      document.getElementById('ka-skip').onclick = function () { kaAntwort({ richtig: false }, u); };
    }
    app.querySelector('.schliessen').onclick = function () {
      if (!ka) { if (confirm('Übung wirklich beenden? Der Fortschritt dieser Übung geht verloren.')) uebersicht(); return; }
      if (confirm('Probe-Klassenarbeit beenden? Sie wird nicht ausgewertet.')) { clearInterval(kaUhr); klassenarbeitSeite(); }
    };
    var pruefen = document.getElementById('pruefen');
    var gewaehlt = null;
    var feld = document.getElementById('antwort');
    if (feld) {
      feld.focus();
      feld.addEventListener('input', function () { pruefen.disabled = !feld.value.trim(); });
      feld.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (feld.value.trim()) pruefen.click();
      });
    }
    app.querySelectorAll('.optionen .option').forEach(function (b) {
      b.onclick = function () {
        app.querySelectorAll('.optionen .option').forEach(function (x) { x.classList.remove('gewaehlt'); });
        b.classList.add('gewaehlt');
        gewaehlt = b.dataset.wert;
        pruefen.disabled = false;
      };
    });
    var felder = [].slice.call(app.querySelectorAll('.felder input'));
    felder.forEach(function (f, i) {
      f.addEventListener('input', function () { pruefen.disabled = felder.some(function (x) { return !x.value.trim(); }); });
      f.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (i < felder.length - 1) felder[i + 1].focus(); else if (!pruefen.disabled) pruefen.click();
      });
    });
    if (felder.length) felder[0].focus();
    if (t.eingabe === 'paare') paareSpielen(t);
    pruefen.onclick = function () {
      var ergebnis = felder.length ? bewerte(t, felder.map(function (f) { return f.value; }))
        : feld ? bewerte(t, feld.value) : bewerte(t, gewaehlt);
      if (ka) return kaAntwort(ergebnis, u); // Klassenarbeit: keine Auflösung zwischendurch
      if (feld) feld.disabled = true;
      felder.forEach(function (f) { f.disabled = true; });
      app.querySelectorAll('.optionen .option').forEach(function (b) {
        b.disabled = true;
        if (b.dataset.wert === String(t.eingabe === 'richtig_falsch' ? (t.loesung ? 'richtig' : 'falsch') : t.loesung)) b.classList.add('richtig');
        else if (b.dataset.wert === gewaehlt) b.classList.add('falsch');
      });
      rueckmeldung(ergebnis, u);
    };
  }

  function paareSpielen(t) {
    var richtig = {};
    t.paare.forEach(function (p) { richtig[p[0]] = p[1]; });
    var links = null, fertig = 0, fehlerGemacht = false;
    app.querySelectorAll('.paare .option').forEach(function (b) {
      b.onclick = function () {
        if (b.classList.contains('fertig')) return;
        if (b.dataset.seite === 'l') {
          app.querySelectorAll('.paare [data-seite="l"]').forEach(function (x) { x.classList.remove('gewaehlt'); });
          b.classList.add('gewaehlt');
          links = b;
          return;
        }
        if (!links) return;
        if (richtig[links.dataset.wert] === b.dataset.wert) {
          links.classList.remove('gewaehlt');
          links.classList.add('fertig'); b.classList.add('fertig');
          links.disabled = b.disabled = true;
          links = null;
          if (++fertig === t.paare.length) rueckmeldung({ richtig: !fehlerGemacht }, L.uebungen[L.i]);
        } else {
          fehlerGemacht = true;
          b.classList.add('wackeln'); setTimeout(function () { b.classList.remove('wackeln'); }, 300);
        }
      };
    });
    document.getElementById('pruefen').classList.add('versteckt');
  }

  function bewerte(t, eingabe) {
    if (t.eingabe === 'zahl') {
      var soll = Number(t.loesung);
      // bei Kommazahlen zählt auch "3.5" (Handy-Tastatur ohne Komma)
      return { richtig: LW.gleich(LW.parseZahl(eingabe, !Number.isInteger(soll)), soll) };
    }
    if (t.eingabe === 'felder') {
      return { richtig: t.loesung.every(function (w, i) { return LW.gleich(LW.parseZahl(eingabe[i]), w); }) };
    }
    if (t.eingabe === 'wort') {
      var a = normWort(eingabe), b = normWort(t.loesung);
      if (a === b) return { richtig: true };
      if (b.length > 8 && abstand(a, b) === 1) return { richtig: true, hinweis: 'Fast perfekt! Achte auf die Schreibweise: ' + t.antwort };
      return { richtig: false };
    }
    if (t.eingabe === 'richtig_falsch') return { richtig: (eingabe === 'richtig') === t.loesung };
    return { richtig: String(eingabe) === String(t.loesung) };
  }

  var LOB = ['Richtig!', 'Super!', 'Klasse!', 'Genau!', 'Stark!', 'Prima!'];
  function rueckmeldung(erg, u) {
    if (L.modus === 'ka') return kaAntwort(erg, u); // Zuordnung meldet sich selbst, sobald alle Paare stehen
    var leiste = document.getElementById('leiste');
    if (erg.richtig) { L.xp += 10; L.richtig++; } else { L.herzen--; L.fehler++; }
    // fürs Lernprotokoll: Ergebnis je Aufgabe der Inhaltsdatei (Bezeichnung, sonst die Arbeitsanweisung)
    L.beantwortet++;
    var pa = L.aufgaben[u.a.id] = L.aufgaben[u.a.id] || { l: String(u.a.bezeichnung || u.a.anweisung).slice(0, 80), r: 0, f: 0 };
    if (erg.richtig) pa.r++; else pa.f++;
    var erklaer = '';
    if (erg.hinweis) erklaer = erg.hinweis;
    else if (!erg.richtig) erklaer = 'Richtige Lösung: <b>' + esc(u.t.eingabe === 'richtig_falsch' ? (u.t.loesung ? 'richtig' : 'falsch') : u.t.antwort) + '</b>';
    if (!erg.richtig && u.a.weg) erklaer += '<br>So geht’s: ' + esc(u.a.weg);
    leiste.className = 'leiste ' + (erg.richtig ? 'ok' : 'fehler');
    var katze = erg.richtig ? katzeMit('froh', 'froh', 'huepf')
      : katzeMit('troest', L.herzen === 1 ? 'letztesHerz' : 'troest', 'wiegen');
    leiste.innerHTML = '<div class="leiste-innen" role="status"><div class="leiste-kopf"><div><p class="meldung">' + (erg.richtig ? '✓ ' + LOB[Math.floor(Math.random() * LOB.length)] : '✗ Nicht ganz.') + '</p>' +
      (erklaer ? '<p class="erklaer">' + erklaer + '</p>' : '') + '</div>' + katze + '</div><button class="btn btn-gold btn-breit" id="weiter">Weiter</button></div>';
    app.querySelector('.herzen').textContent = '♥ ' + L.herzen;
    var weiter = document.getElementById('weiter');
    weiter.focus();
    weiter.onclick = function () {
      if (L.herzen <= 0) return ende(false);
      L.i++;
      if (L.i >= L.uebungen.length) return ende(true);
      zeigeUebung();
    };
  }

  function ende(geschafft) {
    window.scrollTo(0, 0);
    var t = L.thema;
    var html;
    if (window.LERNWERK) LERNWERK.protokolliere({ fach: FACH.id, fachTitel: FACH.titel, thema: t.thema, titel: t.titel, richtig: L.richtig, gesamt: L.beantwortet, geschafft: geschafft, aufgaben: L.aufgaben });
    if (geschafft) {
      var st = L.fehler === 0 ? 3 : L.fehler <= 2 ? 2 : 1;
      var bonus = 20 + (L.fehler === 0 ? 10 : 0);
      var gewinn = L.xp + bonus;
      var ts = themaStand(t.thema);
      ts.lektionen++; ts.sterne = Math.max(ts.sterne, st); ts.letzte = tag();
      stand.xp += gewinn;
      streakZaehlen();
      speichern();
      var wissen = t.wissenswertes && t.wissenswertes.length ? t.wissenswertes[Math.floor(Math.random() * t.wissenswertes.length)] : '';
      html = (KZ ? '<div class="ende-katze">' + KZ.svg({ stimmung: 'froh', bewegung: 'huepf' }) + '</div>' : '<div class="gross" aria-hidden="true">' + (st === 3 ? '🏆' : '🎉') + '</div>') +
        '<h1 class="gold">Geschafft!</h1>' + (KZ ? '<p class="katze-zeile">' + esc(KZ.spruch(st === 3 ? 'perfekt' : 'geschafft')) + '</p>' : '') +
        '<div class="sterne" aria-label="' + st + ' von 3 Sternen">' + sterne(st) + '</div>' +
        '<div class="werte"><span class="chip">⭐ +' + gewinn + ' XP</span><span class="chip">🔥 ' + streakAktuell() + ' ' + (streakAktuell() === 1 ? 'Tag' : 'Tage') + '</span></div>' +
        (KZ ? KZ.neuHtml(KZ.aktualisiere()) : '') +
        (wissen ? '<section class="karte wissen"><h2>Wusstest du schon?</h2><p>' + esc(wissen) + '</p></section>' : '');
    } else {
      html = (KZ ? '<div class="ende-katze">' + KZ.svg({ stimmung: 'troest', bewegung: 'wiegen' }) + '</div>' : '<div class="gross" aria-hidden="true">💪</div>') +
        '<h1>Keine Herzen mehr</h1><p style="margin:8px 0 24px">' + (KZ ? esc(KZ.spruch('verloren')) + ' ' : 'Das war schwer – aber Üben macht stark! ') + 'Schau dir das Merke an und versuch es noch einmal.</p>';
    }
    app.innerHTML = '<div class="wrap ende">' + html + '<div class="stapel"><button class="btn btn-gold btn-breit" id="nochmal">' + (geschafft ? '▶ Nochmal üben' : '▶ Nochmal versuchen') + '</button>' +
      (geschafft ? '' : '<button class="btn btn-ghost btn-breit" id="merke">💡 Merke ansehen</button>') +
      '<button class="btn btn-ghost btn-breit" id="uebersicht">Zur Übersicht</button></div></div>';
    document.getElementById('nochmal').onclick = function () { starte(t); };
    document.getElementById('uebersicht').onclick = uebersicht;
    var m = document.getElementById('merke'); if (m) m.onclick = function () { merke(t); };
  }

  // ---------- Export / Import ----------
  function exportieren() {
    var blob = new Blob([JSON.stringify(stand, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lernwerk-lernstand-' + tag() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importieren(e) {
    var datei = e.target.files[0];
    if (!datei) return;
    datei.text().then(function (text) {
      var neu = JSON.parse(text);
      if (!neu || neu.version !== 1 || typeof neu.xp !== 'number' || typeof neu.themen !== 'object') throw new Error('Format');
      if (!confirm('Lernstand aus der Datei übernehmen? Der aktuelle Stand auf diesem Gerät wird ersetzt.')) return;
      stand = neu; speichern(); uebersicht();
    }).catch(function () { alert('Diese Datei ist kein LERNWERK-Lernstand.'); });
  }

  // Testzugang für den automatischen Mobil-Test (liest nur die aktuelle Lösung)
  window.LERNWERK_TEST = { loesung: function () { var u = L && L.uebungen[L.i]; return u && u.t; } };

  // Rückkehr von der Druckseite (klassenarbeit.html → ./#klassenarbeit) landet wieder auf der Klassenarbeit
  if (location.hash === '#klassenarbeit' && kaThemen().length) klassenarbeitSeite();
  else uebersicht();
})();
