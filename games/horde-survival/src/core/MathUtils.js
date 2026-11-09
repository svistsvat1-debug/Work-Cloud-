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

  /** 75.4 -> "01:15" */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },
};
