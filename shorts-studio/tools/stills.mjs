// Contact sheet: render a still at every beat (scale 0.5) -> images/birdwire/qa/beat-XX.png
// Usage: node tools/stills.mjs [rebundle]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'images/birdwire/qa');
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

const meta = JSON.parse(fs.readFileSync(path.join(root, 'src/birdwire/words.json'), 'utf8'));
const at = (w, n = 0) => meta.words.filter((x) => x.w.toLowerCase() === w)[n].start;
const lineEnd = (li) => Math.max(...meta.words.filter((x) => x.line === li).map((x) => x.end));

const beats = [
  ['frame 0', 0],
  ['"bird"', at('bird') + 0.1],
  ['zip under feet', at('zapped')],
  ['boots on', lineEnd(0) + 0.3],
  ['boots poof', at('not') + 0.15],
  ['"feet" toes', at('feet') + 0.1],
  ['"current"', at('current') + 0.45],
  ['"two spots"', at('spots') + 0.25],
  ['"different"', at('different') + 0.45],
  ['"voltages"', at('voltages') + 0.25],
  ['"both feet"', at('feet', 1) + 0.35],
  ['"same voltage"', at('same') + 0.4],
  ['"nothing"', at('nothing') + 0.15],
  ['"flows"', at('flows') + 0.2],
  ['eagle swoop', lineEnd(3) + 0.25],
  ['eagle lands', at('but') + 0.2],
  ['stretch', at('wire', 1) + 0.2],
  ['"pole"', at('pole') + 0.2],
  ['touch', at('closes') + 0.12],
  ['zip dives', at('closes') + 0.55],
  ['ZAP', lineEnd(4) + 0.1],
  ['skeleton', lineEnd(4) + 0.2],
  ['poof', lineEnd(4) + 0.78],
  ['frizzled', at('big') + 0.1],
  ['cough', at('eagles') + 0.25],
  ['takeoff', at('way') + 0.35],
  ['"danger"', at('danger') + 0.2],
  ['loop back', lineEnd(5) + 0.55],
  ['last frame', meta.duration - 1 / 60],
];

const bundleDir = path.join(root, 'build');
let serveUrl = bundleDir;
if (process.argv[2] === 'rebundle' || !fs.existsSync(path.join(bundleDir, 'index.html'))) {
  serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: bundleDir, publicDir: path.join(root, 'public')});
}
const composition = await selectComposition({serveUrl, id: 'BirdWire', browserExecutable});
const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
const list = [];
for (const [i, [label, t]] of beats.entries()) {
  if (only && !only.includes(i)) continue;
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * 60));
  const output = path.join(outDir, `beat-${String(i).padStart(2, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, scale: 0.5, browserExecutable, chromiumOptions: {gl: 'swangle'}});
  list.push({i, label, frame, t: +(frame / 60).toFixed(2), file: output});
  console.log(i, label, frame);
}
fs.writeFileSync(path.join(outDir, 'beats.json'), JSON.stringify(list, null, 1));
