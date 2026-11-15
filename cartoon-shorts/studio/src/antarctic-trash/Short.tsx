import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_B, CUT_C, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as AT_DURATION, FPS as AT_FPS} from './scene';
import {camAt, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why don't we bury our trash in Antarctic ice?" - a side-view cutaway of an Antarctic coast.
// A: the guy at his base, the trash pile grows (a bag bonks his head); "Easy": he drags the pile on a sled onto the
//    frozen sea, a penguin judges; the sea ice cracks, the sled slides off and sinks to the bottom of the bay.
// B: he buries a bag deep in the land ice (we see it in the cutaway); the ice opens its eyes, the whole ice shelf slides
//    into the ocean; the edge with an old base cracks off and drifts away as an iceberg, the penguin waves bye.
// C: the bags fly into a little cargo ship that toots and sails home; he waves - and he is holding a new bag (loop).

const F = (n: string) => staticFile(`antarctic-trash/${n}.png`);
export const FONT = 'AntInter';
export const useAntFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1;
const INK = '#000';
export const SKY = `rgb(${SPR.sky.skyTop.join(',')})`;
const FAR_SNOW = `rgb(${SPR.sky.snow.join(',')})`;
const SNOW_TOP = '#F8FCFF';
const ICE_FACE = '#CFE7F7';
const ICE_LINE = '#E4F2FB';
const ICE_DEEP = '#B7D9F0';
const WATER = '#2F86D1';
const WATER_TOP = '#5BAEEA';
const WATER_DEEP = '#2672BD';
const FLOOR = '#7D8AA0';
const ROCK = '#8C97A8';
const SHADOW = 'rgba(60, 100, 150, 0.24)';

// ---------- world (1 unit = 1 screen px at k = 1); the snow / sea surface is y = 0 ----------
const HR = 100; // guy head radius (world)
const SHELF = 380; // ice shelf thickness
const FLOOR_Y = 900; // sea floor
const BAG_S = 0.36;
const SLED_S = 0.55;
const BASE_S = 0.45;
const OLD_S = 0.34;
const PENG_S = 0.31;
const SHIP_S = 0.55;
const PILE_X = -790;
const GUY_A = -500;
const SLED_END = 420; // where the sled stops on the sea ice
const P2 = [SLED_END - 300, SLED_END + 300]; // the floe that sinks the sled
const PENG_A = 1040;
const GUY_B = -640;
const HOLE_X = -527;
const CHUNK = 440; // the piece that calves off
const GUY_C = -280;
const SHIP_X = 400;
const SHIP_Y = 70;

export const CAM0: CamKey = {t: 0, x: -770, y: -223, k: 1.3};
const CAMS: CamKey[] = [
  CAM0,
  {t: 2.0, x: -765, y: -226, k: 1.34},
  {t: 4.7, x: -740, y: -240, k: 1.3, ease: 'io'},
  {t: 6.6, x: 600, y: -230, k: 1.08, ease: 'io'},
  {t: 6.72, x: 600, y: -230, k: 1.08},
  {t: 7.45, x: 420, y: -80, k: 0.74, ease: 'io'},
  {t: 8.9, x: 424, y: -76, k: 0.745},
  {t: 10.3, x: 470, y: 40, k: 0.8, ease: 'io'},
  {t: CUT_B, x: -500, y: -190, k: 1.1, ease: 'cut'},
  {t: 12.4, x: -510, y: -180, k: 1.16},
  {t: 12.62, x: -510, y: -180, k: 1.16},
  {t: 13.4, x: 0, y: -170, k: 0.62, ease: 'io'},
  {t: 14.9, x: 250, y: -170, k: 0.62, ease: 'io'},
  {t: 15.6, x: 255, y: -170, k: 0.62},
  {t: 17.4, x: 640, y: -170, k: 0.66, ease: 'io'},
  {t: CUT_C, x: 120, y: -260, k: 0.98, ease: 'cut'},
  {t: 19.4, x: 125, y: -262, k: 0.99},
  {t: DURATION, x: 170, y: -260, k: 1.01, ease: 'io'},
];

// ---------- small helpers ----------
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
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));
const rotP = (x: number, y: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; flip?: boolean; filter?: string}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot: r = 0,
  flip = false,
  filter,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.feet[1] * s, width: sp.w * s, height: sp.h * s, filter}} />
    </div>
  );
};
const Svg: React.FC<{x: number; y: number; r?: number; children: React.ReactNode}> = ({x, y, r = 3000, children}) => (
  <svg style={{position: 'absolute', left: x - r, top: y - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${x - r} ${y - r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.06, width: w, height: w * 0.12, borderRadius: '50%', background: SHADOW, opacity: o, filter: 'blur(3px)'}} />
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot: r = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot: a = 0}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <path d={p} fill="#FFF6B0" stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
};

// the guy: every pose scaled so its head radius is HR
type Pose = 'hero' | 'pull' | 'dig' | 'shock' | 'wave';
const poseS = (p: Pose) => HR / (SPR[p] as unknown as {head: number[]}).head[2];
const Guy: React.FC<{p: Pose; x: number; y?: number; sx?: number; sy?: number; rot?: number; flip?: boolean}> = ({p, x, y = 0, sx = 1, sy = 1, rot = 0, flip = false}) => (
  <>
    <Shadow x={x} y={y} w={200} />
    <Spr n={p} x={x} y={y} s={poseS(p)} sx={sx} sy={sy} rot={rot} flip={flip} />
  </>
);
const Bag: React.FC<{x: number; y: number; sx?: number; sy?: number; rot?: number; s?: number}> = ({x, y, sx = 1, sy = 1, rot = 0, s = 1}) =>
  s <= 0.001 ? null : <Spr n="bag" x={x} y={y} s={BAG_S * s} sx={sx} sy={sy} rot={rot} />;

