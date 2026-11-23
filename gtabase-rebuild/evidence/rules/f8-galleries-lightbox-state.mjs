// Rule F8-R2 (lightbox open/close, URL and loading).
// Plain words:
//  - Opening locks page scrolling (marker on the root element) and shows close, previous, next and 3 toolbar
//    actions (download, Facebook, Twitter); with a single image there are no previous/next arrows.
//  - It closes on Escape or the close button, and on reload (nothing is restored). Clicking the picture or the
//    caption strip below it does NOT close it.
//  - The address never changes while open; a "?i=<image>" link is redirected by the server to the clean page
//    and opens nothing.
//  - Large images load lazily: on open the current image and 2 neighbours on each side (wrapping); each move
//    adds its own neighbours; loaded images stay loaded.
// Observations: run-f8-galleries.json. Standalone: node f8-galleries-lightbox-state.mjs

const R = { // readouts copied from the run
  'F8-02': { url: '/gta-6/screenshots/', open: 'true', lock: '1', next: 'true', prev: 'true', close: 'true', toolbar: '3', loaded: '5', slots: '100' },
  'F8-03': { url: '/gta-6/screenshots/', lightbox: '1' },
  'F8-08': { url: '/gta-6/screenshots/', lightbox: '0', lock: '0', via: 'Escape' },
  'F8-10': { url: '/gta-6/screenshots/', lightbox: '0', lock: '0', via: 'close button' },
  'F8-11': { lightbox: '1', via: 'click on the caption strip' },
  'F8-37': { lightbox: '1', via: 'click on the picture' },
  'F8-13': { lightbox: '0', via: 'reload' },
  'F8-33': { lightbox: '0', lock: '0', via: 'Escape (single image)' },
  'F8-16': { url: '/gta-6/screenshots/', lightbox: '0', requested: '/gta-6/screenshots/?i=gta-6-screen-104' },
  'F8-24': { next: 'false', N: 1 },
  'F8-38': { next: 'false', close: 'true', N: 1 },
  'F8-34': { open: 100, N: 100, loaded: '5' },
  'F8-36': { visited: [100, 1, 2, 3, 4, 5, 6], N: 100, loaded: '11' },
};

const closes = (via) => ['Escape', 'close button', 'reload', 'Escape (single image)'].includes(via);
const loadedSet = (visited, N) => { const s = new Set(); for (const k of visited) for (let d = -2; d <= 2; d++) s.add(((k - 1 + d + N) % N) + 1); return s; };
const serverRedirect = (path) => { const [p, q] = path.split('?'); if (!q) return path; const keep = q.split('&').filter((kv) => /^(thumb_limitstart|limit|utm_[a-z]+)=/.test(kv)); return keep.length ? `${p}?${keep.join('&')}` : p; };

let pass = 0, n = 0;
const check = (name, ok, d) => { n++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${d ? ` (${d})` : ''}`); };
check('F8-02 open: scroll lock on, controls shown, 3 toolbar actions', R['F8-02'].lock === '1' && R['F8-02'].next === 'true' && R['F8-02'].prev === 'true' && R['F8-02'].close === 'true' && R['F8-02'].toolbar === '3');
for (const id of ['F8-08', 'F8-10', 'F8-11', 'F8-37', 'F8-13', 'F8-33']) {
  const o = R[id];
  const expectOpen = closes(o.via) ? '0' : '1';
  check(`${id} ${o.via} -> ${expectOpen === '0' ? 'closed' : 'still open'}`, o.lightbox === expectOpen && (o.lock === undefined || o.lock === (expectOpen === '0' ? '0' : '1')));
}
for (const id of ['F8-02', 'F8-03', 'F8-08', 'F8-10']) check(`${id} URL unchanged`, R[id].url === '/gta-6/screenshots/');
check('F8-16 ?i= deep link -> clean URL, nothing open', serverRedirect(R['F8-16'].requested) === R['F8-16'].url && R['F8-16'].lightbox === '0');
check('F8-24/F8-38 single image -> no next/previous arrows', R['F8-24'].next === 'false' && R['F8-38'].next === 'false' && R['F8-38'].close === 'true');
check('F8-02 open at 1 loads 5 (current ±2, wrapping)', loadedSet([1], 100).size === Number(R['F8-02'].loaded));
check('F8-34 open at 100 loads 5 (98,99,100,1,2)', loadedSet([100], 100).size === Number(R['F8-34'].loaded));
check('F8-36 after 6 moves the union of neighbourhoods is loaded', loadedSet(R['F8-36'].visited, 100).size === Number(R['F8-36'].loaded), `${loadedSet(R['F8-36'].visited, 100).size}`);
check('F8-02 one slot per image of the page', R['F8-02'].slots === '100');
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
