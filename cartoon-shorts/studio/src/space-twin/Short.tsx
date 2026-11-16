import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as SPT_DURATION, FPS as SPT_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why do astronauts come home taller?" - two identical twins (the channel's white character; the brother wears round
// glasses) stand back to back under a flat ruler. One hops into a rocket and flies to the space station; a DAY counter
// runs to 340; floating, his x-rayed spine stretches like a rubber band. He lands, the wall mark says +2 IN, the brother
// gapes. But: weak wobbly knees, a cracked bone, a deflating muscle. So the living GRAVITY arrow drops onto his head and
// squeezes him back down. 2 DAYS LATER: back to back again, the ruler lands flat - frame 0 again (loop).

const F = (n: string) => staticFile(`space-twin/${n}.png`);
export const FONT = 'SPTInter';
export const useSPTFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const WALL = '#FDEAAF';
const FLOOR = '#E1B683';
const BASE = '#7C5A41';
const NAVY = '#022A5C';
const TEXT_YEL = '#FFD23F';
const RED = '#E8322E';
const GREEN = '#36C26A';
const PURPLE = '#8E6CEB';

// ---------- world (home) ----------
const PS = 1.6; // home plate scale, plate row 1150 = floor line y 0
const PL_X = -512 * PS;
const PL_Y = -1150 * PS;
const BASE_Y = PL_Y + 1000 * PS; // -240
const H = 600; // standing twin height
const STRETCH = 58; // cartoon "two inches"
const HERO_S = H / (1272 - 12);
const BRO_S = H / (828 - 12);
const HERO_X = 140;
const BRO_X = -163;
const SHOCK_S = H / (818 - 13);
const PROUD_S = H / (644 - 12);
const HEADR = SPR.proud.head[2] * PROUD_S; // 131
const WEAK_S = HEADR / SPR.weak.head[2];
const PRESS_S = HEADR / SPR.press.head[2];
const ME_X = 175; // the space twin in the 'lands' shot
const BRO2_X = -190;
const ROCKET_X = 525;
const ROCKET_S = 0.55;
const PORT = {x: ROCKET_X + (385 - 381.5) * ROCKET_S, y: -(1110 - 474) * ROCKET_S};
const TOP_LINE = -H;
const TALL_LINE = -H - STRETCH;

// ---------- time ----------
const CUT_SPACE = T.space - 0.02;
const CUT_FLOAT = T.up - 0.05;
const CUT_HOME = T.he - 0.02;
const JUMP = [4.22, 4.55] as const; // hero hops into the porthole
const LIFT = 4.75;
const LAND = [11.93, 12.22] as const; // rocket comes down
const OUT = [12.25, 12.6] as const; // he jumps out of the porthole
const DROP = [T.gravity, T.gets - 0.02] as const; // gravity arrow falls
const SQZ = [T.squeezing, T.down2 + 0.25] as const;
const CARD = [T.two3 - 0.06, T.theyre - 0.2] as const;
const RULER_IN = [T.theyre - 0.1, T.twins2 + 0.02] as const;

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: -10, y: -335, k: 1.3};
const CAMS: CamKey[] = [
  CAM0,
  {t: 3.7, x: -10, y: -345, k: 1.36},
  {t: 4.25, x: 250, y: -400, k: 1.12, ease: 'io'},
  {t: 4.7, x: 255, y: -405, k: 1.12},
  {t: 5.65, x: 300, y: -900, k: 1.0, ease: 'in'},
  // space (own world, see SpaceScene)
  {t: CUT_HOME, x: 330, y: -420, k: 1.12, ease: 'cut'},
  {t: OUT[0], x: 300, y: -410, k: 1.14, ease: 'io'},
  {t: 12.8, x: 60, y: -360, k: 1.2, ease: 'io'},
  {t: 14.45, x: 40, y: -365, k: 1.24},
  {t: 15.3, x: 150, y: -360, k: 1.45, ease: 'io'},
  {t: 18.3, x: 155, y: -365, k: 1.48},
  {t: 18.95, x: 110, y: -470, k: 1.12, ease: 'io'},
  {t: 19.9, x: 112, y: -460, k: 1.14},
  {t: 21.5, x: 140, y: -380, k: 1.32, ease: 'io'},
  {t: CARD[1] - 0.25, x: 140, y: -380, k: 1.32},
  {t: CARD[1] - 0.24, x: CAM0.x, y: CAM0.y, k: CAM0.k, ease: 'cut'},
  {t: DURATION, x: CAM0.x, y: CAM0.y - 4, k: CAM0.k * 1.02},
];
export const camOf = (t: number): Cam => camAt(t, CAMS);
const SCAMS: CamKey[] = [
  {t: CUT_SPACE, x: -30, y: -150, k: 0.95},
  {t: CUT_FLOAT - 0.01, x: 60, y: -230, k: 1.0},
  {t: CUT_FLOAT, x: 130, y: -330, k: 1.28, ease: 'cut'},
  {t: 9.3, x: 140, y: -340, k: 1.32},
  {t: 9.9, x: 200, y: -320, k: 1.36, ease: 'io'},
  {t: CUT_HOME, x: 215, y: -320, k: 1.3},
];
const sCamOf = (t: number): Cam => camAt(t, SCAMS);

