// Render stills of a composition at given times (one bundle, many frames).
// usage: node scripts/stills.mjs <compId> <outDir> <scale> t1 t2 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [compId, outDir, scale, ...times] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const comp = await selectComposition({serveUrl, id: compId, browserExecutable});
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(t) * comp.fps));
  await renderStill({composition: comp, serveUrl, frame, output: path.join(outDir, `f${String(frame).padStart(5, '0')}.png`), scale: parseFloat(scale), browserExecutable});
}
console.log('done', times.length);
