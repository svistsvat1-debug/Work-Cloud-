import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as FWT_DURATION, FPS as FWT_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why did this bird fly into a scientist's net?" - a male Red-backed Fairy-wren dives into the researchers' mist net,
// where a female is already stuck. Not to save her: to flirt the fairy-wren way, holding up a 'flower petal'. Except it
// is not a petal - it unfolds into a strip of orange plastic flagging tape, the stuff these scientists tie to bushes to
// mark nests. So the scientist pulls his tape back out of the beak... and holds the bird in his hands. Then lets him go
// (and the loop brings him back in). Facts: Salett et al. 2026, Australian Field Ornithology 43: 77-81.

const F = (n: string) => staticFile(`fairywren-tape/${n}.png`);
export const FONT = 'FWTInter';
export const useFWTFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
const TAPE = '#FF7A1A';
const TAPE_SH = '#D9570B';
const TAPE_HI = '#FFB46E';
const SKY = 'rgb(165,221,246)';
const GRASS = 'rgb(177,198,100)';
const YEL = '#FFE45C';
const HEART = '#FF4D6D';

// ---------- helpers ----------
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.18))));
const bump = (t: number, t0: number, d = 0.3, a = 0.08) => (t > t0 && t < t0 + d ? 1 + a * Math.sin((Math.PI * (t - t0)) / d) : 1);

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo & Record<string, unknown>>)[n];

// a cut-out sprite anchored at (ax, ay) (native sprite px), placed at world (x, y), world scale s per native px
const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; clip?: string}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  clip,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s, clipPath: clip}}>
        <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: sp.w * s, height: sp.h * s}} />
      </div>
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 6000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const rotPt = (dx: number, dy: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
};

// ======================================================================================================
// THE WORLD (world px = screen px at camera k = 1, frame-0 camera at (560, 1000))
// ======================================================================================================
const GY = 1640; // ground line (feet)
// the plate is a far layer (depth 1.3): drawn in its own layer coordinates, 1.7 layer px per native px, mirror-padded
const DEPTH_BG = 1.3;
const PSC = 1.7;
const PX0 = 560 - (1024 * PSC) / 2 - SPR.plate.padx * PSC;
const PY0 = -278;

// the mist net between two poles; shelf strings; a fine diamond mesh
const NET = {x0: 400, x1: 1000, y0: 640, y1: 1520, poleTop: 600};
const SHELVES = [640, 860, 1080, 1300, 1520];
const DM = 30;

// the birds (cartoon Red-backed Fairy-wrens); one world scale for every bird sprite
const BS = 0.42;
const MALE_EYE: [number, number] = [825, 905]; // where the male perches in the net (eye of the 'proud' pose)
const FEM_EYE: [number, number] = [665, 905]; // the female hanging in the net (eye centre of the front poses)
const FEM_FEET: [number, number] = [618, 1080]; // the female sitting on the shelf string ('fmeh')
export const EYE: Record<string, [number, number]> = {
  flyUp: [115, 171],
  flyDown: [114, 81],
  proud: [130, 217],
  mshock: [130, 118],
  caught: [181.5, 332],
  fstuck: [255.5, 120],
  fhope: [253.5, 121],
};
export const BEAK: Record<string, [number, number]> = {flyUp: [12, 169], flyDown: [12, 79], proud: [38, 135], mshock: [12, 94]};

// the scientist (khaki bush hat); every pose scaled so the head+hat disc has the same radius
const HR = 140;
type Pose = 'hero' | 'shock' | 'shrug' | 'tie' | 'cheer' | 'cup' | 'binoc';
const poseS = (p: Pose) => HR / (S(p).hd as [number, number, number])[2];
const GUY_A = 300; // x of the scientist beside the net (frame 0)
const GUY_F = -660; // the bush scene
const GUY_G = 560; // in front of the net at the end

// ---------- timeline ----------
const HIT = T.net; // 2.82 the male hits the net
const SHOCK_T = 2.95;
const SHRUG_T = 3.62;
const CUT_C = 4.3;
const HOPE1 = T.save; // 6.98
const HOPE1_END = 7.62;
const HOPE2 = 10.5;
const BUBBLE = 10.62;
const EXCEPT = T.except; // 11.9
const UNFOLD = T.not2; // 12.66
const CUT_F = 15.5;
const KNOT = T.tie; // 16.7
const CUT_G = 18.75;
const YANK = 19.42;
const CUT_H = 20.4;
const RELEASE = 21.12;

