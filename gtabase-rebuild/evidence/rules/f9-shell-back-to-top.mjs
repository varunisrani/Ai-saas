// Rule F9-R3 (back-to-top control) - standalone, analysis side only.
// Plain words: a "Back to top" link (aria-label "Back to top", href "#") sits at the page bottom-right.
// It is shown once the page is scrolled more than 300 px; beyond 1200 px it also gets a faded look; the
// faded look stays when scrolling back up between 300 and 1200 px and is cleared together with "shown"
// at 300 px or less. Activating it smooth-scrolls to the very top without changing the URL hash.
// Observations: probe-f9-backtop.json (scroll sequence on /gta-6/ at 1366x900) and runner cases F9-30..F9-32.
const SEQ = [[0, "cd-top"], [250, "cd-top"], [299, "cd-top"], [301, "cd-top cd-is-visible"], [350, "cd-top cd-is-visible"], [1199, "cd-top cd-is-visible"], [1201, "cd-top cd-is-visible cd-fade-out"], [1500, "cd-top cd-is-visible cd-fade-out"], [900, "cd-top cd-is-visible cd-fade-out"], [200, "cd-top"]];
const AFTER_CLICK = [0, "cd-top", ""];
const RUN = [["F9-30", "top of page (no scroll)", "cd-top"], ["F9-31", "End key (page bottom, > 1200)", "cd-top cd-is-visible cd-fade-out"], ["F9-32", "End key, then click control", "cd-top"]];
function next(state, y) {
  if (y > 300) { state.visible = true; if (y > 1200) state.faded = true; }
  else { state.visible = false; state.faded = false; }
  return state;
}
const cls = (s) => ['cd-top', s.visible && 'cd-is-visible', s.faded && 'cd-fade-out'].filter(Boolean).join(' ');
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
let st = { visible: false, faded: false };
for (const [y, observed] of SEQ) { st = next(st, y); check(`scrollY ${y}`, cls(st) === observed, `model "${cls(st)}" vs "${observed}"`); }
st = next(next(st, 2000), 0);
check('after click: back at top, no hash, hidden', AFTER_CLICK[0] === 0 && AFTER_CLICK[2] === '' && AFTER_CLICK[1] === cls(st), JSON.stringify(AFTER_CLICK));
const expect = { 'F9-30': cls(next({ visible: false, faded: false }, 0)), 'F9-31': cls(next({ visible: false, faded: false }, 5000)), 'F9-32': cls(next(next({ visible: false, faded: false }, 5000), 0)) };
for (const [id, what, observed] of RUN) check(`${id} ${what}`, expect[id] === observed, `model "${expect[id]}" vs "${observed}"`);
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
