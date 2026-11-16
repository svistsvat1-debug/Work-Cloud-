import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
export {DURATION as SAT_DURATION, FPS as SAT_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why did 38 new satellites fall out of the sky?" - a little-planet world: a cartoon Earth (code) with the guy (a
// satellite operator with a headset) standing on top, a thin air shell around it, a rocket stage dropping off a stack of
// satellites with faces, and the Sun with a face far away.
// A: the stack pops off the rocket one by one, the satellites climb toward the dashed ORBIT line.
// B: zoom out: NEXT DAY, the Sun inhales and sneezes a small storm puff that bonks into Earth's air.
// C: close-up: the guy in his beach chair - a little breeze, he shrugs ("we barely feel it").
// D: the air shell gets a face, heats up red and rises like dough past the satellites.
// E: the satellites strain in the wind (> < eyes, sweat); inset bubble: the guy's hand out of a car window.
// F/G: he slams the red button, they turn edge-on like sheets of paper... sad trombone, they sink.
// H: "38": six of the eight dive in and burn up as shooting stars, two survive; he waves goodbye with a hanky.
// I: back in his chair he makes a wish -> a new rocket with a full stack pops in (loop to frame 0).

const F = (n: string) => staticFile(`satellite-storm/${n}.png`);
export const FONT = 'SatInter';
export const useSatFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
const NAVY = '#0C1A4A';
const SUN = '#FFC93C';
const SUN_SHADE = '#FFAE21';
const SUN_RAY = '#FFD95E';
const EARTH = '#3E8EDE';
const EARTH_SHADE = '#2F74C0';
const LAND = '#5DBB4F';
const YEL = '#FFD23F';
const FIRE = '#FF6A2B';
const FIRE_DEEP = '#E2501E';
const FIRE_HOT = '#FFC867';
const STORM = '#FF9E6B';
const STORM_SH = '#F07A4A';

type SprName = keyof typeof SPR;
type SP = {w: number; h: number; feet: readonly number[]; head?: readonly number[]; hand?: readonly number[]; finger?: readonly number[]; topY?: number};
const sp = (n: SprName) => SPR[n] as unknown as SP;

// ---------- world: Earth centre at (0, 0) ----------
const RE = 700; // Earth radius
const AIR0 = 870; // the air shell's outer radius (calm)
const AIR_MAX = 1500; // ...puffed up like dough
const GX = 40; // the guy's x on top of Earth
const GY = -Math.sqrt(RE * RE - GX * GX) + 6;
const GROT = (Math.asin(GX / RE) * 180) / Math.PI;
const HR = 62; // guy head radius (world)
const ORBIT_R = 1640; // the dashed target orbit
const SAT_W = 210; // satellite width incl. panel (world)
const SAT_S = SAT_W / sp('sat').w;
const STAGE_H = 300;
const STAGE_S = STAGE_H / sp('stage').h;
const STAGE_TH = -106; // stage angle (deg) on its parking orbit
const STAGE_R = 1180;
const N_SAT = 8;
const D2R = Math.PI / 180;

// ---------- time ----------
const POP_T = (i: number) => T.fortynine + 0.24 * i; // satellite i leaves the stack
const SWAP: [number, SprName][] = [
  [0, 'hero'],
  [4.98, 'relax'],
  [T.barely - 0.02, 'shrug'],
  [T.up + 0.05, 'shade'],
  [T.they - 0.04, 'press'],
  [T.doesnt - 0.06, 'cheeks'],
  [T.sink - 0.1, 'sad'],
  [T.burn - 0.04, 'wave'],
  [T.so3 + 0.02, 'wish'],
  [27.68, 'hero'],
];
const CHAIR = new Set<SprName>(['relax', 'shrug', 'wish']);
const PRESS = T.turn - 0.1; // the thumb hits the button
const EDGE0 = T.turn + 0.12; // satellites turn edge-on
const HIT = T.hits + 0.2; // the storm puff bonks into the air
const SNEEZE = T.storm + 0.1;
const DIVE0 = [23.2, 23.62, 24.0, 24.38, 24.78, 25.16]; // six divers
const NEW_STAGE = 27.5; // the new rocket pops in
const BUB = [T.like2 - 0.05, T.window + 0.45] as const; // car-window inset

// ---------- helpers ----------
const io = easeInOutCubic;
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const squashSwap = (t: number, tSwap: number, amt = 1): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.07 * u * amt, 1 - 0.08 * u * amt];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.04 * s * amt, 1 + 0.05 * s * amt];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.22) => pop(t, t0, dur) * (1 - easeInCubic(prog(t, t1 - 0.15, t1)));
const polar = (r: number, deg: number): [number, number] => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
const mixC = (a: number[], b: number[], u: number) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], u))).join(',')})`;

const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 9000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);

// ---------- camera ----------
const CAM: CamKey[] = [
  {t: 0, x: 30, y: -1090, k: 1.0},
  {t: 4.6, x: 45, y: -1150, k: 1.03},
  {t: 5.9, x: -700, y: -1420, k: 0.42},
  {t: 7.85, x: -700, y: -1420, k: 0.42, ease: 'cut'},
  {t: 8.75, x: 40, y: -840, k: 1.65},
  {t: 10.72, x: 40, y: -850, k: 1.68},
  {t: 11.6, x: 0, y: -1090, k: 0.6},
  {t: 14.62, x: 0, y: -1100, k: 0.61},
  {t: 15.45, x: 150, y: -1440, k: 1.22},
  {t: 18.9, x: 170, y: -1440, k: 1.26},
  {t: 19.5, x: 50, y: -1110, k: 0.8},
  {t: 22.65, x: 50, y: -1110, k: 0.81},
  {t: 23.15, x: 70, y: -1110, k: 0.74},
  {t: 26.2, x: 70, y: -1110, k: 0.74},
  {t: 26.8, x: 40, y: -850, k: 1.6},
  {t: 27.42, x: 40, y: -850, k: 1.62},
  {t: 28.2, x: 30, y: -1090, k: 1.0},
];
const camOf = (t: number): Cam => {
  const c = camAt(t, CAM);
  // the 7.85 'cut' key is a hold: CAM interpolates from 5.9 to 7.85 as a still frame, then glides in from 7.85
  const amp = 9 * Math.exp(-6 * Math.max(0, t - HIT)) * (t >= HIT ? 1 : 0) + 4 * bump(t, 13.0, 1.3);
  const s = shake(t, amp);
  return {x: c.x - s.x / c.k, y: c.y - s.y / c.k, k: c.k};
};

// ---------- the air shell ----------
const airR = (t: number) => {
  const hit = 26 * Math.exp(-5 * Math.max(0, t - HIT)) * Math.sin(2 * Math.PI * 3 * Math.max(0, t - HIT)) * (t >= HIT ? 1 : 0);
  const warm = 30 * io(prog(t, T.heats, T.heats + 0.7));
  const u = prog(t, T.puffs, T.dough + 0.25);
  const rise = (AIR_MAX - AIR0 - 30) * (u <= 0 ? 0 : easeOutBack(u, 1.2));
  const shrink = io(prog(t, 26.3, 27.45));
  const breath = 10 * Math.sin(2 * Math.PI * 0.5 * t) * prog(t, T.dough, T.dough + 1);
  return (AIR0 + hit + warm + rise + breath) * (1 - shrink) + AIR0 * shrink;
};
const heatOf = (t: number) => io(prog(t, T.heats, T.heats + 0.75)) * (1 - io(prog(t, 26.0, 27.4)));
const lumpy = (t: number) => clamp(prog(t, T.puffs, T.puffs + 0.4)) * (1 - prog(t, 26.0, 27.3));
const shellPath = (R: number, t: number, amp: number) => {
  const pts: string[] = [];
  for (let a = 0; a < 360; a += 2) {
    const th = a * D2R;
    const r = R * (1 + amp * (0.02 * Math.sin(9 * th + 1.3 * t) + 0.012 * Math.sin(14 * th - 2.1 * t)));
    pts.push(`${a ? 'L' : 'M'} ${(r * Math.cos(th)).toFixed(1)} ${(r * Math.sin(th)).toFixed(1)}`);
  }
  return pts.join(' ') + ' Z';
};
const AirShell: React.FC<{t: number; k: number}> = ({t, k}) => {
  const R = airR(t);
  const h = heatOf(t);
  const hc = clamp(h * 3); // hue flips in the first third, density follows
  const amp = lumpy(t);
  const fill = mixC([120, 196, 255], [255, 146, 82], hc);
  const rim = mixC([178, 226, 255], [255, 196, 130], hc);
  const inner = mixC([150, 210, 255], [255, 178, 112], hc);
  const ink = 6 / Math.min(k, 1);
  return (
    <g>
      <path d={shellPath(R, t, amp)} fill={fill} fillOpacity={0.26 + 0.6 * h} />
      <path d={shellPath(lerp(R, RE, 0.5), t + 1, amp * 0.6)} fill={inner} fillOpacity={0.14 + 0.5 * h} />
      <path d={shellPath(R - 14, t, amp)} fill="none" stroke={rim} strokeWidth={28} strokeOpacity={0.95} />
      <path d={shellPath(R, t, amp)} fill="none" stroke={INK} strokeWidth={ink} />
    </g>
  );
};
// the air's face (on the shell, up-left of the guy)
const AirFace: React.FC<{t: number; sw: number}> = ({t, sw}) => {
  const o = popOut(t, T.heats - 0.05, 26.25, 0.3);
  if (o <= 0.001) return null;
  const R = airR(t);
  const th = -112;
  const [x, y] = polar(R - lerp(70, 150, prog(R, AIR0, AIR_MAX)), th);
  const sc = lerp(1, 1.5, prog(R, AIR0, AIR_MAX));
  const er = 26;
  const puffing = t >= T.puffs && t < T.dough + 0.15;
  const blowing = t >= T.so2 && t < 19.3;
  const oops = t >= T.thirty;
  const smug = !puffing && !blowing && !oops && t >= T.dough + 0.15;
  const sweat = t < T.puffs ? prog(t, T.heats + 0.2, T.heats + 0.5) : 0;
  const cheek = puffing ? 1 + 0.25 * Math.sin(Math.PI * prog(t, T.puffs, T.dough + 0.15)) : 1;
  return (
    <g transform={`translate(${x} ${y}) rotate(${th + 90}) scale(${o * sc})`}>
      {puffing ? (
        <>
          <Eye x={-38} y={-10} r={er} open={1} squeeze side={-1} ink={sw / er} />
          <Eye x={38} y={-10} r={er} open={1} squeeze side={1} ink={sw / er} />
        </>
      ) : (
        <>
          <Eye x={-38} y={-10} r={er} open={1} look={oops ? [0.3, 0.6] : blowing ? [0.8, 0] : [0.2, -0.3]} side={-1} brow={0.7} browTilt={sweat > 0 || oops ? -1.4 : smug ? 0.5 : 0} lid={smug ? 0.45 : 0} ink={sw / er} />
          <Eye x={38} y={-10} r={er} open={1} look={oops ? [0.3, 0.6] : blowing ? [0.8, 0] : [0.2, -0.3]} side={1} brow={0.7} browTilt={sweat > 0 || oops ? -1.4 : smug ? 0.5 : 0} lid={smug ? 0.45 : 0} ink={sw / er} />
        </>
      )}
      <ellipse cx={-62 * cheek} cy={28} rx={20 * cheek} ry={13 * cheek} fill="#FF8A8A" opacity={0.75} />
      <ellipse cx={62 * cheek} cy={28} rx={20 * cheek} ry={13 * cheek} fill="#FF8A8A" opacity={0.75} />
      {puffing ? (
        <ellipse cx={0} cy={38} rx={14} ry={9} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
      ) : blowing ? (
        <ellipse cx={14} cy={36} rx={13} ry={15} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
      ) : oops ? (
        <ellipse cx={0} cy={38} rx={12} ry={16} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
      ) : smug ? (
        <path d="M -30 28 Q 0 56 30 28" fill="none" stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" />
      ) : (
        <path d="M -24 36 q 8 -8 16 0 t 16 0 t 16 0" fill="none" stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" />
      )}
      {sweat > 0.01 ? <SweatDrop x={66} y={-40 + 20 * (1 - sweat)} r={13} s={sweat} rot={14} /> : null}
    </g>
  );
};
// heat squiggles rising off the warm air
const HeatSquiggles: React.FC<{t: number; sw: number}> = ({t, sw}) => {
  const h = heatOf(t) * (1 - prog(t, 14.4, 14.9)) + heatOf(t) * 0.0;
  if (h < 0.02 || t > 14.9) return null;
  const R = airR(t);
  return (
    <g>
      {Array.from({length: 10}, (_, i) => {
        const th = -150 + i * 13 + 4 * rnd(i);
        const ph = (t * 0.9 + rnd(i + 3)) % 1;
        const [x, y] = polar(R + 30 + 160 * ph, th);
        const s = h * Math.sin(Math.PI * ph);
        if (s < 0.05) return null;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${th + 90}) scale(${s})`}>
            <path d="M 0 30 q 14 -10 0 -20 t 0 -20 t 0 -20" fill="none" stroke={INK} strokeWidth={sw * 2.4} strokeLinecap="round" />
            <path d="M 0 30 q 14 -10 0 -20 t 0 -20 t 0 -20" fill="none" stroke="#FF8A4C" strokeWidth={sw * 1.2} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

