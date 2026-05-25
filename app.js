/* ===== CONFIG ===== */
// Set in index.html via window.MAPS_KEY and window.WORKER_URL
const MAPS_KEY = window.MAPS_KEY || '';
const WORKER_URL = window.WORKER_URL || '';

/* ===== 3D MAP (Three.js) ===== */
const GEO = { lngMin:124.6, lngMax:129.6, latMin:33.1, latMax:38.6 };
function geo2xy(lng, lat) {
  return [
    ((lng - GEO.lngMin) / (GEO.lngMax - GEO.lngMin) - 0.5) * 5.0,
    ((lat - GEO.latMin) / (GEO.latMax - GEO.latMin) - 0.5) * 5.5,
  ];
}

const KOREA_OUTLINE = [
  [126.1,38.0],[126.4,38.3],[127.3,38.6],[128.1,38.6],[128.8,38.5],
  [129.3,38.2],[129.5,37.9],[129.4,37.4],[129.3,36.8],[129.4,36.5],
  [129.3,36.2],[129.1,35.7],[129.0,35.3],[128.7,34.9],[128.4,34.7],
  [128.0,34.6],[127.6,34.5],[127.2,34.6],[126.9,34.7],[126.5,34.8],
  [126.3,35.0],[126.1,35.4],[126.1,35.9],[126.2,36.5],[126.1,37.2],
  [126.2,37.6],[126.1,38.0]
];

