// node images/phages/scripts/stills.mjs t1 t2 ...  -> images/phages/qa/stills/<t>.png (scale 0.5) using ONE bundle
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const out = path.join(root, 'images/phages/qa/stills');
fs.mkdirSync(out, {recursive: true});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: path.join(root, 'build')});
const composition = await selectComposition({serveUrl, id: 'Phages', browserExecutable});
const times = process.argv.slice(2).map(Number);
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * 60));
  await renderStill({serveUrl, composition, frame, output: path.join(out, `${t.toFixed(2)}.png`), scale: 0.5, browserExecutable});
  process.stdout.write(`${t} `);
}
console.log('\n->', out);
