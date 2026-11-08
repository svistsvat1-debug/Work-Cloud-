import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {S, SpriteName} from './sprites';

// ---------------------------------------------------------------- maths
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export type Ease = (u: number) => number;
export const linear: Ease = (u) => u;
export const easeInOut: Ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut: Ease = (u) => 1 - Math.pow(1 - u, 3);
export const easeIn: Ease = (u) => u * u * u;
export const easeOutBack: Ease = (u) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
export const easeInBack: Ease = (u) => 2.7 * u * u * u - 1.7 * u * u;

/** damped spring response: 0 at dt=0 -> settles at 1, overshooting. */
export const springTo = (dt: number, freq = 3, damp = 7) =>
  dt <= 0 ? 0 : 1 - Math.exp(-damp * dt) * Math.cos(2 * Math.PI * freq * dt);
/** damped kick: 0 -> 1 peak quickly -> oscillates back to 0. */
export const kick = (dt: number, freq = 4, damp = 8) =>
  dt <= 0 ? 0 : Math.exp(-damp * dt) * Math.sin(2 * Math.PI * freq * dt);

/** piecewise keyframes: [[t, v, ease-into-this-key?], ...] */
export type Key = [number, number, Ease?];
export const keys = (t: number, ks: Key[]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1];
      const [t1, v1, e] = ks[i];
      return lerp(v0, v1, (e ?? easeInOut)(seg(t, t0, t1)));
    }
  }
  return ks[ks.length - 1][1];
};

/** pop-in scale: 0 -> overshoot -> 1 (dur s), optional pop-out (shrink) at `out`. */
export const popScale = (t: number, at: number, dur = 0.3, out?: number, outDur = 0.22) => {
  if (t < at) return 0;
  let s = easeOutBack(seg(t, at, at + dur));
  if (out !== undefined && t > out) s *= 1 - easeInBack(seg(t, out, out + outDur));
  return Math.max(0, s);
};

/** smooth pseudo-noise (sum of sines) - never random per frame. */
export const wob = (t: number, seed = 0, f = 1) =>
  Math.sin(t * 2.1 * f + seed * 1.7) * 0.6 + Math.sin(t * 3.7 * f + seed * 4.1) * 0.3 + Math.sin(t * 7.3 * f + seed * 2.3) * 0.1;

// ---------------------------------------------------------------- camera / multiplane
export type Cam = {x: number; y: number; z: number};
export type CamKey = {t: number; x: number; y: number; k: number; e?: Ease};
/** camera keys use the zoom k of the Z=1000 plane; zoom is interpolated in log space. */
export const camAt = (t: number, ks: CamKey[]): Cam => {
  let a = ks[0];
  let b = ks[0];
  let u = 0;
  if (t <= ks[0].t) {
    a = b = ks[0];
  } else if (t >= ks[ks.length - 1].t) {
    a = b = ks[ks.length - 1];
  } else {
    for (let i = 1; i < ks.length; i++) {
      if (t <= ks[i].t) {
        a = ks[i - 1];
        b = ks[i];
        u = (b.e ?? easeInOut)(seg(t, a.t, b.t));
        break;
      }
    }
  }
  const k = Math.exp(lerp(Math.log(a.k), Math.log(b.k), u));
  return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - 1000 / k};
};

export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children?: React.ReactNode}> = ({
  cam,
  z,
  blur = 0,
  minDepth = 250,
  children,
}) => {
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
          transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- sprites
export type P = [number, number];
type SprProps = {
  n: SpriteName;
  at: P; // world position of the anchor
  a?: P | string; // anchor in sprite px (or the name of an anchor)
  s: number; // scale (world px per sprite px)
  rot?: number; // deg
  flip?: boolean;
  sx?: number;
  sy?: number;
  o?: number;
  children?: React.ReactNode; // SVG overlays in sprite px (viewBox = sprite size)
  under?: React.ReactNode;
};
export const anchor = (n: SpriteName, a?: P | string): P => {
  const sp = S[n] as unknown as Record<string, number[]> & {w: number; h: number};
  if (!a) return [sp.w / 2, sp.h / 2];
  if (typeof a === 'string') return [sp[a][0], sp[a][1]];
  return a;
};
export const Spr: React.FC<SprProps> = ({n, at, a, s, rot = 0, flip = false, sx = 1, sy = 1, o = 1, children, under}) => {
  const sp = S[n];
  const [ax, ay] = anchor(n, a);
  if (o <= 0 || s <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: sp.w,
        height: sp.h,
        transformOrigin: '0 0',
        opacity: o,
        transform: `translate(${at[0]}px, ${at[1]}px) rotate(${rot}deg) scale(${(flip ? -1 : 1) * s * sx}, ${s * sy}) translate(${-ax}px, ${-ay}px)`,
      }}
    >
      {under ? (
        <svg width={sp.w} height={sp.h} viewBox={`0 0 ${sp.w} ${sp.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {under}
        </svg>
      ) : null}
      <Img src={staticFile(`bees/s/${n}.png`)} style={{position: 'absolute', left: 0, top: 0, width: sp.w, height: sp.h}} />
      {children ? (
        <svg width={sp.w} height={sp.h} viewBox={`0 0 ${sp.w} ${sp.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {children}
        </svg>
      ) : null}
    </div>
  );
};

/** world point of a sprite anchor after placement (no rotation support needed for most uses). */
export const placed = (n: SpriteName, at: P, a: P | string | undefined, s: number, which: P | string, flip = false, rot = 0): P => {
  const [ax, ay] = anchor(n, a);
  const [px, py] = anchor(n, which);
  let dx = (px - ax) * s * (flip ? -1 : 1);
  let dy = (py - ay) * s;
  if (rot) {
    const r = (rot * Math.PI) / 180;
    const c = Math.cos(r);
    const si = Math.sin(r);
    [dx, dy] = [dx * c - dy * si, dx * si + dy * c];
  }
  return [at[0] + dx, at[1] + dy];
};

/** a world-space SVG for code-drawn effects inside a Layer. */
export const WSvg: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

/** screen shake from sums of sines times an envelope (never random jumps). */
export const shakeAt = (t: number, hits: {at: number; amp: number; dur?: number}[]) => {
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const dt = t - h.at;
    const dur = h.dur ?? 0.35;
    if (dt < 0 || dt > dur) continue;
    const e = h.amp * Math.pow(1 - dt / dur, 2);
    x += e * (Math.sin(dt * 2 * Math.PI * 13.3) * 0.7 + Math.sin(dt * 2 * Math.PI * 7.1 + 1) * 0.3);
    y += e * (Math.sin(dt * 2 * Math.PI * 11.7 + 2) * 0.6 + Math.sin(dt * 2 * Math.PI * 5.3) * 0.4);
  }
  return [x, y] as P;
};
