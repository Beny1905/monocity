/* ===== MONOCITY · EĞLENCE OYUNLARI (oyunlar.js) — T105 ===== */
(function(){
  'use strict';
  if(window.__EG) return;
  var EG = window.__EG = {mods:{}, order:[]};
  function DB(){ return window.MONOCITY_DB; }
  function uid(){ return (window.MONOCITY_AUTH && MONOCITY_AUTH.uid) || null; }
  function myName(){ try{ return (window.MONOCITY_ACCOUNT && MONOCITY_ACCOUNT.getName()) || 'Sen'; }catch(e){ return 'Sen'; } }
  function toast(m){ try{ if(window.MONOCITY_PROFILE && MONOCITY_PROFILE.toast) return MONOCITY_PROFILE.toast(m); }catch(e){} }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function LAPI(){ return window.MONOCITY_LOBBY_API; }
  function sfx(k){ try{ if(window.monocitySfx) monocitySfx(k); }catch(e){} }
  EG.esc = esc; EG.toast = toast;

  /* ---------- tohumlu rastgele (herkeste aynı sonuç) ---------- */
  function rnd(S){ S.rs = (S.rs + 0x6D2B79F5) | 0; var t = S.rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function shuffle(S, a){ for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd(S) * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function range(n){ var a = []; for(var i = 0; i < n; i++) a.push(i); return a; }
  EG.rnd = rnd; EG.shuffle = shuffle; EG.range = range;

  /* ---------- iskambil kartı (B: Monocity) ---------- */
  var SU = ['♠', '♥', '♦', '♣'], RK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  function cs(c){ return Math.floor(c / 13); } function cr(c){ return c % 13; }
  EG.cs = cs; EG.cr = cr; EG.SU = SU; EG.RK = RK;
  EG.card = function(c, cls, attr){ var s = cs(c), r = cr(c), red = s === 1 || s === 2;
    return '<div class="egC' + (red ? ' rd' : '') + (cls ? ' ' + cls : '') + '"' + (attr || '') + '><b>' + RK[r] + '<br>' + SU[s] + '</b><i>' + SU[s] + '</i></div>'; };
  EG.back = function(cls, attr){ return '<div class="egC bk' + (cls ? ' ' + cls : '') + '"' + (attr || '') + '><u>M</u></div>'; };
  EG.cname = function(c){ return RK[cr(c)] + SU[cs(c)]; };
  /* ---------- okey taşı: 0-103 = renk*26 + (sayı-1)*2 + kopya, 104/105 sahte okey ---------- */
  var TCOL = ['r', 'y', 'g', 'b'];
  EG.tc = function(t){ return t >= 104 ? -1 : Math.floor(t / 26); };
  EG.tn = function(t){ return t >= 104 ? 0 : Math.floor((t % 26) / 2) + 1; };
  EG.tile = function(t, cls, attr, okey){ if(t == null) return ''; var fake = t >= 104, c = fake ? 'p' : TCOL[EG.tc(t)], n = fake ? '★' : EG.tn(t), ok = okey != null && !fake && EG.tc(t) === okey[0] && EG.tn(t) === okey[1];
    return '<div class="egT ' + c + (ok ? ' ok' : '') + (cls ? ' ' + cls : '') + '"' + (attr || '') + '><b>' + n + '</b><i></i></div>'; };
  EG.tback = function(cls){ return '<div class="egT bk' + (cls ? ' ' + cls : '') + '"><u>M</u></div>'; };

  /* ---------- oyun kaydı ---------- */
  EG.reg = function(m){ EG.mods[m.key] = m; EG.order.push(m.key); };

  /* ---------- masa (tam ekran) ---------- */
  var el = null, G = null;
  function stg(){ return el.querySelector('.stg'); }
  function fit(){ if(!el) return; var k = Math.min(innerWidth / 1000, innerHeight / 450); stg().style.transform = 'translate(-50%,-50%) scale(' + k + ')'; }
  function build(){ if(el) return; el = document.createElement('div'); el.id = 'egG'; el.innerHTML = '<div class="stg"></div>'; document.body.appendChild(el);
    window.addEventListener('resize', fit); el.addEventListener('click', onClick); bindDrag(); }
  function open(){ build(); el.classList.add('show'); fit(); }
  function close(){ stopAll(); if(el){ el.classList.remove('show'); var x = el.querySelectorAll(':scope > .egCh, :scope > .egBub, :scope > .egEmo'); [].forEach.call(x, function(n){ n.remove(); }); } }
  EG.isOpen = function(){ return !!(el && el.classList.contains('show')); };

  function seatName(i){ return (G && G.pl[i] && G.pl[i].n) || ('Oyuncu ' + (i + 1)); }
  EG.name = function(S, i){ return (S.pl[i] && S.pl[i].n) || ('Oyuncu ' + (i + 1)); };
  function isBot(i){ var p = G.pl[i]; return !p || p.b || (G.S && G.S.gone && G.S.gone[i]) || (G.dc && G.dc[i]); }
  function hostSeat(){ for(var i = 0; i < G.pl.length; i++){ var p = G.pl[i]; if(p && !p.b && !(G.S.gone && G.S.gone[i]) && !(G.dc && G.dc[i])) return i; } return -1; }
  function amHost(){ return !G.online || hostSeat() === G.me; }
  EG.amHost = function(){ return !!G && amHost(); };
  EG.avatar = function(p){ if(!p || p.b) return ''; try{ return (window.monocityAvatarSrc && monocityAvatarSrc(p.u === uid() ? '__me' : p.u)) || window.MONOCITY_DEFAULT_AVATAR || ''; }catch(e){ return ''; } };
  /* koltuk kutusu: avatar + isim + bilgi */
  EG.seat = function(S, i, info, cls){ var p = S.pl[i] || {}, a = EG.avatar(p), turn = G && G.mod.turn && G.mod.turn(S) === i && !S.over;
    return '<div class="egSeat' + (turn ? ' on' : '') + (cls ? ' ' + cls : '') + '"><div class="av">' + (a ? '<img alt="" src="' + esc(a) + '">' : '<span>🤖</span>') + '</div><div class="tx"><b>' + esc(EG.name(S, i)) + (i === G.me ? ' (Sen)' : '') + '</b><small>' + (info || '') + '</small></div></div>'; };
  /* 4 kişilik yerleşim: ben altta, sıradaki sağda */
  EG.pos = function(S, i){ var n = S.n, d = (i - G.me + n) % n; if(n === 2) return d === 0 ? 'b' : 't'; if(n === 3) return ['b', 'r', 'l'][d]; return ['b', 'r', 't', 'l'][d]; };

  /* oyuncu plakası: profil resmi + nick + bilgi kutucukları + süre */
  EG.plate = function(S, i, chips, cls, st){ var p = S.pl[i] || {}, a = EG.avatar(p), turn = G && G.mod.turn && G.mod.turn(S) === i && !S.over && !S.wait, gone = S.gone && S.gone[i];
    var ch = (chips || []).map(function(c){ return '<div class="chip' + (c[2] ? ' ' + c[2] : '') + '">' + c[0] + '<b>' + c[1] + '</b></div>'; }).join('');
    return '<div class="egPl' + (turn ? ' on' : '') + (gone ? ' out' : '') + (cls ? ' ' + cls : '') + '" data-seat="' + i + '"' + (st ? ' style="' + st + '"' : '') + '><div class="av">' + (a ? '<img alt="" src="' + esc(a) + '">' : '<span>🤖</span>') + (turn ? '<em class="rg"></em>' : '') + '</div>' +
      '<div class="nm"><b>' + esc(EG.name(S, i)) + '</b><small' + (turn ? ' class="egTs"' : '') + '>' + (turn ? '⏱' : (gone ? 'çıktı' : '&nbsp;')) + '</small></div>' + ch + (turn ? '<div class="egTm"><i></i></div>' : '') + '</div>'; };
  /* 4 kişilik masa iskeleti */
  var PLXY = {t:'left:50%;top:-48px;transform:translateX(-50%);z-index:7', l:'left:4px;top:86px', r:'right:4px;top:86px', b:'left:50%;bottom:2px;transform:translateX(-50%);z-index:7'};
  EG.table = function(S, me, chips, nCards){ var h = '';
    for(var i = 0; i < S.n; i++){ var p = EG.pos(S, i), side = p === 'l' || p === 'r';
      h += EG.plate(S, i, chips ? chips(i) : [], side ? 'v' : '', PLXY[p]);
      if(i === me || !nCards) continue; var nc = Math.min(nCards(i), side ? 10 : 13); if(nc <= 0) continue; var bb = '';
      if(p === 't'){ for(var j = 0; j < nc; j++) bb += EG.back('xs', ' style="margin:0 -9px"'); h += '<div style="position:absolute;left:50%;top:8px;transform:translateX(-50%);display:flex">' + bb + '</div>'; }
      else { for(var k = 0; k < nc; k++) bb += EG.back('xs', ' style="position:absolute;left:0;top:' + (k * 10) + 'px"'); h += '<div style="position:absolute;' + (p === 'l' ? 'left:116px' : 'right:116px') + ';top:62px;width:30px;height:140px">' + bb + '</div>'; } }
    return h; };
  function topBar(){ var m = G.mod;
    return '<div class="top"><button type="button" class="bk" data-a="back">‹ ÇIK</button><span class="ttl">' + m.ic + ' ' + esc(m.name) + '</span>' + (m.sub ? '<span class="sub">' + m.sub(G.S) + '</span>' : '') + '<span class="sp"></span>' + vcHtml() + chBtn() + '</div>'; }
  var LT = null; EG.later = function(ms){ clearTimeout(LT); LT = setTimeout(function(){ if(G && el && !DR) render(); }, ms); };
  function waitHtml(){ var S = G.S; if(!S.wait || S.over) return ''; return '<div class="ov egWt"><div class="bx"><h3 style="font-size:24px">📋 EL SONU</h3><p>' + (S.wait.txt || '') + '</p>' + (S.wait.html || '') + '<div class="row">' + (amHost() ? '<button type="button" class="bt g" data-a="nh">▶ SONRAKİ EL</button>' : '<button type="button" class="bt s" disabled>⏳ Kurucu yeni eli başlatacak</button>') + '</div></div></div>'; }
  function render(){ if(!G || !el) return; var sc = G.mod.score ? G.mod.score(G.S, G.me) : ''; var h = topBar() + '<div class="tbl">' + G.mod.view(G.S, G.me, G.ui) + '</div>' + (sc ? '<div class="egSc">' + sc + '</div>' : '') + waitHtml() + rqHtml();
    var keep = stg().querySelectorAll(':scope > .ov:not(.egWt):not(.egRq)'); stg().innerHTML = h; [].forEach.call(keep, function(o){ stg().appendChild(o); }); tmPaint(); if(G.S.an){ var an = G.S.an; G.S.an = null; runAnim(an); } }
  /* uçan kart / taş animasyonu */
  function q(sel){ if(!sel) return null; var n = /^nt:(\d+)$/.exec(sel); if(n){ return (G && +n[1] === G.me && stg().querySelector('[data-nt]')) || q('seat:' + n[1]); } var m = /^seat:(\d+)$/.exec(sel); if(m) return stg().querySelector('[data-seat="' + m[1] + '"] .av') || stg().querySelector('[data-seat="' + m[1] + '"]'); return stg().querySelector('[data-' + sel + ']'); }
  function runAnim(list){ var k = Math.min(innerWidth / 1000, innerHeight / 450);
    list.forEach(function(a){ var f = q(a.from), t = q(a.to); if(!f || !t) return; var fr = f.getBoundingClientRect(), tr = t.getBoundingClientRect(); var hideT = a.to === 'last';
      if(hideT) t.style.visibility = 'hidden';
      setTimeout(function(){ var d = document.createElement('div'); d.className = 'egFly'; d.innerHTML = a.t ? (a.c == null ? EG.tback() : EG.tile(a.c)) : (a.c == null ? EG.back(a.sm ? 'sm' : '') : EG.card(a.c, a.sm ? 'sm' : '')); el.appendChild(d);
        var w = d.firstChild.offsetWidth * k, hh = d.firstChild.offsetHeight * k; d.style.transform = 'translate(' + (fr.left + fr.width / 2 - w / 2) + 'px,' + (fr.top + fr.height / 2 - hh / 2) + 'px) scale(' + (k * 0.8) + ')';
        d.style.transformOrigin = '0 0'; d.getBoundingClientRect(); d.style.transition = 'transform .38s cubic-bezier(.3,.7,.3,1)';
        d.style.transform = 'translate(' + (tr.left + tr.width / 2 - w / 2) + 'px,' + (tr.top + tr.height / 2 - hh / 2) + 'px) scale(' + k + ')';
        setTimeout(function(){ d.remove(); if(hideT && t.isConnected) t.style.visibility = ''; }, 400); }, a.d || 0); }); }
  /* süre çubuğu (her saniye, yeniden çizmeden) */
  var TURN_MS = 20000;
  function tmPaint(){ if(!G || !el) return; var left = Math.max(0, TURN_MS - (Date.now() - (G.turnAt || Date.now()))), b = el.querySelector('.egTm i'), s = el.querySelector('.egTs');
    if(b){ b.style.width = (left / TURN_MS * 100) + '%'; b.style.background = left < 6000 ? '#ef4444' : '#4ade80'; } if(s) s.textContent = '⏱ ' + Math.ceil(left / 1000) + ' sn'; }
  EG.render = function(){ render(); };
  /* ses ikonları + canlı sayaçlar */
  setInterval(function(){ if(!G || !el || !el.classList.contains('show')) return;
    if(G.mod.refresh && !DR && !(document.activeElement && document.activeElement.tagName === 'INPUT')){ render(); return; }
    tmPaint(); var o = el.querySelector('.top .vc'); if(!o) return; var t = document.createElement('div'); t.innerHTML = vcHtml(); var n = t.firstChild; if(n && n.innerHTML !== o.innerHTML) o.innerHTML = n.innerHTML; }, 1000);

  /* ---------- akış ---------- */
  function newState(seed){ var S = {n:G.pl.length, pl:G.pl, rs:seed | 0, gone:{}, log:'', over:null, o:G.o || {}}; G.mod.init(S, G.o || {}); return S; }
  function start(o){ stopAll(); open();
    G = {mod:EG.mods[o.k], k:o.k, pl:o.pl, me:o.me, online:!!o.code, code:o.code || null, o:o.o || {}, offs:[], ui:{}, dead:false, dc:{}, last:Date.now(), fromLb:!!o.fromLb};
    CH.open = false; CH.un = 0; CH.hist = []; chPanel();
    [].forEach.call(stg().querySelectorAll('.ov'), function(x){ x.remove(); }); [].forEach.call(el.querySelectorAll(':scope > .egBub, :scope > .egEmo, :scope > .egGh'), function(x){ x.remove(); });
    G.S = newState(o.seed || 1); G.turnAt = Date.now();
    render();
    if(G.online){ var g = G, ref = DB().ref('ludoR/' + G.code);
      var fa = ref.child('a').on('child_added', function(s){ if(g.dead) return; var a = s.val(); if(a) apply(a); });
      g.offs.push(function(){ ref.child('a').off('child_added', fa); });
      var fd = ref.child('dc').on('child_added', function(s){ if(g.dead) return; var u = s.key; g.pl.forEach(function(p, i){ if(p && p.u === u && i !== g.me) g.dc[i] = 1; }); schedule(); });
      g.offs.push(function(){ ref.child('dc').off('child_added', fd); });
      try{ ref.child('dc/' + uid()).onDisconnect().set(Date.now()); }catch(e){} }
    schedule(); hb(); }
  function stopAll(){ if(G){ G.dead = true; clearTimeout(G.botT); clearTimeout(G.tickT); (G.offs || []).forEach(function(f){ try{ f(); }catch(e){} });
      try{ if(G.online && !G.S.over && !G.left) DB().ref('ludoR/' + G.code + '/a').push({t:'q', by:G.me}); }catch(e){}
      try{ if(G.online) DB().ref('ludoR/' + G.code + '/dc/' + uid()).onDisconnect().cancel(); }catch(e){} }
    G = null; }
  function send(a){ if(!G) return; if(G.online){ DB().ref('ludoR/' + G.code + '/a').push(a).catch(function(){ toast('❌ Bağlantı sorunu, tekrar dene.'); }); } else { var g = G; setTimeout(function(){ if(G === g) apply(a); }, 0); } }
  EG.send = function(a){ if(!G) return; send({t:'a', by:G.me, a:a}); };
  EG.G = function(){ return G; };
  function apply(a){ var g = G; if(!g) return; var S = g.S;
    if(a.t === 'ch'){ chRecv(a); return; }
    if(a.t === 'ra'){ if(!S.over || g.rq) return; g.rq = {by:a.by, acc:{}}; g.rq.acc[a.by] = 1; render(); rqCheck(); return; }
    if(a.t === 'rk'){ if(!g.rq) return; g.rq.acc[a.by] = 1; render(); rqCheck(); return; }
    if(a.t === 'rx'){ if(!g.rq) return; toast('❌ ' + seatName(a.by) + ' tekrar oynamak istemedi'); g.rq = null; render(); return; }
    if(a.t === 'n'){ g.rq = null; g.S = newState(a.seed); g.turnAt = Date.now(); [].forEach.call(stg().querySelectorAll('.ov'), function(o){ o.remove(); }); g.ui = {}; g.pend = false; render(); schedule(); return; }
    if(a.t === 'q'){ if(S.gone[a.by]) return; S.gone[a.by] = 1;
      if(a.by === g.me){ g.left = true; return; }
      var alive = 0; g.pl.forEach(function(p, i){ if(p && !p.b && !S.gone[i]) alive++; });
      toast('🚪 ' + seatName(a.by) + (a.rs ? ' teslim oldu' : ' oyundan çıktı') + (S.n > 2 && !S.over ? ' — yerine bot oynayacak' : ''));
      if(!S.over && (S.n === 2 || (g.mod.endOnQuit && g.mod.endOnQuit(S, a.by)))){ S.over = {w:[1 - a.by], txt:(a.rs ? 'Rakip teslim oldu' : 'Rakip oyundan çıktı')}; showEnd(); }
      render(); schedule(); return; }
    if(a.t === 'a'){ if(S.over) return; var ok = false; try{ ok = g.mod.act(S, a.by, a.a); }catch(e){ console.warn('EG act', e); }
      g.pend = false; if(!ok){ schedule(); return; } g.last = Date.now(); g.turnAt = Date.now(); if(a.by === g.me) g.ui = {};
      render(); if(S.fx){ fx(S.fx); S.fx = null; } if(S.over){ showEnd(); return; } schedule(); }
  }
  EG.apply = apply;
  function fx(f){ if(f === 'win') sfx('win'); else if(f === 'hit') sfx('hit'); else sfx('tick'); }
  /* bot / süre: sadece kurucu (host) çalıştırır */
  function schedule(){ var g = G; if(!g) return; clearTimeout(g.botT); if(g.S.over || !amHost()) return;
    g.botT = setTimeout(function(){ if(G !== g || g.S.over || g.pend || g.S.wait) return; var S = g.S;
      for(var i = 0; i < S.n; i++){ if(!isBot(i)) continue; var a = null; try{ a = g.mod.bot(S, i); }catch(e){ console.warn('EG bot', e); } if(a){ g.pend = true; send({t:'a', by:i, a:a}); if(!g.online) setTimeout(function(){ g.pend = false; }, 0); return; } }
    }, g.mod.botDelay ? g.mod.botDelay(g.S) : 750); }
  EG.schedule = function(){ schedule(); };
  /* süre dolunca (45 sn) kurucu, sırası gelen oyuncunun yerine oynar · tombala gibi oyunlarda tick */
  function hb(){ var g = G; if(!g) return; clearTimeout(g.tickT);
    g.tickT = setTimeout(function(){ if(G !== g) return; hb(); if(g.S.over || !amHost()) return;
      if(g.mod.tick){ var ta = g.mod.tick(g.S, Date.now()); if(ta && !g.pend){ var tb = g.me; if(ta._by != null){ tb = ta._by; delete ta._by; } g.pend = true; send({t:'a', by:tb, a:ta}); if(!g.online) setTimeout(function(){ g.pend = false; }, 0); } }
      var t = g.mod.turn ? g.mod.turn(g.S) : -1; if(t >= 0 && !g.S.wait && !isBot(t) && !g.mod.noTimer && Date.now() - (g.turnAt || g.last) > TURN_MS + 600 && !g.pend){ var a = g.mod.bot(g.S, t); if(a){ g.pend = true; g.last = Date.now(); toast('⏰ ' + seatName(t) + ' için süre doldu'); g.turnAt = Date.now(); send({t:'a', by:t, a:a}); } }
    }, 1000); }

  /* ---------- tekrar oyna isteği (tavladaki gibi) ---------- */
  function humans(g, others){ var r = []; g.pl.forEach(function(p, i){ if(p && !p.b && !(g.S.gone && g.S.gone[i]) && !(g.dc && g.dc[i]) && (!others || i !== g.me)) r.push(i); }); return r; }
  function rqCheck(){ var g = G; if(!g || !g.rq) return; var all = humans(g, false).every(function(i){ return g.rq.acc[i]; }); if(all && amHost()) send({t:'n', seed:(Math.random() * 2147483647) | 0}); }
  function rqHtml(){ var g = G; if(!g || !g.rq || !g.S.over) return ''; var mine = !!g.rq.acc[g.me], wait = humans(g, false).filter(function(i){ return !g.rq.acc[i]; }).map(function(i){ return esc(seatName(i)); });
    return '<div class="ov egRq"><div class="bx"><h3 style="font-size:22px">🔁 TEKRAR OYNA</h3><p>' + (g.rq.by === g.me ? 'İsteğin gönderildi' : esc(seatName(g.rq.by)) + ' tekrar oynamak istiyor') + '</p>' + (wait.length ? '<p style="font-size:12px;color:#c7d2fe">Bekleniyor: ' + wait.join(', ') + '</p>' : '') +
      '<div class="row">' + (mine ? '<button type="button" class="bt s" disabled>⏳ Bekleniyor…</button>' : '<button type="button" class="bt s" data-a="rqN">REDDET</button><button type="button" class="bt g" data-a="rqY">KABUL ET</button>') + '</div></div></div>'; }
  /* ---------- sonuç ---------- */
  function showEnd(){ var g = G, S = g.S, o = S.over; if(!o) return; [].forEach.call(stg().querySelectorAll('.ov'), function(x){ x.remove(); });
    var win = (o.w || []).indexOf(g.me) >= 0, h = o.html || '';
    var ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="bx"><h3>' + (o.draw ? '🤝 BERABERE' : (win ? '🏆 KAZANDIN!' : '😔 KAYBETTİN')) + '</h3>' + (o.txt ? '<p>' + esc(o.txt) + '</p>' : '') + h +
      '<div class="row"><button type="button" class="bt g" data-a="again">🔁 TEKRAR OYNA</button><button type="button" class="bt s" data-a="home">ÇIKIŞ</button></div></div>';
    stg().appendChild(ov); sfx(win ? 'win' : 'tick'); }
  function leave(){ var fl = G && G.fromLb; close(); if(fl) setTimeout(function(){ try{ if(window.monocityOpenLobby) monocityOpenLobby(); }catch(e){} }, 150); else setTimeout(function(){ EG.hub(); }, 100); }

  /* ---------- dokunma ---------- */
  function ask(t, yes, no, yt, nt){ var o = document.createElement('div'); o.className = 'ov egAsk'; o.innerHTML = '<div class="bx"><p style="font-size:18px">' + t + '</p><div class="row"><button type="button" class="bt s" data-a="askN">' + (nt || 'VAZGEÇ') + '</button><button type="button" class="bt" data-a="askY">' + (yt || 'EVET') + '</button></div></div>'; o.__y = yes; o.__n = no; stg().appendChild(o); }
  EG.ask = ask;
  function quitMenu(){ var o = document.createElement('div'); o.className = 'ov egAsk';
    o.innerHTML = '<div class="bx"><h3 style="font-size:26px">Ne yapmak istersin?</h3><p>' + (G.S.n > 2 ? 'Teslim olursan yerine bot oynar, sen kaybetmiş sayılırsın.' : 'Teslim olursan rakibin kazanır.') + '</p>' +
      '<button type="button" class="bt" data-a="rsgn">🏳️ TESLİM OL</button><button type="button" class="bt s" data-a="lvY">🚪 ÇIK <small>(yenik sayılırsın)</small></button><button type="button" class="bt s" data-a="askN">VAZGEÇ</button></div>';
    stg().appendChild(o); }
  function onClick(e){ var g = G; if(Date.now() - DRT < 400) return;
    var b = e.target.closest('[data-a]');
    if(b){ var a = b.getAttribute('data-a'); if(b.disabled) return;
      if(a === 'askY' || a === 'askN'){ var o = b.closest('.ov'); var f = o && (a === 'askY' ? o.__y : o.__n); if(o) o.remove(); if(f) f(); return; }
      if(a === 'back'){ if(g && !g.S.over && (g.online || g.mod.askQuit !== false)) return quitMenu(); leave(); return; }
      if(a === 'home'){ leave(); return; }
      if(a === 'rsgn'){ var o3 = b.closest('.ov'); if(o3) o3.remove(); if(!g) return;
        if(g.online){ send({t:'q', by:g.me, rs:1}); g.left = true; if(g.S.n === 2){ setTimeout(function(){ if(G === g){ g.S.over = {w:[1 - g.me], txt:'Teslim oldun'}; render(); showEnd(); } }, 300); } else setTimeout(leave, 300); }
        else { g.S.over = {w:range(g.S.n).filter(function(i){ return i !== g.me; }), txt:'Teslim oldun'}; render(); showEnd(); }
        return; }
      if(a === 'lvY'){ var o4 = b.closest('.ov'); if(o4) o4.remove(); leave(); return; }
      if(a === 'nh'){ if(g && amHost() && g.S.wait) EG.send({nh:1}); return; }
      if(a === 'again'){ if(!g) return; var hum = humans(g, true); if(!g.online || !hum.length){ send({t:'n', seed:(Math.random() * 2147483647) | 0}); return; } if(g.rq){ toast('⏳ İstek zaten gönderildi'); return; } send({t:'ra', by:g.me}); return; }
      if(a === 'rqY'){ if(g && g.rq) send({t:'rk', by:g.me}); return; }
      if(a === 'rqN'){ if(g && g.rq) send({t:'rx', by:g.me}); return; }
      if(a === 'vsp'){ try{ monocityVoice.sp(); }catch(er){} setTimeout(render, 150); return; }
      if(a === 'vmic'){ try{ monocityVoice.mic(); }catch(er){} setTimeout(render, 600); return; }
      if(chClick(a, b)) return;
    }
    if(!g || g.S.over) return;
    var x = e.target.closest('[data-x]'); if(!x) return;
    var r = null; try{ r = g.mod.click(g.S, g.me, x, g.ui); }catch(er){ console.warn('EG click', er); }
    if(r === true){ render(); return; }
    if(r){ EG.send(r); }
  }

  /* ---------- sürükle-bırak (dokunma da çalışır) ---------- */
  var DR = null, DRT = 0;
  function dkind(e){ if(!e) return null; if(e.hasAttribute('data-drop')) return {k:e.getAttribute('data-drop'), v:e.getAttribute('data-v'), el:e}; var x = e.getAttribute('data-x'); if(x === 't') return {k:'tile', v:e.getAttribute('data-v'), el:e}; if(x === 'g') return {k:'g', v:e.getAttribute('data-v'), el:e}; return null; }
  function onDown(e){ var g = G; if(!g || g.S.over || e.button > 0) return; var s = e.target.closest('[data-drag]'); if(!s || !el.contains(s)) return;
    DR = {s:s, k:s.getAttribute('data-drag'), v:s.getAttribute('data-v'), x0:e.clientX, y0:e.clientY, mv:false, gh:null};
    if(s.hasAttribute('data-lp') && g.mod.lp){ var d0 = DR; DR.lpT = setTimeout(function(){ if(DR !== d0 || d0.mv) return; DRT = Date.now(); var r = null; try{ r = g.mod.lp(g.S, g.me, {k:d0.k, v:d0.v}, g.ui); }catch(er){} if(r){ d0.lp = true; render(); try{ navigator.vibrate && navigator.vibrate(25); }catch(e3){} } }, 450); } }
  function onMove(e){ if(!DR) return; if(!DR.mv){ if(Math.abs(e.clientX - DR.x0) + Math.abs(e.clientY - DR.y0) < 10) return; DR.mv = true; clearTimeout(DR.lpT); if(!DR.s.isConnected){ var s2 = stg().querySelector('[data-drag="' + DR.k + '"][data-v="' + DR.v + '"]'); if(s2) DR.s = s2; }
      var k = Math.min(innerWidth / 1000, innerHeight / 450), r = DR.s.getBoundingClientRect(), gh = document.createElement('div'); gh.className = 'egGh'; gh.innerHTML = DR.s.outerHTML;
      var grp = G && G.ui && G.ui.grp && DR.k === 't' && G.ui.grp.indexOf(+DR.v) >= 0 ? G.ui.grp : null; if(grp && grp.length > 1){ var hh = ''; grp.forEach(function(t){ var e0 = stg().querySelector('.rack .egT[data-v="' + t + '"]'); if(e0) hh += e0.outerHTML; }); gh.innerHTML = '<div style="display:flex;gap:0">' + hh + '</div>'; gh.classList.add('grp'); DR.off = grp.indexOf(+DR.v); }
      gh.style.width = (grp && grp.length > 1 ? (r.width / k) * grp.length : r.width / k) + 'px'; gh.style.height = (r.height / k) + 'px'; gh.style.transform = 'scale(' + (k * 1.08) + ')'; [].forEach.call(gh.querySelectorAll('.egT'), function(t){ t.style.width = (r.width / k) + 'px'; t.style.height = (r.height / k) + 'px'; t.style.flex = '0 0 auto'; }); el.appendChild(gh); DR.gh = gh; DR.w = r.width; DR.h = r.height; DR.s.style.opacity = '.35'; if(DR.k === 't') el.classList.add('drg'); }
    DR.gh.style.left = (e.clientX - DR.w / 2 - (DR.off || 0) * DR.w) + 'px'; DR.gh.style.top = (e.clientY - DR.h / 2) + 'px'; if(e.cancelable) e.preventDefault(); }
  function onUp(e){ if(!DR) return; var d = DR; DR = null; clearTimeout(d.lpT); el.classList.remove('drg'); if(!d.mv) return; DRT = Date.now(); if(d.gh) d.gh.remove(); d.s.style.opacity = ''; var g = G; if(!g || g.S.over) return;
    var t = document.elementFromPoint(e.clientX, e.clientY), dst = null, n = t;
    while(n && n !== el && !dst){ dst = dkind(n); n = n.parentElement; }
    if(!dst){ var f = el.querySelector('.felt'); if(f){ var r = f.getBoundingClientRect(); if(e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) dst = {k:'at'}; } }
    if(!dst) return; if(dst.el){ var rr = dst.el.getBoundingClientRect(); dst.sd = e.clientX < rr.left + rr.width / 2 ? 's' : 'e'; } var src = {k:d.k, v:d.v, el:d.s}, res = null;
    try{ if(g.mod.drop) res = g.mod.drop(g.S, g.me, src, dst, g.ui); else if(src.k === 'c' && dst.k === 'at') res = g.mod.click(g.S, g.me, d.s, g.ui); }catch(er){ console.warn('EG drop', er); }
    if(res === true){ render(); return; } if(res) EG.send(res); }
  function bindDrag(){ el.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove, {passive:false}); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', function(){ if(DR){ if(DR.gh) DR.gh.remove(); DR.s.style.opacity = ''; DR = null; } }); }

  /* ---------- sesli / yazılı sohbet ---------- */
  function vcHtml(){ if(!G || !G.online || !window.monocityVoice) return ''; var v = {}; try{ v = monocityVoice.state(); }catch(e){} return '<span class="vc"><button type="button" data-a="vsp" class="' + (v.sp ? 'on' : '') + '">' + (v.sp ? '🔊' : '🔇') + '</button><button type="button" data-a="vmic" class="' + (v.mic ? 'on' : '') + '">' + (v.mic ? '🎤' : '🎙️') + '</button></span>'; }
  var CH = {open:false, tab:'m', un:0, last:0, hist:[]};
  var CHQ = ['Bal akıyor 🍯', 'İyi oyun', 'Şanslısın', 'Acele et', 'Eline sağlık'];
  var CHE = ['😀', '😂', '😍', '😎', '😮', '😭', '😡', '👍', '👏', '🔥', '🍀', '🤝'];
  function chBtn(){ if(!G || !G.online) return ''; return '<button type="button" class="egChB" data-a="chat">💬' + (CH.un ? '<i>' + Math.min(CH.un, 9) + '</i>' : '') + '</button>'; }
  function chBadge(){ var b = el && el.querySelector('.egChB'); if(b) b.innerHTML = '💬' + (CH.un ? '<i>' + Math.min(CH.un, 9) + '</i>' : ''); }
  function chPanel(){ if(!el) return; var o = el.querySelector(':scope > .egCh');
    if(!CH.open || !G || !G.online){ if(o) o.remove(); return; }
    if(!o){ o = document.createElement('div'); o.className = 'egCh'; el.appendChild(o); }
    var h = '<div class="hd"><button type="button" data-a="chT" data-t="m" class="' + (CH.tab === 'm' ? 'on' : '') + '">💬 MESAJ</button><button type="button" data-a="chT" data-t="e" class="' + (CH.tab === 'e' ? 'on' : '') + '">😀 EMOJİ</button><button type="button" class="x" data-a="chX">✕</button></div>';
    if(CH.tab === 'm') h += '<div class="hs">' + (CH.hist.length ? CH.hist.map(function(m){ return '<div class="' + (m.me ? 'me' : '') + '"><b>' + esc(m.n) + ':</b> ' + esc(m.x) + '</div>'; }).join('') : '<i>Henüz mesaj yok</i>') + '</div><div class="qk">' + CHQ.map(function(q, i){ return '<button type="button" data-a="chQ" data-i="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div><div class="in"><input class="egChI" maxlength="60" placeholder="Mesaj yaz..." autocomplete="off"><button type="button" data-a="chS">GÖNDER</button></div>';
    else h += '<div class="em">' + CHE.map(function(e2, i){ return '<button type="button" data-a="chE" data-i="' + i + '">' + e2 + '</button>'; }).join('') + '</div>';
    o.innerHTML = h; var hs0 = o.querySelector('.hs'); if(hs0) hs0.scrollTop = hs0.scrollHeight; var inp = o.querySelector('.egChI'); if(inp) inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); chTyped(); } }); }
  function chSend(x){ if(!G || !G.online) return; var now = Date.now(); if(now - CH.last < 900){ toast('⏳ Biraz yavaş'); return; } CH.last = now;
    var a = {t:'ch', by:G.me, ts:now}; for(var k in x) a[k] = x[k]; send(a); CH.open = false; chPanel(); }
  function chTyped(){ var i = el && el.querySelector('.egChI'); if(!i) return; var v = String(i.value || '').replace(/\s+/g, ' ').trim().slice(0, 60); if(!v) return; try{ i.blur(); }catch(e){} chSend({x:v}); }
  function chRecv(a){ var g = G; if(!g || !el) return; if(a.ts && Date.now() - a.ts > 20000) return;
    var mine = a.by === g.me, nm = seatName(a.by); CH.hist.push({n:nm, x:a.e || a.x || '', me:mine}); if(CH.hist.length > 30) CH.hist.shift(); if(CH.open) chPanel();
    if(a.e){ var f = document.createElement('div'); f.className = 'egEmo'; f.innerHTML = a.e + '<small>' + esc(nm) + '</small>'; el.appendChild(f); setTimeout(function(){ f.remove(); }, 2300); }
    else if(a.x){ var L = el.querySelector(':scope > .egBub'); if(!L){ L = document.createElement('div'); L.className = 'egBub'; el.appendChild(L); }
      var b = document.createElement('div'); b.className = 'm ' + (mine ? 'me' : 'op'); b.innerHTML = '<b>' + esc(nm) + ':</b> ' + esc(String(a.x).slice(0, 60)); L.appendChild(b);
      while(L.children.length > 3) L.firstChild.remove(); setTimeout(function(){ b.classList.add('out'); setTimeout(function(){ b.remove(); }, 400); }, 3800); }
    if(!mine){ sfx('dm'); if(!CH.open){ CH.un++; chBadge(); } } }
  function chClick(a, b){
    if(a === 'chat'){ CH.open = !CH.open; if(CH.open){ CH.un = 0; chBadge(); } chPanel(); return true; }
    if(a === 'chX'){ CH.open = false; chPanel(); return true; }
    if(a === 'chT'){ CH.tab = b.getAttribute('data-t') === 'e' ? 'e' : 'm'; chPanel(); return true; }
    if(a === 'chQ'){ var q = CHQ[+b.getAttribute('data-i')]; if(q) chSend({x:q}); return true; }
    if(a === 'chE'){ var e2 = CHE[+b.getAttribute('data-i')]; if(e2) chSend({e:e2}); return true; }
    if(a === 'chS'){ chTyped(); return true; }
    return false; }

  /* ---------- yerel (bota karşı) başlat ---------- */
  EG.local = function(k, o, bots){ var m = EG.mods[k]; if(!m) return; var n = Math.max(m.min, Math.min(m.max, 1 + (bots == null ? (m.fixed || m.min) - 1 : bots)));
    var pl = [{u:uid(), n:myName()}]; for(var i = 1; i < n; i++) pl.push({b:1, n:'🤖 Bot ' + i});
    start({k:k, pl:pl, me:0, o:o || {}, seed:(Math.random() * 2147483647) | 0}); };
  EG.startRoom = function(code, r, fromLb){ var u = uid(), me = -1; (r.pl || []).forEach(function(p, i){ if(p && p.u === u) me = i; }); if(me < 0) return false;
    start({k:r.k, pl:r.pl, me:me, o:r.o || {}, seed:r.seed, code:code, fromLb:fromLb}); return true; };
  EG.startLocalPl = function(k, pl, o, fromLb){ start({k:k, pl:pl, me:0, o:o || {}, seed:(Math.random() * 2147483647) | 0, fromLb:fromLb}); };

  /* ================= EĞLENCE ekranı ================= */
  var HUB = {el:null, tab:'all'};
  var CARDS = [
    {k:'tavla', n:'TAVLA', p:'2', c:'linear-gradient(160deg,#7a4a22,#3e2410)', cat:'masa', ok:1},
    {k:'ludo', n:'LUDO', p:'2–4', c:'linear-gradient(160deg,#2563eb,#1e3a8a)', cat:'masa', ok:1},
    {k:'tb', n:'TOMBALA', p:'2–8', c:'linear-gradient(160deg,#dc2626,#7f1d1d)', cat:'masa'},
    {k:'okey', n:'OKEY', p:'4', c:'linear-gradient(160deg,#0f766e,#064e3b)', cat:'masa'},
    {k:'o101', n:'101 OKEY', p:'4', c:'linear-gradient(160deg,#9333ea,#4c1d95)', cat:'masa'},
    {k:'pisti', n:'PİŞTİ', p:'2 / 4', c:'linear-gradient(160deg,#ea580c,#7c2d12)', cat:'kart'},
    {k:'batak', n:'BATAK', p:'4', c:'linear-gradient(160deg,#1f2937,#030712)', cat:'kart'},
    {k:'koz', n:'KOZ MAÇA', p:'4', c:'linear-gradient(160deg,#334155,#0f172a)', cat:'kart'},
    {k:'pis7', n:'PİS YEDİLİ', p:'2–4', c:'linear-gradient(160deg,#16a34a,#14532d)', cat:'kart'},
    {k:'papaz', n:'PAPAZ KAÇTI', p:'3–4', c:'linear-gradient(160deg,#db2777,#831843)', cat:'kart'},
    {k:'blof', n:'BLÖF', p:'4', c:'linear-gradient(160deg,#4338ca,#1e1b4b)', cat:'kart'},
    {k:'bj', n:'21', p:'1–4 + KASA', c:'linear-gradient(160deg,#065f46,#022c22)', cat:'kart'}];
  var NAMES = {}; CARDS.forEach(function(c){ NAMES[c.k] = c.n; }); EG.NAMES = NAMES;
  function art(k){ var C = EG.card, T = EG.tile;
    switch(k){
      case 'tavla': return '<svg width="150" height="100" viewBox="0 0 150 100"><rect x="2" y="2" width="146" height="96" rx="8" fill="#5a3315" stroke="#2c1606" stroke-width="3"/><rect x="10" y="9" width="60" height="82" fill="#e5c58e"/><rect x="80" y="9" width="60" height="82" fill="#e5c58e"/><g fill="#9a2a20"><path d="M10 9 l5 34 l5-34z M30 9 l5 34 l5-34z M50 9 l5 34 l5-34z M80 91 l5-34 l5 34z M100 91 l5-34 l5 34z M120 91 l5-34 l5 34z"/></g><g fill="#2f4a3a"><path d="M20 9 l5 34 l5-34z M40 9 l5 34 l5-34z M60 9 l5 34 l5-34z M90 91 l5-34 l5 34z M110 91 l5-34 l5 34z M130 91 l5-34 l5 34z"/></g><circle cx="25" cy="80" r="7" fill="#fff" stroke="#999"/><circle cx="25" cy="66" r="7" fill="#fff" stroke="#999"/><circle cx="125" cy="18" r="7" fill="#222"/><circle cx="125" cy="32" r="7" fill="#222"/><rect x="88" y="52" width="22" height="22" rx="4" fill="#fff" transform="rotate(12 99 63)"/><circle cx="94" cy="58" r="2.4" fill="#111"/><circle cx="104" cy="68" r="2.4" fill="#111"/><circle cx="99" cy="63" r="2.4" fill="#111"/></svg>';
      case 'ludo': return '<svg width="96" height="96" viewBox="0 0 104 104"><rect width="104" height="104" rx="8" fill="#fff"/><rect width="40" height="40" fill="#ef4444"/><rect x="64" width="40" height="40" fill="#22c55e"/><rect y="64" width="40" height="40" fill="#3b82f6"/><rect x="64" y="64" width="40" height="40" fill="#facc15"/><path d="M40 40 L52 52 L40 64z" fill="#ef4444"/><path d="M40 40 L52 52 L64 40z" fill="#22c55e"/><path d="M64 40 L52 52 L64 64z" fill="#facc15"/><path d="M40 64 L52 52 L64 64z" fill="#3b82f6"/><g fill="#fff"><circle cx="13" cy="13" r="6"/><circle cx="27" cy="27" r="6"/><circle cx="77" cy="13" r="6"/><circle cx="91" cy="27" r="6"/><circle cx="13" cy="77" r="6"/><circle cx="27" cy="91" r="6"/><circle cx="77" cy="91" r="6"/><circle cx="91" cy="77" r="6"/></g></svg>';
      case 'tb': return '<svg viewBox="6 22 190 114" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width:96%;max-height:96%"><g transform="rotate(-7 80 70)"><rect x="12" y="26" width="140" height="66" rx="6" fill="#fff7e6" stroke="#b45309" stroke-width="2.5"/><rect x="12" y="26" width="140" height="11" rx="5" fill="#dc2626"/><text x="82" y="34.5" font-size="8" font-weight="900" fill="#fff" text-anchor="middle" font-family="Arial">TOMBALA</text><rect x="15" y="40" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="22" y="51" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">3</text><rect x="30" y="40" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="45" y="40" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="52" y="51" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">24</text><circle cx="52" cy="47.5" r="6" fill="#dc2626" opacity=".85"/><rect x="60" y="40" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="75" y="40" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="82" y="51" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">45</text><rect x="90" y="40" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="105" y="40" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="112" y="51" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">61</text><circle cx="112" cy="47.5" r="6" fill="#dc2626" opacity=".85"/><rect x="120" y="40" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="127" y="51" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">78</text><rect x="135" y="40" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="15" y="57" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="30" y="57" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="37" y="68" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">15</text><rect x="45" y="57" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="60" y="57" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="67" y="68" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">33</text><circle cx="67" cy="64.5" r="6" fill="#dc2626" opacity=".85"/><rect x="75" y="57" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="90" y="57" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="97" y="68" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">52</text><rect x="105" y="57" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="120" y="57" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="135" y="57" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="142" y="68" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">86</text><rect x="15" y="74" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="22" y="85" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">7</text><rect x="30" y="74" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="45" y="74" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="52" y="85" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">28</text><rect x="60" y="74" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="75" y="74" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="82" y="85" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">49</text><rect x="90" y="74" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="105" y="74" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="112" y="85" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">67</text><circle cx="112" cy="81.5" r="6" fill="#dc2626" opacity=".85"/><rect x="120" y="74" width="14" height="15" fill="#e5d3b0" stroke="#d6b26e" stroke-width=".6"/><rect x="135" y="74" width="14" height="15" fill="#fde68a" stroke="#d6b26e" stroke-width=".6"/><text x="142" y="85" font-size="8.5" font-weight="900" fill="#7c2d12" text-anchor="middle" font-family="Arial">90</text></g><path d="M150 62 C132 70 128 112 140 124 C150 132 178 132 186 122 C196 108 190 72 172 62 Z" fill="#4c0519" stroke="#fbbf24" stroke-width="2.5"/><path d="M150 62 C156 56 168 56 172 62" fill="none" stroke="#fbbf24" stroke-width="3"/><path d="M147 60 L175 60" stroke="#fde68a" stroke-width="2"/><ellipse cx="162" cy="60" rx="14" ry="4" fill="#7f1d1d"/><path d="M146 80 C150 76 156 78 158 82" stroke="#9f1239" stroke-width="2" fill="none" opacity=".7"/><circle cx="118" cy="116" r="11" fill="#d6a868" stroke="#8b5a2b" stroke-width="2"/><circle cx="118" cy="116" r="7.5" fill="none" stroke="#a16207" stroke-width=".8"/><text x="118" y="119.6" font-size="10" font-weight="900" fill="#451a03" text-anchor="middle" font-family="Arial">27</text><circle cx="146" cy="124" r="11" fill="#d6a868" stroke="#8b5a2b" stroke-width="2"/><circle cx="146" cy="124" r="7.5" fill="none" stroke="#a16207" stroke-width=".8"/><text x="146" y="127.6" font-size="10" font-weight="900" fill="#451a03" text-anchor="middle" font-family="Arial">90</text><circle cx="100" cy="128" r="11" fill="#d6a868" stroke="#8b5a2b" stroke-width="2"/><circle cx="100" cy="128" r="7.5" fill="none" stroke="#a16207" stroke-width=".8"/><text x="100" y="131.6" font-size="10" font-weight="900" fill="#451a03" text-anchor="middle" font-family="Arial">7</text></svg>';
      case 'okey': return '<div class="hr">' + T(16, 'sm') + T(48, 'sm') + T(78, 'sm') + T(104, 'sm') + '</div>';
      case 'o101': return '<div class="hn" style="top:4%">101</div><div class="hr" style="margin-top:26%">' + T(16, 'sm') + T(18, 'sm') + T(20, 'sm') + '</div>';
      case 'pisti': return '<div class="hr fan">' + C(23) + C(10) + C(36) + '</div>';
      case 'batak': return '<div class="hr fan">' + C(12) + C(0) + '</div>';
      case 'koz': return '<div style="font-size:78px;color:#e5e7eb;text-shadow:0 4px 10px rgba(0,0,0,.6)">♠</div>';
      case 'pis7': return '<div class="hr fan">' + C(19) + C(45) + '</div>';
      case 'papaz': return '<div class="hr fan">' + EG.back() + C(51) + EG.back() + '</div>';
      case 'blof': return '<div class="hr fan">' + EG.back() + EG.back() + '</div><div style="position:absolute;right:12%;top:8%;font-size:36px">🤔</div>';
      case 'bj': return '<div class="hn" style="font-size:22px;right:10%;left:auto;top:6%">21</div><div class="hr fan">' + C(0) + C(25) + '</div>';
    } return ''; }
  function friendsOn(){ var S = window.MONOCITY_SOCIAL; if(!S || !S.friends || !S.status) return 0; try{ return S.friends().filter(function(u){ return S.status(u).c !== 'off'; }).length; }catch(e){ return 0; } }
  EG.hub = function(){
    if(!HUB.el){ HUB.el = document.createElement('div'); HUB.el.id = 'egHub'; document.body.appendChild(HUB.el);
      HUB.el.addEventListener('click', function(e){ var t = e.target.closest('[data-h]'); if(!t) return; var a = t.getAttribute('data-h');
        if(a === 'x'){ HUB.el.classList.remove('show'); return; }
        if(a === 'tab'){ HUB.tab = t.getAttribute('data-v'); paintHub(); return; }
        if(a === 'opt'){ e.stopPropagation(); var c0 = t.closest('.hC'), k0 = c0.getAttribute('data-k'), m0 = EG.mods[k0], o0 = {}; o0[t.getAttribute('data-o')] = +t.getAttribute('data-v'); HUB.el.classList.remove('show'); openGame(k0, o0); return; }
        if(a === 'g'){ var k = t.getAttribute('data-k'), m = EG.mods[k];
          if(m && m.opts && m.opts.length){ if(t.classList.contains('fl')) return; HUB.el.querySelectorAll('.hC.fl').forEach(function(x){ x.classList.remove('fl'); x.innerHTML = x.__f; });
            t.__f = t.innerHTML; t.classList.add('flp'); setTimeout(function(){ t.classList.add('fl'); var op = m.opts[0];
              t.innerHTML = '<div class="bk"><div class="bt">' + c2n(k) + '</div>' + op.v.map(function(v){ return '<button type="button" data-h="opt" data-o="' + op.k + '" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>'; }, 170);
            setTimeout(function(){ t.classList.remove('flp'); }, 360); return; }
          HUB.el.classList.remove('show'); openGame(k); } }); }
    paintHub(); HUB.el.classList.add('show'); return true; };
  function paintHub(){ var on = friendsOn();
    var h = '<div class="hTop"><button type="button" class="hBk" data-h="x">‹ GERİ</button><span class="hIc">🎲</span><span class="hTt">EĞLENCE</span><span class="hOn"><i></i>' + on + ' arkadaş çevrimiçi</span></div>' +
      '<div class="hTabs">' + [['all', 'TÜMÜ'], ['masa', '🎲 MASA OYUNLARI'], ['kart', '🃏 KART OYUNLARI']].map(function(x){ return '<button type="button" data-h="tab" data-v="' + x[0] + '" class="' + (HUB.tab === x[0] ? 'a' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="hGr">';
    CARDS.forEach(function(c){ if(HUB.tab !== 'all' && c.cat !== HUB.tab) return; var ok = c.ok || EG.mods[c.k];
      h += '<div class="hC' + (ok ? '' : ' lk') + '" data-h="g" data-k="' + c.k + '" style="--g:' + c.c + '"><div class="pp">👤 ' + c.p + '</div>' + (ok ? '<div class="ok">OYNA</div>' : '') + '<div class="art">' + art(c.k) + '</div><div class="nm">' + c.n + '</div></div>'; });
    HUB.el.innerHTML = h + '</div>'; }
  function c2n(k){ var c = CARDS.filter(function(x){ return x.k === k; })[0]; return c ? c.n : k; }
  function openGame(k, o){
    if(k === 'tavla'){ clearEg(function(){ if(window.monocityTavlaLobby) monocityTavlaLobby(); else if(window.monocityOpenTavla) monocityOpenTavla(); }); return; }
    if(k === 'ludo'){ clearEg(function(){ if(window.__mcOpenFun){ __mcOpenFun(); setTimeout(function(){ var c = document.querySelector('#f31Fun .gr .c.lu'); if(c) c.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); }, 30); } else if(window.monocityOpenLudo) monocityOpenLudo(); }); return; }
    if(!EG.mods[k]){ toast('🎉 Yakında geliyor!'); return; }
    egLobby(k, o); }
  window.__egHubBack = function(){ EG.hub(); };
  window.monocityEgHub = function(){ return EG.hub(); };

  /* ================= LOBİ ================= */
  var LB = {code:null, eg:null, egb:0, offs:[], lastGo:null, mxSent:null};
  function canOnline(){ var API = LAPI(); return !!(DB() && uid() && API && (!API.available || API.available())); }
  function clearEg(cb){ try{ var st = LAPI() && LAPI().state(); if(st && st.code && !st.entered && st.role === 'host' && DB()){ DB().ref('rooms/' + st.code + '/eg').remove(); DB().ref('rooms/' + st.code + '/meta/mx').remove(); } }catch(e){} cb && cb(); }
  function egLobby(k, o0){ var m = EG.mods[k], oo = o0 || (m.defOpt ? m.defOpt() : {});
    if(!canOnline()){ EG.local(k, oo); return; }
    var API = LAPI(), st = API.state();
    var go = function(){ var code = API.state().code; if(!code) return; var R = function(p){ return DB().ref('rooms/' + code + '/' + p); };
      R('tv').remove().catch(function(){}); R('lu').remove().catch(function(){});
      R('egb').set(0).catch(function(){});
      R('eg').set({g:k, o:oo, ts:Date.now()}).catch(function(){});
      R('cfg').set({mod:'ozel', tur:'4', para:4, zar:1, ucr:0, thb:'tr'}).catch(function(){});
      if(k === 'tb') R('meta/mx').set(7).catch(function(){}); else R('meta/mx').remove().catch(function(){});
      LB.eg = {g:k, o:oo}; LB.code = null;
      setTimeout(function(){ try{ if(window.monocityOpenLobby) monocityOpenLobby(); }catch(e){} }, 150); };
    if(st && st.code && !st.entered && st.role === 'host') go();
    else { if(st && st.code) try{ API.leave(); }catch(e){} API.create(function(err){ if(err){ toast('❌ Lobi kurulamadı: ' + err); return; } go(); }); }
  }
  window.__egMax = function(){ var g = LB.eg && LB.code ? LB.eg.g : null; return g === 'tb' ? 7 : 3; };
  window.__egCur = function(){ return LB.code && LB.eg ? LB.eg.g : null; };
  function lbWatch(){ var API = LAPI(); if(!API || !DB()) return; var st = null; try{ st = API.state(); }catch(e){}
    var code = st && st.code && !st.entered ? st.code : null;
    if(code !== LB.code){ LB.offs.forEach(function(f){ try{ f(); }catch(e){} }); LB.offs = []; LB.code = code; LB.eg = null; LB.egb = 0;
      if(code) ['eg', 'egb', 'egGo'].forEach(function(k){ var r = DB().ref('rooms/' + code + '/' + k), cb = r.on('value', function(s){ var v = s && s.val();
        if(k === 'egGo'){ if(v) goRecv(v); } else if(k === 'eg'){ LB.eg = v || null; deco(); } else { LB.egb = Math.max(0, Math.min(7, +v || 0)); deco(); } }); LB.offs.push(function(){ r.off('value', cb); }); }); }
  }
  setInterval(lbWatch, 1000);
  function isHost(){ try{ return LAPI().state().role === 'host'; }catch(e){ return false; } }
  function members(){ var st = LAPI().state(); return [{u:st.hostUid, n:st.hostName || myName()}].concat((st.guests || []).filter(function(g){ return g && g.uid; }).map(function(g){ return {u:g.uid, n:g.name || 'Oyuncu', ready:g.ready}; })); }
  /* lobi görünümü */
  function deco(){ var l = document.getElementById('mcLobby2'); if(!l) return; var on = !!(LB.code && LB.eg && EG.mods[LB.eg.g]), k = on ? LB.eg.g : null;
    if(l.classList.contains('mcEgLb') !== on) l.classList.toggle('mcEgLb', on);
    var tb = on && k === 'tb'; if(l.classList.contains('mcTbLb') !== tb) l.classList.toggle('mcTbLb', tb);
    var opt = l.querySelector(':scope > .egOpt'), tvlu = l.classList.contains('mcTvLb') || l.classList.contains('mcLuLb');
    if(!on){ var set0 = l.querySelector('#mcLbSet'); if(set0) [].forEach.call(set0.querySelectorAll('[data-eghid]'), function(x){ x.style.display = ''; x.removeAttribute('data-eghid'); });
      var bar0 = l.querySelector(':scope > .egLbBar'); if(bar0) bar0.remove(); var t0 = l.querySelector('#egTbSeats'); if(t0) t0.remove(); [].forEach.call(l.querySelectorAll('.egBotB,.egBotC'), function(x){ x.remove(); }); [].forEach.call(l.querySelectorAll('.egIsBot'), function(x){ x.classList.remove('egIsBot'); });
      if(tvlu && LB.code){ optBar(l, opt, null); } else if(opt) opt.remove(); return; }
    var m = EG.mods[k], c = l.querySelector('#mcLbSet .t'), want = NAMES[k] || m.name; if(c && c.textContent !== want) c.textContent = want;
    var set = l.querySelector('#mcLbSet'); if(set) [].forEach.call(set.children, function(x){ if(x === c || x.classList.contains('t')) return; if(x.style.display !== 'none'){ x.style.display = 'none'; x.setAttribute('data-eghid', '1'); } });
    optBar(l, opt, m);
    var hb = isHost();
    if(tb) return tbSeats(l);
    /* 4 kişilik: boş koltuklarda bot */
    var seats = l.querySelectorAll('#lbSeats .lbSeat'), nb = LB.egb, emp = 0;
    [].forEach.call(seats, function(se){ var e0 = se.classList.contains('empty'), bc = se.querySelector(':scope > .egBotC'), bb = se.querySelector(':scope > .egBotB');
      if(!e0){ if(bc) bc.remove(); if(bb) bb.remove(); se.classList.remove('egIsBot'); return; }
      emp++; var isB = emp <= nb;
      if(isB){ if(bb) bb.remove(); se.classList.add('egIsBot'); if(!bc){ bc = document.createElement('div'); bc.className = 'egBotC'; se.appendChild(bc); } var hh = '<div class="bx">🤖</div><b>Bot ' + emp + '</b>' + (hb ? '<button type="button" data-egbot="-1">✕</button>' : ''); if(bc.__h !== hh){ bc.__h = hh; bc.innerHTML = hh; } }
      else { se.classList.remove('egIsBot'); if(bc) bc.remove(); if(hb && emp === nb + 1){ if(!bb){ bb = document.createElement('button'); bb.type = 'button'; bb.className = 'egBotB'; bb.setAttribute('data-egbot', '1'); bb.textContent = '🤖 BOT EKLE'; se.appendChild(bb); } } else if(bb) bb.remove(); } });
  }
  setInterval(deco, 500);
  /* Tombala: 8 koltuk, afişsiz (çerçeve + profil + plakalı nick) */
  /* üst barın yanındaki küçük alan: oyun seçeneği + 🔄 DEĞİŞTİR (lobi barı yenilense de silinmez) */
  function optBar(l, opt, m){ var c = l.querySelector('#mcLbSet .t'); if(!c){ if(opt) opt.remove(); return; }
    if(!opt){ opt = document.createElement('div'); opt.className = 'egOpt'; l.appendChild(opt); }
    var lr = l.getBoundingClientRect(), cr = c.getBoundingClientRect(); opt.style.left = (cr.right - lr.left + 8) + 'px'; opt.style.top = (cr.top - lr.top) + 'px'; opt.style.height = cr.height + 'px';
    var o = (LB.eg && LB.eg.o) || {}, hb = isHost(), oh = '';
    if(m && m.opts && m.opts.length) m.opts.forEach(function(op){ oh += op.v.map(function(v){ return '<button type="button" data-egop="' + op.k + '" data-v="' + v[0] + '" class="' + (String(o[op.k]) === String(v[0]) ? 'on' : '') + '"' + (hb ? '' : ' disabled') + '>' + v[1] + '</button>'; }).join(''); });
    else if(m) oh = '<i>👤 ' + m.ptxt + '</i>';
    if(hb) oh += '<button type="button" class="chg" data-egchg="1">🔄 DEĞİŞTİR</button>';
    if(opt.__h !== oh){ opt.__h = oh; opt.innerHTML = oh; } }
  function picker(){ var l = document.getElementById('mcLobby2'); if(!l) return; var p = l.querySelector(':scope > .egPick'); if(p){ p.remove(); return; }
    p = document.createElement('div'); p.className = 'egPick'; var cur = LB.eg && LB.eg.g;
    p.innerHTML = '<div class="hd">🎲 Oyunu değiştir</div><div class="gr">' + CARDS.map(function(c){ var ok = c.ok || EG.mods[c.k]; return '<button type="button" data-egto="' + c.k + '" class="' + (c.k === cur ? 'on' : '') + '"' + (ok ? '' : ' disabled') + '>' + c.n + '</button>'; }).join('') + '</div>';
    var o = l.querySelector(':scope > .egOpt'); if(o){ p.style.left = o.style.left; p.style.top = (parseFloat(o.style.top) + parseFloat(o.style.height) + 6) + 'px'; } l.appendChild(p); }
  document.addEventListener('click', function(e){ var t = e.target.closest && e.target.closest('#mcLobby2 [data-egchg], #mcLobby2 [data-egto]'); if(!t) return; e.stopPropagation(); e.preventDefault();
    if(t.hasAttribute('data-egchg')){ picker(); return; }
    var k = t.getAttribute('data-egto'), p = t.closest('.egPick'); if(p) p.remove(); if(!isHost()) return; if(LB.eg && LB.eg.g === k) return;
    if(k === 'tavla' || k === 'ludo'){ clearEg(function(){ LB.eg = null; deco(); if(k === 'tavla'){ if(window.monocityTavlaLobby) monocityTavlaLobby(); } else if(window.__mcOpenFun){ __mcOpenFun(); setTimeout(function(){ var c = document.querySelector('#f31Fun .gr .c.lu'); if(c) c.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); }, 30); } }); return; }
    egLobby(k); toast('🔄 ' + (NAMES[k] || k) + ' seçildi'); }, true);
  function tbSeats(l){ var host = l.querySelector('#lbSeats'); if(!host) return; var box = l.querySelector('#egTbSeats');
    if(!box){ box = document.createElement('div'); box.id = 'egTbSeats'; host.parentNode.insertBefore(box, host); }
    var st = LAPI().state(), mem = members(), nb = LB.egb, hb = isHost(), F = window.MONOCITY_FRAME_IMG || {}, PI = window.MONOCITY_PLATE_IMG || {}, SO = window.MONOCITY_SOCIAL, h = '';
    for(var i = 0; i < 8; i++){ var p = mem[i];
      if(p){ var d = (SO && SO.users && SO.users[p.u]) || {}, me = p.u === uid(); var cos = me && window.monocityMyCos ? (monocityMyCos() || {}) : (d.cos || {}); var fr = F[cos.frame || 'white'] || '', pl = cos.plate, pu = pl && pl !== 'white' ? PI[pl] : '';
        var av = EG.avatar({u:p.u}); h += '<div class="ts f">' + (i === 0 ? '<em>👑</em>' : '') + '<div class="av"><img class="a" alt="" src="' + esc(av) + '">' + (fr ? '<img class="fr" alt="" src="' + esc(fr) + '">' : '') + '</div>' + (pu ? '<div class="pn" data-noi18n="1" style="background-image:url(' + pu + ')">' + esc(p.n) + '</div>' : '<b data-noi18n="1">' + esc(p.n) + '</b>') + '</div>'; }
      else if(i - mem.length < nb){ h += '<div class="ts f bot"><div class="av"><span>🤖</span></div><b>Bot ' + (i - mem.length + 1) + '</b>' + (hb ? '<button type="button" data-egbot="-1">✕</button>' : '') + '</div>'; }
      else h += '<div class="ts e"><i>+</i><small>Davet et</small>' + (hb && i === mem.length + nb ? '<button type="button" class="bb" data-egbot="1">🤖 BOT EKLE</button>' : '') + '</div>'; }
    if(box.__h !== h){ box.__h = h; box.innerHTML = h; }
    try{ var fr = l.querySelector('#lbFrList'), pn = fr && (fr.closest('.lbFr, .lbFriends, [class*="Fr"]') || fr.parentElement), lr = l.getBoundingClientRect(); if(pn){ var pr = pn.getBoundingClientRect(); if(pr.width > 50) box.style.right = Math.max(10, lr.right - pr.left + 14) + 'px'; } }catch(e){} }
  document.addEventListener('click', function(e){ var t = e.target.closest && e.target.closest('#mcLobby2 [data-egbot], #mcLobby2 [data-egop]'); if(!t) return; e.stopPropagation(); e.preventDefault();
    if(!isHost() || !LB.code) return;
    if(t.hasAttribute('data-egop')){ var o = Object.assign({}, (LB.eg && LB.eg.o) || {}); var v = t.getAttribute('data-v'); o[t.getAttribute('data-egop')] = isNaN(+v) ? v : +v; LB.eg.o = o; DB().ref('rooms/' + LB.code + '/eg/o').set(o); deco(); return; }
    var d = +t.getAttribute('data-egbot'), k = LB.eg && LB.eg.g, m = EG.mods[k]; if(!m) return; var mem = members().length, cap = k === 'tb' ? 8 : 4;
    var nb = Math.max(0, Math.min(cap - mem, LB.egb + d)); LB.egb = nb; DB().ref('rooms/' + LB.code + '/egb').set(nb); deco(); }, true);
  /* BAŞLAT */
  (function wrapMM(){ var o = window.monocityMMLobby; if(typeof o !== 'function') return setTimeout(wrapMM, 1200);
    if(!o.__eg){ var w = function(){ if(LB.code && LB.eg && EG.mods[LB.eg.g]){ egStart(); return true; } return o.apply(this, arguments); }; for(var k in o) try{ w[k] = o[k]; }catch(e){} w.__eg = true; window.monocityMMLobby = w; }
    setTimeout(wrapMM, 3000); })();
  function lbAsk(t, yes){ var o = document.getElementById('egLbAsk'); if(o) o.remove(); o = document.createElement('div'); o.id = 'egLbAsk';
    o.innerHTML = '<div class="bx"><p>' + t + '</p><div class="row"><button type="button" class="n">HAYIR</button><button type="button" class="y">EVET</button></div></div>'; document.body.appendChild(o);
    o.addEventListener('click', function(e){ if(e.target.closest('.y')){ o.remove(); yes(); } else if(e.target.closest('.n') || e.target === o) o.remove(); }); }
  /* oyun seçenekleri (101: katlamalı/katlamasız) başlamadan önce sorulur */
  function askOpts(m, cur, cb){ if(!m || !m.opts || !m.opts.length){ cb(cur || {}); return; }
    var o = {}; var d = m.defOpt ? m.defOpt() : {}; m.opts.forEach(function(op){ o[op.k] = (cur && cur[op.k] != null) ? cur[op.k] : d[op.k]; });
    var w = document.createElement('div'); w.className = 'egAsk'; w.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,16,.72);display:flex;align-items:center;justify-content:center';
    var draw = function(){ w.innerHTML = '<div style="background:#0f172a;border:2px solid #fbbf24;border-radius:16px;padding:16px 18px;min-width:280px;text-align:center;color:#fff;font-weight:800"><div style="font-size:18px;color:#fbbf24;margin-bottom:10px">' + m.name + '</div>' +
      m.opts.map(function(op){ return '<div style="display:flex;gap:8px;justify-content:center;margin:6px 0">' + op.v.map(function(v){ var on = String(o[op.k]) === String(v[0]); return '<button type="button" data-k="' + op.k + '" data-v="' + v[0] + '" style="padding:10px 14px;border-radius:10px;font-weight:900;border:2px solid ' + (on ? '#fbbf24' : '#334155') + ';background:' + (on ? '#78350f' : '#1e293b') + ';color:#fff">' + v[1] + '</button>'; }).join('') + '</div>'; }).join('') +
      '<div style="font-size:11.5px;color:#94a3b8;margin:4px 0 10px">Katlamalı: biri açınca sonraki en az onun 1 fazlasıyla açar (çiftte 1 çift fazla)</div><div style="display:flex;gap:8px;justify-content:center"><button type="button" data-x="no" style="padding:10px 14px;border-radius:10px;border:0;background:#334155;color:#fff;font-weight:900">İPTAL</button><button type="button" data-x="go" style="padding:10px 18px;border-radius:10px;border:0;background:linear-gradient(#fbbf24,#d97706);color:#1c1003;font-weight:900">BAŞLAT</button></div></div>'; };
    draw(); w.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; e.stopPropagation(); if(b.dataset.k){ o[b.dataset.k] = +b.dataset.v; draw(); return; } w.remove(); if(b.dataset.x === 'go') cb(o); }); document.body.appendChild(w); }
  EG.askOpts = askOpts;
  function egStart(){ var st = LAPI().state(); if(!st || st.role !== 'host'){ toast('⏳ Oyunu lobi kurucusu başlatır.'); return; }
    var k = LB.eg.g, m = EG.mods[k], mem = members(), nb = LB.egb, tot = mem.length + nb, nm = NAMES[k] || m.name;
    var nw = mem.slice(1).filter(function(x){ return !x.ready; }); if(nw.length){ toast('⏳ Herkes HAZIR olmadan başlatamazsın: ' + nw.map(function(x){ return x.n; }).join(', ')); return; }
    if(tot > m.max){ toast(nm + ' en fazla ' + m.max + ' kişiyle oynanır.'); return; }
    var go = function(bots){ launch(k, mem, bots); };
    if(m.fixed && tot < m.fixed){ var need = m.fixed - mem.length; lbAsk(nm + ' ' + m.fixed + ' kişiyle oynanır.<br>Boş ' + (m.fixed - tot) + ' koltuğa bot eklensin mi?', function(){ go(need); }); return; }
    if(m.even && tot % 2){ lbAsk(nm + ' 2 ya da 4 kişiyle oynanır.<br>Boş koltuğa 1 bot eklensin mi?', function(){ go(nb + 1); }); return; }
    if(tot < m.min){ if(mem.length === 1 && nb === 0) lbAsk('Rakip yok.<br>Bota karşı mı oynamak istersin?', function(){ go(m.min - 1); }); else lbAsk(nm + ' en az ' + m.min + ' kişiyle oynanır.<br>' + (m.min - tot) + ' bot eklensin mi?', function(){ go(m.min - mem.length); }); return; }
    go(nb); }
  function launch(k, mem, bots){ var pl = mem.map(function(x){ return {u:x.u, n:String(x.n || 'Oyuncu').slice(0, 20)}; }); for(var i = 1; i <= bots; i++) pl.push({b:1, n:'🤖 Bot ' + i});
    var o = (LB.eg && LB.eg.o) || {}, code0 = LB.code, l = document.getElementById('mcLobby2');
    if(mem.length === 1){ if(l) l.classList.remove('show'); EG.startLocalPl(k, pl, o, true); return; }
    var lc = mkCode(), room = {g:'eg', k:k, o:o, pl:pl, h:uid(), seed:(Math.random() * 2147483647) | 0, lb:code0, ts:Date.now()};
    DB().ref('ludoR/' + lc).set(room).then(function(){ return DB().ref('rooms/' + code0 + '/egGo').set({c:lc, ts:Date.now()}); }).catch(function(){ toast('❌ Oyun başlatılamadı.'); }); }
  function mkCode(){ var A = 'ABCDEFGHJKLMNPRSTUVYZ', s = 'E'; for(var i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
  function goRecv(v){ var key = v.c + ':' + v.ts; if(LB.lastGo === key || Date.now() - (v.ts || 0) > 60000) return; LB.lastGo = key;
    DB().ref('ludoR/' + v.c).once('value').then(function(s){ var r = s && s.val(); if(!r || r.g !== 'eg' || !EG.mods[r.k]) return; var l = document.getElementById('mcLobby2');
      if(EG.startRoom(v.c, r, true)){ if(l) l.classList.remove('show'); } }).catch(function(){}); }

  /* ================= CSS ================= */
  (function(){ var C = [
  '#egG{position:fixed;inset:0;z-index:3000400;display:none;background:radial-gradient(120% 90% at 50% 0%,#1c2b52 0%,#0f1834 55%,#070b1a 100%);font-family:Arial,Helvetica,sans-serif;color:#fff;overflow:hidden;-webkit-user-select:none;user-select:none;touch-action:manipulation}',
  '#egG.show{display:block}#egG .stg{position:absolute;left:50%;top:50%;width:1000px;height:450px;transform-origin:50% 50%}',
  '#egG .top{position:absolute;left:14px;right:14px;top:8px;height:40px;display:flex;align-items:center;gap:10px;z-index:6}',
  '#egG .top .bk{height:36px;padding:0 14px;border-radius:10px;border:2px solid #d6aa5c;background:linear-gradient(180deg,#2a3557,#151c33);color:#ffe3a3;font:1000 15px Arial;cursor:pointer}',
  '#egG .top .ttl{font:1000 20px Arial;color:#ffd36b;text-shadow:0 2px 0 #5a3a00}#egG .top .sub{font:800 13px Arial;color:#c7d2fe;background:rgba(0,0,0,.35);padding:5px 10px;border-radius:12px}#egG .top .sp{flex:1}',
  '#egG .top .vc{display:flex;gap:6px}#egG .top .vc button{width:36px;height:32px;border-radius:9px;border:1.5px solid rgba(255,255,255,.25);background:rgba(0,0,0,.35);font-size:16px;cursor:pointer}#egG .top .vc button.on{background:rgba(34,197,94,.35);border-color:#4ade80}',
  '#egG .egChB{position:relative;height:32px;min-width:38px;border:0;border-radius:9px;background:linear-gradient(180deg,#5b8def,#2f5fc4);color:#fff;font-size:17px;cursor:pointer;box-shadow:0 2px 0 #1d3d85}',
  '#egG .egChB i{position:absolute;top:-6px;right:-6px;min-width:17px;height:17px;border-radius:9px;background:#ef4444;color:#fff;font:900 11px/17px Arial;font-style:normal;border:2px solid #fff}',
  '#egG .tbl{position:absolute;left:0;top:50px;width:1000px;height:400px}',
  '#egG .felt{position:absolute;left:150px;top:30px;width:700px;height:260px;border-radius:26px;background:radial-gradient(ellipse at 50% 40%,#2d5a3f,#173a28 70%,#0f2a1c);border:8px solid #6b4423;box-shadow:inset 0 0 0 3px #d6aa5c,inset 0 10px 40px rgba(0,0,0,.5),0 12px 30px rgba(0,0,0,.6)}',
  '#egG .felt.oval{border-radius:130px}#egG .felt.nv{background:radial-gradient(ellipse at 50% 40%,#2b3d6e,#18254a 70%,#0e1733)}',
  '#egG [data-drag]{touch-action:none}#egG .egGh{position:fixed;left:0;top:0;z-index:40;pointer-events:none;transform-origin:0 0;filter:drop-shadow(0 10px 14px rgba(0,0,0,.6))}#egG .egGh>*{margin:0!important;transform:none!important}',
  '#egG .egPl{position:absolute;display:flex;align-items:center;gap:6px;background:rgba(8,12,26,.88);border:2px solid rgba(214,170,92,.6);border-radius:14px;padding:4px 8px 4px 4px;z-index:5;white-space:nowrap}',
  '#egG .egPl.on{border-color:#4ade80;box-shadow:0 0 14px rgba(74,222,128,.6)}#egG .egPl.out{opacity:.5}#egG .egPl.win{border-color:#ffd36b;box-shadow:0 0 14px rgba(255,211,107,.8)}',
  '#egG .egPl .av{position:relative;width:38px;height:38px;border-radius:10px;background:#1b2437;display:flex;align-items:center;justify-content:center;flex:0 0 auto}#egG .egPl .av img{width:100%;height:100%;object-fit:cover;border-radius:10px}#egG .egPl .av span{font-size:22px}',
  '#egG .egPl .rg{position:absolute;inset:-4px;border-radius:12px;border:3px solid #4ade80;animation:egRg 1s ease-in-out infinite alternate}@keyframes egRg{from{opacity:.55}to{opacity:1}}',
  '#egG .egPl .nm{display:flex;flex-direction:column;min-width:0;max-width:110px}#egG .egPl .nm b{font:900 13px Arial;overflow:hidden;text-overflow:ellipsis}#egG .egPl .nm small{font:800 10px Arial;color:#c7d2fe}#egG .egPl .nm small.egTs{color:#4ade80}',
  '#egG .egPl .chip{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;height:34px;padding:0 4px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);font:800 9px Arial;color:#aab6d3}',
  '#egG .egPl .chip b{font:1000 14px Arial;color:#fff}#egG .egPl .chip.g b{color:#4ade80}#egG .egPl .chip.y b{color:#fde68a}#egG .egPl .chip.p{background:linear-gradient(180deg,#b91c1c,#7f1d1d);border-color:#fca5a5}',
  '#egG .egPl .egTm{position:absolute;left:6px;right:6px;bottom:-7px;height:4px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}#egG .egPl .egTm i{display:block;height:100%;width:100%;background:#4ade80;transition:width 1s linear}',
  '#egG .egPl.v{flex-direction:column;padding:6px 6px 8px;gap:4px}#egG .egPl.v .nm{align-items:center;max-width:84px}#egG .egPl.v .chip{min-width:52px}',
  '#egG .egSc{position:absolute;right:8px;top:52px;z-index:6;background:rgba(0,0,0,.6);border:1.5px solid rgba(214,170,92,.6);border-radius:12px;padding:5px 9px;font:800 11px Arial;color:#e2e8f0}#egG .egSc table{border-collapse:collapse}#egG .egSc td{padding:1px 6px}#egG .egSc th{color:#ffd36b;font-size:10px;padding:1px 6px}',
  '#egG .egFly{position:fixed;left:0;top:0;z-index:35;pointer-events:none;filter:drop-shadow(0 10px 14px rgba(0,0,0,.55))}#egG .egFly>*{margin:0!important}',
  '#egG .myh{position:absolute;left:50%;bottom:50px;transform:translateX(-50%);display:flex;align-items:flex-end;z-index:4}#egG .myh .egC{margin:0 -12px;cursor:pointer;transition:translate .12s}#egG .myh .egC.big{width:76px;height:108px}#egG .myh .egC.big b{font-size:20px}#egG .myh .egC.big i{font-size:42px}',
  '#egG .myh .egC.pl{translate:0 -12px}#egG .myh .egC.no{filter:brightness(.55)}#egG .myh .egC.sel{translate:0 -26px;box-shadow:0 0 0 3px #4ade80,0 8px 16px rgba(0,0,0,.6)}#egG .myh.n13 .egC{margin:0 -18px}',
  '#egG .egVb{position:absolute;bottom:6px;width:78px;height:150px;border-radius:14px;border:2px solid #d6aa5c;background:linear-gradient(180deg,#2a3557,#151c33);color:#ffe3a3;font:1000 16px/1.25 Arial;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;cursor:pointer;z-index:5}#egG .egVb .ic{display:flex;gap:2px;pointer-events:none}#egG .egVb .egT{box-shadow:none}',
  '#egG .egCor{position:absolute;display:flex;flex-direction:column;align-items:center;gap:3px;font:800 10px Arial;color:#c7d2fe;z-index:4}#egG .egCor small{font:900 10px Arial}#egG .egCor.take{filter:drop-shadow(0 0 10px #4ade80);cursor:pointer}',
  '#egG .egCor .drop{width:44px;height:62px;border:2px dashed rgba(255,255,255,.45);border-radius:8px;display:flex;align-items:center;justify-content:center;font:900 9px Arial;color:#e2e8f0;text-align:center;background:rgba(74,222,128,.12);animation:egRg 1s ease-in-out infinite alternate;cursor:pointer}',
  '#egG .egFin{border-radius:10px;padding:2px}#egG.drg .egFin{outline:3px dashed #4ade80;outline-offset:3px}',
  '#egG .egTb{position:absolute;left:290px;top:8px;width:500px;height:168px;border-radius:12px;background:rgba(0,0,0,.18);border:1.5px dashed rgba(255,255,255,.16);padding:4px 8px;display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;align-content:start;overflow:hidden;z-index:3}',
  '#egG .egOw .lb{font:900 10px Arial;margin:3px 0 2px}#egG .egOw .gl{display:flex;flex-wrap:wrap;gap:4px}',
  '#egG .grp{display:flex;align-items:center;gap:1px;padding:2px;border-radius:6px;border:1.5px solid var(--oc);background:rgba(0,0,0,.28);cursor:pointer}#egG .grp .egT.xs{width:20px;height:29px}#egG .grp .egT.xs b{font-size:11px}',
  '#egG .grp .gp{width:14px;height:27px;border:1.5px dashed rgba(255,255,255,.25);border-radius:4px;margin:0 1px}#egG .grp .gp.ok{border-color:#4ade80;background:rgba(74,222,128,.3)}',
  '#egG .rack.r3{left:8px;right:96px;bottom:4px;height:118px;padding:4px 6px 6px;gap:4px 0;grid-template-columns:repeat(20,1fr);background-image:linear-gradient(180deg,transparent 47%,rgba(120,90,40,.35) 47%,rgba(120,90,40,.35) 49%,transparent 49%),linear-gradient(180deg,#fffaf0,#efe4c8 60%,#e2d3ad)}#egG .rack.r3 .sl{border-bottom:0;padding:0}#egG .rack.r3 .sl.e{background:none}#egG .rack.r3 .sl.e.tg{background:rgba(74,222,128,.18)}#egG .rack.r3 .sl{justify-content:stretch}#egG .rack.r3 .egT{width:100%;height:52px;border-radius:4px;margin:0!important;box-sizing:border-box;border:1px solid #070c1c!important;box-shadow:inset 0 0 0 1px rgba(214,170,92,.55),0 4px 0 #7a5a20,0 6px 8px rgba(0,0,0,.45)}#egG .rack.r3 .egT.gp{border-color:#60a5fa!important;box-shadow:0 0 0 2px #60a5fa,0 0 12px #60a5fa!important;translate:0 -4px}#egG .rack.r3 .egT b{font-size:21px;margin-top:5px}#egG .rack.r3 .egT i{width:6px;height:6px;margin-top:4px}#egG .rack.r3 .egT.bk u{font-size:16px}',
  '#egG .egT.nw{border-color:#4ade80!important;box-shadow:0 0 0 2px #4ade80,0 0 16px #4ade80!important;animation:egNw .5s ease-in-out 4 alternate}@keyframes egNw{from{translate:0 0}to{translate:0 -6px}}',
  '#egG .egRbs{position:absolute;right:6px;bottom:4px;width:84px;display:flex;flex-direction:column;gap:4px;z-index:6}#egG .egRb{height:34px;border-radius:10px;border:2px solid #d6aa5c;background:linear-gradient(180deg,#2a3557,#151c33);color:#ffe3a3;font:1000 11px Arial;cursor:pointer;padding:0 4px}',
  '#egG .egRb.g{background:linear-gradient(180deg,#5be37a,#1f9d45);color:#fff;border-color:#86efac;box-shadow:0 0 10px rgba(74,222,128,.6)}#egG .egRb:disabled{opacity:.45;cursor:default}',
  '#egG .egPl.n{width:62px;padding:5px 4px}#egG .egPl.n .av{width:30px;height:30px}#egG .egPl.n .nm b{font-size:11px}#egG .egPl.n .chip{min-width:48px;height:28px}#egG .egPl.n .chip b{font-size:12px}',
  '#egG .egPl.cp{padding:3px 6px 3px 3px;gap:4px}#egG .egPl.cp .av{width:30px;height:30px}#egG .egPl.cp .nm b{font-size:12px}#egG .egPl.cp .chip{min-width:36px;height:28px}#egG .egPl.cp .chip b{font-size:12px}',
  '#egG .egTb{left:196px!important;top:26px!important;width:620px!important;height:214px!important;background:none!important;border:0!important;padding:0 4px!important}#egG .egTb .grp.ok{box-shadow:0 0 0 2px #4ade80,0 0 12px rgba(74,222,128,.7)}',
  '#egG .egTb.g2 .grp .egT.xs{width:17px;height:25px}#egG .egTb.g2 .grp .egT.xs b{font-size:10px;margin-top:2px}#egG .egTb.g3 .grp .egT.xs{width:15px;height:22px}#egG .egTb.g3 .grp .egT.xs b{font-size:9px;margin-top:2px}#egG .egTb.g3 .grp .egT.xs i{display:none}',
  '#egG>.egCh .hs{max-height:120px;overflow-y:auto;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.08);font:700 12px Arial;color:#e2e8f0;display:flex;flex-direction:column;gap:3px}#egG>.egCh .hs b{color:#ffd36b}#egG>.egCh .hs .me b{color:#7dd3fc}#egG>.egCh .hs i{color:#64748b;font-style:normal}',
  '#egG .egRq{z-index:26}#egG .egWt{z-index:24}',
  '#egG .egC.dIn{animation:egDIn .45s ease-out}@keyframes egDIn{0%{transform:translate(60px,-30px) rotateY(90deg);opacity:.2}60%{transform:translate(0,0) rotateY(90deg)}100%{transform:none;opacity:1}}',
  'html body #mcLobby2>.egOpt{position:absolute;z-index:20;display:flex;align-items:center;gap:4px}html body #mcLobby2>.egOpt button{height:80%;min-height:24px;padding:0 10px;border-radius:9px;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#cbd5e1;font:900 11px Arial;cursor:pointer}',
  'html body #mcLobby2>.egOpt button.on{background:linear-gradient(180deg,#ffe28a,#f0b429);color:#3a2600;border-color:#fff1b8}html body #mcLobby2>.egOpt button.chg{background:linear-gradient(180deg,#6366f1,#3730a3);color:#fff;border-color:#a5b4fc}html body #mcLobby2>.egOpt i{font-style:normal;padding:4px 10px;border-radius:8px;background:rgba(59,130,246,.25);color:#dbeafe;font:900 12px Arial}',
  'html body #mcLobby2>.egPick{position:absolute;z-index:21;background:linear-gradient(180deg,#24314f,#121a30);border:2px solid #ffd36b;border-radius:14px;padding:8px;font-family:Arial;box-shadow:0 12px 30px rgba(0,0,0,.6)}html body #mcLobby2>.egPick .hd{font:1000 13px Arial;color:#ffd36b;margin:0 4px 6px}',
  'html body #mcLobby2>.egPick .gr{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}html body #mcLobby2>.egPick button{height:32px;padding:0 10px;border-radius:9px;border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font:900 12px Arial;cursor:pointer;white-space:nowrap}html body #mcLobby2>.egPick button.on{background:linear-gradient(180deg,#ffe28a,#f0b429);color:#3a2600}html body #mcLobby2>.egPick button:disabled{opacity:.35}',
  '#egTbSeats .ts .bb{width:auto!important;height:32px!important;padding:0 10px;font:1000 12px Arial!important;color:#fff;bottom:8px!important;right:50%!important;transform:translateX(50%)}',
  '#egG [data-last]{box-shadow:0 0 0 3px #ffd36b,0 8px 16px rgba(0,0,0,.6)!important}',
  '#egG .bt{height:44px;padding:0 18px;border-radius:12px;border:0;font:1000 16px Arial;color:#2a1600;background:linear-gradient(180deg,#ffd75e,#f0a414);box-shadow:0 4px 0 #9a5a06;cursor:pointer}',
  '#egG .bt.g{background:linear-gradient(180deg,#5be37a,#1f9d45);color:#fff;box-shadow:0 4px 0 #126b2d}#egG .bt.r{background:linear-gradient(180deg,#ff6b6b,#d62828);color:#fff;box-shadow:0 4px 0 #8a1010}',
  '#egG .bt.s{background:rgba(255,255,255,.12);color:#fff;box-shadow:none;border:1.5px solid rgba(255,255,255,.25);height:38px;font-size:14px}#egG .bt:disabled{opacity:.45;cursor:default}',
  '#egG .bt.sm{height:34px;font-size:14px;padding:0 12px}',
  '#egG .ov{position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:20}',
  '#egG .ov .bx{background:linear-gradient(180deg,#24314f,#121a30);border:2px solid #ffd36b;border-radius:18px;padding:20px 30px;text-align:center;display:flex;flex-direction:column;gap:10px;min-width:340px;max-width:620px}',
  '#egG .ov h3{margin:0;font:1000 32px Arial;color:#ffd36b}#egG .ov p{margin:0;font:800 15px Arial;color:#e6eefc}#egG .ov .row{display:flex;gap:10px;justify-content:center;margin-top:4px}#egG .ov .bt small{font-size:11px;opacity:.8}',
  '#egG .ov table{border-collapse:collapse;margin:4px auto;font:800 14px Arial}#egG .ov td,#egG .ov th{padding:4px 10px;border-bottom:1px solid rgba(255,255,255,.12)}#egG .ov th{color:#ffd36b}',
  /* koltuk */
  '#egG .egSeat{position:absolute;display:flex;align-items:center;gap:7px;background:rgba(8,12,26,.78);border:2px solid rgba(214,170,92,.55);border-radius:14px;padding:4px 10px 4px 4px;z-index:3;min-width:120px;max-width:190px}',
  '#egG .egSeat.on{border-color:#4ade80;box-shadow:0 0 14px rgba(74,222,128,.7)}#egG .egSeat .av{width:38px;height:38px;border-radius:10px;overflow:hidden;background:#1b2437;display:flex;align-items:center;justify-content:center;flex:0 0 auto}',
  '#egG .egSeat .av img{width:100%;height:100%;object-fit:cover}#egG .egSeat .av span{font-size:24px}#egG .egSeat .tx{min-width:0;display:flex;flex-direction:column}',
  '#egG .egSeat b{font:900 13px Arial;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#egG .egSeat small{font:800 11px Arial;color:#c7d2fe;white-space:nowrap}',
  '#egG .egSeat.out{opacity:.5}#egG .egSeat.win{border-color:#ffd36b;box-shadow:0 0 14px rgba(255,211,107,.8)}',
  '#egG .p-b{left:20px;bottom:8px}#egG .p-t{left:50%;top:0;transform:translateX(-50%)}#egG .p-l{left:6px;top:120px}#egG .p-r{right:6px;top:120px}',
  /* kart */
  '.egC{position:relative;display:inline-block;width:62px;height:88px;border-radius:9px;background:linear-gradient(180deg,#fffef8,#f3ead2);border:2.5px solid #d6aa5c;box-shadow:0 5px 12px rgba(0,0,0,.5),inset 0 0 0 3px #fff;color:#141a2e;font-family:Arial;vertical-align:top;flex:0 0 auto}',
  '.egC b{position:absolute;left:6px;top:5px;font:1000 17px/0.95 Arial;text-align:center}.egC i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:34px;font-style:normal;padding-top:10px}',
  '.egC.rd{color:#c8102e}.egC.bk{background:radial-gradient(circle at 50% 50%,#2a3b6b,#0d1530);box-shadow:0 5px 12px rgba(0,0,0,.5),inset 0 0 0 4px #0d1530,inset 0 0 0 5px #d6aa5c;display:inline-flex;align-items:center;justify-content:center}',
  '.egC.bk u{text-decoration:none;font:1000 28px Arial;background:linear-gradient(180deg,#fff4c2,#ffcf4a 55%,#c98a12);-webkit-background-clip:text;background-clip:text;color:transparent}',
  '.egC.sm{width:44px;height:62px;border-radius:7px}.egC.sm b{font-size:13px;left:4px;top:3px}.egC.sm i{font-size:22px}.egC.sm.bk u{font-size:20px}',
  '.egC.xs{width:30px;height:42px;border-radius:5px;border-width:1.5px}.egC.xs b{font-size:10px;left:3px;top:2px}.egC.xs i{font-size:15px}.egC.xs.bk u{font-size:13px}',
  '#egG .hand{position:absolute;left:220px;right:150px;bottom:4px;height:112px;display:flex;justify-content:center;align-items:flex-end}',
  '#egG .hand .egC{margin:0 -14px;cursor:pointer;transition:transform .12s}#egG .hand .egC.pl{transform:translateY(-6px)}#egG .hand .egC.sel{transform:translateY(-22px);box-shadow:0 0 0 3px #4ade80,0 8px 16px rgba(0,0,0,.6)}',
  '#egG .hand .egC.no{filter:brightness(.6)}#egG .hand.tight .egC{margin:0 -22px}#egG .hand.tight2 .egC{margin:0 -27px}',
  '#egG .ohand{position:absolute;display:flex}#egG .ohand .egC{margin:0 -16px}#egG .ohand.v{flex-direction:column}#egG .ohand.v .egC{margin:-34px 0}',
  '#egG .cnt{position:absolute;font:900 12px Arial;background:rgba(0,0,0,.6);border-radius:10px;padding:2px 8px;z-index:4}',
  '#egG .msg{position:absolute;left:50%;top:58px;transform:translateX(-50%);font:900 14px Arial;color:#fff;background:rgba(0,0,0,.55);border:1px solid rgba(255,211,107,.5);padding:5px 14px;border-radius:14px;white-space:nowrap;z-index:5}',
  '#egG .act{position:absolute;right:14px;bottom:10px;display:flex;flex-direction:column;gap:8px;z-index:6;align-items:stretch;width:130px}',
  /* taş */
  '.egT{position:relative;display:inline-flex;flex-direction:column;align-items:center;width:40px;height:58px;border-radius:7px;background:linear-gradient(180deg,#26365e,#111a33);border:2px solid #d6aa5c;box-shadow:0 4px 0 #7a5a20,0 6px 10px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.25);font-family:Arial;flex:0 0 auto;vertical-align:top}',
  '.egT b{font:1000 23px/1 Arial;margin-top:7px;text-shadow:0 0 8px currentColor}.egT i{width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 7px currentColor;margin-top:6px}',
  '.egT.r{color:#ff5470}.egT.y{color:#ffc93d}.egT.g{color:#3ee07a}.egT.b{color:#5aa8ff}.egT.p{color:#c084fc}.egT.ok{box-shadow:0 4px 0 #7a5a20,0 0 12px #ffd36b,inset 0 1px 0 rgba(255,255,255,.25);border-color:#fff3b0}',
  '.egT.bk{color:transparent;align-items:center;justify-content:center}.egT.bk u{text-decoration:none;font:1000 18px Arial;color:#d6aa5c}',
  '.egT.sm{width:30px;height:44px;border-radius:5px}.egT.sm b{font-size:16px;margin-top:5px}.egT.sm i{width:6px;height:6px;margin-top:4px}',
  '.egT.xs{width:22px;height:32px;border-radius:4px;border-width:1.5px;box-shadow:0 2px 0 #7a5a20}.egT.xs b{font-size:12px;margin-top:3px}.egT.xs i{width:4px;height:4px;margin-top:2px}',
  '#egG .rack{position:absolute;left:20px;right:150px;bottom:4px;height:142px;border-radius:12px;background:linear-gradient(180deg,#fffaf0,#efe4c8 60%,#e2d3ad);border:2px solid #d6aa5c;box-shadow:0 8px 20px rgba(0,0,0,.6),inset 0 2px 0 #fff;padding:5px 8px;display:grid;grid-template-columns:repeat(15,1fr);grid-template-rows:1fr 1fr;gap:4px 2px}',
  '#egG .rack .sl{position:relative;display:flex;align-items:flex-end;justify-content:center;border-bottom:4px solid rgba(120,90,40,.45);border-radius:4px}#egG .rack .sl.e{background:rgba(120,90,40,.08)}#egG .rack .sl.tg{background:rgba(74,222,128,.25)}',
  '#egG .rack .egT{cursor:pointer;transition:transform .1s}#egG .rack .egT.sel{transform:translateY(-8px);border-color:#4ade80;box-shadow:0 0 0 2px #4ade80,0 6px 10px rgba(0,0,0,.6)}#egG .rack .gap{width:12px}',
  /* tablo üstü seçim */
  '#egG .pick{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);background:rgba(10,14,28,.92);border:2px solid #ffd36b;border-radius:14px;padding:12px 16px;z-index:12;text-align:center;display:flex;flex-direction:column;gap:8px}',
  '#egG .pick p{font:900 15px Arial;margin:0}#egG .pick .r{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:460px}#egG .pick .r button{min-width:44px;height:40px;border-radius:9px;border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font:1000 17px Arial;cursor:pointer}',
  '#egG .pick .r button.on{background:linear-gradient(180deg,#ffe28a,#f0b429);color:#3a2600;border-color:#fff1b8}#egG .pick .r button.rd{color:#ff6b81}',
  /* sohbet */
  '#egG>.egCh{position:fixed;left:max(10px,env(safe-area-inset-left));top:13vh;width:min(330px,44vw);max-height:80vh;z-index:30;background:linear-gradient(180deg,#24314f,#141d33);border:2px solid #d6aa5c;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}',
  '#egG>.egCh .hd{display:flex;border-bottom:1px solid rgba(214,170,92,.35)}#egG>.egCh .hd button{flex:1;height:40px;border:0;background:none;color:#9fb0cf;font:900 13px Arial;cursor:pointer;border-bottom:3px solid transparent}',
  '#egG>.egCh .hd button.on{color:#ffd36b;border-bottom-color:#ffd36b}#egG>.egCh .hd .x{flex:0 0 40px;color:#fff;font-size:16px}',
  '#egG>.egCh .qk{display:flex;flex-direction:column;gap:6px;padding:8px;overflow-y:auto}#egG>.egCh .qk button{height:34px;border:0;border-radius:8px;background:rgba(255,255,255,.08);color:#f3e1bd;font:800 14px Arial;text-align:left;padding:0 12px;cursor:pointer}',
  '#egG>.egCh .in{display:flex;gap:6px;padding:0 8px 8px}#egG>.egCh .in input{flex:1;min-width:0;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:#0d1424;color:#fff;padding:0 10px;font:700 14px Arial}',
  '#egG>.egCh .in button{border:0;border-radius:8px;padding:0 12px;background:linear-gradient(180deg,#22c55e,#15803d);color:#fff;font:900 12px Arial;cursor:pointer}',
  '#egG>.egCh .em{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px}#egG>.egCh .em button{height:46px;border:0;border-radius:10px;background:rgba(255,255,255,.08);font-size:26px;cursor:pointer}',
  '#egG>.egBub{position:fixed;left:50%;top:12vh;transform:translateX(-50%);z-index:29;display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:none;max-width:70vw}',
  '#egG>.egBub .m{background:rgba(10,14,28,.85);border:1.5px solid rgba(214,170,92,.6);color:#fff;border-radius:16px;padding:6px 14px;font:800 14px Arial;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70vw;transition:opacity .4s}',
  '#egG>.egBub .m b{color:#ffd36b}#egG>.egBub .m.me b{color:#7dd3fc}#egG>.egBub .m.out{opacity:0}',
  '#egG>.egEmo{position:fixed;left:50%;top:42%;z-index:29;font-size:min(16vh,90px);pointer-events:none;animation:egEmo 2.2s ease-out forwards;text-align:center;line-height:1}#egG>.egEmo small{display:block;font:900 14px Arial;color:#fff;text-shadow:0 1px 3px #000}',
  '@keyframes egEmo{0%{transform:translate(-50%,-30%) scale(.3);opacity:0}15%{transform:translate(-50%,-50%) scale(1.15);opacity:1}30%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{transform:translate(-50%,-90%) scale(1);opacity:0}}',
  /* EĞLENCE ekranı */
  '#egHub{position:fixed;inset:0;z-index:1200061;display:none;font-family:Arial,Helvetica,sans-serif;color:#fff;background:radial-gradient(ellipse at 50% 20%,rgba(40,30,80,.92),rgba(6,9,22,.97));padding:calc(1.6*var(--mcu,1vh)) max(14px,env(safe-area-inset-left))}',
  '#egHub.show{display:flex;flex-direction:column;gap:calc(1.6*var(--mcu,1vh))}',
  '#egHub .hTop{display:flex;align-items:center;gap:12px;flex:0 0 auto}#egHub .hBk{height:calc(7*var(--mcu,1vh));min-height:34px;padding:0 16px;border-radius:12px;background:linear-gradient(180deg,#2a3557,#151c33);border:2px solid #d6aa5c;color:#ffe3a3;font:1000 calc(2.8*var(--mcu,1vh)) Arial;cursor:pointer}',
  '#egHub .hIc{font-size:calc(4.8*var(--mcu,1vh))}#egHub .hTt{font:1000 calc(4.8*var(--mcu,1vh)) Arial;letter-spacing:2px;background:linear-gradient(180deg,#fff4c2,#ffcf4a 55%,#c98a12);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 #5a3a00)}',
  '#egHub .hOn{margin-left:auto;padding:6px 14px;border-radius:18px;background:rgba(10,16,32,.75);border:1.5px solid rgba(255,255,255,.18);color:#d7e3ff;font:800 calc(2.3*var(--mcu,1vh)) Arial;display:flex;align-items:center;gap:7px}#egHub .hOn i{width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e}',
  '#egHub .hTabs{display:flex;gap:10px;flex:0 0 auto}#egHub .hTabs button{height:calc(6*var(--mcu,1vh));min-height:30px;padding:0 18px;border-radius:18px;font:1000 calc(2.3*var(--mcu,1vh)) Arial;color:#b9c6e4;background:rgba(15,22,42,.75);border:1.5px solid rgba(255,255,255,.14);cursor:pointer}',
  '#egHub .hTabs button.a{color:#3a2600;background:linear-gradient(180deg,#ffe28a,#f0b429);border-color:#fff1b8;box-shadow:0 0 14px rgba(255,200,60,.45)}',
  '#egHub .hGr{flex:1;min-height:0;display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:minmax(0,1fr);gap:calc(1.8*var(--mcu,1vh));overflow-y:auto}',
  '#egHub .hC{position:relative;border-radius:16px;overflow:hidden;border:2px solid rgba(214,170,92,.75);box-shadow:0 8px 18px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.25);background:var(--g);cursor:pointer;min-height:110px}',
  '#egHub .hC .art{position:absolute;left:0;right:0;top:0;bottom:calc(7*var(--mcu,1vh));display:flex;align-items:center;justify-content:center;overflow:hidden}#egHub .hC .art svg{max-width:80%;max-height:80%}',
  '#egHub .hC .nm{position:absolute;left:0;right:0;bottom:0;height:calc(7*var(--mcu,1vh));min-height:26px;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.65));display:flex;align-items:center;justify-content:center;font:1000 calc(2.9*var(--mcu,1vh)) Arial;text-shadow:0 2px 3px #000;border-top:1px solid rgba(255,255,255,.18)}',
  '#egHub .hC.flp{animation:egFlp .36s ease-in-out}@keyframes egFlp{50%{transform:perspective(600px) rotateY(90deg)}}',
  '#egHub .hC.fl .bk{position:absolute;inset:0;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:8%;padding:10%;background:rgba(10,8,30,.55)}',
  '#egHub .hC.fl .bt{text-align:center;font:1000 calc(2.6*var(--mcu,1vh)) Arial;color:#ffd36b;text-shadow:0 2px 0 #000}',
  '#egHub .hC.fl .bk button{border:2px solid #ffd36b;border-radius:12px;padding:6% 4%;font:1000 calc(2.3*var(--mcu,1vh)) Arial;color:#fff;background:linear-gradient(180deg,#7c3aed,#4c1d95);box-shadow:0 4px 0 #2e1065}',
  '#egHub .hC.fl .bk button+button{background:linear-gradient(180deg,#b91c1c,#7f1d1d);box-shadow:0 4px 0 #450a0a}',
  '#egHub .hC .pp{position:absolute;left:8px;top:8px;padding:3px 8px;border-radius:11px;background:rgba(0,0,0,.55);font:900 calc(1.9*var(--mcu,1vh)) Arial;z-index:2}',
  '#egHub .hC .ok{position:absolute;right:8px;top:8px;padding:3px 9px;border-radius:11px;background:linear-gradient(180deg,#4ade80,#16a34a);font:1000 calc(1.8*var(--mcu,1vh)) Arial;z-index:2;box-shadow:0 0 10px rgba(74,222,128,.6)}',
  '#egHub .hC.lk .art,#egHub .hC.lk .nm{filter:grayscale(.75) brightness(.6)}#egHub .hC.lk{border-color:rgba(160,160,170,.45)}',
  '#egHub .hC.lk::after{content:"🔒 YAKINDA";position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) rotate(-8deg);background:rgba(10,12,22,.85);border:1.5px solid #ffd36b;color:#ffd36b;font:1000 13px Arial;padding:5px 11px;border-radius:8px;white-space:nowrap}',
  '#egHub .hr{display:flex;gap:4px;align-items:center}#egHub .hr.fan .egC{margin:0 -10px}#egHub .hr.fan .egC:first-child{transform:rotate(-12deg)}#egHub .hr.fan .egC:last-child{transform:rotate(12deg)}',
  '#egHub .hb{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;font:1000 16px Arial;color:#111;box-shadow:inset -5px -6px 10px rgba(0,0,0,.35),0 4px 8px rgba(0,0,0,.4)}#egHub .hb span{background:#fff;border-radius:50%;width:56%;height:56%;display:flex;align-items:center;justify-content:center}',
  '#egHub .hn{position:absolute;top:8%;left:0;right:0;text-align:center;font:1000 28px Arial;color:#ffd36b;text-shadow:0 3px 0 #5a3a00}',
  /* lobi */
  'html body #mcLobby2.mcEgLb #mcLbSet span:nth-of-type(2),html body #mcLobby2.mcEgLb #mcLbSet span:nth-of-type(4),html body #mcLobby2.mcEgLb #mcLbSet span:nth-of-type(5),html body #mcLobby2.mcEgLb #mcLbSet .ks,html body #mcLobby2.mcEgLb #mcLbSet .ch,html body #mcLobby2.mcEgLb #t80Ch,html body #mcLobby2.mcEgLb #luLbB,html body #mcLobby2#mcLobby2.mcEgLb .mkEq,html body #mcLobby2#mcLobby2.mcEgLb #lbSeats .lbSeat.mkBn.mkBn.filled>.f12Lg{display:none!important}',
  'html body #mcLobby2.mcEgLb .lbSeat.empty>small:last-of-type{visibility:hidden}html body #mcLobby2.mcEgLb #mcLbSet span:nth-of-type(3){display:none!important}',
  'html body #mcLobby2 #mcLbSet .egOpt{display:inline-flex;gap:3px;align-items:center;margin-left:6px;vertical-align:middle}html body #mcLobby2 #mcLbSet .egOpt button{height:24px;padding:0 9px;border-radius:8px;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.07);color:#cbd5e1;font:900 11px Arial;cursor:pointer}html body #mcLobby2 #mcLbSet .egOpt button.on{background:linear-gradient(180deg,#ffe28a,#f0b429);color:#3a2600;border-color:#fff1b8}html body #mcLobby2 #mcLbSet .egOpt i{font-style:normal;height:24px;line-height:24px;padding:0 9px;border-radius:8px;background:rgba(59,130,246,.25);color:#dbeafe;font:900 12px/24px Arial}',
  '#mcLobby2 .egLbBar{position:absolute;left:50%;top:calc(9*var(--mcu,1vh));transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:10px;background:rgba(8,12,26,.82);border:1.5px solid rgba(214,170,92,.6);border-radius:14px;padding:5px 12px;font-family:Arial;color:#fff;white-space:nowrap}',
  '#mcLobby2 .egLbBar b{font:1000 15px Arial;color:#ffd36b}#mcLobby2 .egLbBar small{font:800 11px Arial;color:#c7d2fe}#mcLobby2 .egLbBar .op{display:flex;gap:4px}',
  '#mcLobby2 .egLbBar .op button{height:26px;padding:0 10px;border-radius:9px;border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font:900 11px Arial;cursor:pointer}#mcLobby2 .egLbBar .op button.on{background:linear-gradient(180deg,#ffe28a,#f0b429);color:#3a2600;border-color:#fff1b8}',
  'html body #mcLobby2#mcLobby2 #lbSeats .lbSeat .egBotB{position:absolute!important;left:50%!important;top:auto!important;bottom:24%!important;transform:translateX(-50%)!important;z-index:8!important;height:30px!important;width:auto!important;padding:0 12px!important;margin:0!important;border-radius:10px!important;border:1.5px solid #a5b4fc!important;background:linear-gradient(180deg,#6366f1,#3730a3)!important;color:#fff!important;font:1000 12px Arial!important;cursor:pointer;white-space:nowrap}',
  'html body #mcLobby2#mcLobby2 #lbSeats .lbSeat.egIsBot>:not(.egBotC){visibility:hidden!important}html body #mcLobby2#mcLobby2 #lbSeats .lbSeat .egBotC{position:absolute!important;left:0!important;right:0!important;top:0!important;height:62%!important;width:auto!important;z-index:8!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:10px;color:#fff;font-family:Arial;visibility:visible!important}',
  'html body #mcLobby2 .egBotC .bx{width:56%;aspect-ratio:1;border-radius:16px;border:3px solid #a5b4fc;background:radial-gradient(circle at 50% 35%,#4f46e5,#1e1b4b);display:flex;align-items:center;justify-content:center;font-size:calc(7*var(--mcu,1vh));box-shadow:0 0 16px rgba(129,140,248,.6)}html body #mcLobby2 .egBotC b{font:1000 calc(2.6*var(--mcu,1vh)) Arial;padding:4px 18px;border-radius:10px;background:rgba(0,0,0,.45);border:1.5px solid rgba(165,180,252,.6)}html body #mcLobby2 .egBotC button{position:absolute;top:8%;right:12%;width:26px;height:26px;border-radius:50%;border:2px solid #fff;background:#b91c1c;color:#fff;font:900 12px Arial;cursor:pointer;padding:0}',
  'html body #mcLobby2.mcTbLb #lbSeats{visibility:hidden!important;pointer-events:none!important}',
  '#mcLobby2 #egTbSeats{position:absolute;z-index:6;left:calc(2*var(--mcu,1vh));right:calc(30% + 2*var(--mcu,1vh));top:calc(16*var(--mcu,1vh));bottom:calc(22*var(--mcu,1vh));display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:calc(1.6*var(--mcu,1vh))}',
  '#egTbSeats .ts{position:relative;border-radius:14px;background:rgba(8,12,26,.72);border:2px solid rgba(214,170,92,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-family:Arial;color:#fff;min-height:0}',
  '#egTbSeats .ts .av{position:relative;width:calc(12*var(--mcu,1vh));height:calc(12*var(--mcu,1vh));display:flex;align-items:center;justify-content:center}#egTbSeats .ts .av .a{position:absolute;inset:12%;width:76%;height:76%;object-fit:cover;border-radius:10px}',
  '#egTbSeats .ts .av .fr{position:absolute;inset:-8%;width:116%;height:116%;object-fit:contain;pointer-events:none}#egTbSeats .ts .av span{font-size:calc(7*var(--mcu,1vh))}',
  '#egTbSeats .ts .pn{max-width:96%;background-size:100% 100%;background-repeat:no-repeat;padding:3px 18px;font:1000 calc(2.2*var(--mcu,1vh)) Arial;text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '#egTbSeats .ts b{font:1000 calc(2.3*var(--mcu,1vh)) Arial;max-width:94%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#egTbSeats .ts em{position:absolute;top:4px;left:8px;font-style:normal;font-size:18px}',
  '#egTbSeats .ts.e{border-style:dashed;color:#9fb0cf}#egTbSeats .ts.e i{font-style:normal;font:1000 calc(5*var(--mcu,1vh)) Arial}#egTbSeats .ts.e small{font:800 calc(1.8*var(--mcu,1vh)) Arial}',
  '#egTbSeats .ts .bb{position:absolute;bottom:6px;right:6px;width:30px;height:30px;border-radius:9px;border:1.5px solid #a5b4fc;background:linear-gradient(180deg,#6366f1,#3730a3);font-size:16px;cursor:pointer}',
  '#egTbSeats .ts button[data-egbot="-1"]{position:absolute;top:5px;right:5px;width:24px;height:24px;border-radius:50%;border:0;background:#b91c1c;color:#fff;font:900 12px Arial;cursor:pointer}',
  '#egLbAsk{position:fixed;inset:0;z-index:3000500;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:Arial}#egLbAsk .bx{background:linear-gradient(180deg,#24314f,#121a30);border:2px solid #ffd36b;border-radius:16px;padding:18px 24px;text-align:center;color:#fff;min-width:300px}',
  '#egLbAsk p{font:800 16px/1.4 Arial;margin:0 0 14px}#egLbAsk .row{display:flex;gap:12px;justify-content:center}#egLbAsk button{height:40px;min-width:110px;border-radius:10px;border:0;font:1000 15px Arial;cursor:pointer}#egLbAsk .n{background:rgba(255,255,255,.14);color:#fff}#egLbAsk .y{background:linear-gradient(180deg,#5be37a,#1f9d45);color:#fff}'
  ].join('\n'); var st = document.createElement('style'); st.id = 'egCss'; st.textContent = C; (document.head || document.documentElement).appendChild(st); })();

  /* ================= ortak çizim yardımcıları ================= */
  var SEATXY = {t:'left:240px;top:2px', l:'left:6px;top:120px', r:'right:6px;top:120px'};
  var HANDXY = {t:'left:420px;top:6px', l:'left:30px;top:178px', r:'right:30px;top:178px'};
  /* rakipler: koltuk kutusu + kapalı kartlar */
  EG.around = function(S, me, info, nCards, extra){ var h = '';
    for(var i = 0; i < S.n; i++){ if(i === me) continue; var p = EG.pos(S, i), nc = nCards ? nCards(i) : 0;
      h += EG.seat(S, i, info ? info(i) : '', '').replace('class="egSeat', 'style="' + SEATXY[p] + '" class="egSeat');
      if(nc > 0 && p === 't'){ var v = false, k = Math.min(nc, v ? 9 : 13), hh = ''; for(var j = 0; j < k; j++) hh += EG.back('xs');
        h += '<div class="ohand' + (v ? ' v' : '') + '" style="' + HANDXY[p] + '">' + hh + '</div>'; }
      if(extra) h += extra(i, p); }
    h += EG.seat(S, me, info ? info(me) : '', 'p-b');
    return h; };
  EG.hand = function(cards, play, sel){ var n = cards.length, big = n <= 8, step = n > 8 ? 2.4 : 5;
    return '<div class="myh' + (n >= 12 ? ' n13' : '') + '">' + cards.map(function(c, i){ var ok = !play || play.indexOf(c) >= 0, s = sel && sel.indexOf(c) >= 0, rot = (i - (n - 1) / 2) * step;
      return EG.card(c, (big ? 'big' : '') + (s ? ' sel' : '') + (play ? (ok ? ' pl' : ' no') : ''), ' data-x="c" data-drag="c" data-v="' + c + '" style="rotate:' + rot.toFixed(1) + 'deg;transform-origin:50% 140%"'); }).join('') + '</div>'; };
  EG.felt = function(cls){ return '<div class="felt' + (cls ? ' ' + cls : '') + '" style="left:110px;top:2px;width:780px;height:250px"></div>'; };
  EG.status = function(t){ return t ? '<div class="msg" style="top:214px">' + t + '</div>' : ''; };
  function sortHand(h, ord){ ord = ord || [0, 1, 3, 2]; return h.slice().sort(function(a, b){ var sa = ord.indexOf(EG.cs(a)), sb = ord.indexOf(EG.cs(b)); if(sa !== sb) return sa - sb; var ra = (EG.cr(a) + 12) % 13, rb = (EG.cr(b) + 12) % 13; return ra - rb; }); }
  EG.sortHand = sortHand;
  function zeros(n){ var a = []; for(var i = 0; i < n; i++) a.push(0); return a; }
  EG.zeros = zeros;
  function nextSeat(S, i){ return (i + 1) % S.n; }

  /* ================= PİŞTİ ================= */
  (function(){
    function team(S, i){ return S.n === 4 ? i % 2 : i; }
    function nt(S){ return S.n === 4 ? 2 : S.n; }
    function pts(c){ var r = EG.cr(c), s = EG.cs(c), p = 0; if(r === 0 || r === 10) p += 1; if(s === 3 && r === 1) p += 2; if(s === 2 && r === 9) p += 3; return p; }
    function deal(S){ for(var k = 0; k < 4; k++) for(var i = 0; i < S.n; i++){ var j = (S.dealer + 1 + i) % S.n; if(S.deck.length) S.h[j].push(S.deck.pop()); } }
    function newRound(S){ S.deck = EG.shuffle(S, EG.range(52)); S.fl = S.deck.splice(S.deck.length - 4, 4); S.h = []; for(var i = 0; i < S.n; i++) S.h.push([]); deal(S);
      S.cp = []; for(var t = 0; t < nt(S); t++) S.cp.push({c:0, p:0, pi:0}); S.lastT = -1; S.turn = (S.dealer + 1) % S.n; S.rd++; S.seen = zeros(13); EG.cr(S.fl[S.fl.length - 1]); S.seen[EG.cr(S.fl[S.fl.length - 1])]++; }
    function endRound(S){ if(S.fl.length && S.lastT >= 0){ S.cp[S.lastT].c += S.fl.length; S.fl.forEach(function(c){ S.cp[S.lastT].p += pts(c); }); S.fl = []; }
      var mx = -1, who = -1, tie = false; S.cp.forEach(function(c, t){ if(c.c > mx){ mx = c.c; who = t; tie = false; } else if(c.c === mx) tie = true; }); if(!tie && who >= 0) S.cp[who].p += 3;
      var rows = ''; S.cp.forEach(function(c, t){ S.sc[t] += c.p; rows += '<tr><td>' + tname(S, t) + '</td><td>' + c.c + ' kart</td><td>' + c.pi + ' pişti</td><td>+' + c.p + '</td><td><b>' + S.sc[t] + '</b></td></tr>'; });
      S.sum = '<table><tr><th></th><th>Kart</th><th>Pişti</th><th>El</th><th>Toplam</th></tr>' + rows + '</table>';
      var best = -1, bi = -1, tie2 = false; S.sc.forEach(function(v, t){ if(v > best){ best = v; bi = t; tie2 = false; } else if(v === best) tie2 = true; });
      if(best >= 151 && !tie2){ var w = []; for(var i = 0; i < S.n; i++) if(team(S, i) === bi) w.push(i); S.over = {w:w, txt:tname(S, bi) + ' 151 puana ulaştı', html:S.sum}; return; }
      S.wait = {txt:'El bitti · ' + S.sc.map(function(v, t){ return tname(S, t) + ' ' + v; }).join(' – '), html:S.sum}; }
    function tname(S, t){ if(S.n === 4) return t === team(S, EG.G().me) ? 'Biz' : 'Onlar'; return EG.name(S, t); }
    EG.reg({key:'pisti', name:'PİŞTİ', ic:'🃏', ptxt:'2 ya da 4 (eşli)', min:2, max:4, even:true,
      init:function(S){ S.sc = zeros(nt(S)); S.dealer = S.n - 1; S.rd = 0; newRound(S); },
      sub:function(S){ return '151 puan'; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(S.wait){ if(!a.nh) return false; S.wait = null; S.dealer = (S.dealer + 1) % S.n; S.log = ''; newRound(S); return true; } if(by !== S.turn || a.c == null) return false; var h = S.h[by], ix = h.indexOf(a.c); if(ix < 0) return false; h.splice(ix, 1);
        var c = a.c, top = S.fl.length ? S.fl[S.fl.length - 1] : null, t = team(S, by); S.seen[EG.cr(c)]++;
        if(top != null && (EG.cr(c) === EG.cr(top) || EG.cr(c) === 10)){ var pi = S.fl.length === 1 && EG.cr(c) === EG.cr(top);
          S.fl.push(c); S.cp[t].c += S.fl.length; S.fl.forEach(function(x){ S.cp[t].p += pts(x); }); S.fl = []; S.lastT = t;
          var nn = S.fl.length; S.an = [{c:c, from:'seat:' + by, to:'pile'}, {c:null, sm:1, from:'pile', to:'seat:' + by, d:450}];
          if(pi){ var v = EG.cr(c) === 10 ? 20 : 10; S.cp[t].p += v; S.cp[t].pi++; S.log = '🔥 ' + EG.name(S, by) + ' <b style="color:#ffd36b">' + EG.cname(c) + '</b> ile PİŞTİ yaptı! +' + v; S.fx = 'win'; } else { S.log = '🫴 ' + EG.name(S, by) + ' <b style="color:#ffd36b">' + EG.cname(c) + '</b> ile ' + nn + ' kartı aldı'; S.fx = 'hit'; } }
        else { S.fl.push(c); S.log = ''; S.an = [{c:c, from:'seat:' + by, to:'last'}]; }
        S.turn = nextSeat(S, by);
        if(S.h.every(function(x){ return !x.length; })){ if(S.deck.length) deal(S); else endRound(S); }
        return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i]; if(!h.length) return null; var top = S.fl.length ? S.fl[S.fl.length - 1] : null;
        if(top != null){ var m = h.filter(function(c){ return EG.cr(c) === EG.cr(top); }); if(m.length) return {c:m[0]};
          var val = 0; S.fl.forEach(function(c){ val += pts(c); }); var j = h.filter(function(c){ return EG.cr(c) === 10; }); if(j.length && (S.fl.length >= 4 || val >= 2)) return {c:j[0]}; }
        var nj = h.filter(function(c){ return EG.cr(c) !== 10; }); if(!nj.length) return {c:h[0]};
        nj.sort(function(a, b){ return (S.seen[EG.cr(b)] - S.seen[EG.cr(a)]) || (pts(a) - pts(b)); }); return {c:nj[0]}; },
      score:function(S){ return '<table><tr><th></th><th>Puan</th></tr>' + S.sc.map(function(v, t){ return '<tr><td>' + EG.esc(tname(S, t)) + '</td><td><b>' + v + '</b></td></tr>'; }).join('') + '</table>'; },
      view:function(S, me){ var h = EG.felt();
        h += EG.table(S, me, function(i){ var c = S.cp[team(S, i)]; return [['Topladı', c.c], ['Pişti', c.pi, 'y'], ['Tur', '+' + c.p, 'g'], ['Puan', S.sc[team(S, i)], 'p']]; }, function(i){ return S.h[i].length; });
        h += '<div data-deck style="position:absolute;left:240px;top:74px">' + EG.back('', ' style="box-shadow:3px 3px 0 #0d1530,6px 6px 0 #0d1530"') + '<div class="cnt" style="position:static;margin-top:8px;text-align:center">' + (S.deck.length ? 'Deste ' + S.deck.length : 'Deste bitti') + '</div></div>';
        var fl = '', k = S.fl.slice(-4); k.forEach(function(c, j){ fl += EG.card(c, '', ' style="position:absolute;left:' + (j * 20) + 'px;top:' + (j * 2) + 'px;rotate:' + ((j - 1.5) * 7) + 'deg"' + (j === k.length - 1 ? ' data-last' : '')); });
        h += '<div data-pile style="position:absolute;left:440px;top:70px;width:140px;height:100px">' + fl + '</div>' + (S.fl.length ? '<div class="cnt" style="left:478px;top:170px">Yerde ' + S.fl.length + '</div>' : '<div class="cnt" style="left:470px;top:110px">Yer boş</div>');
        if(S.log) h += '<div class="msg" style="top:196px">' + S.log + '</div>';
        var my = sortHand(S.h[me]); h += EG.hand(my, S.turn === me ? my : [], null);
        return h; },
      click:function(S, me, x){ if(x.getAttribute('data-x') !== 'c' || S.turn !== me) return null; return {c:+x.getAttribute('data-v')}; }
    });
  })();

  /* ================= BATAK + KOZ MAÇA (ortak motor) ================= */
  (function(){
    function rv(c){ return (EG.cr(c) + 12) % 13; }
    var TRXY = {b:'left:469px;top:140px', t:'left:469px;top:30px', l:'left:384px;top:84px', r:'left:554px;top:84px'};
    var SN = ['Maça', 'Kupa', 'Karo', 'Sinek'];
    function newHand(S){ var d = EG.shuffle(S, EG.range(52)); S.h = [[], [], [], []]; for(var i = 0; i < 52; i++) S.h[i % 4].push(d[i]);
      S.tk = [0, 0, 0, 0]; S.trick = []; S.broken = false; S.last = null; S.hn++;
      if(S.kind === 'koz'){ S.tr = 0; S.phase = 'play'; S.turn = (S.dealer + 1) % 4; S.lead = S.turn; S.bid = 0; S.bidBy = -1; }
      else { S.tr = -1; S.phase = 'bid'; S.bids = [null, null, null, null]; S.hb = 0; S.bidBy = -1; S.turn = (S.dealer + 1) % 4; S.nbid = 0; } }
    function winner(S){ var L = EG.cs(S.trick[0].c), best = S.trick[0]; S.trick.forEach(function(t){ var a = EG.cs(t.c), b = EG.cs(best.c);
        if(a === S.tr && b !== S.tr) best = t; else if(a === b && rv(t.c) > rv(best.c)) best = t; }); return best; }
    function legal(S, i){ var h = S.h[i]; if(!S.trick.length){ if(!S.broken && S.tr >= 0){ var nt = h.filter(function(c){ return EG.cs(c) !== S.tr; }); if(nt.length) return nt; } return h.slice(); }
      var L = EG.cs(S.trick[0].c), w = winner(S), wc = w.c, ws = EG.cs(wc), f = h.filter(function(c){ return EG.cs(c) === L; });
      if(f.length){ if(ws === L){ var up = f.filter(function(c){ return rv(c) > rv(wc); }); if(up.length) return up; } return f; }
      var tr = S.tr >= 0 ? h.filter(function(c){ return EG.cs(c) === S.tr; }) : [];
      if(tr.length){ if(ws === S.tr){ var up2 = tr.filter(function(c){ return rv(c) > rv(wc); }); if(up2.length) return up2; } return tr; }
      return h.slice(); }
    function score(S){ var rows = '';
      for(var i = 0; i < 4; i++){ var d; if(S.kind === 'batak' && i === S.bidBy){ d = S.tk[i] >= S.bid ? S.tk[i] : -S.bid; } else d = S.tk[i]; S.sc[i] += d;
        rows += '<tr><td>' + EG.esc(EG.name(S, i)) + (i === S.bidBy ? ' (ihale ' + S.bid + ')' : '') + '</td><td>' + S.tk[i] + ' el</td><td>' + (d >= 0 ? '+' : '') + d + '</td><td><b>' + S.sc[i] + '</b></td></tr>'; }
      S.sum = '<table><tr><th></th><th>Aldı</th><th>Puan</th><th>Toplam</th></tr>' + rows + '</table>';
      if(S.hn >= S.hmax){ var mx = Math.max.apply(null, S.sc), w = []; S.sc.forEach(function(v, i){ if(v === mx) w.push(i); }); S.over = {w:w, txt:S.hmax + ' el bitti', html:S.sum}; return; }
      S.wait = {txt:S.hn + '. el bitti', html:S.sum}; }
    function est(h){ var by = [[], [], [], []]; h.forEach(function(c){ by[EG.cs(c)].push(rv(c)); }); var e = 0, best = -1, bl = -1;
      by.forEach(function(a, s){ a.sort(function(x, y){ return y - x; }); if(a.indexOf(12) >= 0) e += 1; if(a.indexOf(11) >= 0) e += a.length >= 2 ? 0.8 : 0.3; if(a.indexOf(10) >= 0) e += a.length >= 3 ? 0.45 : 0.1;
        var sc = a.length * 2 + a.filter(function(v){ return v >= 9; }).length; if(sc > bl){ bl = sc; best = s; } });
      e += Math.max(0, by[best].length - 3) * 0.85; return {e:e, s:best}; }
    function mk(kind){
      EG.reg({key:kind, name:kind === 'koz' ? 'KOZ MAÇA' : 'BATAK', ic:kind === 'koz' ? '♠' : '🃏', ptxt:'4 kişi', min:4, max:4, fixed:4,
        init:function(S){ S.kind = kind; S.sc = [0, 0, 0, 0]; S.hn = 0; S.hmax = 5; S.dealer = 3; newHand(S); },
        sub:function(S){ return 'El ' + S.hn + '/' + S.hmax + (S.tr >= 0 ? ' · Koz ' + EG.SU[S.tr] : ''); },
        turn:function(S){ return S.turn; },
        act:function(S, by, a){ if(S.wait){ if(!a.nh) return false; S.wait = null; S.dealer = (S.dealer + 1) % 4; S.log = ''; newHand(S); return true; } if(by !== S.turn) return false;
          if(S.phase === 'bid'){ if(a.b == null) return false; var allPass = S.nbid === 3 && S.hb === 0;
            if(a.b === -1){ if(allPass) return false; S.bids[by] = -1; } else { if(a.b < 4 || a.b > 13 || a.b <= S.hb) return false; S.bids[by] = a.b; S.hb = a.b; S.bidBy = by; }
            S.nbid++; S.log = EG.name(S, by) + (a.b === -1 ? ' pas dedi' : ' ' + a.b + ' dedi');
            if(S.nbid >= 4){ S.bid = S.hb; S.phase = 'trump'; S.turn = S.bidBy; S.log = '🏷️ İhale ' + EG.name(S, S.bidBy) + ' · ' + S.bid; } else S.turn = (by + 1) % 4; return true; }
          if(S.phase === 'trump'){ if(a.s == null || a.s < 0 || a.s > 3) return false; S.tr = a.s; S.phase = 'play'; S.turn = S.bidBy; S.lead = S.bidBy; S.log = EG.name(S, by) + ' kozu seçti: ' + EG.SU[a.s]; return true; }
          if(S.phase !== 'play' || a.c == null) return false; if(legal(S, by).indexOf(a.c) < 0) return false;
          S.h[by].splice(S.h[by].indexOf(a.c), 1); if(EG.cs(a.c) === S.tr) S.broken = true; S.trick.push({s:by, c:a.c}); S.log = ''; S.lc = a.c; S.an = [{c:a.c, from:'seat:' + by, to:'last'}];
          if(S.trick.length < 4){ S.turn = (by + 1) % 4; return true; }
          var wn = winner(S), w = wn.s; S.tk[w]++; S.last = S.trick; S.lastW = wn.c; S.lastAt = Date.now(); S.trick = []; S.turn = w; S.lead = w; S.log = '🫴 Eli ' + EG.name(S, w) + ' <b style="color:#ffd36b">' + EG.cname(wn.c) + '</b> ile aldı'; S.fx = 'hit'; S.an.push({c:null, sm:1, from:'trickw', to:'seat:' + w, d:900});
          if(!S.h[0].length) score(S); return true; },
        botDelay:function(S){ return S.trick.length === 0 && S.last ? 1100 : 700; },
        bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i];
          if(S.phase === 'bid'){ var e = est(h), need = Math.max(S.hb + 1, 4), allPass = S.nbid === 3 && S.hb === 0; if(allPass) return {b:4}; return Math.floor(e.e + 0.35) >= need && need <= 13 ? {b:need} : {b:-1}; }
          if(S.phase === 'trump') return {s:est(h).s};
          var L = legal(S, i); if(L.length === 1) return {c:L[0]};
          if(!S.trick.length){ var aces = L.filter(function(c){ return rv(c) === 12 && EG.cs(c) !== S.tr; }); if(aces.length) return {c:aces[0]};
            var by = {}; L.forEach(function(c){ var s = EG.cs(c); (by[s] = by[s] || []).push(c); }); var ks = Object.keys(by).sort(function(a, b){ return by[b].length - by[a].length; }); var g = by[ks[0]].sort(function(a, b){ return rv(a) - rv(b); }); return {c:g[0]}; }
          var w = winner(S), win = L.filter(function(c){ var t = S.trick.concat([{s:i, c:c}]), sv = S.trick; S.trick = t; var r = winner(S).s === i; S.trick = sv; return r; });
          win.sort(function(a, b){ return rv(a) - rv(b); }); if(win.length) return {c:win[0]};
          var lo = L.slice().sort(function(a, b){ return (EG.cs(a) === S.tr) - (EG.cs(b) === S.tr) || rv(a) - rv(b); }); return {c:lo[0]}; },
        score:function(S){ return '<table><tr><th></th><th>Aldı</th><th>Puan</th></tr>' + S.sc.map(function(v, i){ return '<tr><td>' + EG.esc(EG.name(S, i).replace('🤖 ', '')) + (i === S.bidBy ? ' 🏷️' + S.bid : '') + '</td><td>' + S.tk[i] + '</td><td><b>' + v + '</b></td></tr>'; }).join('') + '</table>'; },
        view:function(S, me, ui){ var h = EG.felt('nv');
          h += EG.table(S, me, function(i){ if(S.phase === 'bid' && S.bids){ var b = S.bids[i]; return [['İhale', b == null ? '…' : (b === -1 ? 'Pas' : b), 'y']]; } var c = []; if(S.kind === 'batak') c.push(['İhale', i === S.bidBy ? S.bid : '–', 'y']); c.push(['Aldı', S.tk[i], 'g']); c.push(['Puan', S.sc[i], 'p']); return c; }, function(i){ return S.h[i].length; });
          var live = S.trick.length > 0, showLast = !live && S.last && Date.now() - (S.lastAt || 0) < 1300, tr = live ? S.trick : (showLast ? S.last : []), wc = live ? winner(S) : null; if(showLast) EG.later(1350 - (Date.now() - S.lastAt));
          tr.forEach(function(t){ var isW = live ? wc.c === t.c : S.lastW === t.c, at = (t.c === S.lc ? ' data-last' : '') + (!live && isW ? ' data-trickw' : '');
            h += EG.card(t.c, '', ' style="position:absolute;' + TRXY[EG.pos(S, t.s)] + ';rotate:' + ({b:0, t:0, l:-6, r:6}[EG.pos(S, t.s)]) + 'deg' + (isW ? ';box-shadow:0 0 0 3px #4ade80,0 8px 14px rgba(0,0,0,.6)' : '') + (!live ? ';opacity:.8' : '') + '"' + at); });
          if(live && S.trick.length > 1) h += '<div class="cnt" style="left:500px;top:236px;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#ffd36b">👑 ' + EG.esc(EG.name(S, wc.s)) + ' alıyor</div>';
          if(S.log && !live && showLast) h += '<div class="msg" style="top:196px">' + S.log + '</div>';
          var my = EG.sortHand(S.h[me], S.tr >= 0 ? [(S.tr + 1) % 4, (S.tr + 2) % 4, (S.tr + 3) % 4, S.tr] : null), mine = S.turn === me && S.phase === 'play';
          h += EG.hand(my, mine ? legal(S, me) : [], null);
          if(S.turn === me && S.phase === 'bid'){ var allPass = S.nbid === 3 && S.hb === 0, bb = ''; for(var v = Math.max(4, S.hb + 1); v <= 13; v++) bb += '<button type="button" data-x="bid" data-v="' + v + '">' + v + '</button>';
            h += '<div class="pick" style="top:38%"><p>İhale ver' + (S.hb ? ' (en yüksek: ' + S.hb + ')' : '') + '</p><div class="r">' + bb + (allPass ? '' : '<button type="button" data-x="bid" data-v="-1" style="min-width:70px">PAS</button>') + '</div>' + (allPass ? '<p style="font-size:12px;color:#ffb35c">Herkes pas dedi — en az 4 demek zorundasın</p>' : '') + '</div>'; }
          else if(S.turn === me && S.phase === 'trump') h += '<div class="pick" style="top:38%"><p>Kozu seç</p><div class="r">' + [0, 1, 2, 3].map(function(s){ return '<button type="button" data-x="tr" data-v="' + s + '" class="' + (s === 1 || s === 2 ? 'rd' : '') + '" style="font-size:26px;min-width:60px;height:52px">' + EG.SU[s] + '</button>'; }).join('') + '</div></div>';
          else if(mine && live){ var L = EG.cs(S.trick[0].c), has = S.h[me].some(function(c){ return EG.cs(c) === L; }); h += EG.status(has ? '👉 ' + SN[L] + ' atmalısın' : (S.tr >= 0 && S.h[me].some(function(c){ return EG.cs(c) === S.tr; }) ? '👉 ' + SN[L] + ' yok — koz atmalısın' : '👉 İstediğin kartı at')); }
          else if(S.phase !== 'play') h += EG.status('⏳ ' + EG.esc(EG.name(S, S.turn)) + (S.phase === 'bid' ? ' ihale düşünüyor' : ' kozu seçiyor'));
          return h; },
        click:function(S, me, x){ var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v'); if(S.turn !== me) return null;
          if(k === 'bid' && S.phase === 'bid') return {b:v}; if(k === 'tr' && S.phase === 'trump') return {s:v};
          if(k === 'c' && S.phase === 'play'){ if(legal(S, me).indexOf(v) < 0){ EG.toast('Bu kartı şu an atamazsın'); return null; } return {c:v}; } return null; }
      }); }
    mk('batak'); mk('koz');
  })();

  /* ================= PİS YEDİLİ ================= */
  (function(){
    function top(S){ return S.pile[S.pile.length - 1]; }
    function nx(S, i, k){ return ((i + S.dir * (k || 1)) % S.n + S.n) % S.n; }
    function playable(S, i){ var t = top(S); return S.h[i].filter(function(c){ if(S.pen) return EG.cr(c) === 6; return EG.cr(c) === 10 || EG.cs(c) === S.suit || EG.cr(c) === EG.cr(t); }); }
    function draw(S, i, k){ for(var j = 0; j < k; j++){ if(!S.deck.length){ var t = S.pile.pop(); S.deck = EG.shuffle(S, S.pile); S.pile = [t]; } if(!S.deck.length) break; S.h[i].push(S.deck.pop()); } }
    function bestSuit(h){ var c = [0, 0, 0, 0]; h.forEach(function(x){ if(EG.cr(x) !== 10) c[EG.cs(x)]++; }); var b = 0; for(var s = 1; s < 4; s++) if(c[s] > c[b]) b = s; return b; }
    EG.reg({key:'pis7', name:'PİS YEDİLİ', ic:'7️⃣', ptxt:'2–4 kişi', min:2, max:4,
      init:function(S){ S.deck = EG.shuffle(S, EG.range(52)); S.h = []; for(var i = 0; i < S.n; i++) S.h.push(S.deck.splice(S.deck.length - 7, 7));
        var t; do { t = S.deck.pop(); if([6, 10, 0, 9].indexOf(EG.cr(t)) >= 0){ S.deck.unshift(t); t = null; } } while(t == null);
        S.pile = [t]; S.suit = EG.cs(t); S.dir = 1; S.turn = 0; S.pen = 0; S.drew = false; },
      sub:function(S){ return 'Elini ilk bitiren kazanır'; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn) return false; var nm = EG.name(S, by);
        if(a.d){ if(S.drew && !S.pen) return false; S.an = [{c:null, sm:1, from:'deck', to:'seat:' + by}]; if(S.pen){ draw(S, by, S.pen); S.log = '😱 ' + nm + ' ' + S.pen + ' kart çekti'; S.pen = 0; S.drew = false; S.turn = nx(S, by); S.fx = 'hit'; return true; }
          draw(S, by, 1); S.drew = true; S.log = nm + ' kart çekti'; return true; }
        if(a.p){ if(!S.drew) return false; S.drew = false; S.turn = nx(S, by); S.log = nm + ' pas geçti'; return true; }
        if(a.c == null || playable(S, by).indexOf(a.c) < 0) return false;
        S.h[by].splice(S.h[by].indexOf(a.c), 1); S.pile.push(a.c); S.drew = false; var r = EG.cr(a.c), skip = 1; S.suit = EG.cs(a.c); S.log = ''; S.an = [{c:a.c, from:'seat:' + by, to:'last'}];
        if(r === 10){ S.suit = a.s >= 0 && a.s <= 3 ? a.s : bestSuit(S.h[by]); S.log = '🃏 ' + nm + ' Vale attı → ' + EG.SU[S.suit]; }
        else if(r === 6){ S.pen += 3; S.log = '7️⃣ ' + nm + ' 7 attı! Sıradaki ' + S.pen + ' kart çekecek'; S.fx = 'hit'; }
        else if(r === 0){ skip = 2; S.log = '⏭️ ' + nm + ' As attı — ' + EG.name(S, nx(S, by)) + ' atlandı'; }
        else if(r === 9){ if(S.n === 2) skip = 2; else S.dir = -S.dir; S.log = '🔄 ' + nm + ' 10 attı — yön değişti'; }
        if(!S.h[by].length){ S.over = {w:[by], txt:nm + ' elini bitirdi'}; return true; }
        if(S.h[by].length === 1) S.log = (S.log ? S.log + ' · ' : '') + '☝️ ' + nm + ' TEK KART!';
        S.turn = nx(S, by, skip); return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var P = playable(S, i);
        if(S.pen){ return P.length ? {c:P[0]} : {d:1}; }
        if(!P.length) return S.drew ? {p:1} : {d:1};
        var nj = P.filter(function(c){ return EG.cr(c) !== 10; }), nxt = S.h[nx(S, i)].length, ch;
        if(nj.length){ var att = nj.filter(function(c){ return [6, 0].indexOf(EG.cr(c)) >= 0; }); if(att.length && nxt <= 3) ch = att[0];
          else { var bs = bestSuit(S.h[i]); nj.sort(function(a, b){ return (EG.cs(b) === bs) - (EG.cs(a) === bs) || ([6, 0, 9].indexOf(EG.cr(a)) >= 0) - ([6, 0, 9].indexOf(EG.cr(b)) >= 0); }); ch = nj[0]; } }
        else ch = P[0];
        return EG.cr(ch) === 10 ? {c:ch, s:bestSuit(S.h[i].filter(function(x){ return x !== ch; }))} : {c:ch}; },
      view:function(S, me, ui){ var h = EG.felt();
        h += EG.table(S, me, function(i){ return [['Kart', S.h[i].length, S.h[i].length === 1 ? 'p' : '']]; }, function(i){ return S.h[i].length; });
        h += '<div data-deck data-x="d" style="position:absolute;left:350px;top:70px;cursor:pointer">' + EG.back('', ' style="box-shadow:3px 3px 0 #0d1530,6px 6px 0 #0d1530"') + '<div class="cnt" style="position:static;margin-top:8px;text-align:center">Deste ' + S.deck.length + '</div></div>';
        h += '<div data-pile style="position:absolute;left:480px;top:70px">' + EG.card(top(S), '', ' data-last') + '</div>';
        if(EG.cr(top(S)) === 10 || S.suit !== EG.cs(top(S))) h += '<div class="cnt" style="left:480px;top:166px;font-size:15px">İstenen: <span style="color:' + (S.suit === 1 || S.suit === 2 ? '#ff6b81' : '#fff') + '">' + EG.SU[S.suit] + '</span></div>';
        if(S.pen) h += '<div class="cnt" style="left:560px;top:96px;background:#b91c1c;font-size:15px">+' + S.pen + ' ÇEK</div>';
        h += '<div class="cnt" style="left:640px;top:96px">Yön ' + (S.dir === 1 ? '↻' : '↺') + '</div>';
        if(S.log) h += '<div class="msg" style="top:196px">' + S.log + '</div>';
        var my = EG.sortHand(S.h[me]), mine = S.turn === me, P = mine ? playable(S, me) : [];
        h += EG.hand(my, mine ? P : [], null);
        if(mine){ h += '<div class="act">' + (S.pen ? '<button type="button" class="bt r" data-x="d">' + S.pen + ' KART ÇEK</button>' : (S.drew ? '<button type="button" class="bt s" data-x="p">PAS</button>' : '<button type="button" class="bt" data-x="d">🂠 KART ÇEK</button>')) + '</div>';
          if(!S.log) h += EG.status(S.pen ? '👉 7 at ya da ' + S.pen + ' kart çek' : (P.length ? '👉 Uygun kartı at' : '👉 Uygun kart yok, çek')); }
        if(ui.j != null) h += '<div class="pick"><p>Vale ile hangi türü istiyorsun?</p><div class="r">' + [0, 1, 2, 3].map(function(s){ return '<button type="button" data-x="js" data-v="' + s + '" class="' + (s === 1 || s === 2 ? 'rd' : '') + '" style="font-size:26px;min-width:60px;height:52px">' + EG.SU[s] + '</button>'; }).join('') + '</div></div>';
        return h; },
      click:function(S, me, x, ui){ if(S.turn !== me) return null; var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(k === 'd') return {d:1}; if(k === 'p') return {p:1};
        if(k === 'js' && ui.j != null){ var c = ui.j; ui.j = null; return {c:c, s:v}; }
        if(k === 'c'){ if(playable(S, me).indexOf(v) < 0){ EG.toast(S.pen ? 'Sadece 7 atabilirsin ya da kart çek' : 'Bu kart uymuyor'); return null; } if(EG.cr(v) === 10){ ui.j = v; return true; } return {c:v}; }
        return null; }
    });
  })();

  /* ================= PAPAZ KAÇTI ================= */
  (function(){
    function act1(S){ var a = []; for(var i = 0; i < S.n; i++) if(S.h[i].length) a.push(i); return a; }
    function nextActive(S, i){ for(var k = 1; k <= S.n; k++){ var j = (i + k) % S.n; if(S.h[j].length) return j; } return -1; }
    function dropPairs(h){ var by = {}, out = []; h.forEach(function(c){ var r = EG.cr(c); (by[r] = by[r] || []).push(c); });
      Object.keys(by).forEach(function(r){ var a = by[r]; while(a.length >= 2){ a.splice(0, 2); } out = out.concat(a); }); return out; }
    function checkEnd(S){ var A = act1(S); if(A.length <= 1){ var los = A.length ? A[0] : -1; S.over = {w:EG.range(S.n).filter(function(i){ return i !== los; }), txt:los >= 0 ? '👑 Papaz ' + EG.name(S, los) + ' elinde kaldı!' : 'Oyun bitti'}; return true; } return false; }
    EG.reg({key:'papaz', name:'PAPAZ KAÇTI', ic:'👑', ptxt:'3–4 kişi', min:3, max:4,
      init:function(S){ var d = EG.shuffle(S, EG.range(52).filter(function(c){ return c !== 51; })); S.h = []; for(var i = 0; i < S.n; i++) S.h.push([]); d.forEach(function(c, j){ S.h[j % S.n].push(c); });
        for(var k = 0; k < S.n; k++) S.h[k] = EG.shuffle(S, dropPairs(S.h[k])); S.turn = 0; if(!S.h[0].length) S.turn = nextActive(S, 0); S.done = []; checkEnd(S); },
      sub:function(S){ return 'Papaz elinde kalan kaybeder'; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn || a.k == null) return false; var t = nextActive(S, by); if(t < 0 || t === by) return false; var th = S.h[t]; if(a.k < 0 || a.k >= th.length) return false;
        var c = th.splice(a.k, 1)[0], my = S.h[by], m = my.filter(function(x){ return EG.cr(x) === EG.cr(c); });
        S.an = [{c:null, sm:1, from:'seat:' + t, to:'seat:' + by}];
        if(m.length){ my.splice(my.indexOf(m[0]), 1); S.log = '✨ ' + EG.name(S, by) + ' ' + EG.RK[EG.cr(c)] + ' çiftini attı'; S.fx = 'hit'; } else { my.push(c); S.log = EG.name(S, by) + ' ' + EG.name(S, t) + '\'den kart çekti'; }
        S.h[by] = EG.shuffle(S, my); S.h[t] = EG.shuffle(S, th);
        [by, t].forEach(function(i){ if(!S.h[i].length && S.done.indexOf(i) < 0){ S.done.push(i); S.log += ' · 🎉 ' + EG.name(S, i) + ' kurtuldu'; } });
        if(checkEnd(S)) return true; S.turn = S.h[t].length ? t : nextActive(S, t); return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var t = nextActive(S, i); if(t < 0) return null; return {k:Math.floor(Math.random() * S.h[t].length)}; },
      view:function(S, me){ var h = EG.felt(), tgt = S.turn === me ? nextActive(S, me) : -1;
        h += EG.table(S, me, function(i){ return [[S.h[i].length ? 'Kart' : '🎉', S.h[i].length ? S.h[i].length : 'Kurtuldu', S.h[i].length ? '' : 'g']]; }, function(i){ return i === tgt ? 0 : S.h[i].length; });
        if(tgt >= 0){ var bb = ''; for(var k = 0; k < S.h[tgt].length; k++) bb += EG.back('sm', ' data-x="k" data-v="' + k + '" style="cursor:pointer;margin:0 -8px"');
          h += '<div style="position:absolute;left:170px;right:170px;top:62px;display:flex;justify-content:center;flex-wrap:wrap;gap:6px 0">' + bb + '</div>' + EG.status('👉 ' + EG.esc(EG.name(S, tgt)) + '\'in elinden bir kart seç'); }
        else if(S.log) h += '<div class="msg" style="top:196px">' + S.log + '</div>';
        h += EG.hand(EG.sortHand(S.h[me]), null, null);
        return h; },
      click:function(S, me, x){ if(S.turn !== me || x.getAttribute('data-x') !== 'k') return null; return {k:+x.getAttribute('data-v')}; }
    });
  })();

  /* ================= BLÖF ================= */
  (function(){
    var RN = ['As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Vale', 'Kız', 'Papaz'];
    function decl(lp){ return lp.n + ' tane ' + RN[lp.r]; }
    EG.reg({key:'blof', name:'BLÖF', ic:'🤔', ptxt:'4 kişi', min:4, max:4, fixed:4,
      init:function(S){ var d = EG.shuffle(S, EG.range(52)); S.h = [[], [], [], []]; d.forEach(function(c, j){ S.h[j % 4].push(c); }); S.pile = []; S.lp = null; S.phase = 'play'; S.turn = 0; S.rev = null; },
      sub:function(S){ return 'Elini ilk bitiren kazanır'; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn) return false;
        if(S.phase === 'play'){ var cs = a.cs; if(!cs || !cs.length || cs.length > 4 || a.r == null || a.r < 0 || a.r > 12) return false; var h = S.h[by];
          for(var i = 0; i < cs.length; i++) if(h.indexOf(cs[i]) < 0 || cs.indexOf(cs[i]) !== i) return false;
          cs.forEach(function(c){ h.splice(h.indexOf(c), 1); S.pile.push(c); }); S.lp = {by:by, cs:cs.slice(), r:a.r, n:cs.length}; S.rev = null;
          S.an = cs.map(function(c, j){ return {c:null, sm:1, from:'seat:' + by, to:'pile', d:j * 90}; });
          S.phase = 'resp'; S.turn = (by + 1) % 4; S.log = '🗣️ ' + EG.name(S, by) + ': "' + decl(S.lp) + '"'; return true; }
        if(a.g){ var lp = S.lp; if(!S.h[lp.by].length){ S.over = {w:[lp.by], txt:EG.name(S, lp.by) + ' elini bitirdi'}; return true; } S.phase = 'play'; S.log = EG.name(S, by) + ' geçti'; return true; }
        if(a.b){ var L = S.lp, ok = L.cs.every(function(c){ return EG.cr(c) === L.r; }), taker = ok ? by : L.by;
          S.an = [{c:null, sm:1, from:'pile', to:'seat:' + taker, d:500}];
          S.h[taker] = S.h[taker].concat(S.pile); S.pile = []; S.rev = {cs:L.cs, ok:ok, r:L.r, n:L.n};
          S.log = '🚨 ' + EG.name(S, by) + ' BLÖF dedi! ' + (ok ? 'Ama doğruymuş 😅 — ' + EG.name(S, by) + ' yerdekileri aldı' : 'Yakalandı! 😈 ' + EG.name(S, L.by) + ' yerdekileri aldı'); S.fx = 'hit';
          if(ok && !S.h[L.by].length){ S.over = {w:[L.by], txt:EG.name(S, L.by) + ' elini bitirdi'}; return true; }
          S.phase = 'play'; S.turn = by; return true; }
        return false; },
      botDelay:function(S){ return S.phase === 'resp' ? 1200 : 900; },
      bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i];
        if(S.phase === 'resp'){ var L = S.lp, kn = h.filter(function(c){ return EG.cr(c) === L.r; }).length; if(kn + L.n > 4) return {b:1};
          if(!S.h[L.by].length) return Math.random() < 0.65 ? {b:1} : {g:1}; return Math.random() < 0.1 + 0.07 * (L.n - 1) ? {b:1} : {g:1}; }
        var by = {}; h.forEach(function(c){ var r = EG.cr(c); (by[r] = by[r] || []).push(c); }); var rs = Object.keys(by).sort(function(a, b){ return by[b].length - by[a].length; });
        var r = +rs[0], cs = by[r].slice(0, 4);
        if(h.length > cs.length && Math.random() < 0.25){ var o = h.filter(function(c){ return cs.indexOf(c) < 0; }); if(cs.length < 4) cs.push(o[Math.floor(Math.random() * o.length)]); }
        return {cs:cs, r:r}; },
      view:function(S, me, ui){ var h = EG.felt('nv');
        h += EG.table(S, me, function(i){ return [['Kart', S.h[i].length, S.h[i].length <= 2 ? 'p' : '']]; }, function(i){ return S.h[i].length; });
        var pb = ''; for(var k = 0; k < Math.min(S.pile.length, 8); k++) pb += EG.back('sm', ' style="position:absolute;left:' + (k * 6) + 'px;top:' + (k * 2) + 'px;rotate:' + ((k % 3 - 1) * 9) + 'deg"');
        h += '<div data-pile style="position:absolute;left:446px;top:62px;width:110px;height:90px">' + pb + '</div><div class="cnt" style="left:470px;top:142px">Yerde ' + S.pile.length + '</div>';
        var myPlay = S.turn === me && S.phase === 'play';
        if(S.rev && !myPlay){ h += '<div style="position:absolute;left:50%;top:166px;transform:translateX(-50%);display:flex;gap:4px;align-items:center"><span class="cnt" style="position:static;margin-right:6px">Dediği: ' + (S.rev.n || S.rev.cs.length) + ' tane ' + RN[S.rev.r != null ? S.rev.r : 0] + ' · attığı:</span>' + S.rev.cs.map(function(c){ return EG.card(c, 'xs'); }).join('') + '<b style="font:1000 18px Arial;margin-left:6px">' + (S.rev.ok ? '✅ DOĞRU' : '❌ BLÖF') + '</b></div>'; }
        if(S.log && !myPlay) h += '<div class="msg" style="top:212px">' + S.log + '</div>';
        var my = EG.sortHand(S.h[me]), mine = S.turn === me, sel = ui.sel || [];
        if(mine && S.phase === 'play'){ h += EG.hand(my, my, sel);
          h += '<div class="pick" style="top:auto;bottom:178px;transform:translateX(-50%);padding:6px 10px"><p style="font-size:13px">' + (sel.length ? sel.length + ' kart seçtin — ne diyorsun?' : 'Önce elinden 1–4 kart seç') + '</p><div class="r">' + RN.map(function(n, r){ return '<button type="button" data-x="r" data-v="' + r + '" class="' + (ui.r === r ? 'on' : '') + '" style="min-width:52px;height:38px;font-size:15px">' + n + '</button>'; }).join('') + '</div></div>';
          h += '<div class="act" style="width:150px"><button type="button" class="bt g" data-x="at"' + (sel.length && ui.r != null ? '' : ' disabled') + ' style="height:auto;padding:6px 8px;line-height:1.2">AT ›' + (sel.length && ui.r != null ? '<br><small style="font-size:12px">' + sel.length + ' tane ' + RN[ui.r] + '</small>' : '') + '</button></div>'; }
        else { h += EG.hand(my, null, null);
          if(mine && S.phase === 'resp') h += '<div class="act"><button type="button" class="bt r" data-x="b">🚨 BLÖF!</button><button type="button" class="bt s" data-x="g">GEÇ</button></div>' + EG.status('👉 ' + EG.esc(EG.name(S, S.lp.by)) + ' "' + decl(S.lp) + '" dedi. İnanıyor musun?').replace('top:214px', 'top:236px'); }
        return h; },
      click:function(S, me, x, ui){ if(S.turn !== me) return null; var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(S.phase === 'resp'){ if(k === 'b') return {b:1}; if(k === 'g') return {g:1}; return null; }
        if(k === 'c'){ ui.sel = ui.sel || []; var i = ui.sel.indexOf(v); if(i >= 0) ui.sel.splice(i, 1); else if(ui.sel.length < 4) ui.sel.push(v); else EG.toast('En fazla 4 kart'); return true; }
        if(k === 'r'){ ui.r = v; return true; }
        if(k === 'at' && ui.sel && ui.sel.length && ui.r != null) return {cs:ui.sel.slice(), r:ui.r};
        return null; }
    });
  })();

  /* ================= 21 (kasaya karşı) — DOUBLE + BÖL ================= */
  (function(){
    var TT = 20000;
    function val(cs){ var t = 0, a = 0; cs.forEach(function(c){ var r = EG.cr(c); if(r === 0){ a++; t += 11; } else t += Math.min(10, r + 1); }); while(t > 21 && a){ t -= 10; a--; } return {t:t, soft:a > 0}; }
    function isBJ(H){ return !H.sp && H.c.length === 2 && val(H.c).t === 21; }
    function deal(S){ S.deck = EG.shuffle(S, EG.range(52)); S.ph = []; for(var i = 0; i < S.n; i++){ var H = {c:[S.deck.pop(), S.deck.pop()], st:'play', d:0, sp:false, r:null}; if(isBJ(H)) H.st = 'bj'; if(S.gone && S.gone[i]) H.st = 'out'; S.ph.push([H]); }
      S.dh = [S.deck.pop(), S.deck.pop()]; S.phase = 'play'; S.rn++; S.log = ''; S.resAt = 0; S.turnAt = Date.now(); fin(S); }
    function cur(S){ for(var i = 0; i < S.n; i++) for(var j = 0; j < S.ph[i].length; j++) if(S.ph[i][j].st === 'play') return {i:i, j:j}; return null; }
    function draw(S){ if(!S.deck.length) S.deck = EG.shuffle(S, EG.range(52)); return S.deck.pop(); }
    function canD(H){ return H.st === 'play' && H.c.length === 2 && !H.ac; }
    function canP(S, i, H){ return H.st === 'play' && H.c.length === 2 && S.ph[i].length === 1 && EG.cr(H.c[0]) === EG.cr(H.c[1]); }
    function fin(S){ if(cur(S)) return; S.wnPrev = S.wn.slice(); var dv = val(S.dh), live = S.ph.some(function(hs){ return hs.some(function(H){ return H.st === 'stand' || H.st === 'bj' || H.st === 'dbl'; }); });
      if(live) while(dv.t < 17){ S.dh.push(draw(S)); dv = val(S.dh); }
      var dbj = S.dh.length === 2 && dv.t === 21, me = EG.G() ? EG.G().me : 0, myW = 0, myL = 0;
      for(var i = 0; i < S.n; i++) S.ph[i].forEach(function(H){ var pv = val(H.c).t, w = H.d ? 2 : 1, r;
        if(H.st === 'out') r = null; else if(H.st === 'bust') r = 'l'; else if(H.st === 'bj') r = dbj ? 'p' : 'w'; else if(dbj) r = 'l'; else if(dv.t > 21) r = 'w'; else r = pv > dv.t ? 'w' : (pv === dv.t ? 'p' : 'l');
        H.r = r; if(r === 'w') S.wn[i] += w; else if(r === 'l') S.ls[i] += w; if(i === me){ if(r === 'w') myW += w; else if(r === 'l') myL += w; } });
      S.phase = 'res'; S.rvAt = Date.now(); S.rvDur = 600 + (S.dh.length - 2) * 850 + 400; S.resAt = Date.now() + S.rvDur;
      S.log = 'Kasa ' + (dv.t > 21 ? 'patladı (' + dv.t + ')' : dv.t) + ' · ' + (myW > myL ? '🏆 Kazandın' + (myW > 1 ? ' +' + myW : '') : (myW === myL ? '🤝 Berabere' : '😔 Kaybettin')); S.fx = myW > myL ? 'win' : 'tick'; }
    var RES = {w:'🏆 KAZANDI', l:'😔 KAYBETTİ', p:'🤝 BERABERE'}, STT = {stand:'✋ DURDU', bust:'💥 PATLADI', bj:'🂡 BLACKJACK', dbl:'✖2 DOUBLE', out:'Çıktı'};
    EG.reg({key:'bj', name:'21', ic:'🂡', ptxt:'1–4 kişi + kasa', min:1, max:4, askQuit:false, refresh:true, noTimer:true,
      init:function(S){ S.wn = EG.zeros(S.n); S.ls = EG.zeros(S.n); S.rn = 0; deal(S); },
      sub:function(S){ return 'El ' + S.rn + ' · Kasa 17\'de durur'; },
      turn:function(S){ var c = S.phase === 'play' ? cur(S) : null; return c ? c.i : -1; },
      tick:function(S, now){ if(S.phase === 'res' && S.resAt && now - S.resAt > 4500) return {nx:1}; var c = cur(S); if(S.phase === 'play' && c && S.turnAt && now - S.turnAt > TT) return {_by:c.i, s:1, to:1}; return null; },
      act:function(S, by, a){
        if(a.nx){ if(S.phase !== 'res') return false; deal(S); return true; }
        var c = S.phase === 'play' ? cur(S) : null; if(!c || c.i !== by) return false; var H = S.ph[by][c.j]; S.turnAt = Date.now();
        if(a.h){ H.c.push(draw(S)); S.an = [{c:null, sm:1, from:'deck', to:'last'}]; var v = val(H.c).t; if(v > 21){ H.st = 'bust'; S.log = '💥 ' + EG.name(S, by) + ' patladı (' + v + ')'; S.fx = 'hit'; } else if(v === 21) H.st = 'stand'; fin(S); return true; }
        if(a.s){ H.st = 'stand'; if(a.to) S.log = '⏰ ' + EG.name(S, by) + ' süre doldu — durdu'; fin(S); return true; }
        if(a.d){ if(!canD(H)) return false; H.d = 1; H.c.push(draw(S)); S.an = [{c:null, sm:1, from:'deck', to:'last'}]; var v2 = val(H.c).t; H.st = v2 > 21 ? 'bust' : 'dbl'; S.log = '✖2 ' + EG.name(S, by) + ' DOUBLE dedi (' + v2 + ')'; fin(S); return true; }
        if(a.p){ if(!canP(S, by, H)) return false; var ace = EG.cr(H.c[0]) === 0, A = {c:[H.c[0], draw(S)], st:'play', d:0, sp:true, r:null, ac:ace}, B = {c:[H.c[1], draw(S)], st:'play', d:0, sp:true, r:null, ac:ace};
          if(ace){ A.st = 'stand'; B.st = 'stand'; } else { if(val(A.c).t === 21) A.st = 'stand'; if(val(B.c).t === 21) B.st = 'stand'; }
          S.ph[by] = [A, B]; S.log = '✂️ ' + EG.name(S, by) + ' elini böldü'; fin(S); return true; }
        return false; },
      bot:function(S, i){ var c = S.phase === 'play' ? cur(S) : null; if(!c || c.i !== i) return null; var H = S.ph[i][c.j], v = val(H.c), up = Math.min(10, EG.cr(S.dh[0]) === 0 ? 11 : EG.cr(S.dh[0]) + 1);
        if(canP(S, i, H) && [0, 7].indexOf(EG.cr(H.c[0])) >= 0) return {p:1};
        if(canD(H) && (v.t === 11 || (v.t === 10 && up < 10))) return {d:1};
        return (v.t < 17 || (v.soft && v.t < 18)) ? {h:1} : {s:1}; },
      view:function(S, me){ var c = S.phase === 'play' ? cur(S) : null, el0 = S.phase === 'res' && S.rvAt ? Date.now() - S.rvAt : 1e9, done = el0 >= (S.rvDur || 0);
        var nVis = S.phase === 'play' ? 2 : (el0 < 600 ? 2 : Math.min(S.dh.length, 2 + Math.floor((el0 - 600) / 850))), hid = S.phase === 'play' || el0 < 600;
        if(S.phase === 'res' && !done){ var nxt = el0 < 600 ? 600 - el0 : 850 - ((el0 - 600) % 850); EG.later(Math.max(60, Math.min(nxt + 20, (S.rvDur - el0) + 30))); }
        var dVis = S.dh.slice(0, Math.max(2, nVis)), dv = val(hid ? [S.dh[0]] : dVis).t, newIdx = el0 >= 600 ? 1 + Math.floor((el0 - 600) / 850) : -1, newFresh = el0 >= 600 && ((el0 - 600) % 850) < 450;
        var showRes = S.phase !== 'res' || done, wnShow = showRes ? S.wn : (S.wnPrev || S.wn);
        var h = '<div class="felt oval" style="left:30px;top:8px;width:800px;height:250px"></div>';
        h += '<div style="position:absolute;left:430px;top:12px;transform:translateX(-50%);display:flex;align-items:center;gap:10px"><div class="egPl" style="position:relative"><div class="av"><span>🎩</span></div><div class="nm"><b>KASA</b><small>17\'de durur</small></div></div><div style="display:flex;gap:4px">' + dVis.map(function(x, j){ return j === 1 && hid ? EG.back('sm') : EG.card(x, 'sm' + (j === newIdx && newFresh ? ' dIn' : '')); }).join('') + '</div><div class="cnt" style="position:static;font-size:14px' + (!hid && dv > 21 ? ';background:#b91c1c' : '') + '">' + (hid ? dv + ' + ?' : dv) + '</div></div>';
        h += '<div style="position:absolute;left:430px;top:96px;transform:translateX(-50%);white-space:nowrap;font:900 11px Arial;color:#ffd36b;opacity:.7;letter-spacing:1px">BLACKJACK KAZANIR · DOUBLE KUPAYI İKİYE KATLAR</div>';
        if(S.log && showRes) h += '<div class="msg" style="top:118px;left:430px">' + S.log + '</div>'; else if(!showRes) h += '<div class="msg" style="top:118px;left:430px">🎩 Kasa oynuyor…</div>';
        var W = 760, bw = W / S.n, x0 = 50;
        for(var i = 0; i < S.n; i++){ var cx = x0 + bw * i + bw / 2, hs = S.ph[i], multi = hs.length > 1;
          hs.forEach(function(H, j){ var act = c && c.i === i && c.j === j, big = act && !multi ? true : act, hx = multi ? cx + (j === 0 ? -bw / 4 : bw / 4) : cx, v = val(H.c).t;
            var tag = H.r && showRes ? RES[H.r] + (H.d ? ' ×2' : '') : (act ? (multi ? (j + 1) + '. EL · OYNANIYOR' : 'OYNUYOR') : (H.st === 'play' ? (multi ? (j + 1) + '. EL · SIRADA' : '⏳ SIRADA') : STT[H.st] || ''));
            var tc = showRes && H.r === 'w' ? '#15803d' : (showRes && H.r === 'l' ? '#7f1d1d' : (act ? '#15803d' : '#334155'));
            h += '<div style="position:absolute;left:' + hx + 'px;top:' + (act ? 150 : 172) + 'px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:3px;' + (!act && H.st === 'play' ? 'opacity:.65' : '') + '"><div style="display:flex' + (act ? ';filter:drop-shadow(0 0 10px #4ade80)' : '') + '">' + H.c.map(function(x, k){ return EG.card(x, act ? '' : 'sm', ' style="margin:0 -11px"' + (k === H.c.length - 1 && act ? ' data-last' : '')); }).join('') + '</div>' +
              '<div class="cnt" style="position:static;font-size:13px' + (act ? ';background:#15803d' : '') + '">' + ((function(vv){ return vv.soft && vv.t < 21 && H.st === 'play' ? (vv.t - 10) + ' / ' + vv.t : vv.t; })(val(H.c))) + '</div><div class="cnt" style="position:static;font-size:10px;background:' + tc + '">' + tag + '</div></div>'; });
          h += EG.plate(S, i, [['Kupa', '🏆' + wnShow[i], 'y']], '', 'left:' + cx + 'px;bottom:4px;transform:translateX(-50%)').replace('data-seat=', (c && c.i === i ? 'data-on="1" ' : '') + 'data-seat=');
        }
        h += '<div data-deck style="position:absolute;left:760px;top:30px">' + EG.back('sm') + '</div>';
        if(c && c.i === me){ var H0 = S.ph[me][c.j];
          h += '<div class="act" style="bottom:auto;top:60px;width:140px"><button type="button" class="bt g" data-x="h">🂠 KART ÇEK</button><button type="button" class="bt" data-x="s">✋ DUR</button><button type="button" class="bt" data-x="d" style="background:linear-gradient(180deg,#a78bfa,#6d28d9);color:#fff;box-shadow:0 4px 0 #4c1d95"' + (canD(H0) ? '' : ' disabled') + '>✖2 DOUBLE</button><button type="button" class="bt s" data-x="p"' + (canP(S, me, H0) ? '' : ' disabled') + '>✂️ BÖL</button></div>'; }
        else if(c) h += '<div class="msg" style="top:auto;bottom:150px;left:auto;right:10px;transform:none">⏳ Sıra ' + EG.esc(EG.name(S, c.i)) + '\'de · ' + Math.ceil(Math.max(0, TT - (Date.now() - S.turnAt)) / 1000) + ' sn</div>';
        else if(showRes) h += '<div class="msg" style="top:auto;bottom:150px;left:auto;right:10px;transform:none">⏳ Yeni el birazdan…</div>';
        return h; },
      click:function(S, me, x){ var k = x.getAttribute('data-x'), c = S.phase === 'play' ? cur(S) : null; if(!c || c.i !== me) return null; if(k === 'h') return {h:1}; if(k === 's') return {s:1}; if(k === 'd') return {d:1}; if(k === 'p') return {p:1}; return null; }
    });
  })();

  /* ================= TOMBALA ================= */
  (function(){
    var MK = {key:null, m:{}}, AUTO = false; try{ AUTO = localStorage.getItem('eg_tb_auto') === '1'; }catch(e){}
    function card(S){ var g = [[], [], []], use = [0, 0, 0, 0, 0, 0, 0, 0, 0], rows = [];
      for(var r = 0; r < 3; r++){ var cols = EG.shuffle(S, EG.range(9)).slice(0, 5).sort(function(a, b){ return a - b; }); rows.push(cols); cols.forEach(function(c){ use[c]++; }); }
      for(var c = 0; c < 9; c++){ var lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9, pool = []; for(var v = lo; v <= hi; v++) pool.push(v); var pick = EG.shuffle(S, pool).slice(0, use[c]).sort(function(a, b){ return a - b; }), k = 0;
        for(var r2 = 0; r2 < 3; r2++){ if(rows[r2].indexOf(c) >= 0) g[r2][c] = pick[k++]; else g[r2][c] = 0; } }
      return g; }
    function rowsDone(S, i){ var g = S.cd[i], n = 0; for(var r = 0; r < 3; r++){ var ok = true; for(var c = 0; c < 9; c++) if(g[r][c] && !S.dn[g[r][c]]) ok = false; if(ok) n++; } return n; }
    function left(S, i){ var g = S.cd[i], n = 0; for(var r = 0; r < 3; r++) for(var c = 0; c < 9; c++) if(g[r][c] && !S.dn[g[r][c]]) n++; return n; }
    function prize(S){ return S.c1 < 0 ? 1 : (S.c2 < 0 ? 2 : 3); }
    function can(S, i){ var p = prize(S), d = rowsDone(S, i); return p === 1 ? d >= 1 : (p === 2 ? d >= 2 : d >= 3); }
    var PN = {1:'1. ÇİNKO', 2:'2. ÇİNKO', 3:'TOMBALA'};
    EG.reg({key:'tb', name:'TOMBALA', ic:'🎟️', ptxt:'2–8 kişi', min:2, max:8, noTimer:true,
      init:function(S){ S.cd = []; for(var i = 0; i < S.n; i++) S.cd.push(card(S)); S.ord = EG.shuffle(S, EG.range(90).map(function(x){ return x + 1; })); S.di = 0; S.dn = {}; S.c1 = -1; S.c2 = -1; S.tb = -1; S.lastD = Date.now() + 1500; S.oto = true; S.key = S.rs + ':' + S.n; },
      sub:function(S){ return 'Çekilen ' + S.di + '/90'; },
      turn:function(){ return -1; },
      tick:function(S, now){ if(S.oto && S.di < 90 && now - S.lastD > 3000) return {d:1}; return null; },   /* oto çekme: 3 sn */
      act:function(S, by, a){
        if(a.d){ if(S.di >= 90) return false; var v = S.ord[S.di++]; S.dn[v] = 1; S.last = v; S.lastD = Date.now(); S.fx = 'tick'; if(AUTO && MK.key === S.key) MK.m[v] = 1;
          if(S.di >= 90 && S.tb < 0){ S.over = {w:[], draw:true, txt:'Sayılar bitti'}; } return true; }
        if(a.oto != null){ S.oto = !!a.oto; S.lastD = Date.now(); return true; }
        if(a.cl){ var p = prize(S); if(a.cl !== p || !can(S, by)) return false;
          if(p === 1) S.c1 = by; else if(p === 2) S.c2 = by; else S.tb = by; S.log = '🎉 ' + EG.name(S, by) + ' ' + PN[p] + '!'; S.fx = 'win';
          if(p === 3){ S.over = {w:[by], txt:EG.name(S, by) + ' TOMBALA yaptı!', html:'<table><tr><td>1. Çinko</td><td><b>' + EG.esc(EG.name(S, S.c1)) + '</b></td></tr><tr><td>2. Çinko</td><td><b>' + EG.esc(EG.name(S, S.c2)) + '</b></td></tr><tr><td>Tombala</td><td><b>' + EG.esc(EG.name(S, S.tb)) + '</b></td></tr></table>'}; }
          return true; }
        return false; },
      botDelay:function(){ return 1400; },
      bot:function(S, i){ if(can(S, i) && Math.random() < 0.55) return {cl:prize(S)}; return null; },
      view:function(S, me, ui){ if(MK.key !== S.key){ MK.key = S.key; MK.m = {}; } if(AUTO) for(var k in S.dn) MK.m[k] = 1;
        var h = '<div class="felt nv" style="left:250px;width:740px"></div>';
        /* oyuncular */
        h += '<div style="position:absolute;left:8px;top:4px;width:232px;bottom:6px;display:flex;flex-direction:column;gap:5px;overflow:hidden">';
        for(var i = 0; i < S.n; i++){ var tag = (S.c1 === i ? ' 🥉' : '') + (S.c2 === i ? ' 🥈' : '') + (S.tb === i ? ' 🏆' : '');
          h += EG.seat(S, i, 'Kalan ' + left(S, i) + tag, '').replace('class="egSeat', 'style="position:relative;max-width:none;padding:2px 8px 2px 2px" class="egSeat' + (S.n > 6 ? ' tbS' : '')); }
        h += '</div>';
        /* top + son sayılar */
        var last = S.last, rec = S.ord.slice(Math.max(0, S.di - 6), Math.max(0, S.di - 1)).reverse();
        h += '<div style="position:absolute;left:300px;top:24px;width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffd36b 40%,#c98a12);box-shadow:inset -8px -10px 16px rgba(0,0,0,.35),0 8px 18px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font:1000 42px Arial;color:#3a2600">' + (last || '–') + '</div>';
        h += '<div style="position:absolute;left:410px;top:52px;display:flex;gap:6px">' + rec.map(function(v){ return '<span style="width:38px;height:38px;border-radius:50%;background:#1e3a8a;border:2px solid #93c5fd;display:flex;align-items:center;justify-content:center;font:1000 16px Arial">' + v + '</span>'; }).join('') + '</div>';
        /* ödüller */
        h += '<div style="position:absolute;right:16px;top:14px;display:flex;flex-direction:column;gap:4px;font:900 13px Arial;background:rgba(0,0,0,.45);border:1.5px solid rgba(214,170,92,.6);border-radius:12px;padding:8px 12px">' + [1, 2, 3].map(function(p){ var w = p === 1 ? S.c1 : (p === 2 ? S.c2 : S.tb); return '<div style="color:' + (w >= 0 ? '#4ade80' : (prize(S) === p ? '#ffd36b' : '#9fb0cf')) + '">' + PN[p] + ': ' + (w >= 0 ? EG.esc(EG.name(S, w)) : '—') + '</div>'; }).join('') + '</div>';
        if(EG.amHost()) h += '<div style="position:absolute;left:410px;top:98px;display:flex;gap:6px;z-index:3"><button type="button" class="bt g sm" data-x="dr"' + (S.di >= 90 ? ' disabled' : '') + '>👝 TAŞ ÇEK</button><button type="button" class="bt ' + (S.oto ? 'g' : 's') + ' sm" data-x="ot">OTO ÇEK: ' + (S.oto ? 'AÇIK' : 'KAPALI') + '</button></div>';
        else h += '<div style="position:absolute;left:410px;top:104px;font:800 12px Arial;color:#cbd5e1">👝 Taşları oyunu kuran çekiyor · oto ' + (S.oto ? 'açık (3 sn)' : 'kapalı') + '</div>';
        if(S.log) h += '<div class="msg" style="left:620px;top:130px">' + S.log + '</div>';
        /* kartım */
        var g = S.cd[me], cells = '';
        for(var r = 0; r < 3; r++) for(var c = 0; c < 9; c++){ var v = g[r][c], m = v && MK.m[v];
          cells += v ? '<div data-x="m" data-v="' + v + '" style="height:46px;border-radius:7px;display:flex;align-items:center;justify-content:center;font:1000 22px Arial;cursor:pointer;background:' + (m ? 'radial-gradient(circle,#ef4444 55%,#fee2e2 58%)' : '#fffef8') + ';color:' + (m ? '#fff' : '#1e293b') + ';border:2px solid ' + (S.dn[v] && !m ? '#4ade80' : '#d6aa5c') + '">' + v + '</div>' : '<div style="height:46px;border-radius:7px;background:rgba(214,170,92,.18)"></div>'; }
        h += '<div style="position:absolute;left:290px;top:176px;width:500px;display:grid;grid-template-columns:repeat(9,1fr);gap:4px;padding:8px;border-radius:12px;background:linear-gradient(180deg,#c81e1e,#7f1d1d);border:3px solid #ffd36b;box-shadow:0 10px 22px rgba(0,0,0,.6)">' + cells + '</div>';
        var cn = can(S, me), p = prize(S);
        h += '<div class="act" style="width:150px"><button type="button" class="bt ' + (cn ? 'g' : 's') + '" data-x="cl"' + (cn ? ' style="box-shadow:0 0 16px #4ade80"' : '') + '>' + PN[p] + '!</button><button type="button" class="bt s sm" data-x="au">' + (AUTO ? '✓ OTO İŞARETLE' : 'OTO İŞARETLE') + '</button></div>';
        return h; },
      click:function(S, me, x, ui){ var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(k === 'm'){ if(!S.dn[v]){ EG.toast('Bu sayı daha çekilmedi'); return null; } MK.m[v] = !MK.m[v]; return true; }
        if(k === 'dr'){ if(!EG.amHost()) return null; return {d:1}; }
        if(k === 'ot'){ if(!EG.amHost()) return null; return {oto:S.oto ? 0 : 1}; }
        if(k === 'au'){ AUTO = !AUTO; try{ localStorage.setItem('eg_tb_auto', AUTO ? '1' : '0'); }catch(e){} return true; }
        if(k === 'cl'){ if(!can(S, me)){ EG.toast('Henüz ' + PN[prize(S)].toLowerCase() + ' yok'); return null; } return {cl:prize(S)}; }
        return null; }
    });
  })();

  /* ================= OKEY + 101 (ortak taş motoru) ================= */
  (function(){
    var tc = EG.tc, tn = EG.tn;
    function isJ(S, t){ return t < 104 && tc(t) === S.ok[0] && tn(t) === S.ok[1]; }
    function face(S, t){ return t >= 104 ? [S.ok[0], S.ok[1]] : [tc(t), tn(t)]; }
    function counts(S, tiles){ var cnt = [], J = 0; for(var c = 0; c < 4; c++){ cnt.push([]); for(var n = 0; n <= 14; n++) cnt[c].push(0); }
      tiles.forEach(function(t){ if(isJ(S, t)) J++; else { var f = face(S, t); cnt[f[0]][f[1]]++; } }); return {cnt:cnt, J:J}; }
    /* tümü gruplanabilir mi (okey bitirme) */
    function allGroups(cnt, J){ var memo = {};
      function key(){ var s = ''; for(var c = 0; c < 4; c++) s += cnt[c].join(',') + '|'; return s; }
      function rec(J, g){ var fc = -1, fn = -1; outer: for(var c = 0; c < 4; c++) for(var n = 1; n <= 13; n++) if(cnt[c][n] > 0){ fc = c; fn = n; break outer; }
        if(fc < 0) return J === 0 || g > 0; var k = key() + J; if(memo[k] != null) return memo[k]; var res = false;
        /* per (aynı sayı farklı renk) */
        var oth = []; for(var c2 = 0; c2 < 4; c2++) if(c2 !== fc && cnt[c2][fn] > 0) oth.push(c2);
        for(var m = 0; m < (1 << oth.length) && !res; m++){ var sel = []; for(var b = 0; b < oth.length; b++) if(m & (1 << b)) sel.push(oth[b]);
          for(var jj = 0; jj <= Math.min(J, 2) && !res; jj++){ var sz = 1 + sel.length + jj; if(sz < 3 || sz > 4) continue;
            cnt[fc][fn]--; sel.forEach(function(x){ cnt[x][fn]--; }); res = rec(J - jj, g + 1); cnt[fc][fn]++; sel.forEach(function(x){ cnt[x][fn]++; }); } }
        /* seri (aynı renk ardışık; 12-13-1 olur) */
        for(var lead = 0; lead <= Math.min(J, 2) && !res; lead++){ if(fn - lead < 1) break;
          var used = [], ju = lead; cnt[fc][fn]--; used.push(fn);
          for(var p = fn + 1; p <= 14 && !res; p++){ var pn = p === 14 ? 1 : p; if(p === 14 && fn === 1) break;
            if(cnt[fc][pn] > 0){ cnt[fc][pn]--; used.push(pn); } else if(J - ju > 0){ ju++; used.push(-1); } else break;
            if(used.length + lead >= 3) res = rec(J - ju, g + 1); }
          used.forEach(function(x){ if(x > 0) cnt[fc][x]++; }); }
        memo[k] = res; return res; }
      return rec(J, 0); }
    function pairsOK(cnt, J){ var P = 0, Sg = 0; for(var c = 0; c < 4; c++) for(var n = 1; n <= 13; n++){ P += Math.floor(cnt[c][n] / 2); Sg += cnt[c][n] % 2; } return {p:P + Math.min(J, Sg) + Math.floor(Math.max(0, J - Sg) / 2), all:Sg <= J && (J - Sg) % 2 === 0}; }
    function winWith(S, hand, d){ var rest = hand.slice(); rest.splice(rest.indexOf(d), 1); var k = counts(S, rest); if(pairsOK(k.cnt, k.J).all) return 'c'; if(allGroups(k.cnt, k.J)) return 's'; return null; }
    function findWin(S, hand, pref){ var tried = {}; var order = pref != null ? [pref].concat(hand) : hand;
      for(var i = 0; i < order.length; i++){ var t = order[i], f = face(S, t), key = isJ(S, t) ? 'J' : f.join(':'); if(tried[key]) continue; tried[key] = 1; if(winWith(S, hand, t)) return t; } return null; }
    function useful(S, t, hand){ if(isJ(S, t)) return 100; var f = face(S, t), u = 0;
      hand.forEach(function(x){ if(x === t || isJ(S, x)) return; var g = face(S, x); if(g[0] === f[0]){ var d = Math.abs(g[1] - f[1]); if(d === 1 || d === 12) u += 2; else if(d === 2 || d === 11) u += 1; else if(d === 0) u += 1.2; } else if(g[1] === f[1]) u += 1.6; });
      return u; }
    function worst(S, hand, avoid){ var b = null, bv = 1e9; hand.forEach(function(t){ if(isJ(S, t) || (avoid && avoid(t))) return; var v = useful(S, t, hand) + (face(S, t)[1] / 100); if(v < bv){ bv = v; b = t; } }); return b == null ? hand[0] : b; }
    function deal(S, nTiles){ var d = EG.shuffle(S, EG.range(106)); var gi = 0; while(d[gi] >= 104) gi++; S.gost = d.splice(gi, 1)[0]; S.ok = [tc(S.gost), tn(S.gost) % 13 + 1];
      S.h = []; for(var i = 0; i < 4; i++) S.h.push(d.splice(0, nTiles)); var st = (S.dealer + 1) % 4; S.h[st].push(d.pop()); S.deck = d; S.dis = [[], [], [], []]; S.turn = st; S.phase = 'discard'; S.hn++; S.log = ''; }
    function prev(i){ return (i + 3) % 4; }
    function topDis(S, i){ var a = S.dis[i]; return a.length ? a[a.length - 1] : null; }
    /* raf sırası (yerel) */
    var RO = {key:null, sl:[]}, NS = 40, RW = 20, LTAP = {t:null, at:0};
    function arrange(S, h, mode){ var sl = [], i; for(i = 0; i < NS; i++) sl.push(null); var groups = [], rest;
      if(mode === 's'){ var b = bestOpen(S, h, true), R = realize(S, h, b.g); groups = R.groups.map(function(g){ return g.t.filter(function(t){ return t != null; }); }); rest = R.rest; }
      else { groups = pairList(S, h); rest = h.filter(function(t){ return !groups.some(function(g){ return g.indexOf(t) >= 0; }); }); }
      groups.sort(function(a, b){ var fa = face(S, a.find(function(t){ return !isJ(S, t); }) || a[0]), fb = face(S, b.find(function(t){ return !isJ(S, t); }) || b[0]); return mode === 's' ? (fa[0] - fb[0] || fa[1] - fb[1]) : (fa[1] - fb[1] || fa[0] - fb[0]); });
      rest = rest.slice().sort(function(a, b){ var ja = isJ(S, a), jb = isJ(S, b); if(ja !== jb) return ja ? 1 : -1; var fa = face(S, a), fb = face(S, b); return fa[0] - fb[0] || fa[1] - fb[1]; });
      var need = 0; groups.forEach(function(g){ need += g.length + 1; }); need += rest.length; var gap = need <= NS ? 1 : 0, pos = 0;
      function put(t){ while(pos < NS && sl[pos] != null) pos++; if(pos >= NS){ var e = sl.indexOf(null); if(e >= 0) sl[e] = t; return; } sl[pos++] = t; }
      groups.forEach(function(g){ var c = pos % RW; if(c && c + g.length > RW && g.length <= RW && Math.ceil(pos / RW) * RW + g.length <= NS) pos = Math.ceil(pos / RW) * RW; g.forEach(put); pos += gap; });
      rest.forEach(put); return sl; }
    function rackSync(S, me){ var k = S.rs0 + ':' + S.hn + ':' + me, h = S.h[me];
      if(RO.key !== k){ RO.key = k; RO.sl = arrange(S, h, 's'); return RO.sl; }
      for(var i = 0; i < NS; i++) if(RO.sl[i] != null && h.indexOf(RO.sl[i]) < 0) RO.sl[i] = null;
      h.forEach(function(t){ if(RO.sl.indexOf(t) < 0){ var e = -1; for(var j = NS - 1; j >= 0; j--){ if(RO.sl[j] != null) break; e = j; } if(e < 0) e = RO.sl.indexOf(null); if(e >= 0) RO.sl[e] = t; } });
      return RO.sl; }
    function rackHtml(S, me, ui){ var sl = rackSync(S, me), h = '<div class="rack" data-drop="rack">';
      for(var i = 0; i < NS; i++){ var t = sl[i]; h += t != null ? '<div class="sl">' + EG.tile(t, ui.sel === t ? 'sel' : '', ' data-x="t" data-drag="t" data-v="' + t + '"', S.ok) + '</div>' : '<div class="sl e' + (ui.sel != null ? ' tg' : '') + '" data-drop="slot" data-x="sl" data-v="' + i + '"></div>'; }
      return h + '</div>'; }
    function moveSlot(t, i){ var sl = RO.sl, a = sl.indexOf(t); if(a < 0 || i < 0 || i > NS - 1 || a === i) return; sl[a] = null;
      if(sl[i] == null){ sl[i] = t; return; }
      var j = -1; for(var k = i; k < NS; k++){ if(sl[k] == null){ j = k; break; } }
      if(j >= 0){ for(var m = j; m > i; m--) sl[m] = sl[m - 1]; sl[i] = t; return; }
      for(var k2 = i; k2 >= 0; k2--){ if(sl[k2] == null){ j = k2; break; } } if(j < 0){ sl[a] = t; return; }
      for(var m2 = j; m2 < i; m2++) sl[m2] = sl[m2 + 1]; sl[i] = t; }
    function rackClick(S, me, ui, v){ var now = Date.now(); if(isJ(S, v) && LTAP.t === v && now - LTAP.at < 350){ FLIP[v] = !FLIP[v]; LTAP.t = null; ui.sel = null; ui.grp = null; return true; } LTAP.t = v; LTAP.at = now; ui.grp = null; if(ui.sel == null){ ui.sel = v; return true; } if(ui.sel === v){ ui.sel = null; return true; } moveSlot(ui.sel, RO.sl.indexOf(v)); ui.sel = null; return true; }
    function blockOf(v){ var sl = RO.sl, i = sl.indexOf(v); if(i < 0) return null; var r0 = Math.floor(i / RW) * RW, a = i, b = i; while(a - 1 >= r0 && sl[a - 1] != null) a--; while(b + 1 < r0 + RW && sl[b + 1] != null) b++; if(b - a < 1 || (i !== a && i !== b)) return null; var o = []; for(var k = a; k <= b; k++) o.push(sl[k]); return o; }
    function moveGroup(grp, i){ var sl = RO.sl, back = sl.slice(); grp.forEach(function(t){ var p = sl.indexOf(t); if(p >= 0) sl[p] = null; }); var n = grp.length, r0 = Math.floor(i / RW) * RW; if(i + n > r0 + RW) i = r0 + RW - n;
      var free = true; for(var k = 0; k < n; k++) if(sl[i + k] != null) free = false;
      if(free){ grp.forEach(function(t, k){ sl[i + k] = t; }); return true; }
      var cnt = 0; for(var q = r0; q < r0 + RW; q++) if(sl[q] == null) cnt++; if(cnt < n){ RO.sl = back; EG.toast('Bu sırada yer yok'); return false; }
      grp.forEach(function(t, k){ var e = sl.indexOf(null); sl[e] = t; moveSlot(t, i + k); }); return true; }
    function slotClick(ui, i){ if(ui.sel == null) return null; moveSlot(ui.sel, i); ui.sel = null; return true; }
    var FLIP = {}, VC = {k:null, v:0, p:0};
    function tileR(S, t, sel, nw, gp){ var J = isJ(S, t), ex = (nw ? ' data-nt' : ''), cl = (sel ? ' sel' : '') + (nw ? ' nw' : '') + (gp ? ' gp' : ''); if(J && !FLIP[t]) return '<div class="egT bk' + cl + '" data-x="t" data-drag="t" data-lp="1" data-v="' + t + '"' + ex + '><u>M</u></div>'; return EG.tile(t, cl, ' data-x="t" data-drag="t" data-lp="1" data-v="' + t + '"' + ex, S.ok); }
    var NW = {t:null, at:0};
    function rack2(S, me, ui, is101){ var sl = rackSync(S, me), h = '<div class="rack r3" data-drop="rack">';
      if(S.ntBy === me && S.nt != null && NW.t !== S.nt + ':' + S.ntK){ NW.t = S.nt + ':' + S.ntK; NW.at = Date.now(); EG.later(2100); }
      var nwOn = S.ntBy === me && Date.now() - NW.at < 2000;
      for(var i = 0; i < NS; i++){ var t = sl[i]; h += t != null ? '<div class="sl">' + tileR(S, t, ui.sel === t, nwOn && t === S.nt, ui.grp && ui.grp.indexOf(t) >= 0) + '</div>' : '<div class="sl e' + (ui.sel != null ? ' tg' : '') + '" data-drop="slot" data-x="sl" data-v="' + i + '"></div>'; }
      var canDraw = S.turn === me && S.phase === 'draw', bb = [];
      bb.push('<button type="button" class="egRb' + (canDraw ? ' g' : '') + '" data-x="dk"' + (canDraw ? '' : ' disabled') + '>🀫 TAŞ ÇEK</button>');
      bb.push('<button type="button" class="egRb" data-x="ss">SERİ DİZ</button>');
      bb.push('<button type="button" class="egRb" data-x="sc">ÇİFT DİZ</button>');
      if(is101){ var ia = S.turn === me && S.phase === 'discard' && S.op[me] && !S.opNow && S.h[me].some(function(t){ return S.tb.some(function(g){ return canAdd(S, g, t) || swapIdx(S, g, t) >= 0; }); }); bb.push('<button type="button" class="egRb' + (ia ? ' g' : '') + '" data-x="ia"' + (ia ? '' : ' disabled') + '>TAŞLARI İŞLE</button>'); }
      return h + '</div><div class="egRbs">' + bb.join('') + '</div>'; }
    var CXY = {t:'left:90px;top:96px', l:'left:136px;top:96px', r:'right:90px;top:8px', b:'right:90px;top:172px'};
    function corners(S, me, is101){ var h = '';
      for(var i = 0; i < 4; i++){ var p = EG.pos(S, i), xy = CXY[p]; if(!is101 && p === 't') xy = 'left:90px;top:8px'; if(!is101 && p === 'l') xy = 'left:90px;top:150px'; var t = topDis(S, i), take = S.turn === me && S.phase === 'draw' && i === prev(me), myDrop = i === me && S.turn === me && S.phase === 'discard';
        h += '<div class="egCor' + (take && t != null ? ' take' : '') + '" style="' + xy + '"' + (take ? ' data-x="dp" data-drag="dp"' : '') + (myDrop ? ' data-x="at" data-drop="at"' : '') + ' data-tk' + i + '>';
        if(myDrop) h += '<div class="drop">BURAYA<br>AT</div><small>Senin</small>';
        else { h += t != null ? EG.tile(t, 'sm', S.lastBy === i ? ' data-last' : '', S.ok) : '<div class="egT sm" style="visibility:hidden"></div>'; h += '<small' + (take && t != null ? ' style="color:#4ade80"' : '') + '>' + (take && t != null ? 'AL' : (i === me ? 'Senin' : EG.esc(EG.name(S, i).replace('🤖 ', '')))) + '</small>'; }
        h += '</div>'; }
      return h; }
    function deckG(S, sm){ return '<div style="text-align:center;cursor:pointer" data-deck data-x="dk" data-drag="dk">' + EG.tback(sm ? 'xs' : '') + '<div class="cnt" style="position:static;margin-top:3px">' + S.deck.length + '</div></div>' +
      '<div style="text-align:center" data-drop="fin" data-x="fin" class="egFin">' + EG.tile(S.gost, sm ? 'xs' : '') + '<div class="cnt" style="position:static;margin-top:3px">' + (sm ? 'Gös.' : 'Gösterge') + '</div></div>'; }
    function plates(S, me, chips){ var XY = {t:'left:50%;top:-44px;transform:translateX(-50%);z-index:7', l:'left:4px;top:56px', r:'right:4px;top:56px', b:'left:90px;top:216px;z-index:7'}, h = '';
      for(var i = 0; i < 4; i++){ var p = EG.pos(S, i); h += EG.plate(S, i, chips(i), (p === 'l' || p === 'r' ? 'v n' : 'cp'), XY[p]); } return h; }
    var FELT = '<div class="felt" style="left:74px;top:0;width:852px;height:268px"></div>';
    function dropT(S, me, src, dst, ui, mod){ var v = src.v != null ? +src.v : null;
      if(src.k === 'dk' || src.k === 'dp'){ if((dst.k === 'rack' || dst.k === 'tile' || dst.k === 'slot') && S.turn === me && S.phase === 'draw') return mod.click(S, me, src.el, ui); return null; }
      if(src.k !== 't') return null;
      if(ui.grp && ui.grp.indexOf(v) >= 0 && (dst.k === 'tile' || dst.k === 'slot')){ var gi0 = dst.k === 'slot' ? +dst.v : RO.sl.indexOf(+dst.v); if(dst.k === 'tile' && ui.grp.indexOf(+dst.v) >= 0) return null; var off = ui.grp.indexOf(v); moveGroup(ui.grp, Math.max(Math.floor(gi0 / RW) * RW, gi0 - off)); ui.grp = null; ui.sel = null; return true; }
      if(dst.k === 'tile'){ if(+dst.v !== v) moveSlot(v, RO.sl.indexOf(+dst.v)); ui.sel = null; return true; }
      if(dst.k === 'slot'){ moveSlot(v, +dst.v); ui.sel = null; return true; }
      if(dst.k === 'rack') return null;
      if(dst.k === 'at'){ if(S.turn !== me || S.phase !== 'discard') return null; if(S.must){ EG.toast('Önce elini açmalısın'); return null; } return {t:v}; }
      if(dst.k === 'fin'){ if(S.turn !== me || S.phase !== 'discard') return null; if(mod.key === 'okey'){ if(winWith(S, S.h[me], v)) return {f:v}; } else if(S.op[me] && S.h[me].length === 1) return {t:v}; EG.toast('Elin henüz bitmiyor'); return null; }
      if(dst.k === 'gap'){ ui.sel = v; var f2 = document.createElement('i'); f2.setAttribute('data-x', 'gap'); f2.setAttribute('data-v', dst.v); return mod.click(S, me, f2, ui); }
      if(dst.k === 'g'){ if(mod.key === 'o101' && S.turn === me && S.op[me] && !S.opNow){ var gg = S.tb[+dst.v]; if(gg){ var sd = canAdd(S, gg, v, dst.sd) || canAdd(S, gg, v); if(sd) return {is:v, g:+dst.v, sd:sd}; if(swapIdx(S, gg, v) >= 0) return {sw:v, g:+dst.v}; EG.toast('Bu taş bu pere uymuyor'); return null; } }
        ui.sel = v; var f = document.createElement('i'); f.setAttribute('data-x', 'g'); f.setAttribute('data-v', dst.v); return mod.click(S, me, f, ui); }
      return null; }
    /* ---------------- OKEY ---------------- */
    function endHand(S, w, how){ if(w >= 0) S.sc[w] += how === 'c' ? 2 : 1;
      var rows = ''; for(var i = 0; i < 4; i++) rows += '<tr><td>' + EG.esc(EG.name(S, i)) + '</td><td><b>' + S.sc[i] + '</b></td></tr>';
      S.sum = '<table><tr><th></th><th>Puan</th></tr>' + rows + '</table>';
      if(S.hn >= S.hmax){ var mx = Math.max.apply(null, S.sc), W = []; S.sc.forEach(function(v, i){ if(v === mx) W.push(i); }); S.over = {w:W, txt:S.hmax + ' el bitti' + (w >= 0 ? ' · son eli ' + EG.name(S, w) + ' bitirdi' : ''), html:S.sum}; return; }
      S.wait = {txt:w >= 0 ? '🎉 ' + EG.name(S, w) + ' eli bitirdi' + (how === 'c' ? ' (çiftten +2)' : ' (+1)') : '🤝 Deste bitti, el berabere', html:S.sum}; S.fx = 'win'; }
    function nextOkey(S){ S.wait = null; S.dealer = (S.dealer + 1) % 4; deal(S, 14); S.log = ''; }
    EG.reg({key:'okey', name:'OKEY', ic:'🀄', ptxt:'4 kişi', min:4, max:4, fixed:4,
      init:function(S){ S.sc = [0, 0, 0, 0]; S.hn = 0; S.hmax = 5; S.dealer = 3; S.rs0 = S.rs; deal(S, 14); },
      sub:function(S){ return 'El ' + S.hn + '/' + S.hmax + ' · Deste ' + S.deck.length; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(S.wait){ if(!a.nh) return false; nextOkey(S); return true; } if(by !== S.turn) return false; var h = S.h[by];
        if(S.phase === 'draw'){ if(a.dk){ if(!S.deck.length){ endHand(S, -1); return true; } h.push(S.deck.pop()); S.phase = 'discard'; S.nt = h[h.length - 1]; S.ntBy = by; S.ntK = (S.ntK || 0) + 1; S.an = [{t:1, c:null, from:'deck', to:'nt:' + by}]; return true; }
          if(a.dp){ var p = S.dis[prev(by)]; if(!p.length) return false; S.an = [{t:1, c:p[p.length - 1], from:'tk' + prev(by), to:'nt:' + by}]; S.nt = p[p.length - 1]; S.ntBy = by; S.ntK = (S.ntK || 0) + 1; h.push(p.pop()); S.phase = 'discard'; S.log = EG.name(S, by) + ' yandan aldı'; return true; } return false; }
        if(a.f != null){ if(h.indexOf(a.f) < 0) return false; var how = winWith(S, h, a.f); if(!how) return false; h.splice(h.indexOf(a.f), 1); S.dis[by].push(a.f); endHand(S, by, how); return true; }
        if(a.t == null || h.indexOf(a.t) < 0) return false; h.splice(h.indexOf(a.t), 1); S.dis[by].push(a.t); S.lastBy = by; S.an = [{t:1, c:a.t, from:'seat:' + by, to:'last'}]; S.turn = (by + 1) % 4; S.phase = 'draw'; S.log = '';
        if(!S.deck.length) endHand(S, -1); return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i];
        if(S.phase === 'draw'){ var t = topDis(S, prev(i)); if(t != null && (isJ(S, t) || useful(S, t, h.concat([t])) >= 3.2)) return {dp:1}; if(!S.deck.length) return t != null ? {dp:1} : {dk:1}; return {dk:1}; }
        var w = findWin(S, h); if(w != null) return {f:w}; return {t:worst(S, h)}; },
      lp:function(S, me, src, ui){ if(src.k !== 't') return null; var g = blockOf(+src.v); if(!g) return null; ui.grp = g; ui.sel = null; return true; },
      view:function(S, me, ui){ var h = FELT;
        h += plates(S, me, function(i){ return [['Puan', S.sc[i], 'p']]; }) + corners(S, me, false);
        h += '<div style="position:absolute;left:50%;top:60px;transform:translateX(-50%);display:flex;gap:22px;align-items:flex-start">' + deckG(S, false) + '</div>';
        if(S.log) h += '<div class="msg" style="top:160px">' + S.log + '</div>';
        var mine = S.turn === me, can = mine && S.phase === 'discard' && !S.wait ? findWin(S, S.h[me], ui.sel) : null;
        if(can != null) h += '<button type="button" class="bt g" data-x="fin" style="position:absolute;left:50%;top:194px;transform:translateX(-50%);box-shadow:0 0 18px #4ade80;z-index:6">🏁 BİTİR</button>';
        h += rack2(S, me, ui, false);
        if(mine && !S.wait) h += '<div class="msg" style="top:246px;font-size:12px;padding:3px 12px">' + (S.phase === 'draw' ? '👉 Taş çek ya da soldaki taşı al' : '👉 Taşı sağdaki kutuya at' + (can != null ? ' · bitirmek için göstergeye sürükle' : '')) + '</div>';
        return h; },
      drop:function(S, me, src, dst, ui){ return dropT(S, me, src, dst, ui, this); },
      click:function(S, me, x, ui){ var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(k === 't') return rackClick(S, me, ui, v);
        if(k === 'ss'){ RO.sl = arrange(S, S.h[me], 's'); ui.sel = null; return true; } if(k === 'sc'){ RO.sl = arrange(S, S.h[me], 'c'); ui.sel = null; return true; } if(k === 'sl') return slotClick(ui, v);
        if(S.turn !== me) return null;
        if(S.phase === 'draw'){ if(k === 'dk') return {dk:1}; if(k === 'dp') return {dp:1}; return null; }
        if(k === 'at' && ui.sel != null) return {t:ui.sel};
        if(k === 'fin'){ var w = findWin(S, S.h[me], ui.sel); return w != null ? {f:w} : null; }
        return null; }
    });

    /* ---------------- 101 ---------------- */
    function tval(S, t){ return face(S, t)[1]; }
    /* aday gruplar */
    function cands(S, hand){ var k = counts(S, hand), cnt = k.cnt, J = k.J, out = [];
      for(var n = 1; n <= 13; n++){ var cols = []; for(var c = 0; c < 4; c++) if(cnt[c][n] > 0) cols.push(c);
        for(var m = 1; m < (1 << cols.length); m++){ var sel = []; for(var b = 0; b < cols.length; b++) if(m & (1 << b)) sel.push(cols[b]);
          for(var j = 0; j <= Math.min(J, 2); j++){ var sz = sel.length + j; if(sz < 3 || sz > 4) continue; out.push({k:'set', n:n, f:sel.map(function(c){ return [c, n]; }), j:j, v:n * sz}); } } }
      for(var c2 = 0; c2 < 4; c2++) for(var s = 1; s <= 12; s++){ var f = [], j2 = 0, v = 0;
        for(var p = s; p <= 14; p++){ var pn = p === 14 ? 1 : p; if(p === 14 && s === 1) break; if(cnt[c2][pn] > 0) f.push([c2, pn]); else if(j2 < J){ j2++; f.push(null); } else break; v += p === 14 ? 14 : p; var L = p - s + 1;
          if(L >= 3 && f.some(function(x){ return x; })) out.push({k:'run', c:c2, s:s, L:L, f:f.filter(function(x){ return x; }), j:j2, v:v, pat:f.slice()}); } }
      out.sort(function(a, b){ return b.v - a.v; }); return {list:out, cnt:cnt, J:J}; }
    function bestOpen(S, hand, byCnt){ var C = cands(S, hand), cnt = C.cnt, best = {v:0, g:[]}, nodes = 0, L = C.list; if(byCnt){ L = L.map(function(c){ var d = Object.assign({}, c); d.v = (c.f.length + c.j) * 100 + c.v; d.v0 = c.v; return d; }); L.sort(function(a, b){ return b.v - a.v; }); }
      (function dfs(i, J, v, g){ if(++nodes > 40000) return; if(v > best.v){ best = {v:v, g:g.slice()}; }
        for(var x = i; x < L.length; x++){ var c = L[x]; if(c.j > J) continue; var ok = true, fx = c.f; for(var y = 0; y < fx.length; y++){ if(cnt[fx[y][0]][fx[y][1]] <= 0){ ok = false; } cnt[fx[y][0]][fx[y][1]]--; }
          if(ok){ g.push(c); dfs(x, J - c.j, v + c.v, g); g.pop(); } for(var z = 0; z < fx.length; z++) cnt[fx[z][0]][fx[z][1]]++; if(nodes > 40000) return; } })(0, C.J, 0, []);
      return best; }
    function realize(S, hand, groups){ var pool = hand.slice(), out = [];
      groups.forEach(function(c){ var ts = []; var take = function(f){ for(var i = 0; i < pool.length; i++){ var t = pool[i]; if(!isJ(S, t)){ var g = face(S, t); if(g[0] === f[0] && g[1] === f[1]){ pool.splice(i, 1); return t; } } } return null; };
        var takeJ = function(){ for(var i = 0; i < pool.length; i++) if(isJ(S, pool[i])) return pool.splice(i, 1)[0]; return null; };
        if(c.k === 'set'){ c.f.forEach(function(f){ ts.push(take(f)); }); for(var j = 0; j < c.j; j++) ts.push(takeJ()); out.push({k:'set', n:c.n, cols:c.f.map(function(f){ return f[0]; }), sz:c.f.length + c.j, t:ts}); }
        else { c.pat.forEach(function(f){ ts.push(f ? take(f) : takeJ()); }); out.push({k:'run', c:c.c, s:c.s, L:c.L, t:ts}); } });
      return {groups:out, rest:pool}; }
    function pairList(S, hand){ var pool = hand.slice(), pr = [], J = pool.filter(function(t){ return isJ(S, t); });
      var nonJ = pool.filter(function(t){ return !isJ(S, t); }), used = {};
      for(var i = 0; i < nonJ.length; i++){ if(used[i]) continue; var fi = face(S, nonJ[i]); for(var k = i + 1; k < nonJ.length; k++){ if(used[k]) continue; var fk = face(S, nonJ[k]); if(fi[0] === fk[0] && fi[1] === fk[1]){ used[i] = used[k] = 1; pr.push([nonJ[i], nonJ[k]]); break; } } }
      var singles = nonJ.filter(function(t, i){ return !used[i]; }).sort(function(a, b){ return tval(S, b) - tval(S, a); });
      while(J.length && singles.length){ pr.push([singles.shift(), J.shift()]); }
      return pr; }
    function canAdd(S, g, t, sd){ var J = isJ(S, t), f = face(S, t);
      if(g.k === 'set'){ if(g.sz >= 4) return false; if(J) return 'e'; return f[1] === g.n && g.cols.indexOf(f[0]) < 0 ? 'e' : false; }
      if(g.k === 'run'){ var endN = g.s + g.L, eOk = endN <= 14 && !(endN === 14 && g.s === 1), sOk = g.s > 1;
        if(!J){ if(f[0] !== g.c) return false; eOk = eOk && (endN === 14 ? 1 : endN) === f[1]; sOk = sOk && g.s - 1 === f[1]; }
        if(sd === 's') return sOk ? 's' : false; if(sd === 'e') return eOk ? 'e' : false; return eOk ? 'e' : (sOk ? 's' : false); }
      return false; }
    /* okey alma: masadaki perde okeyin yerini tutan gerçek taşı koyup okeyi ele al */
    function swapIdx(S, g, t){ if(!g || !g.t || isJ(S, t)) return -1; var f = face(S, t);
      if(g.k === 'run'){ if(f[0] !== g.c) return -1; for(var i = 0; i < g.t.length; i++) if(isJ(S, g.t[i])){ var n = g.s + i; if(n === 14) n = 1; if(n === f[1]) return i; } return -1; }
      if(g.k === 'set'){ if(f[1] !== g.n || g.cols.indexOf(f[0]) >= 0) return -1; for(var j = 0; j < g.t.length; j++) if(isJ(S, g.t[j])) return j; } return -1; }
    function doSwap(S, h, t, g){ var i = swapIdx(S, g, t); if(i < 0) return null; var j = g.t[i]; g.t[i] = t; h.splice(h.indexOf(t), 1); if(g.k === 'set') g.cols.push(face(S, t)[0]); h.push(j); return j; }
    function gaps(g){ if(g.k === 'set') return {s:false, e:g.sz < 4}; if(g.k === 'run'){ var endN = g.s + g.L; return {s:g.s > 1, e:endN <= 14 && !(endN === 14 && g.s === 1)}; } return {s:false, e:false}; }
    function isle(S, h, t, g, side){ h.splice(h.indexOf(t), 1); if(g.k === 'set'){ g.t.push(t); g.sz++; if(!isJ(S, t)) g.cols.push(face(S, t)[0]); } else if(side === 's'){ g.t.unshift(t); g.s--; g.L++; } else { g.t.push(t); g.L++; } }
    function hval(S, h){ var v = 0; h.forEach(function(t){ v += isJ(S, t) ? S.ok[1] : tval(S, t); }); return v; }
    function end101(S, w, okeyFin){ var mul = okeyFin ? 2 : 1, rows = '';
      for(var i = 0; i < 4; i++){ var d; if(i === w) d = okeyFin ? -202 : -101; else if(!S.op[i]) d = 202 * mul; else d = hval(S, S.h[i]) * (S.op[i] === 'c' ? 2 : 1) * mul; S.sc[i] += d;
        rows += '<tr><td>' + EG.esc(EG.name(S, i)) + '</td><td>' + (S.op[i] ? (S.op[i] === 'c' ? 'Çift açtı' : 'Açtı') : 'Açmadı') + '</td><td>' + (d > 0 ? '+' : '') + d + '</td><td><b>' + S.sc[i] + '</b></td></tr>'; }
      S.sum = '<table><tr><th></th><th></th><th>Ceza</th><th>Toplam</th></tr>' + rows + '</table>';
      if(S.hn >= S.hmax){ var mn = Math.min.apply(null, S.sc), W = []; S.sc.forEach(function(v, i){ if(v === mn) W.push(i); }); S.over = {w:W, txt:S.hmax + ' el bitti · en az puan kazanır', html:S.sum}; return; }
      S.wait = {txt:w >= 0 ? '🎉 ' + EG.name(S, w) + ' eli bitirdi' + (okeyFin ? ' (okeyle ×2!)' : '') : '🤝 Deste bitti', html:S.sum}; S.fx = 'win'; }
    function next101(S){ S.wait = null; S.dealer = (S.dealer + 1) % 4; init101hand(S); S.log = ''; }
    function init101hand(S){ deal(S, 21); S.op = [false, false, false, false]; S.opv = ['', '', '', '']; S.tb = []; S.lastBy = -1; S.bar = {s:101, c:5}; S.must = false; S.opNow = false; }
    EG.reg({key:'o101', name:'101 OKEY', ic:'🀄', ptxt:'4 kişi', min:4, max:4, fixed:4,
      opts:[{k:'kat', v:[[0, 'KATLAMASIZ'], [1, 'KATLAMALI']]}], defOpt:function(){ return {kat:0}; },
      init:function(S, o){ S.kat = o && +o.kat === 1; S.sc = [0, 0, 0, 0]; S.hn = 0; S.hmax = 5; S.dealer = 3; S.rs0 = S.rs; init101hand(S); },
      sub:function(S){ return 'El ' + S.hn + '/' + S.hmax; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(S.wait){ if(!a.nh) return false; next101(S); return true; } if(by !== S.turn) return false; var h = S.h[by];
        if(a.ia){ if(!S.op[by] || S.opNow || S.phase !== 'discard') return false; var n0 = 0, nsw = 0, ch = true; for(var w1 = h.length - 1; w1 >= 0; w1--){ for(var w2 = 0; w2 < S.tb.length; w2++){ if(h[w1] != null && doSwap(S, h, h[w1], S.tb[w2]) != null){ nsw++; break; } } } while(ch){ ch = false; for(var q1 = 0; q1 < h.length && !ch; q1++){ if(isJ(S, h[q1]) && h.length > 1) continue; for(var q2 = 0; q2 < S.tb.length; q2++){ var sd0 = canAdd(S, S.tb[q2], h[q1]); if(sd0){ isle(S, h, h[q1], S.tb[q2], sd0); n0++; ch = true; break; } } } }
          if(!n0 && !nsw) return false; S.log = EG.name(S, by) + (nsw ? ' ' + nsw + ' okey aldı' : '') + (n0 ? ' ' + n0 + ' taş işledi' : ''); S.fx = 'hit'; if(!h.length) end101(S, by, false); return true; }
        if(S.phase === 'draw'){ if(a.dk){ if(!S.deck.length){ end101(S, -1, false); return true; } h.push(S.deck.pop()); S.phase = 'discard'; S.opNow = false; S.nt = h[h.length - 1]; S.ntBy = by; S.ntK = (S.ntK || 0) + 1; S.an = [{t:1, c:null, from:'deck', to:'nt:' + by}]; return true; }
          if(a.dp){ var p = S.dis[prev(by)]; if(!p.length) return false; var t = p[p.length - 1];
            if(!S.op[by]){ var hh = h.concat([t]), bo = bestOpen(S, hh), pc = pairList(S, hh).length; if(bo.v < S.bar.s && pc < S.bar.c) return false; S.must = true; }
            S.an = [{t:1, c:p[p.length - 1], from:'tk' + prev(by), to:'nt:' + by}]; S.nt = p[p.length - 1]; S.ntBy = by; S.ntK = (S.ntK || 0) + 1; h.push(p.pop()); S.phase = 'discard'; S.opNow = false; S.log = EG.name(S, by) + ' yandan aldı'; return true; } return false; }
        if(a.op){ if(S.op[by]) return false;
          if(a.op === 's'){ var b = bestOpen(S, h); if(b.v < S.bar.s) return false; var R = realize(S, h, b.g); R.groups.forEach(function(g){ g.o = by; S.tb.push(g); }); S.h[by] = R.rest; S.op[by] = 's'; S.opv[by] = b.v; if(S.kat) S.bar.s = b.v + 1; S.log = '📂 ' + EG.name(S, by) + ' ' + b.v + ' ile açtı'; }
          else { var P = pairList(S, h); if(P.length < S.bar.c) return false; var rest = h.slice(); P.forEach(function(pp){ pp.forEach(function(t){ rest.splice(rest.indexOf(t), 1); }); S.tb.push({k:'pair', o:by, t:pp}); }); S.h[by] = rest; S.op[by] = 'c'; S.opv[by] = P.length + ' çift'; if(S.kat) S.bar.c = P.length + 1; S.log = '📂 ' + EG.name(S, by) + ' ' + P.length + ' çift açtı'; }
          S.must = false; S.opNow = false; S.fx = 'hit'; return true; }   /* eli İLK açan o turda işleyemez, sonradan açanlar işleyebilir */
        if(a.np){ if(!S.op[by] || S.opNow || S.phase !== 'discard') return false; var nb0 = bestOpen(S, h), ng = 0, npr = 0, hr = h;
          if(nb0.g && nb0.g.length){ var RR = realize(S, h, nb0.g); RR.groups.forEach(function(g){ g.o = by; S.tb.push(g); ng++; }); hr = RR.rest; }
          var PP = pairList(S, hr); PP.forEach(function(pp){ pp.forEach(function(t){ hr.splice(hr.indexOf(t), 1); }); S.tb.push({k:'pair', o:by, t:pp}); npr++; });
          if(!ng && !npr) return false; S.h[by] = hr; h = hr; S.log = '📂 ' + EG.name(S, by) + ' yeni ' + (ng ? ng + ' per ' : '') + (npr ? npr + ' çift ' : '') + 'açtı'; S.fx = 'hit'; if(!h.length) end101(S, by, false); return true; }
        if(a.sw != null){ if(!S.op[by] || S.opNow || S.phase !== 'discard') return false; var gw = S.tb[a.g]; if(!gw || h.indexOf(a.sw) < 0) return false; var jw = doSwap(S, h, a.sw, gw); if(jw == null) return false; S.log = '🃏 ' + EG.name(S, by) + ' okeyi aldı!'; S.nt = jw; S.ntBy = by; S.ntK = (S.ntK || 0) + 1; S.fx = 'hit'; return true; }
        if(a.is != null){ if(!S.op[by] || S.opNow) return false; var g = S.tb[a.g]; if(!g || h.indexOf(a.is) < 0) return false; var side = canAdd(S, g, a.is, a.sd); if(!side) return false;
          isle(S, h, a.is, g, side);
          S.log = EG.name(S, by) + ' taş işledi'; if(!h.length){ end101(S, by, false); } return true; }
        if(a.t == null || h.indexOf(a.t) < 0 || S.must) return false; if(h.length === 1 && !S.op[by]) return false;
        h.splice(h.indexOf(a.t), 1); S.dis[by].push(a.t); S.opNow = false; S.lastBy = by; S.an = [{t:1, c:a.t, from:'seat:' + by, to:'last'}];
        if(!h.length && S.op[by]){ end101(S, by, isJ(S, a.t)); return true; }
        S.turn = (by + 1) % 4; S.phase = 'draw'; S.log = ''; if(!S.deck.length) end101(S, -1, false); return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i];
        if(S.phase === 'draw'){ var t = topDis(S, prev(i)); if(t != null){ if(S.op[i]){ if(S.tb.some(function(g){ return canAdd(S, g, t); })) return {dp:1}; }
            else { var hh = h.concat([t]); if(bestOpen(S, hh).v >= S.bar.s && bestOpen(S, h).v < S.bar.s) return {dp:1}; } } return S.deck.length ? {dk:1} : (t != null && S.op[i] ? {dp:1} : {dk:1}); }
        if(!S.op[i]){ var b = bestOpen(S, h); if(b.v >= S.bar.s) return {op:'s'}; var pc = pairList(S, h).length; if(pc >= S.bar.c && pc >= 5) return {op:'c'}; }
        if(S.op[i] && !S.opNow){ for(var k0 = 0; k0 < h.length; k0++) for(var g0 = 0; g0 < S.tb.length; g0++) if(swapIdx(S, S.tb[g0], h[k0]) >= 0) return {sw:h[k0], g:g0}; }
        if(S.op[i] && !S.opNow && h.length > 1){ for(var k = 0; k < h.length; k++) for(var g = 0; g < S.tb.length; g++) if(canAdd(S, S.tb[g], h[k]) && !(isJ(S, h[k]) && h.length > 2)) return {is:h[k], g:g}; }
        if(S.must) return null;
        return {t:worst(S, h, function(t){ return S.tb.some(function(g){ return canAdd(S, g, t); }); })}; },
      lp:function(S, me, src, ui){ if(src.k !== 't') return null; var g = blockOf(+src.v); if(!g) return null; ui.grp = g; ui.sel = null; return true; },
      view:function(S, me, ui){ var h = FELT;
        h += plates(S, me, function(i){ return [S.op[i] ? ['Açtı', S.opv[i], 'g'] : ['Açmadı', '–'], ['Ceza', S.sc[i], 'p']]; }) + corners(S, me, true);
        h += '<div style="position:absolute;left:90px;top:6px;display:flex;gap:5px;z-index:4"><span class="cnt" style="position:static;background:' + (S.kat ? '#7f1d1d' : '#1e3a8a') + '">' + (S.kat ? 'Katlamalı' : 'Katlamasız') + '</span><span class="cnt" style="position:static">Baraj ' + S.bar.s + ' · ' + S.bar.c + ' çift</span></div>';
        h += '<div style="position:absolute;left:90px;top:30px;display:flex;gap:6px;align-items:flex-start">' + deckG(S, true) + '</div>';
        var nt = 0; S.tb.forEach(function(g){ nt += g.t.length; }); var sz = nt > 60 ? ' g3' : (nt > 36 ? ' g2' : '');
        var sec = '';
        for(var o = 0; o < 4; o++){ var gs = []; S.tb.forEach(function(g, gi){ if(g.o === o) gs.push([g, gi]); }); if(!gs.length) continue; var oc = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24'][(o - me + 4) % 4];
          sec += '<div class="egOw"><div class="lb" style="color:' + oc + '">' + EG.esc(EG.name(S, o)) + ' · ' + S.opv[o] + '</div><div class="gl">' + gs.map(function(x){ var g = x[0], gi = x[1], ok = ui.sel != null && S.turn === me && S.op[me] && !S.opNow && canAdd(S, g, ui.sel);
            return '<div class="grp' + (ok ? ' ok' : '') + '" style="--oc:' + oc + '" data-x="g" data-v="' + gi + '">' + g.t.map(function(t){ return EG.tile(t, 'xs', '', S.ok); }).join('') + '</div>'; }).join('') + '</div></div>'; }
        h += '<div class="egTb' + sz + '">' + (sec || '<div style="margin:auto;font:800 12px Arial;color:rgba(255,255,255,.35)">Henüz kimse elini açmadı</div>') + '</div>';
        if(S.log) h += '<div class="msg" style="top:218px;left:520px">' + S.log + '</div>';
        var mine = S.turn === me, h2 = S.h[me], key = h2.slice().sort().join(',') + ':' + S.hn;
        if(VC.k !== key){ VC.k = key; VC.v = bestOpen(S, h2).v; VC.p = pairList(S, h2).length; }
        if(mine && S.phase === 'discard' && S.op[me] && !S.opNow && !S.wait){ var nbx = bestOpen(S, S.h[me]), npx = pairList(S, S.h[me]).length; if((nbx.g && nbx.g.length) || npx) h += '<div style="position:absolute;left:50%;top:228px;transform:translateX(-50%);z-index:6"><button type="button" class="bt g sm" data-x="np" style="box-shadow:0 0 14px #4ade80">📂 PER AÇ' + (nbx.g && nbx.g.length ? ' · ' + nbx.g.length + ' per' : '') + (npx ? ' · ' + npx + ' çift' : '') + '</button></div>'; }
        if(mine && S.phase === 'discard' && !S.op[me] && !S.wait) h += '<div style="position:absolute;left:50%;top:228px;transform:translateX(-50%);display:flex;gap:10px;z-index:6"><button type="button" class="bt g sm" data-x="ops"' + (VC.v >= S.bar.s ? ' style="box-shadow:0 0 14px #4ade80"' : ' disabled') + '>📂 SERİ AÇ (' + VC.v + ')</button><button type="button" class="bt g sm" data-x="opc"' + (VC.p >= S.bar.c ? ' style="box-shadow:0 0 14px #4ade80"' : ' disabled') + '>ÇİFT AÇ (' + VC.p + ')</button></div>';
        if(!S.op[me]) h += '<div class="cnt" style="right:150px;top:200px;font-size:11px;background:' + (VC.v >= S.bar.s || VC.p >= S.bar.c ? '#15803d' : 'rgba(0,0,0,.7)') + '">Elin ' + VC.v + ' · ' + VC.p + ' çift</div>';
        h += rack2(S, me, ui, true);
        if(mine && !S.wait && !(S.phase === 'discard' && !S.op[me])) h += '<div class="msg" style="top:246px;font-size:12px;padding:3px 12px">' + (S.phase === 'draw' ? '👉 Taş çek ya da soldaki taşı al' : (S.must ? '⚠️ Yandan aldın — önce elini açmalısın' : (S.op[me] && !S.opNow ? '👉 Taşı perin üstüne bırak → işlenir · sonra at' : '👉 Taşı sağdaki kutuya at'))) + '</div>';
        return h; },
      drop:function(S, me, src, dst, ui){ return dropT(S, me, src, dst, ui, this); },
      click:function(S, me, x, ui){ var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(k === 't') return rackClick(S, me, ui, v);
        if(k === 'ss'){ RO.sl = arrange(S, S.h[me], 's'); ui.sel = null; return true; } if(k === 'sc'){ RO.sl = arrange(S, S.h[me], 'c'); ui.sel = null; return true; } if(k === 'sl') return slotClick(ui, v);
        if(S.turn !== me) return null;
        if(S.phase === 'draw'){ if(k === 'dk') return {dk:1}; if(k === 'dp'){ if(!S.op[me]){ var t = topDis(S, prev(me)), hh = S.h[me].concat([t]); if(bestOpen(S, hh).v < S.bar.s && pairList(S, hh).length < S.bar.c){ EG.toast('Yandan almak için o taşla elini açabilmelisin'); return null; } } return {dp:1}; } return null; }
        if(k === 'ops') return {op:'s'}; if(k === 'opc') return {op:'c'};
        if(k === 'ia') return {ia:1}; if(k === 'np') return {np:1};
        if(k === 'gap'){ var pr = String(x.getAttribute('data-v')).split(':'); if(ui.sel == null){ EG.toast('Önce ıstakadan bir taş seç'); return null; } if(!S.op[me] || S.opNow){ EG.toast(S.opNow ? 'Eli ilk açan, açtığı elde işleme yapamaz' : 'İşlemek için önce elini açmalısın'); return null; } if(!canAdd(S, S.tb[+pr[0]], ui.sel, pr[1])){ EG.toast('Bu taş buraya uymuyor'); return null; } return {is:ui.sel, g:+pr[0], sd:pr[1]}; }
        if(k === 'fin' && ui.sel != null){ if(S.op[me] && S.h[me].length === 1) return {t:ui.sel}; EG.toast('Elin henüz bitmiyor'); return null; }
        if(k === 'at' && ui.sel != null) return {t:ui.sel};
        if(k === 'g'){ if(ui.sel == null){ EG.toast('Önce rafından bir taş seç'); return null; } if(!S.op[me]){ EG.toast('İşlemek için önce elini açmalısın'); return null; } if(S.opNow){ EG.toast('Eli ilk açan, açtığı elde işleme yapamaz'); return null; } if(!canAdd(S, S.tb[v], ui.sel)){ if(swapIdx(S, S.tb[v], ui.sel) >= 0) return {sw:ui.sel, g:v}; EG.toast('Bu taş bu gruba uymuyor'); return null; } return {is:ui.sel, g:v}; }
        if(k === 'at' && ui.sel != null) return {t:ui.sel};
        return null; }
    });
    EG.__okey = {allGroups:allGroups, counts:counts, bestOpen:bestOpen, pairList:pairList, findWin:findWin};
  })();

  window.__EG_READY = true;
})();
