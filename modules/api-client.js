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

  async function kpFetch(path, ttlMs = 60_000) {
    const base = window.WORKER_URL || '';
    if (!base) throw new Error('WORKER_URL not set');
    const key = path;
    const hit = _cache.get(key);
    if (hit && Date.now() - hit.ts < ttlMs) return hit.data;
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
