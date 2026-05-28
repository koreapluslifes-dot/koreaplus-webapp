/**
 * "Happening This Week in Korea" — auto-inserted carousel section (Section 1)
 * Inserts itself after the element with id="korea-map" (or a #week-anchor div).
 * Depends on: modules/api-client.js
 */
(function () {
  function init() {
    if (!window.KPApi) { setTimeout(init, 100); return; }

    const anchor = document.getElementById('week-anchor') || document.getElementById('korea-map');
    if (!anchor) return;

    const section = buildSectionShell();
    anchor.insertAdjacentElement('afterend', section);
    loadContent(section);
  }

  function buildSectionShell() {
    const el = document.createElement('section');
    el.id = 'week-section';
    const today = window.KPApi.todayKST();
    const end   = window.KPApi.futureDateKST(6);
    el.innerHTML = `
      <div class="week-header">
        <h2>Happening This Week in Korea</h2>
        <span class="week-date-range">${window.KPApi.fmtDate(today)} – ${window.KPApi.fmtDate(end)}</span>
        <a href="festivals.html" style="margin-left:auto;font-size:11px;color:rgba(116,185,255,0.8);text-decoration:none;">All events →</a>
      </div>
      <div class="week-carousel-wrap" id="week-scroll">
        <div class="week-carousel" id="week-items">
          <div class="week-card weather-mini-card" id="week-weather-card">
            <div class="week-card-thumb-ph" style="height:90px;font-size:24px;">🌡️</div>
            <div class="week-card-body" style="padding:8px 12px">
              <div class="week-card-type">Seoul Weather</div>
              <div id="week-weather-text" class="kpd-loading" style="font-size:11px;color:rgba(255,255,255,0.4)">Loading…</div>
            </div>
          </div>
          <div class="week-card weather-mini-card" id="week-aqi-card">
            <div class="week-card-thumb-ph" style="height:90px;font-size:24px;">💨</div>
            <div class="week-card-body" style="padding:8px 12px">
              <div class="week-card-type">Air Quality</div>
              <div id="week-aqi-text" class="kpd-loading" style="font-size:11px;color:rgba(255,255,255,0.4)">Loading…</div>
            </div>
          </div>
        </div>
      </div>`;

    // drag-to-scroll
    const wrap = el.querySelector('#week-scroll');
    let isDown = false, startX, scrollLeft;
    wrap.addEventListener('mousedown', e => { isDown=true; startX=e.pageX-wrap.offsetLeft; scrollLeft=wrap.scrollLeft; wrap.style.cursor='grabbing'; });
    wrap.addEventListener('mouseleave', () => { isDown=false; wrap.style.cursor='grab'; });
    wrap.addEventListener('mouseup', () => { isDown=false; wrap.style.cursor='grab'; });
    wrap.addEventListener('mousemove', e => { if(!isDown)return; e.preventDefault(); const x=e.pageX-wrap.offsetLeft; wrap.scrollLeft=scrollLeft-(x-startX)*1.5; });

    return el;
  }

  async function loadContent(section) {
    const container = section.querySelector('#week-items');
    try {
      const today = window.KPApi.todayKST();
      const end   = window.KPApi.futureDateKST(6);
      const [festResult, showResult, weather, aqi] = await Promise.allSettled([
        window.KPApi.getFestivals({ from: today, to: end }),
        window.KPApi.getShows({ from: today, to: end, state: '02' }),
        window.KPApi.getWeather('Seoul'),
        window.KPApi.getAqi('Seoul'),
      ]);

      // Update weather card
      if (weather.status === 'fulfilled') {
        const w = weather.value;
        document.getElementById('week-weather-text').innerHTML =
          `<strong style="font-size:18px;color:#fff">${w.conditionEmoji || '🌡️'} ${Math.round(w.temp)}°C</strong><br>${w.condition}<br><span style="color:rgba(255,255,255,0.35)">Seoul</span>`;
        const ph = section.querySelector('#week-weather-card .week-card-thumb-ph');
        if (ph) ph.textContent = w.conditionEmoji || '🌡️';
      }

      // Update AQI card
      if (aqi.status === 'fulfilled') {
        const a = aqi.value;
        const grade = a.khaiGrade ?? a.pm25Grade ?? 'unknown';
        const labels = { good:'Good 🟢', moderate:'Moderate 🟡', unhealthy:'Unhealthy 🟠', veryUnhealthy:'Very Bad 🔴', unknown:'N/A' };
        document.getElementById('week-aqi-text').innerHTML =
          `<strong style="font-size:14px;color:#fff">${labels[grade] || grade}</strong><br>PM2.5: ${a.pm25 ?? '—'} μg/m³<br>PM10: ${a.pm10 ?? '—'} μg/m³`;
      }

      // Festivals
      const festivals = festResult.status === 'fulfilled'
        ? (festResult.value?.festivals ?? festResult.value ?? []).slice(0, 8) : [];

      // Shows
      const shows = showResult.status === 'fulfilled'
        ? (showResult.value ?? []).slice(0, 6) : [];

      // Insert festival cards
      for (const f of festivals) {
        container.appendChild(makeFestCard(f));
      }
      // Insert show cards
      for (const s of shows) {
        container.appendChild(makeShowCard(s));
      }

      if (!festivals.length && !shows.length) {
        const empty = document.createElement('div');
        empty.className = 'week-card';
        empty.innerHTML = '<div class="week-card-body"><div class="week-card-type">This Week</div><div class="week-card-name" style="color:rgba(255,255,255,0.4);font-size:11px">No events found for this week. Check back soon!</div></div>';
        container.appendChild(empty);
      }
    } catch (err) {
      console.warn('[week-section] load error:', err);
    }
  }

  function makeFestCard(f) {
    const el = document.createElement('div');
    el.className = 'week-card';
    el.style.cursor = 'pointer';
    const thumb = f.thumbnail || f.image;
    const date  = window.KPApi.fmtDateRange(f.eventStartDate || f.startDate, f.eventEndDate || f.endDate);
    const loc   = (f.address || '').split(' ').slice(0,2).join(' ') || 'Korea';
    el.innerHTML = `
      ${thumb
        ? `<img class="week-card-thumb" src="${thumb}" alt="${f.nameEn || ''}" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="week-card-thumb-ph">🎪</div>`}
      <div class="week-card-body">
        <div class="week-card-type">Festival</div>
        <div class="week-card-name">${f.nameEn || f.nameKo || 'Festival'}</div>
        <div class="week-card-date">${date || ''} · ${loc}</div>
      </div>`;
    return el;
  }

  function makeShowCard(s) {
    const el = document.createElement('div');
    el.className = 'week-card';
    el.style.cursor = 'pointer';
    const date = window.KPApi.fmtDateRange(s.startDate, s.endDate);
    el.innerHTML = `
      ${s.poster
        ? `<img class="week-card-thumb" src="${s.poster}" alt="${s.title || ''}" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="week-card-thumb-ph">🎭</div>`}
      <div class="week-card-body">
        <div class="week-card-type">${s.category || 'Performance'}</div>
        <div class="week-card-name">${s.title || 'Performance'}</div>
        <div class="week-card-date">${date || ''} · ${(s.venue || '').slice(0, 24)}</div>
      </div>`;
    return el;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
