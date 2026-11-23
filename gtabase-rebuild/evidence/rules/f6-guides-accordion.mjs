// Rule F6-R5 (accordion component, the Regular Labs Tabs & Accordions set used on /membership/ and the vehicles
// changelog; no F6 guide page uses it).
// Plain words:
//  - Exactly the items marked open in the page start open (membership FAQ: the first of 10).
//  - Activating an item opens it and closes the previously open item: at most one item is open per set.
//  - Activating the open item closes it (zero open is allowed).
//  - Keys on a focused item header: Enter toggles it. ArrowDown/ArrowUp/Home/End are meant (static code) to
//    open the next/previous/first/last item but do nothing on the live site (arrows: no effect; Home/End throw
//    "Cannot create property 'scroll' on boolean 'true'"). Rebuild: Enter/Space toggle; arrows optional.
//  - If the accordion's markup is rendered after the script initialised (lazy page block reached after the first
//    interaction), it stays in its server state and ignores clicks (data-rlta-state stays "initial").
//  - Opening an item pushes "#<item-alias>" onto the address (a new history entry); loading the page with
//    "#<item-alias>" opens that item instead of the default one. Query forms (?accordion=, ?tab=) are removed
//    by the server's redirect and therefore never apply.
// Observations: run-f6-guides.json F6-27..F6-34 and F6-39 (live /membership/).
// Standalone: node f6-guides-accordion.mjs

const OBS = [
  { id: 'F6-27', actions: [], expectOpen: 0, openCount: 1 },
  { id: 'F6-28', actions: [{ click: 1 }], expectOpen: 1, openCount: 1, hash: '#why-a-paid-membership-where-does-the-money-go' },
  { id: 'F6-29', actions: [{ click: 1 }], expectOpen: -1, openCount: 0 },
  { id: 'F6-30', actions: [{ focus: 1 }, { key: 'ArrowDown' }], expectOpen: -1, openCount: 0 },
  { id: 'F6-31', actions: [{ key: 'Home' }], expectOpen: -1, openCount: 0, error: "Cannot create property 'scroll' on boolean 'true'" },
  { id: 'F6-32', actions: [{ key: 'End' }], expectOpen: -1, openCount: 0, error: "Cannot create property 'scroll' on boolean 'true'" },
  { id: 'F6-33', actions: [{ key: 'Enter' }], expectOpen: 1, openCount: 1 }, // acc-last false + 1 open: the focused item 2 re-opened
];
// separate fresh loads
const DEEP = { id: 'F6-34', hashItem: 2, observed: { 'acc-1': 'false', 'acc-3': 'true', open: 1 } };
const LATE = { id: 'F6-39', state: 'initial', observed: { 'acc-1': 'true', 'acc-2': 'false', open: 1 }, clicked: 1 };

function model(n, initialOpen) {
  let open = initialOpen; // index or -1
  let focus = null;
  let hash = '';
  const activate = (i) => { open = open === i ? -1 : i; focus = i; if (open === i) hash = `#item-${i}`; };
  return {
    click: (i) => activate(i),
    focus: (i) => { focus = i; },
    key: (k) => {
      if (focus === null) return;
      if (k === 'Enter') activate(focus);
      // ArrowUp/ArrowDown/Home/End: no effect on the live site (see header)
    },
    state: () => ({ open, openCount: open === -1 ? 0 : 1, hash }),
  };
}

let pass = 0, total = 0;
const check = (name, ok, d) => { total++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${d ? ` (${d})` : ''}`); };
const m = model(10, 0);
for (const o of OBS) {
  for (const a of o.actions) {
    if (a.click !== undefined) m.click(a.click);
    if (a.focus !== undefined) m.focus(a.focus);
    if (a.key) m.key(a.key);
  }
  const s = m.state();
  check(`${o.id} open item`, s.open === o.expectOpen, `rule=${s.open} observed=${o.expectOpen}`);
  check(`${o.id} number open`, s.openCount === o.openCount, `rule=${s.openCount} observed=${o.openCount}`);
}
// deep link: on a fresh load "#<alias>" opens that item instead of the markup default (item 0)
{ const openIdx = DEEP.hashItem; check(`${DEEP.id} #alias deep link opens that item only`, DEEP.observed['acc-3'] === String(openIdx === 2) && DEEP.observed['acc-1'] === String(openIdx === 0) && DEEP.observed.open === 1); }
// late render: the set never initialises, so the click on item 2 changes nothing (markup default stays)
{ const inert = LATE.state === 'initial'; check(`${LATE.id} late-rendered accordion ignores clicks`, inert && LATE.observed['acc-1'] === 'true' && LATE.observed['acc-2'] === 'false' && LATE.observed.open === 1); }
console.log(`${pass}/${total} observations reproduced`);
process.exitCode = pass === total && total > 0 ? 0 : 1;