// ---------- camera ----------
const CAM: CamKey[] = [
  {t: 0, x: 575, y: 1000, k: 1.0},
  {t: 2.7, x: 590, y: 1000, k: 1.03},
  {t: 3.48, x: 590, y: 1000, k: 1.03},
  {t: 3.84, x: 420, y: 1190, k: 1.42, ease: 'out'},
  {t: CUT_C, x: 420, y: 1190, k: 1.42},
  {t: CUT_C, x: 770, y: 960, k: 2.2, ease: 'cut'},
  {t: 7.7, x: 780, y: 955, k: 2.28},
  {t: 8.15, x: 815, y: 940, k: 2.4},
  {t: 10.25, x: 815, y: 940, k: 2.4},
  {t: 10.62, x: 775, y: 925, k: 2.2},
  {t: EXCEPT, x: 775, y: 925, k: 2.2},
  {t: EXCEPT + 0.18, x: 800, y: 905, k: 2.85, ease: 'out'},
  {t: 13.55, x: 803, y: 912, k: 2.9},
  {t: 13.95, x: 800, y: 935, k: 2.5},
  {t: CUT_F, x: 805, y: 935, k: 2.56},
  {t: CUT_F, x: -500, y: 1300, k: 1.35, ease: 'cut'},
  {t: T.mark - 0.15, x: -480, y: 1305, k: 1.4},
  {t: T.nests + 0.3, x: -360, y: 1380, k: 1.62},
  {t: CUT_G, x: -355, y: 1385, k: 1.64},
  {t: CUT_G, x: 680, y: 1010, k: 1.6, ease: 'cut'},
  {t: CUT_H, x: 688, y: 1015, k: 1.64},
  {t: CUT_H, x: 570, y: 1215, k: 1.5, ease: 'cut'},
  {t: T.him - 0.1, x: 572, y: 1225, k: 1.52},
  {t: T.him + 0.25, x: 565, y: 1260, k: 1.72, ease: 'out'},
  {t: RELEASE, x: 568, y: 1255, k: 1.74},
  {t: DURATION, x: 690, y: 1060, k: 1.22},
];
const camAtT = (t: number): Cam => {
  const c = camAt(t, CAM);
  // a short shake when the bird hits the net and on the tape yank
  const a = 7 * Math.exp(-((t - HIT) * 9)) * (t >= HIT ? 1 : 0) + 4 * Math.exp(-((t - YANK) * 10)) * (t >= YANK && t < CUT_H ? 1 : 0);
  const sh = shake(t, a);
  return {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
};

// ======================================================================================================
// THE MALE: pose, eye position, rotation, scale over time
// ======================================================================================================
type BirdState = {pose: string; x: number; y: number; s: number; rot: number; sx: number; sy: number};
const flapPose = (t: number, rate = 6.5) => (Math.floor(t * rate * 2) % 2 === 0 ? 'flyUp' : 'flyDown');
const START: [number, number] = [880, 650];
export const maleState = (t: number): BirdState => {
  if (t < HIT) {
    const u = Math.pow(prog(t, 0, HIT), 1.7);
    const x = lerp(START[0], MALE_EYE[0], u);
    const y = lerp(START[1], MALE_EYE[1], u) + 10 * Math.sin(2 * Math.PI * 1.4 * t) * (1 - u);
    return {pose: flapPose(t), x, y, s: lerp(0.64, BS, u), rot: -12 - 10 * u, sx: 1, sy: 1};
  }
  if (t < CUT_H) {
    let pose = 'proud';
    let [sx, sy] = squashSwap(t, HIT);
    if (t < HIT + 0.12) {
      const u = prog(t, HIT, HIT + 0.12);
      sx = 1 + 0.16 * (1 - u);
      sy = 1 - 0.14 * (1 - u);
    }
    let rot = 0;
    // 'not here': a quick head shake
    if (t > T.not && t < T.not + 0.5) rot += 7 * Math.sin(2 * Math.PI * 4.2 * (t - T.not)) * (1 - prog(t, T.not, T.not + 0.5));
    // 'her': puffs up and ignores her
    const puff = bump(t, T.her, 0.45, 0.07) * bump(t, T.holding, 0.5, 0.06);
    // the strut while flirting (bob on a beat)
    const strut = t > T.flirt && t < EXCEPT ? Math.abs(Math.sin(2 * Math.PI * 1.7 * (t - T.flirt))) : 0;
    if (t > T.fairywren && t < EXCEPT) rot += 3 * Math.sin(2 * Math.PI * 1.7 * (t - T.fairywren));
    if (t > T.holding && t < EXCEPT) rot -= 6 * easeOutCubic(prog(t, T.holding, T.holding + 0.3));
    // the tug of war before the yank
    if (t > CUT_G && t < YANK) rot += 9 * easeInOutCubic(prog(t, CUT_G, YANK - 0.05)) + 1.5 * Math.sin(2 * Math.PI * 9 * t);
    if (t >= YANK) {
      pose = 'mshock';
      const [a, b] = squashSwap(t, YANK);
      sx = a;
      sy = b;
      rot += 2 * Math.sin(2 * Math.PI * 7 * t) * Math.exp(-(t - YANK) * 3);
    }
    const br = 1 + 0.014 * Math.sin(2 * Math.PI * 1.8 * t);
    return {pose, x: MALE_EYE[0], y: MALE_EYE[1] - 9 * strut, s: BS, rot, sx: sx * puff, sy: sy * puff * br};
  }
  if (t < RELEASE) {
    // in the scientist's cupped hands
    const s = poseS('cup');
    const bowl = S('cup').bowl as unknown as [number, number];
    const f = S('cup').feet;
    const bx = GUY_G + (bowl[0] - f[0]) * s;
    const by = GY - (f[1] - bowl[1]) * s;
    const tr = t > T.him ? 1.6 * Math.sin(2 * Math.PI * 11 * t) : 0;
    const [sx, sy] = squashSwap(t, CUT_H + 0.02);
    return {pose: 'mshock', x: bx - 30 + tr, y: by - 44, s: 0.3, rot: -4, sx, sy};
  }
  // released: flutters up and away to the right
  const u = easeInCubic(prog(t, RELEASE, DURATION));
  const s = poseS('cup');
  const bowl = S('cup').bowl as unknown as [number, number];
  const f = S('cup').feet;
  const x0 = GUY_G + (bowl[0] - f[0]) * s;
  const y0 = GY - (f[1] - bowl[1]) * s - 70;
  return {pose: flapPose(t, 7), x: lerp(x0, 1120, u), y: lerp(y0, 760, u) - 60 * Math.sin(Math.PI * u), s: lerp(0.3, BS, prog(t, RELEASE, RELEASE + 0.25)), rot: 0, sx: -1, sy: 1};
};
// a point of the male sprite (native px) in world coordinates
export const malePt = (st: BirdState, p: [number, number]): [number, number] => {
  const e = EYE[st.pose];
  const [dx, dy] = rotPt((p[0] - e[0]) * st.s * st.sx, (p[1] - e[1]) * st.s * st.sy, st.rot);
  return [st.x + dx, st.y + dy];
};

// ======================================================================================================
// THE FEMALE
// ======================================================================================================
const femaleState = (t: number): BirdState & {feet?: boolean} => {
  let pose = 'fstuck';
  let swap = -10;
  if (t >= HOPE1 && t < HOPE1_END) (pose = 'fhope'), (swap = HOPE1);
  else if (t >= HOPE1_END && t < HOPE2) (pose = 'fstuck'), (swap = HOPE1_END);
  else if (t >= HOPE2 && t < EXCEPT + 0.05) (pose = 'fhope'), (swap = HOPE2);
  else if (t >= EXCEPT + 0.05) (pose = 'fmeh'), (swap = EXCEPT + 0.05);
  const [sx, sy] = squashSwap(t, swap);
  // wriggles: when the male hits, on 'female' and on 'stuck'
  let rot = 0;
  for (const [t0, a] of [
    [HIT + 0.05, 5],
    [T.female, 7],
    [T.stuck, 9],
  ] as [number, number][]) {
    if (t > t0 && t < t0 + 0.6) rot += a * Math.sin(2 * Math.PI * 5.5 * (t - t0)) * (1 - prog(t, t0, t0 + 0.6));
  }
  if (pose === 'fmeh') {
    const br = 1 + 0.01 * Math.sin(2 * Math.PI * 1.5 * t);
    return {pose, x: FEM_FEET[0], y: FEM_FEET[1], s: BS, rot: 0, sx, sy: sy * br, feet: true};
  }
  const sway = 2 * Math.sin(2 * Math.PI * 0.7 * t);
  return {pose, x: FEM_EYE[0], y: FEM_EYE[1], s: BS, rot: rot + sway, sx, sy};
};

// ======================================================================================================
// THE NET: diamond mesh with pockets that bulge around the birds
// ======================================================================================================
type Pocket = {x: number; y: number; r: number; a: number};
const pocketsAt = (t: number): Pocket[] => {
  const p: Pocket[] = [{x: FEM_EYE[0], y: 965, r: 115, a: 16 + 3 * Math.sin(2 * Math.PI * 0.7 * t)}];
  if (t >= HIT && t < CUT_H) {
    const a = 20 + 30 * spring(t - HIT, 2.4, 3.6);
    p.push({x: MALE_EYE[0] + 21, y: 975, r: 105, a});
  }
  return p;
};
const netDisp = (pockets: Pocket[], x: number, y: number): [number, number] => {
  let dx = 0;
  let dy = 0;
  for (const p of pockets) {
    const ex = x - p.x;
    const ey = y - p.y;
    const d = Math.hypot(ex, ey) + 1e-3;
    const f = p.a * Math.exp(-(d * d) / (2 * p.r * p.r));
    dx += (f * ex) / d;
    dy += (f * ey) / d + 0.35 * f;
  }
  return [x + dx, y + dy];
};
const meshD = (t: number, empty = false) => {
  const pk = empty ? [] : pocketsAt(t);
  const W = NET.x1 - NET.x0;
  const H = NET.y1 - NET.y0;
  const seg = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const out: string[] = [];
  for (let c = -H; c <= W; c += DM) {
    const s0 = Math.max(0, -c);
    const s1 = Math.min(H, W - c);
    if (s1 <= s0) continue;
    const pts: [number, number][] = [];
    for (let s = s0; s <= s1 + 0.01; s += Math.min(18, s1 - s0)) pts.push(netDisp(pk, NET.x0 + c + s, NET.y0 + s));
    out.push(seg(pts));
  }
  for (let c = 0; c <= W + H; c += DM) {
    const s0 = Math.max(0, c - W);
    const s1 = Math.min(H, c);
    if (s1 <= s0) continue;
    const pts: [number, number][] = [];
    for (let s = s0; s <= s1 + 0.01; s += Math.min(18, s1 - s0)) pts.push(netDisp(pk, NET.x0 + c - s, NET.y0 + s));
    out.push(seg(pts));
  }
  const shelves = SHELVES.map((y) => {
    const pts: [number, number][] = [];
    for (let x = NET.x0; x <= NET.x1; x += 20) pts.push(netDisp(pk, x, y));
    return seg(pts);
  });
  return {mesh: out.join(''), shelves};
};
const Net: React.FC<{t: number; front?: boolean; empty?: boolean}> = ({t, front, empty}) => {
  const {mesh, shelves} = meshD(t, empty);
  if (front) {
    // a few strands IN FRONT of the birds, so they read as tangled in the net
    const m = maleState(t);
    const showMale = t >= HIT && t < CUT_H;
    return (
      <Svg>
        <defs>
          <clipPath id="fwt-front">
            <ellipse cx={FEM_EYE[0]} cy={975} rx={86} ry={70} />
            {showMale ? <ellipse cx={m.x + 25} cy={m.y + 85} rx={62} ry={58} /> : null}
          </clipPath>
        </defs>
        <g clipPath="url(#fwt-front)">
          <path d={mesh} fill="none" stroke="#1E1E1E" strokeWidth={2.2} opacity={0.62} />
        </g>
      </Svg>
    );
  }
  return (
    <Svg>
      {/* poles */}
      {[NET.x0, NET.x1].map((x) => (
        <g key={x}>
          <rect x={x - 10} y={NET.poleTop} width={20} height={GY + 8 - NET.poleTop} rx={6} fill="#9AA4AE" stroke={INK} strokeWidth={5} />
          <rect x={x - 3} y={NET.poleTop + 10} width={5} height={GY - NET.poleTop - 20} fill="#C8D0D7" />
          <ellipse cx={x} cy={GY + 8} rx={34} ry={9} fill="rgba(72,54,42,0.26)" />
        </g>
      ))}
      <path d={mesh} fill="none" stroke="#1E1E1E" strokeWidth={2} opacity={0.5} />
      {shelves.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#151515" strokeWidth={3.6} opacity={0.85} strokeLinecap="round" />
      ))}
    </Svg>
  );
};

