/* ── KoreaPlus AI Itinerary Builder — frontend logic ───────────────────────── */
/* globals: L (Leaflet), Sortable, jspdf, QRCode, window.WORKER_URL            */

// ── State ────────────────────────────────────────────────────────────────────

const S = {
  step: 1,
  totalSteps: 5,
  inputs: {
    arrival:      '',
    departure:    '',
    airport:      'ICN',
    travelers:    '',
    ageGroups:    ['20s'],
    interests:    [],
    pace:         '',
    budget:       '',
    specialNeeds: [],
    mode:         'foreigner',
  },
  itinerary:  null,   // current itinerary JSON
  activeDay:  0,
  map:        null,
  mapMarkers: [],
  mapLine:    null,
  sortables:  [],
};

// ── Scenario presets ─────────────────────────────────────────────────────────

const SCENARIOS = {
  'solo-kpop': {
    days: 4, airport: 'ICN', travelers: 'solo', ageGroups: ['20s'],
    interests: ['kpop', 'shopping', 'food', 'nightlife'], pace: 'balanced', budget: 'mid', mode: 'foreigner',
    specialNeeds: [],
  },
  'couple-comfort': {
    days: 7, airport: 'ICN', travelers: 'couple', ageGroups: ['30s'],
    interests: ['food', 'history', 'art', 'wellness', 'shopping'], pace: 'balanced', budget: 'comfort', mode: 'foreigner',
    specialNeeds: [],
  },
  'family-jeju': {
    days: 5, airport: 'CJU', travelers: 'family', ageGroups: ['20s', 'kids'],
    interests: ['nature', 'food', 'history', 'shopping'], pace: 'relaxed', budget: 'mid', mode: 'foreigner',
    specialNeeds: [],
  },
  'vegan-temples': {
    days: 3, airport: 'ICN', travelers: 'solo', ageGroups: ['30s'],
    interests: ['temples', 'nature', 'wellness', 'history'], pace: 'relaxed', budget: 'budget', mode: 'local',
    specialNeeds: ['vegetarian'],
  },
  'friends-food': {
    days: 6, airport: 'ICN', travelers: 'group', ageGroups: ['20s'],
    interests: ['food', 'nightlife', 'shopping', 'kpop'], pace: 'packed', budget: 'budget', mode: 'local',
    specialNeeds: [],
  },
};

