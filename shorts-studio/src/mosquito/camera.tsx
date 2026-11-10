import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, easeInOutCubic, lerp} from './util';

export type Cam = {x: number; y: number; z: number};
export type Ease = (u: number) => number;
export type CamKey = {t: number; x: number; y: number; z: number; ease?: Ease};

const F = 1000;
const kOf = (z: number) => F / (F - z);
const zOf = (k: number) => F - F / k;

/**
 * Piecewise camera. Between two keys x/y follow the segment ease, the zoom (scale k)
 * is interpolated in log space so dollies feel even. Holds are perfectly still.
 */
export const camAt = (keys: CamKey[], t: number): Cam => {
  if (t <= keys[0].t) return {x: keys[0].x, y: keys[0].y, z: keys[0].z};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      const ease = b.ease ?? easeInOutCubic;
      const u = ease(clamp((t - a.t) / (b.t - a.t)));
      const k = Math.exp(lerp(Math.log(kOf(a.z)), Math.log(kOf(b.z)), u));
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: zOf(k)};
    }
  }
  const l = keys[keys.length - 1];
  return {x: l.x, y: l.y, z: l.z};
};

/** A flat layer at depth z. Scale k = F / (z - cam.z). Blur is in screen px. */
export const Layer: React.FC<{
  cam: Cam;
  z: number;
  blur?: number;
  shake?: {x: number; y: number};
  minDepth?: number;
  children: React.ReactNode;
}> = ({cam, z, blur = 0, shake, minDepth = 250, children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = F / d;
  const sx = shake?.x ?? 0;
  const sy = shake?.y ?? 0;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + sx}px, ${960 + sy}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Place an SVG (or any element) centred on world point (x, y) with rotation/scale. */
export const At: React.FC<{
  x: number;
  y: number;
  rot?: number;
  sx?: number;
  sy?: number;
  children: React.ReactNode;
  z?: number;
}> = ({x, y, rot = 0, sx = 1, sy = 1, children, z}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 0,
      height: 0,
      zIndex: z,
      transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
    }}
  >
    {children}
  </div>
);

/** An SVG drawn in local coords where (0,0) is the anchor; box is [x0, y0, w, h]. */
export const Svg: React.FC<{box: [number, number, number, number]; children: React.ReactNode; style?: React.CSSProperties}> = ({
  box,
  children,
  style,
}) => (
  <svg
    width={box[2]}
    height={box[3]}
    viewBox={box.join(' ')}
    style={{position: 'absolute', left: box[0], top: box[1], overflow: 'visible', ...style}}
  >
    {children}
  </svg>
);

/** Screen shake = sum of sines times an envelope (never random per frame). */
export const shakeAt = (t: number, amp: number) => ({
  x: amp * (0.55 * Math.sin(2 * Math.PI * 13.3 * t) + 0.45 * Math.sin(2 * Math.PI * 7.1 * t + 1.3)),
  y: amp * (0.5 * Math.sin(2 * Math.PI * 11.7 * t + 0.7) + 0.5 * Math.sin(2 * Math.PI * 5.3 * t + 2.1)),
});
