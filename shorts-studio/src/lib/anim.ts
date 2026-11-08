// Small animation toolkit: easing, keyed values, springs, projectile hops, screen shake.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u: number) => u * u * u;
export const easeInOutSine = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;
export const easeOutBack = (u: number, s = 2.2) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
export type Ease = (u: number) => number;
export const linear: Ease = (u) => u;

/** piecewise keyed value: [[t, v, ease-into-this-key?], ...]; holds before the first / after the last key */
export function keys(t: number, ks: Array<[number, number, Ease?]>): number {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, e] = ks[i];
    const [t0, v0] = ks[i - 1];
    if (t <= t1) return lerp(v0, v1, (e ?? easeInOutCubic)(inv(t0, t1, t)));
  }
  return ks[ks.length - 1][1];
}

/** step value: the last [t, v] whose t <= now */
export function step<T>(t: number, ks: Array<[number, T]>): T {
  let v = ks[0][1];
  for (const [tk, vk] of ks) if (t >= tk) v = vk;
  return v;
}

/** damped oscillation starting at amp at t0 (0 before) */
export const spring = (t: number, t0: number, amp: number, freq = 3.2, damp = 7) =>
  t < t0 ? 0 : amp * Math.exp(-damp * (t - t0)) * Math.cos(2 * Math.PI * freq * (t - t0));

/** smooth bump 0 -> 1 -> 0 centred at c with half width w */
export const bump = (t: number, c: number, w: number) => {
  const u = (t - c) / w;
  return Math.abs(u) >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u);
};

/** 0 -> 1 pop with overshoot, starting at t0, lasting d */
export const popIn = (t: number, t0: number, d = 0.28) => (t <= t0 ? 0 : t >= t0 + d ? 1 : easeOutBack(inv(t0, t0 + d, t)));

export type P = {x: number; y: number};

/** projectile from p0 (t0) to p1 (t1): x linear, y a gravity parabola whose apex is H above the higher end */
export function hop(t: number, t0: number, t1: number, p0: P, p1: P, H: number) {
  const T = t1 - t0;
  const tau = clamp(t - t0, 0, T);
  const ya = Math.min(p0.y, p1.y) - H;
  const a = Math.sqrt(Math.max(p0.y - ya, 0));
  const b = Math.sqrt(Math.max(p1.y - ya, 0));
  const g = (2 * (a + b) * (a + b)) / (T * T);
  const ta = (T * a) / (a + b || 1);
  return {x: lerp(p0.x, p1.x, tau / T), y: ya + 0.5 * g * (tau - ta) * (tau - ta), u: tau / T, vy: g * (tau - ta), vx: (p1.x - p0.x) / T};
}

/** free fall from p0 at t0 with gravity g until floorY */
export function fall(t: number, t0: number, p0: P, g: number, floorY: number, vx = 0, vy0 = 0) {
  const tau = Math.max(0, t - t0);
  return {x: p0.x + vx * tau, y: Math.min(floorY, p0.y + vy0 * tau + 0.5 * g * tau * tau)};
}

/** time a fall from y0 takes to reach floorY */
export const fallTime = (y0: number, floorY: number, g: number, vy0 = 0) =>
  (-vy0 + Math.sqrt(vy0 * vy0 + 2 * g * (floorY - y0))) / g;

/** screen shake: sums of sines times decaying impulses (never random per-frame jumps) */
export function shake(t: number, hits: Array<[number, number]>) {
  let x = 0;
  let y = 0;
  for (const [t0, amp] of hits) {
    if (t < t0) continue;
    const d = t - t0;
    const e = amp * Math.exp(-9 * d);
    x += e * (Math.sin(2 * Math.PI * 13.3 * d) * 0.7 + Math.sin(2 * Math.PI * 7.1 * d + 1.3) * 0.3);
    y += e * (Math.cos(2 * Math.PI * 11.1 * d) * 0.6 + Math.sin(2 * Math.PI * 5.3 * d + 0.4) * 0.4);
  }
  return {x, y};
}

/** deterministic pseudo random in [0,1) */
export const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
