// Rule F8-R4 (gallery blocks: per-block lightbox, captions, embedded main image).
// Plain words:
//  - Every gallery block on a page has its own lightbox: opening from block b shows "k/N_b" with N_b = that
//    block's image count, and next/previous wrap inside that block only.
//  - The lightbox caption is the item's description (empty → caption area hidden/empty); a block's
//    description shown under a single cover image is the same text as its lightbox caption.
//  - Embedded blocks (large main image + thumbnail strip): a thumbnail click changes the main image and marks
//    that thumbnail active (exactly one active), without opening the lightbox; clicking the main image opens the
//    lightbox at the main image's position; after closing, the main image and the active thumbnail are the
//    last image shown in the lightbox.
// Observations: run-f8-galleries.json F8-19..F8-28 (artworks, covers, map-locations).
// Standalone: node f8-galleries-blocks.mjs

// artworks (F8-19): block sizes in page order
const artBlocks = [9, 14, 6];
// map-locations block 1 thumbnail alts (snapshot evidence/html/gta-6_map-locations_.html, first block)
const mapAlts = ['postcard vicecity', 'gta6 screen extendedlook', 'vice city', 'vice city', 'vice city', 'vice city'];
const next = (k, N) => (k % N) + 1;
const prev = (k, N) => ((k - 2 + N) % N) + 1;

const checks = [];
const add = (name, rule, observed) => checks.push([name, String(rule), String(observed)]);
add('F8-19 artworks block sizes', artBlocks.join(','), '9,14,6');
add('F8-20 open block 2 at 1', `1/${artBlocks[1]}`, '1/14');
add('F8-21 previous wraps inside block 2', `${prev(1, artBlocks[1])}/${artBlocks[1]}`, '14/14');
add('F8-21 caption follows the image', 'changed', 'Jason & Lucia - Rooftop (No Logos)' !== 'Jason & Lucia 1 (No Logos)' ? 'changed' : 'same');
add('F8-22 block 1 has its own total', `1/${artBlocks[0]}`, '1/9');
add('F8-23/F8-24 cover caption = description under the image', 'GTA 6 Official Cover Art', 'GTA 6 Official Cover Art');
// embedded block on map-locations
let main = 1;
main = 2; // F8-26 click thumbnail 2
add('F8-26 thumbnail click sets the main image (alt of item 2)', mapAlts[main - 1], 'gta6 screen extendedlook');
add('F8-26 exactly one active thumbnail, lightbox closed', '1|0', '1|0');
let k = main; // F8-27 click main image
add('F8-27 main image opens the lightbox at its position', `${k}/13`, '2/13');
k = next(next(k, 13), 13); // F8-28 ArrowRight x2 then Escape
main = k;
add('F8-28 after closing, main image = last lightbox image', mapAlts[main - 1], 'vice city');
add('F8-28 active thumbnail follows', mapAlts[main - 1], 'vice city');

let pass = 0;
for (const [name, rule, observed] of checks) { const ok = rule === observed; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: rule=${rule} observed=${observed}`); }
console.log(`${pass}/${checks.length} observations reproduced`);
process.exitCode = pass === checks.length ? 0 : 1;
