// Small math helpers shared by every system.

export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distanceSq(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const r = ar + br;
  return distanceSq(ax, ay, bx, by) <= r * r;
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/** Random integer between min and max (both inclusive). */
export function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** Picks a key from an object of weights, e.g. { slime: 3, bat: 1 }. */
export function weightedKey(weights) {
  let total = 0;
  for (const key in weights) total += weights[key];
  let roll = Math.random() * total;
  for (const key in weights) {
    roll -= weights[key];
    if (roll <= 0) return key;
  }
  return Object.keys(weights)[0];
}

/** Removes and returns a weighted item from an array of { weight } objects. */
export function takeWeighted(items) {
  let total = 0;
  for (const item of items) total += item.weight;
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= items[i].weight;
    if (roll <= 0) return items.splice(i, 1)[0];
  }
  return items.pop();
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/** Frame-rate independent smoothing: moves `current` toward `target`. */
export function damp(current, target, sharpness, dt) {
  return lerp(current, target, 1 - Math.exp(-sharpness * dt));
}

export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Deterministic random generator (mulberry32) — same seed, same numbers. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hashes two integers into a seed (used for world chunks). */
export function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
