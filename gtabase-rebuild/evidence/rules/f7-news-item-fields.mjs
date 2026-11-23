// Rule F7-R3 (fields shown per list item) - standalone, analysis side only.
// Plain words: every list item has a 320x180 thumbnail linking to the item and a title link (same target).
// Which meta fields follow depends on the list:
//   GTA 6 news   : author name, published date, category label ("Grand Theft Auto VI" -> GTA 6 news list)
//   GTA 6 guides : category label only (no author, no date)
//   GTA 6 videos : published date only
//   all news     : author name, published date, plus tag badges (game tag + type tag), no category label
// Observations: runner counts (run-f7-news.json F7-01, F7-14, F7-17, F7-20).
const OBS = [
[
"F7-01",
"gta6-news",
{
"count:list-item": "30",
"count:item-thumb": "30",
"count:item-author": "30",
"count:item-date": "30",
"count:item-category": "30",
"count:item-tags": "0"
}
],
[
"F7-14",
"gta6-guides",
{
"count:list-item": "30",
"count:item-thumb": "30",
"count:item-author": "0",
"count:item-date": "0",
"count:item-category": "30",
"count:item-tags": null
}
],
[
"F7-17",
"gta6-videos",
{
"count:list-item": "7",
"count:item-thumb": "7",
"count:item-author": "0",
"count:item-date": "7",
"count:item-category": "0",
"count:item-tags": null
}
],
[
"F7-20",
"all-news",
{
"count:list-item": "30",
"count:item-thumb": null,
"count:item-author": "30",
"count:item-date": "30",
"count:item-category": "0",
"count:item-tags": "57"
}
]
];
const SHOWS = {
  'gta6-news': { author: true, date: true, category: true, tags: false },
  'gta6-guides': { author: false, date: false, category: true, tags: false },
  'gta6-videos': { author: false, date: true, category: false, tags: false },
  'all-news': { author: true, date: true, category: false, tags: true },
};
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
for (const [id, list, c] of OBS) {
  const n = +c['count:list-item'];
  const s = SHOWS[list];
  if (c['count:item-thumb'] != null) check(`${id} ${list}: one thumbnail per item`, +c['count:item-thumb'] === n, JSON.stringify(c));
  check(`${id} ${list}: author ${s.author ? 'on every item' : 'absent'}`, +c['count:item-author'] === (s.author ? n : 0), c['count:item-author']);
  check(`${id} ${list}: date ${s.date ? 'on every item' : 'absent'}`, +c['count:item-date'] === (s.date ? n : 0), c['count:item-date']);
  check(`${id} ${list}: category ${s.category ? 'on every item' : 'absent'}`, +c['count:item-category'] === (s.category ? n : 0), c['count:item-category']);
  if (c['count:item-tags'] != null) check(`${id} ${list}: tags ${s.tags ? 'present (>= 1 per item)' : 'absent'}`, s.tags ? +c['count:item-tags'] >= n : +c['count:item-tags'] === 0, c['count:item-tags']);
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
