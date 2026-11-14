import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "In 1930, a phone company needed this building gone." - told as a story on one 1930s street (front view).
// The guy (the architect) points at the old brick building; a blueprint of a new HQ pops up; a crane swings a wrecking
// ball back. But the windows fill with phone operators, wires run out to the city and a phone rings; one swing would
// snap the wires (what-if: the phone goes quiet, crickets). Rewind poof; the guy gets the idea: move it. Jacks, rollers,
// the guy pushes, the building rolls and turns (front -> side view) with "11,000 TONS"; cut inside: an operator sips
// coffee while the street slides past the window.

const F = (n: string) => staticFile(`building-move/${n}.png`);
export const FONT = 'BuildingInter';
export const useBmFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 4.0;
const INK = '#000';
const SKY = '#9AD3F1';

// ---------- world ----------
export const G = 1000; // street line where the building and the guy stand
const BS = 1.08; // building sprite scale (front 769 x 842 native -> ~830 x 909 world)
const BX0 = 590; // building centre before the move
const BX1 = 175; // after the move (the next lot to the left)
const T_ROLL0 = T.rolled;
const T_ROLL1 = 15.9;
const LIFT = 40; // rollers' diameter
const T_SWAP_SIDE = 14.5; // the turn: front squashes to the side's width, swap on the narrowest frame
const W_RATIO = SPR.side.w / SPR.front.w;

const bxAt = (t: number) => lerp(BX0, BX1, easeInOutCubic(prog(t, T_ROLL0, T_ROLL1)));
const liftAt = (t: number) => LIFT * clamp(easeOutBack(prog(t, T.they, T.they + 0.28), 2.2), 0, 1.15);
type BView = {n: 'front' | 'side'; sx: number};
const viewAt = (t: number): BView => {
  if (t < T.turned) return {n: 'front', sx: 1};
  if (t < T_SWAP_SIDE) return {n: 'front', sx: lerp(1, W_RATIO, easeInCubic(prog(t, T.turned, T_SWAP_SIDE)))};
  return {n: 'side', sx: 1 + 0.07 * spring(t - T_SWAP_SIDE, 2.6, 5)};
};
// world x of a native x on the current view
const bWorldX = (t: number, nx: number) => {
  const v = viewAt(t);
  const sp = SPR[v.n];
  return bxAt(t) + (nx - sp.feet[0]) * BS * v.sx;
};
const bWorldY = (t: number, ny: number, n: 'front' | 'side' = 'front') => G - liftAt(t) + (ny - SPR[n].feet[1]) * BS;
const roofCorners = (t: number) => {
  const v = viewAt(t);
  const sp = SPR[v.n];
  const y = bWorldY(t, sp.top + 34, v.n);
  return {l: {x: bWorldX(t, sp.left + 30), y}, r: {x: bWorldX(t, sp.right - 30), y}};
};
const rightWall = (t: number) => bWorldX(t, SPR[viewAt(t).n].right - 4);

// characters
const HEAD_R = 74;
type Pose = 'hero' | 'shock' | 'idea' | 'push' | 'cheer';
// largest inscribed disc of the filled silhouette (prep): [cx, cy, r]
const HEADS: Record<Pose, [number, number, number]> = {
  hero: [296, 275, 260.2],
  shock: [206, 201, 186.7],
  idea: [210, 198, 182.9],
  push: [392, 158, 144.2],
  cheer: [234, 181, 138.0],
};
const sc = (n: Pose) => HEAD_R / HEADS[n][2];
const GX = 1120; // the guy stands right of the building, mirrored (faces left)

// crane (mirrored: cab on the left, boom tip to the right) + the wrecking ball pendulum
const CS = 0.94;
const PIV = {x: 70, y: G - (SPR.crane.feet[1] - SPR.crane.tip[1]) * CS};
const CRANE_FX = PIV.x + (SPR.crane.tip[0] - SPR.crane.feet[0]) * CS; // mirrored feet x so that the tip sits on PIV
const BR = 88;
const BALL_S = BR / SPR.ball.r;
const ROPE = 733; // pivot -> ball centre
const CONTACT = Math.asin((BX0 - (SPR.front.feet[0] - SPR.front.left) * BS - BR - PIV.x) / ROPE); // ball touches the wall
const T_HIT = 9.42;
const craneDx = (t: number) => {
  if (t < 3.95) return -760;
  if (t < 4.75) return lerp(-760, 0, easeOutCubic(prog(t, 3.95, 4.75)));
  if (t < T.so2) return 0;
  return lerp(0, -1100, easeInCubic(prog(t, T.so2, 11.75)));
};
const D2R = Math.PI / 180;
const thetaAt = (t: number, tr: number) => {
  // radians, 0 = hanging straight down, + = towards the building
  if (t < 4.75) return (14 * D2R) * Math.exp(-2.2 * Math.max(0, t - 3.95)) * Math.cos(2 * Math.PI * 0.9 * (t - 3.95));
  if (t < T.knock) return 3 * D2R * Math.sin(2 * Math.PI * 0.9 * (t - 4.75)) * Math.exp(-2 * (t - 4.75));
  if (t < T.swing) {
    const back = -30 * D2R * easeInOutCubic(prog(t, T.knock, 5.7));
    return back + 0.6 * D2R * Math.sin(2 * Math.PI * 7 * tr) * prog(t, 5.7, 6.0);
  }
  if (t < T_HIT) return lerp(-30 * D2R, CONTACT, easeInCubic(prog(t, T.swing, T_HIT)));
  if (t < T.so2) return CONTACT;
  // the crane drives off: the ball trails behind and swings
  return CONTACT + 16 * D2R * Math.sin(2 * Math.PI * 0.8 * (t - T.so2)) * prog(t, T.so2, T.so2 + 0.3);
};

