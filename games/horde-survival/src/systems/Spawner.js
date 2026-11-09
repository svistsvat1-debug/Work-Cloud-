/**
 * Spawner knows WHERE enemies appear: in small groups just outside the
 * visible screen, from a random direction each time. It also moves enemies
 * that were left far behind back near the screen, so the pressure never drops.
 * WHAT and WHEN to spawn is decided by the WaveDirector.
 */
class Spawner {
  constructor(game) {
    this.game = game;
  }

  reset() {}

  update() {
    this.recycleFarEnemies();
  }

  /**
   * Spawns `count` enemies of one type close together, just off screen.
   * scaling: { health, speed } multipliers from the WaveDirector.
   */
  spawnGroup(type, count, scaling) {
    const center = this.randomEdgePosition();
    const spread = GameConfig.spawn.groupSpread;
    for (let i = 0; i < count; i++) {
      const x = center.x + MathUtils.randomRange(-spread, spread);
      const y = center.y + MathUtils.randomRange(-spread, spread);
      this.game.enemies.push(new Enemy(type, x, y, scaling));
    }
  }

  /** Enemies far behind the player are moved to the edge of the screen again. */
  recycleFarEnemies() {
    const player = this.game.player;
    const maxDistance = GameConfig.spawn.recycleDistance;
    for (const enemy of this.game.enemies) {
      if (MathUtils.distanceSquared(player.x, player.y, enemy.x, enemy.y) < maxDistance * maxDistance) continue;
      const position = this.randomEdgePosition();
      enemy.x = position.x;
      enemy.y = position.y;
      enemy.knockbackX = 0;
      enemy.knockbackY = 0;
    }
  }

  /**
   * A random point on the border of a rectangle slightly bigger than the screen.
   * Enemies appear from off screen and are never placed on top of the player.
   */
  randomEdgePosition() {
    const camera = this.game.camera;
    const margin = GameConfig.spawn.edgeMargin;
    const left = camera.left - margin;
    const top = camera.top - margin;
    const width = camera.width + margin * 2;
    const height = camera.height + margin * 2;

    // Walk a random distance around the rectangle's border.
    let distance = Math.random() * (width * 2 + height * 2);
    if (distance < width) return { x: left + distance, y: top }; // top edge
    distance -= width;
    if (distance < width) return { x: left + distance, y: top + height }; // bottom edge
    distance -= width;
    if (distance < height) return { x: left, y: top + distance }; // left edge
    distance -= height;
    return { x: left + width, y: top + distance }; // right edge
  }
}