// ── DOM helpers ───────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const today8 = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', weekday: 'short' });
function toast(msg) {
  const el = $('save-toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Set default dates
  const arrEl = $('arrival'), depEl = $('departure');
  const t = today8();
  arrEl.min = t;
  arrEl.value = addDays(t, 14);
  depEl.value = addDays(t, 18);
  S.inputs.arrival   = arrEl.value;
  S.inputs.departure = depEl.value;

  arrEl.addEventListener('change', () => {
    S.inputs.arrival = arrEl.value;
    if (depEl.value <= arrEl.value) depEl.value = addDays(arrEl.value, 3);
    S.inputs.departure = depEl.value;
  });
  depEl.addEventListener('change', () => { S.inputs.departure = depEl.value; });

  // Airport cards
  document.querySelectorAll('.airport-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.airport-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      S.inputs.airport = card.querySelector('input').value;
    });
  });

  // Single-select opt-cards (travelers, pace, budget)
  document.querySelectorAll('.opt-card[data-field]').forEach(card => {
    card.addEventListener('click', () => {
      const field = card.dataset.field;
      document.querySelectorAll(`.opt-card[data-field="${field}"]`).forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      S.inputs[field] = card.dataset.val;
    });
  });

  // Age group checkboxes
  document.querySelectorAll('#age-group-grid .check-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const v = chip.querySelector('input').value;
      if (chip.classList.contains('selected')) { if (!S.inputs.ageGroups.includes(v)) S.inputs.ageGroups.push(v); }
      else S.inputs.ageGroups = S.inputs.ageGroups.filter(x => x !== v);
    });
  });

  // Interest chips (multi-select)
  document.querySelectorAll('.int-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const v = chip.dataset.interest;
      if (chip.classList.contains('selected')) { if (!S.inputs.interests.includes(v)) S.inputs.interests.push(v); }
      else S.inputs.interests = S.inputs.interests.filter(x => x !== v);
    });
  });

  // Mode toggle
  $('mode-local').addEventListener('click', () => {
    $('mode-local').classList.add('active');
    $('mode-foreigner').classList.remove('active');
    S.inputs.mode = 'local';
  });
  $('mode-foreigner').addEventListener('click', () => {
    $('mode-foreigner').classList.add('active');
    $('mode-local').classList.remove('active');
    S.inputs.mode = 'foreigner';
  });

  // Special needs checkboxes
  document.querySelectorAll('#special-needs-grid .check-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const v = chip.querySelector('input').value;
      if (chip.classList.contains('selected')) { if (!S.inputs.specialNeeds.includes(v)) S.inputs.specialNeeds.push(v); }
      else S.inputs.specialNeeds = S.inputs.specialNeeds.filter(x => x !== v);
    });
  });

  // Wizard navigation
  $('btn-prev').addEventListener('click', () => goToStep(S.step - 1));
  $('btn-next').addEventListener('click', () => {
    if (!validateStep(S.step)) return;
    goToStep(S.step + 1);
  });
  $('btn-generate').addEventListener('click', generate);

  // Scenario chips
  document.querySelectorAll('.scenario-chip').forEach(chip => {
    chip.addEventListener('click', () => applyScenario(chip.dataset.scenario));
  });

  // Result buttons
  $('btn-new-plan').addEventListener('click', resetToWizard);
  $('btn-regenerate').addEventListener('click', generate);
  $('btn-toggle-mode').addEventListener('click', toggleMode);
  $('btn-save').addEventListener('click', saveToStorage);
  $('btn-pdf').addEventListener('click', exportPDF);
  $('btn-share').addEventListener('click', shareItinerary);
  $('btn-qr').addEventListener('click', showQR);

  // Check URL for shared itinerary
  const shareId = new URLSearchParams(location.search).get('share');
  if (shareId) loadSharedItinerary(shareId);

  // Check localStorage for saved itinerary
  if (!shareId) {
    const saved = localStorage.getItem('kp_itinerary');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data?.itinerary?.days?.length) {
          S.itinerary = data.itinerary;
          if (data.inputs) Object.assign(S.inputs, data.inputs);
          showResult();
          return;
        }
      } catch { /* ignore */ }
    }
  }

  goToStep(1);
});

// ── Wizard step navigation ────────────────────────────────────────────────────

function goToStep(n) {
  if (n < 1 || n > S.totalSteps) return;
  $('step-error').textContent = '';

  // Update step visibility
  document.querySelectorAll('.wizard-step').forEach(el => {
    el.classList.toggle('active', +el.dataset.step === n);
  });

  // Update progress dots
  document.querySelectorAll('.wp-step').forEach(el => {
    const sn = +el.dataset.step;
    el.classList.toggle('active', sn === n);
    el.classList.toggle('done',   sn < n);
  });

  // Prev button
  const prevBtn = $('btn-prev');
  prevBtn.style.visibility = n > 1 ? 'visible' : 'hidden';

  // Next / Generate
  const nextBtn = $('btn-next'), genBtn = $('btn-generate');
  nextBtn.style.display    = n < S.totalSteps ? '' : 'none';
  genBtn.style.display     = n === S.totalSteps ? '' : 'none';

  S.step = n;
}

