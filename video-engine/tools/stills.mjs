// node tools/stills.mjs <compId> <outDir> <frame> [propsJSON]  -> renders one still (jpeg)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const [compId, out, frame, props] = process.argv.slice(2);
const serveUrl = process.env.BUNDLE || (await bundle({entryPoint: path.resolve('src/index.ts')}));
const inputProps = props ? JSON.parse(props) : {};
const comp = await selectComposition({serveUrl, id: compId, inputProps, chromiumOptions: {gl: 'swangle'}});
await renderStill({composition: comp, serveUrl, output: out, frame: Number(frame || 0), inputProps, ...(out.endsWith('.png') ? {imageFormat: 'png'} : {imageFormat: 'jpeg', jpegQuality: 92}), chromiumOptions: {gl: 'swangle'}});
console.log('still', out);
