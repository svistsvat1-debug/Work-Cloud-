// node scripts/thumb.mjs <out.png>  -> renders the FlamingoThumb still at 1080x1920
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const out = process.argv[2] || 'out/thumbnail.png';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const comp = await selectComposition({serveUrl, id: 'FlamingoThumb', browserExecutable: BROWSER});
await renderStill({composition: comp, serveUrl, frame: 0, output: out, scale: 1, browserExecutable: BROWSER});
console.log('thumb', out);
