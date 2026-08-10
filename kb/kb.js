/* kb.js — shared runtime for every K-Beauty library page (referenced once from shell()).
   Powers, on all 2,055 pages × 14 languages: instant library search, per-page language
   switcher, auto table-of-contents + reading progress, read-aloud (TTS), accessibility
   toolbar, profile-aware banner, save/recently-viewed, and print. Pure client, no keys.
   Every feature is feature-detected + try/caught so one failure never breaks the page. */
(function () {
  'use strict';
  var D = document, W = window, root = D.documentElement;
  var LANG = (root.getAttribute('lang') || 'en').slice(0, 2);
  var RTL = root.getAttribute('dir') === 'rtl';
  var LS = (function () { try { var k = '__kb'; localStorage.setItem(k, 1); localStorage.removeItem(k); return localStorage; } catch (e) { return null; } })();
  var get = function (k) { try { return LS && LS.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { LS && LS.setItem(k, v); } catch (e) { } };
  var kbh = D.querySelector('.kbh'), main = D.getElementById('main') || D.querySelector('.w');
  // Q1: full 14-language runtime UI. Inline per-call maps win, then the generated
  // EXTRA pack (keyed by the English source string), then English.
  var EXTRA = /*L10N-START*/{"ko":{"Search 2,000+ K-beauty guides…":"2,000개 이상의 K-뷰티 가이드 검색…","No matches":"검색 결과 없음","Language":"언어","Read-aloud is not supported in this browser.":"이 브라우저에서는 읽어주기 기능이 지원되지 않습니다.","Text & accessibility":"텍스트 및 접근성","Text size":"글자 크기","Comfortable spacing":"넉넉한 간격","Dyslexia-friendly font":"난독증 친화 글꼴","High contrast":"고대비","Back to top":"맨 위로","Theme":"테마","Auto":"자동","Light":"라이트","Dark":"다크","Continue your journey":"이어서 보기","Recently viewed":"최근 본 글","Saved":"저장됨"},"ja":{"Search 2,000+ K-beauty guides…":"2,000件以上のK-beautyガイドを検索…","No matches":"該当する結果がありません","Language":"言語","Read-aloud is not supported in this browser.":"このブラウザは読み上げに対応していません。","Text & accessibility":"テキストとアクセシビリティ","Text size":"文字サイズ","Comfortable spacing":"ゆったり行間","Dyslexia-friendly font":"ディスレクシア対応フォント","High contrast":"ハイコントラスト","Back to top":"トップへ戻る","Theme":"テーマ","Auto":"自動","Light":"ライト","Dark":"ダーク","Continue your journey":"続きから読む","Recently viewed":"最近見たページ","Saved":"保存しました"},"zh":{"Search 2,000+ K-beauty guides…":"搜索 2,000+ 篇 K-beauty 指南…","No matches":"无匹配结果","Language":"语言","Read-aloud is not supported in this browser.":"当前浏览器不支持朗读功能。","Text & accessibility":"文字与无障碍","Text size":"字号","Comfortable spacing":"舒适间距","Dyslexia-friendly font":"阅读障碍友好字体","High contrast":"高对比度","Back to top":"返回顶部","Theme":"主题","Auto":"自动","Light":"浅色","Dark":"深色","Continue your journey":"继续探索","Recently viewed":"最近浏览","Saved":"已收藏"},"es":{"Search 2,000+ K-beauty guides…":"Busca entre más de 2.000 guías de K-beauty…","No matches":"Sin resultados","Language":"Idioma","Read-aloud is not supported in this browser.":"La lectura en voz alta no es compatible con este navegador.","Text & accessibility":"Texto y accesibilidad","Text size":"Tamaño del texto","Comfortable spacing":"Espaciado cómodo","Dyslexia-friendly font":"Fuente adaptada para dislexia","High contrast":"Alto contraste","Back to top":"Volver arriba","Theme":"Tema","Auto":"Auto","Light":"Claro","Dark":"Oscuro","Continue your journey":"Continúa tu recorrido","Recently viewed":"Vistos recientemente","Saved":"Guardado"},"fr":{"Search 2,000+ K-beauty guides…":"Rechercher parmi plus de 2 000 guides K-beauty…","No matches":"Aucun résultat","Language":"Langue","Read-aloud is not supported in this browser.":"La lecture à voix haute n'est pas prise en charge par ce navigateur.","Text & accessibility":"Texte et accessibilité","Text size":"Taille du texte","Comfortable spacing":"Espacement confortable","Dyslexia-friendly font":"Police adaptée à la dyslexie","High contrast":"Contraste élevé","Back to top":"Retour en haut","Theme":"Thème","Auto":"Auto","Light":"Clair","Dark":"Sombre","Continue your journey":"Poursuivez votre parcours","Recently viewed":"Consultés récemment","Saved":"Enregistré"},"de":{"Search 2,000+ K-beauty guides…":"2.000+ K-Beauty-Guides durchsuchen…","No matches":"Keine Treffer","Language":"Sprache","Read-aloud is not supported in this browser.":"Vorlesen wird in diesem Browser nicht unterstützt.","Text & accessibility":"Text & Barrierefreiheit","Text size":"Textgröße","Comfortable spacing":"Komfortable Abstände","Dyslexia-friendly font":"Legasthenie-freundliche Schrift","High contrast":"Hoher Kontrast","Back to top":"Nach oben","Theme":"Design","Auto":"Auto","Light":"Hell","Dark":"Dunkel","Continue your journey":"Weiter geht's","Recently viewed":"Zuletzt angesehen","Saved":"Gespeichert"},"pt":{"Search 2,000+ K-beauty guides…":"Pesquise em mais de 2.000 guias de K-beauty…","No matches":"Nenhum resultado","Language":"Idioma","Read-aloud is not supported in this browser.":"Este navegador não oferece suporte à leitura em voz alta.","Text & accessibility":"Texto e acessibilidade","Text size":"Tamanho do texto","Comfortable spacing":"Espaçamento confortável","Dyslexia-friendly font":"Fonte amigável para dislexia","High contrast":"Alto contraste","Back to top":"Voltar ao topo","Theme":"Tema","Auto":"Automático","Light":"Claro","Dark":"Escuro","Continue your journey":"Continue sua jornada","Recently viewed":"Vistos recentemente","Saved":"Salvo"},"id":{"Search 2,000+ K-beauty guides…":"Cari 2.000+ panduan K-beauty…","No matches":"Tidak ada hasil","Language":"Bahasa","Read-aloud is not supported in this browser.":"Fitur baca nyaring tidak didukung di browser ini.","Text & accessibility":"Teks & aksesibilitas","Text size":"Ukuran teks","Comfortable spacing":"Spasi nyaman","Dyslexia-friendly font":"Font ramah disleksia","High contrast":"Kontras tinggi","Back to top":"Kembali ke atas","Theme":"Tema","Auto":"Otomatis","Light":"Terang","Dark":"Gelap","Continue your journey":"Lanjutkan perjalanan Anda","Recently viewed":"Terakhir dilihat","Saved":"Tersimpan"},"ar":{"Search 2,000+ K-beauty guides…":"ابحث في أكثر من 2,000 دليل K-beauty…","No matches":"لا توجد نتائج مطابقة","Language":"اللغة","Read-aloud is not supported in this browser.":"القراءة الصوتية غير مدعومة في هذا المتصفح.","Text & accessibility":"النص وإمكانية الوصول","Text size":"حجم النص","Comfortable spacing":"تباعد مريح","Dyslexia-friendly font":"خط ملائم لعُسر القراءة","High contrast":"تباين عالٍ","Back to top":"العودة إلى الأعلى","Theme":"المظهر","Auto":"تلقائي","Light":"فاتح","Dark":"داكن","Continue your journey":"واصل رحلتك","Recently viewed":"شوهد مؤخرًا","Saved":"تم الحفظ"},"hi":{"Search 2,000+ K-beauty guides…":"2,000+ K-beauty गाइड खोजें…","No matches":"कोई परिणाम नहीं","Language":"भाषा","Read-aloud is not supported in this browser.":"इस ब्राउज़र में पढ़कर सुनाने की सुविधा उपलब्ध नहीं है।","Text & accessibility":"टेक्स्ट और सुलभता","Text size":"टेक्स्ट का आकार","Comfortable spacing":"आरामदायक स्पेसिंग","Dyslexia-friendly font":"डिस्लेक्सिया-अनुकूल फ़ॉन्ट","High contrast":"उच्च कंट्रास्ट","Back to top":"ऊपर जाएँ","Theme":"थीम","Auto":"ऑटो","Light":"लाइट","Dark":"डार्क","Continue your journey":"अपनी यात्रा जारी रखें","Recently viewed":"हाल में देखे गए","Saved":"सहेजा गया"},"ru":{"Search 2,000+ K-beauty guides…":"Поиск по 2000+ гайдам K-beauty…","No matches":"Ничего не найдено","Language":"Язык","Read-aloud is not supported in this browser.":"Озвучивание текста не поддерживается в этом браузере.","Text & accessibility":"Текст и доступность","Text size":"Размер текста","Comfortable spacing":"Комфортные интервалы","Dyslexia-friendly font":"Шрифт для людей с дислексией","High contrast":"Высокая контрастность","Back to top":"Наверх","Theme":"Тема","Auto":"Авто","Light":"Светлая","Dark":"Тёмная","Continue your journey":"Продолжите путешествие","Recently viewed":"Недавно просмотренные","Saved":"Сохранено"},"vi":{"Search 2,000+ K-beauty guides…":"Tìm trong 2.000+ cẩm nang K-beauty…","No matches":"Không có kết quả","Language":"Ngôn ngữ","Read-aloud is not supported in this browser.":"Trình duyệt này không hỗ trợ đọc thành tiếng.","Text & accessibility":"Văn bản & trợ năng","Text size":"Cỡ chữ","Comfortable spacing":"Giãn cách thoải mái","Dyslexia-friendly font":"Phông chữ thân thiện với người khó đọc","High contrast":"Tương phản cao","Back to top":"Về đầu trang","Theme":"Giao diện","Auto":"Tự động","Light":"Sáng","Dark":"Tối","Continue your journey":"Tiếp tục hành trình của bạn","Recently viewed":"Đã xem gần đây","Saved":"Đã lưu"},"th":{"Search 2,000+ K-beauty guides…":"ค้นหาคู่มือ K-beauty กว่า 2,000 รายการ…","No matches":"ไม่พบผลลัพธ์","Language":"ภาษา","Read-aloud is not supported in this browser.":"เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง","Text & accessibility":"ตัวอักษรและการเข้าถึง","Text size":"ขนาดตัวอักษร","Comfortable spacing":"ระยะห่างสบายตา","Dyslexia-friendly font":"ฟอนต์สำหรับผู้มีภาวะดิสเล็กเซีย","High contrast":"ความคมชัดสูง","Back to top":"กลับขึ้นด้านบน","Theme":"ธีม","Auto":"อัตโนมัติ","Light":"สว่าง","Dark":"มืด","Continue your journey":"อ่านต่อจากที่ค้างไว้","Recently viewed":"ดูล่าสุด","Saved":"บันทึกแล้ว"}}/*L10N-END*/;
  var t = function (en, map) { return (map && map[LANG]) || (EXTRA[LANG] && EXTRA[LANG][en]) || en; };

  // ── styles (injected once) ────────────────────────────────────────────────
  try {
    // Colors route through the kb.css theme tokens (--bg/--card/--border/…) so the
    // runtime chrome follows light/dark exactly like the page does.
    var css = '.kbh-act{display:inline-flex;gap:6px;margin-left:auto;align-items:center}.kbh-lib{margin-left:0!important}'
      + '.kbh-btn{background:var(--card);border:1px solid var(--border);border-radius:9px;width:34px;height:34px;font-size:15px;cursor:pointer;color:var(--link);display:inline-flex;align-items:center;justify-content:center;padding:0}.kbh-btn:hover{background:var(--bg)}'
      + '.kb-ov{position:fixed;inset:0;background:rgba(20,10,20,.5);z-index:400;display:none;align-items:flex-start;justify-content:center;padding:60px 14px}.kb-ov.on{display:flex}'
      + '.kb-ovbox{background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:16px;width:100%;max-width:560px;max-height:80vh;overflow:auto;padding:16px;box-shadow:0 16px 48px rgba(0,0,0,.25)}'
      + '.kb-ovh{display:flex;align-items:center;gap:8px;margin-bottom:10px}.kb-ovh input{flex:1;font:inherit;font-size:16px;padding:11px 13px;border:2px solid var(--border);border-radius:12px;outline:none;background:var(--bg);color:var(--text)}.kb-ovh input:focus{border-color:#d61f6e}'
      + '.kb-x{border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:8px;width:34px;height:34px;font-size:16px;cursor:pointer;flex:0 0 auto}'
      + '.kb-res a{display:flex;gap:10px;align-items:center;padding:10px 8px;border-radius:9px;text-decoration:none;color:var(--text);border-bottom:1px solid var(--border2)}.kb-res a:hover{background:var(--card)}.kb-res .re{font-size:20px}.kb-res .rd{margin-left:auto;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase}'
      + '.kb-langgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.kb-langgrid a{display:flex;gap:8px;align-items:center;padding:11px 13px;border:1px solid var(--border);border-radius:11px;text-decoration:none;color:var(--text);font-weight:700;font-size:14px}.kb-langgrid a:hover{border-color:#d61f6e}.kb-langgrid a.cur{background:var(--card);border-color:#d61f6e;color:var(--link)}'
      + '.kb-a11y label{display:flex;justify-content:space-between;align-items:center;padding:9px 4px;border-bottom:1px solid var(--border2);font-size:14px;font-weight:600;gap:10px}.kb-a11y button{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:6px 12px;font:inherit;font-weight:700;cursor:pointer;color:var(--link)}.kb-a11y .grp{display:inline-flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.kb-a11y .grp button.on{background:#d61f6e;color:#fff;border-color:#d61f6e}'
      + '#kb-prog{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#d61f6e,#8b46d6);z-index:300;transition:width .1s}'
      + '.kb-toc{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 14px;margin:14px 0}.kb-toc summary{cursor:pointer;font-weight:800;color:var(--text);font-size:14px}.kb-toc a{display:block;padding:4px 0;color:var(--link);text-decoration:none;font-size:13.5px}.kb-toc a:hover{text-decoration:underline}.kb-toc .h3{padding-left:14px;font-size:13px}'
      + '.kb-fab{position:fixed;bottom:16px;z-index:300;width:44px;height:44px;border-radius:50%;border:1px solid var(--border);background:var(--bg);box-shadow:0 4px 16px rgba(0,0,0,.18);color:var(--link);font-size:19px;cursor:pointer;opacity:0;transform:translateY(10px);transition:.2s;pointer-events:none}.kb-fab.show{opacity:1;transform:none;pointer-events:auto}'
      + '.kb-callout{background:linear-gradient(135deg,var(--tint1),var(--tint2));border:1px solid var(--border);border-left:4px solid #d61f6e;border-radius:12px;padding:11px 14px;margin:14px 0;font-size:14px;color:var(--text);min-height:44px}.kb-callout a{color:var(--link);font-weight:700;text-decoration:none}'
      + '.kb-tts.on{background:#d61f6e;color:#fff;border-color:#d61f6e}'
      + 'html.kb-fs1 .w{font-size:112%}html.kb-fs2 .w{font-size:124%}html.kb-fs3 .w{font-size:140%}html.kb-space .w{line-height:1.9}html.kb-space .w p{margin:14px 0}html.kb-dys .w{font-family:Verdana,Tahoma,sans-serif;letter-spacing:.02em}html.kb-hc .w{color:#000}html.kb-hc .w .disc,html.kb-hc .w .bc{color:#444}'
      + 'html.kb-dark.kb-hc .w{color:#fff}html.kb-dark.kb-hc .w .disc,html.kb-dark.kb-hc .w .bc{color:#ddd}'
      // Clipped, not parked off-canvas-left: left:-999px reads as scrollable
      // overflow under dir=rtl and gave Arabic pages ~999px of phantom h-scroll.
      + '.skip-link{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}'
      + '.skip-link:focus{position:fixed;top:0;inset-inline-start:0;width:auto;height:auto;margin:0;padding:8px 14px;overflow:visible;clip:auto;clip-path:none;background:#d61f6e;color:#fff;border-radius:0 0 8px 0;z-index:500}'
      + '@media print{.kbh,.kb-fab,#kb-prog,.kb-ov,.rel,.foot,.adsbygoogle,ins,.cta,.kb-callout,.kb-cont,.kb-upnext{display:none!important}.w{max-width:100%}body{font-size:12pt;background:#fff;color:#000}a{color:#000;text-decoration:none}.qa{border:1px solid #ccc}}'
      + '@media (prefers-reduced-motion:reduce){#kb-prog,.kb-fab{transition:none}}';
    var s = D.createElement('style'); s.textContent = css; D.head.appendChild(s);
  } catch (e) { }

  // apply persisted a11y prefs ASAP
  try {
    var a = JSON.parse(get('kb_a11y') || '{}');
    if (a.fs) root.classList.add('kb-fs' + a.fs);
    if (a.space) root.classList.add('kb-space');
    if (a.dys) root.classList.add('kb-dys');
    if (a.hc) root.classList.add('kb-hc');
  } catch (e) { }

  // overlay helper
  function overlay(inner) {
    var ov = D.createElement('div'); ov.className = 'kb-ov'; ov.innerHTML = '<div class="kb-ovbox" role="dialog" aria-modal="true">' + inner + '</div>';
    D.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) close(); });
    function close() { ov.classList.remove('on'); D.removeEventListener('keydown', esc); setTimeout(function () { ov.remove(); }, 50); }
    function esc(e) { if (e.key === 'Escape') close(); }
    D.addEventListener('keydown', esc);
    requestAnimationFrame(function () { ov.classList.add('on'); });
    return { el: ov, close: close };
  }

  // ── header action buttons ──────────────────────────────────────────────────
  var actEl = null;
  if (kbh) {
    actEl = D.createElement('div'); actEl.className = 'kbh-act';
    actEl.innerHTML = '<button class="kbh-btn" id="kb-search-b" aria-label="Search" title="Search">🔎</button>'
      + '<button class="kbh-btn" id="kb-lang-b" aria-label="Language" title="Language">🌐</button>'
      + '<button class="kbh-btn kb-tts" id="kb-tts-b" aria-label="Listen" title="Listen">🔊</button>'
      + '<button class="kbh-btn" id="kb-a11y-b" aria-label="Accessibility" title="Text & accessibility">Aa</button>'
      + '<button class="kbh-btn" id="kb-save-b" aria-label="Save" title="Save">♡</button>';
    kbh.appendChild(actEl);
  }
  function on(id, fn) { var b = D.getElementById(id); if (b) b.addEventListener('click', fn); }

  // ── 1. instant library search ───────────────────────────────────────────────
  var searchIdx = null, fuse = null;
  function openSearch() {
    var o = overlay('<div class="kb-ovh"><input type="search" id="kb-q" placeholder="' + t('Search 2,000+ K-beauty guides…', { ko: 'K-뷰티 가이드 2,000+ 검색…', ja: 'K-beautyガイドを検索…', es: 'Buscar en 2.000+ guías…', ar: 'ابحث في أكثر من 2000 دليل…' }) + '" autocomplete="off"><button class="kb-x" data-x aria-label="Close">✕</button></div><div class="kb-res" id="kb-res"></div>');
    var q = D.getElementById('kb-q'), res = D.getElementById('kb-res'); q.focus();
    var run = function () {
      var v = q.value.trim(); if (!v) { res.innerHTML = ''; return; }
      if (!searchIdx) { res.innerHTML = '<p style="color:#999;padding:10px">…</p>'; return; }
      var hits;
      if (fuse) hits = fuse.search(v).slice(0, 20).map(function (r) { return r.item; });
      else { var lv = v.toLowerCase(); hits = searchIdx.filter(function (x) { return x.t.toLowerCase().indexOf(lv) >= 0; }).slice(0, 20); }
      res.innerHTML = hits.length ? hits.map(function (x) { return '<a href="' + x.u + '"><span class="re">' + (x.e || '📄') + '</span><span>' + esc(x.t) + '</span><span class="rd">' + (x.d || '') + '</span></a>'; }).join('') : '<p style="color:#999;padding:10px">' + t('No matches', { ko: '검색 결과 없음', ja: '該当なし' }) + '</p>';
    };
    q.addEventListener('input', debounce(run, 140));
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var a = res.querySelector('a'); if (a) location.href = a.getAttribute('href'); } });
    if (!searchIdx) loadIdx(run);
  }
  function loadIdx(cb) {
    fetch('/guide/kb/kb-search.json').then(function (r) { return r.json(); }).then(function (data) {
      searchIdx = data;
      // prefer this language's entries first
      searchIdx.sort(function (x, y) { return (y.l === LANG) - (x.l === LANG); });
      if (W.Fuse) { fuse = new W.Fuse(searchIdx, { keys: ['t'], threshold: 0.4, ignoreLocation: true }); cb && cb(); }
      else { var sc = D.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js'; sc.onload = function () { try { fuse = new W.Fuse(searchIdx, { keys: ['t'], threshold: 0.4, ignoreLocation: true }); } catch (e) { } cb && cb(); }; sc.onerror = function () { cb && cb(); }; D.head.appendChild(sc); }
    }).catch(function () { });
  }
  on('kb-search-b', openSearch);
  // Cmd/Ctrl-K
  D.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); } });

  // ── 2. per-page language switcher (reads hreflang cluster) ───────────────────
  var LANGS = { en: '🇺🇸 English', ko: '🇰🇷 한국어', ja: '🇯🇵 日本語', zh: '🇨🇳 中文', es: '🇪🇸 Español', fr: '🇫🇷 Français', de: '🇩🇪 Deutsch', pt: '🇧🇷 Português', id: '🇮🇩 Indonesia', ar: '🇸🇦 العربية', hi: '🇮🇳 हिन्दी', ru: '🇷🇺 Русский', vi: '🇻🇳 Tiếng Việt', th: '🇹🇭 ไทย' };
  function openLang() {
    var sib = {};
    try { [].forEach.call(D.querySelectorAll('link[rel="alternate"][hreflang]'), function (l) { var hl = l.getAttribute('hreflang').slice(0, 2); if (LANGS[hl]) sib[hl] = l.href; }); } catch (e) { }
    var rows = Object.keys(LANGS).map(function (c) {
      var url = sib[c] || ('/kbeauty?lang=' + c);
      return '<a href="' + url + '" class="' + (c === LANG ? 'cur' : '') + '"' + (c === LANG ? ' aria-current="true"' : '') + ' onclick="try{localStorage.setItem(\'kp_lang\',\'' + c + '\')}catch(e){}">' + LANGS[c] + '</a>';
    }).join('');
    overlay('<div class="kb-ovh"><b style="flex:1;font-size:16px">🌐 ' + t('Language', { ko: '언어', ja: '言語', es: 'Idioma', ar: 'اللغة' }) + '</b><button class="kb-x" data-x>✕</button></div><div class="kb-langgrid">' + rows + '</div>');
  }
  on('kb-lang-b', openLang);

  // ── 5. read-aloud (Web Speech) ───────────────────────────────────────────────
  var speaking = false;
  on('kb-tts-b', function () {
    if (!('speechSynthesis' in W)) { alert(t('Read-aloud is not supported in this browser.', { ko: '이 브라우저는 읽어주기를 지원하지 않아요.' })); return; }
    var btn = D.getElementById('kb-tts-b');
    if (speaking) { W.speechSynthesis.cancel(); speaking = false; btn.classList.remove('on'); return; }
    try {
      var parts = []; var h1 = main.querySelector('h1'); if (h1) parts.push(h1.textContent);
      var qa = main.querySelector('.qa'); if (qa) parts.push(qa.textContent.replace(/^⚡.*?:/, ''));
      [].forEach.call(main.querySelectorAll('h2, p.lead, .box, p'), function (p, i) { if (i < 40 && p.textContent.trim().length > 10 && !p.closest('.foot,.disc,.rel,.kb-callout')) parts.push(p.textContent); });
      var u = new SpeechSynthesisUtterance(parts.join('. ').slice(0, 4000)); u.lang = root.getAttribute('lang') || 'en'; u.rate = 1;
      u.onend = function () { speaking = false; btn.classList.remove('on'); };
      W.speechSynthesis.cancel(); W.speechSynthesis.speak(u); speaking = true; btn.classList.add('on');
    } catch (e) { }
  });

  // ── 15. accessibility toolbar ────────────────────────────────────────────────
  function openA11y() {
    var a = {}; try { a = JSON.parse(get('kb_a11y') || '{}'); } catch (e) { }
    function fsBtns() { return [0, 1, 2, 3].map(function (n) { return '<button data-fs="' + n + '" class="' + ((a.fs || 0) == n ? 'on' : '') + '">' + (['A', 'A+', 'A++', 'A+++'][n]) + '</button>'; }).join(''); }
    // Q4: theme row — auto (follow OS) / light / dark, persisted in the same blob the
    // pre-paint inline script in shell() reads, so the choice applies with no flash.
    var THEMES = [['auto', t('Auto')], ['light', t('Light')], ['dark', t('Dark')]];
    function thBtns() { return THEMES.map(function (x) { return '<button data-theme="' + x[0] + '" class="' + ((a.theme || 'auto') === x[0] ? 'on' : '') + '">' + esc(x[1]) + '</button>'; }).join(''); }
    var box = overlay('<div class="kb-ovh"><b style="flex:1;font-size:16px">Aa ' + t('Text & accessibility', { ko: '글자·접근성', ja: '文字・アクセシビリティ', es: 'Texto y accesibilidad', ar: 'النص وإمكانية الوصول' }) + '</b><button class="kb-x" data-x>✕</button></div>'
      + '<div class="kb-a11y"><label>' + t('Theme') + '<span class="grp" id="kb-th">' + thBtns() + '</span></label>'
      + '<label>' + t('Text size', { ko: '글자 크기', ja: '文字サイズ' }) + '<span class="grp" id="kb-fs">' + fsBtns() + '</span></label>'
      + '<label>' + t('Comfortable spacing', { ko: '넓은 줄간격', ja: '広い行間' }) + '<button data-tog="space" class="' + (a.space ? 'on' : '') + '">' + (a.space ? 'ON' : 'OFF') + '</button></label>'
      + '<label>' + t('Dyslexia-friendly font', { ko: '난독증 친화 글꼴', ja: '読みやすいフォント' }) + '<button data-tog="dys" class="' + (a.dys ? 'on' : '') + '">' + (a.dys ? 'ON' : 'OFF') + '</button></label>'
      + '<label>' + t('High contrast', { ko: '고대비', ja: '高コントラスト' }) + '<button data-tog="hc" class="' + (a.hc ? 'on' : '') + '">' + (a.hc ? 'ON' : 'OFF') + '</button></label></div>');
    function apply() {
      root.classList.remove('kb-fs1', 'kb-fs2', 'kb-fs3', 'kb-space', 'kb-dys', 'kb-hc', 'kb-dark', 'kb-light');
      if (a.fs) root.classList.add('kb-fs' + a.fs); if (a.space) root.classList.add('kb-space'); if (a.dys) root.classList.add('kb-dys'); if (a.hc) root.classList.add('kb-hc');
      if (a.theme === 'dark') root.classList.add('kb-dark'); else if (a.theme === 'light') root.classList.add('kb-light');
      applyThemeColor();
      set('kb_a11y', JSON.stringify(a));
    }
    box.el.addEventListener('click', function (e) {
      var fb = e.target.closest('[data-fs]'); if (fb) { a.fs = +fb.dataset.fs; apply(); [].forEach.call(box.el.querySelectorAll('#kb-fs button'), function (b) { b.classList.toggle('on', +b.dataset.fs === a.fs); }); }
      var th = e.target.closest('[data-theme]'); if (th) { a.theme = th.dataset.theme; apply(); [].forEach.call(box.el.querySelectorAll('#kb-th button'), function (b) { b.classList.toggle('on', b.dataset.theme === a.theme); }); }
      var tg = e.target.closest('[data-tog]'); if (tg) { var k = tg.dataset.tog; a[k] = !a[k]; apply(); tg.classList.toggle('on', a[k]); tg.textContent = a[k] ? 'ON' : 'OFF'; }
    });
  }
  // Keep the browser UI color in step with the effective theme.
  function applyThemeColor() {
    try {
      var dark = root.classList.contains('kb-dark') || (!root.classList.contains('kb-light') && W.matchMedia && W.matchMedia('(prefers-color-scheme:dark)').matches);
      var m = D.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#161019' : '#d61f6e');
    } catch (e) { }
  }
  applyThemeColor();
  try { if (W.matchMedia) W.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', applyThemeColor); } catch (e) { }
  on('kb-a11y-b', openA11y);

  // ── 8. save + recently-viewed (syncs with hub keys) ──────────────────────────
  var pageId = location.pathname, pageTitle = (main.querySelector('h1') || {}).textContent || D.title;
  function savedSet() { try { return new Set(JSON.parse(get('kp_kbeauty_saved') || '[]')); } catch (e) { return new Set(); } }
  (function () {
    var sv = savedSet(), b = D.getElementById('kb-save-b'); if (!b) return;
    if (sv.has(pageId)) { b.textContent = '♥'; b.style.color = '#d61f6e'; }
    b.addEventListener('click', function () {
      var s = savedSet(); if (s.has(pageId)) { s.delete(pageId); b.textContent = '♡'; b.style.color = ''; } else { s.add(pageId); b.textContent = '♥'; b.style.color = '#d61f6e'; }
      set('kp_kbeauty_saved', JSON.stringify([].slice.call(s)));
      // also store a title map for the hub to render
      try { var m = JSON.parse(get('kp_kbeauty_saved_map') || '{}'); if (s.has(pageId)) m[pageId] = pageTitle; else delete m[pageId]; set('kp_kbeauty_saved_map', JSON.stringify(m)); } catch (e) { }
    });
  })();
  // recently-viewed
  var recentBefore = [];
  try { var rv = JSON.parse(get('kp_kbeauty_recent_lib') || '[]'); rv = rv.filter(function (x) { return x.u !== pageId; }); recentBefore = rv.slice(0, 24); rv.unshift({ u: pageId, t: pageTitle.slice(0, 60) }); set('kp_kbeauty_recent_lib', JSON.stringify(rv.slice(0, 24))); } catch (e) { }

  // ── Q3: "Continue your journey" — makes the write-only save/recent history
  // readable: saved guides first, then recently viewed. Renders only when the
  // visitor actually has history, so first-time readers see nothing. ──
  try {
    var savedMap = {}; try { savedMap = JSON.parse(get('kp_kbeauty_saved_map') || '{}'); } catch (e2) { }
    var rows = [], seen = {};
    Object.keys(savedMap).forEach(function (u) { if (u !== pageId && !seen[u]) { seen[u] = 1; rows.push({ u: u, t: savedMap[u], s: 1 }); } });
    recentBefore.forEach(function (x) { if (x && x.u && x.u !== pageId && !seen[x.u]) { seen[x.u] = 1; rows.push({ u: x.u, t: x.t, s: 0 }); } });
    rows = rows.slice(0, 6);
    if (rows.length) {
      var host = D.querySelector('.kp-nextsteps');
      var box2 = D.createElement('section'); box2.className = 'kb-cont';
      box2.innerHTML = '<p class="kb-cont-h">🧭 ' + esc(t('Continue your journey')) + '</p>'
        + rows.map(function (r) { return '<a href="' + esc(r.u) + '">' + (r.s ? '♥ ' : '🕘 ') + esc(String(r.t || r.u).slice(0, 44)) + '</a>'; }).join('');
      if (host) host.parentNode.insertBefore(box2, host); else if (main) main.appendChild(box2);
    }
  } catch (e) { }

  // ── 3. profile-aware banner ──────────────────────────────────────────────────
  try {
    var skin = get('kp_kbeauty_skin') || '', concerns = []; try { concerns = JSON.parse(get('kp_kbeauty_concerns') || '[]'); } catch (e) { }
    if ((skin || concerns.length) && main && !/\/(index\.html)?$/.test(location.pathname.replace(/\/(ko|ja|zh|es|fr|de|pt|id|ar|hi|ru|vi|th)\//, '/'))) {
      var h1n = main.querySelector('h1');
      if (h1n) {
        var label = skin ? skin : (concerns[0] || '');
        var msg = t('Personalized for your skin', { ko: '내 피부 맞춤', ja: 'あなたの肌に合わせて', es: 'Personalizado para tu piel', fr: 'Adapté à votre peau', de: 'Auf deine Haut abgestimmt', pt: 'Personalizado para a sua pele', id: 'Disesuaikan untuk kulitmu', ar: 'مخصّص لبشرتك', hi: 'आपकी त्वचा के लिए', ru: 'Персонально для вашей кожи', vi: 'Cá nhân hoá cho làn da bạn', th: 'ปรับให้เหมาะกับผิวคุณ' });
        var seemine = t('Your routine', { ko: '내 루틴 보기', ja: 'あなたのルーティン', es: 'Tu rutina', fr: 'Votre routine', de: 'Deine Routine', pt: 'Sua rotina', id: 'Rutinmu', ar: 'روتينك', hi: 'आपकी दिनचर्या', ru: 'Ваш уход', vi: 'Quy trình của bạn', th: 'รูทีนของคุณ' });
        var c = D.createElement('div'); c.className = 'kb-callout';
        c.innerHTML = '👤 <b>' + esc(msg) + (label ? ' — ' + esc(String(label)) : '') + '.</b> <a href="/kbeauty#cat=skin">' + esc(seemine) + ' →</a>';
        h1n.insertAdjacentElement('afterend', c);
      }
    }
  } catch (e) { }

  // ── 7. table of contents + reading progress + back to top ────────────────────
  try {
    var heads = main ? [].slice.call(main.querySelectorAll('h2, h3')).filter(function (h) { return h.textContent.trim().length > 1 && !h.closest('.rel,.foot'); }) : [];
    var slug = function (s) { return (s || '').toLowerCase().replace(/[^a-z0-9가-힣ぁ-んァ-ヶ一-龯]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'sec'; };
    if (heads.length >= 3) {
      var used = {}; var items = heads.map(function (h) { var id = h.id || slug(h.textContent); if (used[id]) id += '-' + (used[id]++); else used[id] = 1; h.id = id; return '<a class="' + (h.tagName === 'H3' ? 'h3' : '') + '" href="#' + id + '">' + esc(h.textContent.slice(0, 70)) + '</a>'; }).join('');
      var toc = D.createElement('details'); toc.className = 'kb-toc'; toc.open = W.innerWidth > 720;
      toc.innerHTML = '<summary>📑 ' + t('On this page', { ko: '이 페이지 목차', ja: 'このページの目次', es: 'En esta página', fr: 'Sur cette page', de: 'Auf dieser Seite', pt: 'Nesta página', id: 'Di halaman ini', ar: 'في هذه الصفحة', hi: 'इस पृष्ठ पर', ru: 'На этой странице', vi: 'Trên trang này', th: 'ในหน้านี้' }) + '</summary>' + items;
      var firstH2 = main.querySelector('h2'); if (firstH2) firstH2.insertAdjacentElement('beforebegin', toc);
    }
    var prog = D.createElement('div'); prog.id = 'kb-prog'; D.body.appendChild(prog);
    var top = D.createElement('button'); top.className = 'kb-fab'; top.setAttribute('aria-label', t('Back to top', { ko: '맨 위로', ja: 'トップへ' })); top.textContent = '↑'; top.style[RTL ? 'left' : 'right'] = '16px'; D.body.appendChild(top);
    top.addEventListener('click', function () { W.scrollTo({ top: 0, behavior: 'smooth' }); if (main) { main.setAttribute('tabindex', '-1'); main.focus(); } });
    var tick = false;
    W.addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { var sc = root.scrollTop || D.body.scrollTop, mx = (root.scrollHeight - root.clientHeight) || 1; prog.style.width = Math.min(100, sc / mx * 100) + '%'; top.classList.toggle('show', sc > 700); tick = false; }); }, { passive: true });
  } catch (e) { }

  // ── helpers ──────────────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function debounce(fn, ms) { var tmr; return function () { var a = arguments, th = this; clearTimeout(tmr); tmr = setTimeout(function () { fn.apply(th, a); }, ms); }; }
})();
