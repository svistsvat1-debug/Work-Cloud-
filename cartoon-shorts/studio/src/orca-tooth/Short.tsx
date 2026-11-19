import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as ORCA_DURATION, FPS as ORCA_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {SweatDrop} from '../shared/SweatDrop';
import {PuffCluster} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did nukes reveal this killer whale's real age?" - scientists count the growth rings in a killer whale's tooth,
// like a tree: 52. But the Cold War bomb tests sprinkled radiocarbon into the ocean, so every ring grown since carries it -
// and his FIRST ring does not: he was born before the fallout. His old-age rings were squeezed too thin to count (dentine
// grows inward, toward the shrinking pulp: the first ring is the OUTER one, the newest are packed at the centre).
// He was about 65, maybe more. Facts: Tierney et al. 2026, Frontiers in Marine Science, doi 10.3389/fmars.2026.1934180
// (KW2, South Uist, Jan 2015: 52 visible growth layers, pre-bomb values in the oldest layers, potentially 65+).

const F = (n: string) => staticFile(`orca-tooth/${n}.png`);
export const FONT = 'ORCAInter';
export const useOrcaFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
const GLOW = '#8CFF6E';
const GLOW_HI = '#D8FFC9';
const RED = '#E8302A';
const YEL = '#FFD23F';
const WOOD = '#B07B4A';
const WOOD_SH = '#8E5E35';
const TOOTH = '#F5E7CE';
const TOOTH_SH = '#E5CEAE';
const RINGLINE = '#C2A777';
const RINGLINE_DK = '#94723F';
const PULP = '#C98B7B';
const SKY = 'rgb(194,217,231)';
const SAND = 'rgb(233,218,183)';
const WATER = 'rgb(43,131,200)';

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

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo & Record<string, unknown>>)[n];

// a cut-out sprite anchored at (ax, ay) (native px), placed at (x, y), scale s per native px; children = SVG in native px
const Spr: React.FC<{
  n: string;
  x: number;
  y: number;
  s: number;
  sx?: number;
  sy?: number;
  rot?: number;
  ax?: number;
  ay?: number;
  clip?: string;
  opacity?: number;
  children?: React.ReactNode;
}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, clip, opacity = 1, children}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s, clipPath: clip}}>
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
const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string; stroke?: string; bg?: string}> = ({
  x,
  y,
  text,
  size,
  s,
  rot = 0,
  fill = '#000',
  stroke,
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
        WebkitTextStroke: stroke ? `${size * 0.16}px ${stroke}` : undefined,
        paintOrder: 'stroke fill',
        background: bg,
        border: bg ? `${size * 0.09}px solid #000` : undefined,
        borderRadius: bg ? size * 0.22 : undefined,
        padding: bg ? `${size * 0.16}px ${size * 0.3}px` : undefined,
      }}
    >
      {text}
    </div>
  );

// ======================================================================================================
// THE WORLD (world px = screen px at camera k = 1, frame-0 camera at (540, 960))
// ======================================================================================================
const GY = 1640; // the beach line where everyone stands
// far layer: the ElevenLabs shore plate, depth 1.3, 1.7 layer px per native px, mirror-padded sideways
const DEPTH_BG = 1.3;
const PSC = 1.7;
const PX0 = 540 - (SPR.shore.w / 2) * PSC;
const PY0 = -562;
const HORIZON = PY0 + 620 * PSC; // 492 (layer y)
const WATERLINE = PY0 + 770 * PSC; // where the old orca comes up
const CLOUD = {x: 800, y: HORIZON + 6, s: 0.55};
const toLayer = (cam: Cam, X: number, Y: number, depth: number): [number, number] => [540 + (cam.k / depth) * (X - cam.x), 960 + (cam.k / depth) * (Y - cam.y)];

// the scientist (goggles): every pose scaled so the head disc has the same radius
const HR = 140;
type Pose = 'hero' | 'scratch' | 'peer' | 'shock';
const poseS = (p: Pose) => HR / (S(p).hd as [number, number, number])[2];
const GUY_X = 250;

// the tooth slice on its easel, the whole tooth, the counter
const C = {x: 680, y: 1030};
const R = 200;
const R_OUT = 0.94 * R;
const R_P = 0.12 * R;
const TOOTH_POS = {x: 960, y: GY, s: 0.3};
const COUNTER = {x: 430, y: 770, w: 250, h: 150};
const BOMB_S = 0.42;
const GEIGER = {x: 520, y: 1330, s: 0.27};
const PROBE_ANG = (152 * Math.PI) / 180;

// ---------- story times ----------
const CUT_B = 8.45; // camera leaves for the horizon
const CUT_C = T.into; // underwater: the fallout sinks
const CUT_D = T.so; // the slice close-up: every ring since has it
const CUT_E = T.so2; // underwater: the calf, born before the fallout
const CUT_F = T.the4; // the tooth lies; push into the packed centre
const CUT_G = T.he2; // wide: about sixty-five, maybe more
const COUNT0 = T.rings;
const COUNT1 = T.fiftytwo;
const BOMB_LAND = T.bombs + 0.02;
const BOMB_GO = 8.3;
const BOMB_HIT = T.bomb; // the cloud rises
const SHAKE0 = T.sprinkled;
const SWEEP0 = T.every - 0.05;
const SWEEP1 = T.it;
const COMPRESS0 = T.oldage;
const COMPRESS1 = T.oldage + 0.8;
const LENS0 = T.thin - 0.1;
const FLIP = T.sixtyfive;
const PLUS = T.more;
const BULL_UP = T.sixtyfive + 0.02;

