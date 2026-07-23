---
trigger: model_decision
description: "Rule for koreaplus-webapp: scroll-perf-pc.md"
---
User reported PC mouse-wheel scrolling "원활하지 않다" (janky/sluggish) **three times**; each round revealed a distinct cause. Fixed 2026-07-03 (commit 7aa3d64, plus earlier 629e362).

**The three culprits, in the order found:**
1. **Global `html{scroll-behavior:smooth}`** (style.css + hub-styles.css) — made every wheel tick animate → rubbery. Removed; JS scrolls now opt into `behavior:'smooth'` explicitly. (theme.css keeps `scroll-behavior:auto` only under prefers-reduced-motion — that's fine, leave it.)
2. **`{passive:false}` wheel listener on the hero map** (`app.js`, `mapEl`, was for Ctrl+wheel zoom). The map fills the whole first screen (`.map-hero` = `100dvh`), so a non-passive wheel handler forced EVERY wheel tick through the main thread — which is busy painting the animated SVG (pulsing city dots, radial-gradient light halos) — so the first screenful stuttered. **Removed the wheel-zoom entirely**; zoom stays on the +/−/⌂ SVG buttons and touch pinch. This was the biggest win. Also removed the now-wrong "Ctrl + scroll to zoom" hint (was map.hint1/hint2 i18n keys).
3. **`backdrop-filter: blur(20px)` on the fixed `.header`** (home) and `blur(12px)` on the sticky `.hub-nav` (SEO) — the browser recomputes the blur across the full-width bar every scroll frame. Cut to **10px** (home) / **8px** (hub-nav), bumped base bg opacity a touch for legibility. Also made the header's scroll listener `{passive:true}`.

**Diagnostic pattern for "scroll feels janky" — check in this order:** (a) global `scroll-behavior:smooth`; (b) any `{passive:false}` wheel/touch listener over a large scroll area (grep `addEventListener('wheel'` + look at the passive flag — a non-passive handler blocks the compositor fast-path even if it early-returns); (c) `backdrop-filter: blur()` on `position:fixed`/`sticky` bars (radius ∝ per-frame paint cost); (d) `background-attachment:fixed`. Verify in preview by dispatching a cancelable WheelEvent over the suspect element and checking `!dispatchEvent(ev)` (true = something preventDefault'd = blocks scroll), plus `getComputedStyle(html).scrollBehavior` should be `auto`.

Related: [[mobile-framework]] (bottom tab bar + mobile bottom padding 60→84px so the tab bar doesn't clip last content), [[app-redesign-and-detail-l10n]].
