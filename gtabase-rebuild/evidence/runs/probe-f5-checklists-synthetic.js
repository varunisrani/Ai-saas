(async () => {
  // Synthetic-attribute probe: changes data-* attributes on the live 100% page (this browser only) and
  // clicks checkboxes so the site's own checklist script computes the percentage. Read-only for the server.
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const all = (id) => [...document.querySelectorAll('input[data-checklist-id="gta6-100"][id="' + id + '"]')];
  const sec = (id) => document.querySelector('.checklist-item input[data-checklist-id="gta6-100"][id="' + id + '"]');
  const set = (id, name, v) => all(id).forEach(e => v === null ? e.removeAttribute(name) : e.setAttribute(name, v));
  const bar = () => document.getElementById('completion-progress-bar');
  const snap = (label) => ({ step: label, text: document.getElementById('completion-percentage').textContent, width: bar().style.width, valuenow: bar().getAttribute('aria-valuenow'), store: localStorage.getItem('guest_checklists') });
  const click = async (id) => { sec(id).click(); await sleep(700); };
  const out = [];
  await sleep(1500);
  out.push(snap('start'));
  // A: multiplier 3 on one exploration child -> share = 20 / (19 + 3) * 3
  set('kenton', 'data-multiplier', '3');
  await click('kenton'); out.push(snap('A1 kenton x3 ticked'));
  await click('cards'); out.push(snap('A2 + cards'));
  await click('kenton'); await click('cards'); set('kenton', 'data-multiplier', null); out.push(snap('A3 reset'));
  // B: percentage limit binds: story-tasks limit 5, tick optional (6)
  set('story-tasks', 'data-percentage-limit', '5');
  await click('optional'); out.push(snap('B1 optional 6 under limit 5'));
  await click('optional'); set('story-tasks', 'data-percentage-limit', '27'); out.push(snap('B2 reset'));
  // C: progress-id group: vehicles and weapons share one group under discovery (3%)
  set('vehicles', 'data-progress-id', 'grp'); set('weapons', 'data-progress-id', 'grp');
  await click('vehicles'); out.push(Object.assign(snap('C1 vehicles (grp)'), { parent: sec('discovery').checked }));
  await click('weapons'); out.push(Object.assign(snap('C2 + weapons (same grp)'), { parent: sec('discovery').checked }));
  await click('weapons'); out.push(Object.assign(snap('C3 - weapons'), { parent: sec('discovery').checked }));
  await click('animals'); out.push(Object.assign(snap('C4 + animals'), { parent: sec('discovery').checked }));
  await click('animals'); await click('vehicles'); set('vehicles', 'data-progress-id', null); set('weapons', 'data-progress-id', null); out.push(snap('C5 reset'));
  // D: clamp: story worth 150 -> display capped at 100
  set('story', 'data-percentage', '150');
  await click('story'); out.push(snap('D1 story=150'));
  await click('story'); set('story', 'data-percentage', '50'); out.push(snap('D2 reset'));
  // E: top-level item without children uses its own percentage times multiplier (story 50 x 2 -> 100)
  set('story', 'data-percentage', '12.345'); 
  await click('story'); out.push(snap('E1 story=12.345 (rounding)'));
  await click('story'); set('story', 'data-percentage', '50'); out.push(snap('E2 reset'));
  return out;
})()
