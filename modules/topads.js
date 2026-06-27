/* modules/topads.js — localized top-of-page monetization block.
   Renders into #kp-topads (placed just below the hero, NOT the very top):
     1) AdSense display unit (auto-localizes per visitor)
     2) AliExpress merch strip — geo-localized (country shipping + currency +
        title language) via the Worker proxy; hidden if no products / no keys
   Per-page query via the container's data-q attribute. Language from kp_lang.
   Requires window.KPApi (api-client.js) for the AliExpress strip. */
(function () {
  'use strict';
  const box = document.getElementById('kp-topads');
  if (!box || box.dataset.done) return;
  box.dataset.done = '1';

  const lang = (localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2) || 'en').toLowerCase();
  const q = box.dataset.q || 'kpop merch album';
  const API = window.KPApi || null;

  // ── AdSense (one client, slot reused; AdSense auto-localizes by user) ──────
  const ADS_CLIENT = 'ca-pub-1378943893051810';
  const ADS_SLOT = '4521899200';

  const STR = {
    en: { merch:'K-Pop Merch & Albums', ad:'Sponsored', disc:'Affiliate links — we may earn a commission at no extra cost to you.' },
    ko: { merch:'K-pop 굿즈·앨범', ad:'광고', disc:'제휴 링크 — 추가 비용 없이 일정 수수료를 받을 수 있어요.' },
    ja: { merch:'K-POPグッズ・アルバム', ad:'広告', disc:'アフィリエイトリンク — 追加費用なしで手数料を得る場合があります。' },
    zh: { merch:'K-pop周边·专辑', ad:'广告', disc:'附属链接 — 我们可能获得佣金，您无需额外付费。' },
    es: { merch:'Merch y álbumes K-pop', ad:'Publicidad', disc:'Enlaces de afiliados — podemos ganar una comisión sin coste extra para ti.' },
    fr: { merch:'Goodies & albums K-pop', ad:'Sponsorisé', disc:'Liens affiliés — nous pouvons percevoir une commission sans frais pour vous.' },
    de: { merch:'K-Pop Merch & Alben', ad:'Anzeige', disc:'Affiliate-Links — wir erhalten ggf. eine Provision ohne Mehrkosten für dich.' },
    pt: { merch:'Produtos e álbuns K-pop', ad:'Publicidade', disc:'Links de afiliados — podemos ganhar comissão sem custo extra para você.' },
    id: { merch:'Merch & Album K-pop', ad:'Bersponsor', disc:'Tautan afiliasi — kami bisa mendapat komisi tanpa biaya tambahan untukmu.' },
  };
  const s = STR[lang] || STR.en;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  // ── Self-contained styles (generic theme vars + fallbacks → works anywhere) ──
  function injectCSS() {
    if (document.getElementById('kp-topads-css')) return;
    const st = document.createElement('style'); st.id = 'kp-topads-css';
    st.textContent = '.kp-topads{margin:14px 0 6px;display:flex;flex-direction:column;gap:16px}.kp-topads:empty{display:none}'
      + '.kp-ad-slot{min-height:90px}.kp-ad-tag{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text3,#888);margin-bottom:5px}'
      + '.kp-ali-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;font-size:15px;font-weight:900;color:var(--text,#fff)}'
      + '.kp-ali-strip{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;padding-bottom:5px}'
      + '.kp-ali-strip::-webkit-scrollbar{height:6px}.kp-ali-strip::-webkit-scrollbar-thumb{background:var(--border2,#444);border-radius:3px}'
      + '.kp-ali-card{flex:0 0 134px;scroll-snap-align:start;background:var(--surface,#15151f);border:1px solid var(--border,#2a2a33);border-radius:12px;overflow:hidden;text-decoration:none;transition:border-color .15s,transform .12s}'
      + '.kp-ali-card:hover{border-color:var(--accent,#ff2e74);transform:translateY(-2px)}'
      + '.kp-ali-card img{width:100%;height:134px;object-fit:cover;background:var(--bg,#0c0c14);display:block}'
      + '.kp-ali-t{font-size:11px;color:var(--text2,#aaa);line-height:1.32;padding:7px 8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
      + '.kp-ali-p{font-size:13px;font-weight:900;color:var(--accent,#ff2e74);padding:3px 8px 9px}'
      + '.kp-ad-disc{font-size:10px;color:var(--text3,#888);margin-top:8px;line-height:1.4}';
    document.head.appendChild(st);
  }

  // ── 1. AdSense top unit ────────────────────────────────────────────────────
  function adsense() {
    const wrap = document.createElement('div');
    wrap.className = 'kp-ad-slot';
    wrap.innerHTML = `<span class="kp-ad-tag">${esc(s.ad)}</span>`
      + `<ins class="adsbygoogle" style="display:block;min-height:90px" data-ad-client="${ADS_CLIENT}" data-ad-slot="${ADS_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    box.appendChild(wrap);
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const g = document.createElement('script');
      g.async = true; g.crossOrigin = 'anonymous';
      g.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CLIENT;
      document.head.appendChild(g);
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  // ── 2. AliExpress localized merch strip ─────────────────────────────────────
  async function aliexpress() {
    if (!API || !API.getKbeautyProducts) return;
    const sec = document.createElement('div');
    sec.className = 'kp-ali';
    sec.innerHTML = `<div class="kp-ali-head"><span>🛍️ ${esc(s.merch)}</span><span class="kp-ad-tag">${esc(s.ad)} · AliExpress</span></div>`
      + `<div class="kp-ali-strip" id="kp-ali-strip"></div>`
      + `<div class="kp-ad-disc">${esc(s.disc)}</div>`;
    box.appendChild(sec);
    try {
      const items = await API.getKbeautyProducts(q, lang);
      const strip = sec.querySelector('#kp-ali-strip');
      if (!Array.isArray(items) || !items.length || !strip) { sec.remove(); return; }
      strip.innerHTML = items.slice(0, 12).map(p => `
        <a class="kp-ali-card" href="${esc(p.url)}" target="_blank" rel="sponsored nofollow noopener">
          <img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">
          <div class="kp-ali-t">${esc(p.title)}</div>
          ${p.price ? `<div class="kp-ali-p">${esc(p.price)}</div>` : ''}
        </a>`).join('');
    } catch { sec.remove(); }
  }

  injectCSS();
  if (box.dataset.ads !== 'off') adsense();   // data-ads="off" → AliExpress only (page already has AdSense)
  aliexpress();
})();
