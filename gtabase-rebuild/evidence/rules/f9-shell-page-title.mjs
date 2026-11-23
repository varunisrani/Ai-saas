// Rule F9-R5 (page <title> per page type) - standalone, analysis side only.
// Plain words:
//  - Item detail page /gta-6/<section>/<item>: "<item heading> | GTA 6 <fixed phrase for that section>".
//  - Article page (/gta-6/articles/<slug>, /articles/gta-6/<slug>): the title is exactly the article heading.
//  - Paginated list page N >= 2 (/<list>/page-N): "<category name> | <parent category name> - Page N"
//    (here "Grand Theft Auto VI | Rockstar Games News & Guides - Page N"), whatever the list's own title is.
//  - Not-found page: "404 Page Not Found" (same as its heading).
//  - Home, hub, section and list pages (page 1): a hand-written SEO title per page that always contains
//    "GTA 6" for GTA 6 pages (it may equal the heading or not).
// Observations: evidence/walk/walk.json (37 routes), runner titles from run-f9-shell.json / run-f7-news.json
// (cases without error), curl titles of paginated pages (probe-f7-pagination-status.txt).
const OBS = [
[
"walk",
"/gta-6/",
"GTA 6 Database: All Game Features, Guides & Media",
"GTA 6 (Grand Theft Auto VI)"
],
[
"walk",
"/gta-6/vehicles/",
"GTA 6 Cars & Vehicles Database: Full List & Stats",
"GTA 6 Cars & Vehicles Database: Full List & Stats"
],
[
"walk",
"/gta-6/vehicles/sunset-sanchez",
"Maibatsu Sunset Sanchez | GTA 6 Bike Stats, Price, How To Get",
"Maibatsu Sunset Sanchez"
],
[
"walk",
"/gta-6/vehicles/comparison/",
"GTA 6 Vehicle Comparison",
"GTA 6 Vehicle Comparison"
],
[
"walk",
"/gta-6/vehicles/best-vehicles/",
"GTA 6 Best Super Cars List: Stats Ranking",
"GTA 6 Best Super Cars List: Stats Ranking"
],
[
"walk",
"/gta-6/vehicles/best-sports-cars/",
"GTA 6 Best Sports Cars List: Stats Ranking",
"GTA 6 Best Sports Cars List: Stats Ranking"
],
[
"walk",
"/gta-6/weapons/",
"GTA 6 Weapons List: All Unique Variants and Stats",
"GTA 6 Weapons Database: List of All Unique Variants & Stats"
],
[
"walk",
"/gta-6/weapons/assault-rifle",
"Kozlov KZ-59 | GTA 6 Weapon Stats & How To Get",
"Kozlov KZ-59"
],
[
"walk",
"/gta-6/weapons/comparison/",
"GTA 6 Weapon Comparison",
"GTA 6 Weapon Comparison"
],
[
"walk",
"/gta-6/animals/",
"GTA 6 Animals List & Guide: All Wildlife, Birds & Fish",
"GTA 6 Animals Guide: All Animals, Birds & Fish"
],
[
"walk",
"/gta-6/animals/gray-fox",
"Gray Fox | GTA 6 Animals Guide & Locations",
"Gray Fox"
],
[
"walk",
"/gta-6/characters/",
"GTA 6 Characters Guide: Main Protagonists & Full List",
"GTA 6 Characters Guide: Main Protagonists & Full List"
],
[
"walk",
"/gta-6/characters/jason",
"Jason Duval | GTA 6 Characters Guide, Bio & Voice Actor",
"Jason Duval"
],
[
"walk",
"/gta-6/gangs/",
"GTA 6 Gangs & Factions: Full List & Guide",
"GTA 6 Gangs & Factions Guide"
],
[
"walk",
"/gta-6/properties/",
"GTA 6 Properties List: All Safehouses & Garages",
"GTA 6 Properties & Garages: Full List & Guide"
],
[
"walk",
"/gta-6/properties/7th-avenue-garage",
"7th Avenue Garage | GTA 6 Properties & Garages",
"7th Avenue Garage"
],
[
"walk",
"/gta-6/radio-stations/",
"GTA 6 Radio Stations Player: Listen to All Songs & Music",
"GTA 6 Radio Station Songs & Tracklist"
],
[
"walk",
"/gta-6/radio-stations/flash-fm",
"Flash FM | GTA 6 Radio Station Songs & Tracklist",
"Flash FM"
],
[
"walk",
"/gta-6/missions/",
"GTA 6 Missions List: Story Mode Guide & Walkthrough",
"GTA 6 Story Missions Guide & Walkthrough"
],
[
"walk",
"/gta-6/missions/breakfast-run",
"Breakfast Run | GTA 6 Mission Guide & Walkthrough",
"Breakfast Run"
],
[
"walk",
"/gta-6/side-missions/",
"GTA 6 Activities & Side Missions Full List",
"GTA 6 Activities List & Side Missions Guide"
],
[
"walk",
"/gta-6/strangers-missions/",
"GTA 6 Strangers & Freaks: All Side Missions List & Guide",
"GTA 6 Strangers & Freaks Missions List & Guide"
],
[
"walk",
"/gta-6/random-events/",
"GTA 6 Random Events: All Locations, Rewards & Full Guide",
"GTA 6 Random Events List & Guide"
],
[
"walk",
"/gta-6/map/",
"GTA 6 Map: Full Interactive Map of Leonida & Collectibles",
"GTA 6 Interactive Map"
],
[
"walk",
"/gta-6/map-locations/",
"Where Is GTA 6 Set? Vice City & All Leonida Locations Guide",
"Where Is GTA 6 Set? Vice City & All Leonida Locations Guide"
],
[
"walk",
"/gta-6/gta-6-cheats-ps5-cheat-codes",
"GTA 6 Cheats PS5: Cheat Codes Guide for PlayStation 5",
"GTA 6 Cheats PS5: Cheat Codes Guide for PlayStation 5"
],
[
"walk",
"/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes",
"GTA 6 Cheats Xbox: Cheat Codes Guide for Xbox Series X|S",
"GTA 6 Cheats Xbox: Cheat Codes Guide for Xbox Series X|S"
],
[
"walk",
"/gta-6/gta-6-cheats-pc-full-list-of-cheat-codes",
"GTA 6 Cheats PC List & Guide: All GTA VI Cheat Codes for PC",
"GTA 6 Cheats PC List & Guide: All GTA VI Cheat Codes for PC"
],
[
"walk",
"/gta-6/news/",
"All GTA 6 News: Latest Grand Theft Auto VI Updates",
"All GTA 6 News: Latest Updates on Grand Theft Auto VI"
],
[
"walk",
"/gta-6/guides/",
"GTA 6 Guides: Tips, Walkthroughs & How-To Guides",
"GTA 6 Guides: Tips, Walkthroughs & How-To Guides"
],
[
"walk",
"/gta-6/videos/",
"GTA 6 Videos: All GTA 6 Official Trailers & Gameplay Videos",
"All GTA 6 Videos & Official Trailers"
],
[
"walk",
"/gta-6/screenshots/",
"GTA 6 Images: Full Screenshots Gallery (PS5 & Xbox Series)",
"GTA 6 Official Screenshots for PS5 and Xbox Series X|S"
],
[
"walk",
"/gta-6/artworks/",
"GTA 6 Artworks & Wallpapers | Grand Theft Auto VI Images",
"GTA 6 Official Artworks & Wallpapers"
],
[
"walk",
"/gta-6/covers/",
"GTA 6 Cover Art: Official Box Art for PS5 & Xbox Series X|S",
"GTA 6 Cover Art: Official Box Art"
],
[
"walk",
"/articles/gta-6/gta-6-100-completion-guide-interactive-checklist",
"GTA 6 100% Completion Guide & Interactive Checklist",
"GTA 6 100% Completion Guide & Interactive Checklist"
],
[
"walk",
"/gta-6/articles/gta-6-driving-tips",
"GTA 6 Driving Tips: Drifting, Ducking, Drive-Bys & Hidden Tricks",
"GTA 6 Driving Tips: Drifting, Ducking, Drive-Bys & Hidden Tricks"
],
[
"walk",
"/gta-6/nonexistent-page-xyz",
"404 Page Not Found",
"404 Page Not Found"
],
[
"F9-01",
"/gta-6/",
"GTA 6 Database: All Game Features, Guides & Media",
"GTA 6 (Grand Theft Auto VI)"
],
[
"F9-09",
"/gta-6/",
"GTA 6 Database: All Game Features, Guides & Media",
"GTA 6 (Grand Theft Auto VI)"
],
[
"F9-10",
"/gta-6/characters/",
"GTA 6 Characters Guide: Main Protagonists & Full List",
"GTA 6 Characters Guide: Main Protagonists & Full List"
],
[
"F9-17",
"/gta-6/characters/",
"GTA 6 Characters Guide: Main Protagonists & Full List",
"GTA 6 Characters Guide: Main Protagonists & Full List"
],
[
"F9-38",
"/",
"GTA Base: Everything on GTA 6, GTA 5, RDR2 & Rockstar Games",
""
],
[
"curl",
"/gta-6/news/page-2",
"Grand Theft Auto VI | Rockstar Games News & Guides - Page 2",
"Grand Theft Auto VI - Page 2"
],
[
"curl",
"/gta-6/news/page-5",
"Grand Theft Auto VI | Rockstar Games News & Guides - Page 5",
"Grand Theft Auto VI - Page 5"
],
[
"curl",
"/gta-6/guides/page-2",
"Grand Theft Auto VI | Rockstar Games News & Guides - Page 2",
"GTA 6 Guides: Tips, Walkthroughs & How-To Guides - Page 2"
],
[
"curl",
"/gta-6/guides/page-3",
"Grand Theft Auto VI | Rockstar Games News & Guides - Page 3",
"GTA 6 Guides: Tips, Walkthroughs & How-To Guides - Page 3"
]
];
const DETAIL = /^\/gta-6\/(vehicles|weapons|animals|characters|properties|radio-stations|missions)\/(?!comparison\/|best-)[^/]+$/;
const ARTICLE = /^\/(gta-6\/articles|articles\/gta-6)\/[^/?#]+$/;
const PAGED = /^\/gta-6\/[a-z-]+\/page-(\d+)$|^\/gta-6\/articles\/page-(\d+)$/;
function expected(url, heading) {
  const path = url.split('#')[0];
  if (/nonexistent|does-not-exist/.test(path)) return { kind: '404', test: (t) => t === '404 Page Not Found' };
  const p = PAGED.exec(path);
  if (p) { const n = p[1] || p[2]; return { kind: 'paged', test: (t) => t === `Grand Theft Auto VI | Rockstar Games News & Guides - Page ${n}` }; }
  if (DETAIL.test(path)) return { kind: 'detail', test: (t) => t.startsWith(`${heading} | GTA 6 `) };
  if (ARTICLE.test(path)) return { kind: 'article', test: (t) => t === heading };
  if (path === '/') return { kind: 'home', test: (t) => t.length > 0 };
  return { kind: 'section/list', test: (t) => t.includes('GTA 6') };
}
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
for (const [src, url, title, heading] of OBS) {
  const e = expected(url, heading);
  check(`${src} ${url} [${e.kind}]`, e.test(title), `title "${title}" heading "${heading}"`);
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
