import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT, FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';
import {ConcreteWall, Drops, Dust, Flag, FONT, Mark, Ruler, Splash, Water, YearCard} from './parts';

// "Why don't we just build a wall against tsunamis?" - a side-view school-diagram coast (sea | wall | town).
// Shot A (Taro): the guy with a brick, the wave wakes up; the 10 m wall rises on "Japan did"; in 2011 the wave
// literally jumps it, the town floods and the houses float away. Shot C (Fudai): the mayor's wall rises under his
// feet to 15 m, a ghost of the 1896 wave is just as tall, people laugh, then the 2011 wave slams into the wall and
// bounces off: the houses open their eyes, not one washed away, the mayor is smug.

const F = (n: string) => staticFile(`tsunami-wall/${n}.png`);
export const useTsunamiFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 4.0;

// ---------- world ----------
export const BG_S = 1.75;
export const PW = SPR.bg.w * BG_S; // 1792
export const PH = SPR.bg.h * BG_S; // 2688
export const G = SPR.bg.lines[1] * BG_S; // ground top line
const SKY = '#92D2F2';
const M = 60; // world px per metre
const SEA_Y = G + 14;
const WALL_X = 900; // sea-side face of the walls
const TARO_W = 130;
const FUDAI_W = 170;
const HOUSE_S = 0.55;
const HOUSES = [1440, 1680, 1920];
const GUY = {x: 1170, y: G + 6};
const LAUGHERS = [1300, 1520, 1740];
// character scales: equal head radius for every pose
const HEAD = 55;
const sc = (n: 'hero' | 'run' | 'laugh' | 'point' | 'smug') => HEAD / SPR[n].head[2];

// ---------- shots + cameras ----------
type Shot = 'A' | 'C';
export const CAM0: CamKey = {t: 0, x: 925, y: G - 300, k: 1.3};
const KEYS: Record<Shot, CamKey[]> = {
  A: [
    CAM0,
    {t: 1.85, x: 922, y: G - 305, k: 1.32},
    {t: 2.95, x: 1060, y: G - 450, k: 0.58, ease: 'out'},
    {t: 5.7, x: 1070, y: G - 455, k: 0.59},
    {t: 6.5, x: 1150, y: G - 430, k: 0.6},
    {t: 7.9, x: 1170, y: G - 400, k: 0.66},
  ],
  C: [
    {t: CUT, x: 1060, y: G - 330, k: 1.15},
    {t: 8.7, x: 1060, y: G - 340, k: 1.17},
    {t: 10.2, x: 1000, y: G - 560, k: 0.66},
    {t: 10.65, x: 1000, y: G - 560, k: 0.66},
    {t: 11.5, x: 820, y: G - 560, k: 0.58},
    {t: 12.65, x: 840, y: G - 560, k: 0.58},
    {t: 13.2, x: 1330, y: G - 440, k: 0.8},
    {t: 14.15, x: 1335, y: G - 440, k: 0.81},
    {t: 14.7, x: 960, y: G - 540, k: 0.52},
    {t: 15.25, x: 960, y: G - 540, k: 0.52},
    {t: 16.1, x: 1400, y: G - 420, k: 0.9},
    {t: 17.55, x: 1410, y: G - 418, k: 0.93},
  ],
};

