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
  // Bump OVERLAY_VER whenever the per-language content overlays change, so the
  // clean /kbeauty URL (not service-worker controlled) fetches fresh translations
  // instead of a stale HTTP-cached copy. 'default' revalidates rather than the
  // overly-aggressive 'force-cache'.
  const OVERLAY_VER = '9';
  async function loadContent() {
    if (lang === 'en') return;
    try {
      const base = document.querySelector('base')?.href || '';
      const r = await fetch(base + 'assets/kbeauty-content.' + lang + '.json?v=' + OVERLAY_VER, { cache: 'default' });
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
    TRENDS      = TRENDS.map(t2 => ({ ...t2, title: cx(`trend.${t2.id}.title`, t2.title), blurb: cx(`trend.${t2.id}.blurb`, t2.blurb), science: cx(`trend.${t2.id}.science`, t2.science) }));
    BRANDS      = BRANDS.map(b => ({ ...b, knownFor: cx(`brand.${b.id}.knownFor`, b.knownFor) }));
    QUIZ        = QUIZ.map(q => ({ ...q, q: cx(`quiz.${q.id}.q`, q.q), options: q.options.map((o, n) => ({ ...o, label: cx(`quiz.${q.id}.opt.${n}`, o.label) })) }));
    CONFLICTS   = CONFLICTS.map((c, i) => ({ ...c, reason: cx(`conflict.${i}.reason`, c.reason) }));
    if (MENS) MENS = { ...MENS, title: cx('mens.title', MENS.title), desc: cx('mens.desc', MENS.desc), steps: (MENS.steps || []).map((s, n) => ({ ...s, name: cx(`mens.step.${n}.name`, s.name), note: cx(`mens.step.${n}.note`, s.note) })) };
    FORECAST    = Object.fromEntries(Object.entries(FORECAST).map(([k, f]) => [k, { ...f, headline: cx(`forecast.${k}.headline`, f.headline), tips: (f.tips || []).map((tp, n) => cx(`forecast.${k}.tip.${n}`, tp)) }]));
    if (SHOP && SHOP.retailers) SHOP = { ...SHOP, disclosure: cx('shop.disclosure', SHOP.disclosure), retailers: SHOP.retailers.map(r => ({ ...r, note: cx(`shop.retailer.${r.id}.note`, r.note), cta: cx(`shop.retailer.${r.id}.cta`, r.cta) })) };
    ING_BY_ID = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]));
    CONCERN_BY_ID = Object.fromEntries(CONCERNS.map(c => [c.id, c]));
  }

  // Localize the NEW top-10 datasets (deep, path-keyed). Symmetric with the
  // extractor in kb_extract2.cjs: only whitelisted PROSE fields are translated —
  // product/brand names, ids, seeds, emojis, enum codes are never touched, so
  // lookups (e.g. CFG.verdicts[item.verdict]) keep working. Renderers read
  // window.KBEAUTY_* at render time, so reassigning the globals localizes them.
  const NC_ALLOW = new Set(['title','sub','subtitle','subhead','tagline','eyebrow','kicker','headline','body','text','desc','blurb','why','whyComparable','sharedHero','role','job','plain','measures','label','note','authNote','priceNote','tip','finish','skinNote','how','what','vibe','evidence','worthIt','verdictBadge','bottomLine','reassess','disclaimer','scaleLabel','needWhy','skipIf','cadence','safeNote','safeHelpers','primer','intro','whyTitle','breakoutsTitle','doTitle','ctaLabel','ctaNote','decoderEmptyAllSafe','decoderModeHint','q','a','tableNote','viralFor','whatItIs','essentialLabel','recommendedLabel','optionalLabel','methodology','science','claim','whyMoved']);
  const NC_ALLOW_ARR = new Set(['pros','cons','do','dont','dos','donts','mistakes','highlights','tellTale','real','hype','tips','examples']);
  const NC_SPECIAL = new Set(['explainerByFamily','stageLabels','momentumLabels','crossoverLabels','velocityLabels','statusLabels']);
  function ncWalk(obj, prefix) {
    if (!obj || typeof obj !== 'object') return;
    for (const k in obj) {
      const v = obj[k]; const key = prefix + '.' + k;
      if (typeof v === 'string') { if (NC_ALLOW.has(k)) obj[k] = cx(key, v); }
      else if (Array.isArray(v)) {
        v.forEach((el, i) => {
          if (typeof el === 'string') { if (NC_ALLOW_ARR.has(k)) v[i] = cx(key + '.' + i, el); }
          else if (el && typeof el === 'object') ncWalk(el, key + '.' + i);
        });
      } else if (v && typeof v === 'object') {
        if (NC_SPECIAL.has(k)) { for (const kk in v) if (typeof v[kk] === 'string') v[kk] = cx(key + '.' + kk, v[kk]); }
        else ncWalk(v, key);
      }
    }
  }
  function localizeNewData() {
    if (!CONTENT || !Object.keys(CONTENT).length) return; // en or load failed → English
    ['KBEAUTY_GLASSKIN','KBEAUTY_DUPES_META','KBEAUTY_DUPES','KBEAUTY_BUY','KBEAUTY_SUNCARE','KBEAUTY_SNAIL','KBEAUTY_CATEGORIES','KBEAUTY_BESTSELLERS','KBEAUTY_BOARD_CONFIG','KBEAUTY_TROUBLESHOOTER_META','KBEAUTY_PURGE','KBEAUTY_BARRIER','KBEAUTY_FUNGAL','KBEAUTY_RADAR','KBEAUTY_VIRALCHECK','KBEAUTY_NEWSWIRE','KBEAUTY_KR_SOURCES','KBEAUTY_TRUST','KBEAUTY_REPORT','KBEAUTY_BESTSELLERS_VELOCITY'].forEach(name => {
      if (!window[name]) return;
      try { const clone = JSON.parse(JSON.stringify(window[name])); ncWalk(clone, name); window[name] = clone; } catch {}
    });
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
    en: { result:'Your skin type', retake:'Retake', best:'Best for', pairs:'Pairs with', avoid:'Be careful with', preg:'Pregnancy', pregSafe:'Generally fine', pregCaution:'Ask your doctor', time:'Use', am:'AM', pm:'PM', both:'AM & PM', shop:'Shop this step', shopFor:'Shop', loading:'Loading…', shopEmpty:'Live shopping lights up here. Meanwhile, browse our authentic retailers below.', selectActives:'Select 2+ actives to check.', allSafe:'No conflicts — these play nicely together. 🎉', followToast:'Added to favourites ★', unfollowToast:'Removed', known:'Known for', tier:'Tier', vegan:'Vegan', mens:'Men-friendly', bioSoon:'Loading profile…', readMore:'Learn more', decNone:'No ingredients recognized — check the spelling or paste the full INCI list.', decFound:'recognized', priceFrom:'from', shelfEmpty:'Take the quiz and pick concerns — your shelf builds itself.', yourRoutine:'Your routine', sources:'Always patch-test new actives.', sponsored:'Sponsored', advertisement:'Advertisement', adAliTitle:'✨ Shop K-beauty on AliExpress', adAliSub:'Authentic Korean skincare — ships worldwide, best prices.', adAliCta:'Browse deals', adAliLoading:'Loading today’s deals…', reviewedOn:'Evidence reviewed', sources:'Sources', howWeGrade:'How we grade →', radarChartLabel:'Korea-vs-West trend map', radarQkr:'Big in Korea', radarQglobal:'Global mainstream', radarQniche:'Niche / quiet', radarQwest:'Big in the West', radarAxisWest:'Western popularity', radarSince:'Trending since', newsNote:'A curated desk of authoritative sources we monitor — tap any to read the primary source.', krSrcNote:'The named Korean sources behind our Korea-trend calls — checked, dated, never scraped.', lastRead:'last read', authoredBy:'Written & reviewed by', lastUpdatedTable:'Last updated by section', radarSecShort:'Trend radar', ledgerSecShort:'Evidence ledger', viralSecShort:'SkinTok reality check', boardSecShort:'Bestseller board', koreaNative:'Korea-native', myTrends:'For my skin', allTrends:'All trends', shareReport:'Share this report', quarterReport:'Quarterly trend report', topMovers:'Gaining momentum', skipList:'Worth skipping', copied:'Link copied ✓', takeQuiz:'take the skin quiz' },
    ko: { result:'내 피부 타입', retake:'다시하기', best:'추천 고민', pairs:'잘 맞는 성분', avoid:'주의 조합', preg:'임신 중', pregSafe:'일반적으로 무난', pregCaution:'의사와 상담', time:'사용', am:'아침', pm:'밤', both:'아침·밤', shop:'이 단계 쇼핑', shopFor:'쇼핑', loading:'불러오는 중…', shopEmpty:'실시간 쇼핑이 곧 표시됩니다. 아래 정품 판매처를 둘러보세요.', selectActives:'2개 이상 성분을 선택하세요.', allSafe:'충돌 없음 — 함께 써도 괜찮아요. 🎉', followToast:'즐겨찾기에 추가 ★', unfollowToast:'삭제됨', known:'대표', tier:'등급', vegan:'비건', mens:'남성 추천', bioSoon:'프로필 불러오는 중…', readMore:'자세히', decNone:'인식된 성분이 없어요 — 철자를 확인하거나 전체 성분표를 붙여넣어 보세요.', decFound:'개 인식됨', priceFrom:'부터', shelfEmpty:'퀴즈를 풀고 고민을 선택하면 선반이 자동으로 채워져요.', yourRoutine:'내 루틴', sources:'새 활성성분은 항상 패치테스트하세요.', sponsored:'스폰서', advertisement:'광고', adAliTitle:'✨ 알리익스프레스에서 K-뷰티 쇼핑', adAliSub:'정품 한국 스킨케어 — 전 세계 배송, 최저가.', adAliCta:'특가 보기', adAliLoading:'오늘의 특가 불러오는 중…', reviewedOn:'근거 검토', sources:'출처', howWeGrade:'평가 기준 보기 →', radarChartLabel:'한국 vs 서구 트렌드 지도', radarQkr:'한국에서 인기', radarQglobal:'글로벌 대세', radarQniche:'틈새 / 조용', radarQwest:'서구에서 인기', radarAxisWest:'서구 인기도', radarSince:'유행 시작', newsNote:'우리가 모니터링하는 신뢰 기관 큐레이션 — 눌러서 1차 출처를 확인하세요.', krSrcNote:'한국 트렌드 판단의 근거가 된 한국 소스 — 확인·날짜표기, 스크래핑 안 함.', lastRead:'최근 확인', authoredBy:'작성·검토', lastUpdatedTable:'섹션별 최종 업데이트', radarSecShort:'트렌드 레이더', ledgerSecShort:'근거 원장', viralSecShort:'스킨톡 리얼리티 체크', boardSecShort:'베스트셀러 보드', koreaNative:'한국 토종', myTrends:'내 피부용', allTrends:'전체 트렌드', shareReport:'리포트 공유', quarterReport:'분기 트렌드 리포트', topMovers:'상승 모멘텀', skipList:'건너뛸 만한 것', copied:'링크 복사됨 ✓', takeQuiz:'피부 퀴즈 풀기' },
    ja: { result:'あなたの肌タイプ', retake:'やり直す', best:'おすすめの悩み', pairs:'相性の良い成分', avoid:'注意の組合せ', preg:'妊娠中', pregSafe:'おおむね問題なし', pregCaution:'医師に相談', time:'使用', am:'朝', pm:'夜', both:'朝・夜', shop:'このステップを探す', shopFor:'探す', loading:'読み込み中…', shopEmpty:'ライブショッピングはここに表示されます。下の正規販売店もどうぞ。', selectActives:'2つ以上の成分を選択。', allSafe:'問題なし — 一緒に使えます。🎉', followToast:'お気に入りに追加 ★', unfollowToast:'削除しました', known:'代表', tier:'グレード', vegan:'ヴィーガン', mens:'メンズ可', bioSoon:'プロフィール読み込み中…', readMore:'詳しく', decNone:'認識された成分がありません — スペルを確認するか全成分を貼り付けてください。', decFound:'件認識', priceFrom:'〜', shelfEmpty:'診断と悩みを選ぶと棚が自動で埋まります。', yourRoutine:'あなたのルーティン', sources:'新しい成分は必ずパッチテストを。', sponsored:'スポンサー', advertisement:'広告', adAliTitle:'✨ AliExpressでK-beautyを購入', adAliSub:'本物の韓国スキンケア — 世界中に配送、ベストプライス。', adAliCta:'お得を見る', adAliLoading:'本日のお得を読み込み中…', reviewedOn:'エビデンス確認', sources:'出典', howWeGrade:'評価基準を見る →', radarChartLabel:'韓国 vs 欧米トレンドマップ', radarQkr:'韓国で人気', radarQglobal:'グローバル定番', radarQniche:'ニッチ / 静か', radarQwest:'欧米で人気', radarAxisWest:'欧米での人気度', radarSince:'流行開始', newsNote:'当サイトが注視する信頼できる情報源のキュレーション — タップで一次情報へ。', krSrcNote:'韓国トレンド判断の根拠となる韓国の情報源 — 確認・日付明記、スクレイピングなし。', lastRead:'最終確認', authoredBy:'作成・監修', lastUpdatedTable:'セクション別の最終更新', radarSecShort:'トレンドレーダー', ledgerSecShort:'エビデンス台帳', viralSecShort:'SkinTokリアリティチェック', boardSecShort:'ベストセラーボード', koreaNative:'韓国発', myTrends:'私の肌向け', allTrends:'すべてのトレンド', shareReport:'レポートを共有', quarterReport:'四半期トレンドレポート', topMovers:'勢いが上昇', skipList:'スキップ推奨', copied:'リンクをコピー ✓', takeQuiz:'肌診断を受ける' },
  };
  const t = (k) => (CONTENT && CONTENT['ui.' + k]) || (STR[lang] && STR[lang][k]) || STR.en[k] || k;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toast = (msg) => {
    let el = $('#kb-toast');
    if (!el) { el = document.createElement('div'); el.id = 'kb-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.style.cssText = 'position:fixed;left:50%;bottom:78px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:10px 18px;border-radius:22px;font-size:13px;font-weight:700;z-index:300;opacity:0;transition:opacity .2s;pointer-events:none'; document.body.appendChild(el); }
    el.textContent = msg; el.style.opacity = '1';
    clearTimeout(el._tm); el._tm = setTimeout(() => { el.style.opacity = '0'; }, 1800);
  };

  // ── Analytics (#2 funnel instrumentation) — reuse global kpAnalytics.track ──
  const kbtrack = (name, params) => { try { if (window.kpAnalytics && window.kpAnalytics.track) window.kpAnalytics.track(name, params || {}); } catch {} };
  let _impSeen = {};
  function observeImpression(sel, name, params) {
    try {
      const el = $(sel); if (!el || !('IntersectionObserver' in window)) return;
      const io = new IntersectionObserver((ents) => {
        ents.forEach(e => { if (e.isIntersecting && !_impSeen[name]) { _impSeen[name] = 1; kbtrack(name, params || {}); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(el);
    } catch {}
  }

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
      kbtrack('quiz_completed', { skin: best });
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
    </div>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="kb-quiz-cta" id="kb-cta-stack" type="button" style="background:linear-gradient(135deg,var(--kb1),var(--kb2));color:#fff;border:none;border-radius:24px;padding:11px 20px;font-weight:800;font-size:14px;cursor:pointer">✨ ${esc(cx('ux.yourStack', 'Your personalized stack'))} →</button>
      <button class="kb-quiz-cta" id="kb-cta-routine" type="button" style="background:var(--surface);color:var(--kb1);border:2px solid var(--kb1);border-radius:24px;padding:9px 18px;font-weight:800;font-size:14px;cursor:pointer">🧴 ${esc(cx('ux.buildRoutine', 'Build your routine'))} →</button>
    </div>`;
    const rt = $('#kb-retake');
    if (rt) rt.addEventListener('click', () => { try { localStorage.removeItem(SKIN_KEY); } catch {} for (const k in quizAnswers) delete quizAnswers[k]; renderQuiz(); refreshPersonalized(); });
    const cs = $('#kb-cta-stack'); if (cs) cs.addEventListener('click', () => { const el = document.getElementById('kb-stack'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    const cr = $('#kb-cta-routine'); if (cr) cr.addEventListener('click', () => { showCategory('routine'); });
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
    // Beginner — the essential 5-step routine (resolves "is 10 steps too much?")
    if (routineTime === 'beginner') {
      const ids = ['watercleanse', 'toner', 'treatment', 'moisturizer', 'sunscreen'];
      const bsteps = ids.map(id => ROUTINE.find(s => s.id === id)).filter(Boolean);
      box.innerHTML = `<div class="kb-step" style="border-style:dashed"><div class="kb-step-no">🌱</div><div class="kb-step-b"><div class="kb-step-name">${esc(cx('ui.beginnerTitle', 'Beginner — the essential 5 steps'))}</div><div class="kb-step-desc">${esc(cx('ui.beginnerDesc', 'Ten steps are optional. Start with these five — a complete routine on its own.'))}</div></div></div>`
        + bsteps.map((s, i) => `<div class="kb-step"><div class="kb-step-no">${i + 1}</div><div class="kb-step-b"><div class="kb-step-name"><span class="st-emoji">${s.emoji || ''}</span>${esc(s.name)}</div><div class="kb-step-desc">${esc(s.desc)}</div><button class="kb-step-shop" data-seed="${esc(stepSeed(s))}">🛍️ ${esc(t('shop'))}</button></div></div>`).join('')
        + `<div class="tb-primer" style="margin-top:8px">⬆️ ${esc(cx('ui.beginnerProgress', 'Once this feels easy, add a hydrating essence, then a weekly gentle exfoliant, then a PM treatment — one new step at a time.'))}</div>`;
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

  // ── Product-Category Explainer (toner vs essence vs serum…) ─────────────────
  function renderCategories() {
    const box = $('#kb-categories-box'); const C = window.KBEAUTY_CATEGORIES; if (!box || !C) return;
    const needCls = { essential: 'good', recommended: 'note', optional: '' };
    const needLbl = { essential: C.verdict.essentialLabel, recommended: C.verdict.recommendedLabel, optional: C.verdict.optionalLabel };
    const seedOf = (k, name) => (SHOP.aliSeeds || {})[k] || ('korean ' + name);
    const items = (C.items || []).slice().sort((a, b) => a.thickness - b.thickness);
    const cards = items.map(it => {
      const dots = '●'.repeat(it.thickness) + '○'.repeat(Math.max(0, 6 - it.thickness));
      const nc = needCls[it.need]; const badge = nc === '' ? `<span class="cat-need opt">${esc(needLbl[it.need])}</span>` : `<span class="kb-flag ${nc}">${esc(needLbl[it.need])}</span>`;
      return `<div class="cat-card">
        <div class="cat-h"><span class="cat-em" aria-hidden="true">${it.emoji || ''}</span><b>${esc(it.name)}</b> <span class="gs-ko">${esc(it.korean || '')}</span> ${badge}</div>
        <div class="cat-scale" title="${esc(C.scaleLabel)}"><span class="cat-dots">${dots}</span> ${esc(it.texture)}</div>
        <div class="cat-job">${esc(it.job)}</div>
        <div class="cat-rows"><div>🌍 ${esc(it.westernEquiv)}</div><div>📍 ${esc(it.routinePosition)}</div></div>
        <div class="cat-why">✅ ${esc(it.needWhy)}</div>
        <div class="cat-skip">⏭️ <b>Skip if:</b> ${esc(it.skipIf)}</div>
        <div class="cat-tip">💡 ${esc(it.tip)}</div>
        <button class="kb-step-shop cat-shop" data-seed="${esc(seedOf(it.aliSeedKey, it.name))}">🛍️ ${esc(t('shopFor'))}</button>
      </div>`;
    }).join('');
    const dc = C.doubleCleanse;
    box.innerHTML = `
      <p class="gs-p">${esc(C.intro)}</p>
      <div class="cat-grid">${cards}</div>
      <div class="gs-block" style="margin-top:14px"><div class="gs-h">✅ ${esc(C.minimalRoutine.title)}</div><p class="gs-p">${esc(C.minimalRoutine.body)}</p><div class="cat-min">${(C.minimalRoutine.steps || []).map(s => `<span class="cat-min-step">${esc(s)}</span>`).join('<span class="cat-arrow">→</span>')}</div></div>
      <div class="gs-block"><div class="gs-h">🫗 ${esc(dc.title)} <span class="gs-ko">${esc(dc.korean || '')}</span></div><p class="gs-p">${esc(dc.subtitle)}</p><p class="gs-p">${esc(dc.what)}</p>
        <div class="gs-principles">${(dc.steps || []).map(s => `<div class="gs-card"><div class="gs-card-em">${s.emoji || ''}</div><div class="gs-card-t">${s.n}. ${esc(s.title)}</div><div class="gs-card-b">${esc(s.body)}</div></div>`).join('')}</div>
        <div class="cat-why"><b>${esc(dc.whyTitle)}</b> ${esc(dc.why)}</div>
        <div class="tb-primer"><b>${esc(dc.breakoutsTitle)}</b> ${esc(dc.breakouts)}</div>
        <div class="tb-dodont"><div><b>✅ ${esc(dc.doTitle)}</b><br>${(dc.dos || []).map(x => '• ' + esc(x)).join('<br>')}</div><div><b>🚫</b><br>${(dc.donts || []).map(x => '• ' + esc(x)).join('<br>')}</div></div>
        <button class="kb-step-shop cat-shop" data-seed="${esc(seedOf('oilcleanse', 'cleansing oil and low ph cleanser'))}">🛍️ ${esc(dc.ctaLabel)}</button>
        <div class="funnel-disc">${esc(dc.ctaNote)}</div></div>`;
    $$('.cat-shop', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }

  // ── Snail Mucin Hero Guide (explainer + roundup) ────────────────────────────
  function renderSnail() {
    const box = $('#kb-snail-box'); const S = window.KBEAUTY_SNAIL; if (!box || !S) return;
    const stName = (id) => (SKINTYPES.find(s => s.id === id) || {}).name || id;
    const stEmoji = (id) => (SKINTYPES.find(s => s.id === id) || {}).emoji || '';
    const pairChips = (S.pairs.loves || []).map(id => { const i = ING_BY_ID[id]; return i ? `<button class="gs-ing" data-ing="${esc(id)}">${i.emoji || ''} ${esc(i.name)}</button>` : ''; }).join('');
    box.innerHTML = `
      <div class="gs-hero"><div class="gs-kicker">${esc(S.eyebrow)}</div>
        <div class="kb-sec-title" style="font-size:21px;margin:4px 0">${S.emoji} ${esc(S.title)}</div>
        <p class="gs-sub">${esc(S.tagline)}</p></div>
      <div class="gs-block"><div class="gs-h">${esc(S.what.headline)}</div><p class="gs-p">${esc(S.what.body)}</p>
        <div class="gs-layers">${(S.what.molecules || []).map(m => `<div class="gs-layer"><div class="gs-layer-h">${esc(m.name)}</div><div class="gs-layer-n">${esc(m.role)}</div></div>`).join('')}</div></div>
      <div class="gs-block"><div class="gs-h">${esc(S.hypeCheck.headline)} <span class="kb-flag note">${esc(S.hypeCheck.verdictBadge)}</span></div>
        <div class="tb-dodont"><div><b>✅ The real deal</b><br>${(S.hypeCheck.real || []).map(x => '• ' + esc(x)).join('<br>')}</div><div><b>⚠️ The overclaim</b><br>${(S.hypeCheck.hype || []).map(x => '• ' + esc(x)).join('<br>')}</div></div>
        <div class="gs-warn" style="color:var(--kb1);background:var(--kb-soft);border-color:var(--border)">${esc(S.hypeCheck.bottomLine)}</div></div>
      <div class="gs-block"><div class="gs-h">${esc(S.howToUse.headline)}</div>
        <div class="gs-principles">${(S.howToUse.steps || []).map(s => `<div class="gs-card"><div class="gs-card-em">${s.emoji || ''}</div><div class="gs-card-t">${s.n}. ${esc(s.title)}</div><div class="gs-card-b">${esc(s.text)}</div></div>`).join('')}</div>
        <p class="gs-p" style="margin-top:8px">📍 <b>Where:</b> ${esc(S.howToUse.layeringPosition)}</p>
        <div class="tb-primer">🧪 ${esc(S.howToUse.patchTest)}</div></div>
      <div class="gs-block"><div class="gs-h">${esc(S.suitability.headline)}</div>
        <div class="gs-layers">${(S.suitability.great || []).map(g => `<div class="gs-layer active"><div class="gs-layer-h">${stEmoji(g.skin)} ${esc(stName(g.skin))} ✓</div><div class="gs-layer-n">${esc(g.why)}</div></div>`).join('')}${(S.suitability.watchOuts || []).map(g => `<div class="gs-layer"><div class="gs-layer-h">⚠️ ${esc(g.skin)}</div><div class="gs-layer-n">${esc(g.why)}</div></div>`).join('')}</div>
        <div class="tb-primer">🌱 <b>Vegan?</b> ${esc(S.suitability.vegan)}</div></div>
      <div class="gs-block"><div class="gs-h">${esc(S.pairs.headline)}</div><div class="gs-chips">${pairChips}</div><p class="gs-p" style="margin-top:7px">${esc(S.pairs.note)}</p></div>
      <div class="gs-block"><div class="gs-h">${esc(S.compare.headline)}</div><p class="gs-p">${esc(S.compare.subhead)}</p>
        <div class="snail-grid">${(S.compare.picks || []).map(p => `<div class="snail-pick"><div class="snail-rank">${esc(p.rank)}</div><div class="snail-h">${p.emoji || ''} <b>${esc(p.brand)}</b> <span class="gs-ko">${esc(p.brandKo || '')}</span></div><div class="snail-prod">${esc(p.product)}</div><div class="snail-meta">${esc(p.format)} · ${esc(p.mucin)}</div><div class="snail-vibe">${esc(p.vibe)}</div><div class="snail-tags">${(p.tags || []).map(tg => `<span class="snail-tag">${esc(tg)}</span>`).join('')}</div><button class="kb-step-shop snail-shop" data-seed="${esc(p.aliSeed)}">🛍️ ${esc(p.priceBand || '')} ${esc(t('shopFor'))}</button></div>`).join('')}</div>
        <p class="gs-disc">${esc(S.compare.tableNote)}</p></div>
      <div class="gs-block"><div class="gs-h">❓ FAQ</div><div class="kb-gloss">${(S.faq || []).map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div></div>
      <div class="funnel-disc">${esc(S.disclaimer)}</div>`;
    $$('.gs-ing', box).forEach(b => b.addEventListener('click', () => openIngredient(b.dataset.ing)));
    $$('.snail-shop', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }

  // ── Bestsellers & Trend Tracker (viral 'worth it?' board) ───────────────────
  let boardTag = 'all';
  let boardKoreaOnly = false;
  const BS_STATUS_CLS = { rising:'st-rising', peaking:'st-peak', cooling:'vel-cool', steady:'st-fading' };
  function renderBestsellers() {
    const box = $('#kb-board-box'); const BS = window.KBEAUTY_BESTSELLERS; const CFG = window.KBEAUTY_BOARD_CONFIG;
    if (!box || !BS || !CFG) return;
    const VEL = window.KBEAUTY_BESTSELLERS_VELOCITY || { items: {}, statusLabels: {} };
    const vget = id => VEL.items[id] || {};
    const items = (BS.items || []).filter(it => (boardTag === 'all' || it.tag === boardTag) && (!boardKoreaOnly || vget(it.id).koreaNative));
    const pills = (CFG.filters || []).map(f => `<button class="kb-pick-chip${f.id === boardTag && !boardKoreaOnly ? ' on' : ''}" data-bt="${esc(f.id)}" aria-pressed="${f.id === boardTag}">${f.emoji || ''} ${esc(f.label)}</button>`).join('')
      + `<button class="kb-pick-chip${boardKoreaOnly ? ' on' : ''}" data-korea="1" aria-pressed="${boardKoreaOnly}">🇰🇷 ${esc(t('koreaNative'))}</button>`;
    const legend = Object.keys(CFG.verdicts || {}).map(k => { const v = CFG.verdicts[k]; return `<span class="bs-leg kb-flag ${v.cls}" title="${esc(v.tip)}">${v.emoji} ${esc(v.label)}</span>`; }).join('');
    const cards = items.map(it => {
      const v = (CFG.verdicts || {})[it.verdict] || { emoji: '', label: it.verdict, cls: 'note', tip: '' };
      const chips = (it.ingredient || []).map(id => { const i = ING_BY_ID[id]; return i ? `<button class="gs-ing" data-ing="${esc(id)}">${i.emoji || ''} ${esc(i.name)}</button>` : ''; }).join('');
      const ve = vget(it.id);
      const statusBadge = ve.status ? `<span class="radar-pill ${BS_STATUS_CLS[ve.status] || ''}">${esc((VEL.statusLabels || {})[ve.status] || ve.status)}</span>` : '';
      const channelChip = ve.channel ? `<span class="bs-channel">${ve.koreaNative ? '🇰🇷 ' : ''}${esc(ve.channel)}</span>` : '';
      return `<div class="bs-card">
        <div class="bs-top"><span class="bs-rank">#${it.rank}</span><span class="bs-em" aria-hidden="true">${it.emoji || '✨'}</span><div class="bs-tt"><div class="bs-brand">${esc(it.brand)}</div><div class="bs-name">${esc(it.name)}</div></div></div>
        <div class="bs-badges"><span class="kb-flag ${v.cls}" title="${esc(v.tip)}">${v.emoji} ${esc(v.label)}</span>${statusBadge}${channelChip}</div>
        ${ve.whyMoved ? `<div class="bs-line bs-moved">📊 ${esc(ve.whyMoved)}</div>` : ''}
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
      if (b.dataset.korea) { boardKoreaOnly = !boardKoreaOnly; }
      else { boardTag = b.dataset.bt; boardKoreaOnly = false; }
      renderBestsellers();
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
  // AliExpress shopping removed — all "shop" CTAs now route to the on-site
  // Where-to-Buy hub (Olive Young, YesStyle, official stores + authenticity guide).
  function loadShop(seed) {
    kbtrack('shop_open', { seed: seed || '' });
    jumpTo('#kb-buy');
  }

  // ── Build-your-shelf funnel ─────────────────────────────────────────────────
  function renderShelf() {
    const box = $('#kb-shelf-list'); if (!box) return;
    const skin = getSkin(); const concerns = [...getConcerns()];
    if (!skin && !concerns.length) { box.innerHTML = `<div class="kb-shelf-item">${esc(t('shelfEmpty'))}</div>`; return; }
    const essentials = ROUTINE.filter(s => !s.optional).sort((a, b) => a.step - b.step);
    const items = essentials.map(s => `<div class="kb-shelf-item">${s.emoji || '•'} ${esc(s.name)}</div>`);
    box.innerHTML = items.join('');
    // seed the shop CTA by primary concern (JS scroll — no href fragment, so the
    // clean /kbeauty URL with <base href="/guide/"> isn't navigated away)
    const cta = $('#kb-shelf-cta');
    if (cta) {
      const go = () => { const c = concerns[0]; loadShop((SHOP.aliSeeds || {})[c] || (SHOP.aliSeeds || {}).general); jumpTo('#kb-shop'); };
      cta.addEventListener('click', go, { once: true });
      cta.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }, { once: true });
    }
  }

  // ── Personalized Stack Builder (skin type + concerns → shoppable stack) ─────
  function renderStack() {
    const box = $('#kb-stack-box'); if (!box) return;
    const skin = getSkin(); const concerns = [...getConcerns()];
    if (!skin && !concerns.length) { box.innerHTML = `<div class="kb-empty">${esc(cx('ui.stackEmpty', 'Take the skin quiz and pick your concerns above — your personalized stack builds itself here.'))}</div>`; return; }
    const st = SKINTYPES.find(s => s.id === skin);
    let recIds = [];
    concerns.forEach(c => { const co = CONCERN_BY_ID[c]; if (co && co.lookFor) co.lookFor.forEach(id => { if (!recIds.includes(id)) recIds.push(id); }); });
    if (!recIds.length) recIds = INGREDIENTS.filter(i => i.star).map(i => i.id);
    recIds = recIds.slice(0, 8);
    const ingChips = recIds.map(id => { const i = ING_BY_ID[id]; return i ? `<button class="gs-ing" data-ing="${esc(id)}">${i.emoji || ''} ${esc(i.name)}</button>` : ''; }).join('');
    const essentials = ROUTINE.filter(s => !s.optional).sort((a, b) => a.step - b.step);
    const concernChips = concerns.map(c => { const co = CONCERN_BY_ID[c] || {}; return `<span class="stack-tag">${co.emoji || '🎯'} ${esc(co.name || c)}</span>`; }).join('');
    const seed = (SHOP.aliSeeds || {})[concerns[0]] || (SHOP.aliSeeds || {}).general || 'korean skincare';
    box.innerHTML = `
      <div class="stack-summary">
        ${st ? `<div class="stack-skin"><span class="stack-skin-em" aria-hidden="true">${st.emoji || '✨'}</span><div><div class="stack-skin-n">${esc(st.name)} ${esc(cx('ui.stackSkin', 'skin'))}</div><div class="stack-skin-d">${esc(st.desc)}</div></div></div>` : ''}
        ${concernChips ? `<div class="stack-concerns">${concernChips}</div>` : ''}
      </div>
      <div class="gs-block"><div class="gs-h">🧪 ${esc(cx('ui.stackIng', 'Your key ingredients'))}</div><p class="gs-p">${esc(cx('ui.stackIngSub', 'Matched to your concerns — tap any to learn how to use it.'))}</p><div class="gs-chips">${ingChips || '<span class="gs-p">—</span>'}</div></div>
      <div class="gs-block"><div class="gs-h">🧴 ${esc(cx('ui.stackRoutine', 'Your essential routine'))}</div><div class="kb-shelf-list">${essentials.map(s => `<div class="kb-shelf-item">${s.emoji || '•'} ${esc(s.name)}</div>`).join('')}</div></div>
      <div class="funnel" style="margin-top:4px"><div class="kb-sec-title">🛒 ${esc(cx('ui.stackShop', 'Shop your stack'))}</div><div class="kb-sec-sub">${esc(cx('ui.stackShopSub', 'Your routine, ready to shop in one place.'))}</div><div style="margin-top:10px"><a class="kb-shelf-cta" data-seed="${esc(seed)}">🛒 ${esc(t('shopFor'))}</a></div><div class="funnel-disc">${esc((SHOP && SHOP.disclosure) || '')}</div></div>`;
    $$('.gs-ing', box).forEach(b => b.addEventListener('click', () => openIngredient(b.dataset.ing)));
    $$('.kb-shelf-cta', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }

  // ── Share fab ───────────────────────────────────────────────────────────────
  function showShareFab() {
    const fab = $('#kb-share-fab'); if (!fab) return;
    if (getSkin() || getConcerns().size) fab.hidden = false;
  }

  // ── Modern UX layer (10 conveniences) ───────────────────────────────────────
  const KB_LIB = '/guide/kb';
  function kbToast(msg) {
    let w = $('#kb-toast-wrap'); if (!w) { w = document.createElement('div'); w.id = 'kb-toast-wrap'; document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'kb-toast'; t.textContent = msg; w.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 320); }, 2200);
  }
  const KB_RECENT_KEY = 'kp_kbeauty_recent';
  function kbAddRecent(type, id, name, emoji) {
    if (!id || !name) return;
    try { let a = JSON.parse(localStorage.getItem(KB_RECENT_KEY) || '[]'); a = a.filter(x => !(x.t === type && x.id === id)); a.unshift({ t: type, id, n: name, e: emoji || '' }); localStorage.setItem(KB_RECENT_KEY, JSON.stringify(a.slice(0, 6))); } catch (e) {}
  }
  function kbRenderRecent() {
    const host = $('#kb-recent'); if (!host) return;
    let a = []; try { a = JSON.parse(localStorage.getItem(KB_RECENT_KEY) || '[]'); } catch (e) {}
    if (!a.length) { host.style.display = 'none'; return; }
    host.style.display = '';
    host.innerHTML = '<h3>' + esc(cx('ux.recent', 'Recently viewed')) + '</h3><div>' + a.map(x =>
      '<a class="pill" href="' + KB_LIB + '/' + (x.t === 'brand' ? 'brand' : 'ingredient') + '/' + encodeURIComponent(x.id) + '.html">' + (x.e || '') + ' ' + esc(x.n) + '</a>'
    ).join('') + '</div>';
  }
  function kbSearchIndex() {
    const idx = [];
    (window.KBEAUTY_INGREDIENTS || []).forEach(i => idx.push({ l: i.name, e: i.emoji || '🧪', u: KB_LIB + '/ingredient/' + i.id + '.html', t: cx('ux.ingredient', 'Ingredient') }));
    (window.KBEAUTY_BRANDS || []).forEach(b => idx.push({ l: b.name, e: b.emoji || '🏷️', u: KB_LIB + '/brand/' + b.id + '.html', t: cx('ux.brand', 'Brand') }));
    (window.KBEAUTY_CONCERNS || []).forEach(c => idx.push({ l: c.name, e: c.emoji || '🎯', u: KB_LIB + '/concern/' + c.id + '.html', t: cx('ux.concern', 'Concern') }));
    return idx;
  }
  // The bottom tab bar exposes 4 primary destinations; every other category
  // lives behind 'More', so a tab always lights up ('you are here').
  const KB_BNAV_PRIMARY = ['home', 'skin', 'routine', 'buy'];
  function syncBnav(active) {
    const a = KB_BNAV_PRIMARY.indexOf(active) >= 0 ? active : 'more';
    $$('#kb-bnav button').forEach(b => b.classList.toggle('on', b.dataset.bn === a));
  }
  function openMoreSheet() {
    const box = $('#kb-modal'); if (!box) return;
    const moreCats = ['sun', 'ingr', 'trouble', 'brands', 'trends'].map(id => kbCatById(id)).filter(Boolean);
    const rows = moreCats.map(c => '<button type="button" class="kb-sheet-row" data-morecat="' + c.id + '"><span class="se">' + c.icon + '</span><span><span>' + esc(kbTitle(c)) + '</span><span class="sd">' + esc(cx('cat.' + c.id + '.sub', c.sub)) + '</span></span></button>').join('');
    const lib = '<a class="kb-sheet-row" href="/guide/kb/"><span class="se">📚</span><span><span>' + esc(cx('ux.library', 'The K-Beauty Library')) + '</span><span class="sd">' + esc(cx('ux.librarysub', '1,000+ guides')) + '</span></span></a>';
    box.innerHTML = '<button class="kb-modal-x" data-close aria-label="Close">✕</button>'
      + '<div class="kb-sheet-h">' + esc(cx('ux.more', 'More')) + '</div>'
      + '<div class="kb-sheet-menu">' + rows + lib + '</div>';
    openModalA11y();
    box.querySelectorAll('[data-morecat]').forEach(b => b.addEventListener('click', () => { closeModal(); showCategory(b.dataset.morecat); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
  }
  function initUX() {
    const body = document.body;
    const prog = document.createElement('div'); prog.id = 'kb-progress'; body.appendChild(prog);
    const top = document.createElement('button'); top.className = 'kb-fabtop'; top.type = 'button'; top.setAttribute('aria-label', cx('ux.top', 'Back to top')); top.textContent = '↑'; body.appendChild(top);
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    let _scrollTick = false;
    const onScroll = () => {
      if (_scrollTick) return; _scrollTick = true;
      requestAnimationFrame(() => {
        const h = document.documentElement, sc = h.scrollTop || body.scrollTop, max = (h.scrollHeight - h.clientHeight) || 1;
        prog.style.width = Math.min(100, (sc / max) * 100) + '%'; top.classList.toggle('show', sc > 600);
        _scrollTick = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    // search + recent toolbar (landing only)
    const landing = $('#kb-landing');
    if (landing && !$('#kb-toolbar')) {
      const tb = document.createElement('div'); tb.id = 'kb-toolbar';
      tb.innerHTML = '<div class="kb-search-wrap"><span class="kb-search-ic">🔎</span>'
        + '<input id="kb-search" class="kb-search" type="search" autocomplete="off" placeholder="' + esc(cx('ux.searchph', 'Search ingredients, brands, concerns…')) + '" aria-label="' + esc(cx('ux.search', 'Search K-beauty')) + '">'
        + '<div id="kb-search-res" class="kb-search-res" role="listbox"></div></div><div id="kb-recent" class="kb-recent"></div>';
      landing.parentNode.insertBefore(tb, landing);
      const inp = $('#kb-search'), res = $('#kb-search-res'); let idx = null;
      inp.addEventListener('input', () => {
        const q = inp.value.trim().toLowerCase(); if (!q) { res.classList.remove('show'); res.innerHTML = ''; return; }
        if (!idx) idx = kbSearchIndex();
        const hits = idx.filter(x => x.l.toLowerCase().indexOf(q) >= 0).slice(0, 8);
        res.innerHTML = hits.length ? hits.map(x => '<a href="' + x.u + '"><span>' + x.e + '</span><span>' + esc(x.l) + '</span><span class="ty">' + esc(x.t) + '</span></a>').join('') : '<a style="cursor:default;color:var(--text3)">' + esc(cx('ux.noresults', 'No matches')) + '</a>';
        res.classList.add('show');
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = res.querySelector('a[href]'); if (a) location.href = a.getAttribute('href'); } else if (e.key === 'Escape') { res.classList.remove('show'); inp.blur(); } });
      document.addEventListener('click', e => { if (!tb.contains(e.target)) res.classList.remove('show'); });
    }
    // bottom nav (mobile)
    if (!$('#kb-bnav')) {
      const bn = document.createElement('nav'); bn.id = 'kb-bnav'; bn.setAttribute('aria-label', 'K-beauty');
      const items = [['home', '🏠', cx('ux.home', 'Home')], ['skin', '🪞', kbTitle(kbCatById('skin'))], ['routine', '🧴', kbTitle(kbCatById('routine'))], ['buy', '🛍️', cx('ux.shop', 'Shop')], ['more', '☰', cx('ux.more', 'More')]];
      bn.innerHTML = items.map(it => '<button type="button" data-bn="' + it[0] + '"><span class="bi">' + it[1] + '</span><span>' + esc(it[2]) + '</span></button>').join('');
      body.appendChild(bn);
      bn.addEventListener('click', e => { const b = e.target.closest('[data-bn]'); if (!b) return; const t = b.dataset.bn; if (t === 'more') { openMoreSheet(); return; } if (t === 'home') showLanding(); else showCategory(t); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
    // bottom-sheet swipe-down-to-dismiss (mobile only; engages only at scrollTop 0)
    (function () {
      const box = $('#kb-modal'); if (!box || box.dataset.swipe) return; box.dataset.swipe = '1';
      let startY = 0, dy = 0, dragging = false;
      const isSheet = () => matchMedia('(max-width:680px)').matches;
      box.addEventListener('touchstart', e => {
        if (!isSheet() || box.scrollTop > 0 || e.touches.length !== 1) { dragging = false; return; }
        startY = e.touches[0].clientY; dy = 0; dragging = true;
      }, { passive: true });
      box.addEventListener('touchmove', e => {
        if (!dragging) return;
        dy = e.touches[0].clientY - startY;
        if (dy > 0) { box.classList.add('kb-dragging'); box.style.transform = 'translateY(' + dy + 'px)'; }
      }, { passive: true });
      box.addEventListener('touchend', () => {
        if (!dragging) return; dragging = false;
        box.classList.remove('kb-dragging');
        if (dy > 110) closeModal();
        box.style.transform = '';
      });
    })();
    // copy current-category deep-link (share)
    const sc = $('#kb-share-cat');
    if (sc) sc.addEventListener('click', () => {
      const cat = ((($('#kb-back-title') || {}).dataset) || {}).catid || '';
      const link = location.origin + '/kbeauty' + (cat ? '#cat=' + cat : '');
      const done = () => kbToast(cx('ux.copied', 'Link copied ✓'));
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done).catch(done);
      else { try { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } catch (e) {} done(); }
    });
    // reveal-on-scroll
    if (window.IntersectionObserver && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
      $$('.kb-sec').forEach(s => { s.classList.add('kb-reveal'); io.observe(s); });
    }
    // recently-viewed recorder + haptic micro-interaction
    document.addEventListener('click', e => {
      const ig = e.target.closest('[data-ing]'); if (ig) { const i = ING_BY_ID[ig.dataset.ing]; if (i) kbAddRecent('ing', i.id, i.name, i.emoji); }
      const br = e.target.closest('[data-brand]'); if (br) { const b = (window.KBEAUTY_BRANDS || []).filter(x => x.id === br.dataset.brand)[0]; if (b) kbAddRecent('brand', b.id, b.name, b.emoji); }
      if (e.target.closest('.filter-chip,.kb-tile,.kb-quiz-cta,#kb-bnav button,.kb-ing,.kb-brand,.kb-concern,.kb-opt,.kb-tab,.kb-pick-chip,.kb-retailer,.km-link,.kb-sheet-row,.kb-auth-exp,.tk-item,.kb-back-btn,.kb-step-shop,.kb-shelf-cta')) { try { navigator.vibrate && navigator.vibrate(8); } catch (e2) {} }
    });
    // sync toolbar + bottom-nav to the current (possibly deep-linked) state
    const inCat = $('#kb-back') && !$('#kb-back').hidden;
    const tb2 = $('#kb-toolbar'); if (tb2) tb2.style.display = inCat ? 'none' : '';
    syncBnav(inCat ? ((($('#kb-back-title') || {}).dataset || {}).catid || 'home') : 'home');
    kbRenderRecent();
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
  function refreshPersonalized() { renderStack(); renderIngredients(); renderRoutine(); renderShelf(); }

  function renderTicker() {
    const wrap = $('#kb-ticker-wrap'), rail = $('#kb-ticker'); if (!rail) return;
    if (!TRENDS.length) return;
    const html = TRENDS.map(tr => `<button type="button" class="tk-item" data-trend="${esc(tr.id)}" aria-label="${esc(tr.title)}"><span class="tk-kind">${tr.emoji || '✨'}</span>${esc(tr.title)}</button>`).join('');
    rail.innerHTML = html + html;
    if (wrap) wrap.hidden = false;
    if (!rail.dataset.wired) { rail.dataset.wired = '1'; rail.addEventListener('click', (e) => { const b = e.target.closest('[data-trend]'); if (b) openTrendModal(b.dataset.trend); }); }
    // Pause the desktop marquee when the tab is hidden (battery / off-screen work).
    if (!document._kbTickerVis) { document._kbTickerVis = 1; document.addEventListener('visibilitychange', () => { const r = $('#kb-ticker'); if (r) r.style.animationPlayState = document.hidden ? 'paused' : ''; }); }
  }
  // Ticker keyword → instant localized trend detail (verdict + science + source).
  function openTrendModal(id) {
    const tr = TRENDS.filter(x => x.id === id)[0]; const box = $('#kb-modal'); if (!tr || !box) return;
    const v = ((window.KBEAUTY_BOARD_CONFIG || {}).verdicts || {})[tr.verdict] || { emoji: '', label: tr.verdict || '' };
    const cite = (tr.cite && (window.KBEAUTY_CITATIONS || {})[tr.cite]) ? window.KBEAUTY_CITATIONS[tr.cite] : null;
    box.innerHTML = `<button class="kb-modal-x" data-close aria-label="Close">✕</button>
      <div style="text-align:center"><div class="km-emoji">${tr.emoji || '✨'}</div><div class="km-name">${esc(tr.title)}</div></div>
      <div style="text-align:center;margin:10px 0"><span style="display:inline-block;font-size:12.5px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--kb1),var(--kb2));border-radius:16px;padding:5px 13px">${esc(v.emoji || '')} ${esc(v.label || '')}</span></div>
      ${tr.blurb ? `<div class="km-bio" style="font-style:italic">${esc(tr.blurb)}</div>` : ''}
      ${tr.science ? `<div class="km-bio">${esc(tr.science)}</div>` : ''}
      ${cite ? `<div class="km-list"><a href="${esc(cite.url)}" target="_blank" rel="nofollow noopener">📄 ${esc(cite.label)} ↗</a></div>` : ''}
      <div class="km-links"><button class="km-link" id="kb-trend-more">🔥 ${esc(t('allTrends'))} →</button></div>`;
    openModalA11y();
    const more = box.querySelector('#kb-trend-more');
    if (more) more.addEventListener('click', () => { closeModal(); showCategory('trends'); });
    try { kbtrack('ticker_click', { id: id }); } catch (e) {}
  }

  // ── Category navigation ─────────────────────────────────────────────────────
  // The hub's ~25 sections are grouped into 8 categories. By default a landing
  // menu shows (no heavy content); clicking a category reveals only that
  // category's sections. Deep-linkable via #cat=<id> or a #kb-<section> anchor.
  // tk = an existing 9-language messages key (emoji + label baked in) reused for
  // instant localization; sub = English fallback via cx() (overlays may add later).
  const KB_CATS = [
    { id: 'skin', icon: '🪞', tk: 'kbeauty.filter.quiz', t: 'My Skin', sub: 'Skin-type quiz, concerns, seasonal forecast & your stack', secs: ['kb-quiz', 'kb-concerns', 'kb-forecast', 'kb-stack'] },
    { id: 'routine', icon: '🧴', tk: 'kbeauty.filter.routine', t: 'Routine', sub: 'AM/PM routine builder, product types & glass skin', secs: ['kb-routine', 'kb-categories', 'kb-glassskin'] },
    { id: 'sun', icon: '☀️', tk: 'kbeauty.filter.sun', t: 'Sunscreen', sub: 'Decode SPF/PA & find your Korean sunscreen', secs: ['kb-sun'] },
    { id: 'ingr', icon: '🧪', tk: 'kbeauty.filter.ingredients', t: 'Ingredients', sub: 'Encyclopedia, label decoder & what not to mix', secs: ['kb-ingredients', 'kb-snail', 'kb-conflicts'] },
    { id: 'trouble', icon: '🩺', tk: 'kbeauty.filter.trouble', t: 'Troubleshoot', sub: 'Purging vs breakout, barrier & fungal-acne checks', secs: ['kb-trouble'] },
    { id: 'brands', icon: '🏷️', tk: 'kbeauty.filter.brands', t: 'Brands & Terms', sub: '30 brands, dupes & a K-beauty glossary', secs: ['kb-brands', 'kb-dupes', 'kb-glossary'] },
    { id: 'buy', icon: '🛡️', tk: 'kbeauty.filter.buy', t: 'Buy Safe', sub: 'Where to buy authentic, spot fakes & build your shelf', secs: ['kb-buy', 'kb-shelf'] },
    { id: 'trends', icon: '🔥', tk: 'kbeauty.filter.board', t: 'Trends & Authority', sub: 'Trend radar, evidence, SkinTok checks & Korean sources', secs: ['kb-radar', 'kb-ledger', 'kb-viral', 'kb-board', 'kb-report', 'kb-news', 'kb-krsrc', 'kb-trust'] },
  ];
  const KB_ALLSECS = KB_CATS.reduce((a, c) => a.concat(c.secs), []);
  const kbCatById = (id) => KB_CATS.filter(c => c.id === id)[0] || null;
  const kbCatOfSec = (sid) => KB_CATS.filter(c => c.secs.indexOf(sid) >= 0)[0] || null;
  // Localized labels come from the chrome i18n layer (window.kpI18n, messages/*.json),
  // which kbeauty.js's local t() does NOT read. kbChip = full label (emoji+text);
  // kbTitle = same with the leading emoji stripped (tiles show their own big icon).
  const i18get = (k) => { try { const v = window.kpI18n && window.kpI18n.t ? window.kpI18n.t(k) : null; return (v && v !== k) ? v : null; } catch (e) { return null; } };
  const kbChip = (c) => i18get(c.tk) || (c.icon + ' ' + c.t);
  const kbTitle = (c) => { const v = kbChip(c).replace(/^[^\p{L}\p{N}]+/u, '').trim(); return v || c.t; };
  function applyNavI18n() {
    KB_CATS.forEach(c => {
      const full = kbChip(c), title = kbTitle(c);
      $$('#kb-filters [data-catid="' + c.id + '"]').forEach(e => { e.textContent = full; });
      $$('#kb-landing .tt[data-catid="' + c.id + '"]').forEach(e => { e.textContent = title; });
    });
    const bt = $('#kb-back-title'); if (bt && bt.dataset.catid) { const c = kbCatById(bt.dataset.catid); if (c) bt.textContent = c.icon + ' ' + kbTitle(c); }
    const cta = $('#kb-landing .kb-cta-hero'); if (cta) { const tt = cta.querySelector('.cta-t'), ss = cta.querySelector('.cta-s'); const tv = i18get('kbeauty.sec.quiz.title'), sv = i18get('kbeauty.sec.quiz.sub'); if (tt && tv) tt.textContent = tv; if (ss && sv) ss.textContent = sv; }
  }

  function showLanding() {
    KB_ALLSECS.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    const land = $('#kb-landing'); if (land) land.style.display = '';
    const back = $('#kb-back'); if (back) back.hidden = true;
    $$('.filter-chip', $('#kb-filters')).forEach(c => { const on = c.dataset.target === 'home'; c.classList.toggle('active', on); c.setAttribute('aria-selected', on ? 'true' : 'false'); });
    const tb = $('#kb-toolbar'); if (tb) tb.style.display = '';
    if (typeof kbRenderRecent === 'function') kbRenderRecent();
    if (typeof syncBnav === 'function') syncBnav('home');
  }
  // Lazy render: a category's sections are rendered the first time it opens
  // (boot only renders the landing chrome), so the hub doesn't do ~25 sections'
  // worth of main-thread work up front — big mobile TBT/INP win.
  const _renderedCats = {};
  function ensureCatRendered(id) {
    if (_renderedCats[id]) return;
    _renderedCats[id] = true;
    const M = {
      skin: [renderForecast, renderQuiz, renderConcerns, renderStack],
      routine: [renderRoutine, renderCategories, renderGlassSkin],
      sun: [renderSunscreen],
      ingr: [renderIngredients, renderSnail, renderPicker, renderVerdicts],
      trouble: [renderTroubleshooter],
      brands: [renderBrands, renderGlossary, renderDupes],
      buy: [renderBuy, detectBuyRegion, renderRetailers, renderShelf],
      trends: [renderRadar, renderLedger, renderViral, renderBestsellers, renderReport, renderNewsdesk, renderKrSources, renderTrust],
    };
    (M[id] || []).forEach(fn => { try { fn(); } catch (e) { try { console.error('kb render ' + id, e); } catch (e2) {} } });
  }
  function showCategory(id, opts) {
    const cat = kbCatById(id); if (!cat) { showLanding(); return; }
    ensureCatRendered(id);
    const land = $('#kb-landing'); if (land) land.style.display = 'none';
    KB_ALLSECS.forEach(sid => { const el = document.getElementById(sid); if (el) el.style.display = (cat.secs.indexOf(sid) >= 0) ? '' : 'none'; });
    const back = $('#kb-back'); if (back) { back.hidden = false; const bt = $('#kb-back-title'); if (bt) { bt.dataset.catid = cat.id; bt.textContent = cat.icon + ' ' + kbTitle(cat); } }
    $$('.filter-chip', $('#kb-filters')).forEach(c => { const on = c.dataset.target === id; c.classList.toggle('active', on); c.setAttribute('aria-selected', on ? 'true' : 'false'); });
    const tb = $('#kb-toolbar'); if (tb) tb.style.display = 'none';
    if (typeof syncBnav === 'function') syncBnav(id);
    if (id === 'trends') applyTrendsDensity(opts && opts.activeSec);
    if (!opts || !opts.noscroll) { const bar = $('#kb-filters'); if (bar) bar.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  // Trends carries 8 sections — keep the 4 evidence/trend reads in focus and tuck the
  // 4 authority/methodology sections behind one expander (Toss one-focus). Deep-links
  // into an authority section auto-expand. Re-applied every time Trends is shown
  // because showCategory resets all section display:'' first.
  const KB_TRENDS_AUTHORITY = ['kb-report', 'kb-news', 'kb-krsrc', 'kb-trust'];
  function applyTrendsDensity(activeSec) {
    const open = KB_TRENDS_AUTHORITY.indexOf(activeSec) >= 0;
    const old = document.getElementById('kb-auth-exp'); if (old) old.remove();
    KB_TRENDS_AUTHORITY.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = open ? '' : 'none'; });
    if (open) return;
    const first = document.getElementById(KB_TRENDS_AUTHORITY[0]); if (!first) return;
    const ex = document.createElement('button');
    ex.id = 'kb-auth-exp'; ex.type = 'button'; ex.className = 'kb-auth-exp';
    ex.innerHTML = '<span>📚 ' + esc(cx('ux.authmore', 'Sources, methodology & science')) + '</span><span class="kb-auth-exp-c" aria-hidden="true">＋</span>';
    first.parentNode.insertBefore(ex, first);
    ex.addEventListener('click', () => { KB_TRENDS_AUTHORITY.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ''; }); ex.remove(); });
  }
  function renderNav() {
    const bar = $('#kb-filters');
    if (bar) {
      bar.innerHTML = '<button class="filter-chip kb-home-chip active" data-target="home" type="button" role="tab" aria-selected="true">🏠 ' + esc(cx('cat.menu', 'Menu')) + '</button>'
        + KB_CATS.map(c => '<button class="filter-chip" data-target="' + c.id + '" data-catid="' + c.id + '" type="button" role="tab" aria-selected="false">' + esc(kbChip(c)) + '</button>').join('');
    }
    const land = $('#kb-landing');
    if (land) {
      land.innerHTML = '<button type="button" class="kb-cta-hero" aria-label="' + esc(i18get('kbeauty.sec.quiz.title') || 'Find your skin type') + '"><span class="cta-tx"><span class="cta-t">' + esc(i18get('kbeauty.sec.quiz.title') || '🪞 Find your skin type') + '</span><span class="cta-s">' + esc(i18get('kbeauty.sec.quiz.sub') || 'A 30-second quiz personalizes everything') + '</span></span><span class="cta-go" aria-hidden="true">→</span></button>'
        + KB_CATS.map(c => '<button class="kb-tile" data-target="' + c.id + '" type="button"><span class="ti">' + c.icon + '</span><span class="tt" data-catid="' + c.id + '">' + esc(kbTitle(c)) + '</span><span class="ts">' + esc(cx('cat.' + c.id + '.sub', c.sub)) + '</span></button>').join('')
        + '<a class="kb-tile kb-tile-lib" href="/guide/kb/"><span class="ti">📚</span><span class="tt">' + esc(cx('cat.lib.t', 'K-Beauty Library')) + '</span><span class="ts">' + esc(cx('cat.lib.sub', '1,000+ guides: history, ingredients, brands, how-to & more')) + '</span></a>';
    }
    applyNavI18n();
  }
  function openFromHash() {
    const h = (location.hash || '').replace(/^#/, '');
    if (!h) { showLanding(); return; }
    if (h.indexOf('cat=') === 0) { showCategory(h.slice(4)); return; }
    const cat = kbCatOfSec(h);
    if (cat) { showCategory(cat.id, { noscroll: true, activeSec: h }); const el = document.getElementById(h); if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 140); return; }
    showLanding();
  }
  function wireFilters() {
    renderNav();
    const bar = $('#kb-filters');
    if (bar) bar.addEventListener('click', (e) => { const b = e.target.closest('.filter-chip'); if (!b) return; const tg = b.dataset.target; if (tg === 'home') showLanding(); else showCategory(tg); });
    const land = $('#kb-landing');
    if (land) land.addEventListener('click', (e) => {
      const cta = e.target.closest('.kb-cta-hero');
      if (cta) { e.preventDefault(); showCategory('skin'); setTimeout(() => jumpTo('#kb-quiz'), 80); return; }
      const b = e.target.closest('.kb-tile'); if (!b || !b.dataset.target) return; e.preventDefault(); showCategory(b.dataset.target);
    });
    const back = $('#kb-back'); if (back) { const bb = back.querySelector('.kb-back-btn'); if (bb) bb.addEventListener('click', () => { showLanding(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    // Localize nav labels once the chrome i18n layer is ready, and on switch.
    document.addEventListener('kp:langchange', applyNavI18n);
    applyNavI18n(); setTimeout(applyNavI18n, 600); setTimeout(applyNavI18n, 1600);
  }

  // ── Top sponsored block (localized AliExpress geo strip + AdSense) ───────────
  function renderTopAds() {
    const host = $('#kb-topads'); if (!host) return;
    const isKo = (lang === 'ko');
    const parts = [];
    // Korea visitors: Coupang Partners carousel (real products, ships in Korea).
    if (isKo) parts.push(`<div class="kb-ad-card"><div class="kb-ad-label">${esc(t('sponsored'))} · 쿠팡파트너스</div><div class="kb-ad-coupang" id="kb-ad-coupang"></div><div class="kb-ad-coupang-disc">이 광고는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</div></div>`);
    // Non-Korea visitors: region-appropriate global K-beauty retailers (NOT Korea-only Coupang).
    else parts.push(`<div class="kb-ad-card"><div class="kb-ad-label">🛍️ ${esc(t('sponsored'))}</div>`
      + `<div style="display:flex;gap:10px;flex-wrap:wrap;padding:2px 0">`
      + `<a rel="sponsored nofollow noopener" target="_blank" style="font-weight:800;font-size:13px;color:#c01a63;text-decoration:none;border:2px solid var(--border,#f0d8e6);border-radius:18px;padding:7px 14px" href="https://www.yesstyle.com/en/search?q=korean%20skincare">🛒 YesStyle</a>`
      + `<a rel="sponsored nofollow noopener" target="_blank" style="font-weight:800;font-size:13px;color:#c01a63;text-decoration:none;border:2px solid var(--border,#f0d8e6);border-radius:18px;padding:7px 14px" href="https://www.amazon.com/s?k=korean+skincare">🛒 Amazon</a></div></div>`);
    parts.push(`<div class="kb-ad-card"><div class="kb-ad-label">${esc(t('advertisement'))}</div><div class="kb-ad-adsense"><ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="ca-pub-1378943893051810" data-ad-slot="4521899200" data-ad-format="auto" data-full-width-responsive="true"></ins></div></div>`);
    host.innerHTML = parts.join('');
    host.hidden = false;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
    if (isKo) injectCoupang($('#kb-ad-coupang'));
  }
  function injectCoupang(host) {
    if (!host || host.dataset.done) return; host.dataset.done = '1';
    try {
      const ifr = document.createElement('iframe');
      ifr.style.cssText = 'width:100%;max-width:690px;height:150px;border:0;overflow:hidden;display:block;margin:0 auto';
      ifr.setAttribute('scrolling', 'no'); ifr.setAttribute('title', 'Coupang Partners'); ifr.setAttribute('loading', 'lazy');
      host.appendChild(ifr);
      const d = ifr.contentWindow.document;
      d.open();
      d.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;overflow:hidden}</style></head><body>'
        + '<script src="https://ads-partners.coupang.com/g.js"><\/script>'
        + '<script>new PartnersCoupang.G({"id":996633,"trackingCode":"AF4227535","subId":null,"template":"carousel","width":"680","height":"140"});<\/script>'
        + '</body></html>');
      d.close();
    } catch { /* coupang failed — leave block empty */ }
  }
  // (loadTopAli removed — AliExpress top strip dropped; top block is now Coupang(ko) + AdSense)

  // ── Seoul-vs-World Trend Radar (#1): Korea×West quadrant + lifecycle cards ──
  const RADAR_STAGE_CLS = { emerging:'st-emerging', rising:'st-rising', peak:'st-peak', mainstream:'st-mainstream', fading:'st-fading' };
  const RADAR_MOM_GLYPH = { up:'↑', flat:'→', down:'↓' };
  let trendPersonal = false;
  function personalFilter(items, kind) {
    const concerns = [...getConcerns()];
    if (!trendPersonal || !concerns.length) return items;
    const tags = (window.KBEAUTY_TREND_TAGS || {})[kind] || {};
    const f = items.filter(it => (tags[it.id] || []).some(c => concerns.includes(c)));
    return f.length ? f : items;
  }
  function personalToggleHTML() {
    const concerns = [...getConcerns()];
    if (!concerns.length) return `<div class="trend-toggle"><a class="trend-toggle-cta" id="kb-trend-quiz">🪞 ${esc(t('myTrends'))} — ${esc(t('takeQuiz') || 'take the skin quiz')}</a></div>`;
    return `<div class="trend-toggle"><button class="trend-seg${!trendPersonal ? ' on' : ''}" data-tp="0">${esc(t('allTrends'))}</button><button class="trend-seg${trendPersonal ? ' on' : ''}" data-tp="1">🪞 ${esc(t('myTrends'))}</button></div>`;
  }
  function wireTrendToggle(box) {
    $$('.trend-seg', box).forEach(b => b.addEventListener('click', () => { trendPersonal = b.dataset.tp === '1'; renderRadar(); renderViral(); }));
    const qz = $('#kb-trend-quiz', box); if (qz) qz.addEventListener('click', () => jumpTo('#kb-quiz'));
  }
  function renderRadar() {
    const box = $('#kb-radar-box'); const R = window.KBEAUTY_RADAR; if (!box || !R) return;
    const items = personalFilter(R.items || [], 'radar');
    const SL = R.stageLabels || {}, ML = R.momentumLabels || {}, CL = R.crossoverLabels || {};
    const V = (window.KBEAUTY_BOARD_CONFIG || {}).verdicts || {};
    const S = 340, P = 34, plot = S - P * 2;
    const X = we => P + (we / 100) * plot;
    const Y = kr => (S - P) - (kr / 100) * plot;
    const mid = X(50), midY = Y(50);
    const dots = items.map((it, i) => {
      const cx2 = X(it.we).toFixed(1), cy = Y(it.kr).toFixed(1), cls = RADAR_STAGE_CLS[it.stage] || 'st-rising';
      return `<g class="radar-dot ${cls}" data-i="${i}" tabindex="0" role="button" aria-label="${esc(it.label)}"><circle cx="${cx2}" cy="${cy}" r="11"/><text x="${cx2}" y="${(+cy + 4).toFixed(1)}" text-anchor="middle">${i + 1}</text></g>`;
    }).join('');
    const svg = `<svg viewBox="0 0 ${S} ${S}" class="radar-svg" role="img" aria-label="${esc(t('radarChartLabel'))}">
      <rect x="${P}" y="${P}" width="${plot}" height="${plot}" class="radar-bg"/>
      <line x1="${mid}" y1="${P}" x2="${mid}" y2="${S - P}" class="radar-grid"/>
      <line x1="${P}" y1="${midY}" x2="${S - P}" y2="${midY}" class="radar-grid"/>
      <text x="${(P + plot * 0.25).toFixed(0)}" y="${P + 15}" class="radar-q" text-anchor="middle">🇰🇷 ${esc(t('radarQkr'))}</text>
      <text x="${(P + plot * 0.75).toFixed(0)}" y="${P + 15}" class="radar-q" text-anchor="middle">🌍 ${esc(t('radarQglobal'))}</text>
      <text x="${(P + plot * 0.25).toFixed(0)}" y="${S - P - 7}" class="radar-q radar-q-dim" text-anchor="middle">${esc(t('radarQniche'))}</text>
      <text x="${(P + plot * 0.75).toFixed(0)}" y="${S - P - 7}" class="radar-q" text-anchor="middle">🌎 ${esc(t('radarQwest'))}</text>
      ${dots}
      <text x="${S / 2}" y="${S - 6}" class="radar-axis" text-anchor="middle">${esc(t('radarAxisWest'))} →</text>
    </svg>`;
    const cards = items.map((it, i) => {
      const v = V[it.verdict] || { emoji: '', label: it.verdict, cls: 'note', tip: '' };
      const cls = RADAR_STAGE_CLS[it.stage] || '';
      return `<div class="radar-card" id="kb-radar-c-${i}">
        <div class="radar-c-h"><span class="radar-c-n ${cls}">${i + 1}</span><span class="radar-c-em" aria-hidden="true">${it.emoji || '✨'}</span><span class="radar-c-t">${esc(it.label)}</span></div>
        <div class="radar-c-pills"><span class="radar-pill ${cls}">${esc(SL[it.stage] || it.stage)}</span><span class="radar-pill mom-${it.momentum}">${RADAR_MOM_GLYPH[it.momentum] || ''} ${esc(ML[it.momentum] || it.momentum)}</span><span class="radar-pill cross">${esc(CL[it.crossover] || it.crossover)}</span><span class="kb-flag ${v.cls}" title="${esc(v.tip)}">${v.emoji} ${esc(v.label)}</span></div>
        <div class="radar-c-b">${esc(it.blurb)}</div>
        <div class="radar-c-sci">🔬 ${esc(it.science)}</div>
        <div class="radar-c-meta">📅 ${esc(t('radarSince'))} ${esc(it.since)} · 🛰️ ${esc(it.methodology)}</div>
        <button class="kb-step-shop radar-c-shop" data-seed="${esc(it.aliSeed || 'korean skincare')}">🛒 ${esc(t('shopFor'))}</button>
      </div>`;
    }).join('');
    box.innerHTML = `
      ${personalToggleHTML()}
      <div class="radar-chart-wrap">${svg}</div>
      <div class="radar-legend">${Object.keys(SL).map(k => `<span class="radar-leg ${RADAR_STAGE_CLS[k] || ''}">${esc(SL[k])}</span>`).join('')}</div>
      <div class="radar-meta-note">🛰️ ${esc(t('reviewedOn'))} ${esc(R.updatedAt || '')} · ${esc(R.methodology || '')}</div>
      <div class="radar-cards">${cards}</div>`;
    wireTrendToggle(box);
    $$('.radar-dot', box).forEach(g => {
      const go = () => { const c = $('#kb-radar-c-' + g.dataset.i); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1200); } };
      g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    $$('.radar-c-shop', box).forEach(b => b.addEventListener('click', () => { loadShop(b.dataset.seed); jumpTo('#kb-shop'); }));
  }

  // ── Trend Evidence Ledger (#2): graded, dated, sourced trend reads ──────────
  function renderLedger() {
    const box = $('#kb-ledger-box'); if (!box) return;
    const V = (window.KBEAUTY_BOARD_CONFIG || {}).verdicts || {};
    const CITES = window.KBEAUTY_CITATIONS || {};
    const reviewed = window.KBEAUTY_TRENDS_REVIEWED || '';
    const used = {}; const order = [];
    const rows = TRENDS.map(tr => {
      const v = V[tr.verdict] || { emoji: '', label: tr.verdict, cls: 'note', tip: '' };
      let sup = '';
      if (tr.cite && CITES[tr.cite]) {
        if (!(tr.cite in used)) { order.push(tr.cite); used[tr.cite] = order.length; }
        sup = `<a class="ledger-cite" href="#kb-ledger-src-${esc(tr.cite)}">[${used[tr.cite]}]</a>`;
      }
      return `<div class="ledger-row">
        <div class="ledger-h"><span class="ledger-em" aria-hidden="true">${tr.emoji || '✨'}</span><span class="ledger-t">${esc(tr.title)}</span><span class="kb-flag ${v.cls}" title="${esc(v.tip)}">${v.emoji} ${esc(v.label)}</span></div>
        <div class="ledger-sci">${esc(tr.science || tr.blurb || '')} ${sup}</div>
      </div>`;
    }).join('');
    const sources = order.map((cid, i) => { const c = CITES[cid]; return `<li id="kb-ledger-src-${esc(cid)}"><span class="src-n">[${i + 1}]</span> <a href="${esc(c.url)}" target="_blank" rel="nofollow noopener">${esc(c.label)} ↗</a></li>`; }).join('');
    box.innerHTML = `
      <div class="ledger-meta">🔬 ${esc(t('reviewedOn'))} ${esc(reviewed)} · <a class="ledger-method" id="kb-ledger-method" role="button" tabindex="0">${esc(t('howWeGrade'))}</a></div>
      <div class="ledger-list">${rows}</div>
      <div class="gs-block" style="margin-top:8px"><div class="gs-h">📚 ${esc(t('sources'))}</div><ol class="ledger-sources">${sources}</ol></div>
      <div class="funnel-disc">${esc((window.KBEAUTY_BOARD_CONFIG || {}).disclosure || '')}</div>`;
    const m = $('#kb-ledger-method'); if (m) m.addEventListener('click', () => jumpTo('#kb-trust'));
  }

  // ── SkinTok Reality Check (#4): fast viral-claim vs evidence watchlist ──────
  const VIRAL_VEL_CLS = { spiking:'vel-spike', steady:'vel-steady', cooling:'vel-cool' };
  function renderViral() {
    const box = $('#kb-viral-box'); const D = window.KBEAUTY_VIRALCHECK; if (!box || !D) return;
    const V = (window.KBEAUTY_BOARD_CONFIG || {}).verdicts || {}; const VL = D.velocityLabels || {};
    const cards = personalFilter(D.items || [], 'viral').map(it => {
      const v = V[it.verdict] || { emoji:'', label:it.verdict, cls:'note', tip:'' };
      return `<div class="viral-card">
        <div class="viral-h"><span class="viral-em" aria-hidden="true">${it.emoji || '🔥'}</span><span class="viral-t">${esc(it.label)}</span><span class="viral-vel ${VIRAL_VEL_CLS[it.velocity] || ''}">${esc(VL[it.velocity] || it.velocity || '')}</span></div>
        <div class="viral-claim">“${esc(it.claim)}”</div>
        <div><span class="kb-flag ${v.cls}" title="${esc(v.tip)}">${v.emoji} ${esc(v.label)}</span></div>
        <div class="viral-read">${esc(it.science)}</div>
        ${it.note ? `<div class="viral-note">⚠️ ${esc(it.note)}</div>` : ''}
        <div class="viral-meta">📅 ${esc(t('radarSince'))} ${esc(it.since)}</div>
      </div>`;
    }).join('');
    box.innerHTML = `<div class="radar-meta-note">🔬 ${esc(t('reviewedOn'))} ${esc(D.updatedAt || '')} · <a class="ledger-method" id="kb-viral-method" role="button" tabindex="0">${esc(t('howWeGrade'))}</a></div><div class="viral-grid">${cards}</div>`;
    const m = $('#kb-viral-method'); if (m) m.addEventListener('click', () => jumpTo('#kb-trust'));
  }

  // ── Beauty-Science & Safety Desk (#5): curated authoritative sources ────────
  function renderNewsdesk() {
    const box = $('#kb-news-box'); const D = window.KBEAUTY_NEWSWIRE; if (!box || !D) return;
    const rows = (D.items || []).map(it => `<a class="news-row" href="${esc(it.url)}" target="_blank" rel="noopener nofollow">
      <span class="news-em" aria-hidden="true">${it.emoji || '📰'}</span>
      <span class="news-body"><span class="news-t">${esc(it.title)}</span><span class="news-src">${esc(it.source)} ↗</span><span class="news-d">${esc(it.desc)}</span></span></a>`).join('');
    box.innerHTML = `<div class="radar-meta-note">🗞️ ${esc(t('newsNote'))}</div><div class="news-list">${rows}</div>`;
  }

  // ── Korea-source provenance (#8): named, dated, never scraped ───────────────
  function renderKrSources() {
    const box = $('#kb-krsrc-box'); const D = window.KBEAUTY_KR_SOURCES; if (!box || !D) return;
    const rows = (D.items || []).map(it => `<a class="krsrc-row" href="${esc(it.url)}" target="_blank" rel="noopener nofollow">
      <span class="krsrc-em" aria-hidden="true">${it.emoji || '🇰🇷'}</span><span class="krsrc-body"><span class="krsrc-n">${esc(it.name)} ↗</span><span class="krsrc-d">${esc(it.desc)}</span></span>
      <span class="krsrc-date">${esc(t('lastRead'))} ${esc(it.lastRead || '')}</span></a>`).join('');
    box.innerHTML = `<div class="radar-meta-note">🇰🇷 ${esc(t('krSrcNote'))}</div><div class="krsrc-list">${rows}</div>`;
  }

  // ── Methodology & E-E-A-T Trust Center (#3) ────────────────────────────────
  function renderTrust() {
    const box = $('#kb-trust-box'); const D = window.KBEAUTY_TRUST; if (!box || !D) return;
    const upd = [
      ['🛰️', t('radarSecShort'), (window.KBEAUTY_RADAR || {}).updatedAt],
      ['🔬', t('ledgerSecShort'), window.KBEAUTY_TRENDS_REVIEWED],
      ['🔥', t('viralSecShort'), (window.KBEAUTY_VIRALCHECK || {}).updatedAt],
      ['🏆', t('boardSecShort'), (window.KBEAUTY_BESTSELLERS || {}).updated],
    ].filter(r => r[2]).map(r => `<tr><td>${r[0]} ${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('');
    const items = (D.items || []).map(it => `<details class="trust-item"${it.id === 'how' ? ' open' : ''}><summary>${esc(it.title)}</summary><div class="trust-b">${esc(it.body)}</div></details>`).join('');
    box.innerHTML = `
      <div class="trust-by">✍️ ${esc(t('authoredBy'))} <b>${esc(D.author || '')}</b> · 🔄 ${esc(t('reviewedOn'))} ${esc(D.updatedAt || '')}</div>
      ${items}
      <div class="gs-block" style="margin-top:8px"><div class="gs-h">🗓️ ${esc(t('lastUpdatedTable'))}</div><table class="trust-table"><tbody>${upd}</tbody></table></div>`;
  }

  // ── Quarterly Trend Report + share (#10) ───────────────────────────────────
  function renderReport() {
    const box = $('#kb-report-box'); const R = window.KBEAUTY_REPORT; if (!box || !R) return;
    const RAD = window.KBEAUTY_RADAR || { items: [] }; const VC = window.KBEAUTY_VIRALCHECK || { items: [] };
    const CL = RAD.crossoverLabels || {};
    const movers = (RAD.items || []).filter(it => it.momentum === 'up').slice(0, 6);
    const skips = (VC.items || []).filter(it => it.verdict === 'hype').slice(0, 4);
    const moverHTML = movers.map(it => `<li><b>${it.emoji || ''} ${esc(it.label)}</b> — ${esc(CL[it.crossover] || '')}</li>`).join('');
    const skipHTML = skips.map(it => `<li><b>${it.emoji || ''} ${esc(it.label)}</b> — ${esc((it.science || '').slice(0, 90))}…</li>`).join('');
    box.innerHTML = `
      <div class="report-card">
        <div class="report-q">📅 ${esc(R.quarter || '')} · 🔄 ${esc(R.updatedAt || '')}</div>
        <p class="report-intro">${esc(R.intro || '')}</p>
        <div class="gs-block"><div class="gs-h">📈 ${esc(t('topMovers'))}</div><ul class="report-list">${moverHTML}</ul></div>
        <div class="gs-block"><div class="gs-h">🚫 ${esc(t('skipList'))}</div><ul class="report-list">${skipHTML}</ul></div>
        <button class="kb-shelf-cta" id="kb-report-share">📤 ${esc(t('shareReport'))}</button>
      </div>`;
    const sh = $('#kb-report-share'); if (sh) sh.addEventListener('click', () => {
      const R2 = window.KBEAUTY_REPORT || {}; const url = 'https://koreaplus-lifes.com/kbeauty' + (lang !== 'en' ? '?lang=' + lang : '');
      const text = `${R2.quarter || ''} — ${t('quarterReport')} · KoreaPlus`;
      if (navigator.share) { navigator.share({ title: text, text: R2.intro || text, url }).catch(() => {}); }
      else { try { navigator.clipboard.writeText(url); toast(t('copied')); } catch {} }
    });
  }

  // ── Per-language discoverability (#7): localized ItemList JSON-LD ───────────
  function injectTrendSchema() {
    try {
      const RAD = window.KBEAUTY_RADAR || { items: [] };
      const data = {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: 'K-Beauty Trend Radar — Seoul vs the World',
        numberOfItems: (RAD.items || []).length,
        itemListElement: (RAD.items || []).map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label })),
      };
      const s = document.createElement('script'); s.type = 'application/ld+json'; s.text = JSON.stringify(data); document.head.appendChild(s);
    } catch { /* schema is best-effort */ }
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  async function boot() {
    await loadContent();   // per-language content overlay (English fallback)
    localizeData();
    localizeNewData();     // localize the new top-10 datasets (window.KBEAUTY_*)
    renderTopAds();        // localized AliExpress + AdSense (kept inline: monetization + avoids CLS)
    renderTicker();        // top trends ticker (always visible)
    // Defer non-visual work (SEO JSON-LD + analytics) off the boot critical path → better INP/TBT.
    const _idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
    _idle(function () {
      try { injectTrendSchema(); } catch (e) {}                                       // #7 localized ItemList JSON-LD (SEO)
      try { kbtrack('kbeauty_view', { lang }); } catch (e) {}                          // #2 funnel
      try { observeImpression('#kb-topads', 'aff_strip_impression', { lang }); } catch (e) {} // ad-strip view → CTR denominator
      try { observeImpression('#kb-shop', 'shop_impression', { lang }); } catch (e) {}
    });
    // Per-section renderers now run lazily the first time their category opens
    // (see ensureCatRendered) — boot only builds the landing chrome, ticker & ads.
    wireFilters();
    showShareFab();
    initUX();   // modern UX layer: search, back-to-top, progress, bottom-nav, toast, recent, reveal, haptics

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
