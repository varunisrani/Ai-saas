// Runs recorded browser cases against a web app - the ORIGINAL site, or the rebuild for parity - and
// records what it shows. App-agnostic: everything app-specific lives in a profile JSON
// (references/web-harness.md, assets/examples/demo.profile.json). The run file has the same shape as
// the desktop runners' files, so scripts/common/*.mjs (build-vectors, print-parity, runs) work as-is.
//
// Run it from a folder where playwright-core is installed (npm i -D playwright-core). It drives the
// installed Edge or Chrome (profile.browser.channel), so no browser download is needed.
//
//   node run-cases.mjs --profile app.profile.json --cases evidence/cases/feat.json --out evidence/runs/run-feat.json
//   node run-cases.mjs --profile app.profile.json --login
//        opens a window where the USER signs in; saves the signed-in state to profile.browser.storageState
//   node run-cases.mjs --profile app.profile.json --vectors tests/vectors/feat.json [--normalize normalize.json]
//        replays generated vectors and checks them: PASS/FAIL per vector, exit 1 on any failure
// Options: --base-url <url> (e.g. the rebuild at http://localhost:3000) · --only <id regex> · --headed
//          --headless (force, also for --login) · --shots <dir> (default: <out dir>/screens)
//
// Case file: JSON array of { id, mode?, steps, reads?, reset? }
//   steps  array of strings (or one string, steps separated by " ; "); prefix try: = ignore a failure
//     goto:<path>       open baseUrl + path              mode:<name>   run profile.modes[name] (path or steps)
//     click:<t>  dblclick:<t>  hover:<t>  check:<t>  uncheck:<t>  focus:<t>  scroll:<t>
//     fill:<token>=<text>   select:<token>=<value or label>   (fill/select need a profile token name)
//     press:<key> (Enter, Control+A, ...)   type:<text> (keyboard typing into the focused element)
//     keydown:<key>  keyup:<key>  (hold/release a key, e.g. keydown:Control ; click:<t> ; keyup:Control = Ctrl+click)
//     clickat:<x>,<y>  (mouse click at viewport coordinates, for controls drawn only by CSS pseudo-elements)
//     wait:<ms>  wait:idle  waitfor:<t> (visible)  waitgone:<t> (hidden or absent)
//     reload  back  forward  viewport:<w>x<h>  clear:local|session|cookies  macro:<name>  shot:<name>
//     <t> = a key of profile.tokens or a raw Playwright selector (role=button[name="Save"], text=..., css)
//   reads  extra readouts; each is a read spec and is also its key in the output:
//     url  title  text:<t>  value:<t>  attr:<t>@<name>  count:<t>  list:<t>  visible:<t>  enabled:<t>
//     checked:<t>  local:<key>  session:<key>  calls  blocked  dialog  errors  console
//   reset  key of profile.resets ('clear' when the profile defines it, else none) or 'none'
//
// Write guard: unless the profile says "readOnly": false, every request that is not GET/HEAD/OPTIONS is
// aborted (and listed in the `blocked` readout) unless it matches profile.guard.allow - regexes tested
// against "<METHOD> <url>" and "next-action:<id>" (Next.js Server Actions). Read-only is the default
// because the original is usually someone's live app.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig, normalizedValues, readJson } from '../common/normalize.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.profile || !(args.cases || args.vectors || args.login)) {
  console.error('usage: node run-cases.mjs --profile <p.json> (--cases <c.json> --out <run.json> | --vectors <v.json> | --login) [options]');
  process.exit(2);
}

const profilePath = resolve(args.profile);
const profile = readJson(profilePath);
const baseUrl = String(args['base-url'] ?? profile.baseUrl ?? '').replace(/\/$/, '');
if (!baseUrl) throw new Error('no baseUrl in the profile and no --base-url');
const origin = new URL(baseUrl).origin;
const B = profile.browser ?? {};
const statePath = B.storageState ? resolve(dirname(profilePath), B.storageState) : null;
const tokens = profile.tokens ?? {};
const T = profile.timeouts ?? {};
const readOnly = profile.readOnly !== false;
const allow = (profile.guard?.allow ?? []).map((p) => new RegExp(p));
const include = (profile.network?.include ?? []).map((p) => new RegExp(p));
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

