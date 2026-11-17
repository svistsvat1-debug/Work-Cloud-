import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_B, DURATION, FPS, LAND, T, VO_AT} from './scene';
export {DURATION as MGT_DURATION, FPS as MGT_FPS} from './scene';
import {along, camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why can't a megalodon hide in the Mariana Trench?" - the last megalodon dives into the trench to hide forever (the
// guy follows in a tiny yellow sub and of course looks). Three miles down the other sharks stop at a line, wave and
// leave: not one shark below. X-ray: a shark's giant oily liver is its float and needs lots of rich food; down here only
// crumbs drift. So the deeper it goes the hungrier it gets; at the bottom, dinner is a two-inch amphipod.

const F = (n: string) => staticFile(`megalodon-trench/${n}.png`);
export const FONT = 'MGTInter';
export const useMGTFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
const YEL = '#FFE45C';
const rgb = (c: readonly number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

// ---------- helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
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

type Info = {w: number; h: number; feet: [number, number]; bottom: number; left: number; right: number; top: number; L?: number; snout?: [number, number]; anc?: [number, number]; head?: [number, number, number]};
const S = (n: string) => (SPR as unknown as Record<string, Info>)[n];

const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; anchor?: 'middle' | 'start'}> = ({x, y, size, s = 1, text, rot = 0, fill = '#fff', anchor = 'middle'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.2} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const FullSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 12000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);

// ======================================================================================================
// THE MEGALODON: 7 poses, all facing right, swapped on the snout / head line (anc), scaled to one world length LW
// ======================================================================================================
type MegPose = 'meg' | 'shh' | 'puzzled' | 'nervous' | 'chomp' | 'starve' | 'deadpan';
type MegState = {p: MegPose; x: number; y: number; rot: number; flip: 1 | -1; sq: [number, number]; lw: number};
const kOf = (p: MegPose, lw: number) => lw / (S(p).L as number);
const BODY_CX = -0.32; // body centre behind the head anchor, in units of the world length (flips turn around it)
// sprite px of pose p -> local world px (anchor = 0,0, facing right, before rotation)
const loc = (p: MegPose, lw: number, sx: number, sy: number): [number, number] => {
  const a = S(p).anc as [number, number];
  const k = kOf(p, lw);
  return [(sx - a[0]) * k, (sy - a[1]) * k];
};

const Meg: React.FC<{m: MegState; t: number; xray?: number; overlay?: React.ReactNode; filter?: string}> = ({m, t, xray = 0, overlay, filter}) => {
  const sp = S(m.p);
  const a = sp.anc as [number, number];
  const k = kOf(m.p, m.lw);
  // life: a slow tail-swish wobble (skew) and breathing, both tiny
  const sw = 1.4 * Math.sin(2 * Math.PI * 1.1 * t);
  const imgStyle: React.CSSProperties = {position: 'absolute', left: -a[0] * k, top: -a[1] * k, width: sp.w * k, height: sp.h * k};
  return (
    <div style={{position: 'absolute', left: m.x, top: m.y, transform: `rotate(${m.rot}deg) translateX(${BODY_CX * m.lw}px) scale(${m.flip * m.sq[0]}, ${m.sq[1]}) translateX(${-BODY_CX * m.lw}px) skewY(${sw * 0.25}deg)`, transformOrigin: '0 0', filter}}>
      <Img src={F(m.p)} style={imgStyle} />
      {xray > 0.001 ? (
        <div
          style={{
            ...imgStyle,
            background: '#0D3C8C',
            opacity: 0.86 * xray,
            WebkitMaskImage: `url(${F(m.p)})`,
            WebkitMaskSize: '100% 100%',
            maskImage: `url(${F(m.p)})`,
            maskSize: '100% 100%',
          }}
        />
      ) : null}
      {overlay ? <Svg r={2000}>{overlay}</Svg> : null}
    </div>
  );
};

// ======================================================================================================
// SHOT A - the top of the trench (top plate at PSA)
// ======================================================================================================
const PSA = 1.9;
const TOP = SPR.plate_top;
const AW = TOP.w * PSA;
const AH = TOP.h * PSA;
const LW_A = 760;

const megA = (t: number): MegState => {
  const bob = 7 * Math.sin(2 * Math.PI * 0.55 * t);
  if (t < T.dives) {
    const u = prog(t, 0, T.dives);
    const ant = prog(t, T.dives - 0.2, T.dives);
    return {p: 'meg', x: lerp(1085, 1130, u), y: 1050 + bob, rot: -2 + 1.5 * Math.sin(2 * Math.PI * 0.5 * t) - 8 * easeOutCubic(ant), flip: 1, sq: [1 + 0.04 * ant, 1 - 0.05 * ant], lw: LW_A};
  }
  const pts: [number, number][] = [[1130, 1050], [1110, 1290], [1000, 1800], [975, 2350]];
  if (t < 2.7) {
    const u = prog(t, T.dives, 2.7);
    const [x, y] = along(pts, easeInOutCubic(u) * 0.85 + u * 0.15);
    const r = lerp(-10, 72, easeOutCubic(prog(t, T.dives, T.dives + 0.55)));
    const st = spring(t - T.dives, 3, 6);
    return {p: 'meg', x, y, rot: r, flip: 1, sq: [1 + 0.05 * st, 1 - 0.04 * st], lw: LW_A};
  }
  const u = prog(t, 2.7, CUT_B);
  return {p: 'meg', x: 975 - 7 * u + 6 * Math.sin(2 * Math.PI * 1.3 * t), y: lerp(2350, 3350, u), rot: 72 + 2 * Math.sin(2 * Math.PI * 1.1 * t), flip: 1, sq: [1, 1], lw: LW_A};
};
const CAM_A: CamKey[] = [
  {t: 0, x: 973, y: 1210, k: 0.9},
  {t: T.dives, x: 973, y: 1225, k: 0.93},
  {t: 2.75, x: 973, y: 1880, k: 1.0},
  {t: CUT_B, x: 973, y: 2010, k: 1.06},
];

// bubbles: trail from the diving tail + the last burst from the dark ("forever")
const BubbleTrail: React.FC<{t: number; src: (tt: number) => [number, number]; t0: number; t1: number; n: number; seed: number; rise?: number}> = ({t, src, t0, t1, n, seed, rise = 260}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const tb = t0 + ((t1 - t0) * i) / n + 0.05 * rnd(seed + i);
      const age = t - tb;
      if (age < 0 || age > 1.6) return null;
      const [bx, by] = src(tb);
      const r = (7 + 9 * rnd(seed + i * 3)) * (age < 0.15 ? age / 0.15 : 1) * (age > 1.3 ? (1.6 - age) / 0.3 : 1);
      const x = bx + 26 * Math.sin(5 * age + i) + 30 * (rnd(seed + i * 7) - 0.5);
      const y = by - rise * age - 40 * age * age;
      return <circle key={i} cx={x} cy={y} r={Math.max(0, r)} fill="#BFE6FF" fillOpacity={0.55} stroke={INK} strokeWidth={4} />;
    })}
  </g>
);

