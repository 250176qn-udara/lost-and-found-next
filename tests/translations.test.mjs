// Every t('...') text written in the code must have a Japanese entry in src/lib/i18n.ts,
// otherwise Japanese users see English there. (Texts built at run time are not checked.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

test('every t("...") text has a Japanese translation', () => {
  const unq = s => s.replace(/\\'/g, "'");
  const dict = readFileSync('src/lib/i18n.ts', 'utf8');
  const keys = new Set([...dict.matchAll(/'((?:[^'\\]|\\.)*)'\s*:/g)].map(m => unq(m[1])));
  const keysDq = new Set([...dict.matchAll(/"((?:[^"\\]|\\.)*)"\s*:/g)].map(m => m[1]));
  const files = [];
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f) && !f.endsWith('i18n.ts')) files.push(p); } };
  walk('src');
  const missing = [];
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) { const k = unq(m[1]); if (!keys.has(k) && !keysDq.has(k)) missing.push(`${k}  (${f})`); }
  }
  assert.deepEqual(missing, [], `Missing Japanese for:\n${missing.join('\n')}`);
});
