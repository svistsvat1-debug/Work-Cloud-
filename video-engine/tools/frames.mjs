// usage: node tools/frames.mjs <compId> <f1,f2,...> <outdir> [scale]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [id, list, out, scale = '0.5'] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const browserExecutable = process.env.CHROME;
const chromiumOptions = {gl: 'swangle'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const puppeteerInstance = await openBrowser('chrome', {browserExecutable, chromiumOptions});
const composition = await selectComposition({serveUrl, id, browserExecutable, chromiumOptions, puppeteerInstance});
for (const f of list.split(',').map(Number)) {
  await renderStill({composition, serveUrl, frame: f, output: path.resolve(out, `f${String(f).padStart(5, '0')}.png`), imageFormat: 'png', scale: Number(scale), puppeteerInstance, browserExecutable, chromiumOptions});
}
await puppeteerInstance.close({silent: true});
console.log('done');
