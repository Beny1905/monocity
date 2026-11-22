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
  EG.avatar = function(p){ if(!p || p.b) return ''; try{ return (window.monocityAvatarSrc && monocityAvatarSrc(p.u === uid() ? '__me' : p.u)) || window.MONOCITY_DEFAULT_AVATAR || ''; }catch(e){ return ''; } };
  /* koltuk kutusu: avatar + isim + bilgi */
  EG.seat = function(S, i, info, cls){ var p = S.pl[i] || {}, a = EG.avatar(p), turn = G && G.mod.turn && G.mod.turn(S) === i && !S.over;
    return '<div class="egSeat' + (turn ? ' on' : '') + (cls ? ' ' + cls : '') + '"><div class="av">' + (a ? '<img alt="" src="' + esc(a) + '">' : '<span>🤖</span>') + '</div><div class="tx"><b>' + esc(EG.name(S, i)) + (i === G.me ? ' (Sen)' : '') + '</b><small>' + (info || '') + '</small></div></div>'; };
  /* 4 kişilik yerleşim: ben altta, sıradaki sağda */
  EG.pos = function(S, i){ var n = S.n, d = (i - G.me + n) % n; if(n === 2) return d === 0 ? 'b' : 't'; if(n === 3) return ['b', 'r', 'l'][d]; return ['b', 'r', 't', 'l'][d]; };

  function topBar(){ var m = G.mod;
    return '<div class="top"><button type="button" class="bk" data-a="back">‹ ÇIK</button><span class="ttl">' + m.ic + ' ' + esc(m.name) + '</span>' + (m.sub ? '<span class="sub">' + m.sub(G.S) + '</span>' : '') + '<span class="sp"></span>' + vcHtml() + chBtn() + '</div>'; }
  function render(){ if(!G || !el) return; var h = topBar() + '<div class="tbl">' + G.mod.view(G.S, G.me, G.ui) + '</div>';
    var keep = stg().querySelectorAll(':scope > .ov'); stg().innerHTML = h; [].forEach.call(keep, function(o){ stg().appendChild(o); }); }
  EG.render = function(){ render(); };

  /* ---------- akış ---------- */
  function newState(seed){ var S = {n:G.pl.length, pl:G.pl, rs:seed | 0, gone:{}, log:'', over:null, o:G.o || {}}; G.mod.init(S, G.o || {}); return S; }
  function start(o){ stopAll(); open();
    G = {mod:EG.mods[o.k], k:o.k, pl:o.pl, me:o.me, online:!!o.code, code:o.code || null, o:o.o || {}, offs:[], ui:{}, dead:false, dc:{}, last:Date.now(), fromLb:!!o.fromLb};
    CH.open = false; CH.un = 0; chPanel();
    G.S = newState(o.seed || 1);
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
    if(a.t === 'n'){ g.S = newState(a.seed); [].forEach.call(stg().querySelectorAll('.ov'), function(o){ o.remove(); }); g.ui = {}; g.pend = false; render(); schedule(); return; }
    if(a.t === 'q'){ if(S.gone[a.by]) return; S.gone[a.by] = 1;
      if(a.by === g.me){ g.left = true; return; }
      var alive = 0; g.pl.forEach(function(p, i){ if(p && !p.b && !S.gone[i]) alive++; });
      toast('🚪 ' + seatName(a.by) + (a.rs ? ' teslim oldu' : ' oyundan çıktı') + (S.n > 2 && !S.over ? ' — yerine bot oynayacak' : ''));
      if(!S.over && (S.n === 2 || (g.mod.endOnQuit && g.mod.endOnQuit(S, a.by)))){ S.over = {w:[1 - a.by], txt:(a.rs ? 'Rakip teslim oldu' : 'Rakip oyundan çıktı')}; showEnd(); }
      render(); schedule(); return; }
    if(a.t === 'a'){ if(S.over) return; var ok = false; try{ ok = g.mod.act(S, a.by, a.a); }catch(e){ console.warn('EG act', e); }
      g.pend = false; if(!ok){ schedule(); return; } g.last = Date.now(); if(a.by === g.me) g.ui = {};
      render(); if(S.fx){ fx(S.fx); S.fx = null; } if(S.over){ showEnd(); return; } schedule(); }
  }
  EG.apply = apply;
  function fx(f){ if(f === 'win') sfx('win'); else if(f === 'hit') sfx('hit'); else sfx('tick'); }
  /* bot / süre: sadece kurucu (host) çalıştırır */
  function schedule(){ var g = G; if(!g) return; clearTimeout(g.botT); if(g.S.over || !amHost()) return;
    g.botT = setTimeout(function(){ if(G !== g || g.S.over || g.pend) return; var S = g.S;
      for(var i = 0; i < S.n; i++){ if(!isBot(i)) continue; var a = null; try{ a = g.mod.bot(S, i); }catch(e){ console.warn('EG bot', e); } if(a){ g.pend = true; send({t:'a', by:i, a:a}); if(!g.online) setTimeout(function(){ g.pend = false; }, 0); return; } }
    }, g.mod.botDelay ? g.mod.botDelay(g.S) : 750); }
  EG.schedule = function(){ schedule(); };
  /* süre dolunca (45 sn) kurucu, sırası gelen oyuncunun yerine oynar · tombala gibi oyunlarda tick */
  function hb(){ var g = G; if(!g) return; clearTimeout(g.tickT);
    g.tickT = setTimeout(function(){ if(G !== g) return; hb(); if(g.S.over || !amHost()) return;
      if(g.mod.tick){ var ta = g.mod.tick(g.S, Date.now()); if(ta && !g.pend){ g.pend = true; send({t:'a', by:g.me, a:ta}); if(!g.online) setTimeout(function(){ g.pend = false; }, 0); } }
      var t = g.mod.turn ? g.mod.turn(g.S) : -1; if(t >= 0 && !isBot(t) && g.online && Date.now() - g.last > 45000 && !g.pend){ var a = g.mod.bot(g.S, t); if(a){ g.pend = true; g.last = Date.now(); toast('⏰ ' + seatName(t) + ' için süre doldu'); send({t:'a', by:t, a:a}); } }
    }, 1000); }

  /* ---------- sonuç ---------- */
  function showEnd(){ var g = G, S = g.S, o = S.over; if(!o) return; [].forEach.call(stg().querySelectorAll('.ov'), function(x){ x.remove(); });
    var win = (o.w || []).indexOf(g.me) >= 0, h = o.html || '';
    var ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="bx"><h3>' + (o.draw ? '🤝 BERABERE' : (win ? '🏆 KAZANDIN!' : '😔 KAYBETTİN')) + '</h3>' + (o.txt ? '<p>' + esc(o.txt) + '</p>' : '') + h +
      '<div class="row">' + (amHost() ? '<button type="button" class="bt g" data-a="again">🔁 TEKRAR OYNA</button>' : '<button type="button" class="bt s" disabled>⏳ Kurucu yeni oyunu başlatabilir</button>') + '<button type="button" class="bt s" data-a="home">ÇIKIŞ</button></div></div>';
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
      if(a === 'again'){ if(!g || !amHost()) return; send({t:'n', seed:(Math.random() * 2147483647) | 0}); return; }
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
    DR = {s:s, k:s.getAttribute('data-drag'), v:s.getAttribute('data-v'), x0:e.clientX, y0:e.clientY, mv:false, gh:null}; }
  function onMove(e){ if(!DR) return; if(!DR.mv){ if(Math.abs(e.clientX - DR.x0) + Math.abs(e.clientY - DR.y0) < 10) return; DR.mv = true;
      var k = Math.min(innerWidth / 1000, innerHeight / 450), r = DR.s.getBoundingClientRect(), gh = document.createElement('div'); gh.className = 'egGh'; gh.innerHTML = DR.s.outerHTML;
      gh.style.width = (r.width / k) + 'px'; gh.style.height = (r.height / k) + 'px'; gh.style.transform = 'scale(' + (k * 1.08) + ')'; el.appendChild(gh); DR.gh = gh; DR.w = r.width; DR.h = r.height; DR.s.style.opacity = '.35'; }
    DR.gh.style.left = (e.clientX - DR.w / 2) + 'px'; DR.gh.style.top = (e.clientY - DR.h / 2) + 'px'; if(e.cancelable) e.preventDefault(); }
  function onUp(e){ if(!DR) return; var d = DR; DR = null; if(!d.mv) return; DRT = Date.now(); if(d.gh) d.gh.remove(); d.s.style.opacity = ''; var g = G; if(!g || g.S.over) return;
    var t = document.elementFromPoint(e.clientX, e.clientY), dst = null, n = t;
    while(n && n !== el && !dst){ dst = dkind(n); n = n.parentElement; }
    if(!dst){ var f = el.querySelector('.felt'); if(f){ var r = f.getBoundingClientRect(); if(e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) dst = {k:'at'}; } }
    if(!dst) return; var src = {k:d.k, v:d.v, el:d.s}, res = null;
    try{ if(g.mod.drop) res = g.mod.drop(g.S, g.me, src, dst, g.ui); else if(src.k === 'c' && dst.k === 'at') res = g.mod.click(g.S, g.me, d.s, g.ui); }catch(er){ console.warn('EG drop', er); }
    if(res === true){ render(); return; } if(res) EG.send(res); }
  function bindDrag(){ el.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove, {passive:false}); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', function(){ if(DR){ if(DR.gh) DR.gh.remove(); DR.s.style.opacity = ''; DR = null; } }); }

  /* ---------- sesli / yazılı sohbet ---------- */
  function vcHtml(){ if(!G || !G.online || !window.monocityVoice) return ''; var v = {}; try{ v = monocityVoice.state(); }catch(e){} return '<span class="vc"><button type="button" data-a="vsp" class="' + (v.sp ? 'on' : '') + '">' + (v.sp ? '🔊' : '🔇') + '</button><button type="button" data-a="vmic" class="' + (v.mic ? 'on' : '') + '">' + (v.mic ? '🎤' : '🎙️') + '</button></span>'; }
  var CH = {open:false, tab:'m', un:0, last:0};
  var CHQ = ['Bal akıyor 🍯', 'İyi oyun', 'Şanslısın', 'Acele et', 'Eline sağlık'];
  var CHE = ['😀', '😂', '😍', '😎', '😮', '😭', '😡', '👍', '👏', '🔥', '🍀', '🤝'];
  function chBtn(){ if(!G || !G.online) return ''; return '<button type="button" class="egChB" data-a="chat">💬' + (CH.un ? '<i>' + Math.min(CH.un, 9) + '</i>' : '') + '</button>'; }
  function chBadge(){ var b = el && el.querySelector('.egChB'); if(b) b.innerHTML = '💬' + (CH.un ? '<i>' + Math.min(CH.un, 9) + '</i>' : ''); }
  function chPanel(){ if(!el) return; var o = el.querySelector(':scope > .egCh');
    if(!CH.open || !G || !G.online){ if(o) o.remove(); return; }
    if(!o){ o = document.createElement('div'); o.className = 'egCh'; el.appendChild(o); }
    var h = '<div class="hd"><button type="button" data-a="chT" data-t="m" class="' + (CH.tab === 'm' ? 'on' : '') + '">💬 MESAJ</button><button type="button" data-a="chT" data-t="e" class="' + (CH.tab === 'e' ? 'on' : '') + '">😀 EMOJİ</button><button type="button" class="x" data-a="chX">✕</button></div>';
    if(CH.tab === 'm') h += '<div class="qk">' + CHQ.map(function(q, i){ return '<button type="button" data-a="chQ" data-i="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div><div class="in"><input class="egChI" maxlength="60" placeholder="Mesaj yaz..." autocomplete="off"><button type="button" data-a="chS">GÖNDER</button></div>';
    else h += '<div class="em">' + CHE.map(function(e2, i){ return '<button type="button" data-a="chE" data-i="' + i + '">' + e2 + '</button>'; }).join('') + '</div>';
    o.innerHTML = h; var inp = o.querySelector('.egChI'); if(inp) inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); chTyped(); } }); }
  function chSend(x){ if(!G || !G.online) return; var now = Date.now(); if(now - CH.last < 900){ toast('⏳ Biraz yavaş'); return; } CH.last = now;
    var a = {t:'ch', by:G.me, ts:now}; for(var k in x) a[k] = x[k]; send(a); CH.open = false; chPanel(); }
  function chTyped(){ var i = el && el.querySelector('.egChI'); if(!i) return; var v = String(i.value || '').replace(/\s+/g, ' ').trim().slice(0, 60); if(!v) return; try{ i.blur(); }catch(e){} chSend({x:v}); }
  function chRecv(a){ var g = G; if(!g || !el) return; if(a.ts && Date.now() - a.ts > 20000) return;
    var mine = a.by === g.me, nm = seatName(a.by);
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
      case 'tb': return '<div class="hb" style="width:54px;height:54px;left:18%;top:18%;background:#facc15"><span>27</span></div><div class="hb" style="width:62px;height:62px;left:44%;top:30%;background:#22c55e"><span>90</span></div><div class="hb" style="width:44px;height:44px;left:26%;top:56%;background:#3b82f6"><span>7</span></div>';
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
        if(a === 'g'){ var k = t.getAttribute('data-k'); HUB.el.classList.remove('show'); openGame(k); } }); }
    paintHub(); HUB.el.classList.add('show'); return true; };
  function paintHub(){ var on = friendsOn();
    var h = '<div class="hTop"><button type="button" class="hBk" data-h="x">‹ GERİ</button><span class="hIc">🎲</span><span class="hTt">EĞLENCE</span><span class="hOn"><i></i>' + on + ' arkadaş çevrimiçi</span></div>' +
      '<div class="hTabs">' + [['all', 'TÜMÜ'], ['masa', '🎲 MASA OYUNLARI'], ['kart', '🃏 KART OYUNLARI']].map(function(x){ return '<button type="button" data-h="tab" data-v="' + x[0] + '" class="' + (HUB.tab === x[0] ? 'a' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="hGr">';
    CARDS.forEach(function(c){ if(HUB.tab !== 'all' && c.cat !== HUB.tab) return; var ok = c.ok || EG.mods[c.k];
      h += '<div class="hC' + (ok ? '' : ' lk') + '" data-h="g" data-k="' + c.k + '" style="--g:' + c.c + '"><div class="pp">👤 ' + c.p + '</div>' + (ok ? '<div class="ok">OYNA</div>' : '') + '<div class="art">' + art(c.k) + '</div><div class="nm">' + c.n + '</div></div>'; });
    HUB.el.innerHTML = h + '</div>'; }
  function openGame(k){
    if(k === 'tavla'){ clearEg(function(){ if(window.monocityTavlaLobby) monocityTavlaLobby(); else if(window.monocityOpenTavla) monocityOpenTavla(); }); return; }
    if(k === 'ludo'){ clearEg(function(){ if(window.__mcOpenFun){ __mcOpenFun(); setTimeout(function(){ var c = document.querySelector('#f31Fun .gr .c.lu'); if(c) c.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); }, 30); } else if(window.monocityOpenLudo) monocityOpenLudo(); }); return; }
    if(!EG.mods[k]){ toast('🎉 Yakında geliyor!'); return; }
    egLobby(k); }
  window.__egHubBack = function(){ EG.hub(); };
  window.monocityEgHub = function(){ return EG.hub(); };

  /* ================= LOBİ ================= */
  var LB = {code:null, eg:null, egb:0, offs:[], lastGo:null, mxSent:null};
  function canOnline(){ var API = LAPI(); return !!(DB() && uid() && API && (!API.available || API.available())); }
  function clearEg(cb){ try{ var st = LAPI() && LAPI().state(); if(st && st.code && !st.entered && st.role === 'host' && DB()){ DB().ref('rooms/' + st.code + '/eg').remove(); DB().ref('rooms/' + st.code + '/meta/mx').remove(); } }catch(e){} cb && cb(); }
  function egLobby(k){ var m = EG.mods[k];
    if(!canOnline()){ EG.local(k, {}); return; }
    var API = LAPI(), st = API.state();
    var go = function(){ var code = API.state().code; if(!code) return; var R = function(p){ return DB().ref('rooms/' + code + '/' + p); };
      R('tv').remove().catch(function(){}); R('lu').remove().catch(function(){});
      R('egb').set(0).catch(function(){});
      R('eg').set({g:k, o:m.defOpt ? m.defOpt() : {}, ts:Date.now()}).catch(function(){});
      R('cfg').set({mod:'ozel', tur:'4', para:4, zar:1, ucr:0, thb:'tr'}).catch(function(){});
      if(k === 'tb') R('meta/mx').set(7).catch(function(){}); else R('meta/mx').remove().catch(function(){});
      LB.eg = {g:k, o:m.defOpt ? m.defOpt() : {}}; LB.code = null;
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
    var bar = l.querySelector(':scope > .egLbBar'); if(!on){ if(bar) bar.remove(); var t0 = l.querySelector('#egTbSeats'); if(t0) t0.remove(); [].forEach.call(l.querySelectorAll('.egBotB,.egBotC'), function(x){ x.remove(); }); return; }
    var m = EG.mods[k], c = l.querySelector('#mcLbSet .t'), want = NAMES[k] || m.name; if(c && c.textContent !== want) c.textContent = want;
    /* üst bilgi + seçenekler */
    if(!bar){ bar = document.createElement('div'); bar.className = 'egLbBar'; l.appendChild(bar); }
    var o = (LB.eg && LB.eg.o) || {}, hb = isHost(), oh = '';
    (m.opts || []).forEach(function(op){ oh += '<span class="op">' + op.v.map(function(v){ return '<button type="button" data-egop="' + op.k + '" data-v="' + v[0] + '" class="' + (String(o[op.k]) === String(v[0]) ? 'on' : '') + '"' + (hb ? '' : ' disabled') + '>' + v[1] + '</button>'; }).join('') + '</span>'; });
    var h = '<b>' + m.ic + ' ' + esc(want) + '</b><small>👤 ' + m.ptxt + (k === 'bj' ? '' : ' · Boş koltuğa 🤖 ile bot ekleyebilirsin') + '</small>' + oh;
    if(bar.__h !== h){ bar.__h = h; bar.innerHTML = h; }
    if(tb) return tbSeats(l);
    /* 4 kişilik: boş koltuklarda bot */
    var seats = l.querySelectorAll('#lbSeats .lbSeat'), nb = LB.egb, emp = 0;
    [].forEach.call(seats, function(se){ var e0 = se.classList.contains('empty'), bc = se.querySelector(':scope > .egBotC'), bb = se.querySelector(':scope > .egBotB');
      if(!e0){ if(bc) bc.remove(); if(bb) bb.remove(); return; }
      emp++; var isB = emp <= nb;
      if(isB){ if(bb) bb.remove(); if(!bc){ bc = document.createElement('div'); bc.className = 'egBotC'; se.appendChild(bc); } var hh = '<span>🤖</span><b>Bot ' + emp + '</b>' + (hb ? '<button type="button" data-egbot="-1">✕</button>' : ''); if(bc.__h !== hh){ bc.__h = hh; bc.innerHTML = hh; } }
      else { if(bc) bc.remove(); if(hb && emp === nb + 1){ if(!bb){ bb = document.createElement('button'); bb.type = 'button'; bb.className = 'egBotB'; bb.setAttribute('data-egbot', '1'); bb.textContent = '🤖 BOT EKLE'; se.appendChild(bb); } } else if(bb) bb.remove(); } });
  }
  setInterval(deco, 500);
  /* Tombala: 8 koltuk, afişsiz (çerçeve + profil + plakalı nick) */
  function tbSeats(l){ var host = l.querySelector('#lbSeats'); if(!host) return; var box = l.querySelector('#egTbSeats');
    if(!box){ box = document.createElement('div'); box.id = 'egTbSeats'; host.parentNode.insertBefore(box, host); }
    var st = LAPI().state(), mem = members(), nb = LB.egb, hb = isHost(), F = window.MONOCITY_FRAME_IMG || {}, PI = window.MONOCITY_PLATE_IMG || {}, SO = window.MONOCITY_SOCIAL, h = '';
    for(var i = 0; i < 8; i++){ var p = mem[i];
      if(p){ var d = (SO && SO.users && SO.users[p.u]) || {}, me = p.u === uid(); var cos = me && window.monocityMyCos ? (monocityMyCos() || {}) : (d.cos || {}); var fr = F[cos.frame || 'white'] || '', pl = cos.plate, pu = pl && pl !== 'white' ? PI[pl] : '';
        var av = EG.avatar({u:p.u}); h += '<div class="ts f">' + (i === 0 ? '<em>👑</em>' : '') + '<div class="av"><img class="a" alt="" src="' + esc(av) + '">' + (fr ? '<img class="fr" alt="" src="' + esc(fr) + '">' : '') + '</div>' + (pu ? '<div class="pn" data-noi18n="1" style="background-image:url(' + pu + ')">' + esc(p.n) + '</div>' : '<b data-noi18n="1">' + esc(p.n) + '</b>') + '</div>'; }
      else if(i - mem.length < nb){ h += '<div class="ts f bot"><div class="av"><span>🤖</span></div><b>Bot ' + (i - mem.length + 1) + '</b>' + (hb ? '<button type="button" data-egbot="-1">✕</button>' : '') + '</div>'; }
      else h += '<div class="ts e"><i>+</i><small>Davet et</small>' + (hb && i === mem.length + nb ? '<button type="button" class="bb" data-egbot="1">🤖</button>' : '') + '</div>'; }
    if(box.__h !== h){ box.__h = h; box.innerHTML = h; } }
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
  '#egG .felt{position:absolute;left:150px;top:30px;width:700px;height:260px;border-radius:130px;background:radial-gradient(ellipse at 50% 40%,#2d5a3f,#173a28 70%,#0f2a1c);border:8px solid #6b4423;box-shadow:inset 0 0 0 3px #d6aa5c,inset 0 10px 40px rgba(0,0,0,.5),0 12px 30px rgba(0,0,0,.6)}',
  '#egG .felt.nv{background:radial-gradient(ellipse at 50% 40%,#2b3d6e,#18254a 70%,#0e1733)}',
  '#egG [data-drag]{touch-action:none}#egG .egGh{position:fixed;left:0;top:0;z-index:40;pointer-events:none;transform-origin:0 0;filter:drop-shadow(0 10px 14px rgba(0,0,0,.6))}#egG .egGh>*{margin:0!important;transform:none!important}',
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
  '#egG .rack{position:absolute;left:20px;right:150px;bottom:4px;height:132px;border-radius:12px;background:linear-gradient(180deg,#6b4423,#4a2e15);border:2px solid #d6aa5c;box-shadow:0 8px 20px rgba(0,0,0,.6);padding:6px 8px;display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px 3px}',
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
  '#egHub .hC .pp{position:absolute;left:8px;top:8px;padding:3px 8px;border-radius:11px;background:rgba(0,0,0,.55);font:900 calc(1.9*var(--mcu,1vh)) Arial;z-index:2}',
  '#egHub .hC .ok{position:absolute;right:8px;top:8px;padding:3px 9px;border-radius:11px;background:linear-gradient(180deg,#4ade80,#16a34a);font:1000 calc(1.8*var(--mcu,1vh)) Arial;z-index:2;box-shadow:0 0 10px rgba(74,222,128,.6)}',
  '#egHub .hC.lk .art,#egHub .hC.lk .nm{filter:grayscale(.75) brightness(.6)}#egHub .hC.lk{border-color:rgba(160,160,170,.45)}',
  '#egHub .hC.lk::after{content:"🔒 YAKINDA";position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) rotate(-8deg);background:rgba(10,12,22,.85);border:1.5px solid #ffd36b;color:#ffd36b;font:1000 13px Arial;padding:5px 11px;border-radius:8px;white-space:nowrap}',
  '#egHub .hr{display:flex;gap:4px;align-items:center}#egHub .hr.fan .egC{margin:0 -10px}#egHub .hr.fan .egC:first-child{transform:rotate(-12deg)}#egHub .hr.fan .egC:last-child{transform:rotate(12deg)}',
  '#egHub .hb{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;font:1000 16px Arial;color:#111;box-shadow:inset -5px -6px 10px rgba(0,0,0,.35),0 4px 8px rgba(0,0,0,.4)}#egHub .hb span{background:#fff;border-radius:50%;width:56%;height:56%;display:flex;align-items:center;justify-content:center}',
  '#egHub .hn{position:absolute;top:8%;left:0;right:0;text-align:center;font:1000 28px Arial;color:#ffd36b;text-shadow:0 3px 0 #5a3a00}',
  /* lobi */
  'html body #mcLobby2.mcEgLb #mcLbSet span:nth-of-type(2),html body #mcLobby2.mcEgLb #mcLbSet span:nth-of-type(4),html body #mcLobby2.mcEgLb #mcLbSet span:nth-of-type(5),html body #mcLobby2.mcEgLb #mcLbSet .ks,html body #mcLobby2.mcEgLb #mcLbSet .ch,html body #mcLobby2.mcEgLb #t80Ch,html body #mcLobby2.mcEgLb #luLbB,html body #mcLobby2#mcLobby2.mcEgLb .mkEq,html body #mcLobby2#mcLobby2.mcEgLb #lbSeats .lbSeat.mkBn.mkBn.filled>.f12Lg{display:none!important}',
  'html body #mcLobby2.mcEgLb .lbSeat.empty>small:last-of-type{visibility:hidden}',
  '#mcLobby2 .egLbBar{position:absolute;left:50%;top:calc(9*var(--mcu,1vh));transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:10px;background:rgba(8,12,26,.82);border:1.5px solid rgba(214,170,92,.6);border-radius:14px;padding:5px 12px;font-family:Arial;color:#fff;white-space:nowrap}',
  '#mcLobby2 .egLbBar b{font:1000 15px Arial;color:#ffd36b}#mcLobby2 .egLbBar small{font:800 11px Arial;color:#c7d2fe}#mcLobby2 .egLbBar .op{display:flex;gap:4px}',
  '#mcLobby2 .egLbBar .op button{height:26px;padding:0 10px;border-radius:9px;border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font:900 11px Arial;cursor:pointer}#mcLobby2 .egLbBar .op button.on{background:linear-gradient(180deg,#ffe28a,#f0b429);color:#3a2600;border-color:#fff1b8}',
  '#mcLobby2 .lbSeat{position:relative}#mcLobby2 .egBotB{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);z-index:6;height:30px;padding:0 12px;border-radius:10px;border:1.5px solid #a5b4fc;background:linear-gradient(180deg,#6366f1,#3730a3);color:#fff;font:1000 12px Arial;cursor:pointer;white-space:nowrap}',
  '#mcLobby2 .egBotC{position:absolute;inset:0;z-index:6;border-radius:inherit;background:linear-gradient(180deg,#2b3566,#151b38);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#fff;font-family:Arial}',
  '#mcLobby2 .egBotC span{font-size:44px}#mcLobby2 .egBotC b{font:1000 15px Arial}#mcLobby2 .egBotC button{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;border:0;background:#b91c1c;color:#fff;font:900 13px Arial;cursor:pointer}',
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
  EG.hand = function(cards, play, sel, sz){ var n = cards.length, cls = n > 13 ? ' tight2' : (n > 9 ? ' tight' : '');
    return '<div class="hand' + cls + '">' + cards.map(function(c){ var ok = !play || play.indexOf(c) >= 0, s = sel && sel.indexOf(c) >= 0;
      return EG.card(c, (sz || '') + (s ? ' sel' : '') + (play ? (ok ? ' pl' : ' no') : ''), ' data-x="c" data-drag="c" data-v="' + c + '"'); }).join('') + '</div>'; };
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
      S.dealer = (S.dealer + 1) % S.n; S.log = '🔁 Yeni el · ' + S.sc.map(function(v, t){ return tname(S, t) + ' ' + v; }).join(' – '); newRound(S); }
    function tname(S, t){ if(S.n === 4) return t === team(S, EG.G().me) ? 'Biz' : 'Onlar'; return EG.name(S, t); }
    EG.reg({key:'pisti', name:'PİŞTİ', ic:'🃏', ptxt:'2 ya da 4 (eşli)', min:2, max:4, even:true,
      init:function(S){ S.sc = zeros(nt(S)); S.dealer = S.n - 1; S.rd = 0; newRound(S); },
      sub:function(S){ return 'Skor ' + S.sc.map(function(v, t){ return tname(S, t) + ' ' + v; }).join(' – ') + ' · 151'; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn || a.c == null) return false; var h = S.h[by], ix = h.indexOf(a.c); if(ix < 0) return false; h.splice(ix, 1);
        var c = a.c, top = S.fl.length ? S.fl[S.fl.length - 1] : null, t = team(S, by); S.seen[EG.cr(c)]++;
        if(top != null && (EG.cr(c) === EG.cr(top) || EG.cr(c) === 10)){ var pi = S.fl.length === 1 && EG.cr(c) === EG.cr(top);
          S.fl.push(c); S.cp[t].c += S.fl.length; S.fl.forEach(function(x){ S.cp[t].p += pts(x); }); S.fl = []; S.lastT = t;
          if(pi){ var v = EG.cr(c) === 10 ? 20 : 10; S.cp[t].p += v; S.cp[t].pi++; S.log = '🔥 ' + EG.name(S, by) + ' PİŞTİ yaptı! +' + v; S.fx = 'win'; } else { S.log = '🫴 ' + EG.name(S, by) + ' yerdekileri aldı'; S.fx = 'hit'; } }
        else { S.fl.push(c); S.log = ''; }
        S.turn = nextSeat(S, by);
        if(S.h.every(function(x){ return !x.length; })){ if(S.deck.length) deal(S); else endRound(S); }
        return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i]; if(!h.length) return null; var top = S.fl.length ? S.fl[S.fl.length - 1] : null;
        if(top != null){ var m = h.filter(function(c){ return EG.cr(c) === EG.cr(top); }); if(m.length) return {c:m[0]};
          var val = 0; S.fl.forEach(function(c){ val += pts(c); }); var j = h.filter(function(c){ return EG.cr(c) === 10; }); if(j.length && (S.fl.length >= 4 || val >= 2)) return {c:j[0]}; }
        var nj = h.filter(function(c){ return EG.cr(c) !== 10; }); if(!nj.length) return {c:h[0]};
        nj.sort(function(a, b){ return (S.seen[EG.cr(b)] - S.seen[EG.cr(a)]) || (pts(a) - pts(b)); }); return {c:nj[0]}; },
      view:function(S, me){ var h = '<div class="felt"></div>';
        h += EG.around(S, me, function(i){ var c = S.cp[team(S, i)]; return '🂠 ' + S.h[i].length + ' · alınan ' + c.c + (c.pi ? ' · 🔥' + c.pi : ''); }, function(i){ return S.h[i].length; });
        var fl = '', k = S.fl.slice(-4); k.forEach(function(c, j){ fl += EG.card(c, '', ' style="position:absolute;left:' + (j * 18) + 'px;top:' + (j * 3) + 'px;transform:rotate(' + ((j - 1.5) * 7) + 'deg)"'); });
        h += '<div style="position:absolute;left:440px;top:110px;width:130px;height:100px">' + fl + '</div>' + (S.fl.length ? '<div class="cnt" style="left:470px;top:208px">Yerde ' + S.fl.length + '</div>' : '<div class="cnt" style="left:450px;top:150px">Yer boş</div>');
        if(S.deck.length) h += '<div style="position:absolute;left:300px;top:118px">' + EG.back() + '</div><div class="cnt" style="left:300px;top:210px">Deste ' + S.deck.length + '</div>';
        if(S.log) h += '<div class="msg">' + S.log + '</div>';
        var my = sortHand(S.h[me]);
        h += EG.hand(my, S.turn === me ? my : [], null);
        h += '<div class="msg" style="top:auto;bottom:122px">' + (S.turn === me ? '👉 Senin sıran — bir kart at' : '⏳ ' + EG.esc(EG.name(S, S.turn)) + ' oynuyor') + '</div>';
        return h; },
      click:function(S, me, x){ if(x.getAttribute('data-x') !== 'c' || S.turn !== me) return null; return {c:+x.getAttribute('data-v')}; }
    });
  })();

  /* ================= BATAK + KOZ MAÇA (ortak motor) ================= */
  (function(){
    function rv(c){ return (EG.cr(c) + 12) % 13; }
    var TRXY = {b:'left:470px;top:190px', t:'left:470px;top:70px', l:'left:380px;top:128px', r:'left:560px;top:128px'};
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
      S.log = '🔁 ' + S.hn + '. el bitti · ' + S.sc.map(function(v, i){ return EG.name(S, i).replace('🤖 ', '') + ' ' + v; }).join(' · '); S.dealer = (S.dealer + 1) % 4; newHand(S); }
    function est(h){ var by = [[], [], [], []]; h.forEach(function(c){ by[EG.cs(c)].push(rv(c)); }); var e = 0, best = -1, bl = -1;
      by.forEach(function(a, s){ a.sort(function(x, y){ return y - x; }); if(a.indexOf(12) >= 0) e += 1; if(a.indexOf(11) >= 0) e += a.length >= 2 ? 0.8 : 0.3; if(a.indexOf(10) >= 0) e += a.length >= 3 ? 0.45 : 0.1;
        var sc = a.length * 2 + a.filter(function(v){ return v >= 9; }).length; if(sc > bl){ bl = sc; best = s; } });
      e += Math.max(0, by[best].length - 3) * 0.85; return {e:e, s:best}; }
    function mk(kind){
      EG.reg({key:kind, name:kind === 'koz' ? 'KOZ MAÇA' : 'BATAK', ic:kind === 'koz' ? '♠' : '🃏', ptxt:'4 kişi', min:4, max:4, fixed:4,
        init:function(S){ S.kind = kind; S.sc = [0, 0, 0, 0]; S.hn = 0; S.hmax = 5; S.dealer = 3; newHand(S); },
        sub:function(S){ return 'El ' + S.hn + '/' + S.hmax + (S.tr >= 0 ? ' · Koz ' + EG.SU[S.tr] : '') + (S.kind === 'batak' && S.bidBy >= 0 ? ' · İhale ' + EG.esc(EG.name(S, S.bidBy)).replace('🤖 ', '') + ' ' + S.bid : ''); },
        turn:function(S){ return S.turn; },
        act:function(S, by, a){ if(by !== S.turn) return false;
          if(S.phase === 'bid'){ if(a.b == null) return false; var allPass = S.nbid === 3 && S.hb === 0;
            if(a.b === -1){ if(allPass) return false; S.bids[by] = -1; } else { if(a.b < 4 || a.b > 13 || a.b <= S.hb) return false; S.bids[by] = a.b; S.hb = a.b; S.bidBy = by; }
            S.nbid++; S.log = EG.name(S, by) + (a.b === -1 ? ' pas dedi' : ' ' + a.b + ' dedi');
            if(S.nbid >= 4){ S.bid = S.hb; S.phase = 'trump'; S.turn = S.bidBy; S.log = '🏷️ İhale ' + EG.name(S, S.bidBy) + ' · ' + S.bid; } else S.turn = (by + 1) % 4; return true; }
          if(S.phase === 'trump'){ if(a.s == null || a.s < 0 || a.s > 3) return false; S.tr = a.s; S.phase = 'play'; S.turn = S.bidBy; S.lead = S.bidBy; S.log = EG.name(S, by) + ' kozu seçti: ' + EG.SU[a.s]; return true; }
          if(S.phase !== 'play' || a.c == null) return false; if(legal(S, by).indexOf(a.c) < 0) return false;
          S.h[by].splice(S.h[by].indexOf(a.c), 1); if(EG.cs(a.c) === S.tr) S.broken = true; S.trick.push({s:by, c:a.c}); S.log = '';
          if(S.trick.length < 4){ S.turn = (by + 1) % 4; return true; }
          var w = winner(S).s; S.tk[w]++; S.last = S.trick; S.trick = []; S.turn = w; S.lead = w; S.log = '🫴 Eli ' + EG.name(S, w) + ' aldı'; S.fx = 'hit';
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
        view:function(S, me, ui){ var h = '<div class="felt nv"></div>';
          h += EG.around(S, me, function(i){ var t = ''; if(S.phase === 'bid' && S.bids){ var b = S.bids[i]; t = b == null ? '…' : (b === -1 ? 'Pas' : 'İhale ' + b); } else t = (i === S.bidBy ? '🏷️ ' + S.bid + ' · ' : '') + 'Aldı ' + S.tk[i]; return t + ' · Puan ' + S.sc[i]; }, function(i){ return S.h[i].length; });
          var tr = S.trick.length ? S.trick : (S.last || []); tr.forEach(function(t){ h += EG.card(t.c, S.trick.length ? '' : ' sm', ' style="position:absolute;' + TRXY[EG.pos(S, t.s)] + (S.trick.length ? '' : ';opacity:.55') + '"'); });
          if(S.log) h += '<div class="msg">' + S.log + '</div>';
          var my = EG.sortHand(S.h[me], S.tr >= 0 ? [(S.tr + 1) % 4, (S.tr + 2) % 4, (S.tr + 3) % 4, S.tr] : null), mine = S.turn === me && S.phase === 'play';
          h += EG.hand(my, mine ? legal(S, me) : [], null);
          if(S.turn === me && S.phase === 'bid'){ var allPass = S.nbid === 3 && S.hb === 0, bb = ''; for(var v = Math.max(4, S.hb + 1); v <= 13; v++) bb += '<button type="button" data-x="bid" data-v="' + v + '">' + v + '</button>';
            h += '<div class="pick"><p>İhale ver' + (S.hb ? ' (en yüksek: ' + S.hb + ')' : '') + '</p><div class="r">' + bb + (allPass ? '' : '<button type="button" data-x="bid" data-v="-1" style="min-width:70px">PAS</button>') + '</div>' + (allPass ? '<p style="font-size:12px;color:#ffb35c">Herkes pas dedi — en az 4 demek zorundasın</p>' : '') + '</div>'; }
          else if(S.turn === me && S.phase === 'trump') h += '<div class="pick"><p>Kozu seç</p><div class="r">' + [0, 1, 2, 3].map(function(s){ return '<button type="button" data-x="tr" data-v="' + s + '" class="' + (s === 1 || s === 2 ? 'rd' : '') + '" style="font-size:26px;min-width:60px;height:52px">' + EG.SU[s] + '</button>'; }).join('') + '</div></div>';
          else h += '<div class="msg" style="top:auto;bottom:122px">' + (S.turn === me ? '👉 Senin sıran' + (S.phase === 'play' ? ' — kart at' : '') : '⏳ ' + EG.esc(EG.name(S, S.turn)) + (S.phase === 'bid' ? ' ihale düşünüyor' : (S.phase === 'trump' ? ' kozu seçiyor' : ' oynuyor'))) + '</div>';
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
      sub:function(S){ return 'Yön ' + (S.dir === 1 ? '↻' : '↺') + ' · Deste ' + S.deck.length; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn) return false; var nm = EG.name(S, by);
        if(a.d){ if(S.drew && !S.pen) return false; if(S.pen){ draw(S, by, S.pen); S.log = '😱 ' + nm + ' ' + S.pen + ' kart çekti'; S.pen = 0; S.drew = false; S.turn = nx(S, by); S.fx = 'hit'; return true; }
          draw(S, by, 1); S.drew = true; S.log = nm + ' kart çekti'; return true; }
        if(a.p){ if(!S.drew) return false; S.drew = false; S.turn = nx(S, by); S.log = nm + ' pas geçti'; return true; }
        if(a.c == null || playable(S, by).indexOf(a.c) < 0) return false;
        S.h[by].splice(S.h[by].indexOf(a.c), 1); S.pile.push(a.c); S.drew = false; var r = EG.cr(a.c), skip = 1; S.suit = EG.cs(a.c); S.log = '';
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
      view:function(S, me, ui){ var h = '<div class="felt"></div>';
        h += EG.around(S, me, function(i){ return '🂠 ' + S.h[i].length + (S.h[i].length === 1 ? ' · ☝️ TEK!' : ''); }, function(i){ return S.h[i].length; });
        h += '<div style="position:absolute;left:470px;top:110px">' + EG.card(top(S)) + '</div>';
        if(EG.cr(top(S)) === 10 || S.suit !== EG.cs(top(S))) h += '<div class="cnt" style="left:470px;top:204px;font-size:15px">İstenen: <span style="color:' + (S.suit === 1 || S.suit === 2 ? '#ff6b81' : '#fff') + '">' + EG.SU[S.suit] + '</span></div>';
        if(S.pen) h += '<div class="cnt" style="left:560px;top:130px;background:#b91c1c;font-size:15px">+' + S.pen + ' ÇEK</div>';
        h += '<div style="position:absolute;left:350px;top:110px;cursor:pointer" data-x="d">' + EG.back() + '</div><div class="cnt" style="left:352px;top:204px">Deste ' + S.deck.length + '</div>';
        if(S.log) h += '<div class="msg">' + S.log + '</div>';
        var my = EG.sortHand(S.h[me]), mine = S.turn === me, P = mine ? playable(S, me) : [];
        h += EG.hand(my, mine ? P : [], null);
        if(mine){ h += '<div class="act">' + (S.pen ? '<button type="button" class="bt r" data-x="d">' + S.pen + ' KART ÇEK</button>' : (S.drew ? '<button type="button" class="bt s" data-x="p">PAS</button>' : '<button type="button" class="bt" data-x="d">🂠 KART ÇEK</button>')) + '</div>';
          h += '<div class="msg" style="top:auto;bottom:122px">👉 Senin sıran' + (S.pen ? ' — 7 at ya da ' + S.pen + ' kart çek' : (P.length ? ' — uygun kartı at' : ' — uygun kart yok, çek')) + '</div>'; }
        else h += '<div class="msg" style="top:auto;bottom:122px">⏳ ' + EG.esc(EG.name(S, S.turn)) + ' oynuyor</div>';
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
        if(m.length){ my.splice(my.indexOf(m[0]), 1); S.log = '✨ ' + EG.name(S, by) + ' ' + EG.RK[EG.cr(c)] + ' çiftini attı'; S.fx = 'hit'; } else { my.push(c); S.log = EG.name(S, by) + ' ' + EG.name(S, t) + '\'den kart çekti'; }
        S.h[by] = EG.shuffle(S, my); S.h[t] = EG.shuffle(S, th);
        [by, t].forEach(function(i){ if(!S.h[i].length && S.done.indexOf(i) < 0){ S.done.push(i); S.log += ' · 🎉 ' + EG.name(S, i) + ' kurtuldu'; } });
        if(checkEnd(S)) return true; S.turn = S.h[t].length ? t : nextActive(S, t); return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var t = nextActive(S, i); if(t < 0) return null; return {k:Math.floor(Math.random() * S.h[t].length)}; },
      view:function(S, me){ var h = '<div class="felt"></div>', tgt = S.turn === me ? nextActive(S, me) : -1;
        h += EG.around(S, me, function(i){ return S.h[i].length ? '🂠 ' + S.h[i].length : '🎉 Kurtuldu'; }, function(i){ return i === tgt ? 0 : S.h[i].length; });
        if(tgt >= 0){ var bb = ''; for(var k = 0; k < S.h[tgt].length; k++) bb += EG.back('sm', ' data-x="k" data-v="' + k + '" style="cursor:pointer;margin:0 -8px"');
          h += '<div style="position:absolute;left:150px;right:150px;top:105px;display:flex;justify-content:center;flex-wrap:wrap;gap:6px 0">' + bb + '</div><div class="msg" style="top:200px">👉 ' + EG.esc(EG.name(S, tgt)) + '\'in elinden bir kart seç</div>'; }
        else if(S.log) h += '<div class="msg">' + S.log + '</div>';
        h += EG.hand(EG.sortHand(S.h[me]), null, null);
        if(S.turn !== me) h += '<div class="msg" style="top:auto;bottom:122px">⏳ ' + EG.esc(EG.name(S, S.turn)) + ' kart çekiyor</div>';
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
      sub:function(S){ return 'Yerde ' + S.pile.length + ' kart'; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn) return false;
        if(S.phase === 'play'){ var cs = a.cs; if(!cs || !cs.length || cs.length > 4 || a.r == null || a.r < 0 || a.r > 12) return false; var h = S.h[by];
          for(var i = 0; i < cs.length; i++) if(h.indexOf(cs[i]) < 0 || cs.indexOf(cs[i]) !== i) return false;
          cs.forEach(function(c){ h.splice(h.indexOf(c), 1); S.pile.push(c); }); S.lp = {by:by, cs:cs.slice(), r:a.r, n:cs.length}; S.rev = null;
          S.phase = 'resp'; S.turn = (by + 1) % 4; S.log = '🗣️ ' + EG.name(S, by) + ': "' + decl(S.lp) + '"'; return true; }
        if(a.g){ var lp = S.lp; if(!S.h[lp.by].length){ S.over = {w:[lp.by], txt:EG.name(S, lp.by) + ' elini bitirdi'}; return true; } S.phase = 'play'; S.log = EG.name(S, by) + ' geçti'; return true; }
        if(a.b){ var L = S.lp, ok = L.cs.every(function(c){ return EG.cr(c) === L.r; }), taker = ok ? by : L.by;
          S.h[taker] = S.h[taker].concat(S.pile); S.pile = []; S.rev = {cs:L.cs, ok:ok};
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
      view:function(S, me, ui){ var h = '<div class="felt nv"></div>';
        h += EG.around(S, me, function(i){ return '🂠 ' + S.h[i].length + (S.h[i].length <= 2 ? ' · ⚠️' : ''); }, function(i){ return S.h[i].length; });
        var pb = ''; for(var k = 0; k < Math.min(S.pile.length, 8); k++) pb += EG.back('sm', ' style="position:absolute;left:' + (k * 6) + 'px;top:' + (k * 2) + 'px;transform:rotate(' + ((k % 3 - 1) * 9) + 'deg)"');
        h += '<div style="position:absolute;left:440px;top:105px;width:110px;height:90px">' + pb + '</div><div class="cnt" style="left:450px;top:182px">Yerde ' + S.pile.length + '</div>';
        if(S.rev){ h += '<div style="position:absolute;left:360px;top:208px;display:flex;gap:4px;align-items:center">' + S.rev.cs.map(function(c){ return EG.card(c, 'xs'); }).join('') + '<b style="font:1000 18px Arial;margin-left:6px">' + (S.rev.ok ? '✅ DOĞRU' : '❌ BLÖF') + '</b></div>'; }
        if(S.log) h += '<div class="msg">' + S.log + '</div>';
        var my = EG.sortHand(S.h[me]), mine = S.turn === me, sel = ui.sel || [];
        if(mine && S.phase === 'play'){ h += EG.hand(my, my, sel);
          h += '<div class="pick" style="top:auto;bottom:118px;transform:translateX(-50%);padding:8px 12px"><p>' + (sel.length ? sel.length + ' kart seçtin — ne diyorsun?' : 'Önce elinden 1–4 kart seç') + '</p><div class="r">' + RN.map(function(n, r){ return '<button type="button" data-x="r" data-v="' + r + '" class="' + (ui.r === r ? 'on' : '') + '" style="min-width:38px;height:34px;font-size:14px">' + n + '</button>'; }).join('') + '</div></div>';
          h += '<div class="act"><button type="button" class="bt g" data-x="at"' + (sel.length && ui.r != null ? '' : ' disabled') + '>AT ›</button></div>'; }
        else { h += EG.hand(my, null, null);
          if(mine && S.phase === 'resp') h += '<div class="act"><button type="button" class="bt r" data-x="b">🚨 BLÖF!</button><button type="button" class="bt s" data-x="g">GEÇ</button></div><div class="msg" style="top:auto;bottom:122px">👉 ' + EG.esc(EG.name(S, S.lp.by)) + ' "' + decl(S.lp) + '" dedi. İnanıyor musun?</div>';
          else h += '<div class="msg" style="top:auto;bottom:122px">⏳ ' + EG.esc(EG.name(S, S.turn)) + (S.phase === 'resp' ? ' karar veriyor' : ' kart atıyor') + '</div>'; }
        return h; },
      click:function(S, me, x, ui){ if(S.turn !== me) return null; var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(S.phase === 'resp'){ if(k === 'b') return {b:1}; if(k === 'g') return {g:1}; return null; }
        if(k === 'c'){ ui.sel = ui.sel || []; var i = ui.sel.indexOf(v); if(i >= 0) ui.sel.splice(i, 1); else if(ui.sel.length < 4) ui.sel.push(v); else EG.toast('En fazla 4 kart'); return true; }
        if(k === 'r'){ ui.r = v; return true; }
        if(k === 'at' && ui.sel && ui.sel.length && ui.r != null) return {cs:ui.sel.slice(), r:ui.r};
        return null; }
    });
  })();

  /* ================= 21 (kasaya karşı) ================= */
  (function(){
    function val(cs){ var t = 0, a = 0; cs.forEach(function(c){ var r = EG.cr(c); if(r === 0){ a++; t += 11; } else t += Math.min(10, r + 1); }); while(t > 21 && a){ t -= 10; a--; } return {t:t, soft:a > 0}; }
    function isBJ(cs){ return cs.length === 2 && val(cs).t === 21; }
    function deal(S){ S.deck = EG.shuffle(S, EG.range(52)); S.ph = []; S.st = []; S.res = []; for(var i = 0; i < S.n; i++){ S.ph.push([S.deck.pop(), S.deck.pop()]); S.st.push(isBJ(S.ph[i]) ? 'bj' : 'play'); S.res.push(null); }
      S.dh = [S.deck.pop(), S.deck.pop()]; S.phase = 'play'; S.rn++; S.log = ''; S.resAt = 0; if(S.gone) for(var g in S.gone) if(S.gone[g]) S.st[g] = 'out'; fin(S); }
    function cur(S){ for(var i = 0; i < S.n; i++) if(S.st[i] === 'play') return i; return -1; }
    function fin(S){ if(cur(S) >= 0) return; var dv = val(S.dh), live = S.st.some(function(s){ return s === 'stand' || s === 'bj'; });
      if(live) while(dv.t < 17){ S.dh.push(S.deck.pop()); dv = val(S.dh); }
      var dbj = isBJ(S.dh);
      for(var i = 0; i < S.n; i++){ var s = S.st[i], pv = val(S.ph[i]).t, r;
        if(s === 'out') r = null; else if(s === 'bust') r = 'l'; else if(s === 'bj') r = dbj ? 'p' : 'w'; else if(dbj) r = 'l'; else if(dv.t > 21) r = 'w'; else r = pv > dv.t ? 'w' : (pv === dv.t ? 'p' : 'l');
        S.res[i] = r; if(r === 'w') S.wn[i]++; else if(r === 'l') S.ls[i]++; }
      S.phase = 'res'; S.resAt = Date.now(); var me = EG.G() ? EG.G().me : 0, rr = S.res[me];
      S.log = 'Kasa ' + (dv.t > 21 ? 'patladı (' + dv.t + ')' : dv.t) + ' · ' + (rr === 'w' ? '🏆 Kazandın!' : (rr === 'p' ? '🤝 Berabere' : '😔 Kaybettin')); S.fx = rr === 'w' ? 'win' : 'tick'; }
    var RES = {w:'🏆 Kazandı', l:'😔 Kaybetti', p:'🤝 Berabere'};
    EG.reg({key:'bj', name:'21', ic:'🂡', ptxt:'1–4 kişi + kasa', min:1, max:4, askQuit:false,
      init:function(S){ S.wn = EG.zeros(S.n); S.ls = EG.zeros(S.n); S.rn = 0; deal(S); },
      sub:function(S){ return 'El ' + S.rn + ' · Kasa 17\'de durur'; },
      turn:function(S){ return S.phase === 'play' ? cur(S) : -1; },
      tick:function(S, now){ if(S.phase === 'res' && S.resAt && now - S.resAt > 4500) return {nx:1}; return null; },
      act:function(S, by, a){
        if(a.nx){ if(S.phase !== 'res') return false; deal(S); return true; }
        if(S.phase !== 'play' || cur(S) !== by) return false;
        if(a.h){ S.ph[by].push(S.deck.pop()); var v = val(S.ph[by]).t; if(v > 21){ S.st[by] = 'bust'; S.log = '💥 ' + EG.name(S, by) + ' patladı (' + v + ')'; S.fx = 'hit'; } else if(v === 21) S.st[by] = 'stand'; fin(S); return true; }
        if(a.s){ S.st[by] = 'stand'; fin(S); return true; }
        return false; },
      bot:function(S, i){ if(S.phase !== 'play' || cur(S) !== i) return null; var v = val(S.ph[i]); return (v.t < 17 || (v.soft && v.t < 18)) ? {h:1} : {s:1}; },
      view:function(S, me){ var h = '<div class="felt"></div>', XY = {t:'left:420px;top:4px', l:'left:16px;top:186px', r:'right:16px;top:186px'};
        h += EG.around(S, me, function(i){ var v = val(S.ph[i]).t; return (S.st[i] === 'out' ? 'Çıktı' : (S.res[i] ? RES[S.res[i]] : (S.st[i] === 'bust' ? '💥 ' + v : v))) + ' · 🏆' + S.wn[i]; }, null, function(i, p){ return '<div style="position:absolute;' + XY[p] + ';display:flex;gap:2px">' + S.ph[i].map(function(c){ return EG.card(c, 'xs'); }).join('') + '</div>'; });
        var hid = S.phase === 'play', dv = val(S.dh).t;
        h += '<div style="position:absolute;left:400px;top:62px;display:flex;gap:4px;align-items:center"><b style="font:1000 14px Arial;color:#ffd36b;margin-right:6px">KASA</b>' + S.dh.map(function(c, j){ return j === 1 && hid ? EG.back('sm') : EG.card(c, 'sm'); }).join('') + (hid ? '' : '<span class="cnt" style="position:static;margin-left:6px">' + dv + '</span>') + '</div>';
        if(S.log) h += '<div class="msg" style="top:150px">' + S.log + '</div>';
        var mv = val(S.ph[me]).t;
        h += '<div class="hand" style="gap:6px">' + S.ph[me].map(function(c){ return EG.card(c, '', ' style="margin:0"'); }).join('') + '</div>';
        h += '<div class="cnt" style="left:470px;bottom:120px;top:auto;font-size:16px">' + mv + (S.st[me] === 'bj' ? ' · BLACKJACK!' : '') + '</div>';
        if(S.phase === 'play' && cur(S) === me) h += '<div class="act"><button type="button" class="bt g" data-x="h">🂠 KART ÇEK</button><button type="button" class="bt" data-x="s">✋ DUR</button></div>';
        else if(S.phase === 'play') h += '<div class="msg" style="top:auto;bottom:150px">⏳ ' + EG.esc(EG.name(S, cur(S))) + ' düşünüyor</div>';
        else h += '<div class="msg" style="top:auto;bottom:150px">⏳ Yeni el birazdan…</div>';
        return h; },
      click:function(S, me, x){ var k = x.getAttribute('data-x'); if(k === 'h') return {h:1}; if(k === 's') return {s:1}; return null; }
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
    EG.reg({key:'tb', name:'TOMBALA', ic:'🎱', ptxt:'2–8 kişi', min:2, max:8,
      init:function(S){ S.cd = []; for(var i = 0; i < S.n; i++) S.cd.push(card(S)); S.ord = EG.shuffle(S, EG.range(90).map(function(x){ return x + 1; })); S.di = 0; S.dn = {}; S.c1 = -1; S.c2 = -1; S.tb = -1; S.lastD = Date.now() + 1500; S.key = S.rs + ':' + S.n; },
      sub:function(S){ return 'Çekilen ' + S.di + '/90'; },
      turn:function(){ return -1; },
      tick:function(S, now){ if(S.di < 90 && now - S.lastD > 4000) return {d:1}; return null; },
      act:function(S, by, a){
        if(a.d){ if(S.di >= 90) return false; var v = S.ord[S.di++]; S.dn[v] = 1; S.last = v; S.lastD = Date.now(); S.fx = 'tick'; if(AUTO && MK.key === S.key) MK.m[v] = 1;
          if(S.di >= 90 && S.tb < 0){ S.over = {w:[], draw:true, txt:'Sayılar bitti'}; } return true; }
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
    var RO = {key:null, ord:[]};
    function rackOrder(S, me){ var k = S.rs0 + ':' + S.hn + ':' + me; if(RO.key !== k){ RO.key = k; RO.ord = []; } var h = S.h[me], o = RO.ord.filter(function(t){ return h.indexOf(t) >= 0; }); h.forEach(function(t){ if(o.indexOf(t) < 0) o.push(t); }); RO.ord = o; return o; }
    function sortSeri(S, h){ return h.slice().sort(function(a, b){ var ja = isJ(S, a), jb = isJ(S, b); if(ja !== jb) return ja ? 1 : -1; var fa = face(S, a), fb = face(S, b); return fa[0] - fb[0] || fa[1] - fb[1]; }); }
    function sortCift(S, h){ return h.slice().sort(function(a, b){ var ja = isJ(S, a), jb = isJ(S, b); if(ja !== jb) return ja ? 1 : -1; var fa = face(S, a), fb = face(S, b); return fa[1] - fb[1] || fa[0] - fb[0]; }); }
    function rackHtml(S, me, ui, mark){ var o = rackOrder(S, me), h = '<div class="rack" data-drop="rack">'; o.forEach(function(t){ h += EG.tile(t, (ui.sel === t ? 'sel' : '') + (mark && mark(t) ? ' ok' : ''), ' data-x="t" data-drag="t" data-v="' + t + '"', S.ok); }); return h + '</div>'; }
    function rackClick(S, me, ui, v){ if(ui.sel == null){ ui.sel = v; return true; } if(ui.sel === v){ ui.sel = null; return true; }
      var o = RO.ord, a = o.indexOf(ui.sel), b = o.indexOf(v); if(a >= 0 && b >= 0){ o.splice(a, 1); o.splice(b, 0, ui.sel); } ui.sel = null; return true; }
    function center(S){ return '<div style="position:absolute;left:400px;top:70px;display:flex;gap:16px;align-items:flex-start">' +
      '<div style="text-align:center" data-x="dk" data-drag="dk">' + EG.tback() + '<div class="cnt" style="position:static;margin-top:4px">' + S.deck.length + '</div></div>' +
      '<div style="text-align:center">' + EG.tile(S.gost, 'sm') + '<div class="cnt" style="position:static;margin-top:4px">Gösterge</div></div>' +
      '<div style="text-align:center">' + (S.ok ? '<div class="egT sm ' + ['r', 'y', 'g', 'b'][S.ok[0]] + ' ok"><b>' + S.ok[1] + '</b><i></i></div>' : '') + '<div class="cnt" style="position:static;margin-top:4px">Okey</div></div></div>'; }
    var DXY = {b:'left:770px;top:200px', r:'right:20px;top:60px', t:'left:640px;top:4px', l:'left:20px;top:60px'};
    function disHtml(S, me){ var h = ''; for(var i = 0; i < 4; i++){ var t = topDis(S, i); if(t == null) continue; var take = S.turn === me && S.phase === 'draw' && i === prev(me);
        h += '<div style="position:absolute;' + DXY[EG.pos(S, i)] + ';' + (take ? 'filter:drop-shadow(0 0 8px #4ade80);cursor:pointer' : '') + '"' + (take ? ' data-x="dp" data-drag="dp"' : '') + '>' + EG.tile(t, 'sm', '', S.ok) + '</div>'; } return h; }

    function moveTo(v, before){ var o = RO.ord, a = o.indexOf(v); if(a < 0) return; o.splice(a, 1); var b = before == null ? -1 : o.indexOf(before); if(b < 0) o.push(v); else o.splice(b, 0, v); }
    function dropT(S, me, src, dst, ui, mod){ var v = src.v != null ? +src.v : null;
      if(src.k === 'dk' || src.k === 'dp'){ if((dst.k === 'rack' || dst.k === 'tile') && S.turn === me && S.phase === 'draw') return mod.click(S, me, src.el, ui); return null; }
      if(src.k !== 't') return null;
      if(dst.k === 'tile'){ if(+dst.v !== v) moveTo(v, +dst.v); ui.sel = null; return true; }
      if(dst.k === 'rack'){ moveTo(v, null); ui.sel = null; return true; }
      if(dst.k === 'at'){ if(S.turn !== me || S.phase !== 'discard') return null; if(mod.key === 'okey' && winWith(S, S.h[me], v)) return {f:v}; if(S.must){ EG.toast('Önce elini açmalısın'); return null; } return {t:v}; }
      if(dst.k === 'g'){ ui.sel = v; var f = document.createElement('i'); f.setAttribute('data-x', 'g'); f.setAttribute('data-v', dst.v); return mod.click(S, me, f, ui); }
      return null; }
    /* ---------------- OKEY ---------------- */
    function endHand(S, w, how){ if(w >= 0) S.sc[w] += how === 'c' ? 2 : 1;
      var rows = ''; for(var i = 0; i < 4; i++) rows += '<tr><td>' + EG.esc(EG.name(S, i)) + '</td><td><b>' + S.sc[i] + '</b></td></tr>';
      S.sum = '<table><tr><th></th><th>Puan</th></tr>' + rows + '</table>';
      if(S.hn >= S.hmax){ var mx = Math.max.apply(null, S.sc), W = []; S.sc.forEach(function(v, i){ if(v === mx) W.push(i); }); S.over = {w:W, txt:S.hmax + ' el bitti' + (w >= 0 ? ' · son eli ' + EG.name(S, w) + ' bitirdi' : ''), html:S.sum}; return; }
      S.dealer = (S.dealer + 1) % 4; deal(S, 14); S.log = w >= 0 ? '🎉 ' + EG.name(S, w) + ' eli bitirdi' + (how === 'c' ? ' (çiftten +2)' : ' (+1)') : '🤝 Deste bitti, el berabere'; S.fx = 'win'; }
    EG.reg({key:'okey', name:'OKEY', ic:'🀄', ptxt:'4 kişi', min:4, max:4, fixed:4,
      init:function(S){ S.sc = [0, 0, 0, 0]; S.hn = 0; S.hmax = 5; S.dealer = 3; S.rs0 = S.rs; deal(S, 14); },
      sub:function(S){ return 'El ' + S.hn + '/' + S.hmax + ' · Deste ' + S.deck.length; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn) return false; var h = S.h[by];
        if(S.phase === 'draw'){ if(a.dk){ if(!S.deck.length){ endHand(S, -1); return true; } h.push(S.deck.pop()); S.phase = 'discard'; return true; }
          if(a.dp){ var p = S.dis[prev(by)]; if(!p.length) return false; h.push(p.pop()); S.phase = 'discard'; S.log = EG.name(S, by) + ' yandan aldı'; return true; } return false; }
        if(a.f != null){ if(h.indexOf(a.f) < 0) return false; var how = winWith(S, h, a.f); if(!how) return false; h.splice(h.indexOf(a.f), 1); S.dis[by].push(a.f); endHand(S, by, how); return true; }
        if(a.t == null || h.indexOf(a.t) < 0) return false; h.splice(h.indexOf(a.t), 1); S.dis[by].push(a.t); S.turn = (by + 1) % 4; S.phase = 'draw'; S.log = '';
        if(!S.deck.length) endHand(S, -1); return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i];
        if(S.phase === 'draw'){ var t = topDis(S, prev(i)); if(t != null && (isJ(S, t) || useful(S, t, h.concat([t])) >= 3.2)) return {dp:1}; if(!S.deck.length) return t != null ? {dp:1} : {dk:1}; return {dk:1}; }
        var w = findWin(S, h); if(w != null) return {f:w}; return {t:worst(S, h)}; },
      view:function(S, me, ui){ var h = '<div class="felt" style="top:24px;height:200px"></div>';
        h += EG.around(S, me, function(i){ return (i === S.turn ? (S.phase === 'draw' ? 'çekiyor' : 'atıyor') + ' · ' : '') + 'Puan ' + S.sc[i]; }, null).replace('class="egSeat on p-b"', 'class="egSeat on" style="left:20px;top:190px"').replace('class="egSeat p-b"', 'class="egSeat" style="left:20px;top:190px"');
        h += center(S) + disHtml(S, me);
        if(S.log) h += '<div class="msg" style="top:150px">' + S.log + '</div>';
        var mine = S.turn === me, can = mine && S.phase === 'discard' ? findWin(S, S.h[me], ui.sel) : null;
        h += rackHtml(S, me, ui);
        h += '<div class="act">';
        if(mine && S.phase === 'discard'){ h += (can != null ? '<button type="button" class="bt g" data-x="fin">🏁 BİTİR</button>' : '') + '<button type="button" class="bt" data-x="at"' + (ui.sel != null ? '' : ' disabled') + '>AT ›</button>'; }
        h += '<button type="button" class="bt s sm" data-x="ss">SERİ DİZ</button><button type="button" class="bt s sm" data-x="sc">ÇİFT DİZ</button></div>';
        h += '<div class="msg" style="top:auto;bottom:140px">' + (mine ? (S.phase === 'draw' ? '👉 Ortadan çek ya da soldaki taşı al' : '👉 Bir taş seç ve AT' + (can != null ? ' — elin bitiyor!' : '')) : '⏳ ' + EG.esc(EG.name(S, S.turn)) + ' oynuyor') + '</div>';
        return h; },
      drop:function(S, me, src, dst, ui){ return dropT(S, me, src, dst, ui, this); },
      click:function(S, me, x, ui){ var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(k === 't') return rackClick(S, me, ui, v);
        if(k === 'ss'){ RO.ord = sortSeri(S, S.h[me]); return true; } if(k === 'sc'){ RO.ord = sortCift(S, S.h[me]); return true; }
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
    function bestOpen(S, hand){ var C = cands(S, hand), cnt = C.cnt, best = {v:0, g:[]}, nodes = 0, L = C.list;
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
    function canAdd(S, g, t){ var J = isJ(S, t), f = face(S, t);
      if(g.k === 'set'){ if(g.sz >= 4) return false; if(J) return true; return f[1] === g.n && g.cols.indexOf(f[0]) < 0; }
      if(g.k === 'run'){ if(J) return g.s > 1 || g.s + g.L <= 14 ? (g.s + g.L <= 14 ? 'e' : 's') : false; if(f[0] !== g.c) return false;
        var endN = g.s + g.L; if(endN <= 14 && (endN === 14 ? 1 : endN) === f[1] && !(endN === 14 && g.s === 1)) return 'e'; if(g.s > 1 && g.s - 1 === f[1]) return 's'; return false; }
      return false; }
    function hval(S, h){ var v = 0; h.forEach(function(t){ v += isJ(S, t) ? S.ok[1] : tval(S, t); }); return v; }
    function end101(S, w, okeyFin){ var mul = okeyFin ? 2 : 1, rows = '';
      for(var i = 0; i < 4; i++){ var d; if(i === w) d = okeyFin ? -202 : -101; else if(!S.op[i]) d = 202 * mul; else d = hval(S, S.h[i]) * (S.op[i] === 'c' ? 2 : 1) * mul; S.sc[i] += d;
        rows += '<tr><td>' + EG.esc(EG.name(S, i)) + '</td><td>' + (S.op[i] ? (S.op[i] === 'c' ? 'Çift açtı' : 'Açtı') : 'Açmadı') + '</td><td>' + (d > 0 ? '+' : '') + d + '</td><td><b>' + S.sc[i] + '</b></td></tr>'; }
      S.sum = '<table><tr><th></th><th></th><th>Ceza</th><th>Toplam</th></tr>' + rows + '</table>';
      if(S.hn >= S.hmax){ var mn = Math.min.apply(null, S.sc), W = []; S.sc.forEach(function(v, i){ if(v === mn) W.push(i); }); S.over = {w:W, txt:S.hmax + ' el bitti · en az puan kazanır', html:S.sum}; return; }
      S.log = w >= 0 ? '🎉 ' + EG.name(S, w) + ' eli bitirdi' + (okeyFin ? ' (okeyle ×2!)' : '') : '🤝 Deste bitti'; S.fx = 'win'; S.dealer = (S.dealer + 1) % 4; init101hand(S); }
    function init101hand(S){ deal(S, 21); S.op = [false, false, false, false]; S.tb = []; S.bar = {s:101, c:5}; S.must = false; S.opNow = false; }
    EG.reg({key:'o101', name:'101 OKEY', ic:'🀄', ptxt:'4 kişi', min:4, max:4, fixed:4,
      opts:[{k:'kat', v:[[0, 'KATLAMASIZ'], [1, 'KATLAMALI']]}], defOpt:function(){ return {kat:0}; },
      init:function(S, o){ S.kat = o && +o.kat === 1; S.sc = [0, 0, 0, 0]; S.hn = 0; S.hmax = 5; S.dealer = 3; S.rs0 = S.rs; init101hand(S); },
      sub:function(S){ return 'El ' + S.hn + '/' + S.hmax + ' · ' + (S.kat ? 'Katlamalı' : 'Katlamasız') + ' · Açma ' + S.bar.s + ' / ' + S.bar.c + ' çift'; },
      turn:function(S){ return S.turn; },
      act:function(S, by, a){ if(by !== S.turn) return false; var h = S.h[by];
        if(S.phase === 'draw'){ if(a.dk){ if(!S.deck.length){ end101(S, -1, false); return true; } h.push(S.deck.pop()); S.phase = 'discard'; S.opNow = false; return true; }
          if(a.dp){ var p = S.dis[prev(by)]; if(!p.length) return false; var t = p[p.length - 1];
            if(!S.op[by]){ var hh = h.concat([t]), bo = bestOpen(S, hh), pc = pairList(S, hh).length; if(bo.v < S.bar.s && pc < S.bar.c) return false; S.must = true; }
            h.push(p.pop()); S.phase = 'discard'; S.opNow = false; S.log = EG.name(S, by) + ' yandan aldı'; return true; } return false; }
        if(a.op){ if(S.op[by]) return false;
          if(a.op === 's'){ var b = bestOpen(S, h); if(b.v < S.bar.s) return false; var R = realize(S, h, b.g); R.groups.forEach(function(g){ g.o = by; S.tb.push(g); }); S.h[by] = R.rest; S.op[by] = 's'; if(S.kat) S.bar.s = b.v + 1; S.log = '📂 ' + EG.name(S, by) + ' ' + b.v + ' ile açtı'; }
          else { var P = pairList(S, h); if(P.length < S.bar.c) return false; var rest = h.slice(); P.forEach(function(pp){ pp.forEach(function(t){ rest.splice(rest.indexOf(t), 1); }); S.tb.push({k:'pair', o:by, t:pp}); }); S.h[by] = rest; S.op[by] = 'c'; if(S.kat) S.bar.c = P.length + 1; S.log = '📂 ' + EG.name(S, by) + ' ' + P.length + ' çift açtı'; }
          S.must = false; S.opNow = true; S.fx = 'hit'; return true; }
        if(a.is != null){ if(!S.op[by] || S.opNow) return false; var g = S.tb[a.g]; if(!g || h.indexOf(a.is) < 0) return false; var side = canAdd(S, g, a.is); if(!side) return false;
          h.splice(h.indexOf(a.is), 1); if(g.k === 'set'){ g.t.push(a.is); g.sz++; if(!isJ(S, a.is)) g.cols.push(face(S, a.is)[0]); } else if(side === 's'){ g.t.unshift(a.is); g.s--; g.L++; } else { g.t.push(a.is); g.L++; }
          S.log = EG.name(S, by) + ' taş işledi'; if(!h.length){ end101(S, by, false); } return true; }
        if(a.t == null || h.indexOf(a.t) < 0 || S.must) return false; if(h.length === 1 && !S.op[by]) return false;
        h.splice(h.indexOf(a.t), 1); S.dis[by].push(a.t); S.opNow = false;
        if(!h.length && S.op[by]){ end101(S, by, isJ(S, a.t)); return true; }
        S.turn = (by + 1) % 4; S.phase = 'draw'; S.log = ''; if(!S.deck.length) end101(S, -1, false); return true; },
      bot:function(S, i){ if(S.turn !== i) return null; var h = S.h[i];
        if(S.phase === 'draw'){ var t = topDis(S, prev(i)); if(t != null){ if(S.op[i]){ if(S.tb.some(function(g){ return canAdd(S, g, t); })) return {dp:1}; }
            else { var hh = h.concat([t]); if(bestOpen(S, hh).v >= S.bar.s && bestOpen(S, h).v < S.bar.s) return {dp:1}; } } return S.deck.length ? {dk:1} : (t != null && S.op[i] ? {dp:1} : {dk:1}); }
        if(!S.op[i]){ var b = bestOpen(S, h); if(b.v >= S.bar.s) return {op:'s'}; var pc = pairList(S, h).length; if(pc >= S.bar.c && pc >= 5) return {op:'c'}; }
        if(S.op[i] && !S.opNow && h.length > 1){ for(var k = 0; k < h.length; k++) for(var g = 0; g < S.tb.length; g++) if(canAdd(S, S.tb[g], h[k]) && !(isJ(S, h[k]) && h.length > 2)) return {is:h[k], g:g}; }
        if(S.must) return null;
        return {t:worst(S, h, function(t){ return S.tb.some(function(g){ return canAdd(S, g, t); }); })}; },
      view:function(S, me, ui){ var h = '<div class="felt" style="top:24px;height:200px;left:120px;width:760px;border-radius:100px"></div>';
        h += EG.around(S, me, function(i){ return (S.op[i] ? (S.op[i] === 'c' ? '✅ Çift' : '✅ Açtı') : '⏳ Açmadı') + ' · ' + S.h[i].length + ' taş · ' + S.sc[i]; }, null).replace('class="egSeat on p-b"', 'class="egSeat on" style="left:20px;top:190px"').replace('class="egSeat p-b"', 'class="egSeat" style="left:20px;top:190px"');
        h += center(S).replace('left:400px;top:70px', 'left:150px;top:60px') + disHtml(S, me);
        /* masadaki gruplar */
        var gh = ''; S.tb.forEach(function(g, gi){ var ok = ui.sel != null && S.turn === me && S.op[me] && !S.opNow && canAdd(S, g, ui.sel);
          gh += '<div data-x="g" data-v="' + gi + '" style="display:flex;gap:1px;padding:3px;border-radius:6px;background:' + (ok ? 'rgba(74,222,128,.35)' : 'rgba(0,0,0,.25)') + ';cursor:pointer">' + g.t.map(function(t){ return EG.tile(t, 'xs', '', S.ok); }).join('') + '</div>'; });
        h += '<div style="position:absolute;left:330px;top:58px;width:480px;height:150px;display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start;overflow:hidden">' + gh + '</div>';
        if(S.log) h += '<div class="msg" style="top:212px">' + S.log + '</div>';
        var mine = S.turn === me, h2 = S.h[me], bo = mine && S.phase === 'discard' && !S.op[me] ? bestOpen(S, h2) : null, pc = bo ? pairList(S, h2).length : 0;
        h += rackHtml(S, me, ui);
        h += '<div class="act">';
        if(mine && S.phase === 'discard'){ if(bo){ h += '<button type="button" class="bt g sm" data-x="ops"' + (bo.v >= S.bar.s ? '' : ' disabled') + '>EL AÇ (' + bo.v + ')</button><button type="button" class="bt g sm" data-x="opc"' + (pc >= S.bar.c ? '' : ' disabled') + '>ÇİFT AÇ (' + pc + ')</button>'; }
          h += '<button type="button" class="bt" data-x="at"' + (ui.sel != null && !S.must ? '' : ' disabled') + '>AT ›</button>'; }
        h += '<button type="button" class="bt s sm" data-x="ss">SERİ DİZ</button><button type="button" class="bt s sm" data-x="sc">ÇİFT DİZ</button></div>';
        h += '<div class="msg" style="top:auto;bottom:140px">' + (mine ? (S.phase === 'draw' ? '👉 Ortadan çek ya da soldaki taşı al' : (S.must ? '⚠️ Yandan aldın — önce elini açmalısın' : (S.op[me] && !S.opNow ? '👉 Taş seçip masadaki gruba dokunarak işle, sonra AT' : '👉 Bir taş seç ve AT'))) : '⏳ ' + EG.esc(EG.name(S, S.turn)) + ' oynuyor') + '</div>';
        return h; },
      drop:function(S, me, src, dst, ui){ return dropT(S, me, src, dst, ui, this); },
      click:function(S, me, x, ui){ var k = x.getAttribute('data-x'), v = +x.getAttribute('data-v');
        if(k === 't') return rackClick(S, me, ui, v);
        if(k === 'ss'){ RO.ord = sortSeri(S, S.h[me]); return true; } if(k === 'sc'){ RO.ord = sortCift(S, S.h[me]); return true; }
        if(S.turn !== me) return null;
        if(S.phase === 'draw'){ if(k === 'dk') return {dk:1}; if(k === 'dp'){ if(!S.op[me]){ var t = topDis(S, prev(me)), hh = S.h[me].concat([t]); if(bestOpen(S, hh).v < S.bar.s && pairList(S, hh).length < S.bar.c){ EG.toast('Yandan almak için o taşla elini açabilmelisin'); return null; } } return {dp:1}; } return null; }
        if(k === 'ops') return {op:'s'}; if(k === 'opc') return {op:'c'};
        if(k === 'g'){ if(ui.sel == null){ EG.toast('Önce rafından bir taş seç'); return null; } if(!S.op[me]){ EG.toast('İşlemek için önce elini açmalısın'); return null; } if(S.opNow){ EG.toast('Açtığın elde işleme yapılamaz'); return null; } if(!canAdd(S, S.tb[v], ui.sel)){ EG.toast('Bu taş bu gruba uymuyor'); return null; } return {is:ui.sel, g:v}; }
        if(k === 'at' && ui.sel != null) return {t:ui.sel};
        return null; }
    });
    EG.__okey = {allGroups:allGroups, counts:counts, bestOpen:bestOpen, pairList:pairList, findWin:findWin};
  })();

  window.__EG_READY = true;
})();
