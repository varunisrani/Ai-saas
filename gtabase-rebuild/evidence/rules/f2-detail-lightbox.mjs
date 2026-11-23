// Rule F2-R7 (detail gallery lightbox).
// Plain words: a detail page gallery shows a strip of thumbnails; clicking thumbnail k opens a full-screen
// lightbox on image k with a counter "k/N" (N = images in that gallery), previous/next arrows, close button,
// download and share buttons and the caption below. Next / ArrowRight = k+1, previous / ArrowLeft = k-1, both
// wrapping. Escape or the close button closes it. Opening does not change the URL; a URL with ?i=<image key>
// opens the lightbox on that image at load, and closing removes the ?i= parameter (URL replaced, no new history
// entry). Image key = the image file name stem (e.g. "jason-duval-01").
// Observations: evidence/runs/run-f2-detail.json. Standalone: node f2-detail-lightbox.mjs
const OBS = [
 {
  "id": "F2-18",
  "action": "ArrowRight",
  "url": "/gta-6/characters/jason",
  "counter": "<missing>",
  "open": null
 },
 {
  "id": "F2-19",
  "action": "ArrowLeft x2",
  "url": "/gta-6/characters/jason",
  "counter": "<missing>",
  "open": null
 },
 {
  "id": "F2-20",
  "action": "Escape",
  "url": "/gta-6/characters/jason",
  "counter": null,
  "open": "false"
 }
];
const IMAGE_INDEX = { 'jason-duval-01': 4 }; // position of that image in the gallery (from the page's image order)
let pass = 0, k = null, N = null;
for (const o of OBS) {
  let want, ok;
  const m = /^(\d+)\/(\d+)$/.exec((o.counter ?? '').replace(/\s/g, ''));
  if (o.action === 'open-first') { k = 1; N = m ? Number(m[2]) : null; want = `${k}/${N}`; ok = o.open === 'true' && m && `${m[1]}/${m[2]}` === want && !o.url.includes('?i='); }
  else if (o.action === 'next-click' || o.action === 'ArrowRight') { k = (k % N) + 1; want = `${k}/${N}`; ok = m && `${m[1]}/${m[2]}` === want; }
  else if (o.action === 'ArrowLeft x2') { k = ((k - 3 + 2 * N) % N) + 1; want = `${k}/${N}`; ok = m && `${m[1]}/${m[2]}` === want; }
  else if (o.action === 'Escape' || o.action === 'close-click') { want = 'closed' + (o.action === 'close-click' ? ', no ?i= in URL' : ''); ok = o.open === 'false' && !o.url.includes('?i='); }
  else if (o.action === 'deeplink') { k = IMAGE_INDEX['jason-duval-01']; want = `${k}/${N}`; ok = o.open === 'true' && m && `${m[1]}/${m[2]}` === want; }
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${o.action} -> ${want}; observed ${o.open === 'false' ? 'closed' : o.counter} url ${o.url}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length && OBS.length ? 0 : 1;
