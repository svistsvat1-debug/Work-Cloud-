// node scripts/render.mjs <compId> <out.mp4> <startFrame> <endFrame>   (near-lossless, no audio)
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
const [compId, out, a, b] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || undefined;
const serveUrl = process.env.BUNDLE || (await bundle({entryPoint: path.resolve('src/index.ts')}));
const chromiumOptions = {gl: 'swangle'};
const comp = await selectComposition({serveUrl, id: compId, browserExecutable, chromiumOptions});
const frameRange = a !== undefined ? [Number(a), Math.min(Number(b), comp.durationInFrames - 1)] : undefined;
let last = 0;
await renderMedia({
  composition: comp, serveUrl, codec: 'h264', outputLocation: out, browserExecutable, chromiumOptions,
  crf: 4, x264Preset: 'veryfast', pixelFormat: 'yuv420p', muted: true, imageFormat: 'jpeg', jpegQuality: 95,
  concurrency: Number(process.env.CONC || 4), frameRange,
  onProgress: ({progress}) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; console.log(`${out} ${(progress * 100).toFixed(0)}% ${new Date().toISOString()}`); } },
});
console.log('DONE', out, frameRange);
