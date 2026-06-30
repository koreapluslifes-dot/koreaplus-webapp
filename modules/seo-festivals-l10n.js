/* ══════════════════════════════════════════════════════════════════
   modules/seo-festivals-l10n.js — strings for seo-festivals.cjs.

   Pure data. No build coupling. 9 languages (en + ko/ja/zh/es/fr/de/pt/id).

   IMPORTANT: festival pages describe RECURRING annual events only — no
   concrete future dates. All season/timing copy is generic ("usually held
   in <month>"), never a calendar year or a specific date.

   MONTH_NAMES[lang][0..11]  → localized month display name.
   T[lang] → page-string builder functions:
     title(mName, n)   meta title
     desc(mName, n)    meta description
     h1(mName)         <h1>
     lead(mName, n)    intro paragraph
     listH(mName, n)   list heading
     none(mName)       shown when no festival that month
     factMonth / factN labels for key-facts chips
     col.{name,city,about}  table headers
     monthsH           "Festivals by month" nav heading
     relH / browseLabel / festHubLabel  related-nav strings
     faqH              FAQ heading
     q1/a1, q2/a2, q3/a3  FAQ Q&A builders (recurring-only, no dates)
   ══════════════════════════════════════════════════════════════════ */
'use strict';

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
};

const T = {
  en: {
    title: (m, n) => `Korea Festivals in ${m} (${n}) — What's On | KoreaPlus`,
    desc: (m, n) => `${n} Korean festival${n === 1 ? '' : 's'} that recur every ${m}. City, theme and what to expect for each — plan a festival trip to Korea in ${m}.`,
    h1: (m) => `Korea Festivals in ${m}`,
    lead: (m, n) => n
      ? `Korea holds these ${n} annual festival${n === 1 ? '' : 's'} around ${m}. They recur each year — exact dates shift, so check the official site before you travel.`
      : `No major nationwide annual festivals fall in ${m} in our guide. Browse the other months below to plan around a Korean festival.`,
    listH: (m, n) => `${n} festival${n === 1 ? '' : 's'} that recur in ${m}`,
    none: (m) => `We don't track a major recurring festival for ${m} yet — see the other months below.`,
    factMonth: (m) => `📅 Month: ${m}`,
    factN: (n) => `🎉 Festivals: ${n}`,
    col: { name: 'Festival', city: 'City', about: 'About' },
    monthsH: 'Festivals by month',
    relH: 'Keep exploring',
    browseLabel: '🗺️ Plan your trip',
    festHubLabel: '🎉 All Korea festivals',
    faqH: 'FAQ',
    q1: (m) => `What festivals happen in Korea in ${m}?`,
    a1: (m, names) => `Annual festivals that usually take place around ${m} include ${names}. They are recurring events, so the exact dates change each year — confirm on the official festival site.`,
    q2: (m) => `Are the ${m} festival dates fixed every year?`,
    a2: () => `No. Korean festivals recur annually but their exact dates are set fresh each year and often follow the lunar calendar, weather or blossom timing. Always check the latest official schedule before booking.`,
    q3: () => `How do I plan a festival trip to Korea?`,
    a3: () => `Pick the festival's month, book accommodation in or near the host city early, and verify the year's dates on the organizer's website. Festival weekends fill up fast, so reserve transport and stays ahead.`,
  },
  ko: {
    title: (m, n) => `${m} 한국 축제 (${n}개) — 무엇이 열릴까 | KoreaPlus`,
    desc: (m, n) => `매년 ${m}에 열리는 한국 축제 ${n}개. 도시·테마·즐길거리를 한눈에 — ${m} 한국 축제 여행을 계획해 보세요.`,
    h1: (m) => `${m} 한국 축제`,
    lead: (m, n) => n
      ? `한국에서는 ${m}경에 이 ${n}개의 연례 축제가 열립니다. 매년 반복되지만 정확한 날짜는 해마다 달라지니 여행 전 공식 사이트를 확인하세요.`
      : `가이드에 포함된 전국 규모 연례 축제 중 ${m}에 열리는 것은 없습니다. 아래 다른 달을 둘러보며 축제 일정을 잡아 보세요.`,
    listH: (m, n) => `${m}에 열리는 축제 ${n}개`,
    none: (m) => `아직 ${m}의 대표 연례 축제는 등록되지 않았습니다 — 아래 다른 달을 확인해 보세요.`,
    factMonth: (m) => `📅 월: ${m}`,
    factN: (n) => `🎉 축제: ${n}개`,
    col: { name: '축제', city: '도시', about: '소개' },
    monthsH: '월별 축제',
    relH: '계속 둘러보기',
    browseLabel: '🗺️ 여행 계획하기',
    festHubLabel: '🎉 한국 축제 전체',
    faqH: '자주 묻는 질문',
    q1: (m) => `${m}에는 한국에서 어떤 축제가 열리나요?`,
    a1: (m, names) => `${m}경에 주로 열리는 연례 축제로는 ${names} 등이 있습니다. 매년 반복되는 행사라 정확한 날짜는 해마다 달라지니 공식 축제 사이트에서 확인하세요.`,
    q2: (m) => `${m} 축제 날짜는 매년 똑같나요?`,
    a2: () => `아닙니다. 한국 축제는 매년 열리지만 정확한 일정은 해마다 새로 정해지며, 음력·날씨·개화 시기에 따라 달라지는 경우가 많습니다. 예약 전 최신 공식 일정을 꼭 확인하세요.`,
    q3: () => `한국 축제 여행은 어떻게 계획하나요?`,
    a3: () => `축제가 열리는 달을 고르고, 개최 도시나 인근 숙소를 일찍 예약한 뒤, 주최 측 웹사이트에서 그해 날짜를 확인하세요. 축제 주말은 빨리 마감되니 교통편과 숙소를 미리 잡는 것이 좋습니다.`,
  },
  ja: {
    title: (m, n) => `${m}の韓国フェスティバル（${n}件）— 何が開催される | KoreaPlus`,
    desc: (m, n) => `毎年${m}ごろに開催される韓国のフェスティバル${n}件。都市・テーマ・見どころを一覧で — ${m}の韓国フェス旅行を計画しましょう。`,
    h1: (m) => `${m}の韓国フェスティバル`,
    lead: (m, n) => n
      ? `韓国では${m}ごろに、これら${n}件の毎年恒例フェスティバルが開催されます。毎年行われますが正確な日程は年ごとに変わるため、旅行前に公式サイトをご確認ください。`
      : `ガイド掲載の全国規模の毎年恒例フェスで、${m}に開催されるものはありません。下の他の月を見て計画を立てましょう。`,
    listH: (m, n) => `${m}に開催されるフェス${n}件`,
    none: (m) => `${m}の主要な毎年恒例フェスはまだ登録されていません — 下の他の月をご覧ください。`,
    factMonth: (m) => `📅 月: ${m}`,
    factN: (n) => `🎉 フェス: ${n}件`,
    col: { name: 'フェスティバル', city: '都市', about: '概要' },
    monthsH: '月別フェスティバル',
    relH: 'さらに見る',
    browseLabel: '🗺️ 旅行を計画する',
    festHubLabel: '🎉 韓国フェス一覧',
    faqH: 'よくある質問',
    q1: (m) => `${m}に韓国ではどんなフェスがありますか？`,
    a1: (m, names) => `${m}ごろに主に開催される毎年恒例フェスには${names}などがあります。毎年行われる行事のため正確な日程は年ごとに変わります。公式サイトでご確認ください。`,
    q2: (m) => `${m}のフェスの日程は毎年同じですか？`,
    a2: () => `いいえ。韓国のフェスは毎年開催されますが、正確な日程は毎年新たに決められ、旧暦・天候・開花時期に左右されることも多いです。予約前に最新の公式スケジュールを必ずご確認ください。`,
    q3: () => `韓国のフェス旅行はどう計画すればいいですか？`,
    a3: () => `フェスの開催月を選び、開催都市やその周辺の宿を早めに予約し、主催者サイトでその年の日程を確認しましょう。フェスの週末はすぐ埋まるので、交通と宿は早めに押さえるのがおすすめです。`,
  },
  zh: {
    title: (m, n) => `${m}韩国庆典（${n}个）— 有哪些活动 | KoreaPlus`,
    desc: (m, n) => `每年${m}前后举办的${n}个韩国庆典。城市、主题与看点一览 — 规划你的${m}韩国庆典之旅。`,
    h1: (m) => `${m}韩国庆典`,
    lead: (m, n) => n
      ? `韩国在${m}前后举办这${n}个年度庆典。它们每年举行，但具体日期逐年变动，出行前请查看官方网站。`
      : `本指南收录的全国性年度庆典中，没有在${m}举办的。请浏览下方其他月份来安排你的庆典行程。`,
    listH: (m, n) => `${m}举办的${n}个庆典`,
    none: (m) => `${m}的主要年度庆典暂未收录 — 请查看下方其他月份。`,
    factMonth: (m) => `📅 月份：${m}`,
    factN: (n) => `🎉 庆典：${n}个`,
    col: { name: '庆典', city: '城市', about: '简介' },
    monthsH: '按月份看庆典',
    relH: '继续探索',
    browseLabel: '🗺️ 规划行程',
    festHubLabel: '🎉 全部韩国庆典',
    faqH: '常见问题',
    q1: (m) => `${m}韩国有哪些庆典？`,
    a1: (m, names) => `${m}前后通常举办的年度庆典包括${names}等。它们是每年举办的活动，因此具体日期逐年不同，请以官方网站为准。`,
    q2: (m) => `${m}庆典的日期每年都一样吗？`,
    a2: () => `不一样。韩国庆典每年举办，但具体日期每年重新确定，且常受农历、天气或花期影响。预订前请务必查看最新官方日程。`,
    q3: () => `如何规划韩国庆典之旅？`,
    a3: () => `选定庆典所在的月份，尽早预订举办城市或附近的住宿，并在主办方网站确认当年日期。庆典周末很快客满，建议提前预订交通和住宿。`,
  },
  es: {
    title: (m, n) => `Festivales de Corea en ${m} (${n}) — Qué hay | KoreaPlus`,
    desc: (m, n) => `${n} festival${n === 1 ? '' : 'es'} coreano${n === 1 ? '' : 's'} que se repiten cada ${m}. Ciudad, temática y qué esperar — planifica tu viaje a Corea en ${m}.`,
    h1: (m) => `Festivales de Corea en ${m}`,
    lead: (m, n) => n
      ? `Corea celebra estos ${n} festival${n === 1 ? '' : 'es'} anual${n === 1 ? '' : 'es'} hacia ${m}. Se repiten cada año, pero las fechas exactas cambian: consulta el sitio oficial antes de viajar.`
      : `Ningún gran festival anual de alcance nacional de nuestra guía cae en ${m}. Explora los demás meses más abajo para planear tu viaje.`,
    listH: (m, n) => `${n} festival${n === 1 ? '' : 'es'} que se repiten en ${m}`,
    none: (m) => `Aún no registramos un gran festival recurrente para ${m}: mira los demás meses abajo.`,
    factMonth: (m) => `📅 Mes: ${m}`,
    factN: (n) => `🎉 Festivales: ${n}`,
    col: { name: 'Festival', city: 'Ciudad', about: 'Sobre' },
    monthsH: 'Festivales por mes',
    relH: 'Sigue explorando',
    browseLabel: '🗺️ Planifica tu viaje',
    festHubLabel: '🎉 Todos los festivales de Corea',
    faqH: 'Preguntas frecuentes',
    q1: (m) => `¿Qué festivales hay en Corea en ${m}?`,
    a1: (m, names) => `Entre los festivales anuales que suelen celebrarse hacia ${m} están ${names}. Son eventos recurrentes, así que las fechas exactas cambian cada año: confírmalas en el sitio oficial.`,
    q2: (m) => `¿Las fechas de los festivales de ${m} son fijas cada año?`,
    a2: () => `No. Los festivales coreanos se repiten cada año, pero sus fechas exactas se fijan de nuevo cada temporada y a menudo siguen el calendario lunar, el clima o la floración. Consulta siempre el calendario oficial antes de reservar.`,
    q3: () => `¿Cómo planifico un viaje a un festival en Corea?`,
    a3: () => `Elige el mes del festival, reserva pronto alojamiento en la ciudad anfitriona o cerca, y verifica las fechas del año en la web del organizador. Los fines de semana de festival se llenan rápido, así que reserva transporte y estancia con antelación.`,
  },
  fr: {
    title: (m, n) => `Festivals de Corée en ${m} (${n}) — Au programme | KoreaPlus`,
    desc: (m, n) => `${n} festival${n === 1 ? '' : 's'} coréen${n === 1 ? '' : 's'} qui reviennent chaque ${m}. Ville, thème et ce qui vous attend — planifiez votre voyage en Corée en ${m}.`,
    h1: (m) => `Festivals de Corée en ${m}`,
    lead: (m, n) => n
      ? `La Corée organise ces ${n} festival${n === 1 ? '' : 's'} annuel${n === 1 ? '' : 's'} autour de ${m}. Ils reviennent chaque année, mais les dates exactes changent : vérifiez le site officiel avant de partir.`
      : `Aucun grand festival annuel national de notre guide ne tombe en ${m}. Parcourez les autres mois ci-dessous pour planifier votre voyage.`,
    listH: (m, n) => `${n} festival${n === 1 ? '' : 's'} qui reviennent en ${m}`,
    none: (m) => `Nous ne suivons pas encore de grand festival récurrent pour ${m} — voyez les autres mois ci-dessous.`,
    factMonth: (m) => `📅 Mois : ${m}`,
    factN: (n) => `🎉 Festivals : ${n}`,
    col: { name: 'Festival', city: 'Ville', about: 'À propos' },
    monthsH: 'Festivals par mois',
    relH: 'Continuer à explorer',
    browseLabel: '🗺️ Planifiez votre voyage',
    festHubLabel: '🎉 Tous les festivals de Corée',
    faqH: 'FAQ',
    q1: (m) => `Quels festivals ont lieu en Corée en ${m} ?`,
    a1: (m, names) => `Parmi les festivals annuels qui se tiennent généralement autour de ${m} figurent ${names}. Ce sont des événements récurrents, donc les dates exactes changent chaque année : confirmez-les sur le site officiel.`,
    q2: (m) => `Les dates des festivals de ${m} sont-elles fixes chaque année ?`,
    a2: () => `Non. Les festivals coréens reviennent chaque année, mais leurs dates exactes sont fixées à nouveau chaque saison et suivent souvent le calendrier lunaire, la météo ou la floraison. Vérifiez toujours le calendrier officiel avant de réserver.`,
    q3: () => `Comment planifier un voyage festival en Corée ?`,
    a3: () => `Choisissez le mois du festival, réservez tôt un hébergement dans la ville hôte ou à proximité, et vérifiez les dates de l'année sur le site de l'organisateur. Les week-ends de festival se remplissent vite : réservez transport et logement à l'avance.`,
  },
  de: {
    title: (m, n) => `Korea-Festivals im ${m} (${n}) — Was läuft | KoreaPlus`,
    desc: (m, n) => `${n} koreanische Festival${n === 1 ? '' : 's'}, die jedes Jahr im ${m} stattfinden. Stadt, Thema und was Sie erwartet — planen Sie Ihre Korea-Reise im ${m}.`,
    h1: (m) => `Korea-Festivals im ${m}`,
    lead: (m, n) => n
      ? `Korea veranstaltet diese ${n} jährlichen Festival${n === 1 ? '' : 's'} um den ${m} herum. Sie wiederholen sich jedes Jahr, aber die genauen Termine ändern sich — prüfen Sie vor der Reise die offizielle Website.`
      : `Kein großes landesweites Jahresfestival aus unserem Guide fällt in den ${m}. Stöbern Sie unten durch die anderen Monate, um Ihre Reise zu planen.`,
    listH: (m, n) => `${n} Festival${n === 1 ? '' : 's'}, die im ${m} stattfinden`,
    none: (m) => `Für den ${m} führen wir noch kein großes wiederkehrendes Festival — sehen Sie sich unten die anderen Monate an.`,
    factMonth: (m) => `📅 Monat: ${m}`,
    factN: (n) => `🎉 Festivals: ${n}`,
    col: { name: 'Festival', city: 'Stadt', about: 'Info' },
    monthsH: 'Festivals nach Monat',
    relH: 'Weiter erkunden',
    browseLabel: '🗺️ Reise planen',
    festHubLabel: '🎉 Alle Korea-Festivals',
    faqH: 'FAQ',
    q1: (m) => `Welche Festivals gibt es im ${m} in Korea?`,
    a1: (m, names) => `Zu den jährlichen Festivals, die meist um den ${m} stattfinden, gehören ${names}. Es sind wiederkehrende Veranstaltungen, daher ändern sich die genauen Termine jedes Jahr — bestätigen Sie sie auf der offiziellen Website.`,
    q2: (m) => `Sind die Festivaltermine im ${m} jedes Jahr gleich?`,
    a2: () => `Nein. Koreanische Festivals wiederholen sich jährlich, aber ihre genauen Termine werden jede Saison neu festgelegt und richten sich oft nach dem Mondkalender, dem Wetter oder der Blütezeit. Prüfen Sie vor der Buchung stets den aktuellen offiziellen Terminplan.`,
    q3: () => `Wie plane ich eine Festivalreise nach Korea?`,
    a3: () => `Wählen Sie den Festivalmonat, buchen Sie früh eine Unterkunft in oder nahe der Gastgeberstadt und prüfen Sie die Termine des Jahres auf der Website des Veranstalters. Festivalwochenenden sind schnell ausgebucht — sichern Sie Transport und Unterkunft frühzeitig.`,
  },
  pt: {
    title: (m, n) => `Festivais da Coreia em ${m} (${n}) — O que rola | KoreaPlus`,
    desc: (m, n) => `${n} festiva${n === 1 ? 'l' : 'is'} coreano${n === 1 ? '' : 's'} que se repetem todo ${m}. Cidade, tema e o que esperar — planeje sua viagem à Coreia em ${m}.`,
    h1: (m) => `Festivais da Coreia em ${m}`,
    lead: (m, n) => n
      ? `A Coreia realiza estes ${n} festiva${n === 1 ? 'l' : 'is'} anua${n === 1 ? 'l' : 'is'} por volta de ${m}. Eles se repetem todo ano, mas as datas exatas mudam — confira o site oficial antes de viajar.`
      : `Nenhum grande festival anual de alcance nacional do nosso guia ocorre em ${m}. Explore os outros meses abaixo para planejar sua viagem.`,
    listH: (m, n) => `${n} festiva${n === 1 ? 'l' : 'is'} que se repetem em ${m}`,
    none: (m) => `Ainda não acompanhamos um grande festival recorrente para ${m} — veja os outros meses abaixo.`,
    factMonth: (m) => `📅 Mês: ${m}`,
    factN: (n) => `🎉 Festivais: ${n}`,
    col: { name: 'Festival', city: 'Cidade', about: 'Sobre' },
    monthsH: 'Festivais por mês',
    relH: 'Continue explorando',
    browseLabel: '🗺️ Planeje sua viagem',
    festHubLabel: '🎉 Todos os festivais da Coreia',
    faqH: 'Perguntas frequentes',
    q1: (m) => `Quais festivais acontecem na Coreia em ${m}?`,
    a1: (m, names) => `Entre os festivais anuais que costumam ocorrer por volta de ${m} estão ${names}. São eventos recorrentes, então as datas exatas mudam a cada ano — confirme no site oficial.`,
    q2: (m) => `As datas dos festivais de ${m} são fixas todo ano?`,
    a2: () => `Não. Os festivais coreanos se repetem todo ano, mas as datas exatas são definidas a cada temporada e muitas vezes seguem o calendário lunar, o clima ou a floração. Confira sempre a programação oficial mais recente antes de reservar.`,
    q3: () => `Como planejar uma viagem de festival na Coreia?`,
    a3: () => `Escolha o mês do festival, reserve cedo hospedagem na cidade-sede ou perto dela e confirme as datas do ano no site do organizador. Os fins de semana de festival lotam rápido, então garanta transporte e estadia com antecedência.`,
  },
  id: {
    title: (m, n) => `Festival Korea di ${m} (${n}) — Apa yang Ada | KoreaPlus`,
    desc: (m, n) => `${n} festival Korea yang berlangsung setiap ${m}. Kota, tema, dan apa yang bisa dinikmati — rencanakan perjalanan festival ke Korea di ${m}.`,
    h1: (m) => `Festival Korea di ${m}`,
    lead: (m, n) => n
      ? `Korea menggelar ${n} festival tahunan ini sekitar ${m}. Festival berulang tiap tahun, tetapi tanggal pastinya berubah — cek situs resmi sebelum berangkat.`
      : `Tidak ada festival tahunan berskala nasional dalam panduan kami yang jatuh di ${m}. Jelajahi bulan lain di bawah untuk merencanakan perjalananmu.`,
    listH: (m, n) => `${n} festival yang berlangsung di ${m}`,
    none: (m) => `Kami belum mendata festival tahunan besar untuk ${m} — lihat bulan lain di bawah.`,
    factMonth: (m) => `📅 Bulan: ${m}`,
    factN: (n) => `🎉 Festival: ${n}`,
    col: { name: 'Festival', city: 'Kota', about: 'Tentang' },
    monthsH: 'Festival per bulan',
    relH: 'Terus jelajahi',
    browseLabel: '🗺️ Rencanakan perjalanan',
    festHubLabel: '🎉 Semua festival Korea',
    faqH: 'FAQ',
    q1: (m) => `Festival apa saja yang ada di Korea pada ${m}?`,
    a1: (m, names) => `Festival tahunan yang biasanya berlangsung sekitar ${m} antara lain ${names}. Ini acara berulang, jadi tanggal pastinya berubah tiap tahun — pastikan di situs resmi.`,
    q2: (m) => `Apakah tanggal festival ${m} sama setiap tahun?`,
    a2: () => `Tidak. Festival Korea berlangsung tiap tahun, tetapi tanggal pastinya ditetapkan ulang setiap musim dan sering mengikuti kalender lunar, cuaca, atau waktu mekar bunga. Selalu cek jadwal resmi terbaru sebelum memesan.`,
    q3: () => `Bagaimana merencanakan perjalanan festival ke Korea?`,
    a3: () => `Pilih bulan festivalnya, pesan akomodasi di atau dekat kota tuan rumah sejak awal, dan verifikasi tanggal tahun itu di situs penyelenggara. Akhir pekan festival cepat penuh, jadi amankan transportasi dan penginapan lebih awal.`,
  },
};

module.exports = { MONTH_NAMES, T };
