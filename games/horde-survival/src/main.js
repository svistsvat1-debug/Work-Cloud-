/**
 * Entry point: fits the canvas to the screen and starts the game.
 */
(function boot() {
  const canvas = document.getElementById('game-canvas');
  const stage = canvas.parentElement;
  const rotateHint = document.getElementById('rotate-hint');
  const isTouchScreen = window.matchMedia('(pointer: coarse)').matches;

  // The canvas always has 1920x1080 pixels inside. Here we only change how big
  // it looks: as large as fits while keeping 16:9; the leftover space stays dark
  // (letterbox). On a phone held upright the game is turned sideways, so it
  // fills the screen once the phone is turned, even if screen rotation is locked.
  function fitCanvas() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const rotate = isTouchScreen && height > width;
    const hintSpace = rotate && rotateHint ? 32 : 0; // a strip at the top for "turn your phone"
    const [roomX, roomY] = rotate ? [height - hintSpace, width] : [width, height];
    const scale = Math.min(roomX / GameConfig.width, roomY / GameConfig.height);
    canvas.style.width = `${Math.floor(GameConfig.width * scale)}px`;
    canvas.style.height = `${Math.floor(GameConfig.height * scale)}px`;
    canvas.style.top = `calc(50% + ${hintSpace / 2}px)`;
    canvas.style.transform = rotate ? 'translate(-50%, -50%) rotate(90deg)' : 'translate(-50%, -50%)';
    canvas.dataset.rotated = String(rotate); // Input reads this to place touches correctly
    if (rotateHint) rotateHint.hidden = !rotate;
  }

  function start(viewerData = {}) {
    if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(stage);
    else window.addEventListener('resize', fitCanvas);
    fitCanvas();

    SaveData.load(); // coins, permanent upgrades, best time, settings
    if (viewerData.save) SaveData.applyCloud(viewerData.save); // kept across an artifact update
    CloudSave.connect(); // only does something inside claude.ai
    MenuBackground.load(); // the picture behind the menus (optional)

    const game = new Game(canvas);
    window.game = game; // type "game" in the browser console to inspect it
    game.start();

    // When the claude.ai viewer reloads the page after an update, hand the save back to us.
    try {
      window.claude?.hot?.snapshot?.(() => ({ save: SaveData.data }));
    } catch (error) {
      // Not inside the viewer: nothing to keep.
    }
  }

  const hot = window.claude?.hot; // the claude.ai viewer's update hook (absent elsewhere)
  if (hot?.ready) hot.ready(start);
  else start(hot?.data ?? {});
})();