// ---------- helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.22) => pop(t, t0, dur) * (1 - easeInCubic(prog(t, t1 - 0.15, t1)));

type SprName = keyof typeof SPR;
type SP = {w: number; h: number; feet: readonly number[]; head?: readonly number[]};
const sp = (n: SprName) => SPR[n] as unknown as SP;

// A sprite whose body stretches: rows (axis y) or columns (axis x) [cut, cut + band) are stretched by d world units;
// everything before the cut moves by -d (up) or nothing (x axis: everything after the band moves by +d).
const StretchSpr: React.FC<{
  n: SprName;
  x: number;
  y: number;
  s: number;
  d?: number;
  cut?: number;
  band?: number;
  axis?: 'x' | 'y';
  sx?: number;
  sy?: number;
  rot?: number;
  ax?: number;
  ay?: number;
}> = ({n, x, y, s, d = 0, cut = 0, band = 24, axis = 'y', sx = 1, sy = 1, rot = 0, ax, ay}) => {
  const p = sp(n);
  const axx = ax ?? p.feet[0];
  const ayy = ay ?? p.feet[1];
  if (sx <= 0.001 || sy <= 0.001) return null;
  const W = p.w * s;
  const Hh = p.h * s;
  const img = (l: number, tp: number) => <Img src={F(n as string)} style={{position: 'absolute', left: l, top: tp, width: W, height: Hh}} />;
  const L = -axx * s;
  const Tp = -ayy * s;
  if (d < 0.5) {
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
        {img(L, Tp)}
      </div>
    );
  }
  const c = cut * s;
  const b = band * s;
  const box = (l: number, tp: number, w: number, h: number, child: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{position: 'absolute', left: l, top: tp, width: w, height: h, overflow: 'hidden', ...extra}}>{child}</div>
  );
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      {axis === 'y' ? (
        <>
          {box(L, Tp - d, W, c + 2, img(0, 0))}
          {box(L, Tp + c - d, W, b + d + 1, box(0, 0, W, b, img(0, -c), {transform: `scaleY(${(b + d + 1) / b})`, transformOrigin: '0 0'}))}
          {box(L, Tp + c + b - 2, W, Hh - c - b + 2, img(0, -c - b + 2))}
        </>
      ) : (
        <>
          {box(L, Tp, c + 2, Hh, img(0, 0))}
          {box(L + c, Tp, b + d + 1, Hh, box(0, 0, b, Hh, img(-c, 0), {transform: `scaleX(${(b + d + 1) / b})`, transformOrigin: '0 0'}))}
          {box(L + c + b + d - 2, Tp, W - c - b + 2, Hh, img(-c - b + 2, 0))}
        </>
      )}
    </div>
  );
};
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number}> = (p) => <StretchSpr {...p} />;
const neck = (n: SprName) => {
  const h = sp(n).head as readonly number[];
  return h[1] + h[2] * 0.98;
};

const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 9000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; s: number; text: string; size?: number; rot?: number; color?: string}> = ({x, y, s, text, size = 64, rot = 0, color = TEXT_YEL}) =>
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
        color,
        WebkitTextStroke: `${size * 0.2}px #000`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
const Shadow: React.FC<{x: number; w: number; o?: number}> = ({x, w, o = 1}) => (
  <ellipse cx={x} cy={4} rx={w / 2} ry={w * 0.08} fill={`rgba(72, 54, 42, ${0.26 * o})`} style={{filter: 'blur(3px)'}} />
);

// ---------- code props ----------
const Ruler: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-270} y={-30} width={540} height={30} rx={6} fill="#FFC94A" stroke="#000" strokeWidth={6} />
    {Array.from({length: 17}, (_, i) => (
      <line key={i} x1={-240 + i * 30} x2={-240 + i * 30} y1={-30} y2={i % 2 ? -20 : -12} stroke="#000" strokeWidth={4} />
    ))}
  </g>
);
const Check: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={52} fill={GREEN} stroke="#000" strokeWidth={8} />
      <path d="M -24 2 L -6 20 L 26 -16" fill="none" stroke="#fff" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
// living GRAVITY arrow: tip at (0, 0), pointing down
const GravityArrow: React.FC<{t: number; x: number; y: number; s: number; squint?: number; ghost?: boolean}> = ({t, x, y, s, squint = 0, ghost}) => {
  if (s <= 0.001) return null;
  const blink = (t % 2.7 > 2.6 ? 0.9 : 0) as number;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={ghost ? 0.55 : 1}>
      <path
        d="M -105 -440 L 105 -440 L 105 -170 L 190 -170 L 0 0 L -190 -170 L -105 -170 Z"
        fill={ghost ? '#B9A6F2' : PURPLE}
        stroke="#000"
        strokeWidth={10}
        strokeLinejoin="round"
        strokeDasharray={ghost ? '26 18' : undefined}
      />
      <path d="M -82 -420 L -82 -190" stroke="rgba(255,255,255,0.35)" strokeWidth={14} strokeLinecap="round" />
      <Eye x={-42} y={-352} r={28} open={1} lid={Math.max(0.35, blink)} lidTilt={22} look={[0, 0.7]} squeeze={squint > 0.5} side={-1} brow={0.5} browTilt={1.2} />
      <Eye x={42} y={-352} r={28} open={1} lid={Math.max(0.35, blink)} lidTilt={22} look={[0, 0.7]} squeeze={squint > 0.5} side={1} brow={0.5} browTilt={1.2} />
      <path d={squint > 0.5 ? 'M -34 -290 Q 0 -270 34 -290' : 'M -30 -285 Q 0 -300 30 -285'} fill="none" stroke="#000" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};
