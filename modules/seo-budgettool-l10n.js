/* ══════════════════════════════════════════════════════════════════
   modules/seo-budgettool-l10n.js — translations for the T07 budget tools
   (Korea budget converter + trip cost calculator) in all 9 build languages.

   Pure data, no build-seo coupling. Consumed by modules/seo-budgettool.cjs.
   Every string here is UI chrome / objective instructional copy — no
   fabricated facts, no price claims (live FX + reused COST_INDEX tiers do
   the numbers at runtime). Keys are identical across languages so the
   generator can index L[lang] safely; a missing language = page skipped.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// Shared, language-neutral data (kept out of per-language blocks to avoid
// drift): the foreign currencies offered in the converter. Names are
// localized per language via `curN`. ISO codes + symbols are universal.
const CURRENCIES = [
  ['USD', '$'], ['EUR', '€'], ['JPY', '¥'], ['GBP', '£'], ['CNY', '¥'],
  ['AUD', 'A$'], ['CAD', 'C$'], ['SGD', 'S$'], ['HKD', 'HK$'], ['TWD', 'NT$'],
  ['THB', '฿'], ['PHP', '₱'], ['VND', '₫'], ['MYR', 'RM'], ['INR', '₹'],
];

// Fallback approximate KRW→foreign multipliers used only if the live
// /api/exchange call fails (mirrors the values already shipped in
// currency.html so behaviour is consistent). 1 KRW = rate units of the
// foreign currency. Objective market-order-of-magnitude figures, clearly
// labelled "approximate / offline" in the UI.
const FALLBACK_RATES = {
  USD: 0.000738, EUR: 0.000682, JPY: 0.112, GBP: 0.000583, CNY: 0.00535,
  AUD: 0.00115, CAD: 0.00101, SGD: 0.000998, HKD: 0.00577, TWD: 0.0237,
  THB: 0.0268, PHP: 0.0428, VND: 18.7, MYR: 0.00347, INR: 0.0617,
};

const L10N = {
  en: {
    // ─ converter page
    cv: {
      title: 'Korea Budget Converter — Live KRW Exchange Calculator | KoreaPlus',
      h1: 'Korea Budget Converter',
      desc: 'Convert your budget to Korean won at live exchange rates, then see what it buys in Korea — meals, transport, hotels. Free, no sign-up.',
      lead: 'Type a budget in your currency to see it in Korean won at live rates, then check what it actually buys on the ground — using our continuously-updated Korea cost data.',
      amountL: 'Your budget', curL: 'Currency', toKrw: 'In Korean won', rateL: 'Live rate',
      buysH: '🛒 What this buys in Korea', styleH: '🎒 Days of travel at this budget',
      perDayNote: 'Days are estimated from our daily-budget tiers (below); actual spend varies.',
      shareB: '🔗 Copy share link', sharedMsg: 'Link copied — your numbers travel with it.',
    },
    // ─ trip cost calculator page
    cc: {
      title: 'Korea Trip Cost Calculator — Plan Your Daily Budget | KoreaPlus',
      h1: 'Korea Trip Cost Calculator',
      desc: 'Estimate the cost of your Korea trip: pick travel style, days and travellers, and see a daily + total budget in KRW and your currency. Flights excluded.',
      lead: 'Set your travel style, trip length and group size to estimate a daily and total Korea budget — built on our own on-the-ground cost tiers and live exchange rates. Flights are not included.',
      styleL: 'Travel style', daysL: 'Days', peopleL: 'Travellers', curL: 'Show totals in',
      perDayH: '📅 Per person, per day', totalH: '🧮 Trip total', perPersonH: 'per person',
      breakdownH: '🧾 Reference prices (per item)',
      note: 'Estimates exclude international flights. Figures use our median Korea prices converted at live rates and are rounded — treat them as a planning range, not a quote.',
    },
    // ─ shared chrome
    styleN: { backpacker: 'Backpacker', midrange: 'Mid-range', comfort: 'Comfort' },
    styleDesc: {
      backpacker: 'Guesthouses, street food & convenience meals, transit only.',
      midrange: '3★ hotels, sit-down restaurants, the odd taxi & paid attraction.',
      comfort: '4★+ hotels, full-service dining, taxis, tours and experiences.',
    },
    perDay: '/day', days: 'days', day: 'day',
    itemN: ['Street snack (tteokbokki)', 'Casual meal (bibimbap)', 'Korean BBQ (per person)', 'Cafe coffee', 'Subway / bus ride', 'KTX Seoul→Busan', 'Palace entry', '3★ hotel / night', 'Guesthouse dorm', 'Soju (restaurant)'],
    th: ['Item', 'KRW', 'Your currency'],
    offline: 'Offline rates (approximate)', updated: 'Live rate',
    curN: { USD: 'US Dollar', EUR: 'Euro', JPY: 'Japanese Yen', GBP: 'British Pound', CNY: 'Chinese Yuan', AUD: 'Australian Dollar', CAD: 'Canadian Dollar', SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar', TWD: 'Taiwan Dollar', THB: 'Thai Baht', PHP: 'Philippine Peso', VND: 'Vietnamese Dong', MYR: 'Malaysian Ringgit', INR: 'Indian Rupee' },
    ctaH: 'Plan within your budget', ctaP: 'Browse stays and tours that fit the number you just calculated.', ctaB: 'Find Korea stays & tours',
    embedH: '🔗 Put this on your site', embedP: 'Copy the snippet to embed this free calculator (no ads, always live).',
    faqH: '❓ FAQ', home: 'Home', tools: 'Tools',
    faq: [
      ['Are exchange rates live?', 'Yes — rates load from our live feed when the page opens. If that ever fails, the tool falls back to clearly-labelled approximate rates so it still works offline.'],
      ['What does the trip total include?', 'Accommodation, food, local transport and typical attractions for the travel style you pick. It excludes international flights and any single big-ticket purchase.'],
      ['How accurate is this?', 'Figures come from our own median Korea prices, converted at live rates and rounded. Treat the result as a realistic planning range, not a fixed quote.'],
    ],
  },

  ja: {
    cv: {
      title: '韓国 予算コンバーター — リアルタイム為替計算 | KoreaPlus',
      h1: '韓国 予算コンバーター',
      desc: '自国通貨の予算をリアルタイム為替で韓国ウォンに換算し、現地で何が買えるかを確認。食事・交通・ホテル。無料・登録不要。',
      lead: '予算を入力するとリアルタイム為替で韓国ウォンに換算。さらに当サイトの最新コストデータで、その金額で現地に何が買えるかが分かります。',
      amountL: '予算', curL: '通貨', toKrw: '韓国ウォン換算', rateL: 'リアルタイム為替',
      buysH: '🛒 この予算で買えるもの', styleH: '🎒 この予算での旅行日数',
      perDayNote: '日数は下記の1日予算の目安から算出。実際の支出は変動します。',
      shareB: '🔗 共有リンクをコピー', sharedMsg: 'リンクをコピーしました — 数値も一緒に共有されます。',
    },
    cc: {
      title: '韓国 旅費計算機 — 1日予算をプランニング | KoreaPlus',
      h1: '韓国 旅費計算機',
      desc: '韓国旅行の費用を試算：旅のスタイル・日数・人数を選ぶと、ウォンと自国通貨で1日・合計予算が分かります。航空券は含みません。',
      lead: '旅のスタイル・日数・人数を設定すると、韓国旅行の1日・合計予算を試算します。当サイトの実地コストとリアルタイム為替を使用。航空券は含みません。',
      styleL: '旅のスタイル', daysL: '日数', peopleL: '人数', curL: '合計の表示通貨',
      perDayH: '📅 1人・1日あたり', totalH: '🧮 旅行合計', perPersonH: '1人あたり',
      breakdownH: '🧾 参考価格（項目別）',
      note: '国際線航空券は含みません。数値は当サイトの韓国の中央価格をリアルタイム為替で換算し丸めたもので、目安としてご利用ください。',
    },
    styleN: { backpacker: 'バックパッカー', midrange: '中級', comfort: '快適派' },
    styleDesc: {
      backpacker: 'ゲストハウス、屋台・コンビニ食、移動は公共交通のみ。',
      midrange: '3つ星ホテル、食堂、たまにタクシーや有料観光。',
      comfort: '4つ星以上、フルサービスの食事、タクシー、ツアー・体験。',
    },
    perDay: '/日', days: '日', day: '日',
    itemN: ['屋台フード（トッポッキ）', '食堂の一食（ビビンバ）', '焼肉（1人）', 'カフェのコーヒー', '地下鉄・バス', 'KTX ソウル→釜山', '古宮入場', '3つ星ホテル/泊', 'ゲストハウス', 'ソジュ（店）'],
    th: ['項目', '韓国ウォン', '自国通貨'],
    offline: 'オフライン為替（概算）', updated: 'リアルタイム為替',
    curN: { USD: '米ドル', EUR: 'ユーロ', JPY: '日本円', GBP: '英ポンド', CNY: '人民元', AUD: '豪ドル', CAD: 'カナダドル', SGD: 'シンガポールドル', HKD: '香港ドル', TWD: '台湾ドル', THB: 'タイバーツ', PHP: 'フィリピンペソ', VND: 'ベトナムドン', MYR: 'マレーシアリンギット', INR: 'インドルピー' },
    ctaH: '予算内でプランニング', ctaP: '計算した金額に合う宿やツアーを探しましょう。', ctaB: '韓国の宿・ツアーを探す',
    embedH: '🔗 あなたのサイトに設置', embedP: 'スニペットをコピーして、この無料計算機を埋め込めます（広告なし・常にリアルタイム）。',
    faqH: '❓ よくある質問', home: 'ホーム', tools: 'ツール',
    faq: [
      ['為替はリアルタイムですか？', 'はい。ページを開くとリアルタイムの為替を読み込みます。取得に失敗した場合は、概算と明記したレートに自動で切り替わり、オフラインでも動作します。'],
      ['旅行合計には何が含まれますか？', '選んだスタイルに応じた宿泊・食事・現地交通・一般的な観光が含まれます。国際線航空券や高額な単発購入は含みません。'],
      ['精度はどのくらいですか？', '数値は当サイトの韓国の中央価格をリアルタイム為替で換算し丸めたものです。固定見積もりではなく、現実的な目安としてご利用ください。'],
    ],
  },

  zh: {
    cv: {
      title: '韩国预算换算器 — 实时韩元汇率计算 | KoreaPlus',
      h1: '韩国预算换算器',
      desc: '按实时汇率把你的预算换算成韩元，再看看在韩国能买到什么——餐饮、交通、住宿。免费，无需注册。',
      lead: '输入你的预算，按实时汇率换算成韩元，再用我们持续更新的韩国花费数据，看看这笔钱在当地能买到什么。',
      amountL: '你的预算', curL: '货币', toKrw: '折合韩元', rateL: '实时汇率',
      buysH: '🛒 这笔预算能买到什么', styleH: '🎒 按此预算可旅行天数',
      perDayNote: '天数依据下方每日预算档位估算，实际花费会有差异。',
      shareB: '🔗 复制分享链接', sharedMsg: '链接已复制——你的数字会一起分享。',
    },
    cc: {
      title: '韩国旅行费用计算器 — 规划每日预算 | KoreaPlus',
      h1: '韩国旅行费用计算器',
      desc: '估算你的韩国之旅花费：选择风格、天数和人数，得到韩元及本币的每日与总预算。不含机票。',
      lead: '设置旅行风格、天数和人数，估算韩国旅行的每日与总预算——基于我们的实地花费档位和实时汇率。不含机票。',
      styleL: '旅行风格', daysL: '天数', peopleL: '人数', curL: '总额显示货币',
      perDayH: '📅 每人每天', totalH: '🧮 旅行总额', perPersonH: '每人',
      breakdownH: '🧾 参考价格（逐项）',
      note: '估算不含国际机票。数字采用我们的韩国中位价格，按实时汇率换算并取整——请作为规划区间，而非报价。',
    },
    styleN: { backpacker: '背包客', midrange: '中端', comfort: '舒适型' },
    styleDesc: {
      backpacker: '青旅、街头小吃与便利店餐、仅公共交通。',
      midrange: '3 星酒店、堂食餐厅、偶尔打车和付费景点。',
      comfort: '4 星以上酒店、全套餐饮、打车、跟团与体验。',
    },
    perDay: '/天', days: '天', day: '天',
    itemN: ['街头小吃（辣炒年糕）', '大众一餐（拌饭）', '韩式烤肉（每人）', '咖啡馆咖啡', '地铁/公交', 'KTX 首尔→釜山', '宫殿门票', '3 星酒店/晚', '青旅床位', '烧酒（餐厅）'],
    th: ['项目', '韩元', '本币'],
    offline: '离线汇率（近似）', updated: '实时汇率',
    curN: { USD: '美元', EUR: '欧元', JPY: '日元', GBP: '英镑', CNY: '人民币', AUD: '澳元', CAD: '加元', SGD: '新加坡元', HKD: '港元', TWD: '新台币', THB: '泰铢', PHP: '菲律宾比索', VND: '越南盾', MYR: '马来西亚林吉特', INR: '印度卢比' },
    ctaH: '在预算内规划', ctaP: '看看符合你刚算出金额的住宿与行程。', ctaB: '寻找韩国住宿与行程',
    embedH: '🔗 放到你的网站', embedP: '复制代码片段即可嵌入这个免费计算器（无广告、始终实时）。',
    faqH: '❓ 常见问题', home: '首页', tools: '工具',
    faq: [
      ['汇率是实时的吗？', '是的——打开页面时会从我们的实时数据源加载汇率。若加载失败，会自动切换到明确标注的近似汇率，离线也能用。'],
      ['旅行总额包含哪些？', '包含所选风格对应的住宿、餐饮、本地交通和常见景点。不含国际机票及任何单笔大额消费。'],
      ['准确度如何？', '数字来自我们的韩国中位价格，按实时汇率换算并取整。请作为现实的规划区间，而非固定报价。'],
    ],
  },

  es: {
    cv: {
      title: 'Conversor de presupuesto para Corea — Cambio KRW en vivo | KoreaPlus',
      h1: 'Conversor de presupuesto para Corea',
      desc: 'Convierte tu presupuesto a wones coreanos al cambio en vivo y mira qué compra en Corea: comidas, transporte, hoteles. Gratis y sin registro.',
      lead: 'Escribe un presupuesto en tu moneda para verlo en wones al cambio en vivo, y comprueba qué compra sobre el terreno con nuestros datos de coste actualizados.',
      amountL: 'Tu presupuesto', curL: 'Moneda', toKrw: 'En wones', rateL: 'Cambio en vivo',
      buysH: '🛒 Qué compra esto en Corea', styleH: '🎒 Días de viaje con este presupuesto',
      perDayNote: 'Los días se estiman con los niveles de presupuesto diario (abajo); el gasto real varía.',
      shareB: '🔗 Copiar enlace', sharedMsg: 'Enlace copiado: tus números viajan con él.',
    },
    cc: {
      title: 'Calculadora de coste de viaje a Corea — Presupuesto diario | KoreaPlus',
      h1: 'Calculadora de coste de viaje a Corea',
      desc: 'Estima el coste de tu viaje a Corea: elige estilo, días y viajeros, y obtén un presupuesto diario y total en wones y tu moneda. Vuelos no incluidos.',
      lead: 'Define estilo de viaje, duración y tamaño del grupo para estimar un presupuesto diario y total — con nuestros niveles de coste reales y el cambio en vivo. No incluye vuelos.',
      styleL: 'Estilo de viaje', daysL: 'Días', peopleL: 'Viajeros', curL: 'Mostrar totales en',
      perDayH: '📅 Por persona y día', totalH: '🧮 Total del viaje', perPersonH: 'por persona',
      breakdownH: '🧾 Precios de referencia (por concepto)',
      note: 'Las estimaciones excluyen vuelos internacionales. Las cifras usan nuestros precios medianos de Corea al cambio en vivo y están redondeadas — úsalas como rango de planificación, no como presupuesto cerrado.',
    },
    styleN: { backpacker: 'Mochilero', midrange: 'Gama media', comfort: 'Cómodo' },
    styleDesc: {
      backpacker: 'Albergues, comida callejera y de tienda, solo transporte público.',
      midrange: 'Hoteles 3★, restaurantes, algún taxi y atracción de pago.',
      comfort: 'Hoteles 4★+, comidas completas, taxis, tours y experiencias.',
    },
    perDay: '/día', days: 'días', day: 'día',
    itemN: ['Aperitivo callejero (tteokbokki)', 'Comida sencilla (bibimbap)', 'BBQ coreana (por persona)', 'Café', 'Metro / autobús', 'KTX Seúl→Busan', 'Entrada a palacio', 'Hotel 3★ / noche', 'Litera en albergue', 'Soju (restaurante)'],
    th: ['Concepto', 'KRW', 'Tu moneda'],
    offline: 'Cambio sin conexión (aprox.)', updated: 'Cambio en vivo',
    curN: { USD: 'Dólar EE. UU.', EUR: 'Euro', JPY: 'Yen japonés', GBP: 'Libra esterlina', CNY: 'Yuan chino', AUD: 'Dólar australiano', CAD: 'Dólar canadiense', SGD: 'Dólar de Singapur', HKD: 'Dólar de Hong Kong', TWD: 'Dólar taiwanés', THB: 'Baht tailandés', PHP: 'Peso filipino', VND: 'Dong vietnamita', MYR: 'Ringgit malayo', INR: 'Rupia india' },
    ctaH: 'Planifica dentro de tu presupuesto', ctaP: 'Mira alojamientos y tours que encajan con la cifra que acabas de calcular.', ctaB: 'Buscar alojamientos y tours',
    embedH: '🔗 Ponlo en tu web', embedP: 'Copia el fragmento para incrustar esta calculadora gratuita (sin anuncios, siempre en vivo).',
    faqH: '❓ Preguntas frecuentes', home: 'Inicio', tools: 'Herramientas',
    faq: [
      ['¿El cambio es en vivo?', 'Sí: las tasas se cargan de nuestra fuente en vivo al abrir la página. Si falla, la herramienta usa tasas aproximadas claramente etiquetadas para seguir funcionando sin conexión.'],
      ['¿Qué incluye el total del viaje?', 'Alojamiento, comida, transporte local y atracciones típicas según el estilo elegido. Excluye vuelos internacionales y cualquier compra puntual de alto coste.'],
      ['¿Qué precisión tiene?', 'Las cifras salen de nuestros precios medianos de Corea, convertidos al cambio en vivo y redondeados. Trátalo como un rango realista, no como un presupuesto fijo.'],
    ],
  },

  ko: {
    cv: {
      title: '한국 여행 예산 변환기 — 실시간 원화 환율 계산 | KoreaPlus',
      h1: '한국 여행 예산 변환기',
      desc: '내 예산을 실시간 환율로 원화로 바꾸고, 한국에서 무엇을 살 수 있는지 확인하세요 — 식사·교통·숙박. 무료, 가입 불필요.',
      lead: '예산을 입력하면 실시간 환율로 원화로 환산하고, 계속 업데이트되는 한국 비용 데이터로 그 금액으로 현지에서 무엇을 살 수 있는지 보여줍니다.',
      amountL: '내 예산', curL: '통화', toKrw: '원화 환산', rateL: '실시간 환율',
      buysH: '🛒 이 예산으로 살 수 있는 것', styleH: '🎒 이 예산으로 여행 가능 일수',
      perDayNote: '일수는 아래 1일 예산 등급으로 추정한 값이며 실제 지출은 달라질 수 있습니다.',
      shareB: '🔗 공유 링크 복사', sharedMsg: '링크를 복사했습니다 — 입력한 숫자도 함께 공유됩니다.',
    },
    cc: {
      title: '한국 여행 경비 계산기 — 1일 예산 플래너 | KoreaPlus',
      h1: '한국 여행 경비 계산기',
      desc: '한국 여행 경비를 계산하세요: 여행 스타일·일수·인원을 고르면 원화와 내 통화로 1일·총 예산이 나옵니다. 항공권 제외.',
      lead: '여행 스타일·기간·인원을 설정하면 한국 여행의 1일·총 예산을 추정합니다 — 실제 현지 비용 등급과 실시간 환율 기반. 항공권은 포함되지 않습니다.',
      styleL: '여행 스타일', daysL: '일수', peopleL: '인원', curL: '합계 표시 통화',
      perDayH: '📅 1인 1일 기준', totalH: '🧮 여행 총액', perPersonH: '1인당',
      breakdownH: '🧾 참고 가격 (항목별)',
      note: '국제선 항공권은 제외됩니다. 수치는 한국의 중앙 가격을 실시간 환율로 환산해 반올림한 값으로, 확정 견적이 아닌 계획용 범위로 봐 주세요.',
    },
    styleN: { backpacker: '배낭여행', midrange: '중급', comfort: '편안함' },
    styleDesc: {
      backpacker: '게스트하우스, 길거리·편의점 식사, 대중교통만.',
      midrange: '3성급 호텔, 식당 식사, 가끔 택시와 유료 관광.',
      comfort: '4성급 이상, 풀서비스 식사, 택시, 투어·체험.',
    },
    perDay: '/일', days: '일', day: '일',
    itemN: ['길거리 간식 (떡볶이)', '간단한 식사 (비빔밥)', '한국식 BBQ (1인)', '카페 커피', '지하철 / 버스', 'KTX 서울→부산', '고궁 입장', '3성급 호텔 / 박', '게스트하우스 도미토리', '소주 (식당)'],
    th: ['항목', '원(KRW)', '내 통화'],
    offline: '오프라인 환율 (근사치)', updated: '실시간 환율',
    curN: { USD: '미국 달러', EUR: '유로', JPY: '일본 엔', GBP: '영국 파운드', CNY: '중국 위안', AUD: '호주 달러', CAD: '캐나다 달러', SGD: '싱가포르 달러', HKD: '홍콩 달러', TWD: '대만 달러', THB: '태국 바트', PHP: '필리핀 페소', VND: '베트남 동', MYR: '말레이시아 링깃', INR: '인도 루피' },
    ctaH: '예산 안에서 계획하세요', ctaP: '방금 계산한 금액에 맞는 숙소와 투어를 둘러보세요.', ctaB: '한국 숙소·투어 찾기',
    embedH: '🔗 내 사이트에 넣기', embedP: '스니펫을 복사해 이 무료 계산기를 임베드하세요 (광고 없음, 항상 실시간).',
    faqH: '❓ 자주 묻는 질문', home: '홈', tools: '도구',
    faq: [
      ['환율은 실시간인가요?', '네 — 페이지를 열면 실시간 피드에서 환율을 불러옵니다. 실패하면 근사치라고 명시된 환율로 자동 전환되어 오프라인에서도 작동합니다.'],
      ['여행 총액에는 무엇이 포함되나요?', '선택한 스타일에 맞는 숙박·식사·현지 교통·일반적인 관광이 포함됩니다. 국제선 항공권과 고액 단일 구매는 제외됩니다.'],
      ['정확도는 어느 정도인가요?', '수치는 한국의 중앙 가격을 실시간 환율로 환산해 반올림한 값입니다. 고정 견적이 아닌 현실적인 계획 범위로 봐 주세요.'],
    ],
  },

  fr: {
    cv: {
      title: 'Convertisseur de budget Corée — Taux KRW en direct | KoreaPlus',
      h1: 'Convertisseur de budget Corée',
      desc: 'Convertissez votre budget en wons coréens au taux en direct et voyez ce qu’il achète en Corée : repas, transport, hôtels. Gratuit, sans inscription.',
      lead: 'Saisissez un budget dans votre devise pour le voir en wons au taux en direct, puis vérifiez ce qu’il achète sur place grâce à nos données de coût mises à jour.',
      amountL: 'Votre budget', curL: 'Devise', toKrw: 'En wons', rateL: 'Taux en direct',
      buysH: '🛒 Ce que cela achète en Corée', styleH: '🎒 Jours de voyage avec ce budget',
      perDayNote: 'Les jours sont estimés à partir des niveaux de budget quotidien (ci-dessous) ; les dépenses réelles varient.',
      shareB: '🔗 Copier le lien', sharedMsg: 'Lien copié — vos chiffres voyagent avec lui.',
    },
    cc: {
      title: 'Calculateur de coût d’un voyage en Corée — Budget quotidien | KoreaPlus',
      h1: 'Calculateur de coût d’un voyage en Corée',
      desc: 'Estimez le coût de votre voyage en Corée : choisissez le style, les jours et les voyageurs, et obtenez un budget quotidien et total en wons et dans votre devise. Vols exclus.',
      lead: 'Définissez le style, la durée et la taille du groupe pour estimer un budget quotidien et total — basé sur nos niveaux de coût réels et le taux en direct. Les vols ne sont pas inclus.',
      styleL: 'Style de voyage', daysL: 'Jours', peopleL: 'Voyageurs', curL: 'Afficher les totaux en',
      perDayH: '📅 Par personne et par jour', totalH: '🧮 Total du voyage', perPersonH: 'par personne',
      breakdownH: '🧾 Prix de référence (par poste)',
      note: 'Les estimations excluent les vols internationaux. Les chiffres utilisent nos prix médians en Corée convertis au taux en direct et arrondis — à prendre comme une fourchette de planification, pas un devis.',
    },
    styleN: { backpacker: 'Routard', midrange: 'Milieu de gamme', comfort: 'Confort' },
    styleDesc: {
      backpacker: 'Auberges, street food et repas d’épicerie, transports en commun uniquement.',
      midrange: 'Hôtels 3★, restaurants, quelques taxis et attractions payantes.',
      comfort: 'Hôtels 4★+, restauration complète, taxis, visites et expériences.',
    },
    perDay: '/jour', days: 'jours', day: 'jour',
    itemN: ['En-cas de rue (tteokbokki)', 'Repas simple (bibimbap)', 'BBQ coréen (par personne)', 'Café', 'Métro / bus', 'KTX Séoul→Busan', 'Entrée de palais', 'Hôtel 3★ / nuit', 'Dortoir d’auberge', 'Soju (restaurant)'],
    th: ['Poste', 'KRW', 'Votre devise'],
    offline: 'Taux hors ligne (approx.)', updated: 'Taux en direct',
    curN: { USD: 'Dollar américain', EUR: 'Euro', JPY: 'Yen japonais', GBP: 'Livre sterling', CNY: 'Yuan chinois', AUD: 'Dollar australien', CAD: 'Dollar canadien', SGD: 'Dollar de Singapour', HKD: 'Dollar de Hong Kong', TWD: 'Dollar taïwanais', THB: 'Baht thaïlandais', PHP: 'Peso philippin', VND: 'Dong vietnamien', MYR: 'Ringgit malais', INR: 'Roupie indienne' },
    ctaH: 'Planifiez dans votre budget', ctaP: 'Parcourez des hébergements et des visites adaptés au montant que vous venez de calculer.', ctaB: 'Trouver hébergements et visites',
    embedH: '🔗 Mettez-le sur votre site', embedP: 'Copiez le code pour intégrer cette calculatrice gratuite (sans pub, toujours en direct).',
    faqH: '❓ FAQ', home: 'Accueil', tools: 'Outils',
    faq: [
      ['Les taux sont-ils en direct ?', 'Oui — les taux se chargent depuis notre flux en direct à l’ouverture de la page. En cas d’échec, l’outil bascule sur des taux approximatifs clairement indiqués pour fonctionner hors ligne.'],
      ['Que comprend le total du voyage ?', 'Hébergement, repas, transport local et attractions typiques selon le style choisi. Hors vols internationaux et tout achat unique coûteux.'],
      ['Quelle est la précision ?', 'Les chiffres proviennent de nos prix médians en Corée, convertis au taux en direct et arrondis. À considérer comme une fourchette réaliste, pas un devis figé.'],
    ],
  },

  de: {
    cv: {
      title: 'Korea-Budget-Rechner — Live-KRW-Wechselkurs | KoreaPlus',
      h1: 'Korea-Budget-Rechner',
      desc: 'Rechne dein Budget zum Live-Kurs in Won um und sieh, was es in Korea kauft: Essen, Transport, Hotels. Kostenlos, ohne Anmeldung.',
      lead: 'Gib ein Budget in deiner Währung ein, um es zum Live-Kurs in Won zu sehen, und prüfe mit unseren laufend aktualisierten Kostendaten, was es vor Ort kauft.',
      amountL: 'Dein Budget', curL: 'Währung', toKrw: 'In Won', rateL: 'Live-Kurs',
      buysH: '🛒 Was das in Korea kauft', styleH: '🎒 Reisetage mit diesem Budget',
      perDayNote: 'Die Tage werden aus den Tagesbudget-Stufen (unten) geschätzt; die tatsächlichen Ausgaben variieren.',
      shareB: '🔗 Link kopieren', sharedMsg: 'Link kopiert — deine Zahlen reisen mit.',
    },
    cc: {
      title: 'Korea-Reisekosten-Rechner — Tagesbudget planen | KoreaPlus',
      h1: 'Korea-Reisekosten-Rechner',
      desc: 'Schätze die Kosten deiner Korea-Reise: wähle Stil, Tage und Reisende und erhalte ein Tages- und Gesamtbudget in Won und deiner Währung. Ohne Flüge.',
      lead: 'Lege Reisestil, Dauer und Gruppengröße fest, um ein Tages- und Gesamtbudget für Korea zu schätzen — basierend auf unseren realen Kostenstufen und dem Live-Kurs. Flüge sind nicht enthalten.',
      styleL: 'Reisestil', daysL: 'Tage', peopleL: 'Reisende', curL: 'Summen anzeigen in',
      perDayH: '📅 Pro Person und Tag', totalH: '🧮 Reise gesamt', perPersonH: 'pro Person',
      breakdownH: '🧾 Referenzpreise (pro Posten)',
      note: 'Die Schätzungen schließen internationale Flüge aus. Die Zahlen nutzen unsere mittleren Korea-Preise, zum Live-Kurs umgerechnet und gerundet — als Planungsspanne, nicht als Angebot.',
    },
    styleN: { backpacker: 'Backpacker', midrange: 'Mittelklasse', comfort: 'Komfort' },
    styleDesc: {
      backpacker: 'Gästehäuser, Streetfood & Kioskmahlzeiten, nur ÖPNV.',
      midrange: '3★-Hotels, Restaurants, gelegentlich Taxi und kostenpflichtige Attraktion.',
      comfort: '4★+-Hotels, volles Restaurant-Programm, Taxis, Touren und Erlebnisse.',
    },
    perDay: '/Tag', days: 'Tage', day: 'Tag',
    itemN: ['Streetfood-Snack (Tteokbokki)', 'Einfaches Essen (Bibimbap)', 'Korean BBQ (pro Person)', 'Café-Kaffee', 'U-Bahn / Bus', 'KTX Seoul→Busan', 'Palasteintritt', '3★-Hotel / Nacht', 'Hostel-Schlafsaal', 'Soju (Restaurant)'],
    th: ['Posten', 'KRW', 'Deine Währung'],
    offline: 'Offline-Kurse (ungefähr)', updated: 'Live-Kurs',
    curN: { USD: 'US-Dollar', EUR: 'Euro', JPY: 'Japanischer Yen', GBP: 'Britisches Pfund', CNY: 'Chinesischer Yuan', AUD: 'Australischer Dollar', CAD: 'Kanadischer Dollar', SGD: 'Singapur-Dollar', HKD: 'Hongkong-Dollar', TWD: 'Taiwan-Dollar', THB: 'Thai-Baht', PHP: 'Philippinischer Peso', VND: 'Vietnamesischer Dong', MYR: 'Malaysischer Ringgit', INR: 'Indische Rupie' },
    ctaH: 'Plane im Rahmen deines Budgets', ctaP: 'Stöbere nach Unterkünften und Touren, die zur eben berechneten Summe passen.', ctaB: 'Korea-Unterkünfte & Touren finden',
    embedH: '🔗 Auf deine Website setzen', embedP: 'Kopiere das Snippet, um diesen kostenlosen Rechner einzubetten (werbefrei, immer live).',
    faqH: '❓ FAQ', home: 'Start', tools: 'Tools',
    faq: [
      ['Sind die Kurse live?', 'Ja — die Kurse laden beim Öffnen der Seite aus unserem Live-Feed. Schlägt das fehl, nutzt das Tool klar gekennzeichnete Näherungskurse und funktioniert offline weiter.'],
      ['Was enthält die Reisesumme?', 'Unterkunft, Essen, lokalen Transport und typische Attraktionen je nach gewähltem Stil. Ohne internationale Flüge und einzelne Großanschaffungen.'],
      ['Wie genau ist das?', 'Die Zahlen stammen aus unseren mittleren Korea-Preisen, zum Live-Kurs umgerechnet und gerundet. Als realistische Planungsspanne verstehen, nicht als festes Angebot.'],
    ],
  },

  pt: {
    cv: {
      title: 'Conversor de orçamento para a Coreia — Câmbio KRW ao vivo | KoreaPlus',
      h1: 'Conversor de orçamento para a Coreia',
      desc: 'Converta seu orçamento para wones ao câmbio ao vivo e veja o que ele compra na Coreia: refeições, transporte, hotéis. Grátis, sem cadastro.',
      lead: 'Digite um orçamento na sua moeda para vê-lo em wones ao câmbio ao vivo e confira o que ele compra no local com nossos dados de custo atualizados.',
      amountL: 'Seu orçamento', curL: 'Moeda', toKrw: 'Em wones', rateL: 'Câmbio ao vivo',
      buysH: '🛒 O que isso compra na Coreia', styleH: '🎒 Dias de viagem com este orçamento',
      perDayNote: 'Os dias são estimados pelos níveis de orçamento diário (abaixo); o gasto real varia.',
      shareB: '🔗 Copiar link', sharedMsg: 'Link copiado — seus números vão junto.',
    },
    cc: {
      title: 'Calculadora de custo de viagem à Coreia — Orçamento diário | KoreaPlus',
      h1: 'Calculadora de custo de viagem à Coreia',
      desc: 'Estime o custo da sua viagem à Coreia: escolha estilo, dias e viajantes e veja um orçamento diário e total em wones e na sua moeda. Voos não incluídos.',
      lead: 'Defina estilo, duração e tamanho do grupo para estimar um orçamento diário e total da Coreia — com nossos níveis de custo reais e o câmbio ao vivo. Voos não estão incluídos.',
      styleL: 'Estilo de viagem', daysL: 'Dias', peopleL: 'Viajantes', curL: 'Mostrar totais em',
      perDayH: '📅 Por pessoa, por dia', totalH: '🧮 Total da viagem', perPersonH: 'por pessoa',
      breakdownH: '🧾 Preços de referência (por item)',
      note: 'As estimativas excluem voos internacionais. Os valores usam nossos preços medianos da Coreia convertidos ao câmbio ao vivo e arredondados — use como faixa de planejamento, não como orçamento fechado.',
    },
    styleN: { backpacker: 'Mochileiro', midrange: 'Intermediário', comfort: 'Conforto' },
    styleDesc: {
      backpacker: 'Albergues, comida de rua e de conveniência, só transporte público.',
      midrange: 'Hotéis 3★, restaurantes, táxi ocasional e atração paga.',
      comfort: 'Hotéis 4★+, refeições completas, táxis, passeios e experiências.',
    },
    perDay: '/dia', days: 'dias', day: 'dia',
    itemN: ['Petisco de rua (tteokbokki)', 'Refeição simples (bibimbap)', 'Churrasco coreano (por pessoa)', 'Café', 'Metrô / ônibus', 'KTX Seul→Busan', 'Entrada de palácio', 'Hotel 3★ / noite', 'Dormitório de albergue', 'Soju (restaurante)'],
    th: ['Item', 'KRW', 'Sua moeda'],
    offline: 'Câmbio offline (aprox.)', updated: 'Câmbio ao vivo',
    curN: { USD: 'Dólar americano', EUR: 'Euro', JPY: 'Iene japonês', GBP: 'Libra esterlina', CNY: 'Yuan chinês', AUD: 'Dólar australiano', CAD: 'Dólar canadense', SGD: 'Dólar de Singapura', HKD: 'Dólar de Hong Kong', TWD: 'Dólar de Taiwan', THB: 'Baht tailandês', PHP: 'Peso filipino', VND: 'Dong vietnamita', MYR: 'Ringgit malaio', INR: 'Rupia indiana' },
    ctaH: 'Planeje dentro do seu orçamento', ctaP: 'Veja hospedagens e passeios que cabem no valor que você acabou de calcular.', ctaB: 'Encontrar hospedagens e passeios',
    embedH: '🔗 Coloque no seu site', embedP: 'Copie o trecho para incorporar esta calculadora gratuita (sem anúncios, sempre ao vivo).',
    faqH: '❓ Perguntas frequentes', home: 'Início', tools: 'Ferramentas',
    faq: [
      ['As taxas são ao vivo?', 'Sim — as taxas carregam do nosso feed ao vivo ao abrir a página. Se falhar, a ferramenta usa taxas aproximadas claramente identificadas e continua funcionando offline.'],
      ['O que o total da viagem inclui?', 'Hospedagem, alimentação, transporte local e atrações típicas conforme o estilo escolhido. Exclui voos internacionais e qualquer compra única de alto valor.'],
      ['Qual a precisão?', 'Os valores vêm dos nossos preços medianos da Coreia, convertidos ao câmbio ao vivo e arredondados. Trate como faixa realista de planejamento, não como orçamento fixo.'],
    ],
  },

  id: {
    cv: {
      title: 'Konverter Anggaran Korea — Kurs KRW Langsung | KoreaPlus',
      h1: 'Konverter Anggaran Korea',
      desc: 'Konversikan anggaranmu ke won dengan kurs langsung dan lihat apa yang bisa dibeli di Korea: makan, transportasi, hotel. Gratis, tanpa daftar.',
      lead: 'Masukkan anggaran dalam mata uangmu untuk melihatnya dalam won dengan kurs langsung, lalu cek apa yang bisa dibeli di lapangan dengan data biaya kami yang terus diperbarui.',
      amountL: 'Anggaranmu', curL: 'Mata uang', toKrw: 'Dalam won', rateL: 'Kurs langsung',
      buysH: '🛒 Yang bisa dibeli di Korea', styleH: '🎒 Hari perjalanan dengan anggaran ini',
      perDayNote: 'Jumlah hari diperkirakan dari tingkat anggaran harian (di bawah); pengeluaran nyata bervariasi.',
      shareB: '🔗 Salin tautan', sharedMsg: 'Tautan disalin — angkamu ikut terbagi.',
    },
    cc: {
      title: 'Kalkulator Biaya Perjalanan Korea — Rencanakan Anggaran Harian | KoreaPlus',
      h1: 'Kalkulator Biaya Perjalanan Korea',
      desc: 'Perkirakan biaya perjalanan Korea-mu: pilih gaya, jumlah hari dan pelancong, lalu lihat anggaran harian dan total dalam won serta mata uangmu. Tiket pesawat tidak termasuk.',
      lead: 'Atur gaya perjalanan, durasi dan jumlah orang untuk memperkirakan anggaran harian dan total Korea — berdasarkan tingkat biaya lapangan kami dan kurs langsung. Tiket pesawat tidak termasuk.',
      styleL: 'Gaya perjalanan', daysL: 'Hari', peopleL: 'Pelancong', curL: 'Tampilkan total dalam',
      perDayH: '📅 Per orang, per hari', totalH: '🧮 Total perjalanan', perPersonH: 'per orang',
      breakdownH: '🧾 Harga acuan (per item)',
      note: 'Perkiraan tidak termasuk penerbangan internasional. Angka memakai harga median Korea kami yang dikonversi dengan kurs langsung dan dibulatkan — gunakan sebagai rentang perencanaan, bukan penawaran.',
    },
    styleN: { backpacker: 'Backpacker', midrange: 'Menengah', comfort: 'Nyaman' },
    styleDesc: {
      backpacker: 'Guesthouse, jajanan kaki lima & minimarket, transportasi umum saja.',
      midrange: 'Hotel 3★, makan di restoran, sesekali taksi dan atraksi berbayar.',
      comfort: 'Hotel 4★+, makan lengkap, taksi, tur dan pengalaman.',
    },
    perDay: '/hari', days: 'hari', day: 'hari',
    itemN: ['Jajanan kaki lima (tteokbokki)', 'Makan biasa (bibimbap)', 'BBQ Korea (per orang)', 'Kopi kafe', 'Subway / bus', 'KTX Seoul→Busan', 'Tiket istana', 'Hotel 3★ / malam', 'Dorm guesthouse', 'Soju (restoran)'],
    th: ['Item', 'KRW', 'Mata uangmu'],
    offline: 'Kurs offline (perkiraan)', updated: 'Kurs langsung',
    curN: { USD: 'Dolar AS', EUR: 'Euro', JPY: 'Yen Jepang', GBP: 'Pound Inggris', CNY: 'Yuan Tiongkok', AUD: 'Dolar Australia', CAD: 'Dolar Kanada', SGD: 'Dolar Singapura', HKD: 'Dolar Hong Kong', TWD: 'Dolar Taiwan', THB: 'Baht Thailand', PHP: 'Peso Filipina', VND: 'Dong Vietnam', MYR: 'Ringgit Malaysia', INR: 'Rupee India' },
    ctaH: 'Rencanakan sesuai anggaran', ctaP: 'Lihat penginapan dan tur yang cocok dengan angka yang baru kamu hitung.', ctaB: 'Cari penginapan & tur Korea',
    embedH: '🔗 Pasang di situsmu', embedP: 'Salin cuplikan untuk menyematkan kalkulator gratis ini (tanpa iklan, selalu langsung).',
    faqH: '❓ FAQ', home: 'Beranda', tools: 'Alat',
    faq: [
      ['Apakah kursnya langsung?', 'Ya — kurs dimuat dari feed langsung kami saat halaman dibuka. Jika gagal, alat ini beralih ke kurs perkiraan yang diberi label jelas sehingga tetap berfungsi offline.'],
      ['Total perjalanan mencakup apa saja?', 'Penginapan, makan, transportasi lokal dan atraksi umum sesuai gaya yang dipilih. Tidak termasuk penerbangan internasional dan pembelian besar sekali waktu.'],
      ['Seberapa akurat?', 'Angka berasal dari harga median Korea kami, dikonversi dengan kurs langsung dan dibulatkan. Anggap sebagai rentang perencanaan realistis, bukan penawaran tetap.'],
    ],
  },
};

module.exports = { L10N, CURRENCIES, FALLBACK_RATES };
