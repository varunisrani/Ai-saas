// Rule F8-R1 (lightbox position and counter).
// Plain words:
//  - The lightbox belongs to ONE gallery block and one page of it: N = number of images of that block on the
//    current page (screenshots: 100 per page; artworks: each of the 6 blocks separately; cover: 1).
//  - Opening from the k-th thumbnail (or from the main image showing image k) shows image k; the counter reads
//    "k/N" (number, "/", total, no spaces in the text).
//  - Next (ArrowRight key, next arrow) = k % N + 1; Previous (ArrowLeft key, previous arrow) = (k - 2 + N) % N + 1:
//    it wraps in both directions; with N = 1 both stay on 1.
//  - Keyboard Enter on a focused thumbnail opens it like a click.
//  - Closing does not reset anything visible except: an embedded gallery's main image becomes the last image
//    viewed in the lightbox.
// Observations: run-f8-galleries.json (see OBS). Standalone: node f8-galleries-counter.mjs

const OBS = globalThis.F8_COUNTER_OBS ?? [];

const next = (k, N) => (k % N) + 1;
const prev = (k, N) => ((k - 2 + N) % N) + 1;

let pass = 0;
for (const o of OBS) {
  let k = null;
  for (const a of o.actions) {
    if (a.open !== undefined) k = a.open;
    else if (a === 'next') k = next(k, o.N);
    else if (a === 'prev') k = prev(k, o.N);
  }
  const predicted = `${k}/${o.N}`;
  const ok = predicted === o.observed;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${JSON.stringify(o.actions)} -> rule ${predicted}, observed ${o.observed}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length && OBS.length > 0 ? 0 : 1;
