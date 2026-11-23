// Read-only page walker (our own tool). Visits each route once, records status, title, h1,
// screenshot, scripts, XHR/fetch traffic, storage keys and cookie names. Non-GET requests to the
// target are blocked (write guard). Ads/analytics hosts are blocked to keep the walk light.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');

const [,, routesFile, outDir] = process.argv;
const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
const ORIGIN = 'https://www.gtabase.com';
const BLOCK = /mediavine|googletagmanager|google-analytics|doubleclick|googlesyndication|amazon-adsystem|addtoany|facebook\.net|quantserve|scorecardresearch|adnxs|pubmatic|rubiconproject|criteo|taboola|outbrain|cloudflareinsights|nel\.cloudflare/;
fs.mkdirSync(path.join(outDir, 'screens'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'bodies'), { recursive: true });

const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const results = [];
for (const r of routes) {
  const page = await ctx.newPage();
  const rec = { route: r, requests: [], blocked: [], console: [] };
  await page.route('**/*', (route) => {
    const req = route.request();
    const u = req.url();
    if (BLOCK.test(u)) { rec.blocked.push(u.slice(0, 120)); return route.abort(); }
    if (req.method() !== 'GET' && u.startsWith(ORIGIN)) { rec.blocked.push(req.method() + ' ' + u); return route.abort(); }
    return route.continue();
  });
  page.on('console', (m) => { if (m.type() === 'error') rec.console.push(m.text().slice(0, 200)); });
  page.on('response', async (resp) => {
    const req = resp.request();
    const t = req.resourceType();
    const e = { method: req.method(), url: resp.url(), type: t, status: resp.status(), ct: (resp.headers()['content-type'] || '').split(';')[0] };
    rec.requests.push(e);
    if ((t === 'xhr' || t === 'fetch') && resp.url().startsWith(ORIGIN)) {
      try {
        const b = await resp.body();
        e.size = b.length;
        const name = r.replace(/[^a-z0-9]+/gi, '_') + '__' + rec.requests.length + '.body';
        fs.writeFileSync(path.join(outDir, 'bodies', name), b);
        e.saved = name;
      } catch { /* body unavailable */ }
    }
  });
  try {
    const resp = await page.goto(ORIGIN + r, { waitUntil: 'domcontentloaded', timeout: 60000 });
    rec.status = resp ? resp.status() : null;
    rec.finalUrl = page.url();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    rec.title = await page.title();
    rec.h1 = await page.$$eval('h1', (els) => els.map((e) => e.textContent.trim()).slice(0, 3));
    rec.storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
    rec.cookies = (await ctx.cookies()).map((c) => ({ name: c.name, domain: c.domain, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite }));
    rec.perf = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'fetch' || e.initiatorType === 'xmlhttprequest').map((e) => e.responseStatus + ' ' + e.name));
    const shot = r.replace(/[^a-z0-9]+/gi, '_') + '.jpg';
    await page.screenshot({ path: path.join(outDir, 'screens', shot), type: 'jpeg', quality: 55 });
    rec.screenshot = shot;
  } catch (err) { rec.error = String(err).slice(0, 300); }
  results.push(rec);
  console.log(rec.status, r, rec.title, '| xhr:', rec.requests.filter((q) => q.type === 'xhr' || q.type === 'fetch').length, '| blocked:', rec.blocked.length, rec.error || '');
  await page.close();
  await new Promise((res) => setTimeout(res, 1200));
}
fs.writeFileSync(path.join(outDir, 'walk.json'), JSON.stringify(results, null, 1));
await browser.close();
