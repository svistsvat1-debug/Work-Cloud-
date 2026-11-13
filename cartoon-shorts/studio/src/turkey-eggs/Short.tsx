import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInCubic, easeOutBack, easeOutCubic, lerp, pop, prog, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';
import {Bubble, Check, DayCard, Egg, FONT, Mark, PriceTag, ShellCap} from './parts';

// "Why don't we eat turkey eggs?" - one farmyard world (plate x 1.6), shots cut in the voice pauses:
// A frame 0 (turkey lays, the egg sees the hungry guy) | B the guy tastes | C the hen lays a week of eggs |
// D the turkey strains for nothing, 6 vs 2, then eats a heap | E price tag close-up | F the guy's shock |
// G the egg hatches, the chick dreams of Thanksgiving dinner and panics; the camera glides back to frame 0.

const F = (n: string) => staticFile(`turkey-eggs/${n}.png`);
export const useTurkeyFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));

export const BG_S = 1.6;
export const WW = SPR.bg.w * BG_S;
export const WH = SPR.bg.h * BG_S;
const MIX_DB = 4.0;

// ---------- world layout ----------
export const GUY = {x: 1272, y: 1910, s: 0.553};
export const TURKEY = {x: 870, y: 1900, s: 0.48, sp: 0.78};
export const NEST = {x: 650, y: 1915, s: 0.5};
export const EGG_W = 86;
export const EGG1 = {x: 614, y: 1826};
export const EGG2 = {x: 690, y: 1830};
const HEN = {x: 225, y: 1890, s: 0.5};
const HEAP = {x: 1120, y: 1915, s: 0.45};
const CHICK_S = 0.27;
const CLOUD = {x: 680, y: 1415, w: 270};
const PW = 54; // chicken egg width
const PILE: [number, number][] = [
  [405, 1893],
  [467, 1893],
  [529, 1893],
  [436, 1843],
  [498, 1843],
  [467, 1793],
];
const LAYS = [6.34, 6.62, 6.9, 7.18, 7.46, 7.74];
const FLIPS = [6.48, 6.76, 7.04, 7.32, 7.6, 7.98];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const BITES = [10.45, 10.72, 10.99, 11.26, 11.5];
const HATCH = T.instead; // 15.02

// ---------- shots + cameras ----------
type Shot = 'A' | 'B' | 'CD' | 'E' | 'F' | 'G';
const CUTS = {B: 3.22, C: 5.6, E: 11.8, F: 12.92, G: 13.52};
export const shotAt = (t: number): Shot =>
  t < CUTS.B ? 'A' : t < CUTS.C ? 'B' : t < CUTS.E ? 'CD' : t < CUTS.F ? 'E' : t < CUTS.G ? 'F' : 'G';
export const CAM0: CamKey = {t: 0, x: 992, y: 1419, k: 1.1};
const KEYS: Record<Shot, CamKey[]> = {
  A: [CAM0, {t: 3.22, x: 998, y: 1436, k: 1.16}],
  B: [{t: 3.22, x: 1185, y: 1560, k: 1.5}, {t: 5.6, x: 1175, y: 1560, k: 1.56}],
  CD: [
    {t: 5.6, x: 370, y: 1650, k: 1.6},
    {t: 8.2, x: 380, y: 1645, k: 1.66},
    {t: 8.85, x: 670, y: 1490, k: 1.03},
    {t: 10.25, x: 680, y: 1495, k: 1.05},
    {t: 10.8, x: 870, y: 1560, k: 1.25},
    {t: 11.8, x: 875, y: 1565, k: 1.28},
  ],
  E: [{t: 11.8, x: 655, y: 1780, k: 2.4}, {t: 12.92, x: 655, y: 1770, k: 2.55}],
  F: [{t: 12.92, x: 1270, y: 1450, k: 1.6}, {t: 13.52, x: 1270, y: 1440, k: 1.62}],
  G: [
    {t: 13.52, x: 700, y: 1620, k: 1.55},
    {t: 15.0, x: 690, y: 1630, k: 1.65},
    {t: 15.5, x: 680, y: 1630, k: 1.68},
    {t: 16.0, x: 650, y: 1610, k: 2.1},
    {t: 16.45, x: 652, y: 1612, k: 2.12},
    {t: 17.15, x: CAM0.x, y: CAM0.y, k: CAM0.k},
  ],
};
const clampCam = (c: Cam): Cam => ({
  k: c.k,
  x: clamp(c.x, 540 / c.k, WW - 540 / c.k),
  y: clamp(c.y, 960 / c.k, WH - 960 / c.k),
});

