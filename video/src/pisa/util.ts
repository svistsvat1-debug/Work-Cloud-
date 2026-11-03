export const FPS = 60;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const seg = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
export const easeInQuad = (u: number) => u * u;
export const easeOutBack = (u: number, s = 1.9) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
export const easeInBack = (u: number, s = 1.7) => (s + 1) * u * u * u - s * u * u;

export type Ease = (u: number) => number;
/** keyframe track: [[t, value, easeIntoThisKey?], ...] (holds are just equal values) */
export function track(t: number, keys: [number, number, Ease?][]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (e ?? easeInOut)(seg(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}
/** 0 -> 1 with overshoot, starting at t0 */
export const popIn = (t: number, t0: number, d = 0.32) => (t < t0 ? 0 : t >= t0 + d ? 1 : easeOutBack(seg(t, t0, t0 + d)));
/** 1 -> 0 (anticipation up then shrink), ending at t0 + d */
export const popOut = (t: number, t0: number, d = 0.22) => (t < t0 ? 1 : t >= t0 + d ? 0 : 1 - easeInBack(seg(t, t0, t0 + d)));
export const popInOut = (t: number, a: number, b: number, din = 0.32, dout = 0.22) => (t < b ? popIn(t, a, din) : popOut(t, b, dout));
/** damped oscillation after t0 */
export const wobble = (t: number, t0: number, amp: number, freq = 3, decay = 5) =>
  t < t0 ? 0 : amp * Math.exp(-decay * (t - t0)) * Math.sin(2 * Math.PI * freq * (t - t0));
/** deterministic pseudo random */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const INK = '#1b1b1f';
