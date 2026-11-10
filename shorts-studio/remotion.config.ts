import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Use the container's pre-installed headless shell when present; elsewhere Remotion downloads its own.
const PREINSTALLED = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = process.env.REMOTION_BROWSER ?? (fs.existsSync(PREINSTALLED) ? PREINSTALLED : null);
if (browser) Config.setBrowserExecutable(browser);