// ---------- the Sun (code) ----------
type SunMood = 'calm' | 'sleep' | 'happy' | 'squeeze';
const SunBody: React.FC<{x: number; y: number; r: number; sw: number; t: number; mood: SunMood; look: [number, number]; squash?: number}> = ({x, y, r, sw, t, mood, look, squash = 1}) => {
  const n = 16;
  const spin = t * 6;
  const rays = Array.from({length: n}, (_, i) => {
    const a = ((i / n) * 360 + spin) * D2R;
    const w = (Math.PI / n) * 0.55;
    const r0 = r * 1.02;
    const r1 = r * (1.12 + 0.025 * Math.sin(t * 3 + i * 1.7));
    return `M ${Math.cos(a - w) * r0} ${Math.sin(a - w) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1} L ${Math.cos(a + w) * r0} ${Math.sin(a + w) * r0} Z`;
  }).join(' ');
  const fx = look[0] * r * 0.45;
  const fy = look[1] * r * 0.45;
  const er = r * 0.1;
  const ex = r * 0.25;
  const eyeY = fy - r * 0.04;
  const mouthY = fy + r * 0.17;
  return (
    <g transform={`translate(${x} ${y}) scale(${1 / Math.sqrt(squash)}, ${squash})`}>
      <circle r={r * 1.7} fill="url(#sunglow)" />
      <path d={rays} fill={SUN_RAY} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <defs>
        <clipPath id="sunclip">
          <circle r={r} />
        </clipPath>
      </defs>
      <circle r={r} fill={SUN} />
      <g clipPath="url(#sunclip)">
        <circle cx={r * 0.32} cy={r * 0.36} r={r * 1.0} fill="none" stroke={SUN_SHADE} strokeWidth={r * 0.28} opacity={0.75} />
        <ellipse cx={fx - ex * 1.55} cy={mouthY - r * 0.04} rx={r * 0.09} ry={r * 0.055} fill="#FF8A5B" opacity={0.7} />
        <ellipse cx={fx + ex * 1.55} cy={mouthY - r * 0.04} rx={r * 0.09} ry={r * 0.055} fill="#FF8A5B" opacity={0.7} />
        {mood === 'sleep' ? (
          [-1, 1].map((sd) => (
            <path key={sd} d={`M ${fx + sd * ex - er} ${eyeY} Q ${fx + sd * ex} ${eyeY + er * 0.8} ${fx + sd * ex + er} ${eyeY}`} fill="none" stroke={INK} strokeWidth={sw * 1.4} strokeLinecap="round" />
          ))
        ) : mood === 'happy' ? (
          [-1, 1].map((sd) => (
            <path key={sd} d={`M ${fx + sd * ex - er} ${eyeY + er * 0.3} Q ${fx + sd * ex} ${eyeY - er} ${fx + sd * ex + er} ${eyeY + er * 0.3}`} fill="none" stroke={INK} strokeWidth={sw * 1.5} strokeLinecap="round" />
          ))
        ) : mood === 'squeeze' ? (
          <>
            <Eye x={fx - ex} y={eyeY} r={er} open={1} squeeze side={-1} ink={sw / er} />
            <Eye x={fx + ex} y={eyeY} r={er} open={1} squeeze side={1} ink={sw / er} />
          </>
        ) : (
          <>
            <Eye x={fx - ex} y={eyeY} r={er} open={1} look={[0.7, 0.5]} side={-1} brow={0.75} ink={sw / er} />
            <Eye x={fx + ex} y={eyeY} r={er} open={1} look={[0.7, 0.5]} side={1} brow={0.75} ink={sw / er} />
          </>
        )}
        {mood === 'sleep' ? (
          <ellipse cx={fx} cy={mouthY + r * 0.02} rx={r * 0.07} ry={r * 0.08} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
        ) : mood === 'squeeze' ? (
          <ellipse cx={fx} cy={mouthY + r * 0.03} rx={r * 0.11} ry={r * 0.06} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
        ) : mood === 'happy' ? (
          <path d={`M ${fx - r * 0.13} ${mouthY - r * 0.02} Q ${fx} ${mouthY + r * 0.12} ${fx + r * 0.13} ${mouthY - r * 0.02} Z`} fill="#7A2E1C" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        ) : (
          <path d={`M ${fx - r * 0.1} ${mouthY} Q ${fx} ${mouthY + r * 0.07} ${fx + r * 0.1} ${mouthY}`} fill="none" stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" />
        )}
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={sw * 1.2} />
    </g>
  );
};
const SUN_X = -1450;
const SUN_Y = -2750;
const SUN_R = 470;

