// node scripts/render.mjs <scale> <out.mp4> [crf]  - renders MothsShort from ONE bundle (build/), software GL (no GPU here)
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import os from 'node:os';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const [scale = '0.5', out = 'out/preview.mp4', crf = '20'] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const composition = await selectComposition({serveUrl, id: 'MothsShort', browserExecutable: BROWSER});
let last = -1;
await renderMedia({
  composition, serveUrl, codec: 'h264', outputLocation: out, scale: Number(scale), crf: Number(crf), pixelFormat: 'yuv420p',
  imageFormat: 'png', browserExecutable: BROWSER, chromiumOptions: {gl: 'swangle'}, concurrency: os.cpus().length,
  audioBitrate: '320k',
  onProgress: ({progress}) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; console.log(`${(progress * 100).toFixed(0)}% ${new Date().toISOString()}`); } },
});
console.log('done', out);
