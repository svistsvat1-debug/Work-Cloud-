// node scripts/audio.mjs <compId> <out.wav> - render only the mixed audio (voice + music + sfx) of a composition.
// Use it to remix a finished Short without re-rendering the picture, then mux with ffmpeg (-c:v copy).
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [compId, out] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || undefined;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve(process.env.BUNDLE_DIR || '.bundle')});
const chromiumOptions = {gl: process.env.GL || 'swangle'};
const comp = await selectComposition({serveUrl, id: compId, browserExecutable, chromiumOptions});
await renderMedia({composition: comp, serveUrl, codec: 'wav', outputLocation: out, browserExecutable, chromiumOptions, concurrency: Number(process.env.CONC || 4)});
console.log('done', out);