// ---------- Earth (code) ----------
const EarthBody: React.FC<{r: number; sw: number; spin: number}> = ({r, sw, spin}) => (
  <g>
    <defs>
      <clipPath id="earthclip">
        <circle r={r} />
      </clipPath>
    </defs>
    <circle r={r} fill={EARTH} />
    <g clipPath="url(#earthclip)">
      <g transform={`rotate(${spin})`}>
        <path d={`M ${-r * 0.75} ${-r * 0.55} C ${-r * 0.4} ${-r * 0.85} ${-r * 0.05} ${-r * 0.7} ${-r * 0.12} ${-r * 0.4} C ${-r * 0.18} ${-r * 0.15} ${-r * 0.45} ${-r * 0.1} ${-r * 0.55} ${r * 0.15} C ${-r * 0.7} ${r * 0.35} ${-r * 0.95} ${r * 0.1} ${-r * 0.92} ${-r * 0.2} Z`} fill={LAND} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <path d={`M ${r * 0.2} ${-r * 0.25} C ${r * 0.55} ${-r * 0.45} ${r * 0.85} ${-r * 0.2} ${r * 0.75} ${r * 0.15} C ${r * 0.65} ${r * 0.45} ${r * 0.4} ${r * 0.75} ${r * 0.2} ${r * 0.55} C ${r * 0.05} ${r * 0.35} ${r * 0.3} ${r * 0.15} ${r * 0.1} ${r * 0.0} Z`} fill={LAND} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <path d={`M ${-r * 0.35} ${r * 0.55} C ${-r * 0.15} ${r * 0.5} ${0} ${r * 0.7} ${-r * 0.1} ${r * 0.85} C ${-r * 0.25} ${r * 0.95} ${-r * 0.45} ${r * 0.75} Z`} fill={LAND} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <ellipse cx={r * 0.05} cy={-r * 0.78} rx={r * 0.3} ry={r * 0.07} fill="#fff" opacity={0.9} />
        <ellipse cx={-r * 0.45} cy={r * 0.35} rx={r * 0.22} ry={r * 0.06} fill="#fff" opacity={0.9} />
      </g>
      {/* a grassy cap where the guy stands */}
      <circle cx={0} cy={-r * 1.62} r={r * 0.7} fill={LAND} stroke={INK} strokeWidth={sw} />
      <circle cx={r * 0.3} cy={r * 0.34} r={r * 1.0} fill="none" stroke={EARTH_SHADE} strokeWidth={r * 0.26} opacity={0.55} />
    </g>
    <circle r={r} fill="none" stroke={INK} strokeWidth={sw * 1.2} />
  </g>
);

// ---------- sprites ----------
const Spr: React.FC<{n: SprName; s: number; ax: number; ay: number; x: number; y: number; rot?: number; sx?: number; sy?: number; filter?: string}> = ({n, s, ax, ay, x, y, rot = 0, sx = 1, sy = 1, filter}) => {
  const p = sp(n);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', filter}}>
      <Img src={F(n)} style={{position: 'absolute', left: -ax * s, top: -ay * s, width: p.w * s, height: p.h * s}} />
    </div>
  );
};
// the guy (feet-anchored on the Earth's top), head radius HR in the world
const Guy: React.FC<{n: SprName; x: number; y: number; rot: number; sx: number; sy: number}> = ({n, x, y, rot, sx, sy}) => {
  const p = sp(n);
  const s = HR / (p.head as readonly number[])[2];
  return <Spr n={n} s={s} ax={p.feet[0]} ay={p.feet[1]} x={x} y={y} rot={rot} sx={sx} sy={sy} />;
};

