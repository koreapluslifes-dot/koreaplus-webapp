/* KoreaPlus — unified primary nav behavior (kp-pnav)
   Powers the simplified 3-bucket nav (Explore · Guides ▾ · Where to Go ▾ · Plan)
   on the homepage AND every hub/tool page. Pure behavior — markup lives in the
   pages (static <a href> for SEO) and is localized via data-i18n + i18n.js.
   Idempotent: safe to load more than once. */
(function () {
  if (window.__kpNavInit) return;
  window.__kpNavInit = true;

  function closeAllDrops(except) {
    document.querySelectorAll('.kp-pnav-drop.open').forEach(d => {
      if (d !== except) {
        d.classList.remove('open');
        const t = d.querySelector('.kp-pnav-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function wireDropdowns(root) {
    root.querySelectorAll('.kp-pnav-drop').forEach(drop => {
      const toggle = drop.querySelector('.kp-pnav-toggle');
      if (!toggle || toggle.__wired) return;
      toggle.__wired = true;
      toggle.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !drop.classList.contains('open');
        closeAllDrops(willOpen ? drop : null);
        drop.classList.toggle('open', willOpen);
        toggle.setAttribute('aria-expanded', String(willOpen));
      });
    });
  }

  function wireBurger(pnav) {
    const burger = pnav.querySelector('.kp-pnav-burger');
    if (!burger || burger.__wired) return;
    burger.__wired = true;

    // Dimmed backdrop behind the mobile sheet
    let backdrop = pnav.querySelector('.kp-pnav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'kp-pnav-backdrop';
      pnav.appendChild(backdrop);
    }
    const setOpen = open => {
      pnav.classList.toggle('kp-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('kp-nav-open', open);
    };
    burger.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(!pnav.classList.contains('kp-open'));
    });
    backdrop.addEventListener('click', () => setOpen(false));
    // Tapping a real link inside the sheet closes it (navigation follows)
    pnav.querySelectorAll('.kp-pnav-items a').forEach(a =>
      a.addEventListener('click', () => setOpen(false)));
    pnav.__setOpen = setOpen;
  }

  function pageSeg(path) {
    const seg = (path || '').split('#')[0].split('/').pop().toLowerCase().replace(/\.html$/, '');
    return seg || 'index';
  }

  function markActive(root) {
    const here = pageSeg(location.pathname.split('/').pop() || 'index.html');
    root.querySelectorAll('.kp-pnav a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      const seg = pageSeg(href);
      if (seg && seg === here) {
        a.classList.add('kp-active');
        const drop = a.closest('.kp-pnav-drop');
        if (drop) drop.querySelector('.kp-pnav-toggle')?.classList.add('kp-active');
      }
    });
  }

  function init() {
    document.querySelectorAll('.kp-pnav').forEach(pnav => {
      wireDropdowns(pnav);
      wireBurger(pnav);
      markActive(pnav);
    });
  }

  // Global close handlers (once)
  document.addEventListener('click', () => closeAllDrops(null));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllDrops(null);
      document.querySelectorAll('.kp-pnav.kp-open').forEach(p => {
        if (p.__setOpen) p.__setOpen(false);
        else p.classList.remove('kp-open');
      });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.kpNav = { init };
})();
