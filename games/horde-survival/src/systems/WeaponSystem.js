/**
 * WeaponSystem attacks automatically. The player never aims or presses a button.
 * Right now there is one weapon: a magic bolt fired at the nearest enemy.
 * Upgrades (player.stats) make it hit harder, fire faster and fly faster.
 */
class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.cooldownTimer = 0;
  }

  update(dt) {
    const weapon = GameConfig.weapons.magicBolt;
    this.cooldownTimer -= dt;
    if (this.cooldownTimer > 0) return;

    const target = this.findNearestEnemy(weapon.range);
    // No enemy in range: stay ready and fire the moment one shows up.
    if (!target) return;

    this.fireAt(target, weapon);
    this.cooldownTimer = weapon.cooldown / this.game.player.stats.fireRateMultiplier;
  }

  findNearestEnemy(maxDistance) {
    const { player, enemies } = this.game;
    let nearest = null;
    let nearestDistanceSq = maxDistance * maxDistance;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const distanceSq = MathUtils.distanceSquared(player.x, player.y, enemy.x, enemy.y);
      if (distanceSq < nearestDistanceSq) {
        nearest = enemy;
        nearestDistanceSq = distanceSq;
      }
    }
    return nearest;
  }

  fireAt(target, weapon) {
    const player = this.game.player;
    const stats = player.stats;
    const direction = MathUtils.normalize(target.x - player.x, target.y - player.y);
    const shot = {
      damage: weapon.damage * stats.damageMultiplier,
      speed: weapon.projectile.speed * stats.projectileSpeedMultiplier,
      radius: weapon.projectile.radius,
      drawSize: weapon.projectile.drawSize,
      lifetime: weapon.projectile.lifetime,
      knockback: weapon.knockback,
      sprite: 'projectile',
    };
    this.game.projectiles.push(new Projectile(player.x, player.y, direction.x, direction.y, shot));
  }
}
