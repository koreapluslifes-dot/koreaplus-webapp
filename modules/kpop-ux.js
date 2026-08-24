/* modules/kpop-ux.js — 10 modern UX/convenience behaviors for the K-pop hub.
   Self-contained IIFEs; attach globally. Loaded after modules/kpop.js + kpop-plus.js. */

/* ===== progress: Injects a 3px fixed top reading-progress bar (full-width, z-index 70, gradient fill, pointer-events none) that tracks scroll percentage via  ===== */
(function(){
  "use strict";
  if (window.__kuxProgress) return;
  window.__kuxProgress = 1;

  try {
    var doc = document;
    var docEl = doc.documentElement;

    // --- one-time CSS injection ---
    var STYLE_ID = "kux-progress-css";
    if (!doc.getElementById(STYLE_ID)) {
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent =
        "#kux-progress{position:fixed;top:0;left:0;width:100%;height:3px;z-index:70;" +
        "pointer-events:none;background:transparent;}" +
        "#kux-progress .kux-progress-fill{position:absolute;top:0;left:0;height:100%;width:100%;" +
        "transform:scaleX(0);transform-origin:0 50%;will-change:transform;" +
        "background:var(--kp-grad,linear-gradient(90deg,var(--accent,#ff2e74),#7b5cff));" +
        "transition:transform .12s linear;}" +
        "@media (prefers-reduced-motion:reduce){" +
        "#kux-progress .kux-progress-fill{transition:none;will-change:auto;}}";
      (doc.head || docEl).appendChild(style);
    }

    // --- build bar (decorative, hidden from a11y tree) ---
    var bar = doc.getElementById("kux-progress");
    if (!bar) {
      bar = doc.createElement("div");
      bar.id = "kux-progress";
      bar.setAttribute("aria-hidden", "true");
      bar.setAttribute("role", "presentation");
      var fill = doc.createElement("div");
      fill.className = "kux-progress-fill";
      bar.appendChild(fill);
      (doc.body || docEl).appendChild(bar);
    }
    var fillEl = bar.firstChild;
    if (!fillEl) return;

    var lastPct = -1;
    var ticking = false;

    function compute() {
      ticking = false;
      try {
        var se = docEl;
        var bodyEl = doc.body || se;
        var scrollTop = window.pageYOffset || se.scrollTop || bodyEl.scrollTop || 0;
        var scrollHeight = Math.max(se.scrollHeight, bodyEl.scrollHeight || 0);
        var clientHeight = window.innerHeight || se.clientHeight || 0;
        var scrollable = scrollHeight - clientHeight;
        var pct = scrollable > 0 ? (scrollTop / scrollable) : 0;
        if (pct < 0) pct = 0;
        if (pct > 1) pct = 1;
        // round to avoid layout churn / sub-pixel thrash
        var rounded = Math.round(pct * 1000) / 1000;
        if (rounded === lastPct) return;
        lastPct = rounded;
        fillEl.style.transform = "scaleX(" + rounded + ")";
      } catch (e) {}
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(compute);
      } else {
        compute();
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("orientationchange", onScroll, { passive: true });

    // content can grow/shrink (filters, lazy sections) — recompute on DOM change
    try {
      if (typeof MutationObserver === "function") {
        var mo = new MutationObserver(function () { onScroll(); });
        mo.observe(doc.body || docEl, { childList: true, subtree: true });
      }
    } catch (e) {}

    // initial paint after layout settles
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(compute);
    } else {
      compute();
    }
  } catch (e) {}
})();

/* ===== backtotop: A circular back-to-top FAB that fades/scales in past ~600px of scroll and smooth-scrolls (or jumps under reduced-motion) to the top, adaptin ===== */
(function(){
  "use strict";
  if(window.__kuxBacktotop) return; window.__kuxBacktotop=1;
  try{
    var doc=document, de=doc.documentElement;
    var lang=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
    var L={
      en:"Back to top", ko:"맨 위로", ja:"トップへ戻る", zh:"返回顶部",
      es:"Volver arriba", fr:"Haut de page", de:"Nach oben", pt:"Voltar ao topo", id:"Kembali ke atas"
    };
    var label=L[lang]||L.en;

    // ---- inject CSS once ----
    var cssId="kux-backtotop-css";
    if(!doc.getElementById(cssId)){
      var st=doc.createElement("style"); st.id=cssId;
      st.textContent=
        ".kux-btt{position:fixed;right:calc(16px + env(safe-area-inset-right));bottom:calc(16px + env(safe-area-inset-bottom) + var(--mnav-h,0px));z-index:60;"+
        "width:46px;height:46px;border-radius:50%;border:1px solid var(--border,rgba(255,255,255,.12));"+
        "background:var(--surface,#15151f);color:var(--text,#fff);"+
        "display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;"+
        "box-shadow:0 6px 20px rgba(0,0,0,.35);"+
        "opacity:0;visibility:hidden;transform:translateY(12px) scale(.85);"+
        "transition:opacity .22s ease,transform .22s ease,visibility .22s;"+
        "-webkit-tap-highlight-color:transparent;}"+
        ".kux-btt:hover{border-color:var(--accent,#ff2e74);}"+
        ".kux-btt:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px;}"+
        ".kux-btt.kux-btt-on{opacity:1;visibility:visible;transform:translateY(0) scale(1);}"+
        ".kux-btt svg{width:22px;height:22px;display:block;}"+
        ".kux-btt::before{content:'';position:absolute;inset:-2px;border-radius:50%;"+
        "background:var(--kp-grad);opacity:0;transition:opacity .22s ease;z-index:-1;}"+
        ".kux-btt:hover::before{opacity:.18;}"+
        "@media (prefers-reduced-motion:reduce){"+
        ".kux-btt{transition:opacity .12s linear;transform:none;}"+
        ".kux-btt.kux-btt-on{transform:none;}"+
        ".kux-btt::before{transition:none;}}";
      (doc.head||de).appendChild(st);
    }

    // ---- build button once ----
    if(doc.getElementById("kux-btt")) return;
    var btn=doc.createElement("button");
    btn.type="button";
    btn.id="kux-btt";
    btn.className="kux-btt";
    btn.setAttribute("aria-label",label);
    btn.setAttribute("title",label);
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '+
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+
      '<path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>';
    (doc.body||de).appendChild(btn);

    function reducedMotion(){
      try{ return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches); }
      catch(e){ return false; }
    }

    var shown=false, ticking=false;
    function scrollY(){
      return window.pageYOffset || de.scrollTop || (doc.body && doc.body.scrollTop) || 0;
    }
    function update(){
      ticking=false;
      try{
        var on=scrollY()>600;
        if(on!==shown){
          shown=on;
          btn.classList.toggle("kux-btt-on",on);
        }
      }catch(e){}
    }
    function onScroll(){
      if(!ticking){
        ticking=true;
        (window.requestAnimationFrame||function(f){return f();})(update);
      }
    }

    btn.addEventListener("click",function(){
      try{
        if(reducedMotion()){
          window.scrollTo(0,0);
        }else if(("scrollBehavior" in de.style) && window.scrollTo){
          window.scrollTo({top:0,behavior:"smooth"});
        }else{
          window.scrollTo(0,0);
        }
      }catch(e){
        try{ window.scrollTo(0,0); }catch(_e){}
      }
    });

    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("resize",onScroll,{passive:true});
    update();
  }catch(err){ /* fail silently, zero console noise */ }
})();

