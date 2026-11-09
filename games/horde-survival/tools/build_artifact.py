#!/usr/bin/env python3
"""
build_artifact.py: packs the game into a page for a claude.ai artifact, so it
can be played in the browser on a phone or a computer.

    python3 tools/build_artifact.py --out path/to/folder

Writes into that folder:
  index.html  the page: its styles, the canvas, and every game script inline
              (in the order index.html loads them)
  assets/...  the pictures the game loads (sprites, ground tiles, menu art),
              to publish next to the page at the same paths

The page has no <html>, <head> or <body> tags of its own: the claude.ai
publisher wraps it in its own document. Run it from the game folder.
"""
import argparse
import re
import shutil
from pathlib import Path

PAGE = """<title>Hushbreaker</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  /* Layout: one full-screen stage; main.js fits the 16:9 canvas inside it and
     turns it sideways on a phone held upright. One dark look: a battlefield at night. */
  :root {
    --night: #07060b; /* letterbox around the game: violet-tinted black */
    --ground: #0d1210; /* behind the canvas until the first frame is drawn */
    --hint: #9a94ad; /* muted lavender, the color of the Hush */
    --font-ui: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color-scheme: dark;
  }
  html {
    height: 100%;
    box-sizing: border-box;
    overscroll-behavior: none;
  }
  body {
    height: 100%;
    box-sizing: border-box;
    margin: 0;
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
    overflow: hidden;
    overscroll-behavior: none;
    background: var(--night);
    color: var(--hint);
    font-family: var(--font-ui);
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  #stage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: none;
  }
  #game-canvas {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: block;
    background: var(--ground);
    touch-action: none;
    outline: none;
  }
  #rotate-hint {
    position: absolute;
    top: 8px;
    left: 0;
    right: 0;
    margin: 0;
    text-align: center;
    font-size: 14px;
    color: var(--hint);
    pointer-events: none;
  }
</style>
<div id="stage">
  <canvas id="game-canvas" width="1920" height="1080" aria-label="Hushbreaker game"></canvas>
  <p id="rotate-hint" hidden>↺ Turn your phone sideways to play</p>
</div>
<script>
{bundle}
</script>
"""


def script_paths(index_html):
    """The game's scripts, in the order index.html loads them."""
    return re.findall(r'<script src="([^"]+)"></script>', index_html)


def bundle(paths):
    parts = []
    for path in paths:
        code = Path(path).read_text(encoding='utf-8')
        parts.append(f'// ---------------------------------------------------------------- {path}\n{code}')
    code = '\n'.join(parts)
    # "</script" inside the code would end the inline <script> early.
    return code.replace('</script', '<\\/script')


def asset_paths():
    """Every picture GameConfig mentions (sprites, ground tiles, menu background)."""
    config = Path('src/config/GameConfig.js').read_text(encoding='utf-8')
    return sorted(set(re.findall(r"'(assets/[^']+)'", config)))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--out', required=True, help='folder to write the page and assets into')
    out = Path(parser.parse_args().out)
    out.mkdir(parents=True, exist_ok=True)

    scripts = script_paths(Path('index.html').read_text(encoding='utf-8'))
    page = PAGE.replace('{bundle}', bundle(scripts))
    (out / 'index.html').write_text(page, encoding='utf-8')
    print(f'index.html: {len(scripts)} scripts, {len(page) // 1024} KB')

    for asset in asset_paths():
        target = out / asset
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(asset, target)
        print('asset', asset)


if __name__ == '__main__':
    main()