// ---------- sounds (ElevenLabs: 2 new for this video + reused ones from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'rumble', at: 1.7, db: -30, keys: [[1.7, -40], [2.4, -27], [3.0, -36]], dur: 1.4},
  {f: 'whoosh', at: T.tsunamis + 0.1, db: -31, rate: 0.7},
  {f: 'pop', at: T.tsunamis + 0.15, db: -24, rate: 0.9},
  {f: 'grind', at: T.japan, db: -21, dur: 0.8},
  {f: 'rock_crack', at: 3.62, db: -20},
  {f: 'pop', at: T.did, db: -24, rate: 1.2},
  {f: 'flip', at: T.y2011 - 0.28, db: -27},
  {f: 'rumble', at: 4.9, db: -26, keys: [[4.9, -38], [5.7, -24], [6.0, -30]], dur: 1.1},
  {f: 'whoosh', at: T.jumped - 0.08, db: -22, rate: 0.75},
  {f: 'zip', at: 5.95, db: -26},
  {f: 'wave_crash', at: 6.38, db: -14},
  {f: 'flood', at: 6.45, db: -19, keys: [[6.45, -19], [7.5, -24], [7.85, -40]], dur: 1.45},
  {f: 'boing', at: T.ten, db: -29, rate: 1.3},
  {f: 'whoosh', at: CUT, db: -30, rate: 1.3},
  {f: 'grind', at: T.built, db: -20, keys: [[8.7, -20], [9.9, -22], [10.15, -36]], dur: 1.45},
  {f: 'rock_crack', at: 10.15, db: -21, rate: 0.9},
  {f: 'pop', at: T.fifteen, db: -25, rate: 1.1},
  {f: 'whoosh', at: T.old - 0.1, db: -28, rate: 0.6},
  {f: 'splash', at: T.old, db: -27, rate: 0.8},
  {f: 'pop', at: T.high, db: -26, rate: 1.3},
  {f: 'laugh', at: T.people + 0.05, db: -15},
  {f: 'pop', at: 12.95, db: -26, rate: 1.0},
  {f: 'pop', at: 13.05, db: -26, rate: 1.15},
  {f: 'pop', at: 13.15, db: -26, rate: 1.3},
  {f: 'rumble', at: 14.1, db: -24, keys: [[14.1, -36], [14.7, -22], [15.0, -34]], dur: 0.95},
  {f: 'whoosh', at: 14.62, db: -25, rate: 0.7},
  {f: 'wave_crash', at: 14.84, db: -11},
  {f: 'splash', at: 15.05, db: -22},
  {f: 'zip', at: 14.95, db: -27, rate: 1.1},
  {f: 'gulp', at: T.not + 0.05, db: -21},
  {f: 'catch', at: 15.25, db: -24, rate: 1.3},
  {f: 'splash', at: 15.27, db: -30, rate: 1.6},
  {f: 'pop', at: T.not + 0.1, db: -23, rate: 1.0},
  {f: 'pop', at: T.one2, db: -23, rate: 1.15},
  {f: 'pop', at: T.house, db: -23, rate: 1.3},
  {f: 'boing', at: T.washed, db: -27, rate: 1.2},
  {f: 'boing', at: T.away + 0.05, db: -27, rate: 1.45},
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
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; flip?: boolean; ax?: number; ay?: number; style?: React.CSSProperties}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  flip = false,
  ax,
  ay,
  style,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0', ...style}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -3000, top: -3000, overflow: 'visible'}} width={9000} height={9000} viewBox="-3000 -3000 9000 9000">
    {children}
  </svg>
);
const Shadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: 'rgba(52, 80, 30, 0.26)', filter: 'blur(3px)'}} />
);

