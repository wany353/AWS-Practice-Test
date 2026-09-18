// Checks the en/zh dictionaries against each other and against the code.
// Fails (exit 1) on anything that would show up as a broken string in the UI:
//   - a key defined in one language but not the other
//   - the same key using different {placeholders} in the two languages
//   - a key used in the code that is missing from a dictionary
// Keys that no longer appear in the code are only reported, never fatal.
//
// Run from the Frontend directory: node scripts/check-i18n.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { default: en } = await import(path.join(root, 'src/i18n/en.js'));
const { default: zh } = await import(path.join(root, 'src/i18n/zh.js'));

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
  );

const EN = new Map(flatten(en));
const ZH = new Map(flatten(zh));
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

const problems = [];
const onlyEn = [...EN.keys()].filter((k) => !ZH.has(k));
const onlyZh = [...ZH.keys()].filter((k) => !EN.has(k));
const varMismatch = [...EN.keys()].filter((k) => ZH.has(k) && placeholders(EN.get(k)) !== placeholders(ZH.get(k)));

if (onlyEn.length) problems.push(`missing from zh.js: ${onlyEn.join(', ')}`);
if (onlyZh.length) problems.push(`missing from en.js: ${onlyZh.join(', ')}`);
if (varMismatch.length) problems.push(`placeholders differ between languages: ${varMismatch.join(', ')}`);

// Collect the 'namespace.key' literals used anywhere outside src/i18n.
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'i18n' ? [] : walk(full);
    return /\.(jsx?|mjs)$/.test(entry.name) ? [full] : [];
  });

const keyPattern = new RegExp(`['"\`]((?:${Object.keys(en).join('|')})\\.[A-Za-z0-9_.]+)['"\`]`, 'g');
const used = new Map();
for (const file of walk(path.join(root, 'src'))) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(keyPattern)) {
    used.set(match[1], [...(used.get(match[1]) ?? []), path.relative(root, file)]);
  }
}

const missing = [...used.keys()].filter((k) => !EN.has(k) || !ZH.has(k));
if (missing.length) problems.push(`used in code but not defined: ${missing.map((k) => `${k} (${used.get(k)})`).join(', ')}`);

const unused = [...EN.keys()].filter((k) => !used.has(k));

console.log(`en: ${EN.size} keys | zh: ${ZH.size} keys | referenced in code: ${used.size}`);
if (unused.length) console.log(`note: defined but never referenced: ${unused.join(', ')}`);

if (problems.length) {
  for (const p of problems) console.error(`i18n: ${p}`);
  process.exit(1);
}
console.log('i18n: dictionaries are consistent');
