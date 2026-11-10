import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SPR, SprName} from './sprites';

// ---------- maths ----------
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
export const easeSine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u);
/** 0 -> overshoot -> 1 (pop on) */
export const pop = (u: number, over = 1.7) => {
  const x = clamp(u) - 1;
  return 1 + (over + 1) * x * x * x + over * x * x;
};
/** damped spring that starts at 1 and settles at 0 */
export const ring = (tau: number, freq = 5, damp = 7) => (tau < 0 ? 0 : Math.exp(-damp * tau) * Math.cos(2 * Math.PI * freq * tau));

// ---------- camera ----------
export type Cam = {x: number; y: number; k: number};
type Key = Cam & {t: number; ease?: (u: number) => number};
/** piecewise camera; two keys closer than one frame = a hard cut; scale is interpolated in log space */
export const camAt = (keys: Key[], t: number): Cam => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t < b.t) {
      if (b.t - a.t < 0.02) return a;
      const u = (b.ease ?? easeInOut)((t - a.t) / (b.t - a.t));
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u))};
    }
  }
  return keys[keys.length - 1];
};
export const camZ = (cam: Cam) => 1000 - 1000 / cam.k;
/** world point on a depth plane -> screen px */
export const project = (cam: Cam, wx: number, wy: number, z = 1000) => {
  const k = 1000 / (z - camZ(cam));
  return {x: 540 + k * (wx - cam.x), y: 960 + k * (wy - cam.y), k};
};

export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children: React.ReactNode}> = ({
  cam,
  z,
  blur = 0,
  minDepth = 300,
  children,
}) => {
  const d = z - camZ(cam);
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- sprites ----------
export type Pose = {sx?: number; sy?: number; rot?: number; flip?: boolean; dx?: number; dy?: number};
/** a cut-out drawn with its anchor (feet / head / centre) at world (x, y); squash and lean pivot about `pivot` */
export const Sprite: React.FC<{n: SprName; x: number; y: number; pose?: Pose; pivot?: {x: number; y: number}; scale?: number}> = ({
  n,
  x,
  y,
  pose = {},
  pivot,
  scale = 1,
}) => {
  const s = SPR[n];
  const {sx = 1, sy = 1, rot = 0, flip = false, dx = 0, dy = 0} = pose;
  const px = pivot ? pivot.x : s.ax;
  const py = pivot ? pivot.y : s.ay;
  return (
    <Img
      src={staticFile(s.file)}
      style={{
        position: 'absolute',
        left: x - s.ax + dx,
        top: y - s.ay + dy,
        width: s.w,
        height: s.h,
        transformOrigin: `${px}px ${py}px`,
        transform: `rotate(${rot}deg) scale(${(flip ? -1 : 1) * sx * scale}, ${sy * scale})`,
      }}
    />
  );
};

export const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - w * 0.07,
      width: w,
      height: w * 0.14,
      borderRadius: '50%',
      background: `rgba(30, 44, 22, ${0.3 * o})`,
      filter: 'blur(3px)',
    }}
  />
);

// ---------- pose motion ----------
/** breathing about the feet */
export const breathe = (t: number, phase = 0, amp = 0.009) => 1 + amp * Math.sin(2 * Math.PI * 0.6 * t + phase);
/** squash before a swap at ts, stretch and settle after it. Returns scale factors. */
export const actionSwap = (t: number, ts: number, amt = 1) => {
  const pre = prog(t, ts - 0.12, ts);
  if (t < ts) return {sx: 1 + 0.045 * amt * easeIn(pre), sy: 1 - 0.065 * amt * easeIn(pre)};
  const r = ring(t - ts, 4.2, 8);
  return {sx: 1 - 0.035 * amt * r, sy: 1 + 0.05 * amt * r};
};
/** turn: narrow about the vertical axis, swap on the narrowest frame */
export const turnSwap = (t: number, ts: number) => {
  const d = Math.abs(t - ts);
  const u = 1 - clamp(d / 0.1);
  return {sx: 1 - 0.22 * easeSine(u), sy: 1 + 0.03 * easeSine(u)};
};
export const mul = (...ps: Pose[]): Pose =>
  ps.reduce(
    (a, b) => ({
      sx: (a.sx ?? 1) * (b.sx ?? 1),
      sy: (a.sy ?? 1) * (b.sy ?? 1),
      rot: (a.rot ?? 0) + (b.rot ?? 0),
      flip: a.flip !== b.flip && (a.flip || b.flip) ? true : false,
      dx: (a.dx ?? 0) + (b.dx ?? 0),
      dy: (a.dy ?? 0) + (b.dy ?? 0),
    }),
    {},
  );
