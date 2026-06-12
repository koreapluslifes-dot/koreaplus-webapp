/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — Static SEO page generator
   Reads data.js + detail-data.js and emits crawlable HTML pages:
     • /guide/places/{slug}.html       — 90 place/topic pages
     • /guide/guide/{slug}.html        — city guides + "best of" + months
     • /guide/itinerary/{slug}.html    — day-by-day itinerary templates
     • /guide/explore.html             — internal-linking hub
     • /guide/sitemap.xml              — full sitemap (regenerated)
   Each page ships JSON-LD (TouristAttraction / Article / ItemList /
   FAQPage / BreadcrumbList) + canonical + OpenGraph.
   Run:  node build-seo.cjs
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ORIGIN = 'https://koreaplus-lifes.com';
const BASEP = '/guide/';
const OUT = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);

// ── Load data ───────────────────────────────────────────────────────
function loadData() {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(OUT, 'data.js'), 'utf8') +
    '\nthis.KOREA_DATA=KOREA_DATA; this.CITIES=CITIES;', ctx);
  const dctx = { window: {} }; vm.createContext(dctx);
  vm.runInContext(fs.readFileSync(path.join(OUT, 'detail-data.js'), 'utf8'), dctx);
  return { KOREA_DATA: ctx.KOREA_DATA, CITIES: ctx.CITIES, DETAIL: dctx.window.DETAIL_DATA || {} };
}
const { KOREA_DATA, CITIES, DETAIL } = loadData();

// ── Helpers ─────────────────────────────────────────────────────────
const slug = s => String(s).toLowerCase()
  .replace(/['']/g, '').replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = s => encodeURIComponent(s);
const jsonld = obj => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
const writePage = (rel, html) => {
  const fp = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, html);
};

const CAT_META = {
  food:      { label: 'Korean Food',     icon: '🍜', noun: 'dish' },
  travel:    { label: 'Travel',          icon: '✈️', noun: 'destination' },
  transport: { label: 'Transport',       icon: '🚄', noun: 'option' },
  companies: { label: 'Companies',       icon: '🏢', noun: 'company' },
  kbeauty:   { label: 'K-Beauty',        icon: '💄', noun: 'topic' },
  kpop:      { label: 'K-Pop & Culture', icon: '🎤', noun: 'experience' },
  shopping:  { label: 'Shopping',        icon: '🛍️', noun: 'spot' },
  history:   { label: 'History',         icon: '📜', noun: 'topic' },
};
const ATTRACTION_CATS = new Set(['travel', 'shopping', 'kbeauty', 'kpop']);
// clean, keyword-rich category page slugs (used by category pages + place breadcrumbs)
const CAT_SLUG = {
  food: 'best-korean-food', travel: 'best-places-to-visit-in-korea',
  transport: 'korea-transport-guide', companies: 'top-korean-companies',
  kbeauty: 'k-beauty-guide', kpop: 'k-pop-and-culture-guide',
  shopping: 'best-shopping-in-korea', history: 'korean-history-guide',
};

// ── Affiliate config — replace the IDs, rebuild, redeploy ───────────
// Sign up: Klook & KKday (tours), Agoda (hotels), Airalo (eSIM),
// GetYourGuide (day trips). Fill your IDs below; links appear on every guide.
// ── Trip.com affiliate (LIVE — Trip.com Partners 계정 연동) ─────────
const TRIP_AID = 'Allianceid=8536795&SID=317779078';
// Agoda partner text link (제공받은 링크 그대로 — cid 갱신 시 여기만 교체)
const AGODA_URL = 'https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=-1&hl=en-us&city=14690';
const AFFILIATES = {
  klook:   { label: 'Tours & Tickets', brand: 'Klook',    icon: '🎟️', url: 'https://www.klook.com/?aid=YOUR_KLOOK_AID' },
  tripcom: { label: 'Hotels',          brand: 'Trip.com', icon: '🏨', url: `https://www.trip.com/?${TRIP_AID}&trip_sub1=kp_block` },
  agoda:   { label: 'Hotel Deals',     brand: 'Agoda',    icon: '🛏️', url: AGODA_URL },
};

// Trip.com dynamic hotel banners (300×250) — generate per-city in the
// Partners dashboard and register the banner id here. Pages for cities
// without a banner simply render nothing.
const TRIP_BANNERS = { Seoul: 'DB17873403', Busan: 'DB17873718', Jeju: 'DB17873732' };
const tripBanner = (city, sub = 'kp') => {
  const id = TRIP_BANNERS[city];
  if (!id) return '';
  return `
<div class="seo-banner">
  <span class="seo-banner-label">Ad · Trip.com ${esc(city)} hotels</span>
  <iframe loading="lazy" title="Trip.com ${esc(city)} hotel deals"
    src="https://www.trip.com/partners/ad/${id}?${TRIP_AID}&trip_sub1=${sub}"
    style="width:300px;height:250px;border:none" frameborder="0" scrolling="no"></iframe>
</div>`;
};

// Curated extra content (not in KOREA_DATA) — high-search-volume guides
const NEIGHBORHOODS = [
  { name: 'Hongdae', kr: '홍대', city: 'Seoul', emoji: '🎨', known: 'youth culture, indie music, street art, nightlife', do: 'Watch free street busking, browse indie fashion, club-hop after dark, hunt K-pop merch.', eat: 'Cheap student eats, themed cafes, late-night pojangmacha (street tents).', getto: 'Hongik University Station (Line 2 / AREX), Exit 9.' },
  { name: 'Gangnam', kr: '강남', city: 'Seoul', emoji: '🏙️', known: 'luxury, K-pop agencies, plastic surgery, upscale dining', do: 'See the COEX Starfield Library, K-Star Road, designer shopping, rooftop bars.', eat: 'Trendy upscale restaurants, dessert cafes, Korean fine dining.', getto: 'Gangnam Station (Line 2) or COEX via Samseong Station (Line 2).' },
  { name: 'Myeongdong', kr: '명동', city: 'Seoul', emoji: '🛍️', known: 'shopping, K-beauty, street food', do: 'Shop 50+ cosmetics stores, graze the night street-food market, visit Myeongdong Cathedral.', eat: 'Legendary street food — egg bread, tornado potato, grilled lobster, hotteok.', getto: 'Myeongdong Station (Line 4), Exit 6.' },
  { name: 'Insadong', kr: '인사동', city: 'Seoul', emoji: '🏮', known: 'traditional crafts, teahouses, art galleries', do: 'Browse antiques and hanji paper, sip traditional tea, visit Ssamziegil mall.', eat: 'Traditional Korean tea, bibimbap, hotteok, temple-style food.', getto: 'Anguk Station (Line 3), Exit 6.' },
  { name: 'Itaewon', kr: '이태원', city: 'Seoul', emoji: '🌍', known: 'international food, nightlife, diversity', do: 'Eat global cuisine, explore antique shops, enjoy the most international nightlife in Korea.', eat: 'Halal Korean & Middle Eastern, craft beer, world cuisine.', getto: 'Itaewon Station (Line 6).' },
  { name: 'Bukchon', kr: '북촌', city: 'Seoul', emoji: '🏘️', known: 'hanok village, palaces, photography', do: 'Wander 600-year-old hanok alleys between two palaces; go early for golden light and fewer crowds.', eat: 'Quiet hanok cafes, traditional sweets, tea houses.', getto: 'Anguk Station (Line 3), Exit 2.' },
];
const STAY = [
  { city: 'Seoul', kr: '서울', areas: [
    ['Myeongdong', 'First-timers — central, shopping & street food on your doorstep, great transit.'],
    ['Hongdae', 'Young travelers & nightlife — lively, affordable, great cafes and clubs.'],
    ['Gangnam', 'Comfort & luxury — upscale hotels, shopping, business district.'],
    ['Insadong / Jongno', 'Culture lovers — near palaces, traditional charm, central.'],
  ]},
  { city: 'Busan', kr: '부산', areas: [
    ['Haeundae', 'Beach & resorts — Korea\'s top beach, hotels, nightlife.'],
    ['Seomyeon', 'Central & budget — shopping, food, transit hub.'],
    ['Nampo-dong', 'Old-town charm — markets, Gamcheon Village access, ferries.'],
  ]},
  { city: 'Jeju', kr: '제주', areas: [
    ['Jeju City', 'Convenience — near the airport, dining, day-trip base.'],
    ['Seogwipo', 'Nature & south coast — waterfalls, Seongsan sunrise, resorts.'],
  ]},
];

