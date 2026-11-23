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

// Each observation = the actions since the lightbox was opened in that case chain, and the counter read after them.
// Sessions: shots desktop F8-02..F8-07, F8-09, F8-12, F8-34..F8-37; covers F8-24/F8-25, F8-38; shots 390x844 F8-31/F8-32.
const OBS = [
  { id: 'F8-02', N: 100, actions: [{ open: 1 }], observed: '1/100' },
  { id: 'F8-03', N: 100, actions: [{ open: 1 }, 'next'], observed: '2/100' },
  { id: 'F8-04', N: 100, actions: [{ open: 1 }, 'next', 'prev', 'prev'], observed: '100/100' },
  { id: 'F8-05', N: 100, actions: [{ open: 1 }, 'next', 'prev', 'prev', 'next'], observed: '1/100' },
  { id: 'F8-06', N: 100, actions: [{ open: 1 }, 'next', 'prev', 'prev', 'next', 'next'], observed: '2/100' },
  { id: 'F8-07', N: 100, actions: [{ open: 1 }, 'next', 'prev', 'prev', 'next', 'next', 'prev', 'prev'], observed: '100/100' },
  { id: 'F8-09', N: 100, actions: [{ open: 5 }], observed: '5/100' },
  { id: 'F8-12', N: 100, actions: [{ open: 3 }], observed: '3/100' }, // opened with Enter on the focused thumbnail
  { id: 'F8-34', N: 100, actions: [{ open: 100 }], observed: '100/100' },
  { id: 'F8-35', N: 100, actions: [{ open: 100 }, 'next'], observed: '1/100' },
  { id: 'F8-36', N: 100, actions: [{ open: 100 }, 'next', 'next', 'next', 'next', 'next', 'next'], observed: '6/100' },
  { id: 'F8-37', N: 100, actions: [{ open: 100 }, 'next', 'next', 'next', 'next', 'next', 'next', 'click-image'], observed: '6/100' },
  { id: 'F8-24', N: 1, actions: [{ open: 1 }], observed: '1/1' },
  { id: 'F8-25', N: 1, actions: [{ open: 1 }, 'next'], observed: '1/1' },
  { id: 'F8-38', N: 1, actions: [{ open: 1 }], observed: '1/1' },
  { id: 'F8-31', N: 100, actions: [{ open: 1 }], observed: '1/100' },
  { id: 'F8-32', N: 100, actions: [{ open: 1 }, 'next'], observed: '2/100' },
];
const EXTRA = globalThis.F8_EXTRA_OBS ?? [];
OBS.push(...EXTRA);

const next = (k, N) => (k % N) + 1;
const prev = (k, N) => ((k - 2 + N) % N) + 1;

let pass = 0;
for (const o of OBS) {
  let k = null;
  for (const a of o.actions) {
    if (a.open !== undefined) k = a.open;
    else if (a === 'next') k = next(k, o.N);
    else if (a === 'prev') k = prev(k, o.N);
    else if (a === 'click-image') k = k; // clicking the picture does nothing
  }
  const predicted = `${k}/${o.N}`;
  const ok = predicted === o.observed;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${JSON.stringify(o.actions)} -> rule ${predicted}, observed ${o.observed}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length && OBS.length > 0 ? 0 : 1;
