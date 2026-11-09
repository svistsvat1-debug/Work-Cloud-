// Shared shape of everything that lives in the world:
// position, velocity, a collision radius, and update/render methods.

export class Entity {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 10; // collision circle
    this.active = true; // false = will be removed (and returned to its pool)
  }

  // eslint-disable-next-line no-unused-vars
  update(dt, game) {}

  // eslint-disable-next-line no-unused-vars
  render(ctx, game) {}
}