// ---------- sounds (ElevenLabs: 7 new for this video + 8 reused from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'gobble', at: 0.12, db: -22},
  {f: 'squeeze', at: T.lay - 0.04, db: -22},
  {f: 'pop', at: T.eggs, db: -18, rate: 0.85},
  {f: 'catch', at: 0.93, db: -23, rate: 1.2},
  {f: 'boing', at: T.eat + 0.02, db: -27, rate: 1.25},
  {f: 'pop', at: 2.72, db: -27, rate: 1.5},
  {f: 'whoosh', at: CUTS.B, db: -31, rate: 1.3},
  {f: 'clink', at: T.safe, db: -23},
  {f: 'munch', at: T.taste + 0.04, db: -17},
  {f: 'cluck', at: T.chicken1 - 0.06, db: -21},
  {f: 'pop', at: T.eggs2, db: -23, rate: 1.3},
  {f: 'whoosh', at: CUTS.C, db: -31, rate: 1.1},
  ...LAYS.map((at, i) => ({f: 'pop', at, db: -20, rate: 0.9 + i * 0.1}) as Cue),
  ...[6.48, 7.04, 7.6, 7.98].map((at) => ({f: 'flip', at: at - 0.25, db: -29}) as Cue),
  {f: 'cluck', at: 7.86, db: -24, rate: 1.1},
  {f: 'whoosh', at: 8.3, db: -32, rate: 0.9},
  {f: 'squeeze', at: T.lays2 + 0.02, db: -21},
  {f: 'squeeze', at: 9.28, db: -21, rate: 0.85},
  {f: 'pop', at: T.third, db: -21, rate: 1.1},
  {f: 'pop', at: T.many, db: -21, rate: 0.8},
  {f: 'pop', at: 10.28, db: -25, rate: 0.9},
  {f: 'peck', at: 10.4, db: -18, dur: 0.55},
  {f: 'peck', at: 10.94, db: -18, dur: 0.55},
  {f: 'boing', at: 11.6, db: -24, rate: 0.7},
  {f: 'whoosh', at: CUTS.E, db: -31, rate: 1.2},
  {f: 'kaching', at: T.each - 0.02, db: -24, rate: 1.3},
  {f: 'kaching', at: T.costs, db: -21, rate: 1.15},
  {f: 'whoosh', at: CUTS.F, db: -29, rate: 1.4},
  {f: 'kaching', at: T.more2, db: -16},
  {f: 'crack', at: T.hatch, db: -16},
  {f: 'pop', at: HATCH, db: -21, rate: 0.8},
  {f: 'peep', at: HATCH + 0.05, db: -17},
  {f: 'pop', at: T.into, db: -28, rate: 1.5},
  {f: 'pop', at: T.into + 0.08, db: -28, rate: 1.6},
  {f: 'pop', at: T.into + 0.16, db: -28, rate: 1.7},
  {f: 'pop', at: T.future, db: -22, rate: 1.0},
  {f: 'gulp', at: T.thanksgiving + 0.08, db: -18},
  {f: 'whoosh', at: 16.2, db: -33, rate: 0.85},
  {f: 'boing', at: T.dinners + 0.04, db: -26, rate: 1.3},
  {f: 'clink', at: T.dinners + 0.1, db: -24, rate: 1.2},
  {f: 'whoosh', at: 9.86, db: -33, rate: 1.8},
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
// a sprite anchored by its feet at world (x, y), scale s; sx/sy squash about the feet; flip mirrors
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; flip?: boolean; ax?: number; ay?: number}> = ({
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
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - w * 0.07,
      width: w,
      height: w * 0.14,
      borderRadius: '50%',
      background: `rgba(52, 80, 30, ${0.26 * o})`,
      filter: 'blur(3px)',
    }}
  />
);
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={WH}>
    {children}
  </svg>
);
// an egg with an optional living face
const LiveEgg: React.FC<{x: number; y: number; w: number; turkey?: boolean; open: number; look: [number, number]; squeeze?: boolean; crack?: number; rot?: number; sx?: number; sy?: number; sweat?: number}> = ({
  x,
  y,
  w,
  turkey = true,
  open,
  look,
  squeeze = false,
  crack = 0,
  rot = 0,
  sx = 1,
  sy = 1,
  sweat = 0,
}) => {
  const h = w * 1.3;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`}>
      <Egg x={0} y={0} w={w} turkey={turkey} crack={crack} />
      <Eye x={-w * 0.17} y={-h * 0.56} r={w * 0.14} open={open} look={look} squeeze={squeeze} side={-1} brow={0.5} browTilt={-0.6} ink={0.2} />
      <Eye x={w * 0.17} y={-h * 0.56} r={w * 0.14} open={open} look={look} squeeze={squeeze} side={1} brow={0.5} browTilt={-0.6} ink={0.2} />
      <SweatDrop x={w * 0.42} y={-h * 0.82} r={w * 0.1} s={sweat} rot={-15} />
    </g>
  );
};

// ---------- the guy ----------
const Guy: React.FC<{t: number; tr: number; shot: Shot}> = ({t, tr, shot}) => {
  let pose: SprName = 'hero';
  let sq = [1, 1];
  let dy = 0;
  let rot = 0;
  if (shot === 'A') {
    dy = -26 * bump(t, T.why, 0.24) - 14 * bump(t, T.eat, 0.2);
    rot = -4 * Math.sin(Math.PI * prog(t, T.eat - 0.1, 3.1)); // leans towards the egg
  } else if (shot === 'B') {
    if (t >= T.taste) pose = 'yum';
    sq = squashSwap(t, T.taste);
    dy = -18 * bump(t, T.safe, 0.22) - 22 * bump(t, 4.6, 0.25);
  } else {
    dy = -34 * bump(t, T.dinners, 0.26);
    rot = -3 * Math.sin(Math.PI * prog(t, T.dinners, 17.6));
  }
  const b = breathe(tr);
  return (
    <>
      <Shadow x={GUY.x} y={GUY.y} w={300} />
      <Spr n={pose} x={GUY.x} y={GUY.y + dy} s={GUY.s} sx={sq[0]} sy={sq[1] * b} rot={rot} />
    </>
  );
};

// ---------- the turkey ----------
const Turkey: React.FC<{t: number; tr: number; shot: Shot}> = ({t, tr, shot}) => {
  let pose: SprName = 'turkey';
  let sq = [1, 1];
  let rot = 0;
  let dx = 0;
  let fat = 1;
  let sweat = 0;
  if (shot === 'A') {
    if (t >= T.lay && t < 1.05) pose = 'strain';
    sq = t < 0.95 ? squashSwap(t, T.lay) : squashSwap(t, 1.05);
    if (pose === 'strain') dx = 2.5 * Math.sin(2 * Math.PI * 17 * t);
  } else if (shot === 'CD') {
    if (t >= T.lays2 && t < 9.95) pose = 'strain';
    else if (t >= T.eats && t < 11.62) pose = 'peck';
    sq = t < 9.6 ? squashSwap(t, T.lays2) : t < 10.2 ? squashSwap(t, 9.95) : t < 11.4 ? squashSwap(t, T.eats) : squashSwap(t, 11.62);
    if (pose === 'strain') {
      dx = 3 * Math.sin(2 * Math.PI * 15 * t) * prog(t, T.lays2, T.lays2 + 0.2);
      sweat = pop(t, 9.08, 0.2) * (1 - prog(t, 9.85, 9.95));
    }
    if (pose === 'peck') {
      const ph = BITES.reduce((a, b0) => a + bump(t, b0, 0.2), 0);
      rot = 7 * ph;
    }
    fat = 1 + 0.13 * easeOutCubic(prog(t, 10.45, 11.55));
  }
  const s = pose === 'turkey' ? TURKEY.s : TURKEY.sp;
  const b = breathe(tr, 1.3);
  const sp = SPR[pose] as unknown as {face: [number, number, number, number]; feet: [number, number]};
  // sweat drop above the bare blue face of the straining pose
  const fx = TURKEY.x + (sp.face[2] - sp.feet[0]) * s;
  const fy = TURKEY.y + (sp.face[1] - sp.feet[1]) * s;
  return (
    <>
      <Shadow x={TURKEY.x} y={TURKEY.y} w={340 * fat} />
      <Spr n={pose} x={TURKEY.x + dx} y={TURKEY.y} s={s} sx={sq[0] * fat} sy={sq[1] * b * fat} rot={rot} />
      {sweat > 0 ? (
        <Svg>
          <SweatDrop x={fx + 6} y={fy + 10} r={16} s={sweat} rot={20} />
        </Svg>
      ) : null}
    </>
  );
};

// ---------- the hen ----------
const Hen: React.FC<{t: number; tr: number; shot: Shot}> = ({t, tr, shot}) => {
  if (shot === 'B') {
    // pops in beside the guy, mirrored to face him, smug; drops a white egg on "eggs"
    const u = prog(t, T.chicken1 - 0.08, T.chicken1 + 0.2);
    if (u <= 0) return null;
    const x = lerp(800, 940, easeOutBack(u, 1.6));
    const sq = squashSwap(t, T.eggs2);
    const lay = t >= T.eggs2 - 0.08 && t < T.eggs2 + 0.1;
    const es = pop(t, T.eggs2, 0.22);
    return (
      <>
        <Shadow x={x} y={1912} w={190} />
        <Spr n={lay ? 'hen_lay' : 'hen'} x={x} y={1912} s={HEN.s} flip sx={sq[0]} sy={sq[1] * breathe(tr, 2)} />
        {es > 0 ? (
          <Svg>
            <Egg x={x - 105} y={1912} w={PW} turkey={false} sx={es} sy={es} />
          </Svg>
        ) : null}
      </>
    );
  }
  // CD: lays a week of eggs, then watches the turkey
  let lay = false;
  let sq = [1, 1];
  LAYS.forEach((e) => {
    if (t >= e - 0.1 && t < e + 0.06) lay = true;
    if (t >= e - 0.18 && t < e + 0.18) sq = squashSwap(t, e - 0.1);
  });
  const dy = -16 * bump(t, 7.86, 0.24);
  return (
    <>
      <Shadow x={HEN.x} y={HEN.y} w={200} />
      <Spr n={lay ? 'hen_lay' : 'hen'} x={HEN.x} y={HEN.y + dy} s={HEN.s} sx={sq[0]} sy={sq[1] * breathe(tr, 2)} />
    </>
  );
};

// the hen's pile of eggs (CD only)
const Pile: React.FC<{t: number}> = ({t}) => (
  <Svg>
    {PILE.map(([x, y], i) => {
      const e = LAYS[i];
      if (t < e) return null;
      const u = prog(t, e, e + 0.14);
      const sx0 = 365;
      const sy0 = 1800;
      const ex = lerp(sx0, x, easeOutCubic(u));
      const ey = lerp(sy0, y, u) - 70 * Math.sin(Math.PI * u);
      const land = t - (e + 0.14);
      const s = land > 0 ? spring(land, 4, 9) : 0;
      return <Egg key={i} x={ex} y={ey} w={PW} turkey={false} sx={1 + 0.12 * s} sy={1 - 0.14 * s} />;
    })}
  </Svg>
);

// ---------- the nest with the turkey eggs (+ the chick in G) ----------
const NestEggs: React.FC<{t: number; tr: number; shot: Shot}> = ({t, tr, shot}) => {
  // egg 2 is laid in A on "eggs"; egg 1 is there from frame 0
  const e2u = prog(t, T.eggs - 0.02, T.eggs + 0.1);
  const e2land = t - (T.eggs + 0.1);
  const e2s = e2land > 0 ? spring(e2land, 4, 8) : 0;
  const e2x = lerp(745, EGG2.x, easeOutCubic(e2u));
  const e2y = lerp(1740, EGG2.y, easeInCubic(e2u));
  const showE2 = shot !== 'A' || t >= T.eggs - 0.02;
  // faces: egg 1 notices the guy on "eat them"
  const open1 = shot === 'A' ? pop(t, T.eat, 0.25) : 1;
  let look1: [number, number] = [1, -0.1];
  let look2: [number, number] = [-0.6, 0];
  const open2 = shot === 'A' || shot === 'B' ? 0 : shot === 'CD' ? pop(t, 9.4, 0.25) : 1;
  let sweat1 = shot === 'A' ? pop(t, 2.7, 0.2) : 0;
  let sq1 = false;
  if (shot === 'CD') {
    look1 = t < 10.3 ? [-0.8, -0.3] : [1, -0.4];
    look2 = t < 10.3 ? [-0.9, -0.3] : [1, -0.4];
  }
  if (shot === 'E') {
    look1 = [0.3, -1];
    look2 = [-0.3, -1];
    sweat1 = pop(t, T.costs, 0.2);
    sq1 = t > T.costs + 0.1 && t < T.costs + 0.3;
  }
  // G: egg 1 wobbles, cracks and hatches
  let rot1 = 0;
  let crack = 0;
  let hatched = false;
  if (shot === 'G') {
    look1 = [0, 0];
    look2 = t < HATCH ? [-1, -0.2] : [-1, -0.6];
    const wob = prog(t, 13.95, 14.1) * (1 - prog(t, 14.95, 15.02));
    rot1 = 7 * Math.sin(2 * Math.PI * 6.5 * t) * wob;
    crack = 0.55 * easeOutCubic(prog(t, T.hatch, T.hatch + 0.12)) + 0.45 * easeOutCubic(prog(t, T.them2, T.them2 + 0.12));
    hatched = t >= HATCH;
    sq1 = t > T.hatch && t < HATCH;
  }
  // the chick
  const cu = prog(t, HATCH, HATCH + 0.25);
  const cs = hatched ? lerp(0.62, 1, easeOutBack(cu, 2.2)) : 0;
  const scared = t >= T.thanksgiving;
  const csq = squashSwap(t, T.thanksgiving);
  const tremble = scared ? 2.2 * Math.sin(2 * Math.PI * 16 * tr) : 0;
  const ch = SPR.chick;
  const chickFeetY = EGG1.y + (ch.feet[1] - ch.shell[3]) * CHICK_S;
  const capU = t - HATCH;
  return (
    <>
      <Svg>
        {!hatched ? (
          <LiveEgg x={EGG1.x} y={EGG1.y} w={EGG_W} open={open1} look={look1} squeeze={sq1} crack={crack} rot={rot1} sweat={sweat1} />
        ) : null}
        {showE2 ? (
          <LiveEgg x={e2x} y={e2y} w={EGG_W} open={open2} look={look2} sx={1 + 0.12 * e2s} sy={1 - 0.14 * e2s} sweat={shot === 'E' ? pop(t, T.more2 - 0.3, 0.2) : 0} />
        ) : null}
      </Svg>
      {hatched ? (
        <Spr
          n={scared ? 'chick_scared' : 'chick'}
          x={EGG1.x + tremble}
          y={chickFeetY}
          s={CHICK_S * cs}
          sx={csq[0]}
          sy={csq[1] * (1 + 0.06 * spring(t - HATCH - 0.25, 3, 6) * (t > HATCH + 0.25 ? 1 : 0))}
        />
      ) : null}
      <Spr n="nest" x={NEST.x} y={NEST.y} s={NEST.s} />
      {hatched && capU < 0.9 ? (
        <Svg>
          <ShellCap
            x={EGG1.x - 330 * capU}
            y={EGG1.y - EGG_W * 0.68 - 520 * capU + 900 * capU * capU}
            w={EGG_W}
            rot={-420 * capU}
            s={1 - 0.4 * prog(capU, 0.5, 0.9)}
          />
        </Svg>
      ) : null}
      {shot === 'G' && scared ? (
        <Svg>
          <SweatDrop x={EGG1.x + 42 + tremble} y={chickFeetY - 160} r={15} s={pop(t, 16.12, 0.2)} rot={20} />
        </Svg>
      ) : null}
    </>
  );
};

// thought bubble with the Thanksgiving dinner (G)
const Dream: React.FC<{t: number}> = ({t}) => {
  const s = [pop(t, T.into, 0.18), pop(t, T.into + 0.08, 0.18), pop(t, T.into + 0.16, 0.18), pop(t, T.future, 0.28)];
  if (s[0] <= 0) return null;
  const head = EGG1.y - 150;
  const r = SPR.roast;
  const rs = (CLOUD.w * 0.9) / r.w;
  const wob = 1 + 0.03 * Math.sin(2 * Math.PI * 1.6 * t);
  return (
    <>
      <Svg>
        <Bubble x0={EGG1.x + 10} y0={head} x={CLOUD.x} y={CLOUD.y} w={CLOUD.w} s={s} />
      </Svg>
      {s[3] > 0.001 ? (
        <div style={{position: 'absolute', left: CLOUD.x, top: CLOUD.y, transform: `scale(${s[3] * wob})`, transformOrigin: '0 0'}}>
          <Img src={F('roast')} style={{position: 'absolute', left: (-r.w * rs) / 2, top: (-r.h * rs) / 2 - 6, width: r.w * rs, height: r.h * rs}} />
        </div>
      ) : null}
    </>
  );
};

// instead of an egg, one sad feather drifts down from the straining turkey (CD)
const Feather: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, 9.84, 10.55);
  if (u <= 0) return null;
  const sw = 1 - u;
  const x = lerp(745, 640, u) + 34 * Math.sin(2 * Math.PI * 1.6 * (t - 9.84)) * sw;
  const y = lerp(1600, 1800, u);
  const rot = 35 * Math.sin(2 * Math.PI * 1.6 * (t - 9.84) + 0.8) * sw + 70 * u;
  const s = 1.5;
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
        <path d="M 0 -46 C 22 -30 22 22 0 42 C -22 22 -22 -30 0 -46 Z" fill="#C99A6B" stroke="#000" strokeWidth={5} />
        <path d="M 0 -40 L 0 54" stroke="#000" strokeWidth={4} strokeLinecap="round" />
        <path d="M -8 -12 L 0 -4 M 8 6 L 0 14" stroke="#8A5A3C" strokeWidth={4} strokeLinecap="round" />
      </g>
    </Svg>
  );
};

// the grain heap the turkey eats (CD)
const Heap: React.FC<{t: number}> = ({t}) => {
  const s0 = pop(t, 10.28, 0.22);
  if (s0 <= 0) return null;
  let left = 1;
  BITES.forEach((b, i) => {
    if (t >= b + 0.1) left = 1 - (i + 1) * 0.19;
  });
  if (left <= 0.06) return null;
  const sc = s0 * Math.sqrt(left);
  return <Spr n="grain" x={HEAP.x} y={HEAP.y} s={HEAP.s} sx={sc} sy={sc} />;
};

// ---------- the whole field ----------
export const Field: React.FC<{t: number; tr: number; shot: Shot; cam: Cam}> = ({t, tr, shot, cam}) => {
  const bgBlur = cam.k > 1.3 ? (cam.k - 1.3) * 3.2 : 0;
  const showTurkey = shot !== 'B';
  const showGuy = shot === 'A' || shot === 'B' || shot === 'G';
  const showHen = shot === 'B' || shot === 'CD';
  const labelS6 = shot === 'CD' ? pop(t, T.third, 0.25) * (1 - prog(t, 10.2, 10.35)) : 0;
  const labelS2 = shot === 'CD' ? pop(t, T.many, 0.25) * (1 - prog(t, 10.2, 10.35)) : 0;
  const qS = shot === 'A' ? pop(t, 2.55, 0.25) : 0;
  const chkS = shot === 'B' ? pop(t, T.safe, 0.25) * (1 - prog(t, 4.45, 4.6)) : 0;
  // price tag (E)
  const tagIn = shot === 'E' ? prog(t, 11.86, 12.12) : 0;
  const tagY = lerp(1330, 1560, easeOutBack(tagIn, 1.4));
  const tagRot = 9 * Math.sin(2 * Math.PI * 1.3 * (t - 11.86)) * Math.exp(-1.2 * Math.max(0, t - 11.86)) + 5 * bump(t, T.costs, 0.3);
  const tagText = t >= T.costs ? '$$' : '$';
  return (
    <>
      <World cam={cam} blur={bgBlur}>
        <Img src={F('bg')} style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}} />
      </World>
      <World cam={cam}>
        {showHen && shot === 'CD' ? (
          <>
            <Hen t={t} tr={tr} shot={shot} />
            <Pile t={t} />
          </>
        ) : null}
        {showTurkey ? <Turkey t={t} tr={tr} shot={shot} /> : null}
        {shot !== 'B' ? <NestEggs t={t} tr={tr} shot={shot} /> : null}
        {shot === 'CD' ? <Heap t={t} /> : null}
        {shot === 'CD' ? <Feather t={t} /> : null}
        {showGuy ? <Guy t={t} tr={tr} shot={shot} /> : null}
        {showHen && shot === 'B' ? <Hen t={t} tr={tr} shot={shot} /> : null}
        {shot === 'G' ? <Dream t={t} /> : null}
        <Svg>
          <Mark x={1250} y={1105} size={170} s={qS} text="?" rot={8 + 6 * Math.sin(2 * Math.PI * 1.2 * t)} />
          <Check x={1420} y={1190} w={120} s={chkS} />
          <Mark x={467} y={1600} size={180} s={labelS6} text="6" />
          <Mark x={655} y={1560} size={180} s={labelS2} text="2" fill="#FF6A5C" />
          {shot === 'E' ? <PriceTag x={652} y={tagY - 80} w={150} text={tagText} rot={tagRot} s={1 + 0.12 * bump(t, T.costs, 0.25)} /> : null}
        </Svg>
      </World>
    </>
  );
};

// ---------- F: the guy's shocked close-up ----------
const Shock: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => {
  const sp = SPR.shock;
  const s = 1.1;
  const amp = t >= T.more2 ? 12 * Math.exp(-10 * (t - T.more2)) : 0;
  const sh = shake(t, amp);
  const zoom = 1 + 0.04 * prog(t, CUTS.F, CUTS.G);
  return (
    <>
      <World cam={cam} blur={7}>
        <Img src={F('bg')} style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}} />
      </World>
      <div style={{position: 'absolute', left: 540 + sh.x, top: 1920 + 40 + sh.y, transform: `scale(${zoom * breathe(tr)})`, transformOrigin: '0 0'}}>
        <Img src={F('shock')} style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.h * s, width: sp.w * s, height: sp.h * s}} />
      </div>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
        <PriceTag x={850} y={250} w={300} text="$$$" rot={-8 + 10 * Math.sin(2 * Math.PI * 1.4 * t) * Math.exp(-2 * Math.max(0, t - T.more2))} s={pop(t, T.more2 - 0.04, 0.25)} />
      </svg>
    </>
  );
};

// day calendar in screen space (CD: the hen's week)
const Week: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, 5.75, 0.25) * (1 - prog(t, 8.25, 8.4));
  if (s <= 0.001) return null;
  let n = 0;
  let flip = 1;
  FLIPS.forEach((f) => {
    const u = prog(t, f - 0.07, f + 0.07);
    if (u >= 0.5) n += 1;
    if (u > 0 && u < 1) flip = Math.abs(Math.cos(Math.PI * u));
  });
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
      <DayCard x={540} y={330} w={250} text={DAYS[Math.min(n, 6)]} flip={Math.max(flip, 0.02)} s={s} />
    </svg>
  );
};

export const TurkeyEggsShort: React.FC = () => {
  useTurkeyFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const tr = t;
  const shot = shotAt(t);
  let cam = clampCam(camAt(t, KEYS[shot]));
  let amp = 0;
  if (shot === 'A') amp += t >= 0.93 ? 4 * Math.exp(-12 * (t - 0.93)) : 0;
  if (shot === 'CD') amp += t >= 11.62 ? 5 * Math.exp(-12 * (t - 11.62)) : 0;
  if (shot === 'G') amp += t >= HATCH ? 5 * Math.exp(-12 * (t - HATCH)) : 0;
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: '#90D0F4'}}>
      {shot === 'F' ? <Shock t={t} tr={tr} cam={cam} /> : <Field t={t} tr={tr} shot={shot} cam={cam} />}
      <Week t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('turkey-eggs/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB}))} dir="turkey-eggs/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