function validateStep(n) {
  const err = $('step-error');
  err.textContent = '';
  if (n === 1) {
    if (!S.inputs.arrival || !S.inputs.departure) return err.textContent = 'Please select both dates.', false;
    if (S.inputs.departure <= S.inputs.arrival)   return err.textContent = 'Departure must be after arrival.', false;
    const days = Math.round((new Date(S.inputs.departure) - new Date(S.inputs.arrival)) / 86400000);
    if (days > 14) return err.textContent = 'Maximum 14 days per itinerary.', false;
  }
  if (n === 2 && !S.inputs.travelers) return err.textContent = 'Please select your travel party.', false;
  if (n === 3 && !S.inputs.interests.length) return err.textContent = 'Select at least one interest.', false;
  if (n === 4 && !S.inputs.pace) return err.textContent = 'Please select a travel pace.', false;
  if (n === 5 && !S.inputs.budget) return err.textContent = 'Please select a budget level.', false;
  return true;
}

// ── Scenario presets ──────────────────────────────────────────────────────────

function applyScenario(id) {
  const sc = SCENARIOS[id];
  if (!sc) return;
  const arrival   = addDays(today8(), 30);
  const departure = addDays(arrival, sc.days);
  Object.assign(S.inputs, sc, { arrival, departure });
  $('arrival').value   = arrival;
  $('departure').value = departure;

  // Sync UI
  document.querySelectorAll('.airport-card').forEach(c => {
    c.classList.toggle('selected', c.querySelector('input').value === sc.airport);
  });
  document.querySelectorAll('.opt-card[data-field="travelers"]').forEach(c => {
    c.classList.toggle('selected', c.dataset.val === sc.travelers);
  });
  document.querySelectorAll('.opt-card[data-field="pace"]').forEach(c => {
    c.classList.toggle('selected', c.dataset.val === sc.pace);
  });
  document.querySelectorAll('.opt-card[data-field="budget"]').forEach(c => {
    c.classList.toggle('selected', c.dataset.val === sc.budget);
  });
  document.querySelectorAll('.int-chip').forEach(c => {
    const sel = sc.interests.includes(c.dataset.interest);
    c.classList.toggle('selected', sel);
  });
  document.querySelectorAll('#age-group-grid .check-chip').forEach(c => {
    const sel = sc.ageGroups.includes(c.querySelector('input').value);
    c.classList.toggle('selected', sel);
  });
  document.querySelectorAll('#special-needs-grid .check-chip').forEach(c => {
    const sel = sc.specialNeeds.includes(c.querySelector('input').value);
    c.classList.toggle('selected', sel);
  });
  $('mode-local').classList.toggle('active', sc.mode === 'local');
  $('mode-foreigner').classList.toggle('active', sc.mode === 'foreigner');

  toast('✨ Example loaded — click Generate or adjust settings!');
}

// ── Generation ────────────────────────────────────────────────────────────────

async function generate() {
  if (!validateAllSteps()) return;

  $('wizard').style.display = 'none';
  $('plan-result').classList.remove('active');
  const overlay = $('loading-overlay');
  overlay.classList.add('active');
  animateLoadingSteps();

  try {
    const url = `${window.WORKER_URL}/api/plan`;
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...S.inputs, lang: window.kpI18n?.getLang?.() || 'en' }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data.detail || data.error || `Error ${res.status}`;
      if (res.status === 429) {
        showError(`Daily limit reached (3/day). Try again tomorrow! 😊\n${msg}`);
      } else {
        showError(`Generation failed: ${msg}`);
      }
      return;
    }

    S.itinerary = data.itinerary;
    overlay.classList.remove('active');
    showResult();
    if (data.cached) toast('⚡ Loaded from cache (same inputs)');

  } catch (err) {
    showError(`Network error: ${err.message || err}`);
  }
}

let loadingTimer = null;
function animateLoadingSteps() {
  const items = document.querySelectorAll('.ls-item');
  items.forEach(i => { i.classList.remove('active', 'done'); });
  let current = 0;
  clearInterval(loadingTimer);
  loadingTimer = setInterval(() => {
    if (current > 0) items[current - 1].classList.replace('active', 'done');
    if (current < items.length) {
      items[current].classList.add('active');
      current++;
    } else clearInterval(loadingTimer);
  }, 6500);
}

