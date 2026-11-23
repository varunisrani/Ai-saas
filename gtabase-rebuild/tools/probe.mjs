// Read-only probe: open a URL (ads blocked, non-GET blocked), wait, then evaluate a JS expression file.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [,, url, exprFile, vp] = process.argv;
const BLOCK = /mediavine|googletagmanager|google-analytics|doubleclick|googlesyndication|amazon-adsystem|addtoany|facebook\.net|clarity\.ms|cloudflareinsights|nel\.cloudflare|youtube\.com|ytimg|gstatic|giphy/;
const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
const [w, h] = (vp || '1366x900').split('x').map(Number);
const ctx = await b.newContext({ viewport: { width: w, height: h } });
await ctx.route('**/*', (r) => { const q = r.request(); if (BLOCK.test(q.url())) return r.abort(); if (!['GET','HEAD','OPTIONS'].includes(q.method())) return r.abort(); return r.continue(); });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(2500);
const out = await p.evaluate(fs.readFileSync(exprFile, 'utf8'));
console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
await b.close();