// ---------- cameras ----------
// improvement pass: every wide key 35 units higher (ground line lower in the frame: less empty street, more sky for
// the story props); the 8.6 -> 9.15 pan was too fast (pop scan) -> 8.45 -> 9.2; the push-in to the window starts earlier.
export const CAM0: CamKey = {t: 0, x: 680, y: 414, k: 0.98};
const KEYS: CamKey[] = [
  CAM0,
  {t: 3.3, x: 672, y: 405, k: 1.02},
  {t: 3.95, x: 672, y: 405, k: 1.02},
  {t: 4.75, x: 310, y: 365, k: 0.8},
  {t: 6.05, x: 300, y: 370, k: 0.82},
  {t: 6.7, x: 700, y: 385, k: 0.88},
  {t: 7.1, x: 700, y: 385, k: 0.88},
  {t: 8.45, x: 715, y: 368, k: 0.94},
  {t: 9.2, x: 540, y: 385, k: 0.86},
  {t: 10.9, x: 545, y: 385, k: 0.87},
  {t: 11.55, x: 770, y: 420, k: 1.0},
  {t: 13.3, x: 780, y: 420, k: 1.02},
  {t: 13.75, x: 770, y: 395, k: 0.92},
  {t: 15.85, x: 400, y: 395, k: 0.92},
  {t: 15.92, x: 400, y: 395, k: 0.92},
];
const PUSH_WIN = SPR.side.win[8]; // side view, row 3 middle window
const pushTarget = (): CamKey => {
  const x = BX1 + (PUSH_WIN[0] + PUSH_WIN[2] / 2 - SPR.side.feet[0]) * BS;
  const y = G - LIFT + (PUSH_WIN[1] + PUSH_WIN[3] / 2 - SPR.side.feet[1]) * BS;
  return {t: 16.5, x, y, k: 1.75};
};
export const T_CU = 16.5; // hard cut to the operator close-up
export const camFor = (t: number): Cam => camAt(t, [...KEYS, pushTarget()]);

