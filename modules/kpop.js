/* modules/kpop.js — K-Pop hub renderer.
   Renders fully from the manual tier (window.KPOP_ROSTER / KPOP_UPCOMING) with
   ZERO API keys, then progressively enriches via the Worker (/api/kpop/*) when
   reachable. Bias-follow persists in localStorage. Loaded last by kpop.html. */
(function () {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const ROSTER   = window.KPOP_ROSTER   || [];
  const UPCOMING = window.KPOP_UPCOMING || [];
  const API = window.KPApi || null;
  const ENRICH = window.KPOP_ENRICH || {};
  const FOLLOW_KEY = 'kp_kpop_follow';
  const ONBOARD_KEY = 'kp_kpop_onboard_done';

  const lang = (localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2) || 'en').toLowerCase();

  // ── Mini i18n for JS-generated labels (chrome uses data-i18n via i18n.js) ──
  const STR = {
    en: { anniv:'Year Anniversary', debut:'Debut', comeback:'Comeback', today:'Out today!', dleft:'days', d:'D', h:'H', m:'M', s:'S', follow:'Follow', following:'Following', yours:'★ Your artists', all:'All artists', members:'Members', debuted:'Debuted', share:'Share', spotify:'Spotify', youtube:'YouTube', tickets:'Find concerts', bioSoon:'Bio loads when connected.', newsEmpty:'Live news lights up here once connected — follow your bias to personalize this feed.', chartFail:'Charts are catching their breath — check back shortly.', followToast:'Added to your artists ★', unfollowToast:'Removed', undo:'Undo', onboardTitle:'Pick your bias 💜', onboardSub:'Follow your favorites to personalize comebacks & news.', onboardSkip:'Maybe later', spot:"Today's spotlight" },
    ko: { anniv:'주년', debut:'데뷔', comeback:'컴백', today:'오늘 발매!', dleft:'일', d:'일', h:'시', m:'분', s:'초', follow:'팔로우', following:'팔로잉', yours:'★ 내 아티스트', all:'전체 아티스트', members:'멤버', debuted:'데뷔일', share:'공유', spotify:'스포티파이', youtube:'유튜브', tickets:'공연 찾기', bioSoon:'연결되면 소개가 표시됩니다.', newsEmpty:'연결되면 실시간 뉴스가 표시됩니다 — 최애를 팔로우해 피드를 맞춤화하세요.', chartFail:'차트를 불러오지 못했어요 — 잠시 후 다시 시도해요.', followToast:'내 아티스트에 추가됨 ★', unfollowToast:'삭제됨', undo:'되돌리기', onboardTitle:'최애를 골라보세요 💜', onboardSub:'좋아하는 아티스트를 팔로우하면 컴백·뉴스가 맞춤화됩니다.', onboardSkip:'나중에', spot:'오늘의 스포트라이트' },
    ja: { anniv:'周年', debut:'デビュー', comeback:'カムバック', today:'本日リリース!', dleft:'日', d:'日', h:'時', m:'分', s:'秒', follow:'フォロー', following:'フォロー中', yours:'★ お気に入り', all:'すべて', members:'メンバー', debuted:'デビュー日', share:'シェア', spotify:'Spotify', youtube:'YouTube', tickets:'公演を探す', bioSoon:'接続するとプロフィールが表示されます。', newsEmpty:'接続すると最新ニュースが表示されます — 推しをフォローしてフィードをカスタマイズ。', chartFail:'チャートを取得できませんでした — 後ほどお試しください。', followToast:'お気に入りに追加 ★', unfollowToast:'削除しました', undo:'元に戻す', onboardTitle:'推しを選ぼう 💜', onboardSub:'好きなアーティストをフォローして、カムバックやニュースをカスタマイズ。', onboardSkip:'あとで', spot:'今日のスポットライト' },
    zh: { anniv:'周年', debut:'出道', comeback:'回归', today:'今日发行!', dleft:'天', d:'天', h:'时', m:'分', s:'秒', follow:'关注', following:'已关注', yours:'★ 我的爱豆', all:'全部', members:'成员', debuted:'出道日', share:'分享', spotify:'Spotify', youtube:'YouTube', tickets:'查找演唱会', bioSoon:'连接后显示简介。', newsEmpty:'连接后这里会显示实时新闻 — 关注你的爱豆来定制此动态。', chartFail:'榜单暂时无法加载 — 请稍后再试。', followToast:'已加入我的爱豆 ★', unfollowToast:'已移除', undo:'撤销', onboardTitle:'选择你的爱豆 💜', onboardSub:'关注喜欢的艺人，定制回归与新闻。', onboardSkip:'稍后再说', spot:'今日焦点' },
    es: { anniv:'Aniversario', debut:'Debut', comeback:'Comeback', today:'¡Ya disponible!', dleft:'d', d:'D', h:'H', m:'M', s:'S', follow:'Seguir', following:'Siguiendo', yours:'★ Mis artistas', all:'Todos', members:'Integrantes', debuted:'Debutó', share:'Compartir', spotify:'Spotify', youtube:'YouTube', tickets:'Buscar conciertos', bioSoon:'La biografía se carga al conectar.', newsEmpty:'Las noticias en vivo aparecerán aquí al conectar — sigue a tu bias para personalizar este feed.', chartFail:'Las listas están recuperándose — vuelve en un momento.', followToast:'Añadido a tus artistas ★', unfollowToast:'Eliminado', undo:'Deshacer', onboardTitle:'Elige tu bias 💜', onboardSub:'Sigue a tus favoritos para personalizar comebacks y noticias.', onboardSkip:'Quizás luego', spot:'Destacado de hoy' },
    fr: { anniv:'Anniversaire', debut:'Débuts', comeback:'Comeback', today:'Disponible !', dleft:'j', d:'J', h:'H', m:'M', s:'S', follow:'Suivre', following:'Suivi', yours:'★ Mes artistes', all:'Tous', members:'Membres', debuted:'Débuts le', share:'Partager', spotify:'Spotify', youtube:'YouTube', tickets:'Trouver des concerts', bioSoon:'La bio se charge une fois connecté.', newsEmpty:'Les actus en direct apparaîtront ici une fois connecté — suivez votre bias pour personnaliser ce fil.', chartFail:'Les classements reviennent — réessayez bientôt.', followToast:'Ajouté à vos artistes ★', unfollowToast:'Retiré', undo:'Annuler', onboardTitle:'Choisissez votre bias 💜', onboardSub:'Suivez vos favoris pour personnaliser comebacks et actus.', onboardSkip:'Plus tard', spot:'À la une aujourd\'hui' },
    de: { anniv:'Jahrestag', debut:'Debüt', comeback:'Comeback', today:'Jetzt erschienen!', dleft:'T', d:'T', h:'Std', m:'Min', s:'Sek', follow:'Folgen', following:'Folge ich', yours:'★ Meine Artists', all:'Alle', members:'Mitglieder', debuted:'Debüt am', share:'Teilen', spotify:'Spotify', youtube:'YouTube', tickets:'Konzerte finden', bioSoon:'Bio wird geladen, sobald verbunden.', newsEmpty:'Live-News erscheinen hier, sobald verbunden — folge deinem Bias, um diesen Feed zu personalisieren.', chartFail:'Die Charts machen kurz Pause — schau gleich wieder vorbei.', followToast:'Zu deinen Artists hinzugefügt ★', unfollowToast:'Entfernt', undo:'Rückgängig', onboardTitle:'Wähle deinen Bias 💜', onboardSub:'Folge deinen Favoriten, um Comebacks & News zu personalisieren.', onboardSkip:'Vielleicht später', spot:'Heute im Fokus' },
    pt: { anniv:'Aniversário', debut:'Estreia', comeback:'Comeback', today:'Já disponível!', dleft:'d', d:'D', h:'H', m:'M', s:'S', follow:'Seguir', following:'Seguindo', yours:'★ Meus artistas', all:'Todos', members:'Integrantes', debuted:'Estreou', share:'Compartilhar', spotify:'Spotify', youtube:'YouTube', tickets:'Buscar shows', bioSoon:'A bio carrega ao conectar.', newsEmpty:'As notícias ao vivo aparecem aqui ao conectar — siga seu bias para personalizar este feed.', chartFail:'As paradas estão voltando — tente novamente em breve.', followToast:'Adicionado aos seus artistas ★', unfollowToast:'Removido', undo:'Desfazer', onboardTitle:'Escolha seu bias 💜', onboardSub:'Siga seus favoritos para personalizar comebacks e notícias.', onboardSkip:'Talvez depois', spot:'Destaque de hoje' },
    id: { anniv:'Anniversary', debut:'Debut', comeback:'Comeback', today:'Rilis hari ini!', dleft:'h', d:'H', h:'J', m:'M', s:'D', follow:'Ikuti', following:'Mengikuti', yours:'★ Artis saya', all:'Semua', members:'Member', debuted:'Debut', share:'Bagikan', spotify:'Spotify', youtube:'YouTube', tickets:'Cari konser', bioSoon:'Bio dimuat saat terhubung.', newsEmpty:'Berita langsung akan muncul di sini saat terhubung — ikuti bias-mu untuk menyesuaikan feed ini.', chartFail:'Tangga lagu sedang dimuat ulang — coba lagi sebentar.', followToast:'Ditambahkan ke artis saya ★', unfollowToast:'Dihapus', undo:'Urungkan', onboardTitle:'Pilih bias-mu 💜', onboardSub:'Ikuti favoritmu untuk menyesuaikan comeback & berita.', onboardSkip:'Nanti saja', spot:'Sorotan hari ini' },
  };
  const t = (k) => (STR[lang] && STR[lang][k]) || STR.en[k] || k;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toast = (msg, action) => {
    let el = $('#kpop-toast');
    if (!el) { el = document.createElement('div'); el.id = 'kpop-toast'; el.style.cssText = 'position:fixed;left:50%;bottom:calc(20px + var(--mnav-h,0px) + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100vw - 32px);background:var(--text);color:var(--bg);padding:10px 18px;border-radius:22px;font-size:13px;font-weight:700;z-index:300;opacity:0;transition:opacity .2s;pointer-events:none'; document.body.appendChild(el); }
    clearTimeout(el._tm);
    const hide = () => { el.style.opacity = '0'; el.style.pointerEvents = 'none'; };
    el.textContent = msg;
    if (action) {
      // Actionable toast (e.g. unfollow Undo) — must accept taps while visible.
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = action.label;
      b.style.cssText = 'min-width:44px;min-height:44px;margin-left:8px;padding:0 10px;background:transparent;border:0;color:inherit;font:inherit;font-weight:800;text-decoration:underline;cursor:pointer;vertical-align:middle';
      b.addEventListener('click', () => { clearTimeout(el._tm); hide(); try { action.cb(); } catch {} });
      el.appendChild(b);
      el.style.display = 'inline-flex'; el.style.alignItems = 'center';
      el.style.pointerEvents = 'auto';
    } else {
      el.style.display = ''; el.style.alignItems = '';
      el.style.pointerEvents = 'none';
    }
    el.style.opacity = '1';
    el._tm = setTimeout(hide, action ? 5000 : 1800);
  };

  // ── Follow state ───────────────────────────────────────────────────────────
  const getFollows = () => { try { return new Set(JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]')); } catch { return new Set(); } };
  const setFollows = (set) => { try { localStorage.setItem(FOLLOW_KEY, JSON.stringify([...set])); } catch {} };

  // ── Dates (KST) ──────────────────────────────────────────────────────────
  const KST_MS = 9 * 3600_000;
  const nowKST = () => new Date(Date.now() + KST_MS);
  function nextAnniversary(debutISO) {
    if (!debutISO || debutISO.length < 10) return null;
    const [y, mo, d] = debutISO.split('-').map(Number);
    const now = nowKST();
    let year = now.getUTCFullYear();
    let cand = new Date(Date.UTC(year, mo - 1, d) - KST_MS);
    const todayMid = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - KST_MS);
    if (cand < todayMid) { year += 1; cand = new Date(Date.UTC(year, mo - 1, d) - KST_MS); }
    return { date: cand, years: year - y };
  }
  function daysBetween(future) {
    const now = nowKST();
    const a = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const b = Date.UTC(future.getUTCFullYear(), future.getUTCMonth(), future.getUTCDate());
    return Math.round((b - a) / 86400_000);
  }
  const fmtDate = (d) => d.toLocaleDateString(lang === 'en' ? undefined : lang, { year: 'numeric', month: 'short', day: 'numeric' });

  // ── Build the events list (zero-key) ───────────────────────────────────────
  function buildEvents() {
    const byId = Object.fromEntries(ROSTER.map(a => [a.id, a]));
    const events = [];
    for (const u of UPCOMING) {
      const a = byId[u.artistId]; if (!a || !u.date) continue;
      const dt = new Date(u.date + 'T00:00:00+09:00');
      const dl = daysBetween(dt); if (dl < 0) continue;
      events.push({ artist: a, type: (u.type || t('comeback')), typeKey: u.type || 'comeback', title: u.title || '', date: dt, daysLeft: dl, confirmed: u.confirmed !== false });
    }
    for (const a of ROSTER) {
      const an = nextAnniversary(a.debut); if (!an) continue;
      const dl = daysBetween(an.date);
      events.push({ artist: a, type: t('debut'), typeKey: 'anniversary', title: `${an.years}${lang === 'en' ? 'th ' : ''}${t('anniv')}`, date: an.date, daysLeft: dl, confirmed: true });
    }
    const follows = getFollows();
    events.sort((p, q) => (p.daysLeft - q.daysLeft) || (follows.has(q.artist.id) - follows.has(p.artist.id)));
    return events;
  }

  let EVENTS = [];

  // ── Hero stats + spotlight + onboarding ────────────────────────────────────
  function renderHeroStats() {
    const na = $('#kp-stat-artists'); if (na) na.textContent = ROSTER.length;
    const soon = EVENTS.find(e => e.daysLeft >= 0);
    const ns = $('#kp-stat-next'); if (ns && soon) ns.textContent = soon.daysLeft === 0 ? t('today') : `D-${soon.daysLeft}`;
  }

  function renderSpotlight() {
    const box = $('#kp-spotlight'); if (!box) return;
    const e = EVENTS.find(x => x.daysLeft >= 0); if (!e) { box.hidden = true; return; }
    box.innerHTML = `
      <div class="kp-spot-emoji" aria-hidden="true">${e.artist.emoji || '🎤'}</div>
      <div class="kp-spot-body">
        <div class="kp-spot-eyebrow">${esc(t('spot'))}</div>
        <div class="kp-spot-artist">${esc(e.artist.nameEn)}</div>
        <div class="kp-spot-meta">${esc(e.type)} · ${esc(e.title)} · <span class="kp-spot-d">${e.daysLeft === 0 ? esc(t('today')) : 'D-' + e.daysLeft}</span></div>
      </div>
      <button class="kp-spot-share" type="button">📤 ${esc(t('share'))}</button>`;
    box.hidden = false;
    const sb = box.querySelector('.kp-spot-share');
    sb.addEventListener('click', () => {
      if (!window.KpopShareCard) return;
      sb.disabled = true;
      Promise.resolve(window.KpopShareCard.generate({ artist: e.artist.nameEn, emoji: e.artist.emoji, type: e.type, title: e.title, daysLeft: e.daysLeft, dateLabel: fmtDate(e.date) }))
        .catch(() => {}).then(() => { sb.disabled = false; });
    });
  }

  function renderOnboard() {
    const box = $('#kp-onboard'); if (!box) return;
    if (localStorage.getItem(ONBOARD_KEY) || getFollows().size > 0) { box.hidden = true; return; }
    const top = ROSTER.slice(0, 10);
    box.innerHTML = `
      <button class="kp-onboard-x" type="button" aria-label="${esc(t('onboardSkip'))}">✕</button>
      <h2>${esc(t('onboardTitle'))}</h2>
      <p>${esc(t('onboardSub'))}</p>
      <div class="kp-onboard-chips">${top.map(a => `<button class="kp-bias-chip" type="button" data-bias="${esc(a.id)}" aria-pressed="false"><span class="e" aria-hidden="true">${a.emoji || '🎤'}</span>${esc(a.nameEn)}</button>`).join('')}</div>`;
    box.hidden = false;
    box.querySelector('.kp-onboard-x').addEventListener('click', () => { try { localStorage.setItem(ONBOARD_KEY, '1'); } catch {} box.hidden = true; });
    $$('.kp-bias-chip', box).forEach(c => c.addEventListener('click', () => {
      const id = c.dataset.bias; toggleFollow(id);
      const on = getFollows().has(id); c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false');
    }));
  }

  // ── Render: countdowns ─────────────────────────────────────────────────────
  // ── Add-to-calendar (.ics) — Calendar (#1) signature; works on any event ──
  const ADDCAL = { en:'Add to calendar', ko:'캘린더에 추가', ja:'カレンダーに追加', zh:'加入日历', es:'Añadir al calendario', fr:'Ajouter au calendrier', de:'Zum Kalender', pt:'Adicionar à agenda', id:'Tambah ke kalender' };
  const addCalLabel = ADDCAL[lang] || ADDCAL.en;
  const FAN_STR = {
    en:{btn:'Fan Card', since:'Fan since'}, ko:{btn:'팬카드', since:'팬 시작'}, ja:{btn:'ファンカード', since:'ファン歴'},
    zh:{btn:'粉丝卡', since:'入坑'}, es:{btn:'Tarjeta de fan', since:'Fan desde'}, fr:{btn:'Carte de fan', since:'Fan depuis'},
    de:{btn:'Fan-Karte', since:'Fan seit'}, pt:{btn:'Cartão de fã', since:'Fã desde'}, id:{btn:'Kartu Fan', since:'Fan sejak'},
  };
  const fanStr = FAN_STR[lang] || FAN_STR.en;
  const pad2 = (n) => String(n).padStart(2, '0');
  function icsDate(date, addDays) {
    const k = new Date(date.getTime() + KST_MS + (addDays || 0) * 86400_000);
    return `${k.getUTCFullYear()}${pad2(k.getUTCMonth() + 1)}${pad2(k.getUTCDate())}`;
  }
  function buildICS(e) {
    const esc2 = s => String(s).replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    const title = `${e.artist.nameEn} — ${e.type}${e.title ? ' ' + e.title : ''}`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KoreaPlus//K-Pop//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + e.artist.id + '-' + (e.typeKey || 'event') + '-' + icsDate(e.date) + '@koreaplus-lifes.com',
      'DTSTART;VALUE=DATE:' + icsDate(e.date), 'DTEND;VALUE=DATE:' + icsDate(e.date, 1),
      'SUMMARY:' + esc2(title), 'DESCRIPTION:' + esc2('via KoreaPlus · koreaplus-lifes.com/kpop'),
      'URL:https://koreaplus-lifes.com/kpop',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc2(title), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (e.artist.nameEn + '-' + (e.typeKey || 'event') + '.ics').replace(/\s+/g, '-');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // ── Upcoming member birthdays (Calendar #1; data from kpop-enrich.js) ─────
  const BDAY_WORD = { en:'Birthday', ko:'생일', ja:'誕生日', zh:'生日', es:'Cumpleaños', fr:'Anniversaire', de:'Geburtstag', pt:'Aniversário', id:'Ulang Tahun' };
  const bdayWord = BDAY_WORD[lang] || BDAY_WORD.en;
  function nextBirthday(iso) {
    if (!iso || iso.length < 10) return null;
    const [by, bm, bd] = iso.split('-').map(Number);
    const now = nowKST();
    let year = now.getUTCFullYear();
    let cand = new Date(Date.UTC(year, bm - 1, bd) - KST_MS);
    const todayMid = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - KST_MS);
    if (cand < todayMid) { year += 1; cand = new Date(Date.UTC(year, bm - 1, bd) - KST_MS); }
    return { date: cand, age: year - by };
  }
  function buildBirthdays() {
    const byId = Object.fromEntries(ROSTER.map(a => [a.id, a]));
    const out = [];
    for (const [id, e] of Object.entries(ENRICH)) {
      const a = byId[id]; if (!a || !e.bdays) continue;
      for (const [name, iso] of e.bdays) {
        const nb = nextBirthday(iso); if (!nb) continue;
        out.push({ artist: a, name, date: nb.date, age: nb.age, daysLeft: daysBetween(nb.date) });
      }
    }
    const follows = getFollows();
    out.sort((p, q) => (follows.has(q.artist.id) - follows.has(p.artist.id)) || (p.daysLeft - q.daysLeft));
    return out;
  }
  function renderBirthdays() {
    const grid = $('#kpop-bday-grid'); if (!grid) return;
    const sec = $('#kpop-birthdays');
    const list = buildBirthdays().slice(0, 14);
    if (!list.length) { if (sec) { sec.dataset.locked = '1'; sec.hidden = true; } return; }
    if (sec) delete sec.dataset.locked;
    grid.innerHTML = list.map((b, i) => `<div class="bday-card${b.daysLeft === 0 ? ' is-today' : ''}">
        <div class="bday-emoji" aria-hidden="true">${b.artist.emoji || '🎤'}</div>
        <div class="bday-body">
          <div class="bday-name">${esc(b.name)}</div>
          <div class="bday-artist">${esc(b.artist.nameEn)}</div>
          <div class="bday-meta">${b.daysLeft === 0 ? '🎉 ' + esc(t('today')) : 'D-' + b.daysLeft} · ${esc(fmtDate(b.date))} · 🎂${b.age}</div>
        </div>
        <button class="bday-ics" type="button" data-bi="${i}" aria-label="${esc(addCalLabel)}" title="${esc(addCalLabel)}">📅</button>
      </div>`).join('');
    $$('.bday-ics', grid).forEach(btn => btn.addEventListener('click', () => {
      const b = list[+btn.dataset.bi]; if (!b) return;
      buildICS({ artist: { id: b.artist.id, nameEn: b.name + ' (' + b.artist.nameEn + ')' }, type: bdayWord, title: '', typeKey: 'bday', date: b.date });
    }));
  }

  function renderCountdowns() {
    const grid = $('#kpop-cd-grid'); if (!grid) return;
    const follows = getFollows();
    const list = EVENTS.slice().sort((p, q) => (follows.has(q.artist.id) - follows.has(p.artist.id)) || (p.daysLeft - q.daysLeft)).slice(0, 12);
    grid.innerHTML = list.map((e, i) => {
      const soon = e.daysLeft > 0 && e.daysLeft <= 7, today = e.daysLeft === 0;
      return `<div class="cd-card${today ? ' is-today' : ''}${soon ? ' is-soon' : ''}" data-cd="${i}">
        <div class="cd-type">${esc(e.type)}${e.confirmed ? '' : ' ·?'}</div>
        <div class="cd-artist">${e.artist.emoji || ''} ${esc(e.artist.nameEn)}</div>
        <div class="cd-title">${esc(e.title)} · ${esc(fmtDate(e.date))}</div>
        <div class="cd-timer" data-target="${e.date.getTime()}" role="timer">
          <div class="cd-unit"><div class="cd-num" data-u="d">–</div><div class="cd-lab">${esc(t('d'))}</div></div>
          <div class="cd-unit"><div class="cd-num" data-u="h">–</div><div class="cd-lab">${esc(t('h'))}</div></div>
          <div class="cd-unit"><div class="cd-num" data-u="m">–</div><div class="cd-lab">${esc(t('m'))}</div></div>
          <div class="cd-unit"><div class="cd-num" data-u="s">–</div><div class="cd-lab">${esc(t('s'))}</div></div>
        </div>
        <div class="cd-actions"><button class="cd-share" type="button" data-share="${i}">📤 ${esc(t('share'))}</button><button class="cd-ics" type="button" data-ics="${i}" aria-label="${esc(addCalLabel)}" title="${esc(addCalLabel)}">📅</button></div>
      </div>`;
    }).join('');
    $$('.cd-share', grid).forEach(btn => btn.addEventListener('click', () => {
      const e = list[+btn.dataset.share]; if (!e || !window.KpopShareCard) return;
      btn.disabled = true;
      Promise.resolve(window.KpopShareCard.generate({ artist: e.artist.nameEn, emoji: e.artist.emoji, type: e.type, title: e.title, daysLeft: e.daysLeft, dateLabel: fmtDate(e.date) }))
        .catch(() => {}).then(() => { btn.disabled = false; });
    }));
    $$('.cd-ics', grid).forEach(btn => btn.addEventListener('click', () => { const e = list[+btn.dataset.ics]; if (e) buildICS(e); }));
    tickTimers();
  }

  function tickTimers() {
    const now = Date.now();
    $$('.cd-timer').forEach(tm => {
      let diff = Math.max(0, (+tm.dataset.target) - now);
      const d = Math.floor(diff / 86400_000); diff -= d * 86400_000;
      const h = Math.floor(diff / 3600_000); diff -= h * 3600_000;
      const m = Math.floor(diff / 60_000); diff -= m * 60_000;
      const s = Math.floor(diff / 1000);
      const set = (u, v) => { const el = tm.querySelector(`[data-u="${u}"]`); if (el) el.textContent = String(v).padStart(2, '0'); };
      set('d', d); set('h', h); set('m', m); set('s', s);
    });
  }

  // ── Render: artists (bias-follow) ──────────────────────────────────────────
  let showFollowedOnly = false;
  function renderArtists() {
    const grid = $('#kpop-art-grid'); if (!grid) return;
    const follows = getFollows();
    const tg = $('#art-toggle');
    if (tg) { tg.hidden = follows.size === 0; tg.textContent = showFollowedOnly ? t('all') : t('yours'); tg.setAttribute('aria-pressed', showFollowedOnly ? 'true' : 'false'); }
    let list = ROSTER.slice();
    if (showFollowedOnly) list = list.filter(a => follows.has(a.id));
    list.sort((a, b) => (follows.has(b.id) - follows.has(a.id)));
    grid.innerHTML = list.map(a => {
      const on = follows.has(a.id);
      const disc = a.image ? `<img src="${esc(a.image)}" alt="">` : (a.emoji || '🎤');
      return `<div class="art-card${on ? ' followed' : ''}" data-id="${esc(a.id)}">
        <button class="art-follow" type="button" data-follow="${esc(a.id)}" aria-pressed="${on ? 'true' : 'false'}" aria-label="${esc((on ? t('following') : t('follow')) + ' ' + a.nameEn)}">${on ? '★' : '☆'}</button>
        <button class="art-open" type="button" aria-haspopup="dialog" aria-label="${esc(a.nameEn)}">
          <span class="art-emoji" aria-hidden="true">${disc}</span>
          <span class="art-name">${esc(a.nameEn)}</span>
          <span class="art-ko" lang="ko">${esc(a.nameKo || '')}</span>
          <span class="art-agency">${esc((a.agency || '').split(' (')[0])}</span>
          ${a.fandom ? `<span class="art-fan">${esc(a.fandom)}</span>` : ''}
        </button>
      </div>`;
    }).join('');
  }

  function toggleFollow(id) {
    const f = getFollows();
    const adding = !f.has(id);
    if (adding) f.add(id); else f.delete(id);
    setFollows(f);
    try { window.dispatchEvent(new Event('kp:follows')); } catch {}
    if (adding) { try { const s = JSON.parse(localStorage.getItem('kp_kpop_since') || '{}'); if (!s[id]) { s[id] = new Date().getFullYear(); localStorage.setItem('kp_kpop_since', JSON.stringify(s)); } } catch {} }
    if (adding) toast(t('followToast'));
    else toast(t('unfollowToast'), { label: t('undo'), cb: () => toggleFollow(id) }); // 5s Undo — re-toggles follow back on

    // Light, targeted DOM update — no full re-render, no async ticker refetch.
    const card = $(`.art-card[data-id="${CSS.escape ? CSS.escape(id) : id}"]`);
    if (card) {
      card.classList.toggle('followed', adding);
      const fb = card.querySelector('.art-follow');
      if (fb) { fb.textContent = adding ? '★' : '☆'; fb.setAttribute('aria-pressed', adding ? 'true' : 'false'); }
    }
    const tg = $('#art-toggle'); if (tg) tg.hidden = getFollows().size === 0;
    renderHeroStats();
    clearTimeout(toggleFollow._tm);
    toggleFollow._tm = setTimeout(() => { EVENTS = buildEvents(); renderCountdowns(); renderBirthdays(); }, 400);
  }

  // ── Artist modal (focus-trapped; bottom-sheet on mobile via CSS) ───────────
  let lastFocused = null;
  function trapTab(e) {
    if (e.key !== 'Tab') return;
    const f = $$('.kpop-modal button, .kpop-modal a[href], .kpop-modal [tabindex]:not([tabindex="-1"])').filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openArtist(id) {
    const a = ROSTER.find(x => x.id === id); if (!a) return;
    const bg = $('#kpop-modal-bg'), box = $('#kpop-modal'); if (!bg || !box) return;
    lastFocused = document.activeElement;
    try { window.dispatchEvent(new CustomEvent('kp:view', { detail: id })); } catch {}
    const follows = getFollows();
    const ytQ = encodeURIComponent(a.nameEn + ' official');
    const spLink = a.spotifyId ? `https://open.spotify.com/artist/${a.spotifyId}` : `https://open.spotify.com/search/${encodeURIComponent(a.nameEn)}`;
    const ytLink = a.youtubeChannelId ? `https://www.youtube.com/channel/${a.youtubeChannelId}` : `https://www.youtube.com/results?search_query=${ytQ}`;
    const disc = a.image ? `<img src="${esc(a.image)}" alt="">` : (a.emoji || '🎤');
    box.innerHTML = `
      <button class="kpop-modal-x" type="button" data-close aria-label="Close">✕</button>
      <div class="km-emoji" aria-hidden="true">${disc}</div>
      <div class="km-name" id="km-name-live">${esc(a.nameEn)}</div>
      <div class="km-ko" lang="ko">${esc(a.nameKo || '')}</div>
      <div class="km-facts">
        ${a.agency ? `<span class="km-fact">🏢 ${esc(a.agency)}</span>` : ''}
        ${a.debut ? `<span class="km-fact">📅 ${esc(t('debuted'))} ${esc(a.debut)}</span>` : ''}
        ${a.fandom ? `<span class="km-fact">💗 ${esc(a.fandom)}</span>` : ''}
        ${(ENRICH[a.id] && ENRICH[a.id].lightstick) ? `<span class="km-fact">🔦 ${esc(ENRICH[a.id].lightstick)}</span>` : ''}
        ${(ENRICH[a.id] && ENRICH[a.id].color) ? `<span class="km-fact"><span class="km-swatch" style="background:${esc(ENRICH[a.id].color)}"></span>${esc(ENRICH[a.id].color)}</span>` : ''}
      </div>
      <div class="km-bio" id="km-bio">${a.wikidataId ? `<span style="opacity:.6">${esc(t('bioSoon'))}</span>` : ''}</div>
      ${a.members && a.members.length ? `<div class="km-members"><b>${esc(t('members'))}:</b> ${esc(a.members.join(' · '))}</div>` : ''}
      <div class="km-listen">
        <span class="km-listen-label">${esc(pstr().listen)}:</span>
        <a class="km-listen-link km-listen-play" href="${ytLink}" target="_blank" rel="noopener" data-play="${esc(a.nameEn)}" data-ptitle="${esc(a.nameEn)}" data-partist="" data-pchannel="${esc(a.youtubeChannelId || '')}">▶ YouTube</a>
        <a class="km-listen-link" href="${spLink}" target="_blank" rel="noopener">Spotify ↗</a>
      </div>
      <div class="km-links">
        <a class="km-link primary km-profile" href="${profileUrl(a.id)}">${esc(pstr().full)} →</a>
        <button class="km-link" type="button" data-followbtn="${esc(a.id)}" aria-pressed="${follows.has(a.id) ? 'true' : 'false'}">${follows.has(a.id) ? '★ ' + esc(t('following')) : '☆ ' + esc(t('follow'))}</button>
        <button class="km-link" type="button" data-fancard="${esc(a.id)}">🪪 ${esc(fanStr.btn)}</button>
      </div>`;
    bg.classList.add('open'); document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { const x = box.querySelector('.kpop-modal-x'); if (x) x.focus(); });
    const fcb = box.querySelector('[data-fancard]');
    if (fcb) fcb.addEventListener('click', () => {
      if (!window.KpopShareCard || !window.KpopShareCard.fanCard) return;
      const en = ENRICH[a.id] || {};
      let since = new Date().getFullYear();
      try { const s = JSON.parse(localStorage.getItem('kp_kpop_since') || '{}'); if (s[a.id]) since = s[a.id]; } catch {}
      fcb.disabled = true;
      Promise.resolve(window.KpopShareCard.fanCard({ artist: a.nameEn, emoji: a.emoji, fandom: a.fandom, lightstick: en.lightstick, color: en.color, since, sinceLabel: fanStr.since }))
        .catch(() => {}).then(() => { fcb.disabled = false; });
    });
    const fb = box.querySelector('[data-followbtn]');
    if (fb) fb.addEventListener('click', () => {
      toggleFollow(a.id); const on = getFollows().has(a.id);
      fb.textContent = on ? '★ ' + t('following') : '☆ ' + t('follow');
      fb.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (a.wikidataId && API && API.getKpopBio) {
      API.getKpopBio(a.wikidataId, lang).then(d => {
        if (!d || !d.bio) return;
        const bioEl = $('#km-bio'); if (!bioEl) return;
        bioEl.innerHTML = esc(d.bio) + (d.wikipediaUrl ? ` <a href="${esc(d.wikipediaUrl)}" target="_blank" rel="noopener">↗</a>` : '');
      }).catch(() => {});
    }
  }
  function closeModal() {
    const bg = $('#kpop-modal-bg'); if (bg) bg.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch {} }
  }

  // ── Live data (worker; degrades gracefully) ────────────────────────────────
  function rosterMatch(artistName) {
    const n = (artistName || '').toLowerCase();
    return ROSTER.some(a => n.includes(a.nameEn.toLowerCase()) || (a.nameKo && artistName && artistName.includes(a.nameKo)));
  }
  const smallArt = (u) => u ? u.replace(/\/\d+x\d+bb\./, '/96x96bb.') : '';

  // ── Internal artist profile pages (B6) — keep clicks inside the K-pop channel
  // instead of bouncing out to Apple Music / Spotify. Localized to current lang.
  const KPOP_PROF_LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];
  const profileUrl = (id) => { const L = KPOP_PROF_LANGS.includes(lang) ? lang : 'en'; return (L === 'en' ? '' : L + '/') + 'kpop/' + id + '-profile.html'; };
  function rosterIdFor(name) {
    if (!name) return null;
    const n = String(name).toLowerCase();
    const m = ROSTER.find(a => n.includes(a.nameEn.toLowerCase()) || (a.nameKo && String(name).includes(a.nameKo)));
    return m ? m.id : null;
  }
  const PROF_STR = {
    en: { full: '📖 Full profile', listen: 'Listen', more: 'See all' }, ko: { full: '📖 전체 프로필', listen: '듣기', more: '전체 보기' },
    ja: { full: '📖 プロフィール', listen: '試聴', more: 'すべて見る' }, zh: { full: '📖 完整资料', listen: '收听', more: '查看全部' },
    es: { full: '📖 Perfil completo', listen: 'Escuchar', more: 'Ver todo' }, fr: { full: '📖 Profil complet', listen: 'Écouter', more: 'Tout voir' },
    de: { full: '📖 Volles Profil', listen: 'Hören', more: 'Alle ansehen' }, pt: { full: '📖 Perfil completo', listen: 'Ouvir', more: 'Ver tudo' },
    id: { full: '📖 Profil lengkap', listen: 'Dengar', more: 'Lihat semua' },
  };
  const pstr = () => PROF_STR[lang] || PROF_STR.en;

  // Per-language default storefront — each audience sees THEIR country's chart.
  const STORE_FOR_LANG = { ko:'kr', en:'kr', ja:'jp', zh:'tw', es:'es', fr:'fr', de:'de', pt:'br', id:'id' };
  const STORE_LABEL = { kr:'🇰🇷 KR', jp:'🇯🇵 JP', tw:'🇹🇼 TW', es:'🇪🇸 ES', fr:'🇫🇷 FR', de:'🇩🇪 DE', br:'🇧🇷 BR', id:'🇮🇩 ID', us:'🌎' };
  const CHART_STR = {
    en:{songs:'Songs',albums:'Albums',mvs:'MVs',neu:'NEW',asOf:'Updated',refresh:'Refresh charts',deltaHint:'Rank changes show from your next visit'},
    ko:{songs:'곡',albums:'앨범',mvs:'MV',neu:'NEW',asOf:'기준',refresh:'차트 새로고침',deltaHint:'순위 변동은 다음 방문부터 표시돼요'},
    ja:{songs:'楽曲',albums:'アルバム',mvs:'MV',neu:'NEW',asOf:'更新',refresh:'チャートを更新',deltaHint:'順位変動は次回の訪問から表示されます'},
    zh:{songs:'歌曲',albums:'专辑',mvs:'MV',neu:'NEW',asOf:'更新于',refresh:'刷新榜单',deltaHint:'排名变化将从下次访问开始显示'},
    es:{songs:'Canciones',albums:'Álbumes',mvs:'MVs',neu:'NUEVO',asOf:'Actualizado',refresh:'Actualizar listas',deltaHint:'Los cambios de puesto se muestran desde tu próxima visita'},
    fr:{songs:'Titres',albums:'Albums',mvs:'Clips',neu:'NOUVEAU',asOf:'Mis à jour',refresh:'Actualiser les classements',deltaHint:'Les variations de classement s\'afficheront à votre prochaine visite'},
    de:{songs:'Songs',albums:'Alben',mvs:'MVs',neu:'NEU',asOf:'Stand',refresh:'Charts aktualisieren',deltaHint:'Rangänderungen erscheinen ab deinem nächsten Besuch'},
    pt:{songs:'Músicas',albums:'Álbuns',mvs:'MVs',neu:'NOVO',asOf:'Atualizado',refresh:'Atualizar paradas',deltaHint:'As mudanças de posição aparecem a partir da sua próxima visita'},
    id:{songs:'Lagu',albums:'Album',mvs:'MV',neu:'BARU',asOf:'Diperbarui',refresh:'Muat ulang chart',deltaHint:'Perubahan peringkat tampil mulai kunjungan berikutnya'},
  };
  const ct = (k) => (CHART_STR[lang] || CHART_STR.en)[k] || CHART_STR.en[k];
  let curStore = STORE_FOR_LANG[lang] || 'kr';
  let curType = 'songs';

  const isFollowedArtist = (name) => {
    const n = (name || '').toLowerCase(); const f = getFollows();
    return ROSTER.some(a => f.has(a.id) && (n.includes(a.nameEn.toLowerCase()) || (a.nameKo && name && name.includes(a.nameKo))));
  };

  // Client-side "since your last visit" rank deltas (keyless, per device).
  let chartHadPrev = false;
  function chartDeltas(store, type, rows) {
    const key = 'kp_chart_' + store + '_' + type;
    let prev = {}; try { prev = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
    chartHadPrev = Object.keys(prev).length > 0;
    const cur = {};
    rows.forEach(r => { const k = (r.artist + '|' + r.title).toLowerCase(); cur[k] = r.rank; r._prev = prev[k]; });
    try { localStorage.setItem(key, JSON.stringify(cur)); } catch {}
  }
  function deltaBadge(r) {
    if (!chartHadPrev) return '';
    if (r._prev == null) return `<span class="kp-delta kp-delta-new">${esc(ct('neu'))}</span>`;
    const d = r._prev - r.rank;
    if (d > 0) return `<span class="kp-delta kp-delta-up">▲${d}</span>`;
    if (d < 0) return `<span class="kp-delta kp-delta-down">▼${-d}</span>`;
    return `<span class="kp-delta kp-delta-eq">=</span>`; // steady — distinguish "no change" from "no data"
  }

  function chartRow(r) {
    const isR = rosterMatch(r.artist), bias = isFollowedArtist(r.artist), eager = r.rank <= 6, art = smallArt(r.artworkUrl);
    const inner = `<span class="chart-rank${r.rank <= 3 ? ' top' : ''}">${r.rank}</span>`
      + (art ? `<img class="chart-art" src="${esc(art)}" alt="" width="46" height="46" loading="${eager ? 'eager' : 'lazy'}" fetchpriority="${eager ? 'high' : 'auto'}" decoding="async">` : '<div class="chart-art"></div>')
      + `<span class="chart-meta"><span class="chart-title">${esc(r.title)}</span><span class="chart-artist">${esc(r.artist)}</span></span>`
      + deltaBadge(r);
    const label = esc(`#${r.rank} ${r.title} — ${r.artist}`);
    const cls = `chart-row kp-playable${isR ? ' is-roster' : ''}${bias ? ' is-bias' : ''}`;
    const q = (r.artist + ' ' + r.title).trim();
    const rid = rosterIdFor(r.artist);
    const ch = rid ? ((ROSTER.find(a => a.id === rid) || {}).youtubeChannelId || '') : '';
    const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' official');
    // Click plays the song IN-PAGE via the YouTube mini-player (window.kpPlay);
    // the href is a graceful fallback (opens a YouTube search) if JS is off.
    return `<a class="${cls}" href="${yt}" target="_blank" rel="noopener" data-play="${esc(q)}" data-ptitle="${esc(r.title)}" data-partist="${esc(r.artist)}" data-pchannel="${esc(ch)}" aria-label="${label}">${inner}</a>`;
  }
  function chartPod(r, i) {
    const cls = `kp-pod${i === 0 ? ' rank1' : ''}${isFollowedArtist(r.artist) ? ' is-bias' : ''}${rosterMatch(r.artist) ? ' is-roster' : ''}`;
    const inner = `<span class="kp-pod-medal" aria-hidden="true">${['🥇', '🥈', '🥉'][i]}</span>`
      + (r.artworkUrl ? `<img class="kp-pod-art" src="${esc(r.artworkUrl)}" alt="" width="84" height="84" loading="eager" fetchpriority="high" decoding="async">` : '<div class="kp-pod-art"></div>')
      + `<span class="kp-pod-title">${esc(r.title)}</span><span class="kp-pod-artist">${esc(r.artist)}</span>${deltaBadge(r)}`;
    const label = esc(`#${r.rank} ${r.title} — ${r.artist}`);
    const q = (r.artist + ' ' + r.title).trim();
    const rid = rosterIdFor(r.artist);
    const ch = rid ? ((ROSTER.find(a => a.id === rid) || {}).youtubeChannelId || '') : '';
    const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' official');
    return `<a class="${cls} kp-playable" href="${yt}" target="_blank" rel="noopener" data-play="${esc(q)}" data-ptitle="${esc(r.title)}" data-partist="${esc(r.artist)}" data-pchannel="${esc(ch)}" aria-label="${label}">${inner}</a>`;
  }
  function buildChartControls() {
    const box = $('#kpop-chart-controls'); if (!box) return;
    const my = STORE_FOR_LANG[lang] || 'kr';
    const stores = []; const seen = new Set();
    [my, 'kr', 'us'].forEach(s => { if (!seen.has(s)) { seen.add(s); stores.push(s); } });
    const types = [['songs', ct('songs')], ['albums', ct('albums')], ['music-videos', ct('mvs')]];
    box.innerHTML =
      `<div class="kp-store-toggle" role="group" aria-label="Country">` +
        stores.map(s => `<button type="button" class="kp-store-btn${s === curStore ? ' on' : ''}" data-store="${s}">${STORE_LABEL[s] || s.toUpperCase()}</button>`).join('') +
      `</div>` +
      `<div class="kp-chart-tabs" role="tablist" aria-label="Chart type">` +
        types.map(([v, l]) => `<button type="button" class="kp-ctab${v === curType ? ' on' : ''}" data-type="${v}" role="tab" aria-selected="${v === curType}">${esc(l)}</button>`).join('') +
      `</div>`;
    box.querySelectorAll('.kp-store-btn').forEach(b => b.addEventListener('click', () => {
      box.querySelectorAll('.kp-store-btn').forEach(x => x.classList.remove('on')); b.classList.add('on');
      loadCharts(b.dataset.store, curType);
    }));
    box.querySelectorAll('.kp-ctab').forEach(b => b.addEventListener('click', () => {
      box.querySelectorAll('.kp-ctab').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-selected', 'true');
      loadCharts(curStore, b.dataset.type);
    }));
  }
  // KP-13: trust signals — local "as of" stamp + 44px refresh + one-time delta hint.
  const DELTA_HINT_KEY = 'kp_kpop_delta_hint';
  let deltaHintOn = false;
  try { deltaHintOn = !localStorage.getItem(DELTA_HINT_KEY); } catch {}
  function renderChartStamp() {
    const ctl = $('#kpop-chart-controls'); if (!ctl) return;
    let el = $('#kpop-chart-stamp');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kpop-chart-stamp'; el.className = 'kp-chart-stamp';
      el.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 2px;font-size:11px;opacity:.8';
      ctl.insertAdjacentElement('afterend', el);
    }
    const tm = new Date().toLocaleTimeString(lang === 'en' ? undefined : lang, { hour: '2-digit', minute: '2-digit' });
    const hint = (!chartHadPrev && deltaHintOn) ? `<span class="kp-delta-hint">${esc(ct('deltaHint'))}</span>` : '';
    el.innerHTML = `<span class="kp-chart-asof">${esc(ct('asOf'))} ${esc(tm)}</span>`
      + `<button type="button" class="kp-chart-refresh" aria-label="${esc(ct('refresh'))}" title="${esc(ct('refresh'))}" style="min-width:44px;min-height:44px;background:transparent;border:1px solid var(--border,rgba(128,128,128,.35));border-radius:12px;color:inherit;font-size:15px;cursor:pointer">↻</button>`
      + hint;
    if (!chartHadPrev && deltaHintOn) { try { localStorage.setItem(DELTA_HINT_KEY, '1'); } catch {} }
    el.querySelector('.kp-chart-refresh').addEventListener('click', () => loadCharts(curStore, curType));
  }

  async function loadCharts(store, type) {
    store = store || curStore; type = type || curType; curStore = store; curType = type;
    const list = $('#kpop-charts-list'), podium = $('#kpop-charts-podium'); if (!list || !API) return;
    list.setAttribute('aria-busy', 'true');
    try {
      let rows = await API.getKpopCharts(store, type).catch(() => null);
      // Some Apple storefronts occasionally time out / lack a feed → fall back to KR.
      if ((!Array.isArray(rows) || !rows.length) && store !== 'kr') rows = await API.getKpopCharts('kr', type).catch(() => null);
      if (!Array.isArray(rows) || !rows.length) throw new Error('empty');
      chartDeltas(store, type, rows);
      if (podium) { podium.innerHTML = rows.slice(0, 3).map((r, i) => chartPod(r, i)).join(''); podium.hidden = false; }
      list.innerHTML = rows.slice(3, 30).map(chartRow).join('');
      renderChartStamp(); // success only — stamp reflects when this data actually landed
    } catch {
      if (podium) podium.hidden = true;
      list.innerHTML = `<div class="kpop-empty">${esc(t('chartFail'))}</div>`;
    }
    list.setAttribute('aria-busy', 'false');
  }
  async function loadNews() {
    const box = $('#kpop-news-list'); if (!box || !API) return;
    const follows = [...getFollows()];
    const biasName = follows.length ? (ROSTER.find(a => a.id === follows[0]) || {}).nameEn : '';
    try {
      const items = await API.getKpopFeed(biasName || '', lang);
      if (!Array.isArray(items) || !items.length) throw new Error('empty');
      box.innerHTML = items.slice(0, 12).map(n => `
        <a class="news-card" href="${esc(n.link)}" target="_blank" rel="noopener">
          ${n.imageUrl ? `<img class="news-img" src="${esc(n.imageUrl)}" alt="" width="290" height="140" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">` : ''}
          <div class="news-body">
            <div class="news-title">${esc(n.title)}</div>
            <div class="news-meta">${n.credibility ? `<span class="news-cred">${esc(n.credibility)}</span>` : ''}<span>${esc(n.source || '')}</span></div>
          </div>
        </a>`).join('');
    } catch {
      box.innerHTML = `<div class="kpop-empty">${esc(t('newsEmpty'))}</div>`;
    }
  }
  async function loadConcerts() {
    const sec = $('#kpop-concerts'), box = $('#kpop-concerts-list');
    if (!sec || !box || !API || !API.getKpopConcerts) return;
    const follows = [...getFollows()];
    const biasName = follows.length ? (ROSTER.find(a => a.id === follows[0]) || {}).nameEn : '';
    try {
      const items = await API.getKpopConcerts(biasName || '', '');
      if (!Array.isArray(items) || !items.length) return; // stay hidden/locked
      const M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      box.innerHTML = items.slice(0, 8).map(c => {
        const dt = c.date ? new Date(c.date) : null;
        const soon = dt ? (dt - Date.now()) < 14 * 86400_000 && dt > Date.now() : false;
        const dd = dt ? `<div class="concert-date"><b>${dt.getDate()}</b><span>${M[dt.getMonth()]}</span></div>` : '';
        const loc = [c.venue, c.city, c.country].filter(Boolean).join(' · ');
        return `<a class="concert-row${soon ? ' is-soon' : ''}" href="${esc(c.url || '#')}" target="_blank" rel="noopener">${dd}<div class="concert-meta"><div class="concert-name">${esc(c.name || c.artist || '')}</div><div class="concert-venue">${esc(loc)}</div></div></a>`;
      }).join('');
      delete sec.dataset.locked; sec.hidden = false;
    } catch { /* no key / no data → stay hidden */ }
  }

  // ── Ticker (soonest countdowns + live chart) ───────────────────────────────
  async function renderTicker() {
    const rail = $('#kpop-ticker'); if (!rail) return;
    const items = [];
    EVENTS.slice(0, 6).forEach(e => items.push({ kind: e.daysLeft === 0 ? '🎉' : '⏳', text: `${e.artist.emoji || ''} ${e.artist.nameEn} ${e.title}`, val: e.daysLeft === 0 ? t('today') : `${e.daysLeft}${t('dleft')}`, soon: e.daysLeft <= 7, artistId: e.artist.id }));
    if (API && API.getKpopTicker) {
      try {
        const tk = await API.getKpopTicker();
        if (Array.isArray(tk)) tk.slice(0, 8).forEach(x => items.push({ kind: '📈', text: x.text, val: x.value || '', soon: false, play: x.text, artist: x.artist || '' }));
      } catch {}
    }
    if (!items.length) return;
    // Each ticker item is clickable: countdowns open the artist (modal), chart
    // entries play the song in-page — so the moving text always leads somewhere.
    const render = (it, dup) => {
      const ti = dup ? ' tabindex="-1"' : ''; // marquee clone: keep links out of the tab order
      const inner = `<span class="tk-kind" aria-hidden="true">${it.kind}</span>${esc(it.text)} <span class="tk-val">${esc(it.val)}</span>`;
      const cls = `tk-item${it.soon ? ' is-soon' : ''}`;
      if (it.artistId) return `<a class="${cls}"${ti} href="${esc(profileUrl(it.artistId))}" data-tk-artist="${esc(it.artistId)}">${inner}</a>`;
      if (it.play) return `<a class="${cls}"${ti} href="https://www.youtube.com/results?search_query=${encodeURIComponent(it.play + ' official')}" target="_blank" rel="noopener" data-tk-play="${esc(it.play)}" data-tk-partist="${esc(it.artist)}">${inner}</a>`;
      return `<span class="${cls}">${inner}</span>`;
    };
    const html = items.map(it => render(it)).join('');
    const dupHtml = items.map(it => render(it, true)).join('');
    // Duplicate for seamless marquee — clone is decorative: hidden from AT + untabbable.
    rail.innerHTML = html + '<span class="tk-dup" aria-hidden="true">' + dupHtml + '</span>';
    rail.classList.add('ready');
  }

  // ── Streaming Hub (#6, zero-key: official platform links + local daily checklist) ──
  const STREAM_STR = {
    en: { intro:'Support your bias the healthy way — official platforms, your own account, songs you genuinely love.', desc:'Official playlists & artist pages', open:'Open', checkTitle:'Daily Streaming Checklist', checkSub:'Resets daily (KST) · saved on this device', streak:'🔥 %n-day streak', allDone:'All done for today — see you tomorrow! 🎉',
      tasks:['Stream your bias’s latest title track','Watch the MV on the official channel','Add a song to your playlist','Check today’s charts','Share one song with a friend'] },
    ko: { intro:'건강하게 최애를 응원해요 — 공식 플랫폼, 본인 계정, 진심으로 좋아하는 곡으로.', desc:'공식 플레이리스트·아티스트 페이지', open:'열기', checkTitle:'오늘의 스트리밍 체크리스트', checkSub:'매일(KST) 초기화 · 이 기기에 저장', streak:'🔥 %n일 연속', allDone:'오늘 미션 완료 — 내일 또 만나요! 🎉',
      tasks:['최애 최신 타이틀곡 스트리밍하기','공식 채널에서 MV 보기','플레이리스트에 곡 추가하기','오늘의 차트 확인하기','친구에게 곡 하나 공유하기'] },
    ja: { intro:'健全に推しを応援 — 公式プラットフォーム・自分のアカウント・本当に好きな曲で。', desc:'公式プレイリスト・アーティストページ', open:'開く', checkTitle:'今日のストリーミングチェックリスト', checkSub:'毎日(KST)リセット · この端末に保存', streak:'🔥 %n日連続', allDone:'今日のミッション完了 — また明日! 🎉',
      tasks:['推しの最新タイトル曲をストリーミング','公式チャンネルでMVを見る','プレイリストに曲を追加','今日のチャートをチェック','友達に1曲シェア'] },
    zh: { intro:'用健康的方式应援爱豆 — 官方平台、自己的账号、真正喜欢的歌。', desc:'官方歌单·艺人主页', open:'打开', checkTitle:'每日打榜清单', checkSub:'每日(KST)重置 · 保存在本设备', streak:'🔥 连续 %n 天', allDone:'今日任务完成 — 明天见! 🎉',
      tasks:['循环爱豆最新主打歌','在官方频道观看 MV','把一首歌加入歌单','查看今日榜单','分享一首歌给朋友'] },
    es: { intro:'Apoya a tu bias de forma sana: plataformas oficiales, tu propia cuenta y canciones que de verdad te gustan.', desc:'Playlists oficiales y páginas de artista', open:'Abrir', checkTitle:'Checklist diario de streaming', checkSub:'Se reinicia a diario (KST) · guardado en este dispositivo', streak:'🔥 racha de %n día|🔥 racha de %n días', allDone:'¡Listo por hoy — nos vemos mañana! 🎉',
      tasks:['Escucha el tema principal más reciente de tu bias','Mira el MV en el canal oficial','Añade una canción a tu playlist','Revisa las listas de hoy','Comparte una canción con alguien'] },
    fr: { intro:'Soutiens ton bias sainement : plateformes officielles, ton propre compte, des titres que tu aimes vraiment.', desc:'Playlists officielles & pages d’artiste', open:'Ouvrir', checkTitle:'Checklist streaming du jour', checkSub:'Réinitialisé chaque jour (KST) · enregistré sur cet appareil', streak:'🔥 %n jour d’affilée|🔥 %n jours d’affilée', allDone:'Tout est fait pour aujourd’hui — à demain ! 🎉',
      tasks:['Écoute le dernier titre de ton bias','Regarde le MV sur la chaîne officielle','Ajoute un titre à ta playlist','Consulte les classements du jour','Partage un titre avec un ami'] },
    de: { intro:'Unterstütze deinen Bias auf gesunde Weise — offizielle Plattformen, dein eigenes Konto, Songs, die du wirklich liebst.', desc:'Offizielle Playlists & Künstlerseiten', open:'Öffnen', checkTitle:'Tägliche Streaming-Checkliste', checkSub:'Wird täglich (KST) zurückgesetzt · auf diesem Gerät gespeichert', streak:'🔥 %n Tag in Folge|🔥 %n Tage in Folge', allDone:'Heute alles erledigt — bis morgen! 🎉',
      tasks:['Stream den neuesten Titeltrack deines Bias','Sieh dir das MV auf dem offiziellen Kanal an','Füge einen Song zu deiner Playlist hinzu','Schau dir die heutigen Charts an','Teile einen Song mit einem Freund'] },
    pt: { intro:'Apoie seu bias de forma saudável — plataformas oficiais, sua própria conta e músicas que você realmente ama.', desc:'Playlists oficiais e páginas de artista', open:'Abrir', checkTitle:'Checklist diário de streaming', checkSub:'Reinicia todo dia (KST) · salvo neste dispositivo', streak:'🔥 sequência de %n dia|🔥 sequência de %n dias', allDone:'Tudo feito por hoje — até amanhã! 🎉',
      tasks:['Ouça a title track mais recente do seu bias','Assista ao MV no canal oficial','Adicione uma música à sua playlist','Confira as paradas de hoje','Compartilhe uma música com um amigo'] },
    id: { intro:'Dukung bias-mu dengan sehat — platform resmi, akun sendiri, dan lagu yang benar-benar kamu suka.', desc:'Playlist resmi & halaman artis', open:'Buka', checkTitle:'Checklist Streaming Harian', checkSub:'Reset tiap hari (KST) · tersimpan di perangkat ini', streak:'🔥 %n hari beruntun', allDone:'Selesai untuk hari ini — sampai jumpa besok! 🎉',
      tasks:['Putar title track terbaru bias-mu','Tonton MV di channel resmi','Tambahkan lagu ke playlist-mu','Cek tangga lagu hari ini','Bagikan satu lagu ke teman'] },
  };
  const STREAM_PLATFORMS = [
    { name:'Spotify',       ic:'🟢', url:'https://open.spotify.com/search/k-pop',  cls:'sp' },
    { name:'Apple Music',   ic:'',  url:'https://music.apple.com/search?term=k-pop', cls:'am' },
    { name:'YouTube Music', ic:'🔴', url:'https://music.youtube.com/search?q=k-pop', cls:'yt' },
    { name:'Melon',         ic:'🍈', url:'https://www.melon.com/chart/index.htm',  cls:'me' },
  ];
  const STREAM_KEY = 'kp_stream_check';
  const kstDateStr = () => nowKST().toISOString().slice(0, 10);
  const kstYesterdayStr = () => { const d = nowKST(); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };

  function loadStreamState(total) {
    let s; try { s = JSON.parse(localStorage.getItem(STREAM_KEY) || '{}'); } catch { s = {}; }
    const today = kstDateStr();
    if (s.date !== today) s = { date: today, done: new Array(total).fill(false), streak: s.streak || 0, last: s.last || '' };
    if (!Array.isArray(s.done) || s.done.length !== total) s.done = new Array(total).fill(false);
    return s;
  }
  const saveStreamState = (s) => { try { localStorage.setItem(STREAM_KEY, JSON.stringify(s)); } catch {} };

  function renderStreaming() {
    const host = $('#kpop-stream-body'); if (!host) return;
    const ss = STREAM_STR[lang] || STREAM_STR.en;
    const cards = STREAM_PLATFORMS.map(p => `
      <a class="stream-card stream-${p.cls}" href="${esc(p.url)}" target="_blank" rel="noopener">
        <span class="stream-ic" aria-hidden="true">${p.ic}</span>
        <span class="stream-name">${esc(p.name)}</span>
        <span class="stream-desc">${esc(ss.desc)}</span>
        <span class="stream-open">${esc(ss.open)} →</span>
      </a>`).join('');
    host.innerHTML = `<p class="stream-intro">${esc(ss.intro)}</p>
      <div class="stream-cards">${cards}</div>
      <div class="stream-check" id="kpop-stream-check"></div>`;
    renderChecklist(ss);
  }

  function renderChecklist(ss) {
    const box = $('#kpop-stream-check'); if (!box) return;
    const total = ss.tasks.length;
    let s = loadStreamState(total);
    // Build once; update incrementally on change (preserves focus, no flicker).
    box.innerHTML = `
      <div class="stream-check-head">
        <span class="stream-check-title">${esc(ss.checkTitle)}</span>
        <span class="stream-streak" id="kpop-streak" hidden></span>
      </div>
      <div class="stream-check-sub">${esc(ss.checkSub)}</div>
      <div class="stream-bar" role="progressbar" aria-label="${esc(ss.checkTitle)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0" aria-valuetext="0 / ${total}"><i></i></div>
      <ul class="stream-tasks">
        ${ss.tasks.map((tk, i) => `<li><label class="stream-task${s.done[i] ? ' is-done' : ''}"><input type="checkbox" data-i="${i}"${s.done[i] ? ' checked' : ''}><span class="stream-box" aria-hidden="true"></span><span class="stream-tk">${esc(tk)}</span></label></li>`).join('')}
      </ul>
      <div class="stream-alldone" id="kpop-alldone" hidden>${esc(ss.allDone)}</div>`;
    const bar = box.querySelector('.stream-bar'), fill = box.querySelector('.stream-bar > i');
    const streakEl = box.querySelector('#kpop-streak'), allDoneEl = box.querySelector('#kpop-alldone');
    const sync = () => {
      const doneN = s.done.filter(Boolean).length;
      fill.style.width = Math.round(doneN / total * 100) + '%';
      bar.setAttribute('aria-valuenow', doneN);
      bar.setAttribute('aria-valuetext', doneN + ' / ' + total);
      allDoneEl.hidden = doneN !== total;
      if (s.streak > 0) {
        const p = ss.streak.split('|');            // "singular|plural" (langs w/o a distinction omit the pipe)
        const tpl = (s.streak === 1 ? p[0] : (p[1] || p[0]));
        streakEl.hidden = false; streakEl.textContent = tpl.replace('%n', s.streak);
      } else streakEl.hidden = true;
    };
    sync();
    box.addEventListener('change', (e) => {
      const cb = e.target.closest('input[type=checkbox]'); if (!cb) return;
      // KST-midnight rollover guard: if this tab outlived the day, reset to a fresh
      // day before recording — otherwise a stale s.date corrupts the streak.
      const today = kstDateStr();
      if (s.date !== today) {
        s = { date: today, done: new Array(total).fill(false), streak: s.streak || 0, last: s.last || '' };
        $$('input[type=checkbox]', box).forEach(c => { c.checked = false; const tk = c.closest('.stream-task'); if (tk) tk.classList.remove('is-done'); });
        cb.checked = false;   // discard this stale click; the fresh day starts at 0
      }
      s.done[+cb.dataset.i] = cb.checked;
      const task = cb.closest('.stream-task'); if (task) task.classList.toggle('is-done', cb.checked);
      if (s.done.every(Boolean) && s.last !== s.date) {
        s.streak = (s.last === kstYesterdayStr()) ? (s.streak || 0) + 1 : 1;
        s.last = s.date;
      }
      saveStreamState(s);
      sync();
    });
  }

  // ── Condensed "All" overview ────────────────────────────────────────────────
  // In "All" mode each long section shows a short preview (CSS .kp-cap) plus a
  // "See all →" button that switches to that section's own tab — so the landing
  // view is scannable instead of dumping every list at once. Single-tab views
  // show the full section.
  let curFilter = 'all';
  const PREVIEW_CAP = { 'kpop-charts': 5, 'kpop-countdowns': 6, 'kpop-artists': 12, 'kpop-birthdays': 6, 'kpop-news': 5 };
  const PREVIEW_GRID = { 'kpop-charts': '#kpop-charts-list', 'kpop-countdowns': '#kpop-cd-grid', 'kpop-artists': '#kpop-art-grid', 'kpop-birthdays': '#kpop-bday-grid', 'kpop-news': '#kpop-news-list' };
  function applyPreview() {
    const all = curFilter === 'all';
    Object.keys(PREVIEW_CAP).forEach(id => {
      const sec = document.getElementById(id); if (!sec) return;
      sec.classList.toggle('kp-cap', all);
      const grid = document.querySelector(PREVIEW_GRID[id]);
      const n = grid ? grid.querySelectorAll(':scope > *:not(.kp-sk)').length : 0;
      let btn = sec.querySelector('.kp-seeall');
      const need = all && n > PREVIEW_CAP[id];
      if (need && !btn) { btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kp-seeall'; btn.dataset.seeall = id; sec.appendChild(btn); }
      if (btn) { btn.hidden = !need; if (need) btn.textContent = pstr().more + ' (' + n + ') →'; }
    });
  }

  // ── Filters (accessible tablist) ───────────────────────────────────────────
  function wireFilters() {
    const bar = $('#kpop-filters'); if (!bar) return;
    const chips = $$('.filter-chip', bar);
    const activate = (chip) => {
      chips.forEach(c => { const on = c === chip; c.classList.toggle('active', on); c.setAttribute('aria-selected', on ? 'true' : 'false'); c.tabIndex = on ? 0 : -1; });
      // KP-04: keep the active chip visible in the horizontal snap rail (click + arrow-key paths).
      if (chip.scrollIntoView) chip.scrollIntoView({ inline: 'center', block: 'nearest' });
      const target = chip.dataset.target;
      $$('.kpop-sec').forEach(sec => { if (sec.dataset.locked) { sec.hidden = true; return; } if (sec.hasAttribute('data-noall') && target === 'all') { sec.hidden = true; return; } sec.hidden = !(target === 'all' || sec.id === target); });
      const funnel = $('#kpop-funnel'); if (funnel) funnel.hidden = (target !== 'all');
      curFilter = target; applyPreview();
    };
    applyPreview(); // initial condensed "All" overview
    chips.forEach((chip, i) => {
      chip.addEventListener('click', () => activate(chip));
      chip.addEventListener('keydown', (e) => {
        let j = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % chips.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + chips.length) % chips.length;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = chips.length - 1;
        if (j >= 0) { e.preventDefault(); chips[j].focus(); activate(chips[j]); }
      });
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  function boot() {
    EVENTS = buildEvents();
    window.kpOpenArtist = openArtist;   // public hook for modules/kpop-plus.js
    const cc = $('#kpop-concerts'); if (cc) cc.dataset.locked = '1';   // hidden until data arrives
    renderHeroStats();
    renderSpotlight();
    renderOnboard();
    renderCountdowns();
    renderBirthdays();
    renderArtists();
    renderStreaming();
    wireFilters();
    // KP-16: pull-to-refresh (kpop-ux) saves the active tab in sessionStorage before
    // location.reload(); restore it here so the reader lands back on the same view.
    try {
      const kt = sessionStorage.getItem('kux_tab');
      if (kt) {
        sessionStorage.removeItem('kux_tab');
        const chip = $('.filter-chip[data-target="' + (window.CSS && CSS.escape ? CSS.escape(kt) : kt) + '"]');
        if (chip) chip.click(); // standalone has 7 chips (no Streaming) — click only if present
      }
    } catch {}
    renderTicker();
    buildChartControls();
    loadCharts();
    loadNews();
    loadConcerts();

    // Delegated artist-grid interactions (follow star + open modal)
    const grid = $('#kpop-art-grid');
    if (grid) grid.addEventListener('click', (e) => {
      const fb = e.target.closest('.art-follow'); if (fb) { e.stopPropagation(); toggleFollow(fb.dataset.follow); return; }
      const op = e.target.closest('.art-open'); if (op) { const card = op.closest('.art-card'); if (card) openArtist(card.dataset.id); }
    });

    // "See all →" (condensed overview) → switch to that section's full tab
    document.addEventListener('click', (e) => {
      const b = e.target.closest('.kp-seeall'); if (!b) return;
      const chip = $('.filter-chip[data-target="' + b.dataset.seeall + '"]');
      if (chip) { chip.click(); const sec = document.getElementById(b.dataset.seeall); if (sec && sec.scrollIntoView) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    // In-page YouTube mini-player: any [data-play] (chart rows, podium, modal) plays
    // here via window.kpPlay instead of leaving the page; href is the JS-off fallback.
    document.addEventListener('click', (e) => {
      const p = e.target.closest('[data-play]'); if (!p || !window.kpPlay) return;
      e.preventDefault();
      window.kpPlay(p.dataset.play, { title: p.dataset.ptitle || '', artist: p.dataset.partist || '', channelId: p.dataset.pchannel || '' });
    });

    // Keep overview caps + "See all" counts in sync as async lists (charts/news) fill in
    if (window.MutationObserver) {
      const obs = Object.values(PREVIEW_GRID).map(s => $(s)).filter(Boolean);
      if (obs.length) { let mt; const mo = new MutationObserver(() => { clearTimeout(mt); mt = setTimeout(applyPreview, 60); }); obs.forEach(el => mo.observe(el, { childList: true })); }
    }

    const tg = $('#art-toggle');
    if (tg) tg.addEventListener('click', () => { showFollowedOnly = !showFollowedOnly; renderArtists(); });

    const bg = $('#kpop-modal-bg');
    if (bg) {
      bg.addEventListener('click', (e) => { if (e.target === bg || e.target.hasAttribute('data-close')) closeModal(); });
      bg.addEventListener('keydown', trapTab);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && bg.classList.contains('open')) closeModal(); });
    }

    const pause = $('#kpop-ticker-pause'), rail = $('#kpop-ticker');
    if (pause && rail) pause.addEventListener('click', () => {
      const paused = rail.classList.toggle('is-paused');
      pause.setAttribute('aria-pressed', paused ? 'true' : 'false');
      pause.textContent = paused ? '▶' : '⏸';
    });
    // Ticker click → open the artist (modal) or play the charting song, in-page.
    if (rail) rail.addEventListener('click', (e) => {
      const a = e.target.closest('[data-tk-artist],[data-tk-play]'); if (!a) return;
      if (a.dataset.tkArtist && window.kpOpenArtist) { e.preventDefault(); window.kpOpenArtist(a.dataset.tkArtist); }
      else if (a.dataset.tkPlay && window.kpPlay) { e.preventDefault(); window.kpPlay(a.dataset.tkPlay, { artist: a.dataset.tkPartist || '' }); }
    });

    let timer = setInterval(tickTimers, 1000);
    document.addEventListener('visibilitychange', () => {
      clearInterval(timer);
      if (!document.hidden) { tickTimers(); timer = setInterval(tickTimers, 1000); }
    });
    setInterval(() => { EVENTS = buildEvents(); renderCountdowns(); renderHeroStats(); renderSpotlight(); }, 3600_000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