/* ===== autonav: Auto-hiding top nav (nav.hub-nav): rAF-throttled scroll-direction tracker slides the header up on scroll-down past ~220px and reveals it on  ===== */
(function(){
  "use strict";
  if (window.__kuxAutonav) return; window.__kuxAutonav = 1;
  try {
    var doc = document, root = doc.documentElement;
    var REVEAL_TOP = 120;   // never hide within this many px of the very top
    var HIDE_AFTER = 220;   // only start hiding once scrolled past this
    var DELTA = 6;          // ignore tiny scroll jitter

    function reduced(){
      try { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches); }
      catch(e){ return false; }
    }

    function injectCSS(){
      if (doc.getElementById("kux-autonav-css")) return;
      var st = doc.createElement("style");
      st.id = "kux-autonav-css";
      st.textContent =
        "nav.hub-nav{will-change:transform;transition:transform .25s cubic-bezier(.4,0,.2,1);}" +
        "nav.hub-nav.kux-nav-hidden{transform:translateY(-100%);}" +
        "@media (prefers-reduced-motion:reduce){" +
          "nav.hub-nav{transition:none!important;will-change:auto;}" +
        "}";
      (doc.head || root).appendChild(st);
    }

    function init(){
      var nav = doc.querySelector("nav.hub-nav");
      if (!nav) return; // selector absent -> silent no-op
      injectCSS();

      var lastY = Math.max(0, window.pageYOffset || root.scrollTop || 0);
      var hidden = false, ticking = false;

      function show(){
        if (!hidden) return;
        hidden = false;
        nav.classList.remove("kux-nav-hidden");
      }
      function hide(){
        if (hidden) return;
        // honor reduced-motion: still hide (functional), just without animation (handled by CSS)
        hidden = true;
        nav.classList.add("kux-nav-hidden");
      }

      function update(){
        ticking = false;
        try {
          var y = window.pageYOffset || root.scrollTop || 0;
          if (y < 0) y = 0;
          var diff = y - lastY;

          // Always reveal near the very top.
          if (y <= REVEAL_TOP) { show(); lastY = y; return; }

          if (Math.abs(diff) < DELTA) { lastY = y; return; }

          if (diff > 0) {
            // scrolling down
            if (y > HIDE_AFTER) hide();
          } else {
            // scrolling up
            show();
          }
          lastY = y;
        } catch(e){ /* swallow */ }
      }

      function onScroll(){
        if (ticking) return;
        ticking = true;
        if (window.requestAnimationFrame) requestAnimationFrame(update);
        else update();
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      // Reset on resize/orientation so cached lastY stays sane.
      window.addEventListener("resize", function(){
        try {
          lastY = window.pageYOffset || root.scrollTop || 0;
          if (lastY <= REVEAL_TOP) show();
        } catch(e){}
      }, { passive: true });

      // If reduced-motion preference changes live, CSS handles it; nothing to do.
      update();
    }

    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  } catch(e){ /* never throw */ }
})();

/* ===== swipetabs: Mobile horizontal swipe on the hub content cycles the active .filter-chip (left=next, right=previous via .click(), clamped at ends), ignorin ===== */
(function(){
  "use strict";
  if (window.__kuxSwipetabs) return;
  window.__kuxSwipetabs = 1;

  try {
    // Touch capability gate — no-op on pure pointer/desktop.
    var hasTouch = ("ontouchstart" in window) ||
      (navigator && navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia("(pointer:coarse)").matches);
    if (!hasTouch) return;

    var doc = document;
    var root = doc.documentElement;

    // ── i18n (text only used for the optional transient hint) ──────────────────
    var I18N = {
      en: { hint: "Swipe to switch sections" },
      ko: { hint: "스와이프로 섹션 전환" },
      ja: { hint: "スワイプでセクション切替" },
      zh: { hint: "滑动切换板块" },
      es: { hint: "Desliza para cambiar de sección" },
      fr: { hint: "Glissez pour changer de section" },
      de: { hint: "Wischen, um Bereiche zu wechseln" },
      pt: { hint: "Deslize para trocar de seção" },
      id: { hint: "Geser untuk ganti bagian" }
    };
    var lang = "en";
    try {
      lang = (localStorage.getItem("kp_lang") ||
        (navigator.language || "en").slice(0, 2) || "en").toLowerCase();
    } catch (e) { lang = "en"; }
    var T = I18N[lang] || I18N.en;

    var reduce = false;
    try {
      reduce = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    } catch (e) { reduce = false; }

    // ── One-time CSS (only for the subtle directional hint flash) ──────────────
    if (!doc.getElementById("kux-swipetabs-css")) {
      var st = doc.createElement("style");
      st.id = "kux-swipetabs-css";
      st.textContent =
        "#kux-swipetabs-hint{position:fixed;left:50%;top:14px;transform:translateX(-50%) translateY(-8px);" +
        "z-index:65;pointer-events:none;max-width:90vw;display:flex;align-items:center;gap:7px;" +
        "padding:8px 14px;border-radius:999px;font:600 13px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;" +
        "background:var(--surface,#15151f);color:var(--text,#fff);border:1px solid var(--border,rgba(255,255,255,.12));" +
        "box-shadow:0 6px 24px rgba(0,0,0,.4);opacity:0;transition:opacity .22s ease,transform .22s ease;}" +
        "#kux-swipetabs-hint.kux-show{opacity:1;transform:translateX(-50%) translateY(0);}" +
        "#kux-swipetabs-hint .kux-arrow{font-weight:800;background:var(--kp-grad,linear-gradient(90deg,var(--accent,#ff2e74),#7c3aed));" +
        "-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}" +
        "@media (prefers-reduced-motion:reduce){#kux-swipetabs-hint{transition:opacity .12s linear;transform:translateX(-50%);}" +
        "#kux-swipetabs-hint.kux-show{transform:translateX(-50%);}}";
      (doc.head || root).appendChild(st);
    }

    // ── Optional transient hint pill ───────────────────────────────────────────
    var hintEl = null, hintTimer = null;
    function showHint(dir) {
      if (reduce) return; // keep it quiet when motion is reduced
      try {
        if (!hintEl) {
          hintEl = doc.createElement("div");
          hintEl.id = "kux-swipetabs-hint";
          hintEl.setAttribute("role", "status");
          hintEl.setAttribute("aria-live", "polite");
          (doc.body || root).appendChild(hintEl);
        }
        var arrow = dir > 0 ? "›" : "‹";
        hintEl.innerHTML = "";
        var a = doc.createElement("span");
        a.className = "kux-arrow";
        a.textContent = arrow;
        var lbl = doc.createElement("span");
        lbl.textContent = T.hint;
        if (dir > 0) { hintEl.appendChild(lbl); hintEl.appendChild(a); }
        else { hintEl.appendChild(a); hintEl.appendChild(lbl); }
        // force reflow then show
        void hintEl.offsetWidth;
        hintEl.classList.add("kux-show");
        if (hintTimer) clearTimeout(hintTimer);
        hintTimer = setTimeout(function () {
          if (hintEl) hintEl.classList.remove("kux-show");
        }, 900);
      } catch (e) {}
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    function getChips() {
      var bar = doc.getElementById("kpop-filters");
      if (!bar) return [];
      var list = bar.querySelectorAll(".filter-chip");
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        // skip hidden/disabled chips
        if (c.disabled) continue;
        if (c.hasAttribute("hidden")) continue;
        if (c.offsetParent === null && c.getClientRects().length === 0) continue;
        out.push(c);
      }
      return out;
    }

    function activeIndex(chips) {
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].classList.contains("active") ||
            chips[i].getAttribute("aria-selected") === "true") return i;
      }
      return 0;
    }

    // Should this swipe be ignored based on where it started?
    var IGNORE_TAGS = { INPUT: 1, TEXTAREA: 1, SELECT: 1, BUTTON: 1, A: 1, VIDEO: 1, IFRAME: 1 };
    function startsOnIgnored(target) {
      try {
        var el = target;
        var depth = 0;
        while (el && el.nodeType === 1 && depth < 40) {
          var tag = el.tagName;
          if (tag && IGNORE_TAGS[tag]) {
            // a/button are fine to swipe over UNLESS they are themselves scroll rails;
            // but treat interactive controls (inputs etc.) as hard ignore.
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
          }
          if (el.isContentEditable) return true;
          // chart strip / tickers / explicit opt-out
          if (el.id === "kpop-charts") return true;
          if (el.hasAttribute && el.hasAttribute("data-no-swipe")) return true;
          var cl = el.classList;
          if (cl && (cl.contains("kpop-ticker") ||
                     cl.contains("kp-ali-strip") ||
                     cl.contains("chart-strip") ||
                     cl.contains("filter-bar"))) return true;
          // generic horizontally-scrollable rail detection
          if (el.scrollWidth - el.clientWidth > 8) {
            var ox = "";
            try {
              var cs = window.getComputedStyle(el);
              ox = (cs.overflowX || "") + " " + (cs.overflow || "");
            } catch (e2) { ox = ""; }
            if (/(auto|scroll)/.test(ox)) return true;
          }
          el = el.parentNode;
          depth++;
        }
      } catch (e) {}
      return false;
    }

    // ── Touch tracking (passive — never preventDefault) ───────────────────────
    var sx = 0, sy = 0, st0 = 0, tracking = false, ignored = false;
    var THRESH = 60;     // min horizontal distance (px)
    var RATIO = 1.4;     // horizontal must dominate vertical
    var MAX_MS = 800;    // ignore slow drags / long-press

    function onStart(ev) {
      try {
        if (!ev.touches || ev.touches.length !== 1) { tracking = false; return; }
        var t = ev.touches[0];
        sx = t.clientX; sy = t.clientY; st0 = Date.now();
        ignored = startsOnIgnored(ev.target);
        tracking = !ignored;
      } catch (e) { tracking = false; }
    }

    function onEnd(ev) {
      if (!tracking) { tracking = false; return; }
      tracking = false;
      try {
        var t = (ev.changedTouches && ev.changedTouches[0]) || null;
        if (!t) return;
        var dx = t.clientX - sx;
        var dy = t.clientY - sy;
        var dt = Date.now() - st0;
        if (dt > MAX_MS) return;
        if (Math.abs(dx) < THRESH) return;
        if (Math.abs(dx) < Math.abs(dy) * RATIO) return; // must be clearly horizontal

        var chips = getChips();
        if (chips.length < 2) return;
        var idx = activeIndex(chips);
        // swipe left (dx<0) => NEXT ; swipe right (dx>0) => PREVIOUS
        var dir = dx < 0 ? 1 : -1;
        var next = idx + dir;
        if (next < 0 || next >= chips.length) return; // clamp at ends
        var target = chips[next];
        if (!target) return;
        showHint(dir);
        target.click();
      } catch (e) {}
    }

    function onCancel() { tracking = false; }

    // Attach to document body so the whole content area participates.
    var host = doc.body || root;
    host.addEventListener("touchstart", onStart, { passive: true });
    host.addEventListener("touchend", onEnd, { passive: true });
    host.addEventListener("touchcancel", onCancel, { passive: true });
  } catch (e) {
    /* never throw */
  }
})();

