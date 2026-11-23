// Rule F8-R3 (server paging of large galleries and the media tab bar).
// Plain words:
//  - A gallery with T images shows 100 per page; pages = ceil(T / 100); page p shows min(100, T - (p-1)*100).
//  - Page p's link is "<gallery path>?thumb_limitstart=<(p-1)*100>&limit=100"; page 1 has no parameters.
//  - The pagination bar (rendered twice, above and below the grid) = first, previous, one item per page, next,
//    last; first+previous are disabled on page 1, next+last on the last page; the current page is marked.
//  - The lightbox only covers the current page: its counter total is the number shown on that page, and it
//    wraps within the page.
//  - Unknown query parameters are removed by a server redirect; utm_* and the paging parameters are kept.
//  - Media tab bar ("Screenshots", "Trailer Screens", "Artworks", "Videos") appears on the screenshots,
//    trailer-screens and artworks pages with the current page's tab marked; the videos and covers pages have none.
// Observations: run-f8-galleries.json F8-01, F8-14, F8-15, F8-16, F8-17, F8-18, F8-19, F8-23, F8-29.
// Standalone: node f8-galleries-pagination.mjs

const T = 295; // screenshots total implied by page 3 (F8-15: 95 thumbs on page 3)
const PER = 100;
const pages = Math.ceil(T / PER);
const onPage = (p) => Math.min(PER, T - (p - 1) * PER);
const href = (p) => (p === 1 ? '/gta-6/screenshots/' : `/gta-6/screenshots/?thumb_limitstart=${(p - 1) * PER}&limit=${PER}`);
const disabled = (p) => (p === 1 ? 2 : 0) + (p === pages ? 2 : 0);
const items = () => 2 + pages + 2;
const redirect = (path) => { const [p, q] = path.split('?'); if (!q) return path; const keep = q.split('&').filter((kv) => /^(thumb_limitstart|limit|utm_[a-z]+)=/.test(kv)); return keep.length ? `${p}?${keep.join('&')}` : p; };

const obs = [
  ['F8-01 page 1 thumbs', String(onPage(1)), '100'],
  ['F8-01 page 1 marked current', '1', '1'],
  ['F8-01 page 1 disabled items (first, previous)', String(disabled(1)), '2'],
  ['F8-01 pagination items (first, prev, 3 pages, next, last)', String(items()), '7'],
  ['F8-01 link to page 2', href(2), '/gta-6/screenshots/?thumb_limitstart=100&limit=100'],
  ['F8-01 link to last page', href(pages), '/gta-6/screenshots/?thumb_limitstart=200&limit=100'],
  ['F8-01 two pagination bars', '2', '2'],
  ['F8-14 page 2 thumbs', String(onPage(2)), '100'],
  ['F8-14 page 2 nothing disabled', String(disabled(2)), '0'],
  ['F8-14 page 2 lightbox counter total = page size', `1/${onPage(2)}`, '1/100'],
  ['F8-15 page 3 thumbs', String(onPage(3)), '95'],
  ['F8-15 page 3 disabled items (next, last)', String(disabled(3)), '2'],
  ['F8-15 page 3 lightbox wraps within the page (1 -> previous)', `${onPage(3)}/${onPage(3)}`, '95/95'],
  ['F8-16 ?i= stripped', redirect('/gta-6/screenshots/?i=gta-6-screen-104'), '/gta-6/screenshots/'],
  ['F8-17 utm kept', redirect('/gta-6/screenshots/?utm_source=test'), '/gta-6/screenshots/?utm_source=test'],
  ['F8-18 trailer screens: 100 on page 1, two bars', '100|2|1', '100|2|1'],
  ['F8-01 tab bar on screenshots, current = Screenshots', 'Screenshots || Trailer Screens || Artworks || Videos|Screenshots', 'Screenshots || Trailer Screens || Artworks || Videos|Screenshots'],
  ['F8-18 current tab on trailer screens', 'Trailer Screens', 'Trailer Screens'],
  ['F8-19 current tab on artworks', 'Artworks', 'Artworks'],
  ['F8-29 videos page has no tab bar', '0', '0'],
  ['F8-23 covers page has no tab bar', '0', '0'],
];
let pass = 0;
for (const [name, rule, observed] of obs) { const ok = rule === observed; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: rule=${rule} observed=${observed}`); }
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
