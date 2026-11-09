/**
 * Input tracks the keyboard.
 *
 * - isDown(action): true while a key bound to that action is held.
 * - wasPressed(action): true only on the frame the key went down.
 * Actions (up, down, left, right, ...) are listed in GameConfig.controls.
 */
class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keysDown = new Set();
    this.keysPressed = new Set();

    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.keysDown.delete(event.code));
    // If the window loses focus we never receive "keyup", so release every key.
    window.addEventListener('blur', () => this.keysDown.clear());
  }

  handleKeyDown(event) {
    // Stop arrow keys and space from scrolling the page.
    if (this.isGameKey(event.code)) event.preventDefault();
    if (!event.repeat) this.keysPressed.add(event.code);
    this.keysDown.add(event.code);
  }

  isGameKey(code) {
    return Object.values(GameConfig.controls).some((codes) => codes.includes(code));
  }

  isDown(action) {
    return GameConfig.controls[action].some((code) => this.keysDown.has(code));
  }

  wasPressed(action) {
    return GameConfig.controls[action].some((code) => this.keysPressed.has(code));
  }

  /** Direction from WASD / arrows, normalized so diagonal movement is not faster. */
  getMoveDirection() {
    let x = 0;
    let y = 0;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('right')) x += 1;
    if (this.isDown('up')) y -= 1;
    if (this.isDown('down')) y += 1;
    return MathUtils.normalize(x, y);
  }

  /** Called once at the end of every frame. */
  endFrame() {
    this.keysPressed.clear();
  }
}
