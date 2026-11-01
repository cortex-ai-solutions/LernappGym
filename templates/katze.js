/* LERNWERK – die Lernkatze. Eigene Figur nach dem Familienkater Maurice (keine fremde Comicfigur).
   Sie wird als SVG gezeichnet; Name, Fell, Augen und Kuscheldecke wählt das Kind im Kleiderschrank.
   Alles bleibt auf dem Gerät. Braucht LERNWERK (templates/lernwerk.js) für den Dialog. */
(function () {
  'use strict';
  var SPEICHER = 'lernwerk_katze_v1';
  var LINIE = '#1d1512', STICKER = '#f6eedf', ROSA = '#e8919d';

  // Auswahl im Kleiderschrank. Neue Einträge einfach anhängen, der erste ist jeweils der Standard.
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

  function lies() {
    var k;
    try { k = JSON.parse(localStorage.getItem(SPEICHER)) || {}; } catch (e) { k = {}; }
    return {
      name: typeof k.name === 'string' ? k.name : '',
      fell: FELLE[k.fell] ? k.fell : 'hell',
      augen: AUGEN[k.augen] ? k.augen : 'gelbgruen',
      decke: DECKEN[k.decke] ? k.decke : 'aus',
    };
  }
  function schreib(k) {
    try { localStorage.setItem(SPEICHER, JSON.stringify(k)); } catch (e) { /* privater Modus */ }
    window.dispatchEvent(new Event('katze-geaendert'));
  }
  function name() { return lies().name || 'Deine Katze'; }

  // ---------- Zeichnen ----------
  // o.stimmung: hallo | froh | troest | schlaf; o.requisit: herz | …; o.bewegung: huepf | wiegen; o.aussehen: Vorschau im Kleiderschrank
  function svg(o) {
    o = o || {};
    var k = o.aussehen || lies();
    var e = FELLE[k.fell], augFarbe = AUGEN[k.augen].farbe, decke = DECKEN[k.decke].farbe ? DECKEN[k.decke] : null;
    var stimmung = o.stimmung || 'hallo';
    var requisit = o.requisit || (stimmung === 'troest' ? 'herz' : null);
    var augen = { froh: 'froh', troest: 'sanft', schlaf: 'schlaefrig' }[stimmung] || 'offen';
    var Z = e.zeichnung;
    var s = [];
    // Sticker-Rand, damit die Katze auf dem dunklen Hintergrund steht
    s.push('<g fill="' + STICKER + '" stroke="' + STICKER + '" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">' +
      (decke ? '' : '<path d="' + SCHWANZ + '" fill="none" stroke-width="30"/>') +
      '<ellipse cx="100" cy="145" rx="50" ry="44"/>' + OHREN + '<ellipse cx="100" cy="88" rx="56" ry="47"/>' +
      (decke ? '<path d="' + DECKE + '"/>' : '<ellipse cx="84" cy="184" rx="13" ry="9"/><ellipse cx="116" cy="184" rx="13" ry="9"/>') + '</g>');
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
    if (requisit) s.push(REQUISITEN[requisit] || '');
    // Pfoten: auf dem Boden, auf der Decke oder am Requisit
    var pfY = requisit === 'lineal' ? 152 : requisit ? 162 : decke ? 150 : 184;
    var pfX = requisit === 'herz' ? 22 : requisit && requisit !== 'lineal' ? 30 : 16;
    s.push(pfote(100 - pfX, pfY, e) + pfote(100 + pfX, pfY, e));
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
    if (stimmung === 'froh') s.push(funke(28, 48, '#E8C97D') + funke(172, 40, ROSA) + funke(176, 92, '#E8C97D'));
    var kl = o.bewegung ? ' class="kz-' + o.bewegung + '"' : '';
    return '<svg class="katze" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g' + kl + '>' + s.join('') + '</g></svg>';
  }
  var SCHWANZ = 'M140 162 C180 162 184 120 164 106';
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
  var REQUISITEN = {
    herz: '<path d="M100 172 C76 156 78 136 92 138 C97 139 100 144 100 147 C100 144 103 139 108 138 C122 136 124 156 100 172 Z" fill="#e0607a" stroke="' + LINIE + '" stroke-width="2.5" stroke-linejoin="round"/>',
  };
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
    var k = lies();
    var erstes = !k.name;
    var esc = LERNWERK.esc;
    function gruppe(titel, feld, liste, muster) {
      return '<fieldset class="kz-gruppe"><legend>' + titel + '</legend><div class="kz-wahl">' + Object.keys(liste).map(function (id) {
        return '<button type="button" class="kz-knopf" data-feld="' + feld + '" data-wert="' + id + '" aria-pressed="false">' + muster(liste[id]) + '<span>' + esc(liste[id].titel) + '</span></button>';
      }).join('') + '</div></fieldset>';
    }
    function punkt(f) { return '<i class="kz-farbe" style="background:' + f + '"></i>'; }
    var d = LERNWERK.dialog('<form class="kz-schrank"><h2>' + (erstes ? 'Das ist deine Lernkatze!' : 'Kleiderschrank') + '</h2>' +
      '<p>' + (erstes ? 'Sie übt mit dir und freut sich mit dir. Gib ihr einen Namen und such dir aus, wie sie aussieht.' : 'Such dir aus, wie deine Katze aussieht.') + '</p>' +
      '<div class="kz-vorschau"></div>' +
      '<label class="kz-label" for="kz-name">Name</label><input id="kz-name" maxlength="16" autocomplete="off" placeholder="z. B. Maurice" value="' + esc(k.name) + '" required>' +
      gruppe('Fell', 'fell', FELLE, function (f) { return punkt(f.fell); }) +
      gruppe('Augen', 'augen', AUGEN, function (a) { return punkt(a.farbe); }) +
      gruppe('Kuscheldecke', 'decke', DECKEN, function (x) { return x.farbe ? punkt(x.farbe) : '<i class="kz-farbe kz-keine"></i>'; }) +
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
      k.name = n;
      schreib(k);
      d.remove();
      if (fertig) fertig();
    });
  }

  // Beim ersten Besuch (nach dem Namen des Kindes) die Katze vorstellen
  function start(fertig) {
    if (lies().name) { if (fertig) fertig(); return; }
    anpassen(fertig);
  }

  window.KATZE = { svg: svg, spruch: spruch, name: name, anpassen: anpassen, start: start, lies: lies, FELLE: FELLE, AUGEN: AUGEN, DECKEN: DECKEN };
})();
