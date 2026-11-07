// Easing, camera keys and small animation helpers (all times in composition seconds).

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const eio = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const eo = (u: number) => 1 - Math.pow(1 - u, 3);
export const ei = (u: number) => u * u * u;
export const eob = (u: number, s = 1.70158) => {
  const c3 = s + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
};
/** 0 before t0, overshooting pop to 1 */
export const popIn = (t: number, t0: number, d = 0.3, s = 2.2) => (t < t0 ? 0 : eob(clamp((t - t0) / d), s));
/** 1 before t1, then shrinks to 0 */
export const popOut = (t: number, t1: number, d = 0.18) => (t < t1 ? 1 : 1 - eio(clamp((t - t1) / d)));
export const pop = (t: number, t0: number, t1: number, d = 0.3) => popIn(t, t0, d) * popOut(t, t1);
/** damped spring impulse (0 at t0) */
export const springK = (t: number, t0: number, f = 5, damp = 6) =>
  t < t0 ? 0 : Math.exp(-damp * (t - t0)) * Math.sin(2 * Math.PI * f * (t - t0));
/** deterministic random in [0,1) */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** piecewise track: [[t, value, easing?], ...] -> value at t (easing applies to the segment ending at that key) */
export type K = [number, number, ((u: number) => number)?];
export const keys = (t: number, ks: K[]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1];
      const [t1, v1, e] = ks[i];
      return lerp(v0, v1, (e ?? eio)(inv(t0, t1, t)));
    }
  }
  return ks[ks.length - 1][1];
};

// ---------------------------------------------------------------- camera
export type Cam = {x: number; y: number; k: number; z: number; sx: number; sy: number};
type CK = {t: number; x: number; y: number; k: number; e?: (u: number) => number};
const lin = (u: number) => u;
const CAM: CK[] = [
  {t: 0, x: 590, y: 960, k: 1.0},
  {t: 2.72, x: 612, y: 905, k: 1.09, e: lin}, // slow push while drumming / scanner arrives
  {t: 3.35, x: 745, y: 560, k: 2.35, e: eio}, // dive into the X-ray head
  {t: 11.3, x: 757, y: 552, k: 2.45, e: lin}, // gentle drift during the bone reveal
  {t: 11.9, x: 757, y: 552, k: 2.45},
  {t: 12.7, x: 650, y: 610, k: 1.75, e: eio}, // reveal head + trunk + tunnel
  {t: 14.85, x: 642, y: 615, k: 1.78, e: lin},
  {t: 17.3, x: 565, y: 655, k: 1.9, e: eio}, // follow the tongue into the tunnel
  {t: 17.95, x: 565, y: 655, k: 1.9},
  {t: 18.6, x: 505, y: 708, k: 3.6, e: eio}, // close on the tip and the grub
  {t: 22.3, x: 505, y: 712, k: 3.7, e: lin},
  {t: 23.05, x: 650, y: 590, k: 2.0, e: eio}, // reel in, back to the head
  {t: 24.2, x: 575, y: 452, k: 0.82, e: eio}, // wide: room for the question + cards
  {t: 26.95, x: 575, y: 452, k: 0.82},
  {t: 27.5, x: 590, y: 960, k: 1.0, e: eio}, // back to frame 0 -> seamless loop
];

export const IMPACTS = [0.12, 0.26, 0.4, 0.54, 0.68, 0.82, 27.367, 27.507, 27.647];
const SHAKES: [number, number, number][] = [
  ...IMPACTS.map((t): [number, number, number] => [t, 3.5, 0.07]),
  [14.95, 7, 0.16],
  [21.97, 5, 0.14],
  [23.07, 3, 0.12],
  [26.04, 5, 0.12],
];

export const camAt = (t: number): Cam => {
  let x = CAM[CAM.length - 1].x, y = CAM[CAM.length - 1].y, k = CAM[CAM.length - 1].k;
  if (t <= CAM[0].t) ({x, y, k} = CAM[0]);
  for (let i = 1; i < CAM.length; i++) {
    if (t <= CAM[i].t) {
      const a = CAM[i - 1], b = CAM[i];
      const u = (b.e ?? eio)(inv(a.t, b.t, t));
      x = lerp(a.x, b.x, u);
      y = lerp(a.y, b.y, u);
      k = Math.exp(lerp(Math.log(a.k), Math.log(b.k), u));
      break;
    }
  }
  let amp = 0;
  for (const [t0, a, d] of SHAKES) if (t >= t0 && t < t0 + 6 * d) amp += a * Math.exp(-(t - t0) / d);
  const sx = amp * (Math.sin(2 * Math.PI * 13.3 * t) + 0.5 * Math.sin(2 * Math.PI * 7.1 * t + 1));
  const sy = amp * (0.8 * Math.cos(2 * Math.PI * 11.7 * t) + 0.4 * Math.sin(2 * Math.PI * 5.3 * t + 2));
  return {x, y, k, z: 1000 - 1000 / k, sx, sy};
};

/** world point (main layer, Z = 1000) -> screen px */
export const toScreen = (cam: Cam, p: [number, number]): [number, number] => [
  540 + cam.sx + (p[0] - cam.x) * cam.k,
  960 + cam.sy + (p[1] - cam.y) * cam.k,
];
