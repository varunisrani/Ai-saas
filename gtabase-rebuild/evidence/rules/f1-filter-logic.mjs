// Rule F1-R3 (filter combination + option counts). Analysis-side check against the recorded runs.
// Run: node evidence/rules/f1-filter-logic.mjs
//
// Rule in plain words:
// - Options of a choice filter (class checkboxes, manufacturer / standout set / weapon type dropdowns) are
//   the distinct values present in the data (empty and "N/A" skipped). Each option label is
//   "<label> (<n>)". The dropdowns have one extra first entry "Select <filter title>".
// - Several picked options of the same filter combine with OR (union); different filters combine with AND
//   (intersection). A text filter is one more AND condition.
// - Option counts are live:
//     * no filter active: n = all items having that option;
//     * a filter that is the ONLY active filter keeps its full counts;
//     * a filter that is active together with others counts within the result of the OTHER filters;
//     * a filter that is not active counts within the current result.
//   An option whose count is 0 stays visible (it is only marked empty).
// - The result counter shows the number of matching items; "Standout" badges appear on vehicles whose
//   standout set is a real set (not the "hide-standouts" pseudo value).
// Replay on the locally saved JSON (git-ignored, analysis side) when present; relations always checked.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FOLD = { a: 'aáàảãạăắằẵặâấầẩẫậäåæ', o: 'oóòỏõọơớờởợỡôốồổỗộöø', u: 'uúùủũụưứừửựữûü', y: 'yýỳỷỹỵÿ', i: 'iíìỉĩịîïı', e: 'eéèẻẽẹêếềễệểë', c: 'cç', d: 'dđ', n: 'nñ', g: 'gğ', s: 'sş' };
function textMatches(q, v) {
  if (v === undefined || v === null || v === '') return false;
  let p = '';
  for (const ch of q.toLowerCase()) p += FOLD[ch] ? `[${FOLD[ch]}]` : /[a-z0-9 ]/.test(ch) ? ch : ch.replace(/[\\^$.*+?()[\]{}|\/-]/g, '\\$&');
  return new RegExp(p, 'i').test(String(v).toLowerCase());
}

const CHOICE = { vehicles: ['attr.ct1.value', 'attr.ct2.value', 'attr.ct734.value'], weapons: ['attr.ct55.value', 'attr.ct2.value', 'attr.ct246.value'] };
const field = (it, f) => f.split('.').reduce((v, k) => (v == null ? undefined : v[k]), it);
const values = (it, f) => [].concat(field(it, f) ?? []).filter((v) => v && v !== 'N/A');

/** state: { fieldName: [picked option values] | "text query" } -> { ids, counts(field, option) } */
function evaluate(all, list, state) {
  const sets = {};
  for (const [f, sel] of Object.entries(state)) {
    if (Array.isArray(sel)) sets[f] = new Set(all.filter((it) => values(it, f).some((v) => sel.includes(v))).map((it) => it.id));
    else sets[f] = new Set(all.filter((it) => textMatches(sel, field(it, f))).map((it) => it.id));
  }
  const inter = (fs) => all.filter((it) => fs.every((f) => sets[f].has(it.id)));
  const active = Object.keys(sets);
  const result = inter(active);
  const counts = (f, option) => {
    let pool;
    if (!active.length) pool = all;
    else if (active.includes(f)) pool = active.length === 1 ? all : inter(active.filter((x) => x !== f));
    else pool = result;
    return pool.filter((it) => values(it, f).includes(option)).length;
  };
  const options = (f) => new Set(all.flatMap((it) => values(it, f)));
  return { result, counts, options };
}

