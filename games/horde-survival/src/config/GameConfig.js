/**
 * GameConfig holds the numbers that shape the game.
 * Tune the game here instead of hunting for numbers inside the logic.
 */
const GameConfig = {
  // The game always renders at this internal resolution.
  // main.js scales the canvas to fit the window while keeping 16:9.
  width: 1920,
  height: 1080,

  // Every character and monster sprite is drawn into a canvas of this size.
  spriteSourceSize: 182,

  // Longest time step (seconds) simulated in one frame. Prevents huge jumps
  // after the tab was hidden or the browser froze for a moment.
  maxDeltaTime: 0.05,

  player: {
    speed: 300, // pixels per second
    acceleration: 14, // how fast the player reaches full speed (higher = snappier)
    drawSize: 128, // on-screen size of the 182x182 sprite
    radius: 28, // collision circle: smaller than the sprite, so hits feel fair
  },

  background: {
    tileSize: 128,
    colors: ['#1c2a21', '#1f2f25'],
    gridColor: 'rgba(255, 255, 255, 0.035)',
  },

  // Keyboard bindings use KeyboardEvent.code (the physical key),
  // so WASD also works on non-English keyboard layouts.
  controls: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
  },

  ui: {
    title: 'Horde Survival',
    font: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  },
};
