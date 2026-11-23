// Rule F7-R2 (list pagination) - standalone, analysis side only.
// Plain words: lists show 30 items per page (videos: 7 items, one page, no pager). Page 1 lives at the list
// URL itself; page N (N >= 2) at "<list URL>page-N"; "<list URL>page-1" does not exist (404). A page number
// beyond the last page is a 404. The same pages are also reachable with "?start=<offset>" (offset = 30*(N-1));
// an offset past the end still answers 200 with the last page's counter and no items. The counter reads
// "Page N of M" with M = ceil(total / 30). Known quirk of the original (do not copy): the GTA 6 news list's
// "last page" link points to the category's other alias (/gta-6/articles/page-M) because /gta-6/news/page-M is a 404.
// The pager shows: first + previous (disabled on page 1), up to 10 numbered links around the current page
// (current one marked, href "#"), next + last (absent on the last page).
// Observations: probe-f7-pagination-status.txt (curl) and runner cases (run-f7-news.json: calls status, counter, count).
const OBS = [
[
"curl",
"/gta-6/news/",
"200",
"Page 1 of 6",
30
],
[
"curl",
"/gta-6/news/page-1",
"404",
null,
0
],
[
"curl",
"/gta-6/news/page-2",
"200",
"Page 2 of 6",
30
],
[
"curl",
"/gta-6/news/page-3",
"200",
"Page 3 of 6",
30
],
[
"curl",
"/gta-6/news/page-4",
"200",
"Page 4 of 6",
30
],
[
"curl",
"/gta-6/news/page-5",
"200",
"Page 5 of 6",
30
],
[
"curl",
"/gta-6/news/page-6",
"404",
null,
0
],
[
"curl",
"/gta-6/news/page-7",
"404",
null,
0
],
[
"curl",
"/gta-6/news/page-99",
"404",
null,
0
],
[
"curl",
"/gta-6/articles/page-6",
"200",
"Page 6 of 6",
22
],
[
"curl",
"/gta-6/articles",
"200",
"Page 1 of 6",
30
],
[
"curl",
"/gta-6/news/?start=30",
"200",
"Page 2 of 6",
30
],
[
"curl",
"/gta-6/news/?start=150",
"200",
"Page 6 of 6",
22
],
[
"curl",
"/gta-6/news/?start=999",
"200",
"Page 6 of 6",
0
],
[
"curl",
"/gta-6/guides/page-2",
"200",
"Page 2 of 3",
30
],
[
"curl",
"/gta-6/guides/page-3",
"200",
"Page 3 of 3",
1
],
[
"curl",
"/gta-6/guides/page-4",
"404",
null,
0
],
[
"curl",
"/gta-6/videos/page-2",
"404",
null,
0
],
[
"curl",
"/gta-6/articles/this-article-does-not-exist-xyz",
"404",
null,
0
],
[
"curl",
"/articles/gta-6/this-article-does-not-exist-xyz",
"404",
null,
0
],
[
"F7-01",
"/gta-6/news/",
"200",
"Page 1 of 6",
30
],
[
"F7-03",
"/gta-6/news/page-2",
"200",
"Page 2 of 6",
30
],
[
"F7-06",
"/gta-6/articles/page-6",
"200",
"Page 6 of 6",
22
],
[
"F7-08",
"/gta-6/news/page-6",
"404",
null,
0
],
[
"F7-09",
"/gta-6/news/page-99",
"404",
null,
0
],
[
"F7-11",
"/gta-6/news/?start=30",
"200",
"Page 2 of 6",
30
],
[
"F7-12",
"/gta-6/news/?start=999",
"200",
"Page 6 of 6",
0
],
[
"F7-14",
"/gta-6/guides/",
"200",
"Page 1 of 3",
30
],
[
"F7-15",
"/gta-6/guides/page-3",
"200",
"Page 3 of 3",
1
],
[
"F7-17",
"/gta-6/videos/",
"200",
null,
7
],
[
"F7-37",
"/gta-6/articles",
"200",
"Page 1 of 6",
30
]
];
const PAGER = [
[
"F7-02",
{
"url": "/gta-6/news/",
"heading": "All GTA 6 News: Latest Updates on Grand Theft Auto VI",
"count:page-links": "8",
"list:page-links": "1 || 2 || 3 || 4 || 5 || 6 ||  || ",
"text:page-current": "1",
"attr:page-current@href": "#",
"count:page-disabled": "2",
"count:page-first": "0",
"count:page-prev": "0",
"attr:page-2-link@href": "/gta-6/news/page-2",
"attr:page-next@href": "/gta-6/news/page-2",
"attr:page-last@href": "/gta-6/articles/page-6",
"attr:pagination@aria-label": "Pagination"
}
],
[
"F7-04",
{
"url": "/gta-6/news/page-2",
"heading": "Grand Theft Auto VI - Page 2",
"list:page-links": " ||  || 1 || 2 || 3 || 4 || 5 || 6 ||  || ",
"text:page-current": "2",
"attr:page-first@href": "/gta-6/news/",
"attr:page-prev@href": "/gta-6/news/",
"attr:page-next@href": "/gta-6/news/page-3",
"attr:page-last@href": "/gta-6/articles/page-6",
"count:page-disabled": "0"
}
],
[
"F7-07",
{
"url": "/gta-6/articles/page-6",
"heading": "Grand Theft Auto VI - Page 6",
"list:page-links": " ||  || 1 || 2 || 3 || 4 || 5 || 6",
"text:page-current": "6",
"count:page-next": "0",
"count:page-last": "0",
"attr:page-prev@href": "/gta-6/news/page-5",
"attr:page-first@href": "/gta-6/news/",
"count:page-disabled": "2"
}
]
];
const LISTS = { '/gta-6/news/': 172, '/gta-6/articles': 172, '/gta-6/guides/': 61, '/gta-6/videos/': 7 };
const ALIAS_QUIRK_404 = new Set(['/gta-6/news/page-6']);
function model(url) {
  const [path, query] = url.split('?');
  let base = null, n = 1, start = null;
  const m = /^(.*\/)page-(\d+)$/.exec(path);
  if (m) { base = m[1]; n = +m[2]; } else base = path;
  if (base === '/gta-6/articles/') base = '/gta-6/articles';
  if (/^\/gta-6\/articles\/(?!page-)[^/]+$/.test(path) || /^\/articles\/gta-6\//.test(path)) return { status: '404' };
  const total = LISTS[base];
  if (total === undefined) return null;
  const size = base === '/gta-6/videos/' ? total : 30;
  const pages = Math.ceil(total / size);
  if (query) { const s = /start=(\d+)/.exec(query); start = s ? +s[1] : 0; }
  if (m && (n < 2 || n > pages || ALIAS_QUIRK_404.has(path) || size === total)) return { status: '404', counter: null, items: 0 };
  if (start !== null) {
    const page = Math.min(Math.floor(start / size) + 1, pages);
    const items = Math.max(0, Math.min(size, total - start));
    return { status: '200', counter: `Page ${page} of ${pages}`, items };
  }
  const items = Math.min(size, total - size * (n - 1));
  return { status: '200', counter: pages > 1 ? `Page ${n} of ${pages}` : null, items };
}
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
for (const [src, url, status, counter, items] of OBS) {
  const e = model(url);
  if (!e) { check(`${src} ${url} known list`, false, 'no model'); continue; }
  check(`${src} ${url} status`, e.status === status, `model ${e.status} vs ${status}`);
  if (status === '200') {
    check(`${src} ${url} counter`, e.counter === counter, `model ${e.counter} vs ${counter}`);
    if (items !== null) check(`${src} ${url} items`, e.items === items, `model ${e.items} vs ${items}`);
  }
}
// pager links (run readouts after the lazy pager was revealed)
const pagerModel = (base, cur, pages, lastAlias) => {
  const nums = []; const lo = Math.max(1, Math.min(cur - 4, pages - 9)); for (let i = lo; i <= Math.min(pages, lo + 9); i++) nums.push(i);
  const href = (i) => (i === 1 ? base : `${i === pages ? lastAlias : base}page-${i}`);
  return { nums, prev: cur > 1 ? href(cur - 1) : '<missing>', next: cur < pages ? href(cur + 1) : '<missing>', last: cur < pages ? href(pages) : '<missing>', first: cur > 1 ? base : '<missing>' };
};
for (const [id, v] of PAGER) {
  const cur = +v['text:page-current'];
  const pm = pagerModel('/gta-6/news/', cur, 6, '/gta-6/articles/');
  check(`${id} current page ${cur} numbered links`, v['list:page-links'].split(' || ').filter((t) => /^\d+$/.test(t)).join(',') === pm.nums.join(','), v['list:page-links']);
  if ('attr:page-next@href' in v) check(`${id} next href`, v['attr:page-next@href'] === pm.next, `${v['attr:page-next@href']} vs ${pm.next}`);
  if ('attr:page-last@href' in v) check(`${id} last href`, v['attr:page-last@href'] === pm.last, `${v['attr:page-last@href']} vs ${pm.last}`);
  if ('attr:page-prev@href' in v) check(`${id} previous href`, v['attr:page-prev@href'] === pm.prev, `${v['attr:page-prev@href']} vs ${pm.prev}`);
  if ('count:page-next' in v) check(`${id} next link present`, (v['count:page-next'] !== '0') === (pm.next !== '<missing>'), v['count:page-next']);
  if ('count:page-prev' in v) check(`${id} previous link present`, (v['count:page-prev'] !== '0') === (pm.prev !== '<missing>'), v['count:page-prev']);
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
