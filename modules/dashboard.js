/**
 * KoreaPlus Real-Time Dashboard Widget (Section 6)
 * Fixed bottom-right collapsible widget showing live Korea data.
 * Depends on: modules/api-client.js
 */
(function () {
  const t = (k, fb) => { const v = window.kpI18n?.t(k); return (v && v !== k) ? v : fb; };
  function init() {
    if (!window.KPApi) { setTimeout(init, 100); return; }
    const widget = buildWidget();
    document.body.appendChild(widget);
    startClock();
    loadData();
    setInterval(loadData, 5 * 60 * 1000); // refresh every 5 min
  }

  function buildWidget() {
    const el = document.createElement('div');
    el.id = 'kp-dashboard';
    el.innerHTML = `
      <div class="kpd-header" id="kpd-header">
        <div class="kpd-header-left">${t('dash.title','🇰🇷 Korea Now')}</div>
        <div class="kpd-controls">
          <button class="kpd-ctrl-btn" id="kpd-refresh-btn" title="Refresh" onclick="event.stopPropagation()">↻</button>
          <button class="kpd-ctrl-btn" id="kpd-toggle-btn" title="Collapse">−</button>
        </div>
      </div>
      <div class="kpd-body" id="kpd-body">
        <div class="kpd-section">
          <div class="kpd-section-label" data-kpd="dash.time">${t('dash.time','Seoul Time (KST)')}</div>
          <div class="kpd-clock" id="kpd-clock">--:--:--</div>
          <div class="kpd-clock-sub" id="kpd-clock-sub">—</div>
        </div>
        <div class="kpd-section">
          <div class="kpd-section-label" data-kpd="dash.weather">${t('dash.weather','Seoul Weather')}</div>
          <div id="kpd-weather"><span class="kpd-loading">${t('dash.loading','Loading…')}</span></div>
        </div>
        <div class="kpd-section">
          <div class="kpd-section-label" data-kpd="dash.rates">${t('dash.rates','Exchange Rates (→ KRW)')}</div>
          <div id="kpd-rates"><span class="kpd-loading">${t('dash.loading','Loading…')}</span></div>
        </div>
        <div class="kpd-section">
          <div class="kpd-section-label" data-kpd="dash.events">${t('dash.events','Active Events')}</div>
          <div id="kpd-events"><span class="kpd-loading">${t('dash.loading','Loading…')}</span></div>
        </div>
      </div>`;

    const collapsed = localStorage.getItem('kpd-collapsed') === '1';
    applyCollapse(el, collapsed);

    el.querySelector('#kpd-header').addEventListener('click', () => toggle(el));
    el.querySelector('#kpd-toggle-btn').addEventListener('click', (e) => { e.stopPropagation(); toggle(el); });
    el.querySelector('#kpd-refresh-btn').addEventListener('click', (e) => { e.stopPropagation(); loadData(true); });

    return el;
  }

  function toggle(el) {
    const body = el.querySelector('#kpd-body');
    const btn  = el.querySelector('#kpd-toggle-btn');
    const now  = body.style.display === 'none';
    body.style.display = now ? '' : 'none';
    btn.textContent = now ? '−' : '+';
    localStorage.setItem('kpd-collapsed', now ? '0' : '1');
  }

  function applyCollapse(el, collapsed) {
    const body = el.querySelector('#kpd-body');
    const btn  = el.querySelector('#kpd-toggle-btn');
    body.style.display = collapsed ? 'none' : '';
    btn.textContent = collapsed ? '+' : '−';
  }

  function startClock() {
    const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function tick() {
      const now = new Date(Date.now() + 9 * 3600_000);
      const h = String(now.getUTCHours()).padStart(2,'0');
      const m = String(now.getUTCMinutes()).padStart(2,'0');
      const s = String(now.getUTCSeconds()).padStart(2,'0');
      const clockEl = document.getElementById('kpd-clock');
      const subEl   = document.getElementById('kpd-clock-sub');
      if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
      if (subEl) subEl.textContent = `${DAYS[now.getUTCDay()]}, ${MONTHS[now.getUTCMonth()]} ${now.getUTCDate()}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  async function loadData(force = false) {
    await Promise.allSettled([
      loadWeather(),
      loadExchange(),
      loadEvents(),
    ]);
  }

  async function loadWeather() {
    const el = document.getElementById('kpd-weather');
    if (!el) return;
    try {
      const [w, a] = await Promise.all([
        window.KPApi.getWeather('Seoul'),
        window.KPApi.getAqi('Seoul').catch(() => null),
      ]);
      const aqiGrade = a?.khaiGrade ?? a?.pm25Grade ?? 'unknown';
      const aqiLabel = { good:t('air.good','Good 🟢'), moderate:t('air.moderate','Moderate 🟡'), unhealthy:t('air.unhealthy','Unhealthy 🟠'), veryUnhealthy:t('air.veryBad','Very Bad 🔴'), unknown:'—' }[aqiGrade] ?? '—';
      const pm25 = a?.pm25 != null ? `PM2.5 ${a.pm25}μg` : '';

      el.innerHTML = `
        <div class="kpd-weather-row">
          <div class="kpd-temp">${w.conditionEmoji || '🌡️'} ${Math.round(w.temp)}°C</div>
          <div class="kpd-weather-detail">
            ${w.condition}<br>
            💧${w.humidity}% 💨${w.windSpeed}m/s
          </div>
        </div>
        <div class="aqi-grade aqi-${aqiGrade}" style="margin-top:6px">
          ${t('air.label','Air')}: ${aqiLabel} ${pm25 ? `· ${pm25}` : ''}
        </div>`;
    } catch {
      el.innerHTML = `<span class="kpd-loading">${t('dash.wUnavail','Weather unavailable')}</span>`;
    }
  }

  async function loadExchange() {
    const el = document.getElementById('kpd-rates');
    if (!el) return;
    try {
      const ex = await window.KPApi.getExchange();
      const currencies = [
        { code: 'USD', symbol: '$',  flag: '🇺🇸' },
        { code: 'EUR', symbol: '€',  flag: '🇪🇺' },
        { code: 'JPY', symbol: '¥',  flag: '🇯🇵' },
        { code: 'CNY', symbol: '¥',  flag: '🇨🇳' },
        { code: 'GBP', symbol: '£',  flag: '🇬🇧' },
      ];
      const usdToKrw = ex.usdToKrw || Math.round(1 / (ex.rates?.USD || 0.00072));
      const rows = currencies.map(c => {
        // How many KRW = 1 of this currency
        const rate = ex.rates?.[c.code];
        if (!rate) return '';
        const krwPer1 = Math.round(1 / rate);
        return `<div class="kpd-rate-row">
          <span class="kpd-currency">${c.flag} 1 ${c.code}</span>
          <span class="kpd-amount">${krwPer1.toLocaleString()} ₩</span>
        </div>`;
      }).join('');
      el.innerHTML = rows || '<span class="kpd-loading">N/A</span>';
    } catch {
      el.innerHTML = `<span class="kpd-loading">${t('dash.rUnavail','Rates unavailable')}</span>`;
    }
  }

  async function loadEvents() {
    const el = document.getElementById('kpd-events');
    if (!el) return;
    try {
      const today = window.KPApi.todayKST();
      const result = await window.KPApi.getFestivals({ from: today, to: today });
      const count = result?.total ?? (Array.isArray(result) ? result.length : (result?.festivals?.length ?? 0));
      el.innerHTML = `
        <div class="kpd-events-count">${count} ${t('dash.fest','festivals today')}</div>
        <div class="kpd-events-sub">${t('dash.across','across South Korea')}</div>
        <a class="kpd-link" href="festivals.html">${t('dash.viewCal','View festival calendar →')}</a>`;
    } catch {
      el.innerHTML = `<a class="kpd-link" href="festivals.html">${t('dash.viewCal','View festival calendar →')}</a>`;
    }
  }

  // Re-localize labels + data text when the language changes
  document.addEventListener('kp:langchange', () => {
    const w = document.getElementById('kp-dashboard');
    if (!w) return;
    const left = w.querySelector('.kpd-header-left');
    if (left) left.textContent = t('dash.title', '🇰🇷 Korea Now');
    w.querySelectorAll('[data-kpd]').forEach(elm => { elm.textContent = t(elm.dataset.kpd, elm.textContent); });
    loadData();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
