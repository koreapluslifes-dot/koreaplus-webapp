/* KoreaPlus — PWA registration + "update available" toast.
   Single shared owner of the service-worker lifecycle (replaces the inline
   registrations in index.html and header.js). When a new SW is installed and
   waiting, shows a non-intrusive toast; tapping it activates the new version
   and reloads once. */
(function () {
  if (!('serviceWorker' in navigator) || window.__kpPwaInit) return;
  window.__kpPwaInit = true;

  function t(key, fb) {
    var v = window.kpI18n && window.kpI18n.t && window.kpI18n.t(key);
    return (v && v !== key) ? v : fb;
  }

  function toast(reg) {
    // Reuse the page toast if present; otherwise build a minimal one.
    var el = document.getElementById('kp-pwa-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kp-pwa-toast';
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));' +
        'transform:translateX(-50%);z-index:100000;display:flex;align-items:center;gap:12px;' +
        'background:#1e2a3a;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:24px;' +
        'padding:11px 14px 11px 18px;font:600 14px/1 Inter,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5);' +
        'max-width:92vw';
      var span = document.createElement('span');
      span.textContent = '✨ ' + t('update.available', 'New version available');
      var btn = document.createElement('button');
      btn.textContent = t('update.refresh', 'Refresh');
      btn.style.cssText = 'background:#d62246;color:#fff;border:0;border-radius:16px;' +
        'padding:7px 16px;font:700 13px Inter,sans-serif;cursor:pointer';
      btn.addEventListener('click', function () {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      });
      el.appendChild(span); el.appendChild(btn);
      document.body.appendChild(el);
    }
  }

  navigator.serviceWorker.register('/guide/sw.js').then(function (reg) {
    // A waiting worker already exists (installed before this page loaded).
    if (reg.waiting && navigator.serviceWorker.controller) toast(reg);
    reg.addEventListener('updatefound', function () {
      var sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', function () {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) toast(reg);
      });
    });
  }).catch(function () {});

  // Reload once the new SW takes control (guarded against reload loops).
  var reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
})();
