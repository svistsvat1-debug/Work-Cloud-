// usage: node tools/render.mjs still <frame,frame,...> <outdir> | video <out.mp4> [png-master-dir]
import {bundle} from '@remotion/bundler';
import {renderStill, renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [mode, a, b] = process.argv.slice(2);
const browserExecutable = process.env.CHROME;
const chromiumOptions = {gl: 'swangle'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id: 'PaintTest', browserExecutable, chromiumOptions});
if (mode === 'still') {
  for (const fr of a.split(',').map(Number)) {
    await renderStill({composition: comp, serveUrl, frame: fr, output: `${b}/f${String(fr).padStart(4, '0')}.png`, browserExecutable, chromiumOptions});
  }
} else {
  // lossless master: ProRes 4444 (kept until delivery); final mp4 is one encode from it
  await renderMedia({composition: comp, serveUrl, codec: 'prores', proResProfile: '4444', imageFormat: 'png',
    outputLocation: a, browserExecutable, chromiumOptions, audioCodec: 'pcm-16', concurrency: 4});
}
console.log('done');
