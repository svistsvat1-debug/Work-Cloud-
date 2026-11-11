// node scripts/stills.mjs <compId> <times comma-separated> <outDir> [scale]
// Bundles ONCE to a fixed outDir (.bundle) and renders stills at the given seconds.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [compId, times, outDir, scale = '0.5'] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || undefined;
const BD = process.env.BUNDLE_DIR || '.bundle';
const serveUrl = process.env.REUSE_BUNDLE && fs.existsSync(BD + '/index.html') ? BD : await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve(BD)});
const chromiumOptions = {gl: process.env.GL || 'swangle'};
const comp = await selectComposition({serveUrl, id: compId, browserExecutable, chromiumOptions});
fs.mkdirSync(outDir, {recursive: true});
for (const s of times.split(',').map(Number)) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(s * comp.fps));
  const out = path.join(outDir, `${compId}_${String(frame).padStart(5, '0')}.png`);
  await renderStill({composition: comp, serveUrl, output: out, frame, scale: Number(scale), browserExecutable, chromiumOptions});
  console.log(out);
}