// satellites: sprite anchored on the body centre; face drawn in sprite px on top
type SatMood = 'happy' | 'worry' | 'strain' | 'hope' | 'sad' | 'panic' | 'relief';
const SB = (SPR.sat as unknown as {body: {cx: number; cy: number}}).body;
const SatFace: React.FC<{mood: SatMood; t: number; i: number}> = ({mood, t, i}) => {
  const ex = 52;
  const ey = 78;
  const cx = SB.cx - 6;
  const er = 30;
  const sw = 8;
  const blink = (t * 0.7 + rnd(i) * 3) % 3.1 < 0.12 && (mood === 'happy' || mood === 'hope');
  const eyes = () => {
    if (mood === 'happy' || mood === 'relief' || blink)
      return [-1, 1].map((sd) => (
        <path key={sd} d={`M ${cx + sd * ex - er} ${ey + 6} Q ${cx + sd * ex} ${ey - er} ${cx + sd * ex + er} ${ey + 6}`} fill="none" stroke={INK} strokeWidth={sw * 1.4} strokeLinecap="round" />
      ));
    if (mood === 'strain')
      return (
        <>
          <Eye x={cx - ex} y={ey} r={er} open={1} squeeze side={-1} ink={sw / er} />
          <Eye x={cx + ex} y={ey} r={er} open={1} squeeze side={1} ink={sw / er} />
        </>
      );
    const look: [number, number] = mood === 'hope' ? [0.4, -0.6] : mood === 'panic' ? [0, 0.4] : mood === 'sad' ? [0, 0.7] : [0, 0.6];
    const tilt = mood === 'sad' || mood === 'worry' ? -1.5 : mood === 'panic' ? -1.8 : 0;
    const r2 = mood === 'panic' ? er * 1.2 : er;
    return (
      <>
        <Eye x={cx - ex + (mood === 'panic' ? 2 : 0)} y={ey} r={r2} open={1} look={look} side={-1} brow={0.6} browTilt={tilt} ink={sw / r2} />
        <Eye x={cx + ex + (mood === 'panic' ? 2 : 0)} y={ey} r={r2} open={1} look={look} side={1} brow={0.6} browTilt={tilt} ink={sw / r2} />
      </>
    );
  };
  const my = ey + 58;
  const mouth =
    mood === 'happy' || mood === 'relief' ? (
      <path d={`M ${cx - 26} ${my - 6} Q ${cx} ${my + 22} ${cx + 26} ${my - 6}`} fill="#7A2E1C" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    ) : mood === 'strain' ? (
      <>
        <rect x={cx - 30} y={my - 10} width={60} height={22} rx={6} fill="#fff" stroke={INK} strokeWidth={sw} />
        <line x1={cx - 30} x2={cx + 30} y1={my + 1} y2={my + 1} stroke={INK} strokeWidth={sw * 0.6} />
      </>
    ) : mood === 'panic' ? (
      <ellipse cx={cx} cy={my + 4} rx={16} ry={22} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
    ) : mood === 'sad' ? (
      <path d={`M ${cx - 22} ${my + 10} Q ${cx} ${my - 10} ${cx + 22} ${my + 10}`} fill="none" stroke={INK} strokeWidth={sw * 1.2} strokeLinecap="round" />
    ) : mood === 'hope' ? (
      <ellipse cx={cx} cy={my} rx={11} ry={13} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
    ) : (
      <path d={`M ${cx - 24} ${my} q 8 -8 16 0 t 16 0 t 16 0`} fill="none" stroke={INK} strokeWidth={sw * 1.2} strokeLinecap="round" />
    );
  return (
    <>
      {eyes()}
      {mouth}
    </>
  );
};
const Sat: React.FC<{x: number; y: number; rot: number; sx?: number; sy?: number; mood: SatMood; t: number; i: number; burn?: number; sweat?: number}> = ({x, y, rot, sx = 1, sy = 1, mood, t, i, burn = 0, sweat = 0}) => {
  const p = sp('sat');
  const s = SAT_S;
  const W = p.w * s;
  const H = p.h * s;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -SB.cx * s, top: -SB.cy * s, width: W, height: H, filter: burn > 0.01 ? `sepia(${burn}) saturate(${1 + 4 * burn}) hue-rotate(${-20 * burn}deg) brightness(${1 + 0.25 * burn})` : undefined}}>
        <Img src={F('sat')} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={W} height={H} viewBox={`0 0 ${p.w} ${p.h}`}>
          <SatFace mood={mood} t={t} i={i} />
          {sweat > 0.01 ? <SweatDrop x={SB.cx + 120} y={20 + 30 * (1 - sweat)} r={22} s={sweat} rot={18} /> : null}
        </svg>
      </div>
    </div>
  );
};

// ---------- the satellites' story ----------
const slotTh = (j: number) => -97 + j * 4.2;
const rowOff = (j: number) => (j % 2 ? 58 : 0);
const baseR = (t: number) =>
  1330 + 80 * io(prog(t, T.start, 10.6)) - 22 * io(prog(t, T.so2 + 0.3, 18.8)) - 80 * io(prog(t, T.it2 + 0.05, T.thirty + 0.3));
