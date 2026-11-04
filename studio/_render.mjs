import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
const studio = '/home/user/Work-Cloud-/studio';
const [out, scaleS, audioS, crfS] = process.argv.slice(2);
const bundleDir = path.join(studio, 'out', 'bundle-wp02');
const serveUrl = await bundle({entryPoint: path.join(studio, 'src/index.ts'), outDir: bundleDir, publicDir: path.join(studio, 'public')});
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const inputProps = {withAudio: audioS === '1'};
const comp = await selectComposition({serveUrl, id: 'wp02-woodpecker-brain', inputProps, browserExecutable});
const t0 = Date.now();
let last = -1;
await renderMedia({
  composition: comp, serveUrl, codec: 'h264', outputLocation: out, inputProps, browserExecutable,
  scale: Number(scaleS), crf: Number(crfS ?? 18), imageFormat: 'png', pixelFormat: 'yuv420p', concurrency: 4,
  audioCodec: 'aac', audioBitrate: '320k', muted: audioS !== '1', x264Preset: 'medium',
  chromiumOptions: {gl: 'angle'},
  onProgress: ({progress}) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; console.log(`${(progress * 100).toFixed(0)}%  ${((Date.now() - t0) / 1000).toFixed(0)}s`); } },
});
console.log('rendered', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
