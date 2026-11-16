import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT4, CUT5, CUT6, FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did they move these stone giants with no wheels or big animals?" - side-view Easter Island road.
// Shot A (0-5.9): the puzzled guy next to a moai that opens its eyes; a wheel bonks it and falls flat, a tiny chicken
// clucks by; the guy's thought bubble shows the moai rolled on logs. Shot B (5.9-10.1): the bubble pops; the camera
// slides down to the rounded base, which rocks; the moai leans forward over the scared guy. Shot C (10.1-12.86): two
// guys tug ropes left and right, the moai waddles forward step by step. Shot D (12.86-): the moai walks in on its own
// trailing the slack rope, a close reaction shot, then the frame-0 framing again and the moai winks on "did".

const F = (n: string) => staticFile(`moai-walk/${n}.png`);
export const FONT = 'MoaiInter';
export const useMoaiFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 4.0;
const INK = '#000';

// ---------- world ----------
export const G = 1000; // grass top line (the plate's grass edge sits on it)
export const FY = G + 150; // feet line: everybody stands on the road band
const ROAD0 = G + 78;
const ROAD1 = G + 205;
const SKY = '#93CFF0';
const GRASS = '#8EC765';
const ROAD = '#DDB988';
// moai: native sprite -> world
const MS = 0.39;
const BC = (SPR.moai.bl + SPR.moai.br) / 2; // base centre x (native)
const BY = SPR.moai.base; // base bottom y (native)
const HALF = ((SPR.moai.br - SPR.moai.bl) / 2) * MS; // half base width (world)
const NECK_L: [number, number] = [34, 772];
const NECK_R: [number, number] = [432, 772];
// characters
const HEAD = 46;
type GuyPose = 'hero' | 'proud' | 'scared' | 'pull' | 'stunned' | 'closeup';
const sc = (n: GuyPose) => HEAD / SPR[n].head[2];
const GUY_X = 215;
const HOME = 0;

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: 95, y: FY - 335, k: 1.95};
const KEYS_AB: CamKey[] = [
  CAM0,
  {t: 2.3, x: 84, y: FY - 340, k: 1.9},
  {t: 4.3, x: 86, y: FY - 341, k: 1.92},
  {t: 4.75, x: 175, y: FY - 400, k: 1.75},
  {t: 6.25, x: 176, y: FY - 401, k: 1.76},
  {t: 7.45, x: 40, y: FY - 175, k: 2.15},
  {t: 8.72, x: 42, y: FY - 177, k: 2.2},
  {t: 9.2, x: 110, y: FY - 352, k: 1.75},
  {t: 10.1, x: 112, y: FY - 353, k: 1.77},
];
const KEYS_D: CamKey[] = [
  {t: CUT4, x: 40, y: FY - 400, k: 1.5},
  {t: CUT5, x: 75, y: FY - 370, k: 1.65},
];
const KEYS_CU: CamKey[] = [
  {t: CUT5, x: 214, y: FY - 168, k: 2.9},
  {t: CUT6, x: 214, y: FY - 170, k: 3.15},
];
const KEYS_END: CamKey[] = [
  {t: CUT6, x: 98, y: FY - 340, k: 1.85},
  {t: 16.7, x: CAM0.x, y: CAM0.y, k: CAM0.k},
];

// ---------- the waddle (shot C: pulled, shot D: on its own) ----------
const C_STEPS = [10.48, 10.92, 11.4, 11.82];
const C_D = 0.42;
const C_L = 75;
const D_STEPS = [12.95, 13.37, 13.79, 14.21];
const D_D = 0.4;
const D_L = 85;
const D_X0 = HOME - D_L * D_STEPS.length;
type Waddle = {x: number; rot: number; side: number; u: number; i: number};
const waddle = (t: number, starts: number[], D: number, L: number, A: number, x0: number): Waddle => {
  for (let i = 0; i < starts.length; i++) {
    if (t < starts[i]) return {x: x0 + L * i, rot: 0, side: i % 2 === 0 ? -1 : 1, u: 0, i: -1};
    if (t < starts[i] + D) {
      const u = (t - starts[i]) / D;
      const side = i % 2 === 0 ? -1 : 1;
      return {x: x0 + L * (i + easeInOutCubic(u)), rot: side * A * Math.sin(Math.PI * u), side, u, i};
    }
  }
  return {x: x0 + L * starts.length, rot: 0, side: 1, u: 1, i: starts.length};
};
const advC = (t: number) => waddle(t, C_STEPS, C_D, C_L, 7, 0).x;

// moai state: base-centre x, rotation, pivot point and where the base centre sits relative to the pivot
type MoaiSt = {x: number; rot: number; px: number; py: number; ax: number; ay: number};
const corner = (x: number, rot: number, side: number): MoaiSt =>
  side < 0 ? {x, rot, px: x - HALF, py: FY, ax: HALF, ay: 0} : {x, rot, px: x + HALF, py: FY, ax: -HALF, ay: 0};
