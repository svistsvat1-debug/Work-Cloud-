import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_C, CUT_D, CUT_E, DURATION, FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did a worm help dig under a river?" - side cut-away of the River Thames.
// A: the guy with a shovel on the left bank; a dashed tunnel draws itself under the river. B: the mud opens its eyes and
// wobbles like jelly; the last crew's tunnel floods, the crew is spat out of the shaft by a water spout. C: close on the guy
// studying a plank full of holes; tiny worm heads peek out. D: inside the plank a shipworm drills shell-first, the tunnel
// with its white lining appears behind it. E: the iron shield drops down the shaft and crawls under the river: diggers in
// front, brick walls right behind. F: a train races through the finished tunnel; the guy cheers with the worm on his head.

const F = (n: string) => staticFile(`shipworm-tunnel/${n}.png`);
export const FONT = 'WormInter';
export const useWormFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5; // raw voice peak -0.5 dBFS; preview mix peaked -6.5 dBFS at -3
const INK = '#000';
export const SKY = '#9CD2F8';
const MUD = '#855F40';
const MUD_D = '#7D593D';
const WATER = '#4D9BD2';
const WATER_L = '#8CC4EC';
const BRICK = '#B4553A';
const BRICK_D = '#8E3E2A';
const HOLE = '#3A2618';

// ---------- world layout (world units = background plate pixels) ----------
export const G = SPR.bg.bankY; // bank top (488)
const SURF = SPR.bg.surf;
const SH0 = -245; // left shaft
const SH1 = -85;
const TY0 = 650; // tunnel outer top / bottom
const TY1 = 840;
const BR = 18; // brick ring thickness
const TX1 = 1000; // tunnel end (under the right bank)
const HEAD = 52; // guy head radius (world)
const GUY_X = 40;
const XP = 10000; // the plank close-up lives far away
const PS = 1; // plank scale
const SHS = 0.145; // shield scale
const SH_W = SPR.shield.w * SHS;
const SH_H = SPR.shield.h * SHS;
const TRS = 0.3; // train scale
const CAR2 = 1060; // body length (sprite px) reused as the second car
export const CAM0: CamKey = {t: 0, x: 205, y: 620, k: 1.7};
const WIDE = {x: 450, y: 700, k: 1.0};

// ---------- small helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; flip?: boolean; style?: React.CSSProperties}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  flip = false,
  style,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0', ...style}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
// local SVG canvas around a world point (world units)
const Svg: React.FC<{x: number; y: number; r?: number; children: React.ReactNode}> = ({x, y, r = 3000, children}) => (
  <svg style={{position: 'absolute', left: x - r, top: y - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${x - r} ${y - r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 0.26}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: `rgba(72, 54, 42, ${o})`, filter: 'blur(3px)'}} />
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot = 0}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={p} fill="#FFF6B0" stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
};

// ---------- the guy ----------
type GuyN = 'hero' | 'panic' | 'look' | 'point' | 'cheer';
const guyScale = (n: GuyN) => HEAD / (SPR[n] as unknown as {head: number[]}).head[2];
const Guy: React.FC<{n: GuyN; x: number; y: number; sx?: number; sy?: number; rot?: number}> = ({n, x, y, sx = 1, sy = 1, rot = 0}) => {
  const s = guyScale(n);
  return (
    <>
      <Shadow x={x} y={y + 2} w={130} />
      <Spr n={n} x={x} y={y} s={s} sx={sx} sy={sy} rot={rot} />
    </>
  );
};
// the guy's head top in world (for the worm riding on it)
const headTop = (n: GuyN, x: number, y: number) => {
  const sp = SPR[n] as unknown as {head: number[]; feet: number[]};
  const s = guyScale(n);
  return {x: x + (sp.head[0] - sp.feet[0]) * s, y: y + (sp.head[1] - sp.feet[1]) * s - HEAD};
};

