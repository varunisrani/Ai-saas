// Small helpers for recorded runs.
//   node runs.mjs show <run.json>                 compact table of one run
//   node runs.mjs count <runsDir>                 cases / clean per suite and in total
//   node runs.mjs diff <a.txt> <b.txt>            line diff of two print-parity outputs
//   node runs.mjs pick <casesDir> <out.json> <suite>:<id,id,...> [...]   build a parity case set
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJson } from './normalize.mjs';

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'show') {
  for (const c of readJson(rest[0]).cases) {
    const vals = Object.entries(c.values ?? c.extra ?? {}).map(([k, v]) => `${k}=${v}`).join('; ');
    console.log(`${String(c.id).padEnd(12)} | ${vals}${c.error ? ` | ERROR ${c.error}` : ''}`);
  }
} else if (cmd === 'count') {
  let total = 0, clean = 0;
  for (const f of readdirSync(rest[0]).filter((n) => /^run-.+\.json$/.test(n)).sort()) {
    const cases = readJson(join(rest[0], f)).cases;
    const ok = cases.filter((c) => !c.error).length;
    total += cases.length; clean += ok;
    console.log(`${f.slice(4, -5).padEnd(14)} ${String(cases.length).padStart(4)} cases ${String(ok).padStart(4)} clean`);
  }
  console.log(`TOTAL          ${total} cases ${clean} clean`);
} else if (cmd === 'diff') {
  const read = (p) => {
    const t = readFileSync(p, 'utf8');
    return (t.charCodeAt(0) === 0xfeff ? t.slice(1) : t).split(/\r?\n/).filter(Boolean);
  };
  const a = read(rest[0]), b = read(rest[1]);
  const byId = (lines) => new Map(lines.map((l) => [l.split(' | ')[0], l]));
  const A = byId(a), B = byId(b);
  let diffs = 0;
  for (const id of new Set([...A.keys(), ...B.keys()])) {
    if (A.get(id) !== B.get(id)) { diffs++; console.log(`- ${A.get(id) ?? `${id} | <absent>`}\n+ ${B.get(id) ?? `${id} | <absent>`}\n`); }
  }
  console.log(`compared ${A.size} vs ${B.size} lines; differing: ${diffs}`);
  process.exitCode = diffs ? 1 : 0;
} else if (cmd === 'pick') {
  const [casesDir, out, ...picks] = rest;
  const cases = [];
  for (const p of picks) {
    const [suite, ids] = p.split(':');
    const all = readJson(join(casesDir, `${suite}.json`));
    for (const id of ids.split(',')) {
      const c = all.find((x) => x.id === id);
      if (!c) throw new Error(`${suite}: ${id} not found`);
      cases.push({ ...c, id: `P-${id}` });
    }
  }
  writeFileSync(out, JSON.stringify(cases, null, 2));
  console.log(`${cases.length} parity cases -> ${out}`);
} else {
  console.error('usage: node runs.mjs show|count|diff|pick ...');
  process.exit(2);
}
