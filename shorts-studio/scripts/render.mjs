// node scripts/render.mjs <out.mp4> [scale] [crf]  — bundles once into build/, renders on CPU (no GPU in this container)
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const out = process.argv[2] ?? 'out/mosquito-1080p.mp4';
const scale = Number(process.argv[3] ?? 1);
const crf = Number(process.argv[4] ?? 18);
const PREINSTALLED = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = process.env.REMOTION_BROWSER ?? (fs.existsSync(PREINSTALLED) ? PREINSTALLED : null);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const composition = await selectComposition({serveUrl, id: 'MosquitoRain', browserExecutable});
let last = -1;
const t0 = Date.now();
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: out,
  scale,
  crf,
  pixelFormat: 'yuv420p',
  imageFormat: 'jpeg',
  jpegQuality: 92,
  concurrency: 4,
  audioCodec: 'aac',
  audioBitrate: '192k',
  browserExecutable,
  chromiumOptions: {gl: 'swangle'},
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 20);
    if (p !== last) {
      last = p;
      console.log(`${(progress * 100).toFixed(0)}%  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  },
});
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
