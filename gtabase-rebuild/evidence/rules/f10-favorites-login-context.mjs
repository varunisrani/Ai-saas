// Rule F10-R2 (login dialog context).
// Plain words: the login dialog has a default title "Sign in to MyBase". Opening it from a favorites button
// switches it into "favorites context": title "Save your GTA 6 favorites" plus one extra benefits line
// (added once, never duplicated). Opening it afterwards from a regular "Log In" link (a real user click)
// leaves favorites context: the title goes back to "Sign in to MyBase", but the benefits line stays until the
// page is reloaded. Closing the dialog (close button or Escape) does not change the context. A reload starts
// fresh (default title, no benefits line).
// Observations: run-f10-favorites.json F10-02, F10-09..F10-13, F10-17, F10-19, F10-24.
// Standalone: node f10-favorites-login-context.mjs

const DEFAULT = 'Sign in to MyBase';
const FAV = 'Save your GTA 6 favorites';

function simulate(actions) {
  const s = { open: false, title: DEFAULT, lines: 0, favContext: false };
  for (const a of actions) {
    if (a === 'fav') { if (!s.lines) s.lines = 1; s.title = FAV; s.favContext = true; s.open = true; }
    else if (a === 'login-link') { if (s.favContext) { s.title = DEFAULT; s.favContext = false; } s.open = true; }
    else if (a === 'close' || a === 'escape') s.open = false;
    else if (a === 'reload') { s.open = false; s.title = DEFAULT; s.lines = 0; s.favContext = false; }
  }
  return { visible: String(s.open), title: s.title, benefits: String(s.lines), cls: s.favContext ? 'login-context-favorites' : '' };
}

const OBS = [
   {
    "id": "F10-02",
    "actions": [
     "fav"
    ],
    "expect": {
     "visible": "true",
     "title": "Save your GTA 6 favorites",
     "benefits": "1",
     "cls": "login-context-favorites"
    }
   },
   {
    "id": "F10-09",
    "actions": [
     "fav",
     "close"
    ],
    "expect": {
     "visible": "false"
    }
   },
   {
    "id": "F10-10",
    "actions": [
     "fav",
     "escape"
    ],
    "expect": {
     "visible": "false"
    }
   },
   {
    "id": "F10-11",
    "actions": [
     "fav",
     "escape",
     "fav"
    ],
    "expect": {
     "visible": "true",
     "title": "Save your GTA 6 favorites",
     "benefits": "1"
    }
   },
   {
    "id": "F10-12",
    "actions": [
     "fav",
     "escape",
     "login-link"
    ],
    "expect": {
     "visible": "true",
     "title": "Sign in to MyBase",
     "benefits": "1",
     "cls": ""
    }
   },
   {
    "id": "F10-13",
    "actions": [
     "login-link"
    ],
    "expect": {
     "visible": "true",
     "title": "Sign in to MyBase",
     "benefits": "0"
    }
   },
   {
    "id": "F10-16",
    "actions": [
     "fav",
     "escape"
    ],
    "expect": {
     "visible": "false"
    }
   },
   {
    "id": "F10-17",
    "actions": [
     "fav",
     "reload"
    ],
    "expect": {
     "visible": "false",
     "title": "Sign in to MyBase",
     "benefits": "0"
    }
   },
   {
    "id": "F10-19",
    "actions": [
     "login-link"
    ],
    "expect": {
     "visible": "true",
     "title": "Sign in to MyBase",
     "benefits": "0"
    }
   },
   {
    "id": "F10-24",
    "actions": [
     "login-link"
    ],
    "expect": {
     "visible": "true",
     "title": "Sign in to MyBase"
    }
   }
  ];

let pass = 0;
for (const o of OBS) {
  const r = simulate(o.actions);
  const diffs = Object.keys(o.expect).filter((k) => o.expect[k] !== r[k]).map((k) => `${k}: observed ${o.expect[k]}, rule ${r[k]}`);
  const ok = !diffs.length;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} [${o.actions.join(' > ')}]${ok ? '' : ' ' + diffs.join('; ')}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