/* ===== pullrefresh: Mobile pull-to-refresh: at scrollTop 0, pulling down past ~70px shows a centered spinner pill (localized "Pull"→"Release"→"Refreshing") that ===== */
(function(){
  "use strict";
  if (window.__kuxPullrefresh) return;
  window.__kuxPullrefresh = 1;
  try {
    // Hub only — SEO pages should scroll normally.
    if (!document.getElementById("kpop-filters")) return;
    var isTouch = (("ontouchstart" in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    if (!isTouch) return;
    // Phones/tablets only — touch laptops keep native scroll.
    try {
      if (window.matchMedia && !window.matchMedia("(pointer: coarse)").matches) return;
    } catch (e) {}

    var reduce = false;
    try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) {}

    var lang = "en";
    try { lang = (localStorage.getItem("kp_lang") || (navigator.language || "en").slice(0, 2) || "en").toLowerCase(); } catch (e) {}

    var T = {
      pull: {
        en: "Pull to refresh", ko: "당겨서 새로고침", ja: "引っ張って更新", zh: "下拉刷新",
        es: "Desliza para actualizar", fr: "Tirez pour actualiser", de: "Zum Aktualisieren ziehen",
        pt: "Puxe para atualizar", id: "Tarik untuk menyegarkan"
      },
      release: {
        en: "Release to refresh", ko: "놓으면 새로고침", ja: "離して更新", zh: "松开刷新",
        es: "Suelta para actualizar", fr: "Relâchez pour actualiser", de: "Loslassen zum Aktualisieren",
        pt: "Solte para atualizar", id: "Lepaskan untuk menyegarkan"
      },
      refreshing: {
        en: "Refreshing…", ko: "새로고침 중…", ja: "更新中…", zh: "正在刷新…",
        es: "Actualizando…", fr: "Actualisation…", de: "Aktualisieren…",
        pt: "Atualizando…", id: "Menyegarkan…"
      }
    };
    function t(k) { var m = T[k] || {}; return m[lang] || m.en; }

    var CSS = ".kux-ptr{position:fixed;left:50%;top:0;z-index:65;display:flex;align-items:center;gap:8px;" +
      "padding:9px 16px;border-radius:999px;background:var(--surface,#15151f);color:var(--text,#fff);" +
      "border:1px solid var(--border,rgba(255,255,255,.12));font:600 13px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.4);white-space:nowrap;pointer-events:none;" +
      "transform:translate(-50%,-150%);opacity:0;transition:transform .18s ease,opacity .18s ease}" +
      ".kux-ptr.kux-ptr-drag{transition:none}" +
      ".kux-ptr-spin{width:15px;height:15px;flex:0 0 auto;border-radius:50%;" +
      "border:2px solid var(--border,rgba(255,255,255,.25));border-top-color:var(--accent,#ff2e74);" +
      "transition:transform .05s linear}" +
      ".kux-ptr.kux-ptr-go .kux-ptr-spin{border-top-color:var(--accent,#ff2e74)}" +
      ".kux-ptr-busy .kux-ptr-spin{animation:kuxPtrSpin .7s linear infinite}" +
      "@keyframes kuxPtrSpin{to{transform:rotate(360deg)}}" +
      "@media (prefers-reduced-motion:reduce){" +
      ".kux-ptr{transition:opacity .12s ease;transform:translate(-50%,12px)!important}" +
      ".kux-ptr-spin{display:none}" +
      ".kux-ptr-busy .kux-ptr-spin{animation:none}}";

    function injectCSS() {
      if (document.getElementById("kux-pullrefresh-css")) return;
      var s = document.createElement("style");
      s.id = "kux-pullrefresh-css";
      s.textContent = CSS;
      (document.head || document.documentElement).appendChild(s);
    }

    var pill, spin, label, mounted = false;
    function mount() {
      if (mounted) return;
      injectCSS();
      pill = document.createElement("div");
      pill.className = "kux-ptr";
      pill.setAttribute("role", "status");
      pill.setAttribute("aria-live", "polite");
      pill.setAttribute("aria-hidden", "true");
      spin = document.createElement("span");
      spin.className = "kux-ptr-spin";
      spin.setAttribute("aria-hidden", "true");
      label = document.createElement("span");
      label.className = "kux-ptr-label";
      label.textContent = t("pull");
      pill.appendChild(spin);
      pill.appendChild(label);
      (document.body || document.documentElement).appendChild(pill);
      mounted = true;
    }

    var THRESH = 70, MAX = 130, RESIST = 0.5;
    var startY = 0, pulling = false, dragging = false, armed = false, busy = false;

    function scrollTop() {
      return window.pageYOffset || document.documentElement.scrollTop || (document.body && document.body.scrollTop) || 0;
    }

    function setLabel(txt) { if (label && label.textContent !== txt) label.textContent = txt; }

    function reset() {
      pulling = false; dragging = false; armed = false;
      if (!pill) return;
      pill.classList.remove("kux-ptr-drag", "kux-ptr-go");
      pill.style.transform = "";
      pill.style.opacity = "";
      pill.setAttribute("aria-hidden", "true");
    }

    function onStart(e) {
      if (busy) return;
      if (scrollTop() > 0) { pulling = false; return; }
      var tch = e.touches && e.touches[0];
      if (!tch) return;
      startY = tch.clientY;
      pulling = true; dragging = false; armed = false;
    }

    function onMove(e) {
      if (!pulling || busy) return;
      var tch = e.touches && e.touches[0];
      if (!tch) return;
      var dy = tch.clientY - startY;
      if (scrollTop() > 0) { pulling = false; if (dragging) reset(); return; }
      if (dy <= 0) {
        if (dragging) { dragging = false; reset(); }
        return;
      }
      if (!dragging) {
        mount();
        dragging = true;
        if (pill) {
          pill.classList.add("kux-ptr-drag");
          pill.setAttribute("aria-hidden", "false");
        }
      }
      var pulled = dy * RESIST;
      if (pulled > MAX) pulled = MAX;
      armed = pulled >= THRESH;
      if (pill) {
        if (!reduce) {
          pill.style.transform = "translate(-50%," + (pulled - 28) + "px)";
          if (spin) spin.style.transform = "rotate(" + (pulled / MAX * 270) + "deg)";
        }
        pill.style.opacity = String(Math.min(1, pulled / THRESH));
        pill.classList.toggle("kux-ptr-go", armed);
      }
      setLabel(armed ? t("release") : t("pull"));
      // Only block native scroll once the pull gesture is clearly intentional.
      if (dy > 12 && e.cancelable) e.preventDefault();
    }

    function onEnd() {
      if (!pulling || busy) { pulling = false; return; }
      var go = dragging && armed;
      pulling = false; dragging = false;
      if (!go) { reset(); return; }
      busy = true;
      if (pill) {
        pill.classList.remove("kux-ptr-drag");
        pill.classList.add("kux-ptr-busy", "kux-ptr-go");
        pill.style.transform = reduce ? "" : "translate(-50%,12px)";
        pill.style.opacity = "1";
        pill.setAttribute("aria-hidden", "false");
      }
      setLabel(t("refreshing"));
      // KP-16: preserve the active filter tab across the reload (kpop.js restores it)
      try {
        var activeChip = document.querySelector("#kpop-filters .filter-chip.active");
        var tgt = activeChip && activeChip.getAttribute("data-target");
        if (tgt) sessionStorage.setItem("kux_tab", tgt);
      } catch (x) {}
      setTimeout(function () { try { location.reload(); } catch (e) {} }, reduce ? 120 : 260);
    }

    function onCancel() { if (pulling && dragging && !busy) reset(); pulling = false; }

    var doc = document;
    doc.addEventListener("touchstart", function (e) { try { onStart(e); } catch (x) {} }, { passive: true });
    doc.addEventListener("touchmove", function (e) { try { onMove(e); } catch (x) {} }, { passive: false });
    doc.addEventListener("touchend", function (e) { try { onEnd(e); } catch (x) {} }, { passive: true });
    doc.addEventListener("touchcancel", function () { try { onCancel(); } catch (x) {} }, { passive: true });
  } catch (e) {}
})();

/* ===== haptics: Haptics: one delegated, passive, throttled document click listener fires a subtle 10ms navigator.vibrate() pulse on high-intent K-pop contro ===== */
(function(){
  "use strict";
  if (window.__kuxHaptics) return;
  window.__kuxHaptics = 1;
  try {
    // Capability gate: do nothing if the device cannot vibrate.
    var vibrate = (navigator && typeof navigator.vibrate === "function")
      ? navigator.vibrate.bind(navigator)
      : null;
    if (!vibrate) return;

    // Selectors for high-intent controls.
    var SELECTORS = [
      ".filter-chip",
      ".art-follow",
      "[data-followbtn]",
      "[data-follow]"
    ];

    // Opt-out: localStorage "kux_haptics" === "off" disables (default on).
    function enabled() {
      try {
        return localStorage.getItem("kux_haptics") !== "off";
      } catch (e) {
        return true;
      }
    }

    // Does the tapped element (or an ancestor up to the action target) qualify?
    function qualifies(target) {
      if (!target || target.nodeType !== 1) return false;
      var el = target;
      // closest() covers svg/text children inside a button.
      try {
        for (var i = 0; i < SELECTORS.length; i++) {
          if (el.closest && el.closest(SELECTORS[i])) return true;
        }
      } catch (e) {}
      // Buttons inside the personalized "for you" section (quiz/vote/etc.).
      try {
        var foryou = el.closest ? el.closest("#kpop-foryou") : null;
        if (foryou) {
          var btn = el.closest("button, [role='button'], a[href]");
          if (btn && foryou.contains(btn)) return true;
        }
      } catch (e) {}
      return false;
    }

    var last = 0;
    function onTap(e) {
      try {
        if (!enabled()) return;
        // Throttle so rapid synthetic events don't stutter the motor.
        var now = (Date.now ? Date.now() : new Date().getTime());
        if (now - last < 40) return;
        if (!qualifies(e.target)) return;
        last = now;
        // Short, subtle pulse (8-12ms) emulating native tactile feedback.
        vibrate(10);
      } catch (err) {}
    }

    // ONE delegated listener; passive (never calls preventDefault) so it
    // cannot block scrolling or normal interaction.
    document.addEventListener("click", onTap, { passive: true, capture: true });
  } catch (e) {}
})();

/* ===== reveal: Scroll-reveal entrance animations: IntersectionObserver fades+slides section.kpop-sec and .kpp-card (and nested cards) up into view once wit ===== */
(function(){
  "use strict";
  if (window.__kuxReveal) return;
  window.__kuxReveal = 1;
  try {
    var doc = document, de = doc.documentElement;

    /* Feature-detect: never hide content if IO is unsupported. */
    if (typeof IntersectionObserver === "undefined") return;

    /* Reduced-motion: do nothing at all; elements stay visible normally. */
    var rm = false;
    try { rm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches); } catch (e) {}
    if (rm) return;

    /* ---- inject single stylesheet ---- */
    var STYLE_ID = "kux-reveal-css";
    if (!doc.getElementById(STYLE_ID)) {
      var st = doc.createElement("style");
      st.id = STYLE_ID;
      st.textContent =
        "@media (prefers-reduced-motion:no-preference){" +
          ".kux-reveal{opacity:0;transform:translateY(12px);" +
            "transition:opacity .55s cubic-bezier(.22,.61,.36,1),transform .55s cubic-bezier(.22,.61,.36,1);" +
            "transition-delay:var(--kux-rd,0ms);will-change:opacity,transform}" +
          ".kux-reveal.kux-in{opacity:1;transform:none}" +
        "}" +
        /* Safety net: if IO never fires or motion is reduced, content must be visible. */
        "@media (prefers-reduced-motion:reduce){.kux-reveal{opacity:1!important;transform:none!important;transition:none!important}}" +
        ".kux-reveal.kux-done{opacity:1;transform:none}";
      (doc.head || de).appendChild(st);
    }

    /* ---- collect targets ---- */
    function isHidden(el) {
      try {
        if (!el) return true;
        if (el.hidden) return true;
        if (el.closest && el.closest("[hidden]")) return true;
      } catch (e) {}
      return false;
    }

    var seen = [];
    function push(el) {
      if (!el || el.nodeType !== 1) return;
      if (el.__kuxR) return;
      if (isHidden(el)) return;
      el.__kuxR = 1;
      seen.push(el);
    }

    function collect() {
      var out = [];
      try {
        var secs = doc.querySelectorAll("section.kpop-sec");
        for (var i = 0; i < secs.length; i++) {
          var s = secs[i];
          if (isHidden(s) || s.__kuxR) continue;
          out.push(s);
          /* cards inside the section reveal individually for a richer effect */
          var inner = s.querySelectorAll(".kpp-card");
          for (var j = 0; j < inner.length; j++) out.push(inner[j]);
        }
        /* standalone cards (e.g. inside #kpop-foryou) not under a kpop-sec */
        var cards = doc.querySelectorAll(".kpp-card, #kpop-foryou .kpp-card");
        for (var k = 0; k < cards.length; k++) out.push(cards[k]);
      } catch (e) {}
      return out;
    }

    var io;
    try {
      io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var en = entries[i];
          if (!en.isIntersecting) continue;
          var el = en.target;
          (function (node) {
            try {
              requestAnimationFrame(function () {
                node.classList.add("kux-in");
              });
            } catch (e) { node.classList.add("kux-in"); }
            /* cleanup after the transition so will-change is dropped */
            var clean = function () {
              try {
                node.classList.add("kux-done");
                node.classList.remove("kux-reveal", "kux-in");
                node.style.removeProperty("--kux-rd");
                node.removeEventListener("transitionend", clean);
              } catch (e) {}
            };
            node.addEventListener("transitionend", clean, { once: true });
            /* fallback cleanup if transitionend never fires */
            setTimeout(clean, 1100);
          })(el);
          try { io.unobserve(el); } catch (e) {}
        }
      }, { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    } catch (e) { return; }

    function arm(els) {
      var staggerGroup = null, n = 0;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el || el.nodeType !== 1 || el.__kuxR) continue;
        if (isHidden(el)) continue;
        el.__kuxR = 1;

        /* Already on screen at init? Mark visible instantly, don't animate-in awkwardly. */
        var onScreen = false;
        try {
          var r = el.getBoundingClientRect();
          var vh = window.innerHeight || de.clientHeight || 0;
          onScreen = r.top < vh * 0.9 && r.bottom > 0;
        } catch (e) {}

        if (onScreen) {
          /* tiny stagger only for the initial above-fold batch */
          var grp = el.parentNode;
          if (grp !== staggerGroup) { staggerGroup = grp; n = 0; }
          var delay = Math.min(n * 60, 360); n++;
          try { el.style.setProperty("--kux-rd", delay + "ms"); } catch (e) {}
        }
        el.classList.add("kux-reveal");
        try { io.observe(el); } catch (e) { el.classList.add("kux-in"); }
      }
    }

    function run() { arm(collect()); }

    /* Initial pass after a frame so layout is settled. */
    try { requestAnimationFrame(function () { requestAnimationFrame(run); }); } catch (e) { run(); }

    /* Re-arm when sections get un-hidden by the filter chips or content loads in. */
    var rerunTimer = null;
    function scheduleRerun() {
      if (rerunTimer) return;
      rerunTimer = setTimeout(function () { rerunTimer = null; run(); }, 80);
    }

    try {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === "attributes" && m.attributeName === "hidden") { scheduleRerun(); return; }
          if (m.type === "childList" && (m.addedNodes && m.addedNodes.length)) { scheduleRerun(); return; }
        }
      });
      var filters = doc.getElementById("kpop-filters");
      var scope = (filters && filters.parentNode) || doc.body;
      if (scope) mo.observe(scope, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden"] });
    } catch (e) {}

    /* Clicking a filter chip can swap visible sections — give layout a beat then re-arm. */
    try {
      var fbar = doc.getElementById("kpop-filters");
      if (fbar) fbar.addEventListener("click", function (ev) {
        var c = ev.target && ev.target.closest && ev.target.closest(".filter-chip");
        if (c) scheduleRerun();
      }, { passive: true });
    } catch (e) {}

  } catch (e) { /* zero console noise in every state */ }
})();

