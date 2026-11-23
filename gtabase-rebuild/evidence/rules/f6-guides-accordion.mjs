// Rule F6-R5 (accordion component, the Regular Labs Tabs & Accordions set used on /membership/ and the vehicles
// changelog; no F6 guide page uses it).
// Plain words:
//  - Exactly the items marked open in the page start open (membership FAQ: the first of 10).
//  - Activating an item opens it and closes the previously open item: at most one item is open per set.
//  - Activating the open item closes it (zero open is allowed).
//  - Keys on a focused item header: Enter toggles it; ArrowDown/ArrowUp open the next/previous item;
//    Home opens the first, End the last.
//  - Opening an item pushes "#<item-alias>" onto the address (a new history entry); loading the page with
//    "#<item-alias>" opens that item instead of the default one. Query forms (?accordion=, ?tab=) are removed
//    by the server's redirect and therefore never apply.
// Observations: run-f6-guides.json F6-27..F6-34 (live /membership/).
// Standalone: node f6-guides-accordion.mjs

const OBS = globalThis.ACC_OBS ?? [];

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
      else if (k === 'ArrowDown') { const i = Math.min(n - 1, focus + 1); open = i; focus = i; hash = `#item-${i}`; }
      else if (k === 'ArrowUp') { const i = Math.max(0, focus - 1); open = i; focus = i; hash = `#item-${i}`; }
      else if (k === 'Home') { open = 0; focus = 0; hash = '#item-0'; }
      else if (k === 'End') { open = n - 1; focus = n - 1; hash = `#item-${n - 1}`; }
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
console.log(`${pass}/${total} observations reproduced`);
process.exitCode = pass === total && total > 0 ? 0 : 1;
