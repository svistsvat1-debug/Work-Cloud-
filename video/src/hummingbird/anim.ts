// Small animation toolkit: easing, segments, springs, colour mixing, deterministic noise.
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const inv = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeOutBack = (u: number, s = 1.70158) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);

/** 0..1 between times a and b with an easing */
export const seg = (t: number, a: number, b: number, ease = easeInOutCubic) => ease(inv(t, a, b));

/** damped spring impulse: 0 before t0, then a decaying oscillation starting at amp */
export const wobble = (t: number, t0: number, amp: number, freq = 5, decay = 6) => {
  if (t < t0) return 0;
  const x = t - t0;
  return amp * Math.exp(-decay * x) * Math.cos(2 * Math.PI * freq * x);
};

/** pop-in scale with overshoot that settles to 1 (0 before t0) */
export const popIn = (t: number, t0: number, dur = 0.35) => {
  if (t < t0) return 0;
  const u = inv(t, t0, t0 + dur);
  return u < 1 ? easeOutBack(u, 2.2) : 1;
};
/** pop-out: 1 -> 0 with a small anticipation bump */
export const popOut = (t: number, t0: number, dur = 0.25) => {
  if (t < t0) return 1;
  const u = inv(t, t0, t0 + dur);
  return u < 0.3 ? 1 + 0.12 * Math.sin((u / 0.3) * Math.PI * 0.5) : Math.max(0, 1.12 * (1 - easeInCubic((u - 0.3) / 0.7)));
};

// --- colours ---
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, u: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join('');
};

// --- deterministic pseudo random ---
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** smooth shake: sum of sines (never random per frame) */
export const shake = (t: number, amp: number) => ({
  x: amp * (0.6 * Math.sin(2 * Math.PI * 13.3 * t) + 0.4 * Math.sin(2 * Math.PI * 7.1 * t + 1.3)),
  y: amp * (0.6 * Math.sin(2 * Math.PI * 11.7 * t + 0.7) + 0.4 * Math.sin(2 * Math.PI * 5.3 * t + 2.1)),
});

/** piecewise keyframes {t, v} with per-segment easing; numbers only */
export type Key = {t: number; v: number[]; ease?: (u: number) => number};
export const keys = (t: number, ks: Key[]) => {
  if (t <= ks[0].t) return ks[0].v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t <= b.t) {
      const u = (b.ease ?? easeInOutCubic)(inv(t, a.t, b.t));
      return a.v.map((v, j) => lerp(v, b.v[j], u));
    }
  }
  return ks[ks.length - 1].v;
};