const stackPos = (slice: number, r0 = STAGE_R): [number, number] => polar(r0 + STAGE_H / 2 + 16 + 24 * slice, STAGE_TH);
// slots 3 and 6 survive (2 of 8 ~ 11 of 49)
const diverOrder = (j: number) => {
  const d = [0, 1, 2, 4, 5, 7].indexOf(j);
  return d; // -1 = survivor
};
const moodAt = (t: number, j: number): SatMood => {
  if (t < T.puffs + 0.3) return 'happy';
  if (t < T.so2) return 'worry';
  if (t < T.they + 0.2) return 'strain';
  if (t < T.it2) return 'hope';
  const d = diverOrder(j);
  if (d >= 0 && t >= DIVE0[d] - 0.25) return 'panic';
  if (d < 0 && t >= 25.6) return 'relief';
  return 'sad';
};
type SatState = {x: number; y: number; rot: number; sx: number; sy: number; burn: number; vis: boolean; tail: number; vang: number; sweat: number};
const satState = (t: number, i: number): SatState => {
  const j = N_SAT - 1 - i; // first popped flies furthest right
  const tp = POP_T(i);
  const hide = {x: 0, y: 0, rot: 0, sx: 1, sy: 1, burn: 0, vis: false, tail: 0, vang: 0, sweat: 0};
  if (t < tp) return hide; // still in the stack (drawn by the stack)
  // slot position
  let th = slotTh(j);
  let r = baseR(t) + rowOff(j) + 6 * Math.sin(2 * Math.PI * 0.5 * t + j);
  const d = diverOrder(j);
  if (d < 0) th += 30 * easeInCubic(prog(t, 26.3, 27.4)); // survivors drift away along the orbit
  let rot = th + 90;
  let sy = 1;
  let sx = 1;
  // pop off the stack and fly to the slot
  const u = prog(t, tp, tp + 0.85);
  if (u < 1) {
    const [x0, y0] = stackPos(N_SAT - 1 - i);
    const [x1, y1] = polar(r, th);
    const e = easeOutCubic(u);
    const lift = 140 * Math.sin(Math.PI * u);
    const [nx, ny] = polar(1, lerp(STAGE_TH, th, e));
    const x = lerp(x0, x1, e) + nx * lift;
    const y = lerp(y0, y1, e) + ny * lift;
    const p0 = pop(t, tp, 0.25);
    return {...hide, vis: true, x, y, rot: lerp(STAGE_TH + 90, rot, e) + 25 * Math.sin(Math.PI * u), sx: lerp(0.9, 1, p0), sy: lerp(0.35, 1, p0)};
  }
  // strain wobble in the drag
  if (t >= T.so2 && t < EDGE0) rot += 6 * Math.sin(2 * Math.PI * 7 * t + j) * prog(t, T.so2, T.so2 + 0.3) - 9 * prog(t, T.so2, T.so2 + 0.4);
  // edge-on like paper
  const eo = io(prog(t, EDGE0 + 0.05 * j, EDGE0 + 0.45 + 0.05 * j)) * (1 - io(prog(t, T.work + 0.05 + 0.04 * j, T.work + 0.5 + 0.04 * j)));
  sy = lerp(1, 0.28, eo);
  sx = lerp(1, 1.1, eo);
  const sweat = t >= T.so2 + 0.3 && t < T.they + 0.2 ? pop(t, T.so2 + 0.3 + 0.07 * j, 0.25) : 0;
  // the dive
  let burn = 0;
  let tail = 0;
  let vang = rot;
  if (d >= 0) {
    const t0 = DIVE0[d];
    const v = prog(t, t0, t0 + 1.05);
    if (t >= t0 + 1.25) return hide;
    if (v > 0) {
      const e = easeInCubic(v);
      th += 16 * v;
      r = lerp(r, RE + 60, e);
      sy = lerp(sy, 1, prog(v, 0, 0.25));
      rot += 140 * v * v;
      burn = prog(r, 1280, 980);
      tail = burn;
      vang = th + 90 + lerp(0, 75, v); // velocity direction (deg): along the orbit, bending down
      if (v >= 1) {
        const [x, y] = polar(r, th);
        return {...hide, vis: false, x, y, tail: 1 - prog(t, t0 + 1.05, t0 + 1.25), vang, burn: 1};
      }
    }
  }
  const [x, y] = polar(r, th);
  return {x, y, rot, sx, sy, burn, vis: true, tail, vang, sweat};
};
// flame tail behind a burning satellite (no outline, lava palette), pointing against the velocity
const FlameTail: React.FC<{x: number; y: number; ang: number; s: number; t: number}> = ({x, y, ang, s, t}) => {
  if (s < 0.02) return null;
  const L = 260 * s * (1 + 0.1 * Math.sin(t * 40));
  const w = 70 * Math.sqrt(s);
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang + 180})`}>
      <path d={`M 0 ${-w} Q ${L * 0.5} ${-w * 0.7} ${L} 0 Q ${L * 0.5} ${w * 0.7} 0 ${w} Q ${-w * 0.9} 0 0 ${-w} Z`} fill={FIRE_DEEP} />
      <path d={`M 0 ${-w * 0.75} Q ${L * 0.4} ${-w * 0.5} ${L * 0.8} 0 Q ${L * 0.4} ${w * 0.5} 0 ${w * 0.75} Q ${-w * 0.7} 0 0 ${-w * 0.75} Z`} fill={FIRE} />
      <path d={`M 0 ${-w * 0.4} Q ${L * 0.3} ${-w * 0.25} ${L * 0.5} 0 Q ${L * 0.3} ${w * 0.25} 0 ${w * 0.4} Q ${-w * 0.4} 0 0 ${-w * 0.4} Z`} fill={FIRE_HOT} />
    </g>
  );
};
// a falling-star streak (fading line) - after a satellite is gone, and the wish stars
const Streak: React.FC<{x0: number; y0: number; x1: number; y1: number; u: number; w: number}> = ({x0, y0, x1, y1, u, w}) => {
  if (u <= 0 || u >= 1) return null;
  const hx = lerp(x0, x1, easeOutCubic(u));
  const hy = lerp(y0, y1, easeOutCubic(u));
  const tu = Math.max(0, easeOutCubic(u) - 0.35);
  const tx = lerp(x0, x1, tu);
  const ty = lerp(y0, y1, tu);
  const fade = 1 - prog(u, 0.7, 1);
  return (
    <g opacity={fade}>
      <defs>
        <linearGradient id={`st${Math.round(x0)}${Math.round(y0)}`} x1={tx} y1={ty} x2={hx} y2={hy} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF4C2" stopOpacity={0} />
          <stop offset="1" stopColor="#FFF4C2" stopOpacity={1} />
        </linearGradient>
      </defs>
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={`url(#st${Math.round(x0)}${Math.round(y0)})`} strokeWidth={w} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={w * 0.9} fill="#FFF8D8" />
    </g>
  );
};

// the storm puff the Sun sneezes (orange cloud with a cheeky face), flies to Earth and bonks into the air
const stormPath = (u: number): [number, number] => {
  const x0 = SUN_X + SUN_R * 0.75;
  const y0 = SUN_Y + SUN_R * 0.75;
  const [x2, y2] = polar(AIR0 + 40, -128);
  const x1 = (x0 + x2) / 2 + 260;
  const y1 = (y0 + y2) / 2 - 120;
  const a = (1 - u) * (1 - u);
  const b = 2 * u * (1 - u);
  const c = u * u;
  return [a * x0 + b * x1 + c * x2, a * y0 + b * y1 + c * y2];
};
const StormPuff: React.FC<{t: number; sw: number}> = ({t, sw}) => {
  const t0 = SNEEZE + 0.05;
  if (t < t0 || t > HIT + 0.6) return null;
  if (t < HIT) {
    const u = prog(t, t0, HIT);
    const [x, y] = stormPath(easeInOutCubic(u) * 0.3 + u * 0.7);
    const s = lerp(0.6, 1.1, u) * pop(t, t0, 0.2);
    const puffs: Puff[] = [
      {x: 0, y: 0, r: 70},
      {x: -60, y: 20, r: 48},
      {x: 58, y: 22, r: 50},
      {x: -30, y: -40, r: 44},
      {x: 34, y: -36, r: 42},
    ];
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <PuffCluster puffs={puffs} fill={STORM} shade={STORM_SH} ink={sw * 1.2} />
        <Eye x={-22} y={-6} r={14} open={1} look={[0.6, 0.6]} side={-1} brow={0.6} browTilt={0.5} ink={sw / 14} />
        <Eye x={22} y={-6} r={14} open={1} look={[0.6, 0.6]} side={1} brow={0.6} browTilt={0.5} ink={sw / 14} />
        <path d="M -16 22 Q 0 34 16 22" fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
      </g>
    );
  }
  // burst into small puffs that shrink away
  const v = prog(t, HIT, HIT + 0.6);
  const [x, y] = stormPath(1);
  return (
    <g>
      {Array.from({length: 7}, (_, i) => {
        const a = -150 + i * 34 + 10 * rnd(i);
        const d = 60 + 160 * easeOutCubic(v);
        const r = 30 * (1 - v) * (0.7 + 0.5 * rnd(i + 9));
        return <PuffCluster key={i} puffs={[{x: x + Math.cos(a * D2R) * d, y: y + Math.sin(a * D2R) * d, r}]} fill={STORM} ink={sw} />;
      })}
    </g>
  );
};

