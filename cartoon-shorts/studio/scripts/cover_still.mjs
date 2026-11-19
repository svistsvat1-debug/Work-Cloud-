import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [id, out, scale = '1'] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('.bundle')});
const chromiumOptions = {gl: 'swangle'};
const comp = await selectComposition({serveUrl, id, browserExecutable: process.env.CHROME, chromiumOptions});
await renderStill({composition: comp, serveUrl, output: out, frame: 0, scale: Number(scale), browserExecutable: process.env.CHROME, chromiumOptions});
console.log('done', out);
