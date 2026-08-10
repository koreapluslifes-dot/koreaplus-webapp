/* seo-kpop-media-l10n.js — UI labels for the shared K-pop media renderers
   (modules/seo-kpop-media.cjs): artist photo credits and discography tables.

   Build input only — never deployed to the server.

   Only short chrome lives here; all page prose comes from the content files.
   %d = snapshot date (YYYY-MM-DD).

   nReleases is a FUNCTION of the count, not a %n template: acts with a single
   release are common in this roster, and a plain template renders "1 releases"
   in every language that inflects. Languages without a count-driven plural
   (ko/ja/zh/id) still take the function — one call shape for every caller.

   Adding a language: add the key here AND in modules/seo-langs.cjs. A missing
   key falls back to English, which is a visible defect, not a graceful one. */
'use strict';

module.exports = {
  en: { photo: 'Photo', discogH: 'Discography', nReleases: (n) => `${n} release${n === 1 ? '' : 's'}`, colYear: 'Year', colTitle: 'Release', colDate: 'Release date', asOf: 'Release data from Apple Music · as of %d', upcoming: 'Upcoming', latestH: 'Latest release', comingH: 'Coming next' },
  ko: { photo: '사진', discogH: '디스코그래피', nReleases: (n) => `${n}장`, colYear: '연도', colTitle: '앨범', colDate: '발매일', asOf: '애플 뮤직 발매 정보 · %d 기준', upcoming: '발매 예정', latestH: '최근 발매', comingH: '발매 예정' },
  ja: { photo: '写真', discogH: 'ディスコグラフィ', nReleases: (n) => `${n}作品`, colYear: '年', colTitle: 'リリース', colDate: 'リリース日', asOf: 'Apple Music のリリース情報 · %d 時点', upcoming: 'リリース予定', latestH: '最新リリース', comingH: 'リリース予定' },
  zh: { photo: '照片', discogH: '作品年表', nReleases: (n) => `${n} 张`, colYear: '年份', colTitle: '专辑', colDate: '发行日期', asOf: 'Apple Music 发行资料 · 截至 %d', upcoming: '即将发行', latestH: '最新发行', comingH: '即将发行' },
  es: { photo: 'Foto', discogH: 'Discografía', nReleases: (n) => `${n} lanzamiento${n === 1 ? '' : 's'}`, colYear: 'Año', colTitle: 'Lanzamiento', colDate: 'Fecha de lanzamiento', asOf: 'Datos de lanzamiento de Apple Music · a %d', upcoming: 'Próximamente', latestH: 'Último lanzamiento', comingH: 'Próximo lanzamiento' },
  fr: { photo: 'Photo', discogH: 'Discographie', nReleases: (n) => `${n} sortie${n > 1 ? 's' : ''}`, colYear: 'Année', colTitle: 'Sortie', colDate: 'Date de sortie', asOf: 'Données de sortie Apple Music · au %d', upcoming: 'À venir', latestH: 'Dernière sortie', comingH: 'Prochaine sortie' },
  de: { photo: 'Foto', discogH: 'Diskografie', nReleases: (n) => `${n} Veröffentlichung${n === 1 ? '' : 'en'}`, colYear: 'Jahr', colTitle: 'Veröffentlichung', colDate: 'Erscheinungsdatum', asOf: 'Release-Daten von Apple Music · Stand %d', upcoming: 'Demnächst', latestH: 'Neueste Veröffentlichung', comingH: 'Nächste Veröffentlichung' },
  pt: { photo: 'Foto', discogH: 'Discografia', nReleases: (n) => `${n} lançamento${n === 1 ? '' : 's'}`, colYear: 'Ano', colTitle: 'Lançamento', colDate: 'Data de lançamento', asOf: 'Dados de lançamento da Apple Music · em %d', upcoming: 'Em breve', latestH: 'Último lançamento', comingH: 'Próximo lançamento' },
  id: { photo: 'Foto', discogH: 'Diskografi', nReleases: (n) => `${n} rilisan`, colYear: 'Tahun', colTitle: 'Rilisan', colDate: 'Tanggal rilis', asOf: 'Data rilis dari Apple Music · per %d', upcoming: 'Segera rilis', latestH: 'Rilis terbaru', comingH: 'Rilis berikutnya' },
  /* ar counts with the number AFTER the noun, as a label. A numeral in front
     governs five different inflections (1 / 2 / 3–10 / 11–99 / 100+); no
     ternary gets all five right, and this roster hits at least three of them. */
  ar: { photo: 'الصورة', discogH: 'قائمة الإصدارات', nReleases: (n) => `عدد الإصدارات: ${n}`, colYear: 'السنة', colTitle: 'الإصدار', colDate: 'تاريخ الإصدار', asOf: 'بيانات الإصدارات من Apple Music · حتى %d', upcoming: 'قريبًا', latestH: 'أحدث إصدار', comingH: 'الإصدار القادم' },
  hi: { photo: 'फोटो', discogH: 'डिस्कोग्राफी', nReleases: (n) => `${n} रिलीज़`, colYear: 'साल', colTitle: 'रिलीज़', colDate: 'रिलीज़ की तारीख', asOf: 'Apple Music का रिलीज़ डेटा · %d तक', upcoming: 'जल्द रिलीज़', latestH: 'लेटेस्ट रिलीज़', comingH: 'अगली रिलीज़' },
  ru: { photo: 'Фото', discogH: 'Дискография', nReleases: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'релиз' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'релиза' : 'релизов'}`, colYear: 'Год', colTitle: 'Релиз', colDate: 'Дата выхода', asOf: 'Данные о релизах из Apple Music · по состоянию на %d', upcoming: 'Скоро', latestH: 'Последний релиз', comingH: 'Следующий релиз' },
  vi: { photo: 'Ảnh', discogH: 'Danh sách phát hành', nReleases: (n) => `${n} bản phát hành`, colYear: 'Năm', colTitle: 'Bản phát hành', colDate: 'Ngày phát hành', asOf: 'Dữ liệu phát hành từ Apple Music · tính đến %d', upcoming: 'Sắp phát hành', latestH: 'Bản phát hành mới nhất', comingH: 'Bản phát hành tiếp theo' },
  /* th counts as NOUN + NUMERAL + CLASSIFIER, identical at every count. ชิ้น is
     the classifier the year cluster already uses for a release, so a profile
     and a year page count the same objects the same way. */
  th: { photo: 'ภาพ', discogH: 'ผลงานเพลง', nReleases: (n) => `ผลงาน ${n} ชิ้น`, colYear: 'ปี', colTitle: 'ผลงาน', colDate: 'วันวางจำหน่าย', asOf: 'ข้อมูลการวางจำหน่ายจาก Apple Music ณ วันที่ %d', upcoming: 'เร็ว ๆ นี้', latestH: 'ผลงานล่าสุด', comingH: 'ผลงานถัดไป' },
};
