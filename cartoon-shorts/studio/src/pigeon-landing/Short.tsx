import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as PIGEON_DURATION, FPS as PIGEON_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why can't birds land without flapping?" - a lazy pigeon wants to land on your hand without one flap. Just glide in?
// But a glide needs speed, so it would smack into you. Unless it swoops up from below and the climb eats the speed.
// Engineers did the math: over twice its normal speed, a 60 m swoop and a 20 m climb. For one crumb. So it flaps - in
// your face. Facts: University of Manchester, 2 Nov 2026, on Rottier, Lavoie & Parslew, Proc. R. Soc. A 482: 20260103,
// doi 10.1098/rspa.2026.0103 (pigeon-sized bird: > 2x cruising speed, ~60 m horizontally, ~20 m climb for a zero-speed
// unpowered touchdown; most birds flap as they land; flapping slows them within the space available).

const F = (n: string) => staticFile(`pigeon-landing/${n}.png`);
export const FONT = 'PIGInter';
export const usePigeonFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -2.5;
const INK = '#000';
const SKY = '#B6DDF3';
const WALL = '#E08E6D';
const WALL_SH = '#C9785A';
const CAP = '#F3B08F';
const WIN = '#6E8FB5';
const WIN_HI = '#A9C6E6';
const CRUMB = '#D9A55A';
const CRUMB_SH = '#B5843E';
const RED = '#E8302A';
const YEL = '#FFE45C';
const BP = '#2E62A8';
const BP_GRID = '#4A7DC0';
const FEATHER = '#B9C0C9';

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
const bump = (t: number, t0: number, d = 0.3, a = 0.08) => (t > t0 && t < t0 + d ? 1 + a * Math.pow(Math.sin((Math.PI * (t - t0)) / d), 2) : 1);
const bez = (p: number[][], u: number): [number, number] => {
  const v = 1 - u;
  const b = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [b.reduce((s, w, i) => s + w * p[i][0], 0), b.reduce((s, w, i) => s + w * p[i][1], 0)];
};

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; head?: [number, number, number]; eyes?: number[][]; bottom: number; left: number; right: number; top: number; palm?: [number, number]};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

// a cut-out sprite anchored at (ax, ay) (native px), placed at (x, y), s = world px per native px
const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; opacity?: number}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  opacity = 1,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity}}>
      <Img src={F(n)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 6000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string; stroke?: string; bg?: string}> = ({
  x,
  y,
  text,
  size,
  s,
  rot = 0,
  fill = '#fff',
  stroke = '#000',
  bg,
}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: fill,
        WebkitTextStroke: stroke && !bg ? `${size * 0.18}px ${stroke}` : undefined,
        paintOrder: 'stroke fill',
        background: bg,
        border: bg ? `${size * 0.1}px solid #000` : undefined,
        borderRadius: bg ? size * 0.25 : undefined,
        padding: bg ? `${size * 0.14}px ${size * 0.3}px ${size * 0.1}px` : undefined,
      }}
    >
      {text}
    </div>
  );

// ======================================================================================================
// THE WORLD (world px = screen px at camera k = 1, camera centre at screen (540, 960))
// ======================================================================================================
const ROOF_Y = 1330; // top of the roof cap where the guy stands
const WALL_X = 560; // left wall of the building (the cap sticks out to 525)
// far layer: the ElevenLabs city plate, depth 1.6, PSC layer px per native px
const DEPTH_BG = 1.6;
const PSC = 1.6;
const PL = S('plate') as unknown as {w: number; h: number; padX: number};
const PX0 = 560 - (PL.w / 2) * PSC;
const PY0 = 272; // the far skyline sits a little below our roof line: we are high up

// the guy ("you"): every pose scaled so the head disc has the same radius (HR)
const HR = 149;
type Pose = 'hero' | 'shrug' | 'hit' | 'shield';
const gS = (p: string) => HR / (S(p).hd as [number, number, number])[2];
const FEET: Record<Pose, [number, number]> = {hero: [800, ROOF_Y], shrug: [760.6, ROOF_Y], hit: [625, ROOF_Y], shield: [648, ROOF_Y]};
const toW = (p: Pose, nx: number, ny: number): [number, number] => {
  const sp = S(p);
  const s = gS(p);
  return [FEET[p][0] + (nx - sp.feet[0]) * s, FEET[p][1] + (ny - sp.feet[1]) * s];
};
const PALM = toW('hero', 80, 516); // the crumb on the held-out hand
const PALM_SHRUG = toW('shrug', 55, 222);
const FACE = toW('hero', 430, 300); // where the pigeon smacks in
const HEAD_TOP = toW('shield', 249, 18); // where the pigeon sits at the end

// the pigeon: every sprite scaled so its head has radius PR; flight sprites anchored at the head centre
const PR = 38;
const pS = (n: string) => PR / (S(n).head as [number, number, number])[2];
const HEADXY = (n: string): [number, number] => [(S(n).head as number[])[0], (S(n).head as number[])[1]];
const BEAK: Record<string, [number, number]> = {p_glide: [482, 172], p_flapUp: [522, 292], p_flapDown: [506, 118], p_happy: [405, 108], p_deadpan: [345, 132]};

// ---------- story times ----------
const SMACK = T.smack;
const FALL0 = SMACK + 0.3;
const REW0 = 8.36; // the rewind (in the pause after "you")
const POOF = 8.62;
const DIVE0 = 9.25;
const DIVE1 = 10.36;
const LAND = T.speed2; // zero-speed touchdown on the hand
const SIT = LAND + 0.16;
const ENG0 = T.engineers - 0.08;
const BP0 = T.math - 0.06;
const BP_UP = 19.8;
const CUT_CU = 19.86;
const FLAP0 = T.so3 + 0.06;
const FACE0 = T.right2 + 0.02;
const HAPPY = 23.56;

