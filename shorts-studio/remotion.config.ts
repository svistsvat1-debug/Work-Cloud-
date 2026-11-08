import {Config} from '@remotion/cli/config';

// Cloud box has no GPU and no Remotion browser download: use the preinstalled headless shell.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
