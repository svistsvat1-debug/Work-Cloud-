import {Config} from '@remotion/cli/config';

// This cloud box has no GPU and cannot download Chrome; use the pre-installed headless shell.
// On your own machine you can delete this line and render with --gl=angle on the graphics card.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
Config.setVideoImageFormat('png');