// ---------- the camera ----------
const CAM: CamKey[] = [
  {t: 0, x: 505, y: 955, k: 0.9},
  {t: 3.55, x: 512, y: 950, k: 0.96},
  {t: T.but, x: 515, y: 950, k: 0.96},
  {t: T.but + 0.5, x: 520, y: 930, k: 1.02, ease: 'out'},
  {t: T.unless + 0.15, x: 520, y: 930, k: 1.02},
  {t: 10.2, x: 450, y: 1480, k: 0.62},
  {t: 10.5, x: 455, y: 1495, k: 0.62},
  {t: 12.3, x: 520, y: 960, k: 0.95},
  {t: 13.0, x: 525, y: 950, k: 1.0},
  {t: BP0 + 0.1, x: 528, y: 640, k: 1.0},
  {t: CUT_CU, x: 534, y: 628, k: 1.03},
  {t: CUT_CU, x: 572, y: 850, k: 1.5, ease: 'cut'},
  {t: T.so3, x: 560, y: 862, k: 1.66},
  {t: FLAP0 + 0.95, x: 640, y: 820, k: 1.25},
  {t: DURATION, x: 648, y: 808, k: 1.3},
];

// ---------- the pigeon's flight ----------
type PState = {n: string; x: number; y: number; rot: number; speed: number; anchor: 'head' | 'feet'; sx?: number; sy?: number; show: boolean};
const GLIDE_A: [number, number] = [190, 828];
const GLIDE_B: [number, number] = [292, 850];
const HIT_HEAD: [number, number] = [FACE[0] - 52, FACE[1] - 18];
const DIVE = [
  [-420, 160],
  [-360, 1000],
  [-170, 2050],
  [110, 2470],
];
const LAND_FEET: [number, number] = [528, PALM[1] + 9];
const brakeHeadOff = (): [number, number] => {
  const s = pS('p_brake');
  const [hx, hy] = HEADXY('p_brake');
  return [(hx - 400) * s, (hy - 392) * s]; // head relative to the front toes
};
const CLIMB = (() => {
  const o = brakeHeadOff();
  return [
    [110, 2470],
    [400, 2620],
    [470, 1650],
    [LAND_FEET[0] + o[0], LAND_FEET[1] + o[1]],
  ];
})();
const angDeg = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI;

const pigeonAt = (t: number): PState => {
  // 1) lazy glide toward the hand, then the fast glide into the face
  if (t < SMACK) {
    if (t < T.but) {
      const u = t / T.but;
      return {n: 'p_glide', x: lerp(GLIDE_A[0], GLIDE_B[0], u), y: lerp(GLIDE_A[1], GLIDE_B[1], u) + 7 * Math.sin(2 * Math.PI * 0.45 * t), rot: 2 + 1.5 * Math.sin(2 * Math.PI * 0.45 * t + 1), speed: 0.15, anchor: 'head', show: true};
    }
    const u = Math.pow(prog(t, T.but, SMACK), 2.3);
    const x = lerp(GLIDE_B[0], HIT_HEAD[0], u);
    const y = lerp(GLIDE_B[1], HIT_HEAD[1], u);
    return {n: 'p_glide', x, y, rot: lerp(2, -3, u), speed: 0.2 + 0.8 * u, anchor: 'head', show: true};
  }
  // 2) smack: stuck on the face, then falls off the roof
  if (t < REW0) {
    if (t < FALL0) {
      const sq = 1 - 0.12 * Math.exp(-14 * (t - SMACK)) * Math.cos(30 * (t - SMACK));
      return {n: 'p_smack', x: HIT_HEAD[0] + 22, y: HIT_HEAD[1] + 8, rot: 0, speed: 0, anchor: 'head', sx: 2 - sq, sy: sq, show: true};
    }
    const tau = t - FALL0;
    return {n: 'p_smack', x: HIT_HEAD[0] + 22 - 210 * tau, y: HIT_HEAD[1] + 8 + 0.5 * 2600 * tau * tau, rot: -260 * tau, speed: 0, anchor: 'head', show: true};
  }
  // 3) rewind: zips back up and out (in reverse)
  if (t < DIVE0) {
    const tau = FALL0 + 0.42 - 2.2 * (t - REW0); // played backwards, fast
    if (t > REW0 + 0.25) return {n: 'p_smack', x: 0, y: 0, rot: 0, speed: 0, anchor: 'head', show: false};
    const tt = Math.max(0, tau - FALL0);
    return {n: 'p_smack', x: HIT_HEAD[0] + 22 - 210 * tt - 900 * (t - REW0), y: HIT_HEAD[1] + 8 + 0.5 * 2600 * tt * tt - 1400 * (t - REW0), rot: -260 * tt, speed: 0, anchor: 'head', show: true};
  }
  // 4) the dive from above-left, then the swoop and the climb that eats the speed
  if (t < DIVE1) {
    const u = Math.pow(prog(t, DIVE0, DIVE1), 1.7);
    const [x, y] = bez(DIVE, u);
    const [x2, y2] = bez(DIVE, Math.min(1, u + 0.01));
    return {n: 'p_dive', x, y, rot: angDeg(x2 - x, y2 - y) - 45, speed: 0.55 + 0.45 * u, anchor: 'head', show: true};
  }
  if (t < LAND) {
    const r = prog(t, DIVE1, LAND);
    const u = easeOutCubic(r);
    const [x, y] = bez(CLIMB, u);
    const [x2, y2] = bez(CLIMB, Math.min(1, u + 0.01));
    const a = angDeg(x2 - x, y2 - y);
    const speed = 1 - u;
    if (r < 0.62) return {n: 'p_glide', x, y, rot: clamp(a, -80, 40), speed, anchor: 'head', show: true};
    return {n: 'p_brake', x, y, rot: clamp(a + 90, -28, 28) * (1 - prog(r, 0.75, 1)), speed, anchor: 'head', show: true};
  }
  // 5) standing on the hand (deadpan) through the math and "for one crumb"
  if (t < FLAP0) {
    const sq = t < SIT ? 1 : 1 + 0.05 * spring(t - SIT, 3, 6);
    if (t < SIT) {
      const o = brakeHeadOff();
      return {n: 'p_brake', x: LAND_FEET[0] + o[0], y: LAND_FEET[1] + o[1], rot: 0, speed: 0, anchor: 'head', show: true};
    }
    return {n: 'p_deadpan', x: LAND_FEET[0], y: LAND_FEET[1], rot: 0, speed: 0, anchor: 'feet', sx: 2 - sq, sy: sq, show: true};
  }
  // 6) flaps up and into your face, then sits on your head
  const flapN = Math.floor((t - FLAP0) * 13) % 2 === 0 ? 'p_flapDown' : 'p_flapUp';
  const dpHead: [number, number] = (() => {
    const s = pS('p_deadpan');
    const [hx, hy] = HEADXY('p_deadpan');
    return [LAND_FEET[0] + (hx - S('p_deadpan').feet[0]) * s, LAND_FEET[1] + (hy - S('p_deadpan').feet[1]) * s];
  })();
  if (t < FACE0) {
    const u = easeInOutCubic(prog(t, FLAP0, FACE0));
    return {n: flapN, x: lerp(dpHead[0], 600, u), y: lerp(dpHead[1], 700, u) - 40 * Math.sin(Math.PI * u) + 6 * Math.sin(2 * Math.PI * 6.5 * t), rot: -4, speed: 0, anchor: 'head', show: true};
  }
  if (t < HAPPY) {
    const u = easeOutCubic(prog(t, FACE0, FACE0 + 0.35));
    const jx = 14 * Math.sin(2 * Math.PI * 4.1 * t) + 8 * Math.sin(2 * Math.PI * 7.3 * t);
    const jy = 10 * Math.sin(2 * Math.PI * 5.2 * t + 1);
    return {n: flapN, x: lerp(600, 668, u) + jx, y: lerp(700, 735, u) + jy, rot: -6 + 5 * Math.sin(2 * Math.PI * 3 * t), speed: 0, anchor: 'head', show: true};
  }
  const sq = 1 + 0.08 * spring(t - HAPPY, 3, 5);
  return {n: 'p_happy', x: HEAD_TOP[0] + 6, y: HEAD_TOP[1] + 16, rot: 0, speed: 0, anchor: 'feet', sx: 2 - sq, sy: sq, show: true};
};

