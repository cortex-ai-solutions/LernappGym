/* LERNWERK – die Lernkatze. Eigene Figur nach dem Familienkater Maurice (keine fremde Comicfigur).
   Sie wird als SVG gezeichnet; Name, Fell, Augen, Decke, Kopf- und Halsteil wählt das Kind im Kleiderschrank.
   Manche Teile und die Bilder im Katzenalbum werden durchs Lernen freigeschaltet, Gold-Bilder über den
   Belohnungscode auf dem Lösungsblatt. Alles bleibt auf dem Gerät.
   Braucht LERNWERK (templates/lernwerk.js) für Dialoge und window.KATZE_DATEN aus dem Build (Themen, Codes). */
(function () {
  'use strict';
  var SPEICHER = 'lernwerk_katze_v1';
  var LINIE = '#1d1512', STICKER = '#f6eedf', ROSA = '#e8919d', GOLD = '#E8C97D', GOLD_DUNKEL = '#8B6914';
  var DATEN = window.KATZE_DATEN || { themen: [], codes: {} };

  // ---------- Auswahl im Kleiderschrank ----------
  // Neue Einträge einfach anhängen; der erste ist jeweils der Standard.
  var FELLE = {
    hell: { titel: 'Maurice hell', fell: '#5c4b42', streifen: '#937d6c', bauch: '#6e5b50', zeichnung: '#f1e4d3' },
    dunkel: { titel: 'Maurice dunkel', fell: '#3b302c', streifen: '#7a6656', bauch: '#4b3e37', zeichnung: '#f1e4d3' },
    grau: { titel: 'Grau getigert', fell: '#9d9ca6', streifen: '#6c6b78', bauch: '#c2c1c9', zeichnung: '#2b2a33' },
    rot: { titel: 'Rot getigert', fell: '#e09a5c', streifen: '#b8692e', bauch: '#f2c696', zeichnung: '#4a2a14' },
    creme: { titel: 'Creme', fell: '#f0dcc0', streifen: '#d4b089', bauch: '#faefdf', zeichnung: '#4a3426' },
  };
  var AUGEN = {
    gelbgruen: { titel: 'Gelbgrün', farbe: '#c6c95a' },
    gruen: { titel: 'Grün', farbe: '#6fbf6a' },
    blau: { titel: 'Blau', farbe: '#7fb7e6' },
    bernstein: { titel: 'Bernstein', farbe: '#e3a43c' },
  };
  var DECKEN = {
    aus: { titel: 'Keine' },
    creme: { titel: 'Creme', farbe: '#efe3cc', rand: '#bfae8a', falte: '#d9c9a6' },
    rosa: { titel: 'Rosa', farbe: '#f6c9d3', rand: '#d68fa0', falte: '#eab0bf' },
    blau: { titel: 'Hellblau', farbe: '#cfe3f2', rand: '#8fb2cc', falte: '#b3cfe4' },
    punkte: { titel: 'Pünktchen', farbe: '#efe3cc', rand: '#bfae8a', falte: '#d9c9a6', punkte: '#e8919d' },
  };
  // Kopf- und Halsteile: frei = sofort da, sonst bedingung(erfolge) und hinweis, wie man es bekommt.
  // rand = Umriss für den Sticker-Rand (ohne eigene Füllung), bild = das Teil selbst.
  var KOPF = {
    aus: { titel: 'Nichts', icon: '–', frei: true },
    schleife: { titel: 'Schleife', icon: '🎀', frei: true,
      rand: '<path d="M132 46 L113 33 L113 59 Z M132 46 L151 33 L151 59 Z"/>',
      bild: '<path d="M132 46 L113 33 L113 59 Z M132 46 L151 33 L151 59 Z" fill="#e0607a" stroke="' + LINIE + '" stroke-width="2.5" stroke-linejoin="round"/><circle cx="132" cy="46" r="5.5" fill="#c84a64" stroke="' + LINIE + '" stroke-width="2"/>' },
    bluemchen: { titel: 'Blümchen', icon: '🌼', frei: true, rand: '<circle cx="66" cy="48" r="15"/>', bild: bluemchen() },
    muetze: { titel: 'Pudelmütze', icon: '🧶', hinweis: '3 Tage hintereinander üben', bedingung: function (e) { return e.streak >= 3; },
      rand: '<path d="M42 72 Q42 12 100 10 Q158 12 158 72 Z"/><circle cx="100" cy="10" r="12"/>',
      bild: '<path d="M46 66 Q46 14 100 12 Q154 14 154 66 Z" fill="#d9534f" stroke="' + LINIE + '" stroke-width="3"/>' +
        '<path d="M55 40 Q100 26 145 40 M50 52 Q100 38 150 52" fill="none" stroke="#f6eedf" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="42" y="58" width="116" height="16" rx="8" fill="#f6eedf" stroke="' + LINIE + '" stroke-width="3"/><circle cx="100" cy="11" r="10" fill="#f6eedf" stroke="' + LINIE + '" stroke-width="3"/>' },
    zauberhut: { titel: 'Zauberhut', icon: '🪄', hinweis: '7 Tage hintereinander üben', bedingung: function (e) { return e.streak >= 7; },
      rand: '<path d="M58 62 L104 -8 L142 62 Z"/><ellipse cx="100" cy="60" rx="52" ry="12"/>',
      bild: '<path d="M64 58 L104 -5 L136 58 Z" fill="#6b4fa0" stroke="' + LINIE + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<ellipse cx="100" cy="59" rx="48" ry="10" fill="#5a3f8c" stroke="' + LINIE + '" stroke-width="3"/>' + stern(98, 30, 6, '#F0D9A0') + stern(114, 46, 4.5, '#F0D9A0') },
    lorbeer: { titel: 'Lorbeerkranz', icon: '🌿', hinweis: 'Eine Latein-Einheit schaffen', bedingung: function (e) { return e.latein >= 1; },
      rand: '<path d="M46 84 Q46 34 100 38 Q154 34 154 84" fill="none" stroke-width="18"/>', bild: lorbeer() },
    krone: { titel: 'Krone', icon: '👑', hinweis: 'Belohnungscode für ein Arbeitsblatt mit voller Punktzahl einlösen', bedingung: function (e) { return e.codes >= 1; },
      rand: '<path d="M70 54 L70 20 L85 34 L100 14 L115 34 L130 20 L130 54 Z"/>',
      bild: '<path d="M70 54 L70 22 L85 36 L100 16 L115 36 L130 22 L130 54 Z" fill="' + GOLD + '" stroke="' + GOLD_DUNKEL + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<circle cx="85" cy="46" r="3.5" fill="#e0607a"/><circle cx="100" cy="44" r="4" fill="#7fb7e6"/><circle cx="115" cy="46" r="3.5" fill="#e0607a"/>' },
  };
  var BAND = 'M60 120 Q100 140 140 120 L142 131 Q100 151 58 131 Z';
  var HALS = {
    aus: { titel: 'Nichts', icon: '–', frei: true },
    goldtuch: { titel: 'Goldtuch', icon: '✨', frei: true,
      rand: '<path d="' + BAND + '"/><path d="M118 134 L131 160 L114 157 Z"/>',
      bild: '<path d="' + BAND + '" fill="#C9A84C" stroke="' + GOLD_DUNKEL + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M118 134 L130 158 L116 155 Z" fill="#C9A84C" stroke="' + GOLD_DUNKEL + '" stroke-width="2.5" stroke-linejoin="round"/>' },
    gloeckchen: { titel: 'Glöckchen', icon: '🔔', hinweis: '10 Übungen schaffen', bedingung: function (e) { return e.lektionen >= 10; },
      rand: '<path d="M62 122 Q100 142 138 122" fill="none" stroke-width="16"/><circle cx="100" cy="139" r="12"/>',
      bild: '<path d="M62 122 Q100 142 138 122" fill="none" stroke="#c0392b" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="100" cy="139" r="7.5" fill="' + GOLD + '" stroke="' + GOLD_DUNKEL + '" stroke-width="2"/><path d="M96 141 h8" stroke="' + GOLD_DUNKEL + '" stroke-width="2" stroke-linecap="round"/>' },
    schal: { titel: 'Ringelschal', icon: '🧣', hinweis: '3 Sterne in einem Thema', bedingung: function (e) { return e.dreiSterne >= 1; },
      rand: '<path d="' + BAND + '"/><path d="M106 134 L116 132 L126 162 L112 166 Z"/>', bild: schal() },
  };
  // Album: ein Requisit je Thema. Kommt ein Thema dazu, hier ein Motiv eintragen (ein Test prüft das).
  var MOTIV = {
    'mathematik/grosse-zahlen': 'schild', 'mathematik/runden': 'zielscheibe', 'mathematik/grundrechenarten': 'tafel',
    'mathematik/sachaufgaben': 'buch', 'mathematik/daten-diagramme': 'diagramm', 'mathematik/laengen-massen': 'lineal',
    'mathematik/zeit': 'uhr', 'mathematik/kommazahlen': 'komma',
  };
  var REQUISITEN = {
    herz: '<path d="M100 172 C76 156 78 136 92 138 C97 139 100 144 100 147 C100 144 103 139 108 138 C122 136 124 156 100 172 Z" fill="#e0607a" stroke="' + LINIE + '" stroke-width="2.5" stroke-linejoin="round"/>',
    schild: '<rect x="58" y="134" width="84" height="32" rx="6" fill="#f6eedf" stroke="' + GOLD_DUNKEL + '" stroke-width="3"/><text x="100" y="155.5" text-anchor="middle" font-size="13" font-weight="700" fill="#5a3e00" font-family="system-ui,sans-serif">1 000 000</text>',
    zielscheibe: '<circle cx="100" cy="150" r="22" fill="#e0607a" stroke="' + LINIE + '" stroke-width="2.5"/><circle cx="100" cy="150" r="15" fill="#f6eedf"/><circle cx="100" cy="150" r="8.5" fill="#e0607a"/><circle cx="100" cy="150" r="3" fill="#f6eedf"/>',
    tafel: '<rect x="60" y="132" width="80" height="36" rx="4" fill="#2f5d50" stroke="' + GOLD_DUNKEL + '" stroke-width="3"/><text x="100" y="156" text-anchor="middle" font-size="17" font-weight="700" fill="#f6eedf" font-family="system-ui,sans-serif">+ − · :</text>',
    buch: '<path d="M100 140 Q84 132 64 136 L64 166 Q84 162 100 170 Z M100 140 Q116 132 136 136 L136 166 Q116 162 100 170 Z" fill="#f6eedf" stroke="' + LINIE + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M72 145 Q84 142 94 147 M72 153 Q84 150 94 155 M106 147 Q116 142 128 145 M106 155 Q116 150 128 153" fill="none" stroke="#b8a888" stroke-width="2" stroke-linecap="round"/>',
    diagramm: '<rect x="60" y="132" width="80" height="36" rx="4" fill="#f6eedf" stroke="' + GOLD_DUNKEL + '" stroke-width="3"/>' +
      '<rect x="71" y="152" width="10" height="12" fill="#7fb7e6"/><rect x="87" y="144" width="10" height="20" fill="#e0607a"/><rect x="103" y="138" width="10" height="26" fill="#C9A84C"/><rect x="119" y="148" width="10" height="16" fill="#6fbf6a"/>' +
      '<path d="M66 164 H134" stroke="' + LINIE + '" stroke-width="2"/>',
    lineal: (function () {
      var t = '';
      for (var i = 0; i <= 12; i++) t += '<path d="M' + (54 + i * 7.6) + ' 146 v' + (i % 5 === 0 ? 7 : 4) + '" stroke="' + GOLD_DUNKEL + '" stroke-width="1.6"/>';
      return '<g transform="rotate(-6 100 154)"><rect x="48" y="146" width="104" height="17" rx="3" fill="#F0D9A0" stroke="' + GOLD_DUNKEL + '" stroke-width="2.5"/>' + t + '</g>';
    })(),
    uhr: '<circle cx="100" cy="150" r="22" fill="#f6eedf" stroke="' + GOLD_DUNKEL + '" stroke-width="3"/><path d="M100 131 v4 M100 165 v4 M81 150 h4 M115 150 h4" stroke="' + GOLD_DUNKEL + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M100 150 V136 M100 150 L110 155" stroke="' + LINIE + '" stroke-width="2.6" stroke-linecap="round"/><circle cx="100" cy="150" r="2.5" fill="' + LINIE + '"/>',
    komma: '<circle cx="100" cy="150" r="22" fill="' + GOLD + '" stroke="' + GOLD_DUNKEL + '" stroke-width="3"/><text x="100" y="157" text-anchor="middle" font-size="19" font-weight="700" fill="#5a3e00" font-family="system-ui,sans-serif">0,5</text>',
    stern: stern(100, 150, 24, GOLD, GOLD_DUNKEL),
  };

  // ---------- Speicher ----------
  function roh() { try { return JSON.parse(localStorage.getItem(SPEICHER)) || {}; } catch (e) { return {}; } }
  function liste(x) { return Array.isArray(x) ? x.filter(function (v) { return typeof v === 'string'; }) : []; }
  function lies() {
    var k = roh();
    var frei = liste(k.frei);
    function teil(tabelle, art, wert) { return tabelle[wert] && (tabelle[wert].frei || frei.indexOf(art + ':' + wert) >= 0) ? wert : 'aus'; }
    return {
      name: typeof k.name === 'string' ? k.name : '',
      fell: FELLE[k.fell] ? k.fell : 'hell',
      augen: AUGEN[k.augen] ? k.augen : 'gelbgruen',
      decke: DECKEN[k.decke] ? k.decke : 'aus',
      kopf: teil(KOPF, 'kopf', k.kopf),
      hals: teil(HALS, 'hals', k.hals),
      frei: frei, gesehen: liste(k.gesehen), codes: liste(k.codes),
    };
  }
  function ablegen(k) { try { localStorage.setItem(SPEICHER, JSON.stringify(k)); } catch (e) { /* privater Modus */ } }
  function schreib(k) { ablegen(k); window.dispatchEvent(new Event('katze-geaendert')); }
  function name() { return lies().name || 'Deine Katze'; }

  // ---------- Erfolge und Freischalten ----------
  function json(schluessel) { try { return JSON.parse(localStorage.getItem(schluessel)); } catch (e) { return null; } }
  function erfolge(k) {
    var m = json('lernwerk_v1') || {}, th = m.themen || {}, la = json('latina_state') || {};
    var e = { streak: (m.streak && m.streak.tage) || 0, lektionen: 0, dreiSterne: 0, sterne: {}, gold: {}, latein: Array.isArray(la.completedLessons) ? la.completedLessons.length : 0, codes: k.codes.length };
    Object.keys(th).forEach(function (id) {
      e.lektionen += th[id].lektionen || 0;
      e.sterne[id] = th[id].sterne || 0;
      if (th[id].sterne >= 3) e.dreiSterne++;
    });
    k.codes.forEach(function (c) { e.gold[c.split('/').slice(0, 2).join('/')] = true; });
    return e;
  }
  // alles, was man sich bisher verdient hat: kopf:…, hals:…, motiv:<fach/thema>:1|3|gold
  function verdient(k) {
    var e = erfolge(k), ids = [];
    [['kopf', KOPF], ['hals', HALS]].forEach(function (p) {
      Object.keys(p[1]).forEach(function (id) { if (p[1][id].bedingung && p[1][id].bedingung(e)) ids.push(p[0] + ':' + id); });
    });
    DATEN.themen.forEach(function (t) {
      var id = t.fach + '/' + t.thema;
      if (e.sterne[id] >= 1) ids.push('motiv:' + id + ':1');
      if (e.sterne[id] >= 3) ids.push('motiv:' + id + ':3');
      if (e.gold[id]) ids.push('motiv:' + id + ':gold');
    });
    return ids;
  }
  // Neu Verdientes merken; gibt die neuen ids zurück (für „Neu freigeschaltet!“)
  function aktualisiere() {
    var k = lies();
    var neu = verdient(k).filter(function (id) { return k.frei.indexOf(id) < 0; });
    if (neu.length) { var r = roh(); r.frei = k.frei.concat(neu); ablegen(r); }
    return neu;
  }
  function anzahlNeu() { var k = lies(); return k.frei.filter(function (id) { return k.gesehen.indexOf(id) < 0; }).length; }

  // ---------- Zeichnen ----------
  // o.stimmung: hallo | froh | troest | schlaf; o.requisit; o.bewegung: huepf | wiegen; o.glanz: Goldschein dahinter;
  // o.aussehen: abweichendes Aussehen (Vorschau im Kleiderschrank); o.kopf / o.hals: Teil erzwingen
  function svg(o) {
    o = o || {};
    var k = o.aussehen || lies();
    var e = FELLE[k.fell] || FELLE.hell, augFarbe = (AUGEN[k.augen] || AUGEN.gelbgruen).farbe;
    var decke = DECKEN[k.decke] && DECKEN[k.decke].farbe ? DECKEN[k.decke] : null;
    var kopf = KOPF[o.kopf || k.kopf] || KOPF.aus, hals = HALS[o.hals || k.hals] || HALS.aus;
    var stimmung = o.stimmung || 'hallo';
    var requisit = o.requisit || (stimmung === 'troest' ? 'herz' : null);
    var augen = { froh: 'froh', troest: 'sanft', schlaf: 'schlaefrig' }[stimmung] || 'offen';
    var Z = e.zeichnung;
    var s = [];
    if (o.glanz) s.push(glanz());
    // Sticker-Rand, damit die Katze auf dem dunklen Hintergrund steht
    s.push('<g fill="' + STICKER + '" stroke="' + STICKER + '" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">' +
      (decke ? '' : '<path d="' + SCHWANZ + '" fill="none" stroke-width="30"/>') +
      '<ellipse cx="100" cy="145" rx="50" ry="44"/>' + OHREN + '<ellipse cx="100" cy="88" rx="56" ry="47"/>' +
      (decke ? '<path d="' + DECKE + '"/>' : '<ellipse cx="84" cy="184" rx="13" ry="9"/><ellipse cx="116" cy="184" rx="13" ry="9"/>') +
      (kopf.rand || '') + (hals.rand || '') + '</g>');
    if (!decke) s.push('<path d="' + SCHWANZ + '" fill="none" stroke="' + LINIE + '" stroke-width="19" stroke-linecap="round"/>' +
      '<path d="' + SCHWANZ + '" fill="none" stroke="' + e.fell + '" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M176 136 l-9 2 M174 148 l-9 -1" stroke="' + e.streifen + '" stroke-width="3" stroke-linecap="round"/>');
    // Körper mit Bauch und Seitenstreifen
    s.push('<ellipse cx="100" cy="145" rx="50" ry="44" fill="' + e.fell + '" stroke="' + LINIE + '" stroke-width="3"/>' +
      '<ellipse cx="100" cy="152" rx="29" ry="28" fill="' + e.bauch + '"/>' +
      '<path d="M55 130 Q64 133 66 142 M54 145 Q62 147 63 154 M145 130 Q136 133 134 142 M146 145 Q138 147 137 154" fill="none" stroke="' + e.streifen + '" stroke-width="3" stroke-linecap="round"/>');
    if (decke) {
      s.push('<path d="' + DECKE + '" fill="' + decke.farbe + '" stroke="' + decke.rand + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M54 162 Q80 154 96 166 M104 158 Q128 150 146 162 M60 180 Q100 168 140 180" fill="none" stroke="' + decke.falte + '" stroke-width="2.5" stroke-linecap="round"/>');
      if (decke.punkte) s.push('<g fill="' + decke.punkte + '">' + [[52, 172], [70, 186], [92, 178], [112, 188], [132, 176], [150, 168], [74, 160], [128, 158]]
        .map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2"/>'; }).join('') + '</g>');
    }
    // Kopf
    s.push('<g fill="' + e.fell + '" stroke="' + LINIE + '" stroke-width="3" stroke-linejoin="round">' + OHREN + '</g>' +
      '<g fill="' + ROSA + '" opacity=".8"><path d="M59 63 L56 36 L80 48 Z"/><path d="M141 63 L144 36 L120 48 Z"/></g>' +
      '<ellipse cx="100" cy="88" rx="56" ry="47" fill="' + e.fell + '" stroke="' + LINIE + '" stroke-width="3"/>' +
      '<path d="M84 62 L89 51 L100 59 L111 51 L116 62" fill="none" stroke="' + e.streifen + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M46 84 Q54 82 60 87 M47 95 Q55 94 60 98 M154 84 Q146 82 140 87 M153 95 Q145 94 140 98" fill="none" stroke="' + e.streifen + '" stroke-width="3" stroke-linecap="round"/>');
    s.push(auge(78, augen, augFarbe, Z) + auge(122, augen, augFarbe, Z));
    s.push('<ellipse cx="64" cy="105" rx="8" ry="4.5" fill="' + ROSA + '" opacity=".55"/><ellipse cx="136" cy="105" rx="8" ry="4.5" fill="' + ROSA + '" opacity=".55"/>' +
      '<path d="M95.5 100 L104.5 100 L100 105.5 Z" fill="' + ROSA + '" stroke="' + ROSA + '" stroke-width="2" stroke-linejoin="round"/>');
    s.push(stimmung === 'froh'
      ? '<path d="M92 108 Q100 123 108 108 Q100 112 92 108 Z" fill="#c4566a" stroke="' + Z + '" stroke-width="2" stroke-linejoin="round"/>'
      : '<path d="M100 105.5 Q97 112 91.5 109.5 M100 105.5 Q103 112 108.5 109.5" fill="none" stroke="' + Z + '" stroke-width="2.2" stroke-linecap="round"/>');
    s.push('<path d="M58 102 L34 98 M58 108 L35 112 M142 102 L166 98 M142 108 L165 112" stroke="' + Z + '" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>');
    s.push(hals.bild || '');
    if (requisit) s.push(REQUISITEN[requisit] || REQUISITEN.stern);
    // Pfoten: auf dem Boden, auf der Decke oder am Requisit
    var breit = BREIT.indexOf(requisit) >= 0;
    var pfY = requisit === 'lineal' ? 152 : breit ? 170 : requisit ? 162 : decke ? 150 : 184;
    var pfX = requisit === 'herz' ? 22 : breit ? 36 : requisit && requisit !== 'lineal' ? 30 : 16;
    s.push(pfote(100 - pfX, pfY, e) + pfote(100 + pfX, pfY, e));
    s.push(kopf.bild || '');
    if (stimmung === 'froh') s.push(funke(28, 48, GOLD) + funke(172, 40, ROSA) + funke(176, 92, GOLD));
    var kl = o.bewegung ? ' class="kz-' + o.bewegung + '"' : '';
    return '<svg class="katze" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g' + kl + '>' + s.join('') + '</g></svg>';
  }
  var SCHWANZ = 'M140 162 C180 162 184 120 164 106';
  var BREIT = ['schild', 'tafel', 'buch', 'diagramm']; // Pfoten halten diese Requisiten von unten an den Ecken
  var OHREN = '<path d="M54 72 L49 30 Q50 22 58 26 L88 45 Z"/><path d="M146 72 L151 30 Q150 22 142 26 L112 45 Z"/>';
  // Kuscheldecke mit flauschigem Rand: kleine Bögen entlang einer flachen Kurve
  var DECKE = (function () {
    var d = 'M38 152';
    for (var i = 1; i <= 10; i++) {
      var t = i / 10, tm = (i - 0.5) / 10;
      d += ' Q' + (38 + 124 * tm).toFixed(1) + ' ' + (145 - 44 * tm * (1 - tm)).toFixed(1) + ' ' + (38 + 124 * t).toFixed(1) + ' ' + (152 - 44 * t * (1 - t)).toFixed(1);
    }
    return d + ' L162 174 Q100 204 38 174 Z';
  })();
  function glanz() {
    var strahlen = '';
    for (var i = 0; i < 12; i++) {
      var w = i * Math.PI / 6, c = Math.cos(w), s = Math.sin(w);
      strahlen += 'M' + (100 + 74 * c).toFixed(1) + ' ' + (108 + 74 * s).toFixed(1) + ' L' + (100 + 94 * c).toFixed(1) + ' ' + (108 + 94 * s).toFixed(1) + ' ';
    }
    return '<circle cx="100" cy="108" r="84" fill="' + GOLD + '" opacity=".2"/><path d="' + strahlen + '" stroke="' + GOLD + '" stroke-width="7" stroke-linecap="round" opacity=".55"/>';
  }
  function stern(x, y, r, f, rand) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var w = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + (x + rr * Math.cos(w)).toFixed(1) + ' ' + (y + rr * Math.sin(w)).toFixed(1) + ' ';
    }
    return '<path d="' + d + 'Z" fill="' + f + '"' + (rand ? ' stroke="' + rand + '" stroke-width="2.5" stroke-linejoin="round"' : '') + '/>';
  }
  function bluemchen() {
    var b = '';
    for (var i = 0; i < 5; i++) {
      var w = -Math.PI / 2 + i * 2 * Math.PI / 5;
      b += '<circle cx="' + (66 + 7.5 * Math.cos(w)).toFixed(1) + '" cy="' + (48 + 7.5 * Math.sin(w)).toFixed(1) + '" r="6" fill="#fff4f6" stroke="' + LINIE + '" stroke-width="1.5"/>';
    }
    return b + '<circle cx="66" cy="48" r="4.5" fill="#f2c94c" stroke="' + LINIE + '" stroke-width="1.5"/>';
  }
  function lorbeer() {
    var b = '';
    for (var i = 0; i <= 12; i++) {
      var w = Math.PI * (0.93 - 0.86 * i / 12); // von links über oben nach rechts
      var x = 100 + 58 * Math.cos(w), y = 90 - 50 * Math.sin(w);
      var dreh = (-w * 180 / Math.PI + 90 + (i % 2 ? 35 : -35)).toFixed(0);
      b += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="8" ry="3.8" transform="rotate(' + dreh + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="#7fa650" stroke="#3f5f2a" stroke-width="1.5"/>';
    }
    return b;
  }
  function schal() {
    var b = '<path d="' + BAND + '" fill="#e0607a" stroke="' + LINIE + '" stroke-width="2.5" stroke-linejoin="round"/>';
    var st = '';
    for (var i = 1; i <= 6; i++) {
      var t = i / 7, x = 60 + 80 * t, oben = 120 + 40 * t * (1 - t);
      st += 'M' + x.toFixed(1) + ' ' + (oben + 1.5).toFixed(1) + ' v8 ';
    }
    return b + '<path d="' + st + '" stroke="#f6eedf" stroke-width="4"/>' +
      '<path d="M106 134 L116 132 L125 160 L112 163 Z" fill="#e0607a" stroke="' + LINIE + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M109 142 L119 140 M111 151 L122 149" stroke="#f6eedf" stroke-width="3.5"/>';
  }
  function pfote(x, y, e) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="13" ry="9" fill="' + e.fell + '" stroke="' + LINIE + '" stroke-width="3"/>' +
      '<path d="M' + (x - 4) + ' ' + (y + 2) + ' v5 M' + (x + 4) + ' ' + (y + 2) + ' v5" stroke="' + e.streifen + '" stroke-width="2" stroke-linecap="round"/>';
  }
  function auge(x, art, farbe, Z) {
    if (art === 'froh') return '<path d="M' + (x - 9) + ' 93 Q' + x + ' 81 ' + (x + 9) + ' 93" fill="none" stroke="' + Z + '" stroke-width="3.5" stroke-linecap="round"/>';
    if (art === 'sanft') return '<path d="M' + (x - 9) + ' 88 Q' + x + ' 97 ' + (x + 9) + ' 88" fill="none" stroke="' + Z + '" stroke-width="3.5" stroke-linecap="round"/>';
    if (art === 'schlaefrig') return '<path d="M' + (x - 9) + ' 90 Q' + x + ' 100 ' + (x + 9) + ' 90 Z" fill="' + farbe + '" stroke="' + LINIE + '" stroke-width="2"/>' +
      '<ellipse cx="' + x + '" cy="93.5" rx="2.6" ry="3" fill="' + LINIE + '"/><path d="M' + (x - 10) + ' 90 L' + (x + 10) + ' 90" stroke="' + Z + '" stroke-width="2.5" stroke-linecap="round"/>';
    return '<g class="kz-auge"><ellipse cx="' + x + '" cy="90" rx="9" ry="10" fill="' + farbe + '" stroke="' + LINIE + '" stroke-width="2"/>' +
      '<ellipse cx="' + x + '" cy="90.5" rx="3.6" ry="7.5" fill="' + LINIE + '"/><circle cx="' + (x - 3) + '" cy="85.5" r="2.6" fill="#fff"/></g>';
  }
  function funke(x, y, f) {
    return '<path class="kz-funke" d="M' + x + ' ' + (y - 9) + ' Q' + (x + 2) + ' ' + (y - 2) + ' ' + (x + 9) + ' ' + y + ' Q' + (x + 2) + ' ' + (y + 2) + ' ' + x + ' ' + (y + 9) +
      ' Q' + (x - 2) + ' ' + (y + 2) + ' ' + (x - 9) + ' ' + y + ' Q' + (x - 2) + ' ' + (y - 2) + ' ' + x + ' ' + (y - 9) + ' Z" fill="' + f + '"/>';
  }

  // Bild und Beschriftung zu einer Freischalt-id (Album, „Neu freigeschaltet!“)
  function thema(id) {
    for (var i = 0; i < DATEN.themen.length; i++) if (DATEN.themen[i].fach + '/' + DATEN.themen[i].thema === id) return DATEN.themen[i];
    return { titel: id };
  }
  function beschreibe(id) {
    var p = id.split(':');
    if (p[0] === 'kopf' || p[0] === 'hals') {
      var teil = (p[0] === 'kopf' ? KOPF : HALS)[p[1]];
      var o = { stimmung: 'froh' }; o[p[0]] = p[1];
      return { titel: teil.titel, art: p[0] === 'kopf' ? 'Für den Kopf' : 'Für den Hals', hinweis: teil.hinweis, bild: svg(o), teil: true };
    }
    var t = thema(p[1]), req = MOTIV[p[1]] || 'stern';
    if (p[2] === 'gold') return { titel: t.titel, art: 'Gold-Bild', hinweis: 'Belohnungscode für ein Blatt „' + t.titel + '“', bild: svg({ requisit: req, stimmung: 'froh', glanz: true, kopf: 'krone' }) };
    if (p[2] === '3') return { titel: t.titel, art: '3 Sterne', hinweis: '3 Sterne in „' + t.titel + '“', bild: svg({ requisit: req, stimmung: 'froh', glanz: true }) };
    return { titel: t.titel, art: 'Geschafft', hinweis: '„' + t.titel + '“ einmal schaffen', bild: svg({ requisit: req }) };
  }

  // ---------- Sprüche ----------
  var SPRUECHE = {
    hallo: ['{k} freut sich aufs Üben.', 'Bereit? {k} ist es!', '{k} hat schon auf dich gewartet.', 'Los geht’s – {k} ist dabei.'],
    froh: ['{k} macht einen Freudensprung!', '{k} schnurrt zufrieden.', '{k} ist stolz auf dich!', '{k} wackelt mit den Ohren.', 'Pfote drauf – sagt {k}.'],
    troest: ['Nicht schlimm – aus Fehlern lernt man.', 'Kopf hoch, beim nächsten Mal klappt’s!', 'Schau dir die Lösung in Ruhe an.', 'Fehler gehören zum Lernen dazu.', 'Du schaffst das!'],
    letztesHerz: ['Nur noch ein Herz – {k} drückt dir die Pfoten!'],
    geschafft: ['{k} feiert mit dir!', '{k} ist mächtig stolz auf dich!'],
    perfekt: ['Alles richtig! {k} tanzt vor Freude.'],
    verloren: ['Das war schwer. {k} kuschelt kurz mit dir – dann noch mal?'],
  };
  // gibt reinen Text zurück; beim Einbauen in HTML escapen
  function spruch(art) {
    var l = SPRUECHE[art] || SPRUECHE.hallo;
    return l[Math.floor(Math.random() * l.length)].split('{k}').join(name());
  }

  // ---------- Kleiderschrank ----------
  function anpassen(fertig) {
    aktualisiere();
    var k = lies();
    var erstes = !k.name;
    var esc = LERNWERK.esc;
    function gruppe(titel, feld, tabelle, muster) {
      return '<fieldset class="kz-gruppe"><legend>' + titel + '</legend><div class="kz-wahl">' + Object.keys(tabelle).map(function (id) {
        var t = tabelle[id], zu = (feld === 'kopf' || feld === 'hals') && !t.frei && k.frei.indexOf(feld + ':' + id) < 0;
        return '<button type="button" class="kz-knopf' + (zu ? ' zu' : '') + '" data-feld="' + feld + '" data-wert="' + id + '" aria-pressed="false"' + (zu ? ' disabled' : '') + '>' +
          (zu ? '<i class="kz-icon">🔒</i>' : muster(t)) + '<span>' + esc(t.titel) + (zu ? '<small>' + esc(t.hinweis) + '</small>' : '') + '</span></button>';
      }).join('') + '</div></fieldset>';
    }
    function punkt(f) { return '<i class="kz-farbe" style="background:' + f + '"></i>'; }
    function icon(t) { return '<i class="kz-icon">' + t.icon + '</i>'; }
    var d = LERNWERK.dialog('<form class="kz-schrank"><h2>' + (erstes ? 'Das ist deine Lernkatze!' : 'Kleiderschrank') + '</h2>' +
      '<p>' + (erstes ? 'Sie übt mit dir und freut sich mit dir. Gib ihr einen Namen und such dir aus, wie sie aussieht.' : 'Such dir aus, wie deine Katze aussieht. Mit 🔒 sind Schätze, die du dir erst verdienst.') + '</p>' +
      '<div class="kz-vorschau"></div>' +
      '<label class="kz-label" for="kz-name">Name</label><input id="kz-name" maxlength="16" autocomplete="off" placeholder="z. B. Maurice" value="' + esc(k.name) + '" required>' +
      gruppe('Fell', 'fell', FELLE, function (f) { return punkt(f.fell); }) +
      gruppe('Augen', 'augen', AUGEN, function (a) { return punkt(a.farbe); }) +
      gruppe('Kuscheldecke', 'decke', DECKEN, function (x) { return x.farbe ? punkt(x.farbe) : '<i class="kz-farbe kz-keine"></i>'; }) +
      gruppe('Kopf', 'kopf', KOPF, icon) +
      gruppe('Hals', 'hals', HALS, icon) +
      '<button class="lw-knopf" type="submit">' + (erstes ? 'Los geht’s!' : 'Fertig') + '</button></form>');
    var vorschau = d.querySelector('.kz-vorschau');
    function zeigen() {
      vorschau.innerHTML = svg({ aussehen: k, stimmung: 'froh', bewegung: 'huepf' });
      d.querySelectorAll('.kz-knopf').forEach(function (b) { b.setAttribute('aria-pressed', String(k[b.dataset.feld] === b.dataset.wert)); });
    }
    d.querySelectorAll('.kz-knopf').forEach(function (b) {
      b.onclick = function () { k[b.dataset.feld] = b.dataset.wert; zeigen(); };
    });
    zeigen();
    var feld = d.querySelector('#kz-name');
    if (erstes) feld.focus();
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = feld.value.trim();
      if (!n) return feld.focus();
      var r = roh();
      ['fell', 'augen', 'decke', 'kopf', 'hals'].forEach(function (f) { r[f] = k[f]; });
      r.name = n;
      schreib(r);
      d.remove();
      if (fertig) fertig();
    });
  }

  // ---------- Belohnungscode (steht auf dem Lösungsblatt, siehe generator/belohnung.js) ----------
  function normCode(c) { return String(c).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^MIAU/, ''); }
  function pruefsumme(c) {
    var h = 0x811c9dc5, s = normCode(c);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }
  // → { ok, ziel: 'fach/thema/V', titel, schon } bzw. { ok: false }
  function einloesen(code) {
    var ziel = normCode(code).length === 4 && DATEN.codes[pruefsumme(code)];
    if (!ziel) return { ok: false };
    var r = roh(), codes = liste(r.codes), schon = codes.indexOf(ziel) >= 0;
    if (!schon) { r.codes = codes.concat(ziel); ablegen(r); }
    var neu = aktualisiere();
    window.dispatchEvent(new Event('katze-geaendert'));
    return { ok: true, ziel: ziel, titel: thema(ziel.split('/').slice(0, 2).join('/')).titel, variante: ziel.split('/')[2], schon: schon, neu: neu };
  }

  // ---------- Album ----------
  function album() {
    aktualisiere();
    var esc = LERNWERK.esc;
    var d = LERNWERK.dialog('<div class="kz-album-dialog"></div>');
    var inhalt = d.querySelector('.kz-album-dialog');
    var meldung = '';
    function platz(id, k) {
      var b = beschreibe(id), frei = k.frei.indexOf(id) >= 0, neu = frei && k.gesehen.indexOf(id) < 0;
      return '<figure class="kz-platz' + (frei ? '' : ' zu') + (neu ? ' neu' : '') + (/:3$|:gold$/.test(id) ? ' glaenzt' : '') + '" data-id="' + id + '">' + b.bild +
        '<figcaption>' + (frei ? '<b>' + esc(b.teil ? b.titel : b.art) + '</b>' : '🔒 ' + (b.teil ? esc(b.titel) + ': ' : '') + esc(b.hinweis)) + '</figcaption></figure>';
    }
    function zeigen() {
      var k = lies();
      var faecher = {}, alle = [];
      DATEN.themen.forEach(function (t) {
        var f = faecher[t.fach] = faecher[t.fach] || { titel: t.fachTitel, themen: [] };
        f.themen.push(t);
        ['1', '3', 'gold'].forEach(function (s) { alle.push('motiv:' + t.fach + '/' + t.thema + ':' + s); });
      });
      var teile = [];
      [['kopf', KOPF], ['hals', HALS]].forEach(function (p) { Object.keys(p[1]).forEach(function (id) { if (p[1][id].bedingung) teile.push(p[0] + ':' + id); }); });
      alle = alle.concat(teile);
      var gesammelt = alle.filter(function (id) { return k.frei.indexOf(id) >= 0; }).length;
      inhalt.innerHTML = '<h2>📖 Katzenalbum</h2><p>' + gesammelt + ' von ' + alle.length + ' Bildern gesammelt. Jedes Thema hat drei: geschafft, 3 Sterne und Gold.</p>' +
        '<form class="kz-code"><label class="kz-label" for="kz-code">🎁 Belohnungscode von deinen Eltern</label>' +
        '<div class="kz-code-reihe"><input id="kz-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="MIAU-…"><button class="lw-knopf" type="submit">Einlösen</button></div>' +
        '<p class="kz-meldung" role="status">' + meldung + '</p></form>' +
        Object.keys(faecher).map(function (f) {
          return '<h3>' + esc(faecher[f].titel) + '</h3>' + faecher[f].themen.map(function (t) {
            var id = t.fach + '/' + t.thema;
            return '<h4>' + esc(t.titel) + '</h4><div class="kz-album">' + ['1', '3', 'gold'].map(function (s) { return platz('motiv:' + id + ':' + s, k); }).join('') + '</div>';
          }).join('');
        }).join('') +
        '<h3>Schätze für den Kleiderschrank</h3><div class="kz-album">' + teile.map(function (id) { return platz(id, k); }).join('') + '</div>' +
        '<button class="lw-knopf leise" id="kz-zu">Schließen</button>';
      inhalt.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var feld = inhalt.querySelector('#kz-code');
        if (!feld.value.trim()) return;
        var r = einloesen(feld.value);
        meldung = !r.ok ? '✗ Diesen Code kenne ich nicht. Schau noch mal genau auf das Lösungsblatt.'
          : r.schon ? 'Diesen Code hast du schon eingelöst (' + esc(r.titel) + ', Blatt ' + r.variante + ').'
            : '✓ Super! Volle Punktzahl in „' + esc(r.titel) + '“ (Blatt ' + r.variante + '). Dein Gold-Bild ist da!';
        zeigen();
        if (!r.ok) inhalt.querySelector('#kz-code').value = feld.value;
      });
      inhalt.querySelector('#kz-zu').onclick = function () { d.remove(); };
      // was jetzt zu sehen war, gilt beim nächsten Öffnen nicht mehr als neu
      var r = roh(); r.gesehen = k.frei.slice(); ablegen(r);
      window.dispatchEvent(new Event('katze-geaendert'));
    }
    zeigen();
  }

  // Katzen-Karte für Startseite und Übersicht
  function karte(el) {
    if (!el || !lies().name) return;
    aktualisiere();
    var esc = LERNWERK.esc, n = anzahlNeu();
    el.hidden = false;
    el.innerHTML = svg({ stimmung: 'hallo' }) + '<div><b>' + esc(name()) + '</b><p>' + esc(spruch('hallo')) + '</p>' +
      '<div class="kz-knoepfe"><button class="btn btn-ghost" data-kz="anpassen">🎨 Anpassen</button><button class="btn btn-ghost" data-kz="album">📖 Album' +
      (n ? ' <span class="kz-neu">' + n + ' neu</span>' : '') + '</button></div></div>';
    el.querySelector('[data-kz="anpassen"]').onclick = function () { anpassen(); };
    el.querySelector('[data-kz="album"]').onclick = album;
  }

  // „Neu freigeschaltet!“ für den Abschluss-Bildschirm
  function neuHtml(ids) {
    if (!ids.length) return '';
    var esc = LERNWERK.esc;
    return '<section class="karte kz-neu-karte"><h2>Neu freigeschaltet!</h2><div class="kz-album">' + ids.map(function (id) {
      var b = beschreibe(id);
      return '<figure class="kz-platz neu' + (/:3$|:gold$/.test(id) ? ' glaenzt' : '') + '">' + b.bild + '<figcaption><b>' + esc(b.art) + '</b>' + esc(b.titel) + '</figcaption></figure>';
    }).join('') + '</div><p>' + (ids.some(function (id) { return /^(kopf|hals):/.test(id); }) ? 'Zieh es im Kleiderschrank an! ' : '') + 'Alles findest du im Album.</p></section>';
  }

  // Beim ersten Besuch (nach dem Namen des Kindes) die Katze vorstellen
  function start(fertig) {
    if (lies().name) { if (fertig) fertig(); return; }
    anpassen(fertig);
  }

  window.KATZE = {
    svg: svg, spruch: spruch, name: name, anpassen: anpassen, album: album, karte: karte, start: start, lies: lies,
    aktualisiere: aktualisiere, neuHtml: neuHtml, einloesen: einloesen, pruefsumme: pruefsumme, beschreibe: beschreibe,
    FELLE: FELLE, AUGEN: AUGEN, DECKEN: DECKEN, KOPF: KOPF, HALS: HALS, MOTIV: MOTIV, REQUISITEN: REQUISITEN,
  };
})();
