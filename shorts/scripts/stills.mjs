// node scripts/stills.mjs out_dir t1 t2 ...   (seconds) -> PNG stills at 0.5 scale, bundle reused from build/
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';

const [outDir, ...ts] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = process.env.REBUNDLE || !fs.existsSync('build/index.html')
  ? await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')})
  : path.resolve('build');
const composition = await selectComposition({serveUrl, id: 'BeesSting', browserExecutable, chromeMode: 'headless-shell'});
for (const t of ts) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * 60));
  await renderStill({composition, serveUrl, frame, output: `${outDir}/f${String(frame).padStart(4, '0')}.png`, scale: 0.5, browserExecutable, chromeMode: 'headless-shell'});
  process.stdout.write(`${t} `);
}
console.log('done');