// bubbles: outlined circles rising from a source, popping at the surface
const Bubbles: React.FC<{t: number; t0: number; t1: number; x: (t: number) => number; y: (t: number) => number; n?: number; seed?: number}> = ({t, t0, t1, x, y, n = 10, seed = 0}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const born = t0 + ((t1 - t0) * i) / n;
      const age = t - born;
      if (age < 0) return null;
      const x0 = x(born) + (rnd(i + seed) - 0.5) * 60;
      const y0 = y(born);
      const yy = y0 - age * (260 + 120 * rnd(i * 3 + seed));
      if (yy < 14) return null;
      const r = 9 + 9 * rnd(i * 7 + seed);
      return <circle key={i} cx={x0 + 12 * Math.sin(age * 7 + i)} cy={yy} r={r} fill="#BFE6FF" fillOpacity={0.55} stroke={INK} strokeWidth={4} />;
    })}
  </g>
);

// a zigzag crack line from (x, y0) down to y1, revealed by u
const crackPath = (x: number, y0: number, y1: number, seed: number) => {
  const n = 7;
  const pts = Array.from({length: n + 1}, (_, i) => [x + (i === 0 || i === n ? 0 : (rnd(seed + i) - 0.5) * 34), y0 + ((y1 - y0) * i) / n]);
  return pts;
};
const Crack: React.FC<{x: number; y0: number; y1: number; u: number; seed: number; w?: number}> = ({x, y0, y1, u, seed, w = 7}) => {
  if (u <= 0) return null;
  const pts = crackPath(x, y0, y1, seed);
  const L = Math.max(1, Math.round(u * (pts.length - 1)));
  const d = pts.slice(0, L + 1).map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
  return <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />;
};

// ---------- world pieces ----------
const WaterAndFloor: React.FC = () => (
  <Svg x={0} y={0} r={9000}>
    <rect x={-9000} y={0} width={18000} height={FLOOR_Y} fill={WATER} />
    <rect x={-9000} y={0} width={18000} height={34} fill={WATER_TOP} />
    <rect x={-9000} y={560} width={18000} height={FLOOR_Y - 560} fill={WATER_DEEP} />
    <rect x={-9000} y={FLOOR_Y} width={18000} height={4000} fill={FLOOR} />
    <line x1={-9000} x2={9000} y1={FLOOR_Y} y2={FLOOR_Y} stroke={INK} strokeWidth={8} />
    {[-300, 260, 980, 1500, 2100].map((x, i) => (
      <ellipse key={i} cx={x} cy={FLOOR_Y + 6} rx={70 + 30 * rnd(i)} ry={34 + 14 * rnd(i + 5)} fill={ROCK} stroke={INK} strokeWidth={7} />
    ))}
    <line x1={-9000} x2={9000} y1={0} y2={0} stroke={INK} strokeWidth={6} />
  </Svg>
);

