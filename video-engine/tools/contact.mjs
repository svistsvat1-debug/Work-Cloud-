// node tools/contact.mjs <outDir> <id1,id2,...|prefix:01> [frame]  -> stills of shots (mid frame) for review
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const [outDir, list, frameArg] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const ids = list.split(',');
const frame = Number(frameArg ?? 100);
const conc = Number(process.env.CONC || 3);
let i = 0;
async function worker() {
  while (i < ids.length) {
    const id = ids[i++];
    const inputProps = {id};
    const comp = await selectComposition({serveUrl, id: 'Shot', inputProps, chromiumOptions: {gl: 'swangle'}});
    await renderStill({composition: comp, serveUrl, output: path.join(outDir, `${id}.jpg`), frame, inputProps, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, chromiumOptions: {gl: 'swangle'}});
    console.log('ok', id);
  }
}
await Promise.all(Array.from({length: conc}, worker));
