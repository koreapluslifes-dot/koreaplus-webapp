/* Clean Guide URLs — strip .html for internal navigation (pairs with .htaccess). */
(function (w) {
  'use strict';
  function stripHtml(rel) {
    if (!rel) return '';
    if (rel === 'index.html') return '';
    if (rel.endsWith('/index.html')) return rel.slice(0, -10);
    return rel.replace(/\.html$/, '');
  }
  function href(rel) {
    if (!rel) return './';
    if (/^(https?:|mailto:|tel:|#)/i.test(rel)) return rel;
    var clean = stripHtml(rel);
    return clean || './';
  }
  w.kpUrl = { stripHtml: stripHtml, href: href };
})(window);
