export const FPS = 60;
export const W = 1080;
export const H = 1920;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInQuad = (t: number) => t * t;
export const easeOutBack = (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

/** Damped spring settling from 0 to 1 (overshoots). */
export const springTo = (t: number, freq = 3.2, damp = 6) =>
  t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(2 * Math.PI * freq * t);

/** Damped oscillation that starts at 1 and decays to 0 (for wobbles / squash). */
export const wobble = (t: number, freq = 4, damp = 5) =>
  t <= 0 ? 0 : Math.exp(-damp * t) * Math.cos(2 * Math.PI * freq * t);

/** Pop-in scale 0 -> 1 with overshoot. */
export const popIn = (t: number, t0: number, dur = 0.28) => {
  const u = clamp((t - t0) / dur);
  return u <= 0 ? 0 : easeOutBack(u, 2.2);
};

/** Pop-out scale 1 -> 0 (small anticipation). */
export const popOut = (t: number, t0: number, dur = 0.2) => {
  const u = clamp((t - t0) / dur);
  if (u <= 0) return 1;
  if (u < 0.35) return 1 + 0.12 * Math.sin((u / 0.35) * Math.PI * 0.5);
  return 1.12 * (1 - easeInQuad((u - 0.35) / 0.65));
};

/** Deterministic pseudo-random in [0,1). */
export const rand = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth "life" noise: sum of sines (never per-frame random). */
export const sway = (t: number, a: number, f1 = 0.6, seed = 0) =>
  a * (0.6 * Math.sin(2 * Math.PI * f1 * t + seed) + 0.4 * Math.sin(2 * Math.PI * f1 * 1.73 * t + seed * 2.1));

export const OUT = '#1d1a22';
export const OW = 7; // outline weight in world px
