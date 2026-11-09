/**
 * CollisionSystem checks which objects touch each other, and answers
 * "which enemies are near this point?" for the weapons.
 *
 * Everything uses circles: two circles touch when the distance between their
 * centers is smaller than the sum of their radii. Circles are smaller than the
 * sprites, so hits only count when things clearly overlap.
 *
 * Enemies are sorted into a SpatialGrid once per frame, so each check only
 * looks at nearby enemies instead of all of them.
 */
class CollisionSystem {
  constructor(game) {
    this.game = game;
    this.grid = new SpatialGrid(GameConfig.collision.gridCellSize);
    // Queries reach this far beyond their own radius, so even the biggest enemy is found.
    this.maxEnemyRadius = Math.max(...Object.values(GameConfig.enemies).map((enemy) => enemy.radius));
  }

  /** Forget everything (a new run starts). */
  reset() {
    this.grid.clear();
  }

  update() {
    this.rebuildGrid();
    this.projectilesVsEnemies();
    this.enemiesVsPlayer();
    this.separateEnemies();
    this.pickupsVsPlayer();
  }

  rebuildGrid() {
    this.grid.clear();
    for (const enemy of this.game.enemies) {
      if (!enemy.dead) this.grid.insert(enemy);
    }
  }

  static circlesOverlap(a, b) {
    const radii = a.radius + b.radius;
    return MathUtils.distanceSquared(a.x, a.y, b.x, b.y) < radii * radii;
  }

  // ---------------------------------------------------------------- Collisions

  projectilesVsEnemies() {
    for (const projectile of this.game.projectiles) {
      if (projectile.dead) continue;
      this.grid.query(projectile.x, projectile.y, projectile.radius + this.maxEnemyRadius, (enemy) => {
        if (projectile.dead || enemy.dead || !CollisionSystem.circlesOverlap(projectile, enemy)) return;
        projectile.hit(enemy, this.game); // stops counting once its pierce is used up
      });
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
    this.grid.query(player.x, player.y, player.radius + this.maxEnemyRadius + padding, (enemy) => {
      if (enemy.dead) return;
      const touchDistance = player.radius + enemy.radius + padding;
      const distanceSq = MathUtils.distanceSquared(player.x, player.y, enemy.x, enemy.y);
      if (distanceSq <= touchDistance * touchDistance) player.takeDamage(enemy.damage, this.game);
      CollisionSystem.pushApart(enemy, player, 1, 0);
    });
  }

  /**
   * Overlapping enemies gently push each other apart, so the horde spreads out
   * instead of stacking. Bigger enemies move less (a boss shoves slimes aside).
   */
  separateEnemies() {
    const strength = GameConfig.combat.enemySeparation;
    for (const a of this.game.enemies) {
      if (a.dead) continue;
      this.grid.query(a.x, a.y, a.radius + this.maxEnemyRadius, (b) => {
        if (b.id <= a.id || b.dead) return; // handle each pair only once
        const total = a.radius + b.radius;
        CollisionSystem.pushApart(a, b, strength * (b.radius / total), strength * (a.radius / total));
      });
    }
  }

  /** Pickups are collected when they reach the player's pickup radius. */
  pickupsVsPlayer() {
    const { player, pickups } = this.game;
    if (player.isDead()) return;
    for (const pickup of pickups) {
      // A chest may have just opened its screen: leave the other pickups for later.
      if (this.game.state !== GameState.PLAYING) return;
      if (pickup.dead) continue;
      const reach = player.pickupRadius + pickup.radius;
      if (MathUtils.distanceSquared(player.x, player.y, pickup.x, pickup.y) < reach * reach) {
        pickup.dead = true;
        pickup.collect(this.game);
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

  // ---------------------------------------------------------------- Queries for weapons

  /** Calls fn(enemy) for every living enemy whose circle overlaps the circle (x, y, radius). */
  forEachEnemyInRadius(x, y, radius, fn) {
    this.grid.query(x, y, radius + this.maxEnemyRadius, (enemy) => {
      if (enemy.dead) return;
      const reach = radius + enemy.radius;
      if (MathUtils.distanceSquared(x, y, enemy.x, enemy.y) < reach * reach) fn(enemy);
    });
  }

  anyEnemyInRadius(x, y, radius) {
    let found = false;
    this.forEachEnemyInRadius(x, y, radius, () => {
      found = true;
    });
    return found;
  }

  /** Up to `count` living enemies closest to (x, y), nearest first, within maxDistance. */
  findNearestEnemies(x, y, count, maxDistance) {
    const maxDistanceSq = maxDistance * maxDistance;
    const nearest = []; // sorted list of { enemy, distanceSq }, at most `count` long
    for (const enemy of this.game.enemies) {
      if (enemy.dead) continue;
      const distanceSq = MathUtils.distanceSquared(x, y, enemy.x, enemy.y);
      if (distanceSq > maxDistanceSq) continue;
      if (nearest.length < count || distanceSq < nearest[nearest.length - 1].distanceSq) {
        nearest.push({ enemy, distanceSq });
        nearest.sort((a, b) => a.distanceSq - b.distanceSq);
        if (nearest.length > count) nearest.pop();
      }
    }
    return nearest.map((entry) => entry.enemy);
  }

  /** Up to `count` different living enemies that are on screen, picked at random. */
  findRandomVisibleEnemies(count) {
    const camera = this.game.camera;
    const visible = this.game.enemies.filter((enemy) => !enemy.dead && camera.isVisible(enemy.x, enemy.y));
    const picked = [];
    while (picked.length < count && visible.length > 0) {
      const index = Math.floor(Math.random() * visible.length);
      picked.push(visible[index]);
      visible[index] = visible[visible.length - 1]; // remove without shifting the whole array
      visible.pop();
    }
    return picked;
  }
}
