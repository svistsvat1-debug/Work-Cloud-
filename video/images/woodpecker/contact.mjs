import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execSync} from 'child_process';
const times = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: 'src/index.ts', outDir: '/tmp/wp-bundle'});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const comp = await selectComposition({serveUrl, id: 'Woodpecker', browserExecutable});
const files = [];
for (const s of times) {
  const f = Math.min(comp.durationInFrames - 1, Math.round(s * 60)); const out = `/tmp/cs/f${String(f).padStart(4, '0')}.png`;
  await renderStill({composition: comp, serveUrl, frame: f, output: out, scale: 0.25, browserExecutable}); files.push(out);
}
console.log(files.join(' '));
