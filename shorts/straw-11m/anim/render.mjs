import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
const [scale, out, crf] = [Number(process.argv[2]), process.argv[3], Number(process.argv[4] || 18)];
const BX = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const comp = await selectComposition({serveUrl, id: 'Straw', browserExecutable: BX});
let last = 0;
await renderMedia({serveUrl, composition: comp, codec: 'h264', outputLocation: out, scale, crf, pixelFormat: 'yuv420p',
  imageFormat: 'jpeg', jpegQuality: 95, concurrency: 4, browserExecutable: BX, chromiumOptions: {gl: 'swangle'},
  onProgress: ({progress}) => { if (progress - last > 0.05) { last = progress; console.log(Math.round(progress * 100) + '%'); } }});
console.log('done', out);