const ROLL_R = 300;
const moaiAt = (t: number): MoaiSt => {
  if (t >= CUT4) {
    const w = waddle(t, D_STEPS, D_D, D_L, 8, D_X0);
    // a final settle bounce after the last step
    return corner(w.x, w.rot, w.side);
  }
  if (t >= 10.08) {
    if (t < 10.46) return corner(0, 10 * (1 - easeInOutCubic(prog(t, 10.08, 10.42))), 1);
    const w = waddle(t, C_STEPS, C_D, C_L, 7, 0);
    return corner(w.x, w.rot, w.side);
  }
  if (t >= T.lean) return corner(0, 10 * easeOutBack(prog(t, T.lean, 9.2), 1.6), 1);
  if (t >= T.rounded) {
    // rolls on its rounded base: rotate about the centre of curvature, which rolls along the ground
    const dt = t - T.rounded;
    const th = 4.2 * Math.sin(2 * Math.PI * 1.45 * dt) * Math.exp(-1.1 * dt) * clamp(dt / 0.08);
    const r = (th * Math.PI) / 180;
    return {x: 0, rot: th, px: ROLL_R * r, py: FY - ROLL_R, ax: 0, ay: ROLL_R};
  }
  return corner(0, 0, 1);
};
// native moai point -> world
const moaiPt = (st: MoaiSt, n: [number, number]): [number, number] => {
  const lx = st.ax + (n[0] - BC) * MS;
  const ly = st.ay + (n[1] - BY) * MS;
  const a = (st.rot * Math.PI) / 180;
  return [st.px + lx * Math.cos(a) - ly * Math.sin(a), st.py + lx * Math.sin(a) + ly * Math.cos(a)];
};

// ---------- sounds (ElevenLabs: 2 new for this video + reused ones from sfx-library) ----------
const stepCues = (starts: number[], D: number, db: number): Cue[] =>
  starts.flatMap((s, i) => [
    {f: 'rope_creak', at: s + 0.02, db: db - 7, rate: i % 2 ? 1.1 : 0.95},
    {f: 'stone_step', at: s + D - 0.02, db, rate: i % 2 ? 1.05 : 0.95},
  ]);
const CUES: Cue[] = [
  {f: 'pop', at: 0.42, db: -27, rate: 1.2},
  {f: 'grind', at: 1.2, db: -27, dur: 0.45, keys: [[1.2, -27], [1.55, -27], [1.65, -45]]},
  {f: 'pop', at: 1.32, db: -21, rate: 0.75},
  {f: 'whoosh', at: 2.36, db: -31, rate: 1.4},
  {f: 'knock', at: 2.7, db: -15},
  {f: 'dustplop', at: 2.98, db: -19},
  {f: 'pop', at: 3.05, db: -23, rate: 1.3},
  {f: 'cluck', at: 3.36, db: -20},
  {f: 'pop', at: 4.4, db: -24, rate: 1.15},
  {f: 'pop', at: T.but, db: -15, rate: 0.85},
  {f: 'whoosh', at: 6.35, db: -32, rate: 0.9},
  {f: 'boing', at: T.rounded + 0.02, db: -23, rate: 0.62},
  {f: 'grind', at: T.lean, db: -21, dur: 0.5, keys: [[T.lean, -21], [9.2, -21], [9.32, -45]]},
  {f: 'pop', at: 9.12, db: -26, rate: 1.45},
  {f: 'whoosh', at: 10.06, db: -29, rate: 1.2},
  {f: 'pop', at: 10.1, db: -19, rate: 0.95},
  ...stepCues(C_STEPS, C_D, -15),
  ...stepCues(D_STEPS, D_D, -14).filter((c) => c.f === 'stone_step'),
  {f: 'whoosh', at: CUT5 - 0.04, db: -31, rate: 1.7},
  {f: 'pop', at: T.did, db: -20, rate: 1.55},
  {f: 'boing', at: T.did + 0.06, db: -29, rate: 1.25, dur: 0.6},
];

// ---------- helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const squashSwap = (t: number, tSwap: number) => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const breathe = (tr: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr + ph);

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -6000, top: -3000, overflow: 'visible'}} width={12000} height={9000} viewBox="-6000 -3000 12000 9000">
    {children}
  </svg>
);
const Shadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: 'rgba(72, 54, 42, 0.26)', filter: 'blur(3px)'}} />
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.14} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot = 0}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={p} fill="#FFE45C" stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
};

