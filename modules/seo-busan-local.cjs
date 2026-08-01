/* ══════════════════════════════════════════════════════════════════
   modules/seo-busan-local.cjs — "Busan Like a Local" insider-guide cluster.

   Pages (main/travel channel, __out.main):
     busan/index.html              — hub listing the 6 insider topics
     busan/<slug>.html             — 6 topic pages (eat-like-a-local, …)
   …emitted per language: en at busan/, locales at <dir>/busan/, but ONLY
   for languages present in busan-local.json (translations land there
   incrementally; the build never blocks on a missing language).

   Data (read-only, defensive — module emits nothing if files are absent):
     • busan-local.json  — { "<slug>": { _emoji, "<lang>": PAGE } } where PAGE =
         { h1,title,metaDesc,lead,facts[],sections[{h,paras[],list?,listType?}],
           spots[{name,kr,wiki,desc,tip,mapQ}], faq[[q,a]], tips[] }
       spots[].kr/wiki/mapQ are language-invariant (copied verbatim by the
       translation workflow).
     • busan-images.json — { "<wikiTitle>": {raw,alt,by,byUrl,link,license,file} }
       Wikimedia-only images (accuracy rule: a spot with no accurate image
       renders text-only rather than a wrong photo).

   Contract: CommonJS factory over the frozen CTX; all build-seo helpers via
   ctx. urls() returns {lang,url}[] for the sitemap. hreflang clusters are
   registered by shell() from the alts we pass (alts exclude self).
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (ctx) {
  const {
    shell, writePage, BASEP, L10N, LOCALES,
    esc, enc, bcHtml, breadcrumbLD, faqLD, keyFactsBox, ld,
  } = ctx;

  const ORIGIN = 'https://koreaplus-lifes.com';

  function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8')); }
    catch { return null; }
  }
  const DATA = loadJSON('busan-local.json') || {};
  const IMGS = loadJSON('busan-images.json') || {};

  const SLUGS = Object.keys(DATA);
  const LANGS = ['en', ...LOCALES];
  const dirp = l => (l === 'en' ? '' : (L10N[l] && L10N[l].dir ? L10N[l].dir + '/' : ''));
  const has = (sl, l) => !!(DATA[sl] && DATA[sl][l] && DATA[sl][l].h1);
  const pagePath = (sl, l) => `${dirp(l)}busan/${sl}.html`;
  const hubPath = l => `${dirp(l)}busan/index.html`;
  const pageUrl = (sl, l) => `${BASEP}${pagePath(sl, l)}`;
  const hubUrl = l => `${BASEP}${hubPath(l)}`;

  // ── 9-language UI chrome ──────────────────────────────────────────
  const UI = {
    en: { home: 'Home', hub: 'Busan Like a Local', hubH1: 'Busan Like a Local — Insider Guide by Locals', hubLead: 'Not the top-10 lists — the gukbap alleys, cliff villages, drone-show sand spots and transit tricks that people who live in Busan actually use. Written by locals, checked against the city.', topicsH: "The six guides", byLocals: 'By Busan locals', spotsH: 'The exact spots', tipsH: 'Quick honey tips (꿀팁)', faqH: 'FAQ', map: 'Google Maps', relatedH: 'More Busan like a local', cityGuide: '📍 Busan city guide', itin: '🗓️ Busan 3-day itinerary', photo: 'Photo' },
    ko: { home: '홈', hub: '로컬처럼 부산 여행', hubH1: '로컬처럼 부산 여행 — 현지인이 직접 쓴 꿀정보', hubLead: '뻔한 톱10 말고, 부산 사람들이 진짜 가는 국밥 골목·절벽 마을·드론쇼 명당·교통 꿀팁만 모았어요. 현지인이 쓰고 도시에서 직접 확인했습니다.', topicsH: "여섯 가지 가이드", byLocals: '부산 로컬 작성', spotsH: '스팟 정리', tipsH: '꿀팁 모음', faqH: '자주 묻는 질문', map: '구글 지도', relatedH: '로컬처럼 부산 더 보기', cityGuide: '📍 부산 여행 가이드', itin: '🗓️ 부산 3일 일정', photo: '사진' },
    ja: { home: 'ホーム', hub: 'ローカル釜山', hubH1: 'ローカルのように釜山を旅する — 現地人の本音ガイド', hubLead: '定番トップ10ではなく、釜山に住む人が本当に通うクッパ横丁・崖の村・ドローンショーの特等席・交通のコツだけを集めました。', topicsH: "6つのガイド", byLocals: '釜山ローカル執筆', spotsH: 'スポット一覧', tipsH: 'クイック豆知識', faqH: 'よくある質問', map: 'Googleマップ', relatedH: 'ローカル釜山をもっと見る', cityGuide: '📍 釜山旅行ガイド', itin: '🗓️ 釜山3日モデルコース', photo: '写真' },
    zh: { home: '首页', hub: '像本地人一样玩釜山', hubH1: '像本地人一样玩釜山 — 本地人亲笔攻略', hubLead: '不是老套的十大榜单，而是釜山本地人真正常去的猪肉汤饭巷、悬崖村落、无人机秀最佳位置和交通窍门。', topicsH: "六大主题攻略", byLocals: '釜山本地人撰写', spotsH: '地点清单', tipsH: '实用小贴士', faqH: '常见问题', map: '谷歌地图', relatedH: '更多釜山本地玩法', cityGuide: '📍 釜山城市指南', itin: '🗓️ 釜山3日行程', photo: '照片' },
    es: { home: 'Inicio', hub: 'Busan como un local', hubH1: 'Busan como un local — Guía de los que viven allí', hubLead: 'Nada de listas top-10: los callejones de gukbap, aldeas en acantilados, mejores puntos del show de drones y trucos de transporte que usan los que viven en Busan.', topicsH: "Las seis guías", byLocals: 'Por locales de Busan', spotsH: 'Los lugares exactos', tipsH: 'Tips rápidos (kkultip)', faqH: 'Preguntas frecuentes', map: 'Google Maps', relatedH: 'Más Busan como un local', cityGuide: '📍 Guía de Busan', itin: '🗓️ Itinerario de 3 días', photo: 'Foto' },
    fr: { home: 'Accueil', hub: 'Busan comme un local', hubH1: 'Busan comme un local — le guide des habitants', hubLead: 'Pas de top-10 touristique : les ruelles à gukbap, villages à flanc de falaise, meilleurs spots du show de drones et astuces transport des habitants de Busan.', topicsH: "Les six guides", byLocals: 'Par des locaux de Busan', spotsH: 'Les adresses exactes', tipsH: 'Astuces rapides', faqH: 'FAQ', map: 'Google Maps', relatedH: 'Plus de Busan comme un local', cityGuide: '📍 Guide de Busan', itin: '🗓️ Itinéraire 3 jours', photo: 'Photo' },
    de: { home: 'Start', hub: 'Busan wie ein Local', hubH1: 'Busan wie ein Local — Insider-Guide von Einheimischen', hubLead: 'Keine Top-10-Listen: die Gukbap-Gassen, Klippendörfer, besten Plätze für die Drohnenshow und Verkehrstricks, die Busaner wirklich nutzen.', topicsH: "Die sechs Guides", byLocals: 'Von Busan-Locals', spotsH: 'Die genauen Orte', tipsH: 'Schnelle Insider-Tipps', faqH: 'FAQ', map: 'Google Maps', relatedH: 'Mehr Busan wie ein Local', cityGuide: '📍 Busan-Stadtguide', itin: '🗓️ 3-Tage-Route', photo: 'Foto' },
    pt: { home: 'Início', hub: 'Busan como um local', hubH1: 'Busan como um local — guia de quem vive lá', hubLead: 'Nada de listas top-10: os becos de gukbap, vilas no penhasco, melhores pontos do show de drones e truques de transporte que quem mora em Busan realmente usa.', topicsH: "Os seis guias", byLocals: 'Por locais de Busan', spotsH: 'Os lugares exatos', tipsH: 'Dicas rápidas', faqH: 'Perguntas frequentes', map: 'Google Maps', relatedH: 'Mais Busan como um local', cityGuide: '📍 Guia de Busan', itin: '🗓️ Roteiro de 3 dias', photo: 'Foto' },
    id: { home: 'Beranda', hub: 'Busan ala Warga Lokal', hubH1: 'Busan ala Warga Lokal — Panduan Orang Dalam', hubLead: 'Bukan daftar top-10 biasa: gang gukbap, kampung tebing, titik terbaik drone show, dan trik transportasi yang benar-benar dipakai warga Busan.', topicsH: "Enam panduan", byLocals: 'Oleh warga lokal Busan', spotsH: 'Lokasi persisnya', tipsH: 'Tips kilat', faqH: 'Tanya jawab', map: 'Google Maps', relatedH: 'Busan ala lokal lainnya', cityGuide: '📍 Panduan kota Busan', itin: '🗓️ Itinerari 3 hari', photo: 'Foto' },
  };
  const ui = l => UI[l] || UI.en;

  // ── helpers ───────────────────────────────────────────────────────
  // Cut on a word boundary — a hard slice() left "…Written by l" in the hub's
  // meta description, which also fed og:description and every social unfurl.
  function trimWords(s, max) {
    s = String(s || '').trim();
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    // CJK has no spaces: only rewind to a space when the text actually has one.
    const sp = cut.lastIndexOf(' ');
    return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:·—-]+$/, '') + '…';
  }

  function credit(im, label) {
    const lic = im.license ? ` · ${esc(im.license)}` : '';
    return `${esc(label)}: <a href="${esc(im.byUrl)}" rel="noopener nofollow" target="_blank">${esc(im.by)}</a> / Wikimedia Commons${lic}`;
  }
  function figure(im, alt, label, eager) {
    if (!im || !im.raw) return '';
    return `<figure class="seo-hero-figure" style="margin:0 0 18px;border-radius:14px;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1))">`
      + `<img src="${esc(im.raw)}" alt="${esc(alt)}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} style="width:100%;height:auto;display:block;aspect-ratio:16/9;object-fit:cover">`
      + `<figcaption style="font-size:11px;color:var(--text3,#8a93a0);padding:6px 10px">${credit(im, label)}</figcaption></figure>`;
  }
  function heroImg(sl) { // page lead image = first spot with an accurate photo
    const en = DATA[sl] && DATA[sl].en; if (!en) return null;
    for (const sp of en.spots || []) { if (sp.wiki && IMGS[sp.wiki]) return IMGS[sp.wiki]; }
    return IMGS['Busan'] || null;
  }
  function altsFor(sl, l) { // hreflang cluster minus self (shell adds self)
    return LANGS.filter(x => x !== l && (sl === '__hub' ? true : has(sl, x)))
      .filter(x => sl !== '__hub' || SLUGS.some(s => has(s, x)))
      .map(x => ({ lang: x, url: sl === '__hub' ? hubUrl(x) : pageUrl(sl, x) }));
  }

  // ── topic page ────────────────────────────────────────────────────
  function buildTopic(sl, l) {
    const p = DATA[sl][l]; const t = ui(l); const d = dirp(l);
    const url = pageUrl(sl, l);
    const emoji = DATA[sl]._emoji || '🌊';
    const trail = [
      { name: t.home, url: BASEP },
      { name: t.hub, url: hubUrl(l) },
      { name: p.h1, url },
    ];
    let body = bcHtml(trail);
    body += `<p class="lead">${esc(p.lead)}</p>`;
    const hi = heroImg(sl);
    if (hi) body += figure(hi, p.h1, t.photo, true);
    if (Array.isArray(p.facts) && p.facts.length) body += keyFactsBox(p.facts.map(esc));

    for (const s of p.sections || []) {
      body += `<h2>${esc(s.h)}</h2>`;
      for (const para of s.paras || []) body += `<p>${esc(para)}</p>`;
      if (Array.isArray(s.list) && s.list.length) {
        const tag = s.listType === 'ol' ? 'ol' : 'ul';
        const cls = tag === 'ol' ? ' class="steps"' : ' class="tips"';
        body += `<${tag}${cls}>${s.list.map(x => `<li>${esc(x)}</li>`).join('')}</${tag}>`;
      }
    }

    // spots — card per spot; image only when accurate (Wikimedia hit)
    if (Array.isArray(p.spots) && p.spots.length) {
      body += `<h2>📍 ${esc(t.spotsH)}</h2>`;
      // A district-wide shot must not be captioned as two different villages:
      // one file renders at most once per page.
      const usedImg = new Set();
      for (const sp of p.spots) {
        let im = sp.wiki && IMGS[sp.wiki];
        if (im && usedImg.has(im.raw)) im = null; else if (im) usedImg.add(im.raw);
        body += `<div class="seo-day">`
          + `<h3 class="dh">${esc(sp.name)}</h3>`
          + (sp.kr ? `<div class="ds">${esc(sp.kr)}</div>` : '')
          + (im ? figure(im, sp.name, t.photo, false) : '')
          + `<p>${esc(sp.desc)}</p>`
          + (sp.tip ? `<p>💡 <em>${esc(sp.tip)}</em></p>` : '')
          + (sp.mapQ ? `<div class="seo-links"><a href="https://www.google.com/maps/search/?api=1&query=${enc(sp.mapQ)}" target="_blank" rel="noopener nofollow">🗺️ ${esc(t.map)}</a></div>` : '')
          + `</div>`;
      }
    }

    if (Array.isArray(p.tips) && p.tips.length) {
      body += `<h2>💡 ${esc(t.tipsH)}</h2><ul class="tips">${p.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    }

    const qa = (p.faq || []).filter(x => Array.isArray(x) && x[0] && x[1]);
    if (qa.length) {
      body += `<h2>${esc(t.faqH)}</h2><div class="seo-faq">`
        + qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('') + `</div>`;
    }

    // related: sibling topics in this language + city guide + itinerary
    const peers = SLUGS.filter(s => s !== sl && has(s, l)).map(s =>
      `<a class="seo-card" href="${esc(pagePath(s, l))}"><span class="ce">${DATA[s]._emoji || '🌊'}</span><div class="cn">${esc(DATA[s][l].h1)}</div></a>`);
    if (peers.length) body += `<h2>${esc(t.relatedH)}</h2><div class="seo-grid">${peers.join('')}</div>`;
    body += `<div class="seo-linklist">`
      + `<a href="${esc(hubPath(l))}">🌊 ${esc(t.hub)}</a>`
      + `<a href="${esc(d)}guide/things-to-do-in-busan.html">${esc(t.cityGuide)}</a>`
      + `<a href="${esc(d)}itinerary/busan-3-day-itinerary.html">${esc(t.itin)}</a>`
      + `</div>`;

    const hero = `<header class="seo-hero"><span class="emoji">${emoji}</span>`
      + `<h1>${esc(p.h1)}</h1>`
      + `<div class="meta"><span class="seo-badge region">🇰🇷 ${esc(t.byLocals)}</span><span class="seo-badge">Busan · 부산</span></div>`
      + `</header>`;

    writePage(pagePath(sl, l), shell({
      url, title: p.title, desc: p.metaDesc, keywords: '',
      schemas: [breadcrumbLD(trail), qa.length ? faqLD(qa) : null].filter(Boolean),
      hero, body, lang: l, alts: altsFor(sl, l),
      image: hi ? hi.raw : undefined,
    }));
    return { lang: l, url };
  }

  // ── hub page ──────────────────────────────────────────────────────
  function buildHubPage(l) {
    const t = ui(l); const d = dirp(l);
    const url = hubUrl(l);
    const avail = SLUGS.filter(s => has(s, l));
    if (!avail.length) return null;
    const trail = [{ name: t.home, url: BASEP }, { name: t.hub, url }];
    let body = bcHtml(trail);
    body += `<p class="lead">${esc(t.hubLead)}</p>`;
    const bi = IMGS['Busan'] || IMGS['Gwangan Bridge'];
    if (bi) body += figure(bi, 'Busan, South Korea', t.photo, true);
    body += `<h2>${esc(t.topicsH)}</h2><div class="seo-tiles">` + avail.map(s => {
      const p = DATA[s][l];
      return `<a class="seo-tile" href="${esc(pagePath(s, l))}">`
        + `<span class="seo-tile-e">${DATA[s]._emoji || '🌊'}</span>`
        + `<span class="seo-tile-h">${esc(p.h1)}</span>`
        + `<span class="seo-tile-d">${esc(trimWords(p.metaDesc, 110))}</span></a>`;
    }).join('') + `</div>`;
    body += `<h2>${esc(t.relatedH)}</h2><div class="seo-linklist">`
      + `<a href="${esc(d)}guide/things-to-do-in-busan.html">${esc(t.cityGuide)}</a>`
      + `<a href="${esc(d)}itinerary/busan-3-day-itinerary.html">${esc(t.itin)}</a>`
      + `<a href="${esc(d === '' ? 'destinations.html' : d + 'destinations.html')}">🧭 ${esc(t.home)} · Korea</a>`
      + `</div>`;
    const hero = `<header class="seo-hero"><span class="emoji">🌊</span>`
      + `<h1>${esc(t.hubH1)}</h1>`
      + `<div class="meta"><span class="seo-badge region">🇰🇷 ${esc(t.byLocals)}</span><span class="seo-badge">Busan · 부산</span></div></header>`;
    const title = `${t.hubH1.split(' — ')[0]} | KoreaPlus`;
    writePage(hubPath(l), shell({
      url, title, desc: trimWords(t.hubLead, 155), keywords: '',
      schemas: [breadcrumbLD(trail), (ld && ld.itemListLD) ? ld.itemListLD(
        avail.map(s => ({ name: DATA[s][l].h1, url: ORIGIN + BASEP + pagePath(s, l) })),
        { name: t.hubH1, description: t.hubLead }) : null].filter(Boolean),
      hero, body, lang: l, alts: altsFor('__hub', l),
      image: bi ? bi.raw : undefined,
    }));
    return { lang: l, url };
  }

  // ── entry ─────────────────────────────────────────────────────────
  function urls() {
    const out = [];
    for (const l of LANGS) {
      for (const sl of SLUGS) if (has(sl, l)) out.push(buildTopic(sl, l));
      const h = buildHubPage(l); if (h) out.push(h);
    }
    return out.filter(Boolean);
  }

  return { urls };
};
