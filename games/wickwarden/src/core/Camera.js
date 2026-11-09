// The camera keeps the player centered and adds a small screen shake.

export class Camera {
  constructor(width, height, maxShake) {
    this.width = width;
    this.height = height;
    this.maxShake = maxShake;
    this.reset();
  }

  reset() {
    this.x = 0; // world position of the screen center
    this.y = 0;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  follow(target) {
    this.x = target.x;
    this.y = target.y;
  }

  shake(intensity, duration = 0.25) {
    // A weaker shake never interrupts a stronger one that is still running.
    const current = this.shakeTime > 0 ? this.shakeIntensity * (this.shakeTime / this.shakeDuration) : 0;
    if (intensity < current) return;
    this.shakeIntensity = Math.min(this.maxShake, intensity);
    this.shakeTime = duration;
    this.shakeDuration = duration;
  }

  update(dt) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const strength = this.shakeIntensity * Math.max(0, this.shakeTime / this.shakeDuration);
      this.offsetX = (Math.random() * 2 - 1) * strength;
      this.offsetY = (Math.random() * 2 - 1) * strength;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  get left() { return this.x - this.width / 2; }
  get top() { return this.y - this.height / 2; }
  get right() { return this.x + this.width / 2; }
  get bottom() { return this.y + this.height / 2; }

  isVisible(x, y, margin = 0) {
    return (
      x > this.left - margin && x < this.right + margin &&
      y > this.top - margin && y < this.bottom + margin
    );
  }

  worldToScreenX(x) { return x - this.left; }
  worldToScreenY(y) { return y - this.top; }

  /** After this call, drawing uses world coordinates. */
  apply(ctx) {
    ctx.translate(
      Math.round(this.width / 2 - this.x + this.offsetX),
      Math.round(this.height / 2 - this.y + this.offsetY),
    );
  }
}