// ---------- sounds (ElevenLabs: 1 new for this video + reused ones from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'pop', at: 0.34, db: -22},
  {f: 'flip', at: 2.0, db: -22},
  {f: 'pop', at: 2.82, db: -25, rate: 1.3},
  {f: 'gulp', at: 3.34, db: -17},
  {f: 'rumble', at: 3.95, db: -28, keys: [[3.95, -36], [4.3, -27], [4.8, -27], [5.2, -45]], dur: 1.3},
  {f: 'winch', at: 5.02, db: -21},
  {f: 'creak', at: 5.5, db: -25},
  {f: 'squeeze', at: 6.18, db: -24, rate: 0.8},
  ...[0, 1, 2, 3, 4, 5].map((i) => ({f: 'pop', at: 6.98 + i * 0.11, db: -27, rate: 0.9 + i * 0.1})),
  {f: 'ring', at: 7.38, db: -21},
  {f: 'ring', at: 7.92, db: -24, rate: 1.06},
  {f: 'ring', at: 8.5, db: -23},
  {f: 'whoosh', at: 9.12, db: -19, rate: 0.75},
  {f: 'knock', at: T_HIT, db: -15, rate: 0.8},
  {f: 'crack', at: 9.62, db: -18, rate: 1.3},
  {f: 'crickets', at: 9.98, db: -21},
  {f: 'whoosh', at: 10.96, db: -27, rate: 1.4},
  {f: 'rumble', at: 11.0, db: -30, keys: [[11.0, -30], [11.6, -40]], dur: 0.7},
  {f: 'clink', at: 11.3, db: -17},
  {f: 'whoosh', at: 12.3, db: -24, rate: 1.2},
  {f: 'winch', at: 13.36, db: -22},
  ...[0, 1, 2, 3, 4].map((i) => ({f: 'pop', at: 13.4 + i * 0.07, db: -27, rate: 0.85 + i * 0.08})),
  {f: 'grind', at: 13.62, db: -23, keys: [[13.62, -26], [14.2, -22], [15.6, -24], [16.05, -45]], dur: 2.45},
  {f: 'creak', at: 14.28, db: -22},
  {f: 'stamp', at: 14.7, db: -16},
  {f: 'boing', at: 15.8, db: -25},
  {f: 'whoosh', at: 16.2, db: -24, rate: 1.1},
  {f: 'pop', at: 16.8, db: -21},
  {f: 'ring', at: 17.9, db: -25},
  {f: 'clink', at: 18.42, db: -21, rate: 1.2},
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
const outPop = (t: number, t0: number, t1: number, d0 = 0.25, d1 = 0.18) => pop(t, t0, d0) * (1 - easeInCubic(prog(t, t1, t1 + d1)));

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; children?: React.ReactNode}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  children,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
      {children ? (
        <svg style={{position: 'absolute', left: -fx * s, top: -fy * s, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
          {children}
        </svg>
      ) : null}
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -3000, top: -3000, overflow: 'visible'}} width={9000} height={9000} viewBox="-3000 -3000 9000 9000">
    {children}
  </svg>
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number; fill?: string}> = ({x, y, r, s, rot = 0, fill = '#FFE45C'}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={p} fill={fill} stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
};
// short ring arcs (")))") around a ringing thing
const RingLines: React.FC<{x: number; y: number; r: number; s: number; tr: number; side?: 1 | -1}> = ({x, y, r, s, tr, side = 1}) => {
  if (s <= 0.001) return null;
  const ph = (tr * 3) % 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${side * s}, ${s})`}>
      {[0, 1, 2].map((i) => {
        const rr = r * (0.7 + 0.35 * i + 0.25 * ph);
        return <path key={i} d={`M ${rr * Math.cos(-0.6)} ${rr * Math.sin(-0.6)} A ${rr} ${rr} 0 0 1 ${rr * Math.cos(0.6)} ${rr * Math.sin(0.6)}`} fill="none" stroke={INK} strokeWidth={r * 0.16} strokeLinecap="round" opacity={1 - 0.25 * i} />;
      })}
    </g>
  );
};

// ---------- backdrop: the generated street plate far away (parallax depth 2) ----------
const BG_S = 3.0;
const BG = {w: SPR.bg.w * BG_S, h: SPR.bg.h * BG_S};
const BG_Y = 2 * G - 410 - 910 * BG_S; // the plate's sidewalk (native y ~910) lines up with G in the wide shot
const BG_X = 480 - BG.w / 2;
const Backdrop: React.FC<{cam: Cam}> = ({cam}) => (
  <World cam={cam} depth={2} blur={cam.k > 1.2 ? clamp((cam.k - 1.2) * 6, 0, 3) : 0}>
    <Img src={F('bg')} style={{position: 'absolute', left: BG_X, top: BG_Y, width: BG.w, height: BG.h}} />
  </World>
);

// the street in front (main plane): a flat road band so the building and the guy stand on something
const Street: React.FC = () => (
  <g>
    <rect x={-1600} y={G - 6} width={4400} height={1400} fill="#A4A39E" />
    <rect x={-1600} y={G - 6} width={4400} height={34} fill="#C9C4B8" />
    <line x1={-1600} x2={2800} y1={G - 6} y2={G - 6} stroke={INK} strokeWidth={7} />
    <line x1={-1600} x2={2800} y1={G + 28} y2={G + 28} stroke={INK} strokeWidth={5} />
    {[-900, -500, -100, 300, 700, 1100, 1500, 1900].map((x) => (
      <rect key={x} x={x} y={G + 150} width={170} height={18} rx={9} fill="#E8E3D6" stroke={INK} strokeWidth={4} />
    ))}
  </g>
);

// ---------- the building (front / side) with a face, window operators ----------
type BFace = {open: number; look: [number, number]; squeeze: boolean; lid: number; brow: number; browTilt: number; mouth: 'none' | 'wavy' | 'o' | 'smile' | 'grit'};
const faceAt = (t: number): BFace => {
  const open = pop(t, T.building, 0.28);
  if (t < T.gone) return {open, look: [0.7, -0.2], squeeze: false, lid: 0, brow: 0.55, browTilt: 0, mouth: 'none'};
  if (t < 3.95) return {open, look: [-0.2, -0.9], squeeze: false, lid: 0, brow: 0.75, browTilt: -1.1, mouth: 'wavy'};
  if (t < T.swing) return {open, look: [-0.95, 0.1], squeeze: false, lid: 0, brow: 0.8, browTilt: -1.3, mouth: t > T.but ? 'o' : 'wavy'};
  if (t < T.so2) return {open, look: [0, 0], squeeze: t > 9.2, lid: 0, brow: 0.6, browTilt: 0, mouth: t > 9.2 ? 'grit' : 'o'};
  if (t < T.move) return {open, look: [0.9, 0], squeeze: false, lid: 0.25, brow: 0.55, browTilt: 0, mouth: 'smile'};
  if (t < T.they) return {open, look: [-0.9, -0.2], squeeze: false, lid: 0, brow: 0.8, browTilt: 0, mouth: 'o'};
  if (t < T_ROLL1) return {open, look: [-0.8, 0.2], squeeze: false, lid: 0, brow: 0.85, browTilt: -0.8, mouth: 'o'};
  return {open, look: [0.4, 0], squeeze: false, lid: 0.4, brow: 0.5, browTilt: 0, mouth: 'smile'};
};
const Mouth: React.FC<{x: number; y: number; w: number; kind: BFace['mouth']; tr: number}> = ({x, y, w, kind, tr}) => {
  if (kind === 'none') return null;
  const sw = w * 0.12;
  if (kind === 'o')
    return (
      <g>
        <ellipse cx={x} cy={y} rx={w * 0.32} ry={w * 0.42} fill="#3A1410" stroke={INK} strokeWidth={sw} />
        <ellipse cx={x} cy={y + w * 0.18} rx={w * 0.2} ry={w * 0.13} fill="#FC8D90" />
      </g>
    );
  if (kind === 'smile') return <path d={`M ${x - w * 0.6} ${y - w * 0.1} Q ${x} ${y + w * 0.55} ${x + w * 0.6} ${y - w * 0.1}`} fill="#FEFDFD" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
  if (kind === 'grit')
    return (
      <g>
        <rect x={x - w * 0.6} y={y - w * 0.22} width={w * 1.2} height={w * 0.44} rx={w * 0.12} fill="#FEFDFD" stroke={INK} strokeWidth={sw} />
        <line x1={x - w * 0.6} x2={x + w * 0.6} y1={y} y2={y} stroke={INK} strokeWidth={sw * 0.7} />
        {[-0.3, 0, 0.3].map((u) => (
          <line key={u} x1={x + u * w} x2={x + u * w} y1={y - w * 0.22} y2={y + w * 0.22} stroke={INK} strokeWidth={sw * 0.6} />
        ))}
      </g>
    );
  // wavy (worried)
  const p: string[] = [];
  for (let i = 0; i <= 8; i++) p.push(`${i ? 'L' : 'M'} ${x - w * 0.6 + (i * w * 1.2) / 8} ${y + (i % 2 ? -1 : 1) * w * 0.09 + Math.sin(tr * 9) * w * 0.02}`);
  return <path d={p.join(' ')} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
};
// operator heads in the windows (the operator sprite, small, clipped by each window)
const OP = SPR.operator;
const WinPeople: React.FC<{n: 'front' | 'side'; t: number; tr: number}> = ({n, t, tr}) => {
  const wins = SPR[n].win;
  return (
    <g>
      {wins.map((w, i) => {
        const [x, y, ww, hh] = w as unknown as [number, number, number, number];
        if (ww > 90 || hh < 40) return null; // cornice / stone band boxes
        if (rnd(i * 7 + (n === 'side' ? 3 : 0)) < 0.28) return null;
        const t0 = T.working - 0.1 + 0.6 * rnd(i * 3 + 1);
        const s = n === 'front' && t < T.so2 ? clamp(easeOutBack(prog(t, t0, t0 + 0.25), 2)) : 1;
        if (s <= 0.01) return null;
        const hs = (ww * 1.02) / (2 * OP.head[2]);
        const bob = Math.sin(tr * 2.4 + i) * 1.2;
        const cx = x + ww / 2 + (rnd(i + 11) - 0.5) * ww * 0.3;
        const cy = y + hh * 0.62 + (1 - s) * hh * 0.6 + bob;
        return (
          <svg key={i} x={x} y={y} width={ww} height={hh} overflow="hidden">
            <image href={F('operator')} x={cx - x - OP.head[0] * hs} y={cy - y - OP.head[1] * hs} width={OP.w * hs} height={OP.h * hs} />
          </svg>
        );
      })}
    </g>
  );
};
const Building: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const v = viewAt(t);
  const sp = SPR[v.n];
  const f = faceAt(t);
  const hit = t > T_HIT && t < T.so2 ? 1 : 0;
  const sqX = 1 - 0.03 * hit * Math.exp(-6 * (t - T_HIT)) * (1 + Math.cos(2 * Math.PI * 4 * (t - T_HIT)));
  const trem = t > T.knock && t < T.swing ? 1.5 * Math.sin(2 * Math.PI * 9 * tr) : 0;
  const breathY = 1 + 0.005 * Math.sin(2 * Math.PI * 0.5 * tr);
  const ex = v.n === 'front' ? 150 : 62;
  const er = v.n === 'front' ? 50 : 38;
  const ey = 300;
  const fx = sp.feet[0];
  const showPeople = t > T.working - 0.1;
  return (
    <Spr n={v.n} x={bxAt(t) + trem} y={G - liftAt(t)} s={BS} sx={v.sx * sqX} sy={breathY}>
      {showPeople ? <WinPeople n={v.n} t={t} tr={tr} /> : null}
      {f.open > 0.001 ? (
        <g>
          <Eye x={fx - ex} y={ey} r={er} open={f.open} look={f.look} squeeze={f.squeeze} side={-1} lid={f.lid} brow={f.brow} browTilt={f.browTilt} />
          <Eye x={fx + ex} y={ey} r={er} open={f.open} look={f.look} squeeze={f.squeeze} side={1} lid={f.lid} brow={f.brow} browTilt={f.browTilt} />
          <Mouth x={fx} y={ey + er * 2.1} w={er * 1.3} kind={f.open > 0.9 ? f.mouth : 'none'} tr={tr} />
        </g>
      ) : null}
      {(t > T.gone && t < 4.1) || (t > T.knock && t < T.swing) ? (
        <SweatDrop x={fx + ex + er * 1.5} y={ey - er * 0.6 + 40 * ((tr * 0.9) % 1)} r={16} s={Math.sin(Math.PI * ((tr * 0.9) % 1))} />
      ) : null}
    </Spr>
  );
};
// rollers (logs) under the lifted building: they turn as it rolls
const Rollers: React.FC<{t: number}> = ({t}) => {
  if (t < T.they) return null;
  const v = viewAt(t);
  const sp = SPR[v.n];
  const half = ((sp.right - sp.left) / 2) * BS * v.sx;
  const n = v.n === 'front' ? 5 : 3;
  const dx = bxAt(t) - BX0;
  const r = LIFT / 2;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const s = clamp(easeOutBack(prog(t, T.they + 0.04 + i * 0.07, T.they + 0.3 + i * 0.07), 2.4));
        if (s <= 0.01) return null;
        const x = bxAt(t) + lerp(-half + 30, half - 30, i / (n - 1));
        const ang = (dx / r) * (180 / Math.PI);
        return (
          <g key={i} transform={`translate(${x} ${G - r}) scale(${s}) rotate(${ang})`}>
            <circle r={r} fill="#C8915A" stroke={INK} strokeWidth={5} />
            <circle r={r * 0.55} fill="none" stroke="#8E5E33" strokeWidth={3} />
            <line x1={-r * 0.7} x2={r * 0.7} y1={0} y2={0} stroke="#8E5E33" strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

// ---------- the crane + the wrecking ball ----------
const Crane: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t < 3.9 || t > 11.8) return null;
  const dx = craneDx(t);
  const th = thetaAt(t, tr);
  const px = PIV.x + dx;
  const py = PIV.y;
  const bx = px + ROPE * Math.sin(th);
  const by = py + ROPE * Math.cos(th);
  // rotate the chain-top offset with the pendulum
  const ox = (SPR.ball.top[0] - SPR.ball.c[0]) * BALL_S;
  const oy = (SPR.ball.top[1] - SPR.ball.c[1]) * BALL_S;
  const ct = {x: bx + ox * Math.cos(-th) - oy * Math.sin(-th), y: by + ox * Math.sin(-th) + oy * Math.cos(-th)};
  const bounce = t > 3.95 && t < 4.9 ? -6 * Math.abs(Math.sin(2 * Math.PI * 3 * (t - 3.95))) * (1 - prog(t, 4.5, 4.9)) : 0;
  return (
    <>
      <Spr n="crane" x={CRANE_FX + dx} y={G + bounce} s={CS} sx={-1} />
      <Svg>
        <line x1={px} y1={py + bounce} x2={ct.x} y2={ct.y} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      </Svg>
      <Spr n="ball" x={bx} y={by} s={BALL_S} ax={SPR.ball.c[0]} ay={SPR.ball.c[1]} rot={-th / D2R} />
    </>
  );
};

// ---------- phone wires to the city + the phone bubble ----------
const LEFT_FAR = {x: -1000, y: 330};
const RIGHT_FAR = {x: 2100, y: 330};
const wirePath = (a: {x: number; y: number}, b: {x: number; y: number}, sag: number) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 + sag;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
};
const Wires: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t < T.phone2 - 0.05) return null;
  const rc = roofCorners(t);
  const reveal = easeOutCubic(prog(t, T.phone2 - 0.05, T.phone2 + 0.45));
  const broken = t > T.cut && t < T.so2;
  const fall = easeOutBack(prog(t, T.cut, T.cut + 0.45), 1.4);
  const slackL = 140 + 120 * prog(t, T_ROLL0, T_ROLL1);
  const ends = [
    {a: rc.l, b: LEFT_FAR, sag: slackL, side: -1},
    {a: rc.r, b: RIGHT_FAR, sag: 160 + 60 * prog(t, T_ROLL0, T_ROLL1), side: 1},
  ];
  return (
    <g>
      {ends.map((e, i) => {
        // revealed from the roof outwards
        const b = {x: lerp(e.a.x, e.b.x, reveal), y: lerp(e.a.y, e.b.y, reveal)};
        const a = e.a;
        const sag = e.sag * reveal;
        if (broken) {
          // snapped in the middle: a stub dangles from the roof, the far half drops out of sight
          const sw = 14 * Math.sin(2 * Math.PI * 1.3 * (t - T.cut)) * Math.exp(-1.5 * (t - T.cut));
          const len = 300 * fall;
          const ang = (e.side * 18 + sw) * D2R;
          const tip = {x: e.a.x + e.side * Math.sin(Math.abs(ang)) * len * 0.3 + Math.sin(ang) * len * 0.2, y: e.a.y + Math.cos(ang) * len};
          const far = {x: lerp((e.a.x + e.b.x) / 2, e.b.x, fall), y: e.b.y + 700 * fall};
          return (
            <g key={i}>
              <path d={`M ${e.a.x} ${e.a.y} Q ${e.a.x + e.side * 60} ${e.a.y + len * 0.4} ${tip.x} ${tip.y}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
              <path d={wirePath(far, e.b, 40)} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
              <Sparkle x={tip.x} y={tip.y} r={34} s={(0.6 + 0.4 * Math.sin(tr * 40)) * prog(t, T.cut, T.cut + 0.1) * (1 - prog(t, 10.6, 10.9))} rot={tr * 300} />
              <Sparkle x={e.a.x} y={e.a.y} r={46} s={bump(t, T.cut, 0.35) * 1.2} rot={tr * 200} />
            </g>
          );
        }
        const d = wirePath(a, b, sag);
        const dots = t < T.cut + 0.02 && t > T.phone2 + 0.3;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            {dots
              ? [0, 1, 2].map((j) => {
                  const u = (tr * 0.9 + j / 3 + i * 0.17) % 1;
                  const mx = (a.x + b.x) / 2;
                  const my = (a.y + b.y) / 2 + sag;
                  const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x;
                  const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y;
                  return <circle key={j} cx={x} cy={y} r={11 * Math.sin(Math.PI * u)} fill="#FFE45C" stroke={INK} strokeWidth={4} />;
                })
              : null}
          </g>
        );
      })}
    </g>
  );
};
const BUB = {x: 1000, y: -235, r: 150};
const PhoneBubble: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const s = outPop(t, T.phone2 - 0.1, T.callsEnd + 0.25, 0.3, 0.2);
  if (s <= 0.001) return null;
  const ringing = t < T.cut;
  const jig = ringing ? 6 * Math.sin(2 * Math.PI * 16 * tr) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.7 * (tr - T.phone2))) : 0;
  const ps = 0.33;
  const droop = t > T.cut ? -10 * easeOutCubic(prog(t, T.cut, T.cut + 0.5)) : 0;
  return (
    <g transform={`translate(${BUB.x} ${BUB.y}) scale(${s})`}>
      <circle cx={-170} cy={175} r={16} fill="#FEFDFD" stroke={INK} strokeWidth={6} />
      <circle cx={-118} cy={125} r={26} fill="#FEFDFD" stroke={INK} strokeWidth={6} />
      <circle r={BUB.r} fill="#FEFDFD" stroke={INK} strokeWidth={8} />
      <g transform={`rotate(${jig + droop}) translate(0 ${BUB.r * 0.6})`}>
        <image href={F('phone')} x={-SPR.phone.feet[0] * ps} y={-SPR.phone.feet[1] * ps} width={SPR.phone.w * ps} height={SPR.phone.h * ps} />
      </g>
      {ringing ? (
        <>
          <RingLines x={60} y={-60} r={44} s={1} tr={tr} />
          <RingLines x={-70} y={-60} r={44} s={1} tr={tr} side={-1} />
        </>
      ) : null}
      <Mark x={95} y={-95} size={92} s={pop(t, 9.92, 0.25)} text="?" rot={12} />
    </g>
  );
};

