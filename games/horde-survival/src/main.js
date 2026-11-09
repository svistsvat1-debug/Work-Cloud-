/**
 * Entry point: fits the canvas to the window and starts the game.
 */
(function startGame() {
  const canvas = document.getElementById('game-canvas');

  // The canvas always has 1920x1080 pixels inside. Here we only change how big
  // it looks on the page: as large as possible while keeping 16:9.
  // The leftover space stays black (letterbox).
  function fitCanvasToWindow() {
    const scale = Math.min(
      window.innerWidth / GameConfig.width,
      window.innerHeight / GameConfig.height
    );
    canvas.style.width = `${Math.floor(GameConfig.width * scale)}px`;
    canvas.style.height = `${Math.floor(GameConfig.height * scale)}px`;
  }

  window.addEventListener('resize', fitCanvasToWindow);
  fitCanvasToWindow();

  const game = new Game(canvas);
  window.game = game; // type "game" in the browser console to inspect it
  game.start();
})();
