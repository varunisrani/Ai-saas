// Rule F10-R3 (map marker favourite star, guest).
// Plain words: a map marker's popup has a star button named "Add to favourites" (pressed = false). A guest who
// activates it gets no favourite: the popup closes and a small panel (dialog named "Favourites", heading
// "Favourites") explains "Want to keep your favourite places? Members of GTABase can star any marker and find
// it again under Personal, on every device. Log in to start." with a "Log in" link that opens the login dialog
// and a "Join MyBase" link to the free sign-up page in a new tab. No request is sent and nothing is stored.
// The panel heading and both links are styled in capitals (visible text "FAVOURITES", "LOG IN", "JOIN MYBASE";
// the underlying words and the dialog's accessible name keep normal case: "Favourites").
// Observations: run-f10-favorites.json F10-22..F10-25. Standalone: node f10-favorites-map-guest.mjs

function guestStar() {
  return {
    starLabel: 'Add to favourites', starPressed: 'false',
    panel: 'true', role: 'dialog', name: 'Favourites', title: 'Favourites'.toUpperCase(),
    text: 'Want to keep your favourite places? Members of GTABase can star any marker and find it again under Personal, on every device. Log in to start.',
    login: 'Log in'.toUpperCase(), loginHref: '#loginbox', join: 'Join MyBase'.toUpperCase(), joinHref: '/membership/free/', joinTarget: '_blank',
    popupsOpen: '0', stored: '<missing>',
  };
}

const OBS = [
   {
    "id": "F10-22",
    "expect": {
     "starLabel": "Add to favourites",
     "starPressed": "false",
     "stored": "<missing>"
    }
   },
   {
    "id": "F10-23",
    "expect": {
     "panel": "true",
     "role": "dialog",
     "name": "Favourites",
     "title": "FAVOURITES",
     "text": "Want to keep your favourite places? Members of GTABase can star any marker and find it again under Personal, on every device. Log in to start.",
     "login": "LOG IN",
     "loginHref": "#loginbox",
     "join": "JOIN MYBASE",
     "joinHref": "/membership/free/",
     "joinTarget": "_blank",
     "popupsOpen": "0",
     "stored": "<missing>"
    }
   }
  ];

let pass = 0;
for (const o of OBS) {
  const r = guestStar();
  const diffs = Object.keys(o.expect).filter((k) => o.expect[k] !== r[k]).map((k) => `${k}: observed ${o.expect[k]}, rule ${r[k]}`);
  const ok = !diffs.length;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id}${ok ? '' : ' ' + diffs.join('; ')}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
