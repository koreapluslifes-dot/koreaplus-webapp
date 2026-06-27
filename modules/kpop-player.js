/* modules/kpop-player.js — in-page YouTube mini-player. Lets users hear a song
   WITHOUT leaving the K-pop hub. Exposes window.kpPlay(query, meta).
   meta = { title, artist, channelId }. No API key (YouTube search embed; falls
   back to the artist's official channel uploads, then an "Open on YouTube" link). */
(function () {
  'use strict';
  if (window.kpPlay) return;

  var L = (localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2) || 'en').toLowerCase();
  var I = {
    en: { np: 'Now playing', open: 'Open on YouTube', close: 'Close', min: 'Minimize', exp: 'Expand', tip: 'Plays here — you stay on the page', ch: 'Official channel', loading: 'Loading…', err: "Couldn't load — open on YouTube" },
    ko: { np: '재생 중', open: 'YouTube에서 열기', close: '닫기', min: '접기', exp: '펼치기', tip: '이 페이지에서 바로 재생돼요', ch: '공식 채널', loading: '불러오는 중…', err: '재생할 수 없어요 — YouTube에서 열기' },
    ja: { np: '再生中', open: 'YouTubeで開く', close: '閉じる', min: '最小化', exp: '展開', tip: 'このページで再生されます', ch: '公式チャンネル', loading: '読み込み中…', err: '再生できません — YouTubeで開く' },
    zh: { np: '正在播放', open: '在 YouTube 打开', close: '关闭', min: '收起', exp: '展开', tip: '在本页直接播放，不跳转', ch: '官方频道', loading: '加载中…', err: '无法播放 — 在 YouTube 打开' },
    es: { np: 'Reproduciendo', open: 'Abrir en YouTube', close: 'Cerrar', min: 'Minimizar', exp: 'Expandir', tip: 'Suena aquí, sin salir de la página', ch: 'Canal oficial', loading: 'Cargando…', err: 'No se pudo cargar — abrir en YouTube' },
    fr: { np: 'Lecture', open: 'Ouvrir sur YouTube', close: 'Fermer', min: 'Réduire', exp: 'Agrandir', tip: 'La lecture se fait ici, vous restez sur la page', ch: 'Chaîne officielle', loading: 'Chargement…', err: 'Échec — ouvrir sur YouTube' },
    de: { np: 'Wird abgespielt', open: 'Auf YouTube öffnen', close: 'Schließen', min: 'Minimieren', exp: 'Erweitern', tip: 'Läuft hier — du bleibst auf der Seite', ch: 'Offizieller Kanal', loading: 'Lädt…', err: 'Fehlgeschlagen — auf YouTube öffnen' },
    pt: { np: 'Tocando agora', open: 'Abrir no YouTube', close: 'Fechar', min: 'Minimizar', exp: 'Expandir', tip: 'Toca aqui — você fica na página', ch: 'Canal oficial', loading: 'Carregando…', err: 'Não foi possível — abrir no YouTube' },
    id: { np: 'Sedang diputar', open: 'Buka di YouTube', close: 'Tutup', min: 'Perkecil', exp: 'Perbesar', tip: 'Diputar di sini — kamu tetap di halaman', ch: 'Channel resmi', loading: 'Memuat…', err: 'Gagal memuat — buka di YouTube' },
  };
  var t = function (k) { return (I[L] || I.en)[k] || I.en[k]; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var enc = encodeURIComponent;

  function injectCSS() {
    if (document.getElementById('kpp-player-css')) return;
    var s = document.createElement('style'); s.id = 'kpp-player-css';
    s.textContent = [
      '#kpp-player{position:fixed;left:16px;bottom:16px;z-index:65;width:min(360px,calc(100vw - 32px));',
      'background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.14));border-radius:16px;',
      'box-shadow:0 14px 40px rgba(0,0,0,.5);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(14px);',
      'transition:opacity .22s ease,transform .22s ease,visibility .22s;}',
      '#kpp-player.kpp-on{opacity:1;visibility:visible;transform:translateY(0);}',
      '#kpp-player .kpp-pl-head{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;}',
      '#kpp-player .kpp-pl-eq{flex:0 0 auto;display:flex;align-items:flex-end;gap:2px;height:14px;}',
      '#kpp-player .kpp-pl-eq i{width:3px;background:var(--accent,#ff2e74);border-radius:2px;animation:kppEq 0.9s ease-in-out infinite;}',
      '#kpp-player .kpp-pl-eq i:nth-child(1){height:6px;animation-delay:0s}#kpp-player .kpp-pl-eq i:nth-child(2){height:13px;animation-delay:.15s}#kpp-player .kpp-pl-eq i:nth-child(3){height:9px;animation-delay:.3s}',
      '@keyframes kppEq{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}',
      '#kpp-player .kpp-pl-meta{flex:1 1 auto;min-width:0;}',
      '#kpp-player .kpp-pl-t{font-size:13px;font-weight:800;color:var(--text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;}',
      '#kpp-player .kpp-pl-a{font-size:11px;color:var(--text2,#aab);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '#kpp-player .kpp-pl-btn{flex:0 0 auto;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:var(--text2,#aab);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
      '#kpp-player .kpp-pl-btn:hover{background:var(--bg,#0c0c14);color:var(--text,#fff);}',
      '#kpp-player .kpp-pl-frame{position:relative;width:100%;aspect-ratio:16/9;background:#000;}',
      '#kpp-player .kpp-pl-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;}',
      '#kpp-player .kpp-pl-state{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 16px;color:var(--text2,#aab);font-size:13px;font-weight:700;}',
      '#kpp-player .kpp-pl-foot{display:flex;align-items:center;gap:8px;padding:7px 12px 9px;}',
      '#kpp-player .kpp-pl-foot a{font-size:11px;color:var(--text2,#aab);text-decoration:none;}',
      '#kpp-player .kpp-pl-ch{font-size:11px;font-weight:800;color:var(--text,#fff);background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.16));border-radius:99px;padding:5px 10px;cursor:pointer;}',
      '#kpp-player .kpp-pl-ch:hover{border-color:var(--accent,#ff2e74);color:var(--accent,#ff2e74);}',
      '#kpp-player .kpp-pl-ch[hidden]{display:none;}',
      '#kpp-player .kpp-pl-foot a:hover{color:var(--accent2,#74b9ff);text-decoration:underline;}',
      '#kpp-player .kpp-pl-tip{margin-left:auto;font-size:10px;color:var(--text3,#8a93a0);}',
      '#kpp-player.kpp-min .kpp-pl-frame,#kpp-player.kpp-min .kpp-pl-foot{display:none;}',
      '@media (max-width:520px){#kpp-player{left:8px;right:8px;width:auto;bottom:8px;}}',
      '@media (prefers-reduced-motion:reduce){#kpp-player{transition:opacity .12s linear;transform:none;}#kpp-player.kpp-on{transform:none;}#kpp-player .kpp-pl-eq i{animation:none;}}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  var box = null, frame = null, titleEl = null, artistEl = null, openLink = null, minBtn = null, chBtn = null;
  var curCh = '', curTitle = '';
  function build() {
    if (box) return;
    injectCSS();
    box = document.createElement('div');
    box.id = 'kpp-player';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', t('np'));
    box.innerHTML =
      '<div class="kpp-pl-head">' +
        '<span class="kpp-pl-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="kpp-pl-meta"><span class="kpp-pl-t"></span><span class="kpp-pl-a"></span></span>' +
        '<button type="button" class="kpp-pl-btn kpp-pl-min" aria-label="' + esc(t('min')) + '">▾</button>' +
        '<button type="button" class="kpp-pl-btn kpp-pl-x" aria-label="' + esc(t('close')) + '">✕</button>' +
      '</div>' +
      '<div class="kpp-pl-frame"></div>' +
      '<div class="kpp-pl-foot"><button type="button" class="kpp-pl-ch" hidden>♪ ' + esc(t('ch')) + '</button><a class="kpp-pl-open" target="_blank" rel="noopener">▶ ' + esc(t('open')) + '</a><span class="kpp-pl-tip">' + esc(t('tip')) + '</span></div>';
    (document.body || document.documentElement).appendChild(box);
    frame = box.querySelector('.kpp-pl-frame');
    titleEl = box.querySelector('.kpp-pl-t');
    artistEl = box.querySelector('.kpp-pl-a');
    openLink = box.querySelector('.kpp-pl-open');
    minBtn = box.querySelector('.kpp-pl-min');
    chBtn = box.querySelector('.kpp-pl-ch');
    chBtn.addEventListener('click', function () { if (curCh) setFrame(channelUrl(curCh)); });
    box.querySelector('.kpp-pl-x').addEventListener('click', close);
    minBtn.addEventListener('click', function () {
      var m = box.classList.toggle('kpp-min');
      minBtn.textContent = m ? '▸' : '▾';
      minBtn.setAttribute('aria-label', m ? t('exp') : t('min'));
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('kpp-on')) close(); });
  }

  // Reliable in-page playback: resolve the exact video id via the worker (no API
  // key — it scrapes the public search), then embed BY ID. Falls back to the
  // artist's official channel uploads (always embeddable), then an Open link.
  function videoUrl(id) { return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1'; }
  function channelUrl(ch) { var up = 'UU' + String(ch).replace(/^UC/, ''); return 'https://www.youtube-nocookie.com/embed/videoseries?list=' + enc(up) + '&autoplay=1&rel=0&modestbranding=1'; }
  function setFrame(url) { if (frame) frame.innerHTML = '<iframe src="' + esc(url) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="' + esc(curTitle) + '"></iframe>'; }
  function setState(msg) { if (frame) frame.innerHTML = '<div class="kpp-pl-state">' + esc(msg) + '</div>'; }
  function workerBase() { return window.WORKER_URL || 'https://koreaplus-webapp.jeybeeicon.workers.dev'; }
  function resolveVideoId(q) {
    return globalThis.fetch(workerBase() + '/api/kpop/yt?q=' + enc(q))
      .then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.data && j.data.videoId) || null; })
      .catch(function () { return null; });
  }

  function close() {
    if (!box) return;
    box.classList.remove('kpp-on');
    if (frame) frame.innerHTML = ''; // stop playback
  }

  var playToken = 0;
  // window.kpPlay(query, { title, artist, channelId })
  window.kpPlay = function (query, meta) {
    try {
      meta = meta || {};
      build();
      box.classList.remove('kpp-min'); if (minBtn) minBtn.textContent = '▾';
      var q = (query || ((meta.artist ? meta.artist + ' ' : '') + (meta.title || ''))).trim();
      curCh = meta.channelId || '';
      curTitle = ((meta.title || '') + ' ' + (meta.artist || '')).trim();
      titleEl.textContent = meta.title || q;
      artistEl.textContent = meta.artist || '';
      openLink.href = 'https://www.youtube.com/results?search_query=' + enc(q + ' official');
      chBtn.hidden = !curCh;
      box.classList.add('kpp-on');
      setState(t('loading'));
      var token = ++playToken;
      resolveVideoId(q).then(function (vid) {
        if (token !== playToken) return;        // a newer click superseded this one
        if (vid) setFrame(videoUrl(vid));
        else if (curCh) setFrame(channelUrl(curCh));
        else setState(t('err'));
      });
    } catch (e) {}
  };
})();
