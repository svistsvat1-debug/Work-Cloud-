/**
 * WeaponSystem attacks automatically. The player never aims or presses a button.
 * Right now there is one weapon: a magic bolt fired at the nearest enemy.
 */
class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.cooldownTimer = 0;
  }

  update(dt) {
    const stats = GameConfig.autoAttack;
    this.cooldownTimer -= dt;
    if (this.cooldownTimer > 0) return;

    const target = this.findNearestEnemy(stats.range);
    // No enemy in range: stay ready and fire the moment one shows up.
    if (!target) return;

    this.fireAt(target, stats);
    this.cooldownTimer = stats.cooldown;
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

  fireAt(target, stats) {
    const player = this.game.player;
    const direction = MathUtils.normalize(target.x - player.x, target.y - player.y);
    this.game.projectiles.push(new Projectile(player.x, player.y, direction.x, direction.y, stats));
  }
}
