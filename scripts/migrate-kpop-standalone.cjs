#!/usr/bin/env node
'use strict';
/** Move K-Pop public URLs from /guide/kpop/* to standalone /kpop/* (and /ko/kpop/*). */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://koreaplus-lifes.com';

function migrateHtml(content) {
  let c = content;
  // Absolute canonical / OG / hreflang
  c = c.replace(/https:\/\/koreaplus-lifes\.com\/guide\/((?:[a-z]{2}(?:-[a-z]+)?\/)?)kpop-vs\//g, `${ORIGIN}/$1kpop-vs/`);
  c = c.replace(/https:\/\/koreaplus-lifes\.com\/guide\/((?:[a-z]{2}(?:-[a-z]+)?\/)?)kpop\//g, `${ORIGIN}/$1kpop/`);
  c = c.replace(/https:\/\/koreaplus-lifes\.com\/guide\/kpop-vs\//g, `${ORIGIN}/kpop-vs/`);
  c = c.replace(/https:\/\/koreaplus-lifes\.com\/guide\/kpop\//g, `${ORIGIN}/kpop/`);
  // JSON-LD and breadcrumb relative paths
  c = c.replace(/"url":"\/guide\/((?:[a-z]{2}(?:-[a-z]+)?\/)?)kpop\//g, '"url":"/$1kpop/');
  c = c.replace(/"url":"\/guide\/kpop\//g, '"url":"/kpop/');
  c = c.replace(/"url":"\/guide\/((?:[a-z]{2}(?:-[a-z]+)?\/)?)kpop-vs\//g, '"url":"/$1kpop-vs/');
  // In-page links (base href=/guide/): use absolute channel paths
  c = c.replace(/href="((?:[a-z]{2}(?:-[a-z]+)?)\/)kpop\//g, 'href="/$1kpop/');
  c = c.replace(/href="kpop\//g, 'href="/kpop/');
  c = c.replace(/href="((?:[a-z]{2}(?:-[a-z]+)?)\/)kpop-vs\//g, 'href="/$1kpop-vs/');
  c = c.replace(/href="kpop-vs\//g, 'href="/kpop-vs/');
  return c;
}

function migrateSitemap(content) {
  return content
    .replace(/<loc>https:\/\/koreaplus-lifes\.com\/guide\/((?:[a-z]{2}(?:-[a-z]+)?\/)?)kpop\//g, '<loc>https://koreaplus-lifes.com/$1kpop/')
    .replace(/<loc>https:\/\/koreaplus-lifes\.com\/guide\/kpop\//g, '<loc>https://koreaplus-lifes.com/kpop/')
    .replace(/<loc>https:\/\/koreaplus-lifes\.com\/guide\/((?:[a-z]{2}(?:-[a-z]+)?\/)?)kpop-vs\//g, '<loc>https://koreaplus-lifes.com/$1kpop-vs/')
    .replace(/href="https:\/\/koreaplus-lifes\.com\/guide\/((?:[a-z]{2}(?:-[a-z]+)?\/)?)kpop\//g, 'href="https://koreaplus-lifes.com/$1kpop/')
    .replace(/href="https:\/\/koreaplus-lifes\.com\/guide\/kpop\//g, 'href="https://koreaplus-lifes.com/kpop/');
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'koreaplus-auto-poster') {
      walk(fp, out);
    } else if (name.endsWith('.html') || name === 'kpop-sitemap.xml') out.push(fp);
  }
  return out;
}

function isKpopChannelFile(rel) {
  return /^kpop\//.test(rel) ||
    /^kpop-vs\//.test(rel) ||
    /^[a-z]{2}(?:-[a-z]+)?\/kpop\//.test(rel) ||
    /^[a-z]{2}(?:-[a-z]+)?\/kpop-vs\//.test(rel) ||
    /^kpop-/.test(path.basename(rel)) ||
    /-kpop-artists-guide\.html$/.test(rel) ||
    rel === 'kpop-sitemap.xml';
}

let n = 0;
for (const fp of walk(ROOT)) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  if (!isKpopChannelFile(rel)) continue;
  const before = fs.readFileSync(fp, 'utf8');
  const after = rel.endsWith('.xml') ? migrateSitemap(before) : migrateHtml(before);
  if (after !== before) {
    fs.writeFileSync(fp, after, 'utf8');
    n++;
    if (n <= 20) console.log('migrated', rel);
  }
}
console.log(`Done: ${n} file(s) updated.`);