const ShotA: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM_A);
  const m = megA(t);
  const tail = (tt: number): [number, number] => {
    const s = megA(tt);
    const a = (s.rot * Math.PI) / 180;
    return [s.x - Math.cos(a) * 420, s.y - Math.sin(a) * 420];
  };
  const dark = 0.25 + 0.35 * easeInCubic(prog(t, 2.6, CUT_B));
  return (
    <AbsoluteFill style={{background: rgb(TOP.trench)}}>
      <World cam={cam}>
        <Img src={staticFile('megalodon-trench/plate_top.jpg')} style={{position: 'absolute', left: 0, top: 0, width: AW, height: AH}} />
        {/* extend the plate below its bottom edge (rock | trench | rock) */}
        <div style={{position: 'absolute', left: 0, top: AH - 2, width: AW, height: 900, background: rgb(TOP.rock)}} />
        <div style={{position: 'absolute', left: TOP.gap[TOP.gap.length - 1][1] * PSA + 6, top: AH - 2, width: (TOP.gap[TOP.gap.length - 1][2] - TOP.gap[TOP.gap.length - 1][1]) * PSA - 12, height: 900, background: rgb(TOP.trench)}} />
        <Svg>
          <BubbleTrail t={t} src={tail} t0={T.dives + 0.1} t1={2.9} n={16} seed={3} />
        </Svg>
        <Meg m={m} t={t} />
        {/* the trench walls in front: the shark slips BEHIND them into the dark */}
        <Img src={staticFile('megalodon-trench/plate_top_fg.png')} style={{position: 'absolute', left: 0, top: 0, width: AW, height: AH}} />
        <Svg>
          <BubbleTrail t={t} src={() => [975, 2700]} t0={3.2} t1={3.9} n={7} seed={41} rise={330} />
          <Txt x={973} y={1580} size={70} s={popOut(t, T.mariana - 0.04, 3.9, 0.28)} text="MARIANA TRENCH" fill={YEL} rot={-3} />
        </Svg>
      </World>
      <Vignette a={dark} />
    </AbsoluteFill>
  );
};

