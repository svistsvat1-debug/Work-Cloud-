// usage: node scripts/stills.mjs <sec> [sec...]  -> out/stills/t<sec>.png
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
const secs = process.argv.slice(2).map(Number);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const comp = await selectComposition({ serveUrl, id: "Blitz", browserExecutable });
for (const s of secs) {
  const frame = Math.round(s * 30);
  await renderStill({ serveUrl, composition: comp, frame, output: `out/stills/t${s}.png`, browserExecutable, chromiumOptions: { gl: "swangle" } });
  console.log("ok", s);
}
