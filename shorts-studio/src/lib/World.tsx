import React from 'react';
import {AbsoluteFill} from 'remotion';
import {easeInOutCubic, Ease, inv, lerp} from './anim';

// 2.5D multiplane camera: a layer at depth Z is scaled by k = F / (Z - cam.z), F = 1000.
// At cam (540, 960, 0) a layer at Z 1000 shows 1 world px as 1 screen px.
export type Cam = {x: number; y: number; z: number};
export const F = 1000;
export const kOf = (z: number, layerZ = 1000) => F / (layerZ - z);

export type Shot = {t0: number; t1: number; to: Cam; ease?: Ease};

/** piecewise camera: holds are perfectly still, moves ease, scale is interpolated in log space */
export function camAt(t: number, start: Cam, shots: Shot[]): Cam {
  let cur = start;
  for (const s of shots) {
    if (t >= s.t1) {
      cur = s.to;
      continue;
    }
    if (t <= s.t0) break;
    const e = (s.ease ?? easeInOutCubic)(inv(s.t0, s.t1, t));
    const k0 = kOf(cur.z);
    const k1 = kOf(s.to.z);
    const k = Math.exp(lerp(Math.log(k0), Math.log(k1), e));
    return {x: lerp(cur.x, s.to.x, e), y: lerp(cur.y, s.to.y, e), z: 1000 - F / k};
  }
  return cur;
}

export const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 300) return null;
  const k = F / d;
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

/** an SVG in world coordinates (draws outside its 1x1 box) */
export const WorldSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
    {children}
  </svg>
);
