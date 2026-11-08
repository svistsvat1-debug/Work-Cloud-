import {Config} from '@remotion/cli/config';

// Cloud container: no GPU and no Chrome download - use the pre-installed headless shell.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
Config.setChromeMode('headless-shell');
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
