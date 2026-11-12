// node tools/render.mjs <compId> <out.mp4> [startFrame endFrame]  -> near-lossless picture, no audio
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
const [compId, out, a, b] = process.argv.slice(2);
const serveUrl = process.env.BUNDLE || (await bundle({entryPoint: path.resolve('src/index.ts')}));
const chromiumOptions = {gl: 'swangle'};
const comp = await selectComposition({serveUrl, id: compId, chromiumOptions});
const frameRange = a !== undefined ? [Number(a), Math.min(Number(b), comp.durationInFrames - 1)] : undefined;
let last = -1;
const t0 = Date.now();
await renderMedia({
  composition: comp, serveUrl, codec: 'h264', outputLocation: out, chromiumOptions,
  crf: 8, x264Preset: 'veryfast', pixelFormat: 'yuv420p', muted: true, imageFormat: 'jpeg', jpegQuality: 95,
  concurrency: Number(process.env.CONC || 4), frameRange, scale: Number(process.env.SCALE || 1),
  onProgress: ({progress}) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(`${out} ${(progress * 100).toFixed(0)}% ${((Date.now() - t0) / 1000).toFixed(0)}s`); } },
});
console.log('DONE', out, frameRange, ((Date.now() - t0) / 1000).toFixed(0) + 's');