const GravityText: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => <Label x={x} y={y - 190 * s} s={s} text="GRAVITY" size={40} color="#fff" />;

const Bone: React.FC<{x: number; y: number; s: number; crack: number; droop: number}> = ({x, y, s, crack, droop}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-25 + droop * 18})`}>
      <path
        d="M -120 -16 L 120 -16 A 26 26 0 1 1 140 -44 A 26 26 0 1 1 158 0 A 26 26 0 1 1 140 44 A 26 26 0 1 1 120 16 L -120 16 A 26 26 0 1 1 -140 44 A 26 26 0 1 1 -158 0 A 26 26 0 1 1 -140 -44 A 26 26 0 1 1 -120 -16 Z"
        fill="#FFF8E7"
        stroke="#000"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      {crack > 0.01 ? (
        <path
          d="M -10 -16 L 6 -4 L -8 4 L 10 16"
          fill="none"
          stroke="#000"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={60}
          strokeDashoffset={60 * (1 - crack)}
        />
      ) : null}
      {[0, 1, 2].map((i) => {
        const u = prog(crack, 0.5 + i * 0.1, 1);
        return u > 0.01 && u < 0.99 ? <circle key={i} cx={-10 + i * 10} cy={30 + 60 * u} r={6 * (1 - u)} fill="#E9DFC4" stroke="#000" strokeWidth={3} /> : null;
      })}
    </g>
  );
// noodle arm flexing a muscle; m = muscle size 1 .. 0.25
const Bicep: React.FC<{x: number; y: number; s: number; m: number}> = ({x, y, s, m}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -120 60 L 0 60 L 30 -70" fill="none" stroke="#000" strokeWidth={62} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M -120 60 L 0 60 L 30 -70" fill="none" stroke="#FEFDFD" strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={-50} cy={60 - 30 * m} rx={30 + 30 * m} ry={14 + 34 * m} fill="#FEFDFD" stroke="#000" strokeWidth={8} />
      <circle cx={34} cy={-92} r={30} fill="#FEFDFD" stroke="#000" strokeWidth={8} />
    </g>
  );

const smokePuffs = (t: number, t0: number, x: number, y: number, n: number, spread: number, seed: number): Puff[] =>
  Array.from({length: n}, (_, i) => {
    const r = Math.sin(i * 91.7 + seed) * 0.5 + 0.5;
    const a = Math.PI * (0.05 + 0.9 * ((i + 0.5) / n));
    const tt = t - t0 - 0.03 * i;
    if (tt < 0) return {x, y, r: 0};
    const u = clamp(tt / (0.9 + 0.3 * r));
    const life = Math.sin(Math.PI * u);
    return {x: x + Math.cos(a) * spread * easeOutCubic(u) * (0.6 + r * 0.6) * (i % 2 ? 1 : -1), y: y - 30 * u - 20 * r * u, r: (36 + 34 * r) * life};
  });

// ---------- HOME scene ----------
const HomeBack: React.FC = () => (
  <>
    <Svg>
      <rect x={-9000} y={-9000} width={18000} height={9000 + BASE_Y} fill={WALL} />
      <rect x={-9000} y={BASE_Y} width={18000} height={48} fill={BASE} />
      <rect x={-9000} y={BASE_Y + 40} width={18000} height={9000} fill={FLOOR} />
    </Svg>
    <Img src={F('home')} style={{position: 'absolute', left: PL_X, top: PL_Y, width: 1024 * PS, height: 1536 * PS}} />
  </>
);

const Home: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  // phases
  const s1 = t < CUT_SPACE; // twins + rocket launch
  const s4 = t >= CUT_HOME && t < CARD[1] - 0.24; // lands .. squeeze
  const s7 = t >= CARD[1] - 0.24; // back to back again
  const backToBack = s1 || s7;

  // ---- S1: hero hop into rocket
  const rocketIn = s1 ? easeOutCubic(prog(t, T.then - 0.05, T.then + 0.45)) : 1;
  const rocketX = s1 ? lerp(1250, ROCKET_X, rocketIn) : ROCKET_X;
  const liftU = prog(t, LIFT, 5.65);
  const rocketY1 = s1 ? -2600 * liftU * liftU : 0;
  const landU = prog(t, LAND[0], LAND[1]);
  const rocketY4 = s4 ? -1700 * (1 - easeOutCubic(landU)) : 0;
  const rocketY = s1 ? rocketY1 : rocketY4;
  const rocketShake = (s1 && t > 4.55 && t < 5.7 ? 3 * Math.sin(t * 70) : 0) + (s4 ? 4 * bump(t, LAND[1], 0.3) * Math.sin(t * 60) : 0);
  const rocketVis = s1 ? t > T.then - 0.05 : s4;
  const rkSq: [number, number] = s1 && t > T.then + 0.3 ? [1 + 0.04 * spring(t - T.then - 0.4, 3, 6), 1 - 0.05 * spring(t - T.then - 0.4, 3, 6)] : s4 ? [1 + 0.05 * spring(t - LAND[1], 3, 6), 1 - 0.07 * spring(t - LAND[1], 3, 6)] : [1, 1];

  const ju = prog(t, JUMP[0], JUMP[1]);
  const heroGone = s1 && t >= JUMP[1];
  const heroSq: [number, number] = t < JUMP[0] && t > JUMP[0] - 0.12 ? [1.05, 0.93] : [1, 1];
  const heroX = s1 && t >= JUMP[0] ? lerp(HERO_X, PORT.x, easeInOutCubic(ju)) : HERO_X;
  const heroY = s1 && t >= JUMP[0] ? lerp(0, PORT.y + 150, ju) - 330 * Math.sin(Math.PI * ju) : 0;
  const heroScale = s1 && t >= JUMP[0] ? lerp(1, 0.25, easeInCubic(ju)) : 1;

  // ---- ruler: flat on heads; slides off when he jumps; drops back in at the end
  let rulerX = 0;
  let rulerY = TOP_LINE;
  let rulerRot = 0;
  let rulerVis = true;
  if (s1) {
    const u = prog(t, JUMP[0] + 0.02, JUMP[0] + 0.32);
    rulerRot = 24 * easeInCubic(u);
    rulerY = TOP_LINE + 600 * easeInCubic(prog(t, JUMP[0] + 0.15, JUMP[0] + 0.55));
    rulerX = 90 * u;
    rulerRot += 60 * prog(t, JUMP[0] + 0.3, JUMP[0] + 0.55);
    if (t > JUMP[0] + 0.55) {
      rulerY = -18;
      rulerRot = 0;
      rulerX = 120;
    }
    if (t < 0.6) rulerY = TOP_LINE - 4 * bump(t, 0.1, 0.4);
    rulerY -= 10 * bump(t, T.height - 0.05, 0.3);
  } else if (s7) {
    const u = prog(t, RULER_IN[0], RULER_IN[1]);
    rulerY = lerp(TOP_LINE - 500, TOP_LINE, easeInCubic(u)) - 14 * bump(t, RULER_IN[1], 0.25);
    rulerRot = 8 * (1 - u);
  } else rulerVis = false;
  if (cover) rulerVis = false;

  // ---- S4..S6: the space twin (proud -> weak -> press), brother (side -> shock)
  const outU = prog(t, OUT[0], OUT[1]);
  const meVisible = s4 && t >= OUT[0];
  const meX = lerp(PORT.x, ME_X, easeOutCubic(outU));
  const meY = t < OUT[1] ? lerp(PORT.y + 100, 0, outU) - 260 * Math.sin(Math.PI * outU) : 0;
  const meScale = t < OUT[1] ? lerp(0.3, 1, easeOutCubic(prog(t, OUT[0], OUT[0] + 0.2))) : 1;
  const landSq: [number, number] = t >= OUT[1] ? [1 + 0.07 * spring(t - OUT[1], 3, 6), 1 - 0.09 * spring(t - OUT[1], 3, 6)] : [1, 1];
  const pose: SprName = t < T.but ? 'proud' : t < DROP[1] ? 'weak' : 'press';
  const poseS = pose === 'proud' ? PROUD_S : pose === 'weak' ? WEAK_S : PRESS_S;
  const sqzU = easeInOutCubic(prog(t, SQZ[0], SQZ[1]));
  const d = STRETCH * (1 - sqzU) - (pose === 'press' ? 22 * bump(t, DROP[1], 0.3) : 0);
  const sw1 = squashSwap(t, T.but);
  const sw2 = squashSwap(t, DROP[1]);
  const wob = pose === 'weak' ? 0.012 * Math.sin(2 * Math.PI * 7 * t) : 0;
  const tremble = pose === 'press' ? 2.5 * Math.sin(2 * Math.PI * 11 * t) : pose === 'weak' ? 2 * Math.sin(2 * Math.PI * 9 * t) : 0;
  const meSx = sw1[0] * sw2[0] * landSq[0] * (1 + wob) * meScale;
  const meSy = sw1[1] * sw2[1] * landSq[1] * breathe(t) * meScale;
  const meHeadTop = -(sp(pose).feet[1] - 12) * poseS - Math.max(d, 0);

  const broShock = s4 && t >= T.taller - 0.05;
  const bsw = squashSwap(t, T.taller - 0.05);

  // gravity arrow on his head
  const dropU = prog(t, DROP[0], DROP[1]);
  const arrowTipY = s4 ? (t < DROP[1] ? lerp(-1500, meHeadTop - 35, easeInCubic(dropU)) : meHeadTop - 35 - 10 * bump(t, DROP[1], 0.25)) : 0;
  const arrowVis = s4 && t >= DROP[0];

  // labels
  const plusS = s4 ? popOut(t, T.taller, T.so2 + 0.1) : 0;
  const tallLineS = s4 ? popOut(t, T.taller - 0.1, SQZ[1] + 0.1, 0.3) : 0;
  const boneS = s4 ? popOut(t, T.bones - 0.05, T.so2 + 0.2) : 0;
  const bicepS = s4 ? popOut(t, T.muscles - 0.05, T.so2 + 0.25) : 0;
  const sweat = s4 ? pop(t, T.price, 0.25) * (1 - prog(t, T.so2, T.so2 + 0.2)) : 0;

  const heroBreath = breathe(t, 0);
  const broBreath = breathe(t, 0);

  return (
    <>
      <HomeBack />
      {/* wall marks */}
      <Svg>
        {backToBack || s4 ? (
          <>
            <line x1={-420} x2={420} y1={TOP_LINE} y2={TOP_LINE} stroke="#5B4A3A" strokeWidth={6} strokeDasharray="22 16" strokeLinecap="round" opacity={0.75} />
          </>
        ) : null}
        {tallLineS > 0.01 ? (
          <g transform={`translate(${ME_X} ${TALL_LINE}) scale(${tallLineS}, 1)`}>
            <line x1={-230} x2={230} y1={0} y2={0} stroke={RED} strokeWidth={9} strokeLinecap="round" />
          </g>
        ) : null}
        {plusS > 0.01 ? (
          <g transform={`translate(${ME_X + 245} ${(TOP_LINE + TALL_LINE) / 2}) scale(${plusS})`}>
            <path d={`M 0 ${STRETCH / 2 + 6} L 0 ${-STRETCH / 2 - 6}`} stroke="#000" strokeWidth={16} strokeLinecap="round" />
            <path d={`M 0 ${STRETCH / 2 + 6} L 0 ${-STRETCH / 2 - 6}`} stroke={RED} strokeWidth={8} strokeLinecap="round" />
            <path d={`M -18 ${-STRETCH / 2 + 14} L 0 ${-STRETCH / 2 - 8} L 18 ${-STRETCH / 2 + 14}`} fill="none" stroke={RED} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
        {/* shadows */}
        {backToBack ? (
          <>
            <Shadow x={BRO_X + 40} w={230} />
            <Shadow x={HERO_X - 40} w={230} o={heroGone ? 0 : 1} />
          </>
        ) : null}
        {s4 ? (
          <>
            <Shadow x={BRO2_X + (broShock ? 0 : 25)} w={240} />
            {meVisible ? <Shadow x={meX} w={250} o={t < OUT[1] ? outU : 1} /> : null}
            {!cover ? <Shadow x={ROCKET_X} w={420} o={rocketY < -50 ? 0 : 1} /> : null}
          </>
        ) : null}
        {s1 && rocketVis ? <Shadow x={rocketX} w={420} o={1 - liftU * 4} /> : null}
      </Svg>

      {/* rocket (behind the characters) */}
      {rocketVis && !cover ? (
        <>
          <Svg>
            {s1 && t > 4.55 ? <PuffCluster puffs={smokePuffs(t, 4.55, ROCKET_X, -10, 14, 420, 1)} fill="#E9E9EE" ink={6} /> : null}
            {s1 && t > LIFT ? (
              <g transform={`translate(${rocketX} ${rocketY1 + 30})`}>
                <path d={`M -50 0 Q 0 ${300 + 40 * Math.sin(t * 40)} 50 0 Z`} fill="#FF8A2B" stroke="#000" strokeWidth={8} />
                <path d="M -26 0 Q 0 170 26 0 Z" fill="#FFD23F" />
              </g>
            ) : null}
          </Svg>
          <Spr n="rocket" x={rocketX + rocketShake} y={rocketY} s={ROCKET_S} sx={rkSq[0]} sy={rkSq[1]} />
          <Svg>
            {s4 && t < LAND[1] + 0.1 ? (
              <g transform={`translate(${ROCKET_X} ${rocketY4 + 30})`}>
                <path d={`M -45 0 Q 0 ${180 + 30 * Math.sin(t * 40)} 45 0 Z`} fill="#FF8A2B" stroke="#000" strokeWidth={8} />
              </g>
            ) : null}
            {s4 && t > LAND[1] - 0.05 ? <PuffCluster puffs={smokePuffs(t, LAND[1] - 0.05, ROCKET_X, -10, 12, 380, 7)} fill="#E9E9EE" ink={6} /> : null}
          </Svg>
        </>
      ) : null}

      {/* twins */}
      {backToBack ? (
        <>
          <Spr n="bro" x={BRO_X} y={0} s={BRO_S} sy={broBreath} />
          {!heroGone ? <Spr n="hero" x={heroX} y={heroY} s={HERO_S * heroScale} sx={heroSq[0]} sy={heroSq[1] * heroBreath} rot={s1 && t >= JUMP[0] ? 20 * ju : 0} /> : null}
        </>
      ) : null}
      {s4 ? (
        <>
          {broShock ? (
            <Spr n="shock" x={BRO2_X + 1.5 * Math.sin(t * 50)} y={0} s={SHOCK_S} sx={bsw[0]} sy={bsw[1] * breathe(t, 1)} />
          ) : (
            <Spr n="bro" x={BRO2_X + 25} y={0} s={BRO_S} sx={bsw[0]} sy={bsw[1] * broBreath} />
          )}
          {meVisible ? (
            <StretchSpr
              n={pose}
              x={meX + tremble}
              y={meY}
              s={poseS}
              d={Math.max(d, 0)}
              cut={neck(pose)}
              band={26}
              sx={meSx}
              sy={pose === 'press' ? meSy * (1 - 0.04 * bump(t, DROP[1], 0.3)) : meSy}
              rot={t < OUT[1] ? -15 * (1 - outU) : 0}
            />
          ) : null}
        </>
      ) : null}

      {/* foreground svg: ruler, icons, arrow */}
      <Svg>
        {rulerVis ? <Ruler x={rulerX} y={rulerY} rot={rulerRot} /> : null}
        {backToBack ? <Check x={0} y={TOP_LINE - 120} s={s1 ? popOut(t, T.same, T.then) : pop(t, T.again - 0.05, 0.3)} /> : null}
        {heroGone && t < JUMP[1] + 0.35 ? <PuffCluster puffs={smokePuffs(t, JUMP[1] - 0.05, PORT.x, PORT.y + 40, 7, 90, 3)} fill="#FFFFFF" ink={5} /> : null}
        {s4 && t > OUT[0] - 0.05 && t < OUT[0] + 0.4 ? <PuffCluster puffs={smokePuffs(t, OUT[0] - 0.05, PORT.x, PORT.y + 40, 7, 90, 5)} fill="#FFFFFF" ink={5} /> : null}
        {s4 && t > OUT[1] - 0.02 && t < OUT[1] + 0.6 ? <PuffCluster puffs={smokePuffs(t, OUT[1] - 0.02, ME_X, -6, 8, 200, 9)} fill="#F4E4C8" ink={5} /> : null}
        <Bone x={ME_X - 170} y={-925} s={boneS * 0.85} crack={prog(t, T.bones + 0.2, T.bones + 0.5)} droop={easeOutCubic(prog(t, T.bones + 0.45, T.bones + 0.9))} />
        <Bicep x={ME_X + 200} y={-880} s={bicepS * 0.9} m={lerp(1, 0.25, easeInOutCubic(prog(t, T.got - 0.05, T.weaker + 0.4)))} />
        {meVisible ? <SweatDrop x={meX + 95} y={meHeadTop + 60 + 50 * prog(t, T.price, T.so2)} r={22} s={sweat} rot={10} /> : null}
        {arrowVis ? <GravityArrow t={t} x={meX} y={arrowTipY} s={0.8} squint={t > SQZ[0] && t < SQZ[1] ? 1 : 0} /> : null}
        {/* "?" over the brother when the twin is gone */}
        {s1 && t > 5.0 ? <text x={BRO_X - 40} y={TOP_LINE - 70} fontFamily={FONT} fontSize={90 * pop(t, 5.0, 0.25)} textAnchor="middle" fill={TEXT_YEL} stroke="#000" strokeWidth={12} paintOrder="stroke">?</text> : null}
      </Svg>
      {arrowVis ? <GravityText x={meX} y={arrowTipY} s={0.8} /> : null}
      <Label x={ME_X - 10} y={TALL_LINE - 90} s={plusS} text="+2 IN" size={74} rot={-6} />
    </>
  );
};

// ---------- SPACE scene ----------
const SPS = 1.5;
const STATION = {x: 0.78 * 1024 * SPS - 512 * SPS, y: 0.16 * 1536 * SPS - 768 * SPS};
const FLOAT_S = HEADR / SPR.float.head[2];
const Space: React.FC<{t: number}> = ({t}) => {
  const fly = prog(t, CUT_SPACE, 6.75);
  const fu = easeInOutCubic(fly);
  const rx = lerp(-560, STATION.x - 20, fu);
  const ry = lerp(700, STATION.y + 40, fu) + 120 * Math.sin(Math.PI * fu);
  const rs = lerp(0.36, 0.05, fu);
  const rocketVis = t < 6.75;
  const dayS = popOut(t, T.almost - 0.1, CUT_FLOAT + 2.2);
  const day = Math.round(lerp(1, 340, easeInOutCubic(prog(t, T.almost, T.year + 0.4))));
  const floatOn = t >= CUT_FLOAT;
  const drift = {x: 10 * Math.sin(t * 0.9), y: 14 * Math.sin(t * 1.3)};
  const rot = 3 * Math.sin(t * 0.8);
  // stretch of the spine
  const st = easeInOutCubic(prog(t, T.slowly - 0.05, T.out + 0.35));
  const d = STRETCH * 1.3 * st;
  const xray = prog(t, T.spine - 0.05, T.spine + 0.25) * (1 - prog(t, CUT_HOME - 0.2, CUT_HOME));
  const fx = drift.x - 40;
  const fy = -300 + drift.y;
  // float sprite anchor = head centre
  const hx = SPR.float.head[0];
  const hy = SPR.float.head[1];
  const ghostS = popOut(t, T.presses - 0.05, T.spine + 0.15);
  const xS = pop(t, T.down - 0.02, 0.2);
  // spine geometry in float-sprite px (body axis left -> right)
  const sp0 = 452;
  const sp1 = 650;
  const sy = 214;
  return (
    <>
      <Svg>
        <rect x={-9000} y={-9000} width={18000} height={18000} fill={NAVY} />
      </Svg>
      <Img src={F('space')} style={{position: 'absolute', left: -512 * SPS, top: -768 * SPS, width: 1024 * SPS, height: 1536 * SPS}} />
      <Svg>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = -600 + ((i * 337) % 1200);
          const y = -1000 + ((i * 523) % 900);
          const s = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
          return <path key={i} transform={`translate(${x} ${y}) scale(${0.6 + 0.6 * s})`} d="M 0 -14 L 4 -4 L 14 0 L 4 4 L 0 14 L -4 4 L -14 0 L -4 -4 Z" fill="#fff" />;
        })}
        {rocketVis ? (
          <g>
            {Array.from({length: 7}, (_, i) => {
              const u = clamp(fu - i * 0.035);
              const px = lerp(-560, STATION.x - 20, u);
              const py = lerp(700, STATION.y + 40, u) + 120 * Math.sin(Math.PI * u);
              const r = lerp(30, 6, u) * (1 - i / 8);
              return <circle key={i} cx={px} cy={py + 30} r={r} fill="#E9E9EE" stroke="#000" strokeWidth={4} />;
            })}
          </g>
        ) : null}
        {t > 6.7 && t < 7.1 ? <PuffCluster puffs={smokePuffs(t, 6.7, STATION.x - 20, STATION.y + 40, 6, 60, 2).map((p) => ({...p, r: p.r * 0.4}))} fill="#fff" ink={4} /> : null}
      </Svg>
      {rocketVis ? <Spr n="rocket" x={rx} y={ry} s={rs} rot={38} /> : null}
      {floatOn ? (
        <>
          <div style={{position: 'absolute', left: fx, top: fy, transform: `rotate(${rot}deg)`, transformOrigin: '0 0'}}>
            <StretchSpr n="float" x={0} y={0} s={FLOAT_S} ax={hx} ay={hy} d={d} cut={sp0 - 10} band={40} axis="x" />
            {xray > 0.01 ? (
              <Svg>
                <g opacity={xray}>
                  <rect
                    x={(sp0 - 30 - hx) * FLOAT_S}
                    y={(sy - 62 - hy) * FLOAT_S}
                    width={(sp1 - sp0 + 60) * FLOAT_S + d}
                    height={124 * FLOAT_S}
                    rx={30}
                    fill="rgba(40, 90, 170, 0.82)"
                    stroke="#000"
                    strokeWidth={6}
                  />
                  {Array.from({length: 6}, (_, i) => {
                    const L = (sp1 - sp0) * FLOAT_S + d;
                    const gap = 8 + d / 7;
                    const vw = (L - gap * 5) / 6;
                    const x0 = (sp0 - hx) * FLOAT_S + i * (vw + gap);
                    const yy = (sy - hy) * FLOAT_S;
                    return (
                      <g key={i}>
                        <rect x={x0} y={yy - 26} width={vw} height={52} rx={10} fill="#F6F1E4" stroke="#000" strokeWidth={5} />
                        {i < 5 ? <rect x={x0 + vw + 1} y={yy - 18} width={gap - 2} height={36} rx={gap / 2 - 1} fill="#FF8FB1" stroke="#000" strokeWidth={4} /> : null}
                      </g>
                    );
                  })}
                </g>
              </Svg>
            ) : null}
          </div>
          <Svg>
            <g transform={`translate(${fx + 40} ${fy - 190})`}>
              <GravityArrow t={t} x={0} y={0} s={0.6 * ghostS} ghost />
              {xS > 0.01 && ghostS > 0.01 ? (
                <g transform={`translate(0 -150) scale(${xS * ghostS * 1.3})`}>
                  <path d="M -80 -80 L 80 80 M 80 -80 L -80 80" stroke="#000" strokeWidth={34} strokeLinecap="round" />
                  <path d="M -80 -80 L 80 80 M 80 -80 L -80 80" stroke={RED} strokeWidth={20} strokeLinecap="round" />
                </g>
              ) : null}
            </g>
            {/* stretch arrows at both ends */}
            {st > 0.05 && st < 0.999 ? (
              <g opacity={Math.sin(Math.PI * st)}>
                {[-1, 1].map((sd) => (
                  <path
                    key={sd}
                    transform={`translate(${fx + (sd < 0 ? -330 : 520 + d)} ${fy + 60})`}
                    d={`M ${-sd * 0} 0 L ${sd * 70} 0 M ${sd * 48} -22 L ${sd * 72} 0 L ${sd * 48} 22`}
                    fill="none"
                    stroke="#FFD23F"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            ) : null}
          </Svg>
        </>
      ) : null}
      {/* DAY counter (screen-ish: placed above the camera centre) */}
      <Label x={t < CUT_FLOAT ? 60 : 10} y={t < CUT_FLOAT ? -900 : -930} s={dayS * (t < CUT_FLOAT ? 1.1 : 0.85)} text={`DAY ${day}`} size={90} color="#fff" />
    </>
  );
};

// ---------- the "2 DAYS LATER" card (screen space) ----------
const Card: React.FC<{t: number}> = ({t}) => {
  if (t < CARD[0] || t > CARD[1]) return null;
  const s = pop(t, CARD[0], 0.28) * (1 - easeInCubic(prog(t, CARD[1] - 0.2, CARD[1])));
  if (s < 0.06) return null;
  const flipU = prog(t, T.days, T.later + 0.2);
  return (
    <AbsoluteFill style={{background: `rgba(0,0,0,${0.35 * Math.min(1, s)})`}}>
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 900,
          width: 640,
          height: 640,
          transform: `translate(-50%, -50%) scale(${s}) rotate(${-4 + 4 * flipU}deg)`,
          background: '#FFFFFF',
          border: '14px solid #000',
          borderRadius: 40,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 150, background: RED, borderBottom: '12px solid #000'}} />
        {[150, 450].map((x) => (
          <div key={x} style={{position: 'absolute', left: x - 22, top: 40, width: 44, height: 70, borderRadius: 22, background: '#fff', border: '10px solid #000', boxSizing: 'border-box'}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: FONT, fontSize: 230, lineHeight: 1, color: '#000'}}>2</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 415, textAlign: 'center', fontFamily: FONT, fontSize: 84, lineHeight: 1.05, color: '#000'}}>
          DAYS
          <br />
          LATER
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const inSpace = t >= CUT_SPACE && t < CUT_HOME;
  if (inSpace) {
    const sc = sCamOf(t);
    return (
      <AbsoluteFill style={{background: NAVY}}>
        <World cam={sc}>
          <Space t={t} />
        </World>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: WALL}}>
      <World cam={cam}>
        <Home t={t} cover={cover} />
      </World>
      <Card t={t} />
    </AbsoluteFill>
  );
};

export const SceneWithShake: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const sh = shake(t, 6 * bump(t, LIFT, 0.9) + 8 * bump(t, LAND[1], 0.35) + 10 * bump(t, DROP[1], 0.35));
  return <Scene t={t} cam={{x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k}} cover={cover} />;
};

const CUES: Cue[] = [
  {f: 'pop', at: T.same, db: -24, rate: 1.1},
  {f: 'whoosh', at: T.then - 0.1, db: -27, rate: 0.9},
  {f: 'stamp', at: T.then + 0.42, db: -22, rate: 1.2},
  {f: 'boing', at: JUMP[0] - 0.02, db: -26, rate: 1.3},
  {f: 'pop', at: JUMP[1] - 0.04, db: -22},
  {f: 'pop', at: JUMP[0] + 0.55, db: -26, rate: 0.7},
  {f: 'launch', at: 4.55, db: -15, keys: [[4.55, -15], [5.4, -16], [5.75, -40]]},
  {f: 'zoomaway', at: CUT_SPACE, db: -24},
  {f: 'pop', at: 6.72, db: -27, rate: 1.4},
  {f: 'ticks', at: T.almost, db: -30, keys: [[T.almost, -30], [T.year + 0.3, -30], [T.year + 0.5, -60]]},
  {f: 'pop', at: T.presses - 0.05, db: -27, rate: 1.2},
  {f: 'stamp', at: T.down - 0.02, db: -24, rate: 1.4},
  {f: 'pop', at: T.spine - 0.05, db: -25, rate: 0.9},
  {f: 'stretch', at: T.slowly - 0.05, db: -20},
  {f: 'thruster', at: LAND[0] - 0.05, db: -21, keys: [[11.88, -21], [12.3, -22], [12.6, -45]]},
  {f: 'stamp', at: LAND[1], db: -19, rate: 0.8},
  {f: 'boing', at: OUT[0], db: -27, rate: 1.4},
  {f: 'stamp', at: OUT[1], db: -22, rate: 1.0},
  {f: 'pop', at: T.taller - 0.1, db: -23, rate: 1.0},
  {f: 'gulp', at: T.brother + 0.1, db: -24},
  {f: 'knees', at: T.but + 0.02, db: -21},
  {f: 'knees', at: T.but + 0.32, db: -23, rate: 1.1},
  {f: 'knees', at: T.but + 0.62, db: -24, rate: 0.95},
  {f: 'pop', at: T.bones - 0.05, db: -25},
  {f: 'crack', at: T.bones + 0.2, db: -21},
  {f: 'pop', at: T.muscles - 0.05, db: -25, rate: 1.2},
  {f: 'deflate', at: T.got - 0.05, db: -21},
  {f: 'whoosh', at: DROP[0] + 0.1, db: -24, rate: 0.7},
  {f: 'stamp', at: DROP[1] - 0.01, db: -15, rate: 0.7},
  {f: 'squash', at: SQZ[0], db: -20},
  {f: 'squeeze', at: T.spine2, db: -22, rate: 0.85},
  {f: 'flip', at: CARD[0], db: -24},
  {f: 'flip', at: T.later - 0.1, db: -27, rate: 1.1},
  {f: 'stamp', at: RULER_IN[1], db: -23, rate: 1.5},
  {f: 'twinkle', at: T.again - 0.05, db: -21},
];

export const SpaceTwinShort: React.FC = () => {
  useSPTFont();
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: WALL}}>
      <SceneWithShake t={t} cam={camOf(t)} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('space-twin/vo/take1_fit.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('space-twin/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="space-twin/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
