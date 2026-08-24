#!/usr/bin/env node
'use strict';
/** Repair broken HTML closing tags only (??/tag> → </tag>). Never touch bare ?? in text/JS. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const plan = fs.readFileSync(path.join(ROOT, 'plan.html'), 'utf8');
const goodPnav = plan.match(/<div class="kp-pnav">[\s\S]*?<\/div>\s*\n  <\/div>/);
if (!goodPnav) throw new Error('Could not extract kp-pnav from plan.html');

function fixContent(html) {
  let c = html;
  // Only replace ??/ when it is a broken closing tag (followed by a tag name).
  c = c.replace(/\?\?\/([a-zA-Z][\w:-]*>)/g, '</$1');
  c = c.replace(/(kp-pnav-burger[^>]*>)(<\/button>)/g, '$1☰$2');
  c = c.replace(/(kp-caret" aria-hidden="true">)(<\/span>)/g, '$1▾$2');
  c = c.replace(/(hub-modal-close[^>]*>)(<\/button>)/g, '$1×$2');
  c = c.replace(/<!-- Localized top ads[^]*?<div id="kp-topads"[^>]*><\/div>\s*\n/g, '');
  return c;
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory() && name !== 'node_modules' && name !== '.git') walk(fp, out);
    else if (name.endsWith('.html')) out.push(fp);
  }
  return out;
}

let fixed = 0;
for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  if (!/\?\?\/[a-zA-Z]/.test(html)) continue;
  html = fixContent(html);
  if (html.includes('<div class="kp-pnav">')) {
    html = html.replace(/<div class="kp-pnav">[\s\S]*?<\/div>\s*\n  <\/div>/, goodPnav[0]);
  }
  fs.writeFileSync(fp, html, 'utf8');
  fixed++;
  console.log('fixed', path.relative(ROOT, fp));
}
console.log(`Done: ${fixed} file(s).`);