// ======================================================================================================
// THE TAPE: the 'petal' (folded) and the orange plastic strip (a ribbon along a fluttering centre line)
// ======================================================================================================
export const tapeLine = (ax: number, ay: number, L: number, a0: number, t: number, wave = 1): [number, number][] => {
  const n = Math.max(6, Math.round(L / 7));
  const pts: [number, number][] = [[ax, ay]];
  let x = ax;
  let y = ay;
  for (let i = 1; i <= n; i++) {
    const s = i / n;
    const ang = lerp(a0, Math.PI / 2, Math.min(1, s * 1.1)) + wave * 0.55 * Math.sin(2 * Math.PI * ((s * L) / 95 - 1.2 * t)) * (0.35 + s);
    x += (Math.cos(ang) * L) / n;
    y += (Math.sin(ang) * L) / n;
    pts.push([x, y]);
  }
  return pts;
};
export const Ribbon: React.FC<{pts: [number, number][]; w: number; shine?: number; twist?: number}> = ({pts, w, shine = -1, twist = 0}) => {
  // a flat glossy plastic ribbon that twists along its length: front side orange, back side a shade darker
  const n = pts.length;
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  const face: number[] = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const d = Math.hypot(tx, ty) || 1;
    tx /= d;
    ty /= d;
    if (i > 0) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const c = Math.cos((2 * Math.PI * acc) / 150 + twist);
    face.push(c);
    const ww = (w * (0.22 + 0.78 * Math.abs(c))) / 2;
    L.push([pts[i][0] - ty * ww, pts[i][1] + tx * ww]);
    R.push([pts[i][0] + ty * ww, pts[i][1] - tx * ww]);
  }
  const f = (p: [number, number]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  // torn end
  const last = pts[n - 1];
  const prev = pts[Math.max(0, n - 2)];
  const dx = last[0] - prev[0];
  const dy = last[1] - prev[1];
  const dd = Math.hypot(dx, dy) || 1;
  const zig: [number, number][] = [];
  for (let k = 1; k < 4; k++) {
    const u = k / 4;
    const out = (k % 2 ? 5 : -2) / dd;
    zig.push([lerp(L[n - 1][0], R[n - 1][0], u) + dx * out, lerp(L[n - 1][1], R[n - 1][1], u) + dy * out]);
  }
  const outline = 'M' + [...L, ...zig, ...[...R].reverse()].map(f).join('L') + 'Z';
  const quads: React.ReactNode[] = [];
  for (let i = 0; i < n - 1; i++) {
    const back = face[i] + face[i + 1] < 0;
    quads.push(<path key={i} d={`M${f(L[i])}L${f(L[i + 1])}L${f(R[i + 1])}L${f(R[i])}Z`} fill={back ? TAPE_SH : TAPE} stroke={back ? TAPE_SH : TAPE} strokeWidth={0.8} />);
  }
  // a thin glossy highlight near one edge, only where the front faces us
  const hi: string[] = [];
  let open = false;
  for (let i = 0; i < n; i++) {
    if (face[i] > 0.35) {
      const p: [number, number] = [lerp(pts[i][0], L[i][0], 0.55), lerp(pts[i][1], L[i][1], 0.55)];
      hi.push(`${open ? 'L' : 'M'}${f(p)}`);
      open = true;
    } else open = false;
  }
  let shineD = '';
  if (shine >= 0 && shine <= 1) {
    const i0 = Math.floor(shine * (n - 1));
    const i1 = Math.min(n - 1, i0 + 3);
    shineD = 'M' + pts.slice(i0, i1 + 1).map((p, k) => f([lerp(p[0], L[i0 + k][0], 0.2), lerp(p[1], L[i0 + k][1], 0.2)])).join('L');
  }
  return (
    <g>
      {quads}
      <path d={hi.join('')} fill="none" stroke={TAPE_HI} strokeWidth={w * 0.14} strokeLinecap="round" />
      {shineD ? <path d={shineD} fill="none" stroke="#FFF6E8" strokeWidth={w * 0.34} strokeLinecap="round" /> : null}
      <path d={outline} fill="none" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
    </g>
  );
};
// the folded tape held like a petal
const Petal: React.FC<{x: number; y: number; ang: number; s: number}> = ({x, y, ang, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
      <path d="M 0 0 C 10 -16 34 -20 48 -6 C 54 2 50 14 40 18 C 26 24 8 16 0 0 Z" fill={TAPE} stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      <path d="M 8 2 C 18 -8 32 -10 42 -2" fill="none" stroke={TAPE_HI} strokeWidth={4} strokeLinecap="round" />
      <path d="M 10 8 C 20 14 32 14 40 10" fill="none" stroke={TAPE_SH} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    </g>
  );

// ---------- small cartoon bits ----------
const Heart: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path
        d={`M 0 ${r * 0.9} C ${-r * 1.4} ${-r * 0.1} ${-r * 0.75} ${-r * 1.15} 0 ${-r * 0.45} C ${r * 0.75} ${-r * 1.15} ${r * 1.4} ${-r * 0.1} 0 ${r * 0.9} Z`}
        fill={HEART}
        stroke={INK}
        strokeWidth={r * 0.2}
        strokeLinejoin="round"
      />
      <ellipse cx={-r * 0.38} cy={-r * 0.38} rx={r * 0.16} ry={r * 0.24} fill="#fff" opacity={0.85} transform={`rotate(-30 ${-r * 0.38} ${-r * 0.38})`} />
    </g>
  );