const PigeonSprite: React.FC<{p: PState}> = ({p}) => {
  if (!p.show) return null;
  const sp = S(p.n);
  const [ax, ay] = p.anchor === 'head' ? HEADXY(p.n) : sp.feet;
  return <Spr n={p.n} x={p.x} y={p.y} s={pS(p.n)} ax={ax} ay={ay} rot={p.rot} sx={p.sx ?? 1} sy={p.sy ?? 1} />;
};
const beakOf = (p: PState): [number, number] => {
  const b = BEAK[p.n] ?? HEADXY(p.n);
  const [ax, ay] = p.anchor === 'head' ? HEADXY(p.n) : S(p.n).feet;
  const s = pS(p.n);
  const dx = (b[0] - ax) * s;
  const dy = (b[1] - ay) * s;
  const r = (p.rot * Math.PI) / 180;
  return [p.x + dx * Math.cos(r) - dy * Math.sin(r), p.y + dx * Math.sin(r) + dy * Math.cos(r)];
};

// ---------- small code-drawn things ----------
const Crumb: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M -17 4 C -19 -8 -8 -14 2 -12 C 12 -15 20 -6 18 3 C 19 11 8 14 -2 12 C -11 14 -18 11 -17 4 Z" fill={CRUMB} stroke={INK} strokeWidth={4} />
      <path d="M -10 6 C -4 10 6 10 12 5" fill="none" stroke={CRUMB_SH} strokeWidth={4} strokeLinecap="round" />
      <circle cx={-4} cy={-3} r={2.2} fill={CRUMB_SH} />
      <circle cx={7} cy={-5} r={1.8} fill={CRUMB_SH} />
    </g>
  );

type Fe = {t0: number; x: number; y: number; vx: number; vy: number; ph: number};
const feathersFrom = (seed: number, t0: number, x: number, y: number, n: number, spread = 1): Fe[] =>
  Array.from({length: n}, (_, i) => {
    const a = rnd(seed + i * 3.1) * Math.PI * 2;
    const v = (260 + 420 * rnd(seed + i * 7.7)) * spread;
    return {t0: t0 + 0.02 * rnd(seed + i), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, ph: rnd(seed + i * 1.9) * 6.28};
  });
const FEATHERS: Fe[] = [
  ...feathersFrom(11, SMACK, FACE[0] - 10, FACE[1], 12, 1.1),
  ...Array.from({length: 14}, (_, i) => feathersFrom(40 + i, FLAP0 + 0.1 + i * 0.13, 0, 0, 1, 0.6)[0]),
  ...feathersFrom(91, T.face, FACE[0] - 30, FACE[1] - 30, 10, 1.0),
];
const Feather: React.FC<{f: Fe; t: number; origin?: [number, number]}> = ({f, t, origin}) => {
  const tau = t - f.t0;
  if (tau < 0 || tau > 2.2) return null;
  const ox = origin ? origin[0] : f.x;
  const oy = origin ? origin[1] : f.y;
  const d = (1 - Math.exp(-2.6 * tau)) / 2.6;
  const x = ox + f.vx * d + 22 * Math.sin(3.1 * tau + f.ph);
  const y = oy + f.vy * d + 110 * tau;
  const rot = (f.ph * 57) % 360 + 40 * Math.sin(2.4 * tau + f.ph);
  const s = Math.min(1, tau / 0.08) * (tau > 1.7 ? Math.max(0, 1 - (tau - 1.7) / 0.5) : 1);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M -22 0 C -12 -10 10 -10 22 0 C 10 9 -12 9 -22 0 Z" fill={FEATHER} stroke={INK} strokeWidth={3.5} />
      <line x1={-24} y1={0} x2={18} y2={0} stroke="#7F8895" strokeWidth={2.5} />
    </g>
  );
};