const Vignette: React.FC<{a: number}> = ({a}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 72% 58% at 50% 50%, rgba(0,4,18,0) 45%, rgba(0,4,18,${a.toFixed(3)}) 100%)`}} />
);

// ======================================================================================================
// SHOT B - inside the trench: code canyon walls + the bottom plate (one world, the camera rides down)
// ======================================================================================================
const BOT = SPR.plate_bot;
const PSB = 1080 / BOT.w;
const Y3 = 2600; // the "3 MILES" line
const YB0 = 7800; // top of the bottom plate
const FLOOR = YB0 + BOT.floor * PSB;
const LW_B = 640;
const WALL_TOP = [BOT.walls[0][1] * PSB, BOT.walls[0][2] * PSB];
const depthAt = (y: number) => (y <= Y3 ? 1 + (2 * y) / Y3 : 3 + (3.79 * (y - Y3)) / (FLOOR - 120 - Y3));

const wallL = (y: number) => {
  const v = 165 + 55 * Math.sin(y / 610 + 0.7) + 22 * Math.sin(y / 173 + 2.1) + 9 * Math.sin(y / 57);
  return lerp(v, WALL_TOP[0], easeInOutCubic(prog(y, YB0 - 520, YB0)));
};
const wallR = (y: number) => {
  const v = 915 + 55 * Math.sin(y / 540 + 2.9) + 22 * Math.sin(y / 191 + 0.4) + 9 * Math.sin(y / 63 + 1);
  return lerp(v, WALL_TOP[1], easeInOutCubic(prog(y, YB0 - 520, YB0)));
};
const WALL_PTS = (() => {
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  for (let y = -1600; y <= YB0 + 4; y += 18) {
    L.push([wallL(y), y]);
    R.push([wallR(y), y]);
  }
  return {L, R};
})();
const CRACKS = Array.from({length: 46}, (_, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  const y = -1400 + i * 200 + 120 * rnd(i + 5);
  const e = side < 0 ? wallL(y) : wallR(y);
  const x0 = e + side * (28 + 70 * rnd(i + 9));
  const d = 50 + 60 * rnd(i + 13);
  return {side, pts: [[x0, y], [x0 + side * 22, y + d * 0.45], [x0 + side * 4, y + d], [x0 + side * 30, y + d * 1.4]] as [number, number][]};
});
const Walls: React.FC = () => {
  const l = WALL_PTS.L.map(([x, y]) => `${x.toFixed(1)},${y}`).join(' ');
  const r = WALL_PTS.R.map(([x, y]) => `${x.toFixed(1)},${y}`).join(' ');
  return (
    <g>
      <polygon points={`-900,-1600 ${l} -900,${YB0 + 4}`} fill={rgb(BOT.rock)} />
      <polygon points={`1980,-1600 ${r} 1980,${YB0 + 4}`} fill={rgb(BOT.rock)} />
      <polyline points={l} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <polyline points={r} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {CRACKS.map((c, i) => (
        <polyline key={i} points={c.pts.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
};

// marine snow ("crumbs"): drifting specks; bigger / outlined while the voice talks about crumbs
const SNOW = Array.from({length: 150}, (_, i) => ({x: 200 + 680 * rnd(i + 1), y: -1500 + (FLOOR + 1500) * rnd(i + 2), r: 2.2 + 2.5 * rnd(i + 3), ph: 6 * rnd(i + 4)}));
const Snow: React.FC<{t: number; hi: number}> = ({t, hi}) => (
  <g>
    {SNOW.map((s, i) => (
      <circle key={i} cx={s.x + 10 * Math.sin(0.7 * t + s.ph)} cy={s.y + 28 * t} r={s.r * (1 + 0.9 * hi)} fill="#F4F1E8" fillOpacity={0.5 + 0.45 * hi} stroke={INK} strokeOpacity={hi} strokeWidth={2.5} />
    ))}
  </g>
);
// the crumbs in front of the snout (the one it snaps at disappears)
const CRUMB_SNAP = T.crumbs + 0.16;
const Crumbs: React.FC<{t: number; snout: [number, number]}> = ({t, snout}) => {
  const s = popOut(t, T.and - 0.05, 18.7, 0.3);
  if (s <= 0.001) return null;
  return (
    <g>
      {Array.from({length: 7}, (_, i) => {
        if (i === 3 && t > CRUMB_SNAP) return null;
        const x = snout[0] + 30 + 40 * i + 18 * Math.sin(1.3 * t + i);
        const y = snout[1] - 260 + 150 * ((i * 37) % 5) / 5 + 55 * (t - T.and) + (i === 3 ? 0 : 0);
        return <circle key={i} cx={i === 3 ? snout[0] + 60 : x} cy={i === 3 ? lerp(snout[1] - 150, snout[1] - 10, prog(t, T.and, CRUMB_SNAP)) : y} r={6.5 * s} fill="#F4F1E8" stroke={INK} strokeWidth={3} />;
      })}
    </g>
  );
};

// ---------- the megalodon in shot B ----------
const SHARK_KEYS: {t: number; x: number; y: number; rot: number; e?: 'io' | 'out' | 'in' | 'lin' | 'quad'}[] = [
  {t: CUT_B, x: 700, y: 120, rot: 30},
  {t: 7.6, x: 760, y: 2380, rot: 22, e: 'lin'},
  {t: 9.3, x: 790, y: 3000, rot: 0, e: 'quad'},
  {t: T.probably, x: 770, y: 3000, rot: 0, e: 'io'},
  {t: 12.0, x: 760, y: 3010, rot: 0, e: 'io'},
  {t: 18.6, x: 760, y: 3010, rot: 0, e: 'io'},
  {t: 19.25, x: 770, y: 3500, rot: 32, e: 'in'},
  {t: 21.25, x: 700, y: FLOOR - 520, rot: 30, e: 'lin'},
  {t: LAND, x: 640, y: FLOOR - 1, rot: 0, e: 'out'},
];
function keyAtRaw(t: number) {
  const K = SHARK_KEYS;
  if (t <= K[0].t) return K[0];
  for (let i = 1; i < K.length; i++) {
    if (t < K[i].t) {
      const a = K[i - 1];
      const b = K[i];
      const raw = (t - a.t) / (b.t - a.t);
      const u = b.e === 'out' ? easeOutCubic(raw) : b.e === 'in' ? easeInCubic(raw) : b.e === 'lin' ? raw : b.e === 'quad' ? 1 - (1 - raw) * (1 - raw) : easeInOutCubic(raw);
      return {t, x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), rot: lerp(a.rot, b.rot, u)};
    }
  }
  return K[K.length - 1];
}
const keyAt = keyAtRaw;
// pose timeline (time of the swap, pose, facing)
const POSES: [number, MegPose, 1 | -1][] = [
  [CUT_B, 'meg', 1],
  [T.whod - 0.02, 'shh', 1],
  [T.but + 0.3, 'meg', 1],
  [T.no - 0.02, 'puzzled', 1],
  [T.not - 0.06, 'nervous', -1],
  [T.one + 0.12, 'nervous', 1],
  [11.08, 'nervous', -1],
  [T.probably - 0.1, 'meg', 1],
  [T.takes - 0.04, 'chomp', 1],
  [T.and + 0.06, 'puzzled', 1],
  [CRUMB_SNAP - 0.2, 'chomp', 1],
  [CRUMB_SNAP + 0.02, 'puzzled', 1],
  [T.hungrier - 0.04, 'starve', 1],
  [T.dinner + 0.02, 'chomp', 1],
  [T.two - 0.02, 'deadpan', 1],
];
const poseAt = (t: number) => {
  let cur = POSES[0];
  for (const p of POSES) if (t >= p[0]) cur = p;
  return cur;
};
const floatBob = (t: number) => -46 * Math.sin(Math.PI * prog(t, T.float - 0.04, T.float + 0.62));
const megB = (t: number): MegState => {
  const k = keyAt(t);
  const [ts, p, flip] = poseAt(t);
  const hover = t > 9.25 && t < 18.6 ? 6 * Math.sin(2 * Math.PI * 0.6 * t) : 0;
  const lunge = 46 * Math.sin(Math.PI * prog(t, CRUMB_SNAP - 0.22, CRUMB_SNAP + 0.3));
  const tremble = p === 'nervous' ? 2.2 * Math.sin(2 * Math.PI * 9 * t) : 0;
  let y = k.y + hover + floatBob(t);
  // landing: the anchor sits so that the lowest fin touches the floor
  if (t > 21.25) {
    const lift = ((S(p).bottom - (S(p).anc as [number, number])[1]) * kOf(p, LW_B)) * easeOutCubic(prog(t, 21.25, LAND));
    y = k.y - lift;
  }
  const land = t > LAND ? spring(t - LAND, 3, 6) : 0;
  const sq = squashSwap(t, ts);
  return {p, x: k.x + lunge + tremble, y, rot: k.rot, flip, sq: [sq[0] * (1 + 0.05 * land), sq[1] * (1 - 0.06 * land)], lw: LW_B};
};
const snoutOf = (m: MegState): [number, number] => {
  const sp = S(m.p);
  const [lx0, ly] = loc(m.p, m.lw, (sp.snout as [number, number])[0], (sp.snout as [number, number])[1]);
  const lx = m.flip === 1 ? lx0 : 2 * BODY_CX * m.lw - lx0;
  const a = (m.rot * Math.PI) / 180;
  return [m.x + lx * Math.cos(a) - ly * Math.sin(a), m.y + lx * Math.sin(a) + ly * Math.cos(a)];
};

// x-ray overlay drawn in the shark's local frame (pose 'meg' only, world px)
const XRay: React.FC<{t: number; xr: number}> = ({t, xr}) => {
  if (xr <= 0.001) return null;
  const p: MegPose = 'meg';
  const P = (sx: number, sy: number) => loc(p, LW_B, sx, sy);
  const spine = [P(150, 420), P(500, 420), P(850, 420), P(1150, 380), P(1330, 330)];
  const [lx, ly] = P(905, 478);
  const g = pop(t, T.giant - 0.04, 0.35);
  const glow = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.6 * t);
  const fl = popOut(t, T.float - 0.04, 99, 0.25);
  return (
    <g opacity={xr}>
      <polyline points={spine.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#9BE3FF" strokeWidth={9} strokeDasharray="16 9" strokeLinecap="round" />
      {[P(1240, 300), P(1270, 310), P(1300, 320)].map(([x, y], i) => (
        <path key={i} d={`M ${x} ${y} q 10 30 0 60`} stroke="#9BE3FF" strokeWidth={5} fill="none" strokeLinecap="round" />
      ))}
      {g > 0.001 ? (
        <g transform={`translate(${lx} ${ly}) scale(${g})`}>
          <ellipse rx={118 + 6 * glow} ry={42 + 3 * glow} fill="#FFD23F" fillOpacity={0.25} />
          <ellipse rx={104} ry={36} fill="#FFC62E" stroke={INK} strokeWidth={6} />
          <ellipse cx={-34} cy={-14} rx={34} ry={9} fill="#FFF2B0" />
          <circle cx={40} cy={6} r={9} fill="#FFE68A" stroke={INK} strokeWidth={3} />
          <circle cx={62} cy={-8} r={6} fill="#FFE68A" stroke={INK} strokeWidth={3} />
          {/* pool-float valve on "float" */}
          {fl > 0.001 ? (
            <g transform={`translate(-100 -6) scale(${fl})`}>
              <rect x={-22} y={-10} width={24} height={20} rx={5} fill="#FFF" stroke={INK} strokeWidth={4} />
              <rect x={-34} y={-6} width={14} height={12} rx={3} fill="#E8433A" stroke={INK} strokeWidth={4} />
            </g>
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

// ---------- the three ordinary sharks: dive along, stop at the 3-mile line, wave, zoom back up ----------
const OTHERS: {n: 'hammer' | 'blue' | 'tiger'; dx: number; dy: number; lw: number}[] = [
  {n: 'hammer', dx: -450, dy: -360, lw: 290},
  {n: 'blue', dx: -250, dy: -520, lw: 300},
  {n: 'tiger', dx: -70, dy: -270, lw: 300},
];
// when each one reaches its stop line (just above the 3-mile line)
const STOP_T = OTHERS.map((o, i) => {
  for (let t = CUT_B; t < 12; t += 1 / 120) if (keyAtRaw(t).y + o.dy >= Y3 - 70 - 55 * i) return t;
  return 12;
});
const Others: React.FC<{t: number}> = ({t}) => {
  if (t < CUT_B || t > 10.2) return null;
  return (
    <>
      {OTHERS.map((o, i) => {
        const sp = S(o.n);
        const k = o.lw / (sp.L as number);
        const stopT = STOP_T[i];
        const lead = keyAt(Math.min(t, stopT));
        const stopY = Y3 - 70 - 55 * i;
        let x = lead.x + o.dx + 14 * Math.sin(2 * Math.PI * 0.9 * t + i);
        let y = Math.min(lead.y + o.dy, stopY);
        let rot = t < stopT ? 26 : 26 * (1 - easeOutCubic(prog(t, stopT, stopT + 0.35)));
        const hit = t > stopT ? spring(t - stopT, 3.5, 6) : 0;
        // wave (they already wave their fin): a happy wiggle
        if (t > stopT + 0.3) rot += 9 * Math.sin(2 * Math.PI * 2.6 * (t - stopT));
        const goT = Math.max(stopT + 0.6, T.other - 0.1) + 0.08 * i;
        if (t > goT) {
          const u = prog(t, goT, goT + 0.75);
          rot = lerp(rot, -65, easeOutCubic(prog(t, goT, goT + 0.2)));
          y -= 2600 * easeInCubic(u);
          x -= 120 * easeInCubic(u);
          if (u >= 1) return null;
        }
        const flip = -1;
        return (
          <div key={o.n} style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${flip * (1 + 0.06 * hit)}, ${1 - 0.08 * hit})`, transformOrigin: '0 0'}}>
            <Img src={F(o.n)} style={{position: 'absolute', left: -sp.w * 0.5 * k, top: -sp.h * 0.5 * k, width: sp.w * k, height: sp.h * k}} />
          </div>
        );
      })}
    </>
  );
};

