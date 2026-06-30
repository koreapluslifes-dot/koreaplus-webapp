/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-cnzodiac-l10n.js — UI/copy translations for the
   "K-pop idols born in the Year of the {animal}" pages (seo-kpop-cnzodiac).

   Scope: ONLY this module's chrome (titles, headings, hedge wording,
   labels). Idol/group facts come from ROSTER/ENRICH at build time — never
   translated here. Kept separate from the 14-language messages/*.json.

   Languages: en (default) + 8 site locales (ja zh es ko fr de pt id) — i.e.
   the 9 hreflang languages this vertical ships. A language with no entry is
   simply skipped (page not generated for it), per the contract.

   ANIM: per-animal localized noun ("Tiger", "Año del Tigre" …). The emoji
   and the canonical date math come from ctx.derive (single source) — only
   the human-readable NAME is localized here.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// 12 Chinese-zodiac keys, in the order used everywhere (matches derive.CN_ZODIAC).
const ANIMAL_KEYS = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

// Localized animal nouns (bare, capitalized as a noun). Verified standard
// translations; goat == sheep/ram in several traditions (we render "Goat").
const ANIMAL_NAMES = {
  en: { rat: 'Rat', ox: 'Ox', tiger: 'Tiger', rabbit: 'Rabbit', dragon: 'Dragon', snake: 'Snake', horse: 'Horse', goat: 'Goat', monkey: 'Monkey', rooster: 'Rooster', dog: 'Dog', pig: 'Pig' },
  ko: { rat: '쥐', ox: '소', tiger: '호랑이', rabbit: '토끼', dragon: '용', snake: '뱀', horse: '말', goat: '양', monkey: '원숭이', rooster: '닭', dog: '개', pig: '돼지' },
  ja: { rat: '子（ねずみ）', ox: '丑（うし）', tiger: '寅（とら）', rabbit: '卯（うさぎ）', dragon: '辰（たつ）', snake: '巳（へび）', horse: '午（うま）', goat: '未（ひつじ）', monkey: '申（さる）', rooster: '酉（とり）', dog: '戌（いぬ）', pig: '亥（いのしし）' },
  zh: { rat: '鼠', ox: '牛', tiger: '虎', rabbit: '兔', dragon: '龙', snake: '蛇', horse: '马', goat: '羊', monkey: '猴', rooster: '鸡', dog: '狗', pig: '猪' },
  es: { rat: 'Rata', ox: 'Buey', tiger: 'Tigre', rabbit: 'Conejo', dragon: 'Dragón', snake: 'Serpiente', horse: 'Caballo', goat: 'Cabra', monkey: 'Mono', rooster: 'Gallo', dog: 'Perro', pig: 'Cerdo' },
  fr: { rat: 'Rat', ox: 'Bœuf', tiger: 'Tigre', rabbit: 'Lapin', dragon: 'Dragon', snake: 'Serpent', horse: 'Cheval', goat: 'Chèvre', monkey: 'Singe', rooster: 'Coq', dog: 'Chien', pig: 'Cochon' },
  de: { rat: 'Ratte', ox: 'Büffel', tiger: 'Tiger', rabbit: 'Hase', dragon: 'Drache', snake: 'Schlange', horse: 'Pferd', goat: 'Ziege', monkey: 'Affe', rooster: 'Hahn', dog: 'Hund', pig: 'Schwein' },
  pt: { rat: 'Rato', ox: 'Boi', tiger: 'Tigre', rabbit: 'Coelho', dragon: 'Dragão', snake: 'Serpente', horse: 'Cavalo', goat: 'Cabra', monkey: 'Macaco', rooster: 'Galo', dog: 'Cão', pig: 'Porco' },
  id: { rat: 'Tikus', ox: 'Kerbau', tiger: 'Macan', rabbit: 'Kelinci', dragon: 'Naga', snake: 'Ular', horse: 'Kuda', goat: 'Kambing', monkey: 'Monyet', rooster: 'Ayam', dog: 'Anjing', pig: 'Babi' },
};

// Page chrome. {animal} is replaced with the localized animal noun;
// functions receive (animal) so each language controls word order.
const T = {
  en: {
    badge: 'Chinese Zodiac',
    title: a => `K-pop Idols Born in the Year of the ${a} — Birthday List | KoreaPlus`,
    h1: a => `K-pop Idols Born in the Year of the ${a}`,
    desc: a => `Which K-pop idols were born in the Year of the ${a}? A birthday-sorted list across major groups and soloists, with the Chinese-zodiac caveat explained.`,
    lead: a => `Idols whose birth year falls under the Chinese zodiac sign of the ${a}, gathered from across the K-pop roster. Each name links nothing but the facts — full birthdate and group.`,
    countOne: '1 idol',
    countMany: n => `${n} idols`,
    none: a => `No idols in our current roster were born in the Year of the ${a}. Check the other zodiac years below.`,
    colName: 'Idol', colGroup: 'Group', colBday: 'Birthday',
    hedgeH: 'A note on the calculation',
    hedge: 'The Chinese zodiac year changes at Lunar New Year (late January to mid-February), not on January 1. This list groups idols by their solar birth year, so anyone born in January or early February may actually belong to the previous animal year — verify against the exact lunar date if it matters to you.',
    otherH: 'Other zodiac years',
    faq: a => [
      [`What does it mean to be born in the Year of the ${a}?`, `In the Chinese zodiac, each year is associated with one of twelve animals on a repeating 12-year cycle. People born in a ${a} year share that animal sign. Note that the year boundary is Lunar New Year, not January 1.`],
      [`How is this list put together?`, `We take each idol's verified birthdate and group them by the animal of their birth year. Birthdays come from our curated roster of major groups and soloists — only confirmed, public dates are used.`],
    ],
  },
  ko: {
    badge: '십이지',
    title: a => `${a}띠 K-pop 아이돌 — 생일 정리 | KoreaPlus`,
    h1: a => `${a}띠 K-pop 아이돌`,
    desc: a => `${a}띠 K-pop 아이돌은 누구일까요? 주요 그룹·솔로 아이돌을 생일순으로 정리했습니다. 십이지 계산 주의점도 함께 설명합니다.`,
    lead: a => `출생 연도가 ${a}띠에 해당하는 K-pop 아이돌을 로스터에서 모았습니다. 정확한 생일과 소속 그룹만 담았습니다.`,
    countOne: '아이돌 1명',
    countMany: n => `아이돌 ${n}명`,
    none: a => `현재 로스터에는 ${a}띠 아이돌이 없습니다. 아래 다른 띠를 확인해 보세요.`,
    colName: '아이돌', colGroup: '그룹', colBday: '생일',
    hedgeH: '계산 관련 안내',
    hedge: '띠는 양력 1월 1일이 아니라 음력 설(1월 말~2월 중순)에 바뀝니다. 이 목록은 양력 출생 연도로 분류하므로, 1월이나 2월 초 출생자는 실제로는 전년도 띠일 수 있습니다. 정확한 띠는 음력 생일로 확인하세요.',
    otherH: '다른 띠 보기',
    faq: a => [
      [`${a}띠로 태어난다는 건 무슨 의미인가요?`, `십이지는 12년 주기로 동물 하나가 매년 배정됩니다. ${a}띠 해에 태어난 사람은 그 띠를 갖습니다. 단, 띠의 경계는 양력 1월 1일이 아니라 음력 설입니다.`],
      [`이 목록은 어떻게 만들어졌나요?`, `각 아이돌의 검증된 생일을 기준으로 출생 연도의 띠로 분류했습니다. 주요 그룹·솔로 로스터의 공개된 생일만 사용했습니다.`],
    ],
  },
  ja: {
    badge: '十二支',
    title: a => `${a}年生まれのK-POPアイドル — 誕生日まとめ | KoreaPlus`,
    h1: a => `${a}年生まれのK-POPアイドル`,
    desc: a => `${a}年生まれのK-POPアイドルは誰？主要グループ・ソロを誕生日順にまとめ、干支の計算上の注意も解説します。`,
    lead: a => `生まれ年が干支の${a}にあたるK-POPアイドルをロスターから集めました。正確な誕生日と所属グループのみを掲載しています。`,
    countOne: 'アイドル1名',
    countMany: n => `アイドル${n}名`,
    none: a => `現在のロスターに${a}年生まれのアイドルはいません。下の他の干支をご覧ください。`,
    colName: 'アイドル', colGroup: 'グループ', colBday: '誕生日',
    hedgeH: '計算についての注意',
    hedge: '干支は1月1日ではなく旧正月（1月下旬〜2月中旬）に切り替わります。このリストは新暦の生まれ年で分類しているため、1月や2月上旬生まれの人は実際には前年の干支になる場合があります。正確には旧暦の誕生日でご確認ください。',
    otherH: '他の干支',
    faq: a => [
      [`${a}年生まれとはどういう意味ですか？`, `干支は12年周期で毎年ひとつの動物が割り当てられます。${a}年に生まれた人はその干支を持ちます。ただし境目は1月1日ではなく旧正月です。`],
      [`このリストはどう作られていますか？`, `各アイドルの確認済みの誕生日を、生まれ年の干支ごとに分類しています。主要グループ・ソロの公開された誕生日のみを使用しています。`],
    ],
  },
  zh: {
    badge: '生肖',
    title: a => `属${a}的K-pop偶像 — 生日整理 | KoreaPlus`,
    h1: a => `属${a}的K-pop偶像`,
    desc: a => `哪些K-pop偶像属${a}？按生日整理主要团体与solo歌手，并说明生肖计算的注意事项。`,
    lead: a => `出生年份属${a}的K-pop偶像，整理自我们的艺人名单。只收录确切生日与所属团体。`,
    countOne: '1位偶像',
    countMany: n => `${n}位偶像`,
    none: a => `当前名单中没有属${a}的偶像。请看下方其他生肖。`,
    colName: '偶像', colGroup: '团体', colBday: '生日',
    hedgeH: '关于计算的说明',
    hedge: '生肖在农历新年（1月下旬至2月中旬）更替，而非公历1月1日。本列表按公历出生年份分类，因此1月或2月初出生者实际上可能属上一个生肖——如需精确，请以农历生日为准。',
    otherH: '其他生肖',
    faq: a => [
      [`属${a}是什么意思？`, `生肖以12年为一个循环，每年对应一个动物。在${a}年出生的人即属${a}。但分界点是农历新年，而非公历1月1日。`],
      [`这份列表是怎么整理的？`, `我们以每位偶像确切的生日，按其出生年份的生肖分类。生日取自我们整理的主要团体与solo名单，只采用确认的公开日期。`],
    ],
  },
  es: {
    badge: 'Zodíaco chino',
    title: a => `Ídolos del K-pop nacidos en el Año del ${a} — Lista por cumpleaños | KoreaPlus`,
    h1: a => `Ídolos del K-pop nacidos en el Año del ${a}`,
    desc: a => `¿Qué ídolos del K-pop nacieron en el Año del ${a}? Una lista ordenada por cumpleaños de grupos y solistas, con la advertencia del zodíaco chino explicada.`,
    lead: a => `Ídolos cuyo año de nacimiento corresponde al signo del ${a} en el zodíaco chino, reunidos de nuestra lista de K-pop. Solo el cumpleaños exacto y el grupo.`,
    countOne: '1 ídolo',
    countMany: n => `${n} ídolos`,
    none: a => `Ningún ídolo de nuestra lista actual nació en el Año del ${a}. Mira los otros años abajo.`,
    colName: 'Ídolo', colGroup: 'Grupo', colBday: 'Cumpleaños',
    hedgeH: 'Nota sobre el cálculo',
    hedge: 'El año del zodíaco chino cambia en el Año Nuevo Lunar (de fines de enero a mediados de febrero), no el 1 de enero. Esta lista agrupa por año solar de nacimiento, así que quien nació en enero o principios de febrero podría pertenecer al animal del año anterior; verifica con la fecha lunar exacta si te importa.',
    otherH: 'Otros años del zodíaco',
    faq: a => [
      [`¿Qué significa nacer en el Año del ${a}?`, `En el zodíaco chino, cada año se asocia a uno de doce animales en un ciclo de 12 años. Quien nace en un año del ${a} comparte ese signo. El límite del año es el Año Nuevo Lunar, no el 1 de enero.`],
      [`¿Cómo se elabora esta lista?`, `Tomamos el cumpleaños verificado de cada ídolo y los agrupamos por el animal de su año de nacimiento. Las fechas provienen de nuestra lista de grupos y solistas; solo se usan fechas públicas confirmadas.`],
    ],
  },
  fr: {
    badge: 'Zodiaque chinois',
    title: a => `Idoles de K-pop nées sous l'année du ${a} — Liste par anniversaire | KoreaPlus`,
    h1: a => `Idoles de K-pop nées sous l'année du ${a}`,
    desc: a => `Quelles idoles de K-pop sont nées sous l'année du ${a} ? Une liste classée par anniversaire de groupes et solistes, avec la nuance du zodiaque chinois expliquée.`,
    lead: a => `Les idoles dont l'année de naissance correspond au signe du ${a} dans le zodiaque chinois, réunies depuis notre liste K-pop. Uniquement la date de naissance exacte et le groupe.`,
    countOne: '1 idole',
    countMany: n => `${n} idoles`,
    none: a => `Aucune idole de notre liste actuelle n'est née sous l'année du ${a}. Voyez les autres années ci-dessous.`,
    colName: 'Idole', colGroup: 'Groupe', colBday: 'Anniversaire',
    hedgeH: 'À propos du calcul',
    hedge: 'L\'année du zodiaque chinois change au Nouvel An lunaire (fin janvier à mi-février), pas le 1er janvier. Cette liste regroupe par année solaire de naissance : une personne née en janvier ou début février peut donc relever de l\'animal de l\'année précédente — vérifiez avec la date lunaire exacte si besoin.',
    otherH: 'Autres années du zodiaque',
    faq: a => [
      [`Que signifie naître sous l'année du ${a} ?`, `Dans le zodiaque chinois, chaque année est associée à l'un des douze animaux selon un cycle de 12 ans. Qui naît une année du ${a} partage ce signe. La limite de l'année est le Nouvel An lunaire, pas le 1er janvier.`],
      [`Comment cette liste est-elle établie ?`, `Nous prenons la date de naissance vérifiée de chaque idole et les regroupons par l'animal de leur année de naissance. Les dates proviennent de notre liste de groupes et solistes ; seules des dates publiques confirmées sont utilisées.`],
    ],
  },
  de: {
    badge: 'Chinesisches Tierkreiszeichen',
    title: a => `K-Pop-Idole geboren im Jahr des ${a} — Geburtstagsliste | KoreaPlus`,
    h1: a => `K-Pop-Idole geboren im Jahr des ${a}`,
    desc: a => `Welche K-Pop-Idole wurden im Jahr des ${a} geboren? Eine nach Geburtstag sortierte Liste von Gruppen und Solokünstlern, mit erklärtem Tierkreis-Hinweis.`,
    lead: a => `Idole, deren Geburtsjahr im chinesischen Tierkreis dem ${a} entspricht, gesammelt aus unserer K-Pop-Liste. Nur das genaue Geburtsdatum und die Gruppe.`,
    countOne: '1 Idol',
    countMany: n => `${n} Idole`,
    none: a => `Kein Idol unserer aktuellen Liste wurde im Jahr des ${a} geboren. Sieh dir unten die anderen Jahre an.`,
    colName: 'Idol', colGroup: 'Gruppe', colBday: 'Geburtstag',
    hedgeH: 'Hinweis zur Berechnung',
    hedge: 'Das chinesische Tierkreisjahr wechselt zum Mondneujahr (Ende Januar bis Mitte Februar), nicht am 1. Januar. Diese Liste gruppiert nach dem Sonnen-Geburtsjahr, daher kann jemand, der im Januar oder Anfang Februar geboren ist, eigentlich zum Tier des Vorjahres gehören — bei Bedarf mit dem genauen Monddatum prüfen.',
    otherH: 'Andere Tierkreisjahre',
    faq: a => [
      [`Was bedeutet es, im Jahr des ${a} geboren zu sein?`, `Im chinesischen Tierkreis ist jedes Jahr einem von zwölf Tieren in einem 12-Jahres-Zyklus zugeordnet. Wer in einem ${a}-Jahr geboren ist, trägt dieses Zeichen. Die Jahresgrenze ist das Mondneujahr, nicht der 1. Januar.`],
      [`Wie wird diese Liste erstellt?`, `Wir nehmen das verifizierte Geburtsdatum jedes Idols und gruppieren sie nach dem Tier ihres Geburtsjahres. Die Daten stammen aus unserer Liste von Gruppen und Solokünstlern; nur bestätigte, öffentliche Daten werden verwendet.`],
    ],
  },
  pt: {
    badge: 'Zodíaco chinês',
    title: a => `Ídolos de K-pop nascidos no Ano do ${a} — Lista por aniversário | KoreaPlus`,
    h1: a => `Ídolos de K-pop nascidos no Ano do ${a}`,
    desc: a => `Quais ídolos de K-pop nasceram no Ano do ${a}? Uma lista ordenada por aniversário de grupos e solistas, com a ressalva do zodíaco chinês explicada.`,
    lead: a => `Ídolos cujo ano de nascimento corresponde ao signo do ${a} no zodíaco chinês, reunidos da nossa lista de K-pop. Apenas a data de nascimento exata e o grupo.`,
    countOne: '1 ídolo',
    countMany: n => `${n} ídolos`,
    none: a => `Nenhum ídolo da nossa lista atual nasceu no Ano do ${a}. Veja os outros anos abaixo.`,
    colName: 'Ídolo', colGroup: 'Grupo', colBday: 'Aniversário',
    hedgeH: 'Nota sobre o cálculo',
    hedge: 'O ano do zodíaco chinês muda no Ano Novo Lunar (fim de janeiro a meados de fevereiro), não em 1 de janeiro. Esta lista agrupa pelo ano solar de nascimento, então quem nasceu em janeiro ou início de fevereiro pode pertencer ao animal do ano anterior — confira pela data lunar exata se for importante.',
    otherH: 'Outros anos do zodíaco',
    faq: a => [
      [`O que significa nascer no Ano do ${a}?`, `No zodíaco chinês, cada ano está associado a um de doze animais num ciclo de 12 anos. Quem nasce num ano do ${a} compartilha esse signo. O limite do ano é o Ano Novo Lunar, não 1 de janeiro.`],
      [`Como esta lista é montada?`, `Tomamos a data de nascimento verificada de cada ídolo e os agrupamos pelo animal do ano de nascimento. As datas vêm da nossa lista de grupos e solistas; apenas datas públicas confirmadas são usadas.`],
    ],
  },
  id: {
    badge: 'Shio Tionghoa',
    title: a => `Idol K-pop yang Lahir di Tahun ${a} — Daftar Ulang Tahun | KoreaPlus`,
    h1: a => `Idol K-pop yang Lahir di Tahun ${a}`,
    desc: a => `Idol K-pop mana yang lahir di Tahun ${a}? Daftar berurut ulang tahun dari grup dan solois utama, lengkap dengan catatan soal shio.`,
    lead: a => `Idol yang tahun lahirnya termasuk shio ${a} dalam zodiak Tionghoa, dikumpulkan dari daftar K-pop kami. Hanya tanggal lahir pasti dan grupnya.`,
    countOne: '1 idol',
    countMany: n => `${n} idol`,
    none: a => `Tidak ada idol di daftar kami saat ini yang lahir di Tahun ${a}. Lihat tahun shio lain di bawah.`,
    colName: 'Idol', colGroup: 'Grup', colBday: 'Ulang tahun',
    hedgeH: 'Catatan soal perhitungan',
    hedge: 'Tahun shio berganti pada Tahun Baru Imlek (akhir Januari hingga pertengahan Februari), bukan 1 Januari. Daftar ini mengelompokkan berdasarkan tahun lahir Masehi, jadi yang lahir di Januari atau awal Februari bisa jadi sebenarnya termasuk shio tahun sebelumnya — periksa dengan tanggal Imlek pasti bila perlu.',
    otherH: 'Tahun shio lainnya',
    faq: a => [
      [`Apa artinya lahir di Tahun ${a}?`, `Dalam zodiak Tionghoa, setiap tahun dikaitkan dengan salah satu dari dua belas hewan dalam siklus 12 tahun. Yang lahir di tahun ${a} memiliki shio itu. Batas tahunnya adalah Tahun Baru Imlek, bukan 1 Januari.`],
      [`Bagaimana daftar ini disusun?`, `Kami mengambil tanggal lahir tervalidasi setiap idol dan mengelompokkannya berdasarkan hewan tahun kelahiran mereka. Tanggal berasal dari daftar grup dan solois kami; hanya tanggal publik terkonfirmasi yang dipakai.`],
    ],
  },
};

module.exports = { ANIMAL_KEYS, ANIMAL_NAMES, T };
