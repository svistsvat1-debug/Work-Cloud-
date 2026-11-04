import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = path.resolve('build/bundle');
const [gl, scale, ...frames] = process.argv.slice(2);
const comp = await selectComposition({serveUrl, id: 'GearConcrete', browserExecutable: BROWSER});
for (const fr of frames) {
  const t0 = Date.now();
  await renderStill({composition: comp, serveUrl, output: `/tmp/claude-0/-home-user-Work-Cloud-/205bfc03-f795-5a66-bb14-3e54ddd1e765/scratchpad/bench_${fr}.png`, frame: +fr, scale: +scale, browserExecutable: BROWSER, chromiumOptions: gl === 'none' ? {} : {gl}});
  console.log(gl, scale, fr, Date.now() - t0, 'ms');
}