// ---------- backdrop: the generated plate down to its grass edge (far, gentle parallax) above a code-drawn ground ----------
const PLATE_ROWS = 887;
const Backdrop: React.FC<{cam: Cam; blur?: number}> = ({cam, blur = 0}) => {
  const sp = clamp(0.95 + 0.3 * (cam.k - 1.2), 0.9, 1.7);
  const gy = 960 + (G - cam.y) * cam.k; // ground line on screen
  const W = SPR.bg.w * sp;
  const ox = -(((cam.x * cam.k * 0.3) % (2 * W)) + 2 * W) % (2 * W);
  const tiles: number[] = [];
  for (let x = ox - 2 * W; x < 1080 + W; x += W) tiles.push(x);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: gy - PLATE_ROWS * sp + 2,
        width: 1080,
        height: PLATE_ROWS * sp,
        overflow: 'hidden',
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      {tiles.map((x, i) => {
        const n = Math.round((x - ox) / W);
        const flip = ((n % 2) + 2) % 2 === 1;
        return (
          <Img key={i} src={F('bg')} style={{position: 'absolute', left: x, top: 0, width: W, height: SPR.bg.h * sp, transform: flip ? 'scaleX(-1)' : undefined}} />
        );
      })}
    </div>
  );
};
const Ground: React.FC = () => {
  const peb: React.ReactNode[] = [];
  for (let i = 0; i < 90; i++) {
    const x = -3000 + i * 70 + 40 * rnd(i);
    peb.push(<ellipse key={i} cx={x} cy={ROAD0 + 22 + (ROAD1 - ROAD0 - 44) * rnd(i * 3.1)} rx={6 + 6 * rnd(i * 2.2)} ry={4 + 3 * rnd(i * 5.3)} fill="#C49E6C" />);
  }
  const tufts: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const x = -3000 + i * 105 + 50 * rnd(i * 7.7);
    const y = rnd(i * 1.9) < 0.5 ? G + 30 + 30 * rnd(i * 4.4) : ROAD1 + 40 + 120 * rnd(i * 4.4);
    tufts.push(<path key={i} d={`M ${x - 12} ${y} q 4 -16 6 -22 M ${x} ${y} q 0 -20 1 -28 M ${x + 12} ${y} q -3 -16 -6 -22`} stroke="#5E9E45" strokeWidth={5} fill="none" strokeLinecap="round" />);
  }
  return (
    <g>
      <rect x={-6000} y={G} width={12000} height={4000} fill={GRASS} />
      {tufts}
      <rect x={-6000} y={ROAD0} width={12000} height={ROAD1 - ROAD0} fill={ROAD} />
      {peb}
      <line x1={-6000} x2={6000} y1={ROAD0} y2={ROAD0} stroke={INK} strokeWidth={5} />
      <line x1={-6000} x2={6000} y1={ROAD1} y2={ROAD1} stroke={INK} strokeWidth={5} />
      <line x1={-6000} x2={6000} y1={G} y2={G} stroke={INK} strokeWidth={6} />
    </g>
  );
};

// ---------- the moai (sprite + code face, rope band, base highlight) ----------
type MoaiFace = {open: number; look: [number, number]; lid?: number; winkL?: boolean; brows?: [number, number]; tilt?: number};
const MoaiOverlay: React.FC<{f: MoaiFace; band: number; hl: number; t: number}> = ({f, band, hl}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={SPR.moai.w} height={SPR.moai.h}>
    {band > 0.01 ? (
      <g>
        <path d={`M ${NECK_L[0]} ${NECK_L[1] - 6} Q 233 ${NECK_L[1] + 26} ${NECK_R[0]} ${NECK_R[1] - 6}`} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <path d={`M ${NECK_L[0]} ${NECK_L[1] - 6} Q 233 ${NECK_L[1] + 26} ${NECK_R[0]} ${NECK_R[1] - 6}`} fill="none" stroke="#D1A564" strokeWidth={16} strokeLinecap="round" />
      </g>
    ) : null}
    {hl > 0.01 ? (
      <g>
        <defs>
          <clipPath id="moai-hl">
            <rect x={0} y={1300} width={30 + 420 * hl} height={250} />
          </clipPath>
        </defs>
        <g clipPath="url(#moai-hl)">
          <path d={`M 26 1438 Q 232 1478 440 1438`} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" strokeDasharray="38 26" />
          <path d={`M 26 1438 Q 232 1478 440 1438`} fill="none" stroke="#FFD23F" strokeWidth={16} strokeLinecap="round" strokeDasharray="38 26" />
        </g>
      </g>
    ) : null}
    <Eye x={196} y={233} r={33} open={f.open} look={f.look} lid={f.lid ?? 0} squeeze={f.winkL} side={-1} brow={f.brows ? f.brows[0] : 0.42} browTilt={f.tilt ?? 0} ink={0.19} />
    <Eye x={331} y={237} r={27} open={f.open} look={f.look} lid={f.lid ?? 0} side={1} brow={f.brows ? f.brows[1] : 0.42} browTilt={f.tilt ?? 0} ink={0.19} />
  </svg>
);
const Moai: React.FC<{st: MoaiSt; f: MoaiFace; band?: number; hl?: number; t: number; shadow?: boolean}> = ({st, f, band = 0, hl = 0, t, shadow = true}) => (
  <>
    {shadow ? <Shadow x={st.x} y={FY} w={230} /> : null}
    <div style={{position: 'absolute', left: st.px, top: st.py, transform: `rotate(${st.rot}deg)`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: st.ax - BC * MS, top: st.ay - BY * MS, width: SPR.moai.w * MS, height: SPR.moai.h * MS}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: SPR.moai.w, height: SPR.moai.h, transform: `scale(${MS})`, transformOrigin: '0 0'}}>
          <Img src={F('moai')} style={{position: 'absolute', left: 0, top: 0, width: SPR.moai.w, height: SPR.moai.h}} />
          <MoaiOverlay f={f} band={band} hl={hl} t={t} />
        </div>
      </div>
    </div>
  </>
);

