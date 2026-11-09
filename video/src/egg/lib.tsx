import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SPR} from './sprites';

// ---------- maths ----------
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeOutBack = (t: number, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const linear = (t: number) => t;
// damped spring towards 1 (starts at 0 at t0), overshoots and settles
export const spring = (t: number, t0: number, freq = 3.2, damp = 7) => {
  if (t <= t0) return 0;
  const x = t - t0;
  return 1 - Math.exp(-damp * x) * Math.cos(2 * Math.PI * freq * x);
};
// a decaying wobble that starts at t0 (0 before), e.g. for shakes and settles
export const wobble = (t: number, t0: number, freq = 5, damp = 6) =>
  t < t0 ? 0 : Math.exp(-damp * (t - t0)) * Math.sin(2 * Math.PI * freq * (t - t0));
// pseudo random, stable per index
export const rnd = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- 2.5D multiplane camera ----------
export const F = 1000;
export type Cam = {x: number; y: number; z: number; sy?: number; rot?: number};
export type CamKey = Cam & {t: number; ease?: (u: number) => number};

// piecewise camera; zoom is interpolated in log-scale space relative to depth zRef (even feel)
export const camAt = (t: number, keys: CamKey[], zRef = 1000): Cam => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const u = (b.ease ?? easeInOutCubic)(prog(t, a.t, b.t));
      const ka = Math.log(F / (zRef - a.z)), kb = Math.log(F / (zRef - b.z));
      const k = Math.exp(lerp(ka, kb, u));
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: zRef - F / k,
        sy: lerp(a.sy ?? 0, b.sy ?? 0, u), rot: lerp(a.rot ?? 0, b.rot ?? 0, u)};
    }
  }
  return keys[keys.length - 1];
};

export const kAt = (cam: Cam, z: number) => F / (z - cam.z);
// world point at depth z -> screen px
export const toScreen = (cam: Cam, x: number, y: number, z: number) => {
  const k = kAt(cam, z);
  return [540 + k * (x - cam.x), 960 + (cam.sy ?? 0) + k * (y - cam.y)];
};

export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; shake?: number[];
  children: React.ReactNode}> = ({cam, z, blur = 0, minDepth = 250, shake = [0, 0], children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = F / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformOrigin: '0 0',
        // the tiny extra rotation keeps the transform non-axis-aligned, so Chromium does not snap slow camera
        // moves to whole pixels (that snapping shows up as a 1-px jump every few frames)
        transform: `translate(${540 + shake[0]}px, ${960 + (cam.sy ?? 0) + shake[1]}px) rotate(${(cam.rot ?? 0) + 0.003}deg) ` +
          `scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- sprites ----------
// Draw sprite `name` so that its anchor (sprite px; default = head centre) sits at world (x, y).
// s = world units per sprite px. sx/sy = squash, rot in degrees, all about the pivot (default = anchor).
export const Sprite: React.FC<{name: string; x: number; y: number; s: number; ax?: number; ay?: number;
  px?: number; py?: number; sx?: number; sy?: number; rot?: number; flip?: boolean; opacity?: number;
  filter?: string}> = ({name, x, y, s, ax, ay, px, py, sx = 1, sy = 1, rot = 0, flip = false, opacity = 1, filter}) => {
  const info = SPR[name];
  const axx = ax ?? info.head[0], ayy = ay ?? info.head[1];
  // pivot for squash / rotation / flip, relative to the anchor (sprite px)
  const dx = (px ?? axx) - axx, dy = (py ?? ayy) - ayy;
  // position through transform (sub-pixel) - left/top on an <img> gets snapped to whole layout pixels,
  // which turns slow drifts into 1-px steps every few frames
  return (
    <Img src={staticFile(info.src)} style={{position: 'absolute', left: 0, top: 0, width: info.w,
      height: info.h, maxWidth: 'none', transformOrigin: `${axx}px ${ayy}px`, opacity, filter,
      transform: `translate(${x - axx}px, ${y - ayy}px) scale(${s}) translate(${dx}px, ${dy}px) rotate(${rot}deg) ` +
        `scale(${sx * (flip ? -1 : 1)}, ${sy}) translate(${-dx}px, ${-dy}px)`}} />
  );
};

// a plain image placed by world box (x, y, w, h) through transform, for the same reason as above
export const WorldImg: React.FC<{src: string; x: number; y: number; w: number; h: number; pw: number; ph: number; opacity?: number}> = (
  {src, x, y, w, h, pw, ph, opacity = 1}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: 0, width: pw, height: ph, maxWidth: 'none', opacity,
    transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${w / pw}, ${h / ph})`}} />
);

// world bottom-centre of a sprite's alpha box relative to its head anchor, in world units
export const feetOffset = (name: string, s: number) => {
  const b = SPR[name].box, h = SPR[name].head;
  return [((b[0] + b[2]) / 2 - h[0]) * s, (b[3] - h[1]) * s];
};

// ---------- pose swaps hidden inside motion ----------
export type Swap = {t: number; pose: string; kind?: 'action' | 'turn' | 'pop'; flip?: boolean};
// returns pose, flip and squash (sx, sy) at time t
export const poseAt = (t: number, swaps: Swap[]) => {
  let cur = swaps[0];
  for (const s of swaps) if (t >= s.t) cur = s;
  let sx = 1, sy = 1;
  for (const s of swaps) {
    if (s === swaps[0] && s.t <= 0) continue;
    const kind = s.kind ?? 'action';
    const pre = t - (s.t - 0.09);
    if (kind === 'turn') {
      // squash scaleX to ~0.78 towards the swap, swap at narrowest, open back up
      const d = Math.abs(t - s.t);
      if (d < 0.09) sx *= 0.78 + 0.22 * (d / 0.09);
    } else {
      if (pre >= 0 && t < s.t) {
        const u = pre / 0.09;
        sy *= 1 - 0.07 * Math.sin(u * Math.PI / 2);
        sx *= 1 + 0.05 * Math.sin(u * Math.PI / 2);
      }
      if (t >= s.t) {
        const w = wobble(t, s.t, 3.2, 7) * (kind === 'pop' ? 0.12 : 0.06);
        sy *= 1 + w;
        sx *= 1 - w * 0.7;
      }
    }
  }
  return {pose: cur.pose, flip: !!cur.flip, sx, sy};
};

// ---------- outlined blob helper (merged outline: all ink circles first, then all fills) ----------
export const Puffs: React.FC<{circles: number[][]; fill: string; ink?: string; line?: number; opacity?: number}> = (
  {circles, fill, ink = '#141414', line = 5, opacity = 1}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}} width={1} height={1}>
    {circles.map((c, i) => c[2] > 0 ? <circle key={'i' + i} cx={c[0]} cy={c[1]} r={c[2] + line} fill={ink} /> : null)}
    {circles.map((c, i) => c[2] > 0 ? <circle key={'f' + i} cx={c[0]} cy={c[1]} r={c[2]} fill={c[3] !== undefined ? String(c[3]) : fill} /> : null)}
  </svg>
);

export const Svg: React.FC<{children: React.ReactNode; opacity?: number; style?: React.CSSProperties}> = ({children, opacity = 1, style}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, ...style}} width={1} height={1}>{children}</svg>
);