// ---------- the wave (sprite + code face) ----------
// anchor = middle of its flat base; h = height in world px; face drawn in native sprite coords
const WV = SPR.wave;
const WaveFace: React.FC<{open: number; look: [number, number]; angry: number; squeeze: boolean; mouth: number}> = ({open, look, angry, squeeze, mouth}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WV.w} height={WV.h}>
    <Eye x={655} y={360} r={74} open={open} look={look} squeeze={squeeze} side={-1} lid={0.28 * angry} lidTilt={22 * angry} brow={0.5} browTilt={1.2 * angry} ink={0.18} />
    <Eye x={815} y={346} r={74} open={open} look={look} squeeze={squeeze} side={1} lid={0.28 * angry} lidTilt={22 * angry} brow={0.5} browTilt={1.2 * angry} ink={0.18} />
    {mouth > 0.01 ? (
      <g transform={`translate(700 505) scale(${mouth})`}>
        <path d="M -70 0 Q 0 -30 70 0 Q 0 70 -70 0 Z" fill="#7A1F2B" stroke="#000" strokeWidth={10} strokeLinejoin="round" />
        <path d="M -30 28 Q 0 10 30 28 Q 0 46 -30 28 Z" fill="#FC8D90" />
      </g>
    ) : null}
  </svg>
);
const Wave: React.FC<{
  x: number;
  y: number;
  h: number;
  sx?: number;
  sy?: number;
  rot?: number;
  face?: {open: number; look: [number, number]; angry: number; squeeze: boolean; mouth: number};
  ghost?: boolean;
}> = ({x, y, h, sx = 1, sy = 1, rot = 0, face, ghost = false}) => {
  const s = h / (WV.base[2] - WV.top);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
        transformOrigin: '0 0',
        filter: ghost ? 'grayscale(1) brightness(1.35)' : undefined,
        opacity: ghost ? 0.5 : 1,
      }}
    >
      <div style={{position: 'absolute', left: -WV.feet[0] * s, top: -WV.base[2] * s, width: WV.w * s, height: WV.h * s}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: WV.w, height: WV.h, transform: `scale(${s})`, transformOrigin: '0 0'}}>
          <Img src={F('wave')} style={{position: 'absolute', left: 0, top: 0, width: WV.w, height: WV.h}} />
          {face ? <WaveFace {...face} /> : null}
        </div>
      </div>
    </div>
  );
};
// x of the wave anchor so that its right base corner sits at xr
const waveAnchorFor = (xr: number, h: number) => xr - (WV.base[1] - WV.feet[0]) * (h / (WV.base[2] - WV.top));


// a little fish thrown up by the splash lands on the mayor's hard hat and flaps there
const Fish: React.FC<{x: number; y: number; rot: number; s: number}> = ({x, y, rot, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 34 0 L 62 -22 L 58 0 L 62 22 Z" fill="#FF9F43" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
      <ellipse cx={0} cy={0} rx={42} ry={24} fill="#FF9F43" stroke="#000" strokeWidth={6} />
      <path d="M 6 -22 Q 14 0 6 22" fill="none" stroke="#E07A1F" strokeWidth={5} />
      <circle cx={-22} cy={-6} r={8} fill="#fff" stroke="#000" strokeWidth={3} />
      <circle cx={-24} cy={-6} r={4} fill="#000" />
    </g>
  );

// ---------- houses ----------
const House: React.FC<{n: 'h1' | 'h2' | 'h3'; x: number; y: number; rot?: number; eyes?: number; blink?: number; look?: [number, number]; sy?: number; squeeze?: boolean}> = ({
  n,
  x,
  y,
  rot = 0,
  eyes = 0,
  blink = 0,
  look = [0, 0],
  sy = 1,
  squeeze = false,
}) => {
  const sp = SPR[n];
  const s = HOUSE_S;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scaleY(${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.feet[1] * s, width: sp.w * s, height: sp.h * s}} />
      {eyes > 0.001 ? (
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
          <Eye x={-42} y={-118} r={24} open={eyes} lid={blink} look={look} side={-1} brow={0.5} ink={0.2} squeeze={squeeze} />
          <Eye x={42} y={-118} r={24} open={eyes} lid={blink} look={look} side={1} brow={0.5} ink={0.2} squeeze={squeeze} />
        </svg>
      ) : null}
    </div>
  );
};

// ---------- backdrop: the plate, mirrored on both sides so the camera can pan past its edges ----------
const Backdrop: React.FC<{cam: Cam}> = ({cam}) => {
  const blur = cam.k > 1.05 ? (cam.k - 1.05) * 6 : 0;
  return (
    <World cam={cam} blur={blur}>
      <div style={{position: 'absolute', left: -PW * 2, top: G, width: PW * 5, height: 4000, background: '#C9A46C'}} />
      {[-1, 0, 1].map((i) => (
        <Img
          key={i}
          src={F('bg')}
          style={{position: 'absolute', left: i * PW, top: 0, width: PW + 1, height: PH, transform: i !== 0 ? 'scaleX(-1)' : undefined}}
        />
      ))}
    </World>
  );
};

