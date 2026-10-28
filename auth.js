/* ============================================================
   🔐 لایهٔ اکانت «بانانا کوییز» — ورود با گوگل (فایربیس)
   - اگر config.js مقدار داشته باشد: SDK فایربیس لود و ورود فعال می‌شود
   - اگر null باشد: حالت مهمان (همه‌چیز لوکال، بدون ورود)
   API عمومی: window.BQAuth.{ available, init, onUser, signIn, signOut,
              saveProfile, fetchLeaderboard, bumpXP }
   ============================================================ */
(function () {
  'use strict';

  var SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  var cfg = window.BQ_FIREBASE_CONFIG || null;
  var ready = false;          /* SDK و اپ فایربیس آماده شد */
  var failed = false;         /* لود ناموفق بود → مهمان */
  var listeners = [];         /* [cb(user|null)] */
  var currentUser = null;     /* {uid, name, email, photoURL} */
  var booted = false;

  function notify() {
    listeners.forEach(function (cb) {
      try { cb(currentUser); } catch (e) { /* ignore */ }
    });
  }

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { cb(true); };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }

  function boot() {
    if (booted) return;
    booted = true;
    if (!cfg || !cfg.apiKey || !cfg.projectId) { failed = true; notify(); return; }
    loadScript(SDK + 'firebase-app-compat.js', function (ok1) {
      if (!ok1) { failed = true; notify(); return; }
      loadScript(SDK + 'firebase-auth-compat.js', function (ok2) {
        if (!ok2) { failed = true; notify(); return; }
        loadScript(SDK + 'firebase-database-compat.js', function (ok3) {
          if (!ok3) { failed = true; notify(); return; }
          try {
            firebase.initializeApp(cfg);
            ready = true;
            /* نتیجهٔ ورود با ریدایرکت (فال‌بک موبایل) */
            firebase.auth().getRedirectResult().catch(function () { /* ignore */ });
            firebase.auth().onAuthStateChanged(function (u) {
              currentUser = u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '' } : null;
              notify();
            });
          } catch (e) {
            failed = true;
            notify();
          }
        });
      });
    });
  }

  /* ---------- پروفایل ابری ---------- */
  function db() { return ready ? firebase.database() : null; }
  function userRef() { return currentUser ? db().ref('users/' + currentUser.uid) : null; }

  /* خواندن پروفایل ابری — cb(profil|null) */
  function getProfile(cb) {
    var ref = userRef();
    if (!ref) { cb(null); return; }
    ref.once('value')
      .then(function (snap) { cb(snap.exists() ? (snap.val() || null) : null); })
      .catch(function () { cb(null); });
  }

  /* ذخیرهٔ بخشی از پروفایل (ادغام‌شونده) */
  function saveProfile(patch, cb) {
    cb = cb || function () { };
    var ref = userRef();
    if (!ref) { cb(false); return; }
    patch.updatedAt = Date.now();
    ref.update(patch).then(function () { cb(true); })
      .catch(function () { cb(false); });
  }

  /* افزودن ایکس‌پی به اکانت (تراکنشی تا دو‌گانه ثبت نشود) */
  function bumpXP(delta, cb) {
    cb = cb || function () { };
    var ref = userRef();
    if (!ref || !delta) { cb(false); return; }
    ref.child('xp').transaction(function (cur) {
      return Math.max(0, (cur || 0) + delta);
    }).then(function (res) { cb(true, res.snapshot ? res.snapshot.val() : null); })
      .catch(function () { cb(false); });
  }

  /* ---------- لیدربورد جهانی ---------- */
  function fetchLeaderboard(cb) {
    if (!ready) { cb(null); return; }
    db().ref('users').orderByChild('xp').limitToLast(100).once('value')
      .then(function (snap) {
        var list = [];
        snap.forEach(function (ch) {
          var v = ch.val() || {};
          list.push({
            uid: ch.key,
            name: v.name || 'بازیکن',
            nick: v.nick || '',
            xp: v.xp || 0,
            best: v.best || 0,
            avatar: v.avatar || null,
            me: !!(currentUser && ch.key === currentUser.uid)
          });
        });
        list.sort(function (a, b) { return b.xp - a.xp; });
        cb(list);
      })
      .catch(function () { cb(null); });
  }

  /* ---------- API عمومی ---------- */
  window.BQAuth = {
    available: function () { return !!(cfg && cfg.apiKey); },
    ready: function () { return ready; },
    failed: function () { return failed; },
    init: boot,
    onUser: function (cb) {
      listeners.push(cb);
      if (ready || failed) cb(currentUser);
      return function () {
        listeners = listeners.filter(function (l) { return l !== cb; });
      };
    },
    user: function () { return currentUser; },
    signIn: function (cb) {
      cb = cb || function () { };
      if (!ready) { cb(false, 'cloud-off'); return; }
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      firebase.auth().signInWithPopup(provider).then(function (res) {
        cb(true);
      }).catch(function (err) {
        /* روی بعضی مرورگرهای موبایل popup بسته می‌شود → ریدایرکت */
        var code = err && err.code || '';
        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' ||
            code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/cancelled-popup-request') {
          try { firebase.auth().signInWithRedirect(provider); return; } catch (e) { /* ignore */ }
        }
        cb(false, code);
      });
    },
    signOut: function (cb) {
      cb = cb || function () { };
      if (!ready) { cb(false); return; }
      firebase.auth().signOut().then(function () { cb(true); }).catch(function () { cb(false); });
    },
    saveProfile: saveProfile,
    getProfile: getProfile,
    bumpXP: bumpXP,
    fetchLeaderboard: fetchLeaderboard
  };
})();
