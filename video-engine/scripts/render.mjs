// node scripts/render.mjs <out.mp4>  — picture only (muted), high-quality intermediate for the single final ffmpeg encode
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [out] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('.bundle')});
const chromiumOptions = {gl: 'swangle'};
const composition = await selectComposition({serveUrl, id: 'Main', chromiumOptions});
let last = -1;
const t0 = Date.now();
await renderMedia({
  composition, serveUrl, codec: 'h264', outputLocation: out, chromiumOptions, muted: true,
  imageFormat: 'jpeg', jpegQuality: 100, crf: 4, x264Preset: 'veryfast', pixelFormat: 'yuv420p',
  concurrency: Number(process.env.CONC || 4),
  onProgress: ({progress}) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; console.log(`${p * 5}% ${Math.round((Date.now() - t0) / 1000)}s`); } },
});
console.log('done', out, Math.round((Date.now() - t0) / 1000), 's');