// ---------- the guy ----------
const guyPose = (t: number): {n: Pose; tSwap: number} => {
  if (t < T.but) return {n: 'hero', tSwap: -9};
  if (t < T.architect) return {n: 'shock', tSwap: T.but};
  if (t < T.rolled) return {n: 'idea', tSwap: T.architect};
  if (t < T.tons) return {n: 'push', tSwap: T.rolled};
  return {n: 'cheer', tSwap: T.tons};
};
const guyX = (t: number, n: Pose) => {
  if (n !== 'push' && n !== 'cheer') return GX;
  const tipOff = (SPR.push.tip[0] - SPR.push.feet[0]) * sc('push');
  const want = rightWall(t) + tipOff - 6;
  if (n === 'push') return want;
  return want + 30;
};
const Guy: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t >= T_CU) return null;
  const {n, tSwap} = guyPose(t);
  const s = sc(n);
  const [qx, qy] = squashSwap(t, tSwap);
  const br = n === 'push' ? 1 + 0.02 * Math.sin(2 * Math.PI * 4 * tr) : breathe(tr);
  const trem = n === 'shock' ? 1.6 * Math.sin(2 * Math.PI * 11 * tr) : 0;
  const hop = n === 'cheer' ? -16 * Math.abs(Math.sin(2 * Math.PI * 1.6 * (t - T.tons))) : n === 'idea' ? -10 * bump(t, T.architect, 0.3) : 0;
  const x = guyX(t, n) + trem;
  const y = G + hop;
  return (
    <>
      <Svg>
        <ellipse cx={guyX(t, n)} cy={G + 4} rx={(n === 'push' ? 120 : 70) * (1 + hop / 200)} ry={12} fill="rgba(72, 54, 42, 0.26)" style={{filter: 'blur(3px)'}} />
      </Svg>
      <Spr n={n} x={x} y={y} s={s} sx={-qx} sy={qy * br} />
    </>
  );
};
// lightbulb over the guy's head (the idea)
const Bulb: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const s = outPop(t, T.architect + 0.08, T.they, 0.3, 0.2);
  if (s <= 0.001) return null;
  const hx = GX - (HEADS.idea[0] - SPR.idea.feet[0]) * sc('idea');
  const hy = G - (SPR.idea.feet[1] - HEADS.idea[1]) * sc('idea');
  const x = hx + 10;
  const y = hy - 150 + 4 * Math.sin(tr * 3);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (-90 + (i - 3) * 30) * D2R;
        const r0 = 62 + 6 * Math.sin(tr * 8 + i);
        return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * (r0 + 26)} y2={Math.sin(a) * (r0 + 26)} stroke={INK} strokeWidth={8} strokeLinecap="round" />;
      })}
      <circle cx={0} cy={0} r={44} fill="#FFE45C" stroke={INK} strokeWidth={7} />
      <circle cx={-14} cy={-14} r={10} fill="#FFFFFF" />
      <rect x={-20} y={38} width={40} height={30} rx={6} fill="#A8ADB3" stroke={INK} strokeWidth={6} />
    </g>
  );
};

