export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const INK = '#1d1b1f';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const seg = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));

export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeInOutSine = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;
export const easeOutBack = (u: number, s = 1.70158) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);

/** 0 before t0, then a decaying cosine starting at 1 */
export const ring = (t: number, t0: number, freq: number, decay: number) =>
  t < t0 ? 0 : Math.exp(-decay * (t - t0)) * Math.cos(2 * Math.PI * freq * (t - t0));

/** impulse response: starts at 0, swings to ~1 within a quarter period, decays (no jumps) */
export const imp = (t: number, t0: number, freq: number, decay: number) =>
  t < t0 ? 0 : Math.exp(-decay * (t - t0)) * Math.sin(2 * Math.PI * freq * (t - t0));

/** 0 -> overshoot -> 1 */
export const popIn = (t: number, t0: number, dur = 0.24, s = 2.4) => (t < t0 ? 0 : easeOutBack(seg(t, t0, t0 + dur), s));
/** 1 -> small swell -> 0 */
export const popOut = (t: number, t0: number, dur = 0.16) => {
  if (t < t0) return 1;
  const u = seg(t, t0, t0 + dur);
  return u < 0.3 ? 1 + 0.15 * (u / 0.3) : 1.15 * (1 - easeInCubic((u - 0.3) / 0.7));
};
/** visible between a and b with pop in/out */
export const popWindow = (t: number, a: number, b: number, din = 0.24, dout = 0.16) =>
  t < a ? 0 : t < b ? popIn(t, a, din) : popOut(t, b, dout);

/** a smooth 0..1..0 bump between a and b */
export const bump = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin(Math.PI * seg(t, a, b)));

/** step 0->1 between a and b with easing */
export const step = (t: number, a: number, b: number, ease = easeInOutCubic) => ease(seg(t, a, b));

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

// ---------------------------------------------------------------- world: poles and wires
export const POLE_X = 238;
export const SPAN = 1900;
export const SAG = 70;
export const WIRE_TOP = {up: 640, low: 1060};
export type WireId = 'up' | 'low';

export const wireBase = (w: WireId, x: number) => {
  const u = ((((x - POLE_X) % SPAN) + SPAN) % SPAN) / SPAN;
  return WIRE_TOP[w] + SAG * 4 * u * (1 - u);
};

export const BIRD_X = 560;
export const EAGLE_X = 860;
