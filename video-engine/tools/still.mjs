// usage: node tools/still.mjs <compositionId> <out.png> [frame]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [id, out, frame = '0'] = process.argv.slice(2);
const browserExecutable = process.env.CHROME;
const chromiumOptions = {gl: 'swangle'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, browserExecutable, chromiumOptions});
await renderStill({composition, serveUrl, frame: Number(frame), output: path.resolve(out), imageFormat: 'png', browserExecutable, chromiumOptions});
console.log('done', out);
