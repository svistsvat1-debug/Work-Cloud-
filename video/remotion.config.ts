import {Config} from '@remotion/cli/config';
// Cloud container: no GPU and no Chrome download -> use the pre-installed headless shell with software GL.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
