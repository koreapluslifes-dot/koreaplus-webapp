---
trigger: model_decision
description: "Rule for koreaplus-webapp: cross-domain-growth-elements.md"
---
Ported 9 "growth elements from other industries" into the Korea travel webapp (all LIVE on koreaplus-lifes.com/guide/, deployed via tar→sudo, pushed to main):

1. **Viral quiz** — `quiz.html` "Which Korean City Should You Visit?" (7-Q, scores 6 cities → city-photo result + Web-Share + **canvas share card**). Social/BuzzFeed pattern.
2. **Share card** — canvas PNG built in quiz.html (Spotify-Wrapped style), shared via `navigator.share({files})` or downloaded.
3. **Bucket list** — `bucket-list.html` 40-item interactive checklist, localStorage progress %, share-your-score. Gaming/productivity pattern.
4. **Seasonal countdown** — added to `modules/korea-now.js` (`countdown(L)` + bumped to ?v=2): 🌸 cherry-blossom / 🍁 foliage **D-day** on the live strip across all pages, 9-lang. E-commerce urgency.
5. **Compare tool** — `compare.html` pick-2-3 city comparator (vibe/days/food/transport/season), shareable `?cities=` URL. SaaS pattern, targets "Seoul vs Busan" search.
6. **For-you personalization** — `modules/foryou.js` (#kp-foryou placeholder in shell, ?v=1): localStorage "Recently viewed" + "You might also like" rail on every SEO page, 9-lang. E-commerce recs.
7. **Embed widgets** — `widget.js` (one-line `<script data-kp=now|quiz|cost>`) injects a card with a **visible backlink** to KoreaPlus on any site that embeds it; `embed.html` showcase. Fintech/weather-embed backlink loop.
8. **Trending hub** — `trending.html` "Trending in Korea Right Now": live Korea-now strip + weekly-rotating "Hot this week" grid + "Most-loved guides" ranked by REAL `/api/react` reader votes (client-side, curated fallback; NO worker change). News/media most-read pattern.
9. **PWA install nudge** — `modules/install.js` (in shell, ?v=1): dismissible 9-lang "Install KoreaPlus" banner on `beforeinstallprompt`. App-store retention. **SW + lifecycle stay owned by `modules/pwa.js`** (loaded via header.js theme→…→nav→pwa chain on every SEO page) — install.js must NOT register the SW or set `window.__kpPwaInit`, or it wins the defer-vs-DOMContentLoaded race and suppresses pwa.js's update toast + controllerchange reload (caught by adversarial QA, fixed).

All linked from the all-pages footer + Explore "🎮 Fun & Interactive" section + sitemap; IndexNow-pinged. See [[authority-elements-airkorea-key]] for the prior 20 (authority+search) elements.

**Excluded by user (2026-06-20):** ⑨ Email capture / lead magnet — user said "이메일 서비스는 빼고 진행해줘" (skip the email service). Would need an email provider account (Mailchimp/ConvertKit/Beehiiv) to actually send anyway.
