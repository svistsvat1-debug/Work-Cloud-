// node scripts/stills.mjs t1 t2 ...  -> out/qa/s_<t>.png (scale 0.5), bundles once into build/
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const PREINSTALLED = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = process.env.REMOTION_BROWSER ?? (fs.existsSync(PREINSTALLED) ? PREINSTALLED : null);
const times = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const comp = await selectComposition({serveUrl, id: 'MosquitoRain', browserExecutable});
fs.mkdirSync('out/qa', {recursive: true});
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(t * comp.fps));
  await renderStill({composition: comp, serveUrl, frame, output: `out/qa/s_${t.toFixed(2)}.png`, scale: 0.5, browserExecutable});
  console.log('still', t);
}
