// node scripts/render.mjs <scale> <out.mp4> [crf]
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const scale = Number(process.argv[2] || 0.25);
const out = process.argv[3] || 'out/preview.mp4';
const crf = Number(process.argv[4] || 23);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const comp = await selectComposition({serveUrl, id: 'FlamingoShort', browserExecutable: BROWSER});
const t0 = Date.now();
let last = 0;
await renderMedia({
  composition: comp, serveUrl, codec: 'h264', outputLocation: out, scale, crf,
  pixelFormat: 'yuv420p', imageFormat: 'png',
  browserExecutable: BROWSER, concurrency: Number(process.env.CONC || 4),
  audioBitrate: '320k',
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 20);
    if (p !== last) { last = p; console.log(`${(progress * 100).toFixed(0)}%  ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  },
});
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
fs.writeFileSync(out + '.time', String((Date.now() - t0) / 1000));