// ── L10N — Japanese & Chinese (top-2 inbound markets) for month/visa pages ──
const L10N = {
  ja: {
    dir: 'ja', months: [
      ['1月', '気温 -2°C〜5°C、寒く乾燥', '厚手のコート・防寒インナー・手袋', 'スキーリゾート、華川ヤマメ氷祭り、冬のイルミネーション', '観光客が少なく旅費も最安。雪の古宮は格別の美しさ'],
      ['2月', '気温 0°C〜7°C、旧正月シーズン', '暖かい重ね着・マフラー', 'ソルラル(旧正月)行事、冬の温泉・チムジルバン', '伝統文化体験ができ、観光地も空いている'],
      ['3月', '気温 5°C〜13°C、春の始まり', '薄手のジャケット・重ね着', '梅の花、混雑前の静かな観光', 'オフシーズン価格で気候も穏やか'],
      ['4月', '気温 10°C〜18°C、春本番', '薄手の重ね着・軽いジャケット', '桜(鎮海・ソウル・慶州)、春祭り', '桜満開 — 韓国が一年で最も美しい季節'],
      ['5月', '気温 15°C〜23°C、新緑の季節', 'Tシャツ+薄手の羽織り', '燃灯会(ロータスランタン)、宝城茶畑、ハイキング', '一年で最も快適な気候と緑豊かな風景'],
      ['6月', '気温 20°C〜27°C、初夏・梅雨入り', '夏服+折りたたみ傘', 'ビーチ開き、緑の山々', '夏のピーク前で比較的空いている'],
      ['7月', '気温 24°C〜30°C、蒸し暑い(梅雨)', '通気性の良い服+傘', '保寧マッドフェスティバル、漢江の夜', '雨でもフェスとナイトライフは最高潮'],
      ['8月', '気温 25°C〜33°C、最も暑い', '薄着・日焼け止め・帽子', '海雲台などビーチ、夏祭り、避暑の山', 'ビーチシーズン真っ盛り、夏イベント満載'],
      ['9月', '気温 20°C〜28°C、過ごしやすい', '薄手の重ね着', '秋夕(チュソク)、初紅葉', '快適な気候と収穫の伝統文化'],
      ['10月', '気温 10°C〜22°C、爽やかな秋', '軽いジャケット・重ね着', '紅葉(雪岳山・内蔵山)、安東仮面劇祭、釜山映画祭', '紅葉の絶景 — 訪問のベストシーズン'],
      ['11月', '気温 5°C〜15°C、晩秋', 'コート・重ね着', '残り紅葉、イルミネーション開始', '混雑が少なく黄金色の風景'],
      ['12月', '気温 -3°C〜6°C、冬本番', '厚手のコート・手袋・帽子', 'クリスマスマーケット、スキー、温泉', 'きらめくイルミと冬の風物詩'],
    ],
    tw: { weatherH: 'の韓国の天気', wearH: '🧳 服装のポイント', doH: '🎉 おすすめの楽しみ方', evH: '📅 開催中のイベント', evP: '韓国のフェスティバル情報はリアルタイムで自動更新されます。', faqH: '❓ よくある質問', q1: m => `${m}の韓国旅行はおすすめですか？`, q2: m => `${m}の韓国では何を着ればいいですか？`, lead: m => `${m}に韓国旅行を計画中ですか？天気・服装・おすすめの楽しみ方をまとめました。`, badge: '', ctaH: '韓国旅行を計画しましょう', ctaP: 'AIが季節に合わせた日程を無料で作成します。', titleSuffix: 'の韓国 — 天気・服装・楽しみ方', monthEn: ['January','February','March','April','May','June','July','August','September','October','November','December'] },
    visa: {
      h1: '韓国ビザ & K-ETA 完全ガイド', titleSuffix: '（2026年版）| KoreaPlus',
      desc: '韓国旅行にビザは必要？K-ETAの申請方法・料金・所要時間・入国要件を日本語で解説。',
      lead: '日本を含む多くの国はビザなしで韓国に入国できますが、K-ETA（韓国電子旅行許可）が必要な場合があります。2026年の最新情報をまとめました。',
      sections: [
        ['🛂 ビザは必要？', '日本・米国・英国など<strong>110か国以上</strong>の国民は観光目的なら<strong>ビザなし</strong>で30〜90日滞在できます（国籍により異なる）。渡航前に必ず自国の条件をご確認ください。'],
        ['✅ K-ETAとは？', 'K-ETAは米国ESTAに似たオンライン渡航認証です。ビザ免除対象者は搭乗前の取得が原則必要ですが、<strong>日本を含む一部の国は期間限定で免除</strong>されることがあります。最新状況は公式サイトでご確認を。'],
        ['📝 申請方法', '<ol class="steps"><li>公式サイト <strong>k-eta.go.kr</strong>（またはアプリ）にアクセス — 高額な非公式サイトに注意。</li><li>出発の<strong>72時間前まで</strong>に申請。</li><li>顔写真・パスポート情報・渡航情報を入力。</li><li>手数料 <strong>約10,000ウォン</strong>をカードで支払い。</li><li>承認メールを受信 — <strong>2〜3年間</strong>有効で何度でも入国可。</li></ol>'],
        ['🧳 入国時の準備', '<ul class="tips"><li>宿泊先の住所と帰国便の情報を準備。</li><li>K-ETA承認画面のスクリーンショット＋印刷を携帯。</li><li>必要に応じて入国カード／Q-CODEを記入。</li></ul>'],
      ],
      faq: [
        ['日本人は韓国旅行にビザが必要ですか？', '観光なら90日までビザ不要です。K-ETAは免除期間が適用される場合があります — 出発前に k-eta.go.kr で最新状況をご確認ください。'],
        ['K-ETAの料金は？', '約10,000ウォン（千円前後）。公式サイトのみをご利用ください。'],
        ['承認までの時間は？', '数分〜72時間。出発3日前までの申請が安全です。'],
      ],
      ctaH: '韓国旅行の計画を始めましょう', ctaP: 'AIが日程を無料で自動作成します。',
    },
  },
  zh: {
    dir: 'zh', months: [
      ['1月', '气温 -2°C至5°C，寒冷干燥', '厚外套、保暖内衣、手套', '滑雪场、华川冰钓节、冬季灯饰', '游客最少、价格最低，雪中古宫别有韵味'],
      ['2月', '气温 0°C至7°C，春节期间', '保暖多层穿搭、围巾', '韩国春节（설날）民俗活动、温泉汗蒸', '体验传统文化，景点人少'],
      ['3月', '气温 5°C至13°C，初春', '轻薄外套、分层穿搭', '梅花初开，避开旺季人潮', '淡季价格，气候宜人'],
      ['4月', '气温 10°C至18°C，春季最佳', '轻薄分层、薄外套', '樱花（镇海、首尔、庆州）、春季庆典', '樱花盛开——韩国一年中最美的季节'],
      ['5月', '气温 15°C至23°C，温暖宜人', 'T恤+薄外套', '燃灯节、宝城绿茶园、登山', '全年最舒适的天气与满眼新绿'],
      ['6月', '气温 20°C至27°C，初夏/梅雨开始', '夏装+雨伞', '海水浴场开放、青山绿水', '暑期高峰前游客较少'],
      ['7月', '气温 24°C至30°C，炎热潮湿（梅雨）', '透气衣物+雨伞', '保宁泥浆节、汉江夜生活', '尽管有雨，节庆与夜生活正嗨'],
      ['8月', '气温 25°C至33°C，全年最热', '清凉衣物、防晒霜、帽子', '海云台等海滩、夏日庆典、避暑山林', '海滩旺季，夏日活动丰富'],
      ['9月', '气温 20°C至28°C，由暖转凉', '轻薄分层穿搭', '中秋节（추석）、初秋红叶', '天气舒适，感受丰收文化'],
      ['10月', '气温 10°C至22°C，秋高气爽', '薄外套、分层穿搭', '红叶（雪岳山、内藏山）、安东假面舞节、釜山电影节', '漫山红叶——最佳旅行季节之一'],
      ['11月', '气温 5°C至15°C，深秋', '大衣、分层穿搭', '晚秋红叶、灯饰点亮', '人少景美，一片金黄'],
      ['12月', '气温 -3°C至6°C，寒冬', '厚外套、手套、帽子', '圣诞集市、滑雪、温泉', '节日灯饰璀璨，冬日风情浓厚'],
    ],
    tw: { weatherH: '韩国天气', wearH: '🧳 穿衣建议', doH: '🎉 推荐玩法', evH: '📅 当季活动', evP: '韩国节庆日历实时自动更新。', faqH: '❓ 常见问题', q1: m => `${m}适合去韩国旅游吗？`, q2: m => `${m}去韩国穿什么？`, lead: m => `计划${m}去韩国？这里有天气、穿搭和玩法全攻略。`, badge: '', ctaH: '开始规划韩国之旅', ctaP: 'AI 免费为你定制每日行程。', titleSuffix: '韩国旅游攻略 — 天气·穿搭·玩法', monthEn: ['January','February','March','April','May','June','July','August','September','October','November','December'] },
    visa: {
      h1: '韩国签证 & K-ETA 全攻略', titleSuffix: '（2026最新）| KoreaPlus',
      desc: '去韩国需要签证吗？K-ETA 申请流程、费用、审批时间与入境要求中文详解。',
      lead: '部分国家可免签入境韩国，但通常需要先申请 K-ETA（韩国电子旅行许可）。中国大陆游客一般需要办理韩国签证。以下是2026年最新指南。',
      sections: [
        ['🛂 需要签证吗？', '<strong>110多个国家/地区</strong>（美、英、加、澳、日、新加坡及多数欧盟国家等）可免签停留30–90天。<strong>中国大陆护照通常需提前办理签证</strong>（旅游签/团体签或济州岛免签政策），港澳台护照多可免签。出行前请务必确认本国最新政策。'],
        ['✅ 什么是 K-ETA？', 'K-ETA 类似美国 ESTA，是免签旅客登机前需取得的电子旅行许可。韩国会不定期对部分国家<strong>临时豁免 K-ETA</strong>，请以官网实时公告为准。'],
        ['📝 申请步骤', '<ol class="steps"><li>访问官方网站 <strong>k-eta.go.kr</strong>（或官方App）——谨防高价仿冒网站。</li><li>至少在出发<strong>72小时前</strong>提交申请。</li><li>上传证件照、护照信息及行程信息。</li><li>在线支付约 <strong>10,000韩元</strong>。</li><li>邮件获批后，<strong>2–3年内</strong>可多次入境。</li></ol>'],
        ['🧳 入境准备', '<ul class="tips"><li>备好住宿地址与回程机票信息。</li><li>保存 K-ETA 获批截图并打印备份。</li><li>按要求填写入境卡或 Q-CODE 健康申报。</li></ul>'],
      ],
      faq: [
        ['中国游客去韩国需要签证吗？', '中国大陆护照通常需要提前办理韩国签证（济州岛适用免签政策）；香港、澳门、台湾护照多数情况可免签入境。请以领事馆最新公告为准。'],
        ['K-ETA 多少钱？', '约10,000韩元（约50多元人民币），仅限官网在线支付。'],
        ['K-ETA 审批要多久？', '几分钟到72小时不等，建议至少提前3天申请。'],
      ],
      ctaH: '开始规划你的韩国行程', ctaP: 'AI 免费生成逐日行程。',
    },
  },
  es: {
    dir: 'es', months: [
      ['enero', '-2°C a 5°C, frío y seco', 'Abrigo grueso, ropa térmica y guantes', 'Esquí, festival de pesca en hielo de Hwacheon, iluminaciones de invierno', 'Pocas multitudes, precios mínimos y palacios nevados'],
      ['febrero', '0°C a 7°C, Año Nuevo Lunar', 'Varias capas de abrigo y bufanda', 'Seollal (Año Nuevo Lunar), termas y jjimjilbang', 'Cultura tradicional con menos turistas'],
      ['marzo', '5°C a 13°C, inicio de primavera', 'Chaqueta ligera por capas', 'Flores de ciruelo y visitas sin aglomeraciones', 'Precios de temporada baja y clima agradable'],
      ['abril', '10°C a 18°C, plena primavera', 'Capas ligeras y chaqueta fina', 'Cerezos en flor (Jinhae, Seúl, Gyeongju) y festivales de primavera', 'Los cerezos en flor — Corea en su momento más bello'],
      ['mayo', '15°C a 23°C, cálido y verde', 'Camiseta y una capa ligera', 'Festival de los Faroles de Loto, campos de té de Boseong, senderismo', 'El mejor clima del año y paisajes verdes'],
      ['junio', '20°C a 27°C, inicio del verano y lluvias', 'Ropa de verano y paraguas', 'Playas abiertas y montañas verdes', 'Calor agradable antes de la temporada alta'],
      ['julio', '24°C a 30°C, calor húmedo (monzón)', 'Ropa transpirable y paraguas', 'Festival del Barro de Boryeong y noches junto al río Han', 'Festivales y vida nocturna pese a la lluvia'],
      ['agosto', '25°C a 33°C, el mes más caluroso', 'Ropa ligera, protector solar y gorra', 'Playas (Haeundae), festivales de verano, montañas frescas', 'Plena temporada de playa y eventos veraniegos'],
      ['septiembre', '20°C a 28°C, de cálido a fresco', 'Capas ligeras', 'Chuseok (acción de gracias coreana) y primer follaje', 'Clima agradable y cultura de la cosecha'],
      ['octubre', '10°C a 22°C, otoño fresco', 'Chaqueta ligera por capas', 'Follaje otoñal (Seoraksan, Naejangsan), danza de máscaras de Andong, Festival de Cine de Busan', 'Colores de otoño espectaculares — temporada ideal'],
      ['noviembre', '5°C a 15°C, otoño tardío', 'Abrigo y capas', 'Último follaje y primeras iluminaciones', 'Menos gente y paisajes dorados'],
      ['diciembre', '-3°C a 6°C, pleno invierno', 'Abrigo grueso, guantes y gorro', 'Mercados navideños, esquí y termas', 'Luces festivas y ambiente invernal'],
    ],
    tw: { weatherH: ': clima en Corea', wearH: '🧳 Qué llevar', doH: '🎉 Qué hacer', evH: '📅 Eventos en curso', evP: 'El calendario de festivales de Corea se actualiza en tiempo real.', faqH: '❓ Preguntas frecuentes', q1: m => `¿Es ${m} una buena época para visitar Corea?`, q2: m => `¿Qué ropa llevar a Corea en ${m}?`, lead: m => `¿Planeas viajar a Corea en ${m}? Aquí tienes el clima, qué llevar y qué hacer.`, badge: '', ctaH: 'Planifica tu viaje a Corea', ctaP: 'La IA crea tu itinerario diario gratis.', titleSuffix: ' en Corea — Clima, ropa y qué hacer', monthEn: ['January','February','March','April','May','June','July','August','September','October','November','December'] },
    visa: {
      h1: 'Visado para Corea y K-ETA: guía completa', titleSuffix: ' (2026) | KoreaPlus',
      desc: '¿Necesitas visado para Corea del Sur? Guía K-ETA en español: países exentos, cómo solicitarlo, coste, plazos y requisitos de entrada.',
      lead: 'La mayoría de los países hispanohablantes (España, México, Chile, Argentina, Colombia, Perú y más) pueden entrar en Corea sin visado, pero suele requerirse la K-ETA (autorización electrónica de viaje). Guía actualizada para 2026.',
      sections: [
        ['🛂 ¿Necesito visado?', 'Los ciudadanos de <strong>más de 110 países</strong> — incluida la mayoría de Hispanoamérica y España — pueden permanecer 30–90 días sin visado por turismo (según nacionalidad). Confirma siempre las condiciones de tu país antes de reservar.'],
        ['✅ ¿Qué es la K-ETA?', 'La K-ETA es una autorización electrónica similar al ESTA de EE.UU. Los viajeros exentos de visado suelen necesitarla antes de embarcar. Corea aplica <strong>exenciones temporales</strong> a algunos países — consulta el portal oficial antes de viajar.'],
        ['📝 Cómo solicitarla', '<ol class="steps"><li>Entra en el sitio oficial <strong>k-eta.go.kr</strong> (o la app) — cuidado con webs no oficiales más caras.</li><li>Solicítala al menos <strong>72 horas antes</strong> de la salida.</li><li>Sube tu foto, datos del pasaporte y del viaje.</li><li>Paga unos <strong>₩10.000</strong> con tarjeta.</li><li>Recibe la aprobación por correo — válida <strong>2–3 años</strong> con entradas múltiples.</li></ol>'],
        ['🧳 Al llegar', '<ul class="tips"><li>Ten a mano la dirección del alojamiento y el billete de vuelta.</li><li>Guarda captura e impresión de la aprobación K-ETA.</li><li>Rellena la tarjeta de llegada o Q-CODE si se solicita.</li></ul>'],
      ],
      faq: [
        ['¿Los españoles y latinoamericanos necesitan visado para Corea?', 'La mayoría puede entrar sin visado entre 30 y 90 días por turismo. Puede requerirse la K-ETA salvo exención temporal — verifica en k-eta.go.kr antes de volar.'],
        ['¿Cuánto cuesta la K-ETA?', 'Unos ₩10.000 (7–8 USD), pago online con tarjeta. Usa solo el sitio oficial.'],
        ['¿Cuánto tarda la aprobación?', 'De unos minutos hasta 72 horas. Solicítala al menos 3 días antes de viajar.'],
      ],
      ctaH: 'Empieza a planificar tu viaje a Corea', ctaP: 'La IA genera tu itinerario diario gratis.',
    },
  },
};
const LOCALES = ['ja', 'zh', 'es'];

