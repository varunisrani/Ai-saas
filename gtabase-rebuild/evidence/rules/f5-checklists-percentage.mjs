// Rule F5-R1 (percentage): the completion percentage is a weighted sum over the ticked requirements.
// Plain words:
//  - Only requirements without a parent are summed at the top level.
//  - A top-level requirement without sub-items counts its own weight (percentage x multiplier, multiplier
//    defaults to 1) when ticked.
//  - A requirement with sub-items counts the sum of its ticked sub-items' shares, capped at its "limit"
//    when it has one. A sub-item's share is its own weight when it has one; otherwise the parent's weight
//    is split over the sub-items in proportion to their multipliers (sub-items that share a group key count
//    as one slot). Sub-items with their own sub-items recurse with their share as the parent weight.
//  - Each requirement (or group key) is counted at most once even if it appears several times on the page.
// Observations: run-f5-checklists.json (F5-01..F5-21) on the live 100% page, plus the synthetic-attribute
// probe (S-*) that changed weights in the live page so the site's own script computed them.
// Standalone: node f5-checklists-percentage.mjs

// Structure of the live 100% page (gta6-100): id -> { parent, pct, limit, mult, group }
const base = () => {
  const items = {
    story: { pct: 50 },
    'story-tasks': { limit: 27 },
    exploration: { pct: 20 },
    discovery: { pct: 3 },
  };
  const tasks = { optional: 6, 'gang-ops': 3, 'bank-jobs': 2, payday: 2, 'smash-grab': 2, 'stick-ups': 2, narcotics: 2, jewelry: 2, 'marked-bills': 2, vaults: 2, 'vehicles-fenced': 2 };
  for (const [id, pct] of Object.entries(tasks)) items[id] = { parent: 'story-tasks', pct };
  for (const id of ['kenton', 'cards', 'waink', 'underwater', 'magazines', 'meditation', 'flamingos', 'playlists', 'styles', 'races', 'race-challenges', 'shooting', 'video-games', 'pool', 'mini-golf', 'basketball', 'drones', 'stunts', 'challenges', 'target-decks']) items[id] = { parent: 'exploration' };
  for (const id of ['vehicles', 'weapons', 'animals']) items[id] = { parent: 'discovery' };
  return items;
};
const EXPLORATION = Object.entries(base()).filter(([, v]) => v.parent === 'exploration').map(([k]) => k);
const TASKS = Object.entries(base()).filter(([, v]) => v.parent === 'story-tasks').map(([k]) => k);

function percentage(items, ticked) {
  const on = new Set(ticked);
  const counted = new Set();
  const kids = (id) => Object.keys(items).filter((k) => items[k].parent === id);
  const mult = (id) => items[id].mult ?? 1;
  const key = (id) => items[id].group ?? id;
  function share(id, override) {
    let own = items[id].pct != null ? items[id].pct * mult(id) : 0;
    if (override) own = override;
    const slots = new Set();
    let n = 0;
    for (const c of kids(id)) if (!slots.has(key(c))) { slots.add(key(c)); n += mult(c); }
    let sum = 0;
    for (const c of kids(id)) {
      const w = items[c].pct != null ? items[c].pct * mult(c) : own ? (own / n) * mult(c) : 0;
      if (kids(c).length) { sum += share(c, w); continue; }
      if (on.has(c) && !counted.has(key(c))) { counted.add(key(c)); sum += w; }
    }
    return sum;
  }
  let total = 0;
  for (const id of Object.keys(items).filter((k) => !items[k].parent)) {
    if (!kids(id).length) {
      if (on.has(id) && !counted.has(key(id))) { counted.add(key(id)); total += items[id].pct * mult(id); }
    } else {
      let s = share(id, null);
      if (items[id].limit != null) s = Math.min(s, items[id].limit);
      total += s;
    }
  }
  return total;
}
const display = (v) => Math.min(100, Math.max(0, v)).toFixed(2);

const obs = [
  // [observation id, ticked ids after the case, page modifications, observed text]
  ['F5-01 nothing ticked', [], null, '0.00'],
  ['F5-02 story', ['story'], null, '50.00'],
  ['F5-05 one exploration item', ['kenton'], null, '1.00'],
  ['F5-06 two exploration items', ['kenton', 'cards'], null, '2.00'],
  ['F5-07 all 20 exploration items (parent auto-ticked)', [...EXPLORATION, 'exploration'], null, '20.00'],
  ['F5-09 exploration minus drones', EXPLORATION.filter((x) => x !== 'drones'), null, '19.00'],
  ['F5-11 tasks parent ticks 11 tasks (limit 27)', ['story-tasks', ...TASKS], null, '27.00'],
  ['F5-12 optional+gang-ops+bank-jobs', ['optional', 'gang-ops', 'bank-jobs'], null, '11.00'],
  ['F5-13 vehicles+weapons (discovery 3 over 3 items)', ['vehicles', 'weapons'], null, '2.00'],
  ['F5-14 everything', Object.keys(base()), null, '100.00'],
  ['F5-15 story+kenton after reload', ['story', 'kenton'], null, '51.00'],
  // synthetic-attribute probe on the live page (S-*), filled from probe output
  ['S-A1 kenton multiplier 3', ['kenton'], (it) => { it.kenton.mult = 3; }, '2.73'],
  ['S-A2 kenton x3 + cards', ['kenton', 'cards'], (it) => { it.kenton.mult = 3; }, '3.64'],
  ['S-B1 optional 6 under tasks limit 5', ['optional'], (it) => { it['story-tasks'].limit = 5; }, '5.00'],
  ['S-C1 vehicles in group grp', ['vehicles'], (it) => { it.vehicles.group = 'grp'; it.weapons.group = 'grp'; }, '1.50'],
  ['S-C2 vehicles+weapons same group', ['vehicles', 'weapons'], (it) => { it.vehicles.group = 'grp'; it.weapons.group = 'grp'; }, '1.50'],
  ['S-C4 vehicles(grp)+animals, parent ticked', ['vehicles', 'animals', 'discovery'], (it) => { it.vehicles.group = 'grp'; it.weapons.group = 'grp'; }, '3.00'],
  ['S-D1 story worth 150 is shown as 100', ['story'], (it) => { it.story.pct = 150; }, '100.00'],
  ['S-E1 story worth 12.345 rounds to 2 decimals', ['story'], (it) => { it.story.pct = 12.345; }, '12.35'],
];

let pass = 0;
for (const [id, ticked, mod, want] of obs) {
  const items = base();
  if (mod) mod(items);
  const got = display(percentage(items, ticked));
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: expected ${want}, rule gives ${got}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
