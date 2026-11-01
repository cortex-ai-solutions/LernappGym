/* LERNWERK – gemeinsamer Teil aller Seiten (Mathe, Latein, Geschichte, Start, Eltern):
   Name des Kindes, Lernprotokoll je Fach/Thema, Bericht an die Eltern als Link.
   Alles bleibt auf dem Gerät. Der Bericht steckt im #-Teil des Links, und der wird nie an einen Server geschickt. */
(function () {
  'use strict';
  var PROFIL = 'lernwerk_profil';
  var PROTOKOLL = 'lernwerk_protokoll_v1';
  var MAX_VERLAUF = 15; // Runden je Thema im Verlauf
  var MAX_TAGE = 60; // Lerntage
  var MAX_FEHLER = 12; // häufigste Fehler je Thema im Bericht

  function lies(k, leer) { try { return JSON.parse(localStorage.getItem(k)) || leer; } catch (e) { return leer; } }
  function schreib(k, w) { try { localStorage.setItem(k, JSON.stringify(w)); } catch (e) { /* privater Modus */ } }
  function tag(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- Profil ----------
  // id unterscheidet zwei Kinder mit gleichem Namen in der Elternansicht
  function profil() {
    var p = lies(PROFIL, {});
    if (!p.id) { p.id = Math.random().toString(36).slice(2, 10); schreib(PROFIL, p); }
    return p;
  }
  function setzeName(name) { var p = profil(); p.name = name; schreib(PROFIL, p); }

  // ---------- Protokoll ----------
  function leeresProtokoll() { return { v: 1, tage: [], faecher: {} }; }

  // Eine Übungsrunde: { fach, fachTitel, thema, titel, richtig, gesamt, geschafft, aufgaben: { schluessel: { l: Bezeichnung, r, f } } }
  function protokolliere(e) {
    var p = lies(PROTOKOLL, leeresProtokoll());
    var heute = tag();
    if (p.tage.indexOf(heute) < 0) p.tage = p.tage.concat(heute).slice(-MAX_TAGE);
    var f = p.faecher[e.fach] = p.faecher[e.fach] || { ti: e.fachTitel, th: {} };
    var t = f.th[e.thema] = f.th[e.thema] || { n: 0, ok: 0, r: 0, g: 0, h: [], a: {} };
    t.ti = e.titel; t.n++; t.z = heute;
    if (e.geschafft) t.ok++;
    t.r += e.richtig; t.g += e.gesamt;
    t.h = t.h.concat([[heute, e.richtig, e.gesamt, e.geschafft ? 1 : 0]]).slice(-MAX_VERLAUF);
    Object.keys(e.aufgaben || {}).forEach(function (k) {
      var a = e.aufgaben[k], alt = t.a[k] || [a.l, 0, 0];
      t.a[k] = [a.l, alt[1] + a.r, alt[2] + a.f];
    });
    schreib(PROTOKOLL, p);
  }

  // Stände der Apps von vor dem Protokoll, damit auch der erste Bericht etwas zeigt
  function staende() {
    var m = lies('lernwerk_v1', null), la = lies('latina_state', null), ge = lies('geschichte_lernapp_progress_v1', null);
    var s = {};
    if (m && m.themen) {
      s.mathematik = {};
      Object.keys(m.themen).forEach(function (k) { s.mathematik[k.split('/').pop()] = [m.themen[k].lektionen, m.themen[k].sterne]; });
    }
    if (la) s.latein = { xp: la.xp || 0, fertig: (la.completedLessons || []).length };
    if (ge) {
      s.geschichte = {};
      Object.keys(ge).forEach(function (k) { s.geschichte[k] = [ge[k].bestScore, ge[k].total]; });
    }
    return s;
  }

  function bericht() {
    var pr = profil(), p = lies(PROTOKOLL, leeresProtokoll());
    var faecher = {};
    Object.keys(p.faecher).forEach(function (fid) {
      var f = p.faecher[fid], th = {};
      Object.keys(f.th).forEach(function (tid) {
        var t = f.th[tid];
        // nur Fehlerschwerpunkte mitschicken, das hält den Link kurz
        var fehler = Object.keys(t.a).map(function (k) { return t.a[k]; })
          .filter(function (a) { return a[2] > 0; })
          .sort(function (x, y) { return y[2] - x[2] || y[2] / (y[1] + y[2]) - x[2] / (x[1] + x[2]); })
          .slice(0, MAX_FEHLER);
        th[tid] = { ti: t.ti, n: t.n, ok: t.ok, r: t.r, g: t.g, z: t.z, h: t.h, a: fehler };
      });
      faecher[fid] = { ti: f.ti, th: th };
    });
    return { v: 1, n: pr.name || 'Ohne Namen', i: pr.id, t: Date.now(), tage: p.tage, f: faecher, s: staende() };
  }

  // ---------- Link kodieren (deflate + base64url) ----------
  function b64url(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).split('+').join('-').split('/').join('_').split('=').join('');
  }
  function vonB64url(s) {
    s = s.split('-').join('+').split('_').join('/');
    while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function strom(bytes, umwandler) {
    return new Response(new Blob([bytes]).stream().pipeThrough(umwandler)).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function packen(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream === 'undefined') return Promise.resolve('j' + b64url(bytes));
    return strom(bytes, new CompressionStream('deflate-raw')).then(function (b) { return 'z' + b64url(b); });
  }
  function auspacken(code) {
    var art = code.charAt(0), bytes = vonB64url(code.slice(1));
    var fertig = art === 'z' ? strom(bytes, new DecompressionStream('deflate-raw')) : Promise.resolve(bytes);
    return fertig.then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
  }

  // ---------- Oberfläche ----------
  var CSS = '.lw-schleier{position:fixed;inset:0;z-index:80;background:rgba(0,20,26,.82);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.lw-dialog{width:100%;max-width:420px;max-height:calc(100vh - 32px);overflow-y:auto;background:#002B36;color:#F5F0E6;border:1px solid #C9A84C;border-radius:18px;padding:24px 20px;font:16px/1.45 Inter,system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.5)}' +
    '.lw-dialog h2{margin:0 0 6px;font:700 22px/1.25 Montserrat,Inter,system-ui,sans-serif;color:#E8C97D}' +
    '.lw-dialog p{margin:0 0 14px;color:#C9D4D6}' +
    '.lw-dialog input,.lw-dialog textarea{width:100%;box-sizing:border-box;min-height:52px;padding:12px 14px;border-radius:12px;border:1px solid rgba(200,168,76,.5);background:#00202A;color:#F5F0E6;font:inherit;font-size:18px}' +
    '.lw-dialog textarea{font-size:13px;min-height:90px;word-break:break-all}' +
    '.lw-knopf{display:flex;width:100%;align-items:center;justify-content:center;min-height:52px;margin-top:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#B8922A,#E8C97D);color:#000;font:700 16px Inter,system-ui,sans-serif;cursor:pointer}' +
    '.lw-knopf.leise{background:transparent;color:#E8C97D;border:1px solid rgba(200,168,76,.4)}';
  function stil() {
    if (document.getElementById('lw-stil')) return;
    var s = document.createElement('style'); s.id = 'lw-stil'; s.textContent = CSS; document.head.appendChild(s);
  }
  function dialog(html) {
    stil();
    var d = document.createElement('div');
    d.className = 'lw-schleier';
    d.innerHTML = '<div class="lw-dialog" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(d);
    return d;
  }

  // Beim ersten Start: „Wie heißt du?“ (der Name bleibt auf dem Gerät und steht nur im Bericht)
  function frageName(fertig) {
    var alt = profil().name || '';
    var d = dialog('<form><h2>' + (alt ? 'Name ändern' : 'Hallo! Wie heißt du?') + '</h2><p>Dein Name steht auf dem Bericht für deine Eltern. Er bleibt auf diesem Handy.</p>' +
      '<input id="lw-name" maxlength="30" autocomplete="given-name" placeholder="Dein Vorname" value="' + esc(alt) + '" required><button class="lw-knopf" type="submit">Los geht’s!</button></form>');
    var feld = d.querySelector('#lw-name');
    feld.focus();
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = feld.value.trim();
      if (!name) return;
      setzeName(name);
      d.remove();
      if (fertig) fertig(name);
    });
  }

  // prefix: Weg von der aktuellen Seite zur Wurzel der App, z. B. '../'
  function berichtLink(prefix) {
    return packen(bericht()).then(function (code) { return new URL((prefix || '') + 'eltern/', location.href).href + '#b=' + code; });
  }
  function senden(prefix) {
    var name = profil().name;
    if (!name) return frageName(function () { senden(prefix); });
    return berichtLink(prefix).then(function (url) {
      var titel = 'LERNWERK-Bericht von ' + name;
      if (navigator.share) return navigator.share({ title: titel, text: titel + ' – zum Öffnen tippen:', url: url }).catch(function () {});
      // ohne Teilen-Menü (z. B. am PC): Link zum Kopieren zeigen
      var d = dialog('<h2>Bericht an deine Eltern</h2><p>Kopiere diesen Link und schick ihn deinen Eltern.</p><textarea id="lw-link" readonly>' + esc(url) + '</textarea>' +
        '<button class="lw-knopf" id="lw-kopieren">Link kopieren</button><button class="lw-knopf leise" id="lw-zu">Schließen</button>');
      var feld = d.querySelector('#lw-link');
      d.querySelector('#lw-kopieren').onclick = function () {
        feld.select();
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).catch(function () { document.execCommand('copy'); });
        this.textContent = '✓ Kopiert';
      };
      d.querySelector('#lw-zu').onclick = function () { d.remove(); };
    });
  }

  // Auf Kinder-Seiten: beim ersten Besuch nach dem Namen fragen, danach (oder sofort) fertig()
  function start(fertig) {
    function los() { if (profil().name) { if (fertig) fertig(); } else frageName(fertig); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los);
    else los();
  }

  window.LERNWERK = {
    profil: profil, setzeName: setzeName, frageName: frageName, start: start, dialog: dialog,
    protokolliere: protokolliere, bericht: bericht, berichtLink: berichtLink, senden: senden,
    packen: packen, auspacken: auspacken, tag: tag, esc: esc,
  };
})();
