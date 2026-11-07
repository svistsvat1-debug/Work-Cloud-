// World layout (units = comp px at depth Z=1000 when the camera is at (540, 960, k=1)) and the camera.
import sprites from './sprites.json';
import {add, eio, eo, kf, lerp, lin, mul, prog, rad, rotp, sub, V2} from './anim';
import {BONK, CLICKS, SNIPS, T} from './timing';

export const SP = sprites;
export const KR = 1.06; // world px per robin raw px
export const KS = KR * 1.05; // starling drawn 5 % bigger; its twig was repainted thinner so the branch stays one thickness
export const TH = SP.robin.twig.theta; // branch angle (deg), rises to the right
export const DIR: V2 = [Math.cos(rad(TH)), Math.sin(rad(TH))];
export const NRM: V2 = [-Math.sin(rad(TH)), Math.cos(rad(TH))]; // points "down" off the branch
export const R_ANCHOR: V2 = [384, SP.robin.twig.c0 + SP.robin.twig.m * 384];
export const S_ANCHOR: V2 = [384, SP.starling.twig.c0 + SP.starling.twig.m * 384];
export const W_R: V2 = [566, 1330];
export const S_DIST = 1300;
export const W_S: V2 = add(W_R, mul(DIR, S_DIST));
export const S_ROT = TH - SP.starling.twig.theta;
export const BT = SP.robin.twig.T * KR; // branch thickness incl. outline
export const BO = SP.robin.twig.o * KR; // outline
export const BF = SP.robin.twig.F * KR; // fill
export const PIVOT: V2 = add(W_R, mul(DIR, -1700));
export const S_PIVOT: V2 = [410, 878]; // starling wobble pivot (raw), top of the twig between the feet

export const robinW = (p: V2): V2 => add(W_R, mul(sub(p, R_ANCHOR), KR));
export const starW = (p: V2): V2 => add(W_S, rotp(mul(sub(p, S_ANCHOR), KS), [0, 0], S_ROT));
export const branchW = (s: number, d = 0): V2 => add(add(W_R, mul(DIR, s)), mul(NRM, d));

// raw -> world CSS transform chains
export const robinChain = `translate(${W_R[0]}px, ${W_R[1]}px) scale(${KR}) translate(${-R_ANCHOR[0]}px, ${-R_ANCHOR[1]}px)`;
export const starChain = `translate(${W_S[0]}px, ${W_S[1]}px) rotate(${S_ROT}deg) scale(${KS}) translate(${-S_ANCHOR[0]}px, ${-S_ANCHOR[1]}px)`;

// branch sway (deg) about PIVOT: the gust, plus a tiny dip while the starling balances
export function sway(t: number) {
  const g0 = 1.5;
  let a = 0;
  if (t > g0 && t < 5) {
    const tau = t - g0;
    const env = Math.min(1, tau / 0.9) * Math.exp(-Math.max(0, t - 3.2) * 1.6);
    a += -3.4 * env * Math.sin(2 * Math.PI * 1.25 * tau);
  }
  return a;
}
export const swayW = (p: V2, t: number): V2 => rotp(p, PIVOT, sway(t));

// ---------------------------------------------------------------- camera
export type Cam = {x: number; y: number; k: number; z: number; sx: number; sy: number};
type CK = [number, number, number, number, ((u: number) => number)?];

const sv = (p: V2, dy = 0): [number, number] => [p[0], p[1] + dy];
const S_SNIP = sv(starW([430, 845]));
const S_FULL = sv(starW([410, 640]), 10);

export const CAM_KEYS: CK[] = [
  [0, 540, 960, 1.0],
  [3.85, 540, 960, 1.0],
  [5.15, 520, 1200, 2.4, eio], // into the legs as the x-ray lands
  [9.72, 522, 1198, 2.47, lin],
  [10.55, 530, 1170, 2.0, eio], // knee / ankle labels
  [13.05, 530, 1168, 2.04, lin],
  [13.65, 545, 1250, 2.4, eio], // toes for the lens
  [16.8, 547, 1251, 2.46, lin],
  [17.65, 590, 760, 0.98, eio], // pull back: the robin wakes and stands up
  [18.7, 592, 756, 1.0, lin],
  [20.2, S_SNIP[0], S_SNIP[1], 1.7, eio], // glide along the branch to the starling's legs (snip)
  [20.9, S_SNIP[0], S_SNIP[1], 1.76, lin],
  [21.65, S_FULL[0], S_FULL[1], 1.12, eio], // back to normal, whole starling
  [24.65, S_FULL[0] - 4, S_FULL[1], 1.17, lin],
  [25.95, 540, 960, 1.0, eio], // glide home = frame 0 (loop)
  [30, 540, 960, 1.0],
];

export function camera(t: number): Cam {
  let x = CAM_KEYS[0][1];
  let y = CAM_KEYS[0][2];
  let k = CAM_KEYS[0][3];
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const u = (b[4] ?? eio)(prog(t, a[0], b[0]));
      x = lerp(a[1], b[1], u);
      y = lerp(a[2], b[2], u);
      k = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u));
      break;
    }
  }
  const [sx, sy] = shake(t);
  return {x, y, k, z: 1000 - 1000 / k, sx, sy};
}

// screen shake: sums of sines times an envelope (never random jumps)
function shakeEnv(t: number) {
  let e = 0;
  if (t > 2.3 && t < 4) e += 2.6 * Math.sin(Math.PI * prog(t, 2.3, 4));
  const imp = (t0: number, amp: number, d = 0.35) => (t >= t0 && t < t0 + d ? amp * Math.exp((-5 * (t - t0)) / d) : 0);
  e += imp(BONK, 5);
  e += imp(T.shut + 0.06, 2.2);
  for (const c of CLICKS) e += imp(c, 1.4, 0.2);
  for (const s of SNIPS) e += imp(s, 3.2);
  e += imp(17.92, 2);
  return e;
}
export function shake(t: number): V2 {
  const e = shakeEnv(t);
  if (e < 0.01) return [0, 0];
  return [
    e * (Math.sin(2 * Math.PI * 13.3 * t) * 0.6 + Math.sin(2 * Math.PI * 7.1 * t + 1.3) * 0.4),
    e * (Math.sin(2 * Math.PI * 11.7 * t + 0.4) * 0.6 + Math.sin(2 * Math.PI * 5.3 * t + 2.1) * 0.4),
  ];
}

// world point at depth z -> screen
export function project(cam: Cam, p: V2, z = 1000): V2 {
  const k = 1000 / (z - cam.z);
  return [540 + cam.sx + k * (p[0] - cam.x), 960 + cam.sy + k * (p[1] - cam.y)];
}

// scan line position: x-ray occupies the screen ABOVE this y
export function scanY(t: number, xin: [number, number], xout: [number, number]) {
  if (t < xin[0] || t > xout[1]) return 0;
  if (t < xin[1]) return 1920 * eio(prog(t, xin[0], xin[1]));
  if (t < xout[0]) return 1920;
  return 1920 * (1 - eio(prog(t, xout[0], xout[1])));
}
export const _unused = eo;
