// Rule F1-R4 (sort order). Analysis-side check against the recorded runs.
// Run: node evidence/rules/f1-sort-order.mjs
//
// Rule in plain words (comparing two items A and B on the chosen sort field):
// - Multi-valued fields (class, seats) are compared as their values joined with a space (values first
//   sorted alphabetically). Class sorts by its display label (alphabetical: "Boats" first ascending), NOT by
//   the custom order used for the class checkboxes.
// - Equal values: ordered by name (natural, case- and accent-insensitive), in the chosen direction.
// - Both values numeric: numeric comparison.
// - Both non-empty text: compared character by character (first differing character decides, using a
//   locale-aware single-character comparison); if one is a prefix of the other, the longer one is larger.
// - An empty/missing value always sorts AFTER every non-empty value, in both directions.
// - Descending reverses every comparison except the "empty last" rule.
// - Changing the sort field keeps the current direction; the direction button flips it.
// Replay on the locally saved JSON (git-ignored, analysis side) when present; relations always checked.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const field = (it, f) => f.split('.').reduce((v, k) => (v == null ? undefined : v[k]), it);
const isNum = (v) => v !== '' && v !== undefined && !Number.isNaN(Number(v));
function sortValue(it, f) {
  const v = field(it, f);
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? [...v].sort().join(' ') : v;
}
export function compare(a, b, f, dir) {
  const d = dir === 'desc' ? -1 : 1;
  const v1 = sortValue(a, f), v2 = sortValue(b, f);
  // eslint-disable-next-line eqeqeq
  if (v1 == v2) return String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' }) * d;
  if (isNum(v1) && isNum(v2)) return Number(v1) > Number(v2) ? d : -d;
  if (v1 && v2) {
    const c1 = String(v1).split(''), c2 = String(v2).split('');
    for (let i = 0; i < Math.min(c1.length, c2.length); i++) if (c1[i] !== c2[i]) return c1[i].localeCompare(c2[i]) > 0 ? d : -d;
    return c1.join(',') > c2.join(',') ? d : -d;
  }
  if (!v1) return 1;
  return -1;
}

const FIELD = { name: 'name', speed: 'attr.ct6.frontend_value', class: 'attr.ct1.frontend_value', damage: 'attr.ct58.frontend_value', wclass: 'attr.ct55.frontend_value', bogus: 'bogus' };
const DEFAULT = { vehicles: ['speed', 'desc'], weapons: ['name', 'asc'] };
const shown = { name: (it) => String(it.name).toUpperCase(), speed: (it) => (field(it, 'attr.ct6.value') ? field(it, 'attr.ct6.frontend_value') + '/10' : 'unknown'), class: (it) => [].concat(field(it, 'attr.ct1.frontend_value') ?? []).join(', ').toUpperCase(), damage: (it) => (field(it, 'attr.ct58.value') ? field(it, 'attr.ct58.frontend_value') + '/10' : 'none') };

// [case, list, filter {field: [values]}, sort key, direction, display, [first, second, last?] as shown on
//  cards, extra {start: first rendered position, badges: {kind: n in the first 100 shown}, lastClass: recorded class of the last stat bar}]
const OBS = [
  ['F1-22', 'vehicles', {}, 'name', 'desc', 'name', ['ZORRUSSO', 'ZOMBIE BOBBER']],
  ['F1-23', 'vehicles', {}, 'name', 'asc', 'name', ['015A', '020']],
  ['F1-24', 'vehicles', {}, 'speed', 'asc', 'speed', ['0.2/10', '0.2/10']],
  ['F1-25', 'vehicles', { 'attr.ct1.value': ['sports'] }, 'speed', 'desc', 'speed', ['8.5/10', '8.2/10', 'unknown'], { lastClass: 'field-entry stat-bar speed unknown' }],
  ['F1-26', 'vehicles', { 'attr.ct1.value': ['sports'] }, 'speed', 'asc', 'speed', ['4.7/10', '4.9/10', 'unknown'], { lastClass: 'field-entry stat-bar speed unknown' }],
  ['F1-27', 'vehicles', {}, 'class', 'asc', 'class', ['BOATS', 'BOATS']],
  ['F1-28', 'vehicles', { 'attr.ct1.value': ['super'] }, 'name', 'asc', 'name', ["ANDREW NODE'S THRAX", 'BIG CAT FURIA']],
  ['F1-38', 'vehicles', {}, 'speed', 'desc', 'name', ["ANDREW NODE'S THRAX"], { badges: { standout: 67 } }],
  ['F1-44', 'vehicles', {}, 'name', 'asc', 'name', ["BUFFALO '19", 'BUFFALO POLICE CRUISER'], { start: 100 }],
  ['F1-W01', 'weapons', {}, 'name', 'asc', 'name', ['.38', '1922']],
  ['F1-W06', 'weapons', {}, 'damage', 'asc', 'damage', ['1.5/10', '1.5/10']],
  ['F1-W07', 'weapons', { 'attr.ct55.value': ['handguns'] }, 'damage', 'desc', 'damage', ['7/10', '7/10', 'none'], { lastBars: 0 }],
  ['F1-W08', 'weapons', { 'attr.ct55.value': ['handguns'] }, 'damage', 'asc', 'damage', ['2.2/10', '2.2/10', 'none'], { lastBars: 0 }],
  ['F1-W12', 'weapons', { 'attr.ct55.value': ['handguns', 'shotguns'] }, 'damage', 'desc', 'damage', ['8/10', '8/10']],
  ['F1-W15', 'weapons', {}, 'name', 'asc', 'name', ['.38'], { badges: { unique: 59, price: 35 } }],
];

