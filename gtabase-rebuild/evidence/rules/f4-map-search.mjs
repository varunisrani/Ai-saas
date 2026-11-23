// Rule F4-R6 (sidebar search box: matching, messages, cap).
// Plain words: the query and every marker/category text are normalised the same way: lower case, accents
// removed, "&" read as " and ", apostrophes dropped, every other run of non-letters/digits becomes one space,
// trimmed. An empty normalised query (e.g. only spaces) shows nothing and restores all category rows.
// Markers match when (score 4) the name contains the query (or the query without spaces is in the name without
// spaces), (3) the "category name + number" contains it, (2) every query word is in name/category text or is
// within a small typo distance of one of its words (words of 4-7 letters: 1 edit, 8+ letters: 2 edits; adjacent
// swaps count as one edit; a longer word may also match by its prefix), (1) every query word is in the
// description. Results: best score first, then category order, then number; at most 30 options are listed and
// the line "<rest> more, type a bit more of the name." is shown under them. No marker: the line
// 'No marker matches "<query as typed, trimmed>".' The same query also filters the category rows (group or
// category name match; typo tolerance 1 edit from 5 letters, 2 from 8) and shows 'No category matches "<query>".'
// when none is left. Text is shown as text (an HTML-looking query is not rendered).
// Observations: run-f4-map.json F4-35, 38, 39, 40, 41, 42, 43, 44, 45. Standalone: node f4-map-search.mjs

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// restricted Damerau-Levenshtein (adjacent swap = 1), as in the typo rule
function dist(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
const markerTolerance = (w) => (w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0);
const categoryTolerance = (w) => (w.length >= 8 ? 2 : w.length >= 5 ? 1 : 0);
const wordMatches = (q, word, tol) => {
  const t = tol(q);
  return t > 0 && (dist(q, word) <= t || (word.length > q.length && dist(q, word.slice(0, q.length)) <= t));
};

function messages(raw, hitCount, categoryRowsLeft) {
  const q = norm(raw);
  if (!q) return { list: 0, line: null, catLine: null };
  const shown = Math.min(30, hitCount);
  const line = hitCount === 0 ? `No marker matches "${raw.trim()}".` : hitCount > 30 ? `${hitCount - 30} more, type a bit more of the name.` : null;
  const catLine = categoryRowsLeft === 0 ? `No category matches "${raw.trim()}".` : null;
  return { list: shown, line, catLine };
}

const obs = [
  // [id, computed, observed]
  ['F4-39 no match: marker line', messages('zzqxv', 0, 0).line, 'No marker matches "zzqxv".'],
  ['F4-39 no match: category line', messages('zzqxv', 0, 0).catLine, 'No category matches "zzqxv".'],
  ['F4-41 HTML-like query shown as text', messages('<b>zzqxv</b>', 0, 0).line, 'No marker matches "<b>zzqxv</b>".'],
  ['F4-41 HTML-like query normalises to words', norm('<b>zzqxv</b>'), 'b zzqxv b'],
  ['F4-42 spaces only: nothing listed', String(messages('   ', 0, 102).list), '0'],
  ['F4-42 spaces only: no message', String(messages('   ', 0, 102).line), 'null'],
  ['F4-43 "card": 582 hits -> 30 listed', String(messages('card', 582, 19).list), '30'],
  ['F4-43 "card": rest line', messages('card', 582, 19).line, '552 more, type a bit more of the name.'],
  ['F4-45 case and outer spaces ignored', norm('  SAFEHOUSE  '), norm('safehouse')],
  ['F4-40 typo "safehuose" (adjacent swap) reaches "safehouse"', String(wordMatches('safehuose', 'safehouse', markerTolerance)), 'true'],
  ['F4-40 typo also reaches the category word "safehouses" by prefix', String(wordMatches('safehuose', 'safehouses', categoryTolerance)), 'true'],
  ['F4-39 "zzqxv" reaches nothing like "bank"', String(wordMatches('zzqxv', 'bank', markerTolerance)), 'false'],
  ['static: 3-letter words get no typo tolerance', String(wordMatches('bnk', 'bank', markerTolerance)), 'false'],
  ['static: "&" reads as "and"', norm("Food & Drink"), 'food and drink'],
  ['static: accents and apostrophes', norm("Smash 'n' Grabs Café"), 'smash n grabs cafe'],
];

let pass = 0;
for (const [id, got, want] of obs) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${got}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