const { chromium } = await loadPlaywright();
// local patch (gtabase-rebuild): channel 'chromium' = the bundled Playwright Chromium; HTTPS proxy for
// remote targets (cloud session egress); network.block = third-party hosts (ads/analytics) aborted silently.
const launchOpts = { headless: args.headless ? true : !(args.headed || args.login) };
if (B.channel !== 'chromium') launchOpts.channel = B.channel ?? (process.platform === 'win32' ? 'msedge' : 'chrome');
if (B.executablePath) launchOpts.executablePath = B.executablePath;
// local patch (f6/f8 tracing; same need found by f2/f3): optional extra browser flags, e.g. --disable-blink-features=AutomationControlled
// so navigator.webdriver is false and JCH Optimize's interaction-deferred scripts load as for a real visitor.
if (Array.isArray(B.args)) launchOpts.args = B.args;
const proxyServer = B.proxy ?? (/\/\/(localhost|127\.0\.0\.1)/.test(baseUrl) ? null : (process.env.HTTPS_PROXY || null));
if (proxyServer) launchOpts.proxy = { server: proxyServer, bypass: 'localhost,127.0.0.1' };
const blockRe = (profile.network?.block ?? []).map((p) => new RegExp(p));
const browser = await chromium.launch(launchOpts);

if (args.login) {
  await login();
  await browser.close();
  process.exit(0);
}

const context = await browser.newContext({
  baseURL: baseUrl,
  viewport: B.viewport ?? { width: 1280, height: 800 },
  locale: B.locale ?? 'en-US',
  timezoneId: B.timezone ?? 'UTC',
  reducedMotion: 'reduce',
  storageState: statePath && existsSync(statePath) ? statePath : undefined,
});
context.setDefaultTimeout(T.action ?? 5000);
context.setDefaultNavigationTimeout(T.navigation ?? 30000);

let log = newLog();
let inflight = 0;
if (readOnly || blockRe.length) {
  await context.route('**/*', (route) => {
    const req = route.request();
    const method = req.method();
    if (blockRe.some((re) => re.test(req.url()))) return route.abort('blockedbyclient');
    if (!readOnly) return route.continue();
    const action = req.headers()['next-action'];
    const line = `${method} ${req.url()}`;
    if (SAFE.has(method) || allow.some((re) => re.test(line) || (action && re.test(`next-action:${action}`)))) {
      return route.continue();
    }
    log.blocked.push(`${method} ${short(req.url())}`);
    return route.abort('blockedbyclient');
  });
}

const page = await context.newPage();
page.on('request', (req) => {
  inflight++;
  if (tracked(req)) log.reqs.push(req);
});
page.on('requestfinished', () => { inflight = Math.max(0, inflight - 1); });
page.on('requestfailed', () => { inflight = Math.max(0, inflight - 1); });
page.on('dialog', (d) => {
  log.dialogs.push(`${d.type()}: ${d.message()}`);
  d.dismiss().catch(() => {}); // cancel confirms/prompts: the safe answer on someone's live app
});
page.on('pageerror', (e) => log.errors.push(firstLine(e.message)));
page.on('console', (m) => { if (m.type() === 'error') log.console.push(firstLine(m.text())); });

let cases;
if (args.vectors) {
  cases = readJson(resolve(args.vectors)).map((v) => ({ id: v.id, mode: v.mode, steps: v.keys, reset: v.reset, reads: v.reads, expect: v.expect }));
} else {
  cases = readJson(resolve(args.cases));
}
const only = args.only ? new RegExp(args.only) : null;
const outPath = args.out ? resolve(args.out) : null;
const shotsDir = resolve(args.shots ?? join(outPath ? dirname(outPath) : '.', 'screens'));
const run = { app: profile.app ?? null, baseUrl, captured: new Date().toISOString(), locale: B.locale ?? 'en-US', readOnly, cases: [] };
const resets = profile.resets ?? {};
const norm = loadConfig(args.normalize ? resolve(args.normalize) : null);
let failed = 0;
let currentId = '';