// ================= SHOT A: Taro =================
const TARO_H = 10 * M;
const taroH = (t: number) => TARO_H * easeOutBack(prog(t, T.japan, T.japan + 0.55), 1.3);
const WA_H = 16 * M;
const JUMP0 = T.jumped - 0.06;
const JUMP1 = 6.42;
const FLOOD = (t: number) => 300 * easeOutCubic(prog(t, JUMP1 - 0.05, JUMP1 + 0.45)) - 60 * prog(t, 7.0, 7.9);

const ShotA: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => {
  const h = taroH(t);
  const wallR = WALL_X + TARO_W;
  // the wave: rises on "tsunamis", inhales on "2011", jumps the wall on "jumped", lands and becomes the flood
  // a small wave in frame 0 swells to 16 m on "tsunamis" (uniform scale about its right base corner)
  const rise = lerp(0.5, 1, easeOutBack(prog(t, T.tsunamis, T.tsunamis + 0.55), 1.4));
  const inhale = 1 + 0.07 * Math.sin(Math.PI * prog(t, 4.9, 5.85));
  const bob = 1 + 0.02 * Math.sin(2 * Math.PI * 0.7 * tr);
  const xr0 = WALL_X - 30;
  const wh = WA_H * rise;
  const ax0 = waveAnchorFor(xr0, wh);
  let wx = ax0;
  let wy = SEA_Y + 70;
  let rot = 0;
  let wsx = 1;
  let wsy = inhale * bob;
  if (t >= JUMP0) {
    const u = prog(t, JUMP0, JUMP1);
    wx = lerp(ax0, 1640, easeInOutCubic(u));
    wy = SEA_Y + 70 - 520 * Math.sin(Math.PI * u) + (G - SEA_Y) * u;
    rot = 14 * Math.sin(Math.PI * u);
    wsx = 1 + 0.08 * Math.sin(Math.PI * u);
    wsy = 1;
  }
  const land = t - JUMP1;
  if (land > 0) {
    const u = easeOutCubic(clamp(land / 0.32));
    wsy = lerp(1, 0.12, u);
    wsx = lerp(1.08, 1.3, u);
    wy = G + 40 * u;
  }
  const showWave = land < 0.4;
  const lvl = FLOOD(t);
  const angry = prog(t, 4.6, 5.0);
  const face = {
    open: 1,
    look: (t < 4.6 ? [1, 0.1] : [1, -0.3]) as [number, number],
    angry,
    squeeze: false,
    mouth: t > 5.7 ? 1 : 0.6 * prog(t, 4.9, 5.2),
  };
  const ph = 2.2 * tr;
  // the houses float away on the flood
  const houseState = (i: number) => {
    const f = clamp((t - JUMP1 - 0.1 * i) / 1.4);
    const x = HOUSES[i] + 520 * f * f + 60 * f;
    const y = G - Math.max(0, lvl - 40) * 0.92;
    const r = 14 * Math.sin(2 * Math.PI * 0.9 * (t - JUMP1) + i) * clamp((t - JUMP1) * 3) * (i % 2 ? -1 : 1);
    return {x, y, r};
  };
  const names = ['h1', 'h2', 'h3'] as const;
  const flagS = pop(t, T.did, 0.25);
  const rulerLs = pop(t, 3.6, 0.25) * (1 + 0.18 * bump(t, T.ten, 0.3));
  return (
    <World cam={cam}>
      {names.map((n, i) => {
        const st = houseState(i);
        return <House key={n} n={n} x={st.x} y={st.y} rot={st.r} eyes={pop(t, T.jumped + 0.05 * i, 0.22)} look={[-1, -0.5]} squeeze={t > JUMP1 + 0.05} />;
      })}
      {showWave ? <Wave x={wx} y={wy} h={wh} sx={wsx} sy={wsy} rot={rot} face={face} /> : null}
      <Svg>
        <Water x0={-3000} x1={WALL_X} y={SEA_Y + (t > JUMP0 ? -10 * Math.sin(Math.PI * prog(t, JUMP0, JUMP1 + 0.3)) : 0)} ph={ph} />
        {lvl > 1 ? <Water x0={wallR} x1={4000} y={G - lvl} ph={ph * 1.6} amp={14} /> : null}
        <ConcreteWall x={WALL_X} y={G} w={TARO_W} h={h} m={M} />
        <Dust x={WALL_X + TARO_W / 2} y={G} w={TARO_W} u={prog(t, T.japan, T.japan + 0.8)} seed={3} />
        <Flag x={WALL_X + TARO_W * 0.7} y={G - h} s={flagS} wave={10 * Math.sin(2 * Math.PI * 1.4 * tr)} />
        <Ruler x={wallR + 70} y={G} h={Math.max(0, h)} label={`${Math.round(clamp(h / M, 0, 10))} m`} ls={rulerLs} />
        <Splash x={wallR + 120} y={G - lvl} r={150} u={prog(t, JUMP1 - 0.05, JUMP1 + 0.75)} seed={11} n={11} />
        <Splash x={WALL_X - 60} y={SEA_Y - 40} r={90} u={prog(t, JUMP0, JUMP0 + 0.6)} seed={21} />
        <Drops x={wallR + 260} y={G - lvl - 140} u={prog(t, JUMP1, JUMP1 + 0.9)} seed={5} n={9} w={600} />
      </Svg>
      <Guy t={t} tr={tr} />
    </World>
  );
};

