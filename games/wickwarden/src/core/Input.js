// Keyboard (WASD / arrows), mouse and simple touch input.
// Mouse positions are converted to the internal 1920x1080 coordinates.

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
]);

export class Input {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;

    this.keys = new Set(); // keys held right now
    this.pressed = new Set(); // keys pressed during this frame
    this.mouse = { x: -1, y: -1, clicked: false };
    this.touch = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
    this.onFirstInteraction = null; // used to unlock audio
    this.onBlur = null;

    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      this.interacted();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touch.active = false;
      if (this.onBlur) this.onBlur();
    });

    canvas.addEventListener('mousemove', (e) => this.updateMouse(e.clientX, e.clientY));
    canvas.addEventListener('mousedown', (e) => {
      this.updateMouse(e.clientX, e.clientY);
      this.mouse.clicked = true;
      this.interacted();
    });

    // Touch: drag anywhere to move, tap to click buttons.
    canvas.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      this.updateMouse(t.clientX, t.clientY);
      this.mouse.clicked = true;
      this.touch.active = true;
      this.touch.startX = this.touch.x = this.mouse.x;
      this.touch.startY = this.touch.y = this.mouse.y;
      this.interacted();
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      const t = e.changedTouches[0];
      this.updateMouse(t.clientX, t.clientY);
      this.touch.x = this.mouse.x;
      this.touch.y = this.mouse.y;
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', () => {
      this.touch.active = false;
      this.interacted(); // iOS unlocks audio more reliably on touchend
    });
  }

  interacted() {
    if (this.onFirstInteraction) this.onFirstInteraction();
  }

  updateMouse(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * this.width;
    this.mouse.y = ((clientY - rect.top) / rect.height) * this.height;
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(...codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  /** Normalized movement direction (diagonals are not faster). */
  getMoveVector() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;

    if (this.touch.active) {
      const dx = this.touch.x - this.touch.startX;
      const dy = this.touch.y - this.touch.startY;
      if (Math.hypot(dx, dy) > 20) {
        x = dx;
        y = dy;
      }
    }

    const length = Math.hypot(x, y);
    return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
  }

  /** Call once at the end of every frame. */
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
