// Lossless master: PNG sequence. usage: node scripts/render.mjs <outDir> [from] [to]
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import path from "path";
const [outDir, from, to] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "Blitz", browserExecutable });
const range = from !== undefined ? [Number(from), Number(to ?? composition.durationInFrames - 1)] : null;
let last = Date.now();
await renderFrames({
  serveUrl, composition, outputDir: outDir, imageFormat: "png", concurrency: 4, browserExecutable,
  chromiumOptions: { gl: "swangle" }, frameRange: range,
  onStart: () => console.log("frames", composition.durationInFrames),
  onFrameUpdate: (n) => { if (Date.now() - last > 30000) { last = Date.now(); console.log(new Date().toISOString(), "rendered", n); } },
  inputProps: {},
});
console.log("DONE");
