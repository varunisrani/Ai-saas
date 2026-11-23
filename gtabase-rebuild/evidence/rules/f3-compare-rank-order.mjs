// Rule F3-R4 (class ranking page: rows and order).
// Plain words: a ranking page lists every vehicle of one class, one row each: thumbnail, make badge + name
// (link to the vehicle page), "Based on: <real-life model>" only when known, then
// "Road Rating: <n> · Off-Road Rating: <n>" ("-" when the vehicle has no rating yet).
// Order: Road Rating, highest first; rows without a Road Rating come after all rated rows. Equal ratings keep
// a server order that is not explained by the off-road rating (UNKNOWN tie-break; observed: the base model
// usually before its variants). The h1 is "GTA 6 Best <Class plural> List: Stats Ranking" and the list title
// "Full List of Best <Class plural> in GTA 6:" (on /best-vehicles/ the default h1 says "Super Cars" while the
// rows are the Sports class -- an inconsistency of the original).
// Observations: evidence/runs/run-f3-compare.json (rating lines of every row, in page order).
// Standalone: node f3-compare-rank-order.mjs
const OBS = [
 {
  "id": "F3-30",
  "url": "/gta-6/vehicles/best-vehicles/",
  "h1": "GTA 6 Best Super Cars List: Stats Ranking",
  "listTitle": "Full List of Best Super Cars in GTA 6:",
  "rowCount": 23,
  "images": 23,
  "row1Labels": [
   "Based on:",
   "Road Rating:",
   "Off-Road Rating:"
  ],
  "ratings": [
   "Road Rating: 780 · Off-Road Rating: 240",
   "Road Rating: 776 · Off-Road Rating: 238",
   "Road Rating: 757 · Off-Road Rating: 296",
   "Road Rating: 753 · Off-Road Rating: 245",
   "Road Rating: 719 · Off-Road Rating: 279",
   "Road Rating: 712 · Off-Road Rating: 238",
   "Road Rating: 707 · Off-Road Rating: 238",
   "Road Rating: 683 · Off-Road Rating: 199",
   "Road Rating: 683 · Off-Road Rating: 357",
   "Road Rating: 657 · Off-Road Rating: 236",
   "Road Rating: 657 · Off-Road Rating: 743",
   "Road Rating: 640 · Off-Road Rating: 279",
   "Road Rating: 635 · Off-Road Rating: 280",
   "Road Rating: 625 · Off-Road Rating: 379",
   "Road Rating: 621 · Off-Road Rating: 272",
   "Road Rating: 616 · Off-Road Rating: 274",
   "Road Rating: 616 · Off-Road Rating: 274",
   "Road Rating: 611 · Off-Road Rating: 279",
   "Road Rating: 571 · Off-Road Rating: 376",
   "Road Rating: 533 · Off-Road Rating: 352",
   "Road Rating: 528 · Off-Road Rating: 352",
   "Road Rating: 460 · Off-Road Rating: 256",
   "Road Rating: - · Off-Road Rating: -"
  ]
 },
 {
  "id": "F3-32",
  "url": "/gta-6/vehicles/best-motorcycles/",
  "h1": "GTA 6 Best Motorcycles List: Stats Ranking",
  "listTitle": "Full List of Best Motorcycles in GTA 6:",
  "rowCount": 76,
  "images": 76,
  "row1Labels": [
   "Road Rating:",
   "Off-Road Rating:"
  ],
  "ratings": [
   "Road Rating: 804 · Off-Road Rating: 118",
   "Road Rating: 796 · Off-Road Rating: 121",
   "Road Rating: 796 · Off-Road Rating: 121",
   "Road Rating: 774 · Off-Road Rating: 118",
   "Road Rating: 771 · Off-Road Rating: 120",
   "Road Rating: 768 · Off-Road Rating: 120",
   "Road Rating: 750 · Off-Road Rating: 120",
   "Road Rating: 750 · Off-Road Rating: 120",
   "Road Rating: 744 · Off-Road Rating: 120",
   "Road Rating: 744 · Off-Road Rating: 120",
   "Road Rating: 726 · Off-Road Rating: 117",
   "Road Rating: 701 · Off-Road Rating: 119",
   "Road Rating: 681 · Off-Road Rating: 119",
   "Road Rating: 673 · Off-Road Rating: 210",
   "Road Rating: 649 · Off-Road Rating: 188",
   "Road Rating: 616 · Off-Road Rating: 134",
   "Road Rating: 615 · Off-Road Rating: 202",
   "Road Rating: 614 · Off-Road Rating: 745",
   "Road Rating: 611 · Off-Road Rating: 199",
   "Road Rating: 603 · Off-Road Rating: 129",
   "Road Rating: 603 · Off-Road Rating: 129",
   "Road Rating: 599 · Off-Road Rating: 211",
   "Road Rating: 598 · Off-Road Rating: 214",
   "Road Rating: 590 · Off-Road Rating: 213",
   "Road Rating: 585 · Off-Road Rating: 207",
   "Road Rating: 581 · Off-Road Rating: 774",
   "Road Rating: 579 · Off-Road Rating: 108",
   "Road Rating: 574 · Off-Road Rating: 744",
   "Road Rating: 573 · Off-Road Rating: 186",
   "Road Rating: 571 · Off-Road Rating: 186",
   "Road Rating: 568 · Off-Road Rating: 183",
   "Road Rating: 560 · Off-Road Rating: 176",
   "Road Rating: 556 · Off-Road Rating: 728",
   "Road Rating: 554 · Off-Road Rating: 726",
   "Road Rating: 553 · Off-Road Rating: 747",
   "Road Rating: 548 · Off-Road Rating: 739",
   "Road Rating: 534 · Off-Road Rating: 702",
   "Road Rating: 526 · Off-Road Rating: 164",
   "Road Rating: 524 · Off-Road Rating: 715",
   "Road Rating: 524 · Off-Road Rating: 715",
   "Road Rating: 524 · Off-Road Rating: 715",
   "Road Rating: 523 · Off-Road Rating: 728",
   "Road Rating: 521 · Off-Road Rating: 712",
   "Road Rating: 521 · Off-Road Rating: 712",
   "Road Rating: 519 · Off-Road Rating: 706",
   "Road Rating: 519 · Off-Road Rating: 706",
   "Road Rating: 511 · Off-Road Rating: 169",
   "Road Rating: 509 · Off-Road Rating: 175",
   "Road Rating: 457 · Off-Road Rating: 146",
   "Road Rating: 457 · Off-Road Rating: 146",
   "Road Rating: 457 · Off-Road Rating: 146",
   "Road Rating: 428 · Off-Road Rating: 286",
   "Road Rating: 417 · Off-Road Rating: 665",
   "Road Rating: 417 · Off-Road Rating: 660",
   "Road Rating: 414 · Off-Road Rating: 663",
   "Road Rating: 414 · Off-Road Rating: 663",
   "Road Rating: 379 · Off-Road Rating: 620",
   "Road Rating: 344 · Off-Road Rating: 84",
   "Road Rating: 338 · Off-Road Rating: 81",
   "Road Rating: 308 · Off-Road Rating: 530",
   "Road Rating: 69 · Off-Road Rating: 57",
   "Road Rating: 42 · Off-Road Rating: 90",
   "Road Rating: 19 · Off-Road Rating: 20",
   "Road Rating: 19 · Off-Road Rating: 20",
   "Road Rating: 19 · Off-Road Rating: 20",
   "Road Rating: 19 · Off-Road Rating: 20",
   "Road Rating: 19 · Off-Road Rating: 20",
   "Road Rating: 17 · Off-Road Rating: 31",
   "Road Rating: 17 · Off-Road Rating: 31",
   "Road Rating: 17 · Off-Road Rating: 31",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -"
  ]
 },
 {
  "id": "F3-34",
  "url": "/gta-6/vehicles/best-sports-cars/",
  "h1": "GTA 6 Best Sports Cars List: Stats Ranking",
  "listTitle": "Full List of Best Sports Cars in GTA 6:",
  "rowCount": 23,
  "images": 23,
  "row1Labels": [
   "Based on:",
   "Road Rating:",
   "Off-Road Rating:"
  ],
  "ratings": [
   "Road Rating: 780 · Off-Road Rating: 240",
   "Road Rating: 776 · Off-Road Rating: 238",
   "Road Rating: 757 · Off-Road Rating: 296",
   "Road Rating: 753 · Off-Road Rating: 245",
   "Road Rating: 719 · Off-Road Rating: 279",
   "Road Rating: 712 · Off-Road Rating: 238",
   "Road Rating: 707 · Off-Road Rating: 238",
   "Road Rating: 683 · Off-Road Rating: 199",
   "Road Rating: 683 · Off-Road Rating: 357",
   "Road Rating: 657 · Off-Road Rating: 236",
   "Road Rating: 657 · Off-Road Rating: 743",
   "Road Rating: 640 · Off-Road Rating: 279",
   "Road Rating: 635 · Off-Road Rating: 280",
   "Road Rating: 625 · Off-Road Rating: 379",
   "Road Rating: 621 · Off-Road Rating: 272",
   "Road Rating: 616 · Off-Road Rating: 274",
   "Road Rating: 616 · Off-Road Rating: 274",
   "Road Rating: 611 · Off-Road Rating: 279",
   "Road Rating: 571 · Off-Road Rating: 376",
   "Road Rating: 533 · Off-Road Rating: 352",
   "Road Rating: 528 · Off-Road Rating: 352",
   "Road Rating: 460 · Off-Road Rating: 256",
   "Road Rating: - · Off-Road Rating: -"
  ]
 },
 {
  "id": "F3-35",
  "url": "/gta-6/vehicles/best-boats/",
  "h1": "GTA 6 Best Boats List: Stats Ranking",
  "listTitle": "Full List of Best Boats in GTA 6:",
  "rowCount": 52,
  "images": 52,
  "row1Labels": [
   "Based on:",
   "Road Rating:",
   "Off-Road Rating:"
  ],
  "ratings": [
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -"
  ]
 },
 {
  "id": "F3-36",
  "url": "/gta-6/vehicles/best-helicopters/",
  "h1": "GTA 6 Best Helicopters List: Stats Ranking",
  "listTitle": "Full List of Best Helicopters in GTA 6:",
  "rowCount": 19,
  "images": 19,
  "row1Labels": [
   "Based on:",
   "Road Rating:",
   "Off-Road Rating:"
  ],
  "ratings": [
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -"
  ]
 },
 {
  "id": "F3-37",
  "url": "/gta-6/vehicles/best-planes/",
  "h1": "GTA 6 Best Planes List: Stats Ranking",
  "listTitle": "Full List of Best Planes in GTA 6:",
  "rowCount": 23,
  "images": 23,
  "row1Labels": [
   "Based on:",
   "Road Rating:",
   "Off-Road Rating:"
  ],
  "ratings": [
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -",
   "Road Rating: - · Off-Road Rating: -"
  ]
 },
 {
  "id": "F3-38",
  "url": "/gta-6/vehicles/best-super-cars/",
  "h1": "GTA 6 Best Super Cars List: Stats Ranking",
  "listTitle": "Full List of Best Super Cars in GTA 6:",
  "rowCount": 29,
  "images": 29,
  "row1Labels": [
   "Road Rating:",
   "Off-Road Rating:"
  ],
  "ratings": [
   "Road Rating: 873 · Off-Road Rating: 297",
   "Road Rating: 863 · Off-Road Rating: 212",
   "Road Rating: 863 · Off-Road Rating: 213",
   "Road Rating: 862 · Off-Road Rating: 213",
   "Road Rating: 862 · Off-Road Rating: 157",
   "Road Rating: 852 · Off-Road Rating: 213",
   "Road Rating: 847 · Off-Road Rating: 292",
   "Road Rating: 844 · Off-Road Rating: 296",
   "Road Rating: 837 · Off-Road Rating: 210",
   "Road Rating: 832 · Off-Road Rating: 297",
   "Road Rating: 832 · Off-Road Rating: 297",
   "Road Rating: 824 · Off-Road Rating: 286",
   "Road Rating: 811 · Off-Road Rating: 270",
   "Road Rating: 810 · Off-Road Rating: 239",
   "Road Rating: 810 · Off-Road Rating: 302",
   "Road Rating: 808 · Off-Road Rating: 270",
   "Road Rating: 807 · Off-Road Rating: 284",
   "Road Rating: 781 · Off-Road Rating: 239",
   "Road Rating: 781 · Off-Road Rating: 239",
   "Road Rating: 762 · Off-Road Rating: 270",
   "Road Rating: 761 · Off-Road Rating: 631",
   "Road Rating: 757 · Off-Road Rating: 240",
   "Road Rating: 749 · Off-Road Rating: 301",
   "Road Rating: 748 · Off-Road Rating: 284",
   "Road Rating: 748 · Off-Road Rating: 284",
   "Road Rating: 748 · Off-Road Rating: 284",
   "Road Rating: 708 · Off-Road Rating: 283",
   "Road Rating: 698 · Off-Road Rating: 328",
   "Road Rating: 633 · Off-Road Rating: 350"
  ]
 }
];
let pass = 0, n = 0;
function check(id, ok, msg) { n++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${msg}`); }
for (const o of OBS) {
  const parsed = o.ratings.map((line) => {
    const m = /^Road Rating: (\d+|-) · Off-Road Rating: (\d+|-)$/.exec(line);
    return m ? { road: m[1] === '-' ? null : Number(m[1]), off: m[2] === '-' ? null : Number(m[2]) } : 'bad';
  });
  const formatOk = parsed.every((p) => p !== 'bad') && parsed.length === o.rowCount;
  const rated = parsed.filter((p) => p.road !== null).map((p) => p.road);
  const firstUnrated = parsed.findIndex((p) => p.road === null);
  const unratedLast = firstUnrated === -1 || parsed.slice(firstUnrated).every((p) => p.road === null);
  const desc = rated.every((r, i) => i === 0 || rated[i - 1] >= r);
  const ties = rated.filter((r, i) => i > 0 && rated[i - 1] === r).length;
  check(o.id, formatOk && unratedLast && desc,
    `${o.url}: ${o.rowCount} rows, ${rated.length} rated (non-increasing: ${desc}), ${o.rowCount - rated.length} unrated last (${unratedLast}), ${ties} equal neighbours`);
  const plural = o.listTitle.replace(/^Full List of Best /, '').replace(/ in GTA 6:$/, '');
  check(o.id, o.h1 === `GTA 6 Best ${plural} List: Stats Ranking` || o.url.endsWith('/best-vehicles/'),
    `h1 "${o.h1}" = "GTA 6 Best ${plural} List: Stats Ranking"${o.url.endsWith('/best-vehicles/') ? ' (default page: h1 class differs from the rows, recorded as-is)' : ''}`);
  const labelsOk = JSON.stringify(o.row1Labels.filter((l) => l !== 'Based on:')) === JSON.stringify(['Road Rating:', 'Off-Road Rating:']) && o.row1Labels.length <= 3;
  check(o.id, labelsOk, `row labels [${o.row1Labels.join(', ')}] = optional "Based on:" + "Road Rating:" + "Off-Road Rating:"`);
}
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
