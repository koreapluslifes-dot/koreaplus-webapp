/* ══════════════════════════════════════════════════════════════════
   seo-kpop-bmonth-l10n.js — i18n strings for the "K-pop idols born in
   <month>" generator (modules/seo-kpop-bmonth.cjs).

   14 languages: en + ko/ja/zh/es/fr/de/pt/id + ar/hi/ru/vi/th. The last five
   are K-pop-only; the travel channels stay at 9. Pure data (CommonJS export);
   no build-seo coupling. Month NAMES are localized per language (12 each).
   Functional strings (title/lead/h2/faq) take the localized month name.

   modules/seo-kpop-year.cjs also imports MONTH_NAMES from here, so a language
   dropped from that map silently disappears from the year pages too.

   Kept separate from messages/*.json (14-lang UI strings) by contract.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// Localized month display names, index 0 (January) … 11 (December).
const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्तूबर', 'नवंबर', 'दिसंबर'],
  ru: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  vi: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
};

// Russian months arrive nominative (the year generator prints them bare in a
// stat box); every sentence here needs the prepositional "в январе". Deriving
// the form beats forking the canonical list into a second, drift-prone copy.
const RU_IN_MONTH = {
  январь: 'январе', февраль: 'феврале', март: 'марте', апрель: 'апреле',
  май: 'мае', июнь: 'июне', июль: 'июле', август: 'августе',
  сентябрь: 'сентябре', октябрь: 'октябре', ноябрь: 'ноябре', декабрь: 'декабре',
};
const ruIn = (m) => RU_IN_MONTH[m] || m;

// MONTH_NAMES.vi is locked to "Tháng 3" — correct standing alone (chips, the
// month link list) but wrong mid-sentence, where Vietnamese writes "tháng 3".
// Lowercasing at the call site keeps the canonical list untouched.
const viLow = (m) => String(m).replace(/^Tháng /, 'tháng ');

// Functional templates. {m} = localized month name. All hand-translated.
const T = {
  en: {
    h1: (m) => `K-pop idols born in ${m}`,
    title: (m) => `K-pop Idols Born in ${m} — Birthdays by Group | KoreaPlus`,
    desc: (m) => `Which K-pop idols have a birthday in ${m}? A verified list of idols and their groups born this month, with exact birth dates.`,
    lead: (m) => `Celebrating a birthday in ${m}? Here are the K-pop idols born this month — each entry shows the idol, their group and their exact birth date, joined from our roster data.`,
    badge: 'Birthdays',
    listH: (m, n) => `🎂 ${n} idols born in ${m}`,
    none: (m) => `No idols in our current roster have a birthday in ${m}. Browse the other months below.`,
    monthsH: '📅 Birthdays by month',
    col: { idol: 'Idol', group: 'Group', date: 'Birth date' },
    faqH: '❓ FAQ',
    q1: (m) => `Which K-pop idols were born in ${m}?`,
    a1: (m, names) => `Idols in our roster born in ${m} include ${names}. Each idol's group and exact date are listed above.`,
    q2: (m) => `How is the ${m} birthday list compiled?`,
    a2: () => `Every birthday comes from our verified artist roster — we only list dates we can confirm, joined to each idol's group. Nothing is estimated.`,
    relH: '🎤 Explore more',
    hubLabel: '🎤 K-Pop Hub',
    browseLabel: '📚 Browse all K-Pop',
  },
  ko: {
    h1: (m) => `${m}생 K-pop 아이돌`,
    title: (m) => `${m}생 K-pop 아이돌 — 그룹별 생일 모음 | KoreaPlus`,
    desc: (m) => `${m}에 생일인 K-pop 아이돌은 누구일까요? 이번 달에 태어난 아이돌과 소속 그룹, 정확한 생년월일을 정리했습니다.`,
    lead: (m) => `${m} 생일을 맞은 아이돌이 궁금하신가요? 이번 달에 태어난 K-pop 아이돌을 정리했습니다 — 아이돌, 소속 그룹, 정확한 생년월일을 로스터 데이터에서 직접 연결했습니다.`,
    badge: '생일',
    listH: (m, n) => `🎂 ${m}생 아이돌 ${n}명`,
    none: (m) => `현재 로스터에는 ${m}에 생일인 아이돌이 없습니다. 아래에서 다른 달을 둘러보세요.`,
    monthsH: '📅 월별 생일',
    col: { idol: '아이돌', group: '그룹', date: '생년월일' },
    faqH: '❓ 자주 묻는 질문',
    q1: (m) => `${m}에 태어난 K-pop 아이돌은 누구인가요?`,
    a1: (m, names) => `로스터 기준 ${m}생 아이돌로는 ${names} 등이 있습니다. 각 아이돌의 그룹과 정확한 생일은 위 표에 있습니다.`,
    q2: (m) => `${m} 생일 목록은 어떻게 만들어졌나요?`,
    a2: () => `모든 생일은 검증된 아티스트 로스터에서 가져왔습니다 — 확인 가능한 날짜만 각 아이돌의 그룹과 연결해 표기했으며, 추정치는 없습니다.`,
    relH: '🎤 더 둘러보기',
    hubLabel: '🎤 K-Pop 허브',
    browseLabel: '📚 K-Pop 전체 둘러보기',
  },
  ja: {
    h1: (m) => `${m}生まれのK-POPアイドル`,
    title: (m) => `${m}生まれのK-POPアイドル — グループ別の誕生日 | KoreaPlus`,
    desc: (m) => `${m}が誕生日のK-POPアイドルは誰？今月生まれのアイドルと所属グループ、正確な生年月日をまとめました。`,
    lead: (m) => `${m}に誕生日を迎えるアイドルは誰でしょう？今月生まれのK-POPアイドルをまとめました — アイドル名・所属グループ・正確な生年月日をロスターデータから直接つなげています。`,
    badge: '誕生日',
    listH: (m, n) => `🎂 ${m}生まれのアイドル${n}人`,
    none: (m) => `現在のロスターには${m}が誕生日のアイドルはいません。下から他の月をご覧ください。`,
    monthsH: '📅 月別の誕生日',
    col: { idol: 'アイドル', group: 'グループ', date: '生年月日' },
    faqH: '❓ よくある質問',
    q1: (m) => `${m}生まれのK-POPアイドルは誰ですか？`,
    a1: (m, names) => `ロスター上で${m}生まれのアイドルには${names}などがいます。各アイドルのグループと正確な誕生日は上の表をご覧ください。`,
    q2: (m) => `${m}の誕生日リストはどう作られていますか？`,
    a2: () => `すべての誕生日は検証済みのアーティストロスターから取得しています — 確認できる日付のみを各アイドルのグループと結び付けて掲載し、推定値はありません。`,
    relH: '🎤 もっと見る',
    hubLabel: '🎤 K-POPハブ',
    browseLabel: '📚 K-POPをすべて見る',
  },
  zh: {
    h1: (m) => `${m}出生的 K-pop 偶像`,
    title: (m) => `${m}出生的 K-pop 偶像 — 按团体看生日 | KoreaPlus`,
    desc: (m) => `哪些 K-pop 偶像在${m}过生日？本月出生的偶像、所属团体与确切生日一览。`,
    lead: (m) => `想知道哪些偶像在${m}过生日？这里整理了本月出生的 K-pop 偶像 —— 每条都列出偶像、所属团体与确切生日，数据来自我们的艺人名册。`,
    badge: '生日',
    listH: (m, n) => `🎂 ${m}出生的偶像 ${n} 位`,
    none: (m) => `当前名册中没有在${m}过生日的偶像。请在下方浏览其他月份。`,
    monthsH: '📅 按月份看生日',
    col: { idol: '偶像', group: '团体', date: '生日' },
    faqH: '❓ 常见问题',
    q1: (m) => `哪些 K-pop 偶像在${m}出生？`,
    a1: (m, names) => `名册中${m}出生的偶像包括${names}等。各偶像的团体与确切生日见上表。`,
    q2: (m) => `${m}的生日名单是怎么整理的？`,
    a2: () => `所有生日均来自我们核实过的艺人名册 —— 仅列出可确认的日期，并与各偶像的团体关联，没有任何估算。`,
    relH: '🎤 探索更多',
    hubLabel: '🎤 K-pop 中心',
    browseLabel: '📚 浏览全部 K-pop',
  },
  es: {
    h1: (m) => `Ídolos del K-pop nacidos en ${m}`,
    title: (m) => `Ídolos del K-pop nacidos en ${m} — Cumpleaños por grupo | KoreaPlus`,
    desc: (m) => `¿Qué ídolos del K-pop cumplen años en ${m}? Lista verificada de ídolos y sus grupos nacidos este mes, con fechas exactas.`,
    lead: (m) => `¿Quién cumple años en ${m}? Aquí están los ídolos del K-pop nacidos este mes — cada entrada muestra al ídolo, su grupo y su fecha de nacimiento exacta, según nuestros datos.`,
    badge: 'Cumpleaños',
    listH: (m, n) => `🎂 ${n} ídolos nacidos en ${m}`,
    none: (m) => `Ningún ídolo de nuestra lista actual cumple años en ${m}. Explora los demás meses abajo.`,
    monthsH: '📅 Cumpleaños por mes',
    col: { idol: 'Ídolo', group: 'Grupo', date: 'Fecha de nacimiento' },
    faqH: '❓ Preguntas frecuentes',
    q1: (m) => `¿Qué ídolos del K-pop nacieron en ${m}?`,
    a1: (m, names) => `Entre los ídolos de nuestra lista nacidos en ${m} están ${names}. El grupo y la fecha exacta de cada uno aparecen arriba.`,
    q2: (m) => `¿Cómo se elabora la lista de cumpleaños de ${m}?`,
    a2: () => `Cada cumpleaños proviene de nuestra lista verificada de artistas — solo incluimos fechas que podemos confirmar, vinculadas al grupo de cada ídolo. Nada se estima.`,
    relH: '🎤 Explora más',
    hubLabel: '🎤 Centro K-pop',
    browseLabel: '📚 Explora todo el K-pop',
  },
  fr: {
    h1: (m) => `Idoles K-pop nées en ${m}`,
    title: (m) => `Idoles K-pop nées en ${m} — Anniversaires par groupe | KoreaPlus`,
    desc: (m) => `Quelles idoles K-pop fêtent leur anniversaire en ${m} ? Liste vérifiée des idoles et de leurs groupes nés ce mois-ci, avec dates exactes.`,
    lead: (m) => `Qui fête son anniversaire en ${m} ? Voici les idoles K-pop nées ce mois-ci — chaque entrée indique l'idole, son groupe et sa date de naissance exacte, d'après nos données.`,
    badge: 'Anniversaires',
    listH: (m, n) => `🎂 ${n} idoles nées en ${m}`,
    none: (m) => `Aucune idole de notre liste actuelle n'est née en ${m}. Découvrez les autres mois ci-dessous.`,
    monthsH: '📅 Anniversaires par mois',
    col: { idol: 'Idole', group: 'Groupe', date: 'Date de naissance' },
    faqH: '❓ FAQ',
    q1: (m) => `Quelles idoles K-pop sont nées en ${m} ?`,
    a1: (m, names) => `Parmi les idoles de notre liste nées en ${m} figurent ${names}. Le groupe et la date exacte de chacune sont indiqués ci-dessus.`,
    q2: (m) => `Comment la liste des anniversaires de ${m} est-elle établie ?`,
    a2: () => `Chaque anniversaire provient de notre liste d'artistes vérifiée — nous n'indiquons que des dates confirmées, reliées au groupe de chaque idole. Rien n'est estimé.`,
    relH: '🎤 Explorer plus',
    hubLabel: '🎤 Hub K-pop',
    browseLabel: '📚 Explorer tout le K-pop',
  },
  de: {
    h1: (m) => `K-Pop-Idole, geboren im ${m}`,
    title: (m) => `K-Pop-Idole, geboren im ${m} — Geburtstage nach Gruppe | KoreaPlus`,
    desc: (m) => `Welche K-Pop-Idole haben im ${m} Geburtstag? Eine geprüfte Liste der in diesem Monat geborenen Idole und ihrer Gruppen, mit genauen Geburtsdaten.`,
    lead: (m) => `Wer hat im ${m} Geburtstag? Hier sind die in diesem Monat geborenen K-Pop-Idole — jeder Eintrag zeigt das Idol, seine Gruppe und das genaue Geburtsdatum, verknüpft aus unseren Daten.`,
    badge: 'Geburtstage',
    listH: (m, n) => `🎂 ${n} Idole, geboren im ${m}`,
    none: (m) => `Kein Idol in unserer aktuellen Liste hat im ${m} Geburtstag. Entdecke unten die anderen Monate.`,
    monthsH: '📅 Geburtstage nach Monat',
    col: { idol: 'Idol', group: 'Gruppe', date: 'Geburtsdatum' },
    faqH: '❓ FAQ',
    q1: (m) => `Welche K-Pop-Idole wurden im ${m} geboren?`,
    a1: (m, names) => `Zu den im ${m} geborenen Idolen unserer Liste gehören ${names}. Gruppe und genaues Datum stehen jeweils oben.`,
    q2: (m) => `Wie wird die Geburtstagsliste für den ${m} erstellt?`,
    a2: () => `Jeder Geburtstag stammt aus unserer geprüften Künstlerliste — wir führen nur bestätigte Daten auf, verknüpft mit der Gruppe jedes Idols. Nichts wird geschätzt.`,
    relH: '🎤 Mehr entdecken',
    hubLabel: '🎤 K-Pop-Hub',
    browseLabel: '📚 Alle K-Pop entdecken',
  },
  pt: {
    h1: (m) => `Ídolos do K-pop nascidos em ${m}`,
    title: (m) => `Ídolos do K-pop nascidos em ${m} — Aniversários por grupo | KoreaPlus`,
    desc: (m) => `Quais ídolos do K-pop fazem aniversário em ${m}? Lista verificada de ídolos e seus grupos nascidos neste mês, com datas exatas.`,
    lead: (m) => `Quem faz aniversário em ${m}? Aqui estão os ídolos do K-pop nascidos neste mês — cada entrada mostra o ídolo, seu grupo e a data de nascimento exata, a partir dos nossos dados.`,
    badge: 'Aniversários',
    listH: (m, n) => `🎂 ${n} ídolos nascidos em ${m}`,
    none: (m) => `Nenhum ídolo da nossa lista atual nasceu em ${m}. Explore os outros meses abaixo.`,
    monthsH: '📅 Aniversários por mês',
    col: { idol: 'Ídolo', group: 'Grupo', date: 'Data de nascimento' },
    faqH: '❓ Perguntas frequentes',
    q1: (m) => `Quais ídolos do K-pop nasceram em ${m}?`,
    a1: (m, names) => `Entre os ídolos da nossa lista nascidos em ${m} estão ${names}. O grupo e a data exata de cada um aparecem acima.`,
    q2: (m) => `Como a lista de aniversários de ${m} é montada?`,
    a2: () => `Cada aniversário vem da nossa lista de artistas verificada — só listamos datas que podemos confirmar, ligadas ao grupo de cada ídolo. Nada é estimado.`,
    relH: '🎤 Explorar mais',
    hubLabel: '🎤 Hub de K-pop',
    browseLabel: '📚 Explorar todo o K-pop',
  },
  id: {
    h1: (m) => `Idol K-pop yang lahir di bulan ${m}`,
    title: (m) => `Idol K-pop Lahir di ${m} — Ulang Tahun per Grup | KoreaPlus`,
    desc: (m) => `Idol K-pop mana yang berulang tahun di ${m}? Daftar terverifikasi idol dan grupnya yang lahir bulan ini, lengkap dengan tanggal pasti.`,
    lead: (m) => `Siapa yang berulang tahun di ${m}? Inilah para idol K-pop yang lahir bulan ini — setiap entri menampilkan idol, grupnya, dan tanggal lahir pastinya, dari data roster kami.`,
    badge: 'Ulang Tahun',
    listH: (m, n) => `🎂 ${n} idol lahir di ${m}`,
    none: (m) => `Tidak ada idol dalam roster kami saat ini yang lahir di ${m}. Jelajahi bulan lain di bawah.`,
    monthsH: '📅 Ulang tahun per bulan',
    col: { idol: 'Idol', group: 'Grup', date: 'Tanggal lahir' },
    faqH: '❓ Tanya Jawab',
    q1: (m) => `Idol K-pop mana yang lahir di ${m}?`,
    a1: (m, names) => `Idol dalam roster kami yang lahir di ${m} antara lain ${names}. Grup dan tanggal pasti tiap idol tercantum di atas.`,
    q2: (m) => `Bagaimana daftar ulang tahun ${m} disusun?`,
    a2: () => `Setiap ulang tahun berasal dari roster artis kami yang terverifikasi — kami hanya mencantumkan tanggal yang bisa dipastikan, terhubung ke grup tiap idol. Tidak ada yang diperkirakan.`,
    relH: '🎤 Jelajahi lainnya',
    hubLabel: '🎤 Hub K-pop',
    browseLabel: '📚 Jelajahi semua K-pop',
  },
  // Arabic strings are written in LOGICAL order (emoji first, pipe last) and
  // rendered by dir="rtl"; hand-reversing them would break the display.
  // Counts follow the noun (عدد النجوم: n) because Arabic governs a counted
  // noun five different ways — an English count ternary is wrong for four.
  // A music group is فرقة; فريق is a sports team or a work crew. The whole ar
  // cluster (member, zodiac, cnzodiac, vs, agency pages) says الفرقة, so these
  // pages must too — the desc already did, which made the block contradict
  // itself one line apart.
  ar: {
    h1: (m) => `نجوم K-Pop المولودون في ${m}`,
    title: (m) => `نجوم K-Pop المولودون في ${m} — أعياد الميلاد حسب الفرقة | KoreaPlus`,
    desc: (m) => `مَن هم نجوم K-Pop الذين يحتفلون بعيد ميلادهم في ${m}؟ قائمة موثَّقة بالنجوم وفرقهم ممن وُلدوا في هذا الشهر، مع تواريخ الميلاد الدقيقة.`,
    lead: (m) => `هل يحتفل أحدهم بعيد ميلاده في ${m}؟ إليك نجوم K-Pop المولودين في هذا الشهر — يعرض كل سطر اسم النجم وفرقته وتاريخ ميلاده الدقيق كما ورد في قائمتنا.`,
    badge: 'أعياد الميلاد',
    listH: (m, n) => `🎂 مواليد ${m} — عدد النجوم: ${n}`,
    none: (m) => `لا يوجد في قائمتنا الحالية أي نجم من مواليد ${m}. تصفَّح الأشهر الأخرى أدناه.`,
    monthsH: '📅 أعياد الميلاد حسب الشهر',
    col: { idol: 'النجم', group: 'الفرقة', date: 'تاريخ الميلاد' },
    faqH: '❓ الأسئلة الشائعة',
    q1: (m) => `مَن هم نجوم K-Pop المولودون في ${m}؟`,
    a1: (m, names) => `من نجوم قائمتنا المولودين في ${m}: ${names}. فرقة كل نجم وتاريخ ميلاده الدقيق مذكوران في الجدول أعلاه.`,
    q2: (m) => `كيف أُعِدَّت قائمة أعياد الميلاد في ${m}؟`,
    a2: () => `كل تاريخ ميلاد مأخوذ من قائمة الفنانين الموثَّقة لدينا — لا نذكر إلا التواريخ التي يمكننا تأكيدها، مرتبطةً بفرقة كل نجم. لا شيء مُقدَّر أو مُخمَّن.`,
    relH: '🎤 استكشف المزيد',
    hubLabel: '🎤 مركز K-Pop',
    browseLabel: '📚 تصفَّح كل ما يخص K-Pop',
  },
  hi: {
    h1: (m) => `${m} में जन्मे K-pop आइडल`,
    title: (m) => `${m} में जन्मे K-pop आइडल — ग्रुप के हिसाब से जन्मदिन | KoreaPlus`,
    desc: (m) => `${m} में किन K-pop आइडल का जन्मदिन आता है? इस महीने जन्मे आइडल, उनके ग्रुप और सही जन्म तिथि की वेरिफाइड लिस्ट।`,
    lead: (m) => `${m} में किसका जन्मदिन है? यहाँ इस महीने जन्मे K-pop आइडल हैं — हर पंक्ति में आइडल, उनका ग्रुप और सही जन्म तिथि है, जो हमारी आर्टिस्ट लिस्ट से जोड़ी गई है।`,
    badge: 'जन्मदिन',
    listH: (m, n) => `🎂 ${m} में जन्मे ${n} आइडल`,
    none: (m) => `हमारी मौजूदा लिस्ट में ${m} में जन्मा कोई आइडल नहीं है। नीचे बाकी महीने देखें।`,
    monthsH: '📅 महीने के हिसाब से जन्मदिन',
    col: { idol: 'आइडल', group: 'ग्रुप', date: 'जन्म तिथि' },
    faqH: '❓ आम सवाल',
    q1: (m) => `${m} में कौन-कौन से K-pop आइडल जन्मे थे?`,
    a1: (m, names) => `हमारी लिस्ट में ${m} में जन्मे आइडल में ${names} शामिल हैं। हर आइडल का ग्रुप और सही जन्म तिथि ऊपर दी गई है।`,
    q2: (m) => `${m} की जन्मदिन लिस्ट कैसे बनाई जाती है?`,
    a2: () => `हर जन्मदिन हमारी वेरिफाइड आर्टिस्ट लिस्ट से आता है — हम सिर्फ़ वही तारीखें देते हैं जिनकी पुष्टि हो सके, और उन्हें हर आइडल के ग्रुप से जोड़ते हैं। कुछ भी अनुमानित नहीं है।`,
    relH: '🎤 और एक्सप्लोर करें',
    hubLabel: '🎤 K-pop हब',
    browseLabel: '📚 सभी K-pop गाइड',
  },
  // Russian: gender is unknown per idol and the lists are mixed, so headings
  // stay on gender-free plural participles and the count goes after a colon —
  // "n айдол(а/ов)" would need three forms and a gendered participle for n=1.
  ru: {
    h1: (m) => `Айдолы K-pop, родившиеся в ${ruIn(m)}`,
    title: (m) => `Айдолы K-pop, родившиеся в ${ruIn(m)} — дни рождения по группам | KoreaPlus`,
    desc: (m) => `Кто из айдолов K-pop празднует день рождения в ${ruIn(m)}? Проверенный список айдолов и их групп, родившихся в этом месяце, с точными датами.`,
    lead: (m) => `Кто отмечает день рождения в ${ruIn(m)}? Вот айдолы K-pop, родившиеся в этом месяце — в каждой строке айдол, группа и точная дата рождения из нашего списка артистов.`,
    badge: 'Дни рождения',
    listH: (m, n) => `🎂 Айдолы, родившиеся в ${ruIn(m)}: ${n}`,
    none: (m) => `В нашем текущем списке нет айдолов, родившихся в ${ruIn(m)}. Ниже можно посмотреть другие месяцы.`,
    monthsH: '📅 Дни рождения по месяцам',
    col: { idol: 'Айдол', group: 'Группа', date: 'Дата рождения' },
    faqH: '❓ Частые вопросы',
    q1: (m) => `Кто из айдолов K-pop родился в ${ruIn(m)}?`,
    a1: (m, names) => `Среди айдолов нашего списка, родившихся в ${ruIn(m)}: ${names}. Группа и точная дата у каждого указаны выше.`,
    q2: (m) => `Как составлен список дней рождения за ${m}?`,
    a2: () => `Все даты взяты из нашего проверенного списка артистов — мы указываем только те, которые можем подтвердить, и связываем их с группой каждого айдола. Приблизительных дат нет.`,
    relH: '🎤 Смотрите также',
    hubLabel: '🎤 Центр K-pop',
    browseLabel: '📚 Весь K-pop',
  },
  // MONTH_NAMES.vi already carries "Tháng", so never prefix another "tháng";
  // mid-sentence it goes through viLow(). "sinh nhật" is a noun, so the lead
  // needs its verb — "Ai sinh nhật vào…" is missing one.
  vi: {
    h1: (m) => `Idol K-pop sinh vào ${viLow(m)}`,
    title: (m) => `Idol K-pop sinh vào ${viLow(m)} — Sinh nhật theo nhóm | KoreaPlus`,
    desc: (m) => `Idol K-pop nào có sinh nhật vào ${viLow(m)}? Danh sách đã xác minh gồm các idol sinh trong tháng này cùng nhóm của họ, kèm ngày sinh chính xác.`,
    lead: (m) => `Idol nào có sinh nhật trong ${viLow(m)}? Đây là những idol K-pop sinh trong tháng này — mỗi dòng cho biết idol, nhóm của họ và ngày sinh chính xác, lấy từ danh sách của chúng tôi.`,
    badge: 'Sinh nhật',
    listH: (m, n) => `🎂 ${n} idol sinh vào ${viLow(m)}`,
    none: (m) => `Không có idol nào trong danh sách hiện tại của chúng tôi sinh vào ${viLow(m)}. Xem các tháng khác bên dưới.`,
    monthsH: '📅 Sinh nhật theo tháng',
    col: { idol: 'Idol', group: 'Nhóm', date: 'Ngày sinh' },
    faqH: '❓ Câu hỏi thường gặp',
    q1: (m) => `Những idol K-pop nào sinh vào ${viLow(m)}?`,
    a1: (m, names) => `Trong danh sách của chúng tôi, idol sinh vào ${viLow(m)} có ${names}. Nhóm và ngày sinh chính xác của từng người đều có ở bảng trên.`,
    q2: (m) => `Danh sách sinh nhật ${viLow(m)} được lập như thế nào?`,
    a2: () => `Mọi ngày sinh đều lấy từ danh sách nghệ sĩ đã xác minh của chúng tôi — chúng tôi chỉ liệt kê những ngày có thể xác nhận, gắn với nhóm của từng idol. Không có số liệu nào là ước lượng.`,
    relH: '🎤 Khám phá thêm',
    hubLabel: '🎤 Trung tâm K-pop',
    browseLabel: '📚 Khám phá toàn bộ K-pop',
  },
  // Thai: MONTH_NAMES are bare nouns, so the template supplies เดือน; counts
  // are NOUN + NUMERAL + CLASSIFIER (คน for people) and never pluralised.
  th: {
    h1: (m) => `ไอดอล K-pop ที่เกิดเดือน${m}`,
    title: (m) => `ไอดอล K-pop ที่เกิดเดือน${m} — วันเกิดแยกตามวง | KoreaPlus`,
    desc: (m) => `ไอดอล K-pop คนไหนเกิดเดือน${m}บ้าง? รายชื่อไอดอลที่เกิดในเดือนนี้พร้อมชื่อวงและวันเกิดที่แน่นอน ตรวจสอบแล้วทุกรายการ`,
    lead: (m) => `ใครเกิดเดือน${m}บ้าง? นี่คือไอดอล K-pop ที่เกิดในเดือนนี้ — แต่ละแถวแสดงชื่อไอดอล ชื่อวง และวันเกิดที่แน่นอน ดึงมาจากรายชื่อศิลปินของเรา`,
    badge: 'วันเกิด',
    listH: (m, n) => `🎂 ไอดอลที่เกิดเดือน${m} ${n} คน`,
    none: (m) => `ยังไม่มีไอดอลในรายชื่อปัจจุบันของเราที่เกิดเดือน${m} ดูเดือนอื่นได้ที่ด้านล่าง`,
    monthsH: '📅 วันเกิดแยกตามเดือน',
    col: { idol: 'ไอดอล', group: 'วง', date: 'วันเกิด' },
    faqH: '❓ คำถามที่พบบ่อย',
    q1: (m) => `ไอดอล K-pop คนไหนเกิดเดือน${m}บ้าง?`,
    a1: (m, names) => `ไอดอลในรายชื่อของเราที่เกิดเดือน${m} ได้แก่ ${names} ชื่อวงและวันเกิดที่แน่นอนของแต่ละคนอยู่ในตารางด้านบน`,
    q2: (m) => `รายชื่อวันเกิดเดือน${m} รวบรวมมาอย่างไร?`,
    a2: () => `วันเกิดทุกรายการมาจากรายชื่อศิลปินที่เราตรวจสอบแล้ว — เราระบุเฉพาะวันที่ยืนยันได้ และเชื่อมกับวงของไอดอลแต่ละคน ไม่มีการประมาณค่า`,
    relH: '🎤 สำรวจเพิ่มเติม',
    hubLabel: '🎤 ศูนย์รวม K-pop',
    browseLabel: '📚 สำรวจ K-pop ทั้งหมด',
  },
};

module.exports = { MONTH_NAMES, T };