// ---------- the 3-mile line ----------
const MileLine: React.FC<{t: number}> = ({t}) => {
  const fl = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t);
  const a = wallL(Y3) - 4;
  const b = wallR(Y3) + 4;
  return (
    <g>
      <line x1={a} x2={b} y1={Y3} y2={Y3} stroke={INK} strokeWidth={14} strokeDasharray="34 22" />
      <line x1={a} x2={b} y1={Y3} y2={Y3} stroke={YEL} strokeWidth={7} strokeDasharray="34 22" strokeOpacity={0.75 + 0.25 * fl} />
      <Txt x={300} y={Y3 + 52} size={58} text="3 MILES" fill={YEL} anchor="start" />
    </g>
  );
};

// ---------- thought bubble: lots of rich food ----------
const Fish: React.FC<{x: number; y: number; s: number; c: string; rot?: number}> = ({x, y, s, c, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 38 0 L 66 -22 L 62 0 L 66 22 Z" fill={c} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <ellipse rx={46} ry={24} fill={c} stroke={INK} strokeWidth={6} />
    <circle cx={-24} cy={-5} r={6} fill={INK} />
    <path d="M -2 -14 q 8 14 0 28" fill="none" stroke={INK} strokeWidth={4} />
  </g>
);
const FoodBubble: React.FC<{t: number; at: [number, number]}> = ({t, at}) => {
  const s = popOut(t, T.takes - 0.02, T.and - 0.04, 0.3);
  if (s <= 0.001) return null;
  const [x, y] = at;
  const bub: Puff[] = [
    {x: 0, y: 0, r: 120}, {x: -95, y: 20, r: 85}, {x: 95, y: 18, r: 88}, {x: -50, y: -70, r: 80}, {x: 55, y: -72, r: 82}, {x: 0, y: 70, r: 80},
  ];
  const fish: [number, number, number, string, number][] = [
    [-60, 30, 0.95, '#FF9A3C', -8], [55, 38, 0.9, '#C9D3DC', 10], [0, -10, 1.05, '#FF7A59', 0], [-40, -60, 0.8, '#C9D3DC', -14], [60, -50, 0.85, '#FFB347', 12],
  ];
  const n = Math.round(lerp(1, 5, prog(t, T.takes, T.food + 0.2)));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={-150} cy={210} r={18} fill="#fff" stroke={INK} strokeWidth={6} />
      <circle cx={-105} cy={160} r={28} fill="#fff" stroke={INK} strokeWidth={6} />
      <PuffCluster puffs={bub} fill="#fff" ink={7} />
      {fish.slice(0, n).map(([fx, fy, fs, c, r], i) => (
        <Fish key={i} x={fx} y={fy + 4 * Math.sin(2 * Math.PI * 1.2 * t + i)} s={fs * pop(t, T.takes + 0.2 * i, 0.22)} c={c} rot={r} />
      ))}
    </g>
  );
};

