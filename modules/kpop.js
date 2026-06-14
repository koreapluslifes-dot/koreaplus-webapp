/* modules/kpop.js — K-Pop hub renderer.
   Renders fully from the manual tier (window.KPOP_ROSTER / KPOP_UPCOMING) with
   ZERO API keys, then progressively enriches via the Worker (/api/kpop/*) when
   reachable. Bias-follow persists in localStorage. Loaded last by kpop.html. */
(function () {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const ROSTER   = window.KPOP_ROSTER   || [];
  const UPCOMING = window.KPOP_UPCOMING || [];
  const API = window.KPApi || null;
  const FOLLOW_KEY = 'kp_kpop_follow';

  const lang = (localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2) || 'en').toLowerCase();

  // ── Mini i18n for JS-generated labels (chrome uses data-i18n via i18n.js) ──
  const STR = {
    en: { anniv:'Year Anniversary', debut:'Debut', comeback:'Comeback', today:'Out today!', dleft:'days', d:'D', h:'H', m:'M', s:'S', follow:'Follow', following:'Following', yours:'★ Your artists', all:'All artists', members:'Members', agency:'Agency', fandom:'Fandom', debuted:'Debuted', share:'Share', spotify:'Spotify', youtube:'YouTube', official:'Official', tickets:'Find concerts', bioSoon:'Bio loads when connected.', newsEmpty:'Live news lights up here once connected — follow your bias to personalize this feed.', chartFail:'Charts are catching their breath — check back shortly.', followToast:'Added to your artists ★', unfollowToast:'Removed' },
    ko: { anniv:'주년', debut:'데뷔', comeback:'컴백', today:'오늘 발매!', dleft:'일', d:'일', h:'시', m:'분', s:'초', follow:'팔로우', following:'팔로잉', yours:'★ 내 아티스트', all:'전체 아티스트', members:'멤버', agency:'소속사', fandom:'팬덤', debuted:'데뷔일', share:'공유', spotify:'스포티파이', youtube:'유튜브', official:'공식', tickets:'공연 찾기', bioSoon:'연결되면 소개가 표시됩니다.', newsEmpty:'연결되면 실시간 뉴스가 표시됩니다 — 최애를 팔로우해 피드를 맞춤화하세요.', chartFail:'차트를 불러오지 못했어요 — 잠시 후 다시 시도해요.', followToast:'내 아티스트에 추가됨 ★', unfollowToast:'삭제됨' },
    ja: { anniv:'周年', debut:'デビュー', comeback:'カムバック', today:'本日リリース!', dleft:'日', d:'日', h:'時', m:'分', s:'秒', follow:'フォロー', following:'フォロー中', yours:'★ お気に入り', all:'すべて', members:'メンバー', agency:'事務所', fandom:'ファンダム', debuted:'デビュー日', share:'シェア', spotify:'Spotify', youtube:'YouTube', official:'公式', tickets:'公演を探す', bioSoon:'接続するとプロフィールが表示されます。', newsEmpty:'接続すると最新ニュースが表示されます — 推しをフォローしてフィードをカスタマイズ。', chartFail:'チャートを取得できませんでした — 後ほどお試しください。', followToast:'お気に入りに追加 ★', unfollowToast:'削除しました' },
  };
  const t = (k) => (STR[lang] && STR[lang][k]) || STR.en[k] || k;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toast = (msg) => {
    let el = $('#kpop-toast');
    if (!el) { el = document.createElement('div'); el.id = 'kpop-toast'; el.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:10px 18px;border-radius:22px;font-size:13px;font-weight:700;z-index:300;opacity:0;transition:opacity .2s;pointer-events:none'; document.body.appendChild(el); }
    el.textContent = msg; el.style.opacity = '1';
    clearTimeout(el._tm); el._tm = setTimeout(() => { el.style.opacity = '0'; }, 1800);
  };

  // ── Follow state ───────────────────────────────────────────────────────────
  const getFollows = () => { try { return new Set(JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]')); } catch { return new Set(); } };
  const setFollows = (set) => { try { localStorage.setItem(FOLLOW_KEY, JSON.stringify([...set])); } catch {} };

  // ── Dates (KST) ──────────────────────────────────────────────────────────
  const KST_MS = 9 * 3600_000;
  const nowKST = () => new Date(Date.now() + KST_MS);
  function nextAnniversary(debutISO) {
    if (!debutISO || debutISO.length < 10) return null;
    const [y, mo, d] = debutISO.split('-').map(Number);
    const now = nowKST();
    let year = now.getUTCFullYear();
    // build candidate at 00:00 KST → represented in UTC by subtracting offset
    let cand = new Date(Date.UTC(year, mo - 1, d) - KST_MS);
    const todayMid = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - KST_MS);
    if (cand < todayMid) { year += 1; cand = new Date(Date.UTC(year, mo - 1, d) - KST_MS); }
    return { date: cand, years: year - y };
  }
  function daysBetween(future) {
    const now = nowKST();
    const a = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const f = future;
    const b = Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate());
    return Math.round((b - a) / 86400_000);
  }
  const fmtDate = (d) => d.toLocaleDateString(lang === 'en' ? undefined : lang, { year: 'numeric', month: 'short', day: 'numeric' });

  // ── Build the events list (zero-key) ───────────────────────────────────────
  function buildEvents() {
    const byId = Object.fromEntries(ROSTER.map(a => [a.id, a]));
    const events = [];
    // curated confirmed releases
    for (const u of UPCOMING) {
      const a = byId[u.artistId]; if (!a || !u.date) continue;
      const dt = new Date(u.date + 'T00:00:00+09:00');
      const dl = daysBetween(dt); if (dl < 0) continue;
      events.push({ artist: a, type: (u.type || t('comeback')), typeKey: u.type || 'comeback', title: u.title || '', date: dt, daysLeft: dl, confirmed: u.confirmed !== false });
    }
    // debut anniversaries (always accurate, recurring)
    for (const a of ROSTER) {
      const an = nextAnniversary(a.debut); if (!an) continue;
      const dl = daysBetween(an.date);
      events.push({ artist: a, type: t('debut'), typeKey: 'anniversary', title: `${an.years}${lang === 'en' ? 'th ' : ''}${t('anniv')}`, date: an.date, daysLeft: dl, confirmed: true });
    }
    const follows = getFollows();
    events.sort((p, q) => (p.daysLeft - q.daysLeft) || (follows.has(q.artist.id) - follows.has(p.artist.id)));
    return events;
  }

  let EVENTS = [];

  // ── Render: countdowns ─────────────────────────────────────────────────────
  function renderCountdowns() {
    const grid = $('#kpop-cd-grid'); if (!grid) return;
    const follows = getFollows();
    // followed first, then soonest; cap at 12
    const list = EVENTS.slice().sort((p, q) => (follows.has(q.artist.id) - follows.has(p.artist.id)) || (p.daysLeft - q.daysLeft)).slice(0, 12);
    grid.innerHTML = list.map((e, i) => {
      const isToday = e.daysLeft === 0;
      return `<div class="cd-card${isToday ? ' is-today' : ''}" data-cd="${i}">
        <div class="cd-type">${esc(e.type)}${e.confirmed ? '' : ' ·?'}</div>
        <div class="cd-artist">${e.artist.emoji || ''} ${esc(e.artist.nameEn)}</div>
        <div class="cd-title">${esc(e.title)} · ${esc(fmtDate(e.date))}</div>
        <div class="cd-timer" data-target="${e.date.getTime()}">
          <div class="cd-unit"><div class="cd-num" data-u="d">–</div><div class="cd-lab">${esc(t('d'))}</div></div>
          <div class="cd-unit"><div class="cd-num" data-u="h">–</div><div class="cd-lab">${esc(t('h'))}</div></div>
          <div class="cd-unit"><div class="cd-num" data-u="m">–</div><div class="cd-lab">${esc(t('m'))}</div></div>
          <div class="cd-unit"><div class="cd-num" data-u="s">–</div><div class="cd-lab">${esc(t('s'))}</div></div>
        </div>
        <div class="cd-actions">
          <button class="cd-share" data-share="${i}">📤 ${esc(t('share'))}</button>
        </div>
      </div>`;
    }).join('');
    $$('.cd-share', grid).forEach(btn => btn.addEventListener('click', () => {
      const e = list[+btn.dataset.share]; if (!e || !window.KpopShareCard) return;
      window.KpopShareCard.generate({ artist: e.artist.nameEn, emoji: e.artist.emoji, type: e.type, title: e.title, daysLeft: e.daysLeft, dateLabel: fmtDate(e.date) });
    }));
    tickTimers();
  }

  function tickTimers() {
    const now = Date.now();
    $$('.cd-timer').forEach(tm => {
      let diff = Math.max(0, (+tm.dataset.target) - now);
      const d = Math.floor(diff / 86400_000); diff -= d * 86400_000;
      const h = Math.floor(diff / 3600_000); diff -= h * 3600_000;
      const m = Math.floor(diff / 60_000); diff -= m * 60_000;
      const s = Math.floor(diff / 1000);
      const set = (u, v) => { const el = tm.querySelector(`[data-u="${u}"]`); if (el) el.textContent = String(v).padStart(2, '0'); };
      set('d', d); set('h', h); set('m', m); set('s', s);
    });
  }

  // ── Render: artists (bias-follow) ──────────────────────────────────────────
  let showFollowedOnly = false;
  function renderArtists() {
    const grid = $('#kpop-art-grid'); if (!grid) return;
    const follows = getFollows();
    const toggle = $('#art-toggle');
    if (toggle) {
      toggle.hidden = follows.size === 0;
      toggle.textContent = showFollowedOnly ? t('all') : t('yours');
    }
    let list = ROSTER.slice();
    if (showFollowedOnly) list = list.filter(a => follows.has(a.id));
    // followed first
    list.sort((a, b) => (follows.has(b.id) - follows.has(a.id)));
    grid.innerHTML = list.map(a => `
      <div class="art-card${follows.has(a.id) ? ' followed' : ''}" data-id="${esc(a.id)}" tabindex="0" role="button">
        <button class="art-follow" data-follow="${esc(a.id)}" aria-label="Follow ${esc(a.nameEn)}">${follows.has(a.id) ? '★' : '☆'}</button>
        <div class="art-emoji">${a.emoji || '🎤'}</div>
        <div class="art-name">${esc(a.nameEn)}</div>
        <div class="art-ko">${esc(a.nameKo || '')}</div>
        <div class="art-agency">${esc((a.agency || '').split(' (')[0])}</div>
        ${a.fandom ? `<span class="art-fan">${esc(a.fandom)}</span>` : ''}
      </div>`).join('');
    $$('.art-follow', grid).forEach(b => b.addEventListener('click', (ev) => { ev.stopPropagation(); toggleFollow(b.dataset.follow); }));
    $$('.art-card', grid).forEach(card => {
      const open = () => openArtist(card.dataset.id);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function toggleFollow(id) {
    const f = getFollows();
    if (f.has(id)) { f.delete(id); toast(t('unfollowToast')); }
    else { f.add(id); toast(t('followToast')); }
    setFollows(f);
    renderArtists(); renderCountdowns(); renderTicker();
  }

  // ── Artist modal ───────────────────────────────────────────────────────────
  function openArtist(id) {
    const a = ROSTER.find(x => x.id === id); if (!a) return;
    const bg = $('#kpop-modal-bg'), box = $('#kpop-modal'); if (!bg || !box) return;
    const follows = getFollows();
    const ytQ = encodeURIComponent(a.nameEn + ' official');
    const spLink = a.spotifyId ? `https://open.spotify.com/artist/${a.spotifyId}` : `https://open.spotify.com/search/${encodeURIComponent(a.nameEn)}`;
    const ytLink = a.youtubeChannelId ? `https://www.youtube.com/channel/${a.youtubeChannelId}` : `https://www.youtube.com/results?search_query=${ytQ}`;
    box.innerHTML = `
      <button class="kpop-modal-x" data-close aria-label="Close">✕</button>
      <div style="text-align:center">
        <div class="km-emoji">${a.emoji || '🎤'}</div>
        <div class="km-name">${esc(a.nameEn)}</div>
        <div class="km-ko">${esc(a.nameKo || '')}</div>
      </div>
      <div class="km-facts">
        ${a.agency ? `<span class="km-fact">🏢 ${esc(a.agency)}</span>` : ''}
        ${a.debut ? `<span class="km-fact">📅 ${esc(t('debuted'))} ${esc(a.debut)}</span>` : ''}
        ${a.fandom ? `<span class="km-fact">💗 ${esc(a.fandom)}</span>` : ''}
      </div>
      <div class="km-bio" id="km-bio">${a.wikidataId ? `<span style="opacity:.6">${esc(t('bioSoon'))}</span>` : ''}</div>
      ${a.members && a.members.length ? `<div class="km-members"><b>${esc(t('members'))}:</b> ${esc(a.members.join(' · '))}</div>` : ''}
      <div class="km-links">
        <button class="km-link primary" data-followbtn="${esc(a.id)}">${follows.has(a.id) ? '★ ' + esc(t('following')) : '☆ ' + esc(t('follow'))}</button>
        <a class="km-link" href="${spLink}" target="_blank" rel="noopener">▶ ${esc(t('spotify'))}</a>
        <a class="km-link" href="${ytLink}" target="_blank" rel="noopener">▶ ${esc(t('youtube'))}</a>
        <a class="km-link" href="festivals.html">🎫 ${esc(t('tickets'))}</a>
      </div>`;
    bg.classList.add('open'); document.body.style.overflow = 'hidden';
    const fb = box.querySelector('[data-followbtn]');
    if (fb) fb.addEventListener('click', () => { toggleFollow(a.id); const f = getFollows(); fb.textContent = f.has(a.id) ? '★ ' + t('following') : '☆ ' + t('follow'); });
    // Enrich bio (zero-key Wikidata) when an id exists and worker reachable
    if (a.wikidataId && API && API.getKpopBio) {
      API.getKpopBio(a.wikidataId, lang).then(d => {
        if (!d || !d.bio) return;
        const bioEl = $('#km-bio'); if (!bioEl) return;
        bioEl.innerHTML = esc(d.bio) + (d.wikipediaUrl ? ` <a href="${esc(d.wikipediaUrl)}" target="_blank" rel="noopener">↗</a>` : '');
      }).catch(() => {});
    }
  }
  function closeModal() { const bg = $('#kpop-modal-bg'); if (bg) bg.classList.remove('open'); document.body.style.overflow = ''; }

  // ── Live data (worker; degrades gracefully) ────────────────────────────────
  function rosterMatch(artistName) {
    const n = (artistName || '').toLowerCase();
    return ROSTER.some(a => n.includes(a.nameEn.toLowerCase()) || (a.nameKo && artistName && artistName.includes(a.nameKo)));
  }
  async function loadCharts() {
    const box = $('#kpop-charts-list'); if (!box || !API) return;
    try {
      const rows = await API.getKpopCharts('kr', 'songs');
      if (!Array.isArray(rows) || !rows.length) throw new Error('empty');
      box.innerHTML = rows.slice(0, 30).map(r => `
        <a class="chart-row${rosterMatch(r.artist) ? ' is-roster' : ''}" href="${esc(r.url || '#')}" target="_blank" rel="noopener">
          <span class="chart-rank${r.rank <= 3 ? ' top' : ''}">${r.rank}</span>
          ${r.artworkUrl ? `<img class="chart-art" src="${esc(r.artworkUrl)}" alt="" loading="lazy">` : '<div class="chart-art"></div>'}
          <span class="chart-meta">
            <span class="chart-title">${esc(r.title)}</span>
            <span class="chart-artist">${esc(r.artist)}</span>
          </span>
        </a>`).join('');
    } catch {
      box.innerHTML = `<div class="kpop-empty">${esc(t('chartFail'))}</div>`;
    }
  }
  async function loadNews() {
    const box = $('#kpop-news-list'); if (!box || !API) return;
    const follows = [...getFollows()];
    const biasName = follows.length ? (ROSTER.find(a => a.id === follows[0]) || {}).nameEn : '';
    try {
      const items = await API.getKpopFeed(biasName || '', lang);
      if (!Array.isArray(items) || !items.length) throw new Error('empty');
      box.innerHTML = items.slice(0, 12).map(n => `
        <a class="news-card" href="${esc(n.link)}" target="_blank" rel="noopener">
          ${n.imageUrl ? `<img class="news-img" src="${esc(n.imageUrl)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
          <div class="news-body">
            <div class="news-title">${esc(n.title)}</div>
            <div class="news-meta">${n.credibility ? `<span class="news-cred">${esc(n.credibility)}</span>` : ''}<span>${esc(n.source || '')}</span></div>
          </div>
        </a>`).join('');
    } catch {
      box.innerHTML = `<div class="kpop-empty">${esc(t('newsEmpty'))}</div>`;
    }
  }

  // ── Ticker (soonest countdowns + live chart) ───────────────────────────────
  async function renderTicker() {
    const wrap = $('#kpop-ticker-wrap'), rail = $('#kpop-ticker'); if (!rail) return;
    const items = [];
    EVENTS.slice(0, 6).forEach(e => items.push({ kind: e.daysLeft === 0 ? '🎉' : '⏳', text: `${e.artist.emoji || ''} ${e.artist.nameEn} ${e.title}`, val: e.daysLeft === 0 ? t('today') : `${e.daysLeft}${t('dleft')}`, soon: e.daysLeft <= 7 }));
    if (API && API.getKpopTicker) {
      try {
        const tk = await API.getKpopTicker();
        if (Array.isArray(tk)) tk.slice(0, 8).forEach(x => items.push({ kind: '📈', text: x.text, val: x.value || '', soon: false }));
      } catch {}
    }
    if (!items.length) return;
    const html = items.map(it => `<span class="tk-item${it.soon ? ' is-soon' : ''}"><span class="tk-kind">${it.kind}</span>${esc(it.text)} <span class="tk-val">${esc(it.val)}</span></span>`).join('');
    rail.innerHTML = html + html; // duplicate for seamless marquee
    if (wrap) wrap.hidden = false;
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  function wireFilters() {
    const bar = $('#kpop-filters'); if (!bar) return;
    $$('.filter-chip', bar).forEach(chip => chip.addEventListener('click', () => {
      $$('.filter-chip', bar).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const target = chip.dataset.target;
      $$('.kpop-sec').forEach(sec => { sec.style.display = (target === 'all' || sec.id === target) ? '' : 'none'; });
      const funnel = $('#kpop-funnel'); if (funnel) funnel.style.display = (target === 'all') ? '' : 'none';
    }));
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  function boot() {
    EVENTS = buildEvents();
    renderCountdowns();
    renderArtists();
    wireFilters();
    renderTicker();
    loadCharts();
    loadNews();

    const toggle = $('#art-toggle');
    if (toggle) toggle.addEventListener('click', () => { showFollowedOnly = !showFollowedOnly; renderArtists(); });

    const bg = $('#kpop-modal-bg');
    if (bg) {
      bg.addEventListener('click', (e) => { if (e.target === bg || e.target.hasAttribute('data-close')) closeModal(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }
    setInterval(tickTimers, 1000);
    // Refresh anniversaries/sort hourly (cheap)
    setInterval(() => { EVENTS = buildEvents(); renderCountdowns(); }, 3600_000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
