/* modules/cro.js — #10 A/B harness + exit-intent modal, #9 email capture.
   - Sticky 50/50 A/B variant (localStorage kp_ab) exposed as window.KP_AB + GA4.
   - Exit-intent modal (desktop mouseleave-top / mobile dwell+scroll), frequency-
     capped, that captures an email to the Worker /api/subscribe (KV). Variant A/B
     headline is the first live test. Consent-aware for analytics; value-offer UI
     shows regardless. No keys required. */
(function () {
  'use strict';
  var W = window, D = document, LS = W.localStorage;
  function g(k) { try { return LS.getItem(k); } catch (e) { return null; } }
  function s(k, v) { try { LS.setItem(k, v); } catch (e) {} }
  var consent = g('kp_consent') === 'accepted';
  function track(n, p) { try { if (consent && W.kpAnalytics && W.kpAnalytics.track) W.kpAnalytics.track(n, p || {}); } catch (e) {} }

  // ── A/B assignment (sticky) ───────────────────────────────────────────────
  var ab = g('kp_ab');
  if (ab !== 'A' && ab !== 'B') { ab = (Math.floor(Date.now() / 1000) % 2 === 0) ? 'A' : 'B'; s('kp_ab', ab); }
  W.KP_AB = ab;
  track('ab_variant', { variant: ab });

  // ── Locale strings ────────────────────────────────────────────────────────
  var lang = 'en';
  try { lang = (g('kp_lang') || (navigator.language || 'en').slice(0, 2)).toLowerCase(); } catch (e) {}
  var T = {
    en: { hA: "Don't lose your Korea trip ideas", hB: 'Free weekly Korea & K-beauty digest', sub: 'Trends, deals and trip tips — once a week, no spam.', ph: 'your@email.com', btn: 'Get the free digest', no: 'No thanks', ok: 'You’re in! Check your inbox soon ✓', err: 'Please enter a valid email.' },
    ko: { hA: '한국 여행 아이디어, 놓치지 마세요', hB: '주간 한국·K뷰티 무료 다이제스트', sub: '트렌드·특가·여행팁 — 주 1회, 스팸 없음.', ph: 'your@email.com', btn: '무료로 받아보기', no: '괜찮아요', ok: '구독 완료! 곧 메일함을 확인하세요 ✓', err: '올바른 이메일을 입력해 주세요.' },
    ja: { hA: '韓国旅行のアイデアをお忘れなく', hB: '毎週の韓国・K-beauty無料ダイジェスト', sub: 'トレンド・お得・旅のヒントを週1回、スパムなし。', ph: 'your@email.com', btn: '無料で受け取る', no: '今はいい', ok: '登録完了！メールをご確認ください ✓', err: '有効なメールを入力してください。' },
    zh: { hA: '别错过你的韩国旅行灵感', hB: '每周韩国与K-beauty免费摘要', sub: '趋势、优惠与旅行贴士，每周一封，无垃圾邮件。', ph: 'your@email.com', btn: '免费订阅', no: '暂不需要', ok: '订阅成功！请查收邮箱 ✓', err: '请输入有效的邮箱。' },
    es: { hA: 'No pierdas tus ideas para Corea', hB: 'Boletín semanal gratis de Corea y K-beauty', sub: 'Tendencias, ofertas y consejos — una vez por semana, sin spam.', ph: 'tu@email.com', btn: 'Quiero el boletín', no: 'No, gracias', ok: '¡Listo! Revisa tu correo pronto ✓', err: 'Introduce un email válido.' },
    fr: { hA: 'Ne perdez pas vos idées de voyage en Corée', hB: 'Newsletter hebdo gratuite Corée & K-beauty', sub: 'Tendances, bons plans et conseils — une fois par semaine, sans spam.', ph: 'votre@email.com', btn: 'Recevoir la newsletter', no: 'Non merci', ok: 'C’est fait ! Vérifiez vos emails ✓', err: 'Entrez un email valide.' },
    de: { hA: 'Verliere deine Korea-Reiseideen nicht', hB: 'Wöchentlicher Korea- & K-Beauty-Newsletter', sub: 'Trends, Deals und Reisetipps — einmal pro Woche, kein Spam.', ph: 'deine@email.com', btn: 'Newsletter holen', no: 'Nein danke', ok: 'Geschafft! Schau bald in dein Postfach ✓', err: 'Bitte gültige E-Mail eingeben.' },
    pt: { hA: 'Não perca suas ideias de viagem à Coreia', hB: 'Resumo semanal grátis de Coreia e K-beauty', sub: 'Tendências, ofertas e dicas — uma vez por semana, sem spam.', ph: 'seu@email.com', btn: 'Quero o resumo', no: 'Agora não', ok: 'Pronto! Confira seu e-mail em breve ✓', err: 'Insira um e-mail válido.' },
    id: { hA: 'Jangan lewatkan ide perjalanan Korea', hB: 'Ringkasan mingguan Korea & K-beauty gratis', sub: 'Tren, promo, dan tips — sekali seminggu, tanpa spam.', ph: 'kamu@email.com', btn: 'Dapatkan ringkasan', no: 'Lain kali', ok: 'Berhasil! Cek email kamu segera ✓', err: 'Masukkan email yang valid.' },
  };
  // Context-aware copy: K-beauty pages get beauty offers, travel pages get travel offers.
  var isBeauty = /kbeauty|k-beauty/i.test(location.pathname) || !!D.getElementById('kb-radar') || !!D.getElementById('kb-quiz-box');
  var B = {
    en: { hA: "Don't miss the next K-beauty trend", hB: 'Free weekly K-beauty trends & deals', sub: 'Trends, honest verdicts and deals — once a week, no spam.' },
    ko: { hA: '다음 K-뷰티 트렌드, 놓치지 마세요', hB: '주간 K-뷰티 트렌드·딜 무료 받기', sub: '트렌드·정직한 평가·특가 — 주 1회, 스팸 없음.' },
    ja: { hA: '次のK-beautyトレンドをお見逃しなく', hB: '毎週のK-beautyトレンド・お得が無料', sub: 'トレンド・正直な評価・お得を週1回、スパムなし。' },
    zh: { hA: '别错过下一个K-beauty趋势', hB: '每周K-beauty趋势与优惠，免费', sub: '趋势、诚实评测与优惠，每周一封，无垃圾邮件。' },
    es: { hA: 'No te pierdas la próxima tendencia K-beauty', hB: 'Tendencias y ofertas K-beauty gratis cada semana', sub: 'Tendencias, veredictos honestos y ofertas — una vez por semana, sin spam.' },
    fr: { hA: 'Ne ratez pas la prochaine tendance K-beauty', hB: 'Tendances & bons plans K-beauty, gratuits chaque semaine', sub: 'Tendances, verdicts honnêtes et bons plans — une fois par semaine, sans spam.' },
    de: { hA: 'Verpasse den nächsten K-Beauty-Trend nicht', hB: 'Wöchentliche K-Beauty-Trends & Deals, gratis', sub: 'Trends, ehrliche Urteile und Deals — einmal pro Woche, kein Spam.' },
    pt: { hA: 'Não perca a próxima tendência de K-beauty', hB: 'Tendências e ofertas de K-beauty grátis toda semana', sub: 'Tendências, vereditos honestos e ofertas — uma vez por semana, sem spam.' },
    id: { hA: 'Jangan lewatkan tren K-beauty berikutnya', hB: 'Tren & promo K-beauty mingguan, gratis', sub: 'Tren, penilaian jujur, dan promo — sekali seminggu, tanpa spam.' },
  };
  var base = T[lang] || T.en;
  var t = isBeauty ? Object.assign({}, base, B[lang] || B.en) : base;
  var heroEmoji = isBeauty ? '💄✨' : '✈️🗺️';
  var ctx = isBeauty ? 'beauty' : 'travel';

  // ── Frequency cap ─────────────────────────────────────────────────────────
  if (g('kp_subscribed') === '1') return;
  var last = parseInt(g('kp_cro_seen') || '0', 10);
  if (Date.now() - last < 7 * 864e5) return;  // once per 7 days

  var shown = false;
  function showModal() {
    if (shown) return; shown = true;
    s('kp_cro_seen', String(Date.now()));
    var head = (ab === 'A') ? t.hA : t.hB;
    var bg = D.createElement('div');
    bg.id = 'kp-cro';
    bg.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(20,12,24,.55);display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;transition:opacity .2s';
    bg.innerHTML = '<div role="dialog" aria-modal="true" aria-label="' + head + '" style="background:#fff;color:#1a1320;max-width:380px;width:100%;border-radius:18px;padding:24px 22px;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">'
      + '<div style="font-size:30px">' + heroEmoji + '</div>'
      + '<h2 style="font-size:20px;line-height:1.3;margin:8px 0 6px">' + head + '</h2>'
      + '<p style="font-size:13.5px;color:#555;margin:0 0 14px">' + t.sub + '</p>'
      + '<form id="kp-cro-form"><input id="kp-cro-email" type="email" required placeholder="' + t.ph + '" autocomplete="email" style="width:100%;box-sizing:border-box;font-size:15px;padding:12px 14px;border:1px solid #ddd;border-radius:12px;margin-bottom:10px">'
      + '<div id="kp-cro-err" style="display:none;color:#d62246;font-size:12px;margin:-4px 0 8px"></div>'
      + '<button type="submit" style="width:100%;background:linear-gradient(135deg,#d61f6e,#8b46d6);color:#fff;border:0;border-radius:24px;padding:13px;font-size:15px;font-weight:800;cursor:pointer">' + t.btn + '</button></form>'
      + '<button id="kp-cro-no" style="display:block;margin:12px auto 0;background:none;border:0;color:#999;font-size:12.5px;cursor:pointer">' + t.no + '</button>'
      + '</div>';
    D.body.appendChild(bg);
    requestAnimationFrame(function () { bg.style.opacity = '1'; });
    track('exit_modal_shown', { variant: ab });
    function close(reason) { bg.style.opacity = '0'; setTimeout(function () { bg.remove(); }, 200); track('exit_modal_dismiss', { variant: ab, reason: reason }); }
    bg.addEventListener('click', function (e) { if (e.target === bg) close('backdrop'); });
    D.getElementById('kp-cro-no').addEventListener('click', function () { close('no'); });
    D.addEventListener('keydown', function esc(e) { if (e.key === 'Escape' && D.getElementById('kp-cro')) { close('esc'); D.removeEventListener('keydown', esc); } });
    D.getElementById('kp-cro-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (D.getElementById('kp-cro-email').value || '').trim();
      var errEl = D.getElementById('kp-cro-err');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { errEl.textContent = t.err; errEl.style.display = 'block'; return; }
      var url = (W.WORKER_URL || '') + '/api/subscribe';
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, lang: lang, source: 'exit-' + ctx + '-' + ab }) }).catch(function () {});
      s('kp_subscribed', '1');
      track('subscribe', { source: 'exit', context: ctx, variant: ab });
      var card = bg.firstChild;
      card.innerHTML = '<div style="font-size:34px">🎉</div><h2 style="font-size:19px;margin:10px 0">' + t.ok + '</h2>';
      setTimeout(function () { bg.style.opacity = '0'; setTimeout(function () { bg.remove(); }, 200); }, 1900);
    });
  }

  // ── Triggers ──────────────────────────────────────────────────────────────
  // Desktop: mouse leaves toward the top (intent to close/switch tab).
  D.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 0) showModal(); });
  // Mobile / fallback: engaged dwell + scrolled past 45%.
  var engaged = false;
  setTimeout(function () { engaged = true; }, 35000);
  W.addEventListener('scroll', function () {
    if (!engaged || shown) return;
    var sc = (W.scrollY || D.documentElement.scrollTop), h = D.documentElement.scrollHeight - W.innerHeight;
    if (h > 0 && sc / h > 0.45) showModal();
  }, { passive: true });
})();