// ---------- guy ----------
const Guy: React.FC<{n: GuyPose; x: number; t: number; tr: number; tSwap: number; flip?: boolean; rot?: number; tremble?: number; shadow?: number}> = ({
  n,
  x,
  t,
  tr,
  tSwap,
  flip = false,
  rot = 0,
  tremble = 0,
  shadow = 130,
}) => {
  const [sx, sy] = squashSwap(t, tSwap);
  const tx = tremble * 2.5 * Math.sin(2 * Math.PI * 13 * tr);
  return (
    <>
      <Shadow x={x} y={FY} w={shadow} />
      <Spr n={n} x={x + tx} y={FY} s={sc(n)} sx={sx * (flip ? -1 : 1)} sy={sy * breathe(tr)} rot={rot} />
    </>
  );
};
// the pull pose's fists in world (feet at x, rotated about the feet)
const fists = (x: number, flip: boolean, rot: number): [number, number] => {
  const s = sc('pull');
  const lx = (SPR.pull.right[0] - SPR.pull.feet[0]) * s * (flip ? -1 : 1);
  const ly = (SPR.pull.right[1] - SPR.pull.feet[1]) * s;
  const a = (rot * Math.PI) / 180;
  return [x + lx * Math.cos(a) - ly * Math.sin(a), FY + lx * Math.sin(a) + ly * Math.cos(a)];
};

// ---------- small code props ----------
const Rope: React.FC<{a: [number, number]; b: [number, number]; sag: number; grow?: number}> = ({a, b, sag, grow = 1}) => {
  if (grow <= 0.001) return null;
  const e: [number, number] = [lerp(b[0], a[0], grow), lerp(b[1], a[1], grow)]; // grows from b (hands) towards a (neck)
  const m: [number, number] = [(e[0] + b[0]) / 2, (e[1] + b[1]) / 2 + sag];
  const d = `M ${b[0]} ${b[1]} Q ${m[0]} ${m[1]} ${e[0]} ${e[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#D1A564" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};
const Wheel: React.FC<{x: number; r: number; rot: number; flat: number}> = ({x, r, rot, flat}) => (
  <g transform={`translate(${x} ${FY}) scale(1 ${1 - 0.82 * flat}) translate(0 ${-r})`}>
    <g transform={`rotate(${rot})`}>
      <circle r={r} fill="#A8743F" stroke={INK} strokeWidth={6} />
      <circle r={r * 0.74} fill="#C99358" stroke={INK} strokeWidth={4} />
      {[0, 60, 120].map((a) => (
        <rect key={a} x={-r * 0.74} y={-4} width={r * 1.48} height={8} fill="#8A5E33" stroke={INK} strokeWidth={2.5} transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.18} fill="#6E4A28" stroke={INK} strokeWidth={4} />
    </g>
  </g>
);
const RedX: React.FC<{x: number; y: number; r: number; s: number}> = ({x, y, r, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M ${-r} ${-r} L ${r} ${r} M ${r} ${-r} L ${-r} ${r}`} stroke={INK} strokeWidth={r * 0.62} strokeLinecap="round" />
      <path d={`M ${-r} ${-r} L ${r} ${r} M ${r} ${-r} L ${-r} ${r}`} stroke="#E8332E" strokeWidth={r * 0.36} strokeLinecap="round" />
    </g>
  );
