// Shared animation helpers for all cut-out Shorts.

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const prog = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));

export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeOutBack = (u: number, s = 1.70158) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);

// damped spring settling from 1 to 0 (for squash / stretch recoil)
export const spring = (t: number, freq = 4, damp = 6) => (t < 0 ? 0 : Math.exp(-damp * t) * Math.cos(2 * Math.PI * freq * t));

// pop scale: 0 -> overshoot -> 1
export const pop = (t: number, t0: number, dur = 0.25) => {
  if (t < t0) return 0;
  const u = clamp((t - t0) / dur);
  return easeOutBack(u, 2.2);
};

export type CamKey = {t: number; x: number; y: number; k: number; ease?: 'io' | 'out' | 'in' | 'cut'};
export type Cam = {x: number; y: number; k: number};

// piecewise camera: holds between keys are still; scale interpolated in log space so zooms feel even
export const camAt = (t: number, keys: CamKey[]): Cam => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t < b.t) {
      if (b.ease === 'cut') return a;
      const raw = (t - a.t) / (b.t - a.t);
      const u = b.ease === 'out' ? easeOutCubic(raw) : b.ease === 'in' ? easeInCubic(raw) : easeInOutCubic(raw);
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u))};
    }
  }
  return keys[keys.length - 1];
};

// screen shake: sums of sines times an envelope (never random per-frame jumps)
export const shake = (t: number, amp: number) => ({
  x: amp * (0.6 * Math.sin(2 * Math.PI * 13.3 * t) + 0.4 * Math.sin(2 * Math.PI * 7.1 * t + 1.3)),
  y: amp * (0.6 * Math.sin(2 * Math.PI * 11.7 * t + 0.7) + 0.4 * Math.sin(2 * Math.PI * 5.3 * t + 2.1)),
});

// deterministic pseudo random
export const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// point along a polyline at fraction u (by length)
export const along = (pts: [number, number][], u: number): [number, number, number] => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let L = clamp(u) * total;
  for (let i = 0; i < seg.length; i++) {
    if (L <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? L / seg[i] : 0;
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      return [lerp(x0, x1, f), lerp(y0, y1, f), Math.atan2(y1 - y0, x1 - x0)];
    }
    L -= seg[i];
  }
  return [...pts[pts.length - 1], 0] as [number, number, number];
};

// projectile y(tau) from y0 to y1 in time TT passing through the apex height ya (ya above both ends)
export const arcY = (y0: number, y1: number, ya: number, TT: number, tau: number) => {
  const r = Math.sqrt((y0 - ya) / (y1 - ya));
  const ta = (r * TT) / (1 + r);
  const g = (2 * (y0 - ya)) / (ta * ta);
  return ya + 0.5 * g * (tau - ta) * (tau - ta);
};
