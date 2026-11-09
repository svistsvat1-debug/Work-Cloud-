/**
 * The camera decides which part of the world is visible.
 * It stays centered on the player, so the world appears to move around them.
 * It can also shake a little when something hits hard.
 */
class Camera {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // World position shown in the middle of the screen.
    this.x = 0;
    this.y = 0;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeStrength = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  follow(target) {
    this.x = target.x;
    this.y = target.y;
  }

  /** Starts a shake. A stronger shake replaces a weaker one. */
  shake(strength, duration) {
    if (strength < this.shakeStrength * (this.shakeTime / (this.shakeDuration || 1))) return;
    this.shakeStrength = strength;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  update(dt) {
    if (this.shakeTime <= 0) {
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }
    this.shakeTime -= dt;
    // The shake fades out over its duration.
    const power = this.shakeStrength * Math.max(0, this.shakeTime / this.shakeDuration);
    this.shakeX = (Math.random() * 2 - 1) * power;
    this.shakeY = (Math.random() * 2 - 1) * power;
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
    const offsetX = Math.round(this.width / 2 - this.x + this.shakeX);
    const offsetY = Math.round(this.height / 2 - this.y + this.shakeY);
    ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
  }
}