// a small hen (the only farm animal on the island) facing left; walk = 0..1 phase
const Chicken: React.FC<{x: number; walk: number; peck: number; s?: number}> = ({x, walk, peck, s = 1}) => {
  const bob = 3 * Math.abs(Math.sin(Math.PI * walk * 2));
  const l1 = 10 * Math.sin(2 * Math.PI * walk);
  return (
    <g transform={`translate(${x} ${FY}) scale(${s})`}>
      <ellipse cx={4} cy={2} rx={34} ry={7} fill="rgba(72,54,42,0.22)" />
      <path d={`M -4 -26 L ${-4 + l1} 0 M 10 -26 L ${10 - l1} 0`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d={`M -4 -26 L ${-4 + l1} 0 M 10 -26 L ${10 - l1} 0`} stroke="#F2A23A" strokeWidth={3.5} strokeLinecap="round" />
      <g transform={`translate(0 ${-bob})`}>
        <path d="M 22 -52 Q 50 -78 44 -40 Q 40 -30 28 -32 Z" fill="#FEFDFD" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={4} cy={-44} rx={30} ry={22} fill="#FEFDFD" stroke={INK} strokeWidth={5} />
        <path d="M 2 -46 Q 14 -38 22 -48" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
        <g transform={`rotate(${-38 * peck} -18 -58)`}>
          <circle cx={-22} cy={-72} r={14} fill="#FEFDFD" stroke={INK} strokeWidth={5} />
          <path d="M -30 -86 q -2 -10 5 -8 q 2 -9 8 -4 q 6 -6 7 3 q -8 3 -20 9 Z" fill="#E8332E" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M -35 -74 L -48 -69 L -35 -64 Z" fill="#F7C531" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M -32 -63 q -4 9 2 11 q 5 -2 2 -10" fill="#E8332E" stroke={INK} strokeWidth={3} />
          <circle cx={-25} cy={-75} r={3.2} fill={INK} />
        </g>
      </g>
    </g>
  );
};
const Dust: React.FC<{x: number; t: number; t0: number}> = ({x, t, t0}) => {
  const u = prog(t, t0, t0 + 0.42);
  if (u <= 0 || u >= 1) return null;
  const g = easeOutCubic(prog(u, 0, 0.35)) * (1 - easeInCubic(prog(u, 0.45, 1)));
  const puffs: Puff[] = [];
  for (let i = 0; i < 8; i++) {
    const dir = i < 4 ? -1 : 1;
    const k = i % 4;
    puffs.push({x: x + dir * (8 + 20 * k + 34 * u), y: FY - 8 - 10 * k * (1 - 0.5 * u) - 22 * u * rnd(i * 1.7 + t0), r: (15 - 2 * k + 5 * rnd(i * 5.1 + t0)) * g});
  }
  return <PuffCluster puffs={puffs} fill="#F1E7D3" ink={4} shade="#E2D3B6" />;
};
const Poof: React.FC<{x: number; y: number; t: number; t0: number; w?: number}> = ({x, y, t, t0, w = 160}) => {
  const u = prog(t, t0, t0 + 0.45);
  if (u <= 0 || u >= 1) return null;
  const g = easeOutCubic(prog(u, 0, 0.3)) * (1 - easeInCubic(prog(u, 0.4, 1)));
  const puffs: Puff[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd(i + t0);
    puffs.push({x: x + Math.cos(a) * w * (0.22 + 0.18 * u), y: y + Math.sin(a) * w * 0.45 * (0.22 + 0.18 * u), r: (w * 0.24 + w * 0.08 * rnd(i * 2.3)) * g});
  }
  return <PuffCluster puffs={puffs} fill="#FFFFFF" ink={6} shade="#E8EEF3" />;
};

// thought bubble: the moai lying on logs, rolled along (HTML so the sprite can be clipped by the round bubble)
const BUB = {x: 292, y: FY - 432, rx: 178, ry: 118};
const Bubble: React.FC<{t: number}> = ({t}) => {
  const tIn = T.on - 0.02;
  if (t < tIn || t > T.but + 0.16) return null;
  const sIn = easeOutBack(prog(t, tIn, tIn + 0.28), 2.0);
  const sOut = t < T.but ? 1 : t < T.but + 0.07 ? 1 + 0.12 * prog(t, T.but, T.but + 0.07) : 1.12 * (1 - easeInCubic(prog(t, T.but + 0.07, T.but + 0.16)));
  const s = sIn * sOut;
  const W = BUB.rx * 2;
  const H = BUB.ry * 2;
  const m = 0.165;
  const slide = 46 * easeInOutCubic(prog(t, T.logs, T.right + 0.5));
  const gy = H * 0.76; // mini ground
  const lr = 15;
  const px = W - 52 - slide;
  return (
    <>
      {[
        [BUB.x - 52, BUB.y + BUB.ry + 30, 14, 0.06],
        [BUB.x - 70, BUB.y + BUB.ry + 66, 9, 0.0],
      ].map(([x, y, r, d], i) => {
        const ss = easeOutBack(prog(t, tIn + d, tIn + d + 0.2), 2) * (t < T.but ? 1 : 1 - prog(t, T.but, T.but + 0.08));
        return ss > 0.01 ? (
          <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: '#fff', border: '5px solid #000', boxSizing: 'border-box', transform: `scale(${ss})`}} />
        ) : null;
      })}
      <div
        style={{
          position: 'absolute',
          left: BUB.x - BUB.rx,
          top: BUB.y - BUB.ry,
          width: W,
          height: H,
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '7px solid #000',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transform: `scale(${s})`,
          transformOrigin: '30% 85%',
        }}
      >
        <div style={{position: 'absolute', left: 0, top: gy, width: W, height: H - gy, background: '#E9D3AE', borderTop: '4px solid #000'}} />
        {[0.22, 0.47, 0.72].map((u, i) => {
          const cx = W * u - slide * 0.5;
          return (
            <div key={i} style={{position: 'absolute', left: cx - lr, top: gy - 2 * lr, width: 2 * lr, height: 2 * lr, borderRadius: '50%', background: '#B5804A', border: '4px solid #000', boxSizing: 'border-box', transform: `rotate(${(-slide * 0.5 * 180) / (Math.PI * lr)}deg)`}}>
              <div style={{position: 'absolute', left: '28%', top: '28%', width: '44%', height: '44%', borderRadius: '50%', border: '3px solid #6E4A28', boxSizing: 'border-box'}} />
            </div>
          );
        })}
        <div style={{position: 'absolute', left: px, top: gy - 2 * lr + 1, transform: 'rotate(-90deg)', transformOrigin: '0 0'}}>
          <Img src={F('moai')} style={{position: 'absolute', left: -SPR.moai.bl * m, top: -SPR.moai.base * m, width: SPR.moai.w * m, height: SPR.moai.h * m}} />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: px + 14 + 10 * Math.sin(t * 9 + i), top: gy - 62 + i * 18, width: 30 - i * 6, height: 6, borderRadius: 3, background: '#000'}} />
        ))}
      </div>
    </>
  );
};

