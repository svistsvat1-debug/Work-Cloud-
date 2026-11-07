// usage: node tools/stills.mjs <compId> <outDir> <scale> frame1 frame2 ...
// Bundles once into build/ (re-used), renders stills, then a contact sheet is made by Python.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [compId, outDir, scale, ...frames] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build'), publicDir: path.resolve('public')});
const composition = await selectComposition({serveUrl, id: compId, browserExecutable});
fs.mkdirSync(outDir, {recursive: true});
for (const f of frames) {
  await renderStill({composition, serveUrl, frame: Number(f), output: path.join(outDir, `f${String(f).padStart(4, '0')}.png`), scale: Number(scale), browserExecutable, imageFormat: 'png'});
  process.stdout.write(f + ' ');
}
console.log('done');
