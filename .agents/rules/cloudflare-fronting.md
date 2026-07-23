---
trigger: model_decision
description: "Rule for koreaplus-webapp: cloudflare-fronting.md"
---
The production domain **koreaplus-lifes.com** (the static guide at `/guide/`, deployed to Lightsail `18.207.55.50`) is served **through Cloudflare**, which has **Cloudflare Fonts** (font optimization) enabled.

Cloudflare rewrites the page on the edge: it **strips the `<link rel="preconnect" href="https://fonts.googleapis.com">` / `fonts.gstatic.com` hints and the Google Fonts CSS `<link>`**, replacing them with self-hosted `@font-face` rules pointing at same-origin `/cf-fonts/...woff2`. Other preconnects (e.g. `pagead2.googlesyndication.com`) and `dns-prefetch` survive.

**Implication when verifying deploys with curl:** prod HTML will NOT match the deployed source for font/preconnect lines — `grep fonts.gstatic.com` on a live page returns 0 even though the source file has it. This is expected optimization (same-origin fonts beat a preconnect), **not a deploy failure**. Verify deploys using non-font signals (asset `?v=` versions, viewport-fit, your own added markup).

Cloudflare may also cache HTML; a `?cb=<timestamp>` query usually busts it for spot-checks. The Worker backend is separate: `koreaplus-webapp.jeybeeicon.workers.dev`.
