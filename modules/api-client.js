/**
 * KoreaPlus shared API client (browser-side)
 * Wraps Cloudflare Worker endpoints with in-memory TTL cache.
 * window.WORKER_URL must be set before this script runs.
 */
(function () {
  const TTL = {
    weather:   2 * 60 * 1000,   // 2 min (worker already caches 2hr server-side)
    aqi:       2 * 60 * 1000,
    exchange:  10 * 60 * 1000,  // 10 min
    festivals: 30 * 60 * 1000,  // 30 min
    places:    60 * 60 * 1000,  // 1 hr
    shows:     30 * 60 * 1000,
  };

  const _cache = new Map();

  // bypass:true skips the in-memory tier (the caller is doing a deliberate
  // refresh); pair it with the worker's own ?fresh=1 to pierce KV as well,
  // otherwise the "refresh" just re-serves the cached response.
  async function kpFetch(path, ttlMs = 60_000, opts = {}) {
    const base = window.WORKER_URL || '';
    if (!base) throw new Error('WORKER_URL not set');
    // cacheKey lets a "?fresh=1" variant overwrite the entry its plain
    // counterpart reads, instead of filling a second, parallel slot.
    const key = opts.cacheKey || path;
    const hit = _cache.get(key);
    if (hit && !opts.bypass && Date.now() - hit.ts < ttlMs) return hit.data;
    try {
      const res = await fetch(base + path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const envelope = await res.json();
      const data = envelope.data ?? envelope;
      _cache.set(key, { data, ts: Date.now() });
      return data;
    } catch (err) {
      if (hit) return hit.data; // return stale on error
      throw err;
    }
  }

  /** YYYYMMDD string for today (KST = UTC+9) */
  function todayKST() {
    return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '');
  }

  /** YYYYMMDD string N days from today (KST) */
  function futureDateKST(days) {
    return new Date(Date.now() + 9 * 3600_000 + days * 86_400_000)
      .toISOString().slice(0, 10).replace(/-/g, '');
  }

  window.KPApi = {
    getWeather:   (city = 'Seoul') => kpFetch(`/api/weather?city=${city}`, TTL.weather),
    getForecast:  (city = 'Seoul') => kpFetch(`/api/forecast?city=${city}`, TTL.weather),
    getAqi:       (city = 'Seoul') => kpFetch(`/api/airquality?city=${city}`, TTL.aqi),
    getExchange:  ()               => kpFetch('/api/exchange', TTL.exchange),
    getCities:    ()               => kpFetch('/api/cities', 24 * 3600_000),

    getFestivals(opts = {}) {
      const from = opts.from || todayKST();
      const to   = opts.to   || futureDateKST(90);
      const city = opts.city ? `&city=${opts.city}` : '';
      const page = opts.page ? `&page=${opts.page}` : '';
      return kpFetch(`/api/festivals?from=${from}&to=${to}${city}${page}`, TTL.festivals);
    },

    getPlaces(opts = {}) {
      const city = opts.city || 'Seoul';
      const cat  = opts.cat  ? `&cat=${opts.cat}` : '';
      const page = opts.page ? `&page=${opts.page}` : '';
      return kpFetch(`/api/places?city=${city}${cat}${page}`, TTL.places);
    },

    getLocationBased(lat, lng, radius = 5000, cat = '') {
      const c = cat ? `&cat=${cat}` : '';
      return kpFetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=${radius}${c}`, TTL.places);
    },

    getShows(opts = {}) {
      const from  = opts.from  || todayKST();
      const to    = opts.to    || futureDateKST(30);
      const cat   = opts.cat   ? `&cat=${opts.cat}` : '';
      const area  = opts.area  ? `&area=${opts.area}` : '';
      const state = opts.state ? `&state=${opts.state}` : '&state=02'; // default: ongoing
      return kpFetch(`/api/shows?from=${from}&to=${to}${cat}${area}${state}`, TTL.shows);
    },

    getBoxOffice: (type = 'week') => kpFetch(`/api/boxoffice?type=${type}`, TTL.shows),
    getSubway:    (station)       => kpFetch(`/api/subway?station=${encodeURIComponent(station)}`, 30_000),
    getBikes:     (lat, lng)      => kpFetch(`/api/bikes?lat=${lat}&lng=${lng}`, 120_000),

    // ── K-Pop vertical ──────────────────────────────────────────────────────
    // fresh:true = user pressed ↻ — bypasses the in-memory TTL *and* the
    // worker's KV entry, then overwrites the shared cache slot.
    getKpopCharts(store = 'kr', type = 'songs', fresh = false) {
      const base = `/api/kpop/charts?store=${store}&type=${type}&limit=50`;
      return kpFetch(fresh ? base + '&fresh=1' : base, 60 * 60_000,       // 1 hr
        fresh ? { bypass: true, cacheKey: base } : {});
    },
    getHealth: () => kpFetch('/api/health', 10 * 60_000),                 // 10 min

    /** Bias Battle tally. GET reads, POST casts one vote (server dedups by IP). */
    getKpopVotes: (battle) =>
      kpFetch(`/api/kpop/vote?battle=${encodeURIComponent(battle)}`, 60_000),
    async postKpopVote(battle, pick) {
      const base = window.WORKER_URL || '';
      if (!base) throw new Error('WORKER_URL not set');
      const res = await fetch(
        `${base}/api/kpop/vote?battle=${encodeURIComponent(battle)}&pick=${pick === 'b' ? 'b' : 'a'}`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const env = await res.json();
      const data = (env && (env.data ?? env)) || {};
      // Keep the GET slot in step so a re-render doesn't show the pre-vote count.
      _cache.set(`/api/kpop/vote?battle=${encodeURIComponent(battle)}`, { data, ts: Date.now() });
      return data;
    },
    getKpopTicker: () => kpFetch('/api/kpop/ticker', 30 * 60_000),                        // 30 min
    getKpopBio:    (qid, lang = 'en') =>
      kpFetch(`/api/kpop/bio?qid=${encodeURIComponent(qid)}&lang=${lang}`, 24 * 3600_000),
    getKpopArtist(opts = {}) {
      const p = new URLSearchParams({ id: opts.id || '' });
      if (opts.qid)     p.set('qid', opts.qid);
      if (opts.spotify) p.set('spotify', opts.spotify);
      if (opts.channel) p.set('channel', opts.channel);
      if (opts.lang)    p.set('lang', opts.lang);
      return kpFetch(`/api/kpop/artist?${p.toString()}`, 12 * 3600_000);
    },
    getKpopFeed: (artist = '', lang = '') =>
      kpFetch(`/api/kpop/feed?artist=${encodeURIComponent(artist)}${lang ? `&lang=${lang}` : ''}`, 5 * 60_000),
    getKpopConcerts: (artist = '', country = '') =>
      kpFetch(`/api/kpop/concerts?artist=${encodeURIComponent(artist)}${country ? `&country=${country}` : ''}`, 6 * 3600_000),
    getAff: (city, cat, q = '') =>
      kpFetch(`/api/aff?city=${encodeURIComponent(city)}&cat=${cat}&q=${encodeURIComponent(q)}`, 60 * 60_000),

    // ── "Ask this page" (S14) — POST /chat with a page-context summary ───────
    //    NOT cached (each question is unique). ctx = short page summary (NOT
    //    full body) so the token cost stays bounded. Cost-sensitive: callers
    //    must gate on window.KP_ASK_ENABLED + language whitelist + user click.
    async askPage(question, opts = {}) {
      const base = window.WORKER_URL || '';
      if (!base) throw new Error('WORKER_URL not set');
      const ctx = (opts.ctx || '').slice(0, 600);
      const lang = opts.lang || (document.documentElement.lang || 'en').slice(0, 2);
      const message = ctx
        ? `Context about the page the user is reading:\n"${ctx}"\n\nUser question: ${question}`
        : question;
      const res = await fetch(base + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, lang: lang }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const env = await res.json();
      return (env && (env.reply || env.data)) || '';
    },

    // ── K-Beauty vertical ─────────────────────────────────────────────────────
    // Live AliExpress product grid (server-side HMAC-signed; seller-listing
    // photos allowed). Returns [] gracefully when ALI_APP_SECRET is unset.
    getKbeautyProducts: (q = 'korean skincare', lang = '') =>
      kpFetch(`/api/kbeauty/products?q=${encodeURIComponent(q)}${lang ? `&lang=${lang}` : ''}`, 12 * 3600_000), // 12 hr
    // Zero-key 9-language brand bio via Wikidata.
    getKbeautyBio: (qid, lang = 'en') =>
      kpFetch(`/api/kbeauty/bio?qid=${encodeURIComponent(qid)}&lang=${lang}`, 24 * 3600_000),

    todayKST,
    futureDateKST,

    /** Format YYYYMMDD → "Jun 12" */
    fmtDate(d) {
      if (!d || d.length < 8) return d;
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[parseInt(d.slice(4,6))-1]} ${parseInt(d.slice(6,8))}`;
    },

    /** Format YYYYMMDD range → "Jun 12 – 15" or "May 31 – Jun 2" */
    fmtDateRange(start, end) {
      if (!start) return '';
      if (!end || start === end) return KPApi.fmtDate(start);
      const sM = parseInt(start.slice(4,6)), eM = parseInt(end.slice(4,6));
      const sD = parseInt(start.slice(6,8)), eD = parseInt(end.slice(6,8));
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      if (sM === eM) return `${months[sM-1]} ${sD}–${eD}`;
      return `${months[sM-1]} ${sD} – ${months[eM-1]} ${eD}`;
    },
  };
  const { KPApi } = window;
})();
