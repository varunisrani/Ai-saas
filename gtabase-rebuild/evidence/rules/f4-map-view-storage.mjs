// Rule F4-R7 (where the map opens: localStorage "gtab-map-view"; the address bar never follows the view).
// Plain words: after the visitor has touched the map area itself (pointer down, touch, wheel or a key inside
// the map, including its zoom buttons), every finished move/zoom writes
// { lat: <centre y, rounded to 0.1>, lng: <centre x, rounded to 0.1>, z: <zoom>, t: <time in ms> } to
// localStorage "gtab-map-view". Moves made by the page itself before any such touch (first fit, sidebar
// "show only" jumps) and anything on a one-category page are not saved. On the next visit a saved view younger
// than 60 days whose centre lies inside the map bounds is restored (zoom clamped to the allowed range);
// otherwise the map starts centred on the start marker (a safehouse) at zoom 2, or fits the whole island on a
// one-category page. A marker link (#<id>) or a shared spot (#spot=x,y) wins over the saved view. The page
// address never changes while panning or zooming.
// Observations: run-f4-map.json F4-01, F4-13, F4-16, F4-58, F4-59. Standalone: node f4-map-view-storage.mjs

const DAY = 864e5;
function save(state) {
  if (state.categoryPage || !state.touched) return '<missing>';
  const r = (n) => Math.round(10 * n) / 10;
  return JSON.stringify({ lat: r(state.center.lat), lng: r(state.center.lng), z: state.zoom, t: state.now });
}
function restore(saved, now, inBounds, minZ = 0, maxZ = 8) {
  try {
    const v = JSON.parse(saved ?? 'null');
    if (v && Number.isFinite(v.lat) && Number.isFinite(v.lng) && Number.isFinite(v.z) && now - (v.t || 0) < 60 * DAY && inBounds(v)) {
      return { lat: v.lat, lng: v.lng, z: Math.max(minZ, Math.min(maxZ, v.z)) };
    }
  } catch { /* fall through */ }
  return 'start marker, zoom 2';
}
const tileZoom = (src) => Number(/\/tiles\/in-game\/(\d+)\//.exec(src)[1]);

const T = 1795432114714; // the timestamp recorded in F4-58
const obs = [
  ['F4-01 first visit, no touch', save({ touched: false }), '<missing>'],
  ['F4-13 sidebar "show only" jump only', save({ touched: false, center: { lat: 1, lng: 2 }, zoom: 1 }), '<missing>'],
  ['F4-16 one-category page', save({ touched: true, categoryPage: true }), '<missing>'],
  ['F4-58 zoom-in button pressed', save({ touched: true, center: { lat: -5532.04, lng: -2352.01 }, zoom: 3, now: T }), '{"lat":-5532,"lng":-2352,"z":3,"t":1795432114714}'],
  ['F4-58 tiles shown at the saved zoom', String(tileZoom('/images/gta-6/maps/tiles/in-game/3/3,21,13.jpg')), '3'],
  ['F4-59 reload restores the saved view (zoom 3 tiles)', JSON.stringify(restore('{"lat":-5532,"lng":-2352,"z":3,"t":1795432114714}', T + 60000, () => true)), '{"lat":-5532,"lng":-2352,"z":3}'],
  ['static: a view older than 60 days is ignored', String(restore(`{"lat":0,"lng":0,"z":3,"t":${T - 61 * DAY}}`, T, () => true)), 'start marker, zoom 2'],
  ['static: zoom is clamped', JSON.stringify(restore(`{"lat":0,"lng":0,"z":12,"t":${T}}`, T, () => true)), '{"lat":0,"lng":0,"z":8}'],
];
// (recorded, not derived: the url readout stayed "/gta-6/map/" after the zoom in F4-58 and the reload in F4-59)

let pass = 0;
for (const [id, got, want] of obs) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${got}`);
}
const total = obs.length;
console.log(`${pass}/${total} observations reproduced`);
process.exitCode = pass === total ? 0 : 1;
