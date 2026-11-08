// A simple 3D cartoon right hand (cm, y up, table = y 0, fingertips point to +z, thumb on +x).
// Everything is built from capsules (spheres swept along segments) + one palm polygon,
// so it can be drawn from any camera with one merged black outline.
import {V3, add, mul, lerp, clamp, D2R, easeInOut} from './math';

export type FingerName = 'index' | 'middle' | 'ring' | 'pinky';
export type Pose = {
  tent: number; // 0 = hand flat on the table, 1 = palm raised for the trick
  fold: number; // middle finger folded under (0..1)
  lift: {thumb: number; index: number; ring: number; pinky: number}; // degrees up from the table
  dy: number; // whole hand up/down (cm), for bounces
};
export type Cap = {a: V3; b: V3; ra: number; rb: number};
export type Part = {id: string; caps: Cap[]; poly?: V3[]; root?: {p: V3; r: number}; sep: boolean};
export type Rig = {
  parts: Part[];
  joints: Record<FingerName | 'thumb', V3[]>; // MCP, PIP, DIP, tip (thumb: CMC, MCP, IP, tip)
  dorsal: Record<FingerName, V3[]>; // the same points on the back surface of the finger
  radii: Record<FingerName | 'thumb', number[]>;
  hM: number;
  hW: number;
  forearm: Cap[];
};

const FINGERS: Record<FingerName, {x: number; z: number; dh: number; yaw: number; L: number[]; k: number}> = {
  index: {x: 2.75, z: 0.0, dh: -0.15, yaw: 8, L: [4.0, 2.4, 2.0], k: 1.0},
  middle: {x: 0.85, z: 0.5, dh: 0, yaw: 1, L: [4.4, 2.8, 2.1], k: 1.03},
  ring: {x: -1.05, z: 0.15, dh: -0.15, yaw: -6, L: [4.1, 2.7, 2.0], k: 0.98},
  pinky: {x: -2.85, z: -0.9, dh: -0.45, yaw: -15, L: [3.3, 2.0, 1.8], k: 0.86},
};
const RAD = [1.12, 1.0, 0.92, 0.86];

const dirOf = (yaw: number, a: number): V3 => [Math.sin(yaw) * Math.cos(a), -Math.sin(a), Math.cos(yaw) * Math.cos(a)];
const upOf = (yaw: number, a: number): V3 => [Math.sin(yaw) * Math.sin(a), Math.cos(a), Math.cos(yaw) * Math.sin(a)];

function chain(p0: V3, yaw: number, angs: number[], L: number[]): V3[] {
  const pts: V3[] = [p0];
  let p = p0;
  for (let i = 0; i < 3; i++) {
    p = add(p, mul(dirOf(yaw, angs[i]), L[i]));
    pts.push(p);
  }
  return pts;
}