const ImpactStar: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  if (s <= 0.001) return null;
  const pts = Array.from({length: 20}, (_, i) => {
    const r = i % 2 === 0 ? 120 : 58;
    const a = (i / 20) * Math.PI * 2 + 0.2;
    return `${x + Math.cos(a) * r * s},${y + Math.sin(a) * r * s}`;
  }).join(' ');
  return <polygon points={pts} fill={YEL} stroke={INK} strokeWidth={8} strokeLinejoin="round" />;
};

const NoFlapSign: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={74} fill="#fff" stroke={INK} strokeWidth={30} />
      <circle r={74} fill="none" stroke={RED} strokeWidth={20} />
      {/* a simple flapping wing */}
      <path d="M -40 22 C -36 -18 -6 -46 34 -44 C 22 -34 30 -26 18 -18 C 30 -14 22 -4 10 -2 C 20 4 10 14 -2 14 C 6 22 -10 30 -40 22 Z" fill={FEATHER} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -28 -6 C -12 -16 4 -22 22 -30" fill="none" stroke="#7F8895" strokeWidth={4} />
      <line x1={-52} y1={-52} x2={52} y2={52} stroke={INK} strokeWidth={30} strokeLinecap="round" />
      <line x1={-52} y1={-52} x2={52} y2={52} stroke={RED} strokeWidth={18} strokeLinecap="round" />
    </g>
  );

// speed gauge (screen space)
const Gauge: React.FC<{x: number; y: number; s: number; v: number; shakeA?: number}> = ({x, y, s, v, shakeA = 0}) => {
  if (s <= 0.001) return null;
  const R = 112;
  const arc = (a0: number, a1: number, col: string) => {
    const p0 = [Math.cos(a0) * (R - 24), Math.sin(a0) * (R - 24)];
    const p1 = [Math.cos(a1) * (R - 24), Math.sin(a1) * (R - 24)];
    return <path d={`M ${p0[0]} ${p0[1]} A ${R - 24} ${R - 24} 0 0 1 ${p1[0]} ${p1[1]}`} fill="none" stroke={col} strokeWidth={22} />;
  };
  const A0 = Math.PI * 0.8;
  const A1 = Math.PI * 2.2;
  const a = lerp(A0, A1, clamp(v)) + shakeA;
  return (
    <svg style={{position: 'absolute', left: x - 160, top: y - 160, overflow: 'visible'}} width={320} height={320} viewBox="-160 -160 320 320">
      <g transform={`scale(${s})`}>
        <circle r={R} fill="#fff" stroke={INK} strokeWidth={10} />
        {arc(A0, lerp(A0, A1, 0.45), '#6CC24A')}
        {arc(lerp(A0, A1, 0.45), lerp(A0, A1, 0.72), '#FFD23F')}
        {arc(lerp(A0, A1, 0.72), A1, RED)}
        <line x1={0} y1={0} x2={Math.cos(a) * (R - 18)} y2={Math.sin(a) * (R - 18)} stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <circle r={16} fill={INK} />
      </g>
    </svg>
  );
};

// ---------- the building (code, flat cartoon) ----------
const Building: React.FC = () => {
  const wins: React.ReactNode[] = [];
  for (let j = 0; j < 10; j++)
    for (let i = 0; i < 9; i++) {
      const x = 640 + i * 235;
      const y = ROOF_Y + 165 + j * 300;
      wins.push(
        <g key={`${i}-${j}`}>
          <rect x={x} y={y} width={140} height={170} rx={8} fill={WIN} stroke={INK} strokeWidth={7} />
          <polygon points={`${x + 18},${y + 150} ${x + 70},${y + 20} ${x + 100},${y + 20} ${x + 48},${y + 150}`} fill={WIN_HI} />
          <rect x={x - 10} y={y + 170} width={160} height={18} rx={4} fill={CAP} stroke={INK} strokeWidth={6} />
        </g>,
      );
    }
  return (
    <Svg>
      <rect x={WALL_X} y={ROOF_Y + 30} width={2800} height={3600} fill={WALL} stroke={INK} strokeWidth={8} />
      <rect x={WALL_X + 4} y={ROOF_Y + 34} width={40} height={3590} fill={WALL_SH} />
      {wins}
      <rect x={525} y={ROOF_Y - 4} width={2900} height={44} rx={6} fill={CAP} stroke={INK} strokeWidth={8} />
    </Svg>
  );
};

