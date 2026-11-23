// Rule F5-R2 (cascade + guest storage).
// Plain words:
//  - Ticking or unticking an item sets every copy of it on the page (same list id + item id) to the new state.
//  - The new state flows down to all sub-items (and their sub-items) that are not already in that state.
//  - Then each parent is re-checked: it is ticked when every sub-item is ticked (sub-items sharing a group
//    key need only one ticked member), unticked otherwise; a parent that changes re-checks its own parent.
//  - Guests: browser storage key "guest_checklists" holds { "<list id>": ["<item id>", ...] }. Every item
//    whose state changed is added (appended, once) or removed, in this order: the clicked item, the
//    sub-items that changed (page order), then the parents that changed. A list that becomes empty is
//    removed from the object; the object itself is always written back (so "{}" after the last untick).
//  - Several lists share the one object; the same list id on two pages is the same list.
// Observations: run-f5-checklists.json. Standalone: node f5-checklists-cascade-storage.mjs

const EXPLORATION = ['kenton', 'cards', 'waink', 'underwater', 'magazines', 'meditation', 'flamingos', 'playlists', 'styles', 'races', 'race-challenges', 'shooting', 'video-games', 'pool', 'mini-golf', 'basketball', 'drones', 'stunts', 'challenges', 'target-decks'];
const TASKS = ['optional', 'gang-ops', 'bank-jobs', 'payday', 'smash-grab', 'stick-ups', 'narcotics', 'jewelry', 'marked-bills', 'vaults', 'vehicles-fenced'];
// page order of the 100% list (each item appears twice on the page: contents box + section heading)
const ORDER = ['story', 'story-tasks', ...TASKS, 'exploration', ...EXPLORATION, 'discovery', 'vehicles', 'weapons', 'animals'];
const PARENT = {};
for (const id of TASKS) PARENT[id] = 'story-tasks';
for (const id of EXPLORATION) PARENT[id] = 'exploration';
for (const id of ['vehicles', 'weapons', 'animals']) PARENT[id] = 'discovery';
const COPIES = 2;

function makePage(listId, order, parent = {}, group = {}) {
  return { listId, order, parent, group, checked: new Set() };
}
function toggle(page, store, id) {
  const s = !page.checked.has(id);
  const changes = [[id, s]];
  const set = (x, v) => (v ? page.checked.add(x) : page.checked.delete(x));
  set(id, s);
  const down = (p, depth) => {
    if (depth <= 0) return;
    for (const c of page.order.filter((x) => page.parent[x] === p)) {
      if (page.checked.has(c) === s) continue;
      set(c, s); changes.push([c, s]); down(c, depth - 1);
    }
  };
  down(id, 10);
  let cur = id;
  while (page.parent[cur]) {
    const p = page.parent[cur];
    const kids = page.order.filter((x) => page.parent[x] === p);
    const groups = new Map();
    let all = true;
    for (const k of kids) {
      const g = page.group[k];
      if (g) groups.set(g, (groups.get(g) || false) || page.checked.has(k));
      else if (!page.checked.has(k)) all = false;
    }
    if ([...groups.values()].some((v) => !v)) all = false;
    if (all === page.checked.has(p)) break;
    set(p, all); changes.push([p, all]); cur = p;
  }
  const obj = store.value ? JSON.parse(store.value) : {};
  for (const [x, v] of changes) {
    const list = obj[page.listId] || [];
    if (v) { if (!list.includes(x)) list.push(x); obj[page.listId] = list; }
    else { const f = list.filter((y) => y !== x); if (f.length) obj[page.listId] = f; else delete obj[page.listId]; }
  }
  store.value = JSON.stringify(obj);
}
const hundred = () => makePage('gta6-100', ORDER, PARENT);
const missions = () => makePage('gta6-missions', ['6644', '7285', '7291']);