// ---------- the shore camera ----------
const CAM: CamKey[] = [
  {t: 0, x: 540, y: 960, k: 1.0},
  {t: T.but, x: 545, y: 955, k: 1.04},
  {t: 6.0, x: 470, y: 860, k: 1.18, ease: 'out'},
  {t: T.how - 0.05, x: 470, y: 860, k: 1.18},
  {t: T.how + 0.65, x: 480, y: 900, k: 1.12},
  {t: CUT_B, x: 480, y: 900, k: 1.12},
  {t: CUT_B + 1.0, x: 800, y: 262, k: 1.9},
  {t: CUT_C, x: 806, y: 252, k: 1.98},
  {t: CUT_D, x: 806, y: 252, k: 1.98},
  {t: CUT_D, x: 680, y: 1060, k: 2.0, ease: 'cut'},
  {t: CUT_E, x: 680, y: 1052, k: 2.08},
  {t: CUT_E, x: 800, y: 1235, k: 1.45, ease: 'cut'},
  {t: CUT_F, x: 800, y: 1235, k: 1.45},
  {t: T.his2, x: 796, y: 1232, k: 1.49},
  {t: T.his2 + 0.55, x: 680, y: 1030, k: 2.7, ease: 'out'},
  {t: CUT_G, x: 682, y: 1032, k: 2.78},
  {t: CUT_G, x: 540, y: 960, k: 1.0, ease: 'cut'},
  {t: DURATION, x: 548, y: 952, k: 1.04},
];
const camAtT = (t: number): Cam => {
  const c = camAt(t, CAM);
  const a =
    5 * Math.exp(-(t - BOMB_LAND) * 9) * (t >= BOMB_LAND && t < CUT_B ? 1 : 0) +
    7 * Math.exp(-(t - BOMB_HIT) * 4) * (t >= BOMB_HIT && t < CUT_C ? 1 : 0) +
    4 * Math.exp(-(t - BULL_UP) * 7) * (t >= BULL_UP ? 1 : 0);
  const sh = shake(t, a);
  return {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
};

// ======================================================================================================
// THE RINGS: dentine grows inward, so band 0 (outer) is the first year and the newest bands sit at the pulp
// ======================================================================================================
const radii = (n: number, weights: (i: number) => number): number[] => {
  const w = Array.from({length: n}, (_, i) => weights(i));
  const sum = w.reduce((a, b) => a + b, 0);
  const out = [R_OUT];
  let r = R_OUT;
  for (let i = 0; i < n; i++) {
    r -= ((R_OUT - R_P) * w[i]) / sum;
    out.push(r);
  }
  return out;
};
const N0 = 52;
const N1 = 66;
const R_NORMAL = radii(N0, (i) => 1.12 - 0.26 * (i / N0));
const R_PACKED = radii(N1, (i) => (i < 38 ? 1.0 : Math.max(0.09, 1 - (i - 38) * 0.085)));
// boundary radius i for a compression u (0 = 52 even rings, 1 = 66 rings, the old ones packed at the centre)
const ringR = (i: number, u: number) => {
  const a = i <= N0 ? R_NORMAL[i] : R_P;
  return lerp(a, R_PACKED[Math.min(i, N1)], u);
};

const RingDisc: React.FC<{t: number; lens?: boolean}> = ({t, lens}) => {
  const u = easeInOutCubic(prog(t, COMPRESS0, COMPRESS1));
  const n = Math.round(lerp(N0, N1, u));
  // counting highlight (hook): the band being counted, outer -> inner
  const cnt = t >= COUNT0 - 0.05 && t < COUNT1 + 0.6 ? Math.floor(lerp(1, 52, easeInOutCubic(prog(t, COUNT0, COUNT1)))) : -1;
  // the fallout glow sweep: band 1 .. end lights up (band 0, the first year, never does)
  const front = t < SWEEP0 ? 0 : lerp(1, 52, easeInOutCubic(prog(t, SWEEP0, SWEEP1)));
  const glowA = t < SWEEP0 ? 0 : 0.62;
  const bands: React.ReactNode[] = [];
  for (let i = 1; i < n; i++) {
    const lit = i < 52 ? clamp(front - i + 1) : clamp((front - 51) * 2) * clamp(u * 3);
    if (lit <= 0) continue;
    const r0 = ringR(i, u);
    const r1 = ringR(i + 1, u);
    bands.push(<circle key={`g${i}`} cx={C.x} cy={C.y} r={(r0 + r1) / 2} fill="none" stroke={GLOW} strokeOpacity={glowA * lit} strokeWidth={Math.max(0.6, r0 - r1 + 0.3)} />);
  }
  const lines: React.ReactNode[] = [];
  for (let i = 1; i <= n; i++) {
    const r = ringR(i, u);
    const op = i <= N0 ? 1 : clamp((n - i + 1) * 0.6);
    const strong = i % 4 === 0;
    lines.push(<circle key={`l${i}`} cx={C.x} cy={C.y} r={r} fill="none" stroke={strong ? RINGLINE_DK : RINGLINE} strokeWidth={lens ? (strong ? 0.5 : 0.28) : strong ? 2.1 : 0.9} opacity={op} />);
  }
  // sparkles on the lit bands
  const sparks: React.ReactNode[] = [];
  if (front > 1) {
    for (let k = 0; k < 16; k++) {
      const band = 2 + Math.floor(rnd(k + 3) * 46);
      if (band > front) continue;
      const a = rnd(k + 40) * Math.PI * 2;
      const rr = (ringR(band, u) + ringR(band + 1, u)) / 2;
      const ph = (t * 1.3 + rnd(k + 80)) % 1;
      const sz = 7 * Math.sin(Math.PI * ph);
      if (sz < 0.5) continue;
      const x = C.x + rr * Math.cos(a);
      const y = C.y + rr * Math.sin(a);
      sparks.push(
        <path
          key={`s${k}`}
          d={`M ${x} ${y - sz} Q ${x} ${y} ${x + sz} ${y} Q ${x} ${y} ${x} ${y + sz} Q ${x} ${y} ${x - sz} ${y} Q ${x} ${y} ${x} ${y - sz} Z`}
          fill="#fff"
          stroke={INK}
          strokeWidth={1.2}
        />,
      );
    }
  }
  // the first ring stays plain: a white pulse outline when the voice says "His first ring doesn't"
  const firstPulse = t > T.first - 0.05 && t < CUT_E ? 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.2 * (t - T.first)) : 0;
  return (
    <g>
      <circle cx={C.x} cy={C.y} r={R} fill={TOOTH_SH} stroke={INK} strokeWidth={7} />
      <circle cx={C.x} cy={C.y} r={R_OUT} fill={TOOTH} />
      {bands}
      {cnt > 0 ? (
        <circle cx={C.x} cy={C.y} r={(ringR(cnt - 1, 0) + ringR(cnt, 0)) / 2} fill="none" stroke={YEL} strokeWidth={Math.max(3, ringR(cnt - 1, 0) - ringR(cnt, 0) + 1.5)} />
      ) : null}
      {lines}
      <circle cx={C.x} cy={C.y} r={R_OUT} fill="none" stroke={RINGLINE} strokeWidth={2} />
      {firstPulse > 0 ? (
        <circle cx={C.x} cy={C.y} r={(ringR(0, u) + ringR(1, u)) / 2} fill="none" stroke="#fff" strokeOpacity={0.75 * firstPulse} strokeWidth={ringR(0, u) - ringR(1, u) + 1} />
      ) : null}
      <circle cx={C.x} cy={C.y} r={ringR(n, u)} fill={PULP} stroke={INK} strokeWidth={lens ? 1.5 : 3} />
      {sparks}
    </g>
  );
};

