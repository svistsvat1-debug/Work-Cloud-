#!/usr/bin/env node
// Headless renderer: serves the page, steps frames deterministically, pipes raw RGBA into FFmpeg.
// Usage:
//   node render.mjs --config ../../videos/night-drive-ohio/config.json --out out.mp4 [--start 0 --end N] [--workers 2]
//   node render.mjs --config cfg.json --stills 0,240,480 --outdir stills/
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]] : acc), [])
);
const cfg = JSON.parse(fs.readFileSync(args.config, 'utf8'));
if (args.width) { cfg.width = +args.width; cfg.height = +args.height; }
if (args.override) Object.assign(cfg, JSON.parse(args.override));
const total = Math.round(cfg.duration * cfg.fps);

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(port) {
  // Prefer Mesa llvmpipe (via Xvfb + ANGLE/GL): much faster than SwiftShader on CPU-only machines.
  const llvm = process.env.DISPLAY && process.env.ND_GL !== 'swiftshader';
  const browser = await chromium.launch({
    headless: !llvm,
    args: llvm
      ? ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=200,200']
      : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-background-timer-throttling'],
  });
  const page = await browser.newPage({ viewport: { width: 64, height: 64 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text().slice(0, 2000)); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.addInitScript((c) => { window.CFG = c; }, cfg);
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 600000 });
  return { browser, page };
}

async function renderRange(port, start, end, out) {
  const { browser, page } = await openPage(port);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${cfg.width}x${cfg.height}`, '-r', String(cfg.fps), '-i', '-',
    '-vf', 'vflip', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(args.crf || 16), '-tune', 'grain', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = start; f < end; f++) {
    const b64 = await page.evaluate((fr) => window.renderFrame(fr), f);
    const buf = Buffer.from(b64, 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - start) % 24 === 0) {
      const el = (Date.now() - t0) / 1000, done = f - start + 1;
      console.log(`[${path.basename(out)}] frame ${f}/${end} · ${(el / done).toFixed(2)} s/frame · eta ${(((end - f - 1) * el) / done / 60).toFixed(1)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`[${path.basename(out)}] ${end - start} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min (${((Date.now() - t0) / 1000 / (end - start)).toFixed(2)} s/frame)`);
}

const srv = await serve();
const port = srv.address().port;

if (args.stills) {
  const outdir = args.outdir || '.';
  fs.mkdirSync(outdir, { recursive: true });
  const { browser, page } = await openPage(port);
  for (const f of String(args.stills).split(',').map(Number)) {
    const t0 = Date.now();
    // warm-up frames are not needed: every frame is a pure function of time
    const url = await page.evaluate((fr) => window.renderPNG(fr), f);
    fs.writeFileSync(path.join(outdir, `f${String(f).padStart(5, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
    console.log(`still ${f} in ${((Date.now() - t0) / 1000).toFixed(2)} s`);
  }
  await browser.close();
} else {
  const start = +(args.start || 0), end = +(args.end || total);
  const workers = +(args.workers || 1);
  const out = path.resolve(args.out);
  if (workers === 1) await renderRange(port, start, end, out);
  else {
    const partsDir = path.join(path.dirname(out), 'parts');
    fs.mkdirSync(partsDir, { recursive: true });
    const n = end - start, step = Math.ceil(n / workers);
    const parts = [];
    for (let w = 0; w < workers; w++) {
      const a = start + w * step, b = Math.min(end, a + step);
      if (a < b) parts.push({ a, b, file: path.join(partsDir, `part${w}.mp4`) });
    }
    await Promise.all(parts.map((p) => renderRange(port, p.a, p.b, p.file)));
    const list = path.join(partsDir, 'list.txt');
    fs.writeFileSync(list, parts.map((p) => `file '${p.file}'`).join('\n'));
    await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
  }
  console.log('done', out);
}
srv.close();
