/* ===== CONFIG ===== */
const MAPS_KEY = window.MAPS_KEY || '';
const WORKER_URL = window.WORKER_URL || '';

/* ===== MAP (Leaflet.js — real Korea map) ===== */
function initMap() {
  const mapEl = document.getElementById('korea-map');
  if (!mapEl || typeof L === 'undefined') return;

  const map = L.map('korea-map', {
    center: [36.2, 127.9],
    zoom: 7,
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: true,
  });

  // CartoDB Voyager — colorful, modern, free, no API key needed
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors © <a href="https://carto.com">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Position zoom controls top-right
  map.zoomControl.setPosition('topright');

  // City markers with pulse animation
  CITIES.forEach(city => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:20px;height:20px">
        <div style="position:absolute;inset:0;border-radius:50%;background:${city.color};border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.5);z-index:2"></div>
        <div style="position:absolute;inset:-5px;border-radius:50%;border:2px solid ${city.color};animation:markerPulse 2.2s ease-out infinite;z-index:1"></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([city.lat, city.lng], { icon }).addTo(map);
    marker.bindTooltip(
      `<strong style="font-size:13px;color:#F5EDD8">${city.name}</strong><br>
       <span style="color:#E8B84B;font-size:12px;font-weight:600">${city.kr}</span>`,
      { className: 'korea-tooltip', direction: 'top', offset: [0, -14], permanent: false }
    );
    marker.on('click', () => {
      map.flyTo([city.lat, city.lng], 11, { animate: true, duration: 1.2 });
      document.querySelectorAll('.city-pill').forEach(p => p.classList.remove('active'));
      document.querySelector(`.city-pill[data-name="${city.name}"]`)?.classList.add('active');
      setTimeout(() => {
        document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 900);
    });
  });

  // City pills at bottom of map
  const pillsEl = document.getElementById('city-pills');
  if (pillsEl) {
    CITIES.forEach(city => {
      const btn = document.createElement('button');
      btn.className = 'city-pill';
      btn.dataset.name = city.name;
      btn.innerHTML = `<span class="pill-dot" style="background:${city.color}"></span>${city.name}<span class="pill-kr">&nbsp;${city.kr}</span>`;
      btn.addEventListener('click', () => {
        map.flyTo([city.lat, city.lng], 11, { animate: true, duration: 1.2 });
        document.querySelectorAll('.city-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
      });
      pillsEl.appendChild(btn);
    });
  }
}

/* ===== CONTENT GRID ===== */
function renderGrid(cat) {
  const grid = document.getElementById('content-grid');
  if (!grid) return;
  const items = KOREA_DATA[cat] || [];
  grid.innerHTML = items.map((item, i) => {
    const d = JSON.stringify({ name: item.name, kr: item.kr, mapQ: item.mapQ }).replace(/'/g, '&#39;');
    return `
      <div class="card" style="animation-delay:${i * 0.045}s">
        <span class="card-emoji">${item.emoji}</span>
        <div class="card-name">${item.name}</div>
        <div class="card-kr">${item.kr} &nbsp;·&nbsp; ${item.region}</div>
        <div class="card-desc">${item.desc}</div>
        <div class="card-tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <button class="card-map-btn" data-item='${d}'>📍 View on Map &amp; Reviews</button>
      </div>`;
  }).join('');

  grid.querySelectorAll('.card-map-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      try { openMapPanel(JSON.parse(btn.dataset.item)); } catch {}
    });
  });
}

