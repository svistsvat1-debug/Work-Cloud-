// Render QA stills: node tools/stills.mjs out/stills 12.5 33 ... (seconds)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
const [, , outDir, ...secs] = process.argv;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const comp = await selectComposition({ serveUrl, id: 'Main', browserExecutable });
for (const s of secs) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(s) * 30));
  await renderStill({ composition: comp, serveUrl, output: path.join(outDir, `f_${String(frame).padStart(5, '0')}.jpg`), frame, imageFormat: 'jpeg', jpegQuality: 80, browserExecutable, scale: 0.5 });
  console.log('still', s);
}