// ---------- the worm: shell head sprite + code body along a path ----------
const W_HEAD = SPR.wormHead;
const W_SHELL = SPR.worm.shell; // [cx, cy, x0, x1, y0, y1] in worm coords
const W_BODY = SPR.worm.body;
const BODY_COL = `rgb(${W_BODY.col.join(',')})`;
const BODY_RING = '#D97E86';
// head pivot (shell centre) in wormHead sprite coords
const HPX = W_SHELL[0] - W_HEAD.off[0];
const HPY = W_SHELL[1] - W_HEAD.off[1];
const WormHead: React.FC<{x: number; y: number; s: number; rot: number; eyes?: {open: number; lid?: number; look?: [number, number]; squeeze?: boolean}}> = ({x, y, s, rot, eyes}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}rad)`, transformOrigin: '0 0'}}>
    <Img src={F('wormHead')} style={{position: 'absolute', left: -HPX * s, top: -HPY * s, width: W_HEAD.w * s, height: W_HEAD.h * s}} />
    {eyes ? (
      <svg style={{position: 'absolute', left: -400 * s, top: -400 * s, overflow: 'visible'}} width={800 * s} height={800 * s} viewBox="-400 -400 800 800">
        <Eye x={-150} y={-60} r={44} open={eyes.open} lid={eyes.lid ?? 0} look={eyes.look ?? [0.6, 0]} squeeze={eyes.squeeze} side={-1} brow={0.5} />
        <Eye x={-62} y={-72} r={44} open={eyes.open} lid={eyes.lid ?? 0} look={eyes.look ?? [0.6, 0]} squeeze={eyes.squeeze} side={1} brow={0.5} />
      </svg>
    ) : null}
  </div>
);
// polyline helpers
type P2 = [number, number];
const polyLen = (pts: P2[]) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return L;
};
const ptAt = (pts: P2[], L: number[], d: number): [number, number, number] => {
  const D = clamp(d, 0, L[L.length - 1]);
  let i = 1;
  while (i < L.length - 1 && L[i] < D) i++;
  const f = (D - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  return [lerp(x0, x1, f), lerp(y0, y1, f), Math.atan2(y1 - y0, x1 - x0)];
};
const subPath = (pts: P2[], L: number[], d0: number, d1: number) => {
  const out: P2[] = [];
  const a = ptAt(pts, L, d0);
  out.push([a[0], a[1]]);
  for (let i = 0; i < pts.length; i++) if (L[i] > d0 && L[i] < d1) out.push(pts[i]);
  const b = ptAt(pts, L, d1);
  out.push([b[0], b[1]]);
  return out;
};
const toD = (pts: P2[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
const WormBody: React.FC<{pts: P2[]; w: number}> = ({pts, w}) => {
  const d = toD(pts);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + w * 0.16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={BODY_COL} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={BODY_RING} strokeWidth={w * 0.82} strokeDasharray={`${w * 0.07} ${w * 0.42}`} strokeLinecap="butt" />
      <path d={d} fill="none" stroke="#FFD2D6" strokeWidth={w * 0.16} strokeLinecap="round" transform={`translate(0 ${-w * 0.22})`} opacity={0.8} />
    </g>
  );
};

// ---------- backdrop: the plate + flat extensions ----------
const Plate: React.FC = () => (
  <>
    <Svg x={0} y={0} r={6000}>
      <defs>
        <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9CD2F8" />
          <stop offset="0.45" stopColor="#A0D3F8" />
          <stop offset="1" stopColor="#A8D5F9" />
        </linearGradient>
      </defs>
      <rect x={-6000} y={-6000} width={12000} height={6000} fill="#9CD2F8" />
      <rect x={-6000} y={0} width={12000} height={445} fill="url(#skyg)" />
      <rect x={-6000} y={444} width={6000} height={44} fill="#687C59" />
      <rect x={1024} y={450} width={6000} height={38} fill="#667B58" />
      <rect x={-6000} y={442} width={6000} height={5} fill="#53664C" />
      <rect x={1024} y={448} width={6000} height={5} fill="#54694C" />
      <rect x={-6000} y={487} width={12000} height={6} fill="#020202" />
      <rect x={-6000} y={492} width={12000} height={210} fill={MUD} />
      <rect x={-6000} y={700} width={12000} height={6000} fill={MUD_D} />
    </Svg>
    <Img src={F('bg')} style={{position: 'absolute', left: 0, top: 0, width: SPR.bg.w, height: SPR.bg.h}} />
  </>
);
// light wave squiggles on the river surface (life on holds)
const Waves: React.FC<{t: number}> = ({t}) => (
  <Svg x={500} y={SURF}>
    {[0, 1, 2, 3, 4].map((i) => {
      const ph = (t * 0.18 + i * 0.21) % 1;
      const x = 200 + 600 * ((i * 0.37 + t * 0.03) % 1);
      const y = SURF + 30 + 90 * rnd(i + 3);
      const s = Math.sin(Math.PI * ph);
      return <path key={i} d={`M ${x - 40 * s} ${y} q ${10 * s} -8 ${20 * s} 0 t ${20 * s} 0 t ${20 * s} 0 t ${20 * s} 0`} fill="none" stroke={WATER_L} strokeWidth={5} strokeLinecap="round" opacity={0.9 * s} />;
    })}
  </Svg>
);
// the shaft on the left bank (always there)
const Shaft: React.FC = () => (
  <Svg x={-165} y={700}>
    <rect x={SH0} y={G + 2} width={SH1 - SH0} height={TY1 - G - 2} fill={HOLE} />
    <path d={`M ${SH0} ${G} L ${SH0} ${TY0} M ${SH1} ${G} L ${SH1} ${TY0}`} stroke={INK} strokeWidth={6} />
    {/* ladder */}
    <path d={`M ${SH0 + 22} ${G - 30} L ${SH0 + 22} ${TY1 - 10} M ${SH0 + 52} ${G - 30} L ${SH0 + 52} ${TY1 - 10}`} stroke="#9A7046" strokeWidth={7} />
    {Array.from({length: 11}, (_, i) => (
      <line key={i} x1={SH0 + 22} x2={SH0 + 52} y1={G - 18 + i * 32} y2={G - 18 + i * 32} stroke="#9A7046" strokeWidth={6} />
    ))}
    <path d={`M ${SH0 - 14} ${G} L ${SH1 + 14} ${G}`} stroke={INK} strokeWidth={6} />
  </Svg>
);
// brick tube from x0 to x1 (outer TY0..TY1), interior dark
const Bricks: React.FC<{x0: number; x1: number; lit?: number}> = ({x0, x1, lit = 0}) => {
  if (x1 <= x0 + 1) return null;
  const rows: React.ReactNode[] = [];
  const bw = 34;
  for (const [y0] of [
    [TY0, TY0 + BR],
    [TY1 - BR, TY1],
  ] as const) {
    for (let r = 0; r < 2; r++) {
      const yy = y0 + (r * BR) / 2;
      for (let x = Math.floor(x0 / bw) * bw - (r ? bw / 2 : 0); x < x1; x += bw) {
        const a = Math.max(x, x0);
        const b = Math.min(x + bw, x1);
        if (b > a) rows.push(<rect key={`${y0}-${r}-${x}`} x={a + 1.5} y={yy + 1.5} width={b - a - 3} height={BR / 2 - 3} fill={(Math.floor(x / bw) + r) % 3 === 0 ? BRICK_D : BRICK} />);
      }
    }
  }
  return (
    <g>
      <rect x={x0} y={TY0} width={x1 - x0} height={TY1 - TY0} fill="#E8D2B0" />
      <rect x={x0} y={TY0 + BR} width={x1 - x0} height={TY1 - TY0 - 2 * BR} fill={lit ? '#5A4636' : HOLE} />
      {rows}
      <path d={`M ${x0} ${TY0} L ${x1} ${TY0} M ${x0} ${TY1} L ${x1} ${TY1}`} stroke={INK} strokeWidth={5} />
      <path d={`M ${x0} ${TY0 + BR} L ${x1} ${TY0 + BR} M ${x0} ${TY1 - BR} L ${x1} ${TY1 - BR}`} stroke={INK} strokeWidth={3} />
    </g>
  );
};
// small tiny-clone of the hero (diggers, crew, bricklayers)
const Mini: React.FC<{x: number; y: number; h: number; rot?: number; flip?: boolean}> = ({x, y, h, rot = 0, flip}) => (
  <Spr n="hero" x={x} y={y} s={h / SPR.hero.h} rot={rot} flip={flip} />
);

// ---------- shots ----------
type Shot = 'A' | 'C' | 'D' | 'E';
const shotAt = (t: number): Shot => (t < CUT_C ? 'A' : t < CUT_D ? 'C' : t < CUT_E ? 'D' : 'E');

// plank close-up geometry
const PATH0 = SPR.plank.path.map((p) => [XP + p[0] * PS, p[1] * PS] as P2);
const PLANK_PATH: P2[] = [[XP - 700, PATH0[0][1]], [XP - 60, PATH0[0][1]], ...PATH0];
const PLANK_L = polyLen(PLANK_PATH);
const W_S = 0.36; // worm head scale in the plank
const W_BW = 52; // body width in the plank
const W_LEN = 520; // body length (world)
const headD = (t: number) => {
  // distance of the worm head along PLANK_PATH
  const d0 = 620; // enters the plank at ~ 9.3
  const d1 = PLANK_L[PLANK_L.length - 1] - 40;
  if (t < 9.05) return 450;
  // a quick dash in, then steady drilling with a small stop on "shell first"
  const a = lerp(450, d0 + 120, easeOutCubic(prog(t, 9.05, 9.6)));
  const b = lerp(0, d1 - d0 - 120, easeInOutCubic(prog(t, 9.6, 12.45)));
  return a + b;
};

// shield movement (E)
const shieldX = (t: number) => {
  const xs = (SH0 + SH1) / 2 + 12;
  if (t < T.diggers) return xs;
  return lerp(xs, 760, easeInOutCubic(prog(t, T.diggers, 17.1)));
};
const shieldY = (t: number) => {
  // bottom of the shield (feet) on the tunnel floor = TY1 - BR
  const floor = TY1 - BR + 2;
  const top = G - 260;
  if (t < T.iron) return top;
  const u = prog(t, T.iron, T.shell2 - 0.02);
  return lerp(top, floor, easeInCubic(u));
};

const camFor = (t: number): Cam => {
  const s = shotAt(t);
  if (s === 'A')
    return camAt(t, [
      CAM0,
      {t: 0.9, x: 195, y: 625, k: 1.72},
      {t: 2.6, ...WIDE},
      {t: 3.6, x: 440, y: 730, k: 1.06},
      {t: 4.9, x: 310, y: 720, k: 1.18},
      {t: 5.45, x: 250, y: 690, k: 1.3, ease: 'io'},
      {t: 6.3, x: 220, y: 680, k: 1.26},
    ]);
  if (s === 'C')
    return camAt(t, [
      {t: CUT_C, x: 70, y: 380, k: 2.35},
      {t: 8.3, x: 80, y: 380, k: 2.5},
      {t: 8.95, x: GUY_X + 30, y: 300, k: 4.3, ease: 'in'},
    ]);
  if (s === 'D') {
    const hx = ptAt(PLANK_PATH, PLANK_L, headD(t))[0];
    const k = lerp(0.86, 1.05, easeInOutCubic(prog(t, CUT_D, 9.7)));
    const half = 540 / k;
    const fx = clamp(hx + 90, XP + half - 20, XP + SPR.plank.w * PS - half + 20);
    const x = lerp(XP + SPR.plank.w / 2 - 60, fx, easeInOutCubic(prog(t, CUT_D, 9.7)));
    return {x, y: 250, k};
  }
  // E + F
  if (t < 17.15) {
    const sx = shieldX(t);
    return camAt(t, [
      {t: CUT_E, x: 170, y: 640, k: 1.1},
      {t: 13.7, x: 170, y: 650, k: 1.16},
      {t: 14.25, x: 170, y: 650, k: 1.16},
      {t: 14.85, x: sx + 70, y: 690, k: 2.2},
      {t: 15.0, x: sx + 70, y: 690, k: 2.2},
    ].map((kk) => (kk.t >= 14.85 && t >= 14.85 ? {...kk, x: shieldX(Math.max(t, 14.86)) + 70} : kk)));
  }
  return camAt(t, [
    {t: 17.15, x: shieldX(17.15) + 70, y: 690, k: 2.2},
    {t: 17.8, x: 400, y: 640, k: 1.02, ease: 'io'},
    {t: 18.55, x: 390, y: 640, k: 1.04},
    {t: DURATION, x: CAM0.x, y: CAM0.y, k: CAM0.k},
  ]);
};

// ---------- the scene ----------
export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const shot = shotAt(t);
  const lay: React.ReactNode[] = [];
  const top: React.ReactNode[] = [];
  let bgBlur = 0;

  if (shot === 'A' || shot === 'C' || shot === 'E') {
    bgBlur = cam.k > 2.0 ? clamp((cam.k - 2.0) * 1.6, 0, 2.6) : 0;
    lay.push(<Plate key="plate" />, <Waves key="waves" t={t} />, <Shaft key="shaft" />);
  }

  // ===== A + B: the plan, the mud, the flood =====
  if (shot === 'A') {
    // dashed plan tunnel, drawn left -> right on "tunnel", hidden when the old crew's tunnel appears
    const u = 0.22 + 0.78 * easeInOutCubic(prog(t, T.tunnel - 0.05, T.tunnel + 0.75));
    const planOut = 1 - prog(t, T.last - 0.1, T.last + 0.15);
    const xr = lerp(SH1, TX1, u);
    const crewT = t >= T.last;
    const wob = t > T.soft ? Math.sin(2 * Math.PI * 5.5 * (t - T.soft)) * Math.exp(-2.6 * (t - T.soft)) : 0;
    // the mud face
    const mudEyes = pop(t, T.mud, 0.3);
    const scared = t > T.flooded;
    const mx = 470;
    const my = 1090;
    const look: [number, number] = scared ? [-0.6, -0.7] : t > T.last ? [-0.7, -0.5] : [0, -0.3];
    // old tunnel + crew
    const oldX1 = 470;
    const flood = prog(t, T.flooded + 0.05, T.flooded + 0.45); // water fills the old tunnel right -> left
    const spout = prog(t, T.out - 0.05, T.out + 0.5);
    lay.push(
      <Svg key="a" x={400} y={800}>
        {u > 0 && planOut > 0 ? (
          <g opacity={planOut}>
            <clipPath id="planclip">
              <rect x={SH1 - 10} y={TY0 - 20} width={xr - SH1 + 10} height={TY1 - TY0 + 40} />
            </clipPath>
            <rect x={SH1 - 40} y={TY0 + 10} width={TX1 - SH1 + 40} height={TY1 - TY0 - 20} rx={40} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth={9} strokeDasharray="34 22" clipPath="url(#planclip)" transform={`translate(0 ${wob * 10})`} />
          </g>
        ) : null}
        {/* the mud's face */}
        {mudEyes > 0 ? (
          <g transform={`translate(${mx} ${my}) scale(${1 + 0.08 * wob}, ${1 - 0.1 * wob})`}>
            <Eye x={-70} y={0} r={48} open={mudEyes} look={look} side={-1} brow={scared ? 0.45 : 0.6} browTilt={scared ? 1 : 0} />
            <Eye x={70} y={0} r={48} open={mudEyes} look={look} side={1} brow={scared ? 0.45 : 0.6} browTilt={scared ? 1 : 0} />
            <path d={scared ? 'M -40 95 Q 0 60 40 95 Q 0 120 -40 95 Z' : `M -50 85 q 25 ${18 + 30 * wob} 50 0 q 25 ${-18 - 30 * wob} 50 0`} fill={scared ? '#3A2618' : 'none'} stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" transform={scared ? '' : 'translate(-25 0)'} />
          </g>
        ) : null}
        {/* jelly wobble lines on "soft" */}
        {t > T.soft && t < T.soft + 1.0
          ? [0, 1, 2].map((i) => {
              const s = Math.sin(Math.PI * prog(t, T.soft + i * 0.08, T.soft + 0.7 + i * 0.08));
              const y = 900 + i * 110;
              return <path key={i} d={`M ${180 + i * 40} ${y} q 60 ${-26 * s} 120 0 t 120 0 t 120 0`} fill="none" stroke="#B88B60" strokeWidth={8} strokeLinecap="round" opacity={s} />;
            })
          : null}
        {/* the last crew's tunnel */}
        {crewT ? (
          <g>
            <path d={`M ${SH1 - 2} ${TY0 + 20} L ${lerp(SH1, oldX1, pop(t, T.last, 0.35))} ${TY0 + 26} Q ${lerp(SH1, oldX1, pop(t, T.last, 0.35)) + 40} ${(TY0 + TY1) / 2} ${lerp(SH1, oldX1, pop(t, T.last, 0.35))} ${TY1 - 26} L ${SH1 - 2} ${TY1 - 20} Z`} fill={HOLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            {flood > 0 ? (
              <rect x={lerp(oldX1 + 30, SH0, flood)} y={TY0 + 22} width={oldX1 + 30 - lerp(oldX1 + 30, SH0, flood)} height={TY1 - TY0 - 44} fill={WATER} opacity={0.95} />
            ) : null}
            {flood > 0 ? <rect x={SH0} y={lerp(TY1, G - 4, prog(t, T.flooded + 0.25, T.out))} width={SH1 - SH0} height={TY1 - lerp(TY1, G - 4, prog(t, T.flooded + 0.25, T.out))} fill={WATER} /> : null}
            {/* the crack + the river pouring in */}
            {t > T.flooded ? (
              <g>
                <path d={`M 400 ${SPR.bg.bed[16][1] + 2} l -16 14 l 22 8 l -18 12 l 14 ${TY0 + 26 - SPR.bg.bed[16][1] - 36}`} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
                <rect x={384} y={SPR.bg.bed[16][1]} width={34 * clamp(prog(t, T.flooded, T.flooded + 0.12) * 1.4, 0, 1)} height={TY0 + 30 - SPR.bg.bed[16][1]} fill={WATER} stroke={INK} strokeWidth={4} opacity={1 - prog(t, 6.05, 6.25)} />
              </g>
            ) : null}
          </g>
        ) : null}
        {/* water spout out of the shaft on "out" */}
        {spout > 0 && spout < 1 ? (
          <g>
            <path d={`M ${SH0 + 20} ${G} C ${SH0 + 10} ${G - 200 * Math.sin(Math.PI * spout)} ${SH1 - 10} ${G - 200 * Math.sin(Math.PI * spout)} ${SH1 - 20} ${G} Z`} fill={WATER} stroke={INK} strokeWidth={5} />
            {[0, 1, 2, 3, 4].map((i) => {
              const a = -Math.PI / 2 + (i - 2) * 0.35;
              const r = 40 + 260 * spout;
              return <circle key={i} cx={-165 + Math.cos(a) * r * 0.7} cy={G - 120 * Math.sin(Math.PI * spout) + Math.sin(a) * r * 0.6 + 300 * spout * spout} r={12 * (1 - spout) + 4} fill={WATER_L} stroke={INK} strokeWidth={3} />;
            })}
          </g>
        ) : null}
      </Svg>,
    );
    // crew: 3 tiny diggers at the tunnel face, then washed out and launched from the shaft
    if (crewT) {
      for (let i = 0; i < 3; i++) {
        const h = 62;
        const digX = oldX1 - 40 - i * 46;
        const dig = Math.sin(2 * Math.PI * 3 * (t - T.crew) + i) * (t < T.flooded ? 1 : 0);
        const p0 = pop(t, T.last + 0.1 + i * 0.06, 0.25);
        if (t < T.flooded + 0.12) {
          lay.push(<Mini key={`c${i}`} x={digX} y={TY1 - 24} h={h * p0} rot={6 * dig} />);
        } else {
          // swept left to the shaft, then up out of it and away to the top-left
          const u1 = prog(t, T.flooded + 0.12, T.out - 0.02 + i * 0.03);
          const u2 = prog(t, T.out - 0.02 + i * 0.03, T.out + 0.7 + i * 0.03);
          let x = lerp(digX, -165 + (i - 1) * 30, easeInCubic(u1));
          let y = TY1 - 40;
          if (u2 > 0) {
            const vx = -260 - 120 * i;
            x = -165 + (i - 1) * 30 + vx * u2;
            y = lerp(TY1 - 40, G - 40, Math.min(1, u2 * 3)) - 900 * u2 + 700 * u2 * u2;
          }
          lay.push(<Mini key={`c${i}`} x={x} y={y} h={h} rot={u2 > 0 ? -540 * u2 * (i % 2 ? 1 : -1) : -20} />);
        }
      }
    }
    // the sign on the far bank
    const sg = pop(t, T.thames, 0.3);
    if (sg > 0)
      lay.push(
        <Svg key="sign" x={940} y={400}>
          <g transform={`translate(868 ${G}) scale(${0.78 * sg})`}>
            <rect x={-8} y={-150} width={16} height={150} fill="#9A7046" stroke={INK} strokeWidth={5} />
            <rect x={-118} y={-210} width={236} height={98} rx={10} fill="#C9935C" stroke={INK} strokeWidth={6} />
            <text x={0} y={-176} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#3A2618">RIVER</text>
            <text x={0} y={-132} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#3A2618">THAMES</text>
          </g>
        </Svg>,
      );
    // the guy: hero -> panic on "flooded"
    const n: GuyN = t < T.flooded ? 'hero' : 'panic';
    const sw = squashSwap(t, T.flooded);
    const hop = n === 'hero' ? 10 * bump(t, T.want - 0.05, 0.3) : 0;
    const tremble = n === 'panic' ? 2 * Math.sin(2 * Math.PI * 9 * t) : 0;
    top.push(<Guy key="guy" n={n} x={GUY_X + tremble} y={G - hop} sx={sw[0]} sy={sw[1] * breathe(t)} />);
    if (n === 'panic') {
      const ht = headTop('panic', GUY_X, G);
      top.push(
        <Svg key="sweat" x={ht.x} y={ht.y}>
          <SweatDrop x={ht.x - 50} y={ht.y + 40 + 30 * prog(t, T.flooded + 0.1, 6.3)} r={14} s={pop(t, T.flooded + 0.08, 0.2)} />
        </Svg>,
      );
    }
  }

  // ===== C: close on the guy with the plank =====
  if (shot === 'C') {
    const sw = squashSwap(t, CUT_C + 0.02);
    const tilt = 3 * Math.sin(2 * Math.PI * 0.5 * (t - CUT_C));
    top.push(<Guy key="guy" n="look" x={GUY_X} y={G} sx={1} sy={breathe(t) * (t < CUT_C + 0.3 ? sw[1] : 1)} rot={tilt * 0.3} />);
    // worm heads peeking out of the plank's holes on "holes"
    const s = guyScale('look');
    const pb = SPR.look.plankBox;
    const ox = GUY_X - SPR.look.feet[0] * s;
    const oy = G - SPR.look.feet[1] * s;
    const holes = [
      [0.3, 0.25],
      [0.66, 0.5],
      [0.38, 0.78],
    ];
    top.push(
      <Svg key="peek" x={ox} y={oy}>
        {holes.map(([fx, fy], i) => {
          const p = popOut(t, T.holes + i * 0.09, 8.88, 0.22);
          if (p <= 0) return null;
          const hx = ox + (pb[0] + (pb[2] - pb[0]) * fx) * s;
          const hy = oy + (pb[1] + (pb[3] - pb[1]) * fy) * s;
          return (
            <g key={i} transform={`translate(${hx} ${hy}) scale(${p})`}>
              <ellipse cx={0} cy={-4} rx={5} ry={6} fill={BODY_COL} stroke={INK} strokeWidth={1.6} />
              <path d="M -5.5 -8 Q 0 -15 5.5 -8 L 4 -5 Q 0 -9 -4 -5 Z" fill="#F4EEE4" stroke={INK} strokeWidth={1.4} />
              <circle cx={-2} cy={-3} r={1.1} fill={INK} />
              <circle cx={2} cy={-3} r={1.1} fill={INK} />
            </g>
          );
        })}
        <Mark x={headTop('look', GUY_X, G).x + 6} y={headTop('look', GUY_X, G).y - 32} size={52} s={pop(t, T.plank, 0.3)} text="?" />
      </Svg>,
    );
  }

  // ===== D: inside the plank: the shipworm drills shell-first, lining the walls behind it =====
  if (shot === 'D') {
    const hd = headD(t);
    const [hx, hy, ha] = ptAt(PLANK_PATH, PLANK_L, hd);
    const body = subPath(PLANK_PATH, PLANK_L, Math.max(0, hd - W_LEN), hd - 30);
    const nod = t > T.shell && t < T.first + 0.5 ? 0.18 * Math.sin(2 * Math.PI * 3 * (t - T.shell)) * (1 - prog(t, T.first, T.first + 0.5)) : 0;
    const smug = t > 12.45;
    const plankW = SPR.plank.w * PS;
    const plankH = SPR.plank.h * PS;
    // the plank: drilled part (left of the head) + undrilled copy (right of the head)
    lay.push(
      <div key="bgD" style={{position: 'absolute', left: XP - 2000, top: -2000, width: 6000, height: 6000, background: 'radial-gradient(circle at 50% 37%, #FFF3D6 0%, #F2DDB4 22%, #E2C795 45%)'}} />,
      <div key="plankA" style={{position: 'absolute', left: XP, top: 0, width: plankW, height: plankH, clipPath: `inset(0 ${Math.max(0, XP + plankW - hx)}px 0 0)`}}>
        <Img src={F('plank')} style={{width: plankW, height: plankH}} />
      </div>,
      <div key="plankB" style={{position: 'absolute', left: XP, top: 0, width: plankW, height: plankH, clipPath: `inset(0 0 0 ${clamp(hx - XP, 0, plankW)}px)`}}>
        <Img src={F('plankFilled')} style={{width: plankW, height: plankH}} />
      </div>,
    );
    // wood chips flying from the drilling head
    const chips: React.ReactNode[] = [];
    if (t > 9.3 && t < 12.45)
      for (let i = 0; i < 10; i++) {
        const ph = (t * 2.6 + i / 10) % 1;
        const a = ha + Math.PI + (rnd(i) - 0.5) * 2.2;
        const r = 30 + 150 * ph;
        chips.push(
          <rect
            key={i}
            x={hx + Math.cos(a) * r}
            y={hy + Math.sin(a) * r - 60 * ph + 120 * ph * ph}
            width={14}
            height={8}
            rx={2}
            fill="#C98A52"
            stroke={INK}
            strokeWidth={2.5}
            transform={`rotate(${360 * ph + 60 * i} ${hx + Math.cos(a) * r} ${hy + Math.sin(a) * r})`}
            opacity={Math.sin(Math.PI * ph)}
          />,
        );
      }
    // the lining sparkles behind the worm on "lining the walls"
    const sparks: React.ReactNode[] = [];
    if (t > T.lining - 0.05)
      for (let i = 0; i < 6; i++) {
        const t0 = T.lining + i * 0.18;
        const p = popOut(t, t0, t0 + 0.45, 0.2);
        const d = Math.max(200, headD(t0) - 160 - 40 * i);
        const [sx, sy] = ptAt(PLANK_PATH, PLANK_L, d);
        const side = i % 2 ? 1 : -1;
        sparks.push(<Sparkle key={i} x={sx} y={sy + side * 58} r={22} s={p} rot={20 * i} />);
      }
    lay.push(
      <Svg key="worm" x={XP + 700} y={250}>
        <WormBody pts={body} w={W_BW} />
        {chips}
        {sparks}
      </Svg>,
      <WormHead key="head" x={hx} y={hy} s={W_S} rot={ha + nod} eyes={{open: pop(t, 9.2, 0.3), lid: smug ? 0.45 : 0, look: smug ? [-0.3, 0.2] : [0.7, -0.1]}} />,
    );
    // "shell first": a glint on the shell
    const gl = popOut(t, T.shell + 0.05, T.first + 0.35, 0.2);
    if (gl > 0)
      top.push(
        <Svg key="glint" x={hx} y={hy}>
          <Sparkle x={hx + 40} y={hy - 70} r={34} s={gl} rot={15} />
        </Svg>,
      );
  }

  // ===== E + F: the shield crawls under the river; a train races through the finished tunnel =====
  if (shot === 'E') {
    const sx = shieldX(t);
    const sy = shieldY(t);
    const inShaft = t < T.shell2;
    const brickX1 = t < T.diggers ? SH1 : t < 17.15 ? sx - SH_W / 2 + 6 : TX1;
    const shieldGone = t > 17.2;
    const poofP = prog(t, 17.16, 17.6);
    lay.push(
      <Svg key="tube" x={400} y={750}>
        {/* the dug part ahead of the bricks (inside the shield's reach) */}
        {t >= T.diggers && !shieldGone ? <rect x={brickX1} y={TY0 + 6} width={Math.max(0, sx + SH_W / 2 - brickX1)} height={TY1 - TY0 - 12} fill={HOLE} /> : null}
        <Bricks x0={SH0} x1={brickX1} />
        {t > 17.15 ? <Bricks x0={SH0} x1={TX1} /> : null}
        {t > 17.15 ? <path d={`M ${TX1} ${TY0} Q ${TX1 + 40} ${(TY0 + TY1) / 2} ${TX1} ${TY1}`} fill={HOLE} stroke={INK} strokeWidth={5} /> : null}
      </Svg>,
    );
    // bricklayers right behind the shield
    if (t > T.bricklayers - 0.1 && !shieldGone) {
      for (let i = 0; i < 2; i++) {
        const p = pop(t, T.bricklayers + i * 0.1, 0.25);
        const bx = sx - SH_W / 2 - 34 - i * 52;
        const bob = 5 * Math.abs(Math.sin(2 * Math.PI * 2.2 * t + i));
        lay.push(<Mini key={`b${i}`} x={bx} y={TY1 - BR - bob} h={52 * p} flip />);
      }
      // bricks popping onto the wall right behind the shield
      lay.push(
        <Svg key="bp" x={sx} y={TY0}>
          {[0, 1, 2, 3].map((i) => {
            const ph = (t * 3 + i / 4) % 1;
            const s = Math.sin(Math.PI * ph);
            return <rect key={i} x={sx - SH_W / 2 - 40 - 20 * i} y={(i % 2 ? TY1 - BR : TY0) + 2 - 20 * s} width={30} height={BR / 2} fill={BRICK} stroke={INK} strokeWidth={2.5} opacity={s} />;
          })}
        </Svg>,
      );
    }
    if (!shieldGone) {
      // diggers in the three floors, facing right, stabbing on "diggers in front"
      const holes = SPR.shield.holes;
      const left = sx - SH_W / 2;
      const topY = sy - SH_H;
      const digs: React.ReactNode[] = [];
      holes.forEach((hb, i) => {
        const p = pop(t, T.shell2 + 0.15 + i * 0.08, 0.25);
        const stab = t > T.diggers - 0.05 ? Math.max(0, Math.sin(2 * Math.PI * 2.6 * (t - T.diggers) + i * 1.3)) : 0;
        const hh = (hb[3] - hb[1]) * SHS;
        digs.push(<Mini key={`d${i}`} x={left + hb[0] * SHS + (hb[2] - hb[0]) * SHS * 0.42 + 4 * stab} y={topY + hb[3] * SHS - 1} h={hh * 0.92 * p} rot={8 * stab} />);
      });
      lay.push(...digs);
      lay.push(
        <Spr key="shield" n="shield" x={sx} y={sy} s={SHS} ax={SPR.shield.w / 2} ay={SPR.shield.feet[1]} sx={1 + 0.05 * spring(t - T.shell2, 4, 7) * (t > T.shell2 ? 1 : 0)} sy={1 - 0.07 * spring(t - T.shell2, 4, 7) * (t > T.shell2 ? 1 : 0)} />,
      );
      // dirt flying off the face
      if (t > T.diggers && t < 17.1) {
        const bits: React.ReactNode[] = [];
        for (let i = 0; i < 8; i++) {
          const ph = (t * 2.2 + i / 8) % 1;
          const bx = sx + SH_W / 2 + 6 + 60 * ph;
          const by = TY0 + 30 + 120 * rnd(i) - 50 * ph + 120 * ph * ph;
          bits.push(<circle key={i} cx={bx} cy={by} r={6 * Math.sin(Math.PI * ph) + 1} fill="#6B4A31" stroke={INK} strokeWidth={2} />);
        }
        lay.push(
          <Svg key="dirt" x={sx} y={TY0}>
            {bits}
          </Svg>,
        );
      }
      // drop dust when it lands
      const dust = prog(t, T.shell2, T.shell2 + 0.5);
      if (dust > 0 && dust < 1) {
        const puffs: Puff[] = [-1, -0.5, 0, 0.5, 1].map((f, i) => ({x: sx + f * (60 + 50 * dust), y: TY1 - BR - 10 - 10 * dust, r: (16 + 8 * (i % 2)) * Math.sin(Math.PI * dust)}));
        lay.push(
          <Svg key="dust" x={sx} y={TY1}>
            <PuffCluster puffs={puffs} fill="#C9A97F" ink={3} />
          </Svg>,
        );
      }
    } else if (poofP < 1) {
      const s = Math.sin(Math.PI * poofP);
      const puffs: Puff[] = [0, 1, 2, 3, 4, 5].map((i) => ({x: shieldX(17.15) + 70 * Math.cos(i * 1.05) * (0.6 + poofP), y: TY0 + 80 + 50 * Math.sin(i * 1.05) * (0.6 + poofP), r: 46 * s}));
      puffs.push({x: shieldX(17.15), y: TY0 + 80, r: 60 * s});
      lay.push(
        <Svg key="poof" x={700} y={TY0}>
          <PuffCluster puffs={puffs} fill="#fff" ink={5} />
        </Svg>,
      );
    }
    void inShaft;
    // the train through the finished tunnel
    if (t > 17.6) {
      const u = prog(t, 17.75, 19.0);
      const tx = lerp(-650, 1700, easeInCubic(Math.min(1, u * 1.05)) * 0.35 + u * 0.65);
      const tw = SPR.train.w * TRS;
      lay.push(
        <div key="train" style={{position: 'absolute', left: SH0, top: TY0 + BR, width: TX1 - SH0, height: TY1 - TY0 - 2 * BR, overflow: 'hidden'}}>
          <Spr n="train" x={tx - SH0} y={TY1 - TY0 - 2 * BR - 4} s={TRS} ax={SPR.train.right - 0} ay={SPR.train.bottom} />
          {/* second car: the body part of the same picture (no nose), coupled behind */}
          <div style={{position: 'absolute', left: tx - SH0 - SPR.train.right * TRS + SPR.train.left * TRS - CAR2 * TRS + 6, top: TY1 - TY0 - 2 * BR - 4 - SPR.train.bottom * TRS, width: CAR2 * TRS, height: SPR.train.h * TRS, overflow: 'hidden'}}>
            <Img src={F('train')} style={{position: 'absolute', left: -SPR.train.left * TRS, top: 0, width: tw, height: SPR.train.h * TRS}} />
          </div>
        </div>,
      );
      // speed lines behind the train
      lay.push(
        <Svg key="spd" x={400} y={745}>
          {[0, 1, 2].map((i) => {
            const x = tx - SPR.train.right * TRS - tw - CAR2 * TRS - 40 - 70 * i;
            return x > SH0 && t < 19.05 ? <line key={i} x1={x} x2={x - 120} y1={700 + 40 * i} y2={700 + 40 * i} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.8} /> : null;
          })}
        </Svg>,
      );
    }
    // the guy: point on "build", cheer on "Trains"; the worm rides on his head
    const n: GuyN = t < T.build ? 'hero' : t < T.trains + 0.1 ? 'point' : 'cheer';
    const sw = n === 'point' ? squashSwap(t, T.build) : squashSwap(t, T.trains + 0.1);
    const hop = n === 'cheer' ? 26 * Math.abs(Math.sin(2 * Math.PI * 1.6 * (t - T.trains - 0.1))) : 0;
    top.push(<Guy key="guy" n={n} x={GUY_X} y={G - hop} sx={sw[0]} sy={sw[1] * breathe(t)} />);
    const ht = headTop(n, GUY_X, G - hop);
    const wp = pop(t, 13.0, 0.3);
    if (wp > 0) {
      const ws = 0.11;
      const wave = n === 'cheer' ? 6 * Math.sin(2 * Math.PI * 3 * t) : 0;
      top.push(
        <div key="wormOnHead" style={{position: 'absolute', left: ht.x, top: ht.y + 10, transform: `scale(${wp}) rotate(${-4 + wave}deg)`, transformOrigin: '0 0'}}>
          <Spr n="worm" x={0} y={0} s={ws} ax={SPR.worm.w * 0.52} ay={SPR.worm.bottom - 30} />
          <svg style={{position: 'absolute', left: -200, top: -200, overflow: 'visible'}} width={400} height={400} viewBox="-200 -200 400 400">
            <Eye x={SPR.worm.w * 0.52 * -0 + (SPR.worm.shell[0] - SPR.worm.w * 0.52) * ws - 10} y={-(SPR.worm.bottom - 30 - SPR.worm.shell[1]) * ws - 13} r={9} open={1} side={-1} brow={NaN} look={[0.5, -0.2]} lid={n === 'cheer' ? 0 : 0.2} />
            <Eye x={(SPR.worm.shell[0] - SPR.worm.w * 0.52) * ws + 4} y={-(SPR.worm.bottom - 30 - SPR.worm.shell[1]) * ws - 15} r={9} open={1} side={1} brow={NaN} look={[0.5, -0.2]} lid={n === 'cheer' ? 0 : 0.2} />
          </svg>
        </div>,
      );
    }
    if (n === 'point') {
      top.push(
        <Svg key="clang" x={-165} y={G}>
          <Mark x={-165 + 120} y={TY0 - 50} size={58} s={popOut(t, T.shell2, T.shell2 + 0.6, 0.18)} rot={-8} text="CLANG" fill="#FFD23F" />
        </Svg>,
      );
    }
    if (n === 'cheer') {
      top.push(
        <Svg key="yay" x={GUY_X} y={G}>
          <Mark x={GUY_X + 150} y={G - 250} size={64} s={pop(t, T.trains + 0.15, 0.3) * (1 - prog(t, 19.0, 19.35))} rot={8} text="YES!" fill="#FFD23F" />
        </Svg>,
      );
    }
  }

  return (
    <>
      <World cam={cam} blur={bgBlur}>
        {lay}
      </World>
      <World cam={cam}>{top}</World>
      {cover ? null : null}
    </>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'whoosh', at: T.tunnel - 0.05, db: -29},
  {f: 'pop', at: T.thames, db: -20},
  {f: 'squeeze', at: T.mud, db: -20},
  {f: 'boing', at: T.soft, db: -19},
  {f: 'pop', at: T.last + 0.1, db: -22, rate: 1.1},
  {f: 'dig', at: T.crew, db: -22},
  {f: 'dig', at: T.crew + 0.2, db: -23, rate: 1.1},
  {f: 'rock_crack', at: T.flooded, db: -17},
  {f: 'flood', at: T.flooded + 0.05, db: -17, keys: [[5.6, -17], [6.2, -21], [6.4, -60]]},
  {f: 'zip', at: T.out - 0.2, db: -24},
  {f: 'pop', at: T.holes, db: -21},
  {f: 'pop', at: T.holes + 0.09, db: -22, rate: 1.15},
  {f: 'pop', at: T.holes + 0.18, db: -22, rate: 1.3},
  {f: 'whoosh', at: CUT_D - 0.14, db: -29},
  {f: 'munch', at: 9.55, db: -21},
  {f: 'munch', at: 10.05, db: -23, rate: 1.1},
  {f: 'knock', at: T.shell + 0.05, db: -19},
  {f: 'munch', at: 11.0, db: -23},
  {f: 'clink', at: T.lining + 0.05, db: -24},
  {f: 'munch', at: 11.95, db: -24, rate: 0.95},
  {f: 'pop', at: T.build, db: -22},
  {f: 'whoosh', at: T.iron - 0.05, db: -27, rate: 0.85},
  {f: 'stamp', at: T.shell2, db: -14},
  {f: 'bell', at: T.shell2, db: -27, dur: 0.6},
  {f: 'dig', at: T.diggers + 0.05, db: -22},
  {f: 'dig', at: T.diggers + 0.42, db: -23, rate: 1.1},
  {f: 'dig', at: T.front + 0.1, db: -23},
  {f: 'knock', at: T.bricklayers + 0.1, db: -25, rate: 1.3},
  {f: 'knock', at: T.bricklayers + 0.4, db: -25, rate: 1.4},
  {f: 'knock', at: T.behind2, db: -25, rate: 1.3},
  {f: 'pop', at: 17.18, db: -22},
  {f: 'train_rush', at: 17.72, db: -13, keys: [[17.72, -13], [19.0, -16], [19.3, -50]]},
];

export const ShipwormTunnelShort: React.FC = () => {
  useWormFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let cam = camFor(t);
  let amp = 0;
  if (t > T.flooded && t < CUT_C) amp += 7 * (1 - prog(t, 5.7, 6.25));
  if (t > T.shell2) amp += 9 * Math.exp(-7 * (t - T.shell2));
  if (t > 17.75 && t < 19.1) amp += 3 * Math.sin(Math.PI * prog(t, 17.75, 19.1));
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('shipworm-tunnel/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="shipworm-tunnel/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export {camFor, shotAt};
