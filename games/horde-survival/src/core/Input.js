/**
 * Input tracks the keyboard and the mouse (or touch) pointer.
 *
 * - isDown(action): true while a key bound to that action is held.
 * - wasPressed(action): true only on the frame the key went down.
 * - pointer: position in game coordinates (1920x1080) + pressed this frame.
 * Actions (up, down, left, right, ...) are listed in GameConfig.controls.
 */
class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.pointer = { x: -1, y: -1, pressed: false };

    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.keysDown.delete(event.code));
    // If the window loses focus we never receive "keyup", so release every key.
    window.addEventListener('blur', () => this.keysDown.clear());

    canvas.addEventListener('pointermove', (event) => this.updatePointer(event));
    canvas.addEventListener('pointerdown', (event) => {
      this.updatePointer(event);
      this.pointer.pressed = true;
    });
  }

  handleKeyDown(event) {
    // Stop arrow keys and space from scrolling the page (but keep Ctrl/Cmd shortcuts working).
    if (Input.SCROLL_KEYS.includes(event.code) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
    if (!event.repeat) this.keysPressed.add(event.code);
    this.keysDown.add(event.code);
  }

  /** The canvas is scaled on the page, so convert page pixels to game pixels. */
  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * GameConfig.width;
    this.pointer.y = ((event.clientY - rect.top) / rect.height) * GameConfig.height;
  }

  isDown(action) {
    return GameConfig.controls[action].some((code) => this.keysDown.has(code));
  }

  wasPressed(action) {
    return GameConfig.controls[action].some((code) => this.keysPressed.has(code));
  }

  /** Is the pointer inside a rectangle {x, y, width, height}? */
  isPointerOver(rect) {
    const { x, y } = this.pointer;
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  /** Was a rectangle clicked (or tapped) this frame? */
  wasClicked(rect) {
    return this.pointer.pressed && this.isPointerOver(rect);
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
    this.pointer.pressed = false;
  }
}

// Keys whose browser behavior we block (scrolling, F3 = "find next").
Input.SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'F3'];
