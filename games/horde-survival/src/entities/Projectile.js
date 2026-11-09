/**
 * A shot fired by the player's weapon. It flies in a straight line and is
 * removed when it hits an enemy, leaves the screen, or runs out of lifetime.
 */
class Projectile {
  constructor(x, y, directionX, directionY, stats) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    this.vx = directionX * stats.projectileSpeed;
    this.vy = directionY * stats.projectileSpeed;
    this.radius = stats.projectileRadius;
    this.drawSize = stats.projectileDrawSize;
    this.damage = stats.damage;
    this.knockback = stats.knockback;
    this.lifetime = stats.projectileLifetime;
    this.rotation = Math.atan2(directionY, directionX);
    this.dead = false;
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;

    const offScreen = !game.camera.isVisible(this.x, this.y, this.drawSize);
    if (this.lifetime <= 0 || offScreen) this.dead = true;
  }

  /** Damages the enemy and pushes it in the direction the projectile was flying. */
  hit(enemy, game) {
    enemy.takeDamage(
      this.damage,
      game,
      this.directionX * this.knockback,
      this.directionY * this.knockback
    );
    this.dead = true; // one projectile hits one enemy
  }

  render(ctx, sprites) {
    DrawUtils.rotated(ctx, sprites.projectile, this.x, this.y, this.drawSize, this.rotation);
  }
}
