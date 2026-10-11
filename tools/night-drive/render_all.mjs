#!/usr/bin/env node
// Full-length render: the timeline is cut into segments rendered by a pool of workers.
// Each finished segment is kept on disk, so the job can be stopped and resumed at any time.
// Usage: node render_all.mjs --config cfg.json --dir out/ [--workers 2] [--seg 720]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []));
const cfg = JSON.parse(fs.readFileSync(args.config, 'utf8'));
const total = Math.round(cfg.duration * cfg.fps);
const SEG = +(args.seg || 720);
const W = +(args.workers || 2);
const dir = path.resolve(args.dir);
const parts = path.join(dir, 'parts');
fs.mkdirSync(parts, { recursive: true });

const segs = [];
for (let a = 0, i = 0; a < total; a += SEG, i++) segs.push({ i, a, b: Math.min(total, a + SEG), file: path.join(parts, `seg${String(i).padStart(3, '0')}.mp4`) });
const todo = segs.filter((s) => !fs.existsSync(s.file));
console.log(`${segs.length} segments, ${todo.length} to render, ${W} workers`);

const t0 = Date.now();
let done = segs.length - todo.length;
async function worker(id) {
  while (todo.length) {
    const s = todo.shift();
    const tmp = s.file.replace('.mp4', '.part.mp4');
    const code = await new Promise((res) => {
      const p = spawn('node', [path.join(ROOT, 'render.mjs'), '--config', args.config, '--start', String(s.a), '--end', String(s.b), '--out', tmp, '--crf', args.crf || '17'], { stdio: ['ignore', 'pipe', 'pipe'] });
      p.stdout.on('data', () => {});
      p.stderr.on('data', (d) => { const t = String(d); if (!t.includes('GL Driver')) process.stderr.write(t); });
      p.on('close', res);
    });
    if (code !== 0) { console.log(`segment ${s.i} failed (${code}), retrying later`); todo.push(s); continue; }
    fs.renameSync(tmp, s.file);
    done++;
    const el = (Date.now() - t0) / 1000;
    const rate = el / Math.max(1, done - (segs.length - todo.length - W));
    console.log(`[w${id}] segment ${s.i} done · ${done}/${segs.length} · elapsed ${(el / 60).toFixed(1)} min`);
  }
}
await Promise.all(Array.from({ length: W }, (_, i) => worker(i)));

// concat picture
const list = path.join(parts, 'list.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s.file}'`).join('\n'));
const pic = path.join(dir, 'picture.mp4');
await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', pic], { stdio: 'inherit' }).on('close', r));
console.log('ALL DONE', pic, `${((Date.now() - t0) / 3600000).toFixed(2)} h`);
