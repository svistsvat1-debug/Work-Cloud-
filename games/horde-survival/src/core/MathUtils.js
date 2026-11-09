/**
 * Small math helpers used all over the game.
 */
const MathUtils = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  /**
   * Frame-rate independent smoothing.
   * Returns how much (0..1) of the remaining distance to cover this frame.
   * The same sharpness gives the same feel at 30, 60 or 144 FPS.
   */
  smoothFactor(sharpness, dt) {
    return 1 - Math.exp(-sharpness * dt);
  },

  distanceSquared(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
  },

  distance(ax, ay, bx, by) {
    return Math.sqrt(MathUtils.distanceSquared(ax, ay, bx, by));
  },

  /** Returns a vector of length 1 pointing the same way (or 0,0). */
  normalize(x, y) {
    const length = Math.sqrt(x * x + y * y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  },

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  },

  randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  },

  randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  /** Picks one item at random; items with a bigger weight are picked more often. */
  pickWeighted(items, getWeight) {
    const total = items.reduce((sum, item) => sum + getWeight(item), 0);
    let roll = Math.random() * total;
    for (const item of items) {
      roll -= getWeight(item);
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  },

  /**
   * A repeatable "random" number in [0, 1) for a grid cell (x, y).
   * The same cell always gives the same number, so the endless world looks the
   * same every time you walk past (no need to store anything).
   */
  hash2D(x, y, seed = 0) {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  },

  /** 75.4 -> "01:15" */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },
};
