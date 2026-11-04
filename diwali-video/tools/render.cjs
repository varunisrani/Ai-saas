// Drive scene.js in headless Chromium (software WebGL2) and encode frames.
//   node tools/render.cjs --preview 3,6,10,14,18,20.9   → frames/preview_NN.jpg
//   node tools/render.cjs                               → out/diwali_silent.mp4
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const previewArg = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  const info = await page.evaluate(() => window.setupScene());
  console.log('scene', JSON.stringify(info));
  fs.writeFileSync(path.join(ROOT, 'out/scene_info.json'), JSON.stringify(info, null, 1));
  const N = info.frames;
  const want = previewArg ? new Set(previewArg.split(',').map(s => Math.min(N - 1, Math.round(parseFloat(s) * 30)))) : null;

  let ff = null;
  if (!want) {
    ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      path.join(ROOT, 'out/diwali_silent.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  }
  const t0 = Date.now(); let k = 0;
  for (let f = 0; f < N; f++) {
    const cap = !want || want.has(f);
    const res = await page.evaluate(([f, c]) => window.renderFrame(f, c), [f, cap]);
    if (cap) {
      const buf = Buffer.from(res.split(',')[1], 'base64');
      if (ff) { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
      else fs.writeFileSync(path.join(ROOT, `frames/preview_${String(k++).padStart(2, '0')}.jpg`), buf);
    }
    if (f % 60 === 0) console.log(`frame ${f}/${N}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
