// Rule F4-R4 (category deep links: ?feature=<key> and the address bar).
// Plain words: every category has a link key: its slug when it has one (lower-case words joined by single
// hyphens), otherwise its id. Category names in the sidebar and the category line in a marker popup link to
// "<map path>?feature=<key>". Opening that address gives a one-category page: the server puts the category on
// the map element (data-gtab-category = the category id), gives the page its own title
// "All GTA 6 <Category> Locations (<count>) | Interactive Map" and heading "GTA 6 <Category> Locations Map", and only
// that category is switched on. A key that is not a category's link key (e.g. the id of a category that has a
// slug, or an unknown word) gives the normal map. Inside the map, "Only" (or the arrow) on a category replaces
// the address with "?feature=<key>" (no reload, no new history entry); as soon as the visible set is no longer
// exactly that one category ("All", another switch) the "?feature" part is removed again. Panning, zooming and
// opening markers never change the address.
// Observations: run-f4-map.json F4-02, 11, 12, 13, 14, 16, 17, 18, 19, 20. Standalone: node f4-map-feature-url.mjs

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const linkKey = (c) => (typeof c.slug === 'string' && KEY_RE.test(c.slug) ? c.slug : c.id);
const href = (path, c) => `${path}?feature=${encodeURIComponent(linkKey(c))}`;
// categories as configured (name, id, slug) - config, not marker data
const cats = [
  { id: 'bank', name: 'Bank' },
  { id: 'garage', name: 'Garage', slug: 'garages' },
  { id: 'safehouse', name: 'Safehouse', slug: 'safehouses' },
  { id: 'hidden-package', name: 'Hidden Package', slug: 'hidden-packages' },
];
const resolve = (key) => cats.find((c) => linkKey(c) === key) ?? null; // server side
function page(key, count) {
  const c = resolve(key);
  if (!c) return { category: '<missing>', title: 'GTA 6 Map: Interactive Collectibles & Locations Tracker', heading: 'GTA 6 Interactive Map' };
  return { category: c.id, title: `All GTA 6 ${c.name} Locations (${count}) | Interactive Map`, heading: `GTA 6 ${c.name} Locations Map` };
}
function addressAfter(path, visible, all, focus) {
  // focus = the category an Only/arrow click set; the ?feature part stays while it is the only one switched on
  if (focus && visible.length === 1 && visible[0] === focus.id) return href(path, focus);
  return path;
}

const P = '/gta-6/map/';
const all = cats.map((c) => c.id);
const obs = [
  ['F4-02 sidebar link of a category without slug', href(P, cats[0]), '/gta-6/map/?feature=bank'],
  ['F4-02 sidebar link of a category with slug', href(P, cats[1]), '/gta-6/map/?feature=garages'],
  ['F4-20 popup category link', href(P, cats[2]), '/gta-6/map/?feature=safehouses'],
  ['F4-16 ?feature=hidden-packages: category', page('hidden-packages', 105).category, 'hidden-package'],
  ['F4-16 title', page('hidden-packages', 105).title, 'All GTA 6 Hidden Package Locations (105) | Interactive Map'],
  ['F4-16 heading (shown upper-case by CSS)', page('hidden-packages', 105).heading.toUpperCase(), 'GTA 6 HIDDEN PACKAGE LOCATIONS MAP'],
  ['F4-18 ?feature=bank: category', page('bank', 22).category, 'bank'],
  ['F4-18 title', page('bank', 22).title, 'All GTA 6 Bank Locations (22) | Interactive Map'],
  ['F4-17 ?feature=hidden-package (id of a slugged category): normal map', page('hidden-package').category, '<missing>'],
  ['F4-17 heading', page('hidden-package').heading.toUpperCase(), 'GTA 6 INTERACTIVE MAP'],
  ['F4-19 ?feature=no-such-category: normal map', page('no-such-category').title, 'GTA 6 Map: Interactive Collectibles & Locations Tracker'],
  ['F4-11 Only on Garages', addressAfter(P, ['garage'], all, cats[1]), '/gta-6/map/?feature=garages'],
  ['F4-12 then All', addressAfter(P, all, all, cats[1]), '/gta-6/map/'],
  ['F4-13 arrow on Garages', addressAfter(P, ['garage'], all, cats[1]), '/gta-6/map/?feature=garages'],
  ['F4-14 then Banks switched on too', addressAfter(P, ['bank', 'garage'], all, cats[1]), '/gta-6/map/'],
];
// NOTE: titles in F4-16/18 use the category's singular display name; the real names are configuration.

let pass = 0;
for (const [id, got, want] of obs) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${got}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
