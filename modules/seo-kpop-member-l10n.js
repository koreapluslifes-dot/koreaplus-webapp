/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-member-l10n.js — UI string localization for the K-pop
   member profile generator (modules/seo-kpop-member.cjs).

   Scope: this file carries ONLY the chrome/label strings (section headings,
   sentence templates, FAQ question/answer templates). All factual content
   (member name, birthday, group, agency, debut) comes from the verified
   ROSTER + ENRICH data and is rendered language-neutrally with names kept
   in their canonical form. Zodiac sign / Chinese-zodiac / month names are
   localized here via lookup maps keyed by the English key from ctx.derive.

   14 languages: the 9 sitewide (en/ja/zh/es/ko/fr/de/pt/id) plus the 5
   K-pop-only codes (ar/hi/ru/vi/th). Every language is complete so all
   191 members × 14 = 2674 pages can render. No fabrication — templates only
   restate verified facts.

   ar is RTL: every string is written in LOGICAL order (emoji first, pipe last,
   name before the parenthesis). The renderer flips it — never hand-reverse a
   string here, and never inject RLM/LRM into this data.

   TWO THINGS THAT LOOK LIKE BUGS AND ARE NOT (both are documented in place):
   - MONTH_NAMES rows are the form a month takes INSIDE A DATE, not the citation
     form. fmtBday() in seo-kpop-member.cjs is the table's only caller and only
     ever renders "<day> <month> <year>", so ru carries the genitive (11 апреля)
     and vi carries the whole "tháng N năm" fragment. Copying a row out of here
     to head a page would be wrong for both.
   - The hi title/desc take an optional third argument, the idol's sex, because
     the Hindi genitive agrees with the NAME, not with the group. Without it
     they fall back to a form that needs no agreement at all.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// Localized zodiac sign names (keyed by ctx.derive.signOf().key).