// the wooden easel: back leg behind the slice, shelf + front legs in front
const EaselBack: React.FC = () => (
  <g>
    <path d={`M ${C.x - 9} ${C.y - R - 10} L ${C.x + 9} ${C.y - R - 10} L ${C.x + 16} ${GY + 14} L ${C.x - 2} ${GY + 14} Z`} fill={WOOD_SH} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </g>
);
const EaselFront: React.FC = () => {
  const leg = (x0: number, x1: number) => (
    <path d={`M ${x0 - 10} ${C.y - 120} L ${x0 + 10} ${C.y - 120} L ${x1 + 10} ${GY + 8} L ${x1 - 10} ${GY + 8} Z`} fill={WOOD} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  );
  return (
    <g>
      {leg(C.x - 150, C.x - 205)}
      {leg(C.x + 150, C.x + 205)}
      <rect x={C.x - 170} y={C.y + R - 26} width={340} height={30} rx={6} fill={WOOD} stroke={INK} strokeWidth={5} />
      <rect x={C.x - 164} y={C.y + R - 4} width={328} height={6} fill={WOOD_SH} />
    </g>
  );
};

// ======================================================================================================
// THE FAR LAYER: shore plate, the test cloud on the horizon, the fallout, the old orca
// ======================================================================================================
const cloudState = (t: number) => {
  const up = easeOutBack(prog(t, BOMB_HIT, BOMB_HIT + 0.55), 1.4);
  let rot = 0;
  if (t > SHAKE0 - 0.12) {
    const tilt = 24 * easeOutCubic(prog(t, SHAKE0 - 0.12, SHAKE0 + 0.1)) * (1 - easeInOutCubic(prog(t, 10.75, 11.2)));
    const jig = t < 10.75 ? 9 * Math.sin(2 * Math.PI * 4.1 * (t - SHAKE0)) * clamp((10.75 - t) * 3) : 0;
    rot = tilt + jig;
  }
  return {sy: t < BOMB_HIT ? 0 : 0.15 + 0.85 * up, sx: t < BOMB_HIT ? 0 : 0.7 + 0.3 * easeOutCubic(prog(t, BOMB_HIT, BOMB_HIT + 0.45)), rot};
};
const capPos = (t: number): [number, number] => {
  const st = cloudState(t);
  const h = (712 - 210) * CLOUD.s * st.sy;
  const a = (st.rot * Math.PI) / 180;
  return [CLOUD.x + h * Math.sin(a), CLOUD.y - h * Math.cos(a)];
};
// fallout dots born at the cap, flung sideways and down, landing on the sea
type Dot = {x: number; y: number; r: number; a: number};
const falloutDots = (t: number): Dot[] => {
  const out: Dot[] = [];
  for (let i = 0; i < 90; i++) {
    const tb = SHAKE0 + 0.05 + rnd(i) * 1.3;
    const age = t - tb;
    if (age < 0 || t >= CUT_C) continue;
    const [cx, cy] = capPos(tb);
    const vx = (rnd(i + 200) - 0.42) * 1150;
    const vy = -260 + rnd(i + 300) * 220;
    const g = 980;
    let x = cx + vx * (1 - Math.exp(-age * 1.6)) / 1.6;
    let y = cy + vy * age + 0.5 * g * age * age;
    const sea = HORIZON + 40 + rnd(i + 400) * 420;
    let a = 1;
    if (y > sea) {
      const land = (y - sea) / 160;
      a = Math.max(0, 1 - land);
      y = sea;
      x += 0;
    }
    if (a <= 0) continue;
    out.push({x, y, r: 6 + rnd(i + 500) * 4, a});
  }
  return out;
};
const DotG: React.FC<{d: Dot; k?: number; t: number; i: number}> = ({d, k = 1, t, i}) => {
  const tw = 1 + 0.18 * Math.sin(2 * Math.PI * 3 * t + i);
  const r = d.r * k * tw * d.a;
  return (
    <g>
      <circle cx={d.x} cy={d.y} r={r * 2.3} fill={GLOW} opacity={0.28 * d.a} />
      <circle cx={d.x} cy={d.y} r={r} fill={GLOW} stroke={INK} strokeWidth={r * 0.28} />
      <circle cx={d.x - r * 0.3} cy={d.y - r * 0.3} r={r * 0.3} fill={GLOW_HI} />
    </g>
  );
};

const BULL = {x: 880, y: WATERLINE - 120, s: 0.85, rot: -16};
const bullState = (t: number) => {
  const u = easeOutBack(prog(t, BULL_UP, BULL_UP + 0.5), 1.5);
  const bob = t > BULL_UP + 0.5 ? 7 * Math.sin(2 * Math.PI * 0.9 * (t - BULL_UP - 0.5)) : 0;
  return {y: lerp(BULL.y + 330, BULL.y, u) + bob, rot: BULL.rot + 4 * Math.sin(2 * Math.PI * 0.7 * Math.max(0, t - BULL_UP))};
};

