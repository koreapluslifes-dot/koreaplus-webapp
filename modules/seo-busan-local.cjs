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

  // ── "Busan right now" — month-aware season strip on the hub ───────
  // All season texts are baked per-language at build time; a tiny inline
  // script only picks the CURRENT month client-side (no i18n runtime, no
  // stale dates — the auto-freshness pattern used across the other apps).
  // Buckets: winter 12–2 · spring 3–5 · jangma 6–7 · peak 8 · typhoon 9 · autumn 10–11.
  const MONTH_BUCKET = [0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 5, 0]; // index 1–12 → bucket
  const NOW_UI = {
    en: { h: '📍 Busan right now', drone: 'Every Saturday night: the free M Drone Light Show over Gwangalli — check the official schedule for times.', b: [
      'Winter — mild by Korean standards: eomuk-and-hot-springs weather. Quiet beaches, clear night views, Dongnae baths at their best.',
      'Spring — cherry blossoms along Namcheon-dong, Oncheoncheon and Dalmaji Hill; occasional yellow-dust days, so check the air app.',
      'Jangma season — expect sudden heavy downpours. Perfect excuse for the rainy-day guide: markets, museums, jjimjilbang.',
      'Peak beach season — Haeundae and Gwangalli are packed; go early morning or pick Songjeong/Dadaepo. Sea is warmest now.',
      'Typhoon watch — most days are fine, but check KMA warnings; ferries and cable cars suspend in high wind. Sea still swimmable early month.',
      'Autumn — the local favourite: BIFF, the Gwangalli fireworks festival (check official dates) and the year’s clearest skies.' ] },
    ko: { h: '📍 지금 부산은', drone: '매주 토요일 밤, 광안리 M 드론쇼가 무료로 열려요 — 시간은 공식 일정을 확인하세요.', b: [
      '겨울 — 한국 기준으론 온화한 편이에요. 어묵과 온천의 계절, 한적한 해변과 맑은 야경, 동래 온천이 제일 좋을 때.',
      '봄 — 남천동 벚꽃길·온천천·달맞이고개에 벚꽃이 피어요. 황사 있는 날도 있으니 대기질 앱을 확인하세요.',
      '장마철 — 갑작스러운 폭우가 잦아요. 우천 실내 가이드(시장·박물관·찜질방)를 쓸 절호의 기회.',
      '극성수기 — 해운대·광안리는 붐벼요. 이른 아침에 가거나 송정·다대포로. 바닷물은 지금이 제일 따뜻해요.',
      '태풍 주의 — 대부분은 맑지만 기상청 특보를 확인하세요. 강풍엔 배·케이블카가 멈춰요.',
      '가을 — 부산 사람들이 가장 사랑하는 계절. BIFF와 광안리 불꽃축제(공식 일정 확인), 일 년 중 가장 맑은 하늘.' ] },
    ja: { h: '📍 いまの釜山', drone: '毎週土曜の夜、広安里で無料のMドローンライトショー — 時間は公式スケジュールで確認を。', b: [
      '冬 — 韓国基準では温暖。オムクと温泉の季節です。静かなビーチ、澄んだ夜景、東莱の湯がいちばん良い時期。',
      '春 — 南川洞の桜並木、温泉川、タルマジ峠に桜が咲きます。黄砂の日もあるので大気アプリを確認。',
      '梅雨 — 突然の大雨が増えます。雨の日ガイド（市場・博物館・チムジルバン）の出番です。',
      'ビーチ最盛期 — 海雲台・広安里は大混雑。早朝に行くか、松亭・多大浦へ。海水はいまが最も温かい。',
      '台風シーズン — 晴れの日が多いものの、気象庁の特報を確認。強風時は船とロープウェイが止まります。',
      '秋 — 地元がいちばん愛する季節。BIFF、広安里花火大会（公式日程を確認）、一年で最も澄んだ空。' ] },
    zh: { h: '📍 此刻的釜山', drone: '每周六晚，广安里免费M无人机灯光秀 — 具体时间以官方日程为准。', b: [
      '冬季 — 按韩国标准算温和：鱼糕加温泉的季节。海滩清静、夜景通透，东莱温泉正当时。',
      '春季 — 南川洞樱花路、温泉川、迎月岭樱花盛开；偶有黄沙天，出门前看看空气质量。',
      '梅雨季 — 常有突发暴雨。正好用上雨天指南：市场、博物馆、汗蒸房。',
      '海滩旺季 — 海云台和广安里人满为患；赶早，或改去松亭、多大浦。此时海水最暖。',
      '台风季 — 多数日子晴好，但要看气象厅预警；大风时轮渡和缆车停运。',
      '秋季 — 本地人最爱的季节：BIFF、广安里烟花节（以官方日期为准），全年天空最通透。' ] },
    es: { h: '📍 Busan ahora mismo', drone: 'Cada sábado por la noche: el M Drone Light Show gratuito sobre Gwangalli — revisa el horario oficial.', b: [
      'Invierno — suave para Corea: clima de eomuk y aguas termales. Playas tranquilas, vistas nocturnas nítidas, los baños de Dongnae en su mejor momento.',
      'Primavera — cerezos en Namcheon-dong, Oncheoncheon y Dalmaji; algunos días de polvo amarillo, revisa la app del aire.',
      'Temporada de jangma — aguaceros repentinos. La excusa perfecta para la guía de días de lluvia: mercados, museos, jjimjilbang.',
      'Plena temporada de playa — Haeundae y Gwangalli se llenan; ve temprano o elige Songjeong/Dadaepo. El mar está en su punto más cálido.',
      'Vigilancia de tifones — la mayoría de los días están bien, pero revisa los avisos del KMA; ferris y teleféricos se suspenden con viento fuerte.',
      'Otoño — el favorito local: BIFF, los fuegos artificiales de Gwangalli (fechas en la web oficial) y los cielos más despejados del año.' ] },
    fr: { h: '📍 Busan en ce moment', drone: 'Chaque samedi soir : le M Drone Light Show gratuit au-dessus de Gwangalli — horaires sur le programme officiel.', b: [
      'Hiver — doux pour la Corée : le temps de l’eomuk et des sources chaudes. Plages calmes, vues nocturnes limpides, bains de Dongnae à leur meilleur.',
      'Printemps — cerisiers à Namcheon-dong, le long de l’Oncheoncheon et sur Dalmaji ; quelques jours de poussière jaune, vérifiez l’appli air.',
      'Saison du jangma — averses soudaines et drues. L’occasion parfaite pour le guide jours de pluie : marchés, musées, jjimjilbang.',
      'Haute saison balnéaire — Haeundae et Gwangalli débordent ; venez tôt ou visez Songjeong/Dadaepo. La mer est au plus chaud.',
      'Veille typhons — la plupart des jours sont beaux, mais suivez les alertes KMA ; ferries et téléphériques s’arrêtent par grand vent.',
      'Automne — le préféré des locaux : BIFF, le festival de feux d’artifice de Gwangalli (dates officielles) et le ciel le plus clair de l’année.' ] },
    de: { h: '📍 Busan gerade jetzt', drone: 'Jeden Samstagabend: die kostenlose M Drone Light Show über Gwangalli — Zeiten im offiziellen Programm.', b: [
      'Winter — mild für Korea: Eomuk-und-Thermen-Wetter. Ruhige Strände, klare Nachtsicht, die Dongnae-Bäder in Bestform.',
      'Frühling — Kirschblüten in Namcheon-dong, am Oncheoncheon und auf dem Dalmaji-Hügel; an manchen Tagen Gelbstaub, Luft-App prüfen.',
      'Jangma-Zeit — plötzliche Regengüsse. Der perfekte Anlass für den Regentage-Guide: Märkte, Museen, Jjimjilbang.',
      'Hochsaison am Strand — Haeundae und Gwangalli sind voll; früh kommen oder nach Songjeong/Dadaepo ausweichen. Das Meer ist jetzt am wärmsten.',
      'Taifun-Wache — meist bleibt es ruhig, aber KMA-Warnungen prüfen; Fähren und Seilbahnen stoppen bei Starkwind.',
      'Herbst — der Liebling der Einheimischen: BIFF, das Feuerwerksfestival an Gwangalli (offizielle Termine prüfen) und der klarste Himmel des Jahres.' ] },
    pt: { h: '📍 Busan agora', drone: 'Todo sábado à noite: o M Drone Light Show gratuito sobre Gwangalli — confira o horário oficial.', b: [
      'Inverno — ameno para a Coreia: clima de eomuk e águas termais. Praias tranquilas, vistas noturnas nítidas, os banhos de Dongnae no auge.',
      'Primavera — cerejeiras em Namcheon-dong, no Oncheoncheon e em Dalmaji; alguns dias de poeira amarela, confira o app do ar.',
      'Temporada de jangma — aguaceiros repentinos. A desculpa perfeita para o guia de dias de chuva: mercados, museus, jjimjilbang.',
      'Alta temporada de praia — Haeundae e Gwangalli lotam; vá cedo ou escolha Songjeong/Dadaepo. O mar está no ponto mais quente.',
      'Alerta de tufões — a maioria dos dias é boa, mas confira os avisos do KMA; balsas e teleféricos param com vento forte.',
      'Outono — o favorito local: BIFF, o festival de fogos de Gwangalli (datas no site oficial) e o céu mais limpo do ano.' ] },
    id: { h: '📍 Busan saat ini', drone: 'Setiap Sabtu malam: M Drone Light Show gratis di atas Gwangalli — cek jadwal resminya.', b: [
      'Musim dingin — tergolong ringan untuk Korea: musimnya eomuk dan pemandian air panas. Pantai sepi, pemandangan malam jernih, pemandian Dongnae sedang prima.',
      'Musim semi — bunga sakura di Namcheon-dong, Oncheoncheon, dan Bukit Dalmaji; kadang ada debu kuning, cek aplikasi kualitas udara.',
      'Musim jangma — hujan deras tiba-tiba. Alasan sempurna memakai panduan hari hujan: pasar, museum, jjimjilbang.',
      'Puncak musim pantai — Haeundae dan Gwangalli penuh sesak; datang pagi-pagi atau pilih Songjeong/Dadaepo. Laut paling hangat sekarang.',
      'Siaga topan — kebanyakan hari tetap cerah, tapi pantau peringatan KMA; feri dan kereta gantung berhenti saat angin kencang.',
      'Musim gugur — favorit warga lokal: BIFF, festival kembang api Gwangalli (cek tanggal resmi), dan langit terjernih sepanjang tahun.' ] },
  };
  function nowStrip(l) {
    const N = NOW_UI[l] || NOW_UI.en;
    // 12 hidden month slots resolved to their bucket text; JS reveals the current one.
    const slots = Array.from({ length: 12 }, (_, i) =>
      `<span data-kpbn="${i + 1}" hidden>${esc(N.b[MONTH_BUCKET[i + 1]])}</span>`).join('');
    return `<div class="seo-pricebox" id="kp-busan-now"><strong>${esc(N.h)}</strong> ${slots}`
      + `<div class="note">${esc(N.drone)}</div></div>`
      + `<script>(function(){try{var m=new Date().getMonth()+1;var e=document.querySelector('#kp-busan-now [data-kpbn="'+m+'"]');if(e)e.hidden=false;}catch(e){}})();</script>`;
  }

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
    body += nowStrip(l);
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
        { name: t.hubH1, description: t.hubLead }) : null,
        // TouristDestination — tells search engines this hub IS the Busan
        // travel entity, with its marquee places attached.
        { '@context': 'https://schema.org', '@type': 'TouristDestination',
          name: 'Busan', alternateName: '부산', url: ORIGIN + url,
          description: t.hubLead,
          image: bi ? bi.raw : undefined,
          geo: { '@type': 'GeoCoordinates', latitude: 35.1796, longitude: 129.0756 },
          containsPlace: ['Haeundae Beach', 'Gwangalli Beach', 'Gamcheon Culture Village', 'Jagalchi Market', 'Beomeosa', 'Taejongdae']
            .filter(n => IMGS[n]).map(n => ({ '@type': 'TouristAttraction', name: n, image: IMGS[n].raw })),
          touristType: ['Couples', 'Families', 'Solo travellers', 'Food travellers'] },
      ].filter(Boolean),
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