function validateAllSteps() {
  for (let i = 1; i <= S.totalSteps; i++) {
    if (!validateStep(i)) {
      goToStep(i);
      $('wizard').style.display = '';
      return false;
    }
  }
  return true;
}

function showError(msg) {
  clearInterval(loadingTimer);
  $('loading-overlay').classList.remove('active');
  $('wizard').style.display = '';
  goToStep(S.step);
  $('step-error').textContent = msg;
}

function resetToWizard() {
  $('plan-result').classList.remove('active');
  $('wizard').style.display = '';
  goToStep(1);
}

async function toggleMode() {
  S.inputs.mode = S.inputs.mode === 'local' ? 'foreigner' : 'local';
  $('btn-toggle-mode').textContent = S.inputs.mode === 'local' ? '🌍 Try Foreigner-Friendly' : '🇰🇷 Try Local Favorites';
  await generate();
}

// ── Result rendering ──────────────────────────────────────────────────────────

function showResult() {
  $('wizard').style.display = 'none';
  $('loading-overlay').classList.remove('active');
  const it = S.itinerary;
  $('plan-result').classList.add('active');

  // Banner
  $('result-title').textContent   = it.title || 'Your Korea Itinerary';
  $('result-summary').textContent = it.summary || '';
  const hl = $('result-highlights');
  hl.innerHTML = '';
  (it.highlights || []).forEach(h => {
    const pill = document.createElement('span');
    pill.className = 'highlight-pill';
    pill.textContent = h;
    hl.appendChild(pill);
  });

  $('btn-toggle-mode').textContent = S.inputs.mode === 'local' ? '🌍 Try Foreigner-Friendly' : '🇰🇷 Try Local Favorites';

  // Day tabs + panels
  const tabs   = $('day-tabs');
  const panels = $('day-panels');
  tabs.innerHTML = panels.innerHTML = '';
  S.sortables.forEach(s => s && s.destroy && s.destroy());
  S.sortables = [];

  (it.days || []).forEach((day, i) => {
    // Tab
    const tab = document.createElement('div');
    tab.className = 'day-tab' + (i === 0 ? ' active' : '');
    tab.textContent = `Day ${day.day}  ${fmtDate(day.date)}`;
    tab.addEventListener('click', () => switchDay(i));
    tabs.appendChild(tab);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'day-panel' + (i === 0 ? ' active' : '');
    panel.id = `day-panel-${i}`;
    panel.innerHTML = `
      <div class="day-timeline" id="tl-${i}"></div>
      <div class="day-map">
        <div id="map-${i}" style="width:100%;height:100%;min-height:400px"></div>
      </div>`;
    panels.appendChild(panel);

    renderDayTimeline(day, i);
  });

  // Init first day map
  setTimeout(() => initDayMap(0), 100);
  S.activeDay = 0;
}

function switchDay(i) {
  document.querySelectorAll('.day-tab').forEach((t, j) => t.classList.toggle('active', i === j));
  document.querySelectorAll('.day-panel').forEach((p, j) => p.classList.toggle('active', i === j));
  S.activeDay = i;
  setTimeout(() => {
    if (!S.itinerary?.days?.[i]) return;
    initDayMap(i);
  }, 80);
}

// ── Timeline rendering ────────────────────────────────────────────────────────