const FarLayer: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const cs = cloudState(t);
  const showCloud = !cover && t >= BOMB_HIT && t < CUT_C;
  const showBull = !cover && t >= BULL_UP;
  const bs = cover ? {y: BULL.y, rot: BULL.rot} : bullState(t);
  const dots = showCloud ? falloutDots(t) : [];
  // splash ring when the old orca comes up
  const sp = cover ? 0 : prog(t, BULL_UP + 0.05, BULL_UP + 0.9);
  const splash = sp > 0 && sp < 1;
  const flash = t >= BOMB_HIT && t < BOMB_HIT + 0.5 ? 1 - prog(t, BOMB_HIT, BOMB_HIT + 0.5) : 0;
  return (
    <World cam={cam} depth={DEPTH_BG}>
      <div style={{position: 'absolute', left: PX0 - 600, top: PY0 - 2400, width: SPR.shore.w * PSC + 1200, height: 2420, background: SKY}} />
      <div style={{position: 'absolute', left: PX0 - 600, top: PY0 + SPR.shore.h * PSC - 20, width: SPR.shore.w * PSC + 1200, height: 1800, background: SAND}} />
      <Img src={F('shore')} style={{position: 'absolute', left: PX0, top: PY0, width: SPR.shore.w * PSC, height: SPR.shore.h * PSC}} />
      {flash > 0 ? (
        <Svg>
          <circle cx={CLOUD.x} cy={HORIZON} r={60 + 260 * (1 - flash)} fill="#FFF6C8" opacity={0.85 * flash} />
        </Svg>
      ) : null}
      {showCloud ? (
        <Spr n="cloud" x={CLOUD.x} y={CLOUD.y} s={CLOUD.s} sx={cs.sx} sy={cs.sy} rot={cs.rot}>
          {/* a small worried face on the cap when it starts shaking like a salt shaker */}
          {t > SHAKE0 - 0.1 ? (
            <g>
              <Eye x={225} y={235} r={30} open={pop(t, SHAKE0 - 0.1, 0.2)} squeeze side={-1} />
              <Eye x={330} y={235} r={30} open={pop(t, SHAKE0 - 0.1, 0.2)} squeeze side={1} />
              <path d="M 255 300 Q 278 322 302 300" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            </g>
          ) : null}
        </Spr>
      ) : null}
      {dots.length ? (
        <Svg>
          {dots.map((d, i) => (
            <DotG key={i} d={d} t={t} i={i} />
          ))}
        </Svg>
      ) : null}
      {showBull ? (
        <div style={{position: 'absolute', left: BULL.x - 700, top: BULL.y - 1200, width: 1400, height: WATERLINE - (BULL.y - 1200), overflow: 'hidden'}}>
          <Spr n="bull" x={700} y={bs.y - (BULL.y - 1200)} s={BULL.s} rot={bs.rot} ax={430} ay={300}>
            <BullFace t={t} cover={cover} />
          </Spr>
        </div>
      ) : null}
      {showBull ? (
        <Svg>
          <rect x={BULL.x - 330} y={WATERLINE - 3} width={660} height={6} fill="#7FA8CA" opacity={0.0} />
          {splash ? (
            <PuffCluster
              fill="#FFFFFF"
              ink={4}
              puffs={Array.from({length: 9}, (_, i) => {
                const a = -Math.PI + (i / 8) * Math.PI;
                const d = 60 + 230 * easeOutCubic(sp);
                return {x: BULL.x - 40 + Math.cos(a) * d * 1.2, y: WATERLINE - 10 + Math.sin(a) * d * 0.45, r: 26 * Math.sin(Math.PI * sp) * (0.7 + 0.5 * rnd(i))};
              })}
            />
          ) : null}
        </Svg>
      ) : null}
    </World>
  );
};

