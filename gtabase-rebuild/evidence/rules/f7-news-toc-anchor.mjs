// Rule F7-R5 (table of contents anchors) - standalone, analysis side only.
// Plain words: each table-of-contents entry links to "<article path>#<anchor>", where the anchor is the section
// heading turned into a slug: lower case, "&" and other punctuation removed, runs of spaces/dashes become one "-",
// no leading/trailing "-". Entries appear in document order with the heading text as label.
// Observations: runner F7-27 / F7-47 (`list:toc-links` labels, page URL) and the curl HTML of the same two
// articles (link targets).
const OBS = [
[
"F7-27",
"/gta-6/articles/gta-6-driving-tips",
[
"Basic Driving Controls",
"Drift Around Sharp Corners",
"Duck to Hide from the Cops",
"Shooting While Driving",
"Getting Out: Stop, Bail or Leave the Engine Running",
"Vehicle Melee",
"Taunting",
"Radio and Vehicle Functions",
"Pushing and Flipping Vehicles",
"Fuel and Repairs",
"GTA 6 Driving FAQ"
],
[
[
"Basic Driving Controls",
"basic-driving-controls"
],
[
"Drift Around Sharp Corners",
"drift-around-sharp-corners"
],
[
"Duck to Hide from the Cops",
"duck-to-hide-from-the-cops"
],
[
"Shooting While Driving",
"shooting-while-driving"
],
[
"Getting Out: Stop, Bail or Leave the Engine Running",
"getting-out-stop-bail-or-leave-the-engine-running"
],
[
"Vehicle Melee",
"vehicle-melee"
],
[
"Taunting",
"taunting"
],
[
"Radio and Vehicle Functions",
"radio-and-vehicle-functions"
],
[
"Pushing and Flipping Vehicles",
"pushing-and-flipping-vehicles"
],
[
"Fuel and Repairs",
"fuel-and-repairs"
],
[
"GTA 6 Driving FAQ",
"gta-6-driving-faq"
]
],
"/gta-6/articles/gta-6-driving-tips"
],
[
"F7-47",
"/articles/gta-6/gta-6-controls-guide-ps5-xbox-button-layout",
[
"General Controls",
"On-Foot Controls",
"Aiming Controls",
"Melee Combat Controls",
"Car, Motorcycle & Boat Controls",
"Plane & Helicopter Controls",
"Bicycle Controls",
"Swimming & Diving Controls",
"Parachute Controls",
"Movement Tips: Chain Jumps, Sliding Over Hoods & Diving"
],
[
[
"General Controls",
"general-controls"
],
[
"On-Foot Controls",
"on-foot-controls"
],
[
"Aiming Controls",
"aiming-controls"
],
[
"Melee Combat Controls",
"melee-combat-controls"
],
[
"Car, Motorcycle & Boat Controls",
"car-motorcycle-boat-controls"
],
[
"Plane & Helicopter Controls",
"plane-helicopter-controls"
],
[
"Bicycle Controls",
"bicycle-controls"
],
[
"Swimming & Diving Controls",
"swimming-diving-controls"
],
[
"Parachute Controls",
"parachute-controls"
],
[
"Movement Tips: Chain Jumps, Sliding Over Hoods & Diving",
"movement-tips-chain-jumps-sliding-over-hoods-diving"
]
],
"/articles/gta-6/gta-6-controls-guide-ps5-xbox-button-layout"
]
];
const slug = (t) => t.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-');
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
for (const [id, url, labels, links, path] of OBS) {
  check(`${id} link path = page path`, path === url.split('#')[0], `${path} vs ${url}`);
  check(`${id} ${labels.length} labels in order`, labels.join('|') === links.map((l) => l[0]).join('|'), labels.join('|'));
  for (const [text, anchor] of links) check(`${id} "${text}" -> #${anchor}`, slug(text) === anchor, `slug "${slug(text)}"`);
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
