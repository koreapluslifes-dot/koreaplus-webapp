/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — Agoda affiliate offers (via Worker /api/aff)

   Agoda is the only affiliate network. Static pages ship a fallback
   .seo-aff block (Agoda cid deep link). This module:
     1. fetches /api/aff?city=&cat=&q=&lang=  (live Agoda hotel cards when the
        Long Tail API key is set, else cid deep links; KV-cached)
     2. swaps the block's links in place (graceful: fetch fails → static
        Agoda fallback link simply remains)
     3. on long articles, clones a compact offer strip after the 2nd <h2>
        (better viewport coverage than a single bottom block)
     4. tracks clicks via kpAnalytics (GA4 event: aff_click)
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WORKER = (typeof window !== 'undefined' && window.WORKER_URL) ||
    'https://koreaplus-webapp.jeybeeicon.workers.dev';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function track(brand, ctx, placement) {
    try {
      if (window.kpAnalytics) {
        window.kpAnalytics.track('aff_click', { brand: brand, cat: ctx.cat || '', city: ctx.city || '', placement: placement });
      }
    } catch (e) { /* analytics is best-effort */ }
  }

  function richCard(o) {
    var rev = o.review ? '⭐ ' + o.review : '';
    var stars = o.star ? '★'.repeat(Math.max(0, Math.min(5, Math.round(o.star)))) : '';
    var meta = [rev, stars].filter(Boolean).join(' · ');
    var price = '';
    if (o.price) {
      price = (o.was ? '<s>' + esc(o.was) + '</s> ' : '') + '<b>' + esc(o.price) + '</b>' +
        (o.discount ? ' <em>-' + o.discount + '%</em>' : '');
    }
    return '<a class="aff-rich" href="' + esc(o.url) + '" target="_blank" rel="sponsored noopener" data-aff-brand="' + esc(o.brand) + '">' +
      (o.img ? '<img class="aff-rich-img" src="' + esc(o.img) + '" alt="" loading="lazy">' : '') +
      '<span class="aff-rich-body">' +
        '<span class="aff-rich-name">' + esc(o.name || o.label) + '</span>' +
        (meta ? '<span class="aff-rich-meta">' + meta + '</span>' : '') +
        (price ? '<span class="aff-rich-price">' + price + '</span>' : '') +
        '<span class="aff-rich-brand">🏨 Agoda</span>' +
      '</span></a>';
  }

  function renderGrid(grid, offers, ctx, placement) {
    var rich = offers.some(function (o) { return o.img; });
    grid.classList.toggle('aff-grid-rich', rich);
    grid.innerHTML = offers.map(function (o) {
      if (o.img) return richCard(o);
      var sub = o.price ? esc(o.price) + ' · ' + esc(o.brand) : esc(o.brand);
      return '<a href="' + esc(o.url) + '" target="_blank" rel="sponsored noopener" data-aff-brand="' + esc(o.brand) + '">' +
        '<strong>' + (o.icon || '🏨') + ' ' + esc(o.label) + '</strong><span>' + sub + '</span></a>';
    }).join('');
    grid.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { track(a.dataset.affBrand, ctx, placement); });
    });
  }

  function upgrade() {
    var blocks = document.querySelectorAll('.seo-aff[data-aff]');
    if (!blocks.length) return;

    var ctx = {};
    try { ctx = JSON.parse(blocks[0].dataset.aff || '{}'); } catch (e) { /* keep {} */ }
    var lang = blocks[0].getAttribute('data-aff-lang') ||
      (window.kpI18n && window.kpI18n.getLang && window.kpI18n.getLang()) || 'en';

    var qs = new URLSearchParams({ city: ctx.city || '', cat: ctx.cat || '', q: ctx.q || '', lang: lang });
    fetch(WORKER + '/api/aff?' + qs.toString())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        if (!data.offers || !data.offers.length) return;

        blocks.forEach(function (block) {
          var grid = block.querySelector('.aff-grid');
          if (grid) renderGrid(grid, data.offers, ctx, 'bottom');
        });

        insertInline(blocks[0], data.offers, ctx);
      })
      .catch(function () { /* static fallback links remain — nothing to do */ });
  }

  /* Long article → clone a compact strip after the 2nd <h2> (skip if an
     aff block is already visible in the first two viewports). */
  function insertInline(sourceBlock, offers, ctx) {
    var body = document.querySelector('.seo-body');
    if (!body || body.scrollHeight < 2400) return;
    var h2s = body.querySelectorAll('h2');
    if (h2s.length < 4) return;
    var anchor = h2s[1];
    if (!anchor || anchor.closest('.seo-aff')) return;
    // don't double up if the existing block is already near this point
    if (Math.abs(sourceBlock.offsetTop - anchor.offsetTop) < 1200) return;

    var clone = sourceBlock.cloneNode(true);
    clone.removeAttribute('data-aff');
    clone.style.margin = '26px 0';
    var label = clone.querySelector('.aff-label');
    if (label) label.textContent = '🎫 Quick bookings for this guide';
    var grid = clone.querySelector('.aff-grid');
    if (grid) renderGrid(grid, offers, ctx, 'inline');
    anchor.parentNode.insertBefore(clone, anchor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgrade);
  } else {
    upgrade();
  }
})();