let pass = 0, fail = 0, skip = 0;
const ok = (id, cond, msg) => { if (cond) { pass++; console.log(`PASS ${id} ${msg}`); } else { fail++; console.log(`FAIL ${id} ${msg}`); } };

// 1) data-free relations: the recorded neighbours are in the order the comparator demands
const num = (s) => Number(String(s).replace('/10', ''));
for (const [id, , , key, dir, disp, exp, extra = {}] of OBS) {
  if (exp[2] === 'unknown') ok(id, /\bunknown\b/.test(extra.lastClass ?? ''), `last card's ${key} bar is marked unknown (empty sorts last, ${dir})`);
  if (exp[2] === 'none') ok(id, extra.lastBars === 0, `last card has no ${key} bar (empty sorts last, ${dir})`);
  if (exp.length < 2 || disp !== key) continue;
  const [x, y] = exp;
  let good;
  if (key === 'name' || key === 'class') good = compare({ name: x, v: x }, { name: y, v: y }, 'v', dir) <= 0;
  else good = dir === 'asc' ? num(x) <= num(y) : num(x) >= num(y);
  ok(id, good, `first two cards ${JSON.stringify([x, y])} are in ${dir} order`);
}

// 2) replay on the saved JSON
const here = dirname(fileURLToPath(import.meta.url));
const BODIES = { vehicles: '_gta_6_vehicles___84.body', weapons: '_gta_6_weapons___84.body' };
const cache = {};
function items(list) {
  if (list in cache) return cache[list];
  const p = join(here, '..', 'walk', 'bodies', BODIES[list]);
  if (!existsSync(p)) return (cache[list] = null);
  const raw = readFileSync(p, 'utf8').trim();
  const data = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
  return (cache[list] = Object.values(data).filter((it) => String(it.access ?? '').split(',').some((g) => g === '1' || g === '9')));
}
const BADGE = {
  standout: (it) => [].concat(field(it, 'attr.ct734.value') ?? []).some((v) => v !== 'hide-standouts'),
  unique: (it) => [].concat(field(it, 'attr.ct246.value') ?? []).includes('unique-variant'),
  price: (it) => Boolean(field(it, 'attr.ct57.value')),
};
for (const [id, list, filter, key, dir, disp, exp, extra = {}] of OBS) {
  const all = items(list);
  if (!all) { skip++; console.log(`SKIP ${id} replay (local JSON absent)`); continue; }
  // the page sorts once with the default field (then default direction), then with the user's choice
  const ids = [...all];
  const [dk, dd] = DEFAULT[list];
  ids.sort((a, b) => compare(a, b, FIELD[dk], 'desc'));
  ids.sort((a, b) => compare(a, b, FIELD[dk], dd));
  ids.sort((a, b) => compare(a, b, FIELD[key], dir));
  const result = ids.filter((it) => Object.entries(filter).every(([f, sel]) => [].concat(field(it, f) ?? []).some((v) => sel.includes(v))));
  const at = extra.start ?? 0; // a page=N link starts the first render at item (N-1)*100
  const got = [shown[disp](result[at]), shown[disp](result[at + 1])];
  if (exp.length > 2) got.push(shown[disp](result[result.length - 1]));
  const want = exp.length === 1 ? [exp[0]] : exp;
  let good = JSON.stringify(got.slice(0, want.length)) === JSON.stringify(want);
  const notes = [];
  for (const [kind, n] of Object.entries(extra.badges ?? {})) { const c = result.slice(0, 100).filter(BADGE[kind]).length; good &&= c === n; notes.push(`${kind} badges ${c}/${n}`); }
  ok(id, good, `replay ${key} ${dir} ${JSON.stringify(filter)}${at ? ' from position ' + (at + 1) : ''} -> ${JSON.stringify(got.slice(0, want.length))} ${notes.join(', ')}`);
}
console.log(`f1-sort-order: ${pass} PASS, ${fail} FAIL, ${skip} SKIP`);
process.exitCode = fail ? 1 : 0;
