/* Scroll health: clear stuck overflow locks + forward vertical wheel over horizontal rails. */
(function (w) {
  'use strict';
  if (w.__kpScrollGuard) return;
  w.__kpScrollGuard = true;

  var RAILS = [
    '.filter-bar', '.hub-nav-links', '.week-carousel-wrap', '.fest-controls',
    '.kp-ali-strip', '.rel-rail', '.kpop-ticker', '.kpop-ticker-wrap',
    '.kp-discover-rail', '[data-hscroll]'
  ].join(',');

  function unlock() {
    var modalOpen = document.querySelector(
      '#detail-panel.open, #map-panel.open, .chatbot.open, .kp-trip-panel.open, ' +
      '.hub-modal-backdrop.open, .kpop-modal-bg.open, .kp-sheet.open'
    );
    var navOpen = document.querySelector('.kp-pnav.kp-open');
    if (!modalOpen) {
      document.body.style.overflow = '';
      document.body.classList.remove('kp-modal-open');
    }
    if (!navOpen) document.body.classList.remove('kp-nav-open');
  }

  w.__kpScrollUnlock = unlock;

  document.addEventListener('wheel', function (e) {
    if (!e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var rail = e.target && e.target.closest && e.target.closest(RAILS);
    if (!rail) return;
    w.scrollBy(0, e.deltaY);
    if (e.cancelable) e.preventDefault();
  }, { passive: false, capture: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', unlock);
  } else {
    unlock();
  }
  w.addEventListener('pageshow', unlock);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') unlock();
  });
})(window);