// ── Blog posts (EN) — long-tail, high-intent queries ────────────────
const BLOG = [
  {
    slug: 'is-korea-expensive', emoji: '💸', date: TODAY,
    h1: 'Is Korea Expensive? Real 2026 Trip Cost Breakdown',
    desc: 'How much does a Korea trip really cost in 2026? Daily budgets for backpackers ($55), mid-range ($120) and comfort travelers — food, hotels, transport & tickets itemized.',
    body: `
<p class="lead">Short answer: <strong>Korea is cheaper than Japan, Singapore or Western Europe</strong> — but pricier than Southeast Asia. Most travelers comfortably spend <strong>$70–130/day</strong> excluding flights.</p>
<h2>💰 Daily budget by travel style</h2>
<div class="seo-pricebox"><div class="range">Backpacker ≈ $55/day</div><div class="note">Guesthouse dorm ₩25,000 · street food & gimbap ₩15,000 · T-money transit ₩5,000 · free palaces/parks</div></div>
<div class="seo-pricebox"><div class="range">Mid-range ≈ $120/day</div><div class="note">3★ hotel ₩90,000 · restaurant meals ₩35,000 · transit+taxi ₩15,000 · attractions ₩15,000</div></div>
<div class="seo-pricebox"><div class="range">Comfort ≈ $250/day</div><div class="note">4–5★ hotel ₩250,000 · fine dining ₩70,000 · taxis ₩25,000 · shows & experiences</div></div>
<h2>🍜 What things actually cost (2026)</h2>
<ul>
<li>Street food snack (tteokbokki, hotteok): <strong>₩3,000–5,000</strong></li>
<li>Casual restaurant meal (bibimbap, kimchi jjigae): <strong>₩9,000–13,000</strong></li>
<li>Korean BBQ per person: <strong>₩15,000–25,000</strong></li>
<li>Coffee at a cafe: <strong>₩4,500–6,000</strong> (convenience store: ₩1,500)</li>
<li>Subway/bus ride: <strong>₩1,400–1,500</strong> with T-money</li>
<li>KTX Seoul→Busan: <strong>₩59,800</strong></li>
<li>Palace entry: <strong>₩3,000</strong> (free in hanbok!)</li>
<li>Soju at a restaurant: <strong>₩5,000</strong></li>
</ul>
<h2>✂️ 7 easy ways to cut costs</h2>
<ul class="tips">
<li>Eat where office workers eat at lunch — set menus (백반) are ₩8,000–10,000 and excellent.</li>
<li>Use a T-money card: ~10% cheaper than cash and works on subway, bus and taxis.</li>
<li>Rent hanbok (₩15,000–30,000) — all four royal palaces become free.</li>
<li>Convenience-store breakfast (GS25/CU): quality coffee + gimbap under ₩5,000.</li>
<li>Book intercity travel as KTX early-bird or use express buses at half the price.</li>
<li>Stay in Hongdae or Seomyeon rather than Myeongdong/Gangnam for better room value.</li>
<li>Free sights are world-class: palaces in hanbok, Han River parks, Bukchon, temples, markets.</li>
</ul>`,
    faq: [
      ['Is Korea cheaper than Japan?', 'Generally yes — accommodation and food in Korea run roughly 10–25% cheaper than comparable options in Japan, and city transit is significantly cheaper.'],
      ['How much money do I need for 7 days in Korea?', 'Around $500–600 for budget travel, $800–1,000 mid-range, excluding international flights.'],
      ['Is street food in Korea cheap?', 'Yes — most street snacks cost ₩3,000–5,000 ($2.50–4), and a filling market meal is under ₩10,000.'],
    ],
  },
  {
    slug: 'korea-travel-tips-first-time', emoji: '🇰🇷', date: TODAY,
    h1: '21 Korea Travel Tips Every First-Timer Needs (2026)',
    desc: 'First time in Korea? 21 essential tips on apps, T-money, etiquette, money, SIM cards and mistakes to avoid — from people who travel Korea constantly.',
    body: `
<p class="lead">Korea is one of the easiest countries in Asia for first-timers — <em>if</em> you know these 21 things before landing.</p>
<h2>📱 Before you fly</h2>
<ol class="steps">
<li><strong>Check K-ETA requirements</strong> at k-eta.go.kr at least 72h before departure (<a href="guide/korea-visa-k-eta-guide.html">full visa guide</a>).</li>
<li><strong>Download KakaoMap or Naver Map</strong> — Google Maps barely works for directions in Korea.</li>
<li><strong>Install Papago</strong> for translation — it beats Google Translate for Korean.</li>
<li><strong>Order an eSIM online</strong> before arrival; it's cheaper than airport counters.</li>
<li><strong>Book airport transfer trains (AREX)</strong> — faster and cheaper than taxis from Incheon.</li>
</ol>
<h2>💳 Money & payments</h2>
<ol class="steps" start="6">
<li>Get a <strong>T-money card</strong> at any convenience store — subway, bus, taxi, even vending machines.</li>
<li>Credit cards work almost everywhere, but keep <strong>₩50,000–100,000 cash</strong> for markets and street food.</li>
<li><strong>No tipping.</strong> Ever. The price you see is the price you pay.</li>
<li>Claim <strong>tax refunds</strong> (10%) on purchases over ₩30,000 — keep receipts and your passport handy.</li>
</ol>
<h2>🚇 Getting around</h2>
<ol class="steps" start="10">
<li>The subway has <strong>English everywhere</strong> — station numbers make navigation foolproof.</li>
<li>Use <strong>Kakao T</strong> for taxis — English interface, no haggling, cheaper than Uber back home.</li>
<li><strong>KTX</strong> turns Seoul→Busan into 2h 20m; book popular weekend slots a few days ahead.</li>
<li>Last subway is ~midnight; after that it's taxis or Korea's famously safe night streets.</li>
</ol>
<h2>🍜 Eating & culture</h2>
<ol class="steps" start="14">
<li>Side dishes (banchan) are <strong>free and refillable</strong> — asking for more is normal.</li>
<li>Pour drinks for others, not yourself — and receive with two hands.</li>
<li>Many restaurants have <strong>tablet ordering or call buttons</strong> — press the bell, don't wave.</li>
<li>Street markets (Gwangjang, Myeongdong) are best in the evening from 5pm.</li>
<li>Convenience stores are a food destination — fresh meals, ramyeon stations, seating.</li>
</ol>
<h2>⚠️ Common mistakes to avoid</h2>
<ol class="steps" start="19">
<li>Don't rely on Google Maps for walking/transit directions — use Naver or Kakao.</li>
<li>Don't plan palaces on Mondays/Tuesdays without checking — major sights close one day a week.</li>
<li>Don't skip the countryside: Gyeongju, Jeonju and Busan are 2–3 hours away by KTX and worth it.</li>
</ol>`,
    faq: [
      ['What apps do I need for Korea?', 'KakaoMap or Naver Map (navigation), Papago (translation), Kakao T (taxis), and your bank app for tax refunds. Google Maps works poorly for directions in Korea.'],
      ['Do they speak English in Korea?', 'In tourist areas, hotels and among younger Koreans — enough to get by. Subway and signs are bilingual. Papago handles the rest.'],
      ['Is tipping expected in Korea?', 'No. Tipping is not part of Korean culture at restaurants, taxis or hotels.'],
    ],
  },
  {
    slug: 'is-korea-safe', emoji: '🛡️', date: TODAY,
    h1: 'Is Korea Safe to Visit? Honest 2026 Safety Guide',
    desc: 'Is South Korea safe for tourists, solo travelers and women? Crime rates, scams, night safety, North Korea questions and emergency numbers — honestly answered.',
    body: `
<p class="lead">Yes — <strong>South Korea is one of the safest countries in the world for travelers.</strong> Violent crime against tourists is extremely rare, streets feel safe at 2am, and lost wallets famously come back.</p>
<h2>🌃 How safe is it really?</h2>
<ul>
<li><strong>Violent crime:</strong> among the lowest rates in the OECD. Solo women routinely walk at night in Seoul.</li>
<li><strong>Theft:</strong> so rare that locals reserve cafe tables with phones and laptops.</li>
<li><strong>Scams:</strong> uncommon; the main ones are inflated street-vendor prices in tourist zones and "free show" touts.</li>
<li><strong>Taxis:</strong> metered and regulated — using Kakao T removes any ambiguity.</li>
</ul>
<h2>👩 Solo & female travelers</h2>
<p>Korea is consistently rated a top destination for solo female travel: bright streets, busy subways until midnight, CCTV everywhere, and a strong social safety culture. Normal city precautions apply, especially in nightlife districts (Itaewon, Hongdae) late at night.</p>
<h2>🚨 What about North Korea?</h2>
<p>Day-to-day life in South Korea is completely unaffected. Tourists notice nothing — the border is 50km from Seoul yet feels a world away. DMZ tours are safe, regulated and fascinating.</p>
<h2>📞 Emergency numbers</h2>
<ul class="tips">
<li><strong>112</strong> — Police · <strong>119</strong> — Fire/Ambulance</li>
<li><strong>1330</strong> — 24h Tourist Hotline with English interpreters (call this first for non-emergencies)</li>
<li><strong>1339</strong> — Medical advice line</li>
</ul>
<p>Save our full <a href="emergency.html">Emergency Info page</a> — it works offline.</p>
<h2>⚠️ Actual things to watch</h2>
<ul class="tips">
<li>Traffic: scooters on sidewalks and impatient buses — look both ways even on green.</li>
<li>Hiking: trails are excellent but weather shifts fast in autumn/winter — check closing times.</li>
<li>Nightlife drinks: standard big-city rules apply.</li>
<li>Typhoon season (Aug–Sep) can disrupt Jeju/Busan ferries and flights.</li>
</ul>`,
    faq: [
      ['Is Seoul safe at night?', 'Yes — Seoul is famously safe at night. Streets are bright, busy and monitored. Normal precautions in nightlife areas are sufficient.'],
      ['Is Korea safe for solo female travelers?', 'Korea ranks among the best countries for solo female travel thanks to low crime, safe transit and active streets at all hours.'],
      ['Does North Korea make South Korea dangerous to visit?', 'No. Daily life is entirely normal, and the situation has no practical effect on tourism. DMZ tours are safe and regulated.'],
    ],
  },
  {
    slug: 'korea-sim-esim-pocket-wifi', emoji: '📶', date: TODAY,
    h1: 'Korea SIM vs eSIM vs Pocket WiFi: What to Get (2026)',
    desc: 'The best way to stay connected in Korea: eSIM vs physical SIM vs pocket WiFi compared by price, speed and convenience — plus exactly where to buy.',
    body: `
<p class="lead">For most travelers in 2026 the answer is simple: <strong>buy an eSIM online before you fly.</strong> Here's the full comparison so you can decide in two minutes.</p>
<h2>⚡ Quick verdict</h2>
<ul>
<li><strong>eSIM</strong> — best for 90% of travelers: activate on landing, cheapest, no pickup queues.</li>
<li><strong>Physical SIM</strong> — best if your phone doesn't support eSIM; buy at airport counters or online for pickup.</li>
<li><strong>Pocket WiFi</strong> — best for groups of 3+ sharing one connection or laptop-heavy work trips.</li>
</ul>
<h2>💰 Typical prices (2026)</h2>
<div class="seo-pricebox"><div class="range">eSIM: $3–6/day</div><div class="note">Unlimited-data tourist eSIMs commonly run $20–35 for 10 days. Activates via QR before/at landing.</div></div>
<div class="seo-pricebox"><div class="range">Physical tourist SIM: ₩30,000–50,000</div><div class="note">5–30 day unlimited plans at Incheon arrivals (SKT/KT counters open early–late).</div></div>
<div class="seo-pricebox"><div class="range">Pocket WiFi: ₩4,000–6,000/day</div><div class="note">Pickup/return at airport counters; one battery to babysit, shareable by ~5 devices.</div></div>
<h2>📝 Buying checklist</h2>
<ol class="steps">
<li>Check your phone is <strong>unlocked</strong> and supports eSIM (iPhone XS+, most recent Androids).</li>
<li>Buy from a reputable seller (Airalo and similar marketplaces, or Korean carriers' tourist plans).</li>
<li>Install the eSIM profile <strong>on WiFi before departure</strong>; enable it on landing.</li>
<li>Keep your home SIM active for SMS verification codes — just disable its data roaming.</li>
<li>Korea has excellent free WiFi (subway, cafes), so mid-tier data plans are usually plenty.</li>
</ol>`,
    faq: [
      ['Can I buy a SIM card at Incheon Airport?', 'Yes — SKT and KT counters at arrivals sell tourist SIMs (typically ₩30,000–50,000 for unlimited data, 5–30 days). They open from early morning until late night.'],
      ['Does my phone need to be unlocked for a Korean SIM?', 'Yes — both physical SIMs and eSIMs require an unlocked phone. Check with your home carrier before traveling.'],
      ['Is free WiFi common in Korea?', 'Extremely — subways, buses, cafes and most public areas have fast free WiFi, which is why moderate data plans suffice for most travelers.'],
    ],
  },
  {
    slug: 'solo-travel-korea', emoji: '🎒', date: TODAY,
    h1: 'Solo Travel in Korea: The Complete 2026 Guide',
    desc: 'Why Korea is one of the world\'s best solo travel destinations: safety, solo dining culture, costs, itineraries and meeting people — complete first-timer guide.',
    body: `
<p class="lead">Korea might be the world's most <strong>solo-friendly country</strong>: ultra-safe streets, a built-in culture of eating and doing things alone (혼밥/혼놀), and transit so good you never need a tour group.</p>
<h2>✅ Why Korea works so well solo</h2>
<ul>
<li><strong>Safety:</strong> walk anywhere at midnight; lost phones get returned (see our <a href="blog/is-korea-safe.html">safety guide</a>).</li>
<li><strong>Honbap culture:</strong> solo dining is a recognized lifestyle — counters, single-portion BBQ, one-person hotpot.</li>
<li><strong>Transit:</strong> subway + KTX means no tours required, even for day trips.</li>
<li><strong>Jjimjilbangs:</strong> Korean spas double as cheap, safe solo accommodation experiences.</li>
<li><strong>PC bangs & cafes:</strong> normalized solo hangouts at all hours.</li>
</ul>
<h2>🍜 Solo dining without awkwardness</h2>
<ul class="tips">
<li>Look for 혼밥 (honbap) signage or counter seating — common in Hongdae, university areas and food courts.</li>
<li>Convenience stores are legit dining: hot food, ramyeon stations and seating areas.</li>
<li>Gwangjang Market stalls are perfect solo — point, sit, eat with locals at the counter.</li>
<li>BBQ alone is possible at solo-BBQ chains; otherwise order dakgalbi or jjigae portions for one.</li>
</ul>
<h2>🗺️ Perfect solo itinerary (7 days)</h2>
<ol class="steps">
<li><strong>Days 1–3 Seoul:</strong> palaces in hanbok, Bukchon, Hongdae nights, Han River picnic (<a href="itinerary/seoul-3-day-itinerary.html">3-day Seoul plan</a>).</li>
<li><strong>Day 4 Day trip:</strong> DMZ tour or Nami Island.</li>
<li><strong>Days 5–6 Busan:</strong> KTX down, Haeundae sunrise, Gamcheon village, Jagalchi sashimi solo counter.</li>
<li><strong>Day 7:</strong> Jjimjilbang morning, last shopping in Myeongdong.</li>
</ol>
<h2>🤝 Meeting people (if you want to)</h2>
<ul class="tips">
<li>Guesthouse common rooms in Hongdae are the classic traveler social hubs.</li>
<li>Language exchanges and walking tours fill weeknights with instant company.</li>
<li>Norebang (karaoke) with new hostel friends is the universal icebreaker.</li>
</ul>`,
    faq: [
      ['Is Korea good for solo travelers?', 'Exceptional — top-tier safety, a native solo-dining culture (honbap), and world-class transit make Korea one of the easiest solo destinations anywhere.'],
      ['How much does a solo week in Korea cost?', 'Roughly $500–600 staying in guesthouses and eating like a local; $900+ with private rooms and more restaurant meals.'],
      ['Is it weird to eat alone in Korea?', 'Not at all — solo dining (혼밥) is a recognized lifestyle with counter seating and single portions widely available.'],
    ],
  },
];

// flat list of every item with its category
const ALL = [];
for (const [cat, items] of Object.entries(KOREA_DATA))
  for (const it of items) ALL.push({ ...it, cat, slug: slug(it.name) });
const bySlug = Object.fromEntries(ALL.map(i => [i.slug, i]));

