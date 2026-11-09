/**
 * A shot fired by a weapon. It flies in a straight line and is removed when
 * it has hit as many enemies as its pierce allows, leaves the screen, or
 * runs out of lifetime.
 */
class Projectile extends Entity {
  /**
   * shot: the final numbers for this shot, already including upgrades:
   * { damage, speed, radius, drawSize, lifetime, knockback, pierce, sprite }
   */
  constructor(x, y, directionX, directionY, shot) {
    super(x, y, shot.radius, shot.drawSize);
    this.directionX = directionX;
    this.directionY = directionY;
    this.vx = directionX * shot.speed;
    this.vy = directionY * shot.speed;
    this.damage = shot.damage;
    this.knockback = shot.knockback;
    this.lifetime = shot.lifetime;
    this.pierce = shot.pierce || 1;
    this.sprite = shot.sprite;
    this.rotation = Math.atan2(directionY, directionX);
    this.hitEnemies = new Set(); // so a piercing shot never hits the same enemy twice
  }

  update(dt, game) {
    this.move(dt);
    this.lifetime -= dt;
    if (this.lifetime <= 0 || !this.isVisible(game.camera)) this.dead = true;
  }

  /** Damages the enemy and pushes it in the direction the projectile was flying. */
  hit(enemy, game) {
    if (this.hitEnemies.has(enemy)) return;
    this.hitEnemies.add(enemy);
    enemy.takeDamage(
      this.damage,
      game,
      this.directionX * this.knockback,
      this.directionY * this.knockback
    );
    this.pierce -= 1;
    if (this.pierce <= 0) this.dead = true;
  }

  render(ctx, sprites) {
    DrawUtils.rotated(ctx, sprites[this.sprite], this.x, this.y, this.drawSize, this.rotation);
  }
}
