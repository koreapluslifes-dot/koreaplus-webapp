/* ══════════════════════════════════════════════════════════════════
   seo-kpop-zodiac-l10n.js — i18n strings for modules/seo-kpop-zodiac.cjs
   (K-pop idols by Western star sign). 14 languages: en + ja/zh/es + ko/fr/de/pt/id
   + ar/hi/ru/vi/th. The last five are K-pop-only — the travel generators stay
   at 9 and must not pick them up from here. `ar` renders RTL: every string is
   written in LOGICAL order (start date first, emoji first) and the page shell
   supplies dir="rtl"; nothing here is hand-reversed.

   Pure data module — no build-seo coupling. Required directly by the
   generator (CommonJS). Keys are UI/templating chrome only; the idol facts
   themselves (names, groups, birthdates) come from the verified ROSTER /
   ENRICH data joins — never fabricated, never translated.

   Per-language object shape (all keys required for a language to be emitted):
     hub        : breadcrumb / nav label for the channel root ("K-pop")
     dir        : directory label "K-pop idols"
     signWord   : the word "star sign" / "zodiac sign"
     title(s)   : <title> builder  (s = {name, emoji} localized sign)
     metaDesc(s,n): meta description (n = member count)
     h1(s)      : page H1
     lead(s,n)  : intro paragraph
     traitsLabel: "Personality traits" chip-box heading word
     traits(key): trait phrase list for the 12 signs (objective archetype,
                  clearly framed as popular astrology, not claims about people)
     datesLabel : "Date range" label
     dateRange(key): localized Western sun-sign date span
     memberH    : section heading "Idols born under <sign>"
     col*       : table column headers (idol / group / birthday)
     factsH     : "Quick facts" heading
     factN/factGroups/factSigns : key-facts chip strings
     faq        : (s,n,examples) → [[q,a],...]  FAQ pairs
     astroNote  : one-line disclaimer that sun signs are popular astrology
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// Sign display (name + emoji) localized per language. Keys match
// ctx.derive.SIGNS keys. Emoji is shared (unicode). Order is canonical.
const SIGN_NAMES = {
  en: { aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces' },
  ja: { aries: '牡羊座', taurus: '牡牛座', gemini: '双子座', cancer: '蟹座', leo: '獅子座', virgo: '乙女座', libra: '天秤座', scorpio: '蠍座', sagittarius: '射手座', capricorn: '山羊座', aquarius: '水瓶座', pisces: '魚座' },
  zh: { aries: '白羊座', taurus: '金牛座', gemini: '双子座', cancer: '巨蟹座', leo: '狮子座', virgo: '处女座', libra: '天秤座', scorpio: '天蝎座', sagittarius: '射手座', capricorn: '摩羯座', aquarius: '水瓶座', pisces: '双鱼座' },
  es: { aries: 'Aries', taurus: 'Tauro', gemini: 'Géminis', cancer: 'Cáncer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Escorpio', sagittarius: 'Sagitario', capricorn: 'Capricornio', aquarius: 'Acuario', pisces: 'Piscis' },
  ko: { aries: '양자리', taurus: '황소자리', gemini: '쌍둥이자리', cancer: '게자리', leo: '사자자리', virgo: '처녀자리', libra: '천칭자리', scorpio: '전갈자리', sagittarius: '궁수자리', capricorn: '염소자리', aquarius: '물병자리', pisces: '물고기자리' },
  fr: { aries: 'Bélier', taurus: 'Taureau', gemini: 'Gémeaux', cancer: 'Cancer', leo: 'Lion', virgo: 'Vierge', libra: 'Balance', scorpio: 'Scorpion', sagittarius: 'Sagittaire', capricorn: 'Capricorne', aquarius: 'Verseau', pisces: 'Poissons' },
  de: { aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs', leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpio: 'Skorpion', sagittarius: 'Schütze', capricorn: 'Steinbock', aquarius: 'Wassermann', pisces: 'Fische' },
  pt: { aries: 'Áries', taurus: 'Touro', gemini: 'Gémeos', cancer: 'Caranguejo', leo: 'Leão', virgo: 'Virgem', libra: 'Balança', scorpio: 'Escorpião', sagittarius: 'Sagitário', capricorn: 'Capricórnio', aquarius: 'Aquário', pisces: 'Peixes' },
  id: { aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagitarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces' },
  // ar sign names carry the definite article; templates say "برج " + name and
  // must never add a second ال.
  ar: { aries: 'الحمل', taurus: 'الثور', gemini: 'الجوزاء', cancer: 'السرطان', leo: 'الأسد', virgo: 'العذراء', libra: 'الميزان', scorpio: 'العقرب', sagittarius: 'القوس', capricorn: 'الجدي', aquarius: 'الدلو', pisces: 'الحوت' },
  // hi names are bare rashi nouns — राशि lives in signWord and the sentence,
  // never inside the name, or the page reads "मेष राशि राशि".
  hi: { aries: 'मेष', taurus: 'वृषभ', gemini: 'मिथुन', cancer: 'कर्क', leo: 'सिंह', virgo: 'कन्या', libra: 'तुला', scorpio: 'वृश्चिक', sagittarius: 'धनु', capricorn: 'मकर', aquarius: 'कुंभ', pisces: 'मीन' },
  // ru names are nominative; «под знаком …» needs the genitive in RU_SIGN_GEN.
  ru: { aries: 'Овен', taurus: 'Телец', gemini: 'Близнецы', cancer: 'Рак', leo: 'Лев', virgo: 'Дева', libra: 'Весы', scorpio: 'Скорпион', sagittarius: 'Стрелец', capricorn: 'Козерог', aquarius: 'Водолей', pisces: 'Рыбы' },
  vi: { aries: 'Bạch Dương', taurus: 'Kim Ngưu', gemini: 'Song Tử', cancer: 'Cự Giải', leo: 'Sư Tử', virgo: 'Xử Nữ', libra: 'Thiên Bình', scorpio: 'Thiên Yết', sagittarius: 'Nhân Mã', capricorn: 'Ma Kết', aquarius: 'Bảo Bình', pisces: 'Song Ngư' },
  // th names already include the ราศี classifier; signWord is ราศี too, so
  // templates interpolate the name bare (ราศีราศีเมษ would be wrong).
  th: { aries: 'ราศีเมษ', taurus: 'ราศีพฤษภ', gemini: 'ราศีเมถุน', cancer: 'ราศีกรกฎ', leo: 'ราศีสิงห์', virgo: 'ราศีกันย์', libra: 'ราศีตุลย์', scorpio: 'ราศีพิจิก', sagittarius: 'ราศีธนู', capricorn: 'ราศีมังกร', aquarius: 'ราศีกุมภ์', pisces: 'ราศีมีน' },
};

// Western sun-sign date ranges (objective astronomical convention, matches
// ctx.derive.SIGNS table). Localized month wording.
const DATE_RANGES = {
  en: { aries: 'Mar 21 – Apr 19', taurus: 'Apr 20 – May 20', gemini: 'May 21 – Jun 20', cancer: 'Jun 21 – Jul 22', leo: 'Jul 23 – Aug 22', virgo: 'Aug 23 – Sep 22', libra: 'Sep 23 – Oct 22', scorpio: 'Oct 23 – Nov 21', sagittarius: 'Nov 22 – Dec 21', capricorn: 'Dec 22 – Jan 19', aquarius: 'Jan 20 – Feb 18', pisces: 'Feb 19 – Mar 20' },
  ja: { aries: '3月21日〜4月19日', taurus: '4月20日〜5月20日', gemini: '5月21日〜6月20日', cancer: '6月21日〜7月22日', leo: '7月23日〜8月22日', virgo: '8月23日〜9月22日', libra: '9月23日〜10月22日', scorpio: '10月23日〜11月21日', sagittarius: '11月22日〜12月21日', capricorn: '12月22日〜1月19日', aquarius: '1月20日〜2月18日', pisces: '2月19日〜3月20日' },
  zh: { aries: '3月21日–4月19日', taurus: '4月20日–5月20日', gemini: '5月21日–6月20日', cancer: '6月21日–7月22日', leo: '7月23日–8月22日', virgo: '8月23日–9月22日', libra: '9月23日–10月22日', scorpio: '10月23日–11月21日', sagittarius: '11月22日–12月21日', capricorn: '12月22日–1月19日', aquarius: '1月20日–2月18日', pisces: '2月19日–3月20日' },
  es: { aries: '21 mar – 19 abr', taurus: '20 abr – 20 may', gemini: '21 may – 20 jun', cancer: '21 jun – 22 jul', leo: '23 jul – 22 ago', virgo: '23 ago – 22 sep', libra: '23 sep – 22 oct', scorpio: '23 oct – 21 nov', sagittarius: '22 nov – 21 dic', capricorn: '22 dic – 19 ene', aquarius: '20 ene – 18 feb', pisces: '19 feb – 20 mar' },
  ko: { aries: '3월 21일 – 4월 19일', taurus: '4월 20일 – 5월 20일', gemini: '5월 21일 – 6월 20일', cancer: '6월 21일 – 7월 22일', leo: '7월 23일 – 8월 22일', virgo: '8월 23일 – 9월 22일', libra: '9월 23일 – 10월 22일', scorpio: '10월 23일 – 11월 21일', sagittarius: '11월 22일 – 12월 21일', capricorn: '12월 22일 – 1월 19일', aquarius: '1월 20일 – 2월 18일', pisces: '2월 19일 – 3월 20일' },
  fr: { aries: '21 mars – 19 avr', taurus: '20 avr – 20 mai', gemini: '21 mai – 20 juin', cancer: '21 juin – 22 juil', leo: '23 juil – 22 août', virgo: '23 août – 22 sept', libra: '23 sept – 22 oct', scorpio: '23 oct – 21 nov', sagittarius: '22 nov – 21 déc', capricorn: '22 déc – 19 janv', aquarius: '20 janv – 18 févr', pisces: '19 févr – 20 mars' },
  de: { aries: '21. März – 19. Apr', taurus: '20. Apr – 20. Mai', gemini: '21. Mai – 20. Juni', cancer: '21. Juni – 22. Juli', leo: '23. Juli – 22. Aug', virgo: '23. Aug – 22. Sept', libra: '23. Sept – 22. Okt', scorpio: '23. Okt – 21. Nov', sagittarius: '22. Nov – 21. Dez', capricorn: '22. Dez – 19. Jan', aquarius: '20. Jan – 18. Feb', pisces: '19. Feb – 20. März' },
  pt: { aries: '21 mar – 19 abr', taurus: '20 abr – 20 mai', gemini: '21 mai – 20 jun', cancer: '21 jun – 22 jul', leo: '23 jul – 22 ago', virgo: '23 ago – 22 set', libra: '23 set – 22 out', scorpio: '23 out – 21 nov', sagittarius: '22 nov – 21 dez', capricorn: '22 dez – 19 jan', aquarius: '20 jan – 18 fev', pisces: '19 fev – 20 mar' },
  id: { aries: '21 Mar – 19 Apr', taurus: '20 Apr – 20 Mei', gemini: '21 Mei – 20 Jun', cancer: '21 Jun – 22 Jul', leo: '23 Jul – 22 Agu', virgo: '23 Agu – 22 Sep', libra: '23 Sep – 22 Okt', scorpio: '23 Okt – 21 Nov', sagittarius: '22 Nov – 21 Des', capricorn: '22 Des – 19 Jan', aquarius: '20 Jan – 18 Feb', pisces: '19 Feb – 20 Mar' },
  // ar: Western digits (matches messages/ar.json and the ISO dates the build
  // stamps), start date first — the RTL renderer does the reordering.
  ar: { aries: '21 مارس – 19 أبريل', taurus: '20 أبريل – 20 مايو', gemini: '21 مايو – 20 يونيو', cancer: '21 يونيو – 22 يوليو', leo: '23 يوليو – 22 أغسطس', virgo: '23 أغسطس – 22 سبتمبر', libra: '23 سبتمبر – 22 أكتوبر', scorpio: '23 أكتوبر – 21 نوفمبر', sagittarius: '22 نوفمبر – 21 ديسمبر', capricorn: '22 ديسمبر – 19 يناير', aquarius: '20 يناير – 18 فبراير', pisces: '19 فبراير – 20 مارس' },
  // hi months spelled out in full — Hindi has no conventional 3-letter forms.
  hi: { aries: '21 मार्च – 19 अप्रैल', taurus: '20 अप्रैल – 20 मई', gemini: '21 मई – 20 जून', cancer: '21 जून – 22 जुलाई', leo: '23 जुलाई – 22 अगस्त', virgo: '23 अगस्त – 22 सितंबर', libra: '23 सितंबर – 22 अक्तूबर', scorpio: '23 अक्तूबर – 21 नवंबर', sagittarius: '22 नवंबर – 21 दिसंबर', capricorn: '22 दिसंबर – 19 जनवरी', aquarius: '20 जनवरी – 18 फ़रवरी', pisces: '19 फ़रवरी – 20 मार्च' },
  // ru months in the genitive the date form requires (21 марта, not 21 январь).
  ru: { aries: '21 марта – 19 апреля', taurus: '20 апреля – 20 мая', gemini: '21 мая – 20 июня', cancer: '21 июня – 22 июля', leo: '23 июля – 22 августа', virgo: '23 августа – 22 сентября', libra: '23 сентября – 22 октября', scorpio: '23 октября – 21 ноября', sagittarius: '22 ноября – 21 декабря', capricorn: '22 декабря – 19 января', aquarius: '20 января – 18 февраля', pisces: '19 февраля – 20 марта' },
  vi: { aries: '21/3 – 19/4', taurus: '20/4 – 20/5', gemini: '21/5 – 20/6', cancer: '21/6 – 22/7', leo: '23/7 – 22/8', virgo: '23/8 – 22/9', libra: '23/9 – 22/10', scorpio: '23/10 – 21/11', sagittarius: '22/11 – 21/12', capricorn: '22/12 – 19/1', aquarius: '20/1 – 18/2', pisces: '19/2 – 20/3' },
  // th uses the dotted month abbreviations, which are reserved for ranges and
  // table cells; prose elsewhere spells the month out.
  th: { aries: '21 มี.ค. – 19 เม.ย.', taurus: '20 เม.ย. – 20 พ.ค.', gemini: '21 พ.ค. – 20 มิ.ย.', cancer: '21 มิ.ย. – 22 ก.ค.', leo: '23 ก.ค. – 22 ส.ค.', virgo: '23 ส.ค. – 22 ก.ย.', libra: '23 ก.ย. – 22 ต.ค.', scorpio: '23 ต.ค. – 21 พ.ย.', sagittarius: '22 พ.ย. – 21 ธ.ค.', capricorn: '22 ธ.ค. – 19 ม.ค.', aquarius: '20 ม.ค. – 18 ก.พ.', pisces: '19 ก.พ. – 20 มี.ค.' },
};

// Popular-astrology trait keywords per sign (clearly framed as the common
// archetype attached to each sign, NOT a factual claim about any person).
const TRAITS = {
  en: { aries: 'bold, energetic, pioneering', taurus: 'steady, grounded, loyal', gemini: 'curious, expressive, adaptable', cancer: 'caring, intuitive, protective', leo: 'confident, warm, charismatic', virgo: 'precise, analytical, dedicated', libra: 'charming, balanced, diplomatic', scorpio: 'intense, passionate, determined', sagittarius: 'adventurous, optimistic, free-spirited', capricorn: 'disciplined, ambitious, reliable', aquarius: 'inventive, independent, idealistic', pisces: 'dreamy, empathetic, artistic' },
  ja: { aries: '大胆・情熱的・先駆者気質', taurus: '堅実・地に足のついた・忠実', gemini: '好奇心旺盛・表現豊か・順応的', cancer: '思いやり・直感的・守り上手', leo: '自信・温かい・カリスマ的', virgo: '几帳面・分析的・献身的', libra: '魅力的・バランス感覚・社交的', scorpio: '情熱的・一途・芯が強い', sagittarius: '冒険好き・楽観的・自由', capricorn: '努力家・野心的・信頼できる', aquarius: '独創的・自立的・理想主義', pisces: '夢見がち・共感力・芸術肌' },
  zh: { aries: '大胆、充满活力、开拓', taurus: '稳重、踏实、忠诚', gemini: '好奇、善表达、适应力强', cancer: '体贴、直觉、有保护欲', leo: '自信、热情、有魅力', virgo: '细致、善分析、专注', libra: '迷人、平衡、善交际', scorpio: '强烈、热情、坚定', sagittarius: '爱冒险、乐观、自由', capricorn: '自律、有抱负、可靠', aquarius: '创新、独立、理想主义', pisces: '梦幻、有同理心、艺术' },
  es: { aries: 'audaz, enérgico, pionero', taurus: 'estable, sereno, leal', gemini: 'curioso, expresivo, adaptable', cancer: 'cariñoso, intuitivo, protector', leo: 'seguro, cálido, carismático', virgo: 'preciso, analítico, dedicado', libra: 'encantador, equilibrado, diplomático', scorpio: 'intenso, apasionado, decidido', sagittarius: 'aventurero, optimista, libre', capricorn: 'disciplinado, ambicioso, fiable', aquarius: 'inventivo, independiente, idealista', pisces: 'soñador, empático, artístico' },
  ko: { aries: '대담함·에너지·개척', taurus: '안정·차분함·의리', gemini: '호기심·표현력·적응력', cancer: '다정함·직관·보호본능', leo: '자신감·따뜻함·카리스마', virgo: '꼼꼼함·분석력·헌신', libra: '매력·균형·사교성', scorpio: '강렬함·열정·집념', sagittarius: '모험심·낙천·자유', capricorn: '성실·야망·신뢰', aquarius: '독창성·독립심·이상주의', pisces: '몽환적·공감·예술적' },
  fr: { aries: 'audacieux, énergique, pionnier', taurus: 'stable, posé, loyal', gemini: 'curieux, expressif, adaptable', cancer: 'attentionné, intuitif, protecteur', leo: 'confiant, chaleureux, charismatique', virgo: 'précis, analytique, dévoué', libra: 'charmant, équilibré, diplomate', scorpio: 'intense, passionné, déterminé', sagittarius: 'aventureux, optimiste, libre', capricorn: 'discipliné, ambitieux, fiable', aquarius: 'inventif, indépendant, idéaliste', pisces: 'rêveur, empathique, artistique' },
  de: { aries: 'mutig, energisch, bahnbrechend', taurus: 'beständig, bodenständig, loyal', gemini: 'neugierig, ausdrucksstark, anpassungsfähig', cancer: 'fürsorglich, intuitiv, beschützend', leo: 'selbstbewusst, warmherzig, charismatisch', virgo: 'präzise, analytisch, hingebungsvoll', libra: 'charmant, ausgeglichen, diplomatisch', scorpio: 'intensiv, leidenschaftlich, entschlossen', sagittarius: 'abenteuerlustig, optimistisch, freiheitsliebend', capricorn: 'diszipliniert, ehrgeizig, zuverlässig', aquarius: 'erfinderisch, unabhängig, idealistisch', pisces: 'verträumt, einfühlsam, künstlerisch' },
  pt: { aries: 'audaz, enérgico, pioneiro', taurus: 'estável, calmo, leal', gemini: 'curioso, expressivo, adaptável', cancer: 'carinhoso, intuitivo, protetor', leo: 'confiante, caloroso, carismático', virgo: 'preciso, analítico, dedicado', libra: 'charmoso, equilibrado, diplomático', scorpio: 'intenso, apaixonado, determinado', sagittarius: 'aventureiro, otimista, livre', capricorn: 'disciplinado, ambicioso, fiável', aquarius: 'inventivo, independente, idealista', pisces: 'sonhador, empático, artístico' },
  id: { aries: 'berani, energik, pelopor', taurus: 'stabil, membumi, setia', gemini: 'penasaran, ekspresif, adaptif', cancer: 'penyayang, intuitif, protektif', leo: 'percaya diri, hangat, karismatik', virgo: 'teliti, analitis, berdedikasi', libra: 'memikat, seimbang, diplomatis', scorpio: 'intens, penuh gairah, gigih', sagittarius: 'petualang, optimis, bebas', capricorn: 'disiplin, ambisius, andal', aquarius: 'inventif, mandiri, idealis', pisces: 'pemimpi, empatik, artistik' },
  // ar: Arabic comma ، throughout, never ASCII.
  ar: { aries: 'جريء، مندفع، صاحب مبادرة', taurus: 'ثابت، هادئ، وفيّ', gemini: 'فضولي، معبِّر، سريع التأقلم', cancer: 'حنون، حدسي، حامٍ لمن يحب', leo: 'واثق، دافئ، آسر', virgo: 'دقيق، تحليلي، مخلص للتفاصيل', libra: 'ساحر، متوازن، دبلوماسي', scorpio: 'عميق، شغوف، قوي الإرادة', sagittarius: 'مغامر، متفائل، محب للحرية', capricorn: 'منضبط، طموح، يُعتمد عليه', aquarius: 'مبتكر، مستقل، مثالي', pisces: 'حالم، متعاطف، فنان الطبع' },
  hi: { aries: 'बेधड़क, जोशीले, पहल करने वाले', taurus: 'टिके रहने वाले, ज़मीन से जुड़े, वफ़ादार', gemini: 'जिज्ञासु, बातूनी, हर हाल में ढल जाने वाले', cancer: 'ख़याल रखने वाले, सहज-बोध वाले, अपनों के लिए ढाल', leo: 'आत्मविश्वासी, गर्मजोशी भरे, करिश्माई', virgo: 'बारीकी पसंद, विश्लेषक, समर्पित', libra: 'दिलकश, संतुलित, सुलझे हुए', scorpio: 'गहरे, जुनूनी, अडिग', sagittarius: 'घुमक्कड़, आशावादी, आज़ाद ख़याल', capricorn: 'अनुशासित, महत्वाकांक्षी, भरोसेमंद', aquarius: 'नएपन के शौकीन, स्वतंत्र, आदर्शवादी', pisces: 'ख़्वाब देखने वाले, संवेदनशील, कलात्मक' },
  // ru: plural adjectives only — the lists mix genders, so no gendered form
  // may reach the page.
  ru: { aries: 'смелые, энергичные, всегда первые', taurus: 'основательные, спокойные, верные', gemini: 'любопытные, общительные, гибкие', cancer: 'заботливые, чуткие, оберегающие своих', leo: 'уверенные, тёплые, харизматичные', virgo: 'внимательные к деталям, аналитичные, преданные делу', libra: 'обаятельные, уравновешенные, дипломатичные', scorpio: 'глубокие, страстные, упорные', sagittarius: 'лёгкие на подъём, оптимистичные, свободолюбивые', capricorn: 'дисциплинированные, амбициозные, надёжные', aquarius: 'изобретательные, независимые, идеалисты', pisces: 'мечтательные, эмпатичные, творческие' },
  vi: { aries: 'táo bạo, tràn năng lượng, thích đi đầu', taurus: 'vững vàng, thực tế, chung thủy', gemini: 'tò mò, giỏi diễn đạt, dễ thích nghi', cancer: 'ấm áp chăm sóc, nhạy cảm, hay che chở', leo: 'tự tin, nồng nhiệt, có sức hút', virgo: 'tỉ mỉ, phân tích tốt, tận tâm', libra: 'duyên dáng, cân bằng, khéo léo', scorpio: 'mãnh liệt, say mê, quyết tâm', sagittarius: 'ưa phiêu lưu, lạc quan, yêu tự do', capricorn: 'kỷ luật, tham vọng, đáng tin cậy', aquarius: 'nhiều ý tưởng, độc lập, lý tưởng', pisces: 'mơ mộng, đồng cảm, giàu chất nghệ' },
  // th: items separated by a space with และ before the last — Thai does not
  // join a list with a Latin comma.
  th: { aries: 'กล้าลุย พลังเต็มเปี่ยม และชอบเป็นคนแรก', taurus: 'มั่นคง ติดดิน และซื่อสัตย์', gemini: 'ช่างสงสัย สื่อสารเก่ง และปรับตัวไว', cancer: 'อบอุ่นใส่ใจ สัญชาตญาณดี และคอยปกป้องคนรอบข้าง', leo: 'มั่นใจ อบอุ่น และดึงดูดสายตา', virgo: 'ละเอียด คิดเป็นระบบ และทุ่มเท', libra: 'มีเสน่ห์ สมดุล และประนีประนอมเก่ง', scorpio: 'เข้มข้น มุ่งมั่น และไม่ยอมแพ้', sagittarius: 'รักการผจญภัย มองโลกในแง่ดี และรักอิสระ', capricorn: 'มีวินัย ทะเยอทะยาน และไว้ใจได้', aquarius: 'คิดนอกกรอบ เป็นตัวของตัวเอง และมีอุดมคติ', pisces: 'ช่างฝัน เข้าใจความรู้สึกคนอื่น และมีหัวศิลป์' },
};

// Russian counts take three CLDR forms (one/few/many). The `n === 1 ?` split
// the other languages can live with mis-declines 2–4 and everything from 5 up,
// so ru counters route through this instead.
const ruPlural = (n, [one, few, many]) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

// «под знаком …» governs the genitive, and SIGN_NAMES holds the nominative the
// chips and standalone labels need. Both forms are required, hence the map.
const RU_SIGN_GEN = {
  aries: 'Овна', taurus: 'Тельца', gemini: 'Близнецов', cancer: 'Рака',
  leo: 'Льва', virgo: 'Девы', libra: 'Весов', scorpio: 'Скорпиона',
  sagittarius: 'Стрельца', capricorn: 'Козерога', aquarius: 'Водолея', pisces: 'Рыб',
};

// Per-language chrome strings + builders. `s` is the localized sign object
// {key,name,emoji}; `n` is the verified member count; `examples` is an array
// of up to 3 "Name (Group)" strings for FAQ flavor.
const T = {
  en: {
    hub: 'K-pop', dir: 'K-pop Idols', signWord: 'star sign',
    title: s => `K-pop Idols Who Are ${s.name} ${s.emoji} — Star Sign Guide (2026)`,
    metaDesc: (s, n) => `Which K-pop idols are ${s.name}? A verified list of ${n} idols born under the ${s.name} star sign (${s.emoji}), with their group and birthday. Updated 2026.`,
    h1: s => `K-pop Idols Who Are ${s.name} ${s.emoji}`,
    lead: (s, n) => `A ${s.name} (${s.emoji}) is anyone born when the Sun is in ${s.name}. Below are ${n} K-pop idols from our roster born under this sign — listed with their group and birthday, sorted by date. The idol facts are drawn from verified profiles; the personality notes are the popular astrology archetype for ${s.name}, not a claim about any individual.`,
    traitsLabel: 'Popular traits', datesLabel: 'Date range',
    memberH: s => `Idols born under ${s.name} ${s.emoji}`,
    colIdol: 'Idol', colGroup: 'Group', colBday: 'Birthday',
    factsH: 'Quick facts',
    factN: n => `🎤 ${n} idols on this list`, factGroups: g => `👥 from ${g} groups`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Sun signs are popular astrology, not science — shared here for fun. Birthdays and groups are verified facts.',
    faq: (s, n, ex) => [
      [`Which K-pop idols are ${s.name}?`, `This page lists ${n} K-pop idols from our roster born under ${s.name} (${s.emoji})${ex.length ? `, including ${ex.join(', ')}` : ''}. Each entry shows the idol's group and verified birthday.`],
      [`What are the ${s.name} dates?`, `In Western astrology, ${s.name} runs ${DATE_RANGES.en[s.key]}. Anyone born in that window has the Sun in ${s.name}.`],
      [`Is the star sign list accurate?`, `The birthdays and groups are verified facts from idol profiles. The sun sign is calculated from each birthday using the standard Western date ranges. The personality traits are the common astrology archetype, shared for entertainment.`],
    ],
  },
  ja: {
    hub: 'K-POP', dir: 'K-POPアイドル', signWord: '星座',
    title: s => `${s.name}のK-POPアイドル ${s.emoji} — 星座別ガイド（2026）`,
    metaDesc: (s, n) => `${s.name}のK-POPアイドルは誰？ ${s.name}（${s.emoji}）生まれのアイドル${n}人を、所属グループと誕生日つきで一覧。2026年版。`,
    h1: s => `${s.name}のK-POPアイドル ${s.emoji}`,
    lead: (s, n) => `${s.name}（${s.emoji}）は、太陽が${s.name}にある時期に生まれた人を指します。以下は当ロスターでこの星座に該当するK-POPアイドル${n}人。所属グループと誕生日つきで、日付順に並べています。アイドル情報は検証済みプロフィールに基づき、性格の記述は${s.name}の一般的な星座イメージで、個人を断定するものではありません。`,
    traitsLabel: '一般的な特徴', datesLabel: '期間',
    memberH: s => `${s.name} ${s.emoji} 生まれのアイドル`,
    colIdol: 'アイドル', colGroup: 'グループ', colBday: '誕生日',
    factsH: '基本データ',
    factN: n => `🎤 一覧 ${n}人`, factGroups: g => `👥 ${g}グループから`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: '星座は科学ではなく娯楽としての占星術です。誕生日と所属グループは検証済みの事実です。',
    faq: (s, n, ex) => [
      [`${s.name}のK-POPアイドルは誰ですか？`, `このページでは${s.name}（${s.emoji}）生まれのK-POPアイドル${n}人を掲載${ex.length ? `（${ex.join('、')}など）` : ''}。各行に所属グループと検証済みの誕生日を表示しています。`],
      [`${s.name}の期間は？`, `西洋占星術では${s.name}は${DATE_RANGES.ja[s.key]}。この期間に生まれた人は太陽が${s.name}にあります。`],
      [`この星座一覧は正確ですか？`, `誕生日と所属グループはプロフィールの検証済み事実です。星座は各誕生日から標準的な西洋の期間で算出。性格の特徴は一般的な星座イメージで、娯楽目的です。`],
    ],
  },
  zh: {
    hub: 'K-pop', dir: 'K-pop偶像', signWord: '星座',
    title: s => `${s.name}的K-pop偶像 ${s.emoji} — 星座指南（2026）`,
    metaDesc: (s, n) => `哪些K-pop偶像是${s.name}？ ${s.name}（${s.emoji}）出生的${n}位偶像完整名单，附所属团体与生日。2026更新。`,
    h1: s => `${s.name}的K-pop偶像 ${s.emoji}`,
    lead: (s, n) => `${s.name}（${s.emoji}）指太阳运行至${s.name}时出生的人。以下是我们名单中属于该星座的${n}位K-pop偶像，附所属团体与生日，按日期排序。偶像资料来自已核实的档案；性格描述为${s.name}常见的占星印象，并非对个人的断定。`,
    traitsLabel: '常见特质', datesLabel: '日期范围',
    memberH: s => `${s.name} ${s.emoji} 出生的偶像`,
    colIdol: '偶像', colGroup: '团体', colBday: '生日',
    factsH: '速览',
    factN: n => `🎤 名单 ${n} 位`, factGroups: g => `👥 来自 ${g} 个团体`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: '星座属占星娱乐而非科学。生日与所属团体均为核实事实。',
    faq: (s, n, ex) => [
      [`哪些K-pop偶像是${s.name}？`, `本页列出${s.name}（${s.emoji}）出生的K-pop偶像${n}位${ex.length ? `，包括${ex.join('、')}` : ''}。每行显示偶像的所属团体与核实生日。`],
      [`${s.name}的日期范围？`, `西方占星中，${s.name}为${DATE_RANGES.zh[s.key]}。在此期间出生者太阳位于${s.name}。`],
      [`这份星座名单准确吗？`, `生日与团体是档案中的核实事实。星座由各生日按标准西方日期范围计算。性格特质为常见占星印象，仅供娱乐。`],
    ],
  },
  es: {
    hub: 'K-pop', dir: 'Ídolos del K-pop', signWord: 'signo zodiacal',
    title: s => `Ídolos del K-pop que son ${s.name} ${s.emoji} — Guía por signo (2026)`,
    metaDesc: (s, n) => `¿Qué ídolos del K-pop son ${s.name}? Lista verificada de ${n} ídolos nacidos bajo ${s.name} (${s.emoji}), con su grupo y cumpleaños. Actualizado 2026.`,
    h1: s => `Ídolos del K-pop que son ${s.name} ${s.emoji}`,
    lead: (s, n) => `${s.name} (${s.emoji}) es quien nace cuando el Sol está en ${s.name}. Estos son ${n} ídolos del K-pop de nuestra lista nacidos bajo este signo, con su grupo y cumpleaños, ordenados por fecha. Los datos de los ídolos provienen de perfiles verificados; los rasgos son el arquetipo popular de ${s.name}, no una afirmación sobre nadie.`,
    traitsLabel: 'Rasgos populares', datesLabel: 'Fechas',
    memberH: s => `Ídolos nacidos bajo ${s.name} ${s.emoji}`,
    colIdol: 'Ídolo', colGroup: 'Grupo', colBday: 'Cumpleaños',
    factsH: 'Datos rápidos',
    factN: n => `🎤 ${n} ídolos en la lista`, factGroups: g => `👥 de ${g} grupos`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Los signos solares son astrología popular, no ciencia: se comparten por diversión. Cumpleaños y grupos son hechos verificados.',
    faq: (s, n, ex) => [
      [`¿Qué ídolos del K-pop son ${s.name}?`, `Esta página enumera ${n} ídolos del K-pop nacidos bajo ${s.name} (${s.emoji})${ex.length ? `, como ${ex.join(', ')}` : ''}. Cada entrada muestra el grupo del ídolo y su cumpleaños verificado.`],
      [`¿Cuáles son las fechas de ${s.name}?`, `En astrología occidental, ${s.name} va del ${DATE_RANGES.es[s.key]}. Quien nace en ese rango tiene el Sol en ${s.name}.`],
      [`¿Es exacta la lista por signo?`, `Los cumpleaños y grupos son hechos verificados de los perfiles. El signo se calcula a partir de cada cumpleaños con los rangos occidentales estándar. Los rasgos son el arquetipo astrológico común, con fines de entretenimiento.`],
    ],
  },
  ko: {
    hub: 'K-팝', dir: 'K-팝 아이돌', signWord: '별자리',
    title: s => `${s.name} K-팝 아이돌 ${s.emoji} — 별자리 가이드 (2026)`,
    metaDesc: (s, n) => `${s.name} K-팝 아이돌은 누구? ${s.name}(${s.emoji}) 출생 아이돌 ${n}명을 소속 그룹·생일과 함께 정리한 검증 목록. 2026 업데이트.`,
    h1: s => `${s.name} K-팝 아이돌 ${s.emoji}`,
    lead: (s, n) => `${s.name}(${s.emoji})는 태양이 ${s.name}에 위치한 시기에 태어난 사람을 말합니다. 아래는 저희 로스터에서 이 별자리에 해당하는 K-팝 아이돌 ${n}명으로, 소속 그룹·생일과 함께 날짜순으로 정리했습니다. 아이돌 정보는 검증된 프로필 기반이며, 성격 설명은 ${s.name}의 일반적인 별자리 이미지로 개인을 단정하지 않습니다.`,
    traitsLabel: '일반적 특징', datesLabel: '기간',
    memberH: s => `${s.name} ${s.emoji} 출생 아이돌`,
    colIdol: '아이돌', colGroup: '그룹', colBday: '생일',
    factsH: '핵심 정보',
    factN: n => `🎤 목록 ${n}명`, factGroups: g => `👥 ${g}개 그룹`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: '별자리는 과학이 아닌 재미를 위한 점성술입니다. 생일과 소속 그룹은 검증된 사실입니다.',
    faq: (s, n, ex) => [
      [`${s.name} K-팝 아이돌은 누구인가요?`, `이 페이지는 ${s.name}(${s.emoji}) 출생 K-팝 아이돌 ${n}명을 정리했습니다${ex.length ? ` (${ex.join(', ')} 등)` : ''}. 각 행에 아이돌의 소속 그룹과 검증된 생일을 표시합니다.`],
      [`${s.name} 기간은 언제인가요?`, `서양 점성술에서 ${s.name}는 ${DATE_RANGES.ko[s.key]}입니다. 이 기간 출생자는 태양이 ${s.name}에 있습니다.`],
      [`별자리 목록은 정확한가요?`, `생일과 그룹은 프로필의 검증된 사실입니다. 별자리는 각 생일을 표준 서양 기간으로 계산했습니다. 성격 특징은 일반적인 점성술 이미지로 재미를 위한 것입니다.`],
    ],
  },
  fr: {
    hub: 'K-pop', dir: 'Idoles K-pop', signWord: 'signe astrologique',
    title: s => `Idoles K-pop ${s.name} ${s.emoji} — Guide par signe (2026)`,
    metaDesc: (s, n) => `Quelles idoles K-pop sont ${s.name} ? Liste vérifiée de ${n} idoles nées sous ${s.name} (${s.emoji}), avec leur groupe et leur anniversaire. Mis à jour 2026.`,
    h1: s => `Idoles K-pop ${s.name} ${s.emoji}`,
    lead: (s, n) => `${s.name} (${s.emoji}) désigne toute personne née quand le Soleil est en ${s.name}. Voici ${n} idoles K-pop de notre liste nées sous ce signe, avec leur groupe et leur anniversaire, triées par date. Les données viennent de profils vérifiés ; les traits correspondent à l'archétype populaire de ${s.name}, sans affirmation sur quiconque.`,
    traitsLabel: 'Traits populaires', datesLabel: 'Période',
    memberH: s => `Idoles nées sous ${s.name} ${s.emoji}`,
    colIdol: 'Idole', colGroup: 'Groupe', colBday: 'Anniversaire',
    factsH: 'En bref',
    factN: n => `🎤 ${n} idoles dans la liste`, factGroups: g => `👥 de ${g} groupes`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Les signes solaires relèvent de l\'astrologie populaire, pas de la science — partagés pour le plaisir. Anniversaires et groupes sont des faits vérifiés.',
    faq: (s, n, ex) => [
      [`Quelles idoles K-pop sont ${s.name} ?`, `Cette page recense ${n} idoles K-pop nées sous ${s.name} (${s.emoji})${ex.length ? `, dont ${ex.join(', ')}` : ''}. Chaque ligne indique le groupe et l'anniversaire vérifié.`],
      [`Quelles sont les dates ${s.name} ?`, `En astrologie occidentale, ${s.name} va du ${DATE_RANGES.fr[s.key]}. Toute personne née dans cet intervalle a le Soleil en ${s.name}.`],
      [`La liste par signe est-elle exacte ?`, `Les anniversaires et groupes sont des faits vérifiés issus des profils. Le signe est calculé à partir de chaque anniversaire selon les intervalles occidentaux standard. Les traits sont l'archétype astrologique courant, à but de divertissement.`],
    ],
  },
  de: {
    hub: 'K-Pop', dir: 'K-Pop-Idole', signWord: 'Sternzeichen',
    title: s => `K-Pop-Idole mit Sternzeichen ${s.name} ${s.emoji} — Guide (2026)`,
    metaDesc: (s, n) => `Welche K-Pop-Idole sind ${s.name}? Geprüfte Liste mit ${n} Idolen, die unter ${s.name} (${s.emoji}) geboren sind – mit Gruppe und Geburtstag. Aktualisiert 2026.`,
    h1: s => `K-Pop-Idole mit Sternzeichen ${s.name} ${s.emoji}`,
    lead: (s, n) => `${s.name} (${s.emoji}) ist, wer geboren wurde, während die Sonne in ${s.name} stand. Hier sind ${n} K-Pop-Idole aus unserer Liste mit diesem Sternzeichen – mit Gruppe und Geburtstag, nach Datum sortiert. Die Idol-Daten stammen aus geprüften Profilen; die Eigenschaften sind der populäre Archetyp von ${s.name}, keine Aussage über einzelne Personen.`,
    traitsLabel: 'Typische Eigenschaften', datesLabel: 'Zeitraum',
    memberH: s => `Idole mit Sternzeichen ${s.name} ${s.emoji}`,
    colIdol: 'Idol', colGroup: 'Gruppe', colBday: 'Geburtstag',
    factsH: 'Auf einen Blick',
    factN: n => `🎤 ${n} Idole in der Liste`, factGroups: g => `👥 aus ${g} Gruppen`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Sternzeichen sind populäre Astrologie, keine Wissenschaft – nur zum Spaß. Geburtstage und Gruppen sind geprüfte Fakten.',
    faq: (s, n, ex) => [
      [`Welche K-Pop-Idole sind ${s.name}?`, `Diese Seite listet ${n} K-Pop-Idole mit dem Sternzeichen ${s.name} (${s.emoji})${ex.length ? `, darunter ${ex.join(', ')}` : ''}. Jede Zeile zeigt Gruppe und geprüften Geburtstag.`],
      [`Welcher Zeitraum gehört zu ${s.name}?`, `In der westlichen Astrologie reicht ${s.name} vom ${DATE_RANGES.de[s.key]}. Wer in diesem Zeitraum geboren ist, hat die Sonne in ${s.name}.`],
      [`Ist die Sternzeichen-Liste korrekt?`, `Geburtstage und Gruppen sind geprüfte Fakten aus den Profilen. Das Sternzeichen wird aus jedem Geburtstag nach den westlichen Standardzeiträumen berechnet. Die Eigenschaften sind der übliche astrologische Archetyp, zur Unterhaltung.`],
    ],
  },
  pt: {
    hub: 'K-pop', dir: 'Ídolos de K-pop', signWord: 'signo',
    title: s => `Ídolos de K-pop de ${s.name} ${s.emoji} — Guia por signo (2026)`,
    metaDesc: (s, n) => `Quais ídolos de K-pop são de ${s.name}? Lista verificada de ${n} ídolos nascidos sob ${s.name} (${s.emoji}), com grupo e aniversário. Atualizado 2026.`,
    h1: s => `Ídolos de K-pop de ${s.name} ${s.emoji}`,
    lead: (s, n) => `${s.name} (${s.emoji}) é quem nasce quando o Sol está em ${s.name}. Abaixo estão ${n} ídolos de K-pop da nossa lista nascidos sob este signo, com grupo e aniversário, ordenados por data. Os dados dos ídolos vêm de perfis verificados; os traços são o arquétipo popular de ${s.name}, não uma afirmação sobre alguém.`,
    traitsLabel: 'Traços populares', datesLabel: 'Período',
    memberH: s => `Ídolos nascidos sob ${s.name} ${s.emoji}`,
    colIdol: 'Ídolo', colGroup: 'Grupo', colBday: 'Aniversário',
    factsH: 'Resumo',
    factN: n => `🎤 ${n} ídolos na lista`, factGroups: g => `👥 de ${g} grupos`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Signos solares são astrologia popular, não ciência — partilhados por diversão. Aniversários e grupos são factos verificados.',
    faq: (s, n, ex) => [
      [`Quais ídolos de K-pop são de ${s.name}?`, `Esta página lista ${n} ídolos de K-pop nascidos sob ${s.name} (${s.emoji})${ex.length ? `, incluindo ${ex.join(', ')}` : ''}. Cada linha mostra o grupo do ídolo e o aniversário verificado.`],
      [`Quais são as datas de ${s.name}?`, `Na astrologia ocidental, ${s.name} vai de ${DATE_RANGES.pt[s.key]}. Quem nasce nesse intervalo tem o Sol em ${s.name}.`],
      [`A lista por signo é exata?`, `Os aniversários e grupos são factos verificados dos perfis. O signo é calculado a partir de cada aniversário com os intervalos ocidentais padrão. Os traços são o arquétipo astrológico comum, para entretenimento.`],
    ],
  },
  id: {
    hub: 'K-pop', dir: 'Idol K-pop', signWord: 'zodiak',
    title: s => `Idol K-pop Berzodiak ${s.name} ${s.emoji} — Panduan (2026)`,
    metaDesc: (s, n) => `Idol K-pop mana yang ${s.name}? Daftar terverifikasi ${n} idol kelahiran ${s.name} (${s.emoji}), lengkap dengan grup dan tanggal lahir. Diperbarui 2026.`,
    h1: s => `Idol K-pop Berzodiak ${s.name} ${s.emoji}`,
    lead: (s, n) => `${s.name} (${s.emoji}) adalah mereka yang lahir saat Matahari berada di ${s.name}. Berikut ${n} idol K-pop dari roster kami yang berzodiak ini, lengkap dengan grup dan tanggal lahir, diurutkan berdasarkan tanggal. Data idol berasal dari profil terverifikasi; sifat-sifatnya adalah arketipe populer ${s.name}, bukan klaim tentang individu mana pun.`,
    traitsLabel: 'Sifat umum', datesLabel: 'Rentang tanggal',
    memberH: s => `Idol kelahiran ${s.name} ${s.emoji}`,
    colIdol: 'Idol', colGroup: 'Grup', colBday: 'Tanggal lahir',
    factsH: 'Fakta singkat',
    factN: n => `🎤 ${n} idol dalam daftar`, factGroups: g => `👥 dari ${g} grup`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Zodiak adalah astrologi populer, bukan sains — dibagikan untuk hiburan. Tanggal lahir dan grup adalah fakta terverifikasi.',
    faq: (s, n, ex) => [
      [`Idol K-pop mana yang ${s.name}?`, `Halaman ini memuat ${n} idol K-pop kelahiran ${s.name} (${s.emoji})${ex.length ? `, termasuk ${ex.join(', ')}` : ''}. Setiap baris menampilkan grup idol dan tanggal lahir terverifikasi.`],
      [`Kapan rentang tanggal ${s.name}?`, `Dalam astrologi Barat, ${s.name} berlangsung ${DATE_RANGES.id[s.key]}. Siapa pun yang lahir pada rentang itu memiliki Matahari di ${s.name}.`],
      [`Apakah daftar zodiak ini akurat?`, `Tanggal lahir dan grup adalah fakta terverifikasi dari profil. Zodiak dihitung dari tiap tanggal lahir memakai rentang Barat standar. Sifat-sifatnya adalah arketipe astrologi umum, untuk hiburan.`],
    ],
  },
  // ar — RTL. Counters put the noun before the numeral (عدد النجوم: 15) because
  // Arabic declines a counted noun five different ways; an n===1 split is wrong
  // for four of them. Casing is "K-Pop" here, matching messages/ar.json.
  ar: {
    hub: 'K-Pop', dir: 'نجوم K-Pop', signWord: 'البرج',
    title: s => `نجوم K-Pop من برج ${s.name} ${s.emoji} — دليل الأبراج (2026)`,
    metaDesc: (s, n) => `أي نجوم K-Pop من برج ${s.name}؟ قائمة موثَّقة بمواليد برج ${s.name} (${s.emoji}) مع الفرقة وتاريخ الميلاد — عدد النجوم: ${n}. محدَّثة 2026.`,
    h1: s => `نجوم K-Pop من برج ${s.name} ${s.emoji}`,
    lead: (s, n) => `مواليد برج ${s.name} (${s.emoji}) هم من وُلدوا بينما كانت الشمس في برج ${s.name}. في ما يلي نجوم K-Pop المولودون تحت هذا البرج من قائمتنا الحالية — عدد النجوم: ${n} — مع الفرقة وتاريخ الميلاد، مرتَّبين حسب التاريخ. بيانات النجوم مأخوذة من ملفات موثَّقة، أما صفات الشخصية فهي الصورة الشائعة لبرج ${s.name} في الأبراج، وليست حكمًا على أي شخص.`,
    traitsLabel: 'صفات شائعة', datesLabel: 'الفترة',
    memberH: s => `نجوم K-Pop المولودون في برج ${s.name} ${s.emoji}`,
    colIdol: 'النجم', colGroup: 'الفرقة', colBday: 'تاريخ الميلاد',
    factsH: 'نظرة سريعة',
    factN: n => `🎤 عدد النجوم في القائمة: ${n}`, factGroups: g => `👥 عدد الفرق: ${g}`, factSign: s => `${s.emoji} برج ${s.name}`,
    astroNote: 'الأبراج تسلية وليست علمًا — نعرضها هنا للمتعة فقط. أما تواريخ الميلاد والفرق فهي حقائق موثَّقة.',
    faq: (s, n, ex) => [
      [`أي نجوم K-Pop من برج ${s.name}؟`, `تضم هذه الصفحة نجوم K-Pop المولودين تحت برج ${s.name} (${s.emoji}) في قائمتنا الحالية — عدد النجوم: ${n}${ex.length ? `، ومنهم ${ex.join('، ')}` : ''}. ويعرض كل سطر فرقة النجم وتاريخ ميلاده الموثَّق.`],
      [`ما هي فترة برج ${s.name}؟`, `في علم التنجيم الغربي، فترة برج ${s.name} هي ${DATE_RANGES.ar[s.key]}. وكل مولود في هذه الفترة تكون شمسه في ${s.name}.`],
      [`هل قائمة الأبراج دقيقة؟`, `تواريخ الميلاد والفرق حقائق موثَّقة مأخوذة من ملفات النجوم. ويُحسب البرج من تاريخ ميلاد كل نجم وفق الفترات الغربية المعيارية. أما صفات الشخصية فهي الصورة الشائعة في الأبراج، وتُعرض للتسلية. وهذه قائمتنا الحالية، وهي لا تشمل كل نجوم K-Pop.`],
    ],
  },
  // hi — Devanagari with Western digits; loanwords stay invariant (12 आइडल,
  // never आइडल्स). "K-pop" casing follows this file, not build-seo.cjs.
  hi: {
    hub: 'K-pop', dir: 'K-pop आइडल', signWord: 'राशि',
    title: s => `${s.name} राशि वाले K-pop आइडल ${s.emoji} — राशि गाइड (2026)`,
    metaDesc: (s, n) => `कौन-से K-pop आइडल ${s.name} राशि के हैं? ${s.name} (${s.emoji}) राशि में जन्मे ${n} आइडल की वेरिफाइड लिस्ट, ग्रुप और जन्मदिन के साथ। 2026 अपडेट।`,
    h1: s => `${s.name} राशि वाले K-pop आइडल ${s.emoji}`,
    // Count sits apart from the noun so the verb never has to agree with n —
    // "1 आइडल हैं" would be wrong and there is no ternary to catch it.
    lead: (s, n) => `${s.name} (${s.emoji}) राशि उन लोगों की होती है जिनके जन्म के समय सूर्य ${s.name} राशि में होता है। नीचे हमारी आर्टिस्ट लिस्ट से इसी राशि के K-pop आइडल दिए गए हैं — कुल ${n} — ग्रुप और जन्मदिन के साथ, तारीख के हिसाब से क्रम में। आइडल की जानकारी वेरिफाइड प्रोफाइल से ली गई है; स्वभाव से जुड़ी बातें ${s.name} राशि की आम ज्योतिषीय छवि हैं, किसी व्यक्ति के बारे में दावा नहीं।`,
    traitsLabel: 'आम ज्योतिषीय गुण', datesLabel: 'अवधि',
    memberH: s => `${s.name} राशि में जन्मे आइडल ${s.emoji}`,
    colIdol: 'आइडल', colGroup: 'ग्रुप', colBday: 'जन्मदिन',
    factsH: 'खास बातें',
    factN: n => `🎤 लिस्ट में ${n} आइडल`, factGroups: g => `👥 ${g} ग्रुप से`, factSign: s => `${s.emoji} ${s.name} राशि`,
    astroNote: 'राशियाँ लोकप्रिय ज्योतिष हैं, विज्ञान नहीं — यहाँ सिर्फ़ मनोरंजन के लिए दी गई हैं। जन्मदिन और ग्रुप वेरिफाइड तथ्य हैं।',
    faq: (s, n, ex) => [
      [`कौन-से K-pop आइडल ${s.name} राशि के हैं?`, `इस पेज पर ${s.name} (${s.emoji}) राशि में जन्मे K-pop आइडल दिए गए हैं — कुल ${n}${ex.length ? `, जैसे ${ex.join(', ')}` : ''}। हर पंक्ति में आइडल का ग्रुप और वेरिफाइड जन्मदिन दिया गया है।`],
      [`${s.name} राशि की तारीखें क्या हैं?`, `पश्चिमी ज्योतिष में ${s.name} राशि की अवधि ${DATE_RANGES.hi[s.key]} है। इस अवधि में जन्मे हर व्यक्ति का सूर्य ${s.name} राशि में होता है।`],
      [`क्या यह राशि लिस्ट सही है?`, `जन्मदिन और ग्रुप प्रोफाइल से लिए गए वेरिफाइड तथ्य हैं। राशि हर जन्मदिन से मानक पश्चिमी अवधियों के हिसाब से निकाली गई है। स्वभाव के गुण आम ज्योतिषीय छवि हैं, जो सिर्फ़ मनोरंजन के लिए हैं। यह हमारी आर्टिस्ट लिस्ट है, पूरा K-pop नहीं।`],
    ],
  },
  // ru — sentence case in headings, «айдол» not «идол» (that is the religious
  // one), and every count goes through ruPlural.
  ru: {
    hub: 'K-pop', dir: 'Айдолы K-pop', signWord: 'знак зодиака',
    // Russian does not stack an attributive noun in front: «K-pop айдолы» is a
    // calque. Head noun first, modifier after — «айдолы K-pop», which is what
    // the month pages and the rest of the ru cluster already say.
    title: s => `Айдолы K-pop под знаком ${RU_SIGN_GEN[s.key]} ${s.emoji} — гид по знакам зодиака (2026)`,
    metaDesc: (s, n) => `Кто из айдолов K-pop родился под знаком ${RU_SIGN_GEN[s.key]}? Знак ${s.name} (${s.emoji}): проверенный список — ${n} ${ruPlural(n, ['айдол', 'айдола', 'айдолов'])} с группой и днём рождения. Обновлено в 2026 году.`,
    h1: s => `Айдолы K-pop под знаком ${RU_SIGN_GEN[s.key]} ${s.emoji}`,
    // «под этим знаком» stays attributive to the count phrase: a participle
    // («родившиеся») would break agreement at n = 1.
    lead: (s, n) => `Под знаком ${RU_SIGN_GEN[s.key]} (${s.emoji}) рождаются те, у кого в момент рождения Солнце находилось в этом знаке. Ниже — ${n} ${ruPlural(n, ['айдол', 'айдола', 'айдолов'])} из нашего списка под этим знаком: с группой и днём рождения, по порядку дат. Факты об айдолах взяты из проверенных профилей; черты характера — это популярный астрологический образ знака, а не утверждение о ком-то конкретном.`,
    traitsLabel: 'Популярные черты', datesLabel: 'Даты',
    memberH: s => `Айдолы, родившиеся под знаком ${RU_SIGN_GEN[s.key]} ${s.emoji}`,
    colIdol: 'Айдол', colGroup: 'Группа', colBday: 'День рождения',
    factsH: 'Коротко',
    factN: n => `🎤 ${n} ${ruPlural(n, ['айдол', 'айдола', 'айдолов'])} в списке`, factGroups: g => `👥 из ${g} ${ruPlural(g, ['группы', 'групп', 'групп'])}`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Знаки зодиака — популярная астрология, а не наука: это просто развлечение. Дни рождения и группы — проверенные факты.',
    faq: (s, n, ex) => [
      [`Кто из айдолов K-pop родился под знаком ${RU_SIGN_GEN[s.key]}?`, `На этой странице — ${n} ${ruPlural(n, ['айдол', 'айдола', 'айдолов'])} из нашего списка под знаком ${RU_SIGN_GEN[s.key]} (${s.emoji})${ex.length ? `, например ${ex.join(', ')}` : ''}. В каждой строке — группа айдола и проверенная дата рождения.`],
      [`Какие даты у знака ${RU_SIGN_GEN[s.key]}?`, `В западной астрологии ${s.name} — это ${DATE_RANGES.ru[s.key]}. У всех, кто родился в этот промежуток, Солнце стоит в этом знаке.`],
      [`Насколько точен список по знакам зодиака?`, `Дни рождения и группы — проверенные факты из профилей. Знак рассчитан по дате рождения на основе стандартных западных промежутков. Черты характера — это распространённый астрологический образ, он приведён для развлечения. И это наш список — не весь K-pop.`],
    ],
  },
  // vi — no grammatical number, so one count form only ("47 idol"); "idol"
  // stays English everywhere, never "thần tượng".
  vi: {
    hub: 'K-pop', dir: 'Idol K-pop', signWord: 'cung hoàng đạo',
    title: s => `Idol K-pop cung ${s.name} ${s.emoji} — Cẩm nang hoàng đạo (2026)`,
    // "Danh sách đã xác minh N idol" reads as "the list HAS VERIFIED N idols";
    // "gồm" restores "a verified list OF N idols". And "sinh vào" takes a time
    // expression in Vietnamese, not a sign — a sign takes "thuộc cung".
    metaDesc: (s, n) => `Idol K-pop nào thuộc cung ${s.name}? Danh sách đã xác minh gồm ${n} idol thuộc cung ${s.name} (${s.emoji}), kèm nhóm nhạc và ngày sinh. Cập nhật 2026.`,
    h1: s => `Idol K-pop cung ${s.name} ${s.emoji}`,
    // "Cung X là những người sinh ra khi…" equates a sign with a group of
    // people; "là" asserts identity in Vietnamese, so the relation needs
    // "là cung hoàng đạo của".
    lead: (s, n) => `${s.name} (${s.emoji}) là cung hoàng đạo của những người sinh ra khi Mặt Trời đi qua cung này. Dưới đây là ${n} idol K-pop trong danh sách của chúng tôi thuộc cung ${s.name}, kèm nhóm nhạc và ngày sinh, sắp xếp theo ngày. Thông tin idol lấy từ hồ sơ đã xác minh; phần tính cách là hình mẫu chiêm tinh học phổ thông của cung ${s.name}, không phải nhận định về bất kỳ ai.`,
    traitsLabel: 'Tính cách phổ biến', datesLabel: 'Khoảng ngày',
    memberH: s => `Idol thuộc cung ${s.name} ${s.emoji}`,
    colIdol: 'Idol', colGroup: 'Nhóm nhạc', colBday: 'Ngày sinh',
    factsH: 'Thông tin nhanh',
    factN: n => `🎤 ${n} idol trong danh sách`, factGroups: g => `👥 từ ${g} nhóm`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'Cung hoàng đạo là chiêm tinh học phổ thông, không phải khoa học — chia sẻ ở đây cho vui. Ngày sinh và nhóm nhạc là dữ liệu đã xác minh.',
    faq: (s, n, ex) => [
      [`Idol K-pop nào thuộc cung ${s.name}?`, `Trang này liệt kê ${n} idol K-pop thuộc cung ${s.name} (${s.emoji})${ex.length ? `, trong đó có ${ex.join(', ')}` : ''}. Mỗi dòng cho biết nhóm nhạc và ngày sinh đã xác minh của idol.`],
      [`Cung ${s.name} từ ngày nào đến ngày nào?`, `Trong chiêm tinh phương Tây, cung ${s.name} kéo dài ${DATE_RANGES.vi[s.key]}. Ai sinh trong khoảng đó thì có Mặt Trời ở cung ${s.name}.`],
      [`Danh sách theo cung hoàng đạo có chính xác không?`, `Ngày sinh và nhóm nhạc là dữ liệu đã xác minh từ hồ sơ. Cung hoàng đạo được tính từ ngày sinh theo khoảng ngày chuẩn của phương Tây. Phần tính cách là hình mẫu chiêm tinh quen thuộc, chỉ để giải trí. Đây là danh sách của chúng tôi, không phải toàn bộ K-pop.`],
    ],
  },
  // th — counts are NOUN + NUMERAL + CLASSIFIER (ไอดอล 12 คน) with no
  // singular case; a space wraps every run of Latin script or digits; Thai has
  // no full stop, so clauses end on a space.
  th: {
    hub: 'K-pop', dir: 'ไอดอล K-pop', signWord: 'ราศี',
    title: s => `ไอดอล K-pop ${s.name} ${s.emoji} — คู่มือราศี (2026)`,
    metaDesc: (s, n) => `ไอดอล K-pop คนไหนเป็น${s.name}? รายชื่อที่ตรวจสอบแล้ว ไอดอล ${n} คนที่เกิดใน${s.name} (${s.emoji}) พร้อมวงและวันเกิด อัปเดตปี 2026`,
    h1: s => `ไอดอล K-pop ${s.name} ${s.emoji}`,
    lead: (s, n) => `${s.name} (${s.emoji}) คือคนที่เกิดในช่วงที่ดวงอาทิตย์โคจรอยู่ใน${s.name} ด้านล่างคือไอดอล K-pop ${n} คนจากรายชื่อปัจจุบันของเราที่เกิดในราศีนี้ พร้อมวงและวันเกิด เรียงตามวันที่ ข้อมูลไอดอลมาจากโปรไฟล์ที่ตรวจสอบแล้ว ส่วนลักษณะนิสัยเป็นภาพจำทางโหราศาสตร์ของ${s.name} ไม่ใช่การตัดสินตัวบุคคล`,
    traitsLabel: 'ลักษณะนิสัยตามความเชื่อ', datesLabel: 'ช่วงวันที่',
    memberH: s => `ไอดอลที่เกิดใน${s.name} ${s.emoji}`,
    colIdol: 'ไอดอล', colGroup: 'วง', colBday: 'วันเกิด',
    factsH: 'ข้อมูลสรุป',
    factN: n => `🎤 ไอดอลในรายชื่อ ${n} คน`, factGroups: g => `👥 จาก ${g} วง`, factSign: s => `${s.emoji} ${s.name}`,
    astroNote: 'ราศีเป็นความเชื่อทางโหราศาสตร์ ไม่ใช่วิทยาศาสตร์ นำมาแบ่งปันเพื่อความสนุกเท่านั้น ส่วนวันเกิดและวงเป็นข้อเท็จจริงที่ตรวจสอบแล้ว',
    faq: (s, n, ex) => [
      [`ไอดอล K-pop คนไหนเป็น${s.name}?`, `หน้านี้รวมไอดอล K-pop ที่เกิดใน${s.name} (${s.emoji}) ${n} คน${ex.length ? ` เช่น ${ex.length > 1 ? `${ex.slice(0, -1).join(' ')} และ ${ex[ex.length - 1]}` : ex[0]}` : ''} แต่ละแถวแสดงวงและวันเกิดที่ตรวจสอบแล้วของไอดอลแต่ละคน`],
      [`${s.name}คือช่วงวันที่เท่าไร?`, `ในโหราศาสตร์ตะวันตก ${s.name}อยู่ในช่วง ${DATE_RANGES.th[s.key]} ใครก็ตามที่เกิดในช่วงนี้จะมีดวงอาทิตย์อยู่ใน${s.name}`],
      [`รายชื่อตามราศีนี้ถูกต้องไหม?`, `วันเกิดและวงเป็นข้อเท็จจริงที่ตรวจสอบแล้วจากโปรไฟล์ ราศีคำนวณจากวันเกิดของแต่ละคนตามช่วงวันที่มาตรฐานแบบตะวันตก ส่วนลักษณะนิสัยเป็นภาพจำทางโหราศาสตร์ทั่วไป มีไว้เพื่อความบันเทิง และนี่คือรายชื่อปัจจุบันของเรา ไม่ใช่ทั้งหมดของวงการ K-pop`],
    ],
  },
};

module.exports = { T, SIGN_NAMES, DATE_RANGES, TRAITS };