const cases = [
  ['F5-02 tick story', () => { const p = hundred(), st = {}; toggle(p, st, 'story'); return [p, st]; }, '{"gta6-100":["story"]}', 2],
  ['F5-04 tick+untick story', () => { const p = hundred(), st = {}; toggle(p, st, 'story'); toggle(p, st, 'story'); return [p, st]; }, '{}', 0],
  ['F5-06 kenton, cards', () => { const p = hundred(), st = {}; toggle(p, st, 'kenton'); toggle(p, st, 'cards'); return [p, st]; }, '{"gta6-100":["kenton","cards"]}', 4],
  ['F5-07 all exploration items one by one', () => { const p = hundred(), st = {}; for (const x of EXPLORATION) toggle(p, st, x); return [p, st]; }, JSON.stringify({ 'gta6-100': [...EXPLORATION, 'exploration'] }), 42],
  ['F5-08 tick exploration parent', () => { const p = hundred(), st = {}; toggle(p, st, 'exploration'); return [p, st]; }, JSON.stringify({ 'gta6-100': ['exploration', ...EXPLORATION] }), 42],
  ['F5-09 parent then untick drones', () => { const p = hundred(), st = {}; toggle(p, st, 'exploration'); toggle(p, st, 'drones'); return [p, st]; }, JSON.stringify({ 'gta6-100': EXPLORATION.filter((x) => x !== 'drones') }), 38],
  ['F5-10 parent twice', () => { const p = hundred(), st = {}; toggle(p, st, 'exploration'); toggle(p, st, 'exploration'); return [p, st]; }, '{}', 0],
  ['F5-11 tasks parent', () => { const p = hundred(), st = {}; toggle(p, st, 'story-tasks'); return [p, st]; }, JSON.stringify({ 'gta6-100': ['story-tasks', ...TASKS] }), 24],
  ['F5-14 four top-level parents', () => { const p = hundred(), st = {}; for (const x of ['story', 'story-tasks', 'exploration', 'discovery']) toggle(p, st, x); return [p, st]; }, JSON.stringify({ 'gta6-100': ORDER }), 76],
  ['F5-15 story + kenton', () => { const p = hundred(), st = {}; toggle(p, st, 'story'); toggle(p, st, 'kenton'); return [p, st]; }, '{"gta6-100":["story","kenton"]}', 4],
  ['F5-23 mission tick', () => { const p = missions(), st = {}; toggle(p, st, '7285'); return [p, st, 1]; }, '{"gta6-missions":["7285"]}', null],
  ['F5-26 mission then 100% list share the object', () => { const st = {}; toggle(missions(), st, '7285'); toggle(hundred(), st, 'story'); return [null, st]; }, '{"gta6-missions":["7285"],"gta6-100":["story"]}', null],
  // synthetic probe: group key -> parent ticked with one of the group
  ['S-C4 group: vehicles(grp)+animals ticks discovery', () => { const p = makePage('gta6-100', ORDER, PARENT, { vehicles: 'grp', weapons: 'grp' }); const st = {}; toggle(p, st, 'vehicles'); toggle(p, st, 'animals'); return [p, st]; }, '{"gta6-100":["vehicles","animals","discovery"]}', 6],
];

const observed = {
  'F5-02 tick story': '{"gta6-100":["story"]}',
  'F5-04 tick+untick story': '{}',
  'F5-06 kenton, cards': '{"gta6-100":["kenton","cards"]}',
  'F5-07 all exploration items one by one': '{"gta6-100":["kenton","cards","waink","underwater","magazines","meditation","flamingos","playlists","styles","races","race-challenges","shooting","video-games","pool","mini-golf","basketball","drones","stunts","challenges","target-decks","exploration"]}',
  'F5-08 tick exploration parent': '{"gta6-100":["exploration","kenton","cards","waink","underwater","magazines","meditation","flamingos","playlists","styles","races","race-challenges","shooting","video-games","pool","mini-golf","basketball","drones","stunts","challenges","target-decks"]}',
  'F5-09 parent then untick drones': '{"gta6-100":["kenton","cards","waink","underwater","magazines","meditation","flamingos","playlists","styles","races","race-challenges","shooting","video-games","pool","mini-golf","basketball","stunts","challenges","target-decks"]}',
  'F5-10 parent twice': '{}',
  'F5-11 tasks parent': '{"gta6-100":["story-tasks","optional","gang-ops","bank-jobs","payday","smash-grab","stick-ups","narcotics","jewelry","marked-bills","vaults","vehicles-fenced"]}',
  'F5-14 four top-level parents': '{"gta6-100":["story","story-tasks","optional","gang-ops","bank-jobs","payday","smash-grab","stick-ups","narcotics","jewelry","marked-bills","vaults","vehicles-fenced","exploration","kenton","cards","waink","underwater","magazines","meditation","flamingos","playlists","styles","races","race-challenges","shooting","video-games","pool","mini-golf","basketball","drones","stunts","challenges","target-decks","discovery","vehicles","weapons","animals"]}',
  'F5-15 story + kenton': '{"gta6-100":["story","kenton"]}',
  'F5-23 mission tick': '{"gta6-missions":["7285"]}',
  'F5-26 mission then 100% list share the object': '{"gta6-missions":["7285"],"gta6-100":["story"]}',
  'S-C4 group: vehicles(grp)+animals ticks discovery': '{"gta6-100":["vehicles","animals","discovery"]}',
};
// observed checked-box counts on the page (both copies counted): F5-08 42 (count:cl-box-checked),
// F5-10 0, F5-14 76, F5-15 4; F5-07/F5-09 derived from 20/19 section children + parent copies.
const observedCount = { 'F5-08 tick exploration parent': 42, 'F5-10 parent twice': 0, 'F5-14 four top-level parents': 76, 'F5-15 story + kenton': 4 };

let pass = 0, total = 0;
for (const [id, run, , ] of cases) {
  const [page, st] = run();
  total++;
  const ok = st.value === observed[id];
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: storage ${st.value}${ok ? '' : ` (observed ${observed[id]})`}`);
  if (page && observedCount[id] != null) {
    total++;
    const n = page.checked.size * COPIES;
    const ok2 = n === observedCount[id];
    if (ok2) pass++;
    console.log(`${ok2 ? 'PASS' : 'FAIL'} ${id}: checked boxes on page ${n} (observed ${observedCount[id]})`);
  }
}
console.log(`${pass}/${total} observations reproduced`);
process.exitCode = pass === total ? 0 : 1;