// ---------- story props in the sky: the 1930 card, the blueprint, the move arrow, the 11,000 TONS label ----------
const SignCard: React.FC<{x: number; y: number; w: number; h: number; s: number; rot?: number; fill: string; children: React.ReactNode}> = ({x, y, w, h, s, rot = 0, fill, children}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2 + 10} y={-h / 2 + 12} width={w} height={h} rx={22} fill="rgba(0,0,0,0.18)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={fill} stroke={INK} strokeWidth={9} />
      {children}
    </g>
  );
const Blueprint: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const s = outPop(t, 2.0, 3.85, 0.3, 0.2);
  if (s <= 0.001) return null;
  const w = 330;
  const h = 400;
  const wob = 2 * Math.sin(tr * 2.2);
  return (
    <SignCard x={600} y={-290} w={w} h={h} s={s} rot={-4 + wob} fill="#2F6FB5">
      {/* a taller new building, drawn in white chalk lines */}
      <rect x={-80} y={-150} width={160} height={290} fill="none" stroke="#EAF3FF" strokeWidth={7} />
      <rect x={-50} y={-180} width={100} height={30} fill="none" stroke="#EAF3FF" strokeWidth={6} />
      {[-110, -60, -10, 40, 90].map((yy) =>
        [-45, 0, 45].map((xx) => <rect key={`${xx}${yy}`} x={xx - 14} y={yy - 14} width={28} height={30} fill="none" stroke="#EAF3FF" strokeWidth={4} />),
      )}
      <line x1={-140} x2={140} y1={160} y2={160} stroke="#EAF3FF" strokeWidth={5} strokeDasharray="14 10" />
    </SignCard>
  );
};
const MoveArrow: React.FC<{t: number}> = ({t}) => {
  const u = easeOutCubic(prog(t, T.move - 0.04, T.move + 0.42));
  const out = 1 - easeInCubic(prog(t, T.rolled + 0.2, T.rolled + 0.45));
  if (u <= 0.001 || out <= 0.001) return null;
  // a fat curved arrow over the roof, from the right side towards the empty lot on the left
  const x0 = 950;
  const x1 = 345;
  const y0 = 30;
  const top = -150;
  const pts: [number, number][] = [];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const v = (i / N) * u;
    pts.push([lerp(x0, x1, v), y0 + (top - y0) * 4 * v * (1 - v)]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const [ex, ey] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const ang = Math.atan2(ey - py, ex - px) / D2R;
  return (
    <g opacity={1} transform={`translate(${(1 - out) * 0} 0)`}>
      <g transform={`translate(${ex} ${ey}) scale(${out}) translate(${-ex} ${-ey})`}>
        <path d={d} fill="none" stroke={INK} strokeWidth={58} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#FFD23F" strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(${ex} ${ey}) rotate(${ang})`}>
          <path d="M 70 0 L -30 -62 L -30 62 Z" fill="#FFD23F" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
};

// a white poof cloud (rewind of the what-if)
const Poof: React.FC<{x: number; y: number; t: number; t0: number; R?: number}> = ({x, y, t, t0, R = 120}) => {
  const u = prog(t, t0, t0 + 0.55);
  if (u <= 0 || u >= 1) return null;
  const sz = Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u * 0.4);
  const puffs: Puff[] = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    return {x: x + Math.cos(a) * R * (0.5 + 0.5 * u), y: y + Math.sin(a) * R * 0.7 * (0.5 + 0.5 * u), r: R * 0.55 * sz * (0.8 + 0.4 * rnd(i))};
  });
  puffs.push({x, y, r: R * 0.75 * sz});
  return <PuffCluster puffs={puffs} fill="#FFFFFF" ink={6} />;
};

