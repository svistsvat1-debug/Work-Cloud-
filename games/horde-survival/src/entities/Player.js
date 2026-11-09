/**
 * The player. Movement is the only control: WASD or the arrow keys.
 */
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = GameConfig.player.radius;
    this.speed = GameConfig.player.speed;
    this.drawSize = GameConfig.player.drawSize;
    this.facing = 1; // 1 = looking right, -1 = looking left
    this.walkTime = 0; // drives the small walking bounce
  }

  update(dt, game) {
    const direction = game.input.getMoveDirection();

    // Ease the velocity toward the target velocity: responsive, but not robotic.
    const smoothing = MathUtils.smoothFactor(GameConfig.player.acceleration, dt);
    this.vx += (direction.x * this.speed - this.vx) * smoothing;
    this.vy += (direction.y * this.speed - this.vy) * smoothing;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (direction.x !== 0) this.facing = Math.sign(direction.x);
    if (this.isMoving()) this.walkTime += dt;
  }

  isMoving() {
    return Math.abs(this.vx) + Math.abs(this.vy) > 20;
  }

  render(ctx, sprites) {
    const size = this.drawSize;

    // Soft shadow under the feet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + size * 0.43, size * 0.26, size * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    // A small squash-and-stretch bounce while walking makes a still image feel alive.
    const bounce = this.isMoving() ? Math.sin(this.walkTime * 16) * 0.05 : 0;
    ctx.save();
    ctx.translate(this.x, this.y + size / 2); // pivot at the feet
    ctx.scale(this.facing * (1 - bounce * 0.5), 1 + bounce);
    ctx.drawImage(sprites.player, -size / 2, -size, size, size);
    ctx.restore();
  }
}
