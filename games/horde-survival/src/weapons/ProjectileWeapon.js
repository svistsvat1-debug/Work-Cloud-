/**
 * Fires projectiles at the nearest enemies (Chime Bolt, evolved: Carillon Storm).
 */
class ProjectileWeapon extends Weapon {
  fire() {
    const player = this.game.player;
    const count = this.stats.amount;
    const targets = this.game.collisions.findNearestEnemies(player.x, player.y, count, this.stats.range);
    if (targets.length === 0) return false;

    for (let i = 0; i < count; i++) {
      // More projectiles than targets? Extra ones fan out around the closest targets.
      const target = targets[i % targets.length];
      let angle = Math.atan2(target.y - player.y, target.x - player.x);
      if (i >= targets.length) {
        const extra = i - targets.length + 1;
        angle += (extra % 2 === 0 ? 1 : -1) * 0.18 * Math.ceil(extra / 2);
      }
      this.spawnProjectile(Math.cos(angle), Math.sin(angle));
    }
    this.game.audio.play('shoot');
    return true;
  }

  spawnProjectile(directionX, directionY) {
    const player = this.game.player;
    const stats = this.stats;
    this.game.projectiles.push(
      new Projectile(player.x, player.y, directionX, directionY, {
        damage: this.damage,
        speed: stats.projectileSpeed * player.stats.projectileSpeedMultiplier,
        radius: stats.projectileRadius,
        drawSize: stats.projectileDrawSize,
        lifetime: stats.lifetime,
        knockback: stats.knockback,
        pierce: stats.pierce,
        sprite: this.definition.projectileSprite,
        glow: this.definition.glowSprite,
      })
    );
  }
}