/* ===== appearance: Adds a gear FAB (right:16px;bottom:calc(74px + env(safe-area-inset-bottom) + var(--mnav-h,0px))) opening a settings popover with a light/dark theme segment (class "light" + kp_theme, OS-default on ===== */
(function(){
  "use strict";
  if (window.__kuxAppearance) return;
  window.__kuxAppearance = 1;
  try {
    var KEY = "appearance";
    var doc = document;
    var root = doc.documentElement;

    var L = {
      en: { title:"Appearance", theme:"Theme", light:"Light", dark:"Dark", size:"Text size", dec:"Smaller text", inc:"Larger text", reset:"Default text size", open:"Appearance settings", close:"Close" },
      ko: { title:"화면 설정", theme:"테마", light:"라이트", dark:"다크", size:"글자 크기", dec:"글자 작게", inc:"글자 크게", reset:"기본 글자 크기", open:"화면 설정", close:"닫기" },
      ja: { title:"表示設定", theme:"テーマ", light:"ライト", dark:"ダーク", size:"文字サイズ", dec:"文字を小さく", inc:"文字を大きく", reset:"標準サイズ", open:"表示設定", close:"閉じる" },
      zh: { title:"外观设置", theme:"主题", light:"浅色", dark:"深色", size:"字体大小", dec:"缩小字体", inc:"放大字体", reset:"默认字体大小", open:"外观设置", close:"关闭" },
      es: { title:"Apariencia", theme:"Tema", light:"Claro", dark:"Oscuro", size:"Tamaño de texto", dec:"Texto más pequeño", inc:"Texto más grande", reset:"Tamaño predeterminado", open:"Ajustes de apariencia", close:"Cerrar" },
      fr: { title:"Apparence", theme:"Thème", light:"Clair", dark:"Sombre", size:"Taille du texte", dec:"Texte plus petit", inc:"Texte plus grand", reset:"Taille par défaut", open:"Réglages d'apparence", close:"Fermer" },
      de: { title:"Darstellung", theme:"Design", light:"Hell", dark:"Dunkel", size:"Textgröße", dec:"Kleinerer Text", inc:"Größerer Text", reset:"Standardgröße", open:"Darstellungseinstellungen", close:"Schließen" },
      pt: { title:"Aparência", theme:"Tema", light:"Claro", dark:"Escuro", size:"Tamanho do texto", dec:"Texto menor", inc:"Texto maior", reset:"Tamanho padrão", open:"Configurações de aparência", close:"Fechar" },
      id: { title:"Tampilan", theme:"Tema", light:"Terang", dark:"Gelap", size:"Ukuran teks", dec:"Teks lebih kecil", inc:"Teks lebih besar", reset:"Ukuran bawaan", open:"Pengaturan tampilan", close:"Tutup" }
    };
    var lang = "en";
    try { lang = (localStorage.getItem("kp_lang") || (navigator.language || "en").slice(0,2) || "en").toLowerCase(); } catch(e){}
    var t = L[lang] || L.en;
    function tr(k){ return (t && t[k]) || L.en[k] || k; }

    function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
    function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

    // ---- Resolve & apply current theme (first load follows OS) ----
    function isLight(){ return root.classList.contains("light"); }
    function applyTheme(light){
      if (light) root.classList.add("light"); else root.classList.remove("light");
      lsSet("kp_theme", light ? "light" : "dark");
    }
    (function initTheme(){
      var saved = lsGet("kp_theme");
      if (saved === "light") { root.classList.add("light"); }
      else if (saved === "dark") { root.classList.remove("light"); }
      else {
        var prefersLight = false;
        try { prefersLight = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches); } catch(e){}
        // Honor an already-present DOM class if some earlier script set it.
        if (root.classList.contains("light")) prefersLight = true;
        applyTheme(prefersLight);
      }
    })();

    // ---- Resolve & apply current text size ----
    var SIZES = ["font-sm","font-md","font-lg"];
    function currentSize(){
      for (var i=0;i<SIZES.length;i++){ if (root.classList.contains(SIZES[i])) return SIZES[i]; }
      var saved = lsGet("kp_fontsize");
      if (saved === "sm") return "font-sm";
      if (saved === "lg") return "font-lg";
      return "font-md";
    }
    function applySize(cls){
      SIZES.forEach(function(c){ root.classList.remove(c); });
      root.classList.add(cls);
      lsSet("kp_fontsize", cls.replace("font-",""));
    }
    (function initSize(){
      var has = SIZES.some(function(c){ return root.classList.contains(c); });
      if (!has) applySize(currentSize());
    })();

    // ---- CSS (inject once) ----
    if (!doc.getElementById("kux-appearance-css")) {
      var st = doc.createElement("style");
      st.id = "kux-appearance-css";
      st.textContent = [
        ".kux-ap-fab{position:fixed;right:16px;bottom:calc(74px + env(safe-area-inset-bottom) + var(--mnav-h,0px));z-index:60;width:46px;height:46px;border-radius:50%;",
        "border:1px solid var(--border,rgba(255,255,255,.12));background:var(--surface,#15151f);color:var(--text,#fff);",
        "display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;",
        "box-shadow:0 6px 20px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent;transition:transform .2s ease,box-shadow .2s ease,background .2s ease;}",
        ".kux-ap-fab:hover{background:var(--bg,#0c0c14);}",
        ".kux-ap-fab:active{transform:scale(.94);}",
        ".kux-ap-fab svg{width:22px;height:22px;display:block;}",
        ".kux-ap-fab:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px;}",
        ".kux-ap-panel{position:fixed;right:16px;bottom:calc(130px + env(safe-area-inset-bottom) + var(--mnav-h,0px));z-index:61;width:240px;max-width:calc(100vw - 32px);",
        "background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;",
        "padding:14px;color:var(--text,#fff);box-shadow:0 14px 40px rgba(0,0,0,.5);",
        "opacity:0;transform:translateY(8px) scale(.98);transform-origin:bottom right;pointer-events:none;",
        "transition:opacity .18s ease,transform .18s ease;}",
        ".kux-ap-panel.kux-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}",
        ".kux-ap-h{font-size:.74rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text3,#8a93a0);margin:0 0 8px;}",
        ".kux-ap-h:not(:first-child){margin-top:14px;}",
        ".kux-ap-seg{display:flex;gap:6px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;padding:4px;}",
        ".kux-ap-seg button{flex:1;border:0;background:transparent;color:var(--text2,#aab);font:inherit;font-size:.86rem;font-weight:600;",
        "padding:8px 6px;border-radius:9px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .18s ease,color .18s ease;display:flex;align-items:center;justify-content:center;gap:6px;}",
        ".kux-ap-seg button[aria-pressed=\"true\"]{background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#7c5cff));color:#fff;}",
        ".kux-ap-seg button:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px;}",
        ".kux-ap-size{display:flex;gap:6px;align-items:stretch;}",
        ".kux-ap-size button{border:1px solid var(--border,rgba(255,255,255,.12));background:var(--bg,#0c0c14);color:var(--text,#fff);",
        "font:inherit;font-weight:700;border-radius:11px;cursor:pointer;padding:8px 0;-webkit-tap-highlight-color:transparent;transition:background .18s ease,transform .12s ease;}",
        ".kux-ap-size button.kux-ap-step{flex:1;}",
        ".kux-ap-size button.kux-ap-step:nth-child(1){font-size:.82rem;}",
        ".kux-ap-size button.kux-ap-step:nth-child(2){font-size:1rem;}",
        ".kux-ap-size button.kux-ap-step:nth-child(3){font-size:1.18rem;}",
        ".kux-ap-size button:hover{background:var(--surface,#15151f);}",
        ".kux-ap-size button:active{transform:scale(.95);}",
        ".kux-ap-size button:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px;}",
        ".kux-ap-size button[aria-pressed=\"true\"]{background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#7c5cff));border-color:transparent;color:#fff;}",
        ".kux-ap-cur{flex:1;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text,#fff);}",
        "@media (prefers-reduced-motion:reduce){.kux-ap-fab,.kux-ap-panel,.kux-ap-seg button,.kux-ap-size button{transition:none!important;}",
        ".kux-ap-panel{transform:none;}.kux-ap-panel.kux-open{transform:none;}.kux-ap-fab:active,.kux-ap-size button:active{transform:none;}}"
      ].join("");
      (doc.head || root).appendChild(st);
    }

    // ---- Build FAB ----
    var SVG_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';

    var fab = doc.createElement("button");
    fab.type = "button";
    fab.className = "kux-ap-fab";
    fab.setAttribute("aria-label", tr("open"));
    fab.setAttribute("aria-haspopup", "true");
    fab.setAttribute("aria-expanded", "false");
    fab.innerHTML = SVG_GEAR;

    // ---- Build panel ----
    var panel = doc.createElement("div");
    panel.className = "kux-ap-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", tr("title"));
    panel.setAttribute("aria-hidden", "true");
    panel.id = "kux-ap-panel";
    fab.setAttribute("aria-controls", panel.id);

    // Theme segment
    var hTheme = doc.createElement("div"); hTheme.className = "kux-ap-h"; hTheme.textContent = tr("theme");
    var segTheme = doc.createElement("div"); segTheme.className = "kux-ap-seg"; segTheme.setAttribute("role","group"); segTheme.setAttribute("aria-label", tr("theme"));
    var btnLight = doc.createElement("button"); btnLight.type="button"; btnLight.textContent = tr("light"); btnLight.setAttribute("aria-label", tr("light"));
    var btnDark = doc.createElement("button"); btnDark.type="button"; btnDark.textContent = tr("dark"); btnDark.setAttribute("aria-label", tr("dark"));
    segTheme.appendChild(btnLight); segTheme.appendChild(btnDark);

    // Size controls
    var hSize = doc.createElement("div"); hSize.className = "kux-ap-h"; hSize.textContent = tr("size");
    var sizeWrap = doc.createElement("div"); sizeWrap.className = "kux-ap-size"; sizeWrap.setAttribute("role","group"); sizeWrap.setAttribute("aria-label", tr("size"));
    var btnSm = doc.createElement("button"); btnSm.type="button"; btnSm.className="kux-ap-step"; btnSm.textContent="A"; btnSm.setAttribute("aria-label", tr("dec")); btnSm.setAttribute("data-size","font-sm");
    var btnMd = doc.createElement("button"); btnMd.type="button"; btnMd.className="kux-ap-step"; btnMd.textContent="A"; btnMd.setAttribute("aria-label", tr("reset")); btnMd.setAttribute("data-size","font-md");
    var btnLg = doc.createElement("button"); btnLg.type="button"; btnLg.className="kux-ap-step"; btnLg.textContent="A"; btnLg.setAttribute("aria-label", tr("inc")); btnLg.setAttribute("data-size","font-lg");
    sizeWrap.appendChild(btnSm); sizeWrap.appendChild(btnMd); sizeWrap.appendChild(btnLg);

    panel.appendChild(hTheme); panel.appendChild(segTheme);
    panel.appendChild(hSize); panel.appendChild(sizeWrap);

    function syncUI(){
      var light = isLight();
      btnLight.setAttribute("aria-pressed", light ? "true" : "false");
      btnDark.setAttribute("aria-pressed", light ? "false" : "true");
      var cur = currentSize();
      [btnSm,btnMd,btnLg].forEach(function(b){
        b.setAttribute("aria-pressed", b.getAttribute("data-size") === cur ? "true" : "false");
      });
    }

    btnLight.addEventListener("click", function(){ applyTheme(true); syncUI(); });
    btnDark.addEventListener("click", function(){ applyTheme(false); syncUI(); });
    [btnSm,btnMd,btnLg].forEach(function(b){
      b.addEventListener("click", function(){ applySize(b.getAttribute("data-size")); syncUI(); });
    });

    // ---- Open / close ----
    var open = false;
    function setOpen(v){
      open = v;
      if (v) {
        syncUI();
        panel.classList.add("kux-open");
        panel.setAttribute("aria-hidden","false");
        fab.setAttribute("aria-expanded","true");
        doc.addEventListener("click", onDocClick, true);
        doc.addEventListener("keydown", onKey, true);
      } else {
        panel.classList.remove("kux-open");
        panel.setAttribute("aria-hidden","true");
        fab.setAttribute("aria-expanded","false");
        doc.removeEventListener("click", onDocClick, true);
        doc.removeEventListener("keydown", onKey, true);
      }
    }
    function onDocClick(e){
      try {
        if (panel.contains(e.target) || fab.contains(e.target)) return;
        setOpen(false);
      } catch(err){}
    }
    function onKey(e){
      if (e.key === "Escape" || e.key === "Esc") { setOpen(false); try { fab.focus(); } catch(err){} }
    }
    fab.addEventListener("click", function(e){ e.stopPropagation(); setOpen(!open); });

    function mount(){
      try {
        if (!doc.body) return;
        if (!doc.body.contains(fab)) doc.body.appendChild(fab);
        if (!doc.body.contains(panel)) doc.body.appendChild(panel);
        syncUI();
      } catch(err){}
    }
    if (doc.body) mount();
    else doc.addEventListener("DOMContentLoaded", mount, { once:true });

    // Keep UI in sync if another control changes theme/size on the DOM.
    try {
      var mo = new MutationObserver(function(){ if (open) syncUI(); });
      mo.observe(root, { attributes:true, attributeFilter:["class"] });
    } catch(err){}
  } catch(e){ /* never throw */ }
})();