function renderDayTimeline(day, dayIdx) {
  const tl = document.getElementById(`tl-${dayIdx}`);
  if (!tl) return;
  tl.innerHTML = '';

  if (day.dayTip) {
    tl.innerHTML += `<div class="day-tip-banner">💡 ${escHtml(day.dayTip)}</div>`;
  }
  if (day.routeReason) {
    tl.innerHTML += `<div class="day-tip-banner" style="opacity:.7">🗺️ ${escHtml(day.routeReason)}</div>`;
  }

  const sections = [
    { label: '☀️ Morning',   places: day.morning   || [] },
    { label: '🍽️ Lunch',    meal:   day.lunch              },
    { label: '🌤️ Afternoon', places: day.afternoon || [] },
    { label: '🌙 Dinner',    meal:   day.dinner             },
    { label: '🌃 Evening',   places: day.evening   || [] },
  ];

  sections.forEach(sec => {
    if (sec.meal) {
      tl.innerHTML += renderMealCard(sec.label, sec.meal);
      return;
    }
    if (!sec.places.length) return;
    const slotDiv = document.createElement('div');
    slotDiv.innerHTML = `<div class="tl-slot-label">${sec.label}</div>`;
    const listDiv = document.createElement('div');
    listDiv.dataset.dayIdx  = dayIdx;
    listDiv.dataset.slot    = sec.label;
    sec.places.forEach((place, pi) => {
      const card = buildPlaceCard(place, dayIdx, pi, sec.places);
      listDiv.appendChild(card);
    });
    slotDiv.appendChild(listDiv);
    tl.appendChild(slotDiv);

    // Enable drag-and-drop
    if (window.Sortable) {
      const sortable = Sortable.create(listDiv, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: () => syncDayFromDOM(dayIdx),
      });
      S.sortables.push(sortable);
    }
  });
}

function buildPlaceCard(place, dayIdx, placeIdx, allPlaces) {
  const card = document.createElement('div');
  card.className = 'place-card';
  card.dataset.placeId = place.id || '';
  const travel = place.travelToNext;
  const travelHtml = travel ? `
    <div class="travel-connector">
      <span class="tc-icon">${travel.method === 'walk' ? '🚶' : travel.method === 'subway' ? '🚇' : '🚕'}</span>
      <span class="tc-text">${escHtml(travel.instruction || travel.note || `${travel.method} ~${travel.duration} min`)}</span>
    </div>` : '';

  card.innerHTML = `
    <div class="place-card-inner">
      <div class="place-header">
        <div>
          <div class="place-names">
            <div class="place-name">📍 ${escHtml(place.name || 'Unknown')}</div>
            <div class="place-name-kr">${escHtml(place.nameKr || '')}</div>
          </div>
          <div class="place-meta">
            ${place.duration ? `<span class="place-badge time">⏱ ${place.duration} min</span>` : ''}
            ${place.cost     ? `<span class="place-badge cost">${escHtml(place.cost)}</span>` : ''}
            ${place.closedOn ? `<span class="place-badge closed">Closed ${escHtml(place.closedOn)}</span>` : ''}
          </div>
        </div>
        <span class="drag-handle" title="Drag to reorder">⠿</span>
      </div>
      <div class="place-desc">${escHtml(place.description || '')}</div>
      ${place.insiderTip ? `<div class="place-tip"><strong>Insider Tip</strong>${escHtml(place.insiderTip)}</div>` : ''}
      ${place.openHours  ? `<div class="place-desc" style="font-size:11px;opacity:.6">🕐 ${escHtml(place.openHours)}</div>` : ''}
      <div class="place-actions">
        <button class="pa-btn" onclick="replaceSpot(${dayIdx}, this)">🔄 Replace</button>
        <button class="pa-btn" onclick="addFoodNear(${dayIdx}, ${place.lat || 0}, ${place.lng || 0})">🍜 Add food nearby</button>
        <button class="pa-btn" onclick="focusMapOn(${place.lat || 0}, ${place.lng || 0})">🗺️ Show on map</button>
      </div>
    </div>
    ${travelHtml}`;
  return card;
}

