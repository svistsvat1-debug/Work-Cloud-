/**
 * The camera decides which part of the world is visible.
 * It stays centered on the player, so the world appears to move around them.
 */
class Camera {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // World position shown in the middle of the screen.
    this.x = 0;
    this.y = 0;
  }

  follow(target) {
    this.x = target.x;
    this.y = target.y;
  }

  get left() {
    return this.x - this.width / 2;
  }

  get right() {
    return this.x + this.width / 2;
  }

  get top() {
    return this.y - this.height / 2;
  }

  get bottom() {
    return this.y + this.height / 2;
  }

  /** Is this world point on screen? A margin lets you include objects just outside. */
  isVisible(x, y, margin = 0) {
    return (
      x > this.left - margin &&
      x < this.right + margin &&
      y > this.top - margin &&
      y < this.bottom + margin
    );
  }

  /** After this call, drawing at world coordinates lands in the right place on screen. */
  applyTransform(ctx) {
    // Rounding keeps tiles crisp instead of blurry between pixels.
    const offsetX = Math.round(this.width / 2 - this.x);
    const offsetY = Math.round(this.height / 2 - this.y);
    ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
  }
}