// the guy in the foreground (A)
const Guy: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const running = t >= T.jumped;
  const sq = squashSwap(t, T.jumped);
  const runU = prog(t, T.jumped + 0.08, T.jumped + 1.0);
  const x = GUY.x + 1500 * runU * runU;
  const hopY = running ? -26 * Math.abs(Math.sin(2 * Math.PI * 4 * (t - T.jumped))) : 0;
  const dy = -30 * bump(t, T.build, 0.24) - 18 * bump(t, T.wall, 0.2) - 36 * bump(t, T.did, 0.26);
  const tremble = t > 4.6 && !running ? 2 * Math.sin(2 * Math.PI * 15 * tr) : 0;
  const n = running ? 'run' : 'hero';
  const s = sc(n);
  const sweat = t > 2.1 && t < T.japan ? pop(t, 2.15, 0.2) * (1 - prog(t, 2.85, 2.95)) : t > 4.7 && !running ? pop(t, 4.75, 0.2) : 0;
  const hs = SPR.hero;
  return (
    <>
      {runU < 1 ? (
        <>
          <Shadow x={x} y={GUY.y} w={170} />
          <Spr n={n} x={x + tremble} y={GUY.y + dy + hopY} s={s} sx={sq[0]} sy={sq[1] * breathe(tr)} rot={running ? 6 : 0} />
          <Svg>
            <SweatDrop x={x + (hs.head[0] - hs.feet[0]) * s + 52} y={GUY.y + (hs.head[1] - hs.feet[1]) * s - 40} r={16} s={sweat} rot={20} />
          </Svg>
        </>
      ) : null}
      <Svg>
        <Mark x={x - 20} y={GUY.y - 400} size={130} s={running ? 0 : pop(t, T.q - 0.25, 0.25) * (1 - prog(t, 2.85, 2.98))} text="?" rot={8 + 6 * Math.sin(2 * Math.PI * 1.2 * t)} />
      </Svg>
    </>
  );
};

