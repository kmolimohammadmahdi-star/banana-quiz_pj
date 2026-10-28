/* ============================================================
   🎙️ ویس کال بانانا — تماس صوتی WebRTC (۲ تا ۴ نفر)
   بدون سرور! اتصال گوشی‌به‌گوشی + سیگنالینگ از textdb.dev
   رابط به سبک تلگرام: دکمهٔ گندهٔ میکروفون + انتخاب بلندگو
   مینی‌گیم‌ها: BQMinigames روی همین کانال بازی می‌شوند
   ============================================================ */
window.BQVoice = (function () {
  'use strict';

  /* ---------- ثابت‌ها ---------- */
  var API = 'https://textdb.dev/api/data/';
  var PREFIX = 'bq-call-';          /* جدا از روم‌های پارتی (bq-room-) */
  var CAP = 4;                      /* ظرفیت تماس */
  var POLL = 1400;                  /* چرخهٔ همگام‌سازی (میلی‌ثانیه) */
  var STALE = 20000;                /* حداکثر غیبت قبل از «قطع» شدن */
  var ICE = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ];
  var COLORS = ['#E5484D', '#FFD93D', '#46A758', '#3E63DD'];

  /* ---------- وضعیت ---------- */
  var S = {
    code: '', me: null, isHost: false,
    doc: null, pcs: {}, audios: {}, analysers: {},
    localStream: null, micOn: false, actx: null,
    pollId: null, timerId: null, speakId: null,
    lastGameTick: 0, joined: false, outputs: [], sinkId: 'default'
  };

  /* ---------- کمک‌کارها ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function faNum(n) {
    var fa = '۰۱۲۳۴۵۶۷۸۹';
    return String(n).replace(/\d/g, function (d) { return fa[+d]; });
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function identity() {
    try {
      var p = JSON.parse(localStorage.getItem('mozQuizPlayer') || 'null');
      if (p && p.name) return p;
    } catch (e) { /* ignore */ }
    return null;
  }
  function beep(kind) {
    /* افکت‌های کوچک خودکفا (بدون وابستگی به app.js) */
    try {
      if (!S.actx) S.actx = new (window.AudioContext || window.webkitAudioContext)();
      if (S.actx.state === 'suspended') S.actx.resume();
      var t = S.actx.currentTime + 0.02;
      function tone(f, d, type, v, when) {
        var o = S.actx.createOscillator(), g = S.actx.createGain();
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(v || 0.15, when);
        g.gain.exponentialRampToValueAtTime(0.001, when + d);
        o.connect(g); g.connect(S.actx.destination);
        o.start(when); o.stop(when + d + 0.05);
      }
      if (kind === 'join') { tone(660, 0.12, 'triangle', 0.14, t); tone(880, 0.16, 'triangle', 0.14, t + 0.1); }
      else if (kind === 'leave') { tone(520, 0.14, 'sine', 0.12, t); tone(330, 0.2, 'sine', 0.12, t + 0.12); }
      else if (kind === 'dice') { tone(300, 0.05, 'square', 0.08, t); tone(420, 0.05, 'square', 0.08, t + 0.06); tone(560, 0.07, 'square', 0.08, t + 0.12); }
      else if (kind === 'win') { tone(523, 0.12, 'triangle', 0.16, t); tone(659, 0.12, 'triangle', 0.16, t + 0.12); tone(784, 0.24, 'triangle', 0.18, t + 0.24); }
      else if (kind === 'pop') { tone(700, 0.06, 'sine', 0.1, t); }
    } catch (e) { /* ignore */ }
  }
  function toast(msg, bad) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    t.classList.toggle('toast-bad', !!bad);
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.add('hidden'); }, 2600);
  }

  /* ---------- لایهٔ ذخیره‌سازی (textdb.dev) ----------
     خواندن → تغییر → نوشتن → تأییدِ برگشت (ضد گم‌شدن داده) */
  function callUrl(code) { return API + PREFIX + code; }

  function callRead(code, cb) {
    fetch(callUrl(code), { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var doc = null;
        try {
          /* textdb.dev گاهی با پیشوند value= برمی‌گرداند (مثل roomRead پارتی) */
          if (t.indexOf('value=') === 0) t = t.slice(6);
          doc = JSON.parse(t);
        } catch (e) { doc = null; }
        cb(doc);
      })
      .catch(function () { cb(undefined); });
  }

  function callWrite(code, doc, cb) {
    fetch(callUrl(code), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'value=' + encodeURIComponent(JSON.stringify(doc))
    }).then(function (r) { cb(!!r.ok); }).catch(function () { cb(false); });
  }

  function callMerge(code, mutator, cb, tries, stamp) {
    if (tries === undefined) tries = 0;
    if (!stamp) stamp = 'm' + Date.now() + Math.floor(Math.random() * 1e5);
    callRead(code, function (doc) {
      if (!doc) {
        /* خواندن گاهی لحظه‌ای خالی می‌آید — چند بار تلاش کن */
        if (tries >= 6) { cb(false); return; }
        return setTimeout(function () { callMerge(code, mutator, cb, tries + 1, stamp); }, 250 + Math.floor(Math.random() * 350));
      }
      mutator(doc);
      doc._rv = stamp;
      callWrite(code, doc, function (ok) {
        if (!ok) {
          if (tries >= 6) { cb(false); return; }
          return setTimeout(function () { callMerge(code, mutator, cb, tries + 1, stamp); }, 350 + Math.floor(Math.random() * 650));
        }
        /* برگشت‌خوانی: مطمئن شو تغییرِ ما روی سرو باقی مانده */
        setTimeout(function () {
          callRead(code, function (back) {
            if (back && back._rv === stamp) { cb(true); return; }
            if (tries >= 6) { cb(false); return; }
            setTimeout(function () { callMerge(code, mutator, cb, tries + 1, stamp); }, 250 + Math.floor(Math.random() * 500));
          });
        }, 120);
      });
    });
  }

  /* ---------- لایهٔ رابط ---------- */
  function layer() { return $('voice-layer'); }

  function open() {
    var p = identity();
    if (!p) { toast('اول اسمت را ثبت کن!', true); return; }
    if (!navigator.mediaDevices || !window.RTCPeerConnection) {
      toast('مرورگرت تماس صوتی را پشتیبانی نمی‌کند 😕', true); return;
    }
    buildLayer();
    renderMenu();
    layer().classList.remove('hidden');
    document.body.classList.add('vc-open');
    /* 🎵 موزیک بازی قطع شود تا وقتی لایهٔ ویس کال باز است */
    if (window.BananaAudio) window.BananaAudio.duck(true);
  }

  function close() {
    leaveCall(true);
    layer().classList.add('hidden');
    document.body.classList.remove('vc-open');
    layer().innerHTML = '';
    /* 🎵 برگشت موزیک بازی بعد از بستن ویس کال */
    if (window.BananaAudio) window.BananaAudio.duck(false);
  }

  function buildLayer() {
    layer().innerHTML = '';
  }

  /* ----- منوی ویس کال (ساخت / ورود) ----- */
  function renderMenu() {
    var L = layer();
    L.innerHTML = '';
    var box = el('div', 'vc-menu');
    box.innerHTML =
      '<div class="vc-logo">🎙️</div>' +
      '<h2 class="vc-title">ویس کال</h2>' +
      '<p class="vc-sub">تا <b>' + faNum(CAP) + ' نفر</b> با هم صدا صدا — بدون هیچ اپ اضافه!</p>' +
      '<button id="vc-create" class="btn primary big-btn">🎙️ ساخت ویس کال</button>' +
      '<div class="party-divider"><span>یا</span></div>' +
      '<label for="vc-code">ورود با کد تماس</label>' +
      '<input id="vc-code" class="code-input" type="text" inputmode="numeric" maxlength="4" placeholder="مثلاً ۴۸۲۱" autocomplete="off">' +
      '<button id="vc-join" class="btn secondary big-btn">🚪 ورود به تماس</button>' +
      '<p class="vc-note">⚠️ بار اول مرورگر اجازهٔ میکروفون می‌خواهد — «Allow» بزن.<br>همراهان از داخل همین بازی با کد تماس میان!</p>' +
      '<button id="vc-menu-close" class="btn ghost">بازگشت</button>';
    L.appendChild(box);
    $('vc-create').addEventListener('click', function () {
      if (window.BQCaptcha && window.__captchaHandlers) {
        window.__captchaHandlers['voice-create'] = createCall;
        window.BQCaptcha.open('voice-create');
      } else createCall();
    });
    $('vc-join').addEventListener('click', function () {
      var c = ($('vc-code').value || '').replace(/\D/g, '');
      if (c.length !== 4) { toast('کد تماس ۴ رقمی را کامل بزن!', true); return; }
      function go() { joinCall(c); }
      if (window.BQCaptcha && window.__captchaHandlers) {
        window.__captchaHandlers['voice-join'] = go;
        window.BQCaptcha.open('voice-join');
      } else go();
    });
    $('vc-menu-close').addEventListener('click', close);
  }

  /* ----- ساخت تماس ----- */
  function makeCode() { return String(Math.floor(1000 + Math.random() * 9000)); }

  function createCall() {
    var p = identity();
    var code = makeCode();
    var me = newPid();
    S.me = me; S.code = code; S.isHost = true;
    var doc = {
      kind: 'voice', v: 1, createdAt: Date.now(), closed: false,
      host: me, cap: CAP,
      peers: {}, sig: {}, mute: {}, game: null
    };
    doc.peers[me] = { name: p.name, nick: p.nick, joinedAt: Date.now(), seen: Date.now() };
    callWrite(code, doc, function (ok) {
      if (!ok) { toast('اتصال برقرار نشد؛ اینترنت را چک کن 📶', true); return; }
      enterCall(doc);
    });
  }

  function joinCall(code) {
    var p = identity();
    callRead(code, function (doc) {
      if (doc === undefined) { toast('اتصال برقرار نشد؛ اینترنت را چک کن 📶', true); return; }
      if (!doc || doc.kind !== 'voice' || doc.closed) { toast('چنین تماسی پیدا نشد! کد را چک کن 🤔', true); return; }
      /* ظرفیت: تعداد افراد فعال */
      var active = 0, k;
      for (k in (doc.peers || {})) if (Date.now() - (doc.peers[k].seen || 0) < STALE) active++;
      if (active >= (doc.cap || CAP)) { toast('تماس پر است! ظرفیت ' + faNum(doc.cap || CAP) + ' نفر 😅', true); return; }
      var me = newPid();
      S.me = me; S.code = code; S.isHost = false;
      callMerge(code, function (d) {
        d.peers = d.peers || {}; d.sig = d.sig || {}; d.mute = d.mute || {};
        d.peers[me] = { name: p.name, nick: p.nick, joinedAt: Date.now(), seen: Date.now() };
        d.sig[me] = { offers: {}, answers: {}, ts: Date.now() };
      }, function (ok) {
        if (!ok) { toast('ورود به تماس شکست خورد؛ دوباره تلاش کن', true); return; }
        enterCall(null);
      });
    });
  }

  function newPid() { return 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ----- ورود به صفحهٔ تماس ----- */
  function enterCall(preDoc) {
    S.joined = true;
    renderCallView();
    beep('join');
    ensureMic(function (ok) {
      if (!ok) {
        toast('میکروفون باز نشد! از تنظیمات مرورگر اجازه بده 🎤', true);
      }
      startLoop();
      if (preDoc) handleDoc(preDoc);
    });
  }

  /* ----- صفحهٔ تماس (سبک تلگرام) ----- */
  function renderCallView() {
    var L = layer();
    L.innerHTML =
      '<div class="vc-call">' +
      '  <div class="vc-head">' +
      '    <div class="vc-code-box" id="vc-codebox">کد تماس <b>' + faNum(S.code) + '</b>' +
      '      <span class="vc-code-actions">' +
      '        <button id="vc-copy" class="btn tiny secondary">📋 کپی</button>' +
      '        <button id="vc-share" class="btn tiny secondary">📤 فرستادن</button>' +
      '      </span>' +
      '    </div>' +
      '    <div class="vc-timer" id="vc-timer">۰۰:۰۰</div>' +
      '  </div>' +
      '  <div class="vc-status" id="vc-status">در حال اتصال…</div>' +
      '  <div class="vc-bubbles" id="vc-bubbles"></div>' +
      '  <div class="vc-bottom">' +
      '    <button id="vc-speakers" class="vc-round" title="بلندگو / هندزفری">🔊</button>' +
      '    <button id="vc-mic" class="vc-mic off" title="میکروفون">🔇</button>' +
      '    <div class="vc-side-btns">' +
      '      <button id="vc-games" class="vc-round">🎲</button>' +
      '      <button id="vc-leave" class="vc-round vc-leave">📵</button>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div id="vc-sheet" class="vc-sheet hidden"></div>' +
      '<div id="vc-game" class="vc-game hidden"></div>';

    $('vc-copy').addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(S.code).then(function () { toast('کد تماس کپی شد! 📋'); },
          function () { toast('کپی نشد؛ دستی یادداشت کن', true); });
      } catch (e) { toast('کپی نشد؛ دستی یادداشت کن', true); }
    });
    $('vc-share').addEventListener('click', function () {
      var txt = '🎙️ ویس کال بانانا کوییز!\nکد تماس: ' + faNum(S.code) + '\nبیا تو بازی: ویس کال ← ورود با کد';
      if (navigator.share) navigator.share({ text: txt }).catch(function () { });
      else { try { navigator.clipboard.writeText(txt); toast('متن کپی شد! توی چت بفرست 📤'); } catch (e) { } }
    });
    $('vc-speakers').addEventListener('click', showSpeakers);
    $('vc-mic').addEventListener('click', toggleMic);
    $('vc-leave').addEventListener('click', function () { close(); });
    $('vc-games').addEventListener('click', pickGame);

    /* تایمر مدت تماس */
    clearInterval(S.timerId);
    S.timerId = setInterval(function () {
      var t = $('vc-timer');
      if (!t || !S.doc) return;
      var s = Math.max(0, Math.floor((Date.now() - (S.doc.createdAt || Date.now())) / 1000));
      var m = Math.floor(s / 60); s = s % 60;
      t.textContent = (m < 10 ? '۰' : '') + faNum(m) + ':' + (s < 10 ? '۰' : '') + faNum(s);
    }, 1000);
  }

  /* ----- میکروفون ----- */
  function ensureMic(cb) {
    if (S.localStream) { cb(true); return; }
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    }).then(function (st) {
      S.localStream = st;
      S.micOn = false;
      st.getAudioTracks().forEach(function (tr) { tr.enabled = false; }); /* بی‌صدا وارد شو */
      updateMicBtn();
      startLocalAnalyser();
      cb(true);
    }).catch(function () { cb(false); });
  }

  function toggleMic() {
    if (!S.localStream) {
      ensureMic(function (ok) { if (ok) { S.micOn = true; applyMic(); } else toast('میکروفون در دسترس نیست 🎤', true); });
      return;
    }
    S.micOn = !S.micOn;
    applyMic();
  }

  function applyMic() {
    S.localStream.getAudioTracks().forEach(function (tr) { tr.enabled = S.micOn; });
    updateMicBtn();
    beep(S.micOn ? 'pop' : 'pop');
    /* برای بقیه بفرست که میکت باز/بسته است */
    callMerge(S.code, function (d) {
      d.mute = d.mute || {};
      d.mute[S.me] = !S.micOn;
    }, function () { });
  }

  function updateMicBtn() {
    var b = $('vc-mic');
    if (!b) return;
    b.classList.toggle('on', S.micOn);
    b.classList.toggle('off', !S.micOn);
    b.textContent = S.micOn ? '🎙️' : '🔇';
  }

  /* ----- انتخاب خروجی صدا (اسپیکر/هندزفری/بلوتوث) ----- */
  function listOutputs(cb) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) { cb([]); return; }
    navigator.mediaDevices.enumerateDevices().then(function (list) {
      cb((list || []).filter(function (d) { return d.kind === 'audiooutput'; }));
    }).catch(function () { cb([]); });
  }

  function showSpeakers() {
    listOutputs(function (outs) {
      S.outputs = outs;
      var sheet = $('vc-sheet');
      if (!sheet) return;
      var canPick = !!window.HTMLAudioElement && !!HTMLAudioElement.prototype.setSinkId;
      var html = '<div class="vc-sheet-box"><h3>🔊 صدای پخش از کجا باشد؟</h3>';
      if (!outs.length) {
        html += '<p class="vc-sheet-note">خروجی پیدا نشد.</p>';
      } else if (!canPick) {
        html += '<p class="vc-sheet-note">این مرورگر انتخاب خروجی را نمی‌دهد؛ بلندگو/هندزفری/بلوتوث ماشین را از خودِ گوشی انتخاب کن — صدا خودکار همان‌جا پخش می‌شود 🔊</p>';
      } else {
        html += '<div class="vc-out-list">';
        outs.forEach(function (d, i) {
          var icon = /bluetooth|airpod|car|سترهو|ساند|buds/i.test(d.label) ? '🚗' :
            /head|handset|headphone|ایرپیس|گوشی/i.test(d.label) ? '🎧' : '🔊';
          html += '<button class="vc-sheet-item' + ((d.deviceId === S.sinkId || (S.sinkId === 'default' && i === 0)) ? ' sel' : '') + '" data-did="' + esc(d.deviceId) + '">' +
            icon + ' ' + esc(d.label || ('خروجی ' + faNum(i + 1))) + '</button>';
        });
        html += '</div>';
        html += '<p class="vc-sheet-note">هندزفری و بلوتوث ماشین وقتی به گوشی وصل باشند در همین فهرست پیدا می‌شوند 🚗</p>';
      }
      html += '<button id="vc-sheet-close" class="btn secondary">بستن</button></div>';
      sheet.innerHTML = html;
      sheet.classList.remove('hidden');
      var closeB = $('vc-sheet-close');
      if (closeB) closeB.addEventListener('click', function () { sheet.classList.add('hidden'); });
      var items = sheet.querySelectorAll('.vc-out-list .vc-sheet-item');
      for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function () {
          S.sinkId = this.getAttribute('data-did') || 'default';
          setSinkAll(S.sinkId);
          sheet.classList.add('hidden');
          toast('صدای پخش عوض شد 🔊');
        });
      }
    });
  }

  function setSinkAll(id) {
    if (!HTMLAudioElement.prototype.setSinkId) return;
    for (var k in S.audios) {
      try { S.audios[k].setSinkId(id === 'default' ? '' : id); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- موتور WebRTC (مش) ----------
     قانون: همتای «قدیمی‌تر» (joinedAt کوچکتر) به «جدیدتر» پیشنهاد می‌دهد */
  function handleDoc(doc) {
    if (!doc) return;
    if (doc.closed) { callEnded(); return; }
    S.doc = doc;
    var now = Date.now(), k;
    var active = {};
    for (k in (doc.peers || {})) {
      if (k === S.me) { active[k] = doc.peers[k]; continue; }
      if (now - (doc.peers[k].seen || 0) < STALE) active[k] = doc.peers[k];
    }
    renderBubbles(active, doc);
    var sig = doc.sig || {};
    var mine = sig[S.me] || { offers: {}, answers: {} };

    for (k in active) {
      if (k === S.me || S.pcs[k]) continue;
      if (k > S.me) {
        /* من قدیمی‌ترم → من پیشنهاد می‌دهم (مقایسهٔ رشته‌ای برای ثبات) */
        createOfferTo(k);
      } else {
        /* او قدیمی‌تر است → منتظر پیشنهادش می‌مانم */
        var off = (sig[k] && sig[k].offers && sig[k].offers[S.me]) || null;
        if (off) answerTo(k, off);
      }
    }
    /* پاسخ‌های رسیده به پیشنهادهای من */
    for (k in S.pcs) {
      var ans = (sig[k] && sig[k].answers && sig[k].answers[S.me]) || null;
      if (ans && !S.pcs[k]._answered) {
        S.pcs[k]._answered = true;
        try { S.pcs[k].setRemoteDescription({ type: 'answer', sdp: ans }); } catch (e) { /* ignore */ }
      }
    }
    /* اگر بازی فعال است به ماژول بازی بده */
    if (doc.game && window.BQMinigames) {
      BQMinigames.onDoc(doc.game, {
        me: S.me, code: S.code, isHost: S.isHost,
        mergeGame: mergeGame, toast: toast, beep: beep, closeGame: function () { $('vc-game').classList.add('hidden'); }
      });
      $('vc-game').classList.remove('hidden');
    } else if (window.BQMinigames) {
      BQMinigames.onDoc(null, {});
      var g = $('vc-game'); if (g) g.classList.add('hidden');
    }
  }

  function peerCount() { return S.doc ? Object.keys(S.doc.peers || {}).filter(function (k) { return Date.now() - (S.doc.peers[k].seen || 0) < STALE; }).length : 1; }

  function basePC() {
    var pc = new RTCPeerConnection({ iceServers: ICE });
    if (S.localStream) S.localStream.getTracks().forEach(function (tr) { try { pc.addTrack(tr, S.localStream); } catch (e) { } });
    pc.ontrack = function (ev) {
      var pid = pc._peer;
      if (!pid || S.audios[pid]) return;
      var a = document.createElement('audio');
      a.srcObject = ev.streams[0];
      a.autoplay = true; a.playsInline = true;
      a.setAttribute('playsinline', '');
      document.body.appendChild(a);
      a.play().catch(function () { });
      S.audios[pid] = a;
      if (S.sinkId && S.sinkId !== 'default') setSinkAll(S.sinkId);
      startRemoteAnalyser(pid, ev.streams[0]);
      setStatus();
    };
    pc.onconnectionstatechange = function () { renderBubbleStates(); setStatus(); };
    return pc;
  }

  function waitIce(pc, cb) {
    var done = false;
    function fin() { if (!done) { done = true; cb(); } }
    if (pc.iceGatheringState === 'complete') return fin();
    pc.addEventListener('icegatheringstatechange', function () {
      if (pc.iceGatheringState === 'complete') fin();
    });
    setTimeout(fin, 2200); /* اگر کند بود با همان کاندیدهای فعلی */
  }

  function createOfferTo(pid) {
    var pc = basePC();
    pc._peer = pid;
    S.pcs[pid] = pc;
    pc.createOffer({ offerToReceiveAudio: true }).then(function (o) {
      return pc.setLocalDescription(o);
    }).then(function () {
      waitIce(pc, function () {
        callMerge(S.code, function (d) {
          d.sig = d.sig || {};
          d.sig[S.me] = d.sig[S.me] || { offers: {}, answers: {} };
          d.sig[S.me].offers = d.sig[S.me].offers || {};
          d.sig[S.me].offers[pid] = pc.localDescription.sdp;
        }, function () { });
      });
    }).catch(function () { });
  }

  function answerTo(pid, offerSdp) {
    var pc = basePC();
    pc._peer = pid;
    S.pcs[pid] = pc;
    pc.setRemoteDescription({ type: 'offer', sdp: offerSdp }).then(function () {
      return pc.createAnswer();
    }).then(function (a) {
      return pc.setLocalDescription(a);
    }).then(function () {
      waitIce(pc, function () {
        callMerge(S.code, function (d) {
          d.sig = d.sig || {};
          d.sig[S.me] = d.sig[S.me] || { offers: {}, answers: {} };
          d.sig[S.me].answers = d.sig[S.me].answers || {};
          d.sig[S.me].answers[pid] = pc.localDescription.sdp;
        }, function () { });
      });
    }).catch(function () { });
  }

  /* ---------- حلقهٔ همگام‌سازی ---------- */
  function startLoop() {
    clearInterval(S.pollId);
    S.pollId = setInterval(function () {
      if (!S.joined) return;
      /* ضربان خودم */
      callMerge(S.code, function (d) {
        if (d.peers && d.peers[S.me]) d.peers[S.me].seen = Date.now();
        /* اگر میزبانیم، قطع‌شدگان قدیمی را پاک کن */
        if (S.isHost && d.peers) {
          var k;
          for (k in d.peers) {
            if (k !== S.me && d.peers[k] && Date.now() - (d.peers[k].seen || 0) > STALE * 3) {
              delete d.peers[k]; delete d.mute[k];
              if (d.sig) delete d.sig[k];
              if (d.game && d.game.ready) delete d.game.ready[k];
            }
          }
        }
      }, function () { });
      callRead(S.code, handleDoc);
    }, POLL);
  }

  /* ---------- حباب‌های بازیکن‌ها ---------- */
  function renderBubbles(active, doc) {
    var box = $('vc-bubbles');
    if (!box) return;
    var ids = Object.keys(active);
    ids.sort(function (a, b) { return (active[a].joinedAt || 0) - (active[b].joinedAt || 0); });
    box.innerHTML = '';
    ids.forEach(function (pid) {
      var p = active[pid];
      var col = COLORS[ids.indexOf(pid) % COLORS.length];
      var b = el('div', 'vc-bub' + (pid === S.me ? ' me' : ''));
      b.id = 'vc-bub-' + pid;
      var initial = (p.name || '؟').trim().charAt(0);
      b.innerHTML =
        '<div class="vc-bub-face" style="background:' + col + '">' + esc(initial) + '</div>' +
        ((doc.mute || {})[pid] && pid !== S.me ? '<span class="vc-mic-badge">🔇</span>' : '') +
        (pid === S.me && !S.micOn ? '<span class="vc-mic-badge">🔇</span>' : '') +
        (pid === (doc.host || '') ? '<span class="vc-crown">👑</span>' : '') +
        '<div class="vc-bub-name">' + esc(p.name || '؟') + '</div>';
      box.appendChild(b);
    });
    setStatus();
  }

  function renderBubbleStates() {
    for (var pid in S.pcs) {
      var b = $('vc-bub-' + pid);
      if (!b) continue;
      var st = S.pcs[pid].connectionState;
      b.classList.toggle('connecting', st !== 'connected');
    }
  }

  function setStatus() {
    var s = $('vc-status');
    if (!s) return;
    var n = peerCount();
    var connected = 0, k;
    for (k in S.pcs) if (S.pcs[k].connectionState === 'connected') connected++;
    if (n <= 1) s.textContent = 'فقط خودتی! کد تماس را بفرست 📤';
    else if (connected >= n - 1) s.textContent = 'همه وصل‌اند! 🎉 (' + faNum(n) + ' نفر)';
    else s.textContent = faNum(n) + ' نفر در تماس — در حال اتصال…';
  }

  /* ---------- تشخیص صحبت‌کردن (حلقهٔ روشن) ---------- */
  function makeAnalyser(stream) {
    try {
      if (!S.actx) S.actx = new (window.AudioContext || window.webkitAudioContext)();
      if (S.actx.state === 'suspended') S.actx.resume();
      var src = S.actx.createMediaStreamSource(stream);
      var an = S.actx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      return an;
    } catch (e) { return null; }
  }
  function startLocalAnalyser() {
    var an = makeAnalyser(S.localStream);
    S.analysers[S.me] = an;
    if (!S.speakId) S.speakId = setInterval(speakTick, 160);
  }
  function startRemoteAnalyser(pid, stream) {
    S.analysers[pid] = makeAnalyser(stream);
    if (!S.speakId) S.speakId = setInterval(speakTick, 160);
  }
  function speakTick() {
    var buf = new Uint8Array(256), k;
    for (k in S.analysers) {
      var an = S.analysers[k];
      var b = $('vc-bub-' + k);
      if (!an || !b) continue;
      an.getByteFrequencyData(buf);
      var sum = 0;
      for (var i = 0; i < buf.length; i++) sum += buf[i];
      var avg = sum / buf.length;
      b.classList.toggle('speaking', S.micOn || k !== S.me ? avg > 22 : false);
    }
  }

  /* ---------- پایان تماس ---------- */
  function callEnded() {
    if (!S.joined) return;
    S.joined = false;
    beep('leave');
    toast('تماس تمام شد 👋');
    closeAll();
    layer().classList.add('hidden');
    document.body.classList.remove('vc-open');
    layer().innerHTML = '';
    /* 🎵 تماس از سمت مقابل تمام شد — موزیک برگردد */
    if (window.BananaAudio) window.BananaAudio.duck(false);
  }

  function closeAll() {
    clearInterval(S.pollId); S.pollId = null;
    clearInterval(S.timerId); S.timerId = null;
    clearInterval(S.speakId); S.speakId = null;
    for (var k in S.pcs) { try { S.pcs[k].close(); } catch (e) { } }
    S.pcs = {};
    for (k in S.audios) { try { S.audios[k].pause(); S.audios[k].remove(); } catch (e) { } }
    S.audios = {}; S.analysers = {};
    if (S.localStream) { try { S.localStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { } }
    S.localStream = null; S.doc = null; S.micOn = false;
    if (window.BQMinigames) BQMinigames.onDoc(null, {});
  }

  function leaveCall(silent) {
    if (!S.joined) return;
    S.joined = false;
    var wasHost = S.isHost, code = S.code, me = S.me;
    callMerge(code, function (d) {
      if (d.peers) delete d.peers[me];
      if (d.sig) delete d.sig[me];
      if (d.mute) delete d.mute[me];
      if (d.game && d.game.ready) delete d.game.ready[me];
      if (wasHost) d.closed = true;
    }, function () { });
    if (!silent) beep('leave');
    closeAll();
  }

  /* ---------- مینی‌گیم‌ها ---------- */
  function mergeGame(mutator, cb) {
    callMerge(S.code, function (d) {
      d.game = d.game || {};
      mutator(d.game, d);
    }, cb || function () { });
  }

  function pickGame() {
    var sheet = $('vc-sheet');
    if (!sheet) return;
    var n = peerCount();
    sheet.innerHTML =
      '<div class="vc-sheet-box"><h3>🎲 کدام مینی‌گیم؟</h3>' +
      '<p class="vc-sheet-note">اول همه «آماده‌ام» می‌زنند، بعد تو شروع می‌کنی! (تا ' + faNum(4) + ' نفر)</p>' +
      '<button class="vc-sheet-item" data-g="snakes">🐍 مار و پله — سریع و همین‌حوری</button>' +
      '<button class="vc-sheet-item" data-g="ludo">🏇 منچ — کلاسیک همیشگی</button>' +
      '<button id="vc-sheet-close" class="btn secondary">بی‌خیال</button></div>';
    sheet.classList.remove('hidden');
    $('vc-sheet-close').addEventListener('click', function () { sheet.classList.add('hidden'); });
    var items = sheet.querySelectorAll('[data-g]');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function () {
        var g = this.getAttribute('data-g');
        sheet.classList.add('hidden');
        if (!S.isHost) { toast('فقط سازندهٔ تماس می‌تواند بازی را انتخاب کند! 👑', true); return; }
        if (n < 2) { toast('حداقل ۲ نفر لازم است — کد تماس را بفرست! 📤', true); return; }
        var players = [];
        var ids = Object.keys(S.doc.peers).filter(function (k) { return Date.now() - (S.doc.peers[k].seen || 0) < STALE; });
        ids.sort(function (a, b) { return (S.doc.peers[a].joinedAt || 0) - (S.doc.peers[b].joinedAt || 0); });
        ids.slice(0, 4).forEach(function (pid, i) {
          players.push({ pid: pid, name: S.doc.peers[pid].name || '؟', color: COLORS[i % COLORS.length] });
        });
        mergeGame(function (game) {
          game.type = g; game.phase = 'ready'; game.ready = {};
          game.players = players; game.startedBy = S.me; game.state = null; game.updated = Date.now();
        }, function (ok) {
          if (ok) toast('پیشنهاد بازی رفت — همه «آماده‌ام» بزنند! ✅');
          else toast('ارسال نشد؛ دوباره تلاش کن', true);
        });
      });
    }
  }

  /* ---------- API عمومی ---------- */
  return {
    open: open,
    close: close,
    isBusy: function () { return S.joined; }
  };
})();

/* دکمهٔ خانه — خود ماژول وصل می‌کند (بدون دست‌زدن به app.js) */
(function () {
  function wire() {
    var b = document.getElementById('btn-voice');
    if (b && window.BQVoice) b.addEventListener('click', window.BQVoice.open);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
