// node scripts/stills.mjs out_dir scale t1 t2 ...  -> PNG stills + a contact sheet (bundle once into build/)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

const [outDir, scaleS, ...ts] = process.argv.slice(2);
const scale = Number(scaleS || 0.5);
fs.mkdirSync(outDir, {recursive: true});
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = process.env.REBUNDLE === '0' && fs.existsSync('build/index.html')
  ? path.resolve('build')
  : await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build'), publicDir: path.resolve('public')});
const browser = await openBrowser('chrome', {browserExecutable: BROWSER});
const comp = await selectComposition({serveUrl, id: 'SleepingBirds', puppeteerInstance: browser});
for (const t of ts) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(Number(t) * 60));
  await renderStill({composition: comp, serveUrl, frame, output: path.join(outDir, `f${String(frame).padStart(4, '0')}.png`), scale, puppeteerInstance: browser});
  process.stdout.write(`${t} `);
}
await browser.close({silent: true});
console.log('done');
