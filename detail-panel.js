/* KoreaPlus Detail Panel — rich content drawer */
(function () {

  // Translate with English fallback (returns fallback when i18n absent).
  const tr = (k, fb) => {
    const v = window.kpI18n ? window.kpI18n.t(k) : null;
    return (v && v !== k) ? v : fb;
  };

  let lastItem = null; // remember for re-render on language change

  function getDetail(name) {
    return (window.DETAIL_DATA && window.DETAIL_DATA[name]) || {};
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Matches build-seo.cjs slug() so the modal can deep-link to the SEO page.
  function slugify(s) {
    return String(s).toLowerCase()
      .replace(/['']/g, '').replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function createShell() {
    if (document.getElementById('detail-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'detail-panel';
    panel.className = 'detail-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'dp-title');
    panel.innerHTML = `
      <div class="dp-header">
        <div class="dp-hero">
          <span class="dp-emoji" id="dp-emoji"></span>
          <div class="dp-title-block">
            <h2 class="dp-title" id="dp-title"></h2>
            <div class="dp-meta" id="dp-meta"></div>
          </div>
        </div>
        <div class="dp-head-actions" id="dp-head-actions"></div>
        <button class="dp-close" id="dp-close" aria-label="Close panel">✕</button>
      </div>
      <div class="dp-body" id="dp-body"></div>`;
    document.body.appendChild(panel);

    const bd = document.createElement('div');
    bd.id = 'detail-backdrop';
    bd.className = 'detail-backdrop';
    document.body.appendChild(bd);

    document.getElementById('dp-close').addEventListener('click', close);
    bd.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // detail-data.js (~187KB) is loaded on first panel open, not on page load,
  // to keep the home page's main thread free for LCP/INP.
  let _ddPromise = null;
  function ensureDetailData() {
    if (window.DETAIL_DATA) return Promise.resolve();
    if (_ddPromise) return _ddPromise;
    _ddPromise = new Promise(res => {
      const s = document.createElement('script');
      s.src = 'detail-data.js?v=3';
      s.onload = res; s.onerror = res;
      document.head.appendChild(s);
    });
    return _ddPromise;
  }

  // Track viewed places for the home "Recently viewed" rail (retention).
  function trackView(item) {
    if (!item || !item.name) return;
    try {
      const rec = { name: item.name, kr: item.kr || '', emoji: item.emoji || '📍', region: item.region || '', cat: item.cat || '', at: Date.now() };
      let list = JSON.parse(localStorage.getItem('kp_viewed_v1') || '[]');
      list = list.filter(x => x && x.name !== rec.name);
      list.unshift(rec);
      localStorage.setItem('kp_viewed_v1', JSON.stringify(list.slice(0, 12)));
      document.dispatchEvent(new CustomEvent('kp:viewed'));
    } catch {}
  }

  function open(item) {
    trackView(item);
    if (window.DETAIL_DATA) { renderOpen(item); return; }
    // Open immediately with a loading state, then render once data arrives.
    createShell();
    lastItem = item;
    document.getElementById('dp-emoji').textContent = item.emoji || '';
    document.getElementById('dp-title').textContent = item.name || '';
    const body = document.getElementById('dp-body');
    if (body) body.innerHTML = '<div style="padding:48px 20px;text-align:center;color:var(--text2);font-size:14px">…</div>';
    document.getElementById('detail-panel').classList.add('open');
    document.getElementById('detail-backdrop').classList.add('open');
    document.body.classList.add('kp-modal-open');
    ensureDetailData().then(() => renderOpen(item));
  }

  function renderOpen(item) {
    createShell();
    lastItem = item;
    const d = getDetail(item.name);

    document.getElementById('dp-emoji').textContent = item.emoji || '';
    document.getElementById('dp-title').textContent = item.name;

    /* Save (❤️) button — carries full item for My Trip */
    const actions = document.getElementById('dp-head-actions');
    if (actions && window.kpTrip) {
      actions.dataset.item = JSON.stringify(item);
      actions.innerHTML = window.kpTrip.heartHTML(item);
    } else if (actions) {
      actions.innerHTML = '';
    }

    const metaParts = [];
    if (item.kr)     metaParts.push(`<span class="dp-kr">${esc(item.kr)}</span>`);
    if (item.region) metaParts.push(`<span class="dp-badge">📍 ${esc(item.region)}</span>`);
    if (d.schedule)  metaParts.push(`<span class="dp-badge">⏰ ${esc(d.schedule)}</span>`);
    document.getElementById('dp-meta').innerHTML = metaParts.join('');

    let html = '';

    /* Overview */
    const overview = d.overview || item.desc || '';
    if (overview) {
      html += `<div class="dp-overview">${esc(overview)}</div>`;
    }

    /* Best for */
    if (d.bestFor) {
      html += `<div class="dp-bestfor">✅ <strong>${tr('dp.bestfor', 'Best for')}:</strong> ${esc(d.bestFor)}</div>`;
    }

    /* How To */
    if (d.howto && d.howto.length) {
      html += `<div class="dp-section">
        <div class="dp-section-title">${tr('dp.howto', '📋 How To Use')}</div>
        <ol class="dp-steps">${d.howto.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>`;
    }

    /* Price */
    if (d.price && (d.price.range || d.price.note)) {
      html += `<div class="dp-section dp-price-box">
        <div class="dp-section-title">${tr('dp.price', '💰 Price & Budget')}</div>
        ${d.price.range ? `<div class="dp-price-range">${esc(d.price.range)}</div>` : ''}
        ${d.price.note  ? `<div class="dp-price-note">${esc(d.price.note)}</div>` : ''}
      </div>`;
    }

    /* Tips */
    if (d.tips && d.tips.length) {
      html += `<div class="dp-section">
        <div class="dp-section-title">${tr('dp.tips', '💡 Pro Tips')}</div>
        <ul class="dp-tips">${d.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>`;
    }

    /* Links */
    if (d.links && d.links.length) {
      html += `<div class="dp-section">
        <div class="dp-section-title">${tr('dp.links', '🔗 Useful Links & Apps')}</div>
        <div class="dp-links">${d.links.map(l =>
          `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="dp-link">${esc(l.label)} ↗</a>`
        ).join('')}</div>
      </div>`;
    }

    /* Map — Google embed if a key is present, otherwise a tappable
       fallback. Korea-savvy travellers also get Naver & Kakao map links,
       which have far better local coverage than Google Maps in Korea. */
    const rawQ = item.mapQ || item.name + ' Korea';
    const mapQ = encodeURIComponent(rawQ);
    const key  = window.MAPS_KEY;
    // Keyless Google embed — real map with no API key needed.
    const mapEmbed = (key && key.length > 10)
      ? `<iframe src="https://www.google.com/maps/embed/v1/search?key=${key}&q=${mapQ}&zoom=14&language=en&region=KR" allowfullscreen loading="lazy"></iframe>`
      : `<iframe src="https://maps.google.com/maps?q=${mapQ}&z=14&hl=en&output=embed" allowfullscreen loading="lazy" title="Map"></iframe>`;

    html += `<div class="dp-section dp-map-section">
      <div class="dp-section-title">${tr('dp.location', '🗺️ Location & Maps')}</div>
      <div class="dp-map-frame">${mapEmbed}</div>
      <div class="dp-map-actions">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${mapQ}" target="_blank" rel="noopener" class="dp-map-btn dp-map-primary">${tr('dp.directions', '🧭 Directions')}</a>
        <a href="https://www.google.com/maps/search/${mapQ}" target="_blank" rel="noopener" class="dp-map-btn">🗺️ Google</a>
        <a href="https://map.naver.com/p/search/${mapQ}" target="_blank" rel="noopener" class="dp-map-btn">🟢 Naver</a>
        <a href="https://map.kakao.com/?q=${mapQ}" target="_blank" rel="noopener" class="dp-map-btn">🟡 Kakao</a>
      </div>
    </div>`;

    /* Link to the full standalone (SEO/shareable) guide page */
    html += `<a class="dp-fullpage" href="places/${slugify(item.name)}.html">
      📄 ${tr('dp.fullpage', 'Open full guide page')} →
    </a>`;

    document.getElementById('dp-body').innerHTML = html;

    document.getElementById('detail-panel').classList.add('open');
    document.getElementById('detail-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('kp-modal-open');

    /* Also fetch Google Place reviews into panel */
    fetchReviews(item.mapQ || item.name + ' Korea');
  }

  async function fetchReviews(query) {
    if (!window.WORKER_URL) return;
    try {
      const res = await fetch(window.WORKER_URL + '/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.rating) return;

      const stars = '⭐'.repeat(Math.round(data.rating));
      const reviewHtml = (data.reviews || []).slice(0, 3).map(r => `
        <div class="dp-review">
          <div class="dp-review-top">
            <span class="dp-reviewer">${esc(r.authorName)}</span>
            <span class="dp-review-stars">${'⭐'.repeat(r.rating || 0)}</span>
            <span class="dp-review-time">${esc(r.relativeTime || '')}</span>
          </div>
          <div class="dp-review-text">${esc((r.text || '').slice(0, 220))}${(r.text || '').length > 220 ? '…' : ''}</div>
        </div>`).join('');

      const ratingBlock = `<div class="dp-section dp-reviews-section">
        <div class="dp-section-title">${tr('dp.rating', '⭐ Google Rating')}</div>
        <div class="dp-rating-row">
          <span class="dp-rating-score">${data.rating.toFixed(1)}</span>
          <span class="dp-rating-stars">${stars}</span>
          <span class="dp-rating-count">(${(data.userRatingsTotal || 0).toLocaleString()} ${tr('dp.reviews', 'reviews')})</span>
        </div>
        ${reviewHtml}
      </div>`;

      /* Insert before the map section */
      const body = document.getElementById('dp-body');
      const mapSec = body.querySelector('.dp-map-section');
      if (mapSec) mapSec.insertAdjacentHTML('beforebegin', ratingBlock);
      else body.insertAdjacentHTML('beforeend', ratingBlock);
    } catch { /* silent */ }
  }

  function close() {
    document.getElementById('detail-panel')?.classList.remove('open');
    document.getElementById('detail-backdrop')?.classList.remove('open');
    document.body.style.overflow = '';
    document.body.classList.remove('kp-modal-open');
  }

  /* Re-render with new section labels when the language changes. */
  document.addEventListener('kp:langchange', () => {
    const panel = document.getElementById('detail-panel');
    if (lastItem && panel && panel.classList.contains('open')) open(lastItem);
  });

  window.kpDetail = { open, close };
})();
