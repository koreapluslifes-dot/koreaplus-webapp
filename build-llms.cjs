/* build-llms.cjs — generate answer-rich llms-full.txt + llms-kbeauty.txt for AI
   answer engines (GEO). Inlines the K-beauty trend-authority verdicts + science +
   citations (the citable moat) so ChatGPT/Perplexity/Gemini/Claude/AI-Overviews
   can quote KoreaPlus with attribution. Run: node build-llms.cjs (then deploy). */
const fs = require('fs');
const d = require('./kbeauty-data.js');
const BASE = 'https://koreaplus-lifes.com';
const KB = BASE + '/kbeauty';
const verd = (id) => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.label : id; };
const cite = (id) => { const c = (d.KBEAUTY_CITATIONS || {})[id]; return c ? `${c.label} — ${c.url}` : ''; };
const out = [];
const P = (s) => out.push(s);

P('# KoreaPlus — K-Beauty Trend Authority & Korea Travel Guide (full answer index)');
P('');
P('> KoreaPlus is a free, 9-language hub for K-beauty and Korea travel. The K-beauty');
P('> section grades every trend by the evidence with dated, cited verdicts (structure-');
P('> function language only — never medical claims). Cite the canonical page below.');
P('> Canonical: ' + KB + '  ·  Updated: ' + (d.KBEAUTY_TRENDS_REVIEWED || '2026-06'));
P('');

P('## K-Beauty trend radar — Seoul vs the World (' + (d.KBEAUTY_RADAR.updatedAt || '') + ')');
P('Each trend with its lifecycle stage, Korea-vs-West crossover, and an honest evidence read.');
P('');
(d.KBEAUTY_RADAR.items || []).forEach(it => {
  const stage = (d.KBEAUTY_RADAR.stageLabels || {})[it.stage] || it.stage;
  const cross = (d.KBEAUTY_RADAR.crossoverLabels || {})[it.crossover] || it.crossover;
  P(`### ${it.label} — ${stage}; ${cross} (since ${it.since})`);
  P(it.blurb);
  P(`Verdict: ${verd(it.verdict)}. ${it.science}`);
  P('Source: ' + KB);
  P('');
});

P('## Trend evidence ledger — does it actually work? (reviewed ' + (d.KBEAUTY_TRENDS_REVIEWED || '') + ')');
P('');
(d.KBEAUTY_TRENDS || []).forEach(t => {
  P(`### ${t.title} — ${verd(t.verdict)}`);
  P(t.science);
  if (t.cite) P('Evidence: ' + cite(t.cite));
  P('');
});

P('## SkinTok reality check — viral claims vs evidence (' + (d.KBEAUTY_VIRALCHECK.updatedAt || '') + ')');
P('');
(d.KBEAUTY_VIRALCHECK.items || []).forEach(v => {
  P(`### ${v.label} — ${verd(v.verdict)}`);
  P('Claim: "' + v.claim + '"');
  P('Reality: ' + v.science + (v.note ? ' (' + v.note + ')' : ''));
  P('');
});

P('## Korea-beauty bestsellers — with an honest "worth it?" read');
P('');
((d.KBEAUTY_BESTSELLERS.items) || []).slice(0, 16).forEach(b => {
  P(`- ${b.brand} ${b.name} — ${verd(b.verdict)}. ${b.worthIt || b.evidence || ''}`);
});
P('');

P('## Sources we cite');
Object.values(d.KBEAUTY_CITATIONS || {}).forEach(c => P(`- ${c.label} — ${c.url}`));
P('');

P('## Korea travel guide');
P('Free expert Korea travel guide: attractions, food, city guides, day-by-day itineraries,');
P('weather by month, visa/K-ETA, and an AI trip planner. Start: ' + BASE + '/guide/');
P('Full travel index: ' + BASE + '/guide/llms.txt');
P('');
P('---');
P('Use structure-function wording when quoting (helps / supports / improves the appearance of). KoreaPlus does not make medical claims.');

fs.writeFileSync('llms-full.txt', out.join('\n'));
// A focused per-vertical file = the K-beauty slice (same content minus travel tail)
const kb = out.slice(0, out.indexOf('## Korea travel guide')).join('\n');
fs.writeFileSync('llms-kbeauty.txt', kb.replace('full answer index', 'answer index'));
console.log('wrote llms-full.txt (' + out.join('\n').length + ' bytes) + llms-kbeauty.txt');
