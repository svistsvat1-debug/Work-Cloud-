import React from 'react';
import {AbsoluteFill} from 'remotion';
import beats from './beats.json';

export const FPS60 = 60;
export const T = beats.T;
export const DUR = beats.duration;

// ---------- palette (matches part 1 of the channel) ----------
export const INK = '#151515';
export const OL = 9;
export const C = {
  white: '#FFFFFF',
  whiteShade: '#E3E9F1',
  black: '#212126',
  red: '#E61E2B',
  beak: '#95ADC2',
  beakShade: '#7890A6',
  feet: '#8E939B',
  trunk: '#A3622F',
  trunkDark: '#87501F',
  grain: '#5E3415',
  skyTop: '#76BEFF',
  skyBottom: '#C4E6FF',
  hillFar: '#86CB68',
  hillMid: '#5DB548',
  hillNear: '#4A9E37',
  leaf: '#58992D',
  leafDark: '#467F22',
  brain: '#FFAEC8',
  brainShade: '#F28DB0',
  brainLine: '#DE7299',
  blush: '#FF8FB1',
  xray: '#CBE7FA',
  xrayLine: '#8DC4EA',
  clump: '#6E3B8C',
  clumpLight: '#8E59AE',
  helmet: '#D7263D',
  helmetShade: '#B51C30',
  mask: '#A3ACB6',
  football: '#8D4A21',
  footballDark: '#6E3815',
  star: '#FFD23F',
  sweat: '#8AC7FF',
  chip: '#E6CCA4',
  wall: '#F3DFBC',
  wallShade: '#E8CFA6',
  wainscot: '#C58A55',
  wainscotDark: '#A9713F',
  shelf: '#9C5F32',
  shelfDark: '#7C4722',
  glass: '#DDF0F8',
  liquid: '#F2E7A4',
  liquidDark: '#E5D684',
  lid: '#5A6470',
  paper: '#FFF7E3',
  rope: '#C7243A',
  brass: '#E0B44C',
  bird: '#1E1E23',
  birdShoulder: '#E3262E',
  birdYellow: '#F7C531',
  birdBeak: '#3B3F47',
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
