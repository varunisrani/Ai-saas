// Rule F1-R1 (hash grammar). Analysis-side check: reproduces every recorded list URL hash from the
// sequence of user actions in evidence/runs/run-f1-lists.json. Run: node evidence/rules/f1-hash-grammar.mjs
//
// Rule in plain words:
// - The list state is an ordered set of key=value pairs written after "#", joined with "&".
// - On page load the pairs already in the hash are read first (only "key=value" pieces with exactly one "=").
//   If "sort" is missing it is added with the list's default field, then "sortdir" with the default direction.
// - Changing a filter sets "page" to 1 and then writes every filter field: a field with a value is set
//   (added at the end if it was not present, kept in place if it was), an emptied field is removed.
//   Several values of one field are joined with "," in the order they were picked.
// - Changing the sort field or direction only updates "sort"/"sortdir" in place (no "page").
// - When the hash is written, "page" (if present) always goes last; values are URI-component encoded
//   (space = %20, comma = %2C, non-ASCII = UTF-8 percent bytes). Unknown keys/values stay as they are.
// - A "sortdir" other than "desc" is treated (and written back) as "asc".

const DEFAULTS = {
  vehicles: { sort: 'attr.ct6.frontend_value', sortdir: 'desc', fields: ['name', 'attr.ct1.value', 'attr.ct2.value', 'attr.ct734.value', 'attr.ct72.value'] },
  weapons: { sort: 'name', sortdir: 'asc', fields: ['name', 'attr.ct55.value', 'attr.ct2.value', 'attr.ct246.value', 'attr.ct72.value'] },
};

