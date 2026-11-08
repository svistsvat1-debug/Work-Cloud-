export type V3 = [number, number, number];
export type P2 = {x: number; y: number};
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.sqrt(dot(a, a));
export const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const lerp3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const D2R = Math.PI / 180;

export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
export const easeOutBack = (u: number, s = 1.9) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
/** progress of t inside [a, b], eased */
export const prog = (t: number, a: number, b: number, e: (u: number) => number = easeInOut) => e(clamp((t - a) / (b - a)));
/** damped oscillation that starts at t0 (0 before) */
export const ring = (t: number, t0: number, hz: number, decay: number) =>
  t < t0 ? 0 : Math.exp(-decay * (t - t0)) * Math.sin(2 * Math.PI * hz * (t - t0));
/** pop-in scale: 0 before t0, overshoot, 1 after */
export const popIn = (t: number, t0: number, d = 0.28) => (t < t0 ? 0 : t > t0 + d ? 1 : easeOutBack((t - t0) / d));
export const popOut = (t: number, t1: number, d = 0.18) => (t < t1 ? 1 : t > t1 + d ? 0 : 1 - easeIn((t - t1) / d));
/** visible window with pop in/out */
export const win = (t: number, a: number, b: number, d = 0.26) => (t < a || t > b + 0.2 ? 0 : Math.min(popIn(t, a, d), popOut(t, b - 0.18)));

/** piecewise keyframes of numeric records, eased segment by segment */
export function keys<K extends string>(t: number, ks: {t: number; v: Record<K, number>; e?: (u: number) => number; log?: K[]}[]): Record<K, number> {
  if (t <= ks[0].t) return {...ks[0].v};
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i].t) {
      const a = ks[i - 1], b = ks[i];
      const u = (b.e ?? easeInOut)(clamp((t - a.t) / (b.t - a.t || 1)));
      const out = {} as Record<K, number>;
      for (const k of Object.keys(b.v) as K[]) {
        const va = a.v[k], vb = b.v[k];
        out[k] = b.log?.includes(k) ? Math.exp(lerp(Math.log(va), Math.log(vb), u)) : lerp(va, vb, u);
      }
      return out;
    }
  }
  return {...ks[ks.length - 1].v};
}