// ================= SHOT C: Fudai =================
const FUDAI_H = 15 * M;
const fudaiH = (t: number) => FUDAI_H * easeInOutCubic(prog(t, T.built, 10.15));
const WC_H = 20 * M;
const GHOST_H = 15.3 * M;
const SLAM = 14.8;

const ShotC: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => {
  const h = fudaiH(t);
  const wallR = WALL_X + FUDAI_W;
  const ph = 2.2 * tr;
  // ghost of the 1896 wave: rises out of the sea on "old", sinks after "tsunami"
  const gU = easeOutBack(prog(t, T.old - 0.15, T.old + 0.3), 1.4) * (1 - easeInOutCubic(prog(t, 12.45, 12.85)));
  const gx = waveAnchorFor(WALL_X - 330, GHOST_H);
  // the 2011 wave: rises on "but", slams on "it", then squeezes its eyes and slinks back
  const rise = easeOutBack(prog(t, T.but2 - 0.05, T.but2 + 0.45), 1.3);
  const back = easeInOutCubic(prog(t, 15.45, 16.6));
  const xr = lerp(WALL_X - 190, WALL_X - 10, easeOutCubic(prog(t, 14.55, SLAM))) - 260 * back;
  const wh = WC_H * lerp(1, 0.55, back);
  const slam = t > SLAM ? spring(t - SLAM, 2.6, 5) : 0;
  const wave = {
    x: waveAnchorFor(xr, wh),
    y: SEA_Y + 70,
    sx: 1 - 0.1 * slam,
    sy: Math.max(0.001, rise) * (1 + 0.06 * Math.sin(Math.PI * prog(t, T.but2 + 0.2, 14.62)) + 0.08 * slam),
  };
  const squeeze = t > SLAM + 0.05 && t < 16.0;
  const face = {
    open: pop(t, T.but2 + 0.15, 0.25),
    look: (t < 15.0 ? [1, -0.2] : [1, 0.3]) as [number, number],
    angry: t < SLAM ? 1 : 0,
    squeeze,
    mouth: t < SLAM ? 1 : 0.4,
  };
  const names = ['h2', 'h3', 'h1'] as const;
  const eyeT = [T.not + 0.1, T.one2, T.house];
  const blinkAt = (i: number) => {
    const b = 16.3 + i * 0.07;
    return t > b && t < b + 0.14 ? Math.sin(Math.PI * prog(t, b, b + 0.14)) : 0;
  };
  const lineS = prog(t, T.high, T.high + 0.4) * (1 - prog(t, 12.45, 12.6));
  const crestY = SEA_Y + 70 - GHOST_H;
  // mayor on top of his wall
  const smug = t >= T.not;
  const mn = smug ? 'smug' : 'point';
  const ms = sc(mn);
  const msq = smug ? squashSwap(t, T.not) : squashSwap(t, T.built + 0.02);
  const mx = WALL_X + FUDAI_W / 2;
  const my = G - h;
  const wet = t > SLAM + 0.15 ? 1 : 0;
  const drip = (i: number) => (t > SLAM + 0.3 + i * 0.35 ? prog(t, SLAM + 0.3 + i * 0.35, SLAM + 0.8 + i * 0.35) : 0);
  return (
    <World cam={cam}>
      {names.map((n, i) => (
        <House
          key={n}
          n={n}
          x={HOUSES[i]}
          y={G}
          sy={1 + 0.05 * bump(t, eyeT[i], 0.22) + 0.04 * bump(t, T.washed + 0.08 * i, 0.22) + 0.04 * bump(t, T.away + 0.08 * i, 0.22)}
          eyes={pop(t, eyeT[i], 0.22)}
          blink={blinkAt(i)}
          look={t < 16.0 ? [-0.8, -0.4] : [0, 0]}
        />
      ))}
      {gU > 0.001 ? <Wave x={gx} y={SEA_Y + 70} h={GHOST_H} sy={gU} ghost /> : null}
      {rise > 0.001 ? <Wave x={wave.x} y={wave.y} h={wh} sx={wave.sx} sy={wave.sy} face={face} /> : null}
      <Svg>
        <Water x0={-3000} x1={WALL_X} y={SEA_Y - 12 * Math.sin(Math.PI * prog(t, SLAM - 0.2, SLAM + 0.8))} ph={ph} />
        <ConcreteWall x={WALL_X} y={G} w={FUDAI_W} h={h} m={M} tall />
        <Dust x={WALL_X + FUDAI_W / 2} y={G} w={FUDAI_W} u={prog(t, T.built, T.built + 1.2)} seed={7} />
        <Ruler x={wallR + 80} y={G} h={h} label={`${Math.round(clamp(h / M, 0, 15))} m`} ls={pop(t, T.fifteen, 0.25) * (1 + 0.15 * bump(t, T.tall, 0.3))} />
        {lineS > 0.001 ? (
          <g>
            <line x1={WALL_X - 700} x2={lerp(WALL_X - 700, wallR + 40, lineS)} y1={crestY} y2={crestY} stroke="#000" strokeWidth={14} strokeDasharray="34 22" strokeLinecap="round" />
            <line x1={WALL_X - 700} x2={lerp(WALL_X - 700, wallR + 40, lineS)} y1={crestY} y2={crestY} stroke="#FFD84A" strokeWidth={6} strokeDasharray="34 22" strokeLinecap="round" />
          </g>
        ) : null}
        <Mark x={WALL_X - 560} y={crestY - 90} size={110} s={pop(t, T.old + 0.1, 0.25) * (1 - prog(t, 12.45, 12.6))} text="1896" fill="#E8E8E8" rot={-6} />
        <Splash x={WALL_X + 20} y={G - FUDAI_H - 40} r={170} u={prog(t, SLAM - 0.04, SLAM + 0.85)} seed={31} n={13} spread={1.1} />
        <Splash x={WALL_X - 140} y={SEA_Y - 200} r={120} u={prog(t, SLAM, SLAM + 0.7)} seed={41} />
        <Drops x={WALL_X + 60} y={G - FUDAI_H - 60} u={prog(t, SLAM + 0.1, SLAM + 1.0)} seed={9} n={7} w={360} />
      </Svg>
      {/* the mayor rides his wall up */}
      <Spr n={mn} x={mx} y={my} s={ms} sx={msq[0]} sy={msq[1] * breathe(tr, 1)} />
      <Svg>
        {wet
          ? [0, 1, 2].map((i) => {
              const u = drip(i);
              return u > 0 && u < 1 ? (
                <SweatDrop key={i} x={mx - 40 + 40 * i} y={my - 250 + 120 * u} r={11} s={1 - prog(u, 0.7, 1)} />
              ) : null;
            })
          : null}
        <SweatDrop x={mx + 52} y={my - 215} r={14} s={pop(t, T.waste + 0.05, 0.2) * (1 - prog(t, 14.3, 14.45))} rot={20} />
        {(() => {
          // fish: arc from the splash onto the hat (lands 15.25), then flaps on the hat
          const f0 = SLAM + 0.05;
          const f1 = 15.25;
          if (t < f0) return null;
          const hatY = my - SPR.smug.feet[1] * sc('smug') + 18;
          const u = prog(t, f0, f1);
          const fx = lerp(WALL_X - 60, mx + 6, u);
          const fy = lerp(G - FUDAI_H - 60, hatY, u) - 380 * Math.sin(Math.PI * u);
          const flap = t > f1 ? 16 * Math.sin(2 * Math.PI * 5 * (t - f1)) * Math.exp(-0.8 * (t - f1)) + 6 * Math.sin(2 * Math.PI * 1.3 * tr) : 0;
          const rot = t < f1 ? -540 * u : flap;
          return <Fish x={fx} y={fy - 22} rot={rot} s={0.9 + 0.1 * bump(t, f1, 0.2)} />;
        })()}
      </Svg>
      <Laughers t={t} tr={tr} />
    </World>
  );
};

