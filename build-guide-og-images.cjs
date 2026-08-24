/* build-guide-og-images.cjs — square (1200×1200) OG/Twitter cards for the
   KoreaPlus Guide travel hub. One PNG per hreflang locale on index.html.
   Dark navy theme matching hub-styles.css. Run: node build-guide-og-images.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const L10N = require('./guide-og-l10n.json');
const OUT = path.join(__dirname, 'og');
fs.mkdirSync(OUT, { recursive: true });

const S = 1200;
const FONTS = "'Malgun Gothic','Yu Gothic UI','Microsoft YaHei','Segoe UI','Arial',sans-serif";
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function wrap(text, lang) {
  const dense = ['ko', 'ja', 'zh'].includes(lang);
  const budget = dense ? 11 : 22;
  if (text.length <= budget) return [text];
  if (dense) {
    const cut = Math.ceil(text.length / 2);
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
  const t = L10N[lang] || L10N.en;
  const headlineLines = wrap(t.headline, lang);
  const tagLines = wrap(t.tagline, lang);
  const hFs = headlineLines.some(l => l.length > 14) ? 72 : 82;
  const tFs = tagLines.some(l => l.length > 18) ? 38 : 44;
  const hY = 520 - headlineLines.length * (hFs + 8) / 2;
  const tY = hY + headlineLines.length * (hFs + 8) + 36;

  const headlineSvg = headlineLines.map((l, i) =>
    `<text x="600" y="${hY + i * (hFs + 8)}" font-family="${FONTS}" font-size="${hFs}" font-weight="900" fill="#ffffff" text-anchor="middle">${esc(l)}</text>`
  ).join('');
  const tagSvg = tagLines.map((l, i) =>
    `<text x="600" y="${tY + i * (tFs + 6)}" font-family="${FONTS}" font-size="${tFs}" font-weight="600" fill="#a8c8f0" text-anchor="middle">${esc(l)}</text>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07122a"/><stop offset="0.55" stop-color="#0c1829"/><stop offset="1" stop-color="#000406"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.32" r="0.55">
      <stop offset="0" stop-color="#3b8eea" stop-opacity="0.35"/><stop offset="1" stop-color="#3b8eea" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <rect width="${S}" height="${S}" fill="url(#glow)"/>
  <circle cx="180" cy="200" r="140" fill="#ffffff" opacity="0.04"/>
  <circle cx="1020" cy="980" r="200" fill="#ffffff" opacity="0.03"/>
  <text x="600" y="220" font-family="${FONTS}" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">Korea<tspan fill="#74b9ff">Plus</tspan></text>
  <text x="600" y="278" font-size="56" text-anchor="middle">🇰🇷</text>
  <rect x="510" y="310" width="180" height="6" rx="3" fill="#74b9ff"/>
  ${headlineSvg}
  ${tagSvg}
  <g>
    <rect x="285" y="1040" width="630" height="64" rx="32" fill="rgba(116,185,255,0.12)" stroke="rgba(116,185,255,0.35)"/>
    <text x="600" y="1082" font-family="${FONTS}" font-size="28" font-weight="700" fill="#74b9ff" text-anchor="middle">koreaplus-lifes.com/guide</text>
  </g>
</svg>`;
}

(async () => {
  const langs = Object.keys(L10N);
  for (const lang of langs) {
    const svg = card(lang);
    await sharp(Buffer.from(svg)).png({ quality: 92 }).toFile(path.join(OUT, `guide-og-${lang}.png`));
  }
  console.log(`wrote ${langs.length} square OG cards → og/guide-og-<lang>.png (${S}×${S})`);
})().catch(e => { console.error('Guide OG build failed:', e); process.exit(1); });
