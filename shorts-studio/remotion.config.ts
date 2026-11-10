import {Config} from '@remotion/cli/config';
import fs from 'fs';

// Cloud containers ship their own headless Chromium; on a normal computer Remotion downloads its own.
const local = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(local)) {
  Config.setBrowserExecutable(local);
  Config.setChromiumOpenGlRenderer('swangle');
}
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
