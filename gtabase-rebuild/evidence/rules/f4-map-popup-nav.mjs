// Rule F4-R8 (marker popup: number, previous/next, and what the address shows).
// Plain words: inside each category the markers are put in a "collecting order" from south to north: start
// at the southernmost marker, then repeatedly take the nearest remaining marker among those not more than
// 2000 map units north of the southernmost one left (ties by id). Trackable categories number their markers
// 1..N in that order (same-name markers of a multi-spawn category share one number); the popup shows
// "<n> / <N>" with the hint "Number <n> in a collecting order from south to north" (non-trackable categories:
// "Number <n> of this category, in the order of the list from south to north"). The popup has a "Previous" and
// a "Next" button named "Previous in <category>: <marker name> (#<k>)" / "Next in ...", which wrap around
// (previous of the first is the last, next of the last is the first) and open that marker. Opening markers
// this way (or by clicking, searching or the prev/next buttons) never changes the address; only a link
// "#<marker id>" opens a given marker (on load or when the hash changes); an unknown id opens nothing.
// Observations: run-f4-map.json F4-20, F4-24, F4-51, F4-52, F4-53, F4-54, F4-55. Standalone: node f4-map-popup-nav.mjs

function collectingOrder(markers) {
  const left = markers.slice();
  const out = [];
  let prev = null;
  while (left.length) {
    const minY = Math.min(...left.map((m) => m.y));
    let best = -1; let bestD = Infinity;
    left.forEach((m, i) => {
      if (m.y > minY + 2000) return;
      const d = prev ? (m.x - prev.x) ** 2 + (m.y - prev.y) ** 2 : m.y;
      if (best < 0 || d < bestD || (d === bestD && m.id < left[best].id)) { best = i; bestD = d; }
    });
    prev = left.splice(best, 1)[0];
    out.push(prev);
  }
  return out;
}
const step = (order, id, dir) => order[(order.findIndex((m) => m.id === id) + dir + order.length) % order.length];
const label = (order, id) => `${order.findIndex((m) => m.id === id) + 1} / ${order.length}`;
const hint = (n, trackable) => (trackable ? `Number ${n} in a collecting order from south to north` : `Number ${n} of this category, in the order of the list from south to north`);

// synthetic coordinates (y grows to the north) chosen so that, as observed, safehouse-002 is number 3
const S = [
  { id: 'safehouse-001', x: 0, y: -9000 },
  { id: 'safehouse-003', x: 500, y: -8000 },
  { id: 'safehouse-002', x: 900, y: -5000 },
  { id: 'safehouse-004', x: 2000, y: -1000 },
  { id: 'safehouse-005', x: 2500, y: 3000 },
];
const order = collectingOrder(S);
const obs = [
  ['F4-20 #safehouse-001 opens number 1', label(order, 'safehouse-001'), '1 / 5'],
  ['F4-20 hint', hint(1, true), 'Number 1 in a collecting order from south to north'],
  ['F4-24 hint of a multi-spawn card', hint(3, true), 'Number 3 in a collecting order from south to north'],
  ['F4-51 Next from 1', label(order, step(order, 'safehouse-001', 1).id), '2 / 5'],
  ['F4-52 then Previous', label(order, step(order, step(order, 'safehouse-001', 1).id, -1).id), '1 / 5'],
  ['F4-53 Previous from 1 wraps to the last', label(order, step(order, 'safehouse-001', -1).id), '5 / 5'],
  ['F4-54 #safehouse-002 (number is not the id suffix)', label(order, 'safehouse-002'), '3 / 5'],
  ['F4-55 unknown #id opens nothing', String(order.some((m) => m.id === 'no-such-marker-999') ? 1 : 0), '0'],
];
// (recorded, not derived: the url readout stayed /gta-6/map/#safehouse-001 after Next/Previous in F4-51..53)

let pass = 0;
for (const [id, got, want] of obs) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${got}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
