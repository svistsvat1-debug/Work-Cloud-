import {Config} from '@remotion/cli/config';

// Local Chromium headless shell (pre-installed with Playwright) - no download needed.
Config.setBrowserExecutable(
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
);
Config.setVideoImageFormat('png');
Config.setConcurrency(4);
