/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — drop-in page monetization for standalone (hand-built) pages.
   Injects ONE tasteful ad section before the footer: Agoda hotel CTA +
   Klook activities widget + a single AdSense unit, with an FTC disclosure.
   Self-contained (no header.js / hub-styles needed), dark-theme inline,
   9-language, lazy-loaded (IntersectionObserver) so it never costs LCP.

   USAGE — add to any new page that should carry ads:
     <script defer src="modules/page-ads.js?v=1"></script>
   To OPT OUT (e.g. B2B/tool pages like embed.html): put data-noads on <body>.

   SEO pages (build-seo.cjs) already embed AdSense + Agoda + Klook via the
   shell, so they do NOT need this — this is only for hand-built pages.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!document.body || document.body.hasAttribute('data-noads')) return;
  if (document.getElementById('kp-page-ads')) return;

  var ADS_CLIENT = 'ca-pub-1378943893051810', ADS_SLOT = '4521899200';
  var AGODA = 'https://www.agoda.com/country/south-korea.html?cid=1952761';

  var LBL = {
    en: { h: '🎫 Plan & book your Korea trip', agoda: '🏨 Find great hotels in Korea on Agoda →', ad: 'Advertisement', disc: 'Affiliate links & ads — at no extra cost to you, they help keep KoreaPlus free.' },
    ko: { h: '🎫 한국 여행 계획 & 예약', agoda: '🏨 아고다에서 한국 호텔 찾기 →', ad: '광고', disc: '제휴 링크·광고 — 추가 비용 없이 KoreaPlus 무료 운영에 도움이 됩니다.' },
    ja: { h: '🎫 韓国旅行を計画・予約', agoda: '🏨 Agodaで韓国のホテルを探す →', ad: '広告', disc: 'アフィリエイト・広告 — 追加料金なしでKoreaPlusの無料運営を支えます。' },
    zh: { h: '🎫 规划并预订你的韩国之旅', agoda: '🏨 在 Agoda 上寻找韩国酒店 →', ad: '广告', disc: '联盟链接与广告 — 您无需额外付费，有助于 KoreaPlus 保持免费。' },
    es: { h: '🎫 Planifica y reserva tu viaje a Corea', agoda: '🏨 Encuentra hoteles en Corea en Agoda →', ad: 'Publicidad', disc: 'Enlaces de afiliado y anuncios — sin coste adicional para ti, ayudan a mantener KoreaPlus gratis.' },
    fr: { h: '🎫 Planifiez et réservez votre voyage en Corée', agoda: '🏨 Trouvez de bons hôtels en Corée sur Agoda →', ad: 'Publicité', disc: 'Liens affiliés et publicités — sans surcoût pour vous, ils aident à garder KoreaPlus gratuit.' },
    de: { h: '🎫 Plane & buche deine Korea-Reise', agoda: '🏨 Finde gute Hotels in Korea auf Agoda →', ad: 'Anzeige', disc: 'Affiliate-Links & Anzeigen — ohne Mehrkosten für dich; sie halten KoreaPlus kostenlos.' },
    pt: { h: '🎫 Planeje e reserve sua viagem à Coreia', agoda: '🏨 Encontre ótimos hotéis na Coreia na Agoda →', ad: 'Publicidade', disc: 'Links de afiliado e anúncios — sem custo extra para você, ajudam a manter o KoreaPlus gratuito.' },
    id: { h: '🎫 Rencanakan & pesan perjalanan Korea-mu', agoda: '🏨 Cari hotel bagus di Korea di Agoda →', ad: 'Iklan', disc: 'Tautan afiliasi & iklan — tanpa biaya tambahan, membantu KoreaPlus tetap gratis.' }
  };
  var L = LBL[(document.documentElement.lang || 'en').slice(0, 2)] || LBL.en;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var sec = document.createElement('section');
  sec.id = 'kp-page-ads';
  sec.setAttribute('aria-label', esc(L.h));
  sec.style.cssText = 'max-width:960px;margin:30px auto 0;padding:18px 16px 8px;border-top:1px solid rgba(255,255,255,.1)';
  sec.innerHTML =
    '<div style="font-weight:800;font-size:15px;color:#eaf0f7;margin-bottom:12px">' + esc(L.h) + '</div>' +
    '<a href="' + AGODA + '" target="_blank" rel="sponsored noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border-radius:12px;background:linear-gradient(135deg,rgba(255,107,53,.14),rgba(214,34,70,.10));border:1px solid rgba(255,107,53,.30);color:#eaf0f7;text-decoration:none;font-weight:700;font-size:14px">' + esc(L.agoda) + '</a>' +
    '<div class="kp-pa-klook" style="margin-top:14px;min-height:8px"></div>' +
    '<div class="kp-pa-ad" style="margin-top:16px"><div style="font-size:10px;color:#8895a6;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">' + esc(L.ad) + '</div>' +
      '<ins class="adsbygoogle" style="display:block;width:100%;min-height:90px" data-ad-client="' + ADS_CLIENT + '" data-ad-slot="' + ADS_SLOT + '" data-ad-format="auto" data-full-width-responsive="true"></ins></div>' +
    '<div style="font-size:11px;color:#8895a6;margin-top:10px;text-align:center;line-height:1.5">' + esc(L.disc) + '</div>';

  var footer = document.querySelector('footer');
  if (footer && footer.parentNode) footer.parentNode.insertBefore(sec, footer);
  else document.body.appendChild(sec);

  var loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    // Klook activities widget
    var kslot = sec.querySelector('.kp-pa-klook');
    if (kslot) {
      var ins = document.createElement('ins'); ins.className = 'klk-aff-widget';
      var attrs = { 'data-adid': '1310693', 'data-lang': '', 'data-currency': '', 'data-cardH': '126', 'data-padding': '92', 'data-lgH': '470', 'data-edgeValue': '655', 'data-cid': '13', 'data-tid': '-1', 'data-amount': '3', 'data-prod': 'dynamic_widget' };
      for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) ins.setAttribute(k, attrs[k]); }
      var a = document.createElement('a'); a.href = '//www.klook.com/'; a.rel = 'sponsored noopener'; a.target = '_blank'; a.textContent = 'Klook.com'; ins.appendChild(a);
      kslot.appendChild(ins);
      var ks = document.createElement('script'); ks.type = 'text/javascript'; ks.async = true;
      ks.src = 'https://affiliate.klook.com/widget/fetch-iframe-init.js';
      (document.body || document.documentElement).appendChild(ks);
    }
    // AdSense
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      var g = document.createElement('script'); g.async = true; g.crossOrigin = 'anonymous';
      g.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CLIENT;
      document.head.appendChild(g);
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  // Load shortly after the page settles (post-LCP) — guaranteed, no reliance on
  // scroll/IntersectionObserver, so the ads always render.
  function trigger() { setTimeout(load, 1500); }
  if (document.readyState === 'complete') trigger();
  else window.addEventListener('load', trigger);
})();
