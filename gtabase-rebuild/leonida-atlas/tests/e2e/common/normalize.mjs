// Shared normalization for recorded readouts (used by build-vectors.mjs and print-parity.mjs).
// Config JSON (optional, per app):
// {
//   "stripPrefix": { "<readout key>": "<prefix to drop>" },        e.g. labels in accessible names
//   "replace":     [["<regex>", "<replacement>"], ...],             applied to every value
//   "ignore":      ["<readout key>", ...],                          UI-only readouts (button names)
//   "emptyListIsAbsent": true,                                      '' list === missing list control
//   "notComparable": { "<case id>": "<reason>" }                    left out of parity output
// }
import { readFileSync } from 'node:fs';

export function readJson(path) {
  const text = readFileSync(path, 'utf8');
  return JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
}

export function loadConfig(path) {
  const cfg = path ? readJson(path) : {};
  return {
    stripPrefix: cfg.stripPrefix ?? {},
    replace: (cfg.replace ?? []).map(([p, r]) => [new RegExp(p, 'g'), r]),
    ignore: new Set(cfg.ignore ?? []),
    emptyListIsAbsent: cfg.emptyListIsAbsent ?? true,
    notComparable: cfg.notComparable ?? {},
  };
}

/** Direction marks (U+200E/U+200F) appear in localized dates and headers; they never matter. */
const MARKS = /[‎‏]/g;

export function normalizeValue(cfg, key, value) {
  if (value == null || value === '<missing>') return null;
  let v = String(value).replace(MARKS, '');
  const prefix = cfg.stripPrefix[key];
  if (prefix && v.startsWith(prefix)) v = v.slice(prefix.length);
  for (const [re, rep] of cfg.replace) v = v.replace(re, rep);
  if (cfg.emptyListIsAbsent && key.startsWith('list:') && v === '') return null;
  return v;
}

/** Normalized { key: value } for one recorded case, without ignored or empty readouts. */
export function normalizedValues(cfg, values) {
  const out = {};
  for (const [k, v] of Object.entries(values ?? {})) {
    if (cfg.ignore.has(k)) continue;
    const n = normalizeValue(cfg, k, v);
    if (n != null) out[k] = n;
  }
  return out;
}