// ---------- the guy's little yellow sub (screen space: it follows the camera) ----------
type GuyPose = 'binoc' | 'shrug' | 'laugh';
const GUY_POSES: [number, GuyPose][] = [
  [0, 'binoc'],
  [T.one - 0.02, 'shrug'],
  [T.probably + 0.2, 'binoc'],
  [T.long - 0.06, 'laugh'],
];
const guyPoseAt = (t: number) => {
  let cur = GUY_POSES[0];
  for (const g of GUY_POSES) if (t >= g[0]) cur = g;
  return cur;
};
const SUB_R = 124;
const subAt = (t: number) => {
  const x = lerp(1380, 852, easeOutCubic(prog(t, T.whod - 0.25, T.whod + 0.45)));
  const y = 420 + 9 * Math.sin(2 * Math.PI * 0.5 * t);
  return [x, y] as [number, number];
};
const Sub: React.FC<{t: number; target: [number, number]}> = ({t, target}) => {
  if (t < T.whod - 0.3) return null;
  const [x, y] = subAt(t);
  const [ts, gp] = guyPoseAt(t);
  const sq = squashSwap(t, ts);
  const sp = S(gp);
  const head = sp.head as [number, number, number];
  const gs = 47 / head[2];
  const WX = -34;
  const WY = 4;
  const WR = 80;
  const mir = gp === 'binoc' ? -1 : 1;
  const laugh = gp === 'laugh' ? 4 * Math.sin(2 * Math.PI * 7 * t) : 0;
  // lamp beam toward the shark
  const lx = x - SUB_R + 6;
  const ly = y + 34;
  const ang = Math.atan2(target[1] - ly, target[0] - lx);
  const len = Math.min(900, Math.hypot(target[0] - lx, target[1] - ly) + 200);
  const spread = 0.3;
  const beam = clamp((t - (T.whod - 0.1)) / 0.3);
  const prop = (t * 900) % 360;
  return (
    <FullSvg>
      <defs>
        <clipPath id="mgt-win">
          <circle cx={x + WX} cy={y + WY} r={WR - 4} />
        </clipPath>
        <linearGradient id="mgt-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF6C8" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFF6C8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g opacity={beam}>
        <polygon
          transform={`translate(${lx} ${ly}) rotate(${(ang * 180) / Math.PI})`}
          points={`0,-10 ${len},${-len * spread} ${len},${len * spread} 0,10`}
          fill="url(#mgt-beam)"
        />
      </g>
      <g transform={`translate(${x} ${y}) scale(${sq[0]}, ${sq[1]}) translate(${-x} ${-y})`}>
        {/* propeller (back = right side) */}
        <g transform={`translate(${x + SUB_R + 22} ${y + 10})`}>
          <rect x={-26} y={-7} width={30} height={14} fill="#8C8C8C" stroke={INK} strokeWidth={5} />
          <ellipse cx={8} cy={0} rx={9} ry={34 * Math.abs(Math.cos((prop * Math.PI) / 180)) + 6} fill="#BDBDBD" stroke={INK} strokeWidth={5} />
        </g>
        {/* hatch */}
        <rect x={x - 28} y={y - SUB_R - 26} width={56} height={34} rx={9} fill="#E2A91E" stroke={INK} strokeWidth={7} />
        {/* body */}
        <circle cx={x} cy={y} r={SUB_R} fill="#F6C431" stroke={INK} strokeWidth={8} />
        <path d={`M ${x - SUB_R * 0.55} ${y + SUB_R * 0.8} A ${SUB_R} ${SUB_R} 0 0 0 ${x + SUB_R * 0.95} ${y + SUB_R * 0.25}`} fill="none" stroke="#D99A12" strokeWidth={14} strokeLinecap="round" />
        {/* lamp */}
        <rect x={x - SUB_R - 14} y={y + 22} width={30} height={26} rx={6} fill="#9A9A9A" stroke={INK} strokeWidth={6} />
        <circle cx={x - SUB_R - 14} cy={y + 35} r={9} fill="#FFF6C8" stroke={INK} strokeWidth={4} />
        {/* window: water-blue glass, the guy inside, glare */}
        <circle cx={x + WX} cy={y + WY} r={WR} fill="#9FD8F2" stroke={INK} strokeWidth={8} />
        <g clipPath="url(#mgt-win)">
          <g transform={`translate(${x + WX} ${y + WY + 10 + laugh}) scale(${mir}, 1)`}>
            <image href={F(gp)} x={-head[0] * gs} y={-head[1] * gs} width={sp.w * gs} height={sp.h * gs} />
          </g>
          <path d={`M ${x + WX - 40} ${y + WY - 30} A ${WR - 14} ${WR - 14} 0 0 1 ${x + WX + 10} ${y + WY - 52}`} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        </g>
        <circle cx={x + WX} cy={y + WY} r={WR} fill="none" stroke="#B8B8B8" strokeWidth={7} />
        <circle cx={x + WX} cy={y + WY} r={WR + 5} fill="none" stroke={INK} strokeWidth={4} />
      </g>
    </FullSvg>
  );
};