// the land ice shelf from far left to its edge e; rock under the far left
const Shelf: React.FC<{e: number; dx: number}> = ({e, dx}) => {
  const x0 = -5000 + dx;
  return (
    <Svg x={0} y={0} r={9000}>
      <path d={`M ${x0} ${SHELF} L ${-1500 + dx} ${SHELF} L ${-900 + dx} ${FLOOR_Y + 4} L ${x0} ${FLOOR_Y + 4} Z`} fill={ROCK} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M ${x0} 0 L ${e} 0 L ${e + 8} ${SHELF * 0.45} L ${e - 6} ${SHELF} L ${x0} ${SHELF} Z`} fill={ICE_FACE} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {[110, 220, 310].map((y, i) => (
        <rect key={i} x={x0 + 40} y={y} width={e - x0 - 80} height={9} rx={4} fill={ICE_LINE} />
      ))}
      <rect x={x0} y={-4} width={e - x0} height={22} fill={SNOW_TOP} />
      <line x1={x0} x2={e} y1={0} y2={0} stroke={INK} strokeWidth={7} />
    </Svg>
  );
};

// a floating slab of ice (sea-ice floe or the iceberg) in local coords: x from -w/2..w/2, top at yTop, bottom at yBot
const Slab: React.FC<{w: number; yTop: number; yBot: number; seed: number; jagL?: boolean; jagR?: boolean}> = ({w, yTop, yBot, seed, jagL = false, jagR = false}) => {
  const h = yBot - yTop;
  const fs = [0.25, 0.5, 0.75];
  const right = jagR ? fs.map((f, i) => [w / 2 + (rnd(seed + i * 3) - 0.5) * 30, yTop + h * f]) : [];
  const left = jagL ? fs.map((f, i) => [-w / 2 + (rnd(seed + i * 5 + 1) - 0.5) * 30, yTop + h * f]).reverse() : [];
  const pts = [[-w / 2, yTop], [w / 2, yTop], ...right, [w / 2 - 10, yBot], [-w / 2 + 10, yBot], ...left];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
  return (
    <g>
      <path d={d} fill={ICE_FACE} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-w / 2 + 4} y={yTop - 2} width={w - 8} height={Math.min(18, h * 0.3)} fill={SNOW_TOP} />
      {h > 120 ? <rect x={-w / 2 + 30} y={yTop + h * 0.45} width={w - 60} height={8} rx={4} fill={ICE_LINE} /> : null}
      <line x1={-w / 2} x2={w / 2} y1={yTop} y2={yTop} stroke={INK} strokeWidth={7} />
    </g>
  );
};

// ---------- shot A pieces ----------
type PileBag = {x: number; y: number; land: number; rot: number};
const PILE: PileBag[] = [
  {x: -120, y: 0, land: -1, rot: -6},
  {x: 15, y: 0, land: -1, rot: 4},
  {x: -55, y: -108, land: -1, rot: 8},
  {x: 140, y: 0, land: 0.62, rot: -3},
  {x: 80, y: -104, land: 2.5, rot: 10},
  {x: -130, y: -98, land: 2.8, rot: -12},
  {x: 10, y: -205, land: 3.1, rot: 5},
  {x: -75, y: -300, land: 3.38, rot: -7},
];
const BONK = 3.62; // a bag lands on the guy's head
const BONK_LAND = 4.02; // ...and bounces onto the top of the pile
const BONK_SPOT = {x: 95, y: -212};
const HEAD_TOP = -441; // hero head top (world, feet = 0)
const POOF = 4.72; // pile -> sled
const DRAG0 = 5.0;
const DRAG1 = 6.6;
const TURN = 6.74; // drops the rope, turns
const RUN1 = 7.24;
const GUY_RUN_TO = -200;
const SHOCK_A = 7.3;
const DETACH = T.sinks;
const SLED_LAND = 9.9;

const guyAX = (t: number) => {
  if (t < DRAG0) return GUY_A;
  if (t < TURN) return lerp(GUY_A, SLED_END + 340, easeInOutCubic(prog(t, DRAG0, DRAG1)));
  return lerp(SLED_END + 340, GUY_RUN_TO, easeInOutCubic(prog(t, TURN + 0.02, RUN1)));
};
const sledAX = (t: number) => Math.min(guyAX(t), SLED_END + 340) - 340;
const p2Rot = (t: number) => {
  if (t < T.up2) return 0;
  if (t < T.pile) return 10 * easeOutCubic(prog(t, T.up2, T.up2 + 0.4));
  if (t < DETACH) return lerp(10, 28, easeInCubic(prog(t, T.pile, DETACH)));
  return 28 * Math.exp(-3.2 * (t - DETACH)) * Math.cos(5 * (t - DETACH));
};
const p2Y = (t: number) => (t < T.up2 ? 0 : 6 * Math.sin(2 * Math.PI * 0.8 * (t - T.up2)) + (t > DETACH ? 30 * Math.exp(-2 * (t - DETACH)) * Math.sin(6 * (t - DETACH)) : 0));
const sledLocal = (t: number) => (t < T.pile ? 0 : 330 * easeInCubic(prog(t, T.pile, DETACH)));
const P2C = (P2[0] + P2[1]) / 2;
const onPlate = (t: number, lx: number): [number, number] => {
  const [rx, ry] = rotP(lx, -12, p2Rot(t));
  return [P2C + rx, 18 + p2Y(t) + ry];
};
const DET = onPlate(DETACH, 330);
const sledPos = (t: number): [number, number, number] => {
  if (t < T.breaks) return [sledAX(t), 0, 0];
  if (t < DETACH) {
    const [x, y] = onPlate(t, sledLocal(t) + (SLED_END - P2C));
    return [x, y, p2Rot(t)];
  }
  const u = prog(t, DETACH, SLED_LAND);
  const x = lerp(DET[0], 720, easeOutCubic(u));
  const y = lerp(DET[1], FLOOR_Y + 4, easeInOutCubic(u));
  const r = t < SLED_LAND ? lerp(28, -6, u) : -6 * Math.exp(-5 * (t - SLED_LAND)) * Math.cos(9 * (t - SLED_LAND));
  return [x, y, r];
};

const ShotA: React.FC<{t: number}> = ({t}) => {
  const gx = guyAX(t);
  const walking = t > DRAG0 && t < DRAG1 + 0.05;
  const running = t > TURN && t < RUN1;
  const gy = walking ? -10 * Math.abs(Math.sin(Math.PI * 2.4 * (t - DRAG0))) : running ? -18 * Math.abs(Math.sin(Math.PI * 4 * (t - TURN))) : -26 * bump(t, T.easy, 0.32);
  // pose
  let pose: Pose = 'hero';
  let sw: [number, number] = [1, 1];
  let flip = false;
  if (t >= SHOCK_A) {
    pose = 'shock';
    sw = squashSwap(t, SHOCK_A);
  } else if (t >= POOF) {
    pose = 'pull';
    sw = t < TURN ? squashSwap(t, POOF) : squashSwap(t, TURN);
    flip = t >= TURN;
  } else sw = squashSwap(t, POOF);
  const bonk = 1 - 0.13 * bump(t, BONK, 0.26);
  const tremble = pose === 'shock' ? 2 * Math.sin(2 * Math.PI * 9 * t) : 0;
  const lean = pose === 'pull' && !flip ? -3 + 2 * Math.sin(Math.PI * 2.4 * (t - DRAG0)) : 0;

  // sea ice: one slab, then three floes
  const cracked = t >= T.breaks;
  const sep = cracked ? easeOutCubic(prog(t, T.up2 - 0.1, T.up2 + 0.6)) : 0;
  const p3dx = 70 * sep + 30 * prog(t, T.up2, CUT_B);
  const p1dx = -26 * sep;
  const bob = (ph: number) => (cracked ? 5 * Math.sin(2 * Math.PI * 0.7 * t + ph) : 0);
  const [sx, sy, sr] = sledPos(t);
  const pengX = PENG_A + p3dx;
  const pengY = -12 + bob(1.3);
  const chips = cracked ? prog(t, T.breaks, T.breaks + 0.6) : 0;

  return (
    <>
      {/* sunk / sinking sled under the water first, then the ice on top */}
      {t >= DETACH ? <Spr n="sled" x={sx} y={sy} s={SLED_S} rot={sr} /> : null}
      <Svg x={0} y={0} r={4000}>
        {t >= DETACH ? <Bubbles t={t} t0={DETACH + 0.05} t1={CUT_B} x={(tt) => sledPos(tt)[0] + 40} y={(tt) => sledPos(tt)[1] - 200} n={14} seed={3} /> : null}
        {t >= SLED_LAND ? (
          <PuffCluster
            puffs={[-150, -60, 40, 140].map((ox, i) => {
              const u = prog(t, SLED_LAND, SLED_LAND + 0.9);
              const r = (34 + 10 * rnd(i)) * Math.sin(Math.PI * u);
              return {x: 720 + ox * (1 + 0.6 * u), y: FLOOR_Y - 20 - 40 * u - 20 * rnd(i + 2), r};
            })}
            fill="#A7B3C4"
            ink={5}
          />
        ) : null}
        {/* floes */}
        {!cracked ? (
          <g transform="translate(900 0)">
            <Slab w={1800} yTop={-3} yBot={60} seed={1} />
          </g>
        ) : (
          <>
            <g transform={`translate(${(0 + P2[0]) / 2 + p1dx} ${bob(0.2)})`}>
              <Slab w={P2[0]} yTop={-3} yBot={60} seed={2} jagR />
            </g>
            <g transform={`translate(${P2C} ${18 + p2Y(t)}) rotate(${p2Rot(t)}) translate(0 -18)`}>
              <Slab w={P2[1] - P2[0] - 10} yTop={-3} yBot={60} seed={5} jagL jagR />
            </g>
            <g transform={`translate(${(P2[1] + 1800) / 2 + p3dx} ${bob(2.1)})`}>
              <Slab w={1800 - P2[1]} yTop={-3} yBot={60} seed={8} jagL />
            </g>
          </>
        )}
        {/* crack lines + flying ice chips */}
        {t >= T.breaks && t < T.up2 + 0.1
          ? [P2[0], P2[1]].map((x, i) => <Crack key={i} x={x} y0={-12} y1={56} u={prog(t, T.breaks + i * 0.08, T.breaks + 0.2 + i * 0.08)} seed={11 + i * 7} />)
          : null}
        {chips > 0 && chips < 1
          ? [0, 1, 2, 3, 4, 5].map((i) => {
              const x0 = i < 3 ? P2[0] : P2[1];
              const vx = (rnd(i + 20) - 0.5) * 420;
              const vy = -380 - 200 * rnd(i + 30);
              const tt = chips * 0.6;
              const x = x0 + vx * tt;
              const y = -10 + vy * tt + 0.5 * 2200 * tt * tt;
              const r = 12 + 8 * rnd(i + 40);
              return <polygon key={i} points={`${x},${y - r} ${x + r},${y + r * 0.7} ${x - r},${y + r * 0.6}`} fill={SNOW_TOP} stroke={INK} strokeWidth={4} strokeLinejoin="round" transform={`rotate(${chips * 400 * (i % 2 ? 1 : -1)} ${x} ${y})`} />;
            })
          : null}
      </Svg>

      {/* penguin on the far floe */}
      <Shadow x={pengX} y={pengY} w={140} />
      <Spr n="pengJudge" x={pengX} y={pengY} s={PENG_S} sy={1 + 0.06 * bump(t, 6.62, 0.3) + 0.06 * bump(t, 10.0, 0.3)} rot={-4 * bump(t, 6.62, 0.3)} />

      {/* the base and the trash pile on the land */}
      <Spr n="base" x={-1010} y={0} s={BASE_S} />
      {t < POOF + 0.05
        ? PILE.map((b, i) => {
            const fall = b.land < 0 ? 1 : prog(t, b.land - 0.32, b.land);
            if (fall <= 0) return null;
            const y = lerp(-1500, b.y, fall * fall);
            const sq = b.land < 0 ? 0 : bump(t, b.land, 0.2);
            return <Bag key={i} x={PILE_X + b.x} y={y} rot={b.rot} sx={1 + 0.12 * sq} sy={1 - 0.16 * sq} />;
          })
        : null}
      {/* the bonk bag: falls on his head, bounces onto the pile */}
      {t > BONK - 0.34 && t < POOF + 0.05
        ? (() => {
            if (t < BONK) {
              const u = prog(t, BONK - 0.34, BONK);
              return <Bag x={GUY_A + 4} y={lerp(-1600, HEAD_TOP + 8, u * u)} rot={-4} />;
            }
            const u = prog(t, BONK, BONK_LAND);
            const x = lerp(GUY_A + 4, PILE_X + BONK_SPOT.x, u);
            const y0 = HEAD_TOP + 8;
            const y1 = BONK_SPOT.y;
            const ya = -820;
            const yy = u < 1 ? (u < 0.5 ? lerp(y0, ya, easeOutCubic(u * 2)) : lerp(ya, y1, easeInCubic((u - 0.5) * 2))) : y1;
            const sq = bump(t, BONK_LAND, 0.2);
            return <Bag x={x} y={yy} rot={lerp(-4, 370, easeOutCubic(u))} sx={1 + 0.12 * sq} sy={1 - 0.16 * sq} />;
          })()
        : null}
      {/* sled on the land / sea ice before it sinks */}
      {t >= POOF && t < DETACH ? <Spr n="sled" x={sx} y={sy} s={SLED_S} rot={sr} /> : null}
      {/* the rope */}
      {t >= POOF && t < DETACH
        ? (() => {
            const ropeL = (SPR.sled.rope[0] - SPR.sled.feet[0]) * SLED_S;
            const ropeT = (SPR.sled.rope[1] - SPR.sled.feet[1]) * SLED_S;
            const [rx, ry] = rotP(ropeL, ropeT, sr);
            const a = [sx + rx, sy + ry];
            const held = t < TURN;
            const hand = held ? [gx + (SPR.pull.hand[0] - SPR.pull.feet[0]) * poseS('pull'), gy + (SPR.pull.hand[1] - SPR.pull.feet[1]) * poseS('pull')] : [a[0] + 120, sy - 4];
            const mid = [(a[0] + hand[0]) / 2, Math.max(a[1], hand[1]) + (held ? 22 : 6)];
            return (
              <Svg x={a[0]} y={a[1]} r={1500}>
                <path d={`M ${a[0]} ${a[1]} Q ${mid[0]} ${mid[1]} ${hand[0]} ${hand[1]}`} fill="none" stroke="#C98A3E" strokeWidth={9} strokeLinecap="round" />
              </Svg>
            );
          })()
        : null}

      {/* the guy */}
      <Guy p={pose} x={gx + tremble} y={gy} sx={sw[0]} sy={sw[1] * breathe(t) * (t < POOF ? bonk : 1)} rot={lean} flip={flip} />

      {/* effects */}
      <Svg x={0} y={-300} r={4000}>
        {/* pile -> sled poof */}
        {t > POOF - 0.12 && t < POOF + 0.45 ? (
          <PuffCluster
            puffs={[
              [-140, -60],
              [-40, -140],
              [80, -90],
              [150, -10],
              [-60, 10],
              [40, -250],
              [-130, -220],
            ].map(([ox, oy], i) => {
              const u = prog(t, POOF - 0.12, POOF + 0.45);
              return {x: PILE_X + ox * (1 + 0.3 * u), y: oy - 40 * u, r: (80 + 20 * rnd(i)) * Math.sin(Math.PI * Math.min(1, u * 1.15))};
            })}
            fill="#FFFFFF"
            ink={7}
            shade="#E3F1FB"
          />
        ) : null}
        <Mark x={GUY_A + 40} y={-560} size={120} s={popOut(t, T.easy - 0.04, POOF - 0.1, 0.22)} text="!" rot={8} fill="#FFD23F" />
        <SweatDrop x={GUY_RUN_TO + 95} y={-330} r={22} s={popOut(t, T.pile, 9.8, 0.2)} rot={20} />
        {/* stars when bonked */}
        {t > BONK && t < BONK + 0.5
          ? [0, 1, 2].map((i) => {
              const a = (t - BONK) * 9 + (i * Math.PI * 2) / 3;
              return <Sparkle key={i} x={GUY_A + 110 * Math.cos(a)} y={HEAD_TOP - 30 + 28 * Math.sin(a)} r={20} s={1 - prog(t, BONK + 0.3, BONK + 0.5)} />;
            })
          : null}
      </Svg>
    </>
  );
};

// ---------- shot B ----------
const SLIDE0 = 13.3;
const SLIDE1 = 14.85;
const SHOCK_B = T.but2 + 0.04;
const CRACK0 = T.one;
const CALVE = T.drifted;
const PENG_WAVE = T.iceberg;
const slideX = (t: number) => 420 * easeInOutCubic(prog(t, SLIDE0, SLIDE1));
const BAG_DROP0 = T.bury + 0.04;
const BAG_DEEP = T.ice2 + 0.05;
const bagBY = (t: number) => {
  if (t < BAG_DROP0) return 0;
  return lerp(-30 * bump(t, BAG_DROP0, 0.16), 340, easeInOutCubic(prog(t, BAG_DROP0 + 0.1, BAG_DEEP)));
};

const ShotB: React.FC<{t: number; cover?: boolean}> = ({t, cover = false}) => {
  const dx = slideX(t);
  const e = dx; // edge of the shelf
  const calved = t >= CALVE;
  const mainEdge = calved ? e - CHUNK : e;
  // iceberg drift
  const bu = prog(t, CALVE, 17.6);
  const bdx = 650 * easeInOutCubic(bu) + 30 * easeOutCubic(prog(t, CALVE, CALVE + 0.4));
  const bdy = calved ? 46 * bump(t, CALVE, 0.7) + 7 * Math.sin(2 * Math.PI * 0.6 * (t - CALVE)) : 0;
  const brot = calved ? 5 * bump(t, CALVE, 0.8) - 2 * Math.sin(2 * Math.PI * 0.45 * (t - CALVE)) : 0;
  const cx = e - CHUNK / 2;
  // guy
  const pose: Pose = t >= SHOCK_B ? 'shock' : 'dig';
  const sw = squashSwap(t, SHOCK_B);
  const stab = pose === 'dig' ? -16 * bump(t, T.bury - 0.12, 0.24) : 0;
  const tremble = pose === 'shock' ? 2.2 * Math.sin(2 * Math.PI * 9 * t) : 0;
  const by = bagBY(t);
  // eyes on the ice
  const eyesOpen = popOut(t, T.but2, 99, 0.3);
  const look: [number, number] = t < SLIDE0 ? [0.2, 0.75] : t < CRACK0 ? [1, 0] : [1, -0.2];
  const blink = Math.max(bump(t, 14.4, 0.14), bump(t, 16.9, 0.14));
  const groan = SLIDE0 < t && t < SLIDE1 ? 1.5 * Math.sin(2 * Math.PI * 11 * t) : 0;
  const pengSw = squashSwap(t, PENG_WAVE);
  const pengWaving = t >= PENG_WAVE;

  return (
    <>
      <Shelf e={mainEdge} dx={dx} />
      <Svg x={0} y={0} r={4000}>
        {/* the buried bag's tunnel, then the bag inside the ice */}
        {t >= BAG_DROP0 + 0.1 ? <rect x={HOLE_X + dx - 34} y={10} width={68} height={Math.max(0, by - 70)} rx={30} fill={ICE_DEEP} /> : null}
        {/* hole / snow mound */}
        {t >= T.bury - 0.02 && t < T.deep + 0.1 ? <ellipse cx={HOLE_X + dx} cy={4} rx={80 * pop(t, T.bury - 0.02, 0.15)} ry={16} fill="#4C6A86" stroke={INK} strokeWidth={6} /> : null}
        {t >= T.deep + 0.1 ? <ellipse cx={HOLE_X + dx} cy={2} rx={84} ry={26 * pop(t, T.deep + 0.1, 0.25)} fill={SNOW_TOP} stroke={INK} strokeWidth={6} /> : null}
        {/* the ice wakes up */}
        <Eye x={-640 + dx} y={105} r={68} open={eyesOpen} look={look} lid={0.32 + 0.6 * blink} lidTilt={16} side={-1} brow={0.5} browTilt={-1.2} ink={0.14} />
        <Eye x={-415 + dx} y={105} r={68} open={eyesOpen} look={look} lid={0.32 + 0.6 * blink} lidTilt={16} side={1} brow={0.5} browTilt={-1.2} ink={0.14} />
        {/* push wave at the front while sliding */}
        {t > SLIDE0 && t < SLIDE1 + 0.5
          ? (() => {
              const a = Math.sin(Math.PI * prog(t, SLIDE0, SLIDE1 + 0.5));
              return (
                <g>
                  <path d={`M ${e + 6} 0 Q ${e + 60} ${-40 * a} ${e + 170} 0 Z`} fill={WATER_TOP} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
                  {[0, 1, 2].map((i) => (
                    <path key={i} d={`M ${e + 190 + i * 60} ${-30 - i * 18} q 40 ${-12} 80 0`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={a} />
                  ))}
                </g>
              );
            })()
          : null}
        {/* a big arrow on the ice face: the whole shelf is sliding */}
        {(() => {
          const s = popOut(t, SLIDE0 - 0.05, SLIDE1 + 0.15, 0.25);
          if (s <= 0.001) return null;
          const ax = -250 + dx + 30 * Math.sin(2 * Math.PI * 2 * t);
          return (
            <g transform={`translate(${ax} 250) scale(${s})`}>
              <path d="M -170 -34 L 40 -34 L 40 -80 L 170 0 L 40 80 L 40 34 L -170 34 Z" fill="#FFFFFF" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
            </g>
          );
        })()}
        {/* the crack behind the old base */}
        {t >= CRACK0 && !calved ? <Crack x={e - CHUNK} y0={-4} y1={SHELF} u={prog(t, CRACK0, CRACK0 + 0.5)} seed={31} w={9} /> : null}
        {calved ? (
          <PuffCluster
            puffs={[-60, 0, 60, 120].map((ox, i) => {
              const u = prog(t, CALVE, CALVE + 0.7);
              return {x: e - CHUNK + 40 + ox * (1 + u), y: -20 - 80 * u - 30 * rnd(i), r: (36 + 10 * rnd(i + 3)) * Math.sin(Math.PI * u)};
            })}
            fill="#FFFFFF"
            ink={6}
            shade="#DDEFFB"
          />
        ) : null}
      </Svg>
      {t >= BAG_DROP0 + 0.1 ? <Bag x={HOLE_X + dx} y={by} rot={6 * Math.sin(3 * t)} /> : <Bag x={HOLE_X + dx} y={0} rot={-4} sy={1 - 0.1 * bump(t, T.bury - 0.12, 0.2)} />}

      {/* our base (left) */}
      {cover ? null : <Spr n="base" x={-1010 + dx} y={0} s={BASE_S} />}

      {/* the chunk with the old base + penguin: part of the shelf until it calves */}
      <div style={{display: cover ? 'none' : undefined, position: 'absolute', left: 0, top: 0, transform: `translate(${bdx}px, ${bdy}px) rotate(${brot}deg)`, transformOrigin: `${cx}px 0px`}}>
        {calved ? (
          <Svg x={cx} y={0} r={1500}>
            <g transform={`translate(${cx} 0)`}>
              <Slab w={CHUNK} yTop={0} yBot={SHELF} seed={41} jagL />
            </g>
          </Svg>
        ) : null}
        <Spr n="base" x={e - 230} y={0} s={OLD_S} filter="sepia(0.6) saturate(0.75) brightness(0.96)" />
        <Shadow x={e - 70} y={0} w={130} />
        <Spr n={pengWaving ? 'pengWave' : 'pengJudge'} x={e - 70} y={0} s={PENG_S} sx={pengSw[0]} sy={pengSw[1]} rot={pengWaving ? 5 * Math.sin(2 * Math.PI * 1.6 * t) : 0} />
      </div>

      {/* the guy */}
      <Guy p={pose} x={GUY_B + dx + tremble + groan} y={stab} sx={sw[0]} sy={sw[1] * breathe(t)} />
      <Svg x={0} y={-400} r={4000}>
        <Sparkle x={GUY_B + dx - 130} y={-430} r={26} s={popOut(t, T.ice2, T.but2 - 0.05, 0.2)} rot={t * 90} />
        <Sparkle x={GUY_B + dx + 150} y={-400} r={20} s={popOut(t, T.ice2 + 0.08, T.but2 - 0.05, 0.2)} rot={-t * 90} />
        <SweatDrop x={GUY_B + dx + 95} y={-330} r={22} s={popOut(t, 13.5, 15.2, 0.2)} rot={20} />
        <Mark x={GUY_B + dx + 175} y={-540} size={150} s={cover ? 0 : popOut(t, T.but2 + 0.1, 13.3, 0.2)} text="?!" rot={-6} fill="#FFD23F" />
      </Svg>
    </>
  );
};

// ---------- shot C ----------
const WAVE_C = T.packed;
const BACK_HERO = 20.98;
const SAIL0 = T.shipped + 0.04;
const shipX = (t: number) => SHIP_X + 1300 * Math.pow(prog(t, SAIL0, DURATION), 2);
const shipBob = (t: number) => 4 * Math.sin(2 * Math.PI * 0.7 * t);
const SHIP_TGT: [number, number] = [(850 - SPR.ship.feet[0]) * SHIP_S, (140 - SPR.ship.feet[1]) * SHIP_S];
const CHIM: [number, number] = [(208 - SPR.ship.feet[0]) * SHIP_S, (12 - SPR.ship.feet[1]) * SHIP_S];
type Fly = {t0: number; t1: number; from: [number, number]};
const FLIES: Fly[] = [
  {t0: 18.1, t1: 18.62, from: [-470, -70]},
  {t0: T.packed, t1: 19.18, from: [GUY_C + 66, -113 - 70]},
  {t0: T.up3, t1: 19.44, from: [-580, -70]},
];

const ShotC: React.FC<{t: number}> = ({t}) => {
  const pose: Pose = t >= BACK_HERO ? 'hero' : t >= WAVE_C ? 'wave' : 'hero';
  const sw = t >= BACK_HERO - 0.1 ? squashSwap(t, BACK_HERO) : squashSwap(t, WAVE_C);
  const waving = pose === 'wave' ? 4 * Math.sin(2 * Math.PI * 1.6 * (t - WAVE_C)) : 0;
  const sx = shipX(t);
  const sy = SHIP_Y + shipBob(t);
  const tilt = 1.2 * Math.sin(2 * Math.PI * 0.5 * t);
  const pengW = t >= T.shipped;
  const psw = squashSwap(t, T.shipped);
  const horn = bump(t, T.shipped, 0.5);
  return (
    <>
      <Shelf e={0} dx={0} />
      {/* ship + water line in front of its hull */}
      <Spr n="ship" x={sx} y={sy} s={SHIP_S} rot={tilt} sx={1 + 0.03 * horn} sy={1 - 0.03 * horn} />
      <Svg x={0} y={0} r={9000}>
        <rect x={6} y={6} width={9000} height={150} fill={WATER} />
        <rect x={6} y={6} width={9000} height={28} fill={WATER_TOP} />
        <line x1={0} x2={9000} y1={0} y2={0} stroke={INK} strokeWidth={6} />
        {/* bow wake */}
        {t > SAIL0
          ? [0, 1].map((i) => (
              <path key={i} d={`M ${sx + 380 + i * 50} ${-6 - i * 14} q 30 -14 60 0`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={prog(t, SAIL0, SAIL0 + 0.4)} />
            ))
          : null}
        {/* chimney puffs */}
        {[T.shipped, T.shipped + 0.3, T.shipped + 0.62, T.all + 0.1].map((t0, i) => {
          const u = prog(t, t0, t0 + 1.1);
          if (u <= 0 || u >= 1) return null;
          const r = 34 * Math.sin(Math.PI * u) + 6;
          return <PuffCluster key={i} puffs={[{x: sx + CHIM[0] - 60 * u, y: sy + CHIM[1] - 30 - 170 * u, r}, {x: sx + CHIM[0] - 60 * u + r * 0.8, y: sy + CHIM[1] - 30 - 170 * u + 8, r: r * 0.7}]} fill="#FFFFFF" ink={5} shade="#E5EEF5" />;
        })}
        <Sparkle x={sx + 260} y={sy - 420} r={26} s={popOut(t, T.home, 21.2, 0.2)} rot={t * 90} />
        <Sparkle x={sx + 380} y={sy - 360} r={18} s={popOut(t, T.home + 0.08, 21.2, 0.2)} rot={-t * 90} />
      </Svg>
      {/* the pile that is left + flying bags */}
      {FLIES.map((f, i) => {
        if (t >= f.t1 + 0.12) return null;
        const fromPile = i !== 1;
        if (t < f.t0) return fromPile ? <Bag key={i} x={f.from[0]} y={0} rot={i ? -6 : 5} /> : null;
        const u = prog(t, f.t0, f.t1);
        const tx = SHIP_X + SHIP_TGT[0];
        const ty = SHIP_Y + SHIP_TGT[1] + 40;
        const x = lerp(f.from[0], tx, u);
        const y0 = fromPile ? 0 : f.from[1] + 70;
        const ya = -760;
        const y = u < 0.5 ? lerp(y0, ya, easeOutCubic(u * 2)) : lerp(ya, ty, easeInCubic((u - 0.5) * 2));
        const shrink = 1 - prog(t, f.t1, f.t1 + 0.12);
        return <Bag key={i} x={x} y={y} rot={360 * u} s={shrink} />;
      })}
      {/* penguin and the guy on the shore */}
      <Shadow x={-95} y={0} w={130} />
      <Spr n={pengW ? 'pengWave' : 'pengJudge'} x={-95} y={0} s={PENG_S} sx={psw[0]} sy={psw[1]} rot={pengW ? 5 * Math.sin(2 * Math.PI * 1.6 * t + 1) : 0} />
      <Guy p={pose} x={GUY_C} sx={sw[0]} sy={sw[1] * breathe(t)} rot={waving} />
      <Svg x={0} y={-300} r={4000}>
        {FLIES.map((f, i) => (
          <Sparkle key={i} x={SHIP_X + SHIP_TGT[0] + 70 * (i - 1)} y={SHIP_Y + SHIP_TGT[1] - 30} r={22} s={popOut(t, f.t1, f.t1 + 0.2, 0.15)} rot={t * 120} />
        ))}
      </Svg>
    </>
  );
};

// ---------- the far layer: sky plate tiles + far snow plain ----------
const SKY_S = 2.2;
const SKY_HZ = -60;
const SkyLayer: React.FC = () => {
  const w = SPR.sky.w * SKY_S;
  const h = SPR.sky.h * SKY_S;
  const top = SKY_HZ - SPR.sky.horizon * SKY_S;
  return (
    <>
      {[-2, -1, 0, 1, 2].map((i) => (
        <Img key={i} src={F('sky')} style={{position: 'absolute', left: i * w - w / 2, top, width: w, height: h, transform: i % 2 ? 'scaleX(-1)' : undefined}} />
      ))}
      <div style={{position: 'absolute', left: -3 * w, top: SKY_HZ + 2, width: 6 * w, height: 6000, background: FAR_SNOW}} />
    </>
  );
};

// falling snow (screen space)
const Snow: React.FC<{t: number}> = ({t}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    {Array.from({length: 46}, (_, i) => {
      const sp = 70 + 60 * rnd(i + 3);
      const y = ((rnd(i) * 1920 + sp * t) % 2000) - 40;
      const x = (rnd(i + 9) * 1180 - 50 + 26 * Math.sin(t * (0.6 + rnd(i + 1)) + i)) % 1100;
      return <circle key={i} cx={x} cy={y} r={3 + 4 * rnd(i + 17)} fill="#FFFFFF" opacity={0.85} />;
    })}
  </svg>
);

export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover = false}) => {
  const shotA = t < CUT_B;
  const shotB = t >= CUT_B && t < CUT_C;
  const shotC = t >= CUT_C;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam} depth={1.4}>
        <SkyLayer />
      </World>
      <World cam={cam}>
        <WaterAndFloor />
        {shotA ? (
          <>
            <Shelf e={0} dx={0} />
            <ShotA t={t} />
          </>
        ) : null}
        {shotB ? <ShotB t={t} cover={cover} /> : null}
        {shotC ? <ShotC t={t} /> : null}
      </World>
      <Snow t={t} />
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'polar_wind', at: 0, db: -28, keys: [[0, -28], [1.9, -29]], dur: 2.2},
  {f: 'polar_wind', at: 1.95, db: -29, keys: [[1.95, -29], [3.6, -32], [4.1, -45]], dur: 2.2},
  {f: 'catch', at: 0.6, db: -22},
  {f: 'catch', at: 2.48, db: -23},
  {f: 'catch', at: 2.78, db: -24},
  {f: 'catch', at: 3.08, db: -23},
  {f: 'catch', at: 3.36, db: -24},
  {f: 'boing', at: BONK - 0.02, db: -19},
  {f: 'catch', at: BONK_LAND - 0.02, db: -22},
  {f: 'whoosh', at: POOF - 0.25, db: -26},
  {f: 'pop', at: POOF, db: -21},
  {f: 'whoosh', at: DRAG0 + 0.05, db: -30, rate: 0.7},
  {f: 'penguin', at: 6.6, db: -21},
  {f: 'zip', at: TURN, db: -22},
  {f: 'ice_crack', at: T.breaks - 0.02, db: -14},
  {f: 'ice_crack', at: T.pile - 0.05, db: -21, rate: 1.25},
  {f: 'splash', at: DETACH + 0.04, db: -16},
  {f: 'bubbles', at: DETACH + 0.15, db: -25},
  {f: 'dig', at: SLED_LAND - 0.03, db: -21, rate: 0.8},
  {f: 'penguin', at: 10.02, db: -22, rate: 0.92},
  {f: 'whoosh', at: CUT_B - 0.15, db: -30},
  {f: 'dig', at: T.bury - 0.12, db: -15},
  {f: 'whoosh', at: BAG_DROP0 + 0.1, db: -28, rate: 0.65},
  {f: 'pop', at: T.deep + 0.1, db: -22},
  {f: 'pop', at: T.but2 + 0.02, db: -20},
  {f: 'gulp', at: SHOCK_B + 0.1, db: -20},
  {f: 'glacier_groan', at: SLIDE0 - 0.1, db: -15, keys: [[13.2, -18], [13.8, -14], [15.2, -20]]},
  {f: 'glacier_groan', at: 14.5, db: -20, rate: 0.85},
  {f: 'ice_crack', at: CRACK0 - 0.02, db: -16},
  {f: 'iceberg_calve', at: CALVE - 0.1, db: -15},
  {f: 'pop', at: PENG_WAVE, db: -22},
  {f: 'whoosh', at: CUT_C - 0.15, db: -30},
  {f: 'whoosh', at: 18.1, db: -27},
  {f: 'catch', at: 18.62, db: -22},
  {f: 'whoosh', at: T.packed, db: -27},
  {f: 'catch', at: 19.18, db: -22},
  {f: 'whoosh', at: T.up3, db: -28},
  {f: 'catch', at: 19.44, db: -22},
  {f: 'horn', at: T.shipped, db: -18, keys: [[T.shipped, -18], [20.6, -20], [20.95, -40]]},
  {f: 'splash', at: SAIL0 + 0.2, db: -30, rate: 0.8},
  {f: 'pop', at: BACK_HERO, db: -21},
];

export const AntarcticTrashShort: React.FC = () => {
  useAntFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camAt(t, CAMS);
  const env =
    (t >= T.breaks ? 10 * Math.exp(-8 * (t - T.breaks)) : 0) +
    (t >= SLIDE0 && t < SLIDE1 + 0.3 ? 3 * Math.sin(Math.PI * prog(t, SLIDE0, SLIDE1 + 0.3)) : 0) +
    (t >= CALVE ? 9 * Math.exp(-6 * (t - CALVE)) : 0) +
    (t >= BONK ? 5 * Math.exp(-10 * (t - BONK)) : 0);
  const sh = shake(t, env);
  const cam = {x: cam0.x + sh.x / cam0.k, y: cam0.y + sh.y / cam0.k, k: cam0.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('antarctic-trash/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('antarctic-trash/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="antarctic-trash/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