// poof of white puffs when the chair appears / disappears
const Poof: React.FC<{t: number; t0: number; x: number; y: number; sw: number}> = ({t, t0, x, y, sw}) => {
  const v = prog(t, t0 - 0.06, t0 + 0.4);
  if (v <= 0 || v >= 1) return null;
  const puffs: Puff[] = Array.from({length: 9}, (_, i) => {
    const a = 180 + i * 22.5;
    const d = 55 + 70 * easeOutCubic(v);
    return {x: x + Math.cos(a * D2R) * d, y: y - 30 + Math.sin(a * D2R) * d * 0.5, r: 22 * Math.sin(Math.PI * v) * (0.8 + 0.4 * rnd(i))};
  });
  return <PuffCluster puffs={puffs} fill="#FFFFFF" shade="#E4ECF4" ink={sw * clamp(3 * Math.sin(Math.PI * v))} />;
};

// wind lines (white with an ink under-stroke) flowing against the satellites
const WindLines: React.FC<{t: number; t0: number; t1: number; sw: number; cx: number; cy: number; W: number; Hh: number; speed: number}> = ({t, t0, t1, sw, cx, cy, W, Hh, speed}) => {
  const o = prog(t, t0, t0 + 0.3) * (1 - prog(t, t1 - 0.3, t1));
  if (o <= 0.01) return null;
  return (
    <g>
      {Array.from({length: 16}, (_, i) => {
        const yy = cy - Hh / 2 + Hh * rnd(i + 1);
        const len = 120 + 140 * rnd(i + 7);
        const ph = ((t - t0) * speed / W + rnd(i + 3)) % 1;
        const xx = cx + W / 2 - W * ph;
        const thin = i >= 5 ? 1 - prog(t, EDGE0, EDGE0 + 0.6) : 1;
        const s = o * thin * Math.sin(Math.PI * ph);
        if (s < 0.05) return null;
        const d = `M ${xx} ${yy} l ${len * s} 0`;
        return (
          <g key={i}>
            <path d={d} stroke={INK} strokeWidth={sw * 3.2} strokeLinecap="round" />
            <path d={d} stroke="#FFFFFF" strokeWidth={sw * 1.6} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

// ---------- screen-space bits ----------
const Label: React.FC<{x: number; y: number; s: number; children: React.ReactNode; color?: string; size?: number; rot?: number}> = ({x, y, s, children, color = YEL, size = 110, rot = -3}) =>
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
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.2,
      }}
    >
      {children}
    </div>
  );
const MiniSat: React.FC<{size: number}> = ({size}) => (
  <svg width={size * 1.4} height={size * 0.8} viewBox="-70 -40 140 80" style={{overflow: 'visible'}}>
    <rect x={-62} y={-24} width={58} height={40} rx={6} fill="#D9D9D9" stroke={INK} strokeWidth={9} />
    <rect x={-4} y={-6} width={14} height={8} fill="#9A9A9A" stroke={INK} strokeWidth={5} />
    <rect x={10} y={-30} width={56} height={52} rx={4} fill="#2856C8" stroke={INK} strokeWidth={9} />
    <line x1={38} x2={38} y1={-30} y2={22} stroke="#8FB8FF" strokeWidth={4} />
    <line x1={10} x2={66} y1={-4} y2={-4} stroke="#8FB8FF" strokeWidth={4} />
  </svg>
);
const MiniFlame: React.FC<{size: number; t: number}> = ({size, t}) => (
  <svg width={size * 0.8} height={size} viewBox="-40 -60 80 100" style={{overflow: 'visible'}}>
    <path d={`M 0 ${-56 - 4 * Math.sin(t * 20)} Q 34 -10 28 12 Q 20 38 0 38 Q -20 38 -28 12 Q -34 -10 0 ${-56 - 4 * Math.sin(t * 20)} Z`} fill={FIRE} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M 0 -18 Q 16 4 12 16 Q 8 30 0 30 Q -8 30 -12 16 Q -16 4 0 -18 Z" fill={FIRE_HOT} />
  </svg>
);

// the "hand out of a car window" inset: a round bubble with a code car, the guy (ride pose) and wind
const CarBubble: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, BUB[0], BUB[1], 0.25);
  if (s <= 0.001) return null;
  const CX = 540;
  const CY = 440;
  const R = 300;
  const p = sp('ride');
  const head = p.head as readonly number[];
  const gs = 64 / head[2];
  const bob = 4 * Math.sin(2 * Math.PI * 9 * t);
  const wheel = (t * 900) % 360;
  const wob = 3 * Math.sin(2 * Math.PI * 6 * t);
  const carX = 590;
  const bodyTop = 560;
  return (
    <div style={{position: 'absolute', left: CX - R, top: CY - R, width: 2 * R, height: 2 * R, transform: `scale(${s})`, transformOrigin: '50% 50%'}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: '#BFE8FF'}}>
        <svg style={{position: 'absolute', left: 0, top: 0}} width={2 * R} height={2 * R} viewBox={`${CX - R} ${CY - R} ${2 * R} ${2 * R}`}>
          {/* hills + road scrolling left */}
          <path d={`M ${CX - R} 600 Q ${CX - 120} 520 ${CX + 20} 600 T ${CX + 320} 600 L ${CX + R} 760 L ${CX - R} 760 Z`} fill="#8CD46A" stroke={INK} strokeWidth={8} />
          <rect x={CX - R} y={655} width={2 * R} height={120} fill="#8C8C8C" stroke={INK} strokeWidth={8} />
          {Array.from({length: 5}, (_, i) => {
            const x = CX + R - (((t * 1400) + i * 170) % (2 * R + 200));
            return <rect key={i} x={x} y={700} width={90} height={14} rx={7} fill="#FFFFFF" />;
          })}
          {/* car back: roof arch */}
          <path d={`M ${carX - 120} ${bodyTop} Q ${carX - 110} ${bodyTop - 300} ${carX + 60} ${bodyTop - 300} Q ${carX + 200} ${bodyTop - 300} ${carX + 240} ${bodyTop}`} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
          <path d={`M ${carX - 120} ${bodyTop} Q ${carX - 110} ${bodyTop - 300} ${carX + 60} ${bodyTop - 300} Q ${carX + 200} ${bodyTop - 300} ${carX + 240} ${bodyTop}`} fill="none" stroke="#E84A3A" strokeWidth={14} strokeLinecap="round" />
        </svg>
        {/* the guy, arm out of the window */}
        <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${carX - 20 - (CX - R)}px, ${bodyTop - 150 + bob - (CY - R)}px) rotate(${wob}deg)`, transformOrigin: '0 0'}}>
          <Img src={F('ride')} style={{position: 'absolute', left: -head[0] * gs, top: -head[1] * gs, width: p.w * gs, height: p.h * gs}} />
        </div>
        <svg style={{position: 'absolute', left: 0, top: 0}} width={2 * R} height={2 * R} viewBox={`${CX - R} ${CY - R} ${2 * R} ${2 * R}`}>
          {/* car body (in front of the guy) */}
          <path d={`M ${carX - 280} ${bodyTop + 10} Q ${carX - 290} ${bodyTop - 8} ${carX - 240} ${bodyTop - 8} L ${carX + 240} ${bodyTop - 8} Q ${carX + 300} ${bodyTop} ${carX + 300} ${bodyTop + 60} L ${carX + 300} ${bodyTop + 110} L ${carX - 290} ${bodyTop + 110} Z`} fill="#E84A3A" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <path d={`M ${carX - 280} ${bodyTop + 50} L ${carX + 300} ${bodyTop + 50}`} stroke="#B9342A" strokeWidth={10} />
          <rect x={carX + 250} y={bodyTop + 18} width={34} height={22} rx={6} fill="#FFE27A" stroke={INK} strokeWidth={6} />
          {[carX - 170, carX + 170].map((wx) => (
            <g key={wx} transform={`translate(${wx} ${bodyTop + 112}) rotate(${wheel})`}>
              <circle r={52} fill="#2B2B2B" stroke={INK} strokeWidth={8} />
              <circle r={22} fill="#C8C8C8" stroke={INK} strokeWidth={6} />
              <line x1={-22} x2={22} y1={0} y2={0} stroke={INK} strokeWidth={5} />
            </g>
          ))}
          {/* wind lines pushing the hand back */}
          {Array.from({length: 6}, (_, i) => {
            const yy = 380 + i * 30;
            const ph = (t * 2.4 + rnd(i)) % 1;
            const x0 = carX - 200 - 420 * ph;
            return (
              <g key={i}>
                <path d={`M ${x0} ${yy} l 110 0`} stroke={INK} strokeWidth={16} strokeLinecap="round" />
                <path d={`M ${x0} ${yy} l 110 0`} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{position: 'absolute', inset: -12, borderRadius: '50%', border: '14px solid #000', boxSizing: 'border-box'}} />
    </div>
  );
};

// ---------- the sound ----------
const CUES: Cue[] = [
  {f: 'chirps', at: T.fortynine + 0.05, db: -21},
  ...Array.from({length: N_SAT}, (_, i): Cue => ({f: 'pop', at: POP_T(i), db: -27 + (i % 2), rate: 0.9 + 0.05 * (i % 5)})),
  {f: 'swoop', at: T.climbing - 0.2, db: -28},
  {f: 'flip', at: 4.98, db: -21},
  {f: 'zoomaway', at: 5.05, db: -27},
  {f: 'sneeze', at: SNEEZE - 0.66, db: -17},
  {f: 'whoosh', at: SNEEZE + 0.15, db: -27},
  {f: 'pop', at: HIT, db: -17, rate: 0.75},
  {f: 'gust', at: 8.7, db: -30, dur: 1.3, keys: [[8.7, -30], [9.6, -30], [10.0, -60]]},
  {f: 'sizzle', at: T.heats, db: -30, dur: 1.0, keys: [[T.heats, -30], [T.heats + 0.6, -30], [T.heats + 1.0, -60]]},
  {f: 'puffup', at: T.puffs - 0.05, db: -15},
  {f: 'gust', at: T.so2 + 0.05, db: -22},
  {f: 'gust', at: 16.4, db: -24, rate: 0.9},
  {f: 'pop', at: BUB[0], db: -22},
  {f: 'swoop', at: BUB[0] + 0.2, db: -24},
  {f: 'pop', at: BUB[1] - 0.15, db: -27, rate: 1.2},
  {f: 'button', at: PRESS - 0.05, db: -12},
  {f: 'whoosh', at: EDGE0, db: -27, rate: 1.2},
  {f: 'sad_horn', at: T.work + 0.02, db: -19, dur: 0.86, keys: [[T.work, -19], [T.work + 0.6, -19], [T.work + 0.86, -50]]},
  {f: 'stamp', at: T.thirty, db: -19},
  ...DIVE0.map((d, i): Cue => ({f: 'streak', at: d + 0.25, db: i % 2 ? -21 : -18, rate: [1, 1.08, 0.94, 1.12, 0.9, 1.04][i]})),
  {f: 'pop', at: T.so3 + 0.02, db: -23},
  {f: 'streak', at: 26.55, db: -27, rate: 1.15},
  {f: 'twinkle', at: T.wish + 0.05, db: -15},
  {f: 'pop', at: NEW_STAGE, db: -22, rate: 0.85},
  {f: 'chirps', at: NEW_STAGE + 0.12, db: -23, rate: 1.1},
];

// ---------- the scene ----------
const poseAt = (t: number) => {
  let i = 0;
  for (let k = 0; k < SWAP.length; k++) if (t >= SWAP[k][0]) i = k;
  return {n: SWAP[i][1], tSwap: SWAP[i][0], next: SWAP[i + 1]?.[0] ?? 999};
};

export const SceneAt: React.FC<{t: number; coverCam?: Cam; cover?: boolean; poseOverride?: SprName}> = ({t, coverCam, cover = false, poseOverride}) => {
  const cam = coverCam ?? camOf(t);
  const k = cam.k;
  const sw = 7 / Math.min(k, 1.2) * 0.9;
  // guy
  const pose0 = poseAt(t);
  const pose = poseOverride ? {n: poseOverride, tSwap: -9, next: 999} : pose0;
  let sq: [number, number] = [1, 1];
  const nextSq = squashSwap(t, pose.next);
  const curSq = squashSwap(t, pose.tSwap);
  sq = t >= pose.next - 0.08 ? nextSq : curSq;
  const br = breathe(t);
  const jig = pose.n === 'press' ? 1 - 0.05 * bump(t, PRESS, 0.18) : 1;
  const tremble = pose.n === 'cheeks' ? 1.5 * Math.sin(2 * Math.PI * 11 * t) : 0;
  const wave = pose.n === 'wave' ? 4 * Math.sin(2 * Math.PI * 1.6 * t) : 0;
  const sat = Array.from({length: N_SAT}, (_, i) => ({i, ...satState(t, i)})).filter((x) => !cover || x.i === N_SAT - 1);
  const stageAway = io(prog(t, 4.95, 6.6));
  const stageOld = t < 6.6;
  const newStage = t >= NEW_STAGE - 0.05;
  const stageScale = newStage ? pop(t, NEW_STAGE, 0.3) : 1;
  const [sx0, sy0] = polar(STAGE_R, STAGE_TH);
  const stX = newStage ? sx0 : sx0 - 700 * stageAway;
  const stY = newStage ? sy0 : sy0 - 900 * stageAway;
  const stRot = STAGE_TH + 90 - (newStage ? 0 : 40 * stageAway);
  const stP = sp('stage');
  // stack slices still on the (old or new) stage
  const stack: number[] = [];
  for (let i = 0; i < N_SAT; i++) {
    const slice = N_SAT - 1 - i;
    if (newStage) stack.push(slice);
    else if (t < POP_T(i)) stack.push(slice);
  }
  // sun moods
  const inhale = prog(t, SNEEZE - 0.55, SNEEZE - 0.05);
  const sunSq = t < SNEEZE - 0.05 ? 1 + 0.08 * Math.sin(Math.PI * 0.5 * inhale) * (inhale > 0 ? 1 : 0) : 1 - 0.12 * Math.exp(-5 * (t - SNEEZE + 0.05)) * Math.cos(2 * Math.PI * 3 * (t - SNEEZE + 0.05));
  const sunMood: SunMood = t < SNEEZE - 0.55 ? 'calm' : t < SNEEZE - 0.05 ? 'sleep' : t < SNEEZE + 0.35 ? 'squeeze' : 'happy';
  // labels
  const lab49 = popOut(t, T.fortynine, T.but - 0.05, 0.25);
  const labDay = popOut(t, 4.98, T.weak + 0.3, 0.25);
  const lab38 = popOut(t, T.thirty, T.so3 - 0.05, 0.25);
  const orbitO = 1 - prog(t, 4.6, 5.2);
  const [ox, oy] = polar(ORBIT_R + 40, -76);
  // wish stars (world, behind the guy's head in the close-up)
  const wishStars: [number, number, number, number, number, number][] = [
    [-520, -1210, 260, -1020, 26.45, 0.8],
    [-260, -1300, 560, -1110, 26.95, 0.75],
    [-640, -1050, 120, -900, 27.3, 0.7],
  ];
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      {/* far: the space plate (painted), slow parallax */}
      <World cam={{x: cam.x * 0.15, y: cam.y * 0.15, k: 1}} depth={1}>
        <Img src={F('space')} style={{position: 'absolute', left: -1064, top: -1706, width: 2048, height: 3072}} />
      </World>
      <World cam={cam}>
        <Svg>
          <defs>
            <radialGradient id="sunglow">
              <stop offset="55%" stopColor="#FFE38A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FFE38A" stopOpacity={0} />
            </radialGradient>
          </defs>
          <SunBody x={SUN_X} y={SUN_Y} r={SUN_R} sw={sw} t={t} mood={sunMood} look={[0.55, 0.6]} squash={sunSq} />
          {/* target orbit */}
          {orbitO > 0.01 ? (
            <circle r={ORBIT_R} fill="none" stroke="#FFFFFF" strokeOpacity={0.75 * orbitO} strokeWidth={10} strokeDasharray="44 34" strokeLinecap="round" />
          ) : null}
          <AirShell t={t} k={k} />
          <HeatSquiggles t={t} sw={sw} />
          <StormPuff t={t} sw={sw} />
        </Svg>
        {orbitO > 0.01 ? (
          <div style={{position: 'absolute', left: ox, top: oy, transform: `translate(-50%, -50%) rotate(14deg) scale(${pop(t, 0.3, 0.3) * orbitO})`, fontFamily: FONT, fontSize: 64, color: '#FFFFFF', WebkitTextStroke: '13px #000', paintOrder: 'stroke fill'}}>ORBIT</div>
        ) : null}
        {/* flame tails behind the burning satellites */}
        <Svg>
          {sat.map((s) => (s.tail > 0.01 ? <FlameTail key={s.i} x={s.x} y={s.y} ang={s.vang} s={s.tail} t={t + s.i} /> : null))}
          {sat.map((s) => {
            const d = diverOrder(N_SAT - 1 - s.i);
            if (d < 0) return null;
            const t0 = DIVE0[d] + 1.0;
            const u = prog(t, t0, t0 + 0.9);
            if (u <= 0 || u >= 1) return null;
            const j = N_SAT - 1 - s.i;
            const [x0, y0] = polar(RE + 120, slotTh(j) + 14);
            const [x1, y1] = polar(RE + 40, slotTh(j) + 40);
            return <Streak key={`s${s.i}`} x0={x0} y0={y0} x1={x1} y1={y1} u={u} w={22} />;
          })}
          {wishStars.map(([x0, y0, x1, y1, t0, d]) => (
            <Streak key={`w${t0}`} x0={x0} y0={y0} x1={x1} y1={y1} u={prog(t, t0, t0 + d)} w={18} />
          ))}
        </Svg>
        {/* the rocket stage + its stack */}
        {stageOld || newStage ? (
          <>
            <Spr n="stage" s={STAGE_S * stageScale} ax={stP.w / 2} ay={stP.h / 2} x={stX} y={stY} rot={stRot} />
            {stack.map((slice) => {
              const [px, py] = polar(STAGE_R + STAGE_H / 2 + 16 + 24 * slice * stageScale, STAGE_TH);
              const dx = px - sx0;
              const dy = py - sy0;
              return (
                <Sat key={`st${slice}`} x={stX + dx * stageScale} y={stY + dy * stageScale} rot={stRot} sx={0.7 * stageScale} sy={0.36 * stageScale} mood="happy" t={t} i={slice} />
              );
            })}
          </>
        ) : null}
        {/* satellites */}
        {sat.map((s) => (s.vis ? <Sat key={s.i} x={s.x} y={s.y} rot={s.rot} sx={s.sx} sy={s.sy} mood={moodAt(t, N_SAT - 1 - s.i)} t={t} i={s.i} burn={s.burn} sweat={s.sweat} /> : null))}
        {/* Earth + the guy */}
        <Svg>
          <EarthBody r={RE} sw={sw} spin={0} />
          <ellipse cx={GX} cy={GY + 4} rx={95} ry={16} fill="rgba(20, 40, 20, 0.28)" />
        </Svg>
        <Guy n={pose.n} x={GX} y={GY} rot={GROT + tremble * 0.3 + wave * 0.2} sx={sq[0]} sy={sq[1] * br * jig} />
        <Svg>
          {SWAP.filter(([ts, n], idx) => idx > 0 && CHAIR.has(n) !== CHAIR.has(SWAP[idx - 1][1])).map(([ts]) => (
            <Poof key={ts} t={t} t0={ts} x={GX} y={GY} sw={sw} />
          ))}
          {/* a little breeze passes the guy ("we barely feel it") */}
          {t > 8.6 && t < 10.2
            ? Array.from({length: 3}, (_, i) => {
                const u = prog(t, 8.65 + 0.18 * i, 9.75 + 0.18 * i);
                if (u <= 0 || u >= 1) return null;
                const x = lerp(-420, 420, u);
                const y = GY - 170 - 60 * i + 18 * Math.sin(u * 9);
                const s = Math.sin(Math.PI * u);
                const d = `M ${x - 70 * s} ${y} q 30 -14 60 0 t 60 0`;
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke={INK} strokeWidth={sw * 3} strokeLinecap="round" />
                    <path d={d} fill="none" stroke="#fff" strokeWidth={sw * 1.4} strokeLinecap="round" />
                  </g>
                );
              })
            : null}
          {cover ? null : <AirFace t={t} sw={sw} />}
          <WindLines t={t} t0={T.so2} t1={T.work + 0.35} sw={sw} cx={160} cy={-1400} W={1500} Hh={420} speed={1500} />
        </Svg>
      </World>
      {/* screen-space labels + the car bubble */}
      {cover ? null : (
        <>
      <Label x={300} y={300} s={lab49}>
        <MiniSat size={100} />
        49
      </Label>
      <Label x={640} y={150} s={labDay} size={92} rot={2} color="#FFFFFF">
        NEXT DAY
      </Label>
      <Label x={300} y={300} s={lab38} color="#FF7A3D" size={120}>
        <MiniFlame size={120} t={t} />
        38
      </Label>
      <CarBubble t={t} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const SatelliteStormShort: React.FC = () => {
  useSatFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <SceneAt t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('satellite-storm/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('satellite-storm/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="satellite-storm/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
