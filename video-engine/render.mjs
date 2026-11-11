// Render helper: node render.mjs <video|stills|thumb> [args]
//   video <out.mp4> [startFrame endFrame]
//   stills <outDir> <frame> [frame...]
//   thumb <out.png>
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import os from 'node:os';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const [mode, ...args] = process.argv.slice(2);

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const envVariables = {NO_WOB: process.env.NO_WOB || ""};
const common = {envVariables, serveUrl, browserExecutable: BROWSER, chromiumOptions: {gl: 'swangle'}, logLevel: 'warn'};

if (mode === 'video') {
  const comp = await selectComposition({...common, id: 'OneSoldier'});
  const out = args[0];
  const frameRange = args[1] ? [Number(args[1]), Number(args[2])] : null;
  let last = 0;
  await renderMedia({
    ...common,
    composition: comp,
    codec: 'h264',
    crf: 18,
    pixelFormat: 'yuv420p',
    muted: true,
    outputLocation: out,
    frameRange,
    concurrency: Number(process.env.CONC || os.cpus().length),
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 100);
      if (p >= last + 2) {
        last = p;
        console.log(`progress ${p}%`);
      }
    },
  });
  console.log('done', out);
} else if (mode === 'stills') {
  const comp = await selectComposition({...common, id: 'OneSoldier'});
  const [dir, ...frames] = args;
  for (const f of frames) {
    await renderStill({...common, composition: comp, frame: Number(f), output: path.join(dir, `frame_${String(f).padStart(5, '0')}.png`)});
    console.log('still', f);
  }
} else if (mode === 'thumb') {
  // thumb <out.png> [compositionId ...] -> one PNG per id (suffix _<id> when several)
  const ids = args.slice(1).length ? args.slice(1) : ['OneSoldierThumb'];
  for (const id of ids) {
    const comp = await selectComposition({...common, id});
    const out = ids.length > 1 ? args[0].replace(/\.png$/, `_${id}.png`) : args[0];
    await renderStill({...common, composition: comp, frame: 0, output: out});
    console.log('thumb', out);
  }
}
