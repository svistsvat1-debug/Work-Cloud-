// node scripts/video.mjs <compId> <out.mp4> [scale] - bundle once to .bundle, render H.264 (yuv420p, crf 18, jpeg 95)
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [compId, out, scale = '1'] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || undefined;
const BD = process.env.BUNDLE_DIR || '.bundle';
const serveUrl = process.env.REUSE_BUNDLE && fs.existsSync(BD + '/index.html') ? BD : await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve(BD)});
const chromiumOptions = {gl: process.env.GL || 'swangle'};
const comp = await selectComposition({serveUrl, id: compId, browserExecutable, chromiumOptions});
let last = 0;
await renderMedia({
  composition: comp, serveUrl, codec: 'h264', outputLocation: out, scale: Number(scale), browserExecutable, chromiumOptions,
  imageFormat: 'jpeg', jpegQuality: 95, crf: 18, pixelFormat: 'yuv420p', concurrency: Number(process.env.CONC || 4),
  onProgress: ({progress}) => { if (progress - last >= 0.1) { last = progress; console.log(`${Math.round(progress * 100)}%`); } },
});
console.log('done', out);
