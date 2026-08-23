/* build-og-images.cjs — generate the 14 per-language social share cards used by
   the OG/Twitter viral loop. Each is a branded 1200×1200 square PNG at
   kb/og/kb-og-<lang>.png with that language's native tagline baked in.
   Square format avoids bad center-crops in Naver / portal search thumbnails.
   Text is rasterized by sharp (librsvg) using Windows system fonts, which cover
   Hangul / Kana / CJK / Thai / Arabic / Devanagari / Cyrillic (verified).
   Run: node build-og-images.cjs   (after kbeauty-viral.json exists). */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const VIRAL = require('./kbeauty-viral.json');
const OUT = path.join(__dirname, 'kb', 'og');
fs.mkdirSync(OUT, { recursive: true });

const W = 1200, H = 1200;
const RTL = new Set(['ar']);
// Font stack that lets librsvg resolve a glyph for every script we ship.
const FONTS = "'Malgun Gothic','Yu Gothic UI','Microsoft YaHei','Leelawadee UI','Nirmala UI','Segoe UI','Arial',sans-serif";
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Strip emoji / symbols / variation selectors — they rasterize as tofu.
const noEmoji = s => String(s).replace(/[←-⇿⌀-➿⬀-⯿️‍]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/\s+/g, ' ').trim();

// Wrap a tagline into up to 2 lines. CJK/Thai have no spaces and wider glyphs,
// so wrap by character budget; space-delimited scripts wrap on word boundaries.
function wrap(text, lang) {
  const dense = ['ko', 'ja', 'zh', 'th'].includes(lang);
  const budget = dense ? 13 : 24;
  if (text.length <= budget) return [text];
  if (dense) {
    let cut = Math.ceil(text.length / 2);
    return [text.slice(0, cut).trim(), text.slice(cut).trim()].filter(Boolean);
  }
  const words = text.split(' ');
  const lines = [''];
  for (const w of words) {
    if ((lines[lines.length - 1] + ' ' + w).trim().length > budget && lines[lines.length - 1]) lines.push(w);
    else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim();
  }
  return lines.slice(0, 2);
}

function card(lang) {
  const v = VIRAL[lang] || VIRAL.en;
  const rtl = RTL.has(lang);
  const tag = noEmoji(v.tagline) || 'K-Beauty';
  const lines = wrap(tag, lang);
  const fs2 = lines.some(l => l.length > 18) ? 64 : 74;
  const anchor = rtl ? 'end' : 'start';
  const x = rtl ? W - 80 : 80;
  const lineH = fs2 + 14;
  const startY = 580 - (lines.length - 1) * lineH / 2;
  const tagSvg = lines.map((l, i) =>
    `<text x="${x}" y="${startY + i * lineH}" font-family="${FONTS}" font-size="${fs2}" font-weight="800" fill="#ffffff" text-anchor="${anchor}">${esc(l)}</text>`
  ).join('');
  const wordmark = `<text x="${x}" y="400" font-family="${FONTS}" font-size="40" font-weight="900" fill="#ffffff" text-anchor="${anchor}" letter-spacing="1">K·BEAUTY <tspan font-weight="400" fill="#ffd6e8" font-size="26">by KoreaPlus</tspan></text>`;
  const urlPill = `<g><rect x="${rtl ? W - 80 - 430 : 80}" y="920" width="430" height="58" rx="29" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.35)"/><text x="${rtl ? W - 80 - 215 : 295}" y="958" font-family="${FONTS}" font-size="26" font-weight="700" fill="#ffffff" text-anchor="middle">koreaplus-lifes.com/kbeauty</text></g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b0b2e"/><stop offset="0.55" stop-color="#7d1f74"/><stop offset="1" stop-color="#d61f6e"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.28" r="0.5">
      <stop offset="0" stop-color="#ff8ac4" stop-opacity="0.55"/><stop offset="1" stop-color="#ff8ac4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <circle cx="${rtl ? 210 : 1000}" cy="280" r="180" fill="#ffffff" opacity="0.06"/>
  <circle cx="${rtl ? 120 : 1090}" cy="900" r="250" fill="#ffffff" opacity="0.05"/>
  <text x="${rtl ? 150 : 985}" y="720" font-size="280" opacity="0.12" text-anchor="middle">✦</text>
  ${wordmark}
  <rect x="${rtl ? W - 80 - 90 : 80}" y="458" width="90" height="7" rx="3" fill="#ffd6e8"/>
  ${tagSvg}
  ${urlPill}
</svg>`;
  return svg;
}

const LANGS = Object.keys(VIRAL);
(async () => {
  let n = 0;
  for (const lang of LANGS) {
    const svg = card(lang);
    await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(path.join(OUT, `kb-og-${lang}.png`));
    n++;
  }
  console.log(`wrote ${n} OG cards → kb/og/kb-og-<lang>.png (1200×1200)`);
})().catch(e => { console.error('OG build failed:', e); process.exit(1); });
