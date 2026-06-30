/* ══════════════════════════════════════════════════════════════════
   kp-tool-idolfinder.js — client IIFE for the K-pop Idol Birthday &
   Zodiac Matcher (module K09). Self-contained, no framework, no network.

   Reads three globals injected by the page (server-rendered, inlined):
     window.KP_IDOLS     : [{ n:name, g:groupNameEn, b:"YYYY-MM-DD", e:emoji }]
                           — 191 verified idol birthday records.
     window.KP_TOOL_I18N : the active-language string bundle (see
                           kpop-tools-l10n.json shape).
     window.KP_TOOL_LANG : BCP-47-ish lang code ('en','ja',…) for share text.
   Optional:
     window.KP_TOOL_NOSHARE : truthy on the embed page if share should be
                              hidden (still works, just keeps embed minimal).

   Star-sign + Chinese-zodiac derivation mirrors modules/seo-derive.cjs
   exactly (same tropical sun-sign table + solar-year mod-12 rule) so the
   client and the server-rendered hints never disagree. Pure functions.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = window.KP_TOOL_I18N || {};
  var IDOLS = Array.isArray(window.KP_IDOLS) ? window.KP_IDOLS : [];
  var LANG = window.KP_TOOL_LANG || 'en';

  // ── derive: tropical sun-sign (matches seo-derive SIGNS) ───────────
  var SIGNS = [
    { key: 'capricorn',   name: 'Capricorn',   emoji: '♑', from: [12, 22] },
    { key: 'aquarius',    name: 'Aquarius',    emoji: '♒', from: [1, 20] },
    { key: 'pisces',      name: 'Pisces',      emoji: '♓', from: [2, 19] },
    { key: 'aries',       name: 'Aries',       emoji: '♈', from: [3, 21] },
    { key: 'taurus',      name: 'Taurus',      emoji: '♉', from: [4, 20] },
    { key: 'gemini',      name: 'Gemini',      emoji: '♊', from: [5, 21] },
    { key: 'cancer',      name: 'Cancer',      emoji: '♋', from: [6, 21] },
    { key: 'leo',         name: 'Leo',         emoji: '♌', from: [7, 23] },
    { key: 'virgo',       name: 'Virgo',       emoji: '♍', from: [8, 23] },
    { key: 'libra',       name: 'Libra',       emoji: '♎', from: [9, 23] },
    { key: 'scorpio',     name: 'Scorpio',     emoji: '♏', from: [10, 23] },
    { key: 'sagittarius', name: 'Sagittarius', emoji: '♐', from: [11, 22] }
  ];
  var CN = [
    { key: 'monkey',  name: 'Monkey',  emoji: '🐵' },
    { key: 'rooster', name: 'Rooster', emoji: '🐓' },
    { key: 'dog',     name: 'Dog',     emoji: '🐕' },
    { key: 'pig',     name: 'Pig',     emoji: '🐖' },
    { key: 'rat',     name: 'Rat',     emoji: '🐀' },
    { key: 'ox',      name: 'Ox',      emoji: '🐂' },
    { key: 'tiger',   name: 'Tiger',   emoji: '🐅' },
    { key: 'rabbit',  name: 'Rabbit',  emoji: '🐇' },
    { key: 'dragon',  name: 'Dragon',  emoji: '🐉' },
    { key: 'snake',   name: 'Snake',   emoji: '🐍' },
    { key: 'horse',   name: 'Horse',   emoji: '🐎' },
    { key: 'goat',    name: 'Goat',    emoji: '🐐' }
  ];

  function parseDate(s) {
    if (typeof s !== 'string') return null;
    var m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }
  function signOf(p) {
    if (!p) return null;
    var md = p.m * 100 + p.d;
    if (md >= 1222 || md <= 119) return SIGNS[0];
    for (var i = 1; i < SIGNS.length; i++) {
      var start = SIGNS[i].from[0] * 100 + SIGNS[i].from[1];
      var next = SIGNS[i + 1] ? SIGNS[i + 1].from[0] * 100 + SIGNS[i + 1].from[1] : 1231;
      if (md >= start && md < next) return SIGNS[i];
    }
    return SIGNS[0];
  }
  function cnOf(p) {
    if (!p) return null;
    var a = CN[(((p.y % 12) + 12) % 12)];
    var approx = (p.m === 1) || (p.m === 2 && p.d <= 20);
    return { key: a.key, name: a.name, emoji: a.emoji, approx: approx };
  }

  // ── tiny helpers ───────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function fmtBirthday(b) { return b; } // already ISO; locale formatting kept simple/neutral

  // ── matching ───────────────────────────────────────────────────────
  function matchAll(p) {
    var sameDay = [], sameSign = [], sameZodiac = [];
    var mySign = signOf(p), myCn = cnOf(p);
    for (var i = 0; i < IDOLS.length; i++) {
      var it = IDOLS[i];
      var ip = parseDate(it.b);
      if (!ip) continue;
      if (ip.m === p.m && ip.d === p.d) sameDay.push(it);
      var isg = signOf(ip), icn = cnOf(ip);
      if (mySign && isg && isg.key === mySign.key) sameSign.push(it);
      if (myCn && icn && icn.key === myCn.key) sameZodiac.push(it);
    }
    return { sameDay: sameDay, sameSign: sameSign, sameZodiac: sameZodiac, sign: mySign, cn: myCn };
  }

  function chip(it) {
    return '<li class="kpf-chip"><span class="kpf-emoji" aria-hidden="true">' + esc(it.e || '🎤') +
      '</span><span class="kpf-name">' + esc(it.n) + '</span>' +
      '<span class="kpf-grp">' + esc(it.g) + '</span>' +
      '<span class="kpf-bd">' + esc(fmtBirthday(it.b)) + '</span></li>';
  }
  function listBlock(title, badge, items) {
    if (!items.length) return '';
    var lis = items.map(chip).join('');
    return '<section class="kpf-block"><h3>' + esc(badge) + ' ' + esc(title) +
      ' <span class="kpf-n">' + items.length + '</span></h3><ul class="kpf-list">' + lis + '</ul></section>';
  }

  function render(p, push) {
    var r = matchAll(p);
    var out = '';
    // header: your sign + zodiac
    if (r.sign) {
      out += '<p class="kpf-you"><strong>' + esc(I.yourSign || 'Your star sign') + ':</strong> ' +
        esc(r.sign.emoji) + ' ' + esc(r.sign.name);
      if (r.cn) {
        out += ' &nbsp;·&nbsp; <strong>' + esc(I.yourZodiac || 'Your Chinese zodiac') + ':</strong> ' +
          esc(r.cn.emoji) + ' ' + esc(r.cn.name);
      }
      out += '</p>';
    }
    if (r.cn && r.cn.approx) {
      out += '<p class="kpf-hedge">⚠️ ' + esc(I.zodiacHedge ||
        'Born near Lunar New Year — your Chinese zodiac may shift by one.') + '</p>';
    }
    if (r.sameDay.length) {
      out += listBlock(I.resSameDay || 'Same birthday', '🎂', r.sameDay);
    } else {
      out += '<p class="kpf-none">' + esc(I.noSameDay || '') + '</p>';
    }
    out += listBlock(I.resSameSign || 'Same star sign', (r.sign ? r.sign.emoji : '✨'), r.sameSign);
    out += listBlock(I.resSameZodiac || 'Same Chinese zodiac', (r.cn ? r.cn.emoji : '🏮'), r.sameZodiac);

    var res = el('kpf-result');
    if (res) { res.innerHTML = out; res.hidden = false; }
    var sb = el('kpf-sharebar');
    if (sb && !window.KP_TOOL_NOSHARE) sb.hidden = false;

    if (push) {
      try {
        var u = new URL(window.location.href);
        u.searchParams.set('bday', p.y + '-' + pad(p.m) + '-' + pad(p.d));
        history.replaceState(null, '', u.toString());
      } catch (e) { /* ignore */ }
    }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // ── share / copy ───────────────────────────────────────────────────
  function shareUrl() { return window.location.href; }
  function doShare() {
    var txt = (I.shareText || 'My K-pop idol matches:') + ' ' + shareUrl();
    if (navigator.share) {
      navigator.share({ title: I.title || 'K-pop Idol Matcher', text: I.shareText || '', url: shareUrl() })
        .catch(function () {});
    } else {
      copyLink();
    }
  }
  function copyLink() {
    var url = shareUrl();
    function ok() { toast(I.copied || 'Link copied!'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(ok, function () { fallbackCopy(url, ok); });
    } else { fallbackCopy(url, ok); }
  }
  function fallbackCopy(text, cb) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      cb && cb();
    } catch (e) { /* ignore */ }
  }
  var _t;
  function toast(msg) {
    var t = el('kpf-toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false; t.classList.add('on');
    clearTimeout(_t);
    _t = setTimeout(function () { t.classList.remove('on'); t.hidden = true; }, 2200);
  }

  // ── wire ───────────────────────────────────────────────────────────
  function go(push) {
    var inp = el('kpf-date');
    if (!inp) return;
    var p = parseDate(inp.value);
    if (!p) { toast(I.pickPrompt || 'Pick a date.'); return; }
    render(p, push !== false);
  }

  function init() {
    var btn = el('kpf-find'); if (btn) btn.addEventListener('click', function () { go(true); });
    var inp = el('kpf-date');
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(true); });
    var sh = el('kpf-share'); if (sh) sh.addEventListener('click', doShare);
    var cp = el('kpf-copy'); if (cp) cp.addEventListener('click', copyLink);
    // pre-fill from URL (?bday=YYYY-MM-DD) and auto-run for shareable results
    try {
      var q = new URL(window.location.href).searchParams.get('bday');
      var p = parseDate(q);
      if (p && inp) { inp.value = q; render(p, false); }
    } catch (e) { /* ignore */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