// Recorded observations: [case, list, state, { count, labels: {"field|option": n}, badges, options: {field: n} }]
const OBS = [
  ['F1-01', 'vehicles', {}, { count: 590, options: { 'attr.ct1.value': 21 } }],
  ['F1-07', 'vehicles', { name: 'zzqqzz' }, { count: 0, labels: { 'attr.ct1.value|super': 0, 'attr.ct1.value|sports': 0 }, zeroOptions: { 'attr.ct1.value': 21 } }],
  ['F1-13', 'vehicles', { 'attr.ct1.value': ['super'] }, { count: 29, labels: { 'attr.ct1.value|super': 29, 'attr.ct1.value|sports': 23 }, badges: 20 }],
  ['F1-14', 'vehicles', { 'attr.ct1.value': ['sports'] }, { count: 23 }],
  ['F1-15', 'vehicles', { 'attr.ct1.value': ['sports', 'super'] }, { count: 52, labels: { 'attr.ct1.value|super': 29, 'attr.ct1.value|sports': 23 } }],
  ['F1-16', 'vehicles', { 'attr.ct1.value': ['sports'] }, { count: 23 }],
  ['F1-17', 'vehicles', { 'attr.ct734.value': ['hide-standouts'] }, { count: 319, labels: { 'attr.ct734.value|hide-standouts': 319, 'attr.ct1.value|super': 9, 'attr.ct1.value|sports': 13 } }],
  ['F1-18', 'vehicles', { 'attr.ct734.value': ['hide-standouts'], 'attr.ct1.value': ['super'] }, { count: 9, badges: 0, labels: { 'attr.ct1.value|super': 9, 'attr.ct1.value|sports': 13, 'attr.ct734.value|hide-standouts': 9, 'attr.ct734.value|all-terrain': 0 } }],
  ['F1-19', 'vehicles', { 'attr.ct734.value': ['all-terrain'] }, { count: 16, badges: 16, labels: { 'attr.ct734.value|hide-standouts': 319 } }],
  ['F1-21', 'vehicles', { 'attr.ct2.value': ['ubermacht'] }, { count: 11, options: { 'attr.ct2.value': 74 } }],
  ['F1-30', 'vehicles', { 'attr.ct1.value': ['super', 'sports'], 'attr.ct734.value': ['hide-standouts'] }, { count: 22, badges: 0 }],
  ['F1-36', 'vehicles', { 'attr.ct1.value': ['super'] }, { count: 29 }],
  ['F1-W01', 'weapons', {}, { count: 211, options: { 'attr.ct55.value': 10, 'attr.ct246.value': 2 }, labels: { 'attr.ct55.value|handguns': 55, 'attr.ct246.value|base-weapon': 84, 'attr.ct246.value|unique-variant': 127 } }],
  ['F1-W02', 'weapons', { 'attr.ct55.value': ['handguns'] }, { count: 55, labels: { 'attr.ct55.value|handguns': 55, 'attr.ct55.value|shotguns': 30 } }],
  ['F1-W03', 'weapons', { 'attr.ct55.value': ['shotguns'] }, { count: 30 }],
  ['F1-W04', 'weapons', { 'attr.ct55.value': ['shotguns', 'handguns'] }, { count: 85 }],
  ['F1-W05', 'weapons', { 'attr.ct246.value': ['unique-variant'] }, { count: 127, labels: { 'attr.ct55.value|handguns': 41 } }],
  ['F1-W12', 'weapons', { 'attr.ct55.value': ['handguns', 'shotguns'] }, { count: 85 }],
  ['F1-W16', 'weapons', {}, { count: 211, labels: { 'attr.ct55.value|melee': 27 } }],
];

let pass = 0, fail = 0, skip = 0;
const ok = (id, cond, msg) => { if (cond) { pass++; console.log(`PASS ${id} ${msg}`); } else { fail++; console.log(`FAIL ${id} ${msg}`); } };
const rec = (id) => OBS.find((o) => o[0] === id)[3];

// 1) data-free relations between recorded observations
ok('F1-13/14/15', rec('F1-15').count >= Math.max(rec('F1-13').count, rec('F1-14').count) && rec('F1-15').count <= rec('F1-13').count + rec('F1-14').count, 'two classes = OR: count between max and sum of the single-class counts');
ok('F1-17/18', rec('F1-18').count <= Math.min(rec('F1-17').count, rec('F1-13').count), 'class AND standout filter: count <= each single filter');
ok('F1-17/18', rec('F1-17').labels['attr.ct1.value|super'] === rec('F1-18').count, 'label "Super (n)" under Hide Standouts predicts the AND result before clicking');
ok('F1-13/14', rec('F1-13').labels['attr.ct1.value|sports'] === rec('F1-14').count, 'own-group labels keep full counts when the group is the only active filter');
ok('F1-18/17', rec('F1-18').labels['attr.ct1.value|sports'] === rec('F1-17').labels['attr.ct1.value|sports'], 'active group with another active filter counts within the OTHER filter only');
ok('F1-19', rec('F1-19').labels['attr.ct734.value|hide-standouts'] === rec('F1-17').count, 'standout set as only filter keeps full option counts');
ok('F1-W02/03/04', rec('F1-W04').count === rec('F1-W02').count + rec('F1-W03').count, 'weapons: two classes = OR (disjoint classes add up)');
ok('F1-W04/W12', rec('F1-W04').count === rec('F1-W12').count, 'same two classes picked by Ctrl+click or restored from a link give the same result');

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
for (const [id, list, state, exp] of OBS) {
  const all = items(list);
  if (!all) { skip++; console.log(`SKIP ${id} replay (local JSON absent)`); continue; }
  const { result, counts, options } = evaluate(all, list, state);
  const parts = [];
  let good = result.length === exp.count; parts.push(`count ${result.length}/${exp.count}`);
  for (const [k, n] of Object.entries(exp.labels ?? {})) { const [f, o] = k.split('|'); const c = counts(f, o); good &&= c === n; parts.push(`${o} (${c}/${n})`); }
  for (const [f, n] of Object.entries(exp.options ?? {})) { const c = options(f).size; good &&= c === n; parts.push(`${f} options ${c}/${n}`); }
  for (const [f, n] of Object.entries(exp.zeroOptions ?? {})) { const c = [...options(f)].filter((o) => counts(f, o) === 0).length; good &&= c === n; parts.push(`${f} zero-count options ${c}/${n}`); }
  if (exp.badges !== undefined) { const shown = result.slice(0, 100); const c = shown.filter((it) => values(it, 'attr.ct734.value').some((v) => v !== 'hide-standouts')).length; good &&= c === exp.badges; parts.push(`badges ${c}/${exp.badges}`); }
  ok(id, good, `replay ${JSON.stringify(state)}: ${parts.join(', ')}`);
}
console.log(`f1-filter-logic: ${pass} PASS, ${fail} FAIL, ${skip} SKIP`);
process.exitCode = fail ? 1 : 0;
