#!/usr/bin/env node
'use strict';
/** One-shot repair for UTF-8/HTML corruption (??/ → broken closing tags). */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const plan = fs.readFileSync(path.join(ROOT, 'plan.html'), 'utf8');
const goodPnav = plan.match(/<div class="kp-pnav">[\s\S]*?<\/div>\s*\n  <\/div>/);
if (!goodPnav) throw new Error('Could not extract kp-pnav from plan.html');

function fixContent(html) {
  let c = html;
  c = c.replace(/Next \?\?\//g, 'Next →</');
  c = c.replace(/>\?\?Prev/g, '>← Prev');
  c = c.replace(/Loading festivals\?\?\//g, 'Loading festivals</');
  c = c.replace(/\?\?\//g, '</');
  c = c.replace(/(kp-pnav-burger[^>]*>)(<\/button>)/g, '$1☰$2');
  c = c.replace(/(kp-caret" aria-hidden="true">)(<\/span>)/g, '$1▾$2');
  c = c.replace(/(kpop-ticker-pause[^>]*>)(<\/button>)/g, '$1⏸$2');
  c = c.replace(/(hub-modal-close[^>]*>)(<\/button>)/g, '$1×$2');
  c = c.replace(/(<button[^>]*onclick="closeModal\(\)"[^>]*>)(<\/button>)/g, '$1×$2');
  c = c.replace(/(<button[^>]*onclick="document\.getElementById\('day-panel'\)[^>]*>)(<\/button>)/g, '$1×$2');
  c = c.replace(/(<span class="kp-stat"><b id="kp-stat-next">)(<\/b>)/g, '$1—$2');
  c = c.replace(/ \?\?populated/g, ' — populated');
  c = c.replace(/ \?\?all in one/g, ' — all in one');
  c = c.replace(/ \?\?real-time/g, ' — real-time');
  c = c.replace(/Now \?\?Real-Time/g, 'Now — Real-Time');
  c = c.replace(/K-Pop by KoreaPlus \?\?real-time/g, 'K-Pop by KoreaPlus — real-time');
  c = c.replace(/world's K-pop hub \?\?real-time/g, "world's K-pop hub — real-time");
  c = c.replace(/>\?\?For You</g, '>✨ For You<');
  c = c.replace(/>\?\?Comebacks</g, '>⏳ Comebacks<');
  c = c.replace(/>\?\?Comeback &/g, '>⏳ Comeback &');
  c = c.replace(/>\?\?List</g, '>📋 List<');
  c = c.replace(/<!-- \?\?For You/g, '<!-- ✨ For You');
  c = c.replace(/<!-- AdSense \?\?single/g, '<!-- AdSense — single');
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
  if (!html.includes('??/') && !html.includes('??')) continue;
  html = fixContent(html);
  if (html.includes('<div class="kp-pnav">')) {
    html = html.replace(/<div class="kp-pnav">[\s\S]*?<\/div>\s*\n  <\/div>/, goodPnav[0]);
  }
  fs.writeFileSync(fp, html, 'utf8');
  fixed++;
  console.log('fixed', path.relative(ROOT, fp));
}
console.log(`Done: ${fixed} file(s).`);
