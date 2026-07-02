/* ══════════════════════════════════════════════════════════════════
   modules/microquiz-l10n.js — localized body content (questions,
   choices, result copy) for the micro decision-quiz widget
   (modules/microquiz.js).

   Scope (per project i18n contract): this is page-body / SEO content
   localization for the quiz itself — kept SEPARATE from messages/*.json
   (UI chrome) and from the module's own 14-language STR chrome. 9 SEO
   languages: en ja zh es fr de pt id ko.

   Consumption: dual-mode. In the browser microquiz.js injects this file
   as a <script> and reads window.KP_MICROQUIZ_L10N; under Node it is a
   plain module.exports so build tooling can lint / reuse it.

   Structure:
     <lang>.<category> = {
       q:  [ { t:'question text', a:['choice A','choice B', ...] }, ... ],
       r:  'result heading shown above the recommended links'
     }
   Categories: visa, city, food, season, transport, kpop, budget, generic.
   The quiz OUTCOME (which pages are linked) is decided deterministically
   by microquiz.js from the chosen answers + related.json — this file only
   supplies wording. No year-specific or promissory claims.
   ══════════════════════════════════════════════════════════════════ */
(function (root, data) {
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.KP_MICROQUIZ_L10N = data;
})(typeof window !== 'undefined' ? window : null, {

  en: {
    title: 'Quick picker',
    intro: 'Answer a couple of quick questions and we\'ll point you to the right guide.',
    restart: 'Start over',
    result: 'Based on your answers',
    visa: { r: 'Your visa & entry next steps', q: [
      { t: 'What do you need to sort out first?', a: ['Entry permit / K-ETA', 'How long I can stay', 'Documents to prepare'] },
      { t: 'When are you travelling?', a: ['Within a month', 'Later this year', 'Just researching'] } ] },
    city: { r: 'Cities worth your time', q: [
      { t: 'What\'s your trip mostly about?', a: ['City life & food', 'Nature & scenery', 'History & culture'] },
      { t: 'How much time do you have?', a: ['A weekend', 'About a week', 'Two weeks or more'] } ] },
    food: { r: 'What to eat next', q: [
      { t: 'What are you in the mood for?', a: ['Something spicy', 'Grilled BBQ', 'Street food snacks'] },
      { t: 'Who are you eating with?', a: ['Solo', 'Couple / friends', 'Family with kids'] } ] },
    season: { r: 'Best time & seasonal picks', q: [
      { t: 'Which season interests you?', a: ['Spring blossoms', 'Summer & beaches', 'Autumn foliage', 'Winter & snow'] },
      { t: 'What matters most?', a: ['Best scenery', 'Fewer crowds', 'Comfortable weather'] } ] },
    transport: { r: 'Getting around', q: [
      { t: 'How do you prefer to travel between cities?', a: ['Fastest (KTX)', 'Cheapest', 'Most flexible'] },
      { t: 'Comfortable with public transit?', a: ['Yes, love it', 'A little', 'Prefer taxis'] } ] },
    kpop: { r: 'Your K-pop rabbit hole', q: [
      { t: 'What pulls you in most?', a: ['A specific group', 'The music scene', 'Fan culture & merch'] },
      { t: 'How deep do you want to go?', a: ['Just the basics', 'A proper deep dive'] } ] },
    budget: { r: 'Planning your budget', q: [
      { t: 'What\'s your travel style?', a: ['Backpacker / budget', 'Comfortable mid-range', 'Treat myself'] },
      { t: 'Biggest cost worry?', a: ['Accommodation', 'Food & activities', 'Getting around'] } ] },
    generic: { r: 'Where to go next', q: [
      { t: 'What are you planning?', a: ['A first trip', 'A return visit', 'Just exploring ideas'] },
      { t: 'What helps you most right now?', a: ['A ready-made plan', 'Practical tips', 'Inspiration'] } ] }
  },

  ja: {
    title: 'かんたん診断',
    intro: 'いくつかの質問に答えると、ぴったりのガイドをご案内します。',
    restart: '最初から',
    result: 'あなたの回答から',
    visa: { r: 'ビザ・入国の次のステップ', q: [
      { t: 'まず何を確認したいですか？', a: ['入国許可 / K-ETA', '滞在できる日数', '準備する書類'] },
      { t: 'いつ渡航しますか？', a: ['1か月以内', '年内', 'まだ検討中'] } ] },
    city: { r: 'おすすめの都市', q: [
      { t: '旅の目的は主に何ですか？', a: ['街歩きとグルメ', '自然と絶景', '歴史と文化'] },
      { t: '滞在日数は？', a: ['週末だけ', '1週間ほど', '2週間以上'] } ] },
    food: { r: '次に食べたいもの', q: [
      { t: 'どんな気分ですか？', a: ['辛いもの', '焼肉・BBQ', '屋台グルメ'] },
      { t: '誰と食べますか？', a: ['ひとり', 'カップル・友人', '子ども連れ'] } ] },
    season: { r: 'ベストシーズンと季節の見どころ', q: [
      { t: '気になる季節は？', a: ['春の花', '夏・ビーチ', '秋の紅葉', '冬・雪'] },
      { t: '重視するのは？', a: ['絶景', '空いている', '快適な気候'] } ] },
    transport: { r: '移動手段', q: [
      { t: '都市間の移動でどれを優先？', a: ['最速（KTX）', '最安', '自由度'] },
      { t: '公共交通は得意？', a: ['得意', '少し', 'タクシー派'] } ] },
    kpop: { r: 'K-POPの沼へ', q: [
      { t: '一番惹かれるのは？', a: ['特定のグループ', '音楽シーン', 'ファン文化・グッズ'] },
      { t: 'どこまで知りたい？', a: ['基本だけ', 'しっかり深掘り'] } ] },
    budget: { r: '予算プランニング', q: [
      { t: '旅のスタイルは？', a: ['節約・バックパッカー', '中級で快適に', 'ぜいたくに'] },
      { t: '一番気になる出費は？', a: ['宿泊', '食事・アクティビティ', '移動'] } ] },
    generic: { r: '次はどこへ', q: [
      { t: '何を計画していますか？', a: ['初めての旅', 'リピート旅', 'アイデア探し'] },
      { t: '今いちばん助かるのは？', a: ['できあいのプラン', '実用的なコツ', 'インスピレーション'] } ] }
  },

  zh: {
    title: '快速测测',
    intro: '回答几个小问题，我们帮你找到合适的攻略。',
    restart: '重新开始',
    result: '根据你的选择',
    visa: { r: '签证与入境下一步', q: [
      { t: '你最想先弄清什么？', a: ['入境许可 / K-ETA', '能停留多久', '要准备的材料'] },
      { t: '什么时候出行？', a: ['一个月内', '今年晚些', '只是先看看'] } ] },
    city: { r: '值得一去的城市', q: [
      { t: '这趟旅行主要为了什么？', a: ['都市与美食', '自然与风景', '历史与文化'] },
      { t: '你有多少时间？', a: ['一个周末', '大约一周', '两周或更久'] } ] },
    food: { r: '接下来吃什么', q: [
      { t: '你现在想吃什么？', a: ['辣的', '烤肉 BBQ', '街头小吃'] },
      { t: '和谁一起吃？', a: ['一个人', '情侣 / 朋友', '带小孩的家庭'] } ] },
    season: { r: '最佳时间与季节推荐', q: [
      { t: '你对哪个季节感兴趣？', a: ['春季花开', '夏季海滩', '秋季红叶', '冬季雪景'] },
      { t: '你最看重什么？', a: ['最佳风景', '人少', '天气舒适'] } ] },
    transport: { r: '交通出行', q: [
      { t: '城际出行你更看重？', a: ['最快（KTX）', '最省钱', '最灵活'] },
      { t: '习惯公共交通吗？', a: ['很习惯', '一点点', '更爱打车'] } ] },
    kpop: { r: '你的 K-pop 入坑指南', q: [
      { t: '最吸引你的是？', a: ['某个团体', '音乐圈', '粉丝文化与周边'] },
      { t: '想了解多深？', a: ['先了解基础', '深入研究'] } ] },
    budget: { r: '预算规划', q: [
      { t: '你的旅行风格？', a: ['背包 / 省钱', '舒适中档', '犒劳自己'] },
      { t: '最担心哪项花费？', a: ['住宿', '吃与玩', '交通'] } ] },
    generic: { r: '接下来去哪', q: [
      { t: '你在计划什么？', a: ['第一次旅行', '再次到访', '只是找灵感'] },
      { t: '现在最需要什么？', a: ['现成行程', '实用贴士', '灵感'] } ] }
  },

  es: {
    title: 'Elige rápido',
    intro: 'Responde un par de preguntas y te llevamos a la guía indicada.',
    restart: 'Empezar de nuevo',
    result: 'Según tus respuestas',
    visa: { r: 'Tus próximos pasos de visado y entrada', q: [
      { t: '¿Qué necesitas resolver primero?', a: ['Permiso de entrada / K-ETA', 'Cuánto puedo quedarme', 'Documentos a preparar'] },
      { t: '¿Cuándo viajas?', a: ['En un mes', 'Más adelante este año', 'Solo investigando'] } ] },
    city: { r: 'Ciudades que valen la pena', q: [
      { t: '¿De qué trata tu viaje?', a: ['Ciudad y comida', 'Naturaleza y paisajes', 'Historia y cultura'] },
      { t: '¿Cuánto tiempo tienes?', a: ['Un fin de semana', 'Una semana', 'Dos semanas o más'] } ] },
    food: { r: 'Qué comer ahora', q: [
      { t: '¿Qué te apetece?', a: ['Algo picante', 'Barbacoa a la parrilla', 'Comida callejera'] },
      { t: '¿Con quién comes?', a: ['Solo', 'Pareja / amigos', 'Familia con niños'] } ] },
    season: { r: 'Mejor época y planes de temporada', q: [
      { t: '¿Qué temporada te interesa?', a: ['Flores de primavera', 'Verano y playas', 'Follaje de otoño', 'Invierno y nieve'] },
      { t: '¿Qué es lo más importante?', a: ['Mejores paisajes', 'Menos gente', 'Clima agradable'] } ] },
    transport: { r: 'Cómo moverte', q: [
      { t: '¿Cómo prefieres viajar entre ciudades?', a: ['Lo más rápido (KTX)', 'Lo más barato', 'Lo más flexible'] },
      { t: '¿Cómodo con el transporte público?', a: ['Sí, me encanta', 'Un poco', 'Prefiero taxis'] } ] },
    kpop: { r: 'Tu inmersión en el K-pop', q: [
      { t: '¿Qué te atrae más?', a: ['Un grupo concreto', 'La escena musical', 'Cultura fan y merch'] },
      { t: '¿Qué tan a fondo quieres ir?', a: ['Solo lo básico', 'Una inmersión total'] } ] },
    budget: { r: 'Planea tu presupuesto', q: [
      { t: '¿Cuál es tu estilo de viaje?', a: ['Mochilero / económico', 'Gama media cómoda', 'Darme un gusto'] },
      { t: '¿Mayor preocupación de gasto?', a: ['Alojamiento', 'Comida y actividades', 'Transporte'] } ] },
    generic: { r: 'A dónde ir después', q: [
      { t: '¿Qué estás planeando?', a: ['Un primer viaje', 'Una nueva visita', 'Solo explorando ideas'] },
      { t: '¿Qué te ayuda más ahora?', a: ['Un plan listo', 'Consejos prácticos', 'Inspiración'] } ] }
  },

  fr: {
    title: 'Choix rapide',
    intro: 'Répondez à deux questions et on vous oriente vers le bon guide.',
    restart: 'Recommencer',
    result: 'D\'après vos réponses',
    visa: { r: 'Vos prochaines étapes visa et entrée', q: [
      { t: 'Que faut-il régler en premier ?', a: ['Autorisation d\'entrée / K-ETA', 'Durée de séjour', 'Documents à préparer'] },
      { t: 'Quand partez-vous ?', a: ['Dans un mois', 'Plus tard cette année', 'Je me renseigne'] } ] },
    city: { r: 'Villes qui valent le détour', q: [
      { t: 'Votre voyage, c\'est surtout…', a: ['Ville et gastronomie', 'Nature et paysages', 'Histoire et culture'] },
      { t: 'Combien de temps avez-vous ?', a: ['Un week-end', 'Environ une semaine', 'Deux semaines ou plus'] } ] },
    food: { r: 'Quoi manger ensuite', q: [
      { t: 'De quoi avez-vous envie ?', a: ['Quelque chose d\'épicé', 'Barbecue grillé', 'Street food'] },
      { t: 'Avec qui mangez-vous ?', a: ['Seul', 'En couple / amis', 'Famille avec enfants'] } ] },
    season: { r: 'Meilleure période et idées de saison', q: [
      { t: 'Quelle saison vous intéresse ?', a: ['Fleurs de printemps', 'Été et plages', 'Feuillages d\'automne', 'Hiver et neige'] },
      { t: 'Qu\'est-ce qui compte le plus ?', a: ['Les plus beaux paysages', 'Moins de monde', 'Météo agréable'] } ] },
    transport: { r: 'Se déplacer', q: [
      { t: 'Comment préférez-vous voyager entre villes ?', a: ['Le plus rapide (KTX)', 'Le moins cher', 'Le plus flexible'] },
      { t: 'À l\'aise avec les transports en commun ?', a: ['Oui, j\'adore', 'Un peu', 'Je préfère le taxi'] } ] },
    kpop: { r: 'Votre plongée dans la K-pop', q: [
      { t: 'Qu\'est-ce qui vous attire le plus ?', a: ['Un groupe précis', 'La scène musicale', 'Culture fan et goodies'] },
      { t: 'Jusqu\'où voulez-vous aller ?', a: ['Juste les bases', 'Une vraie immersion'] } ] },
    budget: { r: 'Planifiez votre budget', q: [
      { t: 'Votre style de voyage ?', a: ['Routard / petit budget', 'Milieu de gamme confortable', 'Se faire plaisir'] },
      { t: 'Plus grosse dépense qui inquiète ?', a: ['Hébergement', 'Repas et activités', 'Transports'] } ] },
    generic: { r: 'Où aller ensuite', q: [
      { t: 'Que préparez-vous ?', a: ['Un premier voyage', 'Un nouveau séjour', 'Je cherche des idées'] },
      { t: 'Qu\'est-ce qui vous aide le plus ?', a: ['Un plan tout prêt', 'Des conseils pratiques', 'De l\'inspiration'] } ] }
  },

  de: {
    title: 'Schnell-Finder',
    intro: 'Beantworte ein paar kurze Fragen und wir zeigen dir den passenden Guide.',
    restart: 'Neu starten',
    result: 'Basierend auf deinen Antworten',
    visa: { r: 'Deine nächsten Schritte für Visum & Einreise', q: [
      { t: 'Was möchtest du zuerst klären?', a: ['Einreisegenehmigung / K-ETA', 'Aufenthaltsdauer', 'Vorzubereitende Dokumente'] },
      { t: 'Wann reist du?', a: ['Innerhalb eines Monats', 'Später dieses Jahr', 'Ich informiere mich nur'] } ] },
    city: { r: 'Städte, die sich lohnen', q: [
      { t: 'Worum geht es bei deiner Reise vor allem?', a: ['Stadt & Essen', 'Natur & Landschaft', 'Geschichte & Kultur'] },
      { t: 'Wie viel Zeit hast du?', a: ['Ein Wochenende', 'Etwa eine Woche', 'Zwei Wochen oder mehr'] } ] },
    food: { r: 'Was du als Nächstes essen solltest', q: [
      { t: 'Worauf hast du Lust?', a: ['Etwas Scharfes', 'Gegrilltes BBQ', 'Streetfood-Snacks'] },
      { t: 'Mit wem isst du?', a: ['Allein', 'Paar / Freunde', 'Familie mit Kindern'] } ] },
    season: { r: 'Beste Zeit & saisonale Tipps', q: [
      { t: 'Welche Jahreszeit interessiert dich?', a: ['Frühlingsblüten', 'Sommer & Strände', 'Herbstlaub', 'Winter & Schnee'] },
      { t: 'Was ist dir am wichtigsten?', a: ['Beste Landschaft', 'Weniger Andrang', 'Angenehmes Wetter'] } ] },
    transport: { r: 'Unterwegs sein', q: [
      { t: 'Wie reist du am liebsten zwischen Städten?', a: ['Am schnellsten (KTX)', 'Am günstigsten', 'Am flexibelsten'] },
      { t: 'Kommst du mit dem Nahverkehr klar?', a: ['Ja, gerne', 'Ein wenig', 'Lieber Taxi'] } ] },
    kpop: { r: 'Dein K-Pop-Kaninchenbau', q: [
      { t: 'Was zieht dich am meisten an?', a: ['Eine bestimmte Gruppe', 'Die Musikszene', 'Fankultur & Merch'] },
      { t: 'Wie tief willst du einsteigen?', a: ['Nur die Basics', 'Ein richtiger Deep Dive'] } ] },
    budget: { r: 'Budget planen', q: [
      { t: 'Was ist dein Reisestil?', a: ['Backpacker / sparsam', 'Komfortable Mittelklasse', 'Etwas gönnen'] },
      { t: 'Größte Kostensorge?', a: ['Unterkunft', 'Essen & Aktivitäten', 'Fortbewegung'] } ] },
    generic: { r: 'Wohin als Nächstes', q: [
      { t: 'Was planst du?', a: ['Eine erste Reise', 'Ein erneuter Besuch', 'Nur Ideen sammeln'] },
      { t: 'Was hilft dir gerade am meisten?', a: ['Ein fertiger Plan', 'Praktische Tipps', 'Inspiration'] } ] }
  },

  pt: {
    title: 'Escolha rápida',
    intro: 'Responda a algumas perguntas e mostramos o guia certo.',
    restart: 'Começar de novo',
    result: 'Com base nas suas respostas',
    visa: { r: 'Seus próximos passos de visto e entrada', q: [
      { t: 'O que precisa resolver primeiro?', a: ['Autorização de entrada / K-ETA', 'Quanto tempo posso ficar', 'Documentos a preparar'] },
      { t: 'Quando você viaja?', a: ['Dentro de um mês', 'Mais para o fim do ano', 'Só pesquisando'] } ] },
    city: { r: 'Cidades que valem a pena', q: [
      { t: 'Sua viagem é sobretudo sobre o quê?', a: ['Cidade e comida', 'Natureza e paisagens', 'História e cultura'] },
      { t: 'Quanto tempo você tem?', a: ['Um fim de semana', 'Cerca de uma semana', 'Duas semanas ou mais'] } ] },
    food: { r: 'O que comer a seguir', q: [
      { t: 'Do que está com vontade?', a: ['Algo picante', 'Churrasco grelhado', 'Comida de rua'] },
      { t: 'Com quem vai comer?', a: ['Sozinho', 'Casal / amigos', 'Família com crianças'] } ] },
    season: { r: 'Melhor época e dicas sazonais', q: [
      { t: 'Qual estação te interessa?', a: ['Flores de primavera', 'Verão e praias', 'Folhagem de outono', 'Inverno e neve'] },
      { t: 'O que importa mais?', a: ['Melhores paisagens', 'Menos gente', 'Clima agradável'] } ] },
    transport: { r: 'Como se locomover', q: [
      { t: 'Como prefere viajar entre cidades?', a: ['Mais rápido (KTX)', 'Mais barato', 'Mais flexível'] },
      { t: 'À vontade com transporte público?', a: ['Sim, adoro', 'Um pouco', 'Prefiro táxi'] } ] },
    kpop: { r: 'Sua imersão no K-pop', q: [
      { t: 'O que mais te atrai?', a: ['Um grupo específico', 'A cena musical', 'Cultura de fãs e produtos'] },
      { t: 'Quão fundo quer ir?', a: ['Só o básico', 'Um mergulho completo'] } ] },
    budget: { r: 'Planeje seu orçamento', q: [
      { t: 'Qual é o seu estilo de viagem?', a: ['Mochileiro / econômico', 'Médio confortável', 'Me dar um mimo'] },
      { t: 'Maior preocupação de custo?', a: ['Hospedagem', 'Comida e atividades', 'Transporte'] } ] },
    generic: { r: 'Para onde ir a seguir', q: [
      { t: 'O que você está planejando?', a: ['Uma primeira viagem', 'Uma nova visita', 'Só explorando ideias'] },
      { t: 'O que mais ajuda agora?', a: ['Um roteiro pronto', 'Dicas práticas', 'Inspiração'] } ] }
  },

  id: {
    title: 'Pilih cepat',
    intro: 'Jawab beberapa pertanyaan singkat dan kami arahkan ke panduan yang tepat.',
    restart: 'Mulai lagi',
    result: 'Berdasarkan jawabanmu',
    visa: { r: 'Langkah berikutnya soal visa & masuk', q: [
      { t: 'Apa yang perlu diurus dulu?', a: ['Izin masuk / K-ETA', 'Berapa lama boleh tinggal', 'Dokumen yang disiapkan'] },
      { t: 'Kapan kamu berangkat?', a: ['Dalam sebulan', 'Akhir tahun ini', 'Baru cari info'] } ] },
    city: { r: 'Kota yang layak dikunjungi', q: [
      { t: 'Perjalananmu terutama tentang apa?', a: ['Kota & kuliner', 'Alam & pemandangan', 'Sejarah & budaya'] },
      { t: 'Berapa lama waktumu?', a: ['Akhir pekan', 'Sekitar seminggu', 'Dua minggu atau lebih'] } ] },
    food: { r: 'Mau makan apa berikutnya', q: [
      { t: 'Lagi ingin apa?', a: ['Yang pedas', 'BBQ panggang', 'Jajanan kaki lima'] },
      { t: 'Makan dengan siapa?', a: ['Sendiri', 'Pasangan / teman', 'Keluarga dengan anak'] } ] },
    season: { r: 'Waktu terbaik & pilihan musiman', q: [
      { t: 'Musim mana yang menarik buatmu?', a: ['Bunga musim semi', 'Musim panas & pantai', 'Dedaunan musim gugur', 'Musim dingin & salju'] },
      { t: 'Apa yang paling penting?', a: ['Pemandangan terbaik', 'Tidak ramai', 'Cuaca nyaman'] } ] },
    transport: { r: 'Berkeliling', q: [
      { t: 'Bagaimana kamu ingin berpindah antar kota?', a: ['Tercepat (KTX)', 'Termurah', 'Paling fleksibel'] },
      { t: 'Nyaman naik transportasi umum?', a: ['Ya, suka', 'Sedikit', 'Lebih suka taksi'] } ] },
    kpop: { r: 'Petualangan K-pop-mu', q: [
      { t: 'Apa yang paling menarik?', a: ['Grup tertentu', 'Skena musik', 'Budaya fan & merch'] },
      { t: 'Sedalam apa mau menyelam?', a: ['Dasarnya saja', 'Selami lebih dalam'] } ] },
    budget: { r: 'Rencanakan anggaranmu', q: [
      { t: 'Gaya perjalananmu?', a: ['Backpacker / hemat', 'Menengah nyaman', 'Manjakan diri'] },
      { t: 'Biaya yang paling dikhawatirkan?', a: ['Akomodasi', 'Makan & aktivitas', 'Transportasi'] } ] },
    generic: { r: 'Ke mana selanjutnya', q: [
      { t: 'Apa yang sedang kamu rencanakan?', a: ['Perjalanan pertama', 'Kunjungan ulang', 'Sekadar cari ide'] },
      { t: 'Apa yang paling membantu sekarang?', a: ['Rencana siap pakai', 'Tips praktis', 'Inspirasi'] } ] }
  },

  ko: {
    title: '빠른 추천',
    intro: '간단한 질문 몇 개에 답하면 딱 맞는 가이드를 알려드려요.',
    restart: '다시 하기',
    result: '답변을 바탕으로',
    visa: { r: '비자·입국 다음 단계', q: [
      { t: '가장 먼저 해결할 게 뭔가요?', a: ['입국 허가 / K-ETA', '체류 가능 기간', '준비 서류'] },
      { t: '언제 여행하나요?', a: ['한 달 이내', '올해 안', '아직 알아보는 중'] } ] },
    city: { r: '가볼 만한 도시', q: [
      { t: '이번 여행은 주로 무엇인가요?', a: ['도시와 맛집', '자연과 풍경', '역사와 문화'] },
      { t: '시간은 얼마나 있나요?', a: ['주말', '일주일 정도', '2주 이상'] } ] },
    food: { r: '다음에 먹을 것', q: [
      { t: '지금 뭐가 당기나요?', a: ['매운 음식', '숯불 BBQ', '길거리 간식'] },
      { t: '누구와 먹나요?', a: ['혼자', '연인·친구', '아이 동반 가족'] } ] },
    season: { r: '가기 좋은 시기·계절 추천', q: [
      { t: '어느 계절이 끌리나요?', a: ['봄꽃', '여름·바다', '가을 단풍', '겨울·눈'] },
      { t: '가장 중요한 건?', a: ['최고의 풍경', '적은 인파', '쾌적한 날씨'] } ] },
    transport: { r: '이동 방법', q: [
      { t: '도시 간 이동은 뭘 우선하나요?', a: ['가장 빠르게 (KTX)', '가장 저렴하게', '가장 유연하게'] },
      { t: '대중교통 괜찮나요?', a: ['좋아요', '조금', '택시가 편해요'] } ] },
    kpop: { r: 'K-pop 입문 코스', q: [
      { t: '가장 끌리는 건?', a: ['특정 그룹', '음악 신', '팬 문화·굿즈'] },
      { t: '어디까지 알고 싶나요?', a: ['기본만', '깊이 파고들기'] } ] },
    budget: { r: '예산 계획', q: [
      { t: '여행 스타일은?', a: ['배낭·알뜰', '중급으로 편하게', '나를 위한 사치'] },
      { t: '가장 걱정되는 비용은?', a: ['숙박', '식사·액티비티', '교통'] } ] },
    generic: { r: '다음은 어디로', q: [
      { t: '무엇을 계획 중인가요?', a: ['첫 여행', '재방문', '아이디어 구경 중'] },
      { t: '지금 가장 도움이 되는 건?', a: ['짜여진 일정', '실용 팁', '영감'] } ] }
  }

});
