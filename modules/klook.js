/* modules/klook.js — Klook affiliate dynamic widget (adid 1310693), injected into
   #kp-klook on TRAVEL pages only (never on /kbeauty — beauty intent ≠ travel).
   Auto-localizes language + currency to the visitor. Labeled + FTC-disclosed.
   Mirrors the official snippet (fetch-iframe-init.js scans for .klk-aff-widget). */
(function () {
  var host = document.getElementById('kp-klook');
  if (!host || host.dataset.done) return;
  host.dataset.done = '1';

  var lang = '';
  try { lang = (localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2)).toLowerCase(); } catch (e) {}
  var L = {
    en: { t: '✈️ Recommended Korea experiences', d: 'Affiliate — KoreaPlus may earn a commission at no extra cost to you.' },
    ko: { t: '✈️ 추천 한국 체험·투어', d: '제휴 링크 — 구매 시 KoreaPlus가 일정 수수료를 받을 수 있습니다 (추가 비용 없음).' },
    ja: { t: '✈️ おすすめの韓国体験・ツアー', d: 'アフィリエイト — 購入時にKoreaPlusが手数料を得る場合があります（追加費用なし）。' },
    zh: { t: '✈️ 推荐的韩国体验与行程', d: '联盟链接 — 通过购买，KoreaPlus 可能获得佣金（不额外收费）。' },
    es: { t: '✈️ Experiencias recomendadas en Corea', d: 'Enlace de afiliado — KoreaPlus puede ganar una comisión sin coste extra para ti.' },
    fr: { t: '✈️ Expériences recommandées en Corée', d: 'Lien affilié — KoreaPlus peut percevoir une commission sans coût supplémentaire.' },
    de: { t: '✈️ Empfohlene Korea-Erlebnisse', d: 'Affiliate-Link — KoreaPlus erhält ggf. eine Provision, ohne Mehrkosten für dich.' },
    pt: { t: '✈️ Experiências recomendadas na Coreia', d: 'Link de afiliado — a KoreaPlus pode receber comissão sem custo extra para você.' },
    id: { t: '✈️ Pengalaman Korea pilihan', d: 'Tautan afiliasi — KoreaPlus bisa mendapat komisi tanpa biaya tambahan.' },
  };
  var t = L[lang] || L.en;

  host.style.cssText = 'max-width:720px;margin:26px auto;padding:0 12px;';
  var label = document.createElement('div');
  label.textContent = t.t;
  label.style.cssText = 'font-size:13px;font-weight:800;color:#444;margin-bottom:8px;';
  host.appendChild(label);

  var ins = document.createElement('ins');
  ins.className = 'klk-aff-widget';
  var attrs = { 'data-adid': '1310693', 'data-lang': '', 'data-currency': '', 'data-cardH': '126', 'data-padding': '92', 'data-lgH': '470', 'data-edgeValue': '655', 'data-cid': '13', 'data-tid': '-1', 'data-amount': '3', 'data-prod': 'dynamic_widget' };
  Object.keys(attrs).forEach(function (k) { ins.setAttribute(k, attrs[k]); });
  var a = document.createElement('a'); a.href = '//www.klook.com/'; a.rel = 'sponsored noopener'; a.textContent = 'Klook.com';
  ins.appendChild(a);
  host.appendChild(ins);

  var disc = document.createElement('div');
  disc.textContent = t.d;
  disc.style.cssText = 'font-size:11px;color:#999;margin-top:6px;';
  host.appendChild(disc);

  // Load Klook's init script once; it scans for .klk-aff-widget and renders the iframe.
  var s = document.createElement('script');
  s.type = 'text/javascript'; s.async = true; s.src = 'https://affiliate.klook.com/widget/fetch-iframe-init.js';
  host.appendChild(s);
})();
