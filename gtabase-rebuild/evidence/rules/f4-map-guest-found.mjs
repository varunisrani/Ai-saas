// Rule F4-R2 (guest "Found" ticks on the map: localStorage "guest_checklists" and the category counter).
// Plain words: a guest's found markers live in localStorage "guest_checklists" as a JSON object
// { "gta6-map": [marker ids as strings, in the order they were ticked] } (other checklist ids may share the
// object). Ticking adds the id (no duplicates), unticking removes it; when the map's list becomes empty the
// "gta6-map" entry is deleted, and when the whole object becomes empty the key itself is removed. In a
// "multi-spawn" category, markers with the same name (case and spaces ignored) are one collectible that can
// appear in several places: ticking one ticks all of them (the clicked one first, then the others in list
// order) and the category counter counts that name once. Nothing is sent to the server for a guest.
// Counter: "found <found> / <total>" (screen-reader text "found <found> of <total>"), where both numbers count
// distinct collectibles (same-name markers of a multi-spawn category count once).
// Observations: run-f4-map.json F4-20, F4-21, F4-22, F4-23, F4-24 (+ F4-26, F4-31, F4-34 keep the tick).
// Standalone: node f4-map-guest-found.mjs

function setFound(storageValue, id, on) {
  let obj = {};
  try { obj = storageValue ? JSON.parse(storageValue) : {}; } catch { obj = {}; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) obj = {};
  const list = Array.isArray(obj['gta6-map']) ? obj['gta6-map'].map(String) : [];
  const i = list.indexOf(String(id));
  if (on && i === -1) list.push(String(id));
  if (!on && i !== -1) list.splice(i, 1);
  if (list.length) obj['gta6-map'] = list; else delete obj['gta6-map'];
  return Object.keys(obj).length ? JSON.stringify(obj) : '<missing>';
}

// markers: [{id, name, category, multiSpawn}] (synthetic names; ids as seen in the runs)
function tick(storageValue, markers, id, on) {
  const m = markers.find((x) => x.id === id);
  const key = (x) => x.name.toLowerCase().replace(/\s+/g, ' ').trim();
  const group = m.multiSpawn ? markers.filter((x) => x.category === m.category && key(x) === key(m)) : [m];
  const order = [m, ...group.filter((x) => x !== m)];
  let v = storageValue;
  for (const x of order) v = setFound(v, x.id, on);
  return v;
}

function counter(markers, storageValue, category) {
  const found = new Set(storageValue === '<missing>' ? [] : JSON.parse(storageValue)['gta6-map']);
  const key = (x) => (x.multiSpawn ? `${x.category}|${x.name.toLowerCase().replace(/\s+/g, ' ').trim()}` : `#${x.id}`);
  const all = new Set(); const hit = new Set();
  for (const x of markers.filter((y) => y.category === category)) {
    all.add(key(x));
    if (found.has(x.id)) hit.add(key(x));
  }
  return { visible: `${hit.size}/${all.size}`, sr: `found ${hit.size} of ${all.size}` };
}

// Synthetic stand-ins for the two categories used in the runs: 5 safehouses; a multi-spawn card category with
// 9 distinct collectibles, one of which spawns twice (ids -001 and -013, as observed in F4-24).
const safehouses = [1, 2, 3, 4, 5].map((n) => ({ id: `safehouse-00${n}`, name: `Safehouse ${n}`, category: 'safehouse', multiSpawn: false }));
const wrath = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((name, i) => ({ id: `card-liberty-city-wrath-00${i + 1}`, name, category: 'card-liberty-city-wrath', multiSpawn: true }));
wrath.push({ id: 'card-liberty-city-wrath-013', name: ' a ', category: 'card-liberty-city-wrath', multiSpawn: true });
const markers = [...safehouses, ...wrath];

const obs = [];
let s = '<missing>';
obs.push(['F4-20 before any tick: counter', counter(markers, s, 'safehouse').visible, '0/5']);
s = tick(s, markers, 'safehouse-001', true);
obs.push(['F4-21 tick safehouse-001: storage', s, '{"gta6-map":["safehouse-001"]}']);
obs.push(['F4-21 counter', counter(markers, s, 'safehouse').visible, '1/5']);
obs.push(['F4-21 screen-reader counter', counter(markers, s, 'safehouse').sr, 'found 1 of 5']);
obs.push(['F4-22 after reload: storage unchanged', s, '{"gta6-map":["safehouse-001"]}']);
s = tick(s, markers, 'safehouse-001', false);
obs.push(['F4-23 untick: key removed', s, '<missing>']);
obs.push(['F4-23 counter', counter(markers, s, 'safehouse').visible, '0/5']);
let w = tick('<missing>', markers, 'card-liberty-city-wrath-001', true);
obs.push(['F4-24 multi-spawn tick: both same-name ids stored', w, '{"gta6-map":["card-liberty-city-wrath-001","card-liberty-city-wrath-013"]}']);
obs.push(['F4-24 multi-spawn counter counts the name once', counter(markers, w, 'card-liberty-city-wrath').visible, '1/9']);
// other checklists in the same object are left alone (static: store.js keeps the whole object)
obs.push(['static: other checklist ids kept', setFound('{"other-list":["7"]}', 'safehouse-001', true), '{"other-list":["7"],"gta6-map":["safehouse-001"]}']);
obs.push(['static: removing the last map id keeps other lists', setFound('{"other-list":["7"],"gta6-map":["safehouse-001"]}', 'safehouse-001', false), '{"other-list":["7"]}']);

let pass = 0;
for (const [id, got, want] of obs) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${got}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
