import React from 'react';
import {AbsoluteFill} from 'remotion';
import beats from './beats.json';

export const FPS60 = 60;
export const T = beats.T;
export const DUR = beats.duration;

// ---------- palette (flat cartoon, thick black outlines like the rest of the channel)
export const INK = '#151515';
export const OL = 8;
export const C = {
  wall: '#EBCB93',
  wallShade: '#DDB679',
  wallDark: '#C49557',
  ceiling: '#22406F',
  ceilingStar: '#F4C542',
  fBlue: '#2F6DB5',
  fRed: '#C2412D',
  fGreen: '#3E9A6A',
  fYellow: '#E9B23A',
  skin: '#C9693B',
  skinShade: '#A9532B',
  hair: '#1F1A17',
  kilt: '#FBF6EA',
  kiltShade: '#E2D6BC',
  sash: '#2F6DB5',
  sand: '#E2AA5C',
  sandShade: '#CB9148',
  sandDot: '#B97E39',
  sandWet: '#BC864C',
  sandWetDark: '#A06E3A',
  wood: '#9C5D2F',
  woodShade: '#7D4521',
  woodLight: '#B97640',
  rope: '#D8B46E',
  ropeShade: '#B08A4C',
  stone: '#DCC291',
  stoneShade: '#C3A671',
  stoneDark: '#A88B57',
  stoneWig: '#6B5A49',
  jar: '#BC5A32',
  jarShade: '#97421F',
  jarLight: '#DA7A4C',
  water: '#5CC4F2',
  waterLight: '#BDEBFF',
  waterDeep: '#2E95D0',
  pillar: '#8A5A32',
  pillarShade: '#6E4424',
  pillarLight: '#A46D3F',
  flame: '#FF8A2B',
  flameMid: '#FFB43F',
  flameCore: '#FFE68C',
  white: '#FFFFFF',
  eyeWhite: '#FFFFFF',
  blush: '#FF8FB1',
  sweat: '#8AC7FF',
  star: '#FFD23F',
  red: '#E5383B',
  green: '#3BB273',
  yellow: '#F2C230',
  // lab
  labWall: '#DCEAF4',
  labWallShade: '#C8DCEB',
  labTile: '#BCD2E4',
  shelf: '#B07A48',
  shelfShade: '#8E5E33',
  table: '#C48249',
  tableShade: '#9E6433',
  tableTop: '#D79A5F',
  glass: '#E4F5FF',
  glassLine: '#9CC7E2',
  metal: '#9AA5B1',
  metalShade: '#7D8894',
  metalLight: '#C6CED7',
  coat: '#F4F7FA',
  coatShade: '#D3DCE6',
  head: '#FFFFFF',
  headShade: '#E3E9F1',
  shirt: '#7FB2E5',
  tie: '#E5383B',
  gaugeFace: '#FFFDF5',
  gaugeRim: '#4E5965',
  ice: '#D3F2FF',
  iceShade: '#A4DDF4',
  mud: '#8C5B35',
  mudDark: '#6F4426',
  bubble: '#FFFFFF',
  flaskBlue: '#7FD0F2',
  flaskGreen: '#8FE08A',
  flaskPink: '#FF9EC4',
};

// ---------- math / easing ----------
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
export const easeOutBack = (u: number, s = 1.9) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
/** damped spring response to a step at t0: 0 -> 1 with overshoot */
export const springStep = (t: number, t0: number, freq = 3.2, damp = 5.5) => {
  if (t <= t0) return 0;
  const x = t - t0;
  return 1 - Math.exp(-damp * x) * Math.cos(2 * Math.PI * freq * x);
};
/** damped impulse (0 at t0, swings, settles to 0) */
export const wobble = (t: number, t0: number, freq = 4, damp = 6) => {
  if (t < t0) return 0;
  const x = t - t0;
  return Math.exp(-damp * x) * Math.sin(2 * Math.PI * freq * x);
};
/** pop scale: 0 -> overshoot -> 1 over dur */
export const popIn = (t: number, t0: number, dur = 0.28) => (t < t0 ? 0 : t > t0 + dur ? 1 : easeOutBack(prog(t, t0, t0 + dur), 2.4));
/** pop out: 1 -> 1.15 -> 0 */
export const popOut = (t: number, t0: number, dur = 0.2) => {
  if (t < t0) return 1;
  const u = prog(t, t0, t0 + dur);
  return u < 0.35 ? lerp(1, 1.15, u / 0.35) : lerp(1.15, 0, easeIn((u - 0.35) / 0.65));
};
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- camera ----------
export type Cam = {x: number; y: number; z: number};
export type CamKey = {t: number; x: number; y: number; z: number; ease?: (u: number) => number};

