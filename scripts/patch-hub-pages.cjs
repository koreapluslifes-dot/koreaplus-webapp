#!/usr/bin/env node
'use strict';
/** Safe hub patches after restore: drop AliExpress topads, bump CSS, fix sheet scroll unlock. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HUBS = [
  'festivals.html', 'seasons.html', 'culture.html', 'temples.html',
  'nightviews.html', 'kdrama-locations.html',
];

function patch(fp) {
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;
  html = html.replace(/<div id="kp-topads"[^>]*><\/div>\s*\n?/g, '');
  html = html.replace(/<script defer src="modules\/topads\.js"><\/script>\s*\n?/g, '');
  html = html.replace(/hub-styles\.css\?v=\d+/g, 'hub-styles.css?v=18');
  if (path.basename(fp) === 'festivals.html') {
    html = html.replace(
      "function open(){sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}",
      "function open(){sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.body.classList.add('kp-modal-open');}"
    );
    html = html.replace(
      "function close(){sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');document.body.style.overflow='';}",
      "function close(){sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');if(window.__kpScrollUnlock)window.__kpScrollUnlock();else document.body.style.overflow='';}"
    );
  }
  if (html !== before) {
    fs.writeFileSync(fp, html, 'utf8');
    console.log('patched', path.relative(ROOT, fp));
  }
}

for (const rel of HUBS) patch(path.join(ROOT, rel));
