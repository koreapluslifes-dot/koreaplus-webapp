/* ══════════════════════════════════════════════════════════════════
   modules/kp-tool-budget.js — client runtime for the T07 budget tools
   (Korea budget converter + trip cost calculator) and their embeds.

   Self-contained IIFE. No build-seo coupling, no framework. Reads its
   localized config + data from a JSON blob the generator inlines as
   <script type="application/json" id="kpbt-cfg">…</script>, so the same
   script powers every language and both the full page and the no-ads
   embed. Live FX from /api/exchange with a labelled offline fallback.

   DOM contract (ids the generator emits inside #kpbt-root):
     converter:  amount, cur, krwOut, rateOut, buysTbody, daysOut, share
     calculator: cstyle, cdays, cdaysOut, cpeople, cpeopleOut, ccur,
                 perDayOut, perDayCur, totalOut, totalCur, brkTbody
   Both tools may coexist on one page; each block is opt-in by id presence.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var root = document.getElementById('kpbt-root');
  if (!root) return;
  var cfgEl = document.getElementById('kpbt-cfg');
  var CFG;
  try { CFG = JSON.parse(cfgEl.textContent); } catch (e) { return; }

  // CFG shape (emitted by seo-budgettool.cjs):
  //   { worker, t:{...localized strings}, currencies:[[code,sym],...],
  //     fallback:{CODE:rate}, tiers:[{k,usd,krw}], items:[[icon,krw,usd]],
  //     itemN:[...], curN:{CODE:name} }
  var t = CFG.t || {};
  var rates = null;          // KRW→foreign multipliers (1 KRW = rate units)
  var rateLive = false;

  // ── helpers ────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function num(v) { v = parseFloat(v); return isFinite(v) ? v : 0; }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function fmtKRW(krw) { return '₩' + Math.round(krw).toLocaleString(); }
  // foreign-amount formatting: more decimals for small values
  function fmtCur(val, code) {
    if (!isFinite(val)) return '—';
    var a = Math.abs(val), s;
    if (a < 1) s = val.toFixed(3);
    else if (a < 100) s = val.toFixed(2);
    else s = Math.round(val).toLocaleString();
    return code + ' ' + s;
  }
  function krwToForeign(krw, code) { var r = rates && rates[code]; return r ? krw * r : NaN; }
  function foreignToKrw(amt, code) { var r = rates && rates[code]; return (r && r > 0) ? amt / r : NaN; }

  // KRW midpoint for a "₩3,000–5,000" style range (reuse of COST_INDEX text).
  function krwMid(str) {
    if (typeof str === 'number') return str;
    var nums = String(str).replace(/[^\d–\-—.,]/g, '').replace(/,/g, '')
      .split(/[–\-—]/).map(function (x) { return parseFloat(x); }).filter(function (x) { return isFinite(x); });
    if (!nums.length) return 0;
    return nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
  }
  // numeric per-day USD→KRW baseline for each tier (krw field is a "₩70,000"
  // string in COST_INDEX; usd is a clean number).
  function tierKRW(tier) { return krwMid(tier.krw); }

  // ── exchange rates ─────────────────────────────────────────────────
  function applyRates(r, live) {
    rates = r; rateLive = !!live;
    renderAll();
    // rate label(s)
    var lbl = live ? t.updated : t.offline;
    ['rateOut'].forEach(function (id) {
      var el = $(id); if (el && el.dataset.role === 'badge') el.textContent = lbl;
    });
  }
  function loadRates() {
    var worker = CFG.worker || '';
    var done = function (r, live) { applyRates(r, live); };
    if (!worker) { done(CFG.fallback, false); return; }
    var ok = false;
    try {
      fetch(worker + '/api/exchange').then(function (res) {
        return res && res.ok ? res.json() : null;
      }).then(function (d) {
        if (d && d.data && d.data.rates && d.data.rates.USD) { ok = true; done(d.data.rates, true); }
        else done(CFG.fallback, false);
      }).catch(function () { if (!ok) done(CFG.fallback, false); });
    } catch (e) { done(CFG.fallback, false); }
  }

  // ── URL query share (converter) ────────────────────────────────────
  function readQuery() {
    try {
      var p = new URLSearchParams(location.search);
      return { amt: p.get('a'), cur: p.get('c'), style: p.get('s'), days: p.get('d'), people: p.get('p') };
    } catch (e) { return {}; }
  }
  function writeQuery(obj) {
    try {
      var p = new URLSearchParams(location.search);
      Object.keys(obj).forEach(function (k) {
        if (obj[k] == null || obj[k] === '') p.delete(k); else p.set(k, obj[k]);
      });
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) { }
  }

  // ── currency <select> population (shared) ──────────────────────────
  function fillCurrency(sel, selected) {
    if (!sel || sel.options.length) return;
    (CFG.currencies || []).forEach(function (c) {
      var code = c[0], opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code + ' — ' + ((CFG.curN && CFG.curN[code]) || code);
      if (code === selected) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  // ── CONVERTER ──────────────────────────────────────────────────────
  var Q = readQuery();
  function initConverter() {
    var amount = $('amount'), cur = $('cur');
    if (!amount || !cur) return null;
    fillCurrency(cur, Q.cur || 'USD');
    if (Q.amt && isFinite(parseFloat(Q.amt))) amount.value = parseFloat(Q.amt);
    else if (!amount.value) amount.value = 1000;
    var onInput = function () { renderConverter(); writeQuery({ a: num(amount.value), c: cur.value }); };
    amount.addEventListener('input', onInput);
    cur.addEventListener('change', onInput);
    var share = $('share');
    if (share) share.addEventListener('click', function () {
      writeQuery({ a: num(amount.value), c: cur.value });
      var url = location.href;
      var fin = function () { share.textContent = t.cv && t.cv.sharedMsg ? t.cv.sharedMsg : 'Copied'; setTimeout(function () { share.textContent = (t.cv && t.cv.shareB) || '🔗'; }, 2400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(fin, fin);
      else fin();
    });
    return true;
  }
  function renderConverter() {
    var amount = $('amount'), cur = $('cur');
    if (!amount || !cur || !rates) return;
    var code = cur.value, amt = num(amount.value);
    var krw = foreignToKrw(amt, code);
    var krwOut = $('krwOut'); if (krwOut) krwOut.textContent = isFinite(krw) ? fmtKRW(krw) : '—';
    var rateOut = $('rateOut');
    if (rateOut) {
      var r = rates[code];
      rateOut.textContent = (r && r > 0) ? ('1 ' + code + ' = ' + fmtKRW(1 / r) + ' · ' + (rateLive ? t.updated : t.offline)) : (rateLive ? t.updated : t.offline);
    }
    // what it buys
    var tb = $('buysTbody');
    if (tb) {
      tb.innerHTML = '';
      (CFG.items || []).forEach(function (it, i) {
        var icon = it[0], itemKrwStr = it[1];
        var unit = krwMid(itemKrwStr);
        var qty = (unit > 0 && isFinite(krw)) ? Math.floor(krw / unit) : 0;
        var tr = document.createElement('tr');
        var name = (CFG.itemN && CFG.itemN[i]) || '';
        tr.innerHTML = '<td>' + icon + ' ' + esc(name) + '</td><td class="kpbt-num">' + esc(itemKrwStr) + '</td><td class="kpbt-num">' + (qty > 0 ? '×' + qty.toLocaleString() : '—') + '</td>';
        tb.appendChild(tr);
      });
    }
    // days of travel at this budget (per tier)
    var daysOut = $('daysOut');
    if (daysOut) {
      daysOut.innerHTML = '';
      (CFG.tiers || []).forEach(function (tier) {
        var perDayKrw = tierKRW(tier);
        var d = (perDayKrw > 0 && isFinite(krw)) ? Math.floor(krw / perDayKrw) : 0;
        var name = (t.styleN && t.styleN[tier.k]) || tier.k;
        var span = document.createElement('span');
        span.className = 'kpbt-chip';
        span.innerHTML = esc(name) + ': <b>' + d + '</b> ' + esc(d === 1 ? t.day : t.days);
        daysOut.appendChild(span);
      });
    }
  }

  // ── CALCULATOR ─────────────────────────────────────────────────────
  function initCalculator() {
    var cstyle = $('cstyle'), cdays = $('cdays'), cpeople = $('cpeople'), ccur = $('ccur');
    if (!cstyle || !cdays || !cpeople || !ccur) return null;
    fillCurrency(ccur, Q.cur || 'USD');
    // style radios/select already in DOM; set defaults from query
    if (Q.style) { try { cstyle.value = Q.style; } catch (e) { } }
    if (Q.days && isFinite(parseFloat(Q.days))) cdays.value = clamp(parseInt(Q.days, 10) || 5, +cdays.min || 1, +cdays.max || 30);
    if (Q.people && isFinite(parseFloat(Q.people))) cpeople.value = clamp(parseInt(Q.people, 10) || 1, +cpeople.min || 1, +cpeople.max || 12);
    var sync = function () {
      var do2 = $('cdaysOut'); if (do2) do2.textContent = cdays.value;
      var po = $('cpeopleOut'); if (po) po.textContent = cpeople.value;
      renderCalculator();
      writeQuery({ s: cstyle.value, d: cdays.value, p: cpeople.value, c: ccur.value });
    };
    [cstyle, cdays, cpeople, ccur].forEach(function (el) {
      el.addEventListener('input', sync); el.addEventListener('change', sync);
    });
    sync();
    return true;
  }
  function renderCalculator() {
    var cstyle = $('cstyle'), cdays = $('cdays'), cpeople = $('cpeople'), ccur = $('ccur');
    if (!cstyle || !cdays || !cpeople || !ccur) return;
    var tier = (CFG.tiers || []).filter(function (x) { return x.k === cstyle.value; })[0] || (CFG.tiers || [])[0];
    if (!tier) return;
    var days = clamp(parseInt(cdays.value, 10) || 1, 1, 365);
    var people = clamp(parseInt(cpeople.value, 10) || 1, 1, 99);
    var code = ccur.value;
    var perDayKrw = tierKRW(tier);
    var totalKrw = perDayKrw * days * people;

    var pd = $('perDayOut'); if (pd) pd.textContent = fmtKRW(perDayKrw);
    var pdc = $('perDayCur'); if (pdc) pdc.textContent = rates ? ('≈ ' + fmtCur(krwToForeign(perDayKrw, code), code)) : '';
    var to = $('totalOut'); if (to) to.textContent = fmtKRW(totalKrw);
    var toc = $('totalCur'); if (toc) toc.textContent = rates ? ('≈ ' + fmtCur(krwToForeign(totalKrw, code), code)) : '';

    // per-item reference prices in selected currency
    var tb = $('brkTbody');
    if (tb) {
      tb.innerHTML = '';
      (CFG.items || []).forEach(function (it, i) {
        var icon = it[0], krwStr = it[1];
        var unit = krwMid(krwStr);
        var name = (CFG.itemN && CFG.itemN[i]) || '';
        var fc = rates ? fmtCur(krwToForeign(unit, code), code) : '—';
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + icon + ' ' + esc(name) + '</td><td class="kpbt-num">' + esc(krwStr) + '</td><td class="kpbt-num">' + esc(fc) + '</td>';
        tb.appendChild(tr);
      });
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderAll() { renderConverter(); renderCalculator(); }

  // ── boot ───────────────────────────────────────────────────────────
  initConverter();
  initCalculator();
  loadRates();
})();
