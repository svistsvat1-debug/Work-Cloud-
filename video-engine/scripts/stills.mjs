// node scripts/stills.mjs <outDir> <scale> <frame> [frame...]  (REUSE_BUNDLE=1 to skip bundling)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [outDir, scale, ...frames] = process.argv.slice(2);
const BD = path.resolve('.bundle');
const serveUrl = process.env.REUSE_BUNDLE && fs.existsSync(BD + '/index.html') ? BD : await bundle({entryPoint: path.resolve('src/index.ts'), outDir: BD});
const comp = await selectComposition({serveUrl, id: process.env.COMP || 'Main', chromiumOptions: {gl: 'swangle'}});
fs.mkdirSync(outDir, {recursive: true});
for (const fr of frames) {
  const out = path.join(outDir, `f${String(fr).padStart(5, '0')}.png`);
  await renderStill({composition: comp, serveUrl, output: out, frame: Number(fr), scale: Number(scale), chromiumOptions: {gl: 'swangle'}});
  console.log('ok', out);
}