function makeState(list, hash) {
  const d = DEFAULTS[list];
  const qs = new Map();
  for (const piece of hash.replace(/^#/, '').split('&')) {
    const nv = piece.split('=');
    if (nv.length === 2) qs.set(nv[0], decodeURIComponent(nv[1]));
  }
  if (!qs.get('sort')) qs.set('sort', d.sort);
  if (!qs.get('sortdir')) qs.set('sortdir', d.sortdir);
  qs.set('sortdir', qs.get('sortdir') === 'desc' ? 'desc' : 'asc');
  const filters = new Map(); // field -> array of values in pick order
  for (const f of d.fields) if (qs.has(f) && known(list, f, qs.get(f))) filters.set(f, restoreOrder(f, qs.get(f).split(',')));
  return { list, qs, filters, applied: filters.size > 0 };
}

// Option values that exist in the lists (config/labels observed in the runs). A hash value that is not an
// existing option is ignored: nothing is ticked, no filtering happens and the URL is left as it was.
const OPTIONS = {
  'attr.ct1.value': ['super', 'sports', 'motorcycles', 'planes', 'helicopters', 'boats'],
  'attr.ct734.value': ['hide-standouts', 'all-terrain'],
  'attr.ct2.value': ['ubermacht'],
  'attr.ct55.value': ['handguns', 'smg', 'assault-rifles', 'shotguns', 'sniper-rifles', 'melee'],
  'attr.ct246.value': ['unique-variant', 'base-weapon'],
};
function known(list, field, value) {
  if (field === 'name' || field === 'attr.ct72.value') return value !== '';
  return value.split(',').some((v) => (OPTIONS[field] ?? []).includes(v));
}
// Restored multi-values are re-ticked in the order of the options on the page (class custom order).
const restoreOrder = (field, vals) => (OPTIONS[field] ? [...vals].sort((a, b) => OPTIONS[field].indexOf(a) - OPTIONS[field].indexOf(b)) : vals);

function setQS(s, k, v) { if (v === null || v === '' || v === undefined) s.qs.delete(k); else s.qs.set(k, v); }

function writeFilters(s) {
  if (!s.qs.has('page')) s.qs.set('page', 1); else s.qs.set('page', 1);
  for (const f of DEFAULTS[s.list].fields) setQS(s, f, s.filters.has(f) ? s.filters.get(f).join(',') : null);
}

function act(s, a) {
  const [verb, field, value] = a;
  if (verb === 'set') { if (value === '' || value === null) s.filters.delete(field); else s.filters.set(field, [value]); writeFilters(s); }
  else if (verb === 'add') { const cur = s.filters.get(field) ?? []; s.filters.set(field, [...cur, value]); writeFilters(s); }
  else if (verb === 'remove') { const cur = (s.filters.get(field) ?? []).filter((v) => v !== value); if (cur.length) s.filters.set(field, cur); else s.filters.delete(field); writeFilters(s); }
  else if (verb === 'clear') { s.filters.clear(); writeFilters(s); }
  else if (verb === 'sort') s.qs.set('sort', field);
  else if (verb === 'dir') s.qs.set('sortdir', field === 'desc' ? 'desc' : 'asc');
  else throw new Error('unknown action ' + verb);
}

function hashOf(s) {
  const parts = [];
  let page = 0;
  for (const [k, v] of s.qs) { if (k === 'page') { page = v; continue; } parts.push(k + '=' + encodeURIComponent(v)); }
  if (page) parts.push('page=' + page);
  return parts.length ? '#' + parts.join('&') : '';
}

function run(list, startHash, actions) {
  const s = makeState(list, startHash);
  if (s.applied) s.qs.set('page', s.qs.get('page') ?? 1); // a filter restored from the hash keeps/sets page
  for (const a of actions) act(s, a);
  return hashOf(s);
}

// Observations: [case id, list, hash in the opened URL, user actions, observed URL hash]
const OBS = [
  ['F1-01', 'vehicles', '', [], '#sort=attr.ct6.frontend_value&sortdir=desc'],
  ['F1-04', 'vehicles', '', [['set', 'name', 'an']], '#sort=attr.ct6.frontend_value&sortdir=desc&name=an&page=1'],
  ['F1-05', 'vehicles', '', [['set', 'name', 'AN']], '#sort=attr.ct6.frontend_value&sortdir=desc&name=AN&page=1'],
  ['F1-06', 'vehicles', '', [['set', 'name', ' an']], '#sort=attr.ct6.frontend_value&sortdir=desc&name=%20an&page=1'],
  ['F1-08', 'vehicles', '', [['set', 'name', 'án']], '#sort=attr.ct6.frontend_value&sortdir=desc&name=%C3%A1n&page=1'],
  ['F1-09', 'vehicles', '', [['set', 'attr.ct72.value', 'huracan']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct72.value=huracan&page=1'],
  ['F1-10', 'vehicles', '', [['set', 'attr.ct72.value', 'Huracán']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct72.value=Hurac%C3%A1n&page=1'],
  ['F1-12', 'vehicles', '', [], '#sort=attr.ct6.frontend_value&sortdir=desc'],
  ['F1-13', 'vehicles', '', [['add', 'attr.ct1.value', 'super']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=super&page=1'],
  ['F1-14', 'vehicles', '', [['add', 'attr.ct1.value', 'super'], ['remove', 'attr.ct1.value', 'super'], ['add', 'attr.ct1.value', 'sports']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=sports&page=1'],
  ['F1-15', 'vehicles', '', [['add', 'attr.ct1.value', 'sports'], ['add', 'attr.ct1.value', 'super']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=sports%2Csuper&page=1'],
  ['F1-16', 'vehicles', '', [['add', 'attr.ct1.value', 'sports'], ['add', 'attr.ct1.value', 'super'], ['remove', 'attr.ct1.value', 'super']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=sports&page=1'],
  ['F1-17', 'vehicles', '', [['set', 'attr.ct734.value', 'hide-standouts']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct734.value=hide-standouts&page=1'],
  ['F1-18', 'vehicles', '', [['set', 'attr.ct734.value', 'hide-standouts'], ['add', 'attr.ct1.value', 'super']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct734.value=hide-standouts&attr.ct1.value=super&page=1'],
  ['F1-19', 'vehicles', '', [['set', 'attr.ct734.value', 'all-terrain']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct734.value=all-terrain&page=1'],
  ['F1-21', 'vehicles', '', [['set', 'attr.ct2.value', 'ubermacht']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct2.value=ubermacht&page=1'],
  ['F1-22', 'vehicles', '', [['sort', 'name']], '#sort=name&sortdir=desc'],
  ['F1-23', 'vehicles', '', [['sort', 'name'], ['dir', 'asc']], '#sort=name&sortdir=asc'],
  ['F1-24', 'vehicles', '', [['dir', 'asc']], '#sort=attr.ct6.frontend_value&sortdir=asc'],
  ['F1-26', 'vehicles', '', [['add', 'attr.ct1.value', 'sports'], ['dir', 'asc']], '#sort=attr.ct6.frontend_value&sortdir=asc&attr.ct1.value=sports&page=1'],
  ['F1-27', 'vehicles', '', [['sort', 'attr.ct1.frontend_value'], ['dir', 'asc']], '#sort=attr.ct1.frontend_value&sortdir=asc'],
  ['F1-28', 'vehicles', '#sort=name&sortdir=asc&attr.ct1.value=super', [], '#sort=name&sortdir=asc&attr.ct1.value=super&page=1'],
  ['F1-30', 'vehicles', '#attr.ct1.value=super,sports&attr.ct734.value=hide-standouts', [], '#attr.ct1.value=super%2Csports&attr.ct734.value=hide-standouts&sort=attr.ct6.frontend_value&sortdir=desc&page=1'],
  ['F1-31', 'vehicles', '#sort=bogus&sortdir=sideways&attr.ct1.value=nonexistent&page=3', [], '#sort=bogus&sortdir=asc&attr.ct1.value=nonexistent&page=3'],
  ['F1-34', 'vehicles', '', [['add', 'attr.ct1.value', 'super'], ['set', 'name', 'a'], ['set', 'attr.ct734.value', 'hide-standouts'], ['clear']], '#sort=attr.ct6.frontend_value&sortdir=desc&page=1'],
  ['F1-36', 'vehicles', '', [['add', 'attr.ct1.value', 'super']], '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=super&page=1'],
  ['F1-37', 'vehicles', '', [['add', 'attr.ct1.value', 'super'], ['sort', 'name']], '#sort=name&sortdir=desc&attr.ct1.value=super&page=1'],
  ['F1-41', 'vehicles', '', [['set', 'name', 'an ']], '#sort=attr.ct6.frontend_value&sortdir=desc&name=an%20&page=1'],
  ['F1-42', 'vehicles', '', [['set', 'name', 'x'.repeat(128)]], '#sort=attr.ct6.frontend_value&sortdir=desc&name=' + 'x'.repeat(128) + '&page=1'],
  ['F1-43', 'vehicles', '', [['set', 'name', '<b>x</b>']], '#sort=attr.ct6.frontend_value&sortdir=desc&name=%3Cb%3Ex%3C%2Fb%3E&page=1'],
  ['F1-44', 'vehicles', '#sort=name&sortdir=asc&page=2', [], '#sort=name&sortdir=asc&page=2'],
  ['F1-W01', 'weapons', '', [], '#sort=name&sortdir=asc'],
  ['F1-W02', 'weapons', '', [['add', 'attr.ct55.value', 'handguns']], '#sort=name&sortdir=asc&attr.ct55.value=handguns&page=1'],
  ['F1-W03', 'weapons', '', [['add', 'attr.ct55.value', 'handguns'], ['remove', 'attr.ct55.value', 'handguns'], ['add', 'attr.ct55.value', 'shotguns']], '#sort=name&sortdir=asc&attr.ct55.value=shotguns&page=1'],
  ['F1-W04', 'weapons', '', [['add', 'attr.ct55.value', 'shotguns'], ['add', 'attr.ct55.value', 'handguns']], '#sort=name&sortdir=asc&attr.ct55.value=shotguns%2Chandguns&page=1'],
  ['F1-W05', 'weapons', '', [['set', 'attr.ct246.value', 'unique-variant']], '#sort=name&sortdir=asc&attr.ct246.value=unique-variant&page=1'],
  ['F1-W06', 'weapons', '', [['sort', 'attr.ct58.frontend_value']], '#sort=attr.ct58.frontend_value&sortdir=asc'],
  ['F1-W07', 'weapons', '', [['add', 'attr.ct55.value', 'handguns'], ['sort', 'attr.ct58.frontend_value'], ['dir', 'desc']], '#sort=attr.ct58.frontend_value&sortdir=desc&attr.ct55.value=handguns&page=1'],
  ['F1-W09', 'weapons', '', [['set', 'name', 'a']], '#sort=name&sortdir=asc&name=a&page=1'],
  ['F1-W12', 'weapons', '#attr.ct55.value=handguns,shotguns&sort=attr.ct58.frontend_value&sortdir=desc', [], '#attr.ct55.value=handguns%2Cshotguns&sort=attr.ct58.frontend_value&sortdir=desc&page=1'],
  ['F1-W16', 'weapons', '', [['add', 'attr.ct55.value', 'melee'], ['clear']], '#sort=name&sortdir=asc&page=1'],
];

let pass = 0, fail = 0;
for (const [id, list, start, actions, observed] of OBS) {
  const got = run(list, start, actions);
  if (got === observed) { pass++; console.log(`PASS ${id} ${observed}`); }
  else { fail++; console.log(`FAIL ${id}\n  observed ${observed}\n  rule     ${got}`); }
}
console.log(`f1-hash-grammar: ${pass} PASS, ${fail} FAIL`);
process.exitCode = fail ? 1 : 0;
