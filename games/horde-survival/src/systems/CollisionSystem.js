/**
 * CollisionSystem checks which objects touch each other.
 * Everything uses circles: two circles touch when the distance between their
 * centers is smaller than the sum of their radii. Circles are smaller than the
 * sprites, so hits only count when things clearly overlap.
 */
class CollisionSystem {
  constructor(game) {
    this.game = game;
  }

  update() {
    this.projectilesVsEnemies();
    this.enemiesVsPlayer();
    this.separateEnemies();
  }

  static circlesOverlap(a, b) {
    const radii = a.radius + b.radius;
    return MathUtils.distanceSquared(a.x, a.y, b.x, b.y) < radii * radii;
  }

  projectilesVsEnemies() {
    const { projectiles, enemies } = this.game;
    for (const projectile of projectiles) {
      if (projectile.dead) continue;
      for (const enemy of enemies) {
        if (enemy.dead || !CollisionSystem.circlesOverlap(projectile, enemy)) continue;
        projectile.hit(enemy, this.game);
        break;
      }
    }
  }

  /**
   * Enemies that touch the player deal contact damage (the player's short
   * invulnerability limits how often). Then they are pushed back to the edge
   * of the player's circle, so they can't walk through.
   */
  enemiesVsPlayer() {
    const player = this.game.player;
    const padding = GameConfig.combat.contactPadding;
    for (const enemy of this.game.enemies) {
      if (enemy.dead) continue;
      const touchDistance = player.radius + enemy.radius + padding;
      const distanceSq = MathUtils.distanceSquared(player.x, player.y, enemy.x, enemy.y);
      if (distanceSq <= touchDistance * touchDistance) player.takeDamage(enemy.damage, this.game);
      CollisionSystem.pushApart(enemy, player, 1, 0);
    }
  }

  /** Overlapping enemies gently push each other apart, so the horde spreads out instead of stacking. */
  separateEnemies() {
    const enemies = this.game.enemies;
    const strength = GameConfig.collision.enemySeparation;
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        CollisionSystem.pushApart(enemies[i], enemies[j], strength * 0.5, strength * 0.5);
      }
    }
  }

  /**
   * If circles a and b overlap, moves them apart along the line between their centers.
   * aShare / bShare = how much of the overlap each one moves (0 = doesn't move).
   */
  static pushApart(a, b, aShare, bShare) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    const minDistance = a.radius + b.radius;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq >= minDistance * minDistance) return;

    let distance = Math.sqrt(distanceSq);
    if (distance === 0) {
      // Exactly on top of each other: pick any direction.
      dx = 1;
      dy = 0;
      distance = 1;
    }
    const overlap = minDistance - distance;
    const nx = dx / distance;
    const ny = dy / distance;
    a.x += nx * overlap * aShare;
    a.y += ny * overlap * aShare;
    b.x -= nx * overlap * bShare;
    b.y -= ny * overlap * bShare;
  }
}
