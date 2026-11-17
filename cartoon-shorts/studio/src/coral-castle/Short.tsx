import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as CC_DURATION, FPS as CC_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did one man move 1,100 tons of rock alone?" - Coral Castle, Florida. A skinny guy in a felt hat builds a castle of
// rock alone at night (the moon wakes up to watch). Neighbours peek over the wall: MAGIC! - the rock floats. BUT a camera
// flash: an old sepia photo - a tripod of telephone poles drops in around him, a chain hoist lands on top; the photo comes
// alive: each long pull lifts the rock only a little (LONG PULL / LITTLE LIFT), so one man is enough. His 9-ton gate spins
// from one finger. BUT 1986: the gate jams (a rusty truck bearing) - six men in hard hats and a crane lift it out, while the
// old photo of the guy winks.

const F = (n: string) => staticFile(`coral-castle/${n}.png`);
export const FONT = 'CCInter';
export const useCCFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.3;
const INK = '#000';
const YEL = '#FFE45C';
const RED = '#E8382E';
const GRN = '#5BD15B';
const STONE = '#D9CDB4';
const STONE_SH = '#B3A587';
const RUST = '#B5562A';
const TABLE = '#3a2a20';
export const NIGHT_BG = '#1d2759';

// ---------- helpers ----------
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

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; filter?: string; children?: React.ReactNode}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  filter,
  children,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', filter}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}}>
        <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: sp.w * s, height: sp.h * s}} />
        {children ? (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
            {children}
          </svg>
        ) : null}
      </div>
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 6000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; stroke?: string; sw?: number}> = ({
  x,
  y,
  size,
  s = 1,
  text,
  rot = 0,
  fill = '#fff',
  stroke = INK,
  sw = 0.2,
}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={stroke} strokeWidth={size * sw} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const star = (x: number, y: number, r: number) =>
  `M ${x} ${y - r * 2} L ${x + r * 0.45} ${y - r * 0.45} L ${x + r * 2} ${y} L ${x + r * 0.45} ${y + r * 0.45} L ${x} ${y + r * 2} L ${x - r * 0.45} ${y + r * 0.45} L ${x - r * 2} ${y} L ${x - r * 0.45} ${y - r * 0.45} Z`;

// ======================================================================================================
// THE WORLD = the yard plate at 1.7x (world px); the castle wall stands on it, the characters in front
// ======================================================================================================
const PS = 1.7;
const PW = SPR.yard.w * PS;
const PH = SPR.yard.h * PS;
const GROUND = 2040; // characters' feet
const WS = 1.92; // wall sprite scale
const WX0 = -380; // wall sprite left (world)
const WALL_BASE = 1905;
const WB = SPR.wall;
const wallY0 = WALL_BASE - WB.base * WS;
const GX0 = WX0 + WB.gap[0] * WS;
const GX1 = WX0 + WB.gap[1] * WS;
const GX = (GX0 + GX1) / 2;
const GW = GX1 - GX0;
const GATE_TOP = WALL_BASE - (WB.base - WB.gapTop) * WS;
const GH = WALL_BASE - GATE_TOP;
const LOW_TOP = WALL_BASE - (WB.base - WB.lowTop) * WS;

const RH = 88; // head radius of every person (world px)
type Pose = 'hero' | 'pull' | 'finger' | 'shh' | 'push' | 'haul' | 'puzzled';
const poseS = (p: Pose) => RH / (S(p).hd as [number, number, number])[2];

const BLOCK_X = 900;
const BLOCK_FEET = GROUND + 12;
const BS = 0.62;
const BLOCK_TOP = BLOCK_FEET - (S('block').feet[1] - S('block').top) * BS;
const ED_A = 560; // the guy in the hook
const ED_P = 470; // the guy at the tripod (outside the left leg)
const ED_G = GX0 - (SPR.finger.tip[0] - SPR.finger.feet[0]) * poseS('finger') - 4; // finger tip just touches the gate
const APEX = {x: BLOCK_X - 10, y: 1170};
const LEGS: [number, number][] = [
  [BLOCK_X - 290, GROUND + 6],
  [BLOCK_X + 300, GROUND + 2],
];
const BACK_LEG: [number, number] = [BLOCK_X + 70, GROUND - 80];
const HOIST = {x: APEX.x, y: 1262};
const WHEEL = {x: APEX.x - 36, y: 1250, r: 30};

// ---------- timeline ----------
const PH0 = T.but + 0.05; // photo starts (under the flash)
const PH1 = 11.45; // photo comes alive
const PH2 = 11.95;
const CUT_GATE = 15.9;
const DAY = 19.44; // hard cut to 1986
const TOUCH = T.one2 + 0.06; // the finger touches the gate
const SPIN1 = 19.2;
const PULLS = [11.75, 12.35, 12.95, 13.55];
const LEG_T = [T.tripod - 0.02, T.tripod + 0.13, T.tripod + 0.28];
const HOIST_T = T.chain + 0.02;
const GRAB = T.chain + 0.1;
const JAM = T.jams;
const CRANE0 = T.fixing - 0.1;
const CRANE1 = CRANE0 + 0.75;
const HOOK0 = 21.95;
const HOOK1 = 22.45;
const LIFT0 = T.crane - 0.06;
const LIFT1 = T.crane + 0.75;
const POPS = [21.95, 22.07, 22.19, 22.31, 22.43, 22.55];
const PHOTO_END = T.crane + 0.25; // the old photo of the guy pops at the end
const WINK = 23.95;

const night = (t: number) => (t < PH0 ? 1 : t < PH1 ? 0 : t < DAY ? easeInOutCubic(prog(t, PH1, PH2)) : 0);
const sepiaAt = (t: number) => (t < PH0 ? 0 : t < PH1 ? 1 : 1 - easeInOutCubic(prog(t, PH1, PH2)));

// ---------- camera ----------
const KEYS: CamKey[] = [
  {t: 0, x: 740, y: 1600, k: 1.3},
  {t: 0.7, x: 740, y: 1600, k: 1.3},
  {t: 4.3, x: 830, y: 1250, k: 0.6},
  {t: 5.45, x: 830, y: 1250, k: 0.6},
  {t: 6.15, x: 800, y: 1480, k: 0.92},
  {t: T.but, x: 805, y: 1480, k: 0.95},
  {t: PH0, x: 790, y: 1540, k: 1.08, ease: 'cut'},
  {t: PH1, x: 790, y: 1540, k: 1.1},
  {t: 12.3, x: 750, y: 1480, k: 1.02},
  {t: CUT_GATE - 0.02, x: 750, y: 1480, k: 1.04},
  {t: CUT_GATE, x: 1040, y: 1560, k: 1.12, ease: 'cut'},
  {t: 18.2, x: 1050, y: 1550, k: 1.18},
  {t: DAY - 0.02, x: 1050, y: 1550, k: 1.18},
  {t: DAY, x: 1000, y: 1560, k: 1.05, ease: 'cut'},
  {t: 21.05, x: 1000, y: 1560, k: 1.05},
  {t: 22.05, x: 1000, y: 1330, k: 0.72},
  {t: 30, x: 1004, y: 1335, k: 0.735},
];
const camAtT = (t: number): Cam => {
  const c = camAt(t, KEYS);
  const hit = (t0: number, a: number, d = 7) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const amp =
    hit(T.but + 0.12, 10) +
    hit(LEG_T[0], 7) +
    hit(LEG_T[1], 6) +
    hit(LEG_T[2], 6) +
    hit(HOIST_T + 0.16, 6) +
    hit(T.nineton, 12) +
    hit(JAM, 9) +
    (t > LIFT0 && t < LIFT1 + 0.2 ? 3 : 0) +
    (t > CRANE0 && t < CRANE1 ? 2 : 0);
  const sh = shake(t, amp);
  return {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
};

// ======================================================================================================
// CHARACTERS
// ======================================================================================================
type GuyState = {vis: boolean; pose: Pose; x: number; y: number; sx: number; sy: number; flip?: boolean; ph?: number; filter?: string};

const pullStroke = (t: number) => {
  // 0..1..0 per pull (down stroke then reach up)
  for (const p of PULLS) {
    if (t >= p && t < p + 0.58) {
      const u = (t - p) / 0.58;
      return u < 0.45 ? easeInOutCubic(u / 0.45) : 1 - easeInOutCubic((u - 0.45) / 0.55);
    }
  }
  return 0;
};
const liftAt = (t: number) => PULLS.reduce((acc, p) => acc + 24 * easeInOutCubic(prog(t, p, p + 0.26)), 0);

const ed = (t: number): GuyState => {
  if (t >= DAY) return {vis: false, pose: 'hero', x: 0, y: 0, sx: 1, sy: 1};
  const b = breathe(t);
  if (t < 5.8) {
    const bounce = 1 + 0.025 * Math.sin(Math.PI * prog(t, T.castle - 0.05, T.castle + 0.3));
    return {vis: true, pose: 'hero', x: ED_A, y: GROUND, sx: 1, sy: b * bounce};
  }
  if (t < PH0) {
    const [sx, sy] = squashSwap(t, 5.8);
    return {vis: true, pose: 'shh', x: ED_A, y: GROUND, sx, sy: sy * b};
  }
  if (t < GRAB) return {vis: true, pose: 'hero', x: ED_P, y: GROUND, sx: 1, sy: b};
  if (t < T.enough) {
    const [sx, sy] = squashSwap(t, GRAB);
    const st = pullStroke(t);
    return {vis: true, pose: 'pull', x: ED_P, y: GROUND + 30 * st, sx: sx * (1 + 0.03 * st), sy: sy * b * (1 - 0.06 * st)};
  }
  if (t < CUT_GATE) {
    const [sx, sy] = squashSwap(t, T.enough);
    return {vis: true, pose: 'hero', x: ED_P, y: GROUND, sx, sy: sy * b};
  }
  if (t < T.turns - 0.08) return {vis: true, pose: 'hero', x: ED_G, y: GROUND, sx: 1, sy: b};
  const [sx, sy] = squashSwap(t, T.turns);
  const poke = t > TOUCH - 0.12 && t < TOUCH + 0.2 ? 8 * Math.sin(Math.PI * prog(t, TOUCH - 0.12, TOUCH + 0.2)) : 0;
  return {vis: true, pose: 'finger', x: ED_G + poke, y: GROUND, sx, sy: sy * b};
};

// workers (1986): w0 = the first pusher at the gate; w1, w2 = conga pushers; w3-w5 = haulers on a rope (facing left)
const W0X = GX0 - (504 - SPR.push.feet[0]) * poseS('push');
const workers = (t: number): (GuyState & {pop: number; n: number})[] => {
  if (t < DAY) return [];
  const out: (GuyState & {pop: number; n: number})[] = [];
  const strain = t > LIFT0 - 0.4 ? 1 : 0;
  const shk = (i: number) => (strain ? 2.5 * Math.sin(2 * Math.PI * 9 * t + i) : 0);
  // w0
  let pose0: Pose = 'push';
  let sw0: [number, number] = [1, 1];
  if (t >= JAM + 0.22 && t < POPS[0]) {
    pose0 = 'puzzled';
    sw0 = squashSwap(t, JAM + 0.22);
  } else if (t >= POPS[0]) sw0 = squashSwap(t, POPS[0]);
  const pushing0 = pose0 === 'push' && t < JAM + 0.22 ? 6 * Math.sin(Math.PI * prog(t, DAY + 0.2, JAM)) : 0;
  out.push({vis: true, pose: pose0, x: (pose0 === 'puzzled' ? W0X - 70 : W0X) + pushing0 + shk(0), y: GROUND, sx: sw0[0], sy: sw0[1] * breathe(t, 0.3), pop: 1, n: 1});
  const pusherX = [W0X - 175, W0X - 350];
  pusherX.forEach((x, i) => {
    const pp = pop(t, POPS[i + 1], 0.22);
    out.push({vis: pp > 0, pose: 'push', x: x + shk(i + 1), y: GROUND, sx: pp, sy: pp * breathe(t, i), pop: pp, n: i + 2});
  });
  // front row: three haulers facing the gate (mirrored), pulling a rope tied to its side
  const haulX = [W0X + 110, W0X - 70, W0X - 250];
  haulX.forEach((x, i) => {
    const pp = pop(t, POPS[i + 3], 0.22);
    out.push({vis: pp > 0, pose: 'haul', x: x + shk(i + 4), y: GROUND + 110, sx: pp * 1.06, sy: pp * 1.06 * breathe(t, i + 2), flip: true, pop: pp, n: i + 4});
  });
  return out;
};

const Guy: React.FC<{g: GuyState}> = ({g}) => {
  if (!g.vis) return null;
  const s = poseS(g.pose);
  return (
    <div style={{position: 'absolute', left: g.x, top: g.y, transform: `scale(${g.flip ? -g.sx : g.sx}, ${g.sy})`, transformOrigin: '0 0', filter: g.filter}}>
      <Spr n={g.pose} x={0} y={0} s={s} />
    </div>
  );
};
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: `rgba(30, 30, 40, ${0.26 * o})`, filter: 'blur(3px)'}} />
);