function initMap() {
  const wrap = document.getElementById('map-wrap');
  const canvas = document.getElementById('korea-canvas');
  if (!wrap || !canvas || typeof THREE === 'undefined') return;

  const W = wrap.offsetWidth, H = wrap.offsetHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(0, 0.3, 9);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0x6688cc, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(3, 5, 4); scene.add(sun);
  const blueLight = new THREE.PointLight(0x2e86c1, 3, 30);
  blueLight.position.set(-4, 2, 4); scene.add(blueLight);
  const redLight = new THREE.PointLight(0xcd2e3a, 1.5, 20);
  redLight.position.set(4, -2, 2); scene.add(redLight);

  // Stars
  const starVerts = [];
  for (let i = 0; i < 800; i++) {
    starVerts.push((Math.random()-0.5)*80, (Math.random()-0.5)*80, (Math.random()-0.5)*40-10);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color:0xffffff, size:0.07 })));

  const koreaGroup = new THREE.Group();
  scene.add(koreaGroup);

  // Mainland shape
  const shape = new THREE.Shape();
  const p0 = geo2xy(KOREA_OUTLINE[0][0], KOREA_OUTLINE[0][1]);
  shape.moveTo(p0[0], p0[1]);
  for (let i = 1; i < KOREA_OUTLINE.length; i++) {
    const p = geo2xy(KOREA_OUTLINE[i][0], KOREA_OUTLINE[i][1]);
    shape.lineTo(p[0], p[1]);
  }
  shape.closePath();

  const extOpts = { depth:0.45, bevelEnabled:true, bevelThickness:0.1, bevelSize:0.06, bevelSegments:4 };
  const landGeo = new THREE.ExtrudeGeometry(shape, extOpts);
  const sideMat = new THREE.MeshPhongMaterial({ color:0x1a4a7a, emissive:0x0a2040, specular:0x4488bb, shininess:80 });
  const topMat = new THREE.MeshPhongMaterial({ color:0x2060a0, emissive:0x102848, specular:0x66aadd, shininess:120 });
  koreaGroup.add(new THREE.Mesh(landGeo, [sideMat, topMat]));

  // Jeju Island
  const jejuPos = geo2xy(126.5, 33.4);
  const jejuShape = new THREE.Shape();
  jejuShape.absarc(jejuPos[0], jejuPos[1], 0.26, 0, Math.PI * 2);
  const jejuGeo = new THREE.ExtrudeGeometry(jejuShape, { depth:0.32, bevelEnabled:true, bevelThickness:0.06, bevelSize:0.04, bevelSegments:3 });
  koreaGroup.add(new THREE.Mesh(jejuGeo, [sideMat, topMat]));

  // Sea plane
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 14),
    new THREE.MeshPhongMaterial({ color:0x061428, transparent:true, opacity:0.7 })
  );
  sea.position.set(0, 0, -0.1);
  koreaGroup.add(sea);

  // City markers
  const markerData = CITIES.map(c => { const [x,y] = geo2xy(c.lng, c.lat); return {...c, x, y}; });
  markerData.forEach(city => {
    const col = new THREE.Color(city.color);
    const pinMat = new THREE.MeshPhongMaterial({ color:col, emissive:col, emissiveIntensity:0.4 });
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), pinMat);
    pin.position.set(city.x, city.y, 0.55); koreaGroup.add(pin);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshPhongMaterial({ color:col, emissive:col, emissiveIntensity:0.8 }));
    dot.position.set(city.x, city.y, 0.95); dot.userData.city = city; koreaGroup.add(dot);
  });

  // HTML city labels
  const labelsEl = document.getElementById('city-labels');
  function updateLabels() {
    if (!labelsEl) return;
    labelsEl.innerHTML = '';
    markerData.forEach(city => {
      const vec = new THREE.Vector3(city.x, city.y, 1.1);
      vec.applyMatrix4(koreaGroup.matrixWorld);
      vec.project(camera);
      if (vec.z > 1) return;
      const sx = (vec.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
      const sy = (-vec.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
      const el = document.createElement('div');
      el.className = 'city-label';
      el.style.cssText = `left:${sx}px;top:${sy}px`;
      el.innerHTML = `<div class="city-dot" style="background:${city.color};color:${city.color}"></div><div class="city-name">${city.name}</div>`;
      labelsEl.appendChild(el);
    });
  }

  // Click city on map → open map panel
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: mx, y: my }, camera);
    const dots = koreaGroup.children.filter(c => c.userData.city);
    const hits = raycaster.intersectObjects(dots);
    if (hits.length > 0) {
      const city = hits[0].object.userData.city;
      openMapPanel({ name: city.name, kr: city.kr, mapQ: city.name + ' Korea tourist attractions' });
    }
  });

  // Drag rotation
  let isDragging = false, prevX = 0, prevY = 0;
  let rotY = 0.2, rotX = -0.25, autoSpin = true;
  let spinTimeout;
  const onDragStart = (x, y) => { isDragging = true; prevX = x; prevY = y; autoSpin = false; clearTimeout(spinTimeout); };
  const onDragMove = (x, y) => { if (!isDragging) return; rotY += (x-prevX)*0.012; rotX = Math.max(-0.7, Math.min(0.7, rotX+(y-prevY)*0.008)); prevX=x; prevY=y; };
  const onDragEnd = () => { isDragging = false; spinTimeout = setTimeout(() => autoSpin = true, 3500); };
  wrap.addEventListener('mousedown', e => onDragStart(e.clientX, e.clientY));
  wrap.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX, e.touches[0].clientY), { passive:true });
  window.addEventListener('mousemove', e => onDragMove(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => onDragMove(e.touches[0].clientX, e.touches[0].clientY), { passive:true });
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchend', onDragEnd);

  let frame = 0;
  (function animate() {
    requestAnimationFrame(animate);
    frame++;
    if (autoSpin) rotY += 0.003;
    koreaGroup.rotation.x = rotX;
    koreaGroup.rotation.y = rotY;
    koreaGroup.children.forEach(c => {
      if (c.geometry && c.geometry.type === 'SphereGeometry') {
        c.scale.setScalar(1 + 0.15 * Math.sin(frame * 0.05 + c.position.x));
      }
    });
    renderer.render(scene, camera);
    updateLabels();
  })();

  window.addEventListener('resize', () => {
    const nW = wrap.offsetWidth, nH = wrap.offsetHeight;
    camera.aspect = nW / nH; camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
}

/* ===== CONTENT GRID ===== */
function renderGrid(cat) {
  const grid = document.getElementById('content-grid');
  if (!grid) return;
  const items = KOREA_DATA[cat] || [];
  grid.innerHTML = items.map(item => `
    <div class="content-card">
      <div class="card-emoji">${item.emoji}</div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-kr">${item.kr} · ${item.region}</div>
        <div class="card-desc">${item.desc}</div>
        <div class="card-tags">${item.tags.map(t=>`<span class="card-tag">${t}</span>`).join('')}</div>
        <button class="card-map-btn" onclick="openMapPanel(${JSON.stringify({name:item.name,kr:item.kr,mapQ:item.mapQ}).replace(/"/g,'&quot;')})">
          📍 View on Google Maps & Reviews
        </button>
      </div>
    </div>`).join('');
  grid.style.animation = 'none';
  grid.offsetHeight;
  grid.style.animation = '';
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
      renderGrid(cat);
      document.getElementById('categories-section')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });
}

/* ===== GOOGLE MAPS PANEL ===== */
let mapsLoaded = false;
let mapInstance = null;

