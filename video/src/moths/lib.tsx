import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

// ---------- math ----------
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const E = {
  lin: (t: number) => t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQ: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  outBack: (t: number) => {
    const c1 = 1.9, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};
export const seg = (t: number, t0: number, t1: number, e: (u: number) => number = E.inOut) => e(clamp((t - t0) / (t1 - t0)));
/** damped spring 0 -> 1 from t0 (overshoots) */
export const spring = (t: number, t0: number, f = 2.2, d = 7) => {
  if (t < t0) return 0;
  const u = t - t0;
  return 1 - Math.exp(-d * u) * Math.cos(2 * Math.PI * f * u);
};
/** decaying wobble that starts at 0 at t0 */
export const wobble = (t: number, t0: number, f = 3, d = 6) => {
  if (t < t0) return 0;
  const u = t - t0;
  return Math.exp(-d * u) * Math.sin(2 * Math.PI * f * u);
};
export const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const deg = (r: number) => (r * 180) / Math.PI;
/** CSS rotation that makes the sprite's UP vector point along (dx, dy) */
export const rotUpTo = (dx: number, dy: number) => deg(Math.atan2(dx, -dy));
/** CSS rotation that makes the sprite's RIGHT vector point along (dx, dy) */
export const rotRightTo = (dx: number, dy: number) => deg(Math.atan2(dy, dx));

// ---------- 2.5D camera ----------
export type Cam = {x: number; y: number; z: number};
export type CamKey = Cam & {t: number; e?: (u: number) => number};
export const camAt = (t: number, keys: CamKey[]): Cam => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const u = (b.e ?? E.inOut)(clamp((t - a.t) / (b.t - a.t)));
      const ka = 1000 / (1000 - a.z), kb = 1000 / (1000 - b.z);
      const k = Math.exp(lerp(Math.log(ka), Math.log(kb), u)); // zoom evenly (log space)
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - 1000 / k};
    }
  }
  return keys[keys.length - 1];
};
export const toScreen = (cam: Cam, z: number, x: number, y: number) => {
  const k = 1000 / (z - cam.z);
  return {x: 540 + (x - cam.x) * k, y: 960 + (y - cam.y) * k, k};
};
/** screen shake = sums of sines times decaying envelopes (never random per-frame jumps) */
export const shake = (t: number, hits: {t: number; a: number; d?: number}[]) => {
  let A = 0;
  for (const h of hits) if (t >= h.t) A += h.a * Math.exp(-(h.d ?? 6) * (t - h.t));
  return {
    x: A * (0.6 * Math.sin(2 * Math.PI * 13.3 * t) + 0.4 * Math.sin(2 * Math.PI * 7.1 * t + 1.3)),
    y: A * (0.55 * Math.sin(2 * Math.PI * 11.7 * t + 0.7) + 0.45 * Math.sin(2 * Math.PI * 5.3 * t + 2.1)),
  };
};

export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children: React.ReactNode}> = ({
  cam, z, blur = 0, minDepth = 250, children,
}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0',
        transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** positioned container in world units; children are drawn in the object's own pixel space (w x h), anchor (ax, ay) */
export const Obj: React.FC<{x: number; y: number; s: number; w: number; h: number; ax: number; ay: number; rot?: number;
  sx?: number; sy?: number; filter?: string; opacity?: number; children: React.ReactNode}> = (p) => (
  <div style={{position: 'absolute', left: p.x, top: p.y, transformOrigin: '0 0', filter: p.filter, opacity: p.opacity,
    transform: `rotate(${p.rot ?? 0}deg) scale(${p.s * (p.sx ?? 1)}, ${p.s * (p.sy ?? 1)}) translate(${-p.ax}px, ${-p.ay}px)`}}>
    <div style={{position: 'relative', width: p.w, height: p.h}}>{p.children}</div>
  </div>
);

export const Pic: React.FC<{src: string; w: number; h: number; style?: React.CSSProperties}> = ({src, w, h, style}) => (
  <Img src={staticFile(`moths/sprites/${src}`)} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, ...style}} />
);

export const INK = '#141414';
