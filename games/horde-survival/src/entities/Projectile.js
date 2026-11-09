/**
 * A shot fired by a weapon. It flies in a straight line and is removed
 * when it hits an enemy, leaves the screen, or runs out of lifetime.
 */
class Projectile extends Entity {
  /** weapon: a weapon config, e.g. GameConfig.weapons.magicBolt */
  constructor(x, y, directionX, directionY, weapon) {
    const shot = weapon.projectile;
    super(x, y, shot.radius, shot.drawSize);
    this.directionX = directionX;
    this.directionY = directionY;
    this.vx = directionX * shot.speed;
    this.vy = directionY * shot.speed;
    this.damage = weapon.damage;
    this.knockback = weapon.knockback;
    this.lifetime = shot.lifetime;
    this.rotation = Math.atan2(directionY, directionX);
  }

  update(dt, game) {
    this.move(dt);
    this.lifetime -= dt;
    if (this.lifetime <= 0 || !this.isVisible(game.camera)) this.dead = true;
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