/** piecewise camera; scale interpolated in log space so zooms feel even */
export const camAt = (keys: CamKey[], t: number): Cam => {
  if (t <= keys[0].t) return {x: keys[0].x, y: keys[0].y, z: keys[0].z};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      if (b.t === a.t) return {x: b.x, y: b.y, z: b.z};
      const u = (b.ease ?? easeInOut)(prog(t, a.t, b.t));
      const ka = 1000 / (1000 - a.z);
      const kb = 1000 / (1000 - b.z);
      const k = Math.exp(lerp(Math.log(ka), Math.log(kb), u));
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - 1000 / k};
    }
  }
  const l = keys[keys.length - 1];
  return {x: l.x, y: l.y, z: l.z};
};

export const Layer: React.FC<{
  cam: Cam;
  z: number;
  blur?: number;
  minDepth?: number;
  shake?: [number, number];
  children: React.ReactNode;
}> = ({cam, z, blur = 0, minDepth = 300, shake = [0, 0], children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + shake[0]}px, ${960 + shake[1]}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {children}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/** screen shake from sums of sines times an amplitude */
export const shakeXY = (t: number, amp: number): [number, number] => [
  amp * (0.6 * Math.sin(2 * Math.PI * 13.3 * t) + 0.4 * Math.sin(2 * Math.PI * 7.1 * t + 1.3)),
  amp * (0.55 * Math.sin(2 * Math.PI * 11.7 * t + 0.7) + 0.45 * Math.sin(2 * Math.PI * 5.9 * t + 2.1)),
];

/** sum of decaying impact bumps */
export const impactAmp = (t: number, hits: {t: number; a: number}[], decay = 9) =>
  hits.reduce((s, h) => (t >= h.t ? s + h.a * Math.exp(-decay * (t - h.t)) : s), 0);

// ---------- drawing helpers
/** thick limb with merged outline: ink stroke underneath, colour stroke on top */
export const Limb: React.FC<{d: string; w: number; fill: string; ol?: number}> = ({d, w, fill, ol = OL}) => (
  <>
    <path d={d} fill="none" stroke={INK} strokeWidth={w + 2 * ol} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
);
/** periodic over the whole video so frame 0 == last frame (loop-safe background motion) */
export const loopSin = (t: number, cycles: number, phase = 0) => Math.sin((2 * Math.PI * cycles * t) / DUR + phase);
export type P2 = [number, number];
export const rot = (p: P2, deg: number): P2 => {
  const a = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};
export const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
/** a two-segment limb from a to b with the joint pushed sideways by bend (px, + = right of a->b) */
export const bentPath = (a: P2, b: P2, bend: number) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const jx = mx + (-dy / L) * bend;
  const jy = my + (dx / L) * bend;
  return `M${a[0]},${a[1]} Q${jx},${jy} ${b[0]},${b[1]}`;
};
export const blinkAt = (t: number, times: number[], w = 0.07) => {
  for (const b of times) {
    const d = Math.abs(t - b);
    if (d < w) return 1 - d / w;
  }
  return 0;
};
export const swapSquash = (t: number, at: number, w = 0.08, depth = 0.24) => 1 - depth * Math.max(0, 1 - Math.abs(t - at) / w);