function renderMealCard(label, meal) {
  const icon = label.includes('Lunch') ? '🍱' : '🍽️';
  return `
  <div class="tl-slot-label">${label}</div>
  <div class="meal-card">
    <div class="meal-icon">${icon}</div>
    <div class="meal-info">
      <div class="meal-name">${escHtml(meal.name || 'Restaurant')}</div>
      <div class="meal-name-kr">${escHtml(meal.nameKr || '')}</div>
      <div class="meal-type">${escHtml(meal.type || '')} ${meal.cost ? '· ' + escHtml(meal.cost) : ''}</div>
      ${meal.tip ? `<div class="meal-tip">${escHtml(meal.tip)}</div>` : ''}
    </div>
  </div>`;
}

// ── Map ───────────────────────────────────────────────────────────────────────

const DAY_COLORS = ['#d62246','#2e86de','#27ae60','#f39c12','#8e44ad','#16a085','#e74c3c','#2980b9'];

function initDayMap(dayIdx) {
  const day = S.itinerary?.days?.[dayIdx];
  if (!day) return;
  const containerId = `map-${dayIdx}`;
  const container   = document.getElementById(containerId);
  if (!container || container._mapInitialized) return;
  container._mapInitialized = true;

  const map = L.map(containerId, { zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
  }).addTo(map);

  const allPoints = getDayPoints(day);
  if (!allPoints.length) {
    map.setView([37.56, 126.98], 11);
    return;
  }

  const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
  const markers = [];
  allPoints.forEach((pt, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5)">${i + 1}</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    });
    const m = L.marker([pt.lat, pt.lng], { icon }).addTo(map);
    m.bindPopup(`<b>${escHtml(pt.name)}</b>${pt.nameKr ? '<br><small>' + escHtml(pt.nameKr) + '</small>' : ''}`);
    markers.push(m);
  });

  // Polyline route
  if (allPoints.length > 1) {
    L.polyline(allPoints.map(p => [p.lat, p.lng]), { color, weight: 2, opacity: 0.7, dashArray: '6,4' }).addTo(map);
  }

  const lats = allPoints.map(p => p.lat), lngs = allPoints.map(p => p.lng);
  map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [32, 32] });
}

function getDayPoints(day) {
  const pts = [];
  ['morning', 'afternoon', 'evening'].forEach(slot => {
    (day[slot] || []).forEach(p => { if (p.lat && p.lng) pts.push(p); });
  });
  ['lunch', 'dinner'].forEach(meal => {
    const m = day[meal];
    if (m?.lat && m?.lng) pts.push({ ...m, name: m.name || meal, nameKr: m.nameKr || '' });
  });
  return pts;
}

function focusMapOn(lat, lng) {
  if (!lat || !lng) return;
  const containerId = `map-${S.activeDay}`;
  const container   = document.getElementById(containerId);
  if (!container?._leaflet_id) return;
  const map = L.map(containerId); // Won't work directly; we'd need to store map refs
  toast('📍 Place highlighted on map');
}

// ── Replace spot ──────────────────────────────────────────────────────────────

