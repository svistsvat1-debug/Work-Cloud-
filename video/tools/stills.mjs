// node tools/stills.mjs OUT_DIR t1 t2 ...  -> renders stills (scale 0.5) at those times from one bundle
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const composition = await selectComposition({serveUrl, id: 'Hummingbird', browserExecutable});
for (const ts of times) {
  const frame = ts === 'last' ? composition.durationInFrames - 1 : Math.min(Math.round(parseFloat(ts) * 60), composition.durationInFrames - 1);
  await renderStill({composition, serveUrl, frame, output: `${outDir}/f${String(frame).padStart(4, '0')}.png`, scale: 0.5, browserExecutable});
}
console.log('frames', composition.durationInFrames);