const SIGN_NAMES = {
  en: { aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces' },
  ja: { aries: '牡羊座', taurus: '牡牛座', gemini: '双子座', cancer: '蟹座', leo: '獅子座', virgo: '乙女座', libra: '天秤座', scorpio: '蠍座', sagittarius: '射手座', capricorn: '山羊座', aquarius: '水瓶座', pisces: '魚座' },
  zh: { aries: '白羊座', taurus: '金牛座', gemini: '双子座', cancer: '巨蟹座', leo: '狮子座', virgo: '处女座', libra: '天秤座', scorpio: '天蝎座', sagittarius: '射手座', capricorn: '摩羯座', aquarius: '水瓶座', pisces: '双鱼座' },
  es: { aries: 'Aries', taurus: 'Tauro', gemini: 'Géminis', cancer: 'Cáncer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Escorpio', sagittarius: 'Sagitario', capricorn: 'Capricornio', aquarius: 'Acuario', pisces: 'Piscis' },
  ko: { aries: '양자리', taurus: '황소자리', gemini: '쌍둥이자리', cancer: '게자리', leo: '사자자리', virgo: '처녀자리', libra: '천칭자리', scorpio: '전갈자리', sagittarius: '사수자리', capricorn: '염소자리', aquarius: '물병자리', pisces: '물고기자리' },
  fr: { aries: 'Bélier', taurus: 'Taureau', gemini: 'Gémeaux', cancer: 'Cancer', leo: 'Lion', virgo: 'Vierge', libra: 'Balance', scorpio: 'Scorpion', sagittarius: 'Sagittaire', capricorn: 'Capricorne', aquarius: 'Verseau', pisces: 'Poissons' },
  de: { aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs', leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpio: 'Skorpion', sagittarius: 'Schütze', capricorn: 'Steinbock', aquarius: 'Wassermann', pisces: 'Fische' },
  pt: { aries: 'Áries', taurus: 'Touro', gemini: 'Gêmeos', cancer: 'Câncer', leo: 'Leão', virgo: 'Virgem', libra: 'Libra', scorpio: 'Escorpião', sagittarius: 'Sagitário', capricorn: 'Capricórnio', aquarius: 'Aquário', pisces: 'Peixes' },
  id: { aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagitarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces' },
  // ar/hi/th sign names already carry their classifier (ال / राशि-less stem / ราศี);
  // the surrounding template must not prepend a second one.
  ar: { aries: 'الحمل', taurus: 'الثور', gemini: 'الجوزاء', cancer: 'السرطان', leo: 'الأسد', virgo: 'العذراء', libra: 'الميزان', scorpio: 'العقرب', sagittarius: 'القوس', capricorn: 'الجدي', aquarius: 'الدلو', pisces: 'الحوت' },
  hi: { aries: 'मेष', taurus: 'वृषभ', gemini: 'मिथुन', cancer: 'कर्क', leo: 'सिंह', virgo: 'कन्या', libra: 'तुला', scorpio: 'वृश्चिक', sagittarius: 'धनु', capricorn: 'मकर', aquarius: 'कुंभ', pisces: 'मीन' },
  ru: { aries: 'Овен', taurus: 'Телец', gemini: 'Близнецы', cancer: 'Рак', leo: 'Лев', virgo: 'Дева', libra: 'Весы', scorpio: 'Скорпион', sagittarius: 'Стрелец', capricorn: 'Козерог', aquarius: 'Водолей', pisces: 'Рыбы' },
  vi: { aries: 'Bạch Dương', taurus: 'Kim Ngưu', gemini: 'Song Tử', cancer: 'Cự Giải', leo: 'Sư Tử', virgo: 'Xử Nữ', libra: 'Thiên Bình', scorpio: 'Thiên Yết', sagittarius: 'Nhân Mã', capricorn: 'Ma Kết', aquarius: 'Bảo Bình', pisces: 'Song Ngư' },
  th: { aries: 'ราศีเมษ', taurus: 'ราศีพฤษภ', gemini: 'ราศีเมถุน', cancer: 'ราศีกรกฎ', leo: 'ราศีสิงห์', virgo: 'ราศีกันย์', libra: 'ราศีตุลย์', scorpio: 'ราศีพิจิก', sagittarius: 'ราศีธนู', capricorn: 'ราศีมังกร', aquarius: 'ราศีกุมภ์', pisces: 'ราศีมีน' },
};

// Localized Chinese-zodiac animal names (keyed by ctx.derive.cnZodiacOf().key).
const ANIMAL_NAMES = {
  en: { rat: 'Rat', ox: 'Ox', tiger: 'Tiger', rabbit: 'Rabbit', dragon: 'Dragon', snake: 'Snake', horse: 'Horse', goat: 'Goat', monkey: 'Monkey', rooster: 'Rooster', dog: 'Dog', pig: 'Pig' },
  ja: { rat: '子(ねずみ)', ox: '丑(うし)', tiger: '寅(とら)', rabbit: '卯(うさぎ)', dragon: '辰(たつ)', snake: '巳(へび)', horse: '午(うま)', goat: '未(ひつじ)', monkey: '申(さる)', rooster: '酉(とり)', dog: '戌(いぬ)', pig: '亥(いのしし)' },
  zh: { rat: '鼠', ox: '牛', tiger: '虎', rabbit: '兔', dragon: '龙', snake: '蛇', horse: '马', goat: '羊', monkey: '猴', rooster: '鸡', dog: '狗', pig: '猪' },
  es: { rat: 'Rata', ox: 'Buey', tiger: 'Tigre', rabbit: 'Conejo', dragon: 'Dragón', snake: 'Serpiente', horse: 'Caballo', goat: 'Cabra', monkey: 'Mono', rooster: 'Gallo', dog: 'Perro', pig: 'Cerdo' },
  ko: { rat: '쥐', ox: '소', tiger: '호랑이', rabbit: '토끼', dragon: '용', snake: '뱀', horse: '말', goat: '양', monkey: '원숭이', rooster: '닭', dog: '개', pig: '돼지' },
  fr: { rat: 'Rat', ox: 'Buffle', tiger: 'Tigre', rabbit: 'Lapin', dragon: 'Dragon', snake: 'Serpent', horse: 'Cheval', goat: 'Chèvre', monkey: 'Singe', rooster: 'Coq', dog: 'Chien', pig: 'Cochon' },
  de: { rat: 'Ratte', ox: 'Büffel', tiger: 'Tiger', rabbit: 'Hase', dragon: 'Drache', snake: 'Schlange', horse: 'Pferd', goat: 'Ziege', monkey: 'Affe', rooster: 'Hahn', dog: 'Hund', pig: 'Schwein' },
  pt: { rat: 'Rato', ox: 'Boi', tiger: 'Tigre', rabbit: 'Coelho', dragon: 'Dragão', snake: 'Serpente', horse: 'Cavalo', goat: 'Cabra', monkey: 'Macaco', rooster: 'Galo', dog: 'Cão', pig: 'Porco' },
  id: { rat: 'Tikus', ox: 'Kerbau', tiger: 'Macan', rabbit: 'Kelinci', dragon: 'Naga', snake: 'Ular', horse: 'Kuda', goat: 'Kambing', monkey: 'Monyet', rooster: 'Ayam', dog: 'Anjing', pig: 'Babi' },
  // ar Ox is الثور — the same word Arabic uses for Taurus. That collision is
  // correct Arabic, not a copy-paste slip; do not "fix" it to البقرة.
  ar: { rat: 'الفأر', ox: 'الثور', tiger: 'النمر', rabbit: 'الأرنب', dragon: 'التنين', snake: 'الأفعى', horse: 'الحصان', goat: 'الماعز', monkey: 'القرد', rooster: 'الديك', dog: 'الكلب', pig: 'الخنزير' },
  hi: { rat: 'चूहा', ox: 'बैल', tiger: 'बाघ', rabbit: 'खरगोश', dragon: 'ड्रैगन', snake: 'साँप', horse: 'घोड़ा', goat: 'बकरी', monkey: 'बंदर', rooster: 'मुर्गा', dog: 'कुत्ता', pig: 'सूअर' },
  ru: { rat: 'Крыса', ox: 'Бык', tiger: 'Тигр', rabbit: 'Кролик', dragon: 'Дракон', snake: 'Змея', horse: 'Лошадь', goat: 'Коза', monkey: 'Обезьяна', rooster: 'Петух', dog: 'Собака', pig: 'Свинья' },
  // vi/th follow the ja pattern — cycle-branch name + animal gloss — because
  // that is how both languages actually name a birth year (tuổi Tý, ปีชวด).
  // vi's 4th branch is Mão = mèo (cat), not the Chinese rabbit; that is the
  // year Vietnamese readers were born in, so never silently swap it to thỏ.
  vi: { rat: 'Tý (chuột)', ox: 'Sửu (trâu)', tiger: 'Dần (hổ)', rabbit: 'Mão (mèo)', dragon: 'Thìn (rồng)', snake: 'Tỵ (rắn)', horse: 'Ngọ (ngựa)', goat: 'Mùi (dê)', monkey: 'Thân (khỉ)', rooster: 'Dậu (gà)', dog: 'Tuất (chó)', pig: 'Hợi (lợn)' },
  th: { rat: 'ชวด (หนู)', ox: 'ฉลู (วัว)', tiger: 'ขาล (เสือ)', rabbit: 'เถาะ (กระต่าย)', dragon: 'มะโรง (มังกร)', snake: 'มะเส็ง (งู)', horse: 'มะเมีย (ม้า)', goat: 'มะแม (แพะ)', monkey: 'วอก (ลิง)', rooster: 'ระกา (ไก่)', dog: 'จอ (สุนัข)', pig: 'กุน (หมู)' },
};

// Localized month names (1-12, index 0-11) for the birthday line.
const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्तूबर', 'नवंबर', 'दिसंबर'],
  // ── ru: GENITIVE, deliberately — see MONTH_NAMES_RU_NOM below ──────────
  // Russian puts the month in the GENITIVE whenever a day number precedes it:
  // «11 апреля 2000». «11 апрель 2000» (nominative) is flatly ungrammatical
  // and was the single most visible defect in the Russian tree — it rendered
  // 5× on each of the 191 profiles. The vocab contract names it: «Дата
  // "21 марта" — родительный».
  // The ONLY consumer of this table is fmtBday() in seo-kpop-member.cjs, and
  // it only ever emits "<day> <month> <year>" — i.e. always the genitive slot.
  // So the ru row IS the genitive list, and the nominative citation forms are
  // kept separately below. Do not swap one for the other, and do not reach for
  // either one to build «родившиеся в апреле» — that needs a third
  // (prepositional) form this bundle never renders.
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  // ── vi: a DATE FRAGMENT, not a month label ─────────────────────────────
  // fmtBday() renders "<day> <this row> <year>". Vietnamese writes a full date
  // as "16 tháng 1 năm 1996" (or 16/1/1996) — "16 Tháng 1 1996" is English
  // word order wearing Vietnamese words, and it turns ambiguous the moment the
  // day is small ("1 Tháng 11 1996" is three bare numerals with no grammar
  // holding them together). This row therefore carries the whole "tháng N năm"
  // fragment in lowercase and is NOT a standalone month name — the month
  // headings live in seo-kpop-bmonth-l10n.js. Never prefix another "tháng".
  vi: ['tháng 1 năm', 'tháng 2 năm', 'tháng 3 năm', 'tháng 4 năm', 'tháng 5 năm', 'tháng 6 năm', 'tháng 7 năm', 'tháng 8 năm', 'tháng 9 năm', 'tháng 10 năm', 'tháng 11 năm', 'tháng 12 năm'],
  // th writes "<day> <full month> <year>" with a space around every digit run,
  // and CE years are never converted to the Buddhist era.
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
};

/* Russian months in the NOMINATIVE — the citation form the other K-pop l10n
   bundles carry. Nothing in this bundle renders a bare month name, so this
   list exists so the genitive row above is never "corrected" back, and so a
   future caller that genuinely needs «март» has it without guessing. */
const MONTH_NAMES_RU_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

/* ── Date helpers ────────────────────────────────────────────────────────
   The generator hands group-debut dates to groupLine()/soloCareer() as the raw
   ISO string off the roster ("2016-08-08"). ISO reads as machine output inside
   running prose, and the hi and vi reviewers both flagged it, so those two
   languages reformat it here. Every roster debut is strict YYYY-MM-DD; when a
   value is anything else the helpers return it untouched rather than invent a
   date. Values arrive HTML-escaped, and an ISO date carries nothing escapable,
   so parsing them is safe. */
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
function isoParts(s) {
  const mm = ISO_DATE_RE.exec(String(s == null ? '' : s));
  return mm ? { y: +mm[1], m: +mm[2], d: +mm[3] } : null;
}
// hi: day-then-month, month spelled out, Western digits — the same shape the
// birthday two paragraphs above already uses ("16 जनवरी 1996").
const hiDate = (s) => { const p = isoParts(s); return p ? `${p.d} ${MONTH_NAMES.hi[p.m - 1]} ${p.y}` : String(s); };
// vi: the long form "ngày 8 tháng 8 năm 2016", matching the birthday on the
// same page — vocab §7 allows d/m/yyyy or the long form but says to hold one
// form per page, and fmtBday() can only produce the long one.
const viDate = (s) => { const p = isoParts(s); return p ? `ngày ${p.d} ${MONTH_NAMES.vi[p.m - 1]} ${p.y}` : String(s); };

/* ── hi genitive postposition ────────────────────────────────────────────
   In "GROUP का/की NAME" the postposition agrees with the HEAD noun — the
   idol's name — not with the group, so a female idol takes की and a male के.
   Shipping a fixed के made roughly half the roster (Jennie, Lisa, Karina,
   Winter, Nayeon…) ungrammatical in the <title>, meta description, og:title
   and og:image:alt: the strings a reader sees before opening the page.
   The generator does not pass the idol's sex today, so with no third argument
   these templates fall back to the name-first form the H1 already uses, which
   needs no agreement at all and is correct for everyone. Pass the roster's
   act.gender ('girl'/'boy') or 'female'/'male'/'f'/'m' as the third argument
   and the genitive form is emitted instead. NOTE: body copy such as
   "Jennie BLACKPINK के मेंबर हैं" is already correct and must NOT be gendered —
   there the head noun is मेंबर (masculine), not the name. */
const HI_FEM = /^(f|female|girl|girls|woman|women)$/i;
const HI_MASC = /^(m|male|boy|boys|man|men)$/i;
const hiPost = (gender) => {
  const g = String(gender == null ? '' : gender).trim();
  if (HI_FEM.test(g)) return 'की';
  if (HI_MASC.test(g)) return 'के';
  return null; // unknown → caller uses the agreement-free "NAME (GROUP)" form
};
const hiHead = (m, g, gender) => { const p = hiPost(gender); return p ? `${g} ${p} ${m}` : `${m} (${g})`; };

/* UI string templates. Functions take plain facts and return localized text.
   `m` = member name, `g` = group/act name, `d` = formatted birthday string,
   `s` = localized sign name, `z` = localized animal name, `ag` = agency. */
const T = {
  en: {
    typeMember: 'member', typeSoloist: 'soloist',
    badge: 'K-Pop profile',
    h1: (m, g) => `${m} (${g}) — Profile, Birthday & Zodiac`,
    title: (m, g) => `${m} of ${g}: Birthday, Zodiac Sign & Profile | KoreaPlus`,
    // Soloist <title>. The generator currently assembles this inline as
    // `${m}: ${fBirthday} · ${fSign} | KoreaPlus`, which is how Title Case and
    // the " · " separator leaked into ru/vi/th — both banned by their vocab
    // contracts. Every language below reproduces its CURRENT output except
    // ru/vi/th, which use the wording their reviewers supplied. Once the
    // generator calls t.soloTitle(m), only those three change.
    soloTitle: (m) => `${m}: Birthday · Star sign | KoreaPlus`,
    desc: (m, g) => `${m} from ${g}: verified birthday, Western zodiac sign, Chinese zodiac and group facts. A fact-checked K-pop member profile.`,
    soloDesc: (m) => `${m}: verified birthday, Western zodiac sign, Chinese zodiac and career facts. A fact-checked K-pop profile.`,
    lead: (m, g) => `${m} is a member of the K-pop group ${g}. Below are the verified, publicly known facts — birthday, star sign and group details.`,
    soloLead: (m) => `${m} is a K-pop artist. Below are the verified, publicly known facts — birthday, star sign and career details.`,
    hFacts: '🔑 Key facts',
    hBirthday: '🎂 Birthday & age',
    hZodiac: '♈ Star sign & Chinese zodiac',
    hGroup: '🎤 Group',
    hSolo: '🎶 Artist',
    hFaq: '❓ FAQ',
    hMore: '👥 Other members',
    fGroup: 'Group', fAgency: 'Agency', fDebut: 'Group debut', fBirthday: 'Birthday', fSign: 'Star sign', fZodiac: 'Chinese zodiac', fFandom: 'Fandom', fActDebut: 'Debut',
    bornLine: (m, d) => `${m} was born on ${d}.`,
    noBday: (m) => `A verified public birthday for ${m} is not listed here. The other facts below are confirmed.`,
    signLine: (m, s, em) => `Based on that date, ${m}'s Western (tropical) zodiac sign is <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `By solar birth year, ${m}'s Chinese zodiac animal is the <strong>${z}</strong> ${em}.`,
    groupLine: (m, g, ag, debut) => `${m} is part of <strong>${g}</strong>, managed by ${ag}. ${g} debuted on ${debut}.`,
    soloCareer: (m, ag, debut) => `${m} is managed by ${ag} and debuted on ${debut}.`,
    hedge: 'Born near Lunar New Year — the Chinese zodiac year can shift by one animal depending on the exact lunar date.',
    qBday: (m) => `When is ${m}'s birthday?`,
    aBday: (m, d) => `${m} was born on ${d}.`,
    aBdayNone: (m) => `A verified birthday for ${m} is not published on this page.`,
    qSign: (m) => `What is ${m}'s zodiac sign?`,
    aSign: (m, s) => `${m}'s Western zodiac sign is ${s}.`,
    qGroup: (m) => `What group is ${m} in?`,
    aGroup: (m, g) => `${m} is a member of ${g}.`,
    aSolo: (m) => `${m} is a soloist.`,
  },
  ja: {
    typeMember: 'メンバー', typeSoloist: 'ソロ',
    badge: 'K-POPプロフィール',
    h1: (m, g) => `${m}(${g})— プロフィール・誕生日・星座`,
    title: (m, g) => `${g}の${m}：誕生日・星座・プロフィール | KoreaPlus`,
    soloTitle: (m) => `${m}: 誕生日 · 星座 | KoreaPlus`,
    desc: (m, g) => `${g}の${m}：確認済みの誕生日、西洋占星術の星座、干支、グループ情報。ファクトチェック済みK-POPプロフィール。`,
    soloDesc: (m) => `${m}：確認済みの誕生日、星座、干支、活動情報。ファクトチェック済みK-POPプロフィール。`,
    lead: (m, g) => `${m}はK-POPグループ${g}のメンバーです。以下は公開されている確認済みの事実 — 誕生日、星座、グループ情報です。`,
    soloLead: (m) => `${m}はK-POPアーティストです。以下は公開されている確認済みの事実 — 誕生日、星座、活動情報です。`,
    hFacts: '🔑 基本情報',
    hBirthday: '🎂 誕生日と年齢',
    hZodiac: '♈ 星座と干支',
    hGroup: '🎤 グループ',
    hSolo: '🎶 アーティスト',
    hFaq: '❓ よくある質問',
    hMore: '👥 他のメンバー',
    fGroup: 'グループ', fAgency: '事務所', fDebut: 'グループデビュー', fBirthday: '誕生日', fSign: '星座', fZodiac: '干支', fFandom: 'ファンダム', fActDebut: 'デビュー',
    bornLine: (m, d) => `${m}は${d}生まれです。`,
    noBday: (m) => `${m}の確認済みの公開誕生日はここに記載されていません。以下の他の事実は確認済みです。`,
    signLine: (m, s, em) => `この日付から、${m}の西洋占星術の星座は<strong>${s}</strong> ${em}です。`,
    zodiacLine: (m, z, em) => `太陽暦の出生年から、${m}の干支は<strong>${z}</strong> ${em}です。`,
    groupLine: (m, g, ag, debut) => `${m}は<strong>${g}</strong>のメンバーで、${ag}に所属しています。${g}は${debut}にデビューしました。`,
    soloCareer: (m, ag, debut) => `${m}は${ag}に所属し、${debut}にデビューしました。`,
    hedge: '旧正月前後の生まれ — 正確な旧暦によっては干支が一つずれる場合があります。',
    qBday: (m) => `${m}の誕生日はいつですか？`,
    aBday: (m, d) => `${m}は${d}生まれです。`,
    aBdayNone: (m) => `${m}の確認済みの誕生日はこのページには掲載されていません。`,
    qSign: (m) => `${m}の星座は何ですか？`,
    aSign: (m, s) => `${m}の西洋占星術の星座は${s}です。`,
    qGroup: (m) => `${m}はどのグループに所属していますか？`,
    aGroup: (m, g) => `${m}は${g}のメンバーです。`,
    aSolo: (m) => `${m}はソロアーティストです。`,
  },
  zh: {
    typeMember: '成员', typeSoloist: 'solo 歌手',
    badge: 'K-pop 资料',
    h1: (m, g) => `${m}（${g}）— 资料、生日与星座`,
    title: (m, g) => `${g}的${m}：生日、星座与个人资料 | KoreaPlus`,
    soloTitle: (m) => `${m}: 生日 · 星座 | KoreaPlus`,
    desc: (m, g) => `${g}的${m}：经核实的生日、西方星座、生肖与团体信息。一份经事实核查的 K-pop 成员资料。`,
    soloDesc: (m) => `${m}：经核实的生日、星座、生肖与出道信息。一份经事实核查的 K-pop 资料。`,
    lead: (m, g) => `${m}是 K-pop 团体${g}的成员。以下是公开且经核实的资料 — 生日、星座与团体信息。`,
    soloLead: (m) => `${m}是 K-pop 歌手。以下是公开且经核实的资料 — 生日、星座与出道信息。`,
    hFacts: '🔑 关键信息',
    hBirthday: '🎂 生日与年龄',
    hZodiac: '♈ 星座与生肖',
    hGroup: '🎤 团体',
    hSolo: '🎶 歌手',
    hFaq: '❓ 常见问题',
    hMore: '👥 其他成员',
    fGroup: '团体', fAgency: '经纪公司', fDebut: '团体出道', fBirthday: '生日', fSign: '星座', fZodiac: '生肖', fFandom: '粉丝名', fActDebut: '出道',
    bornLine: (m, d) => `${m}出生于${d}。`,
    noBday: (m) => `本页未列出${m}经核实的公开生日。以下其他信息均已确认。`,
    signLine: (m, s, em) => `根据该日期，${m}的西方（回归）星座是<strong>${s}</strong> ${em}。`,
    zodiacLine: (m, z, em) => `按公历出生年份，${m}的生肖是<strong>${z}</strong> ${em}。`,
    groupLine: (m, g, ag, debut) => `${m}是<strong>${g}</strong>的成员，所属公司为${ag}。${g}于${debut}出道。`,
    soloCareer: (m, ag, debut) => `${m}所属${ag}，于${debut}出道。`,
    hedge: '出生于春节前后 —— 生肖年份可能因确切农历日期而相差一个属相。',
    qBday: (m) => `${m}的生日是什么时候？`,
    aBday: (m, d) => `${m}出生于${d}。`,
    aBdayNone: (m) => `本页未公布${m}经核实的生日。`,
    qSign: (m) => `${m}是什么星座？`,
    aSign: (m, s) => `${m}的西方星座是${s}。`,
    qGroup: (m) => `${m}属于哪个团体？`,
    aGroup: (m, g) => `${m}是${g}的成员。`,
    aSolo: (m) => `${m}是 solo 歌手。`,
  },
  es: {
    typeMember: 'integrante', typeSoloist: 'solista',
    badge: 'Perfil K-pop',
    h1: (m, g) => `${m} (${g}) — Perfil, cumpleaños y signo`,
    title: (m, g) => `${m} de ${g}: cumpleaños, signo zodiacal y perfil | KoreaPlus`,
    soloTitle: (m) => `${m}: Cumpleaños · Signo | KoreaPlus`,
    desc: (m, g) => `${m} de ${g}: cumpleaños verificado, signo del zodiaco occidental, zodiaco chino y datos del grupo. Un perfil de K-pop verificado.`,
    soloDesc: (m) => `${m}: cumpleaños verificado, signo zodiacal, zodiaco chino y datos de carrera. Un perfil de K-pop verificado.`,
    lead: (m, g) => `${m} es integrante del grupo de K-pop ${g}. Aquí están los datos públicos y verificados — cumpleaños, signo y detalles del grupo.`,
    soloLead: (m) => `${m} es artista de K-pop. Aquí están los datos públicos y verificados — cumpleaños, signo y detalles de carrera.`,
    hFacts: '🔑 Datos clave',
    hBirthday: '🎂 Cumpleaños y edad',
    hZodiac: '♈ Signo y zodiaco chino',
    hGroup: '🎤 Grupo',
    hSolo: '🎶 Artista',
    hFaq: '❓ Preguntas frecuentes',
    hMore: '👥 Otros integrantes',
    fGroup: 'Grupo', fAgency: 'Agencia', fDebut: 'Debut del grupo', fBirthday: 'Cumpleaños', fSign: 'Signo', fZodiac: 'Zodiaco chino', fFandom: 'Fandom', fActDebut: 'Debut',
    bornLine: (m, d) => `${m} nació el ${d}.`,
    noBday: (m) => `Aquí no figura un cumpleaños público verificado de ${m}. Los demás datos están confirmados.`,
    signLine: (m, s, em) => `Según esa fecha, el signo del zodiaco occidental (tropical) de ${m} es <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `Por año solar de nacimiento, el animal del zodiaco chino de ${m} es el <strong>${z}</strong> ${em}.`,
    groupLine: (m, g, ag, debut) => `${m} forma parte de <strong>${g}</strong>, gestionado por ${ag}. ${g} debutó el ${debut}.`,
    soloCareer: (m, ag, debut) => `${m} está bajo ${ag} y debutó el ${debut}.`,
    hedge: 'Nacido cerca del Año Nuevo Lunar — el año del zodiaco chino puede variar en un animal según la fecha lunar exacta.',
    qBday: (m) => `¿Cuándo es el cumpleaños de ${m}?`,
    aBday: (m, d) => `${m} nació el ${d}.`,
    aBdayNone: (m) => `En esta página no se publica un cumpleaños verificado de ${m}.`,
    qSign: (m) => `¿Cuál es el signo zodiacal de ${m}?`,
    aSign: (m, s) => `El signo del zodiaco occidental de ${m} es ${s}.`,
    qGroup: (m) => `¿En qué grupo está ${m}?`,
    aGroup: (m, g) => `${m} es integrante de ${g}.`,
    aSolo: (m) => `${m} es solista.`,
  },
  ko: {
    typeMember: '멤버', typeSoloist: '솔로',
    badge: 'K-pop 프로필',
    h1: (m, g) => `${m} (${g}) — 프로필 · 생일 · 별자리`,
    title: (m, g) => `${g} ${m}: 생일 · 별자리 · 프로필 | KoreaPlus`,
    soloTitle: (m) => `${m}: 생일 · 별자리 | KoreaPlus`,
    desc: (m, g) => `${g} ${m}: 검증된 생일, 서양 별자리, 띠, 그룹 정보. 팩트체크한 K-pop 멤버 프로필.`,
    soloDesc: (m) => `${m}: 검증된 생일, 별자리, 띠, 활동 정보. 팩트체크한 K-pop 프로필.`,
    lead: (m, g) => `${m}은(는) K-pop 그룹 ${g}의 멤버입니다. 아래는 공개된 검증 사실 — 생일, 별자리, 그룹 정보입니다.`,
    soloLead: (m) => `${m}은(는) K-pop 아티스트입니다. 아래는 공개된 검증 사실 — 생일, 별자리, 활동 정보입니다.`,
    hFacts: '🔑 핵심 정보',
    hBirthday: '🎂 생일과 나이',
    hZodiac: '♈ 별자리와 띠',
    hGroup: '🎤 그룹',
    hSolo: '🎶 아티스트',
    hFaq: '❓ 자주 묻는 질문',
    hMore: '👥 다른 멤버',
    fGroup: '그룹', fAgency: '소속사', fDebut: '그룹 데뷔', fBirthday: '생일', fSign: '별자리', fZodiac: '띠', fFandom: '팬덤', fActDebut: '데뷔',
    bornLine: (m, d) => `${m}은(는) ${d}에 태어났습니다.`,
    noBday: (m) => `${m}의 검증된 공개 생일은 여기에 기재되지 않았습니다. 아래의 다른 사실은 확인되었습니다.`,
    signLine: (m, s, em) => `이 날짜를 기준으로 ${m}의 서양(트로피컬) 별자리는 <strong>${s}</strong> ${em}입니다.`,
    zodiacLine: (m, z, em) => `양력 출생 연도 기준 ${m}의 띠는 <strong>${z}</strong> ${em}입니다.`,
    groupLine: (m, g, ag, debut) => `${m}은(는) <strong>${g}</strong> 소속으로, ${ag}에서 활동합니다. ${g}은(는) ${debut}에 데뷔했습니다.`,
    soloCareer: (m, ag, debut) => `${m}은(는) ${ag} 소속이며 ${debut}에 데뷔했습니다.`,
    hedge: '음력설 무렵 출생 — 정확한 음력 날짜에 따라 띠가 한 동물 차이로 달라질 수 있습니다.',
    qBday: (m) => `${m}의 생일은 언제인가요?`,
    aBday: (m, d) => `${m}은(는) ${d}에 태어났습니다.`,
    aBdayNone: (m) => `이 페이지에는 ${m}의 검증된 생일이 게시되지 않았습니다.`,
    qSign: (m) => `${m}의 별자리는 무엇인가요?`,
    aSign: (m, s) => `${m}의 서양 별자리는 ${s}입니다.`,
    qGroup: (m) => `${m}은(는) 어느 그룹 소속인가요?`,
    aGroup: (m, g) => `${m}은(는) ${g}의 멤버입니다.`,
    aSolo: (m) => `${m}은(는) 솔로 아티스트입니다.`,
  },
  fr: {
    typeMember: 'membre', typeSoloist: 'soliste',
    badge: 'Profil K-pop',
    h1: (m, g) => `${m} (${g}) — Profil, anniversaire et signe`,
    title: (m, g) => `${m} de ${g} : anniversaire, signe astrologique et profil | KoreaPlus`,
    soloTitle: (m) => `${m}: Anniversaire · Signe | KoreaPlus`,
    desc: (m, g) => `${m} de ${g} : anniversaire vérifié, signe du zodiaque occidental, zodiaque chinois et infos du groupe. Un profil K-pop vérifié.`,
    soloDesc: (m) => `${m} : anniversaire vérifié, signe astrologique, zodiaque chinois et carrière. Un profil K-pop vérifié.`,
    lead: (m, g) => `${m} est membre du groupe de K-pop ${g}. Voici les faits publics et vérifiés — anniversaire, signe et détails du groupe.`,
    soloLead: (m) => `${m} est un(e) artiste de K-pop. Voici les faits publics et vérifiés — anniversaire, signe et carrière.`,
    hFacts: '🔑 Infos clés',
    hBirthday: '🎂 Anniversaire et âge',
    hZodiac: '♈ Signe et zodiaque chinois',
    hGroup: '🎤 Groupe',
    hSolo: '🎶 Artiste',
    hFaq: '❓ FAQ',
    hMore: '👥 Autres membres',
    fGroup: 'Groupe', fAgency: 'Agence', fDebut: 'Débuts du groupe', fBirthday: 'Anniversaire', fSign: 'Signe', fZodiac: 'Zodiaque chinois', fFandom: 'Fandom', fActDebut: 'Débuts',
    bornLine: (m, d) => `${m} est né(e) le ${d}.`,
    noBday: (m) => `Aucun anniversaire public vérifié de ${m} n'est indiqué ici. Les autres faits ci-dessous sont confirmés.`,
    signLine: (m, s, em) => `D'après cette date, le signe du zodiaque occidental (tropical) de ${m} est <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `Selon l'année solaire de naissance, l'animal du zodiaque chinois de ${m} est le <strong>${z}</strong> ${em}.`,
    groupLine: (m, g, ag, debut) => `${m} fait partie de <strong>${g}</strong>, géré par ${ag}. ${g} a débuté le ${debut}.`,
    soloCareer: (m, ag, debut) => `${m} est géré(e) par ${ag} et a débuté le ${debut}.`,
    hedge: 'Né(e) près du Nouvel An lunaire — l\'année du zodiaque chinois peut varier d\'un animal selon la date lunaire exacte.',
    qBday: (m) => `Quand est l'anniversaire de ${m} ?`,
    aBday: (m, d) => `${m} est né(e) le ${d}.`,
    aBdayNone: (m) => `Aucun anniversaire vérifié de ${m} n'est publié sur cette page.`,
    qSign: (m) => `Quel est le signe astrologique de ${m} ?`,
    aSign: (m, s) => `Le signe du zodiaque occidental de ${m} est ${s}.`,
    qGroup: (m) => `Dans quel groupe est ${m} ?`,
    aGroup: (m, g) => `${m} est membre de ${g}.`,
    aSolo: (m) => `${m} est soliste.`,
  },
  de: {
    typeMember: 'Mitglied', typeSoloist: 'Solokünstler',
    badge: 'K-Pop-Profil',
    h1: (m, g) => `${m} (${g}) — Profil, Geburtstag & Sternzeichen`,
    title: (m, g) => `${m} von ${g}: Geburtstag, Sternzeichen & Profil | KoreaPlus`,
    soloTitle: (m) => `${m}: Geburtstag · Sternzeichen | KoreaPlus`,
    desc: (m, g) => `${m} von ${g}: geprüfter Geburtstag, westliches Sternzeichen, chinesisches Tierkreiszeichen und Gruppeninfos. Ein faktengeprüftes K-Pop-Profil.`,
    soloDesc: (m) => `${m}: geprüfter Geburtstag, Sternzeichen, chinesisches Tierkreiszeichen und Karriere. Ein faktengeprüftes K-Pop-Profil.`,
    lead: (m, g) => `${m} ist Mitglied der K-Pop-Gruppe ${g}. Hier die öffentlich bekannten, geprüften Fakten — Geburtstag, Sternzeichen und Gruppendetails.`,
    soloLead: (m) => `${m} ist ein(e) K-Pop-Künstler(in). Hier die öffentlich bekannten, geprüften Fakten — Geburtstag, Sternzeichen und Karriere.`,
    hFacts: '🔑 Eckdaten',
    hBirthday: '🎂 Geburtstag & Alter',
    hZodiac: '♈ Sternzeichen & chinesisches Tierkreiszeichen',
    hGroup: '🎤 Gruppe',
    hSolo: '🎶 Künstler',
    hFaq: '❓ FAQ',
    hMore: '👥 Weitere Mitglieder',
    fGroup: 'Gruppe', fAgency: 'Agentur', fDebut: 'Gruppendebüt', fBirthday: 'Geburtstag', fSign: 'Sternzeichen', fZodiac: 'Chin. Tierkreis', fFandom: 'Fandom', fActDebut: 'Debüt',
    bornLine: (m, d) => `${m} wurde am ${d} geboren.`,
    noBday: (m) => `Ein geprüfter öffentlicher Geburtstag von ${m} ist hier nicht aufgeführt. Die übrigen Fakten unten sind bestätigt.`,
    signLine: (m, s, em) => `Auf Basis dieses Datums ist das westliche (tropische) Sternzeichen von ${m} <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `Nach dem solaren Geburtsjahr ist das chinesische Tierkreiszeichen von ${m} der/die <strong>${z}</strong> ${em}.`,
    groupLine: (m, g, ag, debut) => `${m} gehört zu <strong>${g}</strong>, gemanagt von ${ag}. ${g} debütierte am ${debut}.`,
    soloCareer: (m, ag, debut) => `${m} wird von ${ag} gemanagt und debütierte am ${debut}.`,
    hedge: 'Nahe dem Mondneujahr geboren — das chinesische Tierkreisjahr kann sich je nach genauem Monddatum um ein Tier verschieben.',
    qBday: (m) => `Wann hat ${m} Geburtstag?`,
    aBday: (m, d) => `${m} wurde am ${d} geboren.`,
    aBdayNone: (m) => `Auf dieser Seite ist kein geprüfter Geburtstag von ${m} veröffentlicht.`,
    qSign: (m) => `Welches Sternzeichen hat ${m}?`,
    aSign: (m, s) => `Das westliche Sternzeichen von ${m} ist ${s}.`,
    qGroup: (m) => `In welcher Gruppe ist ${m}?`,
    aGroup: (m, g) => `${m} ist Mitglied von ${g}.`,
    aSolo: (m) => `${m} ist Solokünstler(in).`,
  },
  pt: {
    typeMember: 'integrante', typeSoloist: 'solista',
    badge: 'Perfil K-pop',
    h1: (m, g) => `${m} (${g}) — Perfil, aniversário e signo`,
    title: (m, g) => `${m} de ${g}: aniversário, signo e perfil | KoreaPlus`,
    soloTitle: (m) => `${m}: Aniversário · Signo | KoreaPlus`,
    desc: (m, g) => `${m} de ${g}: aniversário verificado, signo do zodíaco ocidental, zodíaco chinês e dados do grupo. Um perfil de K-pop verificado.`,
    soloDesc: (m) => `${m}: aniversário verificado, signo, zodíaco chinês e dados da carreira. Um perfil de K-pop verificado.`,
    lead: (m, g) => `${m} é integrante do grupo de K-pop ${g}. Abaixo estão os fatos públicos e verificados — aniversário, signo e detalhes do grupo.`,
    soloLead: (m) => `${m} é artista de K-pop. Abaixo estão os fatos públicos e verificados — aniversário, signo e detalhes da carreira.`,
    hFacts: '🔑 Dados principais',
    hBirthday: '🎂 Aniversário e idade',
    hZodiac: '♈ Signo e zodíaco chinês',
    hGroup: '🎤 Grupo',
    hSolo: '🎶 Artista',
    hFaq: '❓ Perguntas frequentes',
    hMore: '👥 Outros integrantes',
    fGroup: 'Grupo', fAgency: 'Agência', fDebut: 'Estreia do grupo', fBirthday: 'Aniversário', fSign: 'Signo', fZodiac: 'Zodíaco chinês', fFandom: 'Fandom', fActDebut: 'Estreia',
    bornLine: (m, d) => `${m} nasceu em ${d}.`,
    noBday: (m) => `Um aniversário público verificado de ${m} não consta aqui. Os demais fatos abaixo estão confirmados.`,
    signLine: (m, s, em) => `Com base nessa data, o signo do zodíaco ocidental (tropical) de ${m} é <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `Pelo ano solar de nascimento, o animal do zodíaco chinês de ${m} é o <strong>${z}</strong> ${em}.`,
    groupLine: (m, g, ag, debut) => `${m} faz parte de <strong>${g}</strong>, gerido por ${ag}. ${g} estreou em ${debut}.`,
    soloCareer: (m, ag, debut) => `${m} é gerido(a) por ${ag} e estreou em ${debut}.`,
    hedge: 'Nascido(a) perto do Ano Novo Lunar — o ano do zodíaco chinês pode variar em um animal conforme a data lunar exata.',
    qBday: (m) => `Quando é o aniversário de ${m}?`,
    aBday: (m, d) => `${m} nasceu em ${d}.`,
    aBdayNone: (m) => `Esta página não publica um aniversário verificado de ${m}.`,
    qSign: (m) => `Qual é o signo de ${m}?`,
    aSign: (m, s) => `O signo do zodíaco ocidental de ${m} é ${s}.`,
    qGroup: (m) => `De qual grupo ${m} faz parte?`,
    aGroup: (m, g) => `${m} é integrante de ${g}.`,
    aSolo: (m) => `${m} é solista.`,
  },
  id: {
    typeMember: 'anggota', typeSoloist: 'solois',
    badge: 'Profil K-pop',
    h1: (m, g) => `${m} (${g}) — Profil, Ulang Tahun & Zodiak`,
    title: (m, g) => `${m} dari ${g}: ulang tahun, zodiak & profil | KoreaPlus`,
    soloTitle: (m) => `${m}: Ulang tahun · Zodiak | KoreaPlus`,
    desc: (m, g) => `${m} dari ${g}: tanggal lahir terverifikasi, zodiak Barat, shio, dan info grup. Profil anggota K-pop yang telah dicek faktanya.`,
    soloDesc: (m) => `${m}: tanggal lahir terverifikasi, zodiak, shio, dan info karier. Profil K-pop yang telah dicek faktanya.`,
    lead: (m, g) => `${m} adalah anggota grup K-pop ${g}. Berikut fakta publik yang terverifikasi — tanggal lahir, zodiak, dan detail grup.`,
    soloLead: (m) => `${m} adalah artis K-pop. Berikut fakta publik yang terverifikasi — tanggal lahir, zodiak, dan detail karier.`,
    hFacts: '🔑 Fakta utama',
    hBirthday: '🎂 Ulang tahun & usia',
    hZodiac: '♈ Zodiak & shio',
    hGroup: '🎤 Grup',
    hSolo: '🎶 Artis',
    hFaq: '❓ Tanya jawab',
    hMore: '👥 Anggota lain',
    fGroup: 'Grup', fAgency: 'Agensi', fDebut: 'Debut grup', fBirthday: 'Ulang tahun', fSign: 'Zodiak', fZodiac: 'Shio', fFandom: 'Fandom', fActDebut: 'Debut',
    bornLine: (m, d) => `${m} lahir pada ${d}.`,
    noBday: (m) => `Tanggal lahir publik ${m} yang terverifikasi tidak tercantum di sini. Fakta lainnya di bawah sudah dikonfirmasi.`,
    signLine: (m, s, em) => `Berdasarkan tanggal itu, zodiak Barat (tropis) ${m} adalah <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `Menurut tahun lahir Masehi, shio ${m} adalah <strong>${z}</strong> ${em}.`,
    groupLine: (m, g, ag, debut) => `${m} tergabung dalam <strong>${g}</strong>, dikelola oleh ${ag}. ${g} debut pada ${debut}.`,
    soloCareer: (m, ag, debut) => `${m} dikelola oleh ${ag} dan debut pada ${debut}.`,
    hedge: 'Lahir dekat Tahun Baru Imlek — tahun shio bisa bergeser satu hewan tergantung tanggal lunar yang tepat.',
    qBday: (m) => `Kapan ulang tahun ${m}?`,
    aBday: (m, d) => `${m} lahir pada ${d}.`,
    aBdayNone: (m) => `Halaman ini tidak memuat tanggal lahir ${m} yang terverifikasi.`,
    qSign: (m) => `Apa zodiak ${m}?`,
    aSign: (m, s) => `Zodiak Barat ${m} adalah ${s}.`,
    qGroup: (m) => `${m} anggota grup apa?`,
    aGroup: (m, g) => `${m} adalah anggota ${g}.`,
    aSolo: (m) => `${m} adalah solois.`,
  },
  // ar is the one language here that cases the loanword "K-Pop": that is the
  // form already shipped in messages/ar.json (nav.kpop / cat.kpop), and the
  // app chrome and the SEO chrome have to say the same word.
  // Every sentence avoids a gendered verb (من مواليد / من أعضاء rather than
  // وُلد / هو عضو) because the roster mixes male and female idols and this
  // file never guesses which.
  ar: {
    typeMember: 'عضو', typeSoloist: 'فنان منفرد',
    badge: 'ملف K-Pop',
    h1: (m, g) => `${m} (${g}) — الملف الشخصي وتاريخ الميلاد والبرج`,
    title: (m, g) => `${m} من ${g}: تاريخ الميلاد والبرج والملف الشخصي | KoreaPlus`,
    // reproduces the title the ar soloist pages already ship (the ar reviewer
    // read one and did not object) — only ru/vi/th change wording here.
    soloTitle: (m) => `${m}: تاريخ الميلاد · البرج | KoreaPlus`,
    desc: (m, g) => `${m} من ${g}: تاريخ الميلاد الموثَّق والبرج الغربي والبرج الصيني ومعلومات الفرقة. ملف عضو K-Pop مُدقَّق الحقائق.`,
    soloDesc: (m) => `${m}: تاريخ الميلاد الموثَّق والبرج الغربي والبرج الصيني ومعلومات المسيرة الفنية. ملف K-Pop مُدقَّق الحقائق.`,
    lead: (m, g) => `${m} من أعضاء فرقة K-Pop ${g}. فيما يلي الحقائق المعلنة الموثَّقة — تاريخ الميلاد والبرج وتفاصيل الفرقة.`,
    soloLead: (m) => `${m} من نجوم K-Pop. فيما يلي الحقائق المعلنة الموثَّقة — تاريخ الميلاد والبرج وتفاصيل المسيرة الفنية.`,
    hFacts: '🔑 الحقائق الأساسية',
    hBirthday: '🎂 تاريخ الميلاد والعمر',
    hZodiac: '♈ البرج الغربي والبرج الصيني',
    hGroup: '🎤 الفرقة',
    // "الفنان" is masculine and this heading sits over IU, TAEYEON, LISA…;
    // the section itself is about the career (agency + first release), so the
    // gender-free noun phrase is both accurate and consistent with soloDesc.
    hSolo: '🎶 المسيرة الفنية',
    hFaq: '❓ الأسئلة الشائعة',
    hMore: '👥 أعضاء آخرون',
    fGroup: 'الفرقة', fAgency: 'شركة الترفيه', fDebut: 'ظهور الفرقة الأول', fBirthday: 'تاريخ الميلاد', fSign: 'البرج', fZodiac: 'البرج الصيني', fFandom: 'الفاندوم', fActDebut: 'الظهور الأول',
    bornLine: (m, d) => `${m} من مواليد ${d}.`,
    noBday: (m) => `لا يرد هنا تاريخ ميلاد مُعلَن وموثَّق لـ${m}. أما بقية الحقائق أدناه فمؤكَّدة.`,
    signLine: (m, s, em) => `بناءً على هذا التاريخ، برج ${m} الغربي (الاستوائي) هو <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `حسب سنة الميلاد الشمسية، حيوان ${m} في البرج الصيني هو <strong>${z}</strong> ${em}.`,
    groupLine: (m, g, ag, debut) => `${m} من أعضاء <strong>${g}</strong>، وتديرها ${ag}. ظهرت ${g} لأول مرة في ${debut}.`,
    // «وكان أول ظهور فني» is an indefinite subject with no possessor — "and a
    // first appearance happened", leaving the reader to ask whose. The definite
    // «الظهور الفني الأول» fixes it without introducing a gendered pronoun,
    // which this block deliberately avoids.
    soloCareer: (m, ag, debut) => `${m} تحت إدارة ${ag}، وكان الظهور الفني الأول في ${debut}.`,
    // HEDGE — load-bearing. The vocab contract fixes both halves: the
    // (أواخر يناير إلى منتصف فبراير) window that makes the warning actionable,
    // and the explicit «وليس في 1 يناير». The 12 Chinese-zodiac pages already
    // ship the full sentence; this one had been trimmed to «لا في 1 يناير».
    hedge: 'ميلاد قريب من رأس السنة القمرية — السنة الصينية تتغيّر في رأس السنة القمرية (أواخر يناير إلى منتصف فبراير)، وليس في 1 يناير، وقد يختلف الحيوان بمقدار واحد حسب التاريخ القمري الدقيق.',
    qBday: (m) => `متى تاريخ ميلاد ${m}؟`,
    aBday: (m, d) => `${m} من مواليد ${d}.`,
    aBdayNone: (m) => `لم يُنشر في هذه الصفحة تاريخ ميلاد موثَّق لـ${m}.`,
    qSign: (m) => `ما برج ${m}؟`,
    aSign: (m, s) => `برج ${m} الغربي هو ${s}.`,
    // One question serves both page types, so it cannot presuppose a group:
    // «ما فرقة IU؟» on a soloist profile asks which group she is in and is then
    // answered "she is a soloist". «هل لدى … فرقة؟» works for both, and لدى
    // takes no gender agreement (unlike ينتمي). The soloist answer opens with
    // «لا،» so it actually responds to the question.
    qGroup: (m) => `هل لدى ${m} فرقة؟`,
    aGroup: (m, g) => `${m} من أعضاء ${g}.`,
    aSolo: (m) => `لا، ${m} من الفنانين المنفردين.`,
  },
  // hi writes "K-pop" — the casing this module family uses. build-seo.cjs
  // emits "K-Pop"; normalizing either one to the other is itself a drift.
  hi: {
    typeMember: 'मेंबर', typeSoloist: 'सोलो आर्टिस्ट',
    badge: 'K-pop प्रोफाइल',
    h1: (m, g) => `${m} (${g}) — प्रोफाइल, जन्मदिन और राशि`,
    // See hiHead()/hiPost() above: the genitive agrees with the idol's name,
    // so a fixed «के» was wrong for every female idol in the roster. With no
    // gender argument these emit the agreement-free «Jennie (BLACKPINK): …».
    title: (m, g, gender) => `${hiHead(m, g, gender)}: जन्मदिन, राशि और प्रोफाइल | KoreaPlus`,
    soloTitle: (m) => `${m}: जन्मदिन · राशि | KoreaPlus`,
    desc: (m, g, gender) => `${hiHead(m, g, gender)}: वेरिफाइड जन्म तिथि, पश्चिमी राशि, चीनी राशिचक्र और ग्रुप से जुड़े तथ्य। तथ्य-जाँच किया गया K-pop मेंबर प्रोफाइल।`,
    soloDesc: (m) => `${m}: वेरिफाइड जन्म तिथि, पश्चिमी राशि, चीनी राशिचक्र और करियर से जुड़े तथ्य। तथ्य-जाँच किया गया K-pop प्रोफाइल।`,
    lead: (m, g) => `${m} K-pop ग्रुप ${g} के मेंबर हैं। नीचे सार्वजनिक रूप से ज्ञात और वेरिफाइड तथ्य हैं — जन्मदिन, राशि और ग्रुप की जानकारी।`,
    soloLead: (m) => `${m} K-pop आर्टिस्ट हैं। नीचे सार्वजनिक रूप से ज्ञात और वेरिफाइड तथ्य हैं — जन्मदिन, राशि और करियर की जानकारी।`,
    hFacts: '🔑 मुख्य तथ्य',
    hBirthday: '🎂 जन्मदिन और उम्र',
    hZodiac: '♈ राशि और चीनी राशिचक्र',
    hGroup: '🎤 ग्रुप',
    hSolo: '🎶 आर्टिस्ट',
    hFaq: '❓ अक्सर पूछे जाने वाले सवाल',
    hMore: '👥 दूसरे मेंबर',
    fGroup: 'ग्रुप', fAgency: 'एजेंसी', fDebut: 'ग्रुप डेब्यू', fBirthday: 'जन्मदिन', fSign: 'राशि', fZodiac: 'चीनी राशिचक्र', fFandom: 'फैनडम', fActDebut: 'डेब्यू',
    bornLine: (m, d) => `${m} का जन्म ${d} को हुआ था।`,
    noBday: (m) => `${m} की वेरिफाइड सार्वजनिक जन्म तिथि यहाँ दर्ज नहीं है। नीचे दिए बाकी तथ्य पुष्ट हैं।`,
    signLine: (m, s, em) => `इस तारीख के हिसाब से ${m} की पश्चिमी (ट्रॉपिकल) राशि <strong>${s}</strong> ${em} है।`,
    zodiacLine: (m, z, em) => `सौर जन्म वर्ष के हिसाब से ${m} का चीनी राशिचक्र जानवर <strong>${z}</strong> ${em} है।`,
    // «का हिस्सा» is a word-for-word carry of "is part of" and «उनका मैनेजमेंट …
    // के पास है» of "managed by"; Hindi puts the agency in the subject. The
    // head noun stays मेंबर (masculine → के) exactly as in aGroup, so no gender
    // guess enters the body copy. The debut date is spelled out rather than
    // left as ISO, matching the birthday two paragraphs above.
    groupLine: (m, g, ag, debut) => `${m} <strong>${g}</strong> के मेंबर हैं और उन्हें ${ag} मैनेज करती है। ${g} ने ${hiDate(debut)} को डेब्यू किया था।`,
    soloCareer: (m, ag, debut) => `${m} को ${ag} मैनेज करती है और उन्होंने ${hiDate(debut)} को डेब्यू किया था।`,
    // HEDGE — both halves stay («चंद्र नववर्ष पर बदलता है, 1 जनवरी को नहीं»).
    // Only the tail is reworded: «एक आगे-पीछे» left «एक» floating with nothing
    // to count; «एक साल पीछे वाला» names the measure and matches the direction
    // the Chinese-zodiac pages already describe.
    hedge: 'चंद्र नववर्ष के आसपास जन्म — चीनी राशिचक्र का साल चंद्र नववर्ष (जनवरी के आख़िर से फ़रवरी के मध्य तक) पर बदलता है, 1 जनवरी को नहीं, इसलिए सटीक चंद्र तिथि के हिसाब से जानवर एक साल पीछे वाला हो सकता है।',
    qBday: (m) => `${m} का जन्मदिन कब है?`,
    aBday: (m, d) => `${m} का जन्म ${d} को हुआ था।`,
    aBdayNone: (m) => `इस पेज पर ${m} की कोई वेरिफाइड जन्म तिथि प्रकाशित नहीं है।`,
    qSign: (m) => `${m} की राशि क्या है?`,
    aSign: (m, s) => `${m} की पश्चिमी राशि ${s} है।`,
    qGroup: (m) => `${m} किस ग्रुप में हैं?`,
    aGroup: (m, g) => `${m} ${g} के मेंबर हैं।`,
    aSolo: (m) => `${m} सोलो आर्टिस्ट हैं।`,
  },
  // ru never picks a grammatical gender for an idol: the roster is mixed, so
  // sentences are built from gender-free forms (входит в состав, дата
  // рождения — …) instead of родился / родилась.
  ru: {
    typeMember: 'участник', typeSoloist: 'сольный артист',
    badge: 'Профиль K-pop',
    h1: (m, g) => `${m} (${g}) — профиль, день рождения и знак зодиака`,
    title: (m, g) => `${m} из ${g}: день рождения, знак зодиака и профиль | KoreaPlus`,
    // Russian is sentence case; the soloist titles were the only ones in the
    // tree capitalising both nouns («IU: День рождения · Знак зодиака»).
    soloTitle: (m) => `${m}: день рождения и знак зодиака | KoreaPlus`,
    // «китайский гороскоп», not «китайский зодиак», throughout this block: in
    // Russian «зодиак» means the Western circle, and the year pages this page
    // cross-links to already say «китайский гороскоп». One name per concept.
    desc: (m, g) => `${m} из ${g}: проверенная дата рождения, западный знак зодиака, китайский гороскоп и факты о группе. Проверенный профиль айдола K-pop.`,
    soloDesc: (m) => `${m}: проверенная дата рождения, западный знак зодиака, китайский гороскоп и факты о карьере. Проверенный профиль K-pop.`,
    lead: (m, g) => `${m} входит в состав K-pop-группы ${g}. Ниже — публично известные проверенные факты: день рождения, знак зодиака и данные о группе.`,
    soloLead: (m) => `${m} выступает сольно в K-pop. Ниже — публично известные проверенные факты: день рождения, знак зодиака и данные о карьере.`,
    hFacts: '🔑 Ключевые факты',
    hBirthday: '🎂 День рождения и возраст',
    hZodiac: '♈ Знак зодиака и китайский гороскоп',
    hGroup: '🎤 Группа',
    hSolo: '🎶 Артист',
    hFaq: '❓ Частые вопросы',
    hMore: '👥 Другие участники',
    fGroup: 'Группа', fAgency: 'Агентство', fDebut: 'Дебют группы', fBirthday: 'День рождения', fSign: 'Знак зодиака', fZodiac: 'Китайский гороскоп', fFandom: 'Фандом', fActDebut: 'Дебют',
    bornLine: (m, d) => `Дата рождения ${m} — ${d} года.`,
    noBday: (m) => `Проверенная публичная дата рождения ${m} здесь не указана. Остальные факты ниже подтверждены.`,
    // «По этой дате…» is a literal transposition of "Based on that date" with
    // the adverbial dumped in front of the subject; «Исходя из этой даты, …» is
    // how a Russian writer opens the sentence.
    signLine: (m, s, em) => `Исходя из этой даты, западный (тропический) знак зодиака ${m} — <strong>${s}</strong> ${em}.`,
    zodiacLine: (m, z, em) => `По солнечному году рождения животное китайского гороскопа ${m} — <strong>${z}</strong> ${em}.`,
    // «группой занимается» is colloquial-vague for "managed by"; «состоять в
    // агентстве» is not Russian at all (состоять в = membership one belongs to:
    // в партии, в браке). Both replacements stay gender-free, as this block
    // requires — never «подписана».
    groupLine: (m, g, ag, debut) => `${m} входит в состав <strong>${g}</strong>; группу представляет агентство ${ag}. Дебют ${g} — ${debut}.`,
    soloCareer: (m, ag, debut) => `${m} работает с агентством ${ag}; дебют — ${debut}.`,
    // HEDGE — the window «(с конца января до середины февраля)» and «а не
    // 1 января» both stay; wording is aligned word-for-word with the Chinese-
    // zodiac cluster («Год по китайскому гороскопу меняется в лунный Новый год
    // (…), а не 1 января»), so the two page types state the fact at the same
    // strength and in the same terms.
    hedge: 'Рождение около лунного Нового года — год по китайскому гороскопу меняется в лунный Новый год (с конца января до середины февраля), а не 1 января, поэтому животное может сдвинуться на одно в зависимости от точной лунной даты.',
    qBday: (m) => `Когда день рождения ${m}?`,
    aBday: (m, d) => `Дата рождения ${m} — ${d} года.`,
    aBdayNone: (m) => `Проверенная дата рождения ${m} на этой странице не публикуется.`,
    qSign: (m) => `Какой знак зодиака у ${m}?`,
    aSign: (m, s) => `Западный знак зодиака ${m} — ${s}.`,
    qGroup: (m) => `В какой группе ${m}?`,
    aGroup: (m, g) => `${m} входит в состав ${g}.`,
    aSolo: (m) => `${m} выступает сольно.`,
  },
  vi: {
    typeMember: 'thành viên', typeSoloist: 'nghệ sĩ solo',
    badge: 'Hồ sơ K-pop',
    h1: (m, g) => `${m} (${g}) — Hồ sơ, ngày sinh và cung hoàng đạo`,
    title: (m, g) => `${m} của ${g}: ngày sinh, cung hoàng đạo và hồ sơ | KoreaPlus`,
    // Same shape and casing as the group titles — Vietnamese does not
    // title-case (vocab §3), and the middot came from the en template.
    soloTitle: (m) => `${m}: ngày sinh, cung hoàng đạo và hồ sơ | KoreaPlus`,
    desc: (m, g) => `${m} của ${g}: ngày sinh đã xác minh, cung hoàng đạo, 12 con giáp và thông tin nhóm. Hồ sơ thành viên K-pop đã kiểm chứng.`,
    soloDesc: (m) => `${m}: ngày sinh đã xác minh, cung hoàng đạo, 12 con giáp và thông tin sự nghiệp. Hồ sơ K-pop đã kiểm chứng.`,
    lead: (m, g) => `${m} là thành viên của nhóm nhạc K-pop ${g}. Dưới đây là những thông tin công khai đã xác minh — ngày sinh, cung hoàng đạo và chi tiết về nhóm.`,
    soloLead: (m) => `${m} là nghệ sĩ K-pop. Dưới đây là những thông tin công khai đã xác minh — ngày sinh, cung hoàng đạo và chi tiết sự nghiệp.`,
    hFacts: '🔑 Thông tin chính',
    hBirthday: '🎂 Ngày sinh và tuổi',
    hZodiac: '♈ Cung hoàng đạo và 12 con giáp',
    hGroup: '🎤 Nhóm nhạc',
    hSolo: '🎶 Nghệ sĩ',
    hFaq: '❓ Câu hỏi thường gặp',
    hMore: '👥 Thành viên khác',
    // «Nhóm debut» / «Debut» as a chip label with a date after it reads as the
    // sentence fragment "the group debuts", not "group debut date" — Vietnamese
    // needs the linking noun ngày.
    fGroup: 'Nhóm', fAgency: 'Công ty chủ quản', fDebut: 'Ngày debut của nhóm', fBirthday: 'Ngày sinh', fSign: 'Cung hoàng đạo', fZodiac: '12 con giáp', fFandom: 'Fandom', fActDebut: 'Ngày debut',
    bornLine: (m, d) => `${m} sinh ngày ${d}.`,
    noBday: (m) => `Trang này chưa có ngày sinh công khai đã xác minh của ${m}. Các thông tin còn lại bên dưới đều đã được xác nhận.`,
    // "(hệ nhiệt đới)" is a literal rendering of "(tropical)", but in
    // Vietnamese "nhiệt đới" only means the tropical climate belt — it reads as
    // "the Western zodiac (tropical climate zone)". "phương Tây" already
    // distinguishes it from the Chinese system, so the gloss is dropped.
    signLine: (m, s, em) => `Theo ngày đó, cung hoàng đạo phương Tây của ${m} là <strong>${s}</strong> ${em}.`,
    // Vietnam's 4th branch is Mão (cat) where China's is the rabbit — same
    // year, different animal. Saying so is what keeps the localised name
    // honest, so a Mão birth carries the extra sentence and nothing else does.
    zodiacLine: (m, z, em) => `Theo năm sinh dương lịch, ${m} tuổi <strong>${z}</strong> ${em}.`
      + (z.startsWith('Mão') ? ' Ở Việt Nam, con giáp thứ tư là Mèo, còn ở Trung Quốc là Thỏ — cùng một năm, khác con vật.' : ''),
    // ISO dates are ruled out for Vietnamese prose (vocab §7); viDate() writes
    // the same long form the birthday on this page uses, so one page holds one
    // date format.
    groupLine: (m, g, ag, debut) => `${m} là thành viên của <strong>${g}</strong>, thuộc công ty chủ quản ${ag}. ${g} debut vào ${viDate(debut)}.`,
    soloCareer: (m, ag, debut) => `${m} thuộc công ty chủ quản ${ag} và debut vào ${viDate(debut)}.`,
    hedge: 'Sinh gần Tết Nguyên đán — năm con giáp đổi vào Tết Nguyên đán (cuối tháng 1 đến giữa tháng 2), không phải ngày 1/1, nên con giáp có thể lệch một con tùy ngày âm lịch chính xác.',
    qBday: (m) => `Ngày sinh của ${m} là ngày nào?`,
    aBday: (m, d) => `${m} sinh ngày ${d}.`,
    aBdayNone: (m) => `Trang này không công bố ngày sinh đã xác minh của ${m}.`,
    qSign: (m) => `${m} thuộc cung hoàng đạo nào?`,
    aSign: (m, s) => `Cung hoàng đạo phương Tây của ${m} là ${s}.`,
    qGroup: (m) => `${m} thuộc nhóm nào?`,
    aGroup: (m, g) => `${m} là thành viên của ${g}.`,
    aSolo: (m) => `${m} là nghệ sĩ solo.`,
  },
  // Thai has no full stop — sentences inside one string are separated by a
  // space, and every run of Latin script or digits gets a space on both sides.
  // ราศี and ปี are already carried by / prefixed onto the lookup values, so a
  // template must never add a second one (ราศีราศีเมษ, ปีปีชวด).
  th: {
    typeMember: 'สมาชิก', typeSoloist: 'ศิลปินเดี่ยว',
    badge: 'โปรไฟล์ K-pop',
    h1: (m, g) => `${m} (${g}) — โปรไฟล์ วันเกิด และราศี`,
    title: (m, g) => `${m} วง ${g}: วันเกิด ราศี และโปรไฟล์ | KoreaPlus`,
    // The contract bans the " · " separator outright for Thai — join with และ.
    // It had survived from the en template into the 7 soloist titles.
    soloTitle: (m) => `${m}: วันเกิดและราศี | KoreaPlus`,
    desc: (m, g) => `${m} จากวง ${g}: วันเกิดที่ตรวจสอบแล้ว ราศีแบบตะวันตก นักษัตรจีน และข้อมูลของวง โปรไฟล์สมาชิก K-pop ที่ตรวจสอบข้อเท็จจริงแล้ว`,
    soloDesc: (m) => `${m}: วันเกิดที่ตรวจสอบแล้ว ราศีแบบตะวันตก นักษัตรจีน และข้อมูลผลงาน โปรไฟล์ K-pop ที่ตรวจสอบข้อเท็จจริงแล้ว`,
    lead: (m, g) => `${m} เป็นสมาชิกวง K-pop ${g} ด้านล่างคือข้อเท็จจริงสาธารณะที่ตรวจสอบแล้ว — วันเกิด ราศี และรายละเอียดของวง`,
    soloLead: (m) => `${m} เป็นศิลปิน K-pop ด้านล่างคือข้อเท็จจริงสาธารณะที่ตรวจสอบแล้ว — วันเกิด ราศี และรายละเอียดผลงาน`,
    hFacts: '🔑 ข้อมูลสำคัญ',
    hBirthday: '🎂 วันเกิดและอายุ',
    hZodiac: '♈ ราศีและนักษัตรจีน',
    hGroup: '🎤 วง',
    hSolo: '🎶 ศิลปิน',
    hFaq: '❓ คำถามที่พบบ่อย',
    hMore: '👥 สมาชิกคนอื่น',
    fGroup: 'วง', fAgency: 'ค่ายเพลง', fDebut: 'เดบิวต์ของวง', fBirthday: 'วันเกิด', fSign: 'ราศี', fZodiac: 'นักษัตรจีน', fFandom: 'แฟนด้อม', fActDebut: 'เดบิวต์',
    bornLine: (m, d) => `${m} เกิดวันที่ ${d}`,
    noBday: (m) => `หน้านี้ไม่ได้ระบุวันเกิดสาธารณะที่ตรวจสอบแล้วของ ${m} ข้อเท็จจริงอื่นด้านล่างได้รับการยืนยันแล้ว`,
    signLine: (m, s, em) => `จากวันเกิดนี้ ${m} เป็น<strong>${s}</strong> ${em} ตามโหราศาสตร์ตะวันตก (แบบทรอปิคัล)`,
    zodiacLine: (m, z, em) => `ตามปีเกิดสุริยคติ ${m} เกิดปี<strong>${z}</strong> ${em}`,
    groupLine: (m, g, ag, debut) => `${m} เป็นสมาชิกของ <strong>${g}</strong> ภายใต้สังกัด ${ag} และวง ${g} เดบิวต์เมื่อ ${debut}`,
    soloCareer: (m, ag, debut) => `${m} อยู่ภายใต้สังกัด ${ag} และเดบิวต์เมื่อ ${debut}`,
    hedge: 'เกิดใกล้วันตรุษจีน — นักษัตรเปลี่ยนในวันตรุษจีน (ปลายเดือนมกราคมถึงกลางเดือนกุมภาพันธ์) ไม่ใช่วันที่ 1 มกราคม ปีนักษัตรจึงอาจเลื่อนไปหนึ่งปีตามวันจันทรคติที่แน่นอน',
    qBday: (m) => `${m} เกิดวันไหน?`,
    aBday: (m, d) => `${m} เกิดวันที่ ${d}`,
    aBdayNone: (m) => `หน้านี้ไม่ได้เผยแพร่วันเกิดที่ตรวจสอบแล้วของ ${m}`,
    qSign: (m) => `${m} ราศีอะไร?`,
    aSign: (m, s) => `${m} เป็น${s} ตามโหราศาสตร์ตะวันตก`,
    qGroup: (m) => `${m} อยู่วงอะไร?`,
    aGroup: (m, g) => `${m} เป็นสมาชิกวง ${g}`,
    aSolo: (m) => `${m} เป็นศิลปินเดี่ยว`,
  },
};

module.exports = { T, SIGN_NAMES, ANIMAL_NAMES, MONTH_NAMES, MONTH_NAMES_RU_NOM };