const Spark: React.FC<{x: number; y: number; r: number; s: number}> = ({x, y, r, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 ${-r} L ${r * 0.25} ${-r * 0.25} L ${r} 0 L ${r * 0.25} ${r * 0.25} L 0 ${r} L ${-r * 0.25} ${r * 0.25} L ${-r} 0 L ${-r * 0.25} ${-r * 0.25} Z`} fill="#FFF6B0" stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
const Flower: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 1, 2, 3, 4].map((i) => (
      <ellipse key={i} cx={0} cy={-r * 0.55} rx={r * 0.36} ry={r * 0.55} fill="#F0473C" stroke={INK} strokeWidth={r * 0.09} transform={`rotate(${i * 72 + 10})`} />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <ellipse key={`h${i}`} cx={-r * 0.08} cy={-r * 0.7} rx={r * 0.1} ry={r * 0.22} fill="#FF8A7E" transform={`rotate(${i * 72 + 10})`} />
    ))}
    <circle cx={0} cy={0} r={r * 0.24} fill="#FFD23F" stroke={INK} strokeWidth={r * 0.09} />
  </g>
);
// thought bubble (one merged outline) with the flower she expects
const Bubble: React.FC<{t: number}> = ({t}) => {
  const s = t < EXCEPT ? pop(t, BUBBLE, 0.3) : 0;
  const burst = t >= EXCEPT && t < EXCEPT + 0.22 ? prog(t, EXCEPT, EXCEPT + 0.22) : -1;
  if (s <= 0.001 && burst < 0) return null;
  const cx = FEM_EYE[0] + 70;
  const cy = 772;
  if (burst >= 0) {
    return (
      <g>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * 2 * Math.PI + 0.3;
          const r0 = 40 + 70 * easeOutCubic(burst);
          return <circle key={i} cx={cx + Math.cos(a) * r0} cy={cy + Math.sin(a) * r0 * 0.8} r={9 * (1 - burst)} fill="#fff" stroke={INK} strokeWidth={3} />;
        })}
      </g>
    );
  }
  const puffs: [number, number, number][] = [
    [-50, 0, 40],
    [-18, -26, 44],
    [24, -24, 42],
    [52, 4, 38],
    [24, 30, 40],
    [-22, 30, 40],
    [0, 0, 50],
  ];
  const wob = 1 + 0.02 * Math.sin(2 * Math.PI * 1.3 * t);
  return (
    <g>
      {/* trail toward her head */}
      <circle cx={FEM_EYE[0] + 27} cy={846} r={9 * s} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={FEM_EYE[0] + 45} cy={822} r={13 * s} fill="#fff" stroke={INK} strokeWidth={3} />
      <g transform={`translate(${cx} ${cy}) scale(${s * wob})`}>
        {puffs.map(([x, y, r], i) => (
          <circle key={`i${i}`} cx={x} cy={y} r={r + 4} fill={INK} />
        ))}
        {puffs.map(([x, y, r], i) => (
          <circle key={`f${i}`} cx={x} cy={y} r={r} fill="#fff" />
        ))}
        <Flower x={0} y={2} r={36 * (1 + 0.06 * Math.sin(2 * Math.PI * 2 * t))} />
      </g>
    </g>
  );
};

// ======================================================================================================
// THE BUSH SCENE (code): bush with a domed nest, a twig with a tape knot, two more bushes with tapes
// ======================================================================================================
const BUSH_PUFFS: [number, number, number][] = [
  [-500, 1560, 95],
  [-420, 1440, 120],
  [-300, 1380, 140],
  [-170, 1440, 120],
  [-110, 1560, 100],
  [-310, 1560, 130],
  [-220, 1520, 110],
];
const BushBlob: React.FC<{puffs: [number, number, number][]; flowers?: number}> = ({puffs, flowers = 0}) => (
  <g>
    {puffs.map(([x, y, r], i) => (
      <circle key={`i${i}`} cx={x} cy={y} r={r + 5} fill={INK} />
    ))}
    {puffs.map(([x, y, r], i) => (
      <circle key={`f${i}`} cx={x} cy={y} r={r} fill="#5E8F3E" />
    ))}
    {puffs.map(([x, y, r], i) => (
      <circle key={`s${i}`} cx={x + r * 0.2} cy={y + r * 0.25} r={r * 0.6} fill="#4F7D34" />
    ))}
    {Array.from({length: flowers}).map((_, i) => {
      const p = puffs[i % puffs.length];
      const a = rnd(i + 3) * 2 * Math.PI;
      const rr = p[2] * (0.35 + 0.5 * rnd(i + 11));
      return <circle key={`fl${i}`} cx={p[0] + Math.cos(a) * rr} cy={p[1] + Math.sin(a) * rr} r={6} fill={i % 2 ? '#FF9F43' : '#FF7EB6'} stroke={INK} strokeWidth={2} />;
    })}
  </g>
);
const TapeTie: React.FC<{x: number; y: number; t: number; s: number; tight?: number}> = ({x, y, t, s, tight = 1}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Ribbon pts={tapeLine(0, 0, 58 + 8 * tight, 1.1, t + 0.3, 0.9)} w={16} />
      <Ribbon pts={tapeLine(0, 0, 46 + 6 * tight, 2.0, t + 0.9, 0.9)} w={16} />
      <ellipse cx={0} cy={0} rx={13} ry={10} fill={TAPE} stroke={INK} strokeWidth={3.4} />
    </g>
  );
const Nest: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-40, -18, 6, 30].map((sx, i) => (
      <path key={`st${i}`} d={`M ${sx} -52 q ${6 - i * 4} -26 ${14 - i * 6} -34`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    ))}
    {[-40, -18, 6, 30].map((sx, i) => (
      <path key={`sf${i}`} d={`M ${sx} -52 q ${6 - i * 4} -26 ${14 - i * 6} -34`} fill="none" stroke="#D8B77A" strokeWidth={2.5} strokeLinecap="round" />
    ))}
    <path d="M -78 34 C -86 -30 -40 -70 4 -68 C 52 -66 88 -28 80 34 C 70 66 -66 68 -78 34 Z" fill="#C9A46A" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    {[-56, -34, -12, 10, 32, 54].map((sx, i) => (
      <path key={i} d={`M ${sx - 10} ${-50 + Math.abs(sx) * 0.25} Q ${sx + 8} ${-6} ${sx - 4} ${52 - Math.abs(sx) * 0.3}`} fill="none" stroke="#9A7442" strokeWidth={3} strokeLinecap="round" />
    ))}
    <ellipse cx={-14} cy={14} rx={30} ry={27} fill="#B48E57" stroke={INK} strokeWidth={4} />
    <ellipse cx={-14} cy={16} rx={21} ry={19} fill="#3B2A1C" />
  </g>
);
const BushScene: React.FC<{t: number}> = ({t}) => {
  if (t < CUT_F - 0.05 || t >= CUT_G) return null;
  const nestS = bump(t, T.nests, 0.35, 0.14);
  const tapeA = pop(t, T.bushes, 0.25);
  const tapeB = pop(t, T.bushes + 0.14, 0.25);
  const tapeC = pop(t, T.bushes + 0.28, 0.25);
  return (
    <Svg>
      {/* shadows */}
      <ellipse cx={-310} cy={GY + 6} rx={260} ry={22} fill="rgba(72,54,42,0.26)" />
      <ellipse cx={-120} cy={GY + 6} rx={170} ry={18} fill="rgba(72,54,42,0.22)" />
      {/* a second bush at the right edge */}
      <BushBlob puffs={[[-200, 1600, 85], [-120, 1530, 100], [-40, 1600, 80]]} flowers={6} />
      {/* the main bush with the twig and the nest */}
      <BushBlob puffs={BUSH_PUFFS} flowers={14} />
      <path d="M -410 1330 Q -460 1300 -518 1258" fill="none" stroke={INK} strokeWidth={15} strokeLinecap="round" />
      <path d="M -410 1330 Q -460 1300 -518 1258" fill="none" stroke="#7A5A3C" strokeWidth={8} strokeLinecap="round" />
      <path d="M -480 1282 L -488 1250" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path d="M -480 1282 L -488 1250" stroke="#7A5A3C" strokeWidth={5} strokeLinecap="round" />
      <Nest x={-262} y={1478} s={nestS} />
      {/* leaves partly over the nest */}
      <circle cx={-352} cy={1424} r={36} fill={INK} />
      <circle cx={-352} cy={1424} r={31} fill="#5E8F3E" />
      {/* more tapes on the bushes pop in on 'bushes' */}
      <TapeTie x={-300} y={1250} t={t + 0.2} s={1.15 * tapeA} />
      <TapeTie x={-118} y={1372} t={t + 0.6} s={1.15 * tapeB} />
      <TapeTie x={-150} y={1446} t={t + 0.9} s={1.15 * tapeC} />
    </Svg>
  );
};
const BushKnot: React.FC<{t: number}> = ({t}) => {
  if (t < CUT_F - 0.05 || t >= CUT_G) return null;
  const knotS = t < KNOT ? 1.1 : 1.35 + 0.3 * spring(t - KNOT, 3, 6);
  return (
    <Svg>
      <TapeTie x={-493} y={1266} t={t} s={knotS} tight={t < KNOT ? 0 : 1} />
    </Svg>
  );
};

// ======================================================================================================
// THE SCIENTIST
// ======================================================================================================
const guyState = (t: number): {pose: Pose; x: number; swap: number} => {
  if (t < SHOCK_T) return {pose: 'binoc', x: GUY_A, swap: -10};
  if (t < SHRUG_T) return {pose: 'shock', x: GUY_A, swap: SHOCK_T};
  if (t < CUT_F) return {pose: 'shrug', x: GUY_A, swap: SHRUG_T};
  if (t < CUT_G) return {pose: 'tie', x: GUY_F, swap: KNOT};
  if (t < CUT_H) return {pose: 'cheer', x: GUY_G, swap: T.back};
  if (t < RELEASE) return {pose: 'cup', x: GUY_G, swap: -10};
  return {pose: 'shrug', x: GUY_G, swap: RELEASE};
};
const Guy: React.FC<{t: number}> = ({t}) => {
  const g = guyState(t);
  const s = poseS(g.pose);
  const [sx, sy] = squashSwap(t, g.swap);
  const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  let rot = 0;
  if (g.pose === 'tie' && t < KNOT + 0.1) rot = 1.5 * Math.sin(2 * Math.PI * 3.2 * t);
  if (g.pose === 'cheer' && t < YANK) rot = -3 * easeInOutCubic(prog(t, CUT_G, YANK - 0.05));
  if (g.pose === 'binoc') rot = 1.2 * Math.sin(2 * Math.PI * 0.35 * t);
  const f = S(g.pose).feet;
  return (
    <>
      <Svg>
        <ellipse cx={g.x + 4} cy={GY + 6} rx={150} ry={20} fill="rgba(72,54,42,0.26)" />
      </Svg>
      <Spr n={g.pose} x={g.x} y={GY} s={s} sx={sx} sy={sy * br} rot={rot} ax={f[0]} ay={f[1]} />
    </>
  );
};
// the scientist's raised pinch (cheer pose) in world coordinates
const pinchPt = (t: number): [number, number] => {
  const s = poseS('cheer');
  const f = S('cheer').feet;
  const p = S('cheer').pinch as unknown as [number, number];
  const rot = t < YANK ? -3 * easeInOutCubic(prog(t, CUT_G, YANK - 0.05)) : 0;
  const [sx, sy] = squashSwap(t, T.back);
  const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const [dx, dy] = rotPt((p[0] - f[0]) * s * sx, (p[1] - f[1]) * s * sy * br, rot);
  return [GUY_G + dx, GY + dy];
};

// ======================================================================================================
// THE TAPE over time
// ======================================================================================================
const TapeLayer: React.FC<{t: number}> = ({t}) => {
  if (t >= CUT_F && t < CUT_G) return null;
  const m = maleState(t);
  // 1) in the beak (flying, then perched): folded like a petal until 'not', then unfolded
  if (t < CUT_G) {
    const bk = BEAK[m.pose];
    if (!bk) return null;
    const [bx, by] = malePt(m, bk);
    const [exx, eyy] = malePt(m, EYE[m.pose]);
    const dirA = Math.atan2(by - eyy, bx - exx); // pointing out of the beak
    if (t < UNFOLD) {
      const lift = t > T.holding ? 1 + 0.25 * easeOutBack(prog(t, T.holding, T.holding + 0.35)) : 1;
      const ang = (dirA * 180) / Math.PI + 10 + 6 * Math.sin(2 * Math.PI * 1.6 * t);
      return (
        <Svg>
          <Petal x={bx - 2} y={by} ang={ang} s={0.95 * lift * (m.s / BS) * (m.pose.startsWith('fly') ? 0.92 : 1)} />
        </Svg>
      );
    }
    const u = easeOutBack(prog(t, UNFOLD, UNFOLD + 0.42), 1.4);
    const L = lerp(40, 196, u);
    const shine = t > T.plastic && t < T.plastic + 0.55 ? prog(t, T.plastic, T.plastic + 0.55) : -1;
    const wave = 1 + 0.8 * (t > T.plastic && t < T.plastic + 0.6 ? Math.sin(Math.PI * prog(t, T.plastic, T.plastic + 0.6)) : 0);
    const pts = tapeLine(bx - 4, by + 2, L, 2.05, t, wave);
    const tagS = popOut(t, T.plastic - 0.02, CUT_F + 1, 0.28);
    const hp = pts[Math.round(pts.length * 0.42)];
    const swing = 10 * Math.sin(2 * Math.PI * 1.1 * (t - T.plastic)) * Math.exp(-(t - T.plastic) * 1.2);
    return (
      <Svg>
        <Ribbon pts={pts} w={24} shine={shine} twist={1.2 * t} />
        {tagS > 0.001 ? (
          <g transform={`translate(${hp[0]} ${hp[1]}) rotate(${-18 + swing}) scale(${tagS})`}>
            <path d="M 0 0 L -34 26" stroke={INK} strokeWidth={3} />
            <g transform="translate(-34 26) rotate(10)">
              <path d="M -78 -2 L -64 -20 L 70 -20 L 70 20 L -64 20 Z" fill="#FFFFFF" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
              <circle cx={-58} cy={0} r={5} fill="#BFE6F7" stroke={INK} strokeWidth={3} />
              <text x={6} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={29} fill={INK}>
                PLASTIC
              </text>
            </g>
          </g>
        ) : null}
      </Svg>
    );
  }
  // 2) the tug of war and the yank (shot G)
  const [px, py] = pinchPt(t);
  if (t < YANK) {
    const [bx, by] = malePt(m, BEAK.proud);
    const pts: [number, number][] = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const sag = 22 * Math.sin(Math.PI * u) * (1 - 0.7 * prog(t, CUT_G, YANK)) + 3 * Math.sin(2 * Math.PI * (9 * t + u));
      pts.push([lerp(bx, px, u), lerp(by, py, u) + sag]);
    }
    return (
      <Svg>
        <Ribbon pts={pts} w={lerp(23, 17, prog(t, CUT_G, YANK))} />
      </Svg>
    );
  }
  // 3) dangling from the scientist's fingers (and swinging after the yank)
  let ax = px;
  let ay = py;
  if (t >= CUT_H) {
    // hangs from the right hand of the cup / shrug pose
    const pose: Pose = t < RELEASE ? 'cup' : 'shrug';
    const s = poseS(pose);
    const f = S(pose).feet;
    const hand = pose === 'cup' ? ([282, 376] as [number, number]) : (S('shrug').rhand as unknown as [number, number]);
    ax = GUY_G + (hand[0] - f[0]) * s;
    ay = GY - (f[1] - hand[1]) * s;
  }
  const swing = t < CUT_H ? 0.9 * Math.exp(-(t - YANK) * 2.2) * Math.sin(2 * Math.PI * 1.6 * (t - YANK)) : 0.15 * Math.sin(2 * Math.PI * 0.9 * t);
  return (
    <Svg>
      <Ribbon pts={tapeLine(ax, ay, 190, Math.PI / 2 + swing, t, 0.8)} w={22} twist={1.2 * t} />
    </Svg>
  );
};

// the cover: the flying male (placed for the thumbnail) with the tape already unfolded, fluttering from the beak
const COVER_MALE: BirdState = {pose: 'flyUp', x: 705, y: 760, s: 0.55, rot: -8, sx: 1, sy: 1};
const CoverTape: React.FC<{t: number}> = ({t}) => {
  const m = COVER_MALE;
  const [bx, by] = malePt(m, BEAK.flyUp);
  return (
    <Svg>
      <Ribbon pts={tapeLine(bx - 2, by + 4, 205, 2.3, t, 1.25)} w={27} twist={0.9} />
    </Svg>
  );
};

// ======================================================================================================
// EFFECTS: '?' over the scientist, sweat drops, hearts, sparkles
// ======================================================================================================
const Effects: React.FC<{t: number}> = ({t}) => {
  const q = popOut(t, T.why - 0.04, CUT_C - 0.25, 0.25);
  const sw1 = popOut(t, T.stuck + 0.02, T.but - 0.1, 0.22);
  const sw2 = t >= CUT_H && t < RELEASE ? popOut(t, T.him, RELEASE - 0.05, 0.22) : 0;
  const m = maleState(t);
  const hearts: React.ReactNode[] = [];
  if (t > T.flirt - 0.05 && t < EXCEPT) {
    [
      [0, MALE_EYE[0] - 55, 840, 20, -14],
      [0.12, MALE_EYE[0] + 45, 800, 24, 10],
      [0.24, MALE_EYE[0] - 10, 760, 17, -4],
    ].forEach(([d, x, y, r, rot], i) => {
      const t0 = T.flirt + d;
      const s = popOut(t, t0, t0 + 1.25, 0.28);
      const rise = 26 * prog(t, t0, t0 + 1.5);
      hearts.push(<Heart key={i} x={x} y={y - rise} r={r} s={s} rot={rot + 6 * Math.sin(2 * Math.PI * 1.2 * t + i)} />);
    });
  }
  const sparks: React.ReactNode[] = [];
  if (t > HOPE1 && t < HOPE1_END) {
    // her hopeful sparkly eyes
    [
      [FEM_EYE[0] - 37, 868],
      [FEM_EYE[0] + 41, 868],
    ].forEach(([x, y], i) => sparks.push(<Spark key={`h${i}`} x={x} y={y - 26} r={11} s={popOut(t, HOPE1 + 0.05 * i, HOPE1_END - 0.1, 0.2)} />));
  }
  if (t > T.holding && t < EXCEPT) {
    const [bx, by] = malePt(m, BEAK.proud);
    [
      [-34, -30, 13, 0],
      [30, -46, 10, 0.1],
      [-6, -70, 8, 0.2],
    ].forEach(([dx, dy, r, d], i) => sparks.push(<Spark key={`p${i}`} x={bx + dx} y={by + dy} r={r * (1 + 0.15 * Math.sin(2 * Math.PI * 3 * t + i))} s={popOut(t, T.holding + 0.08 + d, EXCEPT - 0.15, 0.2)} />));
  }
  return (
    <Svg>
      {q > 0.001 ? (
        <g transform={`translate(${GUY_A + 4} 900) rotate(${8 * Math.sin(2 * Math.PI * 1.2 * t)}) scale(${q})`}>
          <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={150} fill={YEL} stroke={INK} strokeWidth={22} paintOrder="stroke" strokeLinejoin="round">
            ?
          </text>
        </g>
      ) : null}
      <SweatDrop x={FEM_EYE[0] + 57} y={870 + 16 * prog(t, T.stuck + 0.1, T.but)} r={13} s={sw1} rot={15} />
      {sw2 > 0 ? <SweatDrop x={m.x + 44} y={m.y - 30 + 10 * prog(t, T.him, RELEASE)} r={9} s={sw2} rot={18} /> : null}
      {hearts}
      {sparks}
      <Bubble t={t} />
    </Svg>
  );
};

// ======================================================================================================
// THE SCENE
// ======================================================================================================
export const NetScene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const m = maleState(t);
  const fm = femaleState(t);
  const bgBlur = cover ? 1.2 : clamp((cam.k - 1.45) / 1.2) * 3.4;
  const showNet = !(t >= CUT_F && t < CUT_G);
  const guyInFront = t >= CUT_G;
  const showMale = !(t >= CUT_F && t < CUT_G);
  const handsClip = (() => {
    // the scientist's fingers drawn again on top of the bird he holds (cup pose)
    const sp = S('cup');
    return `polygon(${(118 / sp.w) * 100}% ${(338 / sp.h) * 100}%, ${(292 / sp.w) * 100}% ${(338 / sp.h) * 100}%, ${(292 / sp.w) * 100}% ${(412 / sp.h) * 100}%, ${(118 / sp.w) * 100}% ${(412 / sp.h) * 100}%)`;
  })();
  return (
    <AbsoluteFill style={{background: SKY}}>
      {/* far layer: the bush clearing by the lake (ElevenLabs plate, mirror-padded) */}
      <World cam={cam} depth={DEPTH_BG} blur={bgBlur}>
        <div style={{position: 'absolute', left: PX0 - 400, top: PY0 - 900, width: SPR.plate.w * PSC + 800, height: 920, background: SKY}} />
        <div style={{position: 'absolute', left: PX0 - 400, top: PY0 + SPR.plate.h * PSC - 20, width: SPR.plate.w * PSC + 800, height: 1400, background: GRASS}} />
        <Img src={F('plate')} style={{position: 'absolute', left: PX0, top: PY0, width: SPR.plate.w * PSC, height: SPR.plate.h * PSC}} />
      </World>
      <World cam={cam}>
        <BushScene t={t} />
        {showNet ? <Net t={t} empty={cover} /> : null}
        {showNet && !cover ? <Spr n={fm.pose} x={fm.x} y={fm.y} s={fm.s} sx={fm.sx} sy={fm.sy} rot={fm.rot} ax={fm.feet ? S('fmeh').feet[0] : EYE[fm.pose][0]} ay={fm.feet ? S('fmeh').feet[1] : EYE[fm.pose][1]} /> : null}
        {cover ? (
          <Spr n={COVER_MALE.pose} x={COVER_MALE.x} y={COVER_MALE.y} s={COVER_MALE.s} rot={COVER_MALE.rot} ax={EYE[COVER_MALE.pose][0]} ay={EYE[COVER_MALE.pose][1]} />
        ) : showMale && t < CUT_H ? (
          <Spr n={m.pose} x={m.x} y={m.y} s={m.s} sx={m.sx} sy={m.sy} rot={m.rot} ax={EYE[m.pose][0]} ay={EYE[m.pose][1]} />
        ) : null}
        {showNet && !cover ? <Net t={t} front /> : null}
        {!guyInFront ? <Guy t={t} /> : null}
        {guyInFront ? <Guy t={t} /> : null}
        <BushKnot t={t} />
        {showMale && t >= CUT_H ? (
          <>
            <Spr n={m.pose} x={m.x} y={m.y} s={m.s} sx={m.sx} sy={m.sy} rot={m.rot} ax={EYE[m.pose][0]} ay={EYE[m.pose][1]} clip={t < RELEASE ? 'polygon(0% 0%, 100% 0%, 100% 74%, 0% 74%)' : undefined} />
            {t < RELEASE ? (
              <Spr n="cup" x={GUY_G} y={GY} s={poseS('cup')} sx={squashSwap(t, -10)[0]} sy={1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t)} ax={S('cup').feet[0]} ay={S('cup').feet[1]} clip={handsClip} />
            ) : null}
          </>
        ) : null}
        {cover ? <CoverTape t={t} /> : <TapeLayer t={t} />}
        {cover ? null : <Effects t={t} />}
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'flutter', at: 0.0, db: -27},
  {f: 'flutter', at: 0.74, db: -28, rate: 1.05},
  {f: 'flutter', at: 1.48, db: -27, rate: 0.97},
  {f: 'flutter', at: 2.1, db: -25, rate: 1.08},
  {f: 'whoosh', at: HIT - 0.31, db: -25},
  {f: 'net_catch', at: HIT - 0.12, db: -13},
  {f: 'boing', at: HIT + 0.02, db: -27, rate: 1.3},
  {f: 'squeak', at: HIT + 0.2, db: -25},
  {f: 'pop', at: T.why - 0.04, db: -24},
  {f: 'squeak', at: T.female + 0.02, db: -26, rate: 0.92},
  {f: 'squeak', at: T.stuck + 0.04, db: -25, rate: 1.08},
  {f: 'twinkle', at: HOPE1 + 0.02, db: -27},
  {f: 'pop', at: T.flirt, db: -24},
  {f: 'pop', at: T.flirt + 0.12, db: -25, rate: 1.15},
  {f: 'pop', at: T.flirt + 0.24, db: -26, rate: 1.3},
  {f: 'wren_trill', at: T.fairywren - 0.05, db: -21},
  {f: 'twinkle', at: T.holding + 0.06, db: -24},
  {f: 'magic', at: BUBBLE - 0.02, db: -27},
  {f: 'scratch', at: EXCEPT - 0.03, db: -15},
  {f: 'pop', at: EXCEPT + 0.02, db: -22},
  {f: 'tape_crinkle', at: UNFOLD - 0.04, db: -22},
  {f: 'tape_crinkle', at: T.plastic - 0.04, db: -17, rate: 1.05},
  {f: 'tape_tie', at: KNOT - 0.46, db: -18},
  {f: 'pop', at: T.bushes, db: -23},
  {f: 'pop', at: T.bushes + 0.16, db: -24, rate: 1.12},
  {f: 'twinkle', at: T.nests + 0.04, db: -26},
  {f: 'tape_crinkle', at: CUT_G + 0.05, db: -24, rate: 0.9},
  {f: 'whoosh', at: YANK - 0.14, db: -25, rate: 1.2},
  {f: 'pop', at: YANK, db: -20},
  {f: 'catch', at: T.back - 0.02, db: -15},
  {f: 'gulp', at: T.him - 0.04, db: -17},
  {f: 'flutter', at: RELEASE - 0.02, db: -22},
  {f: 'flap', at: RELEASE + 0.02, db: -24, rate: 1.5},
];

export const FairywrenTapeShort: React.FC = () => {
  useFWTFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAtT(t);
  return (
    <AbsoluteFill style={{background: SKY}}>
      <NetScene t={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('fairywren-tape/vo/take1.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('fairywren-tape/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="fairywren-tape/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const FWT_TOTAL = Math.round(DURATION * FPS);
