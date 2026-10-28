/* ============================================================
   👤 موتور آواتار کوییز موز — نسخهٔ تمام‌قد
   کاراکتر ایستاده روی جفت پا با ۳ زاویه (روبه‌رو / نیم‌رخ / پشت)
   + اسلات‌های جدید: شلوار، کفش، عینک و کلاه (جدا از هم)
   همه‌چیز SVG خالص و بدون کتابخانه
   ============================================================ */
(function () {
  'use strict';

  /* ---------- کاتالوگ آیتم‌ها ----------
     price = 0 یعنی رایگان؛ بقیه با ایکس‌پی خریده می‌شوند */
  var CATALOG = [
    { key: 'skin', label: 'پوست', items: [
      { id: 's1', name: 'صدفی',  price: 0, c: '#FFEDD9' },
      { id: 's2', name: 'گندمی', price: 0, c: '#F7CBA4' },
      { id: 's3', name: 'برنزه', price: 0, c: '#DFA878' },
      { id: 's4', name: 'قهوه‌ای', price: 0, c: '#B57A4B' },
      { id: 's5', name: 'تیره',  price: 0, c: '#8A5A33' },
      { id: 's6', name: 'موزی 🍌', price: 0, c: '#FFF3B0' }
    ]},
    { key: 'hair', label: 'مدل مو', items: [
      { id: 'h_bald',  name: 'کچل',    price: 0 },
      { id: 'h_short', name: 'کوتاه',  price: 0 },
      { id: 'h_long',  name: 'بلند',   price: 0 },
      { id: 'h_pony',  name: 'دم‌اسبی', price: 20 },
      { id: 'h_wavy',  name: 'موج‌دار', price: 30 },
      { id: 'h_spiky', name: 'تیپی',   price: 30 },
      { id: 'h_curly', name: 'فر',     price: 40 },
      { id: 'h_afro',  name: 'افرو',   price: 60 }
    ]},
    { key: 'hairColor', label: 'رنگ مو', items: [
      { id: 'hc_black',  name: 'مشکی',    price: 0,  c: '#2B1A0E' },
      { id: 'hc_brown',  name: 'قهوه‌ای', price: 0,  c: '#5A3A22' },
      { id: 'hc_blond',  name: 'بلوند',   price: 0,  c: '#E8C25A' },
      { id: 'hc_pink',   name: 'صورتی',   price: 25, c: '#F06292' },
      { id: 'hc_blue',   name: 'آبی',     price: 30, c: '#4A90D9' },
      { id: 'hc_green',  name: 'سبز',     price: 30, c: '#43A047' },
      { id: 'hc_silver', name: 'نقره‌ای', price: 40, c: '#B0BEC5' },
      { id: 'hc_gold',   name: 'طلایی',   price: 60, c: '#FFD700' }
    ]},
    { key: 'eyes', label: 'چشم‌ها', items: [
      { id: 'e_normal',    name: 'معمولی',   price: 0 },
      { id: 'e_happy',     name: 'خندان',    price: 0 },
      { id: 'e_wink',      name: 'چشمک 👀',  price: 20 },
      { id: 'e_big',       name: 'گرد بزرگ', price: 20 },
      { id: 'e_surprised', name: 'شگفت‌زده', price: 30 },
      { id: 'e_star',      name: 'ستاره‌ای ⭐', price: 60 }
    ]},
    { key: 'mouth', label: 'لبخند', items: [
      { id: 'm_smile',  name: 'لبخند',    price: 0 },
      { id: 'm_smirk',  name: 'پهلو',     price: 0 },
      { id: 'm_o',      name: 'اُ',       price: 0 },
      { id: 'm_frown',  name: 'اخمو',     price: 10 },
      { id: 'm_tongue', name: 'زبان‌بازی', price: 20 },
      { id: 'm_grin',   name: 'دندان‌خنده', price: 30 }
    ]},
    { key: 'outfit', label: 'پیراهن', items: [
      { id: 'o_tee_white', name: 'تیشرت سفید', price: 0, c: '#FFFDF5' },
      { id: 'o_tee_yellow',name: 'تیشرت زرد',  price: 0, c: '#FFD93D' },
      { id: 'o_tee_green', name: 'تیشرت سبز',  price: 0, c: '#7BC47F' },
      { id: 'o_tee_pink',  name: 'تیشرت صورتی',price: 0, c: '#F49AC1' },
      { id: 'o_hoodie',    name: 'هودی نارنجی', price: 30, c: '#FF8A3D' },
      { id: 'o_jersey',    name: 'پیراهن ورزشی', price: 50, c: '#2C4A6E' },
      { id: 'o_stripes',   name: 'راه‌راه دریایی ⚓', price: 150, c: '#FFFDF5' },
      { id: 'o_suit',      name: 'کت‌وشلوار کلاسیک 👔', price: 80, c: '#3E2610' },
      { id: 'o_varsity',   name: 'کتابازی بیسبال ⚾', price: 400, c: '#FFF6E8' },
      { id: 'o_cape',      name: 'شنل قهرمانی 🦸', price: 120, c: '#C0392B' },
      { id: 'o_gold_suit', name: 'کت‌وشلوار طلایی 👑', price: 800, c: '#F6B100' },
      { id: 'o_banana',    name: 'لباس موز 🍌', price: 200, c: '#FFE135' }
    ]},
    { key: 'pants', label: 'شلوار', items: [
      { id: 'p_shorts', name: 'شلوارک طوسی', price: 0, c: '#8A8F98' },
      { id: 'p_jeans',  name: 'شلوار جین 👖', price: 60, c: '#4A6FA5' },
      { id: 'p_track',  name: 'شلوار ورزشی', price: 120, c: '#D93A3A' },
      { id: 'p_cargo',  name: 'شلوار کارگو', price: 200, c: '#B09268' },
      { id: 'p_gold',   name: 'شلوار طلایی ✨', price: 500, c: '#FFC93D' }
    ]},
    { key: 'shoes', label: 'کفش', items: [
      { id: 'sh_sneakers', name: 'کتونی سفید', price: 0, c: '#FFFDF5' },
      { id: 'sh_sport',    name: 'کتونی اسپرت 🔥', price: 150, c: '#E8483D' },
      { id: 'sh_boot',     name: 'پوتین 🥾', price: 250, c: '#6B4226' },
      { id: 'sh_gold',     name: 'کتونی طلایی ✨', price: 600, c: '#F6B100' }
    ]},
    { key: 'glasses', label: 'عینک', items: [
      { id: 'g_none', name: 'بدون عینک', price: 0 },
      { id: 'g_round', name: 'عینک گرد 🤓', price: 20 },
      { id: 'g_sun',   name: 'عینک آفتابی 🕶', price: 40 },
      { id: 'g_star',  name: 'عینک ستاره 🌟', price: 80 },
      { id: 'g_gold',  name: 'عینک طلایی 💎', price: 200 }
    ]},
    { key: 'hat', label: 'کلاه', items: [
      { id: 'h_none',       name: 'بدون کلاه', price: 0 },
      { id: 'h_cap',        name: 'کلاه کپ',     price: 0 },
      { id: 'h_band',       name: 'هدبند',       price: 0 },
      { id: 'h_beanie',     name: 'کلاه بافت',   price: 30 },
      { id: 'h_headphones', name: 'هدفون 🎧',    price: 50 },
      { id: 'h_crown',      name: 'تاج طلایی 👑', price: 120 }
    ]},
    { key: 'bg', label: 'زمینه', items: [
      { id: 'b_yellow', name: 'زرد',       price: 0, c: '#FFE682' },
      { id: 'b_sky',    name: 'آسمانی',    price: 0, c: '#CDE9F8' },
      { id: 'b_pink',   name: 'صورتی',     price: 0, c: '#FBD3E0' },
      { id: 'b_green',  name: 'سبز ملایم', price: 0, c: '#D4F0DC' },
      { id: 'b_sunset', name: 'غروب 🌅',   price: 25, grad: ['#FF9A5A', '#FFD93D'] },
      { id: 'b_galaxy', name: 'کهکشانی 🌌', price: 35, grad: ['#6C4AB0', '#2C4A6E'] },
      { id: 'b_gold',   name: 'طلایی سلطنتی', price: 50, grad: ['#FFE682', '#F6B100'] }
    ]}
  ];

  var DEFAULTS = {
    skin: 's2', hair: 'h_short', hairColor: 'hc_black',
    eyes: 'e_normal', mouth: 'm_smile', outfit: 'o_tee_yellow',
    pants: 'p_shorts', shoes: 'sh_sneakers',
    glasses: 'g_none', hat: 'h_none', bg: 'b_yellow'
  };

  /* کلیدهای فشرده برای ارسال آواتار در پارتی */
  var COMPACT = { s: 'skin', h: 'hair', hc: 'hairColor', e: 'eyes', m: 'mouth', o: 'outfit', p: 'pants', sh: 'shoes', g: 'glasses', ht: 'hat', b: 'bg' };
  var EXPAND = {}; Object.keys(COMPACT).forEach(function (k) { EXPAND[COMPACT[k]] = k; });

  /* مهاجرت اکسسوری قدیمی (قبل از جداسازی عینک/کلاه) */
  var OLD_ACCESSORY = { a_cap: ['h_cap', 'g_none'], a_band: ['h_band', 'g_none'], a_beanie: ['h_beanie', 'g_none'], a_headphones: ['h_headphones', 'g_none'], a_crown: ['h_crown', 'g_none'], a_glasses: ['h_none', 'g_round'], a_sunglasses: ['h_none', 'g_sun'], a_none: ['h_none', 'g_none'] };

  /* ---------- ابزار ---------- */
  function itemOf(groupKey, id) {
    for (var g = 0; g < CATALOG.length; g++) {
      if (CATALOG[g].key !== groupKey) continue;
      for (var i = 0; i < CATALOG[g].items.length; i++) {
        if (CATALOG[g].items[i].id === id) return CATALOG[g].items[i];
      }
    }
    return null;
  }
  function colorOf(groupKey, id, fallback) {
    var it = itemOf(groupKey, id);
    return (it && it.c) ? it.c : fallback;
  }

  /* پیکربندی کامل با پرکردن مقادیر پیش‌فرض + مهاجرت فرمت قدیمی */
  function normalize(cfg) {
    cfg = cfg || {};
    /* مهاجرت اکسسوری قدیمی */
    if (cfg.accessory && OLD_ACCESSORY[cfg.accessory]) {
      if (!cfg.hat) cfg.hat = OLD_ACCESSORY[cfg.accessory][0];
      if (!cfg.glasses || cfg.glasses === 'g_none') cfg.glasses = OLD_ACCESSORY[cfg.accessory][1];
      delete cfg.accessory;
    }
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      var v = cfg[k];
      if (!v && COMPACT[EXPAND[k]] !== undefined && cfg[EXPAND[k]] !== undefined) v = cfg[EXPAND[k]];
      if (!v || !itemOf(k, v)) v = DEFAULTS[k];
      out[k] = v;
    });
    return out;
  }
  function compact(cfg) {
    cfg = normalize(cfg);
    var out = {};
    Object.keys(COMPACT).forEach(function (k) { out[k] = cfg[COMPACT[k]]; });
    return out;
  }

  /* ---------- زمینه ---------- */
  function bgSVG(id, uid, h) {
    var it = itemOf('bg', id) || itemOf('bg', DEFAULTS.bg);
    if (it.grad) {
      return '<defs><linearGradient id="bg' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + it.grad[0] + '"/><stop offset="1" stop-color="' + it.grad[1] + '"/>' +
        '</linearGradient></defs>' +
        '<rect x="0" y="0" width="200" height="' + h + '" fill="url(#bg' + uid + ')"/>';
    }
    return '<rect x="0" y="0" width="200" height="' + h + '" fill="' + it.c + '"/>';
  }

  /* ---------- مو (پشت سر) ---------- */
  function hairBackSVG(id, hc) {
    if (id === 'h_long') {
      return '<path d="M56,88 C52,38 148,38 144,88 L150,168 C142,156 134,166 126,158 C120,168 110,170 100,164 C90,170 80,168 74,158 C66,166 58,156 50,168 Z" fill="' + hc + '"/>';
    }
    if (id === 'h_pony') {
      return '<ellipse cx="147" cy="96" rx="11" ry="24" fill="' + hc + '" transform="rotate(-8 147 96)"/>';
    }
    if (id === 'h_wavy') {
      return '<ellipse cx="58" cy="112" rx="11" ry="22" fill="' + hc + '"/>' +
             '<ellipse cx="142" cy="112" rx="11" ry="22" fill="' + hc + '"/>';
    }
    return '';
  }
  /* گنب مو از پشت (برای نمای پشت) */
  function hairDomeSVG(hc) {
    return '<path d="M64,60 C62,26 138,26 136,60 C136,80 124,90 100,90 C76,90 64,80 64,60 Z" fill="' + hc + '"/>';
  }

  /* ---------- مو (جلوی سر) ---------- */
  function hairFrontSVG(id, hc) {
    var s = '';
    if (id === 'h_short') {
      s += '<path d="M60,86 C56,42 144,42 140,86 C136,60 120,50 100,50 C80,50 64,60 60,86 Z" fill="' + hc + '"/>';
    } else if (id === 'h_long') {
      s += '<path d="M60,74 C66,46 134,46 140,74 C126,58 74,58 60,74 Z" fill="' + hc + '"/>';
    } else if (id === 'h_curly') {
      s += '<circle cx="70" cy="62" r="15" fill="' + hc + '"/><circle cx="88" cy="52" r="16" fill="' + hc + '"/>' +
           '<circle cx="112" cy="52" r="16" fill="' + hc + '"/><circle cx="130" cy="62" r="15" fill="' + hc + '"/>' +
           '<circle cx="60" cy="76" r="12" fill="' + hc + '"/><circle cx="140" cy="76" r="12" fill="' + hc + '"/>';
    } else if (id === 'h_spiky') {
      s += '<path d="M60,84 L68,50 L80,70 L90,44 L100,68 L110,44 L120,70 L132,50 L140,84 C132,54 68,54 60,84 Z" fill="' + hc + '"/>';
    } else if (id === 'h_pony') {
      s += '<path d="M60,86 C56,42 144,42 140,86 C136,60 120,50 100,50 C80,50 64,60 60,86 Z" fill="' + hc + '"/>' +
           '<circle cx="143" cy="62" r="12" fill="' + hc + '"/>';
    } else if (id === 'h_afro') {
      s += '<circle cx="100" cy="54" r="34" fill="' + hc + '"/>' +
           '<circle cx="66" cy="68" r="17" fill="' + hc + '"/><circle cx="134" cy="68" r="17" fill="' + hc + '"/>';
    } else if (id === 'h_wavy') {
      s += '<path d="M60,88 C56,40 144,40 140,88 C136,66 124,54 100,54 C76,54 64,66 60,88 Z" fill="' + hc + '"/>' +
           '<ellipse cx="58" cy="112" rx="11" ry="22" fill="' + hc + '"/>' +
           '<ellipse cx="142" cy="112" rx="11" ry="22" fill="' + hc + '"/>';
    }
    if (id !== 'h_bald' && id !== 'h_afro') {
      s += '<path d="M78,54 Q90,48 104,51" stroke="rgba(255,255,255,.35)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    }
    return s;
  }

  /* ---------- چشم‌ها و دهان ---------- */
  function eyesSVG(id) {
    var ink = '#2B1A0E';
    if (id === 'e_happy') {
      return '<path d="M76,88 Q84,79 92,88" stroke="' + ink + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
             '<path d="M108,88 Q116,79 124,88" stroke="' + ink + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    }
    if (id === 'e_wink') {
      return '<circle cx="84" cy="88" r="5" fill="' + ink + '"/>' +
             '<path d="M108,88 Q116,80 124,88" stroke="' + ink + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    }
    if (id === 'e_big') {
      return '<circle cx="84" cy="88" r="7.5" fill="#fff" stroke="' + ink + '" stroke-width="2"/>' +
             '<circle cx="84" cy="88" r="3.6" fill="' + ink + '"/>' +
             '<circle cx="116" cy="88" r="7.5" fill="#fff" stroke="' + ink + '" stroke-width="2"/>' +
             '<circle cx="116" cy="88" r="3.6" fill="' + ink + '"/>';
    }
    if (id === 'e_surprised') {
      return '<circle cx="84" cy="88" r="8" fill="#fff" stroke="' + ink + '" stroke-width="2"/>' +
             '<circle cx="84" cy="90" r="3" fill="' + ink + '"/>' +
             '<circle cx="116" cy="88" r="8" fill="#fff" stroke="' + ink + '" stroke-width="2"/>' +
             '<circle cx="116" cy="90" r="3" fill="' + ink + '"/>';
    }
    if (id === 'e_star') {
      var star = function (cx) {
        return 'M' + cx + ',79 L' + (cx + 2.2) + ',85.5 L' + (cx + 9) + ',86 L' + (cx + 3.8) + ',90 L' + (cx + 5.5) + ',96.5 L' + cx + ',92.5 L' + (cx - 5.5) + ',96.5 L' + (cx - 3.8) + ',90 L' + (cx - 9) + ',86 L' + (cx - 2.2) + ',85.5 Z';
      };
      return '<path d="' + star(84) + '" fill="#FFB800" stroke="#B8860B" stroke-width="1.4"/>' +
             '<path d="' + star(116) + '" fill="#FFB800" stroke="#B8860B" stroke-width="1.4"/>';
    }
    return '<circle cx="84" cy="88" r="5" fill="' + ink + '"/><circle cx="85.8" cy="86.2" r="1.6" fill="#fff"/>' +
           '<circle cx="116" cy="88" r="5" fill="' + ink + '"/><circle cx="117.8" cy="86.2" r="1.6" fill="#fff"/>';
  }

  function mouthSVG(id) {
    if (id === 'm_smile')  return '<path d="M86,102 Q100,114 114,102" stroke="#7A3B2E" stroke-width="4" fill="none" stroke-linecap="round"/>';
    if (id === 'm_smirk')  return '<path d="M88,104 Q100,112 112,102" stroke="#7A3B2E" stroke-width="4" fill="none" stroke-linecap="round"/>';
    if (id === 'm_frown')  return '<path d="M86,110 Q100,100 114,110" stroke="#7A3B2E" stroke-width="4" fill="none" stroke-linecap="round"/>';
    if (id === 'm_o')      return '<ellipse cx="100" cy="106" rx="6" ry="8" fill="#7A3B2E"/>';
    if (id === 'm_tongue') return '<path d="M87,101 Q100,112 113,101" stroke="#7A3B2E" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M93,106 Q100,119 107,106 Q100,111 93,106 Z" fill="#F06292"/>';
    if (id === 'm_grin')   return '<path d="M83,100 Q100,120 117,100 Z" fill="#FFFDF5" stroke="#7A3B2E" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<path d="M84,102 L116,102" stroke="#7A3B2E" stroke-width="1.5"/>';
    return '<path d="M86,102 Q100,114 114,102" stroke="#7A3B2E" stroke-width="4" fill="none" stroke-linecap="round"/>';
  }

  /* ---------- عینک ---------- */
  function glassesSVG(id) {
    if (id === 'g_round') {
      return '<circle cx="84" cy="88" r="13" fill="rgba(255,255,255,.3)" stroke="#5A3A22" stroke-width="3"/>' +
             '<circle cx="116" cy="88" r="13" fill="rgba(255,255,255,.3)" stroke="#5A3A22" stroke-width="3"/>' +
             '<path d="M97,88 L103,88 M71,84 L63,86 M129,84 L137,86" stroke="#5A3A22" stroke-width="3" stroke-linecap="round"/>';
    }
    if (id === 'g_sun') {
      return '<rect x="68" y="79" width="30" height="19" rx="8" fill="#2B1A0E"/>' +
             '<rect x="102" y="79" width="30" height="19" rx="8" fill="#2B1A0E"/>' +
             '<path d="M98,84 L102,84 M68,84 L60,86 M132,84 L140,86" stroke="#2B1A0E" stroke-width="3.5" stroke-linecap="round"/>' +
             '<path d="M72,83 L84,83" stroke="rgba(255,255,255,.45)" stroke-width="3" stroke-linecap="round"/>';
    }
    if (id === 'g_star') {
      var lens = function (cx) {
        return 'M' + cx + ',76 L' + (cx + 3.4) + ',84.4 L' + (cx + 12.5) + ',85 L' + (cx + 5.8) + ',90.6 L' + (cx + 8.4) + ',99.4 L' + cx + ',94.5 L' + (cx - 8.4) + ',99.4 L' + (cx - 5.8) + ',90.6 L' + (cx - 12.5) + ',85 L' + (cx - 3.4) + ',84.4 Z';
      };
      return '<path d="' + lens(84) + '" fill="rgba(255,138,180,.85)" stroke="#C2185B" stroke-width="2"/>' +
             '<path d="' + lens(116) + '" fill="rgba(255,138,180,.85)" stroke="#C2185B" stroke-width="2"/>' +
             '<path d="M97,87 L103,87 M72,84 L64,86 M128,84 L136,86" stroke="#C2185B" stroke-width="2.5" stroke-linecap="round"/>';
    }
    if (id === 'g_gold') {
      return '<defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">' +
             '<stop offset="0" stop-color="#FFE682"/><stop offset="1" stop-color="#C98A00"/></linearGradient></defs>' +
             '<rect x="66" y="78" width="32" height="20" rx="9" fill="url(#gg)" stroke="#B8860B" stroke-width="2.5"/>' +
             '<rect x="102" y="78" width="32" height="20" rx="9" fill="url(#gg)" stroke="#B8860B" stroke-width="2.5"/>' +
             '<path d="M98,84 L102,84 M66,84 L58,86 M134,84 L142,86" stroke="#B8860B" stroke-width="3" stroke-linecap="round"/>' +
             '<path d="M70,82 L80,82" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"/>' +
             '<path d="M106,82 L114,82" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"/>' +
             '<path d="M120,80 L124,76 M126,84 L129,81" stroke="#FFFDF5" stroke-width="2" stroke-linecap="round"/>';
    }
    return '';
  }

  /* ---------- کلاه ---------- */
  function hatSVG(id) {
    if (id === 'h_cap') {
      return '<path d="M58,72 C60,40 140,40 142,72 Z" fill="#F6B100"/>' +
             '<path d="M60,70 L26,70 Q21,77 28,80 L60,80 Z" fill="#E09E00"/>' +
             '<circle cx="100" cy="42" r="5" fill="#E09E00"/>';
    }
    if (id === 'h_band') {
      return '<rect x="59" y="62" width="82" height="11" rx="5.5" fill="#FF5E00"/>' +
             '<circle cx="100" cy="67" r="4" fill="#FFE682"/>';
    }
    if (id === 'h_headphones') {
      return '<path d="M58,86 C56,36 144,36 142,86" stroke="#3E2610" stroke-width="9" fill="none" stroke-linecap="round"/>' +
             '<rect x="48" y="78" width="16" height="24" rx="7" fill="#F6B100" stroke="#3E2610" stroke-width="2.5"/>' +
             '<rect x="136" y="78" width="16" height="24" rx="7" fill="#F6B100" stroke="#3E2610" stroke-width="2.5"/>';
    }
    if (id === 'h_beanie') {
      return '<path d="M58,70 C58,36 142,36 142,70 Z" fill="#E85D75"/>' +
             '<rect x="55" y="62" width="90" height="15" rx="7.5" fill="#C94A61"/>' +
             '<circle cx="100" cy="30" r="9" fill="#FFFDF5"/>';
    }
    if (id === 'h_crown') {
      return '<path d="M60,58 L72,32 L86,50 L100,26 L114,50 L128,32 L140,58 Z" fill="#FFD700" stroke="#B8860B" stroke-width="2.5" stroke-linejoin="round"/>' +
             '<rect x="58" y="56" width="84" height="10" rx="4" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>' +
             '<circle cx="100" cy="60" r="3.4" fill="#E74C3C"/><circle cx="76" cy="60" r="2.6" fill="#2E86DE"/><circle cx="124" cy="60" r="2.6" fill="#2E86DE"/>';
    }
    return '';
  }
  /* کلاه از پشت (بدون لبه و جزئیات جلو) */
  function hatBackSVG(id) {
    if (id === 'h_cap') {
      return '<path d="M58,72 C60,40 140,40 142,72 Z" fill="#F6B100"/>' +
             '<rect x="58" y="66" width="84" height="6" rx="3" fill="#E09E00"/>';
    }
    if (id === 'h_band') {
      return '<rect x="59" y="62" width="82" height="11" rx="5.5" fill="#FF5E00"/>';
    }
    if (id === 'h_headphones') {
      return '<path d="M58,86 C56,36 144,36 142,86" stroke="#3E2610" stroke-width="9" fill="none" stroke-linecap="round"/>' +
             '<rect x="48" y="78" width="16" height="24" rx="7" fill="#F6B100" stroke="#3E2610" stroke-width="2.5"/>' +
             '<rect x="136" y="78" width="16" height="24" rx="7" fill="#F6B100" stroke="#3E2610" stroke-width="2.5"/>';
    }
    if (id === 'h_beanie') {
      return '<path d="M58,70 C58,36 142,36 142,70 Z" fill="#E85D75"/>' +
             '<rect x="55" y="62" width="90" height="15" rx="7.5" fill="#C94A61"/>';
    }
    if (id === 'h_crown') {
      return '<path d="M60,58 L72,32 L86,50 L100,26 L114,50 L128,32 L140,58 Z" fill="#FFD700" stroke="#B8860B" stroke-width="2.5" stroke-linejoin="round"/>' +
             '<rect x="58" y="56" width="84" height="10" rx="4" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>';
    }
    return '';
  }

  /* ---------- پیراهن (بالاتنه) — سینهٔ نیم‌تنه ---------- */
  var BUST_TORSO = 'M28,200 C30,158 62,144 100,144 C138,144 170,158 172,200 Z';
  function bustOutfitSVG(id) {
    var it = itemOf('outfit', id) || itemOf('outfit', DEFAULTS.outfit);
    var s = '';
    if (id === 'o_cape') {
      s += '<path d="M18,200 C26,150 58,138 100,138 C142,138 174,150 182,200 Z" fill="#C0392B"/>';
      s += '<path d="' + BUST_TORSO + '" fill="#8E2A20"/>';
      s += '<circle cx="100" cy="170" r="13" fill="#FFD93D" stroke="#B8860B" stroke-width="2"/>';
      s += '<path d="M94,170 L98,164 L100,170 L102,164 L106,170 L100,176 Z" fill="#B8860B"/>';
    } else if (id === 'o_suit') {
      s += '<path d="' + BUST_TORSO + '" fill="' + it.c + '"/>';
      s += '<path d="M84,146 L100,178 L116,146 L108,142 L92,142 Z" fill="#FFFDF5"/>';
      s += '<path d="M96,148 L104,148 L102,170 L100,175 L98,170 Z" fill="#C0392B"/>';
      s += '<path d="M84,146 L100,178 L90,142 Z" fill="#5D3A1A"/>';
      s += '<path d="M116,146 L100,178 L110,142 Z" fill="#5D3A1A"/>';
    } else if (id === 'o_gold_suit') {
      s += '<path d="' + BUST_TORSO + '" fill="' + it.c + '"/>';
      s += '<path d="M84,146 L100,178 L116,146 L108,142 L92,142 Z" fill="#FFFDF5"/>';
      s += '<path d="M96,148 L104,148 L102,170 L100,175 L98,170 Z" fill="#2B1A0E"/>';
      s += '<path d="M84,146 L100,178 L90,142 Z" fill="#B87900"/>';
      s += '<path d="M116,146 L100,178 L110,142 Z" fill="#B87900"/>';
      s += '<path d="M40,164 l3,6 6,3 -6,3 -3,6 -3,-6 -6,-3 6,-3 Z" fill="#FFFDF5"/>';
    } else if (id === 'o_jersey') {
      s += '<path d="' + BUST_TORSO + '" fill="' + it.c + '"/>';
      s += '<path d="M30,186 L58,178 L58,186 L30,194 Z" fill="#FFD93D"/>';
      s += '<path d="M170,186 L142,178 L142,186 L170,194 Z" fill="#FFD93D"/>';
      s += '<path d="M84,146 L100,156 L116,146 L112,142 L88,142 Z" fill="#FFD93D"/>';
    } else if (id === 'o_hoodie') {
      s += '<ellipse cx="100" cy="146" rx="36" ry="15" fill="#E8701F"/>';
      s += '<path d="' + BUST_TORSO + '" fill="' + it.c + '"/>';
      s += '<path d="M84,148 L100,160 L116,148 L112,143 L88,143 Z" fill="#E8701F"/>';
      s += '<path d="M94,158 L92,180" stroke="#FFFDF5" stroke-width="3" stroke-linecap="round" fill="none"/>';
      s += '<path d="M106,158 L108,180" stroke="#FFFDF5" stroke-width="3" stroke-linecap="round" fill="none"/>';
    } else if (id === 'o_stripes') {
      s += '<path d="' + BUST_TORSO + '" fill="#FFFDF5"/>';
      s += '<clipPath id="bst"><path d="' + BUST_TORSO + '"/></clipPath>';
      s += '<g clip-path="url(#bst)"><rect x="24" y="158" width="152" height="9" fill="#2C4A6E"/>' +
           '<rect x="24" y="176" width="152" height="9" fill="#2C4A6E"/>' +
           '<rect x="24" y="194" width="152" height="9" fill="#2C4A6E"/></g>';
    } else if (id === 'o_varsity') {
      s += '<path d="' + BUST_TORSO + '" fill="' + it.c + '"/>';
      s += '<ellipse cx="40" cy="172" rx="16" ry="30" fill="#D93A3A"/>';
      s += '<ellipse cx="160" cy="172" rx="16" ry="30" fill="#D93A3A"/>';
      s += '<path d="M84,146 L100,158 L116,146 L112,142 L88,142 Z" fill="#D93A3A"/>';
      s += '<text x="100" y="184" font-size="30" font-weight="900" text-anchor="middle" fill="#D93A3A" font-family="Vazirmatn, Tahoma">B</text>';
    } else if (id === 'o_banana') {
      s += '<path d="' + BUST_TORSO + '" fill="' + it.c + '"/>';
      s += '<circle cx="34" cy="196" r="14" fill="#8B5E2B"/>';
      s += '<circle cx="166" cy="196" r="14" fill="#8B5E2B"/>';
      s += '<path d="M84,150 Q100,142 116,150" stroke="#8B5E2B" stroke-width="5" fill="none" stroke-linecap="round"/>';
      s += '<path d="M62,172 Q70,180 80,174" stroke="#C9A227" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else { /* تیشرت‌ها */
      s += '<path d="' + BUST_TORSO + '" fill="' + it.c + '"/>';
      s += '<path d="M84,146 L100,158 L116,146" stroke="rgba(62,38,16,.35)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    }
    return s;
  }

  /* ============================================================
     🧍 بدن تمام‌قد — سه زاویه
     viewBox: 0 0 200 340  |  سر = سرِ نیم‌تنه با translate(0,-30)
     ============================================================ */
  var FB_TORSO = 'M38,196 C40,132 62,102 100,102 C138,102 160,132 162,196 C162,202 157,206 150,206 L50,206 C43,206 38,202 38,196 Z';
  var FB_ARM_L = 'M54,118 C42,148 40,172 46,198';
  var FB_ARM_R = 'M146,118 C158,148 160,172 154,198';

  function sparkles(x, y, cls) {
    return '<path class="sp" d="M' + x + ',' + y + ' l2.6,5.4 5.4,2.6 -5.4,2.6 -2.6,5.4 -2.6,-5.4 -5.4,-2.6 5.4,-2.6 Z" fill="#FFFDF5" opacity=".95"/>' +
           '<path class="sp2" d="M' + (x + 14) + ',' + (y - 10) + ' l1.8,3.8 3.8,1.8 -3.8,1.8 -1.8,3.8 -1.8,-3.8 -3.8,-1.8 3.8,-1.8 Z" fill="#FFFDF5" opacity=".8"/>';
  }

  /* پیراهن تمام‌قد (تُرس + آستین‌ها) */
  function fbOutfitSVG(id, uid, view) {
    var it = itemOf('outfit', id) || itemOf('outfit', DEFAULTS.outfit);
    var s = '';
    var sleeves = function (c) {
      return '<ellipse cx="53" cy="122" rx="11" ry="16" fill="' + c + '" transform="rotate(16 53 122)"/>' +
             '<ellipse cx="147" cy="122" rx="11" ry="16" fill="' + c + '" transform="rotate(-16 147 122)"/>';
    };
    if (view === 'back' && id === 'o_cape') {
      /* شنل از پشت، تُرس را می‌پوشاند */
      s += '<path d="M42,104 C68,94 132,94 158,104 L168,224 C138,208 62,208 32,224 Z" fill="#C0392B"/>';
      s += '<path d="M100,140 L106,158 L124,160 L110,172 L114,190 L100,180 L86,190 L90,172 L76,160 L94,158 Z" fill="#FFD93D" stroke="#B8860B" stroke-width="2"/>';
      return s;
    }
    if (view !== 'back' && id === 'o_cape') {
      s += '<path d="M44,106 C70,96 130,96 156,106 L164,220 C136,204 64,204 36,220 Z" fill="#A93226"/>';
    }
    s += '<path d="' + FB_TORSO + '" fill="' + it.c + '"/>';

    /* نمای پشت: فقط خود پیراهن + آستین، بدون جزئیات جلو (یقه، کراوات، شماره و…) */
    if (view === 'back') {
      if (id === 'o_cape') return s; /* شنل بالاتر مدیریت شد */
      if (id === 'o_gold_suit' || id === 'o_suit') {
        s += sleeves(itemOf('outfit', id).c);
        return s;
      }
      s += sleeves(it.c);
      if (id === 'o_stripes') {
        s += '<clipPath id="bbk' + uid + '"><path d="' + FB_TORSO + '"/></clipPath>';
        s += '<g clip-path="url(#bbk' + uid + ')">' +
             '<rect x="30" y="126" width="140" height="10" fill="#2C4A6E"/>' +
             '<rect x="30" y="148" width="140" height="10" fill="#2C4A6E"/>' +
             '<rect x="30" y="170" width="140" height="10" fill="#2C4A6E"/>' +
             '<rect x="30" y="192" width="140" height="10" fill="#2C4A6E"/></g>';
      }
      if (id === 'o_gold_suit') {
        s += sparkles(52, 150) + sparkles(146, 178);
      }
      return s;
    }

    if (id === 'o_suit') {
      s += '<path d="M84,104 L100,150 L116,104 L108,100 L92,100 Z" fill="#FFFDF5"/>';
      s += '<path d="M97,106 L103,106 L101,136 L100,142 L99,136 Z" fill="#C0392B"/>';
      s += '<path d="M84,104 L100,150 L91,101 Z" fill="#5D3A1A"/>';
      s += '<path d="M116,104 L100,150 L109,101 Z" fill="#5D3A1A"/>';
      s += '<circle cx="100" cy="158" r="2.5" fill="#B87900"/><circle cx="100" cy="172" r="2.5" fill="#B87900"/>';
      s += sleeves(it.c);
    } else if (id === 'o_gold_suit') {
      s += '<defs><linearGradient id="gs' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0" stop-color="#FFE682"/><stop offset=".5" stop-color="#F6B100"/><stop offset="1" stop-color="#C98A00"/></linearGradient></defs>';
      s += '<path d="' + FB_TORSO + '" fill="url(#gs' + uid + ')"/>';
      s += '<path d="M84,104 L100,150 L116,104 L108,100 L92,100 Z" fill="#FFFDF5"/>';
      s += '<path d="M97,106 L103,106 L101,136 L100,142 L99,136 Z" fill="#2B1A0E"/>';
      s += '<path d="M84,104 L100,150 L91,101 Z" fill="#B87900"/>';
      s += '<path d="M116,104 L100,150 L109,101 Z" fill="#B87900"/>';
      s += sleeves('url(#gs' + uid + ')');
      s += sparkles(52, 150) + sparkles(146, 178);
    } else if (id === 'o_jersey') {
      s += '<path d="M38,120 L64,112 L64,122 L38,130 Z" fill="#FFD93D"/>';
      s += '<path d="M162,120 L136,112 L136,122 L162,130 Z" fill="#FFD93D"/>';
      s += '<path d="M84,104 L100,116 L116,104 L112,100 L88,100 Z" fill="#FFD93D"/>';
      s += '<text x="100" y="182" font-size="40" font-weight="900" text-anchor="middle" fill="#FFD93D" font-family="Vazirmatn, Tahoma">۷</text>';
      s += sleeves(it.c);
    } else if (id === 'o_hoodie') {
      s += '<ellipse cx="100" cy="104" rx="32" ry="13" fill="#E8701F"/>';
      s += '<path d="M86,110 L100,124 L114,110 L110,104 L90,104 Z" fill="#E8701F"/>';
      s += '<path d="M95,124 L93,148" stroke="#FFFDF5" stroke-width="3.5" stroke-linecap="round" fill="none"/>';
      s += '<path d="M105,124 L107,148" stroke="#FFFDF5" stroke-width="3.5" stroke-linecap="round" fill="none"/>';
      s += '<rect x="76" y="162" width="48" height="30" rx="9" fill="rgba(62,38,16,.18)"/>';
      s += sleeves(it.c);
    } else if (id === 'o_stripes') {
      s += '<clipPath id="bt' + uid + '"><path d="' + FB_TORSO + '"/></clipPath>';
      s += '<g clip-path="url(#bt' + uid + ')">' +
           '<rect x="30" y="126" width="140" height="10" fill="#2C4A6E"/>' +
           '<rect x="30" y="148" width="140" height="10" fill="#2C4A6E"/>' +
           '<rect x="30" y="170" width="140" height="10" fill="#2C4A6E"/>' +
           '<rect x="30" y="192" width="140" height="10" fill="#2C4A6E"/></g>';
      s += sleeves('#FFFDF5');
    } else if (id === 'o_varsity') {
      s += sleeves('#D93A3A');
      s += '<path d="M84,104 L100,116 L116,104 L112,100 L88,100 Z" fill="#D93A3A"/>';
      s += '<rect x="36" y="186" width="32" height="8" rx="4" fill="#D93A3A"/>';
      s += '<rect x="132" y="186" width="32" height="8" rx="4" fill="#D93A3A"/>';
      s += '<text x="100" y="182" font-size="34" font-weight="900" text-anchor="middle" fill="#D93A3A" font-family="Vazirmatn, Tahoma">B</text>';
    } else if (id === 'o_cape') {
      s += '<path d="' + FB_TORSO + '" fill="#8E2A20"/>';
      s += '<circle cx="100" cy="146" r="15" fill="#FFD93D" stroke="#B8860B" stroke-width="2.5"/>';
      s += '<path d="M92,146 L97,139 L100,146 L103,139 L108,146 L100,153 Z" fill="#B8860B"/>';
      s += '<rect x="68" y="188" width="64" height="13" rx="6.5" fill="#FFD93D" stroke="#B8860B" stroke-width="2"/>';
      s += sleeves('#8E2A20');
    } else if (id === 'o_banana') {
      s += sleeves(it.c);
      s += '<path d="M86,106 Q100,98 114,106" stroke="#8B5E2B" stroke-width="5" fill="none" stroke-linecap="round"/>';
      s += '<path d="M58,168 Q68,176 80,170" stroke="#C9A227" stroke-width="4" fill="none" stroke-linecap="round"/>';
      s += '<path d="M120,170 Q130,176 142,170" stroke="#C9A227" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else { /* تیشرت‌ها */
      s += '<path d="M84,104 L100,118 L116,104" stroke="rgba(62,38,16,.35)" stroke-width="4" fill="none" stroke-linecap="round"/>';
      s += sleeves(it.c);
    }
    return s;
  }

  /* شلوار تمام‌قد */
  function fbPantsSVG(id, view) {
    var it = itemOf('pants', id) || itemOf('pants', DEFAULTS.pants);
    var c = it.c;
    var s = '<rect x="62" y="186" width="76" height="16" rx="7" fill="' + c + '"/>';
    if (id === 'p_shorts') {
      s += '<rect x="63" y="196" width="32" height="46" rx="10" fill="' + c + '"/>';
      s += '<rect x="105" y="196" width="32" height="46" rx="10" fill="' + c + '"/>';
      s += '<path d="M99,196 L99,226" stroke="rgba(62,38,16,.25)" stroke-width="3"/>';
    } else if (id === 'p_jeans') {
      s += '<rect x="63" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      s += '<rect x="105" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      s += '<rect x="63" y="286" width="32" height="10" rx="5" fill="#3E5A85"/>';
      s += '<rect x="105" y="286" width="32" height="10" rx="5" fill="#3E5A85"/>';
      s += '<path d="M76,196 Q82,206 88,196" stroke="#3E5A85" stroke-width="3" fill="none"/>';
    } else if (id === 'p_track') {
      s += '<rect x="63" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      s += '<rect x="105" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      if (view !== 'back') {
        s += '<rect x="66" y="198" width="7" height="102" fill="#FFFDF5"/>';
        s += '<rect x="127" y="198" width="7" height="102" fill="#FFFDF5"/>';
      }
    } else if (id === 'p_cargo') {
      s += '<rect x="63" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      s += '<rect x="105" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      if (view !== 'back') {
        s += '<rect x="64" y="218" width="20" height="16" rx="4" fill="none" stroke="rgba(62,38,16,.35)" stroke-width="2.5"/>';
        s += '<rect x="116" y="218" width="20" height="16" rx="4" fill="none" stroke="rgba(62,38,16,.35)" stroke-width="2.5"/>';
      }
    } else if (id === 'p_gold') {
      s += '<rect x="63" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      s += '<rect x="105" y="196" width="32" height="106" rx="11" fill="' + c + '"/>';
      s += '<rect x="62" y="186" width="76" height="16" rx="7" fill="#B87900"/>';
      s += sparkles(56, 230) + sparkles(146, 260);
    }
    return s;
  }

  /* کفش — جفت پا ایستاده */
  function fbShoesSVG(id) {
    var it = itemOf('shoes', id) || itemOf('shoes', DEFAULTS.shoes);
    var c = it.c;
    var s = '';
    function shoe(x, rot) {
      var o = '<g transform="rotate(' + rot + ' ' + (x + 17) + ' 310)">';
      o += '<rect x="' + x + '" y="296" width="34" height="24" rx="9" fill="' + c + '" stroke="rgba(62,38,16,.28)" stroke-width="2"/>';
      o += '<rect x="' + x + '" y="312" width="34" height="8" rx="4" fill="rgba(62,38,16,.30)"/>';
      if (id === 'sh_sneakers') o += '<rect x="' + (x + 4) + '" y="300" width="26" height="5" rx="2.5" fill="#FFD93D"/>';
      if (id === 'sh_sport') o += '<path d="M' + (x + 6) + ',302 L' + (x + 28) + ',302" stroke="#FFFDF5" stroke-width="4" stroke-linecap="round"/>';
      if (id === 'sh_boot') o += '<path d="M' + (x + 10) + ',300 L' + (x + 10) + ',292 M' + (x + 20) + ',300 L' + (x + 20) + ',292" stroke="#3E2610" stroke-width="2.5" stroke-linecap="round"/>';
      if (id === 'sh_gold') o += '<path d="M' + (x + 8) + ',301 L' + (x + 20) + ',301" stroke="rgba(255,255,255,.75)" stroke-width="3" stroke-linecap="round"/>';
      o += '</g>';
      return o;
    }
    s += shoe(58, -3) + shoe(108, 3);
    if (id === 'sh_gold') s += sparkles(52, 286) + sparkles(142, 290);
    return s;
  }

  /* ---------- رندر نیم‌تنه (چیپ‌های کوچک) ---------- */
  var uidCounter = 0;
  function render(cfg, opts) {
    cfg = normalize(cfg);
    opts = opts || {};
    uidCounter = (uidCounter + 1) % 100000;
    var uid = 'a' + uidCounter;
    var skin = colorOf('skin', cfg.skin, '#F7CBA4');
    var hc = colorOf('hairColor', cfg.hairColor, '#2B1A0E');
    var size = opts.size || 120;
    var cls = opts.cls ? ' class="' + opts.cls + '"' : '';

    var svg =
      '<svg' + cls + ' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="' + size + '" height="' + size + '" role="img" aria-label="آواتار">' +
      bgSVG(cfg.bg, uid, 200) +
      '<ellipse cx="100" cy="196" rx="66" ry="10" fill="rgba(62,38,16,.14)"/>' +
      hairBackSVG(cfg.hair, hc) +
      '<rect x="87" y="112" width="26" height="30" rx="9" fill="' + skin + '"/>' +
      '<ellipse cx="100" cy="86" rx="38" ry="42" fill="' + skin + '"/>' +
      '<circle cx="61" cy="90" r="7" fill="' + skin + '"/>' +
      '<circle cx="139" cy="90" r="7" fill="' + skin + '"/>' +
      '<circle cx="74" cy="100" r="6" fill="rgba(240,98,146,.25)"/>' +
      '<circle cx="126" cy="100" r="6" fill="rgba(240,98,146,.25)"/>' +
      (cfg.hair === 'h_bald' ? '' :
        '<path d="M76,73 Q84,69 92,72" stroke="#5A3A22" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M108,72 Q116,69 124,73" stroke="#5A3A22" stroke-width="3" fill="none" stroke-linecap="round"/>') +
      eyesSVG(cfg.eyes) +
      mouthSVG(cfg.mouth) +
      hairFrontSVG(cfg.hair, hc) +
      glassesSVG(cfg.glasses) +
      hatSVG(cfg.hat) +
      bustOutfitSVG(cfg.outfit) +
      '</svg>';
    return svg;
  }

  /* ---------- رندر تمام‌قد ---------- */
  function renderFull(cfg, opts) {
    cfg = normalize(cfg);
    opts = opts || {};
    uidCounter = (uidCounter + 1) % 100000;
    var uid = 'f' + uidCounter;
    var skin = colorOf('skin', cfg.skin, '#F7CBA4');
    var hc = colorOf('hairColor', cfg.hairColor, '#2B1A0E');
    var view = (opts.view === 'side' || opts.view === 'back') ? opts.view : 'front';
    var size = opts.size || 240;
    var focus = opts.focus || 'full';
    var VB = { full: [0, 0, 200, 340], stage: [28, 0, 144, 340], face: [18, 2, 164, 122], top: [16, 84, 168, 140], legs: [36, 178, 128, 158] }[focus] || [0, 0, 200, 340];
    var w = Math.round(size * VB[2] / VB[3]);
    var cls = opts.cls ? ' class="' + opts.cls + '"' : '';

    var back = (view === 'back');
    var squash = view === 'side' ? '<g transform="translate(100,0) scale(.86,1) translate(-100,0)">' : '<g>';

    var head = '';
    if (view === 'side') {
      /* نیم‌رخ: یک چشم، یک لُپ، دهان کوچک‌تر */
      head =
        '<path d="M100,73 Q108,69 116,72" stroke="#5A3A22" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="112" cy="88" r="5" fill="#2B1A0E"/><circle cx="113.8" cy="86.2" r="1.6" fill="#fff"/>' +
        '<circle cx="112" cy="102" r="6" fill="rgba(240,98,146,.25)"/>' +
        '<path d="M102,105 Q110,113 118,104" stroke="#7A3B2E" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else if (!back) {
      head +=
        '<path d="M76,73 Q84,69 92,72" stroke="#5A3A22" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M108,72 Q116,69 124,73" stroke="#5A3A22" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        eyesSVG(cfg.eyes) +
        mouthSVG(cfg.mouth) +
        '<circle cx="74" cy="100" r="6" fill="rgba(240,98,146,.25)"/>' +
        '<circle cx="126" cy="100" r="6" fill="rgba(240,98,146,.25)"/>';
    }
    var ears = '<circle cx="61" cy="90" r="7" fill="' + skin + '"/>' +
      (view === 'side' ? '' : '<circle cx="139" cy="90" r="7" fill="' + skin + '"/>');
    var hairF = back
      ? hairDomeSVG(hc) + hairFrontSVG(cfg.hair, hc) +
        (cfg.hair === 'h_long' || cfg.hair === 'h_wavy' ? hairBackSVG(cfg.hair, hc) : '')
      : hairFrontSVG(cfg.hair, hc);
    if (back && cfg.hair === 'h_pony') {
      hairF += '<ellipse cx="100" cy="126" rx="13" ry="30" fill="' + hc + '"/>';
    }

    var svg =
      '<svg' + cls + ' xmlns="http://www.w3.org/2000/svg" viewBox="' + VB.join(' ') + '" width="' + w + '" height="' + size + '" role="img" aria-label="آواتار تمام‌قد">' +
      '<defs>' +
        '<linearGradient id="fbg' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="rgba(255,255,255,0)"/><stop offset="1" stop-color="rgba(62,38,16,.10)"/>' +
        '</linearGradient>' +
      '</defs>' +
      bgSVG(cfg.bg, uid, 340) +
      '<rect x="0" y="300" width="200" height="40" fill="url(#fbg' + uid + ')"/>' +
      '<ellipse cx="100" cy="327" rx="64" ry="9" fill="rgba(62,38,16,.16)"/>' +
      squash +
        /* پاها (پوست) */
        '<rect x="64" y="188" width="30" height="112" rx="14" fill="' + skin + '"/>' +
        '<rect x="106" y="188" width="30" height="112" rx="14" fill="' + skin + '"/>' +
        /* بازوها (پوست) */
        '<path d="' + FB_ARM_L + '" stroke="' + skin + '" stroke-width="15" fill="none" stroke-linecap="round"/>' +
        '<path d="' + FB_ARM_R + '" stroke="' + skin + '" stroke-width="15" fill="none" stroke-linecap="round"/>' +
        /* گردن */
        '<rect x="87" y="82" width="26" height="30" rx="9" fill="' + skin + '"/>' +
        /* شلوار و پیراهن */
        fbPantsSVG(cfg.pants, view) +
        fbOutfitSVG(cfg.outfit, uid, view) +
        /* کفش */
        fbShoesSVG(cfg.shoes) +
        /* سر (همان هندسهٔ نیم‌تنه با جابه‌جایی -30) */
        '<g transform="translate(0,-30)">' +
          hairBackSVG(cfg.hair, hc) +
          '<ellipse cx="100" cy="86" rx="38" ry="42" fill="' + skin + '"/>' +
          ears +
          head +
          hairF +
          (back ? '' : glassesSVG(cfg.glasses)) +
          (back ? hatBackSVG(cfg.hat) : hatSVG(cfg.hat)) +
        '</g>' +
      '</g>' +
      '</svg>';
    return svg;
  }

  /* ---------- API عمومی ---------- */
  window.BQAvatar = {
    CATALOG: CATALOG,
    DEFAULTS: DEFAULTS,
    render: render,
    renderFull: renderFull,
    normalize: normalize,
    compact: compact,
    itemOf: itemOf,
    isFree: function (groupKey, id) {
      var it = itemOf(groupKey, id);
      return !!it && it.price === 0;
    },
    priceOf: function (groupKey, id) {
      var it = itemOf(groupKey, id);
      return it ? it.price : null;
    }
  };
})();