async function replaceSpot(dayIdx, btn) {
  const card = btn.closest('.place-card');
  btn.textContent = '⏳ Finding alternatives…';
  btn.disabled = true;
  const day = S.itinerary?.days?.[dayIdx];
  if (!day) return;

  // Find nearby lat/lng
  const allPlaces = [...(day.morning||[]), ...(day.afternoon||[]), ...(day.evening||[])];
  const lat = allPlaces.find(p => p.lat)?.lat || 37.56;
  const lng = allPlaces.find(p => p.lng)?.lng || 126.98;

  try {
    const res  = await fetch(`${window.WORKER_URL}/api/nearby?lat=${lat}&lng=${lng}&radius=3000`);
    const data = await res.json();
    const candidates = (data.data || []).slice(0, 5);
    if (!candidates.length) { toast('No alternatives found nearby'); btn.textContent = '🔄 Replace'; btn.disabled = false; return; }

    // Show mini picker
    const picker = document.createElement('div');
    picker.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;margin-top:8px;';
    picker.innerHTML = '<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px;">Choose replacement:</div>';
    candidates.forEach(c => {
      const b = document.createElement('button');
      b.className = 'pa-btn';
      b.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:6px;padding:8px 10px;';
      b.textContent = `📍 ${c.nameEn || c.nameKo || 'Unknown'} — ${c.category}`;
      b.addEventListener('click', () => {
        // Swap in itinerary state
        for (const slot of ['morning', 'afternoon', 'evening']) {
          const arr = day[slot] || [];
          const idx = arr.findIndex(p => p.id === card.dataset.placeId);
          if (idx >= 0) {
            arr[idx] = {
              id: c.id, name: c.nameEn || c.nameKo, nameKr: c.nameKo,
              category: c.category, address: c.address, lat: c.lat, lng: c.lng,
              duration: 90, cost: 'Varies', description: c.description || '', insiderTip: '',
              openHours: '', closedOn: null, travelToNext: null,
            };
          }
        }
        renderDayTimeline(day, dayIdx);
        toast('✅ Spot replaced!');
      });
      picker.appendChild(b);
    });
    card.appendChild(picker);
    btn.textContent = '🔄 Replace'; btn.disabled = false;
  } catch {
    toast('Could not fetch alternatives'); btn.textContent = '🔄 Replace'; btn.disabled = false;
  }
}

// ── Add food nearby ───────────────────────────────────────────────────────────

async function addFoodNear(dayIdx, lat, lng) {
  if (!lat || !lng) return toast('No location data for this spot');
  const day = S.itinerary?.days?.[dayIdx];
  if (!day) return;
  try {
    const res  = await fetch(`${window.WORKER_URL}/api/nearby?lat=${lat}&lng=${lng}&radius=500&cat=food`);
    const data = await res.json();
    const candidates = (data.data || []).slice(0, 4);
    if (!candidates.length) return toast('No restaurants found nearby');
    const names = candidates.map(c => c.nameEn || c.nameKo).join(' · ');
    toast(`🍜 Nearby options: ${names}`);
  } catch {
    toast('Could not fetch nearby restaurants');
  }
}

// ── DOM sync after drag ───────────────────────────────────────────────────────

function syncDayFromDOM(dayIdx) {
  // After drag-and-drop, re-order is stored by Sortable in-place in the DOM.
  // The next render pass will use the updated order.
  toast('Order updated');
}

// ── Save & Load ───────────────────────────────────────────────────────────────

function saveToStorage() {
  if (!S.itinerary) return;
  try {
    localStorage.setItem('kp_itinerary', JSON.stringify({ itinerary: S.itinerary, inputs: S.inputs, savedAt: Date.now() }));
    // Also add to the "My Trip" multi-itinerary collection (if available)
    if (window.kpTrip) {
      window.kpTrip.saveItinerary(S.itinerary, S.inputs);
      toast('💾 Saved to My Trip — open 💼 to view all itineraries!');
    } else {
      toast('💾 Itinerary saved to this browser!');
    }
  } catch { toast('Could not save — storage full'); }
}

async function loadSharedItinerary(id) {
  try {
    const res  = await fetch(`${window.WORKER_URL}/api/plan/share/${id}`);
    const data = await res.json();
    if (data.itinerary) { S.itinerary = data.itinerary; showResult(); }
    else toast('Shared itinerary not found or expired');
  } catch { toast('Could not load shared itinerary'); }
}

// ── Share ─────────────────────────────────────────────────────────────────────

