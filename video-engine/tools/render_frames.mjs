// Lossless master as a PNG sequence (same pixels as ProRes 4444, ~10x smaller for a white-board video).
// usage: node tools/render_frames.mjs <compId> <outdir> [concurrency]
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [id, out, conc = '4'] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const browserExecutable = process.env.CHROME;
const chromiumOptions = {gl: 'swangle'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, browserExecutable, chromiumOptions});
let last = 0;
await renderFrames({
  composition, serveUrl, outputDir: path.resolve(out), imageFormat: 'png', concurrency: Number(conc),
  browserExecutable, chromiumOptions, inputProps: {},
  onStart: () => console.log('start', composition.durationInFrames),
  onFrameUpdate: (n) => { if (n - last >= 500) { last = n; console.log('frames', n, new Date().toISOString()); } },
});
console.log('done');
