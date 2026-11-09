import {Config} from '@remotion/cli/config';

// This container has no GPU and cannot download Remotion's browser: use the pre-installed headless shell.
// On a normal machine delete the next line (Remotion downloads its own) and render with --gl=angle.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
