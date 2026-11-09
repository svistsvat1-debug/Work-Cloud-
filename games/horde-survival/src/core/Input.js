/**
 * Input tracks the keyboard and the pointer (mouse, finger or pen).
 *
 * - isDown(action): true while a key bound to that action is held.
 * - wasPressed(action): true only on the frame the key went down.
 * - pointer: position in game coordinates (1920x1080) + pressed this frame.
 * - stick: on touch screens a finger anywhere on the game is a joystick.
 *   It appears where the finger lands and follows the finger if it goes far.
 * Actions (up, down, left, right, ...) are listed in GameConfig.controls.
 */
class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keysDown = new Set();
    this.keysPressed = new Set();
    // pressX/pressY: where the pointer went down (a tap is judged where it started).
    this.pointer = { x: -1, y: -1, pressed: false, pressX: -1, pressY: -1 };
    // The touch joystick, in game coordinates. `active` while its finger is down.
    this.stick = { active: false, pointerId: null, baseX: 0, baseY: 0, knobX: 0, knobY: 0 };
    // Phones and tablets start in touch mode; a key press or a mouse switches it off.
    // The screens use it to show "tap" hints instead of keyboard hints.
    this.touchMode = window.matchMedia('(pointer: coarse)').matches;

    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.keysDown.delete(event.code));
    // If the window loses focus we never receive "keyup", so release every key.
    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.releaseStick();
    });

    canvas.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    canvas.addEventListener('pointerup', (event) => this.handlePointerUp(event));
    canvas.addEventListener('pointercancel', (event) => this.handlePointerUp(event));
    // A long press would open the phone's menu for the picture.
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  handleKeyDown(event) {
    // Stop arrow keys and space from scrolling the page (but keep Ctrl/Cmd shortcuts working).
    if (Input.SCROLL_KEYS.includes(event.code) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
    if (!event.repeat) this.keysPressed.add(event.code);
    this.keysDown.add(event.code);
    this.touchMode = false;
  }

  handlePointerDown(event) {
    const isFinger = event.pointerType !== 'mouse';
    this.touchMode = isFinger;
    const point = this.updatePointer(event);
    this.pointer.pressed = true;
    this.pointer.pressX = point.x;
    this.pointer.pressY = point.y;

    // The first finger down becomes the joystick (a second finger can still tap buttons).
    if (isFinger && !this.stick.active) {
      Object.assign(this.stick, { active: true, pointerId: event.pointerId, baseX: point.x, baseY: point.y, knobX: point.x, knobY: point.y });
      // Keep receiving this finger's moves even when it slides off the canvas.
      try {
        this.canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        // Not supported: moves outside the canvas are simply missed.
      }
    }
  }

  handlePointerMove(event) {
    const point = this.updatePointer(event);
    const stick = this.stick;
    if (!stick.active || event.pointerId !== stick.pointerId) return;
    const radius = GameConfig.touch.stickRadius;
    const dx = point.x - stick.baseX;
    const dy = point.y - stick.baseY;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      // Drag the base along, so the stick never "runs out" at the edge.
      stick.baseX = point.x - (dx / distance) * radius;
      stick.baseY = point.y - (dy / distance) * radius;
    }
    stick.knobX = point.x;
    stick.knobY = point.y;
  }

  handlePointerUp(event) {
    if (event.pointerId === this.stick.pointerId) this.releaseStick();
  }

  /** Lifts the joystick: the finger has to touch again to steer (used when menus open or close). */
  releaseStick() {
    this.stick.active = false;
    this.stick.pointerId = null;
  }

  /**
   * The canvas is scaled on the page (and turned sideways on an upright phone,
   * see main.js), so convert page pixels to game pixels.
   */
  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    let u = (event.clientX - rect.left) / rect.width; // 0..1 across the box on screen
    let v = (event.clientY - rect.top) / rect.height;
    if (this.canvas.dataset.rotated === 'true') {
      // Turned 90° clockwise: the game's left edge is at the top of the screen.
      [u, v] = [v, 1 - u];
    }
    this.pointer.x = u * GameConfig.width;
    this.pointer.y = v * GameConfig.height;
    return this.pointer;
  }

  isDown(action) {
    return GameConfig.controls[action].some((code) => this.keysDown.has(code));
  }

  wasPressed(action) {
    return GameConfig.controls[action].some((code) => this.keysPressed.has(code));
  }

  /** Is the pointer inside a rectangle {x, y, width, height}? (for hover effects) */
  isPointerOver(rect) {
    if (this.touchMode) return false; // fingers don't hover: a highlight would stick to the last tap
    return Input.isInside(rect, this.pointer.x, this.pointer.y, 0);
  }

  /**
   * Was a rectangle clicked (or tapped) this frame? `padding` makes small
   * buttons easier to hit with a finger.
   */
  wasClicked(rect, padding = 0) {
    return this.pointer.pressed && Input.isInside(rect, this.pointer.pressX, this.pointer.pressY, padding);
  }

  /**
   * Where the player wants to go: WASD / arrows, or the touch joystick.
   * Keys give full speed in 8 directions (normalized, so diagonals are not
   * faster); the joystick also gives slower speeds for small drags.
   */
  getMoveDirection() {
    let x = 0;
    let y = 0;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('right')) x += 1;
    if (this.isDown('up')) y -= 1;
    if (this.isDown('down')) y += 1;
    if (x !== 0 || y !== 0) return MathUtils.normalize(x, y);
    return this.getStickDirection();
  }

  getStickDirection() {
    const stick = this.stick;
    if (!stick.active) return { x: 0, y: 0 };
    const { stickRadius, deadZone, fullSpeedAt } = GameConfig.touch;
    const dx = (stick.knobX - stick.baseX) / stickRadius;
    const dy = (stick.knobY - stick.baseY) / stickRadius;
    const length = Math.hypot(dx, dy);
    if (length < deadZone) return { x: 0, y: 0 }; // tiny wobbles of the finger do nothing
    const strength = Math.min(1, (length - deadZone) / (fullSpeedAt - deadZone));
    return { x: (dx / length) * strength, y: (dy / length) * strength };
  }

  /** Called once at the end of every frame. */
  endFrame() {
    this.keysPressed.clear();
    this.pointer.pressed = false;
  }

  static isInside(rect, x, y, padding) {
    return (
      x >= rect.x - padding &&
      x <= rect.x + rect.width + padding &&
      y >= rect.y - padding &&
      y <= rect.y + rect.height + padding
    );
  }
}

// Keys whose browser behavior we block (scrolling, F3 = "find next").
Input.SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'F3'];
