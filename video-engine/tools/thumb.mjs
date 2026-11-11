import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
const out = process.argv[2];
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const comp = await selectComposition({ serveUrl, id: 'Thumb', browserExecutable });
await renderStill({ composition: comp, serveUrl, output: out, frame: 59, imageFormat: 'png', browserExecutable });
console.log('thumb ok');
