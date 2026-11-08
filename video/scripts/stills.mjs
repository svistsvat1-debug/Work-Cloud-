// node scripts/stills.mjs <outDir> t1 t2 ...   -> renders stills (scale 0.5) from a bundle built once into build/
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const [outDir, ...ts] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = process.env.REBUNDLE === '0' && fs.existsSync('build/index.html') ? 'build'
	: await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const browser = await openBrowser('chrome', {browserExecutable: BROWSER, chromiumOptions: {gl: 'swangle'}});
const composition = await selectComposition({serveUrl, id: 'WhyYouSeeStars', puppeteerInstance: browser});
for (const t of ts) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * 60));
	await renderStill({composition, serveUrl, frame, output: `${outDir}/f${String(frame).padStart(5, '0')}.png`, scale: 0.5, puppeteerInstance: browser});
}
await browser.close({silent: true});
console.log('done', ts.length);
