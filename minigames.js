/* ============================================================
   🎲 مینی‌گیم‌های داخل ویس کال — مار و پله + منچ
   همگام‌سازی نوبتی از طریق همان سند تماس (textdb.dev)
   بازیکن نوبت‌دار تاس می‌ریزد و حرکت را می‌نویسد؛ بقیه می‌بینند
   ============================================================ */
window.BQMinigames = (function () {
  'use strict';

  /* ---------- مار و پله: نقشهٔ کلاسیک ---------- */
  var LAD = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 };
  var SNK = { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 99: 41 };

  /* ---------- منچ: حلقهٔ ۴۰ خانه‌ای (محیط شبکهٔ ۱۱×۱۱) ---------- */
  /* r 0..39 = حلقه | r 40..43 = خانه‌های رنگی آخر | برنده: هر ۴ مهره در ۴۳ */
  var RING = (function () {
    var a = [], i;
    for (i = 0; i <= 10; i++) a.push([0, i]);          /* بالا: (ر0، ستون 0..10) */
    for (i = 1; i <= 10; i++) a.push([i, 10]);          /* راست */
    for (i = 9; i >= 0; i--) a.push([10, i]);           /* پایین */
    for (i = 9; i >= 1; i--) a.push([i, 0]);            /* چپ */
    return a; /* ۴۰ خانه، ساعتگرد */
  })();
  var LUDO_START = [1, 11, 21, 31];                     /* شروع هر بازیکن روی حلقه */
  var LUDO_SAFE = [1, 11, 21, 31];                      /* خانه‌های شروع امن‌اند */
  var LUDO_HOME = {
    0: [[5, 1], [5, 2], [5, 3], [5, 4]],                /* قرمز: از چپ به مرکز */
    1: [[1, 5], [2, 5], [3, 5], [4, 5]],                /* سبز: از بالا */
    2: [[5, 9], [5, 8], [5, 7], [5, 6]],                /* زرد: از راست */
    3: [[9, 5], [8, 5], [7, 5], [6, 5]]                 /* آبی: از پایین */
  };

  var G = { game: null, api: null, lastKey: '', busy: false, lastSfx: '' };

  /* ---------- ابزار ---------- */
  function $(id) { return document.getElementById(id); }
  function faNum(n) {
    var fa = '۰۱۲۳۴۵۶۷۸۹';
    return String(n).replace(/\d/g, function (d) { return fa[+d]; });
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function gameName(t) { return t === 'ludo' ? '🏇 منچ' : '🐍 مار و پله'; }

  /* ---------- افکت‌های صوتی همگام (میدان sfx داخل سند تماس) ----------
     هر حرکت یک گواهی sfx در سند می‌نویسد؛ همهٔ کلاینت‌ها آن را یک‌بار پخش می‌کنند.
     رولر صدای تاس را موقع ضربه محلی شنیده — در فیلد برای خودش حذف می‌شود */
  function fireSfx(game, api, kinds) {
    game.sfx = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      at: Date.now(),
      by: api ? api.me : '',
      k: kinds
    };
  }
  function playSfxField(game, api) {
    var s = game.sfx;
    if (!s || !s.id || s.id === G.lastSfx) return;
    G.lastSfx = s.id;
    if (!s.at || Date.now() - s.at > 4500) return; /* گواهی کهنه — پخش نکن */
    var ks = Array.isArray(s.k) ? s.k : (s.k ? [s.k] : []);
    if (s.by === api.me) ks = ks.filter(function (k) { return k !== 'dice'; });
    if (!ks.length) return;
    var A = window.BananaAudio;
    var delay = 0;
    ks.forEach(function (k) {
      setTimeout(function () {
        if (A && A.mgSfx) A.mgSfx(k);
        else if (api && api.beep) api.beep(k);
      }, delay);
      delay += (k === 'ladder' || k === 'snake' || k === 'win') ? 460 : 220;
    });
  }

  /* ---------- ورودی از حلقهٔ ویس ---------- */
  function onDoc(game, api) {
    var cont = document.getElementById('vc-game');
    if (!game || !game.type || !cont) { G.game = null; G.lastKey = ''; return; }
    G.game = game; G.api = api;
    var key = game.type + '|' + game.phase + '|' + JSON.stringify(game.state || {}) + '|' +
      Object.keys(game.ready || {}).map(function (k) { return k + (game.ready[k] ? 1 : 0); }).join(',') + '|' +
      ((game.sfx || {}).id || '');
    if (key === G.lastKey) return;
    G.lastKey = key;
    playSfxField(game, api);
    if (game.phase === 'ready') renderReady(cont, game, api);
    else if (game.phase === 'play') renderPlay(cont, game, api);
    else if (game.phase === 'over') renderOver(cont, game, api);
  }
  function reset() { G.game = null; G.api = null; G.lastKey = ''; G.lastSfx = ''; }

  /* ---------- مرحلهٔ آماده‌باش ---------- */
  function renderReady(cont, game, api) {
    var ready = game.ready || {};
    var allReady = (game.players || []).every(function (p) { return ready[p.pid]; });
    var chips = (game.players || []).map(function (p) {
      var ok = !!ready[p.pid];
      return '<span class="mg-chip" style="border-color:' + p.color + '">' +
        (ok ? '✅' : '⏳') + ' ' + esc(p.name) + '</span>';
    }).join('');
    cont.innerHTML =
      '<div class="mg-panel">' +
      '  <div class="mg-head"><b>' + gameName(game.type) + '</b><button id="mg-exit" class="mg-x">✖</button></div>' +
      '  <div class="mg-ready">' +
      '    <div class="mg-ready-title">👑 ' + esc(((game.players || []).filter(function (p) { return p.pid === game.startedBy; })[0] || {}).name || 'میزبان') + ' بازی را انتخاب کرد!</div>' +
      '    <div class="mg-chips">' + chips + '</div>' +
      '    <p class="mg-note">همه «آماده‌ام» بزنند تا دکمهٔ شروع روشن شود 🚀</p>' +
      '    <button id="mg-ready" class="btn ' + (ready[api.me] ? 'secondary' : 'primary') + ' big-btn">' +
      (ready[api.me] ? '✅ آماده‌ام! (لغو)' : '✋ آماده‌ام') + '</button>' +
      (api.isHost ? '<button id="mg-start" class="btn party big-btn" ' + (allReady ? '' : 'disabled') + '>🚀 شروع بازی</button>' : '') +
      '  </div>' +
      '</div>';
    $('mg-exit').addEventListener('click', function () { cont.classList.add('hidden'); });
    $('mg-ready').addEventListener('click', function () {
      api.mergeGame(function (g) {
        g.ready = g.ready || {};
        g.ready[api.me] = !g.ready[api.me];
        g.updated = Date.now();
      });
      api.beep('pop');
    });
    var st = $('mg-start');
    if (st) st.addEventListener('click', function () {
      if (st.disabled) return;
      var state = game.type === 'ludo' ? ludoInit(game.players) : snkInit(game.players);
      api.mergeGame(function (g) {
        g.phase = 'play'; g.state = state; g.updated = Date.now();
      });
      api.beep('join');
    });
  }

  /* ============================================================
     🐍 مار و پله
     ============================================================ */
  function snkInit(players) {
    var pos = {};
    players.forEach(function (p) { pos[p.pid] = 0; });
    return { turn: 0, dice: null, sixes: 0, pos: pos, winner: null, log: [] };
  }

  function snkCellRC(n) {
    /* خانهٔ ۱..۱۰۰ → مختصات درصدی روی شبکهٔ ۱۰×۱۰ (مارپیچ از پایین-چپ) */
    var i = n - 1, row = Math.floor(i / 10), col;
    col = (row % 2 === 0) ? (i % 10) : (9 - (i % 10));
    return { row: 9 - row, col: col }; /* ردیف ۰ = بالای صفحه */
  }

  function snkRollAndMove(g, api) {
    var st = g.state;
    var players = g.players;
    var me = players[st.turn];
    if (!me || me.pid !== api.me) return;
    var dice = 1 + Math.floor(Math.random() * 6);
    var p = st.pos[me.pid] || 0;
    var target = p + dice;
    var sfxK = ['dice'];
    var msg = me.name + ' ' + faNum(dice) + ' آورد';
    if (target > 100) target = 100 - (target - 100); /* برگشت از ۱۰۰ */
    if (LAD[target]) { msg += ' 🪜 پله تا ' + faNum(LAD[target]); target = LAD[target]; sfxK.push('ladder'); }
    else if (SNK[target]) { msg += ' 🐍 مار تا ' + faNum(SNK[target]); target = SNK[target]; sfxK.push('snake'); }
    st.pos[me.pid] = target;
    st.log.push(msg);
    if (st.log.length > 6) st.log = st.log.slice(-6);
    if (target === 100) {
      st.winner = me.pid;
      g.phase = 'over';
      sfxK.push('win');
    } else if (dice === 6) {
      st.sixes++;
      if (st.sixes >= 3) { st.sixes = 0; st.turn = (st.turn + 1) % players.length; st.log.push('سه تا ۶! نوبت رد شد 😅'); }
      /* وگرنه دوباره همین بازیکن */
    } else {
      st.sixes = 0;
      st.turn = (st.turn + 1) % players.length;
    }
    fireSfx(g, api, sfxK); /* 🎲/🪜/🐍 — همهٔ کلاینت‌ها یک‌بار پخش می‌کنند */
    g.updated = Date.now();
  }

  function renderSnakes(cont, g, api) {
    var st = g.state, players = g.players;
    var cells = '';
    for (var n = 1; n <= 100; n++) {
      var rc = snkCellRC(n);
      var cls = 'snp-cell';
      if (LAD[n]) cls += ' ldr';
      if (SNK[n]) cls += ' snk';
      var label = LAD[n] ? '🪜' : SNK[n] ? '🐍' : (n === 100 ? '🏁' : faNum(n));
      cells += '<div class="' + cls + '" style="left:' + (rc.col * 10) + '%;top:' + (rc.row * 10) + '%">' + label + '</div>';
    }
    var toks = '';
    players.forEach(function (p, pi) {
      var pos = st.pos[p.pid] || 0;
      var rc = pos === 0 ? { row: 9.85, col: -0.6 + pi * 0.28 } : snkCellRC(pos);
      toks += '<div class="snp-token" data-pid="' + p.pid + '" style="background:' + p.color + ';left:calc(' + ((rc.col + 0.5) * 10) + '% - 11px + ' + (pi * 4) + 'px);top:calc(' + ((rc.row + 0.5) * 10) + '% - 11px - ' + (pi * 3) + 'px)">' + faNum(pi + 1) + '</div>';
    });
    var cur = players[st.turn] || {};
    var myTurn = cur.pid === api.me && !st.winner;
    cont.innerHTML =
      '<div class="mg-panel">' +
      '  <div class="mg-head"><b>🐍 مار و پله</b><button id="mg-exit" class="mg-x">✖</button></div>' +
      '  <div class="mg-turnbar" style="border-color:' + cur.color + '">🎲 نوبت: <b>' + esc(cur.name || '') + '</b>' +
      '    <span class="mg-log">' + (st.log || []).map(esc).slice(-2).join(' • ') + '</span></div>' +
      '  <div class="snp-board">' + cells + toks + '</div>' +
      '  <button id="mg-dice" class="btn ' + (myTurn ? 'primary' : 'ghost') + ' big-btn" ' + (myTurn ? '' : 'disabled') + '>' +
      (myTurn ? '🎲 بنداز!' : '⏳ منتظر نوبتت…') + '</button>' +
      '</div>';
    $('mg-exit').addEventListener('click', function () { cont.classList.add('hidden'); });
    var d = $('mg-dice');
    if (d && myTurn) d.addEventListener('click', function () {
      if (G.busy) return;
      G.busy = true;
      api.beep('dice');
      /* انیمیشن کوتاه تاس، بعد نوشتن حرکت */
      d.classList.add('mg-rolling');
      setTimeout(function () {
        G.busy = false;
        api.mergeGame(function (game) { snkRollAndMove(game, api); });
      }, 380);
    });
  }

  /* ============================================================
     🏇 منچ (نسخهٔ پارتی — مهره‌ها از خانهٔ شروع راه می‌افتند)
     ============================================================ */
  function ludoInit(players) {
    var t = {};
    players.forEach(function (p) { t[p.pid] = [0, 0, 0, 0]; });
    return { turn: 0, sixes: 0, pending: false, t: t, log: [], winner: null };
  }

  /* خانهٔ حلقه برای مهرهٔ بازیکن pi در فاز r (0..39 حلقه، 40..43 خانهٔ رنگی) */
  function ludoCellRC(pi, r) {
    if (r <= 39) {
      var idx = (LUDO_START[pi] + r) % 40;
      return { row: RING[idx][0], col: RING[idx][1], ring: idx };
    }
    var h = LUDO_HOME[pi][r - 40];
    return { row: h[0], col: h[1], ring: -1 };
  }

  function ludoLegalMoves(st, pid, dice) {
    var res = [];
    (st.t[pid] || []).forEach(function (r, ti) {
      if (r + dice <= 43) res.push(ti);
    });
    return res;
  }

  function ludoAfterMove(g, api, dice, wasSix) {
    var st = g.state, players = g.players;
    var myPid = players[st.turn].pid;
    var all = (st.t[myPid] || []).every(function (r) { return r === 43; });
    if (all) {
      st.winner = myPid;
      g.phase = 'over';
      st.log.push('🏆 ' + players[st.turn].name + ' همهٔ مهره‌هاش را رساند!');
      return true; /* بردها با فیلد sfx همگام پخش می‌شود */
    }
    if (dice === 6 && st.sixes < 3) {
      /* نوبت همان بازیکن می‌ماند */
    } else {
      st.sixes = 0;
      st.turn = (st.turn + 1) % players.length;
    }
    return false;
  }

  function applyLudoMove(g, api, ti, dice) {
    var st = g.state;
    var players = g.players;
    var pi = st.turn;
    var myPid = players[pi].pid;
    var r = st.t[myPid][ti] + dice;
    var msg = players[pi].name + ': مهرهٔ ' + faNum(ti + 1) + ' ← ' + faNum(dice);
    /* گرفتن مهرهٔ حریف روی حلقه */
    if (r <= 39) {
      var myCell = ludoCellRC(pi, r);
      if (LUDO_SAFE.indexOf(myCell.ring) === -1) {
        players.forEach(function (op, opi) {
          if (opi === pi) return;
          (st.t[op.pid] || []).forEach(function (orr, oti) {
            if (orr > 39) return;
            var oc = ludoCellRC(opi, orr);
            if (oc.ring === myCell.ring) {
              st.t[op.pid][oti] = 0; /* برگشت به خانهٔ شروع */
              msg += ' ✂️ ' + op.name + ' زده شد!';
            }
          });
        });
      }
    } else if (r === 43) {
      msg += ' 🏁 رسید!';
    }
    st.t[myPid][ti] = r;
    st.log.push(msg);
    if (st.log.length > 6) st.log = st.log.slice(-6);
    return ludoAfterMove(g, api, dice, dice === 6); /* true = برد */
  }

  function renderLudo(cont, g, api) {
    var st = g.state, players = g.players;
    /* خانه‌های صفحه */
    var cells = '';
    var i, rc;
    for (i = 0; i < 40; i++) {
      rc = RING[i];
      var pi = LUDO_START.indexOf(i);
      cells += '<div class="lud-cell' + (pi > -1 ? ' start p' + pi : '') + '" style="left:' + (rc[1] * (100 / 11)) + '%;top:' + (rc[0] * (100 / 11)) + '%">' +
        (pi > -1 ? '⬤' : '') + '</div>';
    }
    for (var p2 = 0; p2 < 4; p2++) {
      LUDO_HOME[p2].forEach(function (h, hi) {
        cells += '<div class="lud-cell home p' + p2 + (hi === 3 ? ' fin' : '') + '" style="left:' + (h[1] * (100 / 11)) + '%;top:' + (h[0] * (100 / 11)) + '%">' + (hi === 3 ? '🏁' : '') + '</div>';
      });
    }
    cells += '<div class="lud-center" style="left:' + (5 * (100 / 11)) + '%;top:' + (5 * (100 / 11)) + '%">🍌</div>';

    /* مهره‌ها */
    var myTurnIdx = st.turn, myPid = players[myTurnIdx].pid;
    var legal = st.pending && myPid === api.me ? ludoLegalMoves(st, myPid, st.dice) : [];
    var toks = '';
    players.forEach(function (p, pi) {
      (st.t[p.pid] || []).forEach(function (r, ti) {
        var rc2 = ludoCellRC(pi, r);
        var isLegal = myPid === api.me && legal.indexOf(ti) > -1;
        toks += '<div class="lud-token' + (isLegal ? ' legal' : '') + '" data-ti="' + ti + '" data-pi="' + pi + '" style="background:' + p.color + ';left:calc(' + ((rc2.col + 0.5) * (100 / 11)) + '% - 10px + ' + (ti % 2) * 7 + 'px);top:calc(' + ((rc2.row + 0.5) * (100 / 11)) + '% - 10px - ' + Math.floor(ti / 2) * 7 + 'px)">' + faNum(ti + 1) + '</div>';
      });
    });

    var cur = players[st.turn] || {};
    var canRoll = cur.pid === api.me && !st.pending && !st.winner;
    var mustPick = st.pending && myPid === api.me && legal.length > 0;
    cont.innerHTML =
      '<div class="mg-panel">' +
      '  <div class="mg-head"><b>🏇 منچ</b><button id="mg-exit" class="mg-x">✖</button></div>' +
      '  <div class="mg-turnbar" style="border-color:' + cur.color + '">🎲 نوبت: <b>' + esc(cur.name || '') + '</b>' +
      (st.pending ? ' — تاس: <b class="mg-dice-face">' + faNum(st.dice) + '</b>' : '') +
      '    <span class="mg-log">' + (st.log || []).slice(-2).map(esc).join(' • ') + '</span></div>' +
      '  <div class="lud-board">' + cells + toks + '</div>' +
      (mustPick
        ? '<p class="mg-note">مهرهٔ روشن را بزن تا حرکت کند 👆</p>'
        : (canRoll
          ? '<button id="mg-dice" class="btn primary big-btn">🎲 بنداز!</button>'
          : '<button class="btn ghost big-btn" disabled>⏳ منتظر نوبتت…</button>')) +
      '</div>';
    $('mg-exit').addEventListener('click', function () { cont.classList.add('hidden'); });
    var d = $('mg-dice');
    if (d && canRoll) d.addEventListener('click', function () {
      if (G.busy) return;
      G.busy = true;
      api.beep('dice');
      var sfxK = ['dice'];
      setTimeout(function () {
        G.busy = false;
        api.mergeGame(function (game) {
          var s = game.state;
          var P = game.players;
          var dice = 1 + Math.floor(Math.random() * 6);
          s.dice = dice;
          s.log.push(P[s.turn].name + ' ' + faNum(dice) + ' آورد');
          if (s.log.length > 6) s.log = s.log.slice(-6);
          if (dice === 6) s.sixes++;
          if (dice === 6 && s.sixes >= 3) {
            s.log.push('سه تا ۶ پشت‌سرهم! نوبت رد شد 😅');
            s.sixes = 0; s.dice = null; s.pending = false;
            s.turn = (s.turn + 1) % P.length;
          } else {
            var legal = ludoLegalMoves(s, P[s.turn].pid, dice);
            if (!legal.length) {
              s.log.push('حرکتی نبود!');
              s.dice = null; s.pending = false;
              if (dice !== 6) { s.sixes = 0; s.turn = (s.turn + 1) % P.length; }
            } else {
              s.pending = true;
              if (legal.length === 1) {
                /* فقط یک حرکت ممکن — خودکار انجام بده */
                if (applyLudoMove(game, api, legal[0], dice)) sfxK.push('win');
                s.dice = null; s.pending = false;
              }
            }
          }
          fireSfx(game, api, sfxK);
          game.updated = Date.now();
        });
      }, 380);
    });
    /* زدن مهرهٔ مجاز */
    var toks2 = cont.querySelectorAll('.lud-token.legal');
    for (i = 0; i < toks2.length; i++) {
      toks2[i].addEventListener('click', function () {
        if (G.busy) return;
        G.busy = true;
        var ti = parseInt(this.getAttribute('data-ti'), 10);
        api.beep('pop');
        api.mergeGame(function (game) {
          var won = applyLudoMove(game, api, ti, game.state.dice);
          if (won) fireSfx(game, api, ['win']);
          game.state.dice = null;
          game.state.pending = false;
          game.updated = Date.now();
        }, function () { G.busy = false; });
      });
    }
  }

  /* ---------- پایان بازی ---------- */
  function renderOver(cont, g, api) {
    var players = g.players || [];
    var st = g.state || {};
    var winner = players.filter(function (p) { return p.pid === st.winner; })[0] || players[0] || {};
    var ranking = players.map(function (p) {
      var score = 0;
      if (g.type === 'snakes') score = st.pos ? (st.pos[p.pid] || 0) : 0;
      else if (st.t) score = (st.t[p.pid] || []).reduce(function (a, r) { return a + r; }, 0);
      return '<div class="mg-rank"><span style="color:' + p.color + '">⬤ ' + esc(p.name) + '</span><b>' +
        (g.type === 'snakes' ? 'خانهٔ ' + faNum(score) : faNum(score) + ' گام') + '</b></div>';
    }).join('');
    cont.innerHTML =
      '<div class="mg-panel">' +
      '  <div class="mg-head"><b>' + gameName(g.type) + '</b><button id="mg-exit" class="mg-x">✖</button></div>' +
      '  <div class="mg-over">' +
      '    <div class="mg-trophy">🏆</div>' +
      '    <div class="mg-winner">' + esc(winner.name || '') + ' برد! 🎉</div>' +
      '    <div class="mg-ranks">' + ranking + '</div>' +
      (api.isHost ? '<button id="mg-again" class="btn primary big-btn">🎲 دوباره! (آماده‌باش جدید)</button>' : '') +
      '    <button id="mg-end" class="btn ghost">پایان بازی</button>' +
      '  </div>' +
      '</div>';
    $('mg-exit').addEventListener('click', function () { cont.classList.add('hidden'); });
    var ag = $('mg-again');
    if (ag) ag.addEventListener('click', function () {
      api.mergeGame(function (game) {
        game.phase = 'ready'; game.ready = {}; game.state = null; game.updated = Date.now();
      });
    });
    $('mg-end').addEventListener('click', function () {
      api.mergeGame(function (game) { game.phase = null; game.type = null; game.state = null; game.updated = Date.now(); });
      cont.classList.add('hidden');
    });
  }

  /* ---------- انتخاب رندر بر اساس فاز ---------- */
  function renderPlay(cont, g, api) {
    if (g.type === 'snakes') renderSnakes(cont, g, api);
    else if (g.type === 'ludo') renderLudo(cont, g, api);
  }

  /* ---------- API ---------- */
  return {
    onDoc: onDoc,
    reset: reset
  };
})();