for (const c of cases) {
  if (only && !only.test(c.id)) continue;
  currentId = c.id;
  const rec = { id: c.id, mode: c.mode ?? null, steps: c.steps ?? [], reads: c.reads ?? [], reset: c.reset ?? (resets.clear ? 'clear' : 'none'), values: {}, error: null };
  try {
    if (rec.reset !== 'none') {
      if (!resets[rec.reset]) throw new Error(`unknown reset "${rec.reset}"`);
      await runSteps(resets[rec.reset]);
      await settle();
    }
    log = newLog(); // a case's log starts after its reset (mode navigation and steps count)
    if (c.mode) await runStep(`mode:${c.mode}`);
    await runSteps(rec.steps);
    await settle();
  } catch (e) {
    rec.error = firstLine(e.message);
  }
  for (const r of profile.readouts ?? []) rec.values[r.key] = await safeRead(r.read);
  for (const spec of rec.reads) rec.values[spec] = await safeRead(spec);
  run.cases.push(rec);
  if (outPath) save();
  if (c.expect) check(c, rec);
  else console.log(`${c.id.padEnd(12)} ${rec.error ? `ERROR ${rec.error}` : 'ok'} | ${summary(rec.values)}`);
}

await browser.close();
if (outPath) console.log(`${run.cases.length} cases -> ${outPath}`);
if (args.vectors) {
  console.log(`vectors: ${run.cases.length} run, ${run.cases.length - failed} pass, ${failed} fail`);
  process.exitCode = failed ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------------

function parseArgs(list) {
  const o = {};
  for (let i = 0; i < list.length; i++) {
    if (!list[i].startsWith('--')) continue;
    const next = list[i + 1];
    if (next === undefined || next.startsWith('--')) o[list[i].slice(2)] = true;
    else { o[list[i].slice(2)] = next; i++; }
  }
  return o;
}

async function loadPlaywright() {
  const req = createRequire(join(process.cwd(), 'noop.js'));
  for (const name of ['playwright-core', 'playwright']) {
    try {
      const mod = await import(pathToFileURL(req.resolve(name)).href);
      return mod.chromium ? mod : mod.default;
    } catch { /* try the next package */ }
  }
  console.error(`playwright-core not found from ${process.cwd()} - run: npm i -D playwright-core`);
  process.exit(2);
}

async function login() {
  if (!statePath) throw new Error('set profile.browser.storageState (where the signed-in state is saved)');
  const L = profile.login ?? {};
  const timeout = L.timeoutMs ?? 300000;
  const ctx = await browser.newContext({ viewport: null, locale: B.locale ?? 'en-US' });
  const p = await ctx.newPage();
  await p.goto(baseUrl + (L.start ?? '/'));
  console.log(`Sign in yourself in the browser window. Waiting up to ${Math.round(timeout / 1000)} s ...`);
  if (L.doneUrl) await p.waitForURL(new RegExp(L.doneUrl), { timeout });
  else if (L.doneSelector) await p.locator(tokens[L.doneSelector] ?? L.doneSelector).first().waitFor({ timeout });
  else await p.waitForEvent('close', { timeout });
  mkdirSync(dirname(statePath), { recursive: true });
  await ctx.storageState({ path: statePath });
  console.log(`saved signed-in state -> ${statePath} (a secret: keep it out of evidence/, git and the rebuild)`);
}

function newLog() {
  return { reqs: [], blocked: [], dialogs: [], errors: [], console: [] };
}

function tracked(req) {
  if (include.length) return include.some((re) => re.test(req.url()));
  const type = req.resourceType();
  return type === 'fetch' || type === 'xhr' || (type === 'document' && req.method() !== 'GET');
}

function short(url) {
  const u = new URL(url);
  return u.origin === origin ? u.pathname + u.search : u.host + u.pathname + u.search;
}

function firstLine(s) { return String(s ?? '').split('\n')[0].slice(0, 300); }
function clean(s) { return String(s ?? '').replace(/\s+/g, ' ').trim(); }
function sel(t) { return tokens[t] ?? t; }
function loc(t) { return page.locator(sel(t)).first(); }
function summary(values) { return Object.entries(values).map(([k, v]) => `${k}=${v}`).join('; ').slice(0, 220); }

function toSteps(steps) {
  if (Array.isArray(steps)) return steps;
  return String(steps ?? '').split(' ; ').filter((s) => s.trim());
}

async function runSteps(steps, depth = 0) {
  for (const s of toSteps(steps)) await runStep(s, depth);
}

async function runStep(step, depth = 0) {
  let s = step.trim();
  if (!s) return;
  const optional = s.startsWith('try:');
  if (optional) s = s.slice(4);
  try {
    await doStep(s, depth);
  } catch (e) {
    if (!optional) throw new Error(`${step}: ${firstLine(e.message)}`);
  }
}

function tokenAndText(arg, verb) {
  const i = arg.indexOf('=');
  const name = i < 0 ? arg : arg.slice(0, i);
  if (i < 0 || !(name in tokens)) throw new Error(`${verb} needs <token>=<text> with a profile token (got "${arg}")`);
  return [name, arg.slice(i + 1)];
}

async function doStep(s, depth) {
  if (depth > 10) throw new Error('modes/macros nest too deep');
  const i = s.indexOf(':');
  const verb = i < 0 ? s : s.slice(0, i);
  const arg = i < 0 ? '' : s.slice(i + 1);
  switch (verb) {
    case 'goto': await page.goto(arg); break;
    case 'mode': {
      const m = profile.modes?.[arg];
      if (m === undefined) throw new Error(`unknown mode "${arg}"`);
      if (typeof m === 'string') await page.goto(m);
      else await runSteps(m, depth + 1);
      break;
    }
    case 'macro': {
      const m = profile.macros?.[arg];
      if (!m) throw new Error(`unknown macro "${arg}"`);
      await runSteps(m, depth + 1);
      break;
    }
    case 'click': case 'dblclick': case 'hover': case 'check': case 'uncheck': case 'focus':
      await loc(arg)[verb]();
      break;
    case 'scroll': await loc(arg).scrollIntoViewIfNeeded(); break;
    case 'fill': { const [t, text] = tokenAndText(arg, verb); await loc(t).fill(text); break; }
    case 'select': { const [t, value] = tokenAndText(arg, verb); await loc(t).selectOption(value); break; }
    case 'press': await page.keyboard.press(arg); break;
    case 'keydown': await page.keyboard.down(arg); break; // local patch (f1 tracing): modifier-held clicks
    case 'keyup': await page.keyboard.up(arg); break;
    case 'clickat': { const [x, y] = arg.split(',').map(Number); await page.mouse.click(x, y); break; } // local patch (f7/f9 tracing): tap at viewport x,y (zero-width icon controls such as a CSS-drawn hamburger)
    case 'type': await page.keyboard.type(arg); break;
    case 'wait':
      if (arg === 'idle') await settle(T.idle ?? 15000);
      else await page.waitForTimeout(Number(arg));
      break;
    case 'waitfor': await loc(arg).waitFor({ state: 'visible' }); break;
    case 'waitgone': await loc(arg).waitFor({ state: 'hidden' }); break;
    case 'reload': await page.reload(); break;
    case 'back': await page.goBack(); break;
    case 'forward': await page.goForward(); break;
    case 'viewport': {
      const [width, height] = arg.split('x').map(Number);
      await page.setViewportSize({ width, height });
      break;
    }
    case 'clear':
      if (arg === 'cookies') await context.clearCookies();
      else if (arg === 'local' || arg === 'session') {
        if (page.url().startsWith('http')) await page.evaluate((k) => (k === 'session' ? sessionStorage : localStorage).clear(), arg);
      } else throw new Error(`clear:${arg}? use local, session or cookies`);
      break;
    case 'shot':
      mkdirSync(shotsDir, { recursive: true });
      await page.screenshot({ path: join(shotsDir, `${currentId}-${arg || 'shot'}.png`), fullPage: true });
      break;
    default: throw new Error(`unknown step "${verb}"`);
  }
  if (verb !== 'wait' && verb !== 'shot') await settle();
}

/** Waits until no request has been in flight for 400 ms (bounded), so readouts see the settled page. */
async function settle(max = T.settle ?? 4000) {
  const end = Date.now() + max;
  let quietSince = Date.now();
  await page.waitForTimeout(50);
  while (Date.now() < end) {
    if (inflight > 0) quietSince = Date.now();
    else if (Date.now() - quietSince >= 400) return;
    await page.waitForTimeout(50);
  }
}

async function safeRead(spec) {
  try {
    return await read(spec);
  } catch {
    return '<missing>';
  }
}

async function present(t, fn) {
  const l = loc(t);
  if (!(await l.count())) return '<missing>';
  return fn(l);
}

async function read(spec) {
  const i = spec.indexOf(':');
  const kind = i < 0 ? spec : spec.slice(0, i);
  const arg = i < 0 ? '' : spec.slice(i + 1);
  switch (kind) {
    case 'url': {
      const u = new URL(page.url());
      return u.origin === origin ? u.pathname + u.search + u.hash : page.url();
    }
    case 'title': return page.title();
    case 'text': return present(arg, async (l) => clean(await l.innerText()));
    case 'value': return present(arg, (l) => l.inputValue());
    case 'attr': {
      const at = arg.lastIndexOf('@');
      return present(arg.slice(0, at), async (l) => (await l.getAttribute(arg.slice(at + 1))) ?? '<missing>');
    }
    case 'count': return String(await page.locator(sel(arg)).count());
    case 'list': return (await page.locator(sel(arg)).allInnerTexts()).map(clean).join(' || ');
    case 'visible': return String(await loc(arg).isVisible());
    case 'enabled': return present(arg, async (l) => String(await l.isEnabled()));
    case 'checked': return present(arg, async (l) => String(await l.isChecked()));
    case 'local': case 'session':
      return (await page.evaluate(([k, s]) => (s ? sessionStorage : localStorage).getItem(k), [arg, kind === 'session'])) ?? '<missing>';
    case 'calls': return callsText();
    case 'blocked': return log.blocked.join(' || ');
    case 'dialog': return log.dialogs.join(' || ');
    case 'errors': return log.errors.join(' || ');
    case 'console': return log.console.join(' || ');
    default: throw new Error(`unknown read "${spec}"`);
  }
}

async function callsText() {
  const lines = [];
  for (const req of log.reqs) {
    const failure = req.failure()?.errorText ?? '';
    let status;
    if (/BLOCKED_BY_CLIENT/i.test(failure)) status = 'BLOCKED';
    else if (failure) status = 'FAILED';
    else {
      const res = await Promise.race([req.response(), new Promise((r) => setTimeout(() => r('pending'), 2000))]).catch(() => null);
      status = res === 'pending' ? 'PENDING' : res ? res.status() : 'FAILED';
    }
    const action = req.headers()['next-action'];
    lines.push(`${req.method()} ${short(req.url())}${action ? ` action=${action}` : ''} ${status}`);
  }
  return lines.join(' || ');
}

function check(c, rec) {
  const actual = normalizedValues(norm, rec.values);
  const keys = [...new Set([...Object.keys(c.expect), ...Object.keys(actual)])].sort();
  const diffs = keys.filter((k) => c.expect[k] !== actual[k]);
  if (!rec.error && !diffs.length) { console.log(`PASS ${c.id}`); return; }
  failed++;
  console.log(`FAIL ${c.id}${rec.error ? ` - ERROR ${rec.error}` : ''}`);
  for (const k of diffs) console.log(`  ${k}: expected ${JSON.stringify(c.expect[k] ?? null)}, got ${JSON.stringify(actual[k] ?? null)}`);
}

function save() {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(run, null, 2));
}