// ── Master template ─────────────────────────────────────────────────
// lang: page language code. alts: [{lang,url}] other-language versions
// (hreflang cluster; x-default points at the English URL).
function shell({ url, title, desc, keywords, schemas, hero, body, lang = 'en', alts = [] }) {
  const canonical = ORIGIN + url;
  const xDefault = ORIGIN + ((alts.find(a => a.lang === 'en') || {}).url || url);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="${BASEP}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${lang}" href="${canonical}">
${alts.map(a => `<link rel="alternate" hreflang="${a.lang}" href="${ORIGIN + a.url}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${xDefault}">
<link rel="icon" type="image/svg+xml" href="icons/kplus.svg">
<link rel="apple-touch-icon" href="icons/kplus.svg">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0c1829">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="KoreaPlus-Lifes">
<meta property="og:image" content="${ORIGIN}/guide/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="hub-styles.css">
<link rel="stylesheet" href="theme.css">
<link rel="stylesheet" href="seo.css">
<script src="modules/header.js"></script>
<script defer src="modules/affiliate.js?v=1"></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1378943893051810" crossorigin="anonymous"></script>
${schemas.map(jsonld).join('\n')}
</head>
<body>
<nav class="hub-nav" role="navigation" aria-label="Navigation">
  <a class="hub-nav-logo" href="index.html">Korea<span>Plus</span></a>
  <div class="hub-nav-links">
    <a class="hub-nav-link" href="index.html">🏠 Home</a>
    <a class="hub-nav-link" href="explore.html">🧭 Explore</a>
    <a class="hub-nav-link" href="blog/index.html">📰 Blog</a>
    <a class="hub-nav-link" href="plan.html">🗺️ Plan Trip</a>
    <a class="hub-nav-link" href="phrases.html">💬 Phrases</a>
    <a class="hub-nav-link" href="currency.html">💱 Currency</a>
  </div>
</nav>
<main class="seo-wrap">
${hero}
<article class="seo-body">
${body}
</article>
<!-- AdSense — single responsive unit per page (koreaplus-life-webapp) -->
<div class="seo-ad">
  <ins class="adsbygoogle" style="display:block"
       data-ad-client="ca-pub-1378943893051810" data-ad-slot="4521899200"
       data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
</main>
<footer class="footer" role="contentinfo" style="text-align:center;padding:40px 20px;border-top:1px solid var(--border,rgba(255,255,255,.08));margin-top:40px">
  <p style="font-size:13px;color:var(--text2,#aaa)">🇰🇷 <strong>KoreaPlus-Lifes.com</strong> · Your complete guide to everything Korea</p>
  <p style="font-size:11px;color:var(--text3,#888);margin-top:8px">
    <a href="index.html" style="color:var(--accent2,#74b9ff)">Home</a> ·
    <a href="explore.html" style="color:var(--accent2,#74b9ff)">Explore</a> ·
    <a href="plan.html" style="color:var(--accent2,#74b9ff)">Plan a Trip</a> ·
    <a href="about.html" style="color:var(--accent2,#74b9ff)">About</a>
  </p>
</footer>
</body>
</html>`;
}

function breadcrumbLD(trail) { // trail: [{name,url}]
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: t.name,
      item: t.url ? ORIGIN + t.url : undefined,
    })),
  };
}
function faqLD(qa) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: qa.map(([q, a]) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
function bcHtml(trail) {
  return `<nav class="seo-bc" aria-label="Breadcrumb">` +
    trail.map((t, i) => (i < trail.length - 1
      ? `<a href="${t.url.replace(BASEP, '')}">${esc(t.name)}</a><span>›</span>`
      : `<span style="color:var(--text2,#bbb)">${esc(t.name)}</span>`)).join('') + `</nav>`;
}
const ctaHtml = (heading, sub) => `
<div class="seo-cta">
  <h2>${esc(heading)}</h2>
  <p>${esc(sub)}</p>
  <div class="btns">
    <a class="primary" href="plan.html">🗺️ Build My Free Itinerary</a>
    <a class="ghost" href="index.html">💬 Ask the AI Guide</a>
  </div>
</div>`;
const cardHtml = it => `
<a class="seo-card" href="places/${it.slug}.html">
  <span class="ce">${it.emoji || '📍'}</span>
  <div class="cn">${esc(it.name)}</div>
  <div class="ck">${esc(it.kr || '')}</div>
  <div class="cd">${esc((it.desc || '').slice(0, 90))}${(it.desc || '').length > 90 ? '…' : ''}</div>
</a>`;
const mapsHtml = q => {
  const e = enc(q);
  return `<div class="seo-maps">
    <a class="primary" href="https://www.google.com/maps/search/${e}" target="_blank" rel="noopener">🗺️ Google Maps</a>
    <a href="https://map.naver.com/p/search/${e}" target="_blank" rel="noopener">🟢 Naver Map</a>
    <a href="https://map.kakao.com/?q=${e}" target="_blank" rel="noopener">🟡 Kakao Map</a>
  </div>`;
};
// ctx: { city, cat, q } — embedded as data-aff so modules/affiliate.js can
// swap in context-matched Impact tracking links at runtime. The static links
// below are the no-JS / pre-approval fallback.
const ctxCity = region => {
  const r = String(region || '');
  const hit = CITIES.find(c => r.includes(c.name));
  return hit ? hit.name : 'Seoul';
};
const affHtml = (label = '🎫 Book your Korea trip', ctx = { city: 'Seoul', cat: 'general', q: '' }) => `
<div class="seo-aff" data-aff="${esc(JSON.stringify(ctx))}">
  <div class="aff-label">${label}</div>
  <div class="aff-grid">${Object.values(AFFILIATES).map(a =>
    `<a href="${esc(a.url)}" target="_blank" rel="sponsored noopener"><strong>${a.icon} ${esc(a.label)}</strong><span>${esc(a.brand)}</span></a>`).join('')}</div>
  <div class="aff-disc">Affiliate links — we may earn a small commission at no extra cost to you. It helps keep KoreaPlus free.</div>
</div>`;

// ══════════════════════════════════════════════════════════════════
// 1) PLACE PAGES (90)
// ══════════════════════════════════════════════════════════════════
function buildPlace(it) {
  const d = DETAIL[it.name] || {};
  const cm = CAT_META[it.cat];
  const url = `${BASEP}places/${it.slug}.html`;
  const title = `${it.name}${it.kr ? ' (' + it.kr + ')' : ''} — Korea Travel Guide | KoreaPlus`;
  const overview = d.overview || it.desc || '';
  const desc = (overview).replace(/\s+/g, ' ').slice(0, 155);
  const trail = [
    { name: 'Home', url: BASEP }, { name: cm.label, url: `${BASEP}guide/${CAT_SLUG[it.cat]}.html` },
    { name: it.name, url },
  ];

  let body = bcHtml(trail);
  body += `<p class="lead">${esc(overview)}</p>`;
  if (d.bestFor) body += `<p><strong>✅ Best for:</strong> ${esc(d.bestFor)}</p>`;
  if (d.schedule) body += `<p><strong>⏰ When:</strong> ${esc(d.schedule)}</p>`;
  if (d.howto && d.howto.length) body += `<h2>How to Experience ${esc(it.name)}</h2><ol class="steps">${d.howto.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
  if (d.price && (d.price.range || d.price.note)) body += `<h2>💰 Price & Budget</h2><div class="seo-pricebox">${d.price.range ? `<div class="range">${esc(d.price.range)}</div>` : ''}${d.price.note ? `<div class="note">${esc(d.price.note)}</div>` : ''}</div>`;
  if (d.tips && d.tips.length) body += `<h2>💡 Insider Tips</h2><ul class="tips">${d.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  const mq = enc(it.mapQ || it.name + ' Korea');
  body += `<h2>🗺️ Location & Maps</h2>
    <div class="seo-map-frame"><iframe src="https://maps.google.com/maps?q=${mq}&z=14&hl=en&output=embed" loading="lazy" title="${esc(it.name)} map"></iframe></div>
    ${mapsHtml(it.mapQ || it.name + ' Korea')}`;
  if (d.links && d.links.length) body += `<h2>🔗 Useful Links</h2><div class="seo-links">${d.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>`;

  // related (same category)
  const related = ALL.filter(x => x.cat === it.cat && x.slug !== it.slug).slice(0, 4);
  if (related.length) body += `<h2>More ${esc(cm.label)} in Korea</h2><div class="seo-grid">${related.map(cardHtml).join('')}</div>`;

  // FAQ
  const qa = [
    [`What is ${it.name}?`, overview.slice(0, 280)],
    [`Where can I find ${it.name} in Korea?`, `${it.name} is best experienced in ${it.region || 'Korea'}. ${d.bestFor || ''}`.trim()],
  ];
  if (d.price && d.price.range) qa.push([`How much does ${it.name} cost?`, `${d.price.range}. ${d.price.note || ''}`.trim()]);
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml('🎫 Make the most of your visit', { city: ctxCity(it.region), cat: it.cat, q: it.name });
  body += ctaHtml(`Planning a trip to Korea?`, `Add ${it.name} to a free AI-built itinerary in seconds.`);

  const hero = `<header class="seo-hero">
    <span class="emoji">${it.emoji || '📍'}</span>
    <h1>${esc(it.name)}</h1>
    ${it.kr ? `<div class="kr">${esc(it.kr)}</div>` : ''}
    <div class="meta">${it.region ? `<span class="seo-badge region">📍 ${esc(it.region)}</span>` : ''}${(it.tags || []).map(t => `<span class="seo-badge">${esc(t)}</span>`).join('')}</div>
  </header>`;

  const mainSchema = ATTRACTION_CATS.has(it.cat)
    ? { '@context': 'https://schema.org', '@type': 'TouristAttraction', name: it.name, description: overview.slice(0, 300), url: ORIGIN + url, image: ORIGIN + '/guide/og-image.jpg', address: { '@type': 'PostalAddress', addressLocality: it.region || 'Korea', addressCountry: 'KR' }, isAccessibleForFree: it.cat !== 'shopping' }
    : { '@context': 'https://schema.org', '@type': 'Article', headline: title, description: desc, articleBody: overview, image: ORIGIN + '/guide/og-image.jpg', datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, mainEntityOfPage: ORIGIN + url };

  writePage(`places/${it.slug}.html`, shell({
    url, title, desc, keywords: `${it.name}, ${it.kr}, ${(it.tags || []).join(', ')}, Korea travel, ${cm.label}`,
    schemas: [mainSchema, breadcrumbLD(trail), faqLD(qa)], hero, body,
  }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 2) CATEGORY "BEST OF" PAGES (8)
// ══════════════════════════════════════════════════════════════════
function buildCategory(cat) {
  const cm = CAT_META[cat];
  const items = ALL.filter(i => i.cat === cat);
  const pageSlug = CAT_SLUG[cat];
  const url = `${BASEP}guide/${pageSlug}.html`;
  const titleMap = {
    food: 'Best Korean Food: 16 Must-Try Dishes', travel: 'Best Places to Visit in Korea',
    transport: 'Getting Around Korea: Transport Guide', companies: 'Top Korean Companies & Brands',
    kbeauty: 'K-Beauty Guide: Best Korean Skincare & Brands', kpop: 'K-Pop & Korean Culture Guide',
    shopping: 'Best Shopping in Korea: Markets & Malls', history: 'Korean History & Heritage Guide',
  };
  const h1 = titleMap[cat] || `Best Korean ${cm.label}`;
  const title = `${h1} (2026) | KoreaPlus`;
  const desc = `Discover the best Korean ${cm.label.toLowerCase()} — ${items.slice(0, 5).map(i => i.name).join(', ')} and more. Insider tips, prices & maps for travelers.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: cm.label, url }];

  let body = bcHtml(trail);
  body += `<p class="lead">${esc(desc)}</p>`;
  body += `<p>Korea offers world-class ${esc(cm.label.toLowerCase())} for every traveler. Below are ${items.length} hand-picked ${esc(cm.noun)}s with practical tips, prices and locations — tap any to open the full guide.</p>`;
  body += `<div class="seo-grid">${items.map(cardHtml).join('')}</div>`;
  body += ctaHtml('Turn this list into a trip', `Get a free AI itinerary featuring the best of Korean ${cm.label.toLowerCase()}.`);

  const itemList = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: h1, numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: ORIGIN + `${BASEP}places/${it.slug}.html` })),
  };
  const hero = `<header class="seo-hero"><span class="emoji">${cm.icon}</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">${items.length} picks</span><span class="seo-badge">Updated 2026</span></div></header>`;
  writePage(`guide/${pageSlug}.html`, shell({ url, title, desc, keywords: `Korean ${cm.label}, best ${cm.label} Korea, ${items.slice(0,6).map(i=>i.name).join(', ')}`, schemas: [itemList, breadcrumbLD(trail)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 3) CITY GUIDE PAGES (8)
// ══════════════════════════════════════════════════════════════════
function cityPool(city) {
  const n = city.name.toLowerCase();
  return ALL.filter(i => {
    const r = (i.region || '').toLowerCase(), m = (i.mapQ || '').toLowerCase();
    return r.includes(n) || m.includes(n) || (city.name === 'Seoul' && (r.includes('hongdae') || r.includes('gangnam') || r.includes('myeongdong') || r.includes('insadong')));
  });
}
function buildCity(city) {
  const pool = cityPool(city);
  const url = `${BASEP}guide/things-to-do-in-${slug(city.name)}.html`;
  const h1 = `Things to Do in ${city.name}, Korea`;
  const title = `${h1} — Top Attractions, Food & Tips (2026) | KoreaPlus`;
  const food = pool.filter(i => i.cat === 'food'), sights = pool.filter(i => i.cat !== 'food');
  const desc = `Top things to do in ${city.name} (${city.kr}): ${pool.slice(0, 5).map(i => i.name).join(', ')}. Local food, attractions, transport & insider tips for travelers.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: 'Travel', url: `${BASEP}guide/${CAT_SLUG.travel}.html` }, { name: city.name, url }];

  let body = bcHtml(trail);
  body += `<p class="lead">${esc(city.name)} (${esc(city.kr)}) is one of Korea's must-visit destinations. Here's everything to see, eat and experience — with insider tips and maps.</p>`;
  if (sights.length) { body += `<h2>🏯 Top Attractions in ${esc(city.name)}</h2><div class="seo-grid">${sights.slice(0, 8).map(cardHtml).join('')}</div>`; }
  if (food.length) { body += `<h2>🍜 What to Eat in ${esc(city.name)}</h2><div class="seo-grid">${food.slice(0, 6).map(cardHtml).join('')}</div>`; }
  const qa = [
    [`How many days do you need in ${city.name}?`, `Most travelers spend 2–3 days in ${city.name} to cover the highlights. See our day-by-day itinerary for a ready-made plan.`],
    [`Is ${city.name} worth visiting?`, `Yes — ${city.name} offers ${pool.slice(0,3).map(i=>i.name).join(', ')} and much more, making it one of Korea's top destinations.`],
    [`How do I get to ${city.name}?`, `${city.name === 'Seoul' || city.name === 'Incheon' ? 'Fly into Incheon (ICN) airport, then use the AREX train or metro.' : `Take the KTX bullet train or an express bus from Seoul to reach ${city.name} comfortably.`}`],
  ];
  body += tripBanner(city.name, 'kp_city');
  body += `<h2>❓ ${esc(city.name)} Travel FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml(`🎫 Book ${city.name} tours, hotels & essentials`, { city: city.name, cat: 'travel', q: '' });
  body += ctaHtml(`Plan your ${city.name} trip`, `Get a free AI-built ${city.name} itinerary with optimized routes.`);

  const hero = `<header class="seo-hero"><span class="emoji">📍</span><h1>${esc(h1)}</h1><div class="kr">${esc(city.kr)}</div><div class="meta"><span class="seo-badge region">${pool.length} places</span></div></header>`;
  const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: h1, itemListElement: pool.slice(0, 12).map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: ORIGIN + `${BASEP}places/${it.slug}.html` })) };
  writePage(`guide/things-to-do-in-${slug(city.name)}.html`, shell({ url, title, desc, keywords: `${city.name} Korea, things to do ${city.name}, ${city.name} attractions, ${city.name} travel guide`, schemas: [itemList, breadcrumbLD(trail), faqLD(qa)], hero, body }));
  return { url, pool };
}

// ══════════════════════════════════════════════════════════════════
// 4) ITINERARY PAGES (city × days)
// ══════════════════════════════════════════════════════════════════
function buildItinerary(city, days, pool) {
  const sights = pool.filter(i => i.cat !== 'food');
  const foods = pool.filter(i => i.cat === 'food');
  const allFoods = foods.length >= 2 ? foods : ALL.filter(i => i.cat === 'food');
  const url = `${BASEP}itinerary/${slug(city.name)}-${days}-day-itinerary.html`;
  const h1 = `${days}-Day ${city.name} Itinerary`;
  const title = `${h1} for First-Timers (2026) | KoreaPlus`;
  const desc = `The perfect ${days}-day ${city.name} itinerary: day-by-day plan with ${pool.slice(0,3).map(i=>i.name).join(', ')}, where to eat, and insider tips. Free & route-optimized.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: city.name, url: `${BASEP}guide/things-to-do-in-${slug(city.name)}.html` }, { name: `${days}-Day Itinerary`, url }];

  let body = bcHtml(trail);
  body += `<p class="lead">This ${days}-day ${esc(city.name)} itinerary balances must-see sights, great food and downtime — perfect for first-time visitors. Adjust it freely in our AI planner.</p>`;

  const perDay = Math.max(2, Math.ceil(sights.length / days));
  let si = 0, fi = 0;
  for (let d = 1; d <= days; d++) {
    const morning = sights[si++ % sights.length];
    const afternoon = sights[si++ % sights.length];
    const lunch = allFoods[fi++ % allFoods.length];
    const dinner = allFoods[fi++ % allFoods.length];
    body += `<div class="seo-day"><div class="dh">Day ${d}</div><div class="ds">${esc(city.name)} highlights</div>`;
    if (morning) body += slotHtml('☀️', 'Morning', morning);
    if (lunch) body += slotHtml('🍱', 'Lunch', lunch);
    if (afternoon && afternoon.slug !== (morning && morning.slug)) body += slotHtml('🌤️', 'Afternoon', afternoon);
    if (dinner) body += slotHtml('🌙', 'Dinner', dinner);
    body += `</div>`;
  }
  const qa = [
    [`Is ${days} days enough for ${city.name}?`, `${days} days is ${days >= 3 ? 'ideal' : 'a great start'} for ${city.name}, covering the main highlights at a comfortable pace.`],
    [`How much does a ${days}-day ${city.name} trip cost?`, `Budget travelers can do ${city.name} for about $50–70/day; mid-range around $120/day including food, transport and attractions.`],
    [`What's the best way to get around ${city.name}?`, `Get a T-money card and use the metro and buses. Use KakaoMap or Naver Map for directions — Google Maps is limited in Korea.`],
  ];
  body += tripBanner(city.name, 'kp_itin');
  body += `<h2>❓ ${esc(city.name)} Itinerary FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml(`🎫 Book your ${city.name} trip`, { city: city.name, cat: 'travel', q: '' });
  body += ctaHtml('Customize this itinerary', `Tweak days, pace and budget — our AI rebuilds your ${city.name} plan instantly.`);

  const hero = `<header class="seo-hero"><span class="emoji">🗺️</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">${days} days</span><span class="seo-badge region">${esc(city.name)}</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  writePage(`itinerary/${slug(city.name)}-${days}-day-itinerary.html`, shell({ url, title, desc, keywords: `${city.name} itinerary, ${days} days ${city.name}, ${city.name} travel plan, things to do ${city.name}`, schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body }));
  return url;
}
function slotHtml(icon, label, it) {
  const d = DETAIL[it.name] || {};
  const tip = (d.tips && d.tips[0]) || it.desc || '';
  return `<div class="seo-slot"><span class="si">${icon}</span><div><div class="st">${label}</div><div class="sn"><a href="places/${it.slug}.html" style="color:inherit;text-decoration:none">${esc(it.name)}</a></div><div class="sd">${esc(tip.slice(0, 140))}</div></div></div>`;
}

// ══════════════════════════════════════════════════════════════════
// 5) MONTH GUIDES (12)
// ══════════════════════════════════════════════════════════════════
const MONTHS = [
  ['January', '❄️', '-2°C to 5°C, cold & dry', 'Heavy coat, thermals, gloves', 'Ski resorts, ice fishing (Hwacheon Sancheoneo), winter illuminations', 'Few crowds, lowest prices, snowy palaces'],
  ['February', '🌨️', '0°C to 7°C, cold, Lunar New Year', 'Warm layers, scarf', 'Seollal (Lunar New Year), late-winter snow, hot spring spas', 'Cultural festivals, quieter sights'],
  ['March', '🌱', '5°C to 13°C, mild spring start', 'Light jacket, layers', 'Early plum blossoms, fewer crowds before peak season', 'Shoulder-season prices, pleasant weather'],
  ['April', '🌸', '10°C to 18°C, peak spring', 'Light layers, light jacket', 'Cherry blossoms (Jinhae, Seoul, Gyeongju), spring festivals', 'Cherry blossom season — Korea at its most beautiful'],
  ['May', '🌿', '15°C to 23°C, warm & green', 'T-shirt + light layer', 'Lotus Lantern Festival, Boseong tea fields, hiking', 'Best all-round weather, lush scenery'],
  ['June', '☀️', '20°C to 27°C, early summer/rain start', 'Summer clothes, umbrella', 'Beaches open, Boryeong Mud Festival prep, green mountains', 'Warm, fewer crowds before peak summer'],
  ['July', '🌧️', '24°C to 30°C, hot & humid (monsoon)', 'Light breathable clothes, umbrella', 'Boryeong Mud Festival, water parks, Han River nights', 'Festivals & nightlife despite the rain'],
  ['August', '🏖️', '25°C to 33°C, hottest & humid', 'Light clothes, sunscreen, hat', 'Beaches (Haeundae), summer festivals, mountain escapes', 'Peak beach season, vibrant summer events'],
  ['September', '🍃', '20°C to 28°C, warm easing to cool', 'Light layers', 'Chuseok (harvest festival), early foliage, comfortable days', 'Great weather, harvest culture'],
  ['October', '🍁', '10°C to 22°C, crisp autumn', 'Light jacket, layers', 'Autumn foliage (Seoraksan, Naejangsan), Andong Mask Dance, Busan Film Festival', 'Stunning fall colors — a top time to visit'],
  ['November', '🍂', '5°C to 15°C, cool late autumn', 'Coat, layers', 'Late foliage, fewer crowds, illuminations begin', 'Shoulder season, golden landscapes'],
  ['December', '🎄', '-3°C to 6°C, cold winter', 'Heavy coat, gloves, hat', 'Christmas markets, illuminations, ski season, hot spas', 'Festive lights, winter wonderland'],
];
function buildMonth(m, idx) {
  const [name, icon, weather, wear, events, why] = m;
  const sslug = name.toLowerCase();
  const url = `${BASEP}guide/korea-in-${sslug}.html`;
  const h1 = `Korea in ${name}: Weather, What to Wear & What to Do`;
  const title = `${h1} (2026) | KoreaPlus`;
  const desc = `Visiting Korea in ${name}? Weather: ${weather}. ${why}. What to pack, top events and travel tips.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: 'When to Visit', url: `${BASEP}explore.html` }, { name: `Korea in ${name}`, url }];

  let body = bcHtml(trail);
  body += `<p class="lead">${esc(why)}. Here's everything you need to know about visiting Korea in ${esc(name)} — weather, packing and the best things to do.</p>`;
  body += `<h2>🌡️ ${esc(name)} Weather in Korea</h2><p><strong>Typical temperatures:</strong> ${esc(weather)}.</p>`;
  body += `<h2>🧳 What to Wear</h2><p>${esc(wear)}.</p>`;
  body += `<h2>🎉 Top Things to Do in ${esc(name)}</h2><p>${esc(events)}.</p>`;
  body += `<h2>📅 Live Events</h2><p>See what's on right now — Korea's festival calendar updates automatically with real-time data.</p><div class="seo-links"><a href="festivals.html">📅 Korea Festival Calendar ↗</a><a href="seasons.html">🌸 Cherry Blossom & Foliage Forecast ↗</a></div>`;
  const qa = [
    [`Is ${name} a good time to visit Korea?`, `${why}. Expect ${weather.toLowerCase()}.`],
    [`What should I pack for Korea in ${name}?`, `${wear}.`],
  ];
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += ctaHtml(`Planning a ${name} trip to Korea?`, `Get a free AI itinerary tailored to the season.`);

  const hero = `<header class="seo-hero"><span class="emoji">${icon}</span><h1>${esc('Korea in ' + name)}</h1><div class="meta"><span class="seo-badge">${esc(weather.split(',')[0])}</span><a class="seo-badge" href="ja/korea-in-${sslug}.html">🇯🇵 日本語</a><a class="seo-badge" href="zh/korea-in-${sslug}.html">🇨🇳 中文</a><a class="seo-badge" href="es/korea-in-${sslug}.html">🇪🇸 Español</a></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  const alts = LOCALES.map(l => ({ lang: l, url: `${BASEP}${l}/korea-in-${sslug}.html` }));
  writePage(`guide/korea-in-${sslug}.html`, shell({ url, title, desc, keywords: `Korea in ${name}, Korea weather ${name}, what to wear Korea ${name}, visit Korea ${name}`, schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body, alts }));
  return url;
}

// Localized month page (ja / zh) — translated template + data, hreflang'd to EN.
function buildMonthL10n(idx, lang) {
  const L = L10N[lang]; const tw = L.tw;
  const [nameL, weather, wear, events, why] = L.months[idx];
  const [nameEn, icon] = MONTHS[idx];
  const sslug = nameEn.toLowerCase();
  const url = `${BASEP}${L.dir}/korea-in-${sslug}.html`;
  const enUrl = `${BASEP}guide/korea-in-${sslug}.html`;
  const h1 = lang === 'ja' ? `${nameL}の韓国旅行` : lang === 'zh' ? `${nameL}韩国旅游攻略` : `Corea en ${nameL}`;
  const title = lang === 'es' ? `Corea en ${nameL}: clima, qué llevar y qué hacer | KoreaPlus` : `${nameL}${tw.titleSuffix} | KoreaPlus`;
  const desc = `${why}。${weather}。${wear}。`;
  const trail = [{ name: 'Home', url: BASEP }, { name: h1, url }];
  let body = bcHtml(trail);
  body += `<p class="lead">${esc(tw.lead(nameL))} ${esc(why)}。</p>`;
  body += `<h2>🌡️ ${esc(nameL)}${esc(tw.weatherH)}</h2><p>${esc(weather)}。</p>`;
  body += `<h2>${esc(tw.wearH)}</h2><p>${esc(wear)}。</p>`;
  body += `<h2>${esc(tw.doH)}</h2><p>${esc(events)}。</p>`;
  body += `<h2>${esc(tw.evH)}</h2><p>${esc(tw.evP)}</p><div class="seo-links"><a href="festivals.html">📅 Festival Calendar ↗</a><a href="seasons.html">🌸 Cherry Blossom & Foliage ↗</a></div>`;
  const qa = [[tw.q1(nameL), `${why}。${weather}。`], [tw.q2(nameL), `${wear}。`]];
  body += `<h2>${esc(tw.faqH)}</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += `<div class="seo-cta"><h2>${esc(tw.ctaH)}</h2><p>${esc(tw.ctaP)}</p><div class="btns"><a class="primary" href="plan.html">🗺️ AI Trip Planner</a><a class="ghost" href="${enUrl.replace(BASEP, '')}">🇬🇧 English version</a></div></div>`;
  const hero = `<header class="seo-hero"><span class="emoji">${icon}</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">${esc(weather.split(/[、，,]/)[0])}</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, inLanguage: lang, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  const alts = [{ lang: 'en', url: enUrl },
    ...LOCALES.filter(l => l !== lang).map(l => ({ lang: l, url: `${BASEP}${l}/korea-in-${sslug}.html` }))];
  writePage(`${L.dir}/korea-in-${sslug}.html`, shell({ url, title, desc, keywords: '', schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body, lang, alts }));
  return url;
}

// Localized visa/K-ETA page (ja / zh)
function buildVisaL10n(lang) {
  const L = L10N[lang]; const V = L.visa;
  const url = `${BASEP}${L.dir}/korea-visa-k-eta-guide.html`;
  const enUrl = `${BASEP}guide/korea-visa-k-eta-guide.html`;
  const title = `${V.h1}${V.titleSuffix}`;
  const trail = [{ name: 'Home', url: BASEP }, { name: V.h1, url }];
  let body = bcHtml(trail);
  body += `<p class="lead">${V.lead}</p>`;
  for (const [h, html] of V.sections) body += `<h2>${h}</h2>${html.startsWith('<') ? html : `<p>${html}</p>`}`;
  body += `<div class="seo-links"><a href="https://www.k-eta.go.kr/" target="_blank" rel="noopener">🌐 K-ETA Official ↗</a></div>`;
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${V.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += `<div class="seo-cta"><h2>${esc(V.ctaH)}</h2><p>${esc(V.ctaP)}</p><div class="btns"><a class="primary" href="plan.html">🗺️ AI Trip Planner</a><a class="ghost" href="${enUrl.replace(BASEP, '')}">🇬🇧 English version</a></div></div>`;
  const hero = `<header class="seo-hero"><span class="emoji">🛂</span><h1>${esc(V.h1)}</h1><div class="meta"><span class="seo-badge">2026</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: V.h1, description: V.desc, inLanguage: lang, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  const alts = [{ lang: 'en', url: enUrl },
    ...LOCALES.filter(l => l !== lang).map(l => ({ lang: l, url: `${BASEP}${l}/korea-visa-k-eta-guide.html` }))];
  writePage(`${L.dir}/korea-visa-k-eta-guide.html`, shell({ url, title, desc: V.desc, keywords: '', schemas: [article, breadcrumbLD(trail), faqLD(V.faq)], hero, body, lang, alts }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 10) BLOG — index + posts
// ══════════════════════════════════════════════════════════════════
function buildBlogPost(p) {
  const url = `${BASEP}blog/${p.slug}.html`;
  const title = `${p.h1} | KoreaPlus Blog`;
  const trail = [{ name: 'Home', url: BASEP }, { name: 'Blog', url: `${BASEP}blog/index.html` }, { name: p.h1, url }];
  let body = bcHtml(trail);
  body += p.body;
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml('🎫 Plan & book your Korea trip', { city: 'Seoul', cat: p.slug.includes('sim') ? 'esim' : 'general', q: '' });
  // related posts
  const rel = BLOG.filter(b => b.slug !== p.slug).slice(0, 3);
  body += `<h2>📰 More from the blog</h2><div class="seo-linklist">${rel.map(b => `<a href="blog/${b.slug}.html">${b.emoji} ${esc(b.h1)}</a>`).join('')}</div>`;
  body += ctaHtml('Ready to plan your Korea trip?', 'Build a free day-by-day itinerary with AI in seconds.');
  const hero = `<header class="seo-hero"><span class="emoji">${p.emoji}</span><h1>${esc(p.h1)}</h1><div class="meta"><span class="seo-badge">Updated ${p.date}</span><span class="seo-badge region">Travel Tips</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.h1, description: p.desc, datePublished: p.date, dateModified: p.date, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  writePage(`blog/${p.slug}.html`, shell({ url, title, desc: p.desc, keywords: '', schemas: [article, breadcrumbLD(trail), faqLD(p.faq)], hero, body }));
  return url;
}
function buildBlogIndex() {
  const url = `${BASEP}blog/index.html`;
  const title = 'Korea Travel Blog — Tips, Costs & Guides | KoreaPlus';
  const desc = 'Practical Korea travel articles: trip costs, first-timer tips, safety, connectivity and solo travel — written for real travelers, updated for 2026.';
  const trail = [{ name: 'Home', url: BASEP }, { name: 'Blog', url }];
  let body = bcHtml(trail);
  body += `<p class="lead">No fluff — practical answers to the questions every Korea traveler actually Googles.</p>`;
  body += `<div class="seo-grid">${BLOG.map(p => `
    <a class="seo-card" href="blog/${p.slug}.html">
      <span class="ce">${p.emoji}</span>
      <div class="cn">${esc(p.h1)}</div>
      <div class="cd">${esc(p.desc.slice(0, 110))}…</div>
    </a>`).join('')}</div>`;
  body += ctaHtml('Prefer a ready-made plan?', 'Our AI builds a personalized Korea itinerary free.');
  const hero = `<header class="seo-hero"><span class="emoji">📰</span><h1>Korea Travel Blog</h1><div class="meta"><span class="seo-badge">${BLOG.length} articles</span></div></header>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Blog', name: 'KoreaPlus Travel Blog', url: ORIGIN + url, blogPost: BLOG.map(p => ({ '@type': 'BlogPosting', headline: p.h1, url: `${ORIGIN}${BASEP}blog/${p.slug}.html` })) };
  writePage('blog/index.html', shell({ url, title, desc, keywords: 'Korea travel blog, Korea travel tips, Korea trip cost, Korea safety', schemas: [ld, breadcrumbLD(trail)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 6) EXPLORE HUB
// ══════════════════════════════════════════════════════════════════
function buildExplore(urls) {
  const url = `${BASEP}explore.html`;
  const title = `Explore Korea — Travel Guides, Itineraries & Tips | KoreaPlus`;
  const desc = `Browse 150+ Korea travel guides: top attractions, food, city itineraries, monthly guides and more. Plan the perfect trip to Korea.`;
  let body = bcHtml([{ name: 'Home', url: BASEP }, { name: 'Explore', url }]);
  body += `<p class="lead">Your complete index of Korea travel content — tap any guide to dive in.</p>`;
  const section = (t, list) => `<h2 class="seo-secttitle">${t}</h2><div class="seo-linklist">${list.join('')}</div>`;
  body += section('✈️ Travel Basics', [`<a href="guide/korea-visa-k-eta-guide.html">🛂 Visa & K-ETA Guide</a>`, ...(urls.stays || []).map(u => `<a href="${u.replace(BASEP, '')}">🏨 ${esc(u.split('/').pop().replace(/-/g, ' ').replace('.html', '').replace(/\b\w/g, m => m.toUpperCase()))}</a>`)]);
  body += section('📰 Blog', BLOG.map(p => `<a href="blog/${p.slug}.html">${p.emoji} ${esc(p.h1.split(/[:?(]/)[0].trim())}</a>`));
  body += section('🌏 日本語 / 中文 / Español', [
    `<a href="ja/korea-visa-k-eta-guide.html">🇯🇵 ビザ & K-ETA</a>`, `<a href="ja/korea-in-april.html">🇯🇵 4月の韓国</a>`, `<a href="ja/korea-in-october.html">🇯🇵 10月の韓国</a>`,
    `<a href="zh/korea-visa-k-eta-guide.html">🇨🇳 签证 & K-ETA</a>`, `<a href="zh/korea-in-april.html">🇨🇳 4月韩国攻略</a>`, `<a href="zh/korea-in-october.html">🇨🇳 10月韩国攻略</a>`,
    `<a href="es/korea-visa-k-eta-guide.html">🇪🇸 Visado & K-ETA</a>`, `<a href="es/korea-in-april.html">🇪🇸 Corea en abril</a>`, `<a href="es/korea-in-october.html">🇪🇸 Corea en octubre</a>`,
  ]);
  body += section('🍜 By Topic', Object.keys(CAT_META).map(c => `<a href="guide/${CAT_SLUG[c]}.html">${CAT_META[c].icon} ${esc(CAT_META[c].label)}</a>`));
  body += section('📍 City Guides', CITIES.map(c => `<a href="guide/things-to-do-in-${slug(c.name)}.html">📍 ${esc(c.name)}</a>`));
  if (urls.neighborhoods && urls.neighborhoods.length) body += section('🏘️ Seoul Neighborhoods', NEIGHBORHOODS.map(n => `<a href="guide/${slug(n.name)}-${slug(n.city)}-guide.html">${n.emoji} ${esc(n.name)}</a>`));
  body += section('🗺️ Itineraries', urls.itineraries.map(u => `<a href="${u.replace(BASEP, '')}">🗺️ ${esc(u.split('/').pop().replace(/-/g, ' ').replace('.html', '').replace(/\b\w/g, m => m.toUpperCase()))}</a>`));
  body += section('📅 When to Visit', [
    ...SEASONS4.map(s => `<a href="guide/korea-in-${s.slug}.html">${s.emoji} ${esc(s.name)}</a>`),
    ...MONTHS.map(m => `<a href="guide/korea-in-${m[0].toLowerCase()}.html">${m[1]} ${esc(m[0])}</a>`)]);
  body += section('❓ Quick Answers', FAQS.map(f => `<a href="faq/${f.slug}.html">${f.emoji} ${esc(f.q)}</a>`));
  body += section('⚖️ Comparisons', COMPARES.map(c => `<a href="guide/${c.slug}.html">${c.emoji} ${esc(c.h1.split(':')[0])}</a>`));
  body += section('🍱 Food by City', CITIES.map(c => `<a href="guide/best-food-in-${slug(c.name)}.html">🍜 ${esc(c.name)}</a>`));
  body += section('🏯 All Places (' + ALL.length + ')', ALL.map(i => `<a href="places/${i.slug}.html">${i.emoji} ${esc(i.name)}</a>`));
  body += ctaHtml('Ready to plan?', 'Build a free, route-optimized Korea itinerary with AI.');
  const hero = `<header class="seo-hero"><span class="emoji">🧭</span><h1>Explore Korea</h1><div class="meta"><span class="seo-badge">${ALL.length}+ guides</span></div></header>`;
  writePage('explore.html', shell({ url, title, desc, keywords: 'Korea travel guide, Korea attractions, Korea itinerary, things to do Korea', schemas: [breadcrumbLD([{ name: 'Home', url: BASEP }, { name: 'Explore', url }]), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description: desc, url: ORIGIN + url }], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 7) VISA / K-ETA GUIDE
// ══════════════════════════════════════════════════════════════════
function buildVisa() {
  const url = `${BASEP}guide/korea-visa-k-eta-guide.html`;
  const h1 = 'Korea Visa & K-ETA Guide for Travelers';
  const title = `${h1} (2026) — Who Needs One & How to Apply | KoreaPlus`;
  const desc = 'Do you need a visa for Korea? Complete K-ETA guide: visa-free countries, how to apply, cost, processing time and entry requirements for 2026.';
  const trail = [{ name: 'Home', url: BASEP }, { name: 'Travel Basics', url: `${BASEP}explore.html` }, { name: 'Visa & K-ETA', url }];
  let body = bcHtml(trail);
  body += `<p class="lead">Most visitors can enter Korea visa-free for short stays, but many must first get a <strong>K-ETA</strong> (Korea Electronic Travel Authorization). Here's exactly what you need for 2026.</p>`;
  body += `<h2>🛂 Do I need a visa for Korea?</h2><p>Citizens of <strong>110+ countries</strong> (incl. USA, UK, Canada, Australia, most of the EU, Japan, Singapore) can enter Korea <strong>visa-free</strong> for tourism — typically 30–90 days depending on nationality. Always confirm your nationality's allowance before booking.</p>`;
  body += `<h2>✅ What is K-ETA?</h2><p>K-ETA is an online travel authorization (similar to the US ESTA). Visa-free travelers usually need it to board a flight to Korea. <strong>Note:</strong> Korea has periodically granted <em>temporary K-ETA exemptions</em> for many countries — check the official portal for current status before you travel.</p>`;
  body += `<h2>📝 How to apply for K-ETA</h2><ol class="steps"><li>Go to the official site <strong>k-eta.go.kr</strong> (or the K-ETA app) — beware of copycat sites that overcharge.</li><li>Apply at least <strong>72 hours before departure</strong>.</li><li>Upload a passport photo, passport info and trip details.</li><li>Pay the fee (around <strong>₩10,000</strong>) by card.</li><li>Receive approval by email — valid for multiple entries over <strong>2–3 years</strong>.</li></ol>`;
  body += `<h2>💰 Cost & processing time</h2><div class="seo-pricebox"><div class="range">≈ ₩10,000 (~$7–8)</div><div class="note">Approval usually within minutes to 72 hours. Apply early to be safe.</div></div>`;
  body += `<h2>🧳 On arrival</h2><ul class="tips"><li>Fill in the arrival card (or Q-CODE health form if required at the time).</li><li>Have your accommodation address and return ticket ready.</li><li>Keep digital + printed copies of your K-ETA approval and passport.</li></ul>`;
  body += `<div class="seo-links"><a href="https://www.k-eta.go.kr/" target="_blank" rel="noopener">🌐 Official K-ETA Portal ↗</a><a href="https://www.0404.go.kr/" target="_blank" rel="noopener">🌐 Korea MOFA Travel Info ↗</a></div>`;
  const qa = [
    ['Do US citizens need a visa for Korea?', 'US citizens can visit Korea visa-free for up to 90 days for tourism. A K-ETA may be required unless a temporary exemption applies — check k-eta.go.kr before flying.'],
    ['How much does K-ETA cost?', 'The K-ETA fee is about ₩10,000 (roughly $7–8 USD), paid online by card. Only use the official site k-eta.go.kr.'],
    ['How long does K-ETA take to approve?', 'Approval can take from a few minutes up to 72 hours. Always apply at least 3 days before departure.'],
    ['How long is K-ETA valid?', 'Once approved, K-ETA is valid for multiple entries over 2–3 years (as long as your passport is valid).'],
  ];
  body += `<h2>❓ Visa & K-ETA FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml('🎫 Sorted your entry? Book the rest', { city: 'Seoul', cat: 'esim', q: '' });
  body += ctaHtml('Ready to plan your Korea trip?', 'Build a free day-by-day itinerary with AI in seconds.');
  const hero = `<header class="seo-hero"><span class="emoji">🛂</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">Updated 2026</span><a class="seo-badge" href="ja/korea-visa-k-eta-guide.html">🇯🇵 日本語</a><a class="seo-badge" href="zh/korea-visa-k-eta-guide.html">🇨🇳 中文</a><a class="seo-badge" href="es/korea-visa-k-eta-guide.html">🇪🇸 Español</a></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  const alts = LOCALES.map(l => ({ lang: l, url: `${BASEP}${l}/korea-visa-k-eta-guide.html` }));
  writePage('guide/korea-visa-k-eta-guide.html', shell({ url, title, desc, keywords: 'Korea visa, K-ETA, do I need a visa for Korea, Korea visa free, K-ETA application, Korea entry requirements', schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body, alts }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 8) NEIGHBORHOOD GUIDES
// ══════════════════════════════════════════════════════════════════
function buildNeighborhood(n) {
  const sslug = `${slug(n.name)}-${slug(n.city)}-guide`;
  const url = `${BASEP}guide/${sslug}.html`;
  const h1 = `${n.name} (${n.kr}) — ${n.city} Neighborhood Guide`;
  const title = `${h1}: What to Do, Eat & See | KoreaPlus`;
  const desc = `${n.name}, ${n.city} is known for ${n.known}. What to do, where to eat and how to get there — a local's neighborhood guide.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: n.city, url: `${BASEP}guide/things-to-do-in-${slug(n.city)}.html` }, { name: n.name, url }];
  let body = bcHtml(trail);
  body += `<p class="lead">${esc(n.name)} (${esc(n.kr)}) is one of ${esc(n.city)}'s most popular neighborhoods, known for <strong>${esc(n.known)}</strong>.</p>`;
  body += `<h2>🎯 What to Do in ${esc(n.name)}</h2><p>${esc(n.do)}</p>`;
  body += `<h2>🍜 Where to Eat</h2><p>${esc(n.eat)}</p>`;
  body += `<h2>🚇 How to Get There</h2><p>${esc(n.getto)}</p>${mapsHtml(n.name + ' ' + n.city + ' Korea')}`;
  const qa = [
    [`What is ${n.name} known for?`, `${n.name} is known for ${n.known}.`],
    [`How do I get to ${n.name}?`, n.getto],
  ];
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml(`🎫 Book ${n.city} experiences`, { city: n.city, cat: 'travel', q: n.name });
  body += ctaHtml(`Add ${n.name} to your trip`, `Build a free ${n.city} itinerary that includes ${n.name}.`);
  const hero = `<header class="seo-hero"><span class="emoji">${n.emoji}</span><h1>${esc(n.name)}</h1><div class="kr">${esc(n.kr)} · ${esc(n.city)}</div><div class="meta"><span class="seo-badge region">${esc(n.city)}</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'TouristAttraction', name: `${n.name}, ${n.city}`, description: desc, url: ORIGIN + url, address: { '@type': 'PostalAddress', addressLocality: n.city, addressCountry: 'KR' }, image: ORIGIN + '/guide/og-image.jpg' };
  writePage(`guide/${sslug}.html`, shell({ url, title, desc, keywords: `${n.name} ${n.city}, ${n.name} guide, things to do ${n.name}, ${n.name} Korea`, schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 9) WHERE TO STAY GUIDES
// ══════════════════════════════════════════════════════════════════
function buildStay(s) {
  const url = `${BASEP}guide/where-to-stay-in-${slug(s.city)}.html`;
  const h1 = `Where to Stay in ${s.city}: Best Areas & Neighborhoods`;
  const title = `${h1} (2026) | KoreaPlus`;
  const desc = `Where to stay in ${s.city} (${s.kr}): the best neighborhoods for first-timers, nightlife, budget and luxury — with transit tips for choosing your base.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: s.city, url: `${BASEP}guide/things-to-do-in-${slug(s.city)}.html` }, { name: 'Where to Stay', url }];
  let body = bcHtml(trail);
  body += `<p class="lead">Choosing the right area makes ${esc(s.city)} far easier to explore. Here are the best neighborhoods to stay in, by travel style.</p>`;
  body += `<h2>🏨 Best Areas to Stay in ${esc(s.city)}</h2>`;
  s.areas.forEach(([area, why]) => { body += `<h3>${esc(area)}</h3><p>${esc(why)}</p>`; });
  body += tripBanner(s.city, 'kp_stay');
  body += affHtml(`🏨 Find ${s.city} hotels & stays`, { city: s.city, cat: 'hotel', q: '' });
  const qa = [
    [`What is the best area to stay in ${s.city} for first-timers?`, `${s.areas[0][0]} — ${s.areas[0][1]}`],
    [`Where should I stay in ${s.city} on a budget?`, s.areas.find(a => /budget|affordable/i.test(a[1])) ? s.areas.find(a => /budget|affordable/i.test(a[1])).join(' — ') : `${s.areas[1] ? s.areas[1].join(' — ') : s.areas[0].join(' — ')}`],
  ];
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += ctaHtml(`Planning ${s.city}?`, `Get a free AI ${s.city} itinerary to match your base.`);
  const hero = `<header class="seo-hero"><span class="emoji">🏨</span><h1>${esc('Where to Stay in ' + s.city)}</h1><div class="kr">${esc(s.kr)}</div><div class="meta"><span class="seo-badge region">${s.areas.length} areas</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  writePage(`guide/where-to-stay-in-${slug(s.city)}.html`, shell({ url, title, desc, keywords: `where to stay in ${s.city}, best area ${s.city}, ${s.city} hotels neighborhood, ${s.city} accommodation`, schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 11) Q&A MICRO PAGES — featured-snippet targets (/guide/faq/)
// ══════════════════════════════════════════════════════════════════
const FAQS = [
  { slug: 'how-to-get-from-incheon-airport-to-seoul', emoji: '🚄', q: 'How do I get from Incheon Airport to Seoul?',
    a: 'Take the AREX train: the Express reaches Seoul Station in 43 minutes (₩11,000), the All-Stop train in about an hour (₩4,750 with T-money). Airport limousine buses serve major hotel districts directly, and taxis cost ₩55,000–75,000 depending on traffic.',
    body: '<p>The AREX All-Stop is the best value and connects to the subway network at Hongik Univ., Gongdeok and Seoul Station. Limousine buses (₩17,000–18,000) are ideal with heavy luggage — they stop at Myeongdong, Gangnam and most hotel zones. After midnight, look for the N6001/N6703 night buses or use Kakao T for a taxi.</p>',
    rel: [['T-money Card guide', 'places/t-money-card.html'], ['Incheon Airport guide', 'places/incheon-airport.html'], ['Seoul city guide', 'guide/things-to-do-in-seoul.html']] },
  { slug: 'best-time-to-visit-korea', emoji: '🌸', q: 'What is the best time to visit Korea?',
    a: 'April–May and September–November are the best times to visit Korea. Spring brings cherry blossoms and mild weather; autumn offers crisp air and spectacular foliage. Summer (July–August) is hot, humid and rainy; winter is cold but cheap, uncrowded and great for skiing.',
    body: '<p>For cherry blossoms aim for late March (south) to mid-April (Seoul). For autumn colors, mid-October through early November is peak. Avoid the jangma monsoon weeks of July if you can.</p>',
    rel: [['Korea in April', 'guide/korea-in-april.html'], ['Korea in October', 'guide/korea-in-october.html'], ['All month guides', 'explore.html']] },
  { slug: 'do-they-speak-english-in-korea', emoji: '🗣️', q: 'Do they speak English in Korea?',
    a: 'Enough to travel comfortably: subway signs, menus in tourist areas and announcements are bilingual, and younger Koreans usually understand basic English. Outside tourist zones expect limited spoken English — the Papago translation app fills every gap.',
    body: '<p>Hotels, airports and major attractions all operate in English. At local restaurants, pointing at the menu plus a translation app works perfectly. Learning two phrases — 안녕하세요 (hello) and 감사합니다 (thank you) — earns instant goodwill.</p>',
    rel: [['Survival Korean phrases', 'phrases.html'], ['21 first-timer tips', 'blog/korea-travel-tips-first-time.html']] },
  { slug: 'do-you-tip-in-korea', emoji: '💵', q: 'Do you tip in Korea?',
    a: 'No. Tipping is not part of Korean culture — not at restaurants, taxis, hotels or salons. The price you see is the price you pay, and tax is already included. Leaving extra money can even cause confusion.',
    body: '<p>Service charges at high-end hotels are built into the bill. The best way to show appreciation is a sincere 감사합니다 (gamsahamnida — thank you).</p>',
    rel: [['Korean etiquette guide', 'etiquette.html'], ['Is Korea expensive?', 'blog/is-korea-expensive.html']] },
  { slug: 'can-you-drink-tap-water-in-korea', emoji: '🚰', q: 'Can you drink tap water in Korea?',
    a: 'Yes — Korean tap water (called Arisu in Seoul) meets WHO drinking standards and is safe. That said, most locals drink filtered or bottled water by habit. Bottled water costs about ₩1,000 at any convenience store.',
    body: '<p>Restaurants serve free filtered water (often barley tea) as standard, and free purifiers are common in hotels, malls and subway stations for refilling a bottle.</p>',
    rel: [['Emergency & health info', 'emergency.html']] },
  { slug: 'what-power-plug-does-korea-use', emoji: '🔌', q: 'What power plug does Korea use?',
    a: 'Korea uses 220V at 60Hz with European-style round two-pin plugs (Type C and Type F). Travelers from the US, UK, Japan and most of Asia need a plug adapter; most modern electronics handle 220V without a voltage converter.',
    body: '<p>Check your charger for "100–240V" — if printed, you only need a cheap plug adapter, sold at any convenience store or Daiso for ₩2,000–5,000.</p>',
    rel: [['Korea packing tips', 'blog/korea-travel-tips-first-time.html']] },
  { slug: 'is-uber-available-in-korea', emoji: '🚕', q: 'Is Uber available in Korea?',
    a: 'Uber operates in Korea as "UT", a joint venture with local taxis — but everyone uses Kakao T instead. Kakao T has an English interface, more drivers, metered fares and card payment, making it the best ride-hailing option for visitors.',
    body: '<p>Fares are regulated and reasonable: base fare around ₩4,800 in Seoul. International taxis with English-speaking drivers can also be booked at the airport.</p>',
    rel: [['Kakao T Taxi guide', 'places/kakao-t-taxi.html'], ['Korea transport guide', 'guide/korea-transport-guide.html']] },
  { slug: 'can-you-use-google-maps-in-korea', emoji: '🗺️', q: 'Does Google Maps work in Korea?',
    a: 'Only partially. Due to mapping-data regulations, Google Maps cannot give driving or walking directions in Korea — only transit. Use Naver Map or KakaoMap instead: both have full English interfaces and far better local data.',
    body: '<p>Download Naver Map or KakaoMap before arrival and save your hotel. Both show real-time bus arrivals, subway exit numbers and indoor maps of major stations.</p>',
    rel: [['Essential apps for Korea', 'faq/what-apps-do-i-need-for-korea.html'], ['Seoul Metro guide', 'places/seoul-metro.html']] },
  { slug: 'what-currency-does-korea-use', emoji: '💱', q: 'What currency does Korea use?',
    a: 'South Korea uses the Korean won (KRW, ₩). Rough mental math: ₩1,000 ≈ $0.70–0.80 USD. Credit cards are accepted almost everywhere; carry ₩50,000–100,000 in cash for markets and street food.',
    body: '<p>Use our live currency converter to check today\'s rate, and withdraw won from "Global ATM" machines found in convenience stores and banks.</p>',
    rel: [['Live currency converter', 'currency.html'], ['Is Korea expensive?', 'blog/is-korea-expensive.html']] },
  { slug: 'do-i-need-cash-in-korea', emoji: '💳', q: 'Do I need cash in Korea?',
    a: 'Mostly no — Korea is one of the most card-friendly countries on Earth, and even street stalls increasingly take cards. Keep ₩50,000–100,000 in cash for traditional markets, small eateries and topping up your T-money card.',
    body: '<p>Foreign cards work in most shops, but some local web checkouts require Korean cards — that\'s when convenience-store cash payment or a prepaid travel card (WOWPASS, T-money) helps.</p>',
    rel: [['T-money Card guide', 'places/t-money-card.html'], ['Currency guide', 'currency.html']] },
  { slug: 'what-apps-do-i-need-for-korea', emoji: '📱', q: 'What apps do I need for Korea?',
    a: 'Four essentials: Naver Map or KakaoMap (navigation — Google Maps barely works), Papago (the best Korean translator), Kakao T (taxis), and Korail Talk (KTX train tickets). All have English interfaces and are free.',
    body: '<p>Nice extras: KakaoMap reviews for restaurants, a delivery app if you have a local number, and our own AI Guide for instant Korea answers.</p>',
    rel: [['21 first-timer tips', 'blog/korea-travel-tips-first-time.html'], ['Kakao T guide', 'places/kakao-t-taxi.html']] },
  { slug: 'is-street-food-safe-in-korea', emoji: '🍢', q: 'Is street food safe to eat in Korea?',
    a: 'Yes — Korean street food is among the safest in Asia. Stalls are licensed and inspected, turnover is fast so food is fresh, and millions eat it daily. Use normal judgment: busy stalls with high turnover are the best bet.',
    body: '<p>Must-tries: tteokbokki, hotteok, eomuk (fish cake) with free broth, and gimbap. Gwangjang Market and Myeongdong\'s evening stalls are the classic starting points.</p>',
    rel: [['Best Korean food', 'guide/best-korean-food.html'], ['Tteokbokki guide', 'places/tteokbokki.html']] },
  { slug: 'is-wifi-free-in-korea', emoji: '📶', q: 'Is WiFi free in Korea?',
    a: 'Largely yes — Korea has some of the world\'s fastest, most widespread free WiFi: subways, buses, cafes, airports and public squares. Still, get an eSIM or SIM for seamless maps and translation between hotspots.',
    body: '<p>Free networks are everywhere, but an unlimited-data eSIM costs only $20–35 for 10 days and removes all friction.</p>',
    rel: [['SIM vs eSIM vs pocket WiFi', 'blog/korea-sim-esim-pocket-wifi.html']] },
  { slug: 'when-is-cherry-blossom-season-in-korea', emoji: '🌸', q: 'When is cherry blossom season in Korea?',
    a: 'Late March to mid-April, moving south to north: Jinhae and Busan bloom in late March, Seoul in early April. Full bloom lasts only about a week per city, so track the yearly forecast before booking.',
    body: '<p>Top spots: Jinhae Gunhangje Festival (Korea\'s biggest), Seoul\'s Yeouido and Seokchon Lake, Gyeongju\'s Bomun Lake. Our seasons page tracks the live bloom forecast each spring.</p>',
    rel: [['Live blossom forecast', 'seasons.html'], ['Korea in April', 'guide/korea-in-april.html'], ['Cherry blossom itinerary', 'itinerary/cherry-blossom-korea-7-day-itinerary.html']] },
  { slug: 'when-is-fall-foliage-in-korea', emoji: '🍁', q: 'When is fall foliage season in Korea?',
    a: 'Mid-October to early November, moving north to south: Seoraksan peaks in mid-October, Seoul (Bukhansan, palaces) in late October, and southern temples like Naejangsan in early November.',
    body: '<p>Naejangsan, Seoraksan and Gyeongju\'s tomb parks are the iconic foliage destinations. Pair the season with the Andong Mask Dance Festival or Busan International Film Festival.</p>',
    rel: [['Live foliage forecast', 'seasons.html'], ['Korea in October', 'guide/korea-in-october.html'], ['Autumn itinerary', 'itinerary/autumn-korea-7-day-itinerary.html']] },
  { slug: 'what-is-closed-on-mondays-in-korea', emoji: '🏛️', q: 'What is closed on Mondays in Korea?',
    a: 'Most museums (including the National Museum of Korea) close on Mondays, and Changdeokgung Palace does too. Gyeongbokgung closes on Tuesdays instead. Markets, shopping streets and temples stay open daily.',
    body: '<p>Plan palaces around the split: Gyeongbokgung on Monday, Changdeokgung any day but Monday. If a public holiday falls on Monday, many museums close Tuesday instead.</p>',
    rel: [['Seoul guide', 'guide/things-to-do-in-seoul.html'], ['Seoul itinerary', 'itinerary/seoul-3-day-itinerary.html']] },
  { slug: 'how-many-days-in-seoul', emoji: '📅', q: 'How many days do you need in Seoul?',
    a: 'Three to four days covers Seoul\'s essentials: palaces and hanok villages, Myeongdong and Hongdae, a Han River evening and a day trip (DMZ or Nami Island). A week lets you add Busan by KTX.',
    body: '<p>With 3 days follow our classic route; with 5+, add Gangnam/COEX, more neighborhoods and a second day trip.</p>',
    rel: [['3-day Seoul itinerary', 'itinerary/seoul-3-day-itinerary.html'], ['5-day Seoul itinerary', 'itinerary/seoul-5-day-itinerary.html'], ['Things to do in Seoul', 'guide/things-to-do-in-seoul.html']] },
  { slug: 'can-you-wear-shorts-in-korea', emoji: '👕', q: 'Can you wear shorts in Korea? (Dress code)',
    a: 'Yes — shorts, skirts and casual wear are completely normal in Korean cities, especially in the humid summer. The only places needing modest dress are temples and royal ceremony events: cover shoulders and knees there.',
    body: '<p>Koreans dress stylishly but casually. For temple stays, loose modest clothing is provided or required. In winter, prioritize warm layers — fashion never beats -10°C wind chill.</p>',
    rel: [['Korean etiquette', 'etiquette.html'], ['What to wear by month', 'guide/korea-in-july.html']] },
  { slug: 'is-korea-safe-at-night', emoji: '🌃', q: 'Is Korea safe at night?',
    a: 'Yes — Korea is one of the safest countries in the world after dark. Streets stay busy and brightly lit past midnight, CCTV coverage is dense, and violent crime against visitors is extremely rare, including for solo women.',
    body: '<p>Night markets, 24-hour cafes and late subways (until ~midnight) are part of daily life. Standard big-city awareness in nightlife districts is all you need.</p>',
    rel: [['Full Korea safety guide', 'blog/is-korea-safe.html'], ['Night views of Korea', 'nightviews.html']] },
  { slug: 'how-much-is-a-trip-to-korea', emoji: '💰', q: 'How much does a trip to Korea cost?',
    a: 'Excluding flights, budget travelers spend about $55/day, mid-range travelers $120/day, and comfort travelers $250/day. A typical one-week mid-range trip runs $800–1,000 plus airfare.',
    body: '<p>Food is the bargain: excellent meals for ₩9,000–13,000. Transit is cheap with T-money. See the full cost breakdown with sample budgets on our blog.</p>',
    rel: [['Full cost breakdown', 'blog/is-korea-expensive.html'], ['Budget itinerary', 'itinerary/budget-korea-7-day-itinerary.html'], ['Daily budget calculator', 'currency.html']] },
];

function buildFaq(f) {
  const url = `${BASEP}faq/${f.slug}.html`;
  const title = `${f.q} (2026) | KoreaPlus`;
  const trail = [{ name: 'Home', url: BASEP }, { name: 'Quick Answers', url: `${BASEP}explore.html` }, { name: f.q, url }];
  let body = bcHtml(trail);
  body += `<p class="lead">${esc(f.a)}</p>`;
  body += f.body;
  body += `<h2>🔗 Related guides</h2><div class="seo-linklist">${f.rel.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div>`;
  body += ctaHtml('Planning a Korea trip?', 'Get a free AI-built day-by-day itinerary in 30 seconds.');
  const hero = `<header class="seo-hero"><span class="emoji">${f.emoji}</span><h1>${esc(f.q)}</h1><div class="meta"><span class="seo-badge">Quick answer</span><span class="seo-badge">2026</span></div></header>`;
  writePage(`faq/${f.slug}.html`, shell({ url, title, desc: f.a.slice(0, 155), keywords: '', schemas: [faqLD([[f.q, f.a]]), breadcrumbLD(trail)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 12) THEMED ITINERARIES
// ══════════════════════════════════════════════════════════════════
const THEMES = [
  { slug: 'first-time-korea-7-day-itinerary', emoji: '🇰🇷', days: 7, h1: '7-Day Korea Itinerary for First-Timers (Seoul + Busan)',
    desc: 'The classic first Korea trip: 4 days in Seoul, a KTX ride south, and Busan\'s beaches — palaces, street food, K-culture and coastal views in one week.',
    filter: i => i.cat === 'travel' || i.cat === 'food',
    tips: ['Base yourself in Myeongdong or Hongdae for Seoul, Haeundae for Busan.', 'Buy a T-money card on day one — it works in both cities.', 'Book the Seoul→Busan KTX a few days ahead for weekend travel.', 'Rent hanbok at Gyeongbokgung — entry becomes free and photos are unbeatable.'] },
  { slug: 'kpop-korea-4-day-itinerary', emoji: '🎤', days: 4, h1: '4-Day K-Pop Itinerary in Seoul',
    desc: 'A fan-built Seoul route: Big 4 agency landmarks, K-pop merch streets in Hongdae, K-Star Road, music shows and themed cafes.',
    filter: i => i.cat === 'kpop' || (i.cat === 'shopping' && /Seoul/.test(i.region || '')) || (i.cat === 'travel' && /Seoul|Hongdae/.test(i.region || '')),
    tips: ['Apply for music-show audience tickets (M Countdown, Music Bank) 1–2 weeks ahead.', 'Agency stores sell exclusive merch — bring photocard sleeves.', 'Hongdae\'s K-pop street mixes official stores with fan-run photocard shops.', 'Check idol birthday cafes on social media — they pop up across Hongdae and Gangnam.'] },
  { slug: 'korea-food-tour-5-day-itinerary', emoji: '🍜', days: 5, h1: '5-Day Korea Food Itinerary (Eat Like a Local)',
    desc: 'Five days of eating across Seoul and Jeonju: market crawls, Korean BBQ nights, street snacks and the birthplace of bibimbap.',
    filter: i => i.cat === 'food' || (i.cat === 'shopping' && /Market/i.test(i.name)),
    tips: ['Come hungry to Gwangjang Market — share portions so you can try more stalls.', 'Lunch sets (백반) at office-worker restaurants are the best value in Korea.', 'Day-trip to Jeonju by KTX for the definitive bibimbap and choco pie.', 'Convenience stores are legit: build one breakfast entirely from GS25.'] },
  { slug: 'cherry-blossom-korea-7-day-itinerary', emoji: '🌸', days: 7, h1: '7-Day Cherry Blossom Korea Itinerary (April)',
    desc: 'Chase full bloom south to north: Jinhae\'s festival, Gyeongju\'s tomb-lined lanes and Seoul\'s Yeouido — timed for late March to mid-April.',
    filter: i => i.cat === 'travel' || i.cat === 'food', month: 'april',
    tips: ['Bloom moves south→north: start Busan/Jinhae, end in Seoul.', 'Book accommodation 2–3 months early — this is peak season.', 'Gyeongju\'s Bomun Lake at dawn beats the daytime crowds.', 'Track the live forecast on our Seasons page before locking dates.'] },
  { slug: 'autumn-korea-7-day-itinerary', emoji: '🍁', days: 7, h1: '7-Day Autumn Foliage Korea Itinerary (October)',
    desc: 'Peak-foliage route: Seoraksan\'s granite peaks, Seoul\'s palace gardens and Gyeongju\'s golden tomb mounds in Korea\'s most photogenic month.',
    filter: i => i.cat === 'travel' || i.cat === 'food', month: 'october',
    tips: ['Foliage moves north→south: Seoraksan mid-Oct, Seoul late Oct.', 'Weekday hikes avoid the legendary Korean weekend hiking crowds.', 'Changdeokgung\'s Secret Garden tour is autumn\'s hottest ticket — book online early.', 'Pair with Busan Film Festival or Andong Mask Dance if dates align.'] },
  { slug: 'winter-korea-5-day-itinerary', emoji: '❄️', days: 5, h1: '5-Day Winter Korea Itinerary (Snow, Ski & Spas)',
    desc: 'Snow-dusted palaces, ski day trips, street food that tastes better in the cold, and steamy jjimjilbang nights — winter Korea at its coziest.',
    filter: i => i.cat === 'travel' || i.cat === 'food', month: 'december',
    tips: ['Hotteok and eomuk broth exist for exactly this weather.', 'Ski resorts (Yongpyong, Vivaldi Park) run day-trip shuttles from Seoul.', 'A jjimjilbang evening is the perfect frozen-feet recovery (₩13,000).', 'Palaces in snow + hanbok = the rarest photos of your trip.'] },
  { slug: 'family-korea-7-day-itinerary', emoji: '👨‍👩‍👧', days: 7, h1: '7-Day Korea Family Itinerary (with Kids)',
    desc: 'A kid-tested week: Lotte World, easy palaces, Han River bike picnics and food even picky eaters love.',
    filter: i => (i.cat === 'travel' || i.cat === 'food' || /Lotte World/.test(i.name)) && !/nightlife/i.test((i.tags || []).join(' ')),
    tips: ['Lotte World + Aquarium + Seoul Sky make one full indoor day (rain-proof).', 'Subways have elevators at every station — strollers are easy.', 'Kid-safe foods: gimbap, bulgogi, fried chicken, hotteok.', 'Han River parks rent family bikes; convenience-store picnics are a highlight.'] },
  { slug: 'budget-korea-7-day-itinerary', emoji: '💸', days: 7, h1: '7-Day Budget Korea Itinerary (Under $600)',
    desc: 'Korea on ~$55/day: guesthouses, market meals, free palaces in hanbok, Han River sunsets and night markets — proof cheap can be unforgettable.',
    filter: i => i.cat === 'travel' || i.cat === 'food',
    tips: ['Hongdae guesthouse dorms run ₩20,000–30,000 with the best social scene.', 'Eat lunch as your main meal — set menus are ₩8,000–10,000.', 'Free highlights: palaces (in hanbok), Bukchon, Han River, temples, markets.', 'Express buses cost half the KTX fare if time is flexible.'] },
  { slug: 'luxury-korea-5-day-itinerary', emoji: '💎', days: 5, h1: '5-Day Luxury Korea Itinerary',
    desc: 'Five-star Seoul: Cheongdam shopping, fine dining, premium spas, private palace tours and skyline suites.',
    filter: i => i.cat === 'kbeauty' || i.cat === 'shopping' || i.cat === 'travel',
    tips: ['Stay in Gangnam or a luxury hanok stay in Bukchon.', 'Book a private hanbok photographer for palace mornings.', 'The Sulwhasoo flagship spa in Gangnam is the K-beauty splurge.', 'Reserve Michelin tables (Mingles, Onjium) several weeks ahead.'] },
  { slug: 'honeymoon-korea-7-day-itinerary', emoji: '💑', days: 7, h1: '7-Day Korea Honeymoon Itinerary',
    desc: 'Romance route: Seoul nights and palace strolls, then Jeju\'s waterfalls, sunrise crater and sunset beaches — city sparkle plus island calm.',
    filter: i => i.cat === 'travel' || i.cat === 'food',
    tips: ['Split 3 nights Seoul + 3 nights Jeju (one-hour flight).', 'N Seoul Tower locks + a Han River cruise for the classic city evening.', 'On Jeju, stay one night each in Seogwipo (waterfalls) and Seongsan (sunrise).', 'Book a couples\' hanbok shoot — the photos outlast every souvenir.'] },
];

function buildTheme(t) {
  const url = `${BASEP}itinerary/${t.slug}.html`;
  const title = `${t.h1} (2026) | KoreaPlus`;
  const trail = [{ name: 'Home', url: BASEP }, { name: 'Itineraries', url: `${BASEP}explore.html` }, { name: t.h1, url }];
  const pool = ALL.filter(t.filter);
  const sights = pool.filter(i => i.cat !== 'food');
  const foodsPool = pool.filter(i => i.cat === 'food');
  const foods = foodsPool.length ? foodsPool : ALL.filter(i => i.cat === 'food');
  let body = bcHtml(trail);
  body += `<p class="lead">${esc(t.desc)}</p>`;
  if (t.month) body += `<p>📅 Best timed with our <a href="guide/korea-in-${t.month}.html">Korea in ${t.month[0].toUpperCase() + t.month.slice(1)}</a> seasonal guide.</p>`;
  let si = 0, fi = 0;
  for (let d = 1; d <= t.days; d++) {
    const m = sights[si++ % sights.length], a = sights[si++ % sights.length];
    const l = foods[fi++ % foods.length], dn = foods[fi++ % foods.length];
    body += `<div class="seo-day"><div class="dh">Day ${d}</div>`;
    if (m) body += slotHtml('☀️', 'Morning', m);
    if (l) body += slotHtml('🍱', 'Lunch', l);
    if (a && (!m || a.slug !== m.slug)) body += slotHtml('🌤️', 'Afternoon', a);
    if (dn) body += slotHtml('🌙', 'Dinner', dn);
    body += `</div>`;
  }
  body += tripBanner('Seoul', 'kp_theme');
  body += `<h2>💡 Tips for this route</h2><ul class="tips">${t.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const qa = [
    [`Is this ${t.days}-day plan realistic?`, `Yes — it averages 2–3 main stops plus meals per day, the pace most travelers find comfortable. Rebuild it with your own dates in our free AI planner.`],
    ['Can I customize this itinerary?', 'Absolutely — open the AI Trip Planner, pick your dates, interests and pace, and it rebuilds the route in seconds.'],
  ];
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml('🎫 Book this trip', { city: 'Seoul', cat: 'travel', q: '' });
  body += ctaHtml('Make it yours', 'Our AI rebuilds this plan around your dates, pace and budget — free.');
  const hero = `<header class="seo-hero"><span class="emoji">${t.emoji}</span><h1>${esc(t.h1)}</h1><div class="meta"><span class="seo-badge">${t.days} days</span><span class="seo-badge region">Themed route</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: t.h1, description: t.desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  writePage(`itinerary/${t.slug}.html`, shell({ url, title, desc: t.desc, keywords: '', schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 13) COMPARISON PAGES
// ══════════════════════════════════════════════════════════════════
const tbl = rows => `<table class="seo-tbl"><tbody>${rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const COMPARES = [
  { slug: 'seoul-vs-busan', emoji: '⚖️', h1: 'Seoul vs Busan: Which Should You Visit?',
    desc: 'Seoul or Busan? Compare vibe, food, sights, beaches and day trips — and see when the right answer is "both" via a 2.5-hour KTX ride.',
    intro: 'Short answer: <strong>first trip with one city → Seoul</strong>; love coastlines, seafood and a slower pace → Busan. With 6+ days, do both — KTX links them in under 3 hours.',
    rows: [['', 'Seoul', 'Busan'], ['Vibe', 'Mega-city energy, palaces + K-culture', 'Coastal, relaxed, mountains-meet-sea'], ['Signature sights', 'Gyeongbokgung, Bukchon, N Seoul Tower', 'Haeundae, Gamcheon Village, sea temples'], ['Food', 'Everything — markets to Michelin', "Korea's best seafood + milmyeon"], ['Beaches', 'None (Han River instead)', 'Haeundae, Gwangalli, Songjeong'], ['Day trips', 'DMZ, Nami Island, Suwon', 'Gyeongju (30 min by KTX), Geoje'], ['Best for', 'First-timers, K-pop fans, shoppers', 'Beach lovers, foodies, slower pace']],
    qa: [["Is Busan worth visiting if I've seen Seoul?", 'Yes — Busan feels like a different country: beaches, hillside art villages, sea-cliff temples and a famously laid-back food scene, only 2.5 hours away by KTX.'], ['How many days for Seoul and Busan together?', 'Seven days works perfectly: 4 in Seoul, 1 travel day with a Gyeongju stop, 2 in Busan.']],
    rel: [['Things to do in Seoul', 'guide/things-to-do-in-seoul.html'], ['Things to do in Busan', 'guide/things-to-do-in-busan.html'], ['7-day first-timer route', 'itinerary/first-time-korea-7-day-itinerary.html']] },
  { slug: 'korea-vs-japan-trip', emoji: '🆚', h1: 'Korea vs Japan: Which Trip Should You Take First?',
    desc: 'Korea or Japan for your first East Asia trip? Honest comparison of cost, food, transport, culture and crowds — from people who love both.',
    intro: 'Both are spectacular. <strong>Korea wins on cost (10–25% cheaper), nightlife, K-culture and lighter crowds; Japan wins on sheer sight density and rail coverage.</strong> Korea is also easier to "finish" in one trip.',
    rows: [['', 'Korea', 'Japan'], ['Daily cost (mid-range)', '~$120', '~$140–160'], ['Food scene', 'BBQ, street food, free side dishes', 'Sushi, ramen, izakaya'], ['Transit', "KTX + world's best subway, cheaper", 'Shinkansen network, pricier'], ['Pop culture', 'K-pop, K-drama, K-beauty', 'Anime, gaming, retro'], ['Crowds', 'Noticeably lighter at top sights', 'Heavy at headline spots'], ['English ease', 'Similar — apps cover both', 'Similar']],
    qa: [['Is Korea cheaper than Japan?', 'Generally yes — expect 10–25% less on hotels and food for a comparable trip, with city transit notably cheaper.'], ['Can I combine Korea and Japan in one trip?', 'Easily — Seoul–Tokyo/Osaka flights take about 2 hours; one week per country is the comfortable minimum.']],
    rel: [['Is Korea expensive?', 'blog/is-korea-expensive.html'], ['Best time to visit Korea', 'faq/best-time-to-visit-korea.html'], ['First-timer itinerary', 'itinerary/first-time-korea-7-day-itinerary.html']] },
  { slug: 'ktx-vs-bus-vs-flight-korea', emoji: '🚄', h1: 'KTX vs Express Bus vs Flight: Getting Around Korea',
    desc: 'Seoul to Busan by KTX, express bus or plane? Time, cost and comfort compared so you pick right the first time.',
    intro: 'Rule of thumb: <strong>KTX for speed (2h20m center-to-center), express bus for budget (half price), flights only for Jeju.</strong>',
    rows: [['Seoul→Busan', 'KTX', 'Express Bus', 'Flight'], ['Time (door to door)', '~3h', '~5h', '~4h (with airports)'], ['Cost', '₩59,800', '₩26,000–38,000', '₩40,000–90,000 (to Gimhae)'], ['Comfort', 'Excellent, walk-around', 'Premium seats recline deep', 'Standard short-haul'], ['Book via', 'Korail Talk app', 'Kobus app / terminal', 'Airline apps'], ['Best for', 'Most travelers', 'Budget + no-KTX towns', 'Jeju Island only']],
    qa: [['Do I need to book KTX in advance?', 'Weekdays you can usually buy same-day; for Friday–Sunday and holidays, book a few days ahead on the Korail Talk app.'], ['How do I get to Jeju without flying?', 'Overnight ferries run from Mokpo, Wando and Busan — cheaper and scenic, but Gimpo–Jeju flights are so frequent and cheap that most travelers fly.']],
    rel: [['KTX guide', 'places/ktx-bullet-train.html'], ['Express bus guide', 'places/express-bus.html'], ['Korea transport guide', 'guide/korea-transport-guide.html']] },
  { slug: 'jeju-vs-busan', emoji: '🏝️', h1: 'Jeju vs Busan: Which Coastal Escape?',
    desc: 'Jeju Island or Busan for beaches and nature? Compare scenery, access, food and effort — and when each one wins.',
    intro: '<strong>Busan = easy city-beach combo by KTX; Jeju = volcanic island nature worth the flight.</strong> Tight schedule → Busan. Nature-first and 3+ days → Jeju.',
    rows: [['', 'Jeju', 'Busan'], ['Getting there', "1h flight (world's busiest route)", '2h20m KTX'], ['Scenery', 'Volcano, lava caves, waterfalls, UNESCO', 'Urban beaches, cliffs, harbor nights'], ['Getting around', 'Rental car strongly recommended', 'Subway + buses are enough'], ['Food', 'Black pork, seafood, tangerines', 'Sashimi capital, pork soup, milmyeon'], ['Trip length', '3+ days ideal', '2–3 days perfect'], ['Best for', 'Nature, couples, road trips', 'City+beach, foodies, no-car travel']],
    qa: [['Is Jeju worth it for 2 days?', "It's tight — flights plus driving distances eat time. Two days favors Busan; give Jeju three or more to breathe."], ['Do I need a car in Jeju?', 'Practically yes — sights are scattered and buses are slow. An international license plus airport rental is the standard play.']],
    rel: [['Jeju Island guide', 'places/jeju-island.html'], ['Things to do in Busan', 'guide/things-to-do-in-busan.html'], ['3-day Jeju itinerary', 'itinerary/jeju-3-day-itinerary.html']] },
];

function buildCompare(c) {
  const url = `${BASEP}guide/${c.slug}.html`;
  const title = `${c.h1} (2026) | KoreaPlus`;
  const trail = [{ name: 'Home', url: BASEP }, { name: 'Comparisons', url: `${BASEP}explore.html` }, { name: c.h1, url }];
  let body = bcHtml(trail);
  body += `<p class="lead">${c.intro}</p>`;
  body += `<h2>📊 Side by side</h2>` + tbl(c.rows);
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${c.qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += `<h2>🔗 Keep planning</h2><div class="seo-linklist">${c.rel.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div>`;
  body += affHtml('🎫 Book either trip', { city: 'Seoul', cat: 'travel', q: '' });
  body += ctaHtml('Still deciding?', 'Tell the AI planner your dates and interests — it routes the best option for you.');
  const hero = `<header class="seo-hero"><span class="emoji">${c.emoji}</span><h1>${esc(c.h1)}</h1><div class="meta"><span class="seo-badge">Comparison</span><span class="seo-badge">2026</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: c.h1, description: c.desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  writePage(`guide/${c.slug}.html`, shell({ url, title, desc: c.desc, keywords: '', schemas: [article, breadcrumbLD(trail), faqLD(c.qa)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// 14) CITY FOOD PAGES + 15) SEASONAL HUBS
// ══════════════════════════════════════════════════════════════════
function buildCityFood(city) {
  const n = city.name;
  const local = ALL.filter(i => i.cat === 'food' && ((i.region || '').includes(n) || (i.mapQ || '').includes(n)));
  const national = ALL.filter(i => i.cat === 'food' && !local.includes(i));
  const pool = [...local, ...national].slice(0, 8);
  const url = `${BASEP}guide/best-food-in-${slug(n)}.html`;
  const h1 = `Best Food in ${n}: What to Eat & Where`;
  const title = `${h1} (2026) | KoreaPlus`;
  const desc = `What to eat in ${n} (${city.kr}): ${pool.slice(0, 4).map(i => i.name).join(', ')} and more — with prices, insider tips and where locals actually eat.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: n, url: `${BASEP}guide/things-to-do-in-${slug(n)}.html` }, { name: 'Best Food', url }];
  let body = bcHtml(trail);
  body += `<p class="lead">${esc(n)} is one of Korea's great eating cities. Here's what to order — tap any dish for the full guide with prices and the best spots.</p>`;
  body += `<div class="seo-grid">${pool.map(cardHtml).join('')}</div>`;
  body += `<h2>💡 Eating tips for ${esc(n)}</h2><ul class="tips"><li>Side dishes (banchan) are free and refillable — ask with "더 주세요".</li><li>Lunch set menus give the best value; save dinner for BBQ and stews.</li><li>Markets peak in the evening from 5pm; bring some cash.</li></ul>`;
  const qa = [[`What food is ${n} famous for?`, `${n} is best known for ${pool.slice(0, 3).map(i => i.name).join(', ')} — see the full list above with prices and where to try each.`]];
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml(`🍜 Food tours in ${n}`, { city: n, cat: 'food', q: '' });
  body += ctaHtml(`Eating your way through ${n}?`, 'The AI planner weaves these dishes into a day-by-day route.');
  const hero = `<header class="seo-hero"><span class="emoji">🍜</span><h1>${esc(h1)}</h1><div class="kr">${esc(city.kr)}</div><div class="meta"><span class="seo-badge region">${pool.length} picks</span></div></header>`;
  const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: h1, itemListElement: pool.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: ORIGIN + `${BASEP}places/${it.slug}.html` })) };
  writePage(`guide/best-food-in-${slug(n)}.html`, shell({ url, title, desc, keywords: '', schemas: [itemList, breadcrumbLD(trail), faqLD(qa)], hero, body }));
  return url;
}

const SEASONS4 = [
  { slug: 'spring', name: 'Spring', emoji: '🌸', mi: [2, 3, 4], itin: 'cherry-blossom-korea-7-day-itinerary', hl: 'cherry blossoms, lantern festivals and the year\'s freshest weather' },
  { slug: 'summer', name: 'Summer', emoji: '🏖️', mi: [5, 6, 7], itin: 'first-time-korea-7-day-itinerary', hl: 'beaches, mud festivals and electric Han River nights' },
  { slug: 'autumn', name: 'Autumn', emoji: '🍁', mi: [8, 9, 10], itin: 'autumn-korea-7-day-itinerary', hl: 'fiery foliage, harvest festivals and perfect hiking weather' },
  { slug: 'winter', name: 'Winter', emoji: '❄️', mi: [11, 0, 1], itin: 'winter-korea-5-day-itinerary', hl: 'snowy palaces, ski resorts and steaming street food' },
];
function buildSeason(s) {
  const url = `${BASEP}guide/korea-in-${s.slug}.html`;
  const h1 = `Korea in ${s.name}: Things to Do, Weather & Tips`;
  const title = `${h1} (2026) | KoreaPlus`;
  const desc = `${s.name} in Korea means ${s.hl}. Month-by-month weather, what to pack and the best things to do.`;
  const trail = [{ name: 'Home', url: BASEP }, { name: 'When to Visit', url: `${BASEP}explore.html` }, { name: `Korea in ${s.name}`, url }];
  let body = bcHtml(trail);
  body += `<p class="lead">${s.name} in Korea brings ${esc(s.hl)}. Here's the season at a glance, with deep-dives for each month.</p>`;
  body += `<h2>📅 Month by month</h2>`;
  for (const i of s.mi) {
    const [name, icon, weather, , events] = MONTHS[i];
    body += `<h3>${icon} <a href="guide/korea-in-${name.toLowerCase()}.html">Korea in ${name}</a></h3><p><strong>${esc(weather)}.</strong> ${esc(events)}.</p>`;
  }
  body += `<h2>🎒 ${esc(s.name)} itinerary</h2><p>Ready-made route for the season: <a href="itinerary/${s.itin}.html">see the full day-by-day plan →</a></p>`;
  const qa = [[`Is ${s.name.toLowerCase()} a good time to visit Korea?`, `Yes — ${s.hl}. See the month pages above for exact weather and events.`]];
  body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  body += affHtml('🎫 Book the season', { city: 'Seoul', cat: 'travel', q: '' });
  body += ctaHtml(`Planning a ${s.name.toLowerCase()} trip?`, 'Get a free AI itinerary tuned to the season.');
  const hero = `<header class="seo-hero"><span class="emoji">${s.emoji}</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">3-month guide</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  writePage(`guide/korea-in-${s.slug}.html`, shell({ url, title, desc, keywords: '', schemas: [article, breadcrumbLD(trail), faqLD(qa)], hero, body }));
  return url;
}

// ══════════════════════════════════════════════════════════════════
// RUN
// ══════════════════════════════════════════════════════════════════
const out = { places: [], categories: [], cities: [], itineraries: [], months: [], neighborhoods: [], stays: [], visa: '', faq: [], compare: [], cityfood: [], seasonal: [], l10n: [], blog: [], blogIndex: '' };
for (const it of ALL) out.places.push(buildPlace(it));
for (const cat of Object.keys(KOREA_DATA)) out.categories.push(buildCategory(cat));
const cityPools = {};
for (const c of CITIES) { const r = buildCity(c); out.cities.push(r.url); cityPools[c.name] = r.pool; }
// itineraries: top cities with enough data
const ITIN = [['Seoul', 3], ['Seoul', 5], ['Busan', 3], ['Jeju', 3], ['Gyeongju', 2], ['Jeonju', 2]];
for (const [cn, days] of ITIN) {
  const city = CITIES.find(c => c.name === cn);
  const pool = cityPools[cn] && cityPools[cn].length >= 3 ? cityPools[cn] : ALL.filter(i => i.cat === 'travel' || i.cat === 'food');
  out.itineraries.push(buildItinerary(city, days, pool));
}
MONTHS.forEach((m, i) => out.months.push(buildMonth(m, i)));
out.visa = buildVisa();
NEIGHBORHOODS.forEach(n => out.neighborhoods.push(buildNeighborhood(n)));
STAY.forEach(s => out.stays.push(buildStay(s)));
// Localized (ja/zh) months + visa
out.l10n = [];
for (const lang of LOCALES) {
  MONTHS.forEach((_, i) => out.l10n.push(buildMonthL10n(i, lang)));
  out.l10n.push(buildVisaL10n(lang));
}
// Blog
out.blog = BLOG.map(buildBlogPost);
out.blogIndex = buildBlogIndex();
// Q&A, themed itineraries, comparisons, city food, seasonal hubs
FAQS.forEach(f => out.faq.push(buildFaq(f)));
THEMES.forEach(t => out.itineraries.push(buildTheme(t)));
COMPARES.forEach(c => out.compare.push(buildCompare(c)));
CITIES.forEach(c => out.cityfood.push(buildCityFood(c)));
SEASONS4.forEach(s => out.seasonal.push(buildSeason(s)));
const exploreUrl = buildExplore(out);

// ── IndexNow key file (Bing/Naver/Yandex instant indexing) ──────────
const INDEXNOW_KEY = 'kp7e3f1c9a2b5d48069e3f1c9a2b5d48';
fs.writeFileSync(path.join(OUT, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);

// ── Sitemap ─────────────────────────────────────────────────────────
const STATIC = ['', 'plan.html', 'explore.html', 'festivals.html', 'culture.html', 'temples.html', 'nightviews.html',
  'emergency.html', 'phrases.html', 'currency.html', 'etiquette.html', 'seasons.html', 'kdrama-locations.html',
  'menu-translator.html', 'subway.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html'];
const LANGS = ['ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];
const urlEntry = (loc, pri, freq) => `  <url>\n    <loc>${ORIGIN}${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
let sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sm += urlEntry(BASEP, '1.0', 'daily');
LANGS.forEach(l => sm += `\n` + urlEntry(`${BASEP}?lang=${l}`, '0.8', 'weekly'));
STATIC.slice(1).forEach(p => sm += `\n` + urlEntry(BASEP + p, '0.8', 'weekly'));
[...out.categories, ...out.cities, out.visa, ...out.stays, out.blogIndex].forEach(u => sm += `\n` + urlEntry(u, '0.8', 'weekly'));
out.blog.forEach(u => sm += `\n` + urlEntry(u, '0.8', 'weekly'));
out.neighborhoods.forEach(u => sm += `\n` + urlEntry(u, '0.7', 'monthly'));
out.itineraries.forEach(u => sm += `\n` + urlEntry(u, '0.7', 'monthly'));
out.months.forEach(u => sm += `\n` + urlEntry(u, '0.7', 'monthly'));
out.l10n.forEach(u => sm += `\n` + urlEntry(u, '0.7', 'monthly'));
[...out.compare, ...out.seasonal].forEach(u => sm += `\n` + urlEntry(u, '0.8', 'weekly'));
[...out.faq, ...out.cityfood].forEach(u => sm += `\n` + urlEntry(u, '0.7', 'monthly'));
out.places.forEach(u => sm += `\n` + urlEntry(u, '0.6', 'monthly'));
sm += `\n</urlset>\n`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sm);

// ── llms.txt — guidance for AI search engines (ChatGPT, Perplexity, etc.) ──
let llms = `# KoreaPlus — Korea Travel Guide

> Free, expert Korea travel guide with 240+ pages: attractions, food, city guides,
> day-by-day itineraries, monthly weather guides, visa/K-ETA help and an AI trip
> planner. Content is written for international visitors and updated for 2026.

## Start Here
- [Korea Travel Guide (home)](${ORIGIN}${BASEP})
- [Explore all guides](${ORIGIN}${BASEP}explore.html)
- [Free AI Itinerary Planner](${ORIGIN}${BASEP}plan.html)
- [Visa & K-ETA Guide](${ORIGIN}${BASEP}guide/korea-visa-k-eta-guide.html)

## Itineraries
${[...out.itineraries].map(u => `- [${u.split('/').pop().replace('.html','').replace(/-/g,' ')}](${ORIGIN}${u})`).join('\n')}

## City Guides
${out.cities.map(u => `- [${u.split('/').pop().replace('.html','').replace(/-/g,' ')}](${ORIGIN}${u})`).join('\n')}

## Quick Answers
${out.faq.map(u => `- [${u.split('/').pop().replace('.html','').replace(/-/g,' ')}](${ORIGIN}${u})`).join('\n')}

## Blog
${out.blog.map(u => `- [${u.split('/').pop().replace('.html','').replace(/-/g,' ')}](${ORIGIN}${u})`).join('\n')}

## Languages
- English (primary), 日本語 (/ja/), 中文 (/zh/), Español (/es/) for seasonal & visa guides.
`;
fs.writeFileSync(path.join(OUT, 'llms.txt'), llms);

// ── RSS feed for the blog ───────────────────────────────────────────
const rssItems = BLOG.map(p => `  <item>
    <title>${esc(p.h1)}</title>
    <link>${ORIGIN}${BASEP}blog/${p.slug}.html</link>
    <guid>${ORIGIN}${BASEP}blog/${p.slug}.html</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${esc(p.desc)}</description>
  </item>`).join('\n');
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>KoreaPlus Travel Blog</title>
  <link>${ORIGIN}${BASEP}blog/index.html</link>
  <description>Practical Korea travel tips, costs and guides for international visitors.</description>
  <language>en</language>
${rssItems}
</channel></rss>`;
fs.writeFileSync(path.join(OUT, 'blog/feed.xml'), rss);

const total = out.places.length + out.categories.length + out.cities.length + out.itineraries.length + out.months.length + out.neighborhoods.length + out.stays.length + out.l10n.length + out.blog.length + 3;
console.log(`✅ Generated ${total} SEO pages:`);
console.log(`   places:        ${out.places.length}`);
console.log(`   categories:    ${out.categories.length}`);
console.log(`   city guides:   ${out.cities.length}`);
console.log(`   itineraries:   ${out.itineraries.length}`);
console.log(`   months (EN):   ${out.months.length}`);
console.log(`   l10n (ja+zh):  ${out.l10n.length}`);
console.log(`   blog:          ${out.blog.length} + index`);
console.log(`   neighborhoods: ${out.neighborhoods.length}`);
console.log(`   where-to-stay: ${out.stays.length}`);
console.log(`   faq answers:   ${out.faq.length}`);
console.log(`   comparisons:   ${out.compare.length}`);
console.log(`   city food:     ${out.cityfood.length}`);
console.log(`   seasonal hubs: ${out.seasonal.length}`);
console.log(`   visa + explore: 2`);
console.log(`   sitemap.xml:   ${(sm.match(/<url>/g) || []).length} URLs`);
console.log(`   indexnow key:  ${INDEXNOW_KEY}.txt`);