/* ===== TABS ===== */
let activeCat = 'food';
function initTabs() {
  document.querySelectorAll('.cat-tab, .nav-btn, .hero-cta[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (!cat) return;
      activeCat = cat;
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
      document.querySelectorAll('.nav-btn').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
      renderGrid(cat);
      document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ===== GOOGLE MAPS PANEL ===== */
function openMapPanel(item) {
  const panel = document.getElementById('map-panel');
  const backdrop = document.getElementById('mp-backdrop');
  document.getElementById('mp-title').textContent = item.name;
  document.getElementById('mp-kr').textContent = item.kr;
  document.getElementById('mp-rating').innerHTML = '';
  document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">Loading reviews...</div>';
  panel.classList.add('open');
  backdrop.classList.add('open');

  const gmapFrame = document.getElementById('gmap');
  const q = encodeURIComponent(item.mapQ || item.name + ' Korea');
  if (MAPS_KEY && MAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    gmapFrame.innerHTML = `<iframe src="https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${q}&zoom=14" allowfullscreen loading="lazy"></iframe>`;
    fetchPlaceDetails(item.mapQ || item.name + ' Korea');
  } else {
    gmapFrame.innerHTML = `<div class="gmap-loading">📍 Add your Google Maps API key in index.html to enable the map preview</div>`;
    document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">Add Google Maps API key to see ratings & reviews</div>';
  }

  document.getElementById('mp-directions').href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  document.getElementById('mp-gmaps').href = `https://www.google.com/maps/search/${q}`;
}

async function fetchPlaceDetails(query) {
  if (!WORKER_URL) return;
  try {
    const res = await fetch(`${WORKER_URL}/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    if (data.rating) renderPlaceDetails(data);
    else document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">No ratings found</div>';
  } catch {
    document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">📍 Open Google Maps to see reviews</div>';
  }
}

function renderPlaceDetails(data) {
  const stars = '⭐'.repeat(Math.round(data.rating || 0));
  document.getElementById('mp-rating').innerHTML = `
    <span class="mp-stars">${stars}</span>
    <span class="mp-score">${data.rating?.toFixed(1) || '—'}</span>
    <span class="mp-count">(${(data.userRatingsTotal || 0).toLocaleString()} reviews)</span>`;

  const reviewsEl = document.getElementById('mp-reviews');
  if (data.reviews?.length) {
    reviewsEl.innerHTML = data.reviews.slice(0, 3).map(r => `
      <div class="mp-review">
        <span class="mp-reviewer">${r.authorName}</span>
        <span class="mp-review-stars">${'⭐'.repeat(r.rating)}</span>
        <div class="mp-review-text">${(r.text || '').slice(0, 200)}${(r.text || '').length > 200 ? '…' : ''}</div>
        <div class="mp-review-time">${r.relativeTime}</div>
      </div>`).join('');
  } else {
    reviewsEl.innerHTML = '<div class="mp-no-reviews">No reviews available yet</div>';
  }
}

function initMapPanel() {
  const close = () => {
    document.getElementById('map-panel').classList.remove('open');
    document.getElementById('mp-backdrop').classList.remove('open');
  };
  document.getElementById('mp-close')?.addEventListener('click', close);
  document.getElementById('mp-backdrop')?.addEventListener('click', close);
}

/* ===== AI CHATBOT ===== */
let chatHistory = [], isThinking = false;

function openChat() { document.getElementById('chatbot')?.classList.add('open'); }
function closeChat() { document.getElementById('chatbot')?.classList.remove('open'); }

function addMsg(role, html) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `<div class="msg-bubble">${html}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTyping() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.innerHTML = '<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendMessage(text) {
  if (!text.trim() || isThinking) return;
  isThinking = true;
  const input = document.getElementById('chat-input');
  if (input) input.value = '';
  addMsg('user', text.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  chatHistory.push({ role: 'user', content: text });
  const typingEl = addTyping();
  try {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory.slice(-8) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.reply || 'Sorry, no response received. Please try again.';
    typingEl?.remove();
    addMsg('assistant', reply
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    );
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    typingEl?.remove();
    addMsg('assistant', `⚠️ AI temporarily unavailable. Please try again. (${err.message})`);
  } finally {
    isThinking = false;
  }
}

function sendQuick(text) { openChat(); setTimeout(() => sendMessage(text), 80); }

function initChat() {
  document.getElementById('chat-fab')?.addEventListener('click', openChat);
  document.getElementById('chat-close')?.addEventListener('click', closeChat);
  document.getElementById('ai-open-btn')?.addEventListener('click', openChat);
  document.getElementById('hero-ai-btn')?.addEventListener('click', openChat);
  const input = document.getElementById('chat-input');
  document.getElementById('chat-send')?.addEventListener('click', () => sendMessage(input?.value || ''));
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(input.value); });
}

/* ===== HEADER SCROLL ===== */
function initHeader() {
  window.addEventListener('scroll', () => {
    document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initTabs();
  initMapPanel();
  renderGrid('food');
  initChat();
  initHeader();
});
