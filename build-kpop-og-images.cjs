/* build-kpop-og-images.cjs — square 1200×1200 portal/social cards for the K-Pop channel.
   Naver and other portals crop og:image to a square thumbnail; a 1200×630 landscape
   card loses its edges. One PNG per channel language at og/kpop-og-<lang>.png.
   Run: node build-kpop-og-images.cjs */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const L10N = require('./kpop-og-l10n.json');
const OUT = path.join(__dirname, 'og');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 1200;
const RTL = new Set(['ar']);
const FONTS = "'Malgun Gothic','Yu Gothic UI','Microsoft YaHei','Leelawadee UI','Nirmala UI','Segoe UI','Arial',sans-serif";
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function wrap(text, lang) {
  const dense = ['ko', 'ja', 'zh', 'th'].includes(lang);
  const budget = dense ? 10 : 16;
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
  return lines.slice(0, 3);
}

function card(lang) {
  const v = L10N[lang] || L10N.en;
  const rtl = RTL.has(lang);
  const tag = v.tagline;
  const lines = wrap(tag, lang);
  const fs2 = lines.some(l => l.length > 14) ? 58 : 68;
  const anchor = rtl ? 'end' : 'start';
  const x = rtl ? SIZE - 96 : 96;
  const lineH = fs2 + 12;
  const startY = 560 - ((lines.length - 1) * lineH) / 2;
  const tagSvg = lines.map((l, i) =>
    `<text x="${x}" y="${startY + i * lineH}" font-family="${FONTS}" font-size="${fs2}" font-weight="800" fill="#ffffff" text-anchor="${anchor}">${esc(l)}</text>`
  ).join('');
  const wordmark = `<text x="${x}" y="220" font-family="${FONTS}" font-size="44" font-weight="900" fill="#ffffff" text-anchor="${anchor}" letter-spacing="1">K·POP <tspan font-weight="400" fill="#ffb8d9" font-size="28">by KoreaPlus</tspan></text>`;
  const mic = `<text x="${SIZE / 2}" y="420" font-size="200" text-anchor="middle" opacity="0.22">🎤</text>`;
  const urlPill = `<g><rect x="${SIZE / 2 - 250}" y="960" width="500" height="64" rx="32" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.35)"/><text x="${SIZE / 2}" y="1002" font-family="${FONTS}" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">koreaplus-lifes.com/kpop</text></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050810"/><stop offset="0.45" stop-color="#1a0a2e"/><stop offset="1" stop-color="#d6155f"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.22" r="0.55">
      <stop offset="0" stop-color="#7c3aed" stop-opacity="0.45"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#glow)"/>
  <circle cx="${rtl ? 220 : 980}" cy="200" r="180" fill="#ffffff" opacity="0.05"/>
  <circle cx="${rtl ? 140 : 1060}" cy="900" r="240" fill="#ffffff" opacity="0.04"/>
  ${mic}
  ${wordmark}
  <rect x="${rtl ? SIZE - 96 - 100 : 96}" y="248" width="100" height="8" rx="4" fill="#d6155f"/>
  ${tagSvg}
  ${urlPill}
</svg>`;
}

(async () => {
  let n = 0;
  for (const lang of Object.keys(L10N)) {
    await sharp(Buffer.from(card(lang))).png({ quality: 92 }).toFile(path.join(OUT, `kpop-og-${lang}.png`));
    n++;
  }
  console.log(`wrote ${n} square OG cards → og/kpop-og-<lang>.png (${SIZE}×${SIZE})`);
})().catch(e => { console.error('K-Pop OG build failed:', e); process.exit(1); });
