export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeOutBack = (u: number, s = 1.9) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);

// pop-in with overshoot (0 -> 1), and shrink-away (1 -> 0)
export const popIn = (t: number, at: number, dur = 0.32) => {
  if (t <= at) return 0;
  const u = clamp((t - at) / dur);
  return Math.max(0, easeOutBack(u, 2.2));
};
export const popOut = (t: number, at: number, dur = 0.22) => {
  if (t <= at) return 1;
  const u = clamp((t - at) / dur);
  // tiny swell then shrink
  return u < 0.3 ? 1 + 0.12 * Math.sin((u / 0.3) * Math.PI * 0.5) : (1.12 * (1 - easeInCubic((u - 0.3) / 0.7)));
};
export const popInOut = (t: number, a: number, b: number, din = 0.32, dout = 0.22) =>
  t < b ? popIn(t, a, din) : popOut(t, b, dout) * (t >= b ? 1 : 0);

// damped spring settling from `amp` towards 0
export const spring = (dt: number, amp: number, k = 9, w = 26) => (dt < 0 ? 0 : amp * Math.exp(-k * dt) * Math.cos(w * dt));

// squash-swap envelope around a swap time ts: anticipation squash, then stretch that settles.
export const squash = (t: number, ts: number, amt = 1) => {
  const pre = 0.12;
  if (t < ts - pre || t > ts + 0.6) return {sx: 1, sy: 1};
  if (t < ts) {
    const u = easeOutCubic((t - (ts - pre)) / pre);
    return {sx: 1 + 0.045 * u * amt, sy: 1 - 0.065 * u * amt};
  }
  const v = t - ts;
  const s = Math.exp(-8.5 * v) * Math.cos(24 * v);
  return {sx: 1 + 0.045 * s * amt, sy: 1 - 0.065 * s * amt};
};

// seeded random
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// piecewise keyframes with per-segment easing
export type Key = {t: number; v: number[]; ease?: (u: number) => number};
export const keys = (t: number, ks: Key[]) => {
  if (t <= ks[0].t) return ks[0].v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t <= b.t) {
      const u = (b.ease ?? easeInOutCubic)((t - a.t) / (b.t - a.t));
      return a.v.map((x, j) => lerp(x, b.v[j], u));
    }
  }
  return ks[ks.length - 1].v;
};

// smooth shake: sums of sines (no random per-frame jumps)
export const shake = (t: number, amp: number) => ({
  x: amp * (0.6 * Math.sin(t * 2 * Math.PI * 13.3) + 0.4 * Math.sin(t * 2 * Math.PI * 7.1 + 1.3)),
  y: amp * (0.55 * Math.sin(t * 2 * Math.PI * 11.7 + 0.7) + 0.45 * Math.sin(t * 2 * Math.PI * 5.3 + 2.1)),
});

export const INK = '#1b1b1f';
export const W = 7; // outline width in world px