// ---------- the depth gauge (screen space) ----------
const DepthHUD: React.FC<{t: number; d: number}> = ({t, d}) => {
  const s = pop(t, CUT_B + 0.05, 0.3);
  const s2 = pop(t, T.seven - 0.02, 0.3);
  const shown = t > LAND - 0.05 ? 6.8 : Math.min(6.8, Math.max(1, d));
  return (
    <FullSvg>
      <g transform={`translate(52 78) scale(${s})`}>
        <rect x={0} y={0} width={340} height={150} rx={26} fill="#0C1C44" fillOpacity={0.88} stroke={INK} strokeWidth={9} />
        <rect x={6} y={6} width={328} height={138} rx={21} fill="none" stroke="#9BE3FF" strokeWidth={4} />
        <text x={28} y={50} fontFamily={FONT} fontWeight={900} fontSize={36} fill="#9BE3FF">
          DEPTH
        </text>
        <text x={28} y={124} fontFamily={FONT} fontWeight={900} fontSize={76} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke">
          {shown.toFixed(1)} MI
        </text>
      </g>
      {s2 > 0.001 ? (
        <g transform={`translate(70 268) scale(${s2})`}>
          <text x={0} y={0} fontFamily={FONT} fontWeight={900} fontSize={38} fill={YEL} stroke={INK} strokeWidth={8} paintOrder="stroke">
            BOTTOM: 6.8 MI
          </text>
        </g>
      ) : null}
    </FullSvg>
  );
};

