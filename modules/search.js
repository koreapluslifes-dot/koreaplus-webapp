/* KoreaPlus Search — Fuse.js fuzzy search, Cmd/Ctrl+K */
(function () {
  const FUSE_CDN = 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js';
  const RECENT_KEY = 'kp_recent_search';
  const MAX_RECENT = 6;

  // ── Static search index ─────────────────────────────────────────────────────
  const INDEX = [
    // Pages
    { title: 'AI Itinerary Builder', sub: 'Create your personalized Korea trip plan', icon: '🗺️', tag: 'Tool', url: 'plan.html' },
    { title: 'Korea Festivals 2025', sub: 'Events, cultural festivals & seasonal highlights', icon: '📅', tag: 'Page', url: 'festivals.html' },
    { title: 'Korean Culture', sub: 'Hanbok, jjimjilbang, norebang, traditional customs', icon: '🏛️', tag: 'Page', url: 'culture.html' },
    { title: 'Korean Temples', sub: 'Buddhist temples, temple stays, mountain retreats', icon: '🛕', tag: 'Page', url: 'temples.html' },
    { title: 'Korea Night Views', sub: 'Best nightscapes in Seoul, Busan and beyond', icon: '🌃', tag: 'Page', url: 'nightviews.html' },
    { title: 'About KoreaPlus', sub: 'Our mission and story', icon: 'ℹ️', tag: 'Info', url: 'about.html' },
    { title: 'Privacy Policy', sub: 'How we handle your data', icon: '🔒', tag: 'Legal', url: 'privacy.html' },
    { title: 'Contact Us', sub: 'Get in touch with KoreaPlus', icon: '✉️', tag: 'Info', url: 'contact.html' },
    // Food
    { title: 'Bibimbap', sub: 'Mixed rice bowl with vegetables and gochujang', icon: '🍚', tag: 'Food', url: '#food' },
    { title: 'Korean BBQ — Samgyeopsal', sub: 'Grilled pork belly, Korea\'s most popular BBQ', icon: '🥩', tag: 'Food', url: '#food' },
    { title: 'Tteokbokki', sub: 'Spicy rice cakes, Korea\'s favourite street food', icon: '🌶️', tag: 'Food', url: '#food' },
    { title: 'Kimchi Jjigae', sub: 'Kimchi stew — the ultimate Korean comfort food', icon: '🍲', tag: 'Food', url: '#food' },
    { title: 'Ramyeon', sub: 'Korean instant noodles — way better than you think', icon: '🍜', tag: 'Food', url: '#food' },
    { title: 'Japchae', sub: 'Glass noodles with vegetables and sesame', icon: '🍝', tag: 'Food', url: '#food' },
    { title: 'Galbi', sub: 'Grilled short ribs — smoky, sweet, and tender', icon: '🍖', tag: 'Food', url: '#food' },
    { title: 'Sundubu Jjigae', sub: 'Soft tofu stew, spicy and warming', icon: '🍛', tag: 'Food', url: '#food' },
    { title: 'Kimbap', sub: 'Korean seaweed rice rolls — the original fast food', icon: '🍱', tag: 'Food', url: '#food' },
    { title: 'Gwangjang Market', sub: 'Seoul\'s best traditional food market', icon: '🏪', tag: 'Market', url: '#food' },
    { title: 'Korean Fried Chicken', sub: 'Chimaek culture — fried chicken & beer', icon: '🍗', tag: 'Food', url: '#food' },
    { title: 'Hotteok', sub: 'Sweet pancake with cinnamon sugar filling', icon: '🥞', tag: 'Food', url: '#food' },
    // Travel
    { title: 'Seoul', sub: 'Korea\'s capital — palaces, K-pop, street food & more', icon: '🏙️', tag: 'City', url: '#travel' },
    { title: 'Busan', sub: 'Coastal city — Haeundae Beach, temples, seafood', icon: '🌊', tag: 'City', url: '#travel' },
    { title: 'Jeju Island', sub: 'Volcanic island — Hallasan, beaches, lava caves', icon: '🌋', tag: 'Island', url: '#travel' },
    { title: 'Gyeongju', sub: 'Ancient Silla kingdom capital — open-air museum', icon: '🏛️', tag: 'City', url: '#travel' },
    { title: 'Jeonju', sub: 'Hanok village & Korea\'s best bibimbap', icon: '🏘️', tag: 'City', url: '#travel' },
    { title: 'Gyeongbokgung Palace', sub: 'Seoul\'s grandest Joseon-era royal palace', icon: '🏯', tag: 'Attraction', url: '#travel' },
    { title: 'Bukchon Hanok Village', sub: '600-year-old traditional house village in Seoul', icon: '🏘️', tag: 'Attraction', url: '#travel' },
    { title: 'Nami Island', sub: 'Half-moon island famous from K-drama Winter Sonata', icon: '🍂', tag: 'Nature', url: '#travel' },
    { title: 'Seongsan Ilchulbong', sub: 'Jeju volcanic crater — best sunrise view', icon: '🌅', tag: 'Nature', url: '#travel' },
    { title: 'Gamcheon Culture Village', sub: 'Busan\'s colourful hillside art village', icon: '🎨', tag: 'Attraction', url: '#travel' },
    { title: 'Seoraksan National Park', sub: 'Stunning mountain hiking, spectacular autumn foliage', icon: '🏔️', tag: 'Nature', url: '#travel' },
    { title: 'Myeongdong', sub: 'Seoul\'s busiest shopping and K-beauty district', icon: '🛍️', tag: 'District', url: '#shopping' },
    { title: 'Hongdae', sub: 'Seoul\'s indie arts & nightlife hub — free concerts', icon: '🎵', tag: 'District', url: '#travel' },
    { title: 'Insadong', sub: 'Traditional crafts, galleries, and tea houses', icon: '🎭', tag: 'District', url: '#shopping' },
    { title: 'Dongdaemun DDP', sub: '24-hour fashion wholesale & iconic architecture', icon: '🏗️', tag: 'Shopping', url: '#shopping' },
    { title: 'COEX Mall', sub: 'Underground megamall with the famous Starfield Library', icon: '📚', tag: 'Shopping', url: '#shopping' },
    { title: 'Namdaemun Market', sub: 'Largest traditional market in Korea', icon: '🏪', tag: 'Market', url: '#shopping' },
    // Transport
    { title: 'KTX Bullet Train', sub: 'Seoul to Busan in 2h 20min at 300km/h', icon: '🚄', tag: 'Transport', url: '#transport' },
    { title: 'T-money Card', sub: 'Rechargeable transit card for subway, bus & taxi', icon: '💳', tag: 'Transport', url: '#transport' },
    { title: 'Seoul Metro', sub: '23 lines, 700+ stations — cleanest subway in Asia', icon: '🚇', tag: 'Transport', url: '#transport' },
    { title: 'Kakao T', sub: 'Korea\'s Uber — taxi app with English interface', icon: '🚕', tag: 'Transport', url: '#transport' },
    { title: 'Incheon Airport (ICN)', sub: 'Korea\'s main international airport, 60km from Seoul', icon: '✈️', tag: 'Airport', url: '#transport' },
    { title: 'Gimpo Airport (GMP)', sub: 'Domestic and short-haul flights, closer to Seoul', icon: '✈️', tag: 'Airport', url: '#transport' },
    // K-Beauty
    { title: 'K-Beauty Skincare', sub: 'Sheet masks, essences, 10-step routine explained', icon: '💄', tag: 'Beauty', url: '#kbeauty' },
    { title: 'Olive Young', sub: 'Korea\'s top beauty drugstore chain', icon: '🛒', tag: 'Beauty', url: '#kbeauty' },
    { title: 'Innisfree', sub: 'Jeju-inspired natural beauty brand', icon: '🌿', tag: 'Brand', url: '#kbeauty' },
    { title: 'COSRX', sub: 'Cult-favourite skincare for acne & hydration', icon: '💊', tag: 'Brand', url: '#kbeauty' },
    { title: 'Laneige', sub: 'Premium hydration — famous lip sleeping mask', icon: '✨', tag: 'Brand', url: '#kbeauty' },
    { title: 'Sunscreen in Korea', sub: 'Why Koreans use SPF 50+ daily', icon: '☀️', tag: 'Beauty', url: '#kbeauty' },
    { title: 'Snail Mucin', sub: 'Korea\'s most iconic skincare ingredient', icon: '🐌', tag: 'Ingredient', url: '#kbeauty' },
    // K-Pop
    { title: 'BTS', sub: 'HYBE\'s global superstars — world\'s biggest boy band', icon: '🎤', tag: 'Artist', url: '#kpop' },
    { title: 'BLACKPINK', sub: 'YG Entertainment\'s global girl group', icon: '🎤', tag: 'Artist', url: '#kpop' },
    { title: 'TWICE', sub: 'JYP Entertainment\'s 9-member girl group', icon: '🎤', tag: 'Artist', url: '#kpop' },
    { title: 'aespa', sub: 'SM Entertainment\'s AI-concept girl group', icon: '🎤', tag: 'Artist', url: '#kpop' },
    { title: 'HYBE Insight Museum', sub: 'BTS interactive museum in Seoul', icon: '🏛️', tag: 'Attraction', url: '#kpop' },
    { title: 'Melon Music Awards', sub: 'Korea\'s biggest music awards ceremony', icon: '🏆', tag: 'Event', url: '#kpop' },
    { title: 'SM Town COEX Artium', sub: 'SM Entertainment\'s flagship K-pop store in Seoul', icon: '🎶', tag: 'Attraction', url: '#kpop' },
    // History & Culture
    { title: 'Hangeul Alphabet', sub: 'Korea\'s scientific writing system, created in 1443', icon: '🔤', tag: 'Culture', url: '#history' },
    { title: 'Hanbok', sub: 'Traditional Korean dress — try it at palaces for free entry', icon: '👘', tag: 'Culture', url: '#history' },
    { title: 'Jjimjilbang', sub: 'Korean 24-hour public bathhouse & sauna', icon: '🧖', tag: 'Experience', url: '#travel' },
    { title: 'Norebang', sub: 'Korean private karaoke rooms — essential nightlife', icon: '🎤', tag: 'Experience', url: '#travel' },
    { title: 'PC Bang', sub: 'Premium gaming cafes — Korea\'s unique gaming culture', icon: '🎮', tag: 'Experience', url: '#travel' },
    { title: 'Joseon Dynasty', sub: 'Korea\'s 500-year dynasty that built Seoul\'s palaces', icon: '📜', tag: 'History', url: '#history' },
    { title: 'Haeinsa Temple', sub: 'UNESCO site housing the Tripitaka Koreana wood blocks', icon: '⛩️', tag: 'Temple', url: 'temples.html' },
    { title: 'Bulguksa Temple', sub: 'Gyeongju\'s jewel — UNESCO World Heritage temple', icon: '🛕', tag: 'Temple', url: 'temples.html' },
    { title: 'Jogyesa Temple', sub: 'Seoul\'s main Buddhist temple in Insadong', icon: '🛕', tag: 'Temple', url: 'temples.html' },
    // Practical
    { title: 'Pocket WiFi vs SIM', sub: 'Best internet options for Korea visitors', icon: '📡', tag: 'Practical', url: '#transport' },
    { title: 'Tipping in Korea', sub: 'Tipping culture — spoiler: you don\'t need to', icon: '💰', tag: 'Practical', url: '#travel' },
    { title: 'Bowing Etiquette', sub: 'How and when to bow in Korean culture', icon: '🙇', tag: 'Culture', url: '#history' },
    { title: 'Korean Phrases', sub: '20 essential phrases for your Korea trip', icon: '💬', tag: 'Language', url: '#travel' },
    { title: 'Currency & Payments', sub: 'Korean Won, ATMs, credit cards explained', icon: '💱', tag: 'Practical', url: '#transport' },
  ];

  let fuse = null;
  let fuseLoaded = false;
  let searchOverlay = null;
  let searchInput   = null;
  let resultsEl     = null;
  let currentFocus  = -1;

  // ── Load Fuse.js ────────────────────────────────────────────────────────────
  function loadFuse() {
    return new Promise((resolve, reject) => {
      if (window.Fuse) { resolve(); return; }
      const s = document.createElement('script');
      s.src = FUSE_CDN;
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initFuse() {
    fuse = new window.Fuse(INDEX, {
      keys: ['title', 'sub', 'tag'],
      threshold: 0.35,
      includeScore: true,
      minMatchCharLength: 2,
    });
    fuseLoaded = true;
  }

  // ── Recent searches ─────────────────────────────────────────────────────────
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }
  function addRecent(term) {
    const r = [term, ...getRecent().filter(t => t !== term)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(r));
  }

  // ── Render results ──────────────────────────────────────────────────────────
  function renderItem(item, isRecent = false) {
    const div = document.createElement('div');
    div.className = 'kp-search-item';
    div.setAttribute('role', 'option');
    div.tabIndex = 0;
    div.innerHTML =
      '<span class="si-icon">' + item.icon + '</span>' +
      '<div class="si-body">' +
        '<div class="si-title">' + item.title + '</div>' +
        '<div class="si-sub">' + item.sub + '</div>' +
      '</div>' +
      '<span class="si-tag">' + item.tag + '</span>';
    div.addEventListener('click', () => navigateTo(item, isRecent ? false : true));
    div.addEventListener('keydown', e => { if (e.key === 'Enter') navigateTo(item, true); });
    return div;
  }

  function navigateTo(item, saveRecent) {
    if (saveRecent && searchInput?.value.trim()) addRecent(searchInput.value.trim());
    if (window.kpAnalytics) window.kpAnalytics.track('search_performed', { query: searchInput?.value, result: item.title });
    closeSearch();
    if (item.url.startsWith('#')) {
      const cat = item.url.slice(1);
      // Try to activate category tab
      const tab = document.querySelector('[data-cat="' + cat + '"]');
      if (tab) { tab.click(); tab.scrollIntoView({ behavior: 'smooth' }); }
      else window.location.hash = item.url;
    } else {
      window.location.href = item.url;
    }
  }

  function render(query) {
    if (!resultsEl) return;
    resultsEl.innerHTML = '';
    currentFocus = -1;

    if (!query.trim()) {
      const recent = getRecent();
      if (!recent.length) {
        resultsEl.innerHTML = '<div class="kp-search-empty">Start typing to search</div>';
        return;
      }
      const label = document.createElement('div');
      label.className = 'kp-search-section';
      label.textContent = window.kpI18n?.t('search.recent') || 'Recent searches';
      resultsEl.appendChild(label);
      recent.forEach(term => {
        const fakeItem = { title: term, sub: '', icon: '🕐', tag: 'Recent', url: '#' };
        const el = renderItem(fakeItem, true);
        el.addEventListener('click', e => {
          e.preventDefault();
          if (searchInput) { searchInput.value = term; render(term); }
        });
        resultsEl.appendChild(el);
      });
      return;
    }

    if (!fuseLoaded) {
      resultsEl.innerHTML = '<div class="kp-search-empty">Loading…</div>';
      return;
    }

    const results = fuse.search(query).slice(0, 10);
    if (!results.length) {
      resultsEl.innerHTML = '<div class="kp-search-empty">' + (window.kpI18n?.t('search.no_results') || 'No results found') + '</div>';
      return;
    }

    const label = document.createElement('div');
    label.className = 'kp-search-section';
    label.textContent = 'Results';
    resultsEl.appendChild(label);
    results.forEach(r => resultsEl.appendChild(renderItem(r.item)));
  }

  // ── Keyboard navigation in results ─────────────────────────────────────────
  function moveFocus(dir) {
    const items = resultsEl?.querySelectorAll('.kp-search-item') || [];
    if (!items.length) return;
    items[currentFocus]?.classList.remove('focused');
    currentFocus = (currentFocus + dir + items.length) % items.length;
    const focused = items[currentFocus];
    focused.classList.add('focused');
    focused.scrollIntoView({ block: 'nearest' });
    if (dir !== 0) searchInput.value = focused.querySelector('.si-title')?.textContent || searchInput.value;
  }

  // ── Open / close ────────────────────────────────────────────────────────────
  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add('open');
    searchInput?.focus();
    render('');
  }

  function closeSearch() {
    searchOverlay?.classList.remove('open');
    if (searchInput) searchInput.value = '';
  }

  // ── Build the modal ─────────────────────────────────────────────────────────
  function buildModal() {
    searchOverlay = document.createElement('div');
    searchOverlay.id = 'kp-search-overlay';
    searchOverlay.className = 'kp-search-overlay';
    searchOverlay.setAttribute('role', 'dialog');
    searchOverlay.setAttribute('aria-label', 'Search');
    searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });

    const box = document.createElement('div');
    box.className = 'kp-search-box';

    const inputRow = document.createElement('div');
    inputRow.className = 'kp-search-input-row';

    searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'kp-search-input';
    searchInput.setAttribute('data-i18n-placeholder', 'search.placeholder');
    searchInput.placeholder = 'Search places, food, tips… (⌘K)';
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.setAttribute('aria-label', 'Search KoreaPlus');

    searchInput.addEventListener('input', () => render(searchInput.value));
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); moveFocus(-1); }
      if (e.key === 'Enter') {
        const focused = resultsEl?.querySelector('.kp-search-item.focused');
        focused?.click();
      }
      if (e.key === 'Escape') closeSearch();
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'kp-search-close';
    closeBtn.textContent = 'Esc';
    closeBtn.setAttribute('aria-label', 'Close search');
    closeBtn.addEventListener('click', closeSearch);

    inputRow.innerHTML = '<span class="search-icon" aria-hidden="true">🔍</span>';
    inputRow.appendChild(searchInput);
    inputRow.appendChild(closeBtn);

    resultsEl = document.createElement('div');
    resultsEl.className = 'kp-search-results';
    resultsEl.setAttribute('role', 'listbox');

    box.appendChild(inputRow);
    box.appendChild(resultsEl);
    searchOverlay.appendChild(box);
    document.body.appendChild(searchOverlay);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    buildModal();

    // Load Fuse.js eagerly
    loadFuse().then(initFuse).catch(console.error);

    // Wire up search trigger buttons
    document.querySelectorAll('.kp-search-btn, [data-action="search"]').forEach(btn => {
      btn.addEventListener('click', openSearch);
    });

    // Keyboard shortcut Cmd/Ctrl + K
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOverlay?.classList.contains('open')) closeSearch();
        else openSearch();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.kpSearch = { open: openSearch, close: closeSearch };
})();
