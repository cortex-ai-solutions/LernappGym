/* LERNWERK Elternansicht (eltern/). Erwartet window.LERNWERK und window.TITEL (Themen-Titel aus dem Build).
   Ein Bericht kommt als Link (#b=…) vom Handy des Kindes. Er wird hier gespeichert; so entsteht der Verlauf.
   Ein „Eltern-Handy“ ist einfach das Gerät, auf dem Berichte geöffnet werden – eine Anmeldung gibt es nicht. */
(function () {
  'use strict';
  var SPEICHER = 'lernwerk_eltern_v1';
  var MAX_BERICHTE = 40;
  var E = window.LERNWERK, esc = E.esc;
  var app = document.getElementById('app');

  function lies() { try { return JSON.parse(localStorage.getItem(SPEICHER)) || { kinder: {} }; } catch (e) { return { kinder: {} }; } }
  function speichern() { try { localStorage.setItem(SPEICHER, JSON.stringify(daten)); } catch (e) { /* voll oder privat */ } }
  var daten = lies();
  var gewaehlt = null;

  function aufnehmen(b) {
    if (!b || b.v !== 1 || !b.i || !b.f) throw new Error('Format');
    var k = daten.kinder[b.i] = daten.kinder[b.i] || { berichte: [] };
    k.name = b.n;
    if (!k.berichte.some(function (x) { return x.t === b.t; })) {
      k.berichte.push(b);
      k.berichte.sort(function (x, y) { return x.t - y.t; });
      k.berichte = k.berichte.slice(-MAX_BERICHTE);
    }
    speichern();
    return b.i;
  }

  // ---------- Formatierung ----------
  function datum(iso) { var t = iso.split('-'); return t[2] + '.' + t[1] + '.'; }
  function zeitpunkt(ms) {
    var d = new Date(ms);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
  }
  function prozent(r, g) { return g ? Math.round((r / g) * 100) : 0; }
  function sterne(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
  function plural(n, eins, viele) { return n + ' ' + (n === 1 ? eins : viele); }

  // Lerntage der letzten 14 Tage vor dem Bericht als Punktreihe (Text daneben, Farbe ist nie die einzige Information)
  function tageLeiste(b) {
    var tage = b.tage || [], punkte = '', gelernt = 0;
    for (var i = 13; i >= 0; i--) {
      var d = new Date(b.t); d.setDate(d.getDate() - i);
      var iso = E.tag(d), ja = tage.indexOf(iso) >= 0;
      if (ja) gelernt++;
      punkte += '<span class="tag' + (ja ? ' ja' : '') + '" title="' + datum(iso) + (ja ? ': geübt' : ': nicht geübt') + '">' + (ja ? '●' : '○') + '</span>';
    }
    return '<div class="tage-leiste" aria-label="An ' + gelernt + ' von 14 Tagen geübt">' + punkte + '</div><p class="klein">Geübt an <b>' + gelernt + ' von 14 Tagen</b> vor dem Bericht</p>';
  }

  // Verlauf der letzten Runden: Säule = Anteil richtig; nicht geschaffte Runden nur umrandet
  function verlauf(h) {
    if (!h || !h.length) return '';
    var B = 14, A = 4, H = 44;
    var saeulen = h.map(function (e, i) {
      var q = e[2] ? e[1] / e[2] : 0, hoehe = Math.max(2, q * H), x = i * (B + A);
      var titel = datum(e[0]) + ': ' + e[1] + ' von ' + e[2] + ' richtig' + (e[3] ? '' : ' (nicht geschafft)');
      return '<rect x="' + x + '" y="' + (H - hoehe) + '" width="' + B + '" height="' + hoehe + '" rx="2" ' + (e[3] ? 'fill="url(#eg)"' : 'fill="none" stroke="#E8C97D" stroke-dasharray="3 2"') + '><title>' + esc(titel) + '</title></rect>';
    }).join('');
    var breite = h.length * (B + A);
    return '<div class="verlauf"><svg viewBox="0 0 ' + breite + ' ' + H + '" width="' + breite + '" height="' + H + '" role="img" aria-label="Verlauf der letzten ' + h.length + ' Runden">' +
      '<defs><linearGradient id="eg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B8922A"/><stop offset="1" stop-color="#E8C97D"/></linearGradient></defs>' + saeulen + '</svg>' +
      '<span class="klein">letzte ' + plural(h.length, 'Runde', 'Runden') + ' · gestrichelt = nicht geschafft</span></div>';
  }

  function themaKarte(fid, tid, t, vorher) {
    var neu = vorher ? t.n - vorher.n : 0;
    var fehler = (t.a || []).map(function (a) {
      return '<li><span>' + esc(a[0]) + '</span><b>' + a[2] + ' von ' + (a[1] + a[2]) + ' falsch</b></li>';
    }).join('');
    return '<article class="thema bericht-thema"><h3>' + esc(t.ti || (TITEL[fid] && TITEL[fid][tid]) || tid) + '</h3>' +
      '<div class="kennzahlen"><span class="chip">' + plural(t.n, 'Runde', 'Runden') + (neu > 0 ? ' <b class="neu">+' + neu + '</b>' : '') + '</span>' +
      '<span class="chip">' + prozent(t.r, t.g) + ' % richtig</span><span class="chip">' + t.ok + ' geschafft</span><span class="chip">zuletzt ' + datum(t.z) + '</span></div>' +
      verlauf(t.h) +
      (fehler ? '<details><summary>Fehlerschwerpunkte</summary><ul class="fehler">' + fehler + '</ul></details>' : '') +
      '</article>';
  }

  // Stand von vor der Aufzeichnung (aus den Apps selbst), nur für Themen ohne Protokoll
  function frueher(fid, s, protokoll) {
    if (!s) return '';
    var zeilen = [];
    if (fid === 'latein') {
      if (s.fertig || s.xp) zeilen.push('<li>' + plural(s.fertig, 'Lektion', 'Lektionen') + ' abgeschlossen, ' + s.xp + ' XP</li>');
    } else {
      Object.keys(s).forEach(function (tid) {
        if (protokoll && protokoll[tid]) return;
        var w = s[tid], titel = esc((TITEL[fid] && TITEL[fid][tid]) || tid);
        if (fid === 'mathematik' && w[0]) zeilen.push('<li>' + titel + ': ' + plural(w[0], 'Übung', 'Übungen') + ', ' + sterne(w[1]) + '</li>');
        if (fid === 'geschichte' && w[1]) zeilen.push('<li>' + titel + ': bestes Quiz ' + w[0] + ' von ' + w[1] + '</li>');
      });
    }
    return zeilen.length ? '<div class="frueher"><p class="klein">Vor Beginn der Aufzeichnung:</p><ul>' + zeilen.join('') + '</ul></div>' : '';
  }

  var FAECHER = [['mathematik', 'Mathematik', '🧮'], ['latein', 'Latein', '🦉'], ['geschichte', 'Geschichte', '📜']];

  function kindAnsicht(id) {
    var k = daten.kinder[id], b = k.berichte[k.berichte.length - 1], vorher = k.berichte[k.berichte.length - 2];
    var html = '<section class="karte"><h2 class="kind">' + esc(k.name) + '</h2><p class="klein">Bericht vom ' + zeitpunkt(b.t) +
      (vorher ? ' · vorheriger Bericht ' + zeitpunkt(vorher.t) : '') + '</p>' + tageLeiste(b) + '</section>';
    var leer = true;
    FAECHER.forEach(function (fa) {
      var fid = fa[0], f = b.f[fid], s = b.s && b.s[fid];
      var themen = f ? Object.keys(f.th).sort(function (x, y) { return f.th[y].z < f.th[x].z ? -1 : 1; }) : [];
      var alt = frueher(fid, s, f && f.th);
      if (!themen.length && !alt) return;
      leer = false;
      var vf = vorher && vorher.f[fid];
      html += '<h2 class="fach-titel">' + fa[2] + ' ' + fa[1] + '</h2>' +
        themen.map(function (tid) { return themaKarte(fid, tid, f.th[tid], vf && vf.th[tid]); }).join('') + alt;
    });
    if (leer) html += '<p class="karte">In diesem Bericht ist noch nichts geübt worden.</p>';
    html += '<button class="btn btn-ghost btn-breit" id="loeschen">Berichte von ' + esc(k.name) + ' löschen</button>';
    return html;
  }

  function zeige(meldung) {
    var ids = Object.keys(daten.kinder);
    if (!gewaehlt || !daten.kinder[gewaehlt]) gewaehlt = ids[0];
    var kopf = '<header class="kopf"><a class="zurueck" href="../" aria-label="Zur Startseite">←</a><h1 class="gold">Elternansicht</h1></header>';
    var hinweis = meldung ? '<p class="karte meldung-' + meldung[0] + '">' + meldung[1] + '</p>' : '';
    if (!ids.length) {
      app.innerHTML = '<div class="wrap">' + kopf + hinweis + '<section class="karte"><h2>Noch kein Bericht</h2>' +
        '<p>Hier erscheinen die Berichte, die Ihr Kind aus der App schickt: Startseite oder Fach öffnen, dann <b>„📤 Bericht an deine Eltern“</b> antippen und per WhatsApp, Signal oder Mail senden.</p>' +
        '<p>Tippen Sie den Link auf diesem Handy an. Der Bericht wird hier gespeichert, mit jedem weiteren Bericht entsteht ein Verlauf. Die Daten werden nicht ins Internet übertragen.</p></section></div>';
      return;
    }
    var reiter = ids.length > 1 ? '<div class="reihe kinder">' + ids.map(function (id) {
      return '<button class="btn ' + (id === gewaehlt ? 'btn-gold' : 'btn-ghost') + '" data-kind="' + id + '">' + esc(daten.kinder[id].name) + '</button>';
    }).join('') + '</div>' : '';
    app.innerHTML = '<div class="wrap">' + kopf + hinweis + reiter + kindAnsicht(gewaehlt) +
      '<footer class="fuss"><p>Die Berichte bleiben auf diesem Gerät.</p></footer></div>';
    app.querySelectorAll('[data-kind]').forEach(function (b) { b.onclick = function () { gewaehlt = b.dataset.kind; zeige(); }; });
    document.getElementById('loeschen').onclick = function () {
      if (!confirm('Alle Berichte von ' + daten.kinder[gewaehlt].name + ' auf diesem Gerät löschen?')) return;
      delete daten.kinder[gewaehlt]; gewaehlt = null; speichern(); zeige();
    };
  }

  // Link mit Bericht? Aufnehmen, dann den #-Teil entfernen (Neuladen nimmt ihn nicht doppelt auf).
  // Auch bei offener Seite (hashchange), denn ein weiterer Link ändert dann nur den #-Teil.
  function verarbeite() {
    var code = location.hash.indexOf('#b=') === 0 ? location.hash.slice(3) : '';
    if (!code) return zeige();
    E.auspacken(code).then(function (b) {
      var neu = !(daten.kinder[b.i] && daten.kinder[b.i].berichte.some(function (x) { return x.t === b.t; }));
      gewaehlt = aufnehmen(b);
      history.replaceState(null, '', location.pathname);
      zeige(['ok', neu ? '✓ Neuer Bericht von ' + esc(b.n) + ' gespeichert.' : 'Diesen Bericht von ' + esc(b.n) + ' gibt es schon.']);
    }).catch(function () {
      zeige(['fehler', 'Dieser Link ist unvollständig. Bitte den Bericht noch einmal schicken lassen.']);
    });
  }
  window.addEventListener('hashchange', verarbeite);
  verarbeite();
})();
