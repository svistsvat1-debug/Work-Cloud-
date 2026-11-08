// node scripts/stills.mjs 0 2.6 4.5 ...  -> out/stills/t_<sec>.png (scale 0.5) using ONE bundle in build/
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const times = process.argv.slice(2).map(Number);
const serveUrl = process.env.REBUNDLE || !fs.existsSync('build/index.html')
  ? await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')})
  : path.resolve('build');
const browser = await openBrowser('chrome', {browserExecutable: BROWSER, chromiumOptions: {gl: 'swangle'}});
const composition = await selectComposition({serveUrl, id: process.env.COMP || 'MothsShort', puppeteerInstance: browser, browserExecutable: BROWSER});
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * 60));
  await renderStill({composition, serveUrl, frame, output: process.env.OUT || `out/stills/t_${t.toFixed(2)}.png`, scale: Number(process.env.SCALE || 0.5), puppeteerInstance: browser, browserExecutable: BROWSER});
  console.log('still', t);
}
await browser.close({silent: true});