// ---------- the world scene ----------
export const Scene: React.FC<{t: number; tr: number; cam: Cam; cover?: boolean}> = ({t, tr, cam, cover}) => {
  const rc = roofCorners(t);
  return (
    <>
      <Backdrop cam={cam} />
      <World cam={cam}>
        <Svg>
          <Street />
          <Wires t={t} tr={tr} />
        </Svg>
        <Building t={t} tr={tr} />
        <Svg>
          <Rollers t={t} />
        </Svg>
        <Crane t={t} tr={tr} />
        <Guy t={t} tr={tr} />
        <Svg>
          <Mark x={560} y={-300} size={150} s={cover ? 0 : outPop(t, T.y1930, 1.95, 0.3, 0.2)} text="1930" rot={-6} fill="#FFD23F" />
          <Blueprint t={t} tr={tr} />
          <Bulb t={t} tr={tr} />
          {cover ? null : <MoveArrow t={t} />}
          <Mark x={bxAt(t)} y={-150} size={118} s={cover ? 0 : outPop(t, T.eleven, 15.86, 0.3, 0.16)} text="11,000 TONS" rot={-4} fill="#FFFFFF" />
          <PhoneBubble t={t} tr={tr} />
          <Poof x={PIV.x - 250} y={PIV.y + 520} t={t} t0={T.so2 - 0.08} R={150} />
          <Poof x={rc.l.x} y={rc.l.y} t={t} t0={T.so2 - 0.05} R={80} />
          <Poof x={rc.r.x} y={rc.r.y} t={t} t0={T.so2 - 0.02} R={80} />
        </Svg>
      </World>
    </>
  );
};

