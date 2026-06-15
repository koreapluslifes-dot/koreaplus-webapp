/* modules/kbeauty.js — K-Beauty hub renderer.
   Renders fully from the manual tier (window.KBEAUTY_*) with ZERO API keys,
   then progressively enriches via the Worker (/api/kbeauty/*) when reachable
   (live AliExpress shop grid, Wikidata brand bios). Personalization (skin type,
   concerns, brand follows, shelf) persists in localStorage. Loaded last. */
(function () {
  'use strict';
  const $  = (s, r = document) => (r || document).querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  // Data tier (English source of truth). These become `let` because the content
  // is localized in place at boot from the per-language overlay (see localizeData).
  let SKINTYPES   = window.KBEAUTY_SKINTYPES   || [];
  let QUIZ        = window.KBEAUTY_QUIZ         || [];
  let CONCERNS    = window.KBEAUTY_CONCERNS     || [];
  let ROUTINE     = window.KBEAUTY_ROUTINE      || [];
  let INGREDIENTS = window.KBEAUTY_INGREDIENTS  || [];
  const CHECKABLE = window.KBEAUTY_CHECKABLE    || [];
  let CONFLICTS   = window.KBEAUTY_CONFLICTS    || [];
  let BRANDS      = window.KBEAUTY_BRANDS       || [];
  let GLOSSARY    = window.KBEAUTY_GLOSSARY     || [];
  let TRENDS      = window.KBEAUTY_TRENDS       || [];
  let FORECAST    = window.KBEAUTY_FORECAST     || {};
  let SHOP        = window.KBEAUTY_SHOP         || { aliSeeds:{}, retailers:[] };
  let MENS        = window.KBEAUTY_MENS         || null;
  const API = window.KPApi || null;

  let ING_BY_ID = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]));
  let CONCERN_BY_ID = Object.fromEntries(CONCERNS.map(c => [c.id, c]));

  // ── Per-language CONTENT overlay ────────────────────────────────────────────
  // chrome (buttons/titles) is localized via data-i18n; the DATA content
  // (ingredient explainers, routine steps, concerns, glossary…) is localized
  // here from assets/kbeauty-content.<lang>.json (English fallback per key).
  let CONTENT = {};
  async function loadContent() {
    if (lang === 'en') return;
    try {
      const base = document.querySelector('base')?.href || '';
      const r = await fetch(base + 'assets/kbeauty-content.' + lang + '.json', { cache: 'force-cache' });
      if (r.ok) CONTENT = await r.json() || {};
    } catch { /* keep English */ }
  }
  const cx = (key, fallback) => (CONTENT && CONTENT[key]) || fallback;
  function localizeData() {
    if (!CONTENT || !Object.keys(CONTENT).length) return; // en or load failed → English
    SKINTYPES   = SKINTYPES.map(s => ({ ...s, name: cx(`skin.${s.id}.name`, s.name), desc: cx(`skin.${s.id}.desc`, s.desc) }));
    CONCERNS    = CONCERNS.map(c => ({ ...c, name: cx(`concern.${c.id}.name`, c.name), desc: cx(`concern.${c.id}.desc`, c.desc), tip: cx(`concern.${c.id}.tip`, c.tip), avoid: cx(`concern.${c.id}.avoid`, c.avoid) }));
    ROUTINE     = ROUTINE.map(s => ({ ...s, name: cx(`routine.${s.id}.name`, s.name), desc: cx(`routine.${s.id}.desc`, s.desc), layering: cx(`routine.${s.id}.layering`, s.layering), freq: cx(`routine.${s.id}.freq`, s.freq) }));
    INGREDIENTS = INGREDIENTS.map(i => ({ ...i, name: cx(`ing.${i.id}.name`, i.name), explainer: cx(`ing.${i.id}.explainer`, i.explainer), benefits: (i.benefits || []).map((b, n) => cx(`ing.${i.id}.benefit.${n}`, b)) }));
    GLOSSARY    = GLOSSARY.map((g, i) => ({ ...g, term: cx(`gloss.${i}.term`, g.term), def: cx(`gloss.${i}.def`, g.def) }));
    TRENDS      = TRENDS.map(t2 => ({ ...t2, title: cx(`trend.${t2.id}.title`, t2.title), blurb: cx(`trend.${t2.id}.blurb`, t2.blurb) }));
    BRANDS      = BRANDS.map(b => ({ ...b, knownFor: cx(`brand.${b.id}.knownFor`, b.knownFor) }));
    QUIZ        = QUIZ.map(q => ({ ...q, q: cx(`quiz.${q.id}.q`, q.q), options: q.options.map((o, n) => ({ ...o, label: cx(`quiz.${q.id}.opt.${n}`, o.label) })) }));
    CONFLICTS   = CONFLICTS.map((c, i) => ({ ...c, reason: cx(`conflict.${i}.reason`, c.reason) }));
    if (MENS) MENS = { ...MENS, title: cx('mens.title', MENS.title), desc: cx('mens.desc', MENS.desc), steps: (MENS.steps || []).map((s, n) => ({ ...s, name: cx(`mens.step.${n}.name`, s.name), note: cx(`mens.step.${n}.note`, s.note) })) };
    FORECAST    = Object.fromEntries(Object.entries(FORECAST).map(([k, f]) => [k, { ...f, headline: cx(`forecast.${k}.headline`, f.headline), tips: (f.tips || []).map((tp, n) => cx(`forecast.${k}.tip.${n}`, tp)) }]));
    if (SHOP && SHOP.retailers) SHOP = { ...SHOP, disclosure: cx('shop.disclosure', SHOP.disclosure), retailers: SHOP.retailers.map(r => ({ ...r, note: cx(`shop.retailer.${r.id}.note`, r.note), cta: cx(`shop.retailer.${r.id}.cta`, r.cta) })) };
    ING_BY_ID = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]));
    CONCERN_BY_ID = Object.fromEntries(CONCERNS.map(c => [c.id, c]));
  }

  const SKIN_KEY = 'kp_kbeauty_skin', CONCERN_KEY = 'kp_kbeauty_concerns', FOLLOW_KEY = 'kp_kbeauty_follow';

  // Language resolution mirrors modules/i18n.js detect(): URL ?lang= wins (so
  // hreflang'd /kbeauty.html?lang=xx pages serve matching content), then the
  // saved choice, then the browser language.
  const _SUPPORTED = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];
  const _urlLang = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
  const lang = (_SUPPORTED.includes(_urlLang) ? _urlLang
    : (localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2) || 'en')).toLowerCase();

  // ── Mini i18n for JS-generated labels (chrome uses data-i18n via i18n.js) ──
  const STR = {
    en: { result:'Your skin type', retake:'Retake', best:'Best for', pairs:'Pairs with', avoid:'Be careful with', preg:'Pregnancy', pregSafe:'Generally fine', pregCaution:'Ask your doctor', time:'Use', am:'AM', pm:'PM', both:'AM & PM', shop:'Shop this step', shopFor:'Shop', loading:'Loading…', shopEmpty:'Live shopping lights up here. Meanwhile, browse our authentic retailers below.', selectActives:'Select 2+ actives to check.', allSafe:'No conflicts — these play nicely together. 🎉', followToast:'Added to favourites ★', unfollowToast:'Removed', known:'Known for', tier:'Tier', vegan:'Vegan', mens:'Men-friendly', bioSoon:'Loading profile…', readMore:'Learn more', decNone:'No ingredients recognized — check the spelling or paste the full INCI list.', decFound:'recognized', priceFrom:'from', shelfEmpty:'Take the quiz and pick concerns — your shelf builds itself.', yourRoutine:'Your routine', sources:'Always patch-test new actives.' },
    ko: { result:'내 피부 타입', retake:'다시하기', best:'추천 고민', pairs:'잘 맞는 성분', avoid:'주의 조합', preg:'임신 중', pregSafe:'일반적으로 무난', pregCaution:'의사와 상담', time:'사용', am:'아침', pm:'밤', both:'아침·밤', shop:'이 단계 쇼핑', shopFor:'쇼핑', loading:'불러오는 중…', shopEmpty:'실시간 쇼핑이 곧 표시됩니다. 아래 정품 판매처를 둘러보세요.', selectActives:'2개 이상 성분을 선택하세요.', allSafe:'충돌 없음 — 함께 써도 괜찮아요. 🎉', followToast:'즐겨찾기에 추가 ★', unfollowToast:'삭제됨', known:'대표', tier:'등급', vegan:'비건', mens:'남성 추천', bioSoon:'프로필 불러오는 중…', readMore:'자세히', decNone:'인식된 성분이 없어요 — 철자를 확인하거나 전체 성분표를 붙여넣어 보세요.', decFound:'개 인식됨', priceFrom:'부터', shelfEmpty:'퀴즈를 풀고 고민을 선택하면 선반이 자동으로 채워져요.', yourRoutine:'내 루틴', sources:'새 활성성분은 항상 패치테스트하세요.' },
    ja: { result:'あなたの肌タイプ', retake:'やり直す', best:'おすすめの悩み', pairs:'相性の良い成分', avoid:'注意の組合せ', preg:'妊娠中', pregSafe:'おおむね問題なし', pregCaution:'医師に相談', time:'使用', am:'朝', pm:'夜', both:'朝・夜', shop:'このステップを探す', shopFor:'探す', loading:'読み込み中…', shopEmpty:'ライブショッピングはここに表示されます。下の正規販売店もどうぞ。', selectActives:'2つ以上の成分を選択。', allSafe:'問題なし — 一緒に使えます。🎉', followToast:'お気に入りに追加 ★', unfollowToast:'削除しました', known:'代表', tier:'グレード', vegan:'ヴィーガン', mens:'メンズ可', bioSoon:'プロフィール読み込み中…', readMore:'詳しく', decNone:'認識された成分がありません — スペルを確認するか全成分を貼り付けてください。', decFound:'件認識', priceFrom:'〜', shelfEmpty:'診断と悩みを選ぶと棚が自動で埋まります。', yourRoutine:'あなたのルーティン', sources:'新しい成分は必ずパッチテストを。' },
  };
  const t = (k) => (CONTENT && CONTENT['ui.' + k]) || (STR[lang] && STR[lang][k]) || STR.en[k] || k;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toast = (msg) => {
    let el = $('#kb-toast');
    if (!el) { el = document.createElement('div'); el.id = 'kb-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.style.cssText = 'position:fixed;left:50%;bottom:78px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:10px 18px;border-radius:22px;font-size:13px;font-weight:700;z-index:300;opacity:0;transition:opacity .2s;pointer-events:none'; document.body.appendChild(el); }
    el.textContent = msg; el.style.opacity = '1';
    clearTimeout(el._tm); el._tm = setTimeout(() => { el.style.opacity = '0'; }, 1800);
  };

  // ── State helpers ──────────────────────────────────────────────────────────
  const getSkin = () => { try { return localStorage.getItem(SKIN_KEY) || ''; } catch { return ''; } };
  const setSkin = (id) => { try { localStorage.setItem(SKIN_KEY, id); } catch {} };
  const getConcerns = () => { try { return new Set(JSON.parse(localStorage.getItem(CONCERN_KEY) || '[]')); } catch { return new Set(); } };
  const setConcerns = (s) => { try { localStorage.setItem(CONCERN_KEY, JSON.stringify([...s])); } catch {} };
  const getFollows = () => { try { return new Set(JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]')); } catch { return new Set(); } };
  const setFollows = (s) => { try { localStorage.setItem(FOLLOW_KEY, JSON.stringify([...s])); } catch {} };

  // ── Seasonal forecast (zero-key) ────────────────────────────────────────────
  function currentSeason() {
    const m = new Date().getMonth() + 1; // northern hemisphere (Korea-centric)
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }
  function renderForecast() {
    const box = $('#kb-forecast-strip'); if (!box) return;
    const f = FORECAST[currentSeason()]; if (!f) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="kb-forecast">
      <div class="fc-emoji">${f.emoji || '🌤️'}</div>
      <div>
        <div class="fc-head">${esc(f.headline)}</div>
        <ul class="fc-tips">${(f.tips || []).map(tp => `<li>${esc(tp)}</li>`).join('')}</ul>
      </div>
    </div>`;
  }

  // ── Skin-type quiz ──────────────────────────────────────────────────────────
  const quizAnswers = {};
  function renderQuiz() {
    const box = $('#kb-quiz-box'); if (!box) return;
    const skin = getSkin();
    if (skin) { renderResult(skin); return; }
    box.innerHTML = `<div class="kb-quiz">
      ${QUIZ.map((q, qi) => `<div class="kb-q" data-q="${qi}">
        <div class="kb-q-text">${qi + 1}. ${esc(q.q)}</div>
        <div class="kb-opts">${q.options.map((o, oi) => `<button class="kb-opt" data-q="${qi}" data-o="${oi}">${esc(o.label)}</button>`).join('')}</div>
      </div>`).join('')}
      <button class="kb-quiz-cta" id="kb-quiz-submit" disabled>${esc(seeResultLabel())}</button>
    </div>`;
    $$('.kb-opt', box).forEach(b => b.addEventListener('click', () => {
      const qi = +b.dataset.q;
      $$(`.kb-opt[data-q="${qi}"]`, box).forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      quizAnswers[qi] = +b.dataset.o;
      const submit = $('#kb-quiz-submit'); if (submit) submit.disabled = Object.keys(quizAnswers).length < QUIZ.length;
    }));
    const submit = $('#kb-quiz-submit');
    if (submit) submit.addEventListener('click', () => {
      const scores = {};
      QUIZ.forEach((q, qi) => {
        const sc = q.options[quizAnswers[qi]] && q.options[quizAnswers[qi]].score || {};
        for (const k in sc) scores[k] = (scores[k] || 0) + sc[k];
      });
      let best = 'combination', max = -1;
      for (const k in scores) if (scores[k] > max) { max = scores[k]; best = k; }
      setSkin(best); renderResult(best); refreshPersonalized();
      try { document.getElementById('kb-quiz').scrollIntoView({ behavior:'smooth', block:'start' }); } catch {}
    });
  }
  function seeResultLabel() { return lang === 'ko' ? '결과 보기' : lang === 'ja' ? '結果を見る' : 'See my result'; }
  function renderResult(skinId) {
    const box = $('#kb-quiz-box'); if (!box) return;
    const st = SKINTYPES.find(s => s.id === skinId) || SKINTYPES[0]; if (!st) return;
    box.innerHTML = `<div class="kb-result">
      <div class="r-emoji">${st.emoji || '✨'}</div>
      <div>
        <div class="r-name">${t('result')}: ${esc(st.name)}</div>
        <div class="r-desc">${esc(st.desc)}</div>
      </div>
      <button class="r-reset" id="kb-retake">↻ ${esc(t('retake'))}</button>
    </div>`;
    const rt = $('#kb-retake');
    if (rt) rt.addEventListener('click', () => { try { localStorage.removeItem(SKIN_KEY); } catch {} for (const k in quizAnswers) delete quizAnswers[k]; renderQuiz(); refreshPersonalized(); });
    showShareFab();
  }

  // ── Concern selector ────────────────────────────────────────────────────────
  function renderConcerns() {
    const grid = $('#kb-concern-grid'); if (!grid) return;
    const sel = getConcerns();
    grid.innerHTML = CONCERNS.map(c => `<button class="kb-concern${sel.has(c.id) ? ' sel' : ''}" data-c="${esc(c.id)}" aria-pressed="${sel.has(c.id) ? 'true' : 'false'}">
      <div class="c-emoji" aria-hidden="true">${c.emoji || '🎯'}</div>
      <div class="c-name">${esc(c.name)}</div>
      <div class="c-desc">${esc(c.desc)}</div>
    </button>`).join('');
    $$('.kb-concern', grid).forEach(b => b.addEventListener('click', () => {
      const s = getConcerns(); const id = b.dataset.c;
      if (s.has(id)) s.delete(id); else s.add(id);
      setConcerns(s); b.classList.toggle('sel');
      b.setAttribute('aria-pressed', b.classList.contains('sel') ? 'true' : 'false');
      refreshPersonalized(); showShareFab();
    }));
  }

  // ── Routine builder ─────────────────────────────────────────────────────────
  let routineTime = 'am';
  function renderRoutine() {
    const box = $('#kb-routine-steps'); if (!box) return;
    // Men's simplified preset (an under-served, fast-growing K-beauty segment)
    if (routineTime === 'mens' && MENS) {
      box.innerHTML = `<div class="kb-step" style="border-style:dashed">
          <div class="kb-step-no">${MENS.emoji || '🧔'}</div>
          <div class="kb-step-b"><div class="kb-step-name">${esc(MENS.title || '')}</div>
          <div class="kb-step-desc">${esc(MENS.desc || '')}</div></div>
        </div>` + (MENS.steps || []).map((s, i) => `<div class="kb-step">
          <div class="kb-step-no">${i + 1}</div>
          <div class="kb-step-b">
            <div class="kb-step-name"><span class="st-emoji">${s.emoji || ''}</span>${esc(s.name)}</div>
            <div class="kb-step-desc">${esc(s.note || '')}</div>
            <button class="kb-step-shop" data-seed="${esc((SHOP.aliSeeds || {}).general || 'korean skincare')} men">🛍️ ${esc(t('shop'))}</button>
          </div></div>`).join('');
      $$('.kb-step-shop', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
      return;
    }
    const steps = ROUTINE.filter(s => s.time === routineTime || s.time === 'both')
      .slice().sort((a, b) => a.step - b.step);
    box.innerHTML = steps.map((s, i) => `<div class="kb-step${s.optional ? ' is-opt' : ''}">
      <div class="kb-step-no">${i + 1}</div>
      <div class="kb-step-b">
        <div class="kb-step-name"><span class="st-emoji">${s.emoji || ''}</span>${esc(s.name)}<span class="kb-step-freq">${esc(s.freq || '')}</span></div>
        <div class="kb-step-desc">${esc(s.desc)}</div>
        <div class="kb-step-lay">↳ ${esc(s.layering || '')}</div>
        <button class="kb-step-shop" data-seed="${esc(stepSeed(s))}">🛍️ ${esc(t('shop'))}</button>
      </div>
    </div>`).join('');
    $$('.kb-step-shop', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }
  function stepSeed(s) {
    const seeds = SHOP.aliSeeds || {};
    if (s.id === 'sunscreen') return seeds.suncare || seeds.general || 'korean sunscreen';
    if (s.id === 'oilcleanse' || s.id === 'watercleanse') return seeds.cleanser || seeds.general || 'korean cleanser';
    // bias by first concern if any
    const c = [...getConcerns()][0];
    if (c && seeds[c]) return seeds[c];
    return seeds.general || 'korean skincare';
  }

  // ── Ingredient encyclopedia + decoder ───────────────────────────────────────
  function renderIngredients() {
    const grid = $('#kb-ing-grid'); if (!grid) return;
    const concerns = getConcerns();
    // sort: matches your concerns first, then stars
    const list = INGREDIENTS.slice().sort((a, b) => {
      const am = a.bestFor && a.bestFor.some(x => concerns.has(x)) ? 1 : 0;
      const bm = b.bestFor && b.bestFor.some(x => concerns.has(x)) ? 1 : 0;
      return (bm - am) || ((b.star ? 1 : 0) - (a.star ? 1 : 0));
    });
    grid.innerHTML = list.map(i => {
      const match = i.bestFor && i.bestFor.some(x => concerns.has(x));
      return `<div class="kb-ing" data-ing="${esc(i.id)}" role="button" tabindex="0" aria-label="${esc(i.name)}">
        ${i.star ? '<span class="i-star" aria-hidden="true">⭐</span>' : ''}
        <div class="i-emoji" aria-hidden="true">${i.emoji || '🧪'}</div>
        <div class="i-name">${esc(i.name)}</div>
        <div class="i-ko">${esc(i.korean || '')}</div>
        ${match ? `<span class="i-tag">✓ ${esc((CONCERN_BY_ID[[...concerns].find(x => i.bestFor.includes(x))] || {}).name || '')}</span>` : ''}
      </div>`;
    }).join('');
    $$('.kb-ing', grid).forEach(c => {
      const open = () => openIngredient(c.dataset.ing);
      c.addEventListener('click', open);
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function openIngredient(id) {
    const i = ING_BY_ID[id]; if (!i) return;
    const bg = $('#kb-modal-bg'), box = $('#kb-modal'); if (!bg || !box) return;
    const conc = (i.bestFor || []).map(c => (CONCERN_BY_ID[c] || {}).name).filter(Boolean).join(' · ');
    const pairs = (i.pairsWith || []).map(p => (ING_BY_ID[p] || {}).name).filter(Boolean).join(', ');
    const avoid = (i.avoidWith || []).map(p => (ING_BY_ID[p] || {}).name).filter(Boolean).join(', ');
    const pregTxt = i.preg === 'caution' ? t('pregCaution') : t('pregSafe');
    box.innerHTML = `<button class="kb-modal-x" data-close aria-label="Close">✕</button>
      <div style="text-align:center"><div class="km-emoji">${i.emoji || '🧪'}</div>
        <div class="km-name">${esc(i.name)}</div><div class="km-ko">${esc(i.korean || '')}</div></div>
      <div class="km-bio">${esc(i.explainer || '')}</div>
      ${(i.benefits && i.benefits.length) ? `<div class="km-list">${i.benefits.map(b => '✔️ ' + esc(b)).join('<br>')}</div>` : ''}
      <div class="km-facts">
        ${conc ? `<span class="km-fact">🎯 ${esc(t('best'))}: ${esc(conc)}</span>` : ''}
        <span class="km-fact">🕒 ${esc(t('time'))}: ${esc(i.time === 'am' ? t('am') : i.time === 'pm' ? t('pm') : t('both'))}</span>
        <span class="km-fact">🤰 ${esc(t('preg'))}: ${esc(pregTxt)}</span>
      </div>
      ${pairs ? `<div class="km-list"><b>💚 ${esc(t('pairs'))}:</b> ${esc(pairs)}</div>` : ''}
      ${avoid ? `<div class="km-list"><b>⚠️ ${esc(t('avoid'))}:</b> ${esc(avoid)}</div>` : ''}
      <div class="km-links"><button class="km-link primary" data-seed="${esc((SHOP.aliSeeds || {}).general || 'korean skincare')} ${esc(i.name)}">🛍️ ${esc(t('shopFor'))} ${esc(i.name)}</button></div>`;
    openModalA11y();
    const shopBtn = box.querySelector('[data-seed]');
    if (shopBtn) shopBtn.addEventListener('click', () => { loadShop(shopBtn.dataset.seed); closeModal(); jumpTo('#kb-shop'); });
  }

  // Ingredient-list decoder (client-side against bundled cosing JSON + heroes)
  let COSING = null;
  const SYNONYMS = { 'aqua':'water', 'water (aqua)':'water', 'vitamin c':'ascorbic acid', 'vitamin b3':'niacinamide', 'niacin':'niacinamide', 'snail mucin':'snail secretion filtrate', 'cica':'centella asiatica extract', 'centella':'centella asiatica extract', 'b5':'panthenol', 'pro-vitamin b5':'panthenol', 'ha':'hyaluronic acid', 'vitamin e':'tocopherol', 'green tea':'camellia sinensis leaf extract', 'pdrn':'polydeoxyribonucleotide' };
  async function loadCosing() {
    if (COSING) return COSING;
    try {
      const base = document.querySelector('base')?.href || '';
      const r = await fetch(base + 'assets/cosing-ingredients.json');
      const j = await r.json();
      COSING = j.ingredients || j || {};
    } catch { COSING = {}; }
    return COSING;
  }
  function normToken(raw) {
    return String(raw || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')      // drop parentheticals
      .replace(/[\d.]+%/g, ' ')          // drop percentages
      .replace(/[*•·\[\]{}"]/g, ' ')
      .replace(/\b(and|extract powder)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function lookupIngredient(map, tok) {
    if (!tok) return null;
    let key = SYNONYMS[tok] || tok;
    if (map[key]) return { key, ...map[key] };
    // substring: token contains a known key or vice-versa (longest match wins)
    let best = null;
    for (const k in map) {
      if (k.length < 4) continue;
      if (key.includes(k) || k.includes(key)) {
        if (!best || k.length > best.length) best = k;
      }
    }
    return best ? { key: best, ...map[best] } : null;
  }
  const FLAG_LABELS = {
    fragrance: { cls:'warn', txt:'Fragrance' }, allergen: { cls:'warn', txt:'Allergen' },
    'alcohol-drying': { cls:'warn', txt:'Drying alcohol' }, 'comedogenic-risk': { cls:'warn', txt:'May clog' },
    'pregnancy-caution': { cls:'warn', txt:'Pregnancy caution' }, 'sun-sensitizing': { cls:'warn', txt:'Use SPF' },
    'sensitive-skin-caution': { cls:'warn', txt:'Sensitive caution' }, 'animal-derived': { cls:'note', txt:'Animal-derived' },
    'vegan-uncertain': { cls:'note', txt:'Not vegan?' }, hero: { cls:'good', txt:'★ Hero' },
  };
  async function runDecoder() {
    const input = $('#kb-decoder-input'), out = $('#kb-decoded'); if (!input || !out) return;
    out.innerHTML = `<div class="kb-loading"><div class="kb-spin"></div>${esc(t('loading'))}</div>`;
    const map = await loadCosing();
    const tokens = input.value.split(/[,\n;]+/).map(normToken).filter(Boolean);
    if (!tokens.length) { out.innerHTML = `<div class="kb-empty">${esc(t('decNone'))}</div>`; return; }
    let found = 0;
    const rows = tokens.slice(0, 60).map(tok => {
      const hit = lookupIngredient(map, tok);
      if (!hit) return `<div class="kb-dec-row miss"><div class="kb-dec-name">${esc(tok)}</div></div>`;
      found++;
      const flags = (hit.flags || []).map(f => { const L = FLAG_LABELS[f]; return L ? `<span class="kb-flag ${L.cls}">${esc(L.txt)}</span>` : ''; }).join('');
      return `<div class="kb-dec-row">
        <div style="min-width:0;flex:1">
          <div class="kb-dec-name">${esc(hit.name || tok)} <span class="kb-dec-fn">${esc(hit.fn || '')}</span></div>
          <div class="kb-dec-desc">${esc(hit.desc || '')}</div>
          ${flags ? `<div class="kb-dec-flags">${flags}</div>` : ''}
        </div></div>`;
    }).join('');
    out.innerHTML = `<div class="kb-sec-sub" style="margin-bottom:4px">${found}/${tokens.length} ${esc(t('decFound'))} · ${esc(t('sources'))}</div>${rows}`;
  }

  // ── What-not-to-mix checker ─────────────────────────────────────────────────
  const picked = new Set();
  function conflictVerdict(a, b) {
    const hit = CONFLICTS.find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
    return hit || { verdict:'safe', reason:'No known conflict — generally fine to use together.' };
  }
  function renderPicker() {
    const bar = $('#kb-pick'); if (!bar) return;
    bar.innerHTML = CHECKABLE.map(id => {
      const ing = ING_BY_ID[id] || { name:id };
      return `<button class="kb-pick-chip${picked.has(id) ? ' on' : ''}" data-pick="${esc(id)}" aria-pressed="${picked.has(id) ? 'true' : 'false'}"><span aria-hidden="true">${esc(ing.emoji || '')}</span> ${esc(ing.name || id)}</button>`;
    }).join('');
    $$('.kb-pick-chip', bar).forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.pick; if (picked.has(id)) picked.delete(id); else picked.add(id);
      b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false'); renderVerdicts();
    }));
  }
  function renderVerdicts() {
    const box = $('#kb-verdicts'); if (!box) return;
    const ids = [...picked];
    if (ids.length < 2) { box.innerHTML = `<div class="kb-empty">${esc(t('selectActives'))}</div>`; return; }
    const out = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const v = conflictVerdict(ids[i], ids[j]);
      if (v.verdict === 'safe' && !CONFLICTS.find(c => (c.a === ids[i] && c.b === ids[j]) || (c.a === ids[j] && c.b === ids[i]))) continue; // skip silent safes
      out.push({ a: ids[i], b: ids[j], ...v });
    }
    const ic = { safe:'✅', caution:'⚠️', avoid:'⛔' };
    if (!out.length) { box.innerHTML = `<div class="kb-verdict safe"><div class="v-ic" aria-hidden="true">🎉</div><div><div class="v-reason">${esc(t('allSafe'))}</div></div></div>`; return; }
    out.sort((p, q) => ({ avoid:0, caution:1, safe:2 })[p.verdict] - ({ avoid:0, caution:1, safe:2 })[q.verdict]);
    box.innerHTML = out.map(v => `<div class="kb-verdict ${v.verdict}">
      <div class="v-ic" aria-hidden="true">${ic[v.verdict]}</div>
      <div><div class="v-pair">${esc((ING_BY_ID[v.a] || {}).name || v.a)} + ${esc((ING_BY_ID[v.b] || {}).name || v.b)}</div>
      <div class="v-reason">${esc(v.reason)}</div></div></div>`).join('');
  }

  // ── Brand directory ─────────────────────────────────────────────────────────
  let brandTier = 'all';
  function renderBrands() {
    const grid = $('#kb-brand-grid'); if (!grid) return;
    const follows = getFollows();
    let list = BRANDS.slice();
    if (brandTier !== 'all') list = list.filter(b => b.tier === brandTier);
    list.sort((a, b) => (follows.has(b.id) - follows.has(a.id)));
    grid.innerHTML = list.map(b => `<div class="kb-brand${follows.has(b.id) ? ' followed' : ''}" data-brand="${esc(b.id)}" role="button" tabindex="0" aria-label="${esc(b.name)}">
      <button class="b-follow" data-follow="${esc(b.id)}" aria-pressed="${follows.has(b.id) ? 'true' : 'false'}" aria-label="${follows.has(b.id) ? 'Unfollow' : 'Follow'} ${esc(b.name)}">${follows.has(b.id) ? '★' : '☆'}</button>
      <div class="b-emoji" aria-hidden="true">${b.emoji || '🏷️'}</div>
      <div class="b-name">${esc(b.name)}</div>
      <div class="b-ko">${esc(b.korean || '')}</div>
      <div class="b-known">${esc(b.knownFor || '')}</div>
      <span class="b-tier">${esc(b.tier)}</span>
    </div>`).join('');
    $$('.b-follow', grid).forEach(b => b.addEventListener('click', (ev) => { ev.stopPropagation(); toggleFollow(b.dataset.follow); }));
    $$('.kb-brand', grid).forEach(c => {
      const open = () => openBrand(c.dataset.brand);
      c.addEventListener('click', (e) => { if (e.target.closest('.b-follow')) return; open(); });
      c.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.b-follow')) { e.preventDefault(); open(); } });
    });
  }
  function toggleFollow(id) {
    const f = getFollows();
    if (f.has(id)) { f.delete(id); toast(t('unfollowToast')); } else { f.add(id); toast(t('followToast')); }
    setFollows(f); renderBrands();
  }
  function openBrand(id) {
    const b = BRANDS.find(x => x.id === id); if (!b) return;
    const bg = $('#kb-modal-bg'), box = $('#kb-modal'); if (!bg || !box) return;
    const tags = [];
    if (b.vegan) tags.push(`🌱 ${t('vegan')}`);
    if (b.men) tags.push(`🧔 ${t('mens')}`);
    box.innerHTML = `<button class="kb-modal-x" data-close aria-label="Close">✕</button>
      <div style="text-align:center"><div class="km-emoji">${b.emoji || '🏷️'}</div>
        <div class="km-name">${esc(b.name)}</div><div class="km-ko">${esc(b.korean || '')}</div></div>
      <div class="km-facts">
        <span class="km-fact">${esc(t('tier'))}: ${esc(b.tier)}</span>
        ${tags.map(x => `<span class="km-fact">${esc(x)}</span>`).join('')}
      </div>
      <div class="km-list"><b>${esc(t('known'))}:</b> ${esc(b.knownFor || '')}</div>
      ${(b.hero && b.hero.length) ? `<div class="km-list"><b>⭐</b> ${esc(b.hero.join(' · '))}</div>` : ''}
      <div class="km-bio" id="kb-brand-bio">${b.wikidataId ? `<span style="opacity:.6">${esc(t('bioSoon'))}</span>` : ''}</div>
      <div class="km-links"><button class="km-link primary" data-seed="${esc(b.name)} korean skincare">🛍️ ${esc(t('shopFor'))} ${esc(b.name)}</button></div>`;
    openModalA11y();
    const shopBtn = box.querySelector('[data-seed]');
    if (shopBtn) shopBtn.addEventListener('click', () => { loadShop(shopBtn.dataset.seed); closeModal(); jumpTo('#kb-shop'); });
    if (b.wikidataId && API && API.getKbeautyBio) {
      API.getKbeautyBio(b.wikidataId, lang).then(d => {
        if (!d || !d.bio) { const el = $('#kb-brand-bio'); if (el) el.innerHTML = ''; return; }
        const el = $('#kb-brand-bio'); if (!el) return;
        el.innerHTML = esc(d.bio) + (d.wikipediaUrl ? ` <a href="${esc(d.wikipediaUrl)}" target="_blank" rel="noopener">↗</a>` : '');
      }).catch(() => { const el = $('#kb-brand-bio'); if (el) el.innerHTML = ''; });
    }
  }

  // ── Glossary ────────────────────────────────────────────────────────────────
  function renderGlossary() {
    const box = $('#kb-gloss'); if (!box) return;
    box.innerHTML = GLOSSARY.map(g => `<details>
      <summary>${esc(g.term)}<span class="g-ko">${esc(g.korean || '')}</span></summary>
      <p>${esc(g.def)}</p>
    </details>`).join('');
  }

  // ── Glass Skin Method (flagship aspirational guide) ─────────────────────────
  let glassTime = 'am';
  function renderGlassSkin() {
    const box = $('#kb-glassskin-box'); const G = window.KBEAUTY_GLASSKIN; if (!box || !G) return;
    const skin = getSkin();
    const stEmoji = (id) => (SKINTYPES.find(s => s.id === id) || {}).emoji || '';
    const stName = (id) => (SKINTYPES.find(s => s.id === id) || {}).name || id;
    const ingChip = (id) => { const i = ING_BY_ID[id]; return i ? `<button class="gs-ing" data-ing="${esc(id)}">${i.emoji || ''} ${esc(i.name)}</button>` : ''; };
    const proto = (glassTime === 'pm' ? G.protocol.pm : G.protocol.am) || [];
    box.innerHTML = `
      <div class="kb-sec-head"><div class="kb-sec-title">${esc(G.emoji)} ${esc(G.hero.title)} <span class="gs-ko">${esc(G.hero.korean || '')}</span></div></div>
      <div class="gs-hero">
        <div class="gs-kicker">${esc(G.hero.kicker)}</div>
        <p class="gs-sub">${esc(G.hero.sub)}</p>
        <p class="gs-disc">${esc(G.hero.disclaimer)}</p>
      </div>
      <div class="gs-principles">${(G.principles || []).map(p => `<div class="gs-card"><div class="gs-card-em" aria-hidden="true">${p.emoji || ''}</div><div class="gs-card-t">${esc(p.title)}</div><div class="gs-card-b">${esc(p.body)}</div></div>`).join('')}</div>
      <div class="gs-block">
        <div class="gs-h">${esc(G.sevenSkin.title)}</div>
        <p class="gs-p">${esc(G.sevenSkin.what)}</p>
        <p class="gs-p">${esc(G.sevenSkin.how)}</p>
        <div class="gs-warn">⚠️ ${esc(G.sevenSkin.tonerType)}</div>
        <div class="gs-layers">${(G.sevenSkin.layersBySkin || []).map(l => `<div class="gs-layer${l.skin === skin ? ' active' : ''}"><div class="gs-layer-h">${stEmoji(l.skin)} ${esc(stName(l.skin))} · <b>${esc(l.layers)}</b>${l.skin === skin ? ' ✓' : ''}</div><div class="gs-layer-n">${esc(l.note)}</div></div>`).join('')}</div>
        <div class="gs-mistakes"><b>🚫 ${esc(t('avoid'))}</b><br>• ${(G.sevenSkin.mistakes || []).map(m => esc(m)).join('<br>• ')}</div>
      </div>
      <div class="gs-block">
        <div class="gs-h">${esc(G.protocol.title)}</div>
        <p class="gs-p">${esc(G.protocol.intro)}</p>
        <div class="kb-tabs" id="gs-proto-tabs" role="tablist" aria-label="Glass skin protocol time">
          <button class="kb-tab${glassTime === 'am' ? ' active' : ''}" role="tab" aria-selected="${glassTime === 'am'}" data-gt="am">☀️ ${esc(t('am'))}</button>
          <button class="kb-tab${glassTime === 'pm' ? ' active' : ''}" role="tab" aria-selected="${glassTime === 'pm'}" data-gt="pm">🌙 ${esc(t('pm'))}</button>
        </div>
        <div class="kb-steps">${proto.map(s => `<div class="kb-step"><div class="kb-step-no">${s.n}</div><div class="kb-step-b"><div class="kb-step-name"><span class="st-emoji">${s.emoji || ''}</span>${esc(s.step)}</div><div class="kb-step-desc">${esc(s.why)}</div>${(s.ing && s.ing.length) ? `<div class="gs-chips">${s.ing.map(ingChip).join('')}</div>` : ''}</div></div>`).join('')}</div>
      </div>
      <div class="gs-block">
        <div class="gs-h">${esc(G.ingredientStack.title)}</div>
        <p class="gs-p">${esc(G.ingredientStack.intro)}</p>
        ${(G.ingredientStack.groups || []).map(grp => `<div class="gs-group"><span class="gs-group-l">${grp.emoji || ''} ${esc(grp.label)}</span><span class="gs-chips">${grp.ings.map(ingChip).join('')}</span></div>`).join('')}
      </div>
      <div class="gs-block">
        <div class="gs-h">${esc(G.timeline.title)}</div>
        <p class="gs-p">${esc(G.timeline.intro)}</p>
        <div class="gs-timeline">${(G.timeline.stages || []).map(st => `<div class="gs-stage"><div class="gs-stage-when">${st.emoji || ''} ${esc(st.when)}</div><div class="gs-stage-h">${esc(st.headline)}</div><div class="gs-stage-b">${esc(st.body)}</div></div>`).join('')}</div>
        <p class="gs-disc">${esc(G.timeline.honestNote)}</p>
      </div>
      <div class="funnel" style="margin-top:18px">
        <div class="kb-sec-title">${esc(G.shelf.title)}</div>
        <div class="kb-sec-sub">${esc(G.shelf.intro)}</div>
        <div class="gs-shelf">${(G.shelf.items || []).map(it => `<button class="kb-step-shop" data-seed="${esc(it.seed)}">${it.emoji || '🛍️'} ${esc(it.label)}</button>`).join('')}</div>
        <div style="margin-top:10px"><a class="kb-shelf-cta" data-seed="${esc(G.shelf.bundleSeed)}">🛒 ${esc(t('shopFor'))}</a></div>
        <div class="funnel-disc">${esc((SHOP && SHOP.disclosure) || '')}</div>
      </div>`;
    $$('#gs-proto-tabs .kb-tab', box).forEach(tab => tab.addEventListener('click', () => { glassTime = tab.dataset.gt; renderGlassSkin(); }));
    $$('.gs-ing', box).forEach(b => b.addEventListener('click', () => openIngredient(b.dataset.ing)));
    $$('.kb-step-shop, .kb-shelf-cta', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }

  // ── Bestsellers & Trend Tracker (viral 'worth it?' board) ───────────────────
  let boardTag = 'all';
  function renderBestsellers() {
    const box = $('#kb-board-box'); const BS = window.KBEAUTY_BESTSELLERS; const CFG = window.KBEAUTY_BOARD_CONFIG;
    if (!box || !BS || !CFG) return;
    const items = (BS.items || []).filter(it => boardTag === 'all' || it.tag === boardTag);
    const pills = (CFG.filters || []).map(f => `<button class="kb-pick-chip${f.id === boardTag ? ' on' : ''}" data-bt="${esc(f.id)}" aria-pressed="${f.id === boardTag}">${f.emoji || ''} ${esc(f.label)}</button>`).join('');
    const legend = Object.keys(CFG.verdicts || {}).map(k => { const v = CFG.verdicts[k]; return `<span class="bs-leg kb-flag ${v.cls}" title="${esc(v.tip)}">${v.emoji} ${esc(v.label)}</span>`; }).join('');
    const cards = items.map(it => {
      const v = (CFG.verdicts || {})[it.verdict] || { emoji: '', label: it.verdict, cls: 'note', tip: '' };
      const chips = (it.ingredient || []).map(id => { const i = ING_BY_ID[id]; return i ? `<button class="gs-ing" data-ing="${esc(id)}">${i.emoji || ''} ${esc(i.name)}</button>` : ''; }).join('');
      return `<div class="bs-card">
        <div class="bs-top"><span class="bs-rank">#${it.rank}</span><span class="bs-em" aria-hidden="true">${it.emoji || '✨'}</span><div class="bs-tt"><div class="bs-brand">${esc(it.brand)}</div><div class="bs-name">${esc(it.name)}</div></div></div>
        <div class="bs-badges"><span class="kb-flag ${v.cls}" title="${esc(v.tip)}">${v.emoji} ${esc(v.label)}</span></div>
        <div class="bs-what">${esc(it.whatItIs)}</div>
        <div class="bs-line bs-viral">🔥 <b>Viral for:</b> ${esc(it.viralFor)}</div>
        <div class="bs-line bs-evidence">🔬 <b>The honest read:</b> ${esc(it.evidence)}</div>
        <div class="bs-line bs-worth">💬 <b>Worth it?</b> ${esc(it.worthIt)}</div>
        <div class="bs-foot">${chips}<button class="kb-step-shop bs-shop" data-seed="${esc(it.aliSeed || '')}">🛍️ ${esc(t('shopFor'))}</button></div>
      </div>`;
    }).join('');
    box.innerHTML = `
      <div class="kb-pick" id="kb-board-pills">${pills}</div>
      <div class="bs-legend">${legend}</div>
      <div class="bs-grid">${cards}</div>
      <div style="margin-top:12px"><a class="kb-shelf-cta" data-seed="${esc(CFG.shopAllSeed || 'korean skincare bestseller')}">🛒 ${esc(t('shopFor'))}</a></div>
      <div class="funnel-disc">${esc(CFG.disclosure || '')}</div>`;
    $$('#kb-board-pills .kb-pick-chip', box).forEach(b => b.addEventListener('click', () => {
      boardTag = b.dataset.bt; renderBestsellers();
    }));
    $$('.gs-ing', box).forEach(b => b.addEventListener('click', () => openIngredient(b.dataset.ing)));
    $$('.bs-shop, .kb-shelf-cta', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }

  // ── Skin Troubleshooter (purge vs breakout · barrier · fungal-acne) ─────────
  const tbPurgeAns = {};
  function tbIngChips(ids) { return (ids || []).map(id => { const i = ING_BY_ID[id]; return i ? `<button class="gs-ing" data-ing="${esc(id)}">${i.emoji || ''} ${esc(i.name)}</button>` : ''; }).join(''); }
  function renderTroubleshooter() {
    const box = $('#kb-trouble-box'); const META = window.KBEAUTY_TROUBLESHOOTER_META, P = window.KBEAUTY_PURGE, B = window.KBEAUTY_BARRIER, F = window.KBEAUTY_FUNGAL;
    if (!box || !META) return;
    box.innerHTML = `
      <p class="gs-p">${esc(META.intro)}</p>
      <div class="gs-block" id="tb-purge"><div class="gs-h">🔄 ${esc(P.title)}</div><p class="gs-p">${esc(P.subtitle)}</p>
        <div class="tb-primer">${esc(P.primer)}</div>
        <div id="tb-purge-q">${P.questions.map((q, qi) => `<div class="kb-q"><div class="kb-q-text">${qi + 1}. ${esc(q.q)}</div><div class="kb-opts">${q.options.map((o, oi) => `<button class="kb-opt" data-pq="${qi}" data-po="${oi}">${esc(o.label)}</button>`).join('')}</div></div>`).join('')}</div>
        <button class="kb-quiz-cta" id="tb-purge-go" disabled>${esc(seeResultLabel())}</button>
        <div id="tb-purge-out" aria-live="polite"></div>
      </div>
      <div class="gs-block" id="tb-barrier"><div class="gs-h">🧱 ${esc(B.title)}</div><p class="gs-p">${esc(B.subtitle)}</p>
        <div class="tb-primer">${esc(B.primer)}</div>
        <div id="tb-barrier-syms" class="tb-checks">${B.symptoms.map(s => `<label class="tb-check"><input type="checkbox" data-w="${s.weight}"> <span>${esc(s.label)}</span></label>`).join('')}</div>
        <div id="tb-barrier-out" aria-live="polite"></div>
      </div>
      <div class="gs-block" id="tb-fungal"><div class="gs-h">🍄 ${esc(F.title)}</div><p class="gs-p">${esc(F.subtitle)}</p>
        <div class="tb-primer">${esc(F.primer)}</div>
        <div class="tb-tells"><b>Tell-tale signs:</b><br>• ${(F.tellTale || []).map(esc).join('<br>• ')}</div>
        <textarea id="tb-fungal-input" class="kb-tool" style="margin-top:10px" placeholder="Paste an ingredient list to screen for common malassezia-feeding ingredients…"></textarea>
        <button class="kb-tool-btn" id="tb-fungal-go">🍄 Screen ingredients</button>
        <div id="tb-fungal-out" aria-live="polite"></div>
        <p class="gs-p" style="margin-top:9px">💡 ${esc(F.safeHelpers)}</p>
      </div>
      <div class="funnel-disc">${esc(META.disclaimer)}</div>`;
    // Purge quiz
    $$('#tb-purge-q .kb-opt', box).forEach(b => b.addEventListener('click', () => {
      const qi = +b.dataset.pq; $$(`#tb-purge-q .kb-opt[data-pq="${qi}"]`, box).forEach(x => x.classList.remove('sel'));
      b.classList.add('sel'); tbPurgeAns[qi] = +b.dataset.po;
      const go = $('#tb-purge-go'); if (go) go.disabled = Object.keys(tbPurgeAns).length < P.questions.length;
    }));
    const pgo = $('#tb-purge-go');
    if (pgo) pgo.addEventListener('click', () => {
      const sc = { purge: 0, react: 0, barrier: 0, fungal: 0 };
      P.questions.forEach((q, qi) => { const o = q.options[tbPurgeAns[qi]]; if (o && o.score) for (const k in o.score) sc[k] = (sc[k] || 0) + o.score[k]; });
      const out = $('#tb-purge-out'); if (!out) return;
      if (sc.fungal >= 3) { out.innerHTML = `<div class="tb-out"><div class="tb-out-h">🍄 This could be fungal acne</div><div class="gs-card-b">Tiny, uniform, itchy bumps point to malassezia rather than purging or a normal reaction — run the Fungal-Acne screen below.</div></div>`; jumpTo('#tb-fungal'); return; }
      const key = (sc.barrier >= 2 && sc.barrier > sc.purge) ? 'react' : (sc.purge >= sc.react ? 'purge' : 'react');
      const o = P.outcomes[key]; if (!o) return;
      out.innerHTML = `<div class="tb-out tb-${key}"><div class="tb-out-h">${o.emoji} ${esc(o.verdict)}</div><div class="tb-out-head">${esc(o.headline)}</div><div class="gs-card-b">${esc(o.body)}</div>
        <div class="tb-dodont"><div><b>✅ Do</b><br>${(o.do || []).map(x => '• ' + esc(x)).join('<br>')}</div><div><b>🚫 Don't</b><br>${(o.dont || []).map(x => '• ' + esc(x)).join('<br>')}</div></div>
        <div class="gs-chips">${tbIngChips(o.ingredientIds)}</div>
        <div class="tb-reassess">↻ ${esc(o.reassess || '')}</div>
        <button class="kb-step-shop tb-shop" data-seed="${esc((SHOP.aliSeeds || {})[o.shopSeed] || 'korean barrier repair')}">🛍️ ${esc(t('shopFor'))}</button></div>`;
      $$('.gs-ing', out).forEach(b => b.addEventListener('click', () => openIngredient(b.dataset.ing)));
      $$('.tb-shop', out).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
    });
    // Barrier checklist
    const recompute = () => {
      let sum = 0; $$('#tb-barrier-syms input:checked', box).forEach(c => sum += +c.dataset.w);
      const lv = (B.levels || []).find(l => sum >= l.min && sum <= l.max) || B.levels[0];
      const out = $('#tb-barrier-out'); if (!out || !lv) return;
      const brands = (B.rescueBrands || []).map(rb => { const br = BRANDS.find(x => x.id === rb.id) || {}; return `<span class="kb-faked" style="background:var(--kb-soft);border-color:var(--border)" title="${esc(rb.note)}">${br.emoji || '🏷️'} ${esc(br.name || rb.id)}</span>`; }).join('');
      out.innerHTML = `<div class="tb-out tb-lvl-${lv.id}"><div class="tb-out-h">${lv.emoji} ${esc(lv.verdict)}</div><div class="tb-out-head">${esc(lv.headline)}</div><div class="gs-card-b">${esc(lv.body)}</div>
        <div class="tb-protocol">${(lv.protocol || []).map(s => `<div class="tb-step"><b>${s.step}. ${esc(s.title)}</b> — ${esc(s.detail)}${s.ingredientIds && s.ingredientIds.length ? `<div class="gs-chips">${tbIngChips(s.ingredientIds)}</div>` : ''}</div>`).join('')}</div>
        ${lv.reintroduce ? `<div class="tb-reassess">↻ ${esc(lv.reintroduce)}</div>` : ''}
        <div class="tb-rescue"><b>🛟 Gentle barrier rescuers:</b> ${brands}</div>
        <button class="kb-step-shop tb-shop" data-seed="${esc((SHOP.aliSeeds || {})[lv.shopSeed] || 'korean barrier repair')}">🛍️ ${esc(t('shopFor'))}</button></div>`;
      $$('.gs-ing', out).forEach(b => b.addEventListener('click', () => openIngredient(b.dataset.ing)));
      $$('.tb-shop', out).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
    };
    $$('#tb-barrier-syms input', box).forEach(c => c.addEventListener('change', recompute));
    // Fungal screener
    const fgo = $('#tb-fungal-go');
    if (fgo) fgo.addEventListener('click', () => {
      const inp = $('#tb-fungal-input'), out = $('#tb-fungal-out'); if (!inp || !out) return;
      const tokens = inp.value.split(/[,\n;]+/).map(normToken).filter(Boolean);
      if (!tokens.length) { out.innerHTML = `<div class="kb-empty">Paste an ingredient list above.</div>`; return; }
      const flagged = [];
      const inciMap = {}; for (const fam in (F.flagInci || {})) for (const x of F.flagInci[fam]) inciMap[x] = fam;
      const pats = (F.flagPatterns || []).map(p => ({ family: p.family, re: new RegExp(p.regex, 'i') }));
      tokens.forEach(tok => {
        let fam = inciMap[tok];
        if (!fam) { const hit = pats.find(p => p.re.test(tok)); if (hit) fam = hit.family; }
        if (fam) flagged.push({ tok, fam });
      });
      if (!flagged.length) { out.innerHTML = `<div class="tb-out tb-purge"><div class="gs-card-b">✅ ${esc(F.decoderEmptyAllSafe)}</div></div>`; return; }
      out.innerHTML = `<div class="tb-out tb-react"><div class="tb-out-h">🍄 ${flagged.length} possible feeder${flagged.length > 1 ? 's' : ''} flagged</div>${flagged.map(f => `<div class="tb-flag-row"><b>${esc(f.tok)}</b> <span class="kb-flag warn">${esc(f.fam)}</span><div class="gs-card-b">${esc((F.explainerByFamily || {})[f.fam] || '')}</div></div>`).join('')}<div class="tb-reassess">${esc(F.safeNote)} — ${esc(F.decoderModeHint)}</div></div>`;
    });
  }

  // ── Korean Sunscreen Decoder & Picker ───────────────────────────────────────
  function renderSunscreen() {
    const box = $('#kb-sun-box'); const S = window.KBEAUTY_SUNCARE; if (!box || !S) return;
    const skin = getSkin();
    const recFilter = (S.filterTypes || []).find(f => (f.bestFor || []).includes(skin));
    const recId = recFilter ? recFilter.id : 'chemical';
    const seedFor = (p) => `${p.brand} ${p.name} korean sunscreen`.replace(/\([^)]*\)/g, '').trim();
    const methodSeed = { stick: 'korean sun stick spf50 reapply', cushion: 'korean sun cushion spf50 makeup', 'spray-powder': 'korean sunscreen spray spf50' };
    box.innerHTML = `
      <p class="gs-p">${esc(S.intro)}</p>
      <div class="gs-block"><div class="gs-h">🏷️ Read the label</div>
        <div class="sun-decode">${(S.decodeTable || []).map(d => `<div class="sun-dt"><div class="sun-dt-code">${d.emoji || ''} ${esc(d.code)}</div><div class="sun-dt-label">${esc(d.label)} · <span>${esc(d.measures)}</span></div><div class="sun-dt-plain">${esc(d.plain)}</div><div class="sun-dt-look">✅ ${esc(d.lookFor)}</div></div>`).join('')}</div>
      </div>
      <div class="gs-block"><div class="gs-h">🧴 Chemical, mineral or hybrid?${skin ? ` <span class="sun-rec">recommended for ${esc((SKINTYPES.find(s => s.id === skin) || {}).name || skin)}: ${esc(recId)}</span>` : ''}</div>
        <div class="sun-filters">${(S.filterTypes || []).map(f => `<div class="sun-filter${f.id === recId ? ' rec' : ''}"><div class="sun-f-h">${f.emoji || ''} ${esc(f.name)} <span class="gs-ko">${esc(f.korean || '')}</span>${f.id === recId ? ' ✓' : ''}</div><div class="sun-f-how">${esc(f.how)}</div><div class="sun-f-pc"><div class="sun-pros">${(f.pros || []).map(p => '✔️ ' + esc(p)).join('<br>')}</div><div class="sun-cons">${(f.cons || []).map(c => '• ' + esc(c)).join('<br>')}</div></div><div class="sun-f-note">💡 ${esc(f.skinNote)}</div></div>`).join('')}</div>
      </div>
      <div class="gs-block"><div class="gs-h">⭐ Hero Korean sunscreens</div>
        <div class="sun-picks">${(S.picks || []).map(p => `<div class="sun-pick${(p.forSkin || []).includes(skin) ? ' match' : ''}">
          <div class="sun-p-h"><span aria-hidden="true">${p.emoji || '☀️'}</span> <b>${esc(p.brand)}</b></div>
          <div class="sun-p-name">${esc(p.name)}</div>
          <div class="sun-p-badges"><span class="kb-flag note">${esc(p.spf)} ${esc(p.pa)}</span><span class="kb-flag ${p.filter === 'mineral' ? 'warn' : 'good'}">${esc(p.filter)}</span>${p.noWhiteCast ? '<span class="kb-flag good">no cast</span>' : ''}${(p.forSkin || []).includes(skin) ? '<span class="kb-flag note">✓ your skin</span>' : ''}</div>
          <div class="sun-p-blurb">${esc(p.blurb)}</div>
          <button class="kb-step-shop sun-shop" data-seed="${esc(seedFor(p))}">🛍️ ${esc(t('shopFor'))}</button>
        </div>`).join('')}</div>
      </div>
      <div class="gs-block"><div class="gs-h">✌️ ${esc(S.reapply.headline)}</div>
        <div class="gs-principles">${(S.reapply.rules || []).map(r => `<div class="gs-card"><div class="gs-card-em">${r.emoji || ''}</div><div class="gs-card-t">${esc(r.title)}</div><div class="gs-card-b">${esc(r.text)}</div></div>`).join('')}</div>
        <div class="sun-methods">${(S.reapply.methods || []).map(m => `<div class="sun-method"><div class="sun-m-h">${m.emoji || ''} ${esc(m.name)} <span class="gs-ko">${esc(m.korean || '')}</span></div><div class="sun-m-t">${esc(m.text)}</div>${methodSeed[m.id] ? `<button class="kb-step-shop sun-shop" data-seed="${esc(methodSeed[m.id])}">🛍️ ${esc(t('shopFor'))}</button>` : ''}</div>`).join('')}</div>
        <p class="gs-p" style="margin-top:8px">⏱️ ${esc(S.reapply.cadence)}</p>
      </div>
      <div class="gs-block"><div class="gs-h">🌏 ${esc(S.koreanVsWestern.headline)}</div>
        <div class="gs-principles">${(S.koreanVsWestern.points || []).map(p => `<div class="gs-card"><div class="gs-card-em">${p.emoji || ''}</div><div class="gs-card-t">${esc(p.title)}</div><div class="gs-card-b">${esc(p.text)}</div></div>`).join('')}</div>
      </div>
      <div class="gs-block"><div class="gs-h">❓ Sunscreen myths</div>
        <div class="kb-gloss">${(S.myth || []).map(m => `<details><summary>${esc(m.q)}</summary><p>${esc(m.a)}</p></details>`).join('')}</div>
      </div>`;
    $$('.sun-shop', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }

  // ── Where-to-Buy & Authenticity Hub ─────────────────────────────────────────
  let buyRegion = null;
  const BUY_EMOJI = { 'shopping-cart':'🛒', ribbon:'🎀', olive:'🫒', blossom:'🌸', 'kr-flag':'🇰🇷', tag:'🏷️', keycap:'🔢', money:'💰', printer:'🖨️', droplet:'💧', picture:'🖼️', star:'⭐', 'test-tube':'🧪' };
  const BUY_HOME = { yesstyle:'https://www.yesstyle.com', oliveyoung:'https://global.oliveyoung.com', stylevana:'https://www.stylevana.com', stylekorean:'https://www.stylekorean.com' };
  const AUTH_BADGE = { 'first-party':{ t:'First-party', c:'good' }, 'authorized':{ t:'Authorized', c:'note' }, 'verified-store':{ t:'Official store', c:'note' } };
  const emo = (x) => BUY_EMOJI[x] || x;
  function detectBuyRegion() {
    const BUY = window.KBEAUTY_BUY; if (!BUY) return;
    fetch('https://koreaplus-lifes.com/cdn-cgi/trace', { cache: 'no-store' })
      .then(r => r.text()).then(tx => {
        const m = tx.match(/loc=([A-Z]{2})/); const cc = m ? m[1] : '';
        const reg = BUY.regions.find(rg => rg.members.includes(cc));
        buyRegion = reg ? reg.id : BUY.defaultRegion; renderBuy();
      }).catch(() => { if (!buyRegion) { buyRegion = BUY.defaultRegion; renderBuy(); } });
  }
  function renderBuy() {
    const box = $('#kb-buy-box'); const BUY = window.KBEAUTY_BUY; if (!box || !BUY) return;
    const rg = buyRegion || BUY.defaultRegion;
    const regSel = `<label class="kb-buy-region">🌍 <select id="kb-buy-region-sel" aria-label="Your region">${BUY.regions.map(r => `<option value="${r.id}"${r.id === rg ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>`;
    const cards = (BUY.retailers || []).map(r => {
      const rd = r.regions[rg] || r.regions[BUY.defaultRegion] || {};
      const ab = AUTH_BADGE[r.authenticity] || { t: r.authenticity, c: 'note' };
      const affUrl = (BUY.affiliates && BUY.affiliates[r.affiliateUrlKey]) || '';
      const href = affUrl || BUY_HOME[r.id] || '';
      const isAli = r.id === 'aliexpress' ? '1' : '0';
      return `<div class="kb-buy-card">
        <div class="kb-buy-h"><span class="kb-buy-em" aria-hidden="true">${emo(r.emoji)}</span><span class="kb-buy-name">${esc(r.name)}</span><span class="kb-flag ${ab.c === 'good' ? 'good' : 'note'}">${esc(ab.t)}</span></div>
        <div class="kb-buy-note">${esc(r.authNote)}</div>
        <div class="kb-buy-rows">
          <div><span aria-hidden="true">🚚</span> ${esc(rd.speed || '')}</div>
          <div><span aria-hidden="true">💵</span> ${esc(rd.cost || '')} · ${esc(rd.free || '')}</div>
          <div><span aria-hidden="true">🛃</span> ${esc(rd.customs || '')}</div>
        </div>
        <div class="kb-buy-best">⭐ ${esc(r.bestFor || '')}</div>
        <button class="kb-step-shop kb-buy-cta" data-ali="${isAli}" data-href="${esc(href)}">${emo(r.emoji)} ${esc(t('shopFor'))}</button>
      </div>`;
    }).join('');
    const checklist = (BUY.authChecklist || []).map(c => `<details class="gs-mistakes" style="margin:0"><summary style="font-weight:800;cursor:pointer;font-size:12.5px;color:var(--text)">${emo(c.emoji)} ${esc(c.title)}</summary><div style="margin-top:6px;color:var(--text2)">${esc(c.desc)}</div></details>`).join('');
    const faked = (BUY.officialStores || []).filter(s => s.faked).map(s => { const b = BRANDS.find(x => x.id === s.brandId) || {}; return `<span class="kb-faked" title="${esc(s.note)}">${b.emoji || '🏷️'} ${esc(s.name)}</span>`; }).join('');
    box.innerHTML = `
      <div class="kb-buy-bar">${regSel}<span class="kb-buy-hint">📍 ${esc((BUY.regions.find(r => r.id === rg) || {}).name || '')} — shipping & customs shown below</span></div>
      <div class="kb-buy-grid2">${cards}</div>
      <div class="gs-block" style="margin-top:14px">
        <div class="gs-h">🔍 Spot a fake — buy with confidence</div>
        <div class="kb-buy-checks">${checklist}</div>
      </div>
      <div class="gs-block">
        <div class="gs-h">⚠️ Most-counterfeited — buy official only</div>
        <p class="gs-p">These are the most-faked K-beauty products. Buy them from the brand's official store or a first-party/authorized seller above.</p>
        <div class="kb-faked-list">${faked}</div>
      </div>
      <div class="funnel-disc">${esc(BUY.disclosure || '')}</div>`;
    const sel = $('#kb-buy-region-sel'); if (sel) sel.addEventListener('change', () => { buyRegion = sel.value; renderBuy(); });
    $$('.kb-buy-cta', box).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.ali === '1') { loadShop('korean skincare'); jumpTo('#kb-shop'); }
      else if (b.dataset.href) window.open(b.dataset.href, '_blank', 'noopener');
    }));
  }

  // ── Korean Dupe Finder ──────────────────────────────────────────────────────
  let dupeCat = 'all';
  function renderDupes() {
    const box = $('#kb-dupes-grid'); const META = window.KBEAUTY_DUPES_META; const DUPES = window.KBEAUTY_DUPES || [];
    if (!box || !META) return;
    const cats = $('#kb-dupes-cats');
    if (cats && !cats.dataset.done) {
      cats.innerHTML = (META.categories || []).map(c => `<button class="kb-pick-chip${c.id === dupeCat ? ' on' : ''}" data-cat="${esc(c.id)}" aria-pressed="${c.id === dupeCat}">${c.emoji || ''} ${esc(c.name)}</button>`).join('');
      cats.dataset.done = '1';
      $$('.kb-pick-chip', cats).forEach(b => b.addEventListener('click', () => {
        dupeCat = b.dataset.cat;
        $$('.kb-pick-chip', cats).forEach(x => { const on = x.dataset.cat === dupeCat; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
        renderDupes();
      }));
    }
    const list = DUPES.filter(d => dupeCat === 'all' || d.category === dupeCat);
    const matchTxt = { high: '✓✓ Strong match', medium: '✓ Good match', low: '~ Loose match' };
    box.innerHTML = list.map(d => {
      const chips = (d.heroIngredientIds || []).map(id => { const i = ING_BY_ID[id]; return i ? `<button class="gs-ing" data-ing="${esc(id)}">${i.emoji || ''} ${esc(i.name)}</button>` : ''; }).join('');
      return `<div class="kb-dupe">
        <div class="dupe-row">
          <div class="dupe-side"><div class="dupe-em" aria-hidden="true">${d.referenceEmoji || '🌐'}</div><div class="dupe-info"><div class="dupe-name">${esc(d.reference)}</div><div class="dupe-role">${esc(d.referenceRole || '')}</div><div class="dupe-band">${esc(d.referenceBand || '')}</div></div></div>
          <div class="dupe-arrow"><span aria-hidden="true">→</span>${d.save ? `<span class="dupe-save">${esc(d.save)}</span>` : ''}</div>
          <div class="dupe-side alt"><div class="dupe-em" aria-hidden="true">${d.altEmoji || '🇰🇷'}</div><div class="dupe-info"><div class="dupe-name">${esc(d.altName)}</div><div class="dupe-band band-alt">${esc(d.altBand || '')}</div></div></div>
        </div>
        <div class="dupe-why"><b>≈ ${esc(d.sharedHero || '')}</b> — ${esc(d.whyComparable || '')}</div>
        <div class="dupe-foot">
          <span class="dupe-match m-${esc(d.matchStrength || 'medium')}">${esc(matchTxt[d.matchStrength] || matchTxt.medium)}</span>
          ${chips}
          <button class="kb-step-shop dupe-shop" data-seed="${esc(d.aliSeed || '')}">🛍️ ${esc(t('shopFor'))}</button>
        </div>
      </div>`;
    }).join('');
    $$('.gs-ing', box).forEach(b => b.addEventListener('click', () => openIngredient(b.dataset.ing)));
    $$('.dupe-shop', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
    const disc = $('#kb-dupes-disc'); if (disc) disc.textContent = META.disclaimer || '';
  }

  // ── Shop (live AliExpress grid; degrades to retailers) ──────────────────────
  let lastSeed = '';
  function renderRetailers() {
    const box = $('#kb-retailers'); if (!box) return;
    box.innerHTML = (SHOP.retailers || []).map(r => {
      const href = r.url ? ` href="${esc(r.url)}" target="_blank" rel="sponsored noopener"` : '';
      const tag = r.url ? 'a' : 'div';
      return `<${tag} class="kb-retailer"${href}>
        <div class="rt-name">${esc(r.emoji || '')} ${esc(r.name)}</div>
        <div class="rt-note">${esc(r.note || '')}</div>
        ${r.url ? `<span class="rt-cta">${esc(r.cta || 'Shop')} →</span>` : ''}
      </${tag}>`;
    }).join('');
  }
  async function loadShop(seed) {
    const grid = $('#kb-shop-grid'); if (!grid) return;
    seed = seed || (SHOP.aliSeeds || {}).general || 'korean skincare';
    if (seed === lastSeed && grid.dataset.loaded === '1') return;
    lastSeed = seed;
    grid.innerHTML = `<div class="kb-loading" style="grid-column:1/-1"><div class="kb-spin"></div>${esc(t('loading'))}</div>`;
    if (!API || !API.getKbeautyProducts) { grid.innerHTML = `<div class="kb-empty" style="grid-column:1/-1">${esc(t('shopEmpty'))}</div>`; return; }
    try {
      const items = await API.getKbeautyProducts(seed, lang);
      if (!Array.isArray(items) || !items.length) throw new Error('empty');
      grid.dataset.loaded = '1';
      grid.innerHTML = items.slice(0, 12).map(p => `<a class="kb-prod" href="${esc(p.url || '#')}" target="_blank" rel="sponsored noopener">
        ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div class="p-body"><div class="p-title">${esc(p.title || '')}</div>
        ${p.price ? `<div class="p-price">${esc(t('priceFrom'))} ${esc(p.price)}</div>` : ''}</div>
      </a>`).join('');
    } catch {
      grid.innerHTML = `<div class="kb-empty" style="grid-column:1/-1">${esc(t('shopEmpty'))}</div>`;
    }
  }

  // ── Build-your-shelf funnel ─────────────────────────────────────────────────
  function renderShelf() {
    const box = $('#kb-shelf-list'); if (!box) return;
    const skin = getSkin(); const concerns = [...getConcerns()];
    if (!skin && !concerns.length) { box.innerHTML = `<div class="kb-shelf-item">${esc(t('shelfEmpty'))}</div>`; return; }
    const essentials = ROUTINE.filter(s => !s.optional).sort((a, b) => a.step - b.step);
    const items = essentials.map(s => `<div class="kb-shelf-item">${s.emoji || '•'} ${esc(s.name)}</div>`);
    box.innerHTML = items.join('');
    // seed the shop CTA by primary concern
    const cta = $('#kb-shelf-cta');
    if (cta) cta.addEventListener('click', () => { const c = concerns[0]; loadShop((SHOP.aliSeeds || {})[c] || (SHOP.aliSeeds || {}).general); }, { once:true });
  }

  // ── Share fab ───────────────────────────────────────────────────────────────
  function showShareFab() {
    const fab = $('#kb-share-fab'); if (!fab) return;
    if (getSkin() || getConcerns().size) fab.hidden = false;
  }

  // ── Modal / filters / personalization ───────────────────────────────────────
  let _modalOpener = null;
  function openModalA11y() {
    const bg = $('#kb-modal-bg'), box = $('#kb-modal'); if (!bg || !box) return;
    _modalOpener = document.activeElement;
    const h = box.querySelector('.km-name'); if (h) { h.id = 'kb-modal-title'; bg.setAttribute('aria-labelledby', 'kb-modal-title'); }
    box.setAttribute('tabindex', '-1');
    bg.classList.add('open');
    document.body.style.overflow = 'hidden';
    try { box.focus(); } catch {}
  }
  function closeModal() {
    const bg = $('#kb-modal-bg'); if (bg) bg.classList.remove('open');
    document.body.style.overflow = '';
    if (_modalOpener && _modalOpener.focus) { try { _modalOpener.focus(); } catch {} _modalOpener = null; }
  }
  function jumpTo(sel) { try { document.querySelector(sel).scrollIntoView({ behavior:'smooth', block:'start' }); } catch {} }
  function refreshPersonalized() { renderIngredients(); renderRoutine(); renderShelf(); }

  function renderTicker() {
    const wrap = $('#kb-ticker-wrap'), rail = $('#kb-ticker'); if (!rail) return;
    const items = TRENDS.map(tr => ({ kind: tr.emoji || '✨', text: tr.title, val: '' }));
    if (!items.length) return;
    const html = items.map(it => `<span class="tk-item"><span class="tk-kind">${it.kind}</span>${esc(it.text)}</span>`).join('');
    rail.innerHTML = html + html;
    if (wrap) wrap.hidden = false;
  }

  function wireFilters() {
    const bar = $('#kb-filters'); if (!bar) return;
    const map = { 'kb-quiz':['kb-quiz','kb-concerns','kb-forecast'], 'kb-routine':['kb-routine'], 'kb-glassskin':['kb-glassskin'], 'kb-sun':['kb-sun'], 'kb-ingredients':['kb-ingredients','kb-conflicts'], 'kb-trouble':['kb-trouble'], 'kb-brands':['kb-brands','kb-glossary'], 'kb-dupes':['kb-dupes'], 'kb-buy':['kb-buy'], 'kb-board':['kb-board'], 'kb-shop':['kb-shop','kb-shelf'] };
    $$('.filter-chip', bar).forEach(chip => chip.addEventListener('click', () => {
      $$('.filter-chip', bar).forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true');
      const tg = chip.dataset.target;
      const show = tg === 'all' ? null : (map[tg] || [tg]);
      $$('.kb-sec').forEach(sec => { sec.style.display = (!show || show.includes(sec.id)) ? '' : 'none'; });
      const shelf = $('#kb-shelf'); if (shelf) shelf.style.display = (!show || show.includes('kb-shop')) ? '' : 'none';
    }));
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  async function boot() {
    await loadContent();   // per-language content overlay (English fallback)
    localizeData();
    renderForecast();
    renderQuiz();
    renderConcerns();
    renderRoutine();
    renderGlassSkin();
    renderSunscreen();
    renderIngredients();
    renderPicker(); renderVerdicts();
    renderTroubleshooter();
    renderBrands();
    renderGlossary();
    renderDupes();
    renderBuy(); detectBuyRegion();
    renderBestsellers();
    renderRetailers();
    renderShelf();
    renderTicker();
    wireFilters();
    showShareFab();

    // routine tabs
    $$('#kb-routine-tabs .kb-tab').forEach(tab => tab.addEventListener('click', () => {
      $$('#kb-routine-tabs .kb-tab').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); routineTime = tab.dataset.time; renderRoutine();
    }));
    // brand tier tabs
    $$('#kb-brand-tabs .kb-tab').forEach(tab => tab.addEventListener('click', () => {
      $$('#kb-brand-tabs .kb-tab').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); brandTier = tab.dataset.tier; renderBrands();
    }));
    // decoder
    const decBtn = $('#kb-decoder-btn'); if (decBtn) decBtn.addEventListener('click', runDecoder);
    // share
    const fab = $('#kb-share-fab');
    if (fab) fab.addEventListener('click', () => {
      if (!window.KbeautyShareCard) return;
      const st = SKINTYPES.find(s => s.id === getSkin()) || {};
      const concerns = [...getConcerns()].map(c => (CONCERN_BY_ID[c] || {}).name).filter(Boolean);
      window.KbeautyShareCard.generate({ skinType: st.name || '', skinEmoji: st.emoji || '💄', concerns, steps: ROUTINE.filter(s => !s.optional).length });
    });
    // modal close
    const bg = $('#kb-modal-bg');
    if (bg) {
      bg.addEventListener('click', (e) => { if (e.target === bg || e.target.hasAttribute('data-close')) closeModal(); });
      document.addEventListener('keydown', (e) => {
        if (!bg.classList.contains('open')) return;
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key === 'Tab') {
          const f = $$('button, a[href], textarea, [tabindex]:not([tabindex="-1"])', $('#kb-modal')).filter(el => !el.disabled && el.offsetParent !== null);
          if (!f.length) return;
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }
    // lazy-load the shop grid when it scrolls into view (saves a worker call on load)
    const shopSec = $('#kb-shop');
    if (shopSec && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((ents) => { ents.forEach(e => { if (e.isIntersecting) { loadShop(stepSeed({ id:'' })); io.disconnect(); } }); }, { rootMargin:'200px' });
      io.observe(shopSec);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
