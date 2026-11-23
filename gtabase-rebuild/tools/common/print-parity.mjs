// Prints a run file (original side from run-cases, or clone side from the rebuild's replay test —
// same JSON shape) as normalized lines "<id> | key=value; ..." for line-by-line comparison.
// Usage: node print-parity.mjs <run.json> [normalize.json|-] [--only <id regex>]
import { loadConfig, normalizedValues, readJson } from './normalize.mjs';

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? new RegExp(args[onlyIdx + 1]) : null;
const positional = onlyIdx >= 0 ? args.filter((_, i) => i !== onlyIdx && i !== onlyIdx + 1) : args;
const [runPath, cfgPath] = positional;
const cfg = loadConfig(cfgPath && cfgPath !== '-' ? cfgPath : null);
const run = readJson(runPath);

for (const c of run.cases) {
  if (cfg.notComparable[c.id] || (only && !only.test(c.id))) continue;
  if (c.error) { console.log(`${c.id} | ERROR`); continue; }
  const values = normalizedValues(cfg, c.values ?? c.extra ?? {});
  const line = Object.keys(values).sort().map((k) => `${k}=${values[k]}`).join('; ');
  console.log(`${c.id} | ${line}`);
}
