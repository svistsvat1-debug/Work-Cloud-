import {Config} from '@remotion/cli/config';

// Chromium headless shell shipped with the environment (no download needed).
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(12); // high-quality intermediate; final encode happens in tools/finalize.py
Config.setPixelFormat('yuv420p');