// ======================================================================================================
// THE BLOCK (the rock the guy lifts), with a face that wakes up when it rises
// ======================================================================================================
const blockLift = (t: number) => {
  // magic float in the hook (people's version), then the real chain-hoist lift
  if (t < T.but + 0.12) {
    const u = easeOutCubic(prog(t, T.magic, T.magic + 0.6));
    return 150 * u + (u > 0 ? 12 * Math.sin(2 * Math.PI * 1.3 * (t - T.magic)) * u : 0);
  }
  if (t < PH0 + 0.1) return 150 * (1 - easeInCubic(prog(t, T.but + 0.02, T.but + 0.12)));
  if (t < CUT_GATE) return liftAt(t);
  return 0;
};
const Block: React.FC<{t: number}> = ({t}) => {
  if (t >= CUT_GATE) return null;
  const lift = blockLift(t);
  const eyesOpen = t >= 12.55 && t < CUT_GATE ? pop(t, 12.55, 0.25) : 0;
  const wink = t > T.enough + 0.15 && t < T.enough + 0.5;
  const look: [number, number] = t < 13.6 ? [-0.2, 0.7] : [-0.7, -0.1];
  const tilt = t >= T.magic && t < T.but ? 4 * Math.sin(2 * Math.PI * 0.9 * (t - T.magic)) : 0;
  return (
    <>
      <Shadow x={BLOCK_X} y={BLOCK_FEET} w={300} o={1 - clamp(lift / 220)} />
      <Spr n="block" x={BLOCK_X} y={BLOCK_FEET - lift} s={BS} rot={tilt}>
        <Eye x={180} y={250} r={34} open={eyesOpen} look={look} brow={0.7} />
        <Eye x={300} y={250} r={34} open={eyesOpen} look={look} lid={wink ? 0.9 : 0} brow={0.7} side={-1} />
      </Spr>
    </>
  );
};
const Sparkles: React.FC<{t: number}> = ({t}) => {
  if (t < T.magic - 0.05 || t > T.but + 0.05) return null;
  const lift = blockLift(t);
  const a = pop(t, T.magic - 0.05, 0.3);
  return (
    <Svg>
      {Array.from({length: 9}).map((_, i) => {
        const ang = (i / 9) * 2 * Math.PI + 0.7 * (t - T.magic);
        const rr = 210 + 30 * Math.sin(3 * t + i);
        const x = BLOCK_X + Math.cos(ang) * rr;
        const y = BLOCK_TOP + 140 - lift + Math.sin(ang) * rr * 0.75;
        const r = (7 + 5 * rnd(i)) * a * (0.6 + 0.4 * Math.abs(Math.sin(5 * t + i * 1.7)));
        return <path key={i} d={star(x, y, r)} fill={YEL} stroke={INK} strokeWidth={3} />;
      })}
    </Svg>
  );
};

