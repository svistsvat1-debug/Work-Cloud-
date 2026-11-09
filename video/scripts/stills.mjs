// Bundle once (fixed outDir) and render stills at the given times: node scripts/stills.mjs out_dir scale t1 t2 ...
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [outDir, scaleArg, ...times] = process.argv.slice(2);
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bundleDir = path.join(root, 'build', 'bundle');
const serveUrl = fs.existsSync(path.join(bundleDir, 'index.html')) && process.env.REBUNDLE !== '1'
  ? bundleDir
  : await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: bundleDir});
const composition = await selectComposition({serveUrl, id: 'TheEgg', browserExecutable: BROWSER});
fs.mkdirSync(outDir, {recursive: true});
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(t) * composition.fps));
  const output = path.join(outDir, `t${Number(t).toFixed(2).padStart(6, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, scale: Number(scaleArg), browserExecutable: BROWSER});
  console.log('still', t, '->', output);
}
