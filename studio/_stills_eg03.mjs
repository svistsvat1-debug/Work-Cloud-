import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const studio = '/home/user/Work-Cloud-/studio';
const out = process.argv[2];
const times = process.argv.slice(3).map(Number);
const bundleDir = path.join(studio, 'out', 'bundle-eg03');
let serveUrl = bundleDir;
if (!fs.existsSync(path.join(bundleDir, 'index.html')) || process.env.REBUNDLE) {
  serveUrl = await bundle({entryPoint: path.join(studio, 'src/index.ts'), outDir: bundleDir, publicDir: path.join(studio, 'public')});
}
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const comp = await selectComposition({serveUrl, id: (process.env.COMP ?? 'eg03-water-on-sand'), inputProps: {withAudio: false}, browserExecutable});
fs.mkdirSync(out, {recursive: true});
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(t * 60));
  await renderStill({composition: comp, serveUrl, frame, output: path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`), scale: 0.5, inputProps: {withAudio: false}, browserExecutable, imageFormat: 'png'});
}
console.log('done', times.length);
