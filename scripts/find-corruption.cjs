#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = '134f14ef';

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== 'koreaplus-auto-poster') {
      walk(fp, out);
    } else if (name.endsWith('.html')) out.push(fp);
  }
  return out;
}

function badCount(s) {
  return (s.match(/\?\?/g) || []).length;
}

const worse = [];
for (const fp of walk(ROOT)) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  try {
    const old = execSync(`git show ${BASE}:${rel}`, { encoding: 'utf8' });
    const cur = fs.readFileSync(fp, 'utf8');
    const delta = badCount(cur) - badCount(old);
    if (delta > 3) worse.push({ rel, delta, cur: badCount(cur), old: badCount(old) });
  } catch (_) {}
}
worse.sort((a, b) => b.delta - a.delta);
for (const w of worse) console.log(`${w.rel}\t+${w.delta}\t(${w.old} -> ${w.cur})`);
console.log(`\n${worse.length} file(s) worsened vs ${BASE}`);