/* ===== offline: Top-center offline/online status pill that warns when connectivity drops (showing saved content) and flashes "Back online" before auto-hidin ===== */
(function(){ "use strict";
  if(window.__kuxOffline) return; window.__kuxOffline=1;
  try{
    var KEY="offline";
    var lang=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
    var I18N={
      en:{off:"You are offline — showing saved content",on:"Back online"},
      ko:{off:"오프라인 상태입니다 — 저장된 콘텐츠를 표시합니다",on:"다시 온라인 상태입니다"},
      ja:{off:"オフラインです — 保存済みのコンテンツを表示しています",on:"オンラインに戻りました"},
      zh:{off:"你已离线 — 正在显示已保存的内容",on:"已重新连接"},
      es:{off:"Estás sin conexión — mostrando contenido guardado",on:"De nuevo en línea"},
      fr:{off:"Vous êtes hors ligne — affichage du contenu enregistré",on:"De nouveau en ligne"},
      de:{off:"Sie sind offline — gespeicherte Inhalte werden angezeigt",on:"Wieder online"},
      pt:{off:"Você está offline — mostrando conteúdo salvo",on:"Online novamente"},
      id:{off:"Anda sedang offline — menampilkan konten tersimpan",on:"Kembali online"}
    };
    var t=I18N[lang]||I18N.en;

    function injectCSS(){
      if(document.getElementById("kux-"+KEY+"-css")) return;
      var s=document.createElement("style");
      s.id="kux-"+KEY+"-css";
      s.textContent=
        "#kux-offline-pill{position:fixed;top:0;left:50%;transform:translate(-50%,-130%);"+
        "max-width:calc(100vw - 24px);z-index:70;display:flex;align-items:center;gap:8px;"+
        "margin-top:max(10px,env(safe-area-inset-top));padding:9px 15px;border-radius:999px;"+
        "font:600 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;"+
        "color:var(--text,#fff);background:var(--surface,#15151f);"+
        "border:1px solid var(--border,rgba(255,255,255,.12));"+
        "box-shadow:0 8px 28px rgba(0,0,0,.45);white-space:nowrap;overflow:hidden;"+
        "text-overflow:ellipsis;pointer-events:none;opacity:0;"+
        "transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .28s ease}"+
        "#kux-offline-pill.kux-show{transform:translate(-50%,0);opacity:1}"+
        "#kux-offline-pill .kux-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;"+
        "background:#ff6b6b;box-shadow:0 0 0 0 rgba(255,107,107,.5)}"+
        "#kux-offline-pill.kux-online .kux-dot{background:#37d67a;box-shadow:none}"+
        "#kux-offline-pill .kux-txt{overflow:hidden;text-overflow:ellipsis}"+
        "@media (prefers-reduced-motion:reduce){#kux-offline-pill{transition:opacity .2s ease;"+
        "transform:translate(-50%,0)}#kux-offline-pill.kux-show{transform:translate(-50%,0)}"+
        "#kux-offline-pill .kux-dot{box-shadow:none}}";
      (document.head||document.documentElement).appendChild(s);
    }

    var pill=null, hideTimer=null, removeTimer=null;
    function ensurePill(){
      if(pill&&document.body.contains(pill)) return pill;
      pill=document.createElement("div");
      pill.id="kux-offline-pill";
      pill.setAttribute("role","status");
      pill.setAttribute("aria-live","polite");
      var dot=document.createElement("span"); dot.className="kux-dot"; dot.setAttribute("aria-hidden","true");
      var txt=document.createElement("span"); txt.className="kux-txt";
      pill.appendChild(dot); pill.appendChild(txt);
      (document.body||document.documentElement).appendChild(pill);
      return pill;
    }

    function clearTimers(){ if(hideTimer){clearTimeout(hideTimer);hideTimer=null;} if(removeTimer){clearTimeout(removeTimer);removeTimer=null;} }

    function showOffline(){
      try{
        injectCSS(); var p=ensurePill(); clearTimers();
        p.classList.remove("kux-online");
        p.querySelector(".kux-txt").textContent=t.off;
        requestAnimationFrame(function(){ p.classList.add("kux-show"); });
      }catch(e){}
    }

    function showOnline(){
      try{
        injectCSS(); var p=ensurePill(); clearTimers();
        p.classList.add("kux-online");
        p.querySelector(".kux-txt").textContent=t.on;
        requestAnimationFrame(function(){ p.classList.add("kux-show"); });
        hideTimer=setTimeout(function(){
          try{ p.classList.remove("kux-show"); }catch(e){}
          removeTimer=setTimeout(function(){ try{ if(p&&p.parentNode) p.parentNode.removeChild(p); pill=null; }catch(e){} },420);
        },2500);
      }catch(e){}
    }

    window.addEventListener("offline",showOffline,{passive:true});
    window.addEventListener("online",showOnline,{passive:true});

    if(navigator&&navigator.onLine===false){
      if(document.body){ showOffline(); }
      else{ document.addEventListener("DOMContentLoaded",showOffline,{once:true,passive:true}); }
    }
  }catch(e){}
})();

