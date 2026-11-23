// Rule F1-R2 (text search match). Analysis-side check against the recorded runs.
// Run: node evidence/rules/f1-text-match.mjs
//
// Rule in plain words (the "Vehicle Name"/"Weapon Name" and "Real Life ..." text filters):
// - The filter applies when the field fires "change" (Enter or leaving the field), not on each keystroke.
// - Matching is a case-insensitive "contains" test against the item's field. The query is NOT trimmed:
//   leading/trailing spaces are part of the text to find. Every character other than A-Z, a-z, 0-9 and
//   space is matched literally (so "(", "<b>" etc. are plain text, never patterns).
// - Accent folding is one-way: an unaccented a, o, u, y, i, e, c, d, n, g or s in the query also matches
//   its accented forms in the data (huracan finds "Huracán"); an accented letter in the query matches only
//   itself (án does not find "an").
// - An item without the field never matches a non-empty query. An empty query removes the filter.
// Replay: if the locally saved list JSON (evidence/walk/bodies, git-ignored) is present, the rule is applied
// to it and must give the recorded result counts; data-free relations are always checked.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FOLD = {
  a: 'aáàảãạăắằẵặâấầẩẫậäåæ', o: 'oóòỏõọơớờởợỡôốồổỗộöø', u: 'uúùủũụưứừửựữûü', y: 'yýỳỷỹỵÿ',
  i: 'iíìỉĩịîïı', e: 'eéèẻẽẹêếềễệểë', c: 'cç', d: 'dđ', n: 'nñ', g: 'gğ', s: 'sş',
};
export function textMatches(query, value) {
  if (!query) return true;
  if (value === undefined || value === null || value === '') return false;
  let pattern = '';
  for (const ch of query.toLowerCase()) {
    if (FOLD[ch]) pattern += '[' + FOLD[ch] + ']';
    else if (/[a-z0-9 ]/.test(ch)) pattern += ch;
    else pattern += ch.replace(/[\\^$.*+?()[\]{}|\/-]/g, '\\$&');
  }
  return new RegExp(pattern, 'i').test(String(value).toLowerCase());
}

// [case id, list, field, query, recorded result count]
const OBS = [
  ['F1-04', 'vehicles', 'name', 'an', 115],
  ['F1-05', 'vehicles', 'name', 'AN', 115],
  ['F1-06', 'vehicles', 'name', ' an', 1],
  ['F1-07', 'vehicles', 'name', 'zzqqzz', 0],
  ['F1-08', 'vehicles', 'name', 'án', 0],
  ['F1-09', 'vehicles', 'attr.ct72.value', 'huracan', 1],
  ['F1-10', 'vehicles', 'attr.ct72.value', 'Huracán', 1],
  ['F1-11', 'vehicles', 'name', 'an', 115],
  ['F1-41', 'vehicles', 'name', 'an ', 7],
  ['F1-42', 'vehicles', 'name', 'x'.repeat(128), 0],
  ['F1-43', 'vehicles', 'name', '<b>x</b>', 0],
  ['F1-W09', 'weapons', 'name', 'a', 124],
  ['F1-W10', 'weapons', 'name', 'A', 124],
];
const EXTRA = [];

let pass = 0, fail = 0, skip = 0;
const ok = (id, cond, msg) => { if (cond) { pass++; console.log(`PASS ${id} ${msg}`); } else { fail++; console.log(`FAIL ${id} ${msg}`); } };

// 1) data-free relations implied by the rule, checked against the recorded counts
const count = (id) => [...OBS, ...EXTRA].find((o) => o[0] === id)[4];
ok('F1-04/05', count('F1-04') === count('F1-05'), 'upper/lower case give the same count (rule: case-insensitive)');
ok('F1-04/06', count('F1-06') < count('F1-04'), 'leading space narrows the result (rule: query not trimmed)');
ok('F1-04/08', count('F1-08') === 0 && count('F1-04') > 0, 'accented query letter does not match the plain letter');
ok('F1-09/10', count('F1-09') === count('F1-10') && count('F1-09') > 0, 'plain query finds the accented data word, same as the accented query');
ok('F1-04/11', count('F1-11') === count('F1-04'), 'Tab (leaving the field) applies the same filter as Enter');
ok('F1-04/41', count('F1-41') < count('F1-04'), 'trailing space narrows the result (rule: query not trimmed)');
ok('F1-W09/W10', count('F1-W09') === count('F1-W10'), 'weapons name filter is case-insensitive too');
ok('rule', textMatches('huracan', 'Huracán X') && !textMatches('án', 'Plan') && textMatches('(b', 'a (b)') && !textMatches('a.c', 'abc') && !textMatches('x', undefined), 'unit checks of the plain-words rule');

// 2) replay on the saved JSON (analysis side only)
const here = dirname(fileURLToPath(import.meta.url));
const BODIES = { vehicles: '_gta_6_vehicles___84.body', weapons: '_gta_6_weapons___84.body' };
function items(list) {
  const p = join(here, '..', 'walk', 'bodies', BODIES[list]);
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, 'utf8').trim();
  const data = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
  return Object.values(data).filter((it) => String(it.access ?? '').split(',').some((g) => g === '1' || g === '9'));
}
const field = (it, f) => f.split('.').reduce((v, k) => (v == null ? undefined : v[k]), it);
for (const [id, list, f, q, observed] of [...OBS, ...EXTRA]) {
  const all = items(list);
  if (!all) { skip++; console.log(`SKIP ${id} replay (local JSON absent)`); continue; }
  const got = all.filter((it) => textMatches(q, field(it, f))).length;
  ok(id, got === observed, `replay ${f} ${JSON.stringify(q)} -> rule ${got}, recorded ${observed}`);
}
console.log(`f1-text-match: ${pass} PASS, ${fail} FAIL, ${skip} SKIP`);
process.exitCode = fail ? 1 : 0;
