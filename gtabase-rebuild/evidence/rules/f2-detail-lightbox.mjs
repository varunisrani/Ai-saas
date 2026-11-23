// Rule F2-R7 (detail gallery lightbox).
// Plain words: a detail page gallery shows a strip of thumbnails; clicking thumbnail k opens a full-screen
// lightbox on image k with a counter "k/N" (N = images in that gallery), previous/next arrows, close button,
// download and share buttons and the caption below. Next / ArrowRight = k+1, previous / ArrowLeft = k-1
// (wrap-around at the ends: see F8-R1, not re-tested here). Escape or the close button closes it. Opening and moving do not change the URL. (The gallery script
// would open a "?i=<image key>" URL on that image, but the live server 301-redirects that URL to the bare page,
// so it never happens; see f2-detail-url.mjs.)
// Observations: evidence/runs/run-f2-detail.json. Standalone: node f2-detail-lightbox.mjs
const OBS = [
 {
  "id": "F2-16",
  "action": "open-first",
  "url": "/gta-6/characters/jason",
  "counter": "1/95",
  "open": "true"
 },
 {
  "id": "F2-17",
  "action": "next-click",
  "url": "/gta-6/characters/jason",
  "counter": "2/95",
  "open": null
 },
 {
  "id": "F2-18",
  "action": "ArrowRight",
  "url": "/gta-6/characters/jason",
  "counter": "3/95",
  "open": null
 },
 {
  "id": "F2-19",
  "action": "ArrowLeft x2",
  "url": "/gta-6/characters/jason",
  "counter": "1/95",
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
