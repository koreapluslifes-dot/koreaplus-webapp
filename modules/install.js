/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — PWA install nudge (cross-domain: app-store retention)
   The service worker + its update lifecycle are owned entirely by
   modules/pwa.js, which is loaded on every page via modules/header.js
   (theme→…→nav→pwa chain). That registration already makes content pages
   installable + offline-capable. This module ONLY adds the install-prompt
   UI: when the browser fires `beforeinstallprompt`, it shows one small
   dismissible banner (9-lang). It deliberately does NOT register the SW or
   touch window.__kpPwaInit, so it never races pwa.js for SW ownership
   (which would otherwise suppress pwa.js's update toast + reload). Dismissal
   and successful install are remembered in localStorage.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LBL = {
    en: { t: 'Install KoreaPlus', s: 'Add to your home screen — works offline', b: 'Install', x: 'Not now' },
    ko: { t: 'KoreaPlus 설치', s: '홈 화면에 추가 — 오프라인 지원', b: '설치', x: '나중에' },
    ja: { t: 'KoreaPlus をインストール', s: 'ホーム画面に追加 — オフライン対応', b: 'インストール', x: '後で' },
    zh: { t: '安装 KoreaPlus', s: '添加到主屏幕 — 支持离线', b: '安装', x: '以后' },
    es: { t: 'Instalar KoreaPlus', s: 'Añádelo a tu pantalla de inicio — funciona sin conexión', b: 'Instalar', x: 'Ahora no' },
    fr: { t: 'Installer KoreaPlus', s: 'Ajouter à l’écran d’accueil — fonctionne hors ligne', b: 'Installer', x: 'Plus tard' },
    de: { t: 'KoreaPlus installieren', s: 'Zum Startbildschirm hinzufügen — offline nutzbar', b: 'Installieren', x: 'Später' },
    pt: { t: 'Instalar o KoreaPlus', s: 'Adicione à tela inicial — funciona offline', b: 'Instalar', x: 'Agora não' },
    id: { t: 'Instal KoreaPlus', s: 'Tambahkan ke layar utama — bisa offline', b: 'Instal', x: 'Nanti' }
  };
  function lang() { return (document.documentElement.lang || 'en').slice(0, 2); }
  var KEY = 'kp_install_dismissed_v1';
  var deferred = null;

  function dismissed() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function hide() { var b = document.getElementById('kp-install'); if (b && b.parentNode) b.parentNode.removeChild(b); }

  function show() {
    if (document.getElementById('kp-install') || dismissed()) return;
    var L = LBL[lang()] || LBL.en;
    var bar = document.createElement('div');
    bar.id = 'kp-install';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', L.t);
    bar.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:12px;background:#13243a;color:#eaf0f7;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:12px 14px;box-shadow:0 10px 34px rgba(0,0,0,.45);max-width:94vw;font-family:Inter,system-ui,sans-serif';
    var icon = document.createElement('span'); icon.textContent = '📲'; icon.style.fontSize = '22px';
    var txt = document.createElement('span');
    txt.style.cssText = 'display:flex;flex-direction:column;line-height:1.3';
    var b1 = document.createElement('b'); b1.textContent = L.t; b1.style.fontSize = '14px';
    var s1 = document.createElement('small'); s1.textContent = L.s; s1.style.cssText = 'font-size:12px;color:#9fb0c3';
    txt.appendChild(b1); txt.appendChild(s1);
    var inst = document.createElement('button'); inst.type = 'button'; inst.textContent = L.b;
    inst.style.cssText = 'background:linear-gradient(135deg,#74b9ff,#ff6b9d);color:#06101d;border:0;border-radius:12px;padding:9px 16px;font:800 13px Inter,sans-serif;cursor:pointer;white-space:nowrap';
    inst.addEventListener('click', function () {
      hide();
      if (deferred) { try { deferred.prompt(); } catch (e) {} if (deferred.userChoice) deferred.userChoice.finally(function () { deferred = null; }); }
    });
    var x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', L.x);
    x.style.cssText = 'background:transparent;color:#9fb0c3;border:0;font-size:16px;cursor:pointer;padding:4px 8px';
    x.addEventListener('click', function () { hide(); remember(); });
    bar.appendChild(icon); bar.appendChild(txt); bar.appendChild(inst); bar.appendChild(x);
    (document.body || document.documentElement).appendChild(bar);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (dismissed()) return;
    // Defer slightly so the banner doesn't fight first paint / LCP.
    setTimeout(show, 1500);
  });
  window.addEventListener('appinstalled', function () { hide(); remember(); });
})();
