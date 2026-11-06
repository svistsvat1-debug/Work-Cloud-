// Resumable 4K render: frames in chunks -> out/seg/NN.mp4 (muted), skips chunks already done.
// Usage: node _render_seg.mjs [scale=2] [chunk=265]
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const studio = '/home/user/Work-Cloud-/studio';
const scale = Number(process.argv[2] ?? 2);
const chunk = Number(process.argv[3] ?? 265);
const segDir = path.join(studio, 'out', 'seg-eg03');
fs.mkdirSync(segDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(studio, 'src/index.ts'), outDir: path.join(studio, 'out', 'bundle-eg03'), publicDir: path.join(studio, 'public')});
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const inputProps = {withAudio: false};
const comp = await selectComposition({serveUrl, id: 'eg03-water-on-sand', inputProps, browserExecutable});
const n = comp.durationInFrames;
for (let a = 0, k = 0; a < n; a += chunk, k++) {
  const b = Math.min(n - 1, a + chunk - 1);
  const out = path.join(segDir, `${String(k).padStart(2, '0')}.mp4`);
  if (fs.existsSync(out)) { console.log('skip', k); continue; }
  const tmp = out.replace('.mp4', '.part.mp4');
  const t0 = Date.now();
  await renderMedia({composition: comp, serveUrl, codec: 'h264', outputLocation: tmp, inputProps, browserExecutable, frameRange: [a, b],
    scale, crf: 16, imageFormat: 'png', pixelFormat: 'yuv420p', concurrency: 4, muted: true, x264Preset: 'medium', chromiumOptions: {gl: 'angle'}});
  fs.renameSync(tmp, out);
  console.log(`seg ${k} frames ${a}-${b} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
console.log('ALL SEGMENTS DONE');
