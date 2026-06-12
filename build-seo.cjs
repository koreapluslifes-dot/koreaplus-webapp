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
const AFFILIATES = {
  klook:        { label: 'Tours & Tickets', brand: 'Klook',        icon: '🎟️', url: 'https://www.klook.com/?aid=YOUR_KLOOK_AID' },
  agoda:        { label: 'Hotels',          brand: 'Agoda',        icon: '🏨', url: 'https://www.agoda.com/?cid=YOUR_AGODA_CID' },
  airalo:       { label: 'eSIM Data',       brand: 'Airalo',       icon: '📶', url: 'https://www.airalo.com/?ref=YOUR_AIRALO_REF' },
  getyourguide: { label: 'Day Trips',       brand: 'GetYourGuide', icon: '🚌', url: 'https://www.getyourguide.com/?partner_id=YOUR_GYG_ID' },
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
};

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
  body += `<h2>🗺️ Location & Maps</h2><p>Find <strong>${esc(it.name)}</strong> and get directions:</p>${mapsHtml(it.mapQ || it.name + ' Korea')}`;
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

  const hero = `<header class="seo-hero"><span class="emoji">${icon}</span><h1>${esc('Korea in ' + name)}</h1><div class="meta"><span class="seo-badge">${esc(weather.split(',')[0])}</span><a class="seo-badge" href="ja/korea-in-${sslug}.html">🇯🇵 日本語</a><a class="seo-badge" href="zh/korea-in-${sslug}.html">🇨🇳 中文</a></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  const alts = [
    { lang: 'ja', url: `${BASEP}ja/korea-in-${sslug}.html` },
    { lang: 'zh', url: `${BASEP}zh/korea-in-${sslug}.html` },
  ];
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
  const h1 = lang === 'ja' ? `${nameL}の韓国旅行` : `${nameL}韩国旅游攻略`;
  const title = `${nameL}${tw.titleSuffix} | KoreaPlus`;
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
  const hero = `<header class="seo-hero"><span class="emoji">${icon}</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">${esc(weather.split(/[、，]/)[0])}</span></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, inLanguage: lang, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  const other = lang === 'ja' ? 'zh' : 'ja';
  const alts = [{ lang: 'en', url: enUrl }, { lang: other, url: `${BASEP}${other}/korea-in-${sslug}.html` }];
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
  const other = lang === 'ja' ? 'zh' : 'ja';
  const alts = [{ lang: 'en', url: enUrl }, { lang: other, url: `${BASEP}${other}/korea-visa-k-eta-guide.html` }];
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
  body += section('🌏 日本語 / 中文', [
    `<a href="ja/korea-visa-k-eta-guide.html">🇯🇵 ビザ & K-ETA</a>`, `<a href="ja/korea-in-april.html">🇯🇵 4月の韓国</a>`, `<a href="ja/korea-in-october.html">🇯🇵 10月の韓国</a>`,
    `<a href="zh/korea-visa-k-eta-guide.html">🇨🇳 签证 & K-ETA</a>`, `<a href="zh/korea-in-april.html">🇨🇳 4月韩国攻略</a>`, `<a href="zh/korea-in-october.html">🇨🇳 10月韩国攻略</a>`,
  ]);
  body += section('🍜 By Topic', Object.keys(CAT_META).map(c => `<a href="guide/${CAT_SLUG[c]}.html">${CAT_META[c].icon} ${esc(CAT_META[c].label)}</a>`));
  body += section('📍 City Guides', CITIES.map(c => `<a href="guide/things-to-do-in-${slug(c.name)}.html">📍 ${esc(c.name)}</a>`));
  if (urls.neighborhoods && urls.neighborhoods.length) body += section('🏘️ Seoul Neighborhoods', NEIGHBORHOODS.map(n => `<a href="guide/${slug(n.name)}-${slug(n.city)}-guide.html">${n.emoji} ${esc(n.name)}</a>`));
  body += section('🗺️ Itineraries', urls.itineraries.map(u => `<a href="${u.replace(BASEP, '')}">🗺️ ${esc(u.split('/').pop().replace(/-/g, ' ').replace('.html', '').replace(/\b\w/g, m => m.toUpperCase()))}</a>`));
  body += section('📅 When to Visit', MONTHS.map(m => `<a href="guide/korea-in-${m[0].toLowerCase()}.html">${m[1]} ${esc(m[0])}</a>`));
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
  const hero = `<header class="seo-hero"><span class="emoji">🛂</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">Updated 2026</span><a class="seo-badge" href="ja/korea-visa-k-eta-guide.html">🇯🇵 日本語</a><a class="seo-badge" href="zh/korea-visa-k-eta-guide.html">🇨🇳 中文</a></div></header>`;
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus' }, publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: ORIGIN + '/guide/icons/kplus.svg' } }, image: ORIGIN + '/guide/og-image.jpg', mainEntityOfPage: ORIGIN + url };
  const alts = [
    { lang: 'ja', url: `${BASEP}ja/korea-visa-k-eta-guide.html` },
    { lang: 'zh', url: `${BASEP}zh/korea-visa-k-eta-guide.html` },
  ];
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
// RUN
// ══════════════════════════════════════════════════════════════════
const out = { places: [], categories: [], cities: [], itineraries: [], months: [], neighborhoods: [], stays: [], visa: '' };
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
for (const lang of ['ja', 'zh']) {
  MONTHS.forEach((_, i) => out.l10n.push(buildMonthL10n(i, lang)));
  out.l10n.push(buildVisaL10n(lang));
}
// Blog
out.blog = BLOG.map(buildBlogPost);
out.blogIndex = buildBlogIndex();
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
out.places.forEach(u => sm += `\n` + urlEntry(u, '0.6', 'monthly'));
sm += `\n</urlset>\n`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sm);

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
console.log(`   visa + explore: 2`);
console.log(`   sitemap.xml:   ${(sm.match(/<url>/g) || []).length} URLs`);
console.log(`   indexnow key:  ${INDEXNOW_KEY}.txt`);
