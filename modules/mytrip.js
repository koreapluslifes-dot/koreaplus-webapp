/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — "My Trip" personal record system
   One place to SAVE, RECORD & EDIT everything for a Korea trip:
     • Saved places (❤️ favorites from any card / detail panel)
     • Travel checklist (visa, K-ETA, T-money, SIM… editable)
     • Personal notes / journal
     • Saved AI itineraries
   100% client-side (localStorage). Self-contained: injects its own
   styles + UI, so it works on any page that loads this script.
   Exposes window.kpTrip.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY = 'kp_trip_v1';
  // Translate with English fallback. Returns fallback when i18n is absent.
  const tr = (k, fb) => {
    const v = window.kpI18n ? window.kpI18n.t(k) : null;
    return (v && v !== k) ? v : fb;
  };

  /* ── Default Korea-specific checklist (seeded once) ─────────────────
     Each default carries an i18n `key` so it re-localises on language
     switch; `text` is the English fallback. User-added items have no key. */
  const DEFAULT_CHECKLIST = [
    { id: 'c1',  key: 'trip.chk.passport',  text: 'Passport valid 6+ months', done: false },
    { id: 'c2',  key: 'trip.chk.keta',      text: 'K-ETA / visa checked (apply ≥72h before)', done: false },
    { id: 'c3',  key: 'trip.chk.flights',   text: 'Flights booked', done: false },
    { id: 'c4',  key: 'trip.chk.stay',      text: 'Accommodation booked', done: false },
    { id: 'c5',  key: 'trip.chk.insurance', text: 'Travel insurance', done: false },
    { id: 'c6',  key: 'trip.chk.sim',       text: 'SIM / eSIM or pocket WiFi arranged', done: false },
    { id: 'c7',  key: 'trip.chk.tmoney',    text: 'T-money transit card plan', done: false },
    { id: 'c8',  key: 'trip.chk.cash',      text: 'Some KRW cash + travel card', done: false },
    { id: 'c9',  key: 'trip.chk.apps',      text: 'Apps: KakaoMap, Naver Map, Papago, Kakao T', done: false },
    { id: 'c10', key: 'trip.chk.adapter',   text: 'Power adapter (220V, round pins)', done: false },
    { id: 'c11', key: 'trip.chk.clothing',  text: 'Weather-appropriate clothing', done: false },
    { id: 'c12', key: 'trip.chk.docs',      text: 'Copy of passport + emergency contacts', done: false },
  ];
  const chkText = c => c.key ? tr(c.key, c.text) : c.text;

  /* ── Store ──────────────────────────────────────────────────────── */
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') {
        return {
          places: raw.places || [],
          checklist: raw.checklist || DEFAULT_CHECKLIST.map(c => ({ ...c })),
          notes: raw.notes || [],
          itineraries: raw.itineraries || [],
          seeded: raw.seeded || false,
        };
      }
    } catch {}
    return { places: [], checklist: DEFAULT_CHECKLIST.map(c => ({ ...c })), notes: [], itineraries: [], seeded: true };
  }
  let S = load();
  if (!S.seeded) { S.checklist = DEFAULT_CHECKLIST.map(c => ({ ...c })); S.seeded = true; }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch { toast(tr('trip.toast.storageFull', '⚠️ Storage full — could not save')); }
    updateBadge();
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ── Public data ops ────────────────────────────────────────────── */
  function isSaved(name) { return S.places.some(p => p.name === name); }

  function togglePlace(item) {
    if (!item || !item.name) return false;
    const i = S.places.findIndex(p => p.name === item.name);
    let nowSaved;
    if (i >= 0) { S.places.splice(i, 1); nowSaved = false; }
    else {
      S.places.unshift({
        name: item.name, kr: item.kr || '', emoji: item.emoji || '📍',
        region: item.region || '', desc: item.desc || '',
        mapQ: item.mapQ || item.name, cat: item.cat || '', savedAt: Date.now(),
      });
      nowSaved = true;
    }
    persist();
    refreshOpenTab('places');
    return nowSaved;
  }

  function addNote(text) {
    const v = (text || '').trim(); if (!v) return;
    S.notes.unshift({ id: uid(), text: v, at: Date.now() });
    persist(); refreshOpenTab('notes');
  }
  function updateNote(id, text) {
    const n = S.notes.find(x => x.id === id); if (!n) return;
    n.text = text; n.at = Date.now(); persist();
  }
  function deleteNote(id) { S.notes = S.notes.filter(n => n.id !== id); persist(); refreshOpenTab('notes'); }

  function addChecklistItem(text) {
    const v = (text || '').trim(); if (!v) return;
    S.checklist.push({ id: uid(), text: v, done: false });
    persist(); refreshOpenTab('checklist');
  }
  function toggleChecklist(id) {
    const c = S.checklist.find(x => x.id === id); if (!c) return;
    c.done = !c.done; persist(); refreshOpenTab('checklist');
  }
  function deleteChecklist(id) { S.checklist = S.checklist.filter(c => c.id !== id); persist(); refreshOpenTab('checklist'); }

  function saveItinerary(itinerary, inputs) {
    if (!itinerary) return;
    S.itineraries.unshift({
      id: uid(),
      title: itinerary.title || 'Korea Itinerary',
      summary: itinerary.summary || '',
      days: Array.isArray(itinerary.days) ? itinerary.days.length : (itinerary.dayCount || 0),
      itinerary, inputs: inputs || null, at: Date.now(),
    });
    persist(); refreshOpenTab('trips');
    return S.itineraries[0].id;
  }
  function deleteItinerary(id) { S.itineraries = S.itineraries.filter(x => x.id !== id); persist(); refreshOpenTab('trips'); }

  function counts() {
    return {
      places: S.places.length,
      checklist: S.checklist.filter(c => !c.done).length,
      notes: S.notes.length,
      trips: S.itineraries.length,
      total: S.places.length + S.notes.length + S.itineraries.length,
    };
  }

  /* ── Export ─────────────────────────────────────────────────────── */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'KoreaPlus-MyTrip.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast(tr('trip.toast.exported', '📤 Trip exported'));
  }

  /* ── Toast (reuse global if present) ────────────────────────────── */
  function toast(msg) {
    if (window.kpShowToast) return window.kpShowToast(msg);
    let el = document.getElementById('kp-trip-toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'kp-trip-toast'; el.className = 'kp-trip-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ── Styles (injected once) ─────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('kp-trip-styles')) return;
    const css = `
.kp-trip-fab-badge,.kp-mt-badge{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 5px;border-radius:9px;background:#D62246;color:#fff;font-size:10px;font-weight:800;line-height:1;margin-left:2px}
.kp-mt-btn{position:relative;display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:20px;background:rgba(214,34,70,.08);border:1px solid rgba(214,34,70,.22);color:#D62246;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}
.kp-mt-btn:hover{background:rgba(214,34,70,.14)}
.kp-save-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.08);font-size:15px;cursor:pointer;transition:all .15s;flex-shrink:0;line-height:1;padding:0}
.kp-save-btn:hover{background:rgba(214,34,70,.1);border-color:rgba(214,34,70,.35);transform:scale(1.06)}
.kp-save-btn.saved{background:rgba(214,34,70,.12);border-color:rgba(214,34,70,.4)}
html.light .kp-save-btn{background:rgba(0,0,0,.05)}
.kp-trip-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:9600;opacity:0;pointer-events:none;transition:opacity .3s}
.kp-trip-backdrop.open{opacity:1;pointer-events:auto}
.kp-trip-panel{position:fixed;top:0;right:-460px;bottom:0;width:430px;max-width:100vw;z-index:9601;background:var(--bg3,#fff);border-left:1px solid var(--border,rgba(0,0,0,.1));box-shadow:-10px 0 50px rgba(0,0,0,.22);display:flex;flex-direction:column;transition:right .34s cubic-bezier(.4,0,.2,1)}
.kp-trip-panel.open{right:0}
.kp-tp-head{padding:18px 20px 0;flex-shrink:0;border-bottom:1px solid var(--border,rgba(0,0,0,.08))}
.kp-tp-titlerow{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.kp-tp-title{font-size:19px;font-weight:900;color:var(--text,#1a1714);display:flex;align-items:center;gap:8px}
.kp-tp-close{width:34px;height:34px;border-radius:9px;background:var(--bg2,#f0f0f0);border:1px solid var(--border,rgba(0,0,0,.08));color:var(--text2,#666);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.kp-tp-close:hover{background:#D62246;color:#fff;border-color:#D62246}
.kp-tp-tabs{display:flex;gap:2px}
.kp-tp-tab{flex:1;padding:10px 4px;background:none;border:none;border-bottom:2.5px solid transparent;color:var(--text2,#777);font-size:12px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .15s;font-family:inherit}
.kp-tp-tab .tabi{font-size:17px}
.kp-tp-tab.active{color:#D62246;border-bottom-color:#D62246}
.kp-tp-tab .cnt{font-size:10px;opacity:.7}
.kp-tp-body{flex:1;overflow-y:auto;padding:16px 18px 24px}
.kp-tp-empty{text-align:center;padding:44px 16px;color:var(--text3,#999)}
.kp-tp-empty .ee{font-size:38px;display:block;margin-bottom:10px;opacity:.55}
.kp-tp-empty p{font-size:13px;line-height:1.6}
.kp-mt-card{display:flex;gap:11px;align-items:flex-start;padding:12px;border:1px solid var(--border,rgba(0,0,0,.08));border-radius:11px;margin-bottom:9px;background:var(--bg2,#fafafa)}
.kp-mt-card .em{font-size:23px;flex-shrink:0;line-height:1.2}
.kp-mt-card .bd{flex:1;min-width:0}
.kp-mt-card .nm{font-size:14px;font-weight:700;color:var(--text,#1a1714)}
.kp-mt-card .sb{font-size:11px;color:var(--text3,#999);margin-top:1px}
.kp-mt-card .ds{font-size:12px;color:var(--text2,#666);margin-top:5px;line-height:1.5}
.kp-mt-card .acts{display:flex;gap:7px;margin-top:9px}
.kp-mini{padding:5px 11px;border-radius:7px;font-size:11px;font-weight:600;border:1px solid var(--border,rgba(0,0,0,.1));background:var(--bg3,#fff);color:var(--text2,#555);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px}
.kp-mini:hover{border-color:#D62246;color:#D62246}
.kp-mini.danger:hover{border-color:#D62246;background:#D62246;color:#fff}
.kp-chk{display:flex;align-items:center;gap:11px;padding:10px 11px;border:1px solid var(--border,rgba(0,0,0,.07));border-radius:10px;margin-bottom:7px;background:var(--bg2,#fafafa)}
.kp-chk .box{width:21px;height:21px;border-radius:6px;border:2px solid var(--border-g,#C8973A);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;transition:all .15s}
.kp-chk.done .box{background:#16a34a;border-color:#16a34a}
.kp-chk .txt{flex:1;font-size:13px;color:var(--text,#1a1714);line-height:1.45;cursor:pointer}
.kp-chk.done .txt{text-decoration:line-through;color:var(--text3,#999)}
.kp-chk .del{background:none;border:none;color:var(--text3,#bbb);cursor:pointer;font-size:14px;flex-shrink:0;padding:2px 4px}
.kp-chk .del:hover{color:#D62246}
.kp-add-row{display:flex;gap:7px;margin:4px 0 16px}
.kp-add-row input{flex:1;padding:9px 12px;border-radius:9px;border:1px solid var(--border,rgba(0,0,0,.12));background:var(--bg3,#fff);color:var(--text,#1a1714);font-size:13px;font-family:inherit;outline:none}
.kp-add-row input:focus{border-color:#D62246}
.kp-add-row button{padding:9px 15px;border-radius:9px;border:none;background:#D62246;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.kp-note{border:1px solid var(--border,rgba(0,0,0,.08));border-radius:11px;padding:11px 13px;margin-bottom:9px;background:var(--bg2,#fafafa)}
.kp-note textarea{width:100%;border:none;background:none;resize:vertical;min-height:46px;font-size:13px;color:var(--text,#1a1714);font-family:inherit;line-height:1.55;outline:none}
.kp-note .meta{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
.kp-note .ts{font-size:10.5px;color:var(--text3,#aaa)}
.kp-prog{height:7px;border-radius:5px;background:var(--bg2,#eee);overflow:hidden;margin:2px 0 14px}
.kp-prog>i{display:block;height:100%;background:linear-gradient(90deg,#16a34a,#22c55e);transition:width .4s}
.kp-tp-foot{flex-shrink:0;padding:11px 18px;border-top:1px solid var(--border,rgba(0,0,0,.08));display:flex;gap:8px}
.kp-tp-foot button{flex:1;padding:9px;border-radius:9px;border:1px solid var(--border,rgba(0,0,0,.12));background:var(--bg2,#fafafa);color:var(--text2,#555);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.kp-tp-foot button:hover{border-color:#D62246;color:#D62246}
.kp-trip-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);background:#1e2a3a;color:#fff;border-radius:22px;padding:10px 20px;font-size:13px;font-weight:600;z-index:99999;transition:transform .3s;box-shadow:0 8px 30px rgba(0,0,0,.4)}
.kp-trip-toast.show{transform:translateX(-50%) translateY(0)}
@media(max-width:520px){.kp-trip-panel{width:100%}}
`;
    const s = document.createElement('style');
    s.id = 'kp-trip-styles'; s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── Panel shell ────────────────────────────────────────────────── */
  let activeTab = 'places';
  function buildPanel() {
    if (document.getElementById('kp-trip-panel')) return;
    const bd = document.createElement('div');
    bd.id = 'kp-trip-backdrop'; bd.className = 'kp-trip-backdrop';
    bd.addEventListener('click', closePanel);
    document.body.appendChild(bd);

    const p = document.createElement('div');
    p.id = 'kp-trip-panel'; p.className = 'kp-trip-panel';
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'My Trip');
    p.innerHTML = `
      <div class="kp-tp-head">
        <div class="kp-tp-titlerow">
          <div class="kp-tp-title">${tr('trip.title', '💼 My Trip')}</div>
          <button class="kp-tp-close" id="kp-tp-close" aria-label="Close">✕</button>
        </div>
        <div class="kp-tp-tabs" id="kp-tp-tabs">
          <button class="kp-tp-tab" data-tab="places"><span class="tabi">❤️</span>${tr('trip.tab.saved','Saved')}<span class="cnt" data-c="places"></span></button>
          <button class="kp-tp-tab" data-tab="checklist"><span class="tabi">✅</span>${tr('trip.tab.checklist','Checklist')}<span class="cnt" data-c="checklist"></span></button>
          <button class="kp-tp-tab" data-tab="notes"><span class="tabi">📝</span>${tr('trip.tab.notes','Notes')}<span class="cnt" data-c="notes"></span></button>
          <button class="kp-tp-tab" data-tab="trips"><span class="tabi">🗺️</span>${tr('trip.tab.trips','Trips')}<span class="cnt" data-c="trips"></span></button>
        </div>
      </div>
      <div class="kp-tp-body" id="kp-tp-body"></div>
      <div class="kp-tp-foot">
        <button id="kp-tp-export">${tr('trip.export','📤 Export trip (JSON)')}</button>
      </div>`;
    document.body.appendChild(p);

    p.querySelector('#kp-tp-close').addEventListener('click', closePanel);
    p.querySelector('#kp-tp-export').addEventListener('click', exportJSON);
    p.querySelectorAll('.kp-tp-tab').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.tab; render(); });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && p.classList.contains('open')) closePanel();
    });
  }

  function openPanel(tab) {
    buildPanel();
    if (tab) activeTab = tab;
    render();
    document.getElementById('kp-trip-panel').classList.add('open');
    document.getElementById('kp-trip-backdrop').classList.add('open');
  }
  function closePanel() {
    document.getElementById('kp-trip-panel')?.classList.remove('open');
    document.getElementById('kp-trip-backdrop')?.classList.remove('open');
  }

  function refreshOpenTab(tab) {
    const panel = document.getElementById('kp-trip-panel');
    if (panel && panel.classList.contains('open') && activeTab === tab) render();
    updateBadge();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  const ago = ts => {
    const d = (Date.now() - ts) / 86400000;
    if (d < 1) return tr('time.today', 'today');
    if (d < 2) return tr('time.yesterday', 'yesterday');
    return Math.floor(d) + ' ' + tr('time.daysAgo', 'days ago');
  };

  /* ── Render tabs ────────────────────────────────────────────────── */
  function render() {
    const panel = document.getElementById('kp-trip-panel'); if (!panel) return;
    const c = counts();
    panel.querySelectorAll('.kp-tp-tab').forEach(tb => tb.classList.toggle('active', tb.dataset.tab === activeTab));
    panel.querySelectorAll('.cnt').forEach(el => {
      const v = c[el.dataset.c]; el.textContent = v ? ` (${v})` : '';
    });
    const body = panel.querySelector('#kp-tp-body');
    if (activeTab === 'places') body.innerHTML = renderPlaces();
    else if (activeTab === 'checklist') body.innerHTML = renderChecklist();
    else if (activeTab === 'notes') body.innerHTML = renderNotes();
    else body.innerHTML = renderTrips();
    wireBody(body);
  }

  function renderPlaces() {
    if (!S.places.length) return empty('❤️', tr('trip.empty.places', 'No saved places yet. Tap the heart ❤️ on any place to save it here.'));
    return S.places.map(p => `
      <div class="kp-mt-card">
        <span class="em">${esc(p.emoji)}</span>
        <div class="bd">
          <div class="nm">${esc(p.name)}</div>
          <div class="sb">${esc(p.kr)}${p.kr && p.region ? ' · ' : ''}${esc(p.region)}</div>
          ${p.desc ? `<div class="ds">${esc(p.desc)}</div>` : ''}
          <div class="acts">
            <a class="kp-mini" href="https://www.google.com/maps/search/${encodeURIComponent(p.mapQ || p.name)}" target="_blank" rel="noopener">${tr('trip.map','📍 Map')}</a>
            <button class="kp-mini danger" data-rm-place="${esc(p.name)}">${tr('trip.remove','🗑 Remove')}</button>
          </div>
        </div>
      </div>`).join('');
  }

  function renderChecklist() {
    const done = S.checklist.filter(c => c.done).length;
    const pct = S.checklist.length ? Math.round(done / S.checklist.length * 100) : 0;
    const items = S.checklist.map(c => `
      <div class="kp-chk ${c.done ? 'done' : ''}">
        <div class="box" data-chk="${c.id}">${c.done ? '✓' : ''}</div>
        <div class="txt" data-chk="${c.id}">${esc(chkText(c))}</div>
        <button class="del" data-del-chk="${c.id}" aria-label="Delete">🗑</button>
      </div>`).join('');
    return `
      <div style="font-size:12px;color:var(--text2,#666);margin-bottom:4px">${done}/${S.checklist.length} ${tr('trip.done','done')} · ${pct}%</div>
      <div class="kp-prog"><i style="width:${pct}%"></i></div>
      <div class="kp-add-row">
        <input type="text" id="kp-chk-input" placeholder="${tr('trip.checklist.placeholder','Add a checklist item…')}" maxlength="120">
        <button id="kp-chk-add">${tr('trip.add','Add')}</button>
      </div>
      ${items}`;
  }

  function renderNotes() {
    const list = S.notes.length
      ? S.notes.map(n => `
        <div class="kp-note">
          <textarea data-note="${n.id}" rows="2">${esc(n.text)}</textarea>
          <div class="meta">
            <span class="ts">${ago(n.at)}</span>
            <button class="kp-mini danger" data-del-note="${n.id}">${tr('trip.delete','🗑 Delete')}</button>
          </div>
        </div>`).join('')
      : empty('📝', tr('trip.empty.notes', 'No notes yet. Jot down reservations, ideas, or anything to remember.'));
    return `
      <div class="kp-add-row">
        <input type="text" id="kp-note-input" placeholder="${tr('trip.notes.placeholder','Write a quick note…')}" maxlength="500">
        <button id="kp-note-add">${tr('trip.add','Add')}</button>
      </div>
      ${list}`;
  }

  function renderTrips() {
    if (!S.itineraries.length) return empty('🗺️', tr('trip.empty.trips', 'No saved itineraries yet. Build one in the Trip Planner, then tap "Save to My Trip".')) +
      `<div style="text-align:center;margin-top:6px"><a class="kp-mini" href="plan.html">${tr('trip.openPlanner','✨ Open Trip Planner')}</a></div>`;
    return S.itineraries.map(it => `
      <div class="kp-mt-card">
        <span class="em">🗺️</span>
        <div class="bd">
          <div class="nm">${esc(it.title)}</div>
          <div class="sb">${it.days ? it.days + ' ' + tr('trip.days','days') + ' · ' : ''}${tr('trip.savedAgo','saved')} ${ago(it.at)}</div>
          ${it.summary ? `<div class="ds">${esc(String(it.summary).slice(0, 140))}</div>` : ''}
          <div class="acts">
            <a class="kp-mini" href="plan.html">${tr('trip.openPlanner2','🔄 Open Planner')}</a>
            <button class="kp-mini danger" data-del-trip="${it.id}">${tr('trip.remove','🗑 Remove')}</button>
          </div>
        </div>
      </div>`).join('');
  }

  function empty(e, msg) { return `<div class="kp-tp-empty"><span class="ee">${e}</span><p>${msg}</p></div>`; }

  function wireBody(body) {
    body.querySelectorAll('[data-rm-place]').forEach(b => b.addEventListener('click', () => {
      togglePlace({ name: b.dataset.rmPlace }); syncHearts();
    }));
    body.querySelectorAll('[data-chk]').forEach(el => el.addEventListener('click', () => toggleChecklist(el.dataset.chk)));
    body.querySelectorAll('[data-del-chk]').forEach(b => b.addEventListener('click', () => deleteChecklist(b.dataset.delChk)));
    body.querySelectorAll('[data-del-note]').forEach(b => b.addEventListener('click', () => deleteNote(b.dataset.delNote)));
    body.querySelectorAll('[data-del-trip]').forEach(b => b.addEventListener('click', () => deleteItinerary(b.dataset.delTrip)));
    body.querySelectorAll('textarea[data-note]').forEach(ta => {
      ta.addEventListener('blur', () => updateNote(ta.dataset.note, ta.value));
    });
    const ci = body.querySelector('#kp-chk-input'), ca = body.querySelector('#kp-chk-add');
    if (ca) ca.addEventListener('click', () => { addChecklistItem(ci.value); });
    if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter') addChecklistItem(ci.value); });
    const ni = body.querySelector('#kp-note-input'), na = body.querySelector('#kp-note-add');
    if (na) na.addEventListener('click', () => { addNote(ni.value); });
    if (ni) ni.addEventListener('keydown', e => { if (e.key === 'Enter') addNote(ni.value); });
  }

  /* ── Header button + badge ──────────────────────────────────────── */
  function mountHeaderButton() {
    if (document.getElementById('kp-mt-btn')) return;
    // index.html control bar, or hub-nav
    const host = document.querySelector('.header-inner > div:last-child')
      || document.querySelector('.hub-nav') || document.querySelector('.header-inner');
    if (!host) return;
    const btn = document.createElement('button');
    btn.id = 'kp-mt-btn'; btn.className = 'kp-mt-btn'; btn.type = 'button';
    btn.setAttribute('aria-label', 'My Trip');
    btn.innerHTML = `💼 <span class="lbl">${tr('trip.btn','My Trip')}</span><span class="kp-mt-badge" id="kp-mt-badge" style="display:none"></span>`;
    btn.addEventListener('click', () => openPanel());
    // place before AI button if present
    const ai = host.querySelector('#ai-open-btn');
    if (ai) host.insertBefore(btn, ai); else host.appendChild(btn);
    updateBadge();
  }

  function updateBadge() {
    const b = document.getElementById('kp-mt-badge'); if (!b) return;
    const total = counts().total;
    if (total > 0) { b.textContent = total; b.style.display = ''; }
    else b.style.display = 'none';
  }

  /* ── Heart save buttons (cards + detail panel) ──────────────────── */
  function heartHTML(item) {
    const saved = isSaved(item.name);
    return `<button class="kp-save-btn ${saved ? 'saved' : ''}" data-kp-save aria-label="${saved ? 'Saved' : 'Save place'}" aria-pressed="${saved}">${saved ? '❤️' : '🤍'}</button>`;
  }

  // Global delegation: any [data-kp-save] toggles save for its nearest [data-item]
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-kp-save]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const host = btn.closest('[data-item]');
    let item = null;
    if (host) { try { item = JSON.parse(host.dataset.item); } catch {} }
    if (!item && btn.dataset.itemName) item = { name: btn.dataset.itemName };
    if (!item) return;
    const nowSaved = togglePlace(item);
    btn.classList.toggle('saved', nowSaved);
    btn.textContent = nowSaved ? '❤️' : '🤍';
    btn.setAttribute('aria-pressed', String(nowSaved));
    btn.setAttribute('aria-label', nowSaved ? 'Saved' : 'Save place');
    toast(nowSaved ? `❤️ ${tr('trip.toast.saved','Saved')} ${item.name}` : `${tr('trip.toast.removed','Removed')} ${item.name}`);
    syncHearts();
  }, true);

  // Re-sync all hearts on screen (after a remove from the panel)
  function syncHearts() {
    document.querySelectorAll('[data-kp-save]').forEach(btn => {
      const host = btn.closest('[data-item]');
      if (!host) return;
      let item; try { item = JSON.parse(host.dataset.item); } catch { return; }
      const saved = isSaved(item.name);
      btn.classList.toggle('saved', saved);
      btn.textContent = saved ? '❤️' : '🤍';
    });
  }

  /* ── Re-localise when the language changes ──────────────────────── */
  function relabel() {
    // Header button label
    const lbl = document.querySelector('#kp-mt-btn .lbl');
    if (lbl) lbl.textContent = tr('trip.btn', 'My Trip');
    // Panel chrome + currently open tab
    const panel = document.getElementById('kp-trip-panel');
    if (!panel) return;
    const title = panel.querySelector('.kp-tp-title');
    if (title) title.textContent = tr('trip.title', '💼 My Trip');
    const map = { places: 'trip.tab.saved', checklist: 'trip.tab.checklist', notes: 'trip.tab.notes', trips: 'trip.tab.trips' };
    panel.querySelectorAll('.kp-tp-tab').forEach(tab => {
      const fb = tab.dataset.tab;
      const labelNode = tab.childNodes[1]; // text node after the emoji span
      if (labelNode) labelNode.textContent = tr(map[fb], fb);
    });
    const exp = panel.querySelector('#kp-tp-export');
    if (exp) exp.textContent = tr('trip.export', '📤 Export trip (JSON)');
    if (panel.classList.contains('open')) render();
  }
  document.addEventListener('kp:langchange', relabel);

  /* ── Boot ───────────────────────────────────────────────────────── */
  function boot() { injectStyles(); mountHeaderButton(); buildPanel(); updateBadge(); relabel(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.kpTrip = {
    open: openPanel, close: closePanel,
    isSaved, togglePlace, heartHTML, syncHearts,
    addNote, addChecklistItem, saveItinerary,
    counts, exportJSON,
  };
})();