function loadMapsScript() {
  if (mapsLoaded || !MAPS_KEY || MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') return;
  mapsLoaded = true;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
  s.async = true;
  document.head.appendChild(s);
}

function openMapPanel(item) {
  const panel = document.getElementById('map-panel');
  const backdrop = document.getElementById('mp-backdrop');
  document.getElementById('mp-title').textContent = item.name;
  document.getElementById('mp-kr').textContent = item.kr;
  document.getElementById('mp-rating').innerHTML = '';
  document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">Loading...</div>';
  panel.classList.add('open');
  backdrop.classList.add('open');

  // Google Maps embed (iframe — no JS API needed)
  const gmapFrame = document.getElementById('gmap');
  if (MAPS_KEY && MAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    const q = encodeURIComponent(item.mapQ || item.name + ' Korea');
    gmapFrame.innerHTML = `<iframe src="https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${q}&zoom=14" allowfullscreen loading="lazy"></iframe>`;
    // Fetch place details via worker
    fetchPlaceDetails(item.mapQ || item.name + ' Korea');
  } else {
    // Fallback: open link button only
    gmapFrame.innerHTML = `<div class="gmap-loading">📍 Add your Google Maps API key to enable map display</div>`;
    document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">Add Google Maps API key to see reviews.</div>';
  }

  // Directions + GMaps links
  const q = encodeURIComponent(item.mapQ || item.name + ' Korea');
  document.getElementById('mp-directions').href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  document.getElementById('mp-gmaps').href = `https://www.google.com/maps/search/${q}`;
}

async function fetchPlaceDetails(query) {
  if (!WORKER_URL) return;
  try {
    const res = await fetch(`${WORKER_URL}/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('place fetch failed');
    const data = await res.json();
    if (data.rating) renderPlaceDetails(data);
  } catch {
    document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">📍 Open Google Maps to see reviews</div>';
  }
}

function renderPlaceDetails(data) {
  const ratingEl = document.getElementById('mp-rating');
  const reviewsEl = document.getElementById('mp-reviews');
  const stars = '⭐'.repeat(Math.round(data.rating || 0));
  ratingEl.innerHTML = `
    <span class="mp-stars">${stars}</span>
    <span class="mp-score">${data.rating?.toFixed(1) || '—'}</span>
    <span class="mp-count">(${(data.userRatingsTotal || 0).toLocaleString()} reviews)</span>`;
  if (data.reviews?.length) {
    reviewsEl.innerHTML = data.reviews.slice(0,3).map(r => `
      <div class="mp-review">
        <div class="mp-review-header">
          <span class="mp-reviewer">${r.authorName}</span>
          <span class="mp-review-stars">${'⭐'.repeat(r.rating)}</span>
        </div>
        <div class="mp-review-text">${r.text?.slice(0,200)}${r.text?.length>200?'...':''}</div>
        <div class="mp-review-time">${r.relativeTime}</div>
      </div>`).join('');
  } else {
    reviewsEl.innerHTML = '<div class="mp-no-reviews">No reviews available yet</div>';
  }
}

function initMapPanel() {
  document.getElementById('mp-close')?.addEventListener('click', () => {
    document.getElementById('map-panel').classList.remove('open');
    document.getElementById('mp-backdrop').classList.remove('open');
  });
  document.getElementById('mp-backdrop')?.addEventListener('click', () => {
    document.getElementById('map-panel').classList.remove('open');
    document.getElementById('mp-backdrop').classList.remove('open');
  });
}

/* ===== AI CHATBOT ===== */
let chatHistory = [], isThinking = false;

function openChat() { document.getElementById('chatbot')?.classList.add('open'); }
function closeChat() { document.getElementById('chatbot')?.classList.remove('open'); }

function addMsg(role, text) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendMessage(text) {
  if (!text.trim() || isThinking) return;
  isThinking = true;
  const input = document.getElementById('chat-input');
  if (input) input.value = '';
  addMsg('user', text);
  chatHistory.push({ role:'user', content:text });
  const typingEl = addMsg('assistant typing', '●●●');
  try {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ message:text, history:chatHistory.slice(-8) })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.reply || 'Sorry, no response. Please try again.';
    typingEl?.remove();
    addMsg('assistant', reply);
    chatHistory.push({ role:'assistant', content:reply });
  } catch (err) {
    typingEl?.remove();
    addMsg('assistant', `⚠️ AI service unavailable. Check Worker deployment.\n(${err.message})`);
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
  document.getElementById('chat-send')?.addEventListener('click', () => sendMessage(input?.value||''));
  input?.addEventListener('keydown', e => { if (e.key==='Enter') sendMessage(input.value); });
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
  loadMapsScript();
});
