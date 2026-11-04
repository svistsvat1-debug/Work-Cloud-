// node scripts/stills.mjs <compId> <outDir> <scale> t1 t2 ...   (bundles once into build/bundle)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
const [compId, outDir, scale, ...times] = process.argv.slice(2);
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = process.env.REUSE && fs.existsSync('build/bundle/index.html') ? path.resolve('build/bundle') : await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build/bundle')});
const comp = await selectComposition({serveUrl, id: compId, browserExecutable: BROWSER});
fs.mkdirSync(outDir, {recursive: true});
for (const t of times.length ? times : ['0']) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(t) * comp.fps));
  const out = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition: comp, serveUrl, output: out, frame, scale: parseFloat(scale), browserExecutable: BROWSER, chromiumOptions: {gl: 'swangle'}});
  console.log(out);
}