/** pitch of the first segment that puts the fingertip on the table */
function solveAlpha(h: number, L: number[], b: number, g: number, rTip: number) {
  const tipH = (a: number) => h - L[0] * Math.sin(a) - L[1] * Math.sin(a + b) - L[2] * Math.sin(a + b + g);
  let lo = -0.7,
    hi = 1.45;
  if (tipH(hi) > rTip) return hi;
  if (tipH(lo) < rTip) return lo;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (tipH(m) > rTip) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export const SEP_LIFT = 7; // degrees: above this a finger is drawn as its own layer in front of the hand

export function buildHand(P: Pose): Rig {
  const t = P.tent;
  const hM = lerp(2.45, 4.75, t) + P.dy;
  const hW = lerp(3.0, 4.15, t) + P.dy;
  const parts: Part[] = [];
  const joints = {} as Rig['joints'];
  const dorsal = {} as Rig['dorsal'];
  const radii = {} as Rig['radii'];
  const sepParts: Part[] = [];
  const baseCaps: Cap[] = [];

  for (const name of ['index', 'middle', 'ring', 'pinky'] as FingerName[]) {
    const f = FINGERS[name];
    const yaw = f.yaw * D2R;
    const mcp: V3 = [f.x, hM + f.dh, f.z];
    const r = RAD.map((v) => v * f.k);
    const b = lerp(6, 16, t) * D2R,
      g = lerp(5, 10, t) * D2R;
    const a0 = solveAlpha(mcp[1], f.L, b, g, r[3]);
    let angs: number[];
    let lift = 0;
    if (name === 'middle') {
      const flat = [a0, a0 + b, a0 + b + g];
      const folded = [60 * D2R, 195 * D2R, 215 * D2R];
      const m = P.fold;
      // the first joint leads, the others follow a little later -> curling motion
      const m1 = easeInOut(clamp(m * 1.25)),
        m2 = easeInOut(clamp(m * 1.25 - 0.15)),
        m3 = easeInOut(clamp(m * 1.25 - 0.25));
      angs = [lerp(flat[0], folded[0], m1), lerp(flat[1], folded[1], m2), lerp(flat[2], folded[2], m3)];
    } else {
      lift = P.lift[name];
      const l = lift * D2R;
      const ln = clamp(lift / 95);
      const bb = b * (1 - 0.7 * ln),
        gg = g * (1 - 0.7 * ln);
      angs = [a0 - l, a0 - l + bb, a0 - l + bb + gg];
    }
    const pts = chain(mcp, yaw, angs, f.L);
    joints[name] = pts;
    radii[name] = r;
    dorsal[name] = pts.map((p, i) => add(p, mul(upOf(yaw, angs[Math.min(i, 2)]), r[i] * 0.92)));
    const caps = [0, 1, 2].map((i) => ({a: pts[i], b: pts[i + 1], ra: r[i], rb: r[i + 1]}));
    if (lift > SEP_LIFT) {
      sepParts.push({id: name, caps, root: {p: mcp, r: r[0]}, sep: true});
      baseCaps.push({a: mcp, b: mcp, ra: r[0], rb: r[0]}); // the knuckle stays part of the hand
    } else baseCaps.push(...caps);
  }

  // thumb: metacarpal stays in the palm layer, the two phalanges can lift as their own layer
  const tl = P.lift.thumb;
  const tln = clamp(tl / 95);
  const yawT = (lerp(42, 36, t) + 8 * tln) * D2R;
  const cmc: V3 = [2.75, lerp(1.95, 2.75, t) + P.dy, -7.4];
  const TL = [4.0, 3.0, 2.5];
  const tr = [1.3, 1.15, 1.05, 0.95];
  const ta0 = solveAlpha(cmc[1], TL, -4 * D2R, 8 * D2R, tr[3]);
  const l = tl * D2R;
  const tAngs = [ta0 - 0.42 * l, ta0 - 4 * D2R - l, ta0 + 4 * D2R - l * 1.05];
  const tp = chain(cmc, yawT, tAngs, TL);
  joints.thumb = tp;
  radii.thumb = tr;
  baseCaps.push({a: tp[0], b: tp[1], ra: tr[0], rb: tr[1]});
  const thumbCaps = [1, 2].map((i) => ({a: tp[i], b: tp[i + 1], ra: tr[i], rb: tr[i + 1]}));
  if (tl > SEP_LIFT) sepParts.push({id: 'thumb', caps: thumbCaps, root: {p: tp[1], r: tr[1]}, sep: true});
  else baseCaps.push(...thumbCaps);

  // palm: top-surface polygon + rounded edges
  const hAt = (z: number) => lerp(hW, hM, clamp((z + 10) / 10));
  const mc = (n: FingerName) => joints[n][0];
  const poly: V3[] = [
    [-2.3, hW - 0.3, -10.2],
    [2.1, hW - 0.3, -10.2],
    [3.0, hAt(-7) - 0.5, -7.0],
    [3.3, hAt(-2.2) - 0.55, -2.2],
    add(mc('index'), [0.1, -0.05, 0.05]),
    add(mc('middle'), [0, 0, 0.05]),
    add(mc('ring'), [0, -0.05, 0.05]),
    add(mc('pinky'), [-0.1, -0.05, 0.0]),
    [-3.25, hAt(-2.4) - 0.8, -2.4],
    [-3.35, hAt(-7) - 0.6, -7.0],
  ];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    const front = i >= 4 && i <= 6;
    baseCaps.push({a, b, ra: front ? 1.0 : 1.25, rb: front ? 1.0 : 1.25});
  }
  const wr: V3 = [-0.1, hW - 1.4, -10.8];
  const forearm: Cap[] = [
    {a: wr, b: [-0.4, 2.45 + P.dy * 0.3, -24], ra: 2.1, rb: 2.55},
    {a: [-0.4, 2.45 + P.dy * 0.3, -24], b: [-0.8, 2.9, -52], ra: 2.55, rb: 2.85},
    {a: [-0.8, 2.9, -52], b: [-2.5, 46, -74], ra: 2.85, rb: 3.6},
  ];
  // smooth the step between the narrow wrist and the wider palm
  baseCaps.push({a: add(wr, [0, 0.9, -0.6]), b: add(poly[0], [0.25, 0, -0.1]), ra: 1.85, rb: 1.25});
  baseCaps.push({a: add(wr, [0, 0.9, -0.6]), b: add(poly[1], [-0.25, 0, -0.1]), ra: 1.85, rb: 1.25});
  baseCaps.push(...forearm);
  parts.push({id: 'base', caps: baseCaps, poly, sep: false});
  parts.push(...sepParts);
  return {parts, joints, dorsal, radii, hM, hW, forearm};
}

/** height of the back of the hand at a given z (for tendons drawn on the skin) */
export const backHeight = (rig: Rig, z: number) => lerp(rig.hW, rig.hM, clamp((z + 10) / 10)) + 0.55;