// ---------- the blueprint the engineer draws (screen space, local coords 0..1040 x 0..640) ----------
const BPX = 20;
const BPY = 330;
const BPW = 1040;
const BPH = 640;
const B_GROUND = 560;
const B_BLD = {x0: 760, x1: 860, top: 310};
const B_END: [number, number] = [776, 292];
const B_START: [number, number] = [60, 540];
const B_PATH = [B_START, [470, 552], [740, 520], B_END];
const Blueprint: React.FC<{t: number}> = ({t}) => {
  let h = 0;
  if (t >= BP0 && t < BP_UP) h = easeOutCubic(prog(t, BP0, BP0 + 0.42));
  else if (t >= BP_UP) h = 1 - easeInCubic(prog(t, BP_UP, BP_UP + 0.28));
  if (h <= 0.001) return null;
  const H = BPH * h;
  const grow60 = easeInOutCubic(prog(t, T.sixty, T.sixty + 0.45));
  const grow20 = easeInOutCubic(prog(t, T.twenty, T.twenty + 0.42));
  const pathU = easeInOutCubic(prog(t, T.swoop - 0.05, T.climb2 + 0.02));
  const N = 60;
  const pts: [number, number][] = Array.from({length: N + 1}, (_, i) => bez(B_PATH, (i / N) * pathU));
  const [px, py] = bez(B_PATH, pathU);
  const [qx, qy] = bez(B_PATH, Math.min(1, pathU + 0.01));
  const icon = pathU < 1 ? angDeg(qx - px, qy - py) : -70;
  const tag2 = popOut(t, T.twice, 99, 0.3);
  const lab60 = pop(t, T.sixty + 0.4, 0.3);
  const lab20 = pop(t, T.twenty + 0.4, 0.3);
  const arrow = (x0: number, y0: number, x1: number, y1: number, u: number) => {
    if (u <= 0.001) return null;
    const xe = lerp(x0, x1, u);
    const ye = lerp(y0, y1, u);
    const a = Math.atan2(y1 - y0, x1 - x0);
    const head = (x: number, y: number, ang: number) => (
      <polygon points={`${x},${y} ${x - 22 * Math.cos(ang - 0.45)},${y - 22 * Math.sin(ang - 0.45)} ${x - 22 * Math.cos(ang + 0.45)},${y - 22 * Math.sin(ang + 0.45)}`} fill="#fff" />
    );
    return (
      <g>
        <line x1={x0} y1={y0} x2={xe} y2={ye} stroke="#fff" strokeWidth={6} />
        {head(x0, y0, a + Math.PI)}
        {u > 0.98 ? head(x1, y1, a) : null}
        <line x1={x0 - 14 * Math.sin(a)} y1={y0 - 14 * Math.cos(a)} x2={x0 + 14 * Math.sin(a)} y2={y0 + 14 * Math.cos(a)} stroke="#fff" strokeWidth={5} />
        {u > 0.98 ? <line x1={x1 - 14 * Math.sin(a)} y1={y1 - 14 * Math.cos(a)} x2={x1 + 14 * Math.sin(a)} y2={y1 + 14 * Math.cos(a)} stroke="#fff" strokeWidth={5} /> : null}
      </g>
    );
  };
  const grid: React.ReactNode[] = [];
  for (let x = 40; x < BPW; x += 40) grid.push(<line key={`gx${x}`} x1={x} y1={0} x2={x} y2={BPH} stroke={BP_GRID} strokeWidth={2} />);
  for (let y = 40; y < BPH; y += 40) grid.push(<line key={`gy${y}`} x1={0} y1={y} x2={BPW} y2={y} stroke={BP_GRID} strokeWidth={2} />);
  const sc = 1 + 0.025 * prog(t, BP0, BP_UP);
  return (
    <AbsoluteFill style={{transform: `scale(${sc})`, transformOrigin: '540px 650px'}}>
      <div style={{position: 'absolute', left: BPX, top: BPY, width: BPW, height: H, overflow: 'hidden'}}>
        <svg width={BPW} height={BPH} viewBox={`0 0 ${BPW} ${BPH}`} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={0} y={0} width={BPW} height={BPH} fill={BP} />
          {grid}
          <rect x={6} y={6} width={BPW - 12} height={BPH - 12} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="2 0" opacity={0.85} />
          {/* ground + building (20 m) + you on the roof */}
          <line x1={30} y1={B_GROUND} x2={BPW - 30} y2={B_GROUND} stroke="#fff" strokeWidth={6} />
          <rect x={B_BLD.x0} y={B_BLD.top} width={B_BLD.x1 - B_BLD.x0} height={B_GROUND - B_BLD.top} fill="none" stroke="#fff" strokeWidth={6} />
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <g key={j}>
              <rect x={B_BLD.x0 + 16} y={B_BLD.top + 18 + j * 39} width={24} height={22} fill="none" stroke="#fff" strokeWidth={3} />
              <rect x={B_BLD.x0 + 60} y={B_BLD.top + 18 + j * 39} width={24} height={22} fill="none" stroke="#fff" strokeWidth={3} />
            </g>
          ))}
          <circle cx={808} cy={B_BLD.top - 42} r={13} fill={BP} stroke="#fff" strokeWidth={5} />
          <path d={`M 808 ${B_BLD.top - 29} L 808 ${B_BLD.top - 6} M 808 ${B_BLD.top - 6} L 798 ${B_BLD.top} M 808 ${B_BLD.top - 6} L 818 ${B_BLD.top} M 808 ${B_BLD.top - 22} L ${B_END[0] + 6} ${B_END[1] - 2}`} stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" />
          {/* the swoop the engineers worked out */}
          {pathU > 0.001 ? <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={YEL} strokeWidth={7} strokeDasharray="20 14" strokeLinecap="round" /> : null}
          {/* 60 m and 20 m */}
          {arrow(B_START[0], 604, B_END[0], 604, grow60)}
          {arrow(915, B_START[1], 915, B_END[1], grow20)}
          {/* speed lines behind the start pigeon */}
          {tag2 > 0.01 && pathU < 0.02
            ? [0, 1, 2].map((i) => <line key={i} x1={B_START[0] - 30 - 10 * i} y1={B_START[1] - 26 + i * 18} x2={B_START[0] - 80 - 18 * i} y2={B_START[1] - 26 + i * 18} stroke="#fff" strokeWidth={5} strokeLinecap="round" />)
            : null}
        </svg>
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <Spr n="p_glide" x={px} y={py} s={0.17} ax={HEADXY('p_glide')[0]} ay={HEADXY('p_glide')[1]} rot={clamp(icon, -75, 30)} />
          <Label x={170} y={455} text="2x SPEED" size={50} s={tag2} fill="#000" bg={YEL} rot={-4} />
          <Label x={(B_START[0] + B_END[0]) / 2} y={604} text="60 M" size={58} s={lab60} fill="#000" bg="#fff" />
          <Label x={952} y={(B_START[1] + B_END[1]) / 2} text="20 M" size={52} s={lab20} fill="#000" bg="#fff" />
        </div>
      </div>
      {/* the paper roll at the bottom edge while it unrolls / rolls up */}
      {h < 0.999 ? (
        <div style={{position: 'absolute', left: BPX - 8, top: BPY + H - 22, width: BPW + 16, height: 44, borderRadius: 22, background: '#22508F', border: '7px solid #000', boxSizing: 'border-box'}}>
          <div style={{position: 'absolute', left: 20, right: 20, top: 6, height: 8, borderRadius: 4, background: '#5C8FD1'}} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ======================================================================================================
// THE SCENE
// ======================================================================================================
export const RoofScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camOverride, cover}) => {
  let cam = camOverride ?? camAt(t, CAM);
  // shake: the smack and the face
  let amp = 0;
  if (!cover) {
    if (t >= SMACK && t < SMACK + 0.6) amp += 20 * Math.exp(-7 * (t - SMACK));
    if (t >= T.face && t < T.face + 0.5) amp += 9 * Math.exp(-8 * (t - T.face));
  }
  if (amp > 0.05) {
    const sh = shake(t, amp);
    cam = {x: cam.x + sh.x / cam.k, y: cam.y + sh.y / cam.k, k: cam.k};
  }
  const blurBg = clamp((cam.k - 1.15) * 4.5, 0, 3.2);

  // ---- the guy ----
  let pose: Pose = 'hero';
  let tSwap = -9;
  if (t >= T.just && t < T.but - 0.12) {
    pose = 'shrug';
    tSwap = T.just;
  } else if (t >= T.but - 0.12 && t < SMACK) {
    tSwap = T.but - 0.12;
  } else if (t >= SMACK && t < POOF) {
    pose = 'hit';
    tSwap = SMACK;
  } else if (t >= POOF && t < FACE0) {
    tSwap = POOF;
  } else if (t >= FACE0) {
    pose = 'shield';
    tSwap = FACE0;
  }
  if (cover) pose = 'hero';
  const [qx, qy] = cover ? [1, 1] : squashSwap(t, tSwap);
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const tremble = pose === 'shield' ? 2.5 * Math.sin(2 * Math.PI * 9 * t) : pose === 'hit' ? 1.5 * Math.sin(2 * Math.PI * 11 * t) : 0;
  const lean = pose === 'hit' ? 4 * Math.exp(-5 * Math.max(0, t - SMACK)) : 0;
  const [fx, fy] = FEET[pose];

  // ---- the pigeon ----
  const p = cover ? pigeonAt(2.0) : pigeonAt(t);

  // ---- the crumb ----
  let crumb: {x: number; y: number; s: number; rot: number} | null = null;
  if (cover || t < T.just || (t >= T.but - 0.12 && t < SMACK)) crumb = {x: PALM[0], y: PALM[1], s: 1, rot: 0};
  else if (t >= T.just && t < T.but - 0.12) crumb = {x: PALM_SHRUG[0], y: PALM_SHRUG[1], s: 1, rot: 0};
  else if (t >= SMACK && t < SMACK + 1.2) {
    const tau = t - SMACK;
    crumb = {x: PALM[0] - 150 * tau, y: PALM[1] - 520 * tau + 0.5 * 2400 * tau * tau, s: 1, rot: 400 * tau};
  } else if (t >= POOF + 0.04 && t < FACE0) {
    crumb = {x: PALM[0] - 30, y: PALM[1] - 2, s: pop(t, POOF + 0.04, 0.22), rot: 0};
  } else if (t >= FACE0 && t < HAPPY) {
    // tossed up when you throw your hands up; lands in the pigeon's beak on your head
    const u = prog(t, FACE0, HAPPY);
    const end: [number, number] = [HEAD_TOP[0] + 6 + (BEAK.p_happy[0] - S('p_happy').feet[0]) * pS('p_happy'), HEAD_TOP[1] + 16 + (BEAK.p_happy[1] - S('p_happy').feet[1]) * pS('p_happy')];
    crumb = {x: lerp(PALM[0] - 30, end[0], u), y: lerp(PALM[1] - 2, end[1], u) - 520 * Math.sin(Math.PI * u), s: 1, rot: 720 * u};
  } else if (t >= HAPPY) {
    const b = beakOf(p);
    const eat = 1 - easeInCubic(prog(t, T.end - 0.05, T.end + 0.2));
    crumb = {x: b[0] + 4, y: b[1] + 4, s: eat, rot: 0};
  }

  // ---- effects ----
  const zz = !cover && t < 2.6;
  const noFlap = cover ? 0 : popOut(t, T.without + 0.02, T.just + 0.05, 0.28);
  const lineU = cover ? 0 : easeOutCubic(prog(t, T.glide - 0.05, T.glide + 0.45)) * (t < T.but + 0.25 ? 1 : 0);
  const star = t >= SMACK && t < SMACK + 0.55 ? (t < SMACK + 0.3 ? pop(t, SMACK, 0.12) : 1 - easeInCubic(prog(t, SMACK + 0.3, SMACK + 0.55))) : 0;
  const poof = t >= POOF - 0.12 && t < POOF + 0.42 ? prog(t, POOF - 0.12, POOF + 0.42) : -1;
  const sparkle = t >= LAND && t < LAND + 0.7 ? prog(t, LAND, LAND + 0.7) : -1;
  // speed lines behind a fast pigeon
  const sl = !cover && p.show && p.speed > 0.35 && ((t > T.but + 0.2 && t < SMACK) || (t > DIVE0 && t < LAND - 0.35));
  const vAng = (() => {
    const q = pigeonAt(t + 1 / 60);
    return Math.atan2(q.y - p.y, q.x - p.x);
  })();
  // the swoop trail in beat 4
  const trail: [number, number][] = [];
  if (!cover && t > DIVE0 && t < LAND + 0.9) {
    for (let tt = DIVE0; tt <= Math.min(t, LAND); tt += 0.04) {
      const q = pigeonAt(tt);
      trail.push([q.x, q.y + 20]);
    }
  }
  const trailOp = t < LAND + 0.4 ? 1 : 1 - prog(t, LAND + 0.4, LAND + 0.9);

  return (
    <AbsoluteFill style={{backgroundColor: SKY, overflow: 'hidden'}}>
      {/* far: the city plate */}
      <World cam={cam} depth={DEPTH_BG} blur={blurBg}>
        <div style={{position: 'absolute', left: -6000, top: PY0 + 1300, width: 12000, height: 9000, background: '#C9B2A8'}} />
        <Img src={staticFile('pigeon-landing/plate.jpg')} style={{position: 'absolute', left: PX0, top: PY0, width: PL.w * PSC, height: PL.h * PSC}} />
      </World>

      {/* near: the building, the guy, the pigeon, effects */}
      <World cam={cam}>
        {trail.length > 1 ? (
          <Svg>
            <polyline points={trail.map((q) => q.join(',')).join(' ')} fill="none" stroke="#fff" strokeWidth={10} strokeDasharray="26 20" strokeLinecap="round" opacity={0.9 * trailOp} />
          </Svg>
        ) : null}
        <Building />
        {/* contact shadow */}
        <Svg>
          <ellipse cx={fx + (pose === 'hero' ? -40 : 0)} cy={ROOF_Y - 2} rx={150} ry={14} fill="rgba(72,54,42,0.26)" />
        </Svg>
        <Spr n={pose} x={fx + tremble} y={fy} s={gS(pose)} sx={qx} sy={qy * (pose === 'hero' ? breathe : bump(t, T.right, 0.32, 0.05))} rot={lean} />
        {/* the dashed 'just glide in' line */}
        {lineU > 0.01 ? (
          <Svg>
            {(() => {
              const b0 = beakOf(pigeonAt(T.glide));
              const x1 = lerp(b0[0] + 16, PALM[0] - 30, lineU);
              const y1 = lerp(b0[1] + 6, PALM[1] - 6, lineU);
              const a = Math.atan2(PALM[1] - b0[1], PALM[0] - b0[0]);
              return (
                <g>
                  <line x1={b0[0] + 16} y1={b0[1] + 6} x2={x1} y2={y1} stroke={INK} strokeWidth={9} strokeDasharray="22 16" strokeLinecap="round" />
                  {lineU > 0.95 ? (
                    <polygon
                      points={`${x1 + 26 * Math.cos(a)},${y1 + 26 * Math.sin(a)} ${x1 + 26 * Math.cos(a + 2.4)},${y1 + 26 * Math.sin(a + 2.4)} ${x1 + 26 * Math.cos(a - 2.4)},${y1 + 26 * Math.sin(a - 2.4)}`}
                      fill={INK}
                    />
                  ) : null}
                </g>
              );
            })()}
          </Svg>
        ) : null}
        <Svg>
          <ImpactStar x={FACE[0] - 30} y={FACE[1] + 4} s={star} />
          {sl
            ? [0, 1, 2, 3].map((i) => {
                const L = 70 + 160 * p.speed;
                const off = (i - 1.5) * 34;
                const bx = p.x - Math.cos(vAng) * (150 + 40 * (i % 2)) - Math.sin(vAng) * off;
                const by = p.y - Math.sin(vAng) * (150 + 40 * (i % 2)) + Math.cos(vAng) * off;
                return <line key={i} x1={bx} y1={by} x2={bx - Math.cos(vAng) * L} y2={by - Math.sin(vAng) * L} stroke={INK} strokeWidth={7} strokeLinecap="round" />;
              })
            : null}
        </Svg>
        <PigeonSprite p={p} />
        <Svg>
          {crumb ? <Crumb x={crumb.x} y={crumb.y} s={crumb.s * 1.25} rot={crumb.rot} /> : null}
          {FEATHERS.map((f, i) => (
            <Feather key={i} f={f} t={t} origin={i >= 12 && i < 26 ? beakOf(pigeonAt(f.t0)) : undefined} />
          ))}
          {/* lazy z's */}
          {zz
            ? [0, 1, 2].map((i) => {
                const t0 = T.lazy + 0.25 * i;
                const tau = t - t0;
                if (tau < 0) return null;
                const s = pop(t, t0, 0.25) * (tau > 1.5 ? Math.max(0, 1 - (tau - 1.5) / 0.3) : 1);
                const hx = p.x + 30 + 26 * i + 18 * tau;
                const hy = p.y - 70 - 40 * i - 50 * tau;
                return (
                  <text key={i} x={hx} y={hy} fontFamily={FONT} fontSize={40 + 12 * i} fill="#fff" stroke={INK} strokeWidth={9} paintOrder="stroke" transform={`rotate(-12 ${hx} ${hy}) translate(0 0)`} style={{transformBox: 'fill-box'}} opacity={s > 0 ? 1 : 0}>
                    <tspan>{s > 0.02 ? 'z' : ''}</tspan>
                  </text>
                );
              })
            : null}
          <NoFlapSign x={p.x - 30} y={p.y - 225} s={noFlap * 1.35} />
          {poof >= 0 ? (
            <PuffCluster
              puffs={Array.from({length: 9}, (_, i) => {
                const a = (i / 9) * Math.PI * 2;
                const g = Math.sin(Math.PI * poof);
                return {x: 740 + Math.cos(a) * 170 * (0.6 + 0.4 * poof), y: 1010 + Math.sin(a) * 260 * (0.6 + 0.4 * poof), r: 115 * g * (0.8 + 0.3 * rnd(i))};
              })}
              fill="#fff"
              ink={8}
            />
          ) : null}
          {t >= T.crumb - 0.05 && t < T.crumb + 0.6
            ? (() => {
                const g = Math.sin(Math.PI * prog(t, T.crumb - 0.05, T.crumb + 0.6));
                const cx = PALM[0] - 4;
                const cy = PALM[1] - 34;
                return <path d={`M ${cx} ${cy - 34 * g} L ${cx + 8 * g} ${cy - 8 * g} L ${cx + 34 * g} ${cy} L ${cx + 8 * g} ${cy + 8 * g} L ${cx} ${cy + 34 * g} L ${cx - 8 * g} ${cy + 8 * g} L ${cx - 34 * g} ${cy} L ${cx - 8 * g} ${cy - 8 * g} Z`} fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
              })()
            : null}
          {sparkle >= 0
            ? [0, 1, 2, 3].map((i) => {
                const a = -1.9 + i * 0.75;
                const d = 120 + 70 * sparkle;
                const s = Math.sin(Math.PI * sparkle) * 1.0;
                const cx = LAND_FEET[0] + Math.cos(a) * d;
                const cy = LAND_FEET[1] - 110 + Math.sin(a) * d;
                return <path key={i} d={`M ${cx} ${cy - 30 * s} L ${cx + 8 * s} ${cy - 8 * s} L ${cx + 30 * s} ${cy} L ${cx + 8 * s} ${cy + 8 * s} L ${cx} ${cy + 30 * s} L ${cx - 8 * s} ${cy + 8 * s} L ${cx - 30 * s} ${cy} L ${cx - 8 * s} ${cy - 8 * s} Z`} fill={YEL} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
              })
            : null}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};

// ---------- screen-space overlays: speed gauge, rewind icon, the engineer + blueprint ----------
const Overlays: React.FC<{t: number}> = ({t}) => {
  const p = pigeonAt(t);
  // gauge 1: the fast glide; gauge 2: the dive + climb
  let gs = 0;
  let gv = 0;
  let gshake = 0;
  if (t >= T.gliding + 0.1 && t < REW0) {
    gs = popOut(t, T.gliding + 0.1, SMACK + 0.55, 0.28);
    gv = t < SMACK ? lerp(0.3, 0.93, easeInOutCubic(prog(t, T.gliding + 0.2, T.speed + 0.35))) : 0.98;
    gshake = t > SMACK ? 0.08 * Math.sin(2 * Math.PI * 14 * t) * Math.exp(-4 * (t - SMACK)) : 0.02 * Math.sin(2 * Math.PI * 9 * t);
  } else if (t >= DIVE0 && t < LAND + 0.75) {
    gs = popOut(t, DIVE0, LAND + 0.5, 0.28);
    gv = t < DIVE1 ? lerp(0.55, 1.0, prog(t, DIVE0, DIVE1)) : clamp(p.speed);
    gshake = t < DIVE1 ? 0.02 * Math.sin(2 * Math.PI * 9 * t) : 0;
  }
  const rew = popOut(t, REW0, POOF + 0.1, 0.2);
  // engineer
  let eng = '';
  let eSwap = -9;
  if (t >= ENG0 && t < BP_UP + 0.35) {
    eng = 'eng_write';
    if (t >= T.twice) {
      eng = 'eng_point';
      eSwap = T.twice;
    }
    if (t >= T.climb2) {
      eng = 'eng_palm';
      eSwap = T.climb2;
    }
  }
  const eIn = easeOutBack(prog(t, ENG0, ENG0 + 0.5), 1.3);
  const eOut = easeInCubic(prog(t, BP_UP, BP_UP + 0.32));
  const eY = 2010 + 900 * (1 - eIn) + 1000 * eOut;
  const [eqx, eqy] = squashSwap(t, eSwap);
  const dim = t >= BP0 - 0.1 && t < BP_UP + 0.3 ? 0.34 * prog(t, BP0 - 0.1, BP0 + 0.3) * (1 - prog(t, BP_UP, BP_UP + 0.3)) : 0;
  return (
    <AbsoluteFill>
      {dim > 0.001 ? <AbsoluteFill style={{background: `rgba(12,28,58,${dim})`}} /> : null}
      <Gauge x={210} y={300} s={gs} v={gv} shakeA={gshake} />
      <Label x={210} y={440} text="SPEED" size={44} s={gs} />
      {rew > 0.001 ? (
        <svg style={{position: 'absolute', left: 820, top: 230, overflow: 'visible'}} width={10} height={10}>
          <g transform={`scale(${rew})`}>
            <polygon points="-70,0 0,-48 0,48" fill="#fff" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
            <polygon points="0,0 70,-48 70,48" fill="#fff" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
          </g>
        </svg>
      ) : null}
      <Blueprint t={t} />
      {eng ? <Spr n={eng} x={250} y={eY} s={1.28} sx={eqx} sy={eqy * (1 + 0.008 * Math.sin(2 * Math.PI * 0.7 * t))} /> : null}
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'coo', at: 0.2, db: -27},
  {f: 'glide', at: 0.0, db: -30},
  {f: 'pop', at: T.without + 0.02, db: -21},
  {f: 'chalk', at: T.glide - 0.05, db: -27, rate: 1.4},
  {f: 'scratch', at: T.but - 0.03, db: -17},
  {f: 'pop', at: T.gliding + 0.1, db: -23},
  {f: 'whoosh', at: SMACK - 0.42, db: -19},
  {f: 'smack', at: SMACK - 0.01, db: -14},
  {f: 'dizzy', at: SMACK + 0.32, db: -23},
  {f: 'rewind', at: REW0 - 0.02, db: -16},
  {f: 'sun_poof', at: POOF - 0.08, db: -20},
  {f: 'dive_swoop', at: DIVE0 + 0.05, db: -19},
  {f: 'needle', at: LAND - 0.55, db: -21},
  {f: 'twinkle', at: LAND + 0.02, db: -21},
  {f: 'scribble', at: ENG0 + 0.12, db: -21},
  {f: 'unroll', at: BP0 - 0.04, db: -19},
  {f: 'pop', at: T.twice, db: -20},
  {f: 'chalk', at: T.sixty, db: -24},
  {f: 'pop', at: T.sixty + 0.4, db: -22},
  {f: 'glide', at: T.swoop, db: -27},
  {f: 'chalk', at: T.twenty, db: -24, rate: 1.15},
  {f: 'pop', at: T.twenty + 0.4, db: -22},
  {f: 'unroll', at: BP_UP - 0.04, db: -22, rate: 1.35},
  {f: 'crickets', at: T.crumb + 0.25, db: -25, dur: 0.9},
  {f: 'flap_frantic', at: FLAP0 + 0.02, db: -17},
  {f: 'flap_frantic', at: FACE0, db: -15, rate: 1.06},
  {f: 'smack', at: T.face - 0.01, db: -21, rate: 1.3},
  {f: 'flutter', at: HAPPY - 0.2, db: -19},
  {f: 'munch', at: T.end - 0.1, db: -18},
];

export const PigeonLandingShort: React.FC = () => {
  usePigeonFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: SKY}}>
      <RoofScene t={t} />
      <Overlays t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('pigeon-landing/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('pigeon-landing/music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="pigeon-landing/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
