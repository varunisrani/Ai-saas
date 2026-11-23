// Rule F9-R4 (main menu: desktop hover dropdowns, phone toggle menu) - standalone, analysis side only.
// Plain words:
//  Desktop (wide layout, menu toggle not displayed): sub-menus of "GTA 6", "Red Dead 2", "GTA 5 & Online" and
//  "More" open only while the pointer hovers the parent item and close when it leaves. Keyboard focus on the
//  parent (or Tab into its links) does NOT open it. Activating the parent link (click or Enter) navigates to
//  its page; sub links navigate.
//  Phone (narrow layout, toggle displayed): the main list starts collapsed. Tapping the toggle opens it
//  (toggle gets the "opened" state, list "open") and tapping again closes it. Tapping a parent that has a
//  sub-menu does not navigate: it toggles that sub-menu (same as its +/- button); tapping a sub link navigates.
// Observations: runner cases F9-04..F9-17 (run-f9-shell.json); "documentLoads" = number of GET /gta-6/ in calls.
const OBS = [
[
"F9-04",
"desktop",
[],
{
"subVisible": "false",
"toggleVisible": "false"
}
],
[
"F9-05",
"desktop",
[
"hover parent"
],
{
"subVisible": "true"
}
],
[
"F9-06",
"desktop",
[
"hover parent",
"hover elsewhere"
],
{
"subVisible": "false"
}
],
[
"F9-07",
"desktop",
[
"focus parent"
],
{
"subVisible": "false"
}
],
[
"F9-08",
"desktop",
[
"focus parent",
"Tab"
],
{
"subVisible": "false"
}
],
[
"F9-09",
"desktop",
[
"focus parent",
"Enter"
],
{
"documentLoads": 2
}
],
[
"F9-10",
"desktop",
[
"hover parent",
"click sub link"
],
{
"url": "/gta-6/characters/"
}
],
[
"F9-11",
"desktop",
[
"hover More"
],
{
"moreVisible": "true"
}
],
[
"F9-12",
"phone",
[],
{
"menuVisible": "false",
"toggleClass": "<missing>"
}
],
[
"F9-13",
"phone",
[
"tap toggle"
],
{
"menuVisible": "true",
"toggleClass": "menu-opened",
"menuClass": "mod-menu mod-list main-menu nav-pills open",
"subVisible": "false"
}
],
[
"F9-14",
"phone",
[
"tap toggle",
"tap parent"
],
{
"subVisible": "true",
"subToggleClass": "submenu-button submenu-opened",
"subClass": "mod-menu__sub list-unstyled open",
"documentLoads": 1
}
],
[
"F9-15",
"phone",
[
"tap toggle",
"tap parent",
"tap sub toggle"
],
{
"subVisible": "false",
"subToggleClass": "submenu-button",
"subClass": "mod-menu__sub list-unstyled"
}
],
[
"F9-16",
"phone",
[
"tap toggle",
"tap toggle"
],
{
"menuVisible": "false",
"toggleClass": "",
"menuClass": "mod-menu mod-list main-menu nav-pills"
}
],
[
"F9-17",
"phone",
[
"tap toggle",
"tap parent",
"click sub link"
],
{
"url": "/gta-6/characters/"
}
]
];
function model(layout, events) {
  const s = { menuOpen: false, subOpen: false, hover: false, moreHover: false, loads: 1, url: '/gta-6/', toggleClicked: false };
  for (const e of events) {
    if (e === 'hover parent') s.hover = true;
    else if (e === 'hover elsewhere') s.hover = false;
    else if (e === 'hover More') s.moreHover = true;
    else if (e === 'focus parent' || e === 'Tab') { /* no effect on visibility */ }
    else if (e === 'Enter') { if (layout === 'desktop') s.loads++; }
    else if (e === 'tap toggle') { s.menuOpen = !s.menuOpen; s.toggleClicked = true; }
    else if (e === 'tap parent') { if (layout === 'phone') s.subOpen = !s.subOpen; else s.loads++; }
    else if (e === 'tap sub toggle') s.subOpen = !s.subOpen;
    else if (e === 'click sub link') s.url = '/gta-6/characters/';
  }
  const subVisible = layout === 'desktop' ? s.hover : s.menuOpen && s.subOpen;
  return {
    subVisible: String(subVisible), toggleVisible: String(layout === 'phone' && false), moreVisible: String(s.moreHover),
    menuVisible: String(layout === 'desktop' || s.menuOpen),
    toggleClass: !s.toggleClicked ? '<missing>' : s.menuOpen ? 'menu-opened' : '',
    menuClass: 'mod-menu mod-list main-menu nav-pills' + (s.menuOpen ? ' open' : ''),
    subToggleClass: 'submenu-button' + (s.subOpen ? ' submenu-opened' : ''),
    subClass: 'mod-menu__sub list-unstyled' + (s.subOpen ? ' open' : ''),
    documentLoads: s.loads, url: s.url,
  };
}
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
for (const [id, layout, events, observed] of OBS) {
  const m = model(layout, events);
  for (const [k, v] of Object.entries(observed)) check(`${id} ${layout} [${events.join(', ')}] ${k}`, m[k] === v, `model ${JSON.stringify(m[k])} vs observed ${JSON.stringify(v)}`);
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
