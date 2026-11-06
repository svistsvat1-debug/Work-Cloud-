import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const times = process.argv.slice(2).map(Number);
const BX = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = fs.existsSync('build/index.html') && !process.env.REBUNDLE ? path.resolve('build') :
  await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const comp = await selectComposition({serveUrl, id: 'Straw', browserExecutable: BX});
fs.mkdirSync('../qa/stills', {recursive: true});
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round((t + 0.1) * 60));
  await renderStill({serveUrl, composition: comp, frame, output: `../qa/stills/t${t.toFixed(2)}.png`, scale: 0.5, browserExecutable: BX, chromiumOptions: {gl: 'swangle'}});
  console.log('ok', t);
}
