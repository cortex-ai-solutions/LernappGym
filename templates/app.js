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
        '<div class="reihe-druck"><a class="btn btn-ghost" data-rolle="blatt" target="_blank" rel="noopener"></a><a class="btn btn-ghost" data-rolle="loesung" target="_blank" rel="noopener"></a>' +
        '<button class="btn btn-ghost btn-neu" data-aktion="neues-blatt" aria-label="Anderes Arbeitsblatt" title="Anderes Arbeitsblatt">↻</button></div>' +
        '</article>';
    }).join('');
    app.innerHTML = '<div class="wrap">' +
      '<header class="kopf"><a class="zurueck" href="../" aria-label="Zur Fächerwahl">←</a><h1 class="gold">' + esc(FACH.titel) + '</h1>' +
      '<div class="chips"><span class="chip" title="Tage in Folge">🔥 ' + streakAktuell() + '</span><span class="chip" title="Erfahrungspunkte">⭐ ' + stand.xp + '</span></div></header>' +
      '<section class="katze-karte" id="katze-karte" hidden></section>' +
      karten +
      '<footer class="fuss"><button class="btn btn-ghost btn-breit" data-aktion="bericht">📤 Bericht an deine Eltern</button><p>Dein Lernstand bleibt auf diesem Gerät.</p><div class="reihe"><button class="btn btn-ghost" data-aktion="export">Lernstand sichern</button><label class="btn btn-ghost">Lernstand laden<input type="file" accept="application/json" class="versteckt" id="import"></label></div></footer></div>';
    app.querySelectorAll('[data-aktion]').forEach(function (b) {
      b.addEventListener('click', function () {
        var karte = b.closest('[data-thema]');
        var t = karte && FACH.themen.find(function (x) { return x.thema === karte.dataset.thema; });
        if (b.dataset.aktion === 'ueben') starte(t);
        else if (b.dataset.aktion === 'merke') merke(t);
        else if (b.dataset.aktion === 'neues-blatt') {
          themaStand(t.thema).blatt = (blattNr(t) + 1) % t.blaetter.length;
          speichern();
          zeigeBlatt(karte, t);
        }
        else if (b.dataset.aktion === 'export') exportieren();
        else if (b.dataset.aktion === 'bericht') LERNWERK.senden('../');
      });
    });
    app.querySelectorAll('[data-thema]').forEach(function (karte) {
      zeigeBlatt(karte, FACH.themen.find(function (x) { return x.thema === karte.dataset.thema; }));
    });
    document.getElementById('import').addEventListener('change', importieren);
    katzeKarte();
  }

  // Lernkatze (templates/katze.js): begrüßt in der Übersicht, „Anpassen“ öffnet den Kleiderschrank
  var KZ = window.KATZE;
  function katzeKarte() {
    var kk = document.getElementById('katze-karte');
    if (!KZ || !kk || !KZ.lies().name) return;
    kk.hidden = false;
    kk.innerHTML = KZ.svg({ stimmung: 'hallo' }) + '<div><b>' + esc(KZ.name()) + '</b><p>' + esc(KZ.spruch('hallo')) + '</p>' +
      '<button class="btn btn-ghost">🎨 Anpassen</button></div>';
    kk.querySelector('button').onclick = function () { KZ.anpassen(); };
  }
  window.addEventListener('katze-geaendert', katzeKarte);
  function katzeMit(stimmung, art, bewegung) {
    if (!KZ) return '';
    return '<div class="katze-sagt">' + KZ.svg({ stimmung: stimmung, bewegung: bewegung }) + '<p>„' + esc(KZ.spruch(art)) + '“</p></div>';
  }

  // Arbeitsblatt-Vorrat: 🔄 schaltet zur nächsten Variante, Blatt und Lösung tragen denselben Buchstaben
  function blattNr(t) { return (themaStand(t.thema).blatt || 0) % t.blaetter.length; }
  function zeigeBlatt(karte, t) {
    var b = t.blaetter[blattNr(t)];
    var blatt = karte.querySelector('[data-rolle="blatt"]'), loesung = karte.querySelector('[data-rolle="loesung"]');
    blatt.href = b.blatt; blatt.textContent = '🖨 Blatt ' + b.variante;
    loesung.href = b.loesung; loesung.textContent = '✓ Lösung ' + b.variante;
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
    if (a.weg !== undefined) return { haupt: a.anweisung, kontext: '', label: t.text === 'Ergebnis' ? 'Deine Antwort' : t.text };
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
      koerper += '<div class="felder">' + t.felder.map(function (e, i) {
        return '<label class="feld"><input class="eingabe" data-i="' + i + '" autocomplete="off" inputmode="numeric" aria-label="' + esc(e) + '"><span class="einheit">' + esc(e) + '</span></label>';
      }).join('') + '</div>';
    } else if (t.eingabe === 'wahl' || t.eingabe === 'richtig_falsch') {
      var opts = t.eingabe === 'richtig_falsch' ? ['richtig', 'falsch'] : t.optionen;
      var zeichen = opts.every(function (o) { return String(o).length <= 2; });
      var spalten = zeichen && opts.length === 3 ? ' drei' : opts.length <= 4 && (zeichen || t.eingabe === 'richtig_falsch') ? ' zwei' : '';
      koerper += '<div class="optionen' + spalten + '">' + opts.map(function (o) {
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
    app.innerHTML = '<div class="lektion">' +
      '<div class="lektion-kopf"><button class="schliessen" aria-label="Übung beenden">✕</button>' +
      '<div class="fortschritt" role="progressbar" aria-valuemin="0" aria-valuemax="' + L.uebungen.length + '" aria-valuenow="' + L.i + '"><span style="width:' + (100 * L.i / L.uebungen.length) + '%"></span></div>' +
      '<span class="herzen" aria-label="' + L.herzen + ' Herzen">♥ ' + L.herzen + '</span></div>' +
      '<main class="uebung">' + (f.kontext ? '<p class="kontext">' + mitBox(f.kontext) + '</p>' : '') +
      '<p class="frage' + (lang ? ' lang' : '') + '">' + mitBox(f.haupt) + '</p>' + koerper + '</main>' +
      '<div class="leiste" id="leiste"><div class="leiste-innen"><button class="btn btn-gold btn-breit" id="pruefen" disabled>Prüfen</button></div></div></div>';

    app.querySelector('.schliessen').onclick = function () { if (confirm('Übung wirklich beenden? Der Fortschritt dieser Übung geht verloren.')) uebersicht(); };
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

  uebersicht();
})();
