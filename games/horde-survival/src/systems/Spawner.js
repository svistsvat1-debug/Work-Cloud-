/**
 * Spawner creates enemies just outside the visible screen,
 * a little faster as time goes on.
 */
class Spawner {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.timer = 0;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.currentInterval();

    if (this.game.enemies.length >= GameConfig.spawn.maxEnemies) return;

    const position = this.randomEdgePosition();
    this.game.enemies.push(new Enemy(this.pickEnemyType(), position.x, position.y));
  }

  /** Seconds until the next spawn: shrinks over time, never below minInterval. */
  currentInterval() {
    const { startInterval, minInterval, intervalDecreasePerSecond } = GameConfig.spawn;
    return Math.max(minInterval, startInterval - this.game.survivalTime * intervalDecreasePerSecond);
  }

  /** Picks an enemy type at random, using spawnWeight (higher = more common). */
  pickEnemyType() {
    const types = Object.keys(GameConfig.enemies);
    return MathUtils.pickWeighted(types, (type) => GameConfig.enemies[type].spawnWeight);
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
