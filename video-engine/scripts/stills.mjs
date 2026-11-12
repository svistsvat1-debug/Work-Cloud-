// node scripts/stills.mjs <compId> <outDir> <scale> <sec1> <sec2> ...  (bundles once)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const [compId, outDir, scale, ...secs] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || undefined;
const serveUrl = process.env.BUNDLE || (await bundle({entryPoint: path.resolve('src/index.ts')}));
const chromiumOptions = {gl: 'swangle'};
const comp = await selectComposition({serveUrl, id: compId, browserExecutable, chromiumOptions});
for (const s of secs) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(Number(s) * comp.fps));
  const out = path.join(outDir, `${compId}_${String(s).replace('.', '_')}.png`);
  await renderStill({composition: comp, serveUrl, output: out, frame, scale: Number(scale), browserExecutable, chromiumOptions});
  console.log('still', out);
}
console.log('BUNDLE', serveUrl);
