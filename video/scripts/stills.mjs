// node scripts/stills.mjs 0,2.8,4.9 ...  -> out/stills/*.png + out/contact.png (via python)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const times = (process.argv[2] || '0').split(',').map(Number);
const scale = Number(process.argv[3] || 0.5);
const outDir = 'build';
let serveUrl = outDir;
if (!fs.existsSync(path.join(outDir, 'index.html')) || process.env.REBUNDLE) {
  serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve(outDir)});
}
const comp = await selectComposition({serveUrl, id: 'FlamingoShort', browserExecutable: BROWSER});
fs.mkdirSync('out/stills', {recursive: true});
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(t * comp.fps));
  await renderStill({composition: comp, serveUrl, frame, output: `out/stills/f${String(frame).padStart(4, '0')}.png`, scale, browserExecutable: BROWSER});
  console.log('still', t, frame);
}
