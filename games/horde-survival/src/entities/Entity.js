/**
 * Entity: the shared shape of every object in the game world.
 *
 * Every entity has:
 *   x, y       position in the world (the center of its collision circle)
 *   vx, vy     velocity in pixels per second
 *   radius     collision circle (always smaller than the sprite)
 *   drawSize   how big the sprite is drawn on screen
 *   dead       set to true to remove it at the end of the frame
 * and two methods: update(dt, game) and render(ctx, sprites).
 */
class Entity {
  constructor(x, y, radius, drawSize) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.drawSize = drawSize;
    this.dead = false;
  }

  /** Moves by the current velocity. */
  move(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Is any part of this entity on screen? */
  isVisible(camera) {
    return camera.isVisible(this.x, this.y, this.drawSize);
  }

  update(dt, game) {}

  render(ctx, sprites) {}
}