// the laughing people in the foreground (C)
const Laughers: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const runAt = SLAM + 0.05;
  return (
    <>
      {LAUGHERS.map((lx, i) => {
        const t0 = T.people + 0.05 + i * 0.1;
        const s0 = pop(t, t0, 0.25);
        if (s0 <= 0.001) return null;
        const running = t >= runAt + i * 0.06;
        const n = running ? 'run' : 'laugh';
        const s = sc(n) * (i === 1 ? 0.94 : 1);
        const ru = prog(t, runAt + i * 0.06, runAt + 0.9 + i * 0.06);
        const x = lx + 1300 * ru * ru;
        const shakeL = running ? 0 : 5 * Math.sin(2 * Math.PI * 7 * tr + i) * prog(t, t0, t0 + 0.3);
        const hop = running ? -22 * Math.abs(Math.sin(2 * Math.PI * 4 * (t - runAt) + i)) : -10 * Math.abs(Math.sin(2 * Math.PI * 3 * tr + i));
        const sq = running ? squashSwap(t, runAt + i * 0.06) : [1, 1];
        return ru < 1 ? (
          <React.Fragment key={i}>
            <Shadow x={x} y={GUY.y} w={150} />
            <Spr n={n} x={x + shakeL} y={GUY.y + hop} s={s * s0} sx={sq[0]} sy={sq[1]} rot={running ? 6 : -3 + 3 * Math.sin(2 * Math.PI * 3 * tr + i)} />
          </React.Fragment>
        ) : null;
      })}
      <Svg>
        <Mark x={LAUGHERS[0] + 20} y={GUY.y - 330} size={110} s={pop(t, T.people + 0.15, 0.22) * (1 - prog(t, 14.2, 14.35))} text="HA!" rot={-10 + 5 * Math.sin(2 * Math.PI * 2 * tr)} />
        <Mark x={LAUGHERS[2] - 40} y={GUY.y - 380} size={130} s={pop(t, T.waste, 0.22) * (1 - prog(t, 14.2, 14.35))} text="HA!" rot={9 + 5 * Math.sin(2 * Math.PI * 2 * tr + 1)} />
      </Svg>
    </>
  );
};

