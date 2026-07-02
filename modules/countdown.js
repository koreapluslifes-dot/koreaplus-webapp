/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — Event / season countdown (countdown.js · STEP2 S18)
   Self-detects an event or seasonal date on festival / cherry-blossom /
   autumn-foliage SEO pages (JSON-LD Event.startDate, structured date
   attributes, or the page's English month/season signal), then appends a
   live "D-{n}" countdown + an "Add to my calendar (.ics)" action to the
   shared '.kp-nextsteps' container. No date found → no-op. No libraries
   (Date + Blob only). Labels in 14 languages; .ics SUMMARY localized.
   Loaded (defer, ?v=1) by build-seo.cjs foot loader. Never touches ads.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    var host = document.querySelector('.kp-nextsteps');
    if (!host) return;                                   // STEP0 container absent → no-op
    if (host.querySelector('[data-kp-countdown]')) return; // mount guard

    // ── language (STEP0 kp_lang rule) ─────────────────────────────
    var SUP = ['en','ko','ja','zh','es','fr','de','pt','id','ar','hi','ru','th','vi'];
    var qp; try { qp = new URLSearchParams(location.search).get('lang'); } catch (e) { qp = null; }
    var ls; try { ls = localStorage.getItem('kp_lang'); } catch (e) { ls = null; }
    var nav = (navigator.language || 'en').slice(0, 2);
    var htmlLang = (document.documentElement.lang || '').slice(0, 2);
    var lang = qp || ls || htmlLang || nav || 'en';
    if (SUP.indexOf(lang) < 0) lang = 'en';

    var STR = {
      en: { title: 'Countdown', today: 'Happening today!', d: 'D-', days: 'days to go', add: '📅 Add to my calendar', added: 'Calendar file downloaded' },
      ko: { title: '카운트다운', today: '오늘 열려요!', d: 'D-', days: '일 남음', add: '📅 내 캘린더에 추가', added: '캘린더 파일이 저장되었어요' },
      ja: { title: 'カウントダウン', today: '本日開催！', d: 'あと', days: '日', add: '📅 カレンダーに追加', added: 'カレンダーファイルを保存しました' },
      zh: { title: '倒计时', today: '今天举行！', d: '倒计', days: '天', add: '📅 添加到我的日历', added: '日历文件已下载' },
      es: { title: 'Cuenta regresiva', today: '¡Es hoy!', d: 'Faltan ', days: 'días', add: '📅 Añadir a mi calendario', added: 'Archivo de calendario descargado' },
      fr: { title: 'Compte à rebours', today: "C'est aujourd'hui !", d: 'J-', days: 'jours restants', add: '📅 Ajouter à mon agenda', added: 'Fichier de calendrier téléchargé' },
      de: { title: 'Countdown', today: 'Heute ist es soweit!', d: 'noch ', days: 'Tage', add: '📅 Zu meinem Kalender', added: 'Kalenderdatei heruntergeladen' },
      pt: { title: 'Contagem regressiva', today: 'É hoje!', d: 'Faltam ', days: 'dias', add: '📅 Adicionar ao calendário', added: 'Arquivo de calendário baixado' },
      id: { title: 'Hitung mundur', today: 'Hari ini!', d: 'Tinggal ', days: 'hari', add: '📅 Tambah ke kalender saya', added: 'File kalender diunduh' },
      ar: { title: 'العد التنازلي', today: 'اليوم!', d: 'باقٍ ', days: 'يومًا', add: '📅 أضف إلى تقويمي', added: 'تم تنزيل ملف التقويم' },
      hi: { title: 'उलटी गिनती', today: 'आज है!', d: '', days: 'दिन बाकी', add: '📅 मेरे कैलेंडर में जोड़ें', added: 'कैलेंडर फ़ाइल डाउनलोड हुई' },
      ru: { title: 'Обратный отсчёт', today: 'Уже сегодня!', d: 'осталось ', days: 'дн.', add: '📅 Добавить в мой календарь', added: 'Файл календаря загружен' },
      th: { title: 'นับถอยหลัง', today: 'วันนี้!', d: 'อีก ', days: 'วัน', add: '📅 เพิ่มลงในปฏิทินของฉัน', added: 'ดาวน์โหลดไฟล์ปฏิทินแล้ว' },
      vi: { title: 'Đếm ngược', today: 'Diễn ra hôm nay!', d: 'Còn ', days: 'ngày', add: '📅 Thêm vào lịch của tôi', added: 'Đã tải tệp lịch' }
    };
    var S = STR[lang] || STR.en;

    // ══ date detection ══════════════════════════════════════════════
    // A "detected" date is {date: Date, exact: bool}. exact=true means the
    // page carried a concrete calendar date (ISO); exact=false means we
    // derived it from a recurring month/season signal (compute NEXT
    // occurrence, roll to next year if this year's window already passed).

    function parseISO(s) {
      if (!s) return null;
      // Accept YYYY-MM-DD (optionally with time). Avoid ambiguous locale parses.
      var m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) return null;
      var y = +m[1], mo = +m[2] - 1, dd = +m[3];
      var dt = new Date(y, mo, dd);
      return (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === dd) ? dt : null;
    }

    // Next occurrence of a given (month, day) — annual recurring events.
    function nextOccurrence(monthIdx, day) {
      var now = new Date(); now.setHours(0, 0, 0, 0);
      var cand = new Date(now.getFullYear(), monthIdx, day);
      if (cand.getTime() < now.getTime()) cand = new Date(now.getFullYear() + 1, monthIdx, day);
      return cand;
    }

    var detected = null;

    // 1) JSON-LD Event.startDate (most reliable) — walk all ld+json blocks.
    try {
      var blocks = document.querySelectorAll('script[type="application/ld+json"]');
      for (var i = 0; i < blocks.length && !detected; i++) {
        var data; try { data = JSON.parse(blocks[i].textContent || 'null'); } catch (e) { continue; }
        var stack = [data];
        while (stack.length && !detected) {
          var node = stack.pop();
          if (!node || typeof node !== 'object') continue;
          if (Array.isArray(node)) { for (var a = 0; a < node.length; a++) stack.push(node[a]); continue; }
          var type = node['@type'];
          var isEvent = type === 'Event' || (Array.isArray(type) && type.indexOf('Event') >= 0) ||
                        (typeof type === 'string' && /Event$/.test(type));
          if (isEvent && node.startDate) {
            var d1 = parseISO(node.startDate);
            if (d1) { detected = { date: d1, exact: true }; break; }
          }
          for (var k in node) { if (Object.prototype.hasOwnProperty.call(node, k)) stack.push(node[k]); }
        }
      }
    } catch (e) {}

    // 2) Structured DOM date signals.
    if (!detected) {
      try {
        var el = document.querySelector('[data-kp-date],[data-event-date],meta[itemprop="startDate"],[itemprop="startDate"],time[datetime]');
        if (el) {
          var raw = el.getAttribute('data-kp-date') || el.getAttribute('data-event-date') ||
                    el.getAttribute('content') || el.getAttribute('datetime');
          var d2 = parseISO(raw);
          if (d2) detected = { date: d2, exact: true };
        }
      } catch (e) {}
    }

    // 3) Recurring month / season signal from the page's English URL slug.
    //    Festival month pages:  korea-festivals-in-<month>
    //    Cherry-blossom pages:  cherry-blossom-in-<city>   → early-mid April
    //    Autumn-foliage pages:  autumn-foliage-in-<city>   → late October
    //    These are annual, undated windows; we anchor to a representative
    //    day inside the typical window and count down to the NEXT one.
    if (!detected) {
      try {
        var path = (location.pathname || '').toLowerCase();
        var MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        var fm = path.match(/korea-festivals-in-([a-z]+)/);
        if (fm) {
          var mi = MONTHS.indexOf(fm[1]);
          if (mi >= 0) detected = { date: nextOccurrence(mi, 15), exact: false }; // mid-month anchor
        }
        if (!detected && /cherry-blossom-in-/.test(path)) {
          detected = { date: nextOccurrence(3, 5), exact: false };   // ~Apr 5 (early–mid April)
        }
        if (!detected && /autumn-foliage-in-/.test(path)) {
          detected = { date: nextOccurrence(9, 28), exact: false };  // ~Oct 28 (late Oct–early Nov)
        }
      } catch (e) {}
    }

    if (!detected || !detected.date || isNaN(detected.date.getTime())) return; // no date → no-op

    // ── localized event title for display + .ics SUMMARY ─────────────
    var evTitle = '';
    try {
      var h1 = document.querySelector('.seo-hero h1, h1');
      evTitle = (h1 && (h1.textContent || '').trim()) || (document.title || '').split('|')[0].trim();
    } catch (e) { evTitle = (document.title || '').trim(); }
    if (!evTitle) evTitle = 'KoreaPlus';

    var target = detected.date;
    var todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
    var MS = 86400000;
    var diffDays = Math.round((new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() - todayMid.getTime()) / MS);
    if (diffDays < 0) return; // safety: never show a past date

    // ── build the section (STEP0 .kp-nextsteps contract) ─────────────
    var sec = document.createElement('section');
    sec.setAttribute('data-kp-countdown', '1'); // mount guard id

    var titleP = document.createElement('p');
    titleP.className = 'kp-ns-title';
    titleP.textContent = S.title;
    sec.appendChild(titleP);

    var box = document.createElement('div');
    box.className = 'kp-cd-box';
    box.style.minHeight = '84px'; // CLS guard

    var big = document.createElement('div');
    big.className = 'kp-cd-num';
    var label = document.createElement('div');
    label.className = 'kp-cd-name';
    label.textContent = evTitle;

    function renderNum() {
      var nowMid = new Date(); nowMid.setHours(0, 0, 0, 0);
      var n = Math.round((new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() - nowMid.getTime()) / MS);
      if (n <= 0) big.textContent = S.today;
      else big.textContent = (S.d + n).trim() + (S.days ? ' · ' + S.days : '');
      big.setAttribute('aria-label', (n <= 0 ? S.today : n + ' ' + S.days));
    }
    renderNum();

    box.appendChild(big);
    box.appendChild(label);
    sec.appendChild(box);

    // ── "Add to my calendar" (.ics via Blob) ─────────────────────────
    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'kp-cd-add';
    addBtn.textContent = S.add;
    addBtn.style.marginTop = '10px';
    addBtn.addEventListener('click', function () {
      try {
        function pad(x) { return (x < 10 ? '0' : '') + x; }
        function dstamp(dt) { return dt.getFullYear() + pad(dt.getMonth() + 1) + pad(dt.getDate()); }
        var start = target;
        var end = new Date(start.getTime() + MS); // all-day, DTEND = next day
        var dtstamp = new Date();
        var stamp = dtstamp.getUTCFullYear() + pad(dtstamp.getUTCMonth() + 1) + pad(dtstamp.getUTCDate()) +
                    'T' + pad(dtstamp.getUTCHours()) + pad(dtstamp.getUTCMinutes()) + pad(dtstamp.getUTCSeconds()) + 'Z';
        function fold(s) { return String(s).replace(/([,;\\])/g, '\\$1').replace(/\r?\n/g, '\\n'); }
        var uid = 'kp-' + dstamp(start) + '-' + Math.random().toString(36).slice(2, 8) + '@koreaplus-lifes.com';
        var ics = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//KoreaPlus//Countdown//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          'UID:' + uid,
          'DTSTAMP:' + stamp,
          'DTSTART;VALUE=DATE:' + dstamp(start),
          'DTEND;VALUE=DATE:' + dstamp(end),
          'SUMMARY:' + fold(evTitle),
          'URL:' + fold(location.href),
          'DESCRIPTION:' + fold(evTitle + ' — ' + location.href),
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
        var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (evTitle.replace(/[^\w가-힣ぁ-んァ-ヶ一-鿿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'koreaplus-event') + '.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 4000);
        // lightweight inline confirmation (no dependency on shared toast)
        try {
          var note = sec.querySelector('.kp-cd-note');
          if (!note) { note = document.createElement('div'); note.className = 'kp-cd-note'; note.style.marginTop = '6px'; note.style.fontSize = '.85em'; note.style.opacity = '.8'; sec.appendChild(note); }
          note.textContent = '✓ ' + S.added;
        } catch (e) {}
      } catch (e) {}
    });
    sec.appendChild(addBtn);

    // ── mount into shared container; first item reveals it (STEP0) ───
    // (section is a direct child of .kp-nextsteps per STEP0; appended so we
    //  can wire the .ics click handler on the live node.)
    host.appendChild(sec);
    if (host.hasAttribute('hidden')) host.removeAttribute('hidden');

    // keep the D-n fresh across midnight while the tab stays open
    var respectMotion = false;
    try { respectMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (!respectMotion) {
      // re-render once per hour is enough; cheap and avoids stale D-n
      setInterval(renderNum, 3600000);
    }
  } catch (e) {}
})();
