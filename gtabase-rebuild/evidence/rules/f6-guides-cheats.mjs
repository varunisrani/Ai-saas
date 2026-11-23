// Rule F6-R4 (cheat pages): one static page per platform; the console pages share the same cheat list.
// Plain words:
//  - A console cheat page lists every cheat once, grouped under 5 category headings shown in upper case
//    (Player, Combat, Vehicle Spawn, Environment, Screen Filter); total = sum of the category sizes.
//  - Each cheat row = name, one-line effect, "How to unlock: ..." and the button sequence drawn as a row of
//    D-pad icons; every icon is an image whose text alternative is the direction word (UP/DOWN/LEFT/RIGHT).
//  - The sequences are the same on PS5 and Xbox (D-pad only); only the activation combo in the "How to
//    enter" steps differs: PS5 = UP, then hold L1 + press R1; Xbox = UP, then hold LB + press RB.
//  - A two-card platform switcher (PS5, Xbox) sits under the intro; the current platform's card is marked
//    "You are here" (shown upper-case). There is no copy button, filter, search or sort on these pages.
//  - The PC page has no cheat rows (no PC release); it links to all three platform pages from a 3-cell table
//    and has no platform switcher.
//  - The quick index lists one link per section heading; each link is "<page path>#<heading-slug>".
// Observations: run-f6-guides.json F6-18 (PS5), F6-19 (index link), F6-21 (Xbox), F6-22 (PC), F6-37 (390x844).
// Standalone: node f6-guides-cheats.mjs

const OBS = {
  'F6-18': { platform: 'ps5', rows: 61, categories: 5, categoryList: 'PLAYER CHEATS || COMBAT CHEATS || VEHICLE SPAWN CHEATS || ENVIRONMENT CHEATS || SCREEN FILTER CHEATS', cat1: 10, cat3: 21, firstKeys: 8, key1: 'UP', key2: 'RIGHT', otherIcons: 0, controls: 0, platformLinks: 2, current: 'GTA 6 Cheats for PS5 YOU ARE HERE', toc: 8, tocFirst: '/gta-6/gta-6-cheats-ps5-cheat-codes#how-to-enter-gta-6-cheats-on-ps5', howto: [null, 'L1', 'R1'], howtoCount: 3, unlock: 'How to unlock: Finish the story.' },
  'F6-21': { platform: 'xbox', rows: 61, categories: 5, firstKeys: 8, key1: 'UP', otherIcons: 0, controls: 0, platformLinks: 2, current: 'GTA 6 Cheats for Xbox Series X|S YOU ARE HERE', toc: 8, howto: [null, 'LB', 'RB'] },
  'F6-19': { url: '/gta-6/gta-6-cheats-ps5-cheat-codes#combat-cheats', href: '/gta-6/gta-6-cheats-ps5-cheat-codes#combat-cheats', heading: 'Combat Cheats' },
  'F6-37': { rows: 61, keyVisible: 'true', switcherVisible: 'true' },
};
const PC = globalThis.PC_OBS ?? null; // filled below when F6-22 is available

// category sizes stated in the page text ("10 Player, 11 Combat, 21 Vehicle Spawn, 3 Environment, 16 Screen Filter")
const STATED = { player: 10, combat: 11, vehicle: 21, environment: 3, filter: 16 };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const activation = { ps5: ['L1', 'R1'], xbox: ['LB', 'RB'] };

let pass = 0, n = 0;
const check = (name, ok, detail) => { n++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`); };
const ps5 = OBS['F6-18'], xbox = OBS['F6-21'];
const sum = Object.values(STATED).reduce((a, b) => a + b, 0);
check('F6-18 total rows = sum of stated category sizes', sum === ps5.rows, `${sum}`);
check('F6-18 category 1 / 3 sizes match the stated ones', ps5.cat1 === STATED.player && ps5.cat3 === STATED.vehicle);
check('F6-18 5 categories, headings shown upper-case', ps5.categories === 5 && ps5.categoryList === ['Player', 'Combat', 'Vehicle Spawn', 'Environment', 'Screen Filter'].map((c) => `${c} Cheats`.toUpperCase()).join(' || '));
check('F6-18/F6-21 same cheat count on PS5 and Xbox', ps5.rows === xbox.rows && ps5.categories === xbox.categories);
check('F6-18/F6-21 sequences use only direction icons', ps5.otherIcons === 0 && xbox.otherIcons === 0 && /^(UP|DOWN|LEFT|RIGHT)$/.test(ps5.key1) && /^(UP|DOWN|LEFT|RIGHT)$/.test(ps5.key2));
check('F6-18/F6-21 first cheat has the same sequence length and first step', ps5.firstKeys === xbox.firstKeys && ps5.key1 === xbox.key1);
check('F6-18 PS5 activation = hold L1 + press R1', ps5.howto[1] === activation.ps5[0] && ps5.howto[2] === activation.ps5[1] && ps5.howtoCount === 3);
check('F6-21 Xbox activation = hold LB + press RB', xbox.howto[1] === activation.xbox[0] && xbox.howto[2] === activation.xbox[1]);
check('F6-18/F6-21 two platform cards, current one marked', ps5.platformLinks === 2 && xbox.platformLinks === 2 && /YOU ARE HERE$/.test(ps5.current) && /PS5/.test(ps5.current) && /Xbox/.test(xbox.current));
check('F6-18/F6-21 no copy button / filter / search controls', ps5.controls === 0 && xbox.controls === 0);
check('F6-18 unlock line starts with "How to unlock:"', ps5.unlock.startsWith('How to unlock: '));
check('F6-18 quick index first link = page path + # + slug of the first section', ps5.tocFirst === `/gta-6/gta-6-cheats-ps5-cheat-codes#${slug('How To Enter GTA 6 Cheats on PS5')}`);
check('F6-19 index link target = page path + # + slug(heading)', OBS['F6-19'].href === `/gta-6/gta-6-cheats-ps5-cheat-codes#${slug(OBS['F6-19'].heading)}` && OBS['F6-19'].url === OBS['F6-19'].href);
check('F6-37 same list and icons at 390x844', OBS['F6-37'].rows === ps5.rows && OBS['F6-37'].keyVisible === 'true' && OBS['F6-37'].switcherVisible === 'true');
if (PC) {
  check('F6-22 PC page: no cheat rows, no switcher', PC.rows === 0 && PC.platformLinks === 0);
  check('F6-22 PC page: 3 platform links in a table (PS5, Xbox, PC)', PC.tableLinks === 3);
}
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