// the year card in screen space
const Card: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.y2011 - 0.04, 0.26) * (1 - prog(t, 7.6, 7.8));
  if (s <= 0.001) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
      <YearCard x={790} y={300} w={300} text="2011" s={s} rot={6 + 3 * Math.sin(2 * Math.PI * 0.8 * t)} />
    </svg>
  );
};

export const Scene: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => {
  const shot: Shot = t < CUT ? 'A' : 'C';
  return (
    <>
      <Backdrop cam={cam} />
      {shot === 'A' ? <ShotA t={t} tr={tr} cam={cam} /> : <ShotC t={t} tr={tr} cam={cam} />}
      <Card t={t} />
    </>
  );
};

export const TsunamiWallShort: React.FC = () => {
  useTsunamiFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shot: Shot = t < CUT ? 'A' : 'C';
  let cam = camAt(t, KEYS[shot]);
  let amp = 0;
  if (shot === 'A') {
    amp += t > T.japan ? 6 * Math.exp(-8 * (t - T.japan)) * (t < T.japan + 0.6 ? 1 : 0) : 0;
    amp += t > JUMP1 ? 22 * Math.exp(-4 * (t - JUMP1)) : 0;
    amp += t > 4.9 && t < JUMP0 ? 3 * prog(t, 4.9, 5.8) : 0;
  } else {
    amp += t > T.built && t < 10.15 ? 3.5 : 0;
    amp += t > SLAM ? 26 * Math.exp(-4 * (t - SLAM)) : 0;
    amp += t > 14.3 && t < SLAM ? 3 * prog(t, 14.3, SLAM) : 0;
  }
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} tr={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('tsunami-wall/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="tsunami-wall/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