// ---------- the close-up: an operator inside, the street sliding past the window ----------
const CU_OP_S = 0.95;
const WIN = {x: 150, y: 150, w: 780, h: 760};
export const CloseUp: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const u = t - T_CU;
  const k = 1 + 0.03 * prog(t, T_CU, DURATION);
  // the street outside slides to the right (the building rolls to the left)
  const slide = 160 + 75 * u;
  const opX = 540 - OP.head[0] * CU_OP_S;
  const opTop = 1920 - OP.bottom * CU_OP_S + 30;
  const eye = OP.eyes[1];
  const wink = clamp(easeOutCubic(prog(t, T.inside + 0.02, T.inside + 0.14))) * (1 - easeInCubic(prog(t, 18.95, 19.1)));
  const ex = opX + eye[0] * CU_OP_S;
  const ey = opTop + eye[1] * CU_OP_S;
  const cup = OP.cup!;
  const cupX = opX + cup[0] * CU_OP_S;
  const cupY = opTop + cup[4] * CU_OP_S;
  const ring = t > T.working2 - 0.04 && t < T.working2 + 0.5;
  const jig = ring ? 5 * Math.sin(2 * Math.PI * 16 * tr) : 0;
  const poleX = -260 + 420 * u;
  return (
    <AbsoluteFill style={{background: '#EAD7A8', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${k})`, transformOrigin: '540px 900px'}}>
        {/* wall with a soft lower shade */}
        <div style={{position: 'absolute', left: 0, top: 1180, width: 1080, height: 800, background: '#DCC594'}} />
        <div style={{position: 'absolute', left: 0, top: 1176, width: 1080, height: 10, background: INK}} />
        {/* the window: the street outside slides past */}
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, overflow: 'hidden', background: SKY}}>
          <Img src={F('bg')} style={{position: 'absolute', left: -900 + slide, top: -1210, width: 1024 * 2.3, height: 1536 * 2.3}} />
          <svg style={{position: 'absolute', left: 0, top: 0}} width={WIN.w} height={WIN.h}>
            <rect x={poleX} y={-20} width={46} height={WIN.h + 40} fill="#8B5E3C" stroke={INK} strokeWidth={8} />
            <rect x={poleX - 70} y={110} width={186} height={26} fill="#8B5E3C" stroke={INK} strokeWidth={7} />
            <path d={`M ${poleX - 400} 160 Q ${poleX - 200} 230 ${poleX - 60} 124`} fill="none" stroke={INK} strokeWidth={6} />
            <path d={`M ${poleX + 106} 124 Q ${poleX + 300} 230 ${poleX + 560} 160`} fill="none" stroke={INK} strokeWidth={6} />
          </svg>
        </div>
        <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
          {/* window frame + mullions */}
          <rect x={WIN.x - 22} y={WIN.y - 22} width={WIN.w + 44} height={WIN.h + 44} rx={10} fill="none" stroke={INK} strokeWidth={10} />
          <rect x={WIN.x - 16} y={WIN.y - 16} width={WIN.w + 32} height={WIN.h + 32} fill="none" stroke="#F6EEDC" strokeWidth={22} />
          <rect x={WIN.x - 5} y={WIN.y - 5} width={WIN.w + 10} height={WIN.h + 10} fill="none" stroke={INK} strokeWidth={8} />
          <rect x={WIN.x + WIN.w / 2 - 12} y={WIN.y} width={24} height={WIN.h} fill="#F6EEDC" stroke={INK} strokeWidth={7} />
          <rect x={WIN.x} y={WIN.y + WIN.h / 2 - 12} width={WIN.w} height={24} fill="#F6EEDC" stroke={INK} strokeWidth={7} />
          <rect x={WIN.x - 60} y={WIN.y + WIN.h + 18} width={WIN.w + 120} height={34} rx={8} fill="#F6EEDC" stroke={INK} strokeWidth={8} />
        </svg>
        {/* the operator */}
        <Img src={F('operator')} style={{position: 'absolute', left: opX, top: opTop + 3 * Math.sin(2 * Math.PI * 0.5 * tr), width: OP.w * CU_OP_S, height: OP.h * CU_OP_S}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
          {ring ? (
            <>
              <RingLines x={opX + (OP.head[0] + OP.head[2] * 1.02) * CU_OP_S + jig} y={opTop + OP.head[1] * CU_OP_S + 30} r={48} s={1} tr={tr} />
            </>
          ) : null}
          {/* coffee steam: three slow wavy lines */}
          {[0, 1, 2].map((i) => {
            const ph = (tr * 0.5 + i / 3) % 1;
            const x = cupX - 40 + i * 40;
            const y0 = cupY - 20 - ph * 150;
            const d = `M ${x} ${y0} q 14 -22 0 -44 q -14 -22 0 -44`;
            return <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={10 * Math.sin(Math.PI * ph)} strokeLinecap="round" opacity={0.9} />;
          })}
          {/* the wink: the right eye closes into a happy arc */}
          {wink > 0.01 ? (
            <g>
              <ellipse cx={ex} cy={ey} rx={eye[2] * CU_OP_S * 0.8} ry={eye[3] * CU_OP_S * 0.62 * wink} fill="#FEFDFD" />
              <path d={`M ${ex - 34} ${ey + 4} Q ${ex} ${ey - 26 * wink} ${ex + 34} ${ey + 4}`} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" opacity={wink} />
            </g>
          ) : null}
          <Mark x={540} y={300} size={128} s={pop(t, T.six + 0.04, 0.3)} text="600 PEOPLE" rot={-4} fill="#FFD23F" />
          <Sparkle x={ex + 70} y={ey - 70} r={30} s={bump(t, T.inside + 0.05, 0.4)} rot={tr * 120} fill="#FFFFFF" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const BuildingMoveShort: React.FC = () => {
  useBmFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let cam = camFor(t);
  let amp = 0;
  amp += t > T_HIT && t < 10.0 ? 16 * Math.exp(-7 * (t - T_HIT)) : 0;
  amp += t > T.cut && t < 10.1 ? 6 * Math.exp(-8 * (t - T.cut)) : 0;
  amp += t > 3.95 && t < 4.8 ? 2.5 * bump(t, 3.95, 0.85) : 0;
  amp += t > T.they && t < 13.8 ? 5 * Math.exp(-8 * (t - T.they)) : 0;
  amp += t > T_ROLL0 && t < T_ROLL1 ? 1.6 * bump(t, T_ROLL0, T_ROLL1 - T_ROLL0) : 0;
  amp += t > T.eleven && t < 15.2 ? 7 * Math.exp(-9 * (t - T.eleven - 0.04)) : 0;
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      {t < T_CU ? <Scene t={t} tr={t} cam={cam} /> : <CloseUp t={t} tr={t} />}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('building-move/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="building-move/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