// a small wooden sign that pops up on "old roads"
const RoadSign: React.FC<{x: number; s: number}> = ({x, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${FY - 66}) scale(${s})`}>
      <rect x={-9} y={-150} width={18} height={150} fill="#8A5E33" stroke={INK} strokeWidth={5} />
      <path d="M 112 -200 L -92 -200 L -128 -166 L -92 -132 L 112 -132 Z" fill="#C99358" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <text x={8} y={-152} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#4A3018">
        OLD ROAD
      </text>
    </g>
  );

// lean marker: a fat yellow curved arrow over the head, pointing forward
const LeanMark: React.FC<{s: number}> = ({s}) => {
  if (s <= 0.001) return null;
  const d = 'M -150 -40 Q 20 -150 170 -30';
  return (
    <g transform={`translate(10 ${FY - 600}) scale(${s})`}>
      <path d={d} fill="none" stroke={INK} strokeWidth={42} strokeLinecap="round" />
      <path d="M 196 -6 L 118 -12 L 170 -84 Z" fill={INK} stroke={INK} strokeWidth={16} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFD23F" strokeWidth={24} strokeLinecap="round" />
      <path d="M 186 -12 L 128 -16 L 166 -70 Z" fill="#FFD23F" />
    </g>
  );
};

// ---------- the scene ----------
const faceAt = (t: number, st: MoaiSt): MoaiFace => {
  const open = t < 1.28 ? 0 : easeOutBack(prog(t, 1.28, 1.5), 2.4);
  if (t >= CUT6) {
    const wink = t > T.did - 0.04 && t < T.did + 0.42;
    return {open: 1, look: [0.15, 0.25], winkL: wink, lid: 0.12, brows: [wink ? 0.62 : 0.5, 0.6]};
  }
  if (t >= CUT4) return {open: 1, look: [1, 0.05], lid: 0.42, brows: [0.38, 0.38], tilt: -2};
  if (t >= 10.08) {
    const w = waddle(t, C_STEPS, C_D, C_L, 7, 0);
    const lx = w.i >= 0 && w.i < C_STEPS.length ? w.side * 0.9 * Math.sin(Math.PI * w.u) : 0.6;
    return {open: 1, look: [lx, 0.1], brows: [0.6, 0.6]};
  }
  if (t >= T.lean) return {open: 1, look: [0.95, 0.85], lid: 0.3, brows: [0.4, 0.4], tilt: -3};
  if (t >= 7.7) return {open: 1, look: [0.2, 1], brows: [0.6, 0.6]};
  if (t >= T.but) return {open: 1, look: [0.8, 0.15], brows: [0.5, 0.5]};
  if (t >= T.on) return {open: 1, look: [0.95, -0.75], brows: [0.85, 0.32], tilt: 0};
  if (t >= 3.45) return {open: 1, look: [1, 0.95], brows: [0.75, 0.45]};
  if (t >= 2.62 && t < 3.3) return {open: 1, look: [-1, 0.9], lid: 0.25, brows: [0.35, 0.35], tilt: -4};
  void st;
  return {open, look: [0.55, 0.4]};
};

const ShotAB: React.FC<{t: number; tr: number; cover?: boolean}> = ({t, tr, cover = false}) => {
  const st = moaiAt(t);
  const f = faceAt(t, st);
  // wheel: rolls in, bonks the base, rolls back a bit and falls flat; a red X pops over it
  const wr = 46;
  const wIn = prog(t, 2.36, 2.7);
  const wBack = easeOutCubic(prog(t, 2.7, 2.92));
  const wx = t < 2.7 ? lerp(-420, -HALF - wr, wIn) : -HALF - wr - 14 * wBack;
  const wrot = (wx / wr) * (180 / Math.PI);
  const flat = easeInCubic(prog(t, 2.86, 3.0));
  const wGone = 1 - easeInCubic(prog(t, 4.25, 4.45));
  // chicken: walks in from the right on "big", pecks, walks off
  const cx = t < 3.75 ? lerp(520, 318, easeOutCubic(prog(t, 3.18, 3.75))) : t < 5.0 ? 318 : lerp(318, 560, easeInCubic(prog(t, 5.0, 5.7)));
  const cWalk = t < 3.75 ? (t - 3.18) * 3.2 : t > 5.0 ? (t - 5.0) * 3.4 : 0;
  const peck = bump(t, 3.95, 0.18) + bump(t, 4.35, 0.18);
  // guy poses
  const pose: GuyPose = t < T.on ? 'hero' : t < T.but ? 'proud' : t < T.lean + 0.08 ? 'hero' : 'scared';
  const tSwap = t < T.but ? T.on : t < T.lean + 0.08 ? T.but : T.lean + 0.08;
  const sweat = t > 9.1 ? Math.min(1, (t - 9.1) * 5) : 0;
  const hl = easeInOutCubic(prog(t, T.rounded - 0.05, T.bases + 0.1)) * (t < 8.8 ? 1 : 1 - prog(t, 8.8, 8.92));
  const leanS = easeOutBack(prog(t, 9.02, 9.3), 1.8) * (1 - easeInCubic(prog(t, 9.86, 10.05)));
  const hop = t > T.but && t < T.but + 0.3 ? -10 * bump(t, T.but, 0.3) : 0;
  const q = pop(t, 0.36, 0.25) * (1 - easeInCubic(prog(t, 1.9, 2.1)));
  return (
    <>
      <Svg>
        {t > 2.3 && wGone > 0.01 && !cover ? (
          <g transform={`translate(${wx} ${FY}) scale(${wGone}) translate(${-wx} ${-FY})`}>
            <Wheel x={wx} r={wr} rot={wrot} flat={flat} />
            <RedX x={wx} y={FY - 70} r={30} s={pop(t, 3.02, 0.25)} />
          </g>
        ) : null}
      </Svg>
      <Svg>
        {!cover ? <RoadSign x={-144} s={0.55 * easeOutBack(prog(t, T.old - 0.05, T.old + 0.22), 2.2) * (1 - easeInCubic(prog(t, 9.75, 9.95)))} /> : null}
      </Svg>
      <div style={{position: 'absolute', left: 0, top: hop}}>
        <Moai st={st} f={cover ? {open: 1, look: [0.55, 0.45], brows: [0.6, 0.6]} : f} hl={hl} t={t} />
      </div>
      <Guy n={pose} x={GUY_X} t={t} tr={tr} tSwap={tSwap} tremble={pose === 'scared' ? 0.7 : 0} />
      <Svg>
        {!cover && t > 3.1 && t < 5.8 ? <Chicken x={cx} walk={cWalk} peck={peck} /> : null}
        <SweatDrop x={GUY_X + 52} y={FY - 205 + 30 * sweat} r={11} s={pop(t, 9.1, 0.2) * (1 - prog(t, 9.95, 10.06))} rot={10} />
        <Mark x={GUY_X + 30} y={FY - 262} size={64} s={cover ? 0 : q} text="?" rot={8} />
        <LeanMark s={leanS} />
      </Svg>
      {!cover ? <Bubble t={t} /> : null}
      <Svg>
        <Poof x={BUB.x} y={BUB.y} t={t} t0={T.but} w={260} />
      </Svg>
    </>
  );
};

const ShotC: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const st = moaiAt(t);
  const f = faceAt(t, st);
  const w = waddle(t, C_STEPS, C_D, C_L, 7, 0);
  const adv = advC(t);
  const tug = (side: number) => (w.i >= 0 && w.i < C_STEPS.length && w.side === side ? Math.sin(Math.PI * w.u) : 0);
  // puller A (a second guy, poofs in) on the left, the guy (mirrored) on the right
  const ax = -290 + adv;
  const bx = (t < 10.46 ? lerp(GUY_X, 290, easeOutCubic(prog(t, 10.1, 10.46))) : 290) + adv;
  const aRot = -5 * tug(-1);
  const bRot = 5 * tug(1);
  const showA = t > 10.2;
  const grow = easeOutCubic(prog(t, 10.24, 10.44));
  const nl = moaiPt(st, NECK_L);
  const nr = moaiPt(st, NECK_R);
  const steps: React.ReactNode[] = C_STEPS.map((s, i) => <Dust key={i} x={st.x - (i % 2 === 0 ? -1 : 1) * HALF} t={t} t0={s + C_D - 0.03} />);
  return (
    <>
      <Svg>
        {showA ? <Rope a={nl} b={fists(ax, false, aRot)} sag={lerp(34, 0, tug(-1))} grow={grow} /> : null}
      </Svg>
      <Moai st={st} f={f} band={grow} t={t} />
      {showA ? <Guy n="pull" x={ax} t={t} tr={tr} tSwap={10.2} rot={aRot} /> : null}
      <Guy n="pull" x={bx} t={t} tr={tr + 0.7} tSwap={10.12} flip rot={bRot} />
      <Svg>
        <Rope a={nr} b={fists(bx, true, bRot)} sag={lerp(34, 0, tug(1))} grow={grow} />
        {steps}
        <Poof x={-290} y={FY - 90} t={t} t0={10.06} w={190} />
      </Svg>
    </>
  );
};

const ShotD: React.FC<{t: number; tr: number; cover?: boolean}> = ({t, tr}) => {
  const st = moaiAt(t);
  const f = faceAt(t, st);
  const nl = moaiPt(st, NECK_L);
  // the slack rope trails behind on the road, swaying a little
  const sw = 8 * Math.sin(2 * Math.PI * 1.2 * tr);
  const end: [number, number] = [st.x - 430, FY + 8];
  const mid: [number, number] = [st.x - 175 + sw, FY + 4];
  const ropeD = `M ${nl[0]} ${nl[1]} Q ${nl[0] - 40} ${FY - 40} ${mid[0]} ${mid[1]} T ${end[0]} ${end[1]}`;
  const steps: React.ReactNode[] = D_STEPS.map((s, i) => <Dust key={i} x={st.x - (i % 2 === 0 ? -1 : 1) * HALF} t={t} t0={s + D_D - 0.03} />);
  const close = t >= CUT5 && t < CUT6;
  const swapT = t < CUT6 ? CUT4 : CUT6;
  return (
    <>
      <Svg>
        <path d={ropeD} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <path d={ropeD} fill="none" stroke="#D1A564" strokeWidth={5} strokeLinecap="round" />
      </Svg>
      <Moai st={st} f={f} band={1} t={t} />
      {close ? (
        <Spr n="closeup" x={GUY_X + 2} y={FY} s={(FY - (FY - 152.5)) / (SPR.closeup.feet[1] - SPR.closeup.head[1])} sy={breathe(tr)} />
      ) : (
        <Guy n="stunned" x={GUY_X} t={t} tr={tr} tSwap={swapT} />
      )}
      <Svg>
        {steps}
        <Sparkle x={st.x + 135} y={FY - 520} r={22} s={bump(t, T.did, 0.5)} rot={40 * t} />
        <Sparkle x={st.x + 168} y={FY - 440} r={15} s={bump(t, T.did + 0.08, 0.45)} rot={-40 * t} />
      </Svg>
    </>
  );
};

type Shot = 'AB' | 'C' | 'D';
const shotAt = (t: number): Shot => (t < 10.08 ? 'AB' : t < CUT4 ? 'C' : 'D');

export const camFor = (t: number): Cam => {
  if (t >= CUT6) return camAt(t, KEYS_END);
  if (t >= CUT5) return camAt(t, KEYS_CU);
  if (t >= CUT4) return camAt(t, KEYS_D);
  if (t >= 10.08) {
    const follow = {x: advC(t), y: FY - 410, k: 1.4};
    const u = easeInOutCubic(prog(t, 10.08, 10.6));
    const a = camAt(10.08, KEYS_AB);
    return {x: lerp(a.x, follow.x, u), y: lerp(a.y, follow.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(follow.k), u))};
  }
  return camAt(t, KEYS_AB);
};

export const Scene: React.FC<{t: number; tr: number; cam: Cam; cover?: boolean}> = ({t, tr, cam, cover = false}) => {
  const shot = shotAt(t);
  const dof = t >= CUT5 && t < CUT6 ? 3.2 : clamp((cam.k - 2.0) * 3.5, 0, 2.6);
  return (
    <>
      <Backdrop cam={cam} blur={dof} />
      <World cam={cam}>
        <Svg>
          <Ground />
        </Svg>
        {shot === 'AB' ? <ShotAB t={t} tr={tr} cover={cover} /> : shot === 'C' ? <ShotC t={t} tr={tr} /> : <ShotD t={t} tr={tr} cover={cover} />}
      </World>
    </>
  );
};

export const MoaiWalkShort: React.FC = () => {
  useMoaiFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let cam = camFor(t);
  let amp = 0;
  const land = (starts: number[], D: number, a: number) => starts.reduce((acc, s) => acc + (t > s + D - 0.02 ? a * Math.exp(-9 * (t - (s + D - 0.02))) : 0), 0);
  if (t >= 10.08 && t < CUT4) amp += land(C_STEPS, C_D, 6);
  if (t >= CUT4) amp += land(D_STEPS, D_D, 7);
  if (t > 2.7 && t < 3.2) amp += 2.5 * Math.exp(-10 * (t - 2.7));
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} tr={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('moai-walk/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="moai-walk/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