// ---------- the bottom: amphipod, ruler, sea cucumber, silt puff ----------
const AMPH_X = 818;
const Bottom: React.FC<{t: number}> = ({t}) => {
  const ap = t < T.long - 0.04 ? 'amph_wow' : 'amph_wave';
  const sp = S(ap);
  const s = (150 / 376) * pop(t, T.dinner - 0.04, 0.3);
  const sq = squashSwap(t, T.long - 0.04);
  const hop = -18 * bump(t, T.long - 0.04, 0.3);
  const cs = S('cucumber');
  const ck = 0.27;
  const chop = -34 * bump(t, LAND + 0.02, 0.32);
  return (
    <>
      {s > 0.001 ? (
        <div style={{position: 'absolute', left: AMPH_X, top: FLOOR + 6 + hop, transform: `scale(${sq[0]}, ${sq[1]})`, transformOrigin: '0 0'}}>
          <Img src={F(ap)} style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.feet[1] * s, width: sp.w * s, height: sp.h * s}} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 245, top: FLOOR + 10 + chop, transform: 'scale(-1, 1)', transformOrigin: '0 0'}}>
        <Img src={F('cucumber')} style={{position: 'absolute', left: -cs.feet[0] * ck, top: -cs.feet[1] * ck, width: cs.w * ck, height: cs.h * ck}} />
      </div>
    </>
  );
};
const Ruler: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.two - 0.03, 0.3);
  if (s <= 0.001) return null;
  const x = AMPH_X - 6;
  const y = FLOOR - 200;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(-4)`}>
      <rect x={-62} y={-15} width={124} height={30} rx={5} fill={YEL} stroke={INK} strokeWidth={5} />
      {Array.from({length: 9}, (_, i) => (
        <line key={i} x1={-50 + i * 12.5} x2={-50 + i * 12.5} y1={-15} y2={i % 4 === 0 ? 4 : -4} stroke={INK} strokeWidth={3} />
      ))}
      <Txt x={0} y={-62} size={64} text="2 IN" fill="#fff" />
    </g>
  );
};
const SiltPuff: React.FC<{t: number; x: number}> = ({t, x}) => {
  const u = prog(t, LAND - 0.04, LAND + 0.9);
  if (t < LAND - 0.04 || u >= 1) return null;
  const puffs: Puff[] = Array.from({length: 11}, (_, i) => {
    const d = (i - 5) / 5;
    const grow = Math.sin(Math.PI * Math.min(1, u * 1.15));
    const r = (62 + 34 * rnd(i + 3)) * grow * (1 - 0.35 * Math.abs(d));
    const up = (i % 2 ? 70 : 20) + 40 * rnd(i + 7);
    return {x: x + d * (140 + 300 * easeOutCubic(u)), y: FLOOR - 10 - up * easeOutCubic(u) * (1 - 0.5 * Math.abs(d)), r: Math.max(0, r)};
  });
  return <PuffCluster puffs={puffs} fill={rgb(BOT.silt)} ink={5} />;
};
// belly growl squiggles + a sweat drop while it starves
const Growl: React.FC<{t: number; m: MegState}> = ({t, m}) => {
  const s = popOut(t, T.hungrier - 0.02, 21.2, 0.2);
  if (s <= 0.001) return null;
  const a = (m.rot * Math.PI) / 180;
  const [lx, ly] = [-230, 150];
  const x = m.x + lx * Math.cos(a) - ly * Math.sin(a) + 5 * Math.sin(2 * Math.PI * 17 * t);
  const y = m.y + lx * Math.sin(a) + ly * Math.cos(a) + 4 * Math.sin(2 * Math.PI * 13 * t);
  return <Txt x={x} y={y} size={66} s={s} text="GRRR..." fill={YEL} rot={-6 + 3 * Math.sin(2 * Math.PI * 4 * t)} />;
};

// ---------- camera of shot B ----------
const CAM_HOLD: CamKey[] = [
  {t: 9.3, x: 540, y: 3150, k: 1.0},
  {t: T.probably - 0.05, x: 540, y: 3150, k: 1.0},
  {t: 12.35, x: 560, y: 3045, k: 1.36},
  {t: T.takes - 0.15, x: 560, y: 3045, k: 1.36},
  {t: 15.65, x: 600, y: 2900, k: 1.18},
  {t: T.and + 0.1, x: 600, y: 2900, k: 1.18},
  {t: 17.3, x: 600, y: 2960, k: 1.28},
  {t: 18.6, x: 600, y: 2960, k: 1.28},
];
const CAM_END: CamKey[] = [
  {t: 21.25, x: 560, y: FLOOR - 270, k: 0.98},
  {t: 22.05, x: 610, y: FLOOR - 250, k: 1.32, ease: 'out'},
  {t: DURATION, x: 616, y: FLOOR - 246, k: 1.35},
];
const camBAt = (t: number): Cam => {
  const m = keyAt(t);
  if (t < 9.3) {
    // rides with the shark (no easing seam at the cut), the offset shrinks as it slows below the line
    const off = lerp(280, 150, easeInOutCubic(prog(t, 7.6, 9.3)));
    return {x: 540, y: m.y + off, k: 1.0};
  }
  if (t < 18.6) return camAt(t, CAM_HOLD);
  if (t < 21.25) {
    const h = camAt(18.6, CAM_HOLD);
    const u = easeInOutCubic(prog(t, 18.6, 19.25));
    return {x: lerp(h.x, 560, u), y: lerp(h.y, m.y + 250, u), k: Math.exp(lerp(Math.log(h.k), Math.log(0.98), u))};
  }
  return camAt(t, CAM_END);
};

const ShotB: React.FC<{t: number}> = ({t}) => {
  const cam0 = camBAt(t);
  const sh = shake(t, 12 * Math.exp(-5 * Math.max(0, t - LAND)) * (t > LAND ? 1 : 0) + 2.5 * bump(t, 18.62, 0.5));
  const cam = {x: cam0.x + sh.x / cam0.k, y: cam0.y + sh.y / cam0.k, k: cam0.k};
  const m = megB(t);
  const sn = snoutOf(m);
  const xr = t < T.sharks2 - 0.1 ? 0 : t < T.takes - 0.1 ? easeOutCubic(prog(t, T.sharks2 - 0.1, T.sharks2 + 0.15)) : 1 - prog(t, T.takes - 0.1, T.takes + 0.12);
  const hi = popOut(t, T.and, 18.6, 0.3);
  const depth = depthAt(m.y + 60);
  const darkness = 0.3 + 0.28 * clamp((depth - 1) / 5.8);
  const screen = (wx: number, wy: number): [number, number] => [540 + (wx - cam.x) * cam.k, 960 + (wy - cam.y) * cam.k];
  const tgt = screen(m.x - 60, m.y + 30);
  const labelS = popOut(t, T.liver - 0.04, T.takes - 0.1, 0.28);
  const floatS = popOut(t, T.float - 0.02, T.takes - 0.1, 0.28);
  const [lbx, lby] = screen(m.x - 130, m.y + floatBob(t) - 130);
  return (
    <AbsoluteFill style={{background: rgb(BOT.water)}}>
      <World cam={cam}>
        <Svg>
          <rect x={-1500} y={-2000} width={4000} height={FLOOR + 4000} fill={rgb(BOT.water)} />
          <Snow t={t} hi={hi} />
        </Svg>
        <Img src={staticFile('megalodon-trench/plate_bot.jpg')} style={{position: 'absolute', left: 0, top: YB0, width: 1080, height: BOT.h * PSB}} />
        <div style={{position: 'absolute', left: -1500, top: YB0 + BOT.h * PSB - 2, width: 4000, height: 2000, background: rgb(BOT.silt)}} />
        <div style={{position: 'absolute', left: -1500, top: FLOOR, width: 1502, height: 2000, background: rgb(BOT.silt), borderTop: '7px solid #000'}} />
        <div style={{position: 'absolute', left: 1078, top: FLOOR, width: 1500, height: 2000, background: rgb(BOT.silt), borderTop: '7px solid #000'}} />
        <div style={{position: 'absolute', left: -1500, top: YB0, width: 1500 + 2, height: BOT.floor * PSB, background: rgb(BOT.rock)}} />
        <div style={{position: 'absolute', left: 1078, top: YB0, width: 1500, height: BOT.floor * PSB, background: rgb(BOT.rock)}} />
        <Svg>
          <Walls />
          <MileLine t={t} />
        </Svg>
        <Others t={t} />
        <Bottom t={t} />
        <Meg m={m} t={t} xray={m.p === 'meg' ? xr : 0} overlay={m.p === 'meg' ? <XRay t={t} xr={xr} /> : null} />
        <Svg>
          <Crumbs t={t} snout={sn} />
          <FoodBubble t={t} at={[m.x - 250, m.y - 300]} />
          <Growl t={t} m={m} />
          <SiltPuff t={t} x={m.x - 200} />
          <Ruler t={t} />
          <Txt x={sn[0] + 40} y={sn[1] - 120} size={60} s={popOut(t, T.whod + 0.02, T.but - 0.05, 0.25)} text="SHH..." fill="#fff" rot={-8} />
          <SweatDrop x={sn[0] - 150} y={sn[1] - 120 + 30 * prog(t, 10.7, 11.5)} r={20} s={popOut(t, T.not + 0.05, 11.5, 0.2)} rot={-15} />
          <SweatDrop x={sn[0] - 160} y={sn[1] - 115 + 30 * prog(t, 20.4, 21.3)} r={20} s={popOut(t, 20.35, 21.25, 0.2)} rot={-15} />
        </Svg>
      </World>
      <Vignette a={darkness} />
      <FullSvg>
        <Txt x={lbx} y={lby} size={62} s={labelS} text="LIVER" fill="#FFD23F" rot={-3} />
        <Txt x={lbx} y={lby + 62} size={48} s={floatS} text="= ITS FLOAT" fill="#fff" rot={-3} />
      </FullSvg>
      <Sub t={t} target={tgt} />
      <DepthHUD t={t} d={depth} />
    </AbsoluteFill>
  );
};

// ---------- sound ----------
export const CUES: Cue[] = [
  {f: 'whoosh', at: T.dives - 0.1, db: -20},
  {f: 'bubbles', at: T.dives + 0.15, db: -23},
  {f: 'bubbles', at: 3.25, db: -27},
  {f: 'pop', at: 3.92, db: -24, rate: 0.85},
  {f: 'hull_creak', at: 5.35, db: -27},
  {f: 'sonar', at: T.whod - 0.22, db: -21},
  {f: 'boing', at: 7.62, db: -22, rate: 1.15},
  {f: 'zoomaway', at: 9.0, db: -20},
  {f: 'crickets', at: T.not - 0.12, db: -17},
  {f: 'gulp', at: 11.05, db: -18},
  {f: 'xray', at: T.liver - 0.95, db: -17},
  {f: 'pop', at: T.giant - 0.03, db: -20, rate: 0.8},
  {f: 'boing', at: T.float - 0.02, db: -20},
  {f: 'pop', at: T.takes - 0.02, db: -22},
  {f: 'pop', at: T.and - 0.05, db: -18, rate: 1.2},
  {f: 'chomp', at: CRUMB_SNAP - 0.01, db: -11},
  {f: 'whoosh', at: 18.62, db: -24, rate: 0.85},
  {f: 'bubbles', at: 19.0, db: -28},
  {f: 'growl', at: T.hungrier - 0.05, db: -12},
  {f: 'mud_whoomp', at: LAND - 0.22, db: -13},
  {f: 'squeak', at: T.dinner - 0.03, db: -17},
  {f: 'pop', at: T.two - 0.03, db: -20, rate: 1.1},
  {f: 'squeak', at: T.long - 0.05, db: -15, rate: 1.12},
];

// ======================================================================================================
export const SceneAt: React.FC<{t: number}> = ({t}) => (t < CUT_B ? <ShotA t={t} /> : <ShotB t={t} />);

export const MegalodonTrenchShort: React.FC = () => {
  useMGTFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#0B1838'}}>
      <SceneAt t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('megalodon-trench/vo/take1_fit.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={0} layout="none">
        <Audio src={staticFile('megalodon-trench/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="megalodon-trench/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
