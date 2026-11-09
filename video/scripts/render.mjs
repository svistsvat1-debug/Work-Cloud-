// Render the composition: node scripts/render.mjs <out.mp4> <scale> [crf]   (bundle once into build/bundle)
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const [out, scaleArg = '1', crfArg = '16'] = process.argv.slice(2);
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bundleDir = path.join(root, 'build', process.env.BUNDLE_DIR || 'bundle');
const serveUrl = fs.existsSync(path.join(bundleDir, 'index.html')) && process.env.REBUNDLE !== '1'
  ? bundleDir : await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: bundleDir});
const composition = await selectComposition({serveUrl, id: 'TheEgg', browserExecutable: BROWSER});
let last = -1;
const t0 = Date.now();
await renderMedia({
  composition, serveUrl, outputLocation: out, scale: Number(scaleArg),
  // CODEC=wav renders only the mixed audio (fast) - used to swap sound effects without re-rendering the picture
  ...(process.env.CODEC === 'wav' ? {codec: 'wav'} : {codec: 'h264', crf: Number(crfArg), pixelFormat: 'yuv420p',
    imageFormat: process.env.JPEG === '1' ? 'jpeg' : 'png', jpegQuality: 92}),
  browserExecutable: BROWSER, concurrency: Number(process.env.CONC || os.cpus().length), audioBitrate: '320k',
  timeoutInMilliseconds: 120000,
  frameRange: process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : undefined,
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 20);
    if (p !== last) { last = p; console.log(`${Math.round(progress * 100)}%  ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  },
});
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