// the old bull's face: round glasses + a grey bushy brow (code), a wink at the very end
const BullFace: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const g = cover ? 1 : pop(t, BULL_UP + 0.3, 0.3);
  const wink = !cover && t > PLUS + 0.12 && t < PLUS + 0.42;
  const ex = 670;
  const ey = 322;
  return (
    <g>
      {wink ? (
        <g>
          <circle cx={ex} cy={ey} r={22} fill="#2B282C" />
          <path d={`M ${ex - 16} ${ey + 2} Q ${ex} ${ey + 14} ${ex + 16} ${ey + 2}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
      {g > 0.01 ? (
        <g transform={`translate(${ex} ${ey}) scale(${g}) translate(${-ex} ${-ey})`}>
          <path d={`M ${ex - 52} ${ey - 50} Q ${ex - 10} ${ey - 78} ${ex + 34} ${ey - 52}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
          <path d={`M ${ex - 52} ${ey - 50} Q ${ex - 10} ${ey - 78} ${ex + 34} ${ey - 52}`} fill="none" stroke="#C9CDD3" strokeWidth={12} strokeLinecap="round" />
          <line x1={ex - 40} y1={ey - 6} x2={ex - 150} y2={ey - 18} stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <line x1={ex + 40} y1={ey - 4} x2={ex + 70} y2={ey - 8} stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={ex} cy={ey} r={40} fill="#C4ECFA" fillOpacity={0.35} stroke={INK} strokeWidth={9} />
          <path d={`M ${ex - 18} ${ey - 22} Q ${ex - 6} ${ey - 30} ${ex + 8} ${ey - 26}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

// ======================================================================================================
// THE GUY
// ======================================================================================================
const guyPose = (t: number): {pose: Pose; swap: number} => {
  if (t >= CUT_G) return t >= FLIP ? {pose: 'shock', swap: FLIP} : {pose: 'hero', swap: -10};
  if (t >= T.how) return {pose: 'scratch', swap: T.how};
  return {pose: 'hero', swap: -10};
};
const Guy: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const {pose, swap} = cover ? {pose: 'hero' as Pose, swap: -10} : guyPose(t);
  const s = poseS(pose);
  const [sx, sy] = squashSwap(t, swap);
  const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const b = bump(t, T.fiftytwo, 0.35, 0.05) * bump(t, T.count, 0.3, 0.03);
  const trem = pose === 'shock' ? 1.6 * Math.sin(2 * Math.PI * 9 * t) : 0;
  const lean = pose === 'hero' ? -1.2 + 1.2 * Math.sin(2 * Math.PI * 0.45 * t) : 0;
  const sp = S(pose);
  return (
    <>
      <Svg>
        <ellipse cx={GUY_X + 10} cy={GY + 4} rx={150} ry={20} fill="rgba(72,54,42,0.22)" />
      </Svg>
      <Spr n={pose} x={GUY_X + trem} y={GY} s={s} sx={sx * (2 - b)} sy={sy * br * b} rot={lean} ax={sp.feet[0]} ay={sp.feet[1]} />
    </>
  );
};

// ======================================================================================================
// THE COUNTER + THE BOMB THAT SAYS "NO"
// ======================================================================================================
const counterValue = (t: number): string => {
  if (t >= CUT_G) {
    if (t < FLIP) return '52';
    if (t < FLIP + 0.25) return String(Math.round(lerp(52, 65, prog(t, FLIP, FLIP + 0.25))));
    return t >= PLUS ? '65+' : '65';
  }
  if (t < COUNT0) return '0';
  return String(Math.floor(lerp(1, 52, easeInOutCubic(prog(t, COUNT0, COUNT1)))));
};
const Counter: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const vis = cover ? 0 : t >= CUT_G ? 1 : t < CUT_B + 0.6 ? pop(t, 0.95, 0.3) : 0;
  if (vis <= 0.001) return null;
  const wrong = !cover && t >= T.wrong && t < CUT_G;
  const landSq = !cover && t >= BOMB_LAND && t < BOMB_LAND + 0.6 ? 0.12 * spring(t - BOMB_LAND, 3, 6) : 0;
  const jig = wrong ? 5 * Math.sin(2 * Math.PI * 7 * (t - T.wrong)) * Math.exp(-(t - T.wrong) * 2.5) : 0;
  const b = bump(t, COUNT1, 0.35, 0.16) * bump(t, FLIP, 0.35, 0.18) * bump(t, PLUS, 0.3, 0.12);
  const val = cover ? '65+' : counterValue(t);
  return (
    <div
      style={{
        position: 'absolute',
        left: COUNTER.x,
        top: COUNTER.y + COUNTER.h / 2,
        transform: `rotate(${jig}deg) scale(${vis * b * (1 + landSq * 0.6)}, ${vis * b * (1 - landSq)})`,
        transformOrigin: '0 0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -COUNTER.w / 2,
          top: -COUNTER.h,
          width: COUNTER.w,
          height: COUNTER.h,
          background: '#FEFDFD',
          border: '7px solid #000',
          borderRadius: 26,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          color: wrong ? RED : '#000',
        }}
      >
        <div style={{fontSize: 74, lineHeight: 0.95}}>{val}</div>
        <div style={{fontSize: 24, lineHeight: 1, letterSpacing: 2}}>YEARS</div>
      </div>
      {wrong && t < CUT_B + 0.6 ? (
        <svg style={{position: 'absolute', left: -COUNTER.w / 2, top: -COUNTER.h, overflow: 'visible'}} width={COUNTER.w} height={COUNTER.h}>
          <path
            d={`M 30 ${COUNTER.h - 30} L ${COUNTER.w - 30} 30`}
            stroke={RED}
            strokeWidth={14}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - easeOutCubic(prog(t, T.wrong, T.wrong + 0.18))}
          />
        </svg>
      ) : null}
    </div>
  );
};

const bombSitY = COUNTER.y - 4 - (S('bomb').h - S('bomb').feet[1]) * BOMB_S;
const Bomb: React.FC<{t: number}> = ({t}) => {
  if (t < T.but + 0.02 || t >= BOMB_GO) return null;
  // falls in with the whistle, lands on the counter on "bombs"
  const fall = prog(t, T.but + 0.02, BOMB_LAND);
  const y = t < BOMB_LAND ? lerp(-420, bombSitY, fall * fall) : bombSitY;
  let sx = 1;
  let sy = 1;
  if (t >= BOMB_LAND) {
    const s = spring(t - BOMB_LAND, 3, 6);
    sx = 1 + 0.16 * s;
    sy = 1 - 0.18 * s;
  }
  let rot = t < BOMB_LAND ? -70 + 70 * fall : 0;
  // "wrong": wags like a finger, no-no-no
  if (t > T.wrong - 0.05 && t < T.how) rot += 13 * Math.sin(2 * Math.PI * 3.2 * (t - T.wrong + 0.05)) * clamp((T.how - t) * 4);
  // gets ready to leave
  if (t > BOMB_GO - 0.3) rot -= 10 * easeInCubic(prog(t, BOMB_GO - 0.3, BOMB_GO));
  return (
    <Spr n="bomb" x={COUNTER.x} y={y} s={BOMB_S} sx={sx} sy={sy} rot={rot}>
      <BombFace t={t} />
    </Spr>
  );
};
const BombFace: React.FC<{t: number}> = ({t}) => {
  const eyes = pop(t, T.say - 0.12, 0.22);
  const look: [number, number] = t > T.how ? [-0.6, 0.2] : [-0.5, 0.1];
  return (
    <g>
      <Eye x={118} y={150} r={34} open={eyes} look={look} lid={0.25} lidTilt={22} side={-1} brow={0.5} browTilt={1.6} />
      <Eye x={205} y={150} r={34} open={eyes} look={look} lid={0.25} lidTilt={22} side={1} brow={0.5} browTilt={1.6} />
      {eyes > 0.5 ? <path d="M 135 245 Q 165 228 195 245" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" /> : null}
    </g>
  );
};
// the bomb flying off to the test site on the horizon (screen space, from the counter to the cloud's base)
const FlyingBomb: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  if (t < BOMB_GO || t >= BOMB_HIT) return null;
  const u = easeInCubic(prog(t, BOMB_GO, BOMB_HIT));
  const [x0, y0] = toLayer(cam, COUNTER.x - 45.1, bombSitY - 62.4, 1);
  const [x1, y1] = toLayer(cam, CLOUD.x, HORIZON - 4, DEPTH_BG);
  const x = lerp(x0, x1, u);
  const y = lerp(y0, y1, u) - 260 * Math.sin(Math.PI * u) * (1 - u * 0.3);
  const s = BOMB_S * cam.k * lerp(1, 0.04, Math.pow(u, 0.7));
  return (
    <Spr n="bomb" x={x} y={y} s={s} rot={-10 + 540 * u} ax={319} ay={180}>
      <BombFace t={t} />
    </Spr>
  );
};

// ======================================================================================================
// THE TOOTH (with a face), THE STUMP, THE GEIGER COUNTER + PROBE
// ======================================================================================================
const Tooth: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const lying = !cover && t >= T.lied - 0.08 && t < CUT_G;
  const faceOn = cover ? 1 : t >= CUT_F ? pop(t, CUT_F + 0.05, 0.25) : t >= CUT_G ? 1 : 0;
  const shifty = lying ? Math.sin(2 * Math.PI * 1.6 * (t - T.lied)) : 0;
  const sway = lying ? 2.2 * Math.sin(2 * Math.PI * 0.8 * (t - T.lied)) : 0;
  const lookUp: [number, number] = t >= CUT_G ? [-0.5, -0.6] : [shifty, 0];
  const sweat = lying ? popOut(t, T.lied + 0.12, T.his2 + 0.5) : 0;
  const br = 1 + 0.008 * Math.sin(2 * Math.PI * 0.5 * t + 1);
  return (
    <>
      <Svg>
        <ellipse cx={TOOTH_POS.x} cy={GY + 4} rx={110} ry={16} fill="rgba(72,54,42,0.22)" />
      </Svg>
      <Spr n="tooth" x={TOOTH_POS.x} y={TOOTH_POS.y} s={TOOTH_POS.s} sy={br} rot={sway}>
        {faceOn > 0.01 ? (
          <g>
            <Eye x={250} y={845} r={84} open={faceOn} look={lookUp} lid={lying ? 0.38 : 0} side={-1} brow={0.45} browTilt={lying ? -0.6 : 0} />
            <Eye x={445} y={845} r={84} open={faceOn} look={lookUp} lid={lying ? 0.38 : 0} side={1} brow={0.45} browTilt={lying ? -0.6 : 0} />
            {lying ? (
              <ellipse cx={350} cy={1030} rx={24} ry={30} fill="#7A2E2E" stroke={INK} strokeWidth={8} />
            ) : (
              <path d="M 295 1015 Q 348 1055 400 1015" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
            )}
            <SweatDrop x={585} y={720 + 90 * prog(t, T.lied + 0.12, T.his2 + 0.5)} r={34} s={sweat} />
          </g>
        ) : null}
      </Spr>
    </>
  );
};

const Stump: React.FC<{t: number}> = ({t}) => {
  if (t < T.like - 0.1 || t > 5.5) return null;
  const up = easeOutBack(prog(t, T.like - 0.1, T.like + 0.18), 1.8);
  const down = easeInCubic(prog(t, 5.05, 5.4));
  const dy = (1 - up) * 260 + down * 280;
  const wink = t > T.tree + 0.25 && t < T.tree + 0.55;
  return (
    <Spr n="stump" x={700} y={1800 + dy} s={0.42} sx={1} sy={1 + 0.03 * Math.sin(2 * Math.PI * 2 * t)}>
      <Eye x={225} y={222} r={36} open={1} look={[-0.3, -0.2]} side={-1} brow={0.5} />
      {wink ? (
        <path d="M 318 222 Q 350 240 382 222" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      ) : (
        <Eye x={350} y={222} r={36} open={1} look={[-0.3, -0.2]} side={1} brow={0.5} />
      )}
      <path d="M 250 288 Q 290 318 330 288" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
    </Spr>
  );
};

const probeR = (t: number): number => {
  const u = 0;
  if (t < T.his) {
    const front = lerp(1, 52, easeInOutCubic(prog(t, SWEEP0, SWEEP1)));
    const i = Math.min(51, Math.floor(front));
    return (ringR(i, u) + ringR(i + 1, u)) / 2;
  }
  const back = easeInOutCubic(prog(t, T.his, T.first));
  const r52 = (ringR(51, u) + ringR(52, u)) / 2;
  return lerp(r52, (ringR(0, u) + ringR(1, u)) / 2, back);
};
const clicking = (t: number) => t >= SWEEP0 && t < T.his + 0.05;
const GeigerAndProbe: React.FC<{t: number}> = ({t}) => {
  if (t < CUT_D || t >= CUT_E) return null;
  const inU = easeOutBack(prog(t, CUT_D, CUT_D + 0.3), 1.4);
  const quiet = t >= T.doesnt;
  const jig = clicking(t) ? 2.2 * Math.sin(2 * Math.PI * 17 * t) * (rnd(Math.floor(t * 18)) > 0.4 ? 1 : 0.2) : 0;
  const droop = quiet ? 1 - 0.06 * easeOutCubic(prog(t, T.doesnt, T.doesnt + 0.3)) : 1;
  const r = probeR(t);
  const tip: [number, number] = [C.x + r * Math.cos(PROBE_ANG), C.y + r * Math.sin(PROBE_ANG)];
  const dir: [number, number] = [Math.cos(PROBE_ANG), Math.sin(PROBE_ANG)];
  const back: [number, number] = [tip[0] + dir[0] * 78, tip[1] + dir[1] * 78];
  const box: [number, number] = [GEIGER.x - 60, GEIGER.y - 120];
  const ang = (Math.atan2(back[1] - tip[1], back[0] - tip[0]) * 180) / Math.PI;
  const marks = clicking(t) && rnd(Math.floor(t * 14) + 7) > 0.35;
  return (
    <>
      <Svg>
        <path
          d={`M ${box[0]} ${box[1]} C ${box[0] - 60} ${box[1] - 120} ${back[0] - 90} ${back[1] + 40} ${back[0]} ${back[1]}`}
          fill="none"
          stroke={INK}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={inU > 0.5 ? 1 : 0}
        />
        <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${ang})`} opacity={inU > 0.5 ? 1 : 0}>
          <rect x={0} y={-9} width={78} height={18} rx={8} fill="#2B2B2E" stroke={INK} strokeWidth={4} />
          <rect x={-6} y={-6} width={12} height={12} rx={3} fill="#B9BEC5" stroke={INK} strokeWidth={3} />
        </g>
        {marks
          ? [0, 1, 2].map((k) => {
              const a = -Math.PI / 2 + (k - 1) * 0.55;
              const cx = GEIGER.x - 55;
              const cy = GEIGER.y - 150;
              return <line key={k} x1={cx + Math.cos(a) * 26} y1={cy + Math.sin(a) * 26} x2={cx + Math.cos(a) * 46} y2={cy + Math.sin(a) * 46} stroke={INK} strokeWidth={5} strokeLinecap="round" />;
            })
          : null}
      </Svg>
      <Spr n="geiger" x={GEIGER.x} y={GEIGER.y} s={GEIGER.s * inU} sy={droop} rot={jig} />
      {quiet ? <Label x={GEIGER.x - 25} y={GEIGER.y - 178} text="..." size={44} s={pop(t, T.doesnt + 0.1, 0.25)} fill="#000" /> : null}
    </>
  );
};

// the code magnifier over the packed centre: the rings inside the lens redrawn 2.2x - still too thin to count
const LENS = {x: C.x + 31, y: C.y - 26, r: 48, m: 3.2};
const Magnifier: React.FC<{t: number}> = ({t}) => {
  if (t < LENS0 || t >= CUT_G) return null;
  const u = easeOutCubic(prog(t, LENS0, LENS0 + 0.32));
  const ox = lerp(170, 0, u);
  const oy = lerp(170, 0, u);
  const lx = LENS.x + ox;
  const ly = LENS.y + oy;
  const hover = 3 * Math.sin(2 * Math.PI * 1.1 * t);
  const cx = lx + hover;
  const cy = ly;
  return (
    <Svg>
      <defs>
        <clipPath id="orca-lens">
          <circle cx={cx} cy={cy} r={LENS.r} />
        </clipPath>
      </defs>
      <g clipPath="url(#orca-lens)">
        <circle cx={cx} cy={cy} r={LENS.r} fill={TOOTH} />
        <g transform={`translate(${cx} ${cy}) scale(${LENS.m}) translate(${-cx} ${-cy})`}>
          <RingDisc t={t} lens />
        </g>
        <circle cx={cx} cy={cy} r={LENS.r} fill="#C4ECFA" fillOpacity={0.2} />
      </g>
      <line x1={cx + LENS.r * 0.72} y1={cy + LENS.r * 0.72} x2={cx + LENS.r * 1.85} y2={cy + LENS.r * 1.85} stroke={INK} strokeWidth={24} strokeLinecap="round" />
      <line x1={cx + LENS.r * 0.75} y1={cy + LENS.r * 0.75} x2={cx + LENS.r * 1.82} y2={cy + LENS.r * 1.82} stroke="#8C5021" strokeWidth={14} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={LENS.r} fill="none" stroke={INK} strokeWidth={9} />
      <path d={`M ${cx - LENS.r * 0.55} ${cy - LENS.r * 0.3} Q ${cx - LENS.r * 0.45} ${cy - LENS.r * 0.6} ${cx - LENS.r * 0.15} ${cy - LENS.r * 0.68}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
};

// ======================================================================================================
// THE SHORE SCENE
// ======================================================================================================
export const ShoreScene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const showGuy = cover || !((t >= CUT_F && t < CUT_G) || (t >= CUT_D && t < CUT_E));
  const qm = !cover && t >= T.how && t < CUT_B + 0.5 ? popOut(t, T.how, CUT_B + 0.3, 0.22) : 0;
  const tag1 = !cover && t >= CUT_D && t < CUT_E ? pop(t, T.first - 0.04, 0.25) : 0;
  const q2 = !cover && t >= T.count2 - 0.1 && t < CUT_G;
  const orcaTag = cover ? 0 : t < T.but + 0.2 ? popOut(t, T.killer, T.but - 0.1, 0.25) : 0;
  const avg = cover ? 0 : t >= CUT_G ? pop(t, FLIP + 0.6, 0.25) : 0;
  const first = [C.x + ((ringR(0, 0) + ringR(1, 0)) / 2) * Math.cos(-2.35), C.y + ((ringR(0, 0) + ringR(1, 0)) / 2) * Math.sin(-2.35)];
  return (
    <AbsoluteFill style={{background: SKY}}>
      <FarLayer t={t} cam={cam} cover={cover} />
      <World cam={cam}>
        <Svg>
          <EaselBack />
          <RingDisc t={cover ? 99 : t} />
          <EaselFront />
        </Svg>
        {!cover ? <Tooth t={t} cover={cover} /> : null}
        {!cover ? <GeigerAndProbe t={t} /> : null}
        {showGuy ? <Guy t={t} cover={cover} /> : null}
        {!cover ? <Bomb t={t} /> : null}
        <Counter t={t} cover={cover} />
        {!cover ? <Stump t={t} /> : null}
        <Magnifier t={t} />
        {qm > 0 ? <Label x={GUY_X + 40} y={GY - 760} text="?" size={120} s={qm} rot={8} fill="#FEFDFD" stroke="#000" /> : null}
        {tag1 > 0 ? (
          <>
            <Svg>
              <path
                d={`M ${first[0] + 40} ${first[1] - 92} Q ${first[0] + 6} ${first[1] - 60} ${first[0] - 2} ${first[1] - 8}`}
                fill="none"
                stroke={INK}
                strokeWidth={7 * tag1}
                strokeLinecap="round"
              />
              <path d={`M ${first[0] - 2} ${first[1] - 8} l -12 -18 m 12 18 l 18 -12`} fill="none" stroke={INK} strokeWidth={7 * tag1} strokeLinecap="round" />
            </Svg>
            <Label x={first[0] + 95} y={first[1] - 118} text="1ST RING" size={30} s={tag1} rot={-6} bg="#FFE45C" />
          </>
        ) : null}
        {q2 ? (
          <>
            <Label x={C.x + 82} y={C.y - 78} text="?" size={46} s={pop(t, T.count2 - 0.1, 0.22)} rot={12} fill="#FEFDFD" stroke="#000" />
            <Label x={C.x - 70} y={C.y - 92} text="?" size={36} s={pop(t, T.count2 + 0.06, 0.22)} rot={-14} fill="#FEFDFD" stroke="#000" />
          </>
        ) : null}
        {orcaTag > 0 ? <Label x={TOOTH_POS.x - 40} y={GY - 470} text="ORCA TOOTH" size={30} s={orcaTag} rot={5} bg="#FFE45C" /> : null}
        {avg > 0 ? <Label x={COUNTER.x - 20} y={COUNTER.y - 105} text="AVERAGE MALE: 30" size={30} s={avg} rot={-4} bg="#FFE45C" /> : null}
      </World>
      {!cover ? <FlyingBomb t={t} cam={cam} /> : null}
    </AbsoluteFill>
  );
};

// ======================================================================================================
// UNDERWATER (screen space): the fallout sinking; the calf born before it
// ======================================================================================================
const Fish: React.FC<{x: number; y: number; s: number; col: string; t: number}> = ({x, y, s, col, t}) => {
  const wag = 8 * Math.sin(2 * Math.PI * 4 * t);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M -38 0 L -70 ${-24 + wag * 0.3} L -70 ${24 + wag * 0.3} Z`} fill={col} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={0} cy={0} rx={44} ry={26} fill={col} stroke={INK} strokeWidth={5} />
      <circle cx={22} cy={-6} r={8} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={24} cy={-6} r={4} fill={INK} />
    </g>
  );
};
const sinkingDots = (t: number, t0: number, n: number): Dot[] => {
  const out: Dot[] = [];
  for (let i = 0; i < n; i++) {
    const tb = t0 + rnd(i + 11) * 2.4 - 1.1;
    const age = t - tb;
    if (age < 0) continue;
    const sp = 170 + rnd(i + 21) * 120;
    const y = -40 + age * sp;
    if (y > 1980) continue;
    const x = rnd(i + 31) * 1080 + 26 * Math.sin(age * 2 + i);
    out.push({x, y, r: 9 + rnd(i + 41) * 5, a: 1});
  }
  return out;
};
export const UnderScene: React.FC<{t: number; mode: 'sink' | 'calf'}> = ({t, mode}) => {
  const t0 = mode === 'sink' ? CUT_C : CUT_E;
  const t1 = mode === 'sink' ? CUT_D : CUT_F;
  const z = 1 + 0.035 * prog(t, t0, t1);
  const sc = 1.3 * z;
  const W = SPR.under.w * sc;
  const H = SPR.under.h * sc;
  const dots = mode === 'sink' ? sinkingDots(t, CUT_C - 0.5, 46) : t >= T.the3 ? sinkingDots(t, T.the3 + 0.9, 40) : [];
  // the calf swims in, wiggles on "born", looks up when the fallout arrives
  const cu = easeOutCubic(prog(t, CUT_E, CUT_E + 0.75));
  const cx = lerp(-320, 520, cu);
  const cy = 1060 + 14 * Math.sin(2 * Math.PI * 0.9 * t);
  const look = easeInOutCubic(prog(t, T.fallout - 0.15, T.fallout + 0.25));
  const crot = 3 * Math.sin(2 * Math.PI * 1.6 * t) * (1 - look) - 16 * look;
  const born = bump(t, T.born, 0.4, 0.08);
  const bang = mode === 'calf' ? pop(t, T.fallout + 0.2, 0.22) : 0;
  return (
    <AbsoluteFill style={{background: WATER, overflow: 'hidden'}}>
      <Img src={F('under')} style={{position: 'absolute', left: 540 - W / 2, top: 960 - H / 2, width: W, height: H}} />
      <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
        {mode === 'sink'
          ? [
              {y: 760, s: 1.2, col: '#FFB347', sp: 240, x0: 160},
              {y: 1240, s: 0.95, col: '#FF7F6E', sp: -210, x0: 930},
              {y: 1520, s: 1.05, col: '#FFD95C', sp: 220, x0: 40},
            ].map((f, i) => {
              const x = f.x0 + f.sp * (t - CUT_C);
              return (
                <g key={i} transform={f.sp < 0 ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
                  <Fish x={x} y={f.y + 10 * Math.sin(3 * t + i)} s={f.s} col={f.col} t={t + i} />
                </g>
              );
            })
          : null}
        {mode === 'calf' && t > T.born - 0.05
          ? [0, 1, 2].map((k) => {
              const a = t - T.born - k * 0.12;
              if (a < 0 || a > 1.4) return null;
              return <circle key={k} cx={cx + 150 + 8 * Math.sin(a * 6 + k)} cy={cy - 120 - a * 260} r={10 + 5 * k} fill="#DFF6FF" fillOpacity={0.55} stroke={INK} strokeWidth={4} />;
            })
          : null}
        {dots.map((d, i) => (
          <DotG key={i} d={d} t={t} i={i} />
        ))}
      </svg>
      {mode === 'calf' ? (
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <Spr n="calf" x={cx} y={cy} s={1.2} sx={born} sy={born} rot={crot} ax={250} ay={140} />
          {bang > 0 ? <Label x={cx + 160} y={cy - 260} text="!" size={130} s={bang} rot={10} fill="#FEFDFD" stroke="#000" /> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'ticks', at: COUNT0, db: -27},
  {f: 'ticks', at: COUNT0 + 1.4, db: -28, rate: 1.1, dur: COUNT1 - COUNT0 - 1.4},
  {f: 'pop', at: T.like - 0.06, db: -23},
  {f: 'twinkle', at: T.tree + 0.25, db: -27},
  {f: 'stamp', at: COUNT1 - 0.02, db: -16},
  {f: 'scratch', at: T.but - 0.03, db: -15},
  {f: 'bomb_fall', at: T.but + 0.05, db: -21, dur: BOMB_LAND - T.but - 0.03},
  {f: 'boing', at: BOMB_LAND, db: -22},
  {f: 'buzzer', at: T.wrong - 0.02, db: -17},
  {f: 'pop', at: T.how - 0.02, db: -23},
  {f: 'zoomaway', at: BOMB_GO - 0.05, db: -22},
  {f: 'boom_low', at: BOMB_HIT - 0.04, db: -17},
  {f: 'shaker', at: SHAKE0 - 0.02, db: -16},
  {f: 'magic', at: T.radioactive + 0.05, db: -25},
  {f: 'bubbles', at: CUT_C, db: -23},
  {f: 'twinkle', at: CUT_D + 0.05, db: -26},
  {f: 'geiger', at: SWEEP0, db: -21, dur: 1.0},
  {f: 'geiger', at: SWEEP0 + 0.9, db: -21, dur: T.his - SWEEP0 - 0.85, keys: [[SWEEP0 + 0.9, -21], [T.his - 0.1, -21], [T.his + 0.05, -60]]},
  {f: 'whoosh', at: T.his - 0.02, db: -29, rate: 1.3},
  {f: 'crickets', at: T.doesnt + 0.08, db: -21},
  {f: 'bubbles', at: CUT_E, db: -25},
  {f: 'squeak', at: T.born + 0.02, db: -23},
  {f: 'twinkle', at: T.fallout - 0.1, db: -26},
  {f: 'pop', at: T.fallout + 0.2, db: -23},
  {f: 'whistle', at: T.lied + 0.12, db: -24, dur: 1.2, keys: [[T.lied + 0.12, -24], [T.lied + 1.1, -24], [T.lied + 1.32, -60]]},
  {f: 'accordion', at: COMPRESS0 - 0.02, db: -18},
  {f: 'whoosh', at: LENS0 - 0.05, db: -29, rate: 1.2},
  {f: 'pop', at: T.count2 - 0.1, db: -24},
  {f: 'pop', at: T.count2 + 0.06, db: -25, rate: 1.15},
  {f: 'stamp', at: FLIP + 0.23, db: -17},
  {f: 'sub_splash', at: BULL_UP + 0.02, db: -19},
  {f: 'orca_call', at: BULL_UP + 0.42, db: -18},
  {f: 'party_horn', at: PLUS - 0.02, db: -18, dur: DURATION - PLUS - 0.03, keys: [[PLUS, -18], [DURATION - 0.2, -18], [DURATION - 0.04, -50]]},
];

export const OrcaToothShort: React.FC = () => {
  useOrcaFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAtT(t);
  const under = t >= CUT_C && t < CUT_D ? 'sink' : t >= CUT_E && t < CUT_F ? 'calf' : null;
  return (
    <AbsoluteFill style={{background: SKY}}>
      {under ? <UnderScene t={t} mode={under} /> : <ShoreScene t={t} cam={cam} />}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('orca-tooth/vo/take1.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('orca-tooth/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="orca-tooth/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const ORCA_TOTAL = Math.round(DURATION * FPS);
