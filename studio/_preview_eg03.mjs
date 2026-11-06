// Quick 0.5x preview of eg03 (muted) -> out/eg03-preview.mp4
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
const studio = '/home/user/Work-Cloud-/studio';
const serveUrl = await bundle({entryPoint: path.join(studio, 'src/index.ts'), outDir: path.join(studio, 'out', 'bundle-eg03'), publicDir: path.join(studio, 'public')});
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const inputProps = {withAudio: false};
const comp = await selectComposition({serveUrl, id: 'eg03-water-on-sand', inputProps, browserExecutable});
const t0 = Date.now();
await renderMedia({composition: comp, serveUrl, codec: 'h264', outputLocation: path.join(studio, 'out', 'eg03-preview.mp4'), inputProps, browserExecutable,
  scale: Number(process.argv[2] ?? 0.5), crf: 20, imageFormat: 'jpeg', jpegQuality: 90, pixelFormat: 'yuv420p', concurrency: 4, muted: true, x264Preset: 'veryfast'});
console.log(`preview done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
