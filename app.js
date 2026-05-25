/* ===== CONFIG ===== */
const MAPS_KEY = window.MAPS_KEY || '';
const WORKER_URL = window.WORKER_URL || '';

/* ===== NIGHT-FROM-SPACE SVG MAP ===== */
function initMap() {
  const mapEl = document.getElementById('korea-map');
  if (!mapEl) return;

  const W = 1400, H = 700;
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice' });
  svg.style.cssText = 'width:100%;height:100%;display:block;';
  const defs = el('defs', {}, svg);

  // === GRADIENTS & FILTERS ===
  const bgGrad = el('radialGradient', { id: 'bgG', cx: '50%', cy: '55%', r: '75%' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#07122a' }, bgGrad);
  el('stop', { offset: '60%', 'stop-color': '#030a18' }, bgGrad);
  el('stop', { offset: '100%', 'stop-color': '#000305' }, bgGrad);

  const oceanGrad = el('radialGradient', { id: 'oceanG', cx: '38%', cy: '38%', r: '65%' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#061828' }, oceanGrad);
  el('stop', { offset: '100%', 'stop-color': '#010810' }, oceanGrad);

  const atmGrad = el('linearGradient', { id: 'atmG', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#1a90d8', 'stop-opacity': '0' }, atmGrad);
  el('stop', { offset: '100%', 'stop-color': '#0fa0e8', 'stop-opacity': '0.55' }, atmGrad);

  // Glow filter for city lights
  const gf = el('filter', { id: 'glow', x: '-80%', y: '-80%', width: '260%', height: '260%' }, defs);
  el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '5', result: 'b' }, gf);
  const m1 = el('feMerge', {}, gf);
  el('feMergeNode', { in: 'b' }, m1); el('feMergeNode', { in: 'SourceGraphic' }, m1);

  // === SPACE BACKGROUND ===
  el('rect', { width: W, height: H, fill: 'url(#bgG)' }, svg);

  // === STARS ===
  const s = (n) => { let x = Math.sin(n) * 10000; return x - Math.floor(x); };
  for (let i = 0; i < 140; i++) {
    el('circle', {
      cx: s(i * 3.7) * W, cy: s(i * 5.1) * H * 0.78,
      r: s(i * 2.3) * 1.4 + 0.25,
      fill: '#fff', opacity: s(i * 4.9) * 0.65 + 0.18
    }, svg);
  }
  // Milky way hint — faint band of denser stars
  for (let i = 0; i < 60; i++) {
    el('circle', {
      cx: s(i * 7.1) * W * 0.6 + W * 0.2,
      cy: s(i * 9.3) * H * 0.35 + H * 0.05,
      r: s(i * 1.9) * 0.8 + 0.15,
      fill: '#c8e0ff', opacity: s(i * 6.2) * 0.35 + 0.08
    }, svg);
  }

  // === EARTH SURFACE ===
  // Large ellipse = Earth's curved surface
  el('ellipse', { cx: W * 0.46, cy: H + 160, rx: 1200, ry: 560, fill: 'url(#oceanG)' }, svg);

  // Atmosphere glow band along horizon
  el('path', {
    d: `M 0,${H*0.44} C ${W*0.3},${H*0.28} ${W*0.7},${H*0.3} ${W},${H*0.42} L ${W},${H} L 0,${H} Z`,
    fill: 'url(#atmG)', opacity: '0.18'
  }, svg);
  // Bright atmosphere rim
  el('path', {
    d: `M -50,${H*0.44} C ${W*0.3},${H*0.26} ${W*0.7},${H*0.28} ${W+50},${H*0.42}`,
    fill: 'none', stroke: '#3ab8f0', 'stroke-width': '2.5', opacity: '0.4',
    filter: 'url(#glow)'
  }, svg);

  // === KOREAN PENINSULA SHAPE ===
  // South Korea outline (simplified, clockwise from NW)
  const landPath = `
    M 558,244 L 580,231 L 608,223 L 638,217 L 668,214
    L 700,217 L 724,225 L 744,237
    L 763,273 L 770,314 L 768,351 L 762,384
    L 750,399 L 740,411 L 724,420 L 706,426
    L 686,429 L 664,425 L 645,428 L 625,422
    L 606,416 L 589,405 L 573,387 L 561,365
    L 551,341 L 550,317 L 553,295 L 559,275
    L 566,259 Z
  `;
  // North Korea (faint silhouette above DMZ)
  const nkPath = `
    M 558,244 L 566,259 L 542,258 L 520,252 L 498,246
    L 475,240 L 452,240 L 428,248 L 410,258
    L 400,265 L 395,280 L 400,275 L 430,265
    L 460,258 L 490,252 L 510,250 L 530,248
    L 540,248 L 542,242
    M 668,214 L 700,217 L 730,210 L 755,205 L 780,200
    L 800,195 L 810,200 L 800,208 L 770,212
    L 744,218 L 724,225
  `;

  // North Korea — barely visible
  el('path', { d: nkPath, fill: 'rgba(5,15,5,0.6)', stroke: 'rgba(40,80,60,0.15)', 'stroke-width': '1' }, svg);

  // South Korea land base
  el('path', { d: landPath, fill: '#060d06' }, svg);
  // Subtle coastal glow
  el('path', { d: landPath, fill: 'none', stroke: '#1a5080', 'stroke-width': '1.5', opacity: '0.5' }, svg);
  // Inner terrain hint — very faint lighter areas
  el('path', { d: landPath, fill: 'rgba(20,40,20,0.5)', 'clip-path': 'inset(0)' }, svg);

  // Jeju Island
  el('ellipse', { cx: 648, cy: 462, rx: 26, ry: 14, fill: '#060c06', stroke: '#1a5080', 'stroke-width': '1', 'stroke-opacity': '0.4' }, svg);

  // === CITY LIGHT HALOS (diffuse, layered) ===
  const lights = [
    // [x, y, innerR, outerR, color, coreOpacity]
    [644, 271, 48, 90, '#ffb050', 0.42],  // Seoul — brightest
    [616, 280, 22, 45, '#ffaa45', 0.28],  // Incheon
    [748, 407, 30, 58, '#ffc060', 0.34],  // Busan
    [724, 353, 18, 36, '#ffb040', 0.22],  // Daegu
    [666, 321, 16, 32, '#ffaa40', 0.20],  // Daejeon
    [634, 388, 16, 30, '#ffaa40', 0.19],  // Gwangju
    [744, 376, 13, 26, '#ffb040', 0.18],  // Gyeongju
    [667, 415, 12, 24, '#ffa030', 0.17],  // Yeosu
    [647, 462, 12, 22, '#ffb040', 0.20],  // Jeju
    [700, 303, 11, 22, '#ffa830', 0.16],  // Andong
  ];

  lights.forEach(([x, y, r1, r2, c, op], i) => {
    const id = `lg${i}`;
    const g = el('radialGradient', { id, cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', 'stop-color': c, 'stop-opacity': op.toString() }, g);
    el('stop', { offset: '45%', 'stop-color': c, 'stop-opacity': (op * 0.4).toFixed(2) }, g);
    el('stop', { offset: '100%', 'stop-color': c, 'stop-opacity': '0' }, g);
    // Outer halo
    el('circle', { cx: x, cy: y, r: r2, fill: `url(#${id})` }, svg);
    // Inner bright core
    const id2 = `lg${i}c`;
    const g2 = el('radialGradient', { id: id2, cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff8e0', 'stop-opacity': (op * 1.5 > 1 ? 1 : op * 1.5).toFixed(2) }, g2);
    el('stop', { offset: '100%', 'stop-color': c, 'stop-opacity': '0' }, g2);
    el('circle', { cx: x, cy: y, r: r1 * 0.45, fill: `url(#${id2})` }, svg);
  });

  // === INTERACTIVE CITY MARKERS ===
  const cities = [
    { name: 'Seoul',    kr: '서울', x: 644, y: 271, color: '#ff6b6b', r: 5,   right: true  },
    { name: 'Busan',    kr: '부산', x: 748, y: 407, color: '#74b9ff', r: 4,   right: false },
    { name: 'Incheon',  kr: '인천', x: 616, y: 280, color: '#55efc4', r: 3.5, right: false },
    { name: 'Gyeongju', kr: '경주', x: 744, y: 376, color: '#fdcb6e', r: 3,   right: false },
    { name: 'Jeonju',   kr: '전주', x: 637, y: 389, color: '#a29bfe', r: 3,   right: true  },
    { name: 'Jeju',     kr: '제주', x: 647, y: 462, color: '#00cec9', r: 3.5, right: true  },
    { name: 'Andong',   kr: '안동', x: 700, y: 303, color: '#fd79a8', r: 3,   right: false },
    { name: 'Yeosu',    kr: '여수', x: 667, y: 415, color: '#81ecec', r: 3,   right: true  },
  ];

  cities.forEach(city => {
    const g = el('g', { style: 'cursor:pointer', class: 'city-dot' }, svg);

    // Pulse ring (animated via CSS)
    el('circle', {
      cx: city.x, cy: city.y, r: city.r * 2.2,
      fill: 'none', stroke: city.color, 'stroke-width': '1.2',
      class: 'city-pulse', opacity: '0.7'
    }, g);
    // Dot
    el('circle', { cx: city.x, cy: city.y, r: city.r, fill: city.color, filter: 'url(#glow)' }, g);
    el('circle', { cx: city.x, cy: city.y, r: city.r * 0.38, fill: '#fff8f0' }, g);

    // Tooltip
    const lx = city.right ? city.x + 10 : city.x - 92;
    const tip = el('g', { class: 'city-tip', opacity: '0', style: 'pointer-events:none' }, g);
    el('rect', { x: lx, y: city.y - 18, width: 82, height: 28, rx: 6,
      fill: 'rgba(0,5,20,0.82)', stroke: city.color, 'stroke-width': '0.8' }, tip);
    const te = el('text', { x: lx + 8, y: city.y - 5, fill: '#fff', 'font-size': '10',
      'font-weight': '700', 'font-family': 'Inter,sans-serif' }, tip);
    te.textContent = city.name;
    const tk = el('text', { x: lx + 8, y: city.y + 6, fill: city.color, 'font-size': '9',
      'font-family': 'Inter,sans-serif' }, tip);
    tk.textContent = city.kr;

    g.addEventListener('mouseenter', () => tip.setAttribute('opacity', '1'));
    g.addEventListener('mouseleave', () => tip.setAttribute('opacity', '0'));
    g.addEventListener('click', () => {
      document.querySelectorAll('.city-pill').forEach(p => p.classList.remove('active'));
      document.querySelector(`.city-pill[data-name="${city.name}"]`)?.classList.add('active');
      document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  mapEl.appendChild(svg);

  // City pills
  const pillsEl = document.getElementById('city-pills');
  if (pillsEl) {
    cities.forEach(city => {
      const btn = document.createElement('button');
      btn.className = 'city-pill';
      btn.dataset.name = city.name;
      btn.innerHTML = `<span class="pill-dot" style="background:${city.color}"></span>${city.name}<span class="pill-kr"> ${city.kr}</span>`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.city-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    gmapFrame.innerHTML = `<iframe src="https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${q}&zoom=14&language=en&region=KR" allowfullscreen loading="lazy"></iframe>`;
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

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
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
  initScrollReveal();
});