/* ===== tabind: Renders a gradient pill that slides/resizes under the active .filter-chip in #kpop-filters (repositions on click, resize, ResizeObserver, an ===== */
(function(){
  "use strict";
  if (window.__kuxTabind) return;
  window.__kuxTabind = 1;
  try {
    var ID = "kux-tabind-css";
    if (!document.getElementById(ID)) {
      var st = document.createElement("style");
      st.id = ID;
      st.textContent =
        "#kpop-filters{position:relative;}" +
        "#kux-tabind-ind{position:absolute;left:0;bottom:0;height:3px;width:0;margin:0;padding:0;pointer-events:none;border-radius:999px;" +
        "background:var(--kp-grad,linear-gradient(90deg,var(--accent,#ff2e74),#a64bff));" +
        "box-shadow:0 0 10px -2px var(--accent,#ff2e74);opacity:0;" +
        "transform:translateX(0);transform-origin:left center;" +
        "transition:transform .25s cubic-bezier(.4,0,.2,1),width .25s cubic-bezier(.4,0,.2,1),opacity .2s ease;z-index:1;will-change:transform,width;}" +
        "#kux-tabind-ind.kux-ready{opacity:1;}" +
        "@media (prefers-reduced-motion:reduce){#kux-tabind-ind{transition:opacity .15s ease;}}";
      (document.head || document.documentElement).appendChild(st);
    }

    var bar = null, ind = null, ro = null, raf = 0;

    function reduced() {
      try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches); }
      catch (e) { return false; }
    }

    function getBar() {
      try { return document.getElementById("kpop-filters"); } catch (e) { return null; }
    }

    function ensureInd(b) {
      if (ind && ind.parentNode === b) return ind;
      ind = b.querySelector("#kux-tabind-ind");
      if (!ind) {
        ind = document.createElement("span");
        ind.id = "kux-tabind-ind";
        ind.setAttribute("aria-hidden", "true");
        b.appendChild(ind);
      }
      return ind;
    }

    function position() {
      raf = 0;
      try {
        var b = getBar();
        if (!b) return;
        var active = b.querySelector(".filter-chip.active") || b.querySelector(".filter-chip");
        var i = ensureInd(b);
        if (!active) { i.classList.remove("kux-ready"); return; }
        var bRect = b.getBoundingClientRect();
        var aRect = active.getBoundingClientRect();
        if (!aRect.width) { i.classList.remove("kux-ready"); return; }
        // account for horizontal scroll inside the (possibly scrollable) bar
        var x = (aRect.left - bRect.left) + (b.scrollLeft || 0);
        var w = aRect.width;
        var noMotion = reduced();
        var prev = i.style.transition;
        if (noMotion) i.style.transition = "opacity .15s ease";
        i.style.width = w + "px";
        i.style.transform = "translateX(" + x + "px)";
        i.classList.add("kux-ready");
        if (noMotion) {
          // force jump, then restore declarative transition for non-reduced future calls
          void i.offsetWidth;
          i.style.transition = prev;
        }
      } catch (e) {}
    }

    function schedule() {
      if (raf) return;
      try {
        raf = window.requestAnimationFrame(position);
      } catch (e) {
        raf = 0;
        position();
      }
    }

    function onClick(e) {
      try {
        var t = e.target;
        if (t && t.closest && t.closest(".filter-chip")) {
          // active class may flip synchronously or async; cover both
          schedule();
          window.setTimeout(schedule, 60);
        }
      } catch (err) {}
    }

    function init() {
      try {
        bar = getBar();
        if (!bar) return; // hide gracefully — nothing to attach to
        ensureInd(bar);
        document.addEventListener("click", onClick, true);
        window.addEventListener("resize", schedule, { passive: true });
        try {
          window.addEventListener("orientationchange", schedule, { passive: true });
        } catch (e2) { window.addEventListener("orientationchange", schedule); }

        if (typeof ResizeObserver !== "undefined") {
          try {
            ro = new ResizeObserver(function () { schedule(); });
            ro.observe(bar);
            var chips = bar.querySelectorAll(".filter-chip");
            for (var k = 0; k < chips.length; k++) { try { ro.observe(chips[k]); } catch (e3) {} }
          } catch (e4) { ro = null; }
        }

        // observe attribute (class) changes so indicator follows .active flips made elsewhere
        if (typeof MutationObserver !== "undefined") {
          try {
            var mo = new MutationObserver(function () { schedule(); });
            mo.observe(bar, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
          } catch (e5) {}
        }

        // fonts/late layout settling
        try {
          if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
            document.fonts.ready.then(function () { schedule(); }).catch(function () {});
          }
        } catch (e6) {}

        schedule();
        window.setTimeout(schedule, 120);
        window.setTimeout(schedule, 400);
      } catch (e) {}
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  } catch (e) {}
})();