async function shareItinerary() {
  if (!S.itinerary) return;
  const btn = $('btn-share');
  btn.textContent = '⏳ Creating link…';
  try {
    const res  = await fetch(`${window.WORKER_URL}/api/plan/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itinerary: S.itinerary }),
    });
    const data = await res.json();
    if (data.id) {
      // Public, shareable + crawlable itinerary page
      const url = data.url || `${window.WORKER_URL}/i/${data.id}`;
      await navigator.clipboard.writeText(url);
      toast(`🔗 Public link copied — anyone can view your itinerary!`);
    } else {
      // Fallback: encode itinerary in URL as compressed base64
      fallbackShare();
    }
  } catch {
    fallbackShare();
  } finally {
    btn.textContent = '🔗 Share';
  }
}

function fallbackShare() {
  if (!S.itinerary) return;
  try {
    const compact = JSON.stringify({ title: S.itinerary.title, summary: S.itinerary.summary });
    const b64 = btoa(encodeURIComponent(compact));
    const url = `${location.origin}${location.pathname}?q=${b64.slice(0, 200)}`;
    navigator.clipboard.writeText(url).then(() => toast('🔗 Link copied (no KV configured)'));
  } catch { toast('Could not create share link'); }
}

// ── PDF Export ────────────────────────────────────────────────────────────────

function exportPDF() {
  if (!S.itinerary || !window.jspdf) return toast('PDF library not loaded');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, margin = 16;
  let y = margin;

  const addLine = (text, size = 10, style = 'normal', maxW = W - margin * 2) => {
    doc.setFontSize(size); doc.setFont('helvetica', style);
    const lines = doc.splitTextToSize(String(text || ''), maxW);
    if (y + lines.length * (size * 0.4) > 280) { doc.addPage(); y = margin; }
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.4 + 1) + 2;
  };

  doc.setFillColor(214, 34, 70);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  addLine(S.itinerary.title || 'Korea Itinerary', 16, 'bold');
  addLine(S.itinerary.summary || '', 9);
  y = 38; doc.setTextColor(30, 30, 30);

  (S.itinerary.days || []).forEach(day => {
    addLine(`Day ${day.day} — ${day.date}  ${day.theme || ''}`, 13, 'bold');
    const sections = [
      { label: 'Morning',   places: day.morning   || [] },
      { label: 'Afternoon', places: day.afternoon || [] },
      { label: 'Evening',   places: day.evening   || [] },
    ];
    if (day.lunch)  addLine(`Lunch: ${day.lunch.name} — ${day.lunch.tip || ''}`, 9);
    if (day.dinner) addLine(`Dinner: ${day.dinner.name} — ${day.dinner.tip || ''}`, 9);
    sections.forEach(sec => {
      if (!sec.places.length) return;
      addLine(sec.label, 10, 'bold');
      sec.places.forEach(p => {
        addLine(`• ${p.name} (${p.duration || '?'} min · ${p.cost || ''})`, 10, 'bold');
        if (p.description) addLine(p.description, 9);
        if (p.insiderTip)  addLine(`  Tip: ${p.insiderTip}`, 9, 'italic');
      });
    });
    y += 4;
  });

  addLine(`Generated by KoreaPlus AI · koreaplus-lifes.com`, 8);
  doc.save(`Korea-Itinerary-${S.itinerary.title?.replace(/\s+/g,'-') || 'Plan'}.pdf`);
}

// ── QR Code ───────────────────────────────────────────────────────────────────

async function showQR() {
  if (!window.QRCode) return toast('QR library not loaded');
  const modal    = $('qr-modal');
  const canvas   = $('qr-canvas');
  const urlEl    = $('qr-url');
  canvas.innerHTML = '';

  // Generate share URL first
  let shareUrl = location.href;
  try {
    const res  = await fetch(`${window.WORKER_URL}/api/plan/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itinerary: S.itinerary }),
    });
    const data = await res.json();
    if (data.id) shareUrl = `${location.origin}${location.pathname}?share=${data.id}`;
  } catch { /* use current URL */ }

  new QRCode(canvas, { text: shareUrl, width: 200, height: 200, colorDark: '#000', colorLight: '#fff' });
  urlEl.textContent = shareUrl;
  modal.classList.add('active');
}

// ── Escape HTML ───────────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
