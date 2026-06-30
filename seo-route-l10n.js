/* ══════════════════════════════════════════════════════════════════
   seo-route-l10n.js — i18n strings for modules/seo-route.cjs
   ("How to travel between Korean cities" — KTX/SRT/bus intercity routes).
   9 languages: en + ja/zh/es/ko/fr/de/pt/id.

   Pure data module — no build-seo coupling. Required directly by the
   generator (CommonJS). Keys are UI/templating chrome only; the route
   facts themselves (city names, station names, approximate duration &
   fare RANGES, frequency) come from korea-routes.json and are NOT
   fabricated and NOT machine-translated here — durations/fares are shown
   as approximate ranges (never exact timetables).

   DURATION_WORDS maps the Korean duration tokens stored in the JSON
   ("약", "시간", "분", "~", "이상" …) to each language so the approximate
   "약 N시간" phrasing reads naturally per locale while staying a hedge.

   Per-language object shape (all keys required for a language to emit):
     hub        : breadcrumb / nav label for the travel channel root
     dir        : directory label ("Getting around Korea")
     title(a,b) : <title> builder (a/b = from/to display names)
     metaDesc(a,b,mode): meta description
     h1(a,b)    : page H1
     lead(a,b,mode): intro paragraph (mode = localized transport word)
     modeWord   : { KTX, SRT, bus } localized transport-mode labels
     factDur/factFare/factFreq/factMode : key-facts chip builders
     durLabel/fareLabel/freqLabel/stationLabel/modeLabel : labels
     approxNote : "approximate — verify before travel" disclaimer
     bookH/bookBody : "How to book" section
     stepsH     : "Step by step" heading
     steps(a,b,st): [str,...] HowTo step texts (st = station string)
     faq(a,b,dur,fare): [[q,a],...] FAQ pairs
     relatedH   : "Plan your trip" related-links heading
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// Korean duration/frequency tokens (as stored in korea-routes.json) → per
// language. Applied token-by-token so "약 1시간~1시간 30분" localizes without
// re-typing every value. Order matters (multi-char before single-char).
const DURATION_WORDS = {
  en: [['약', 'approx. '], ['시간', 'h'], ['분', 'min'], ['이상', '+'], ['하루', 'per day'], ['회', ' trips'], ['편수 적음', 'few services'], ['편수', 'services'], ['수회', 'a few'], ['다수', 'many']],
  ja: [['약', '約'], ['시간', '時間'], ['분', '分'], ['이상', '以上'], ['하루', '1日'], ['회', '本'], ['편수 적음', '本数少'], ['편수', '本数'], ['수회', '数本'], ['다수', '多数']],
  zh: [['약', '约'], ['시간', '小时'], ['분', '分钟'], ['이상', '以上'], ['하루', '每天'], ['회', '班'], ['편수 적음', '班次少'], ['편수', '班次'], ['수회', '数班'], ['다수', '多班']],
  es: [['약', 'aprox. '], ['시간', ' h'], ['분', ' min'], ['이상', '+'], ['하루', 'al día'], ['회', ' viajes'], ['편수 적음', 'pocos servicios'], ['편수', 'servicios'], ['수회', 'unos pocos'], ['다수', 'muchos']],
  ko: [], // identity — already Korean
  fr: [['약', 'env. '], ['시간', ' h'], ['분', ' min'], ['이상', '+'], ['하루', 'par jour'], ['회', ' trajets'], ['편수 적음', 'peu de services'], ['편수', 'services'], ['수회', 'quelques'], ['다수', 'nombreux']],
  de: [['약', 'ca. '], ['시간', ' Std.'], ['분', ' Min.'], ['이상', '+'], ['하루', 'pro Tag'], ['회', ' Fahrten'], ['편수 적음', 'wenige Verbindungen'], ['편수', 'Verbindungen'], ['수회', 'einige'], ['다수', 'viele']],
  pt: [['약', 'aprox. '], ['시간', ' h'], ['분', ' min'], ['이상', '+'], ['하루', 'por dia'], ['회', ' viagens'], ['편수 적음', 'poucos serviços'], ['편수', 'serviços'], ['수회', 'alguns'], ['다수', 'muitos']],
  id: [['약', 'sekitar '], ['시간', ' jam'], ['분', ' menit'], ['이상', '+'], ['하루', 'per hari'], ['회', ' perjalanan'], ['편수 적음', 'sedikit layanan'], ['편수', 'layanan'], ['수회', 'beberapa'], ['다수', 'banyak']],
};

const T = {
  en: {
    hub: 'Getting around', dir: 'Korea intercity routes',
    title: (a, b) => `${a} to ${b}: KTX/SRT Train Guide (2026) | KoreaPlus`,
    metaDesc: (a, b) => `How to get from ${a} to ${b} in Korea: approximate KTX/SRT travel time, fare range, frequency and which station to use. Approximate figures — verify on Korail/SRT. Updated 2026.`,
    h1: (a, b) => `${a} → ${b}: How to Get There`,
    lead: (a, b, m) => `Travelling from ${a} to ${b}? This guide covers the practical ${m} option — about how long it takes, the approximate one-way fare range, how often services run, and the station to board. Times and fares are approximate ranges, not live timetables — always confirm on the Korail (Korail Talk) or SRT app before you travel.`,
    modeWord: { KTX: 'KTX high-speed train', SRT: 'SRT high-speed train', bus: 'express bus' },
    durLabel: 'Journey time', fareLabel: 'Fare (one-way)', freqLabel: 'Frequency', stationLabel: 'Stations', modeLabel: 'Mode',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: 'Travel times and fares are approximate ranges for planning only — not exact timetables or live prices. Korail and SRT adjust schedules and fares seasonally; confirm on the official app before booking.',
    bookH: '🎫 How to book',
    bookBody: 'Book KTX trains on the official Korail (Korail Talk) app or website, and SRT trains on the SRT app — reserve a few days ahead for weekends and holidays. You can also buy at any station ticket machine or counter. A T-money card covers local subway and bus connections at both ends.',
    stepsH: '🧭 Step by step',
    steps: (a, b, st) => [
      `Go to the departure station for ${a} (${st}).`,
      `Board the booked high-speed train toward ${b}; reserved seats are recommended at peak times.`,
      `Arrive at the ${b} station and transfer to local subway, bus or taxi for your final destination.`,
    ],
    faq: (a, b, dur, fare) => [
      [`How long does the ${a} to ${b} train take?`, `It takes ${dur} on the high-speed service. This is an approximate range — exact times depend on the train and number of stops, so check Korail/SRT for your date.`],
      [`How much is the ${a} to ${b} fare?`, `A one-way ticket is roughly ${fare}. Fares vary by seat class and how far ahead you book; this is an approximate range, not a live price.`],
      [`Do I need to book ${a} to ${b} in advance?`, `For weekends and holidays, reserve a seat a few days ahead on the Korail or SRT app. Weekday off-peak travel is usually fine to buy on the day.`],
    ],
    relatedH: '🔗 Plan your trip',
  },
  ja: {
    hub: '移動', dir: '韓国 都市間ルート',
    title: (a, b) => `${a}から${b}へ：KTX/SRT 行き方ガイド（2026）| KoreaPlus`,
    metaDesc: (a, b) => `韓国・${a}から${b}への行き方：KTX/SRTのおおよその所要時間・料金の目安・運行本数・利用駅。数値は目安です（コレイル/SRTで要確認）。2026年版。`,
    h1: (a, b) => `${a} → ${b}：行き方ガイド`,
    lead: (a, b, m) => `${a}から${b}への移動は、実用的な${m}が中心です。おおよその所要時間、片道料金の目安、運行頻度、乗車駅をまとめました。時間と料金は目安の範囲で、リアルタイムの時刻表ではありません。乗車前にコレイル（Korail Talk）またはSRTアプリで必ずご確認ください。`,
    modeWord: { KTX: 'KTX高速列車', SRT: 'SRT高速列車', bus: '高速バス' },
    durLabel: '所要時間', fareLabel: '料金（片道）', freqLabel: '運行頻度', stationLabel: '駅', modeLabel: '交通手段',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: '所要時間と料金はあくまで目安の範囲で、正確な時刻表やリアルタイム価格ではありません。コレイル・SRTは季節ごとに時刻・料金を調整します。予約前に公式アプリでご確認ください。',
    bookH: '🎫 予約方法',
    bookBody: 'KTXは公式のコレイル（Korail Talk）アプリまたはサイト、SRTはSRTアプリで予約できます。週末・祝日は数日前の予約がおすすめ。駅の券売機・窓口でも購入可。両端の地下鉄・バスはT-moneyカードが便利です。',
    stepsH: '🧭 行き方の手順',
    steps: (a, b, st) => [
      `${a}の出発駅（${st}）へ向かいます。`,
      `${b}方面の高速列車に乗車します。混雑時は指定席の予約がおすすめです。`,
      `${b}の駅に到着後、地下鉄・バス・タクシーに乗り換えて最終目的地へ。`,
    ],
    faq: (a, b, dur, fare) => [
      [`${a}から${b}まで列車でどのくらい？`, `高速列車で${dur}が目安です。列車や停車駅数で変わるため、正確な時間はコレイル/SRTでご確認ください。`],
      [`${a}〜${b}の料金は？`, `片道でおよそ${fare}です。座席等級や予約時期で変動する目安で、リアルタイム価格ではありません。`],
      [`${a}〜${b}は事前予約が必要？`, `週末・祝日はコレイルまたはSRTアプリで数日前の予約を。平日のオフピークは当日でも通常問題ありません。`],
    ],
    relatedH: '🔗 旅の計画',
  },
  zh: {
    hub: '交通', dir: '韩国城际线路',
    title: (a, b) => `${a}到${b}：KTX/SRT 出行指南（2026）| KoreaPlus`,
    metaDesc: (a, b) => `韩国${a}到${b}怎么走：KTX/SRT 大致用时、票价区间、班次与乘车站。数据为参考范围（请在 Korail/SRT 核实）。2026更新。`,
    h1: (a, b) => `${a} → ${b}：出行指南`,
    lead: (a, b, m) => `从${a}到${b}，最实用的是${m}。本页汇总大致用时、单程票价区间、班次频率与乘车站。时间与票价为参考范围，并非实时时刻表——出行前请在 Korail（Korail Talk）或 SRT 应用核实。`,
    modeWord: { KTX: 'KTX 高速列车', SRT: 'SRT 高速列车', bus: '高速巴士' },
    durLabel: '用时', fareLabel: '票价（单程）', freqLabel: '班次', stationLabel: '车站', modeLabel: '方式',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: '用时与票价均为参考范围，仅供规划，并非精确时刻表或实时价格。Korail 与 SRT 会按季节调整班次与票价，订票前请在官方应用核实。',
    bookH: '🎫 如何订票',
    bookBody: 'KTX 在官方 Korail（Korail Talk）应用或网站订票，SRT 在 SRT 应用订票——周末与节假日建议提前几天预订。也可在车站售票机或窗口购买。两端的地铁与公交可用 T-money 卡。',
    stepsH: '🧭 出行步骤',
    steps: (a, b, st) => [
      `前往${a}的出发车站（${st}）。`,
      `乘坐开往${b}方向的高速列车；高峰时段建议预订对号座。`,
      `抵达${b}车站后，换乘地铁、公交或出租车前往最终目的地。`,
    ],
    faq: (a, b, dur, fare) => [
      [`${a}到${b}坐火车要多久？`, `高速列车大致${dur}。具体时间因车次与停站数而异，请在 Korail/SRT 查询您的日期。`],
      [`${a}到${b}票价多少？`, `单程大约${fare}。会因座位等级与订票时间而变动，此为参考范围而非实时价格。`],
      [`${a}到${b}需要提前订票吗？`, `周末与节假日建议在 Korail 或 SRT 应用提前几天订座。平日非高峰通常当天购买即可。`],
    ],
    relatedH: '🔗 规划行程',
  },
  es: {
    hub: 'Cómo moverse', dir: 'Rutas entre ciudades de Corea',
    title: (a, b) => `De ${a} a ${b}: guía de tren KTX/SRT (2026) | KoreaPlus`,
    metaDesc: (a, b) => `Cómo ir de ${a} a ${b} en Corea: tiempo aproximado en KTX/SRT, rango de tarifa, frecuencia y estación. Cifras aproximadas — confirma en Korail/SRT. Actualizado 2026.`,
    h1: (a, b) => `De ${a} a ${b}: cómo llegar`,
    lead: (a, b, m) => `¿Vas de ${a} a ${b}? Esta guía cubre la opción práctica en ${m}: cuánto tarda más o menos, el rango de tarifa de ida, con qué frecuencia hay servicios y desde qué estación. Tiempos y tarifas son rangos aproximados, no horarios en vivo — confirma siempre en la app de Korail (Korail Talk) o SRT antes de viajar.`,
    modeWord: { KTX: 'tren de alta velocidad KTX', SRT: 'tren de alta velocidad SRT', bus: 'autobús exprés' },
    durLabel: 'Duración', fareLabel: 'Tarifa (ida)', freqLabel: 'Frecuencia', stationLabel: 'Estaciones', modeLabel: 'Medio',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: 'Los tiempos y tarifas son rangos aproximados solo para planificar, no horarios exactos ni precios en vivo. Korail y SRT ajustan horarios y tarifas por temporada; confírmalo en la app oficial antes de reservar.',
    bookH: '🎫 Cómo reservar',
    bookBody: 'Reserva los trenes KTX en la app o web oficial de Korail (Korail Talk) y los SRT en la app de SRT — reserva con unos días de antelación para fines de semana y festivos. También puedes comprar en cualquier máquina o ventanilla de la estación. Una tarjeta T-money cubre el metro y el autobús locales en ambos extremos.',
    stepsH: '🧭 Paso a paso',
    steps: (a, b, st) => [
      `Dirígete a la estación de salida de ${a} (${st}).`,
      `Sube al tren de alta velocidad reservado hacia ${b}; se recomienda asiento reservado en horas punta.`,
      `Llega a la estación de ${b} y haz transbordo al metro, autobús o taxi local hasta tu destino final.`,
    ],
    faq: (a, b, dur, fare) => [
      [`¿Cuánto tarda el tren de ${a} a ${b}?`, `Tarda ${dur} en el servicio de alta velocidad. Es un rango aproximado — el tiempo exacto depende del tren y las paradas, así que consulta Korail/SRT para tu fecha.`],
      [`¿Cuánto cuesta el billete de ${a} a ${b}?`, `Un billete de ida cuesta aproximadamente ${fare}. Varía según la clase y la antelación; es un rango aproximado, no un precio en vivo.`],
      [`¿Hay que reservar de ${a} a ${b} con antelación?`, `Para fines de semana y festivos, reserva con unos días en la app de Korail o SRT. Entre semana fuera de hora punta suele bastar comprarlo el mismo día.`],
    ],
    relatedH: '🔗 Planifica tu viaje',
  },
  ko: {
    hub: '이동', dir: '한국 도시 간 노선',
    title: (a, b) => `${a}→${b} 가는 법: KTX/SRT 가이드 (2026) | KoreaPlus`,
    metaDesc: (a, b) => `한국 ${a}에서 ${b} 가는 법: KTX/SRT 대략 소요시간·요금 범위·운행 빈도·이용역 안내. 수치는 대략값(코레일/SRT 확인). 2026 업데이트.`,
    h1: (a, b) => `${a} → ${b} 가는 법`,
    lead: (a, b, m) => `${a}에서 ${b}로 이동하시나요? 이 가이드는 실용적인 ${m} 기준으로 대략적인 소요시간, 편도 요금 범위, 운행 빈도, 탑승역을 정리했습니다. 시간과 요금은 대략적인 범위이며 실시간 시각표가 아닙니다 — 출발 전 코레일(코레일톡) 또는 SRT 앱에서 반드시 확인하세요.`,
    modeWord: { KTX: 'KTX 고속열차', SRT: 'SRT 고속열차', bus: '고속버스' },
    durLabel: '소요시간', fareLabel: '요금(편도)', freqLabel: '운행 빈도', stationLabel: '역', modeLabel: '교통수단',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: '소요시간과 요금은 계획용 대략 범위이며 정확한 시각표나 실시간 가격이 아닙니다. 코레일·SRT는 계절마다 시각·요금을 조정하므로 예매 전 공식 앱에서 확인하세요.',
    bookH: '🎫 예매 방법',
    bookBody: 'KTX는 공식 코레일(코레일톡) 앱·웹에서, SRT는 SRT 앱에서 예매합니다. 주말·공휴일은 며칠 전 예매를 권장합니다. 역 발권기·창구에서도 구매할 수 있습니다. 양쪽 지하철·버스 환승은 T-money 카드로 해결됩니다.',
    stepsH: '🧭 가는 순서',
    steps: (a, b, st) => [
      `${a}의 출발역(${st})으로 이동합니다.`,
      `${b} 방면 고속열차에 탑승합니다. 혼잡 시간대에는 지정 좌석 예매를 권장합니다.`,
      `${b} 역 도착 후 지하철·버스·택시로 환승해 최종 목적지로 이동합니다.`,
    ],
    faq: (a, b, dur, fare) => [
      [`${a}에서 ${b}까지 열차로 얼마나 걸리나요?`, `고속열차로 ${dur} 걸립니다. 대략적인 범위이며 열차·정차역 수에 따라 달라지므로 날짜별로 코레일/SRT에서 확인하세요.`],
      [`${a}–${b} 요금은 얼마인가요?`, `편도 약 ${fare}입니다. 좌석 등급과 예매 시점에 따라 달라지는 대략 범위이며 실시간 가격이 아닙니다.`],
      [`${a}–${b}는 미리 예매해야 하나요?`, `주말·공휴일은 코레일 또는 SRT 앱에서 며칠 전 예매하세요. 평일 비혼잡 시간대는 당일 구매도 대체로 무방합니다.`],
    ],
    relatedH: '🔗 여행 계획',
  },
  fr: {
    hub: 'Se déplacer', dir: 'Lignes intervilles de Corée',
    title: (a, b) => `De ${a} à ${b} : guide train KTX/SRT (2026) | KoreaPlus`,
    metaDesc: (a, b) => `Comment aller de ${a} à ${b} en Corée : durée approximative en KTX/SRT, fourchette de prix, fréquence et gare. Chiffres approximatifs — vérifiez sur Korail/SRT. Mis à jour 2026.`,
    h1: (a, b) => `De ${a} à ${b} : comment s'y rendre`,
    lead: (a, b, m) => `Vous allez de ${a} à ${b} ? Ce guide couvre l'option pratique en ${m} : durée approximative, fourchette de prix aller simple, fréquence des services et gare de départ. Les durées et prix sont des fourchettes approximatives, pas des horaires en temps réel — vérifiez toujours sur l'appli Korail (Korail Talk) ou SRT avant de partir.`,
    modeWord: { KTX: 'train à grande vitesse KTX', SRT: 'train à grande vitesse SRT', bus: 'bus express' },
    durLabel: 'Durée', fareLabel: 'Prix (aller)', freqLabel: 'Fréquence', stationLabel: 'Gares', modeLabel: 'Mode',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: 'Les durées et prix sont des fourchettes approximatives, à titre indicatif seulement — pas des horaires exacts ni des prix en temps réel. Korail et SRT ajustent horaires et tarifs selon la saison ; vérifiez sur l\'appli officielle avant de réserver.',
    bookH: '🎫 Comment réserver',
    bookBody: 'Réservez les trains KTX sur l\'appli ou le site officiel Korail (Korail Talk) et les SRT sur l\'appli SRT — réservez quelques jours à l\'avance pour les week-ends et jours fériés. Achat également possible aux bornes ou guichets en gare. Une carte T-money couvre le métro et le bus locaux aux deux extrémités.',
    stepsH: '🧭 Étape par étape',
    steps: (a, b, st) => [
      `Rendez-vous à la gare de départ de ${a} (${st}).`,
      `Montez dans le train à grande vitesse réservé vers ${b} ; un siège réservé est conseillé aux heures de pointe.`,
      `À l'arrivée en gare de ${b}, prenez le métro, le bus ou un taxi local jusqu'à votre destination finale.`,
    ],
    faq: (a, b, dur, fare) => [
      [`Combien de temps dure le train de ${a} à ${b} ?`, `Comptez ${dur} en service à grande vitesse. C'est une fourchette approximative — la durée exacte dépend du train et des arrêts, vérifiez sur Korail/SRT pour votre date.`],
      [`Quel est le prix de ${a} à ${b} ?`, `Un aller simple coûte environ ${fare}. Cela varie selon la classe et l'anticipation ; c'est une fourchette approximative, pas un prix en temps réel.`],
      [`Faut-il réserver ${a}–${b} à l'avance ?`, `Pour les week-ends et jours fériés, réservez quelques jours avant sur l'appli Korail ou SRT. En semaine hors pointe, l'achat le jour même convient généralement.`],
    ],
    relatedH: '🔗 Planifiez votre voyage',
  },
  de: {
    hub: 'Mobilität', dir: 'Korea Intercity-Strecken',
    title: (a, b) => `Von ${a} nach ${b}: KTX/SRT-Zugguide (2026) | KoreaPlus`,
    metaDesc: (a, b) => `Von ${a} nach ${b} in Korea: ungefähre KTX/SRT-Fahrzeit, Preisspanne, Frequenz und Bahnhof. Ungefähre Angaben — auf Korail/SRT prüfen. Aktualisiert 2026.`,
    h1: (a, b) => `Von ${a} nach ${b}: So kommst du hin`,
    lead: (a, b, m) => `Du fährst von ${a} nach ${b}? Dieser Guide behandelt die praktische ${m}-Option: ungefähre Fahrzeit, Preisspanne für die einfache Fahrt, Taktung und Abfahrtsbahnhof. Zeiten und Preise sind ungefähre Spannen, keine Echtzeit-Fahrpläne — prüfe vor der Fahrt immer die Korail- (Korail Talk) oder SRT-App.`,
    modeWord: { KTX: 'KTX-Hochgeschwindigkeitszug', SRT: 'SRT-Hochgeschwindigkeitszug', bus: 'Expressbus' },
    durLabel: 'Fahrzeit', fareLabel: 'Preis (einfach)', freqLabel: 'Frequenz', stationLabel: 'Bahnhöfe', modeLabel: 'Verkehrsmittel',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: 'Fahrzeiten und Preise sind ungefähre Spannen, nur zur Planung — keine exakten Fahrpläne oder Echtzeitpreise. Korail und SRT passen Fahrplan und Tarife saisonal an; prüfe vor der Buchung die offizielle App.',
    bookH: '🎫 So buchst du',
    bookBody: 'Buche KTX-Züge in der offiziellen Korail- (Korail Talk) App oder Website und SRT-Züge in der SRT-App — für Wochenenden und Feiertage einige Tage im Voraus reservieren. Kauf auch am Automaten oder Schalter im Bahnhof möglich. Eine T-money-Karte deckt U-Bahn und Bus an beiden Enden ab.',
    stepsH: '🧭 Schritt für Schritt',
    steps: (a, b, st) => [
      `Begib dich zum Abfahrtsbahnhof in ${a} (${st}).`,
      `Steig in den gebuchten Hochgeschwindigkeitszug Richtung ${b}; zu Stoßzeiten ist ein reservierter Sitzplatz ratsam.`,
      `Am Bahnhof ${b} angekommen, steig auf U-Bahn, Bus oder Taxi zum Endziel um.`,
    ],
    faq: (a, b, dur, fare) => [
      [`Wie lange dauert der Zug von ${a} nach ${b}?`, `Im Hochgeschwindigkeitsverkehr etwa ${dur}. Das ist eine ungefähre Spanne — die genaue Zeit hängt von Zug und Halten ab, prüfe Korail/SRT für dein Datum.`],
      [`Was kostet ${a} nach ${b}?`, `Eine einfache Fahrt kostet rund ${fare}. Je nach Klasse und Vorlaufzeit variabel; eine ungefähre Spanne, kein Echtzeitpreis.`],
      [`Muss man ${a}–${b} im Voraus buchen?`, `Für Wochenenden und Feiertage einige Tage vorher in der Korail- oder SRT-App reservieren. Werktags außerhalb der Stoßzeit reicht meist der Kauf am selben Tag.`],
    ],
    relatedH: '🔗 Reise planen',
  },
  pt: {
    hub: 'Como circular', dir: 'Rotas intercidades da Coreia',
    title: (a, b) => `De ${a} a ${b}: guia de comboio KTX/SRT (2026) | KoreaPlus`,
    metaDesc: (a, b) => `Como ir de ${a} a ${b} na Coreia: tempo aproximado de KTX/SRT, faixa de preço, frequência e estação. Valores aproximados — confirme na Korail/SRT. Atualizado 2026.`,
    h1: (a, b) => `De ${a} a ${b}: como chegar`,
    lead: (a, b, m) => `Vai de ${a} para ${b}? Este guia cobre a opção prática de ${m}: tempo aproximado, faixa de preço de ida, frequência dos serviços e estação de embarque. Tempos e preços são faixas aproximadas, não horários ao vivo — confirme sempre na app da Korail (Korail Talk) ou SRT antes de viajar.`,
    modeWord: { KTX: 'comboio de alta velocidade KTX', SRT: 'comboio de alta velocidade SRT', bus: 'autocarro expresso' },
    durLabel: 'Duração', fareLabel: 'Preço (ida)', freqLabel: 'Frequência', stationLabel: 'Estações', modeLabel: 'Meio',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: 'Tempos e preços são faixas aproximadas apenas para planeamento — não horários exatos nem preços ao vivo. A Korail e a SRT ajustam horários e tarifas por época; confirme na app oficial antes de reservar.',
    bookH: '🎫 Como reservar',
    bookBody: 'Reserve os comboios KTX na app ou site oficial da Korail (Korail Talk) e os SRT na app SRT — reserve com alguns dias de antecedência para fins de semana e feriados. Também pode comprar em qualquer máquina ou bilheteira da estação. Um cartão T-money cobre o metro e o autocarro locais nas duas pontas.',
    stepsH: '🧭 Passo a passo',
    steps: (a, b, st) => [
      `Dirija-se à estação de partida de ${a} (${st}).`,
      `Embarque no comboio de alta velocidade reservado para ${b}; lugar marcado é recomendado nas horas de ponta.`,
      `Ao chegar à estação de ${b}, faça baldeação para metro, autocarro ou táxi local até ao destino final.`,
    ],
    faq: (a, b, dur, fare) => [
      [`Quanto tempo demora o comboio de ${a} a ${b}?`, `Demora ${dur} no serviço de alta velocidade. É uma faixa aproximada — o tempo exato depende do comboio e das paragens, por isso confirme na Korail/SRT para a sua data.`],
      [`Quanto custa o bilhete de ${a} a ${b}?`, `Um bilhete de ida custa cerca de ${fare}. Varia conforme a classe e a antecedência; é uma faixa aproximada, não um preço ao vivo.`],
      [`É preciso reservar ${a}–${b} com antecedência?`, `Para fins de semana e feriados, reserve com alguns dias na app da Korail ou SRT. Em dias úteis fora de ponta, comprar no próprio dia costuma chegar.`],
    ],
    relatedH: '🔗 Planeie a sua viagem',
  },
  id: {
    hub: 'Transportasi', dir: 'Rute antarkota Korea',
    title: (a, b) => `${a} ke ${b}: Panduan KTX/SRT (2026) | KoreaPlus`,
    metaDesc: (a, b) => `Cara dari ${a} ke ${b} di Korea: perkiraan waktu KTX/SRT, kisaran tarif, frekuensi, dan stasiun. Angka perkiraan — cek di Korail/SRT. Diperbarui 2026.`,
    h1: (a, b) => `${a} ke ${b}: Cara ke Sana`,
    lead: (a, b, m) => `Bepergian dari ${a} ke ${b}? Panduan ini membahas opsi ${m} yang praktis: perkiraan lama perjalanan, kisaran tarif sekali jalan, seberapa sering layanan beroperasi, dan stasiun keberangkatan. Waktu dan tarif adalah kisaran perkiraan, bukan jadwal langsung — selalu konfirmasi di aplikasi Korail (Korail Talk) atau SRT sebelum berangkat.`,
    modeWord: { KTX: 'kereta cepat KTX', SRT: 'kereta cepat SRT', bus: 'bus ekspres' },
    durLabel: 'Lama', fareLabel: 'Tarif (sekali jalan)', freqLabel: 'Frekuensi', stationLabel: 'Stasiun', modeLabel: 'Moda',
    factDur: d => `⏱️ ${d}`, factFare: f => `💵 ${f}`, factFreq: f => `🚆 ${f}`, factMode: m => `🚄 ${m}`,
    approxNote: 'Waktu dan tarif adalah kisaran perkiraan hanya untuk perencanaan — bukan jadwal pasti atau harga langsung. Korail dan SRT menyesuaikan jadwal dan tarif per musim; konfirmasi di aplikasi resmi sebelum memesan.',
    bookH: '🎫 Cara memesan',
    bookBody: 'Pesan kereta KTX di aplikasi atau situs resmi Korail (Korail Talk) dan kereta SRT di aplikasi SRT — pesan beberapa hari sebelumnya untuk akhir pekan dan hari libur. Bisa juga beli di mesin tiket atau loket stasiun mana pun. Kartu T-money mencakup subway dan bus lokal di kedua ujung.',
    stepsH: '🧭 Langkah demi langkah',
    steps: (a, b, st) => [
      `Menuju stasiun keberangkatan ${a} (${st}).`,
      `Naik kereta cepat yang dipesan menuju ${b}; kursi terpesan disarankan pada jam sibuk.`,
      `Setibanya di stasiun ${b}, lanjutkan dengan subway, bus, atau taksi lokal ke tujuan akhir.`,
    ],
    faq: (a, b, dur, fare) => [
      [`Berapa lama kereta ${a} ke ${b}?`, `Sekitar ${dur} dengan layanan kereta cepat. Ini kisaran perkiraan — waktu pastinya bergantung pada kereta dan jumlah perhentian, jadi cek Korail/SRT untuk tanggal Anda.`],
      [`Berapa tarif ${a} ke ${b}?`, `Tiket sekali jalan sekitar ${fare}. Bervariasi menurut kelas kursi dan seberapa awal memesan; ini kisaran perkiraan, bukan harga langsung.`],
      [`Apakah perlu memesan ${a}–${b} jauh hari?`, `Untuk akhir pekan dan hari libur, pesan beberapa hari sebelumnya di aplikasi Korail atau SRT. Hari kerja di luar jam sibuk biasanya cukup beli pada hari-H.`],
    ],
    relatedH: '🔗 Rencanakan perjalanan',
  },
};

module.exports = { T, DURATION_WORDS };