// ======================================================================================================
// THE TRIPOD OF TELEPHONE POLES + THE CHAIN HOIST (code)
// ======================================================================================================
const POLE = '#8B5A2B';
const POLE_SH = '#6E4520';
const legDrop = (t: number, t0: number) => (t < t0 - 0.2 ? null : -900 * (1 - easeInCubic(prog(t, t0 - 0.2, t0))));
const PoleShape: React.FC<{a: [number, number]; b: [number, number]; w: number; dy: number; arm?: number; dark?: boolean}> = ({a, b, w, dy, arm = 0, dark}) => {
  const [ax, ay] = a;
  const [bx, by] = b;
  const L = Math.hypot(bx - ax, by - ay);
  const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  return (
    <g transform={`translate(${ax} ${ay + dy}) rotate(${ang})`}>
      <rect x={-10} y={-w / 2} width={L + 10} height={w} rx={w / 2} fill={dark ? POLE_SH : POLE} stroke={INK} strokeWidth={6} />
      <line x1={10} x2={L - 10} y1={w * 0.18} y2={w * 0.18} stroke={POLE_SH} strokeWidth={w * 0.28} strokeLinecap="round" opacity={dark ? 0 : 0.8} />
      {arm > 0.01 ? (
        // telephone-pole crossarm with two green glass insulators, perpendicular to the pole near its top
        <g transform={`translate(${L * 0.2} 0) rotate(-90) scale(${arm})`}>
          <rect x={-62} y={-9} width={124} height={18} rx={4} fill={POLE} stroke={INK} strokeWidth={5} />
          {[-46, 46].map((x) => (
            <g key={x}>
              <path d={`M ${x - 11} -9 L ${x - 9} -26 Q ${x} -38 ${x + 9} -26 L ${x + 11} -9 Z`} fill="#6FD0A0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
              <ellipse cx={x - 3} cy={-24} rx={2.5} ry={5} fill="#fff" />
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
};
const TripodBack: React.FC<{t: number}> = ({t}) => {
  if (t < PH0 || t >= CUT_GATE) return null;
  const dy = legDrop(t, LEG_T[2]);
  if (dy === null) return null;
  return (
    <Svg>
      <PoleShape a={[APEX.x, APEX.y]} b={BACK_LEG} w={24} dy={dy} dark />
    </Svg>
  );
};
const chainLine = (x1: number, y1: number, x2: number, y2: number, off: number, key: string) => (
  <g key={key}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={13} strokeLinecap="round" />
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9AA1A8" strokeWidth={7} strokeDasharray="13 7" strokeDashoffset={off} strokeLinecap="butt" />
  </g>
);
const edFists = (t: number): [number, number] => {
  const g = ed(t);
  const s = poseS('pull');
  const fx = g.x + (SPR.pull.fist[0] - SPR.pull.feet[0]) * s * g.sx;
  const fy = g.y - (SPR.pull.feet[1] - SPR.pull.fist[1]) * s * g.sy;
  return [fx, fy + 18];
};
const TripodFront: React.FC<{t: number}> = ({t}) => {
  if (t < PH0 || t >= CUT_GATE) return null;
  const arm = pop(t, T.telephone, 0.3);
  const hoistDy = t < HOIST_T - 0.25 ? null : -700 * (1 - easeInCubic(prog(t, HOIST_T - 0.25, HOIST_T))) + (t > HOIST_T ? -14 * spring(t - HOIST_T, 3, 6) : 0);
  const lift = liftAt(t);
  const top = BLOCK_TOP - lift;
  const loadReach = easeOutCubic(prog(t, HOIST_T + 0.05, HOIST_T + 0.3));
  // chain movement: the hand chain runs fast on every pull, the load chain creeps
  const handOff = -PULLS.reduce((acc, p) => acc + 160 * easeInOutCubic(prog(t, p, p + 0.26)), 0);
  const loadOff = lift * 1.2;
  const [fx, fy] = edFists(t);
  const all = LEG_T.every((lt) => t >= lt);
  return (
    <Svg>
      {LEGS.map((b, i) => {
        const dy = legDrop(t, LEG_T[i]);
        return dy === null ? null : <PoleShape key={i} a={[APEX.x, APEX.y]} b={b} w={30} dy={dy} arm={arm} />;
      })}
      {all ? (
        <g>
          {/* rope lashing where the three poles meet */}
          <circle cx={APEX.x} cy={APEX.y + 6} r={26 * pop(t, LEG_T[2] + 0.05, 0.2)} fill="#C9A66B" stroke={INK} strokeWidth={6} />
          <line x1={APEX.x - 20} y1={APEX.y} x2={APEX.x + 20} y2={APEX.y + 12} stroke={INK} strokeWidth={4} opacity={pop(t, LEG_T[2] + 0.05, 0.2)} />
        </g>
      ) : null}
      {hoistDy !== null ? (
        <g transform={`translate(0 ${hoistDy})`}>
          {/* hanger + hoist body + hand-chain wheel */}
          <line x1={APEX.x} y1={APEX.y + 20} x2={HOIST.x} y2={HOIST.y - 46} stroke={INK} strokeWidth={10} />
          <rect x={HOIST.x - 40} y={HOIST.y - 50} width={80} height={96} rx={16} fill="#8E969E" stroke={INK} strokeWidth={7} />
          <rect x={HOIST.x - 26} y={HOIST.y - 36} width={22} height={66} rx={8} fill="#6E757C" />
          <circle cx={WHEEL.x} cy={WHEEL.y} r={WHEEL.r} fill="#B9C0C7" stroke={INK} strokeWidth={7} />
          <circle cx={WHEEL.x} cy={WHEEL.y} r={7} fill={INK} />
          {/* load chain down to the hook on the rock (two straps around it) */}
          {loadReach > 0
            ? chainLine(HOIST.x, HOIST.y + 46, HOIST.x, lerp(HOIST.y + 46, top - 60, loadReach), loadOff, 'load')
            : null}
          {loadReach >= 1 ? (
            <g>
              <path d={`M ${HOIST.x} ${top - 62} q 18 0 18 18 q 0 22 -22 22`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
              {chainLine(HOIST.x, top - 30, BLOCK_X - 115, top + 14, 0, 'sl')}
              {chainLine(HOIST.x, top - 30, BLOCK_X + 115, top + 14, 0, 'sr')}
            </g>
          ) : null}
        </g>
      ) : null}
      {/* hand chain from the wheel to the guy's fists, plus the loose tail */}
      {t >= GRAB && hoistDy !== null ? (
        <g>
          {chainLine(WHEEL.x - WHEEL.r, WHEEL.y, fx, fy, handOff, 'hand')}
          {chainLine(fx, fy, fx - 22, Math.min(GROUND - 20, fy + 330), handOff, 'tail')}
        </g>
      ) : null}
    </Svg>
  );
};
const PullArrows: React.FC<{t: number}> = ({t}) => {
  const a = popOut(t, T.long - 0.05, 14.55, 0.25);
  const b = popOut(t, T.little - 0.1, 14.55, 0.25);
  if (a <= 0 && b <= 0) return null;
  const grow = easeOutCubic(prog(t, T.long, T.pull + 0.3));
  return (
    <Svg>
      {a > 0 ? (
        <g transform={`translate(330 1430) scale(${a})`}>
          <line x1={0} y1={0} x2={0} y2={520 * grow} stroke={INK} strokeWidth={34} strokeLinecap="round" />
          <line x1={0} y1={0} x2={0} y2={520 * grow} stroke={RED} strokeWidth={20} strokeLinecap="round" />
          <path d={`M -52 ${520 * grow - 20} L 0 ${520 * grow + 60} L 52 ${520 * grow - 20} Z`} fill={RED} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <Txt x={150} y={-84} size={70} text="LONG PULL" fill={RED} sw={0.24} />
        </g>
      ) : null}
      {b > 0 ? (
        <g transform={`translate(${BLOCK_X + 200} ${BLOCK_TOP + 40 - liftAt(t)}) scale(${b})`}>
          <line x1={0} y1={70} x2={0} y2={0} stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <line x1={0} y1={70} x2={0} y2={0} stroke={GRN} strokeWidth={17} strokeLinecap="round" />
          <path d="M -40 10 L 0 -48 L 40 10 Z" fill={GRN} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <Txt x={-60} y={-112} size={66} text="LITTLE LIFT" fill={GRN} sw={0.24} />
        </g>
      ) : null}
    </Svg>
  );
};

// ======================================================================================================
// THE GATE (9 tons, spins on a hidden truck bearing)
// ======================================================================================================
const gateTheta = (t: number) => (t < TOUCH ? 0 : 2 * Math.PI * 1.5 * easeOutCubic(prog(t, TOUCH, SPIN1)));
const gateLift = (t: number) => 210 * easeInOutCubic(prog(t, LIFT0, LIFT1));
const GATE_TH = 74; // thickness (world)
const Gate: React.FC<{t: number; filter?: string}> = ({t, filter}) => {
  const gb = SPR.gate;
  const bw = gb.right - gb.left;
  const bh = gb.bottom - gb.top;
  const sxB = (GW * 0.97) / bw;
  const syB = GH / bh;
  const th = gateTheta(t);
  const c = Math.cos(th);
  const sn = Math.sin(th);
  const a = GW / 2;
  const b = GATE_TH / 2;
  const faceCx = GX + (c >= 0 ? b * sn : -b * sn);
  const lift = gateLift(t);
  const thud = t >= T.nineton ? spring(t - T.nineton, 3.5, 6) : 0;
  const jamShake = t >= JAM && t < JAM + 0.6 ? 5 * Math.sin(2 * Math.PI * 17 * t) * (1 - prog(t, JAM, JAM + 0.6)) : 0;
  const strain = t > LIFT0 - 0.4 && t < LIFT0 ? 2 * Math.sin(2 * Math.PI * 13 * t) : 0;
  const yb = WALL_BASE + 2 - lift;
  // face: sleepy, wakes on "nine-ton", dizzy after the spin; in 1986: rusty, squeezed on the jam, wide when lifted
  const day = t >= DAY;
  const open = c > 0.35 ? 1 : 0;
  const wake = t < T.nineton ? 0.55 : t < TOUCH ? 0 : t < SPIN1 + 0.1 ? 0 : 0.35;
  const look: [number, number] = t >= SPIN1 && t < DAY ? [Math.cos(9 * t), Math.sin(9 * t)] : day ? (t > LIFT0 ? [0, 0.8] : [-0.6, 0.2]) : [-0.7, 0.3];
  const squeeze = day && t >= JAM && t < LIFT0;
  const lidDay = day && t < JAM ? 0.6 : 0;
  const sideW = GATE_TH * Math.abs(sn);
  const sideCx = sn > 0 ? GX - a * c : GX + a * c;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, filter}}>
      {/* the side of the slab while it spins */}
      {sideW > 2 ? (
        <Svg>
          <rect x={sideCx - sideW / 2} y={yb - GH} width={sideW} height={GH} fill={STONE_SH} stroke={INK} strokeWidth={6} />
        </Svg>
      ) : null}
      <div style={{position: 'absolute', left: faceCx + jamShake + strain, top: yb, transform: `scale(${Math.max(0.02, Math.abs(c))}, ${1 - 0.035 * thud})`, transformOrigin: '0 0'}}>
        <Spr n="gate" x={0} y={0} s={1} sx={sxB} sy={syB} ax={(gb.left + gb.right) / 2} ay={gb.bottom}>
          {open ? (
            <g>
              <Eye x={110} y={270} r={40} open={1} lid={squeeze ? 0 : Math.max(wake, lidDay)} look={look} squeeze={squeeze} side={1} brow={0.6} />
              <Eye x={205} y={270} r={40} open={1} lid={squeeze ? 0 : Math.max(wake, lidDay)} look={look} squeeze={squeeze} side={-1} brow={0.6} />
              {day ? (
                // rust patches on the lower half in 1986
                <g opacity={0.85}>
                  {[
                    [70, 560, 26],
                    [230, 610, 32],
                    [140, 660, 22],
                    [250, 480, 16],
                  ].map(([x, y, r], i) => (
                    <ellipse key={i} cx={x} cy={y} rx={r * 1.3} ry={r} fill={RUST} opacity={0.75} />
                  ))}
                </g>
              ) : null}
            </g>
          ) : null}
        </Spr>
      </div>
    </div>
  );
};
// motion arcs while the gate spins + dizzy stars circling it afterwards
const SpinMarks: React.FC<{t: number}> = ({t}) => {
  if (t < TOUCH || t >= DAY) return null;
  const speed = 1 - prog(t, TOUCH + 0.15, SPIN1);
  const th = gateTheta(t);
  const arcs = [GATE_TOP + 60, WALL_BASE - 70];
  const dz = pop(t, SPIN1 - 0.15, 0.3);
  return (
    <Svg>
      {speed > 0.05
        ? arcs.map((y, i) => {
            const rx = GW * 0.95;
            const ry = 34;
            const a0 = (th * 2 + i) % (2 * Math.PI);
            const pts = Array.from({length: 14}).map((_, j) => {
              const a = a0 + (j / 13) * Math.PI * 0.9;
              return `${GX + Math.cos(a) * rx},${y + Math.sin(a) * ry}`;
            });
            return <polyline key={i} points={pts.join(' ')} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0.85 * speed} />;
          })
        : null}
      {dz > 0
        ? [0, 1, 2].map((i) => {
            const a = 2 * Math.PI * (i / 3) + 4 * t;
            return <path key={i} d={star(GX + Math.cos(a) * 120, GATE_TOP - 50 + Math.sin(a) * 26, 11 * dz)} fill={YEL} stroke={INK} strokeWidth={4} />;
          })
        : null}
    </Svg>
  );
};
// the rusty truck bearing the gate turns on (seen once the crane lifts the gate)
const Bearing: React.FC<{t: number}> = ({t}) => {
  if (t < DAY) return null;
  const flakes = t >= JAM ? prog(t, JAM, JAM + 0.7) : 0;
  return (
    <Svg>
      <ellipse cx={GX} cy={WALL_BASE - 10} rx={44} ry={20} fill="#5b3a26" stroke={INK} strokeWidth={6} />
      <ellipse cx={GX} cy={WALL_BASE - 16} rx={30} ry={12} fill={RUST} stroke={INK} strokeWidth={5} />
      <circle cx={GX - 8} cy={WALL_BASE - 18} r={4} fill="#7a3a1a" />
      <circle cx={GX + 12} cy={WALL_BASE - 14} r={3} fill="#7a3a1a" />
      {flakes > 0 && flakes < 1
        ? Array.from({length: 7}).map((_, i) => {
            const ang = -Math.PI * (0.15 + 0.7 * rnd(i + 3));
            const d = 120 * flakes;
            const x = GX + Math.cos(ang) * d * (i % 2 ? 1 : -1);
            const y = WALL_BASE - 30 + Math.sin(ang) * d + 220 * flakes * flakes;
            return <rect key={i} x={x} y={y} width={12} height={8} fill={RUST} stroke={INK} strokeWidth={2} transform={`rotate(${i * 40} ${x} ${y})`} />;
          })
        : null}
    </Svg>
  );
};

// ======================================================================================================
// THE CRANE (1986) + its cable and hook (code)
// ======================================================================================================
const CS = 1.15;
const CRX = GX - SPR.crane.tip[0] * CS; // crane sprite left when parked (hook over the gate)
const CR_BOTTOM = GROUND + 25;
const crTop = CR_BOTTOM - SPR.crane.feet[1] * CS;
const craneX = (t: number) => (t < CRANE0 ? 2700 : lerp(2700, CRX, easeOutCubic(prog(t, CRANE0, CRANE1))));
const hookTopY = (t: number) => {
  const tipY = crTop + SPR.crane.tip[1] * CS;
  const rest = tipY + 90;
  const down = GATE_TOP - (SPR.hook.bottom - SPR.hook.top[1]) * CS - 4;
  if (t < HOOK0) return rest;
  if (t < LIFT0) return lerp(rest, down, easeInOutCubic(prog(t, HOOK0, HOOK1)));
  return down - gateLift(t);
};
const Crane: React.FC<{t: number}> = ({t}) => {
  if (t < CRANE0) return null;
  const x = craneX(t);
  const bounce = t > CRANE1 ? 6 * spring(t - CRANE1, 2.5, 5) : 0;
  const rumble = t > LIFT0 && t < LIFT1 ? 2 * Math.sin(2 * Math.PI * 21 * t) : 0;
  const tipX = x + SPR.crane.tip[0] * CS;
  const tipY = crTop + SPR.crane.tip[1] * CS + rumble;
  const hy = hookTopY(t);
  const hx = tipX;
  const win = SPR.crane.win;
  const eyesOpen = pop(t, CRANE1 - 0.1, 0.25);
  const squeeze = t > LIFT0 && t < LIFT1 + 0.1;
  return (
    <>
      <Shadow x={x + 560 * CS} y={CR_BOTTOM} w={1000} />
      <Spr n="crane" x={x} y={crTop + rumble + bounce} s={CS} ax={0} ay={0}>
        {/* the cab window becomes a face */}
        <Eye x={(win[0] + win[2]) / 2 - 26} y={(win[1] + win[3]) / 2} r={22} open={eyesOpen} look={[-0.8, -0.2]} squeeze={squeeze} side={1} brow={0.55} />
        <Eye x={(win[0] + win[2]) / 2 + 26} y={(win[1] + win[3]) / 2} r={22} open={eyesOpen} look={[-0.8, -0.2]} squeeze={squeeze} side={-1} brow={0.55} />
      </Spr>
      <Svg>
        <line x1={tipX} y1={tipY} x2={hx} y2={hy + 4} stroke={INK} strokeWidth={9} />
        {/* sling from the hook to the gate's top corners once it is hooked */}
        {t >= HOOK1 ? (
          <g>
            <line x1={hx} y1={hy + (SPR.hook.bottom - SPR.hook.top[1]) * CS - 10} x2={GX - GW * 0.42} y2={GATE_TOP - gateLift(t) + 8} stroke={INK} strokeWidth={8} />
            <line x1={hx} y1={hy + (SPR.hook.bottom - SPR.hook.top[1]) * CS - 10} x2={GX + GW * 0.42} y2={GATE_TOP - gateLift(t) + 8} stroke={INK} strokeWidth={8} />
          </g>
        ) : null}
      </Svg>
      <Spr n="hook" x={hx} y={hy} s={CS} ax={SPR.hook.top[0]} ay={SPR.hook.top[1]} />
    </>
  );
};
const Rope: React.FC<{t: number; ws: (GuyState & {pop: number; n: number})[]}> = ({t, ws}) => {
  const haulers = ws.filter((w) => w.pose === 'haul' && w.pop > 0.8);
  if (haulers.length === 0) return null;
  const s = poseS('haul');
  const pts = haulers.map((w) => [w.x - (SPR.haul.fist[0] - SPR.haul.feet[0]) * s * w.sx, w.y - (SPR.haul.feet[1] - SPR.haul.fist[1]) * s * w.sy + 10]);
  const start: [number, number] = [GX0 + 8, GATE_TOP + GH * 0.6 - gateLift(t)];
  const last = pts[pts.length - 1];
  const all = [start, ...pts, [last[0] - 80, last[1] + 60]];
  return (
    <Svg>
      <polyline points={all.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={15} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={all.map((p) => p.join(',')).join(' ')} fill="none" stroke="#D8B66A" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
};

// ======================================================================================================
// THE NIGHT SKY, THE MOON WITH A FACE, THE NEIGHBOURS PEEKING OVER THE WALL
// ======================================================================================================
const MOON = {x: 1060, y: 1040, r: 72};
const NightSky: React.FC<{t: number; n: number; noMoon?: boolean}> = ({t, n, noMoon}) =>
  n <= 0.01 ? null : (
    <Svg>
      <g opacity={n}>
        {Array.from({length: 34}).map((_, i) => {
          const x = -300 + rnd(i + 70) * 2600;
          const y = 80 + rnd(i + 90) * 1150;
          const r = (3.5 + 3.5 * rnd(i + 110)) * (0.75 + 0.25 * Math.sin(2.3 * t + i));
          return <path key={i} d={star(x, y, r)} fill="#FFF6C8" />;
        })}
        {noMoon ? null : (<g>
        <circle cx={MOON.x} cy={MOON.y} r={MOON.r + 26} fill="#FFF3B0" opacity={0.18} />
        <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill="#FFF3B0" stroke={INK} strokeWidth={8} />
        <circle cx={MOON.x + 30} cy={MOON.y + 30} r={14} fill="#EADB8C" />
        <circle cx={MOON.x - 36} cy={MOON.y - 30} r={9} fill="#EADB8C" />
        {(() => {
          const awake = pop(t, T.alone - 0.05, 0.3);
          const blink = t > 5.3 && t < 5.42 ? 1 : 0;
          if (awake <= 0) {
            return (
              <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
                <path d={`M ${MOON.x - 40} ${MOON.y - 8} q 13 12 26 0`} />
                <path d={`M ${MOON.x + 14} ${MOON.y - 8} q 13 12 26 0`} />
              </g>
            );
          }
          return (
            <g>
              <Eye x={MOON.x - 26} y={MOON.y - 8} r={20} open={awake} look={[-0.9, 0.6]} lid={blink} side={1} brow={0.6} />
              <Eye x={MOON.x + 26} y={MOON.y - 8} r={20} open={awake} look={[-0.9, 0.6]} lid={blink} side={-1} brow={0.6} />
              <path d={`M ${MOON.x - 16} ${MOON.y + 40} q 16 -8 32 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            </g>
          );
        })()}
        </g>)}
      </g>
    </Svg>
  );
const NEIGH = [
  {x: 430, t0: 5.95, hat: false, r: 54},
  {x: 1330, t0: 6.12, hat: true, r: 50},
];
const Neighbours: React.FC<{t: number}> = ({t}) => {
  if (t < 5.8 || t >= PH0) return null;
  return (
    <Svg>
      {NEIGH.map((nb, i) => {
        const up = easeOutCubic(prog(t, nb.t0, nb.t0 + 0.3));
        if (up <= 0) return null;
        const cy = LOW_TOP + nb.r + 30 - (nb.r * 1.75 + 30) * up;
        const wide = t >= T.magic ? 1.35 : 1;
        const lookX = t >= T.magic ? (nb.x < BLOCK_X ? 0.6 : -0.6) : 0;
        return (
          <g key={i}>
            <circle cx={nb.x} cy={cy} r={nb.r} fill="#FEFDFD" stroke={INK} strokeWidth={8} />
            <path d={`M ${nb.x - nb.r} ${cy} A ${nb.r} ${nb.r} 0 0 1 ${nb.x - nb.r * 0.2} ${cy - nb.r * 0.98}`} fill="none" stroke="#EDEBEB" strokeWidth={10} opacity={0.8} />
            <ellipse cx={nb.x - 16 + lookX * 8} cy={cy - 4} rx={6 * wide} ry={11 * wide} fill={INK} />
            <ellipse cx={nb.x + 16 + lookX * 8} cy={cy - 4} rx={6 * wide} ry={11 * wide} fill={INK} />
            {nb.hat ? <path d={`M ${nb.x - 40} ${cy - nb.r + 12} q 40 -50 80 0 Z`} fill="#E06A8C" stroke={INK} strokeWidth={6} /> : null}
            {/* fingers on the wall top */}
            {[-1, 1].map((sgn) => (
              <ellipse key={sgn} cx={nb.x + sgn * (nb.r + 14)} cy={LOW_TOP - 2} rx={20} ry={11} fill="#FEFDFD" stroke={INK} strokeWidth={6} opacity={up > 0.7 ? 1 : 0} />
            ))}
          </g>
        );
      })}
    </Svg>
  );
};
const MagicBubble: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.magic - 0.04, T.but - 0.02, 0.25);
  if (s <= 0) return null;
  const x = NEIGH[0].x + 10;
  const y = LOW_TOP - 230;
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) rotate(-6) scale(${s})`}>
        <path d="M -150 -64 Q -160 -100 -110 -104 L 120 -104 Q 160 -100 155 -60 L 150 40 Q 145 70 110 72 L 0 72 L -30 120 L -40 72 L -110 72 Q -150 70 -150 40 Z" fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <Txt x={0} y={-16} size={74} text="MAGIC!" fill="#8A4FE0" sw={0.14} />
      </g>
    </Svg>
  );
};

// ======================================================================================================
// THE SCENE (world)
// ======================================================================================================
export const CastleScene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const n = night(t);
  const sep = sepiaAt(t);
  const plateFilter = n > 0 ? `brightness(${1 - 0.2 * n})` : undefined;
  const sprFilter = n > 0 ? `brightness(${1 - 0.1 * n})` : undefined;
  const g = ed(t);
  const ws = workers(t);
  const worldFilter = sep > 0.01 ? `sepia(${0.95 * sep}) saturate(${1 - 0.25 * sep}) contrast(${1 + 0.06 * sep}) brightness(${1 + 0.04 * sep})` : undefined;
  const skyCol = SPR.yard.cols.sky;
  const grass = SPR.yard.cols.grass;
  const HOR = SPR.yard.horizon * PS;
  return (
    <AbsoluteFill style={{filter: worldFilter}}>
      <World cam={cam}>
        {/* plate + flat extensions on every side */}
        <div style={{position: 'absolute', left: -3000, top: -3000, width: PW + 6000, height: HOR + 3000, background: skyCol, filter: plateFilter}} />
        <div style={{position: 'absolute', left: -3000, top: HOR - 2, width: PW + 6000, height: 6000, background: grass, filter: plateFilter}} />
        <Img src={F('yard')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH, filter: plateFilter}} />
        <Neighbours t={t} />
        {/* the castle: wall + tower, an obelisk and a pile of blocks (all stone, in the background plane) */}
        <div style={{position: 'absolute', left: 0, top: 0, filter: plateFilter}}>
          <Spr n="wall" x={WX0} y={wallY0} s={WS} ax={0} ay={0} />
          <Spr n="obelisk" x={240} y={WALL_BASE + 40} s={0.74} />
          <Spr n="block" x={1560} y={WALL_BASE + 50} s={0.42} />
          <Spr n="block" x={1760} y={WALL_BASE + 40} s={0.36} sx={-1} />
          <Spr n="block" x={1665} y={WALL_BASE + 50 - 0.42 * 466} s={0.34} rot={3} />
        </div>
        {n > 0 ? <div style={{position: 'absolute', left: -3000, top: -3000, width: PW + 6000, height: 9000, background: '#34449A', mixBlendMode: 'multiply', opacity: 0.6 * n}} /> : null}
        <NightSky t={t} n={n} noMoon={cover} />
        <Bearing t={t} />
        <Gate t={t} filter={sprFilter} />
        <div style={{position: 'absolute', left: 0, top: 0, filter: sprFilter}}>
          <TripodBack t={t} />
          <Block t={t} />
          {g.vis ? <Shadow x={g.x} y={GROUND} w={g.pose === 'pull' ? 210 : 230} /> : null}
          <Guy g={g} />
          <TripodFront t={t} />
          <Crane t={t} />
          {ws
            .filter((w) => w.pose !== 'haul')
            .reverse()
            .map((w) => (
              <React.Fragment key={w.n}>
                <Shadow x={w.x} y={w.y} w={240 * w.pop} />
                <Guy g={w} />
              </React.Fragment>
            ))}
          <Rope t={t} ws={ws} />
          {ws
            .filter((w) => w.pose === 'haul')
            .reverse()
            .map((w) => (
              <React.Fragment key={w.n}>
                <Shadow x={w.x} y={w.y} w={250 * w.pop} />
                <Guy g={w} />
              </React.Fragment>
            ))}
        </div>
        <Sparkles t={t} />
        <SpinMarks t={t} />
        <MagicBubble t={t} />
        <PullArrows t={t} />
        <Svg>
          {/* "9 TONS" tag over the gate */}
          {!cover && t >= T.nineton - 0.05 && t < DAY ? <Txt x={GX} y={GATE_TOP - 150} size={96} s={popOut(t, T.nineton - 0.05, T.but2 - 0.1, 0.25)} text="9 TONS" fill={YEL} sw={0.22} /> : null}
          {/* the 1986 crew counts off: 1 .. 6 */}
          {!cover
            ? ws.map((w) => {
                const s = popOut(t, POPS[w.n - 1], 23.4, 0.22);
                if (s <= 0) return null;
                return <Txt key={w.n} x={w.x + (w.pose === 'haul' ? -150 : 90)} y={w.y - (w.pose === 'haul' ? 470 : 500)} size={84} s={s} text={`${w.n}`} fill={YEL} sw={0.24} />;
              })
            : null}
          {/* sweat on the first worker after the jam */}
          {t >= DAY ? <SweatDrop x={W0X - 70 + 80} y={GROUND - 520 + 30 * prog(t, JAM + 0.3, JAM + 1.2)} r={20} s={popOut(t, JAM + 0.3, POPS[0], 0.2)} /> : null}
          {t >= DAY && t >= JAM && t < JAM + 0.9 ? (
            <PuffCluster
              puffs={Array.from({length: 3}).map((_, i) => ({
                x: GX + (i - 1) * 46,
                y: WALL_BASE - 30 - 60 * prog(t, JAM, JAM + 0.9) - (i === 1 ? 20 : 0),
                r: 36 * Math.sin(Math.PI * prog(t, JAM, JAM + 0.9)) * (0.85 + 0.3 * rnd(i)),
              }))}
              fill="#B98B66"
              ink={5}
            />
          ) : null}
          {/* "!" over the guy when the flash goes off is not needed: the flash is the beat */}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};

// ---------- screen-space overlays ----------
const TonsPlaque: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.eleven - 0.08, 5.5, 0.3);
  if (s <= 0) return null;
  const v = easeOutCubic(prog(t, T.eleven, T.tons + 0.05));
  const num = Math.round((1100 * v) / 10) * 10;
  const thud = t >= T.tons ? 12 * spring(t - T.tons, 3, 6) : 0;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <g transform={`translate(540 ${310 + thud}) rotate(-3) scale(${s})`}>
        <rect x={-330} y={-92} width={660} height={184} rx={26} fill={STONE} stroke={INK} strokeWidth={12} />
        <rect x={-300} y={-66} width={600} height={30} rx={12} fill={STONE_SH} opacity={0.6} />
        <circle cx={-250} cy={50} r={8} fill="#9C8E72" />
        <circle cx={262} cy={-40} r={10} fill="#9C8E72" />
        <text x={0} y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill={INK}>
          {`${num.toLocaleString('en-US')} TONS`}
        </text>
      </g>
    </svg>
  );
};
const Calendar: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.but2 - 0.02, 20.35, 0.25);
  if (s <= 0) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <g transform={`translate(540 420) rotate(-4) scale(${s})`}>
        <rect x={-230} y={-170} width={460} height={340} rx={22} fill="#fff" stroke={INK} strokeWidth={12} />
        <path d="M -224 -164 L 224 -164 L 224 -60 L -224 -60 Z" fill={RED} />
        <rect x={-230} y={-170} width={460} height={340} rx={22} fill="none" stroke={INK} strokeWidth={12} />
        {[-120, 0, 120].map((x) => (
          <rect key={x} x={x - 12} y={-200} width={24} height={64} rx={10} fill="#C8CDD3" stroke={INK} strokeWidth={6} />
        ))}
        <text x={0} y={-94} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={50} fill="#fff">
          YEARS LATER
        </text>
        <text x={0} y={105} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={150} fill={INK}>
          1986
        </text>
      </g>
    </svg>
  );
};
// the old photo of the guy pinned in the corner at the end: he winks (one man, no crane)
const EdPhoto: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, PHOTO_END, 0.3);
  if (s <= 0) return null;
  const hs = 0.25;
  const eye = (SPR.hero as unknown as {eyes: number[][]}).eyes[0];
  const wink = t >= WINK && t < WINK + 0.32;
  return (
    <div style={{position: 'absolute', left: 60, top: 230, width: 330, height: 420, transform: `rotate(-7deg) scale(${s})`, transformOrigin: '50% 0%'}}>
      <div style={{position: 'absolute', inset: 0, background: '#F6F1E6', border: '8px solid #000', borderRadius: 10, boxShadow: '0 10px 0 rgba(0,0,0,0.25)'}} />
      <div style={{position: 'absolute', left: 22, top: 22, width: 270, height: 330, overflow: 'hidden', background: '#E9D9B4', border: '5px solid #000', filter: 'sepia(0.85) contrast(1.05)'}}>
        <div style={{position: 'absolute', left: 0, top: 236, width: 270, height: 100, background: '#C9B48A'}} />
        <div style={{position: 'absolute', left: 135, top: 318, transform: `scale(${hs})`, transformOrigin: '0 0'}}>
          <Spr n="hero" x={0} y={0} s={1}>
            {wink ? (
              <g>
                <ellipse cx={eye[0]} cy={eye[1]} rx={eye[2] * 1.7} ry={eye[3] * 1.35} fill="#FEFDFD" />
                <path d={`M ${eye[0] - eye[2] * 1.5} ${eye[1] + 6} q ${eye[2] * 1.5} 26 ${eye[2] * 3} 0`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
              </g>
            ) : null}
          </Spr>
        </div>
      </div>
      {/* tape */}
      <div style={{position: 'absolute', left: 110, top: -26, width: 110, height: 44, background: 'rgba(255, 236, 160, 0.85)', border: '4px solid #000', transform: 'rotate(4deg)'}} />
    </div>
  );
};
// the old-photo frame (7.7-11.9): white border, dark table around, tape on the corners, a burnt-edge vignette inside.
// On exit the frame zooms past the camera (we fly through the photo into the living scene) - no fade.
const PhotoFrame: React.FC<{t: number}> = ({t}) => {
  if (t < PH0 || t >= PH2) return null;
  const z = 1 + 1.7 * easeInCubic(prog(t, PH1, PH2));
  const vig = 1 - prog(t, PH1, PH1 + 0.25);
  const x0 = 90;
  const y0 = 250;
  const w = 900;
  const h = 1420;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: `scale(${z})`, transformOrigin: '540px 960px'}} width={1080} height={1920}>
      <defs>
        <radialGradient id="cc-vig" cx="50%" cy="50%" r="72%">
          <stop offset="55%" stopColor="#5a3d22" stopOpacity={0} />
          <stop offset="100%" stopColor="#5a3d22" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <rect x={x0} y={y0} width={w} height={h} fill="url(#cc-vig)" opacity={vig} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={x0 + 160 + 260 * i} y1={y0 + 40 + 90 * i} x2={x0 + 190 + 250 * i} y2={y0 + 420 + 200 * i} stroke="#fff" strokeWidth={3} opacity={0.35 * vig} />
      ))}
      <path d={`M -2900 -2900 H 3980 V 4820 H -2900 Z M ${x0} ${y0} V ${y0 + h} H ${x0 + w} V ${y0} Z`} fill={TABLE} fillRule="evenodd" />
      <rect x={x0 - 18} y={y0 - 18} width={w + 36} height={h + 36} fill="none" stroke="#F6F1E6" strokeWidth={36} />
      <rect x={x0 - 36} y={y0 - 36} width={w + 72} height={h + 72} fill="none" stroke={INK} strokeWidth={8} />
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke={INK} strokeWidth={6} />
      <rect x={x0 + 20} y={y0 - 70} width={160} height={60} fill="rgba(255, 236, 160, 0.85)" stroke={INK} strokeWidth={5} transform={`rotate(-14 ${x0 + 100} ${y0 - 40})`} />
      <rect x={x0 + w - 180} y={y0 - 70} width={160} height={60} fill="rgba(255, 236, 160, 0.85)" stroke={INK} strokeWidth={5} transform={`rotate(12 ${x0 + w - 100} ${y0 - 40})`} />
    </svg>
  );
};
const Flash: React.FC<{t: number}> = ({t}) => {
  const a = t < T.but - 0.02 ? 0 : t < T.but + 0.05 ? prog(t, T.but - 0.02, T.but + 0.05) : 1 - easeOutCubic(prog(t, T.but + 0.12, T.but + 0.45));
  if (a <= 0.01) return null;
  return <AbsoluteFill style={{background: '#FFFBE8', opacity: clamp(a)}} />;
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'crickets', at: 0.0, db: -32},
  {f: 'pop', at: T.eleven - 0.06, db: -24},
  {f: 'stone_step', at: T.tons, db: -15},
  {f: 'crickets', at: T.alone + 0.05, db: -24},
  {f: 'whoosh', at: 5.45, db: -31},
  {f: 'pop', at: NEIGH[0].t0 + 0.1, db: -25},
  {f: 'pop', at: NEIGH[1].t0 + 0.1, db: -25, rate: 1.15},
  {f: 'magic', at: T.magic - 0.06, db: -15},
  {f: 'flashbulb', at: T.but - 0.08, db: -11},
  {f: 'stone_step', at: T.but + 0.1, db: -17},
  {f: 'stone_step', at: LEG_T[0], db: -19, rate: 1.15},
  {f: 'stone_step', at: LEG_T[1], db: -19, rate: 1.0},
  {f: 'stone_step', at: LEG_T[2], db: -20, rate: 0.9},
  {f: 'pop', at: T.telephone, db: -24, rate: 1.2},
  {f: 'pop', at: T.telephone + 0.08, db: -25, rate: 1.35},
  {f: 'winch', at: HOIST_T - 0.15, db: -21},
  {f: 'rock_crack', at: HOIST_T, db: -22},
  ...PULLS.map((p) => ({f: 'chain', at: p - 0.02, db: -17, dur: 0.5})),
  ...PULLS.map((p) => ({f: 'grind', at: p + 0.02, db: -26, dur: 0.32})),
  {f: 'pop', at: 12.55, db: -25},
  {f: 'pop', at: T.long - 0.05, db: -26},
  {f: 'pop', at: T.little - 0.1, db: -26, rate: 1.3},
  {f: 'boing', at: T.enough + 0.02, db: -25},
  {f: 'whoosh', at: CUT_GATE - 0.1, db: -29},
  {f: 'stone_step', at: T.nineton, db: -13, rate: 0.85},
  {f: 'pop', at: T.turns, db: -28},
  {f: 'gate_turn', at: TOUCH - 0.02, db: -13},
  {f: 'whoosh', at: TOUCH + 0.1, db: -25},
  {f: 'flip', at: T.but2 - 0.05, db: -17},
  {f: 'rust_jam', at: JAM - 0.04, db: -13},
  {f: 'gulp', at: JAM + 0.5, db: -22},
  {f: 'crane', at: CRANE0, db: -15},
  ...POPS.map((p, i) => ({f: 'pop', at: p, db: -22, rate: 0.9 + 0.1 * i})),
  {f: 'winch', at: HOOK0 + 0.05, db: -23},
  {f: 'crane', at: LIFT0 - 0.1, db: -18, rate: 1.08},
  {f: 'grind', at: LIFT0, db: -18},
  {f: 'pop', at: PHOTO_END, db: -24},
  {f: 'boing', at: WINK, db: -27, rate: 1.2},
];

export const CoralCastleShort: React.FC = () => {
  useCCFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAtT(t);
  const pf = sepiaAt(t);
  return (
    <AbsoluteFill style={{background: pf > 0.01 ? TABLE : NIGHT_BG}}>
      <AbsoluteFill style={{transform: pf > 0.001 ? `rotate(${-2.5 * pf}deg) scale(${1 - 0.07 * pf})` : undefined}}>
        <CastleScene t={t} cam={cam} />
        <PhotoFrame t={t} />
      </AbsoluteFill>
      <TonsPlaque t={t} />
      <Calendar t={t} />
      <EdPhoto t={t} />
      <Flash t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('coral-castle/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('coral-castle/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="coral-castle/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const CC_TOTAL = Math.round(DURATION * FPS);
