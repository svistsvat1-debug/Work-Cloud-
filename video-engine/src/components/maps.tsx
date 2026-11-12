import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {markerPath, Pt, seedOf} from '../lib/sketch';
import {C, FONT_LABEL} from '../lib/theme';
import {popScale, prog} from '../lib/timing';
import {Drawing, Stroke} from './primitives';
import {MarkerFill} from './marker';

export type LL = [number, number]; // lon, lat

export const FRANCE: LL[] = [
  [2.55, 51.08], [1.85, 50.95], [1.6, 50.7], [1.6, 50.2], [1.08, 49.92], [0.1, 49.5], [-0.3, 49.33], [-1.25, 49.4], [-1.27, 49.68],
  [-1.62, 49.65], [-1.95, 49.72], [-1.6, 49.2], [-1.5, 48.66], [-2.0, 48.65], [-3.0, 48.82], [-4.75, 48.4], [-4.7, 48.0], [-3.4, 47.7],
  [-2.2, 47.25], [-1.15, 46.15], [-1.1, 45.55], [-1.25, 44.65], [-1.55, 43.45], [0.5, 42.8], [1.8, 42.45], [3.15, 42.45], [3.9, 43.5],
  [5.35, 43.3], [5.95, 43.1], [7.25, 43.7], [7.5, 43.78], [6.9, 44.4], [7.0, 45.3], [6.1, 46.2], [6.6, 46.9], [7.55, 47.55], [7.6, 48.1],
  [7.8, 48.6], [8.2, 48.97], [6.7, 49.15], [6.0, 49.45], [4.8, 49.8], [4.2, 49.95], [3.2, 50.7], [2.6, 50.8],
];

export const BRITAIN: LL[] = [
  [1.35, 51.13], [1.4, 51.4], [1.75, 52.6], [0.3, 52.95], [0.1, 53.6], [-0.1, 54.1], [-0.6, 54.5], [-1.4, 55.0], [-2.0, 55.8], [-3.0, 56.0],
  [-2.1, 57.1], [-1.8, 57.5], [-3.2, 57.7], [-3.1, 58.4], [-3.4, 58.65], [-5.0, 58.6], [-5.2, 57.9], [-6.2, 57.3], [-5.9, 56.5], [-5.7, 55.4],
  [-4.7, 55.5], [-4.9, 54.7], [-3.5, 54.95], [-3.6, 54.4], [-3.0, 53.4], [-4.3, 53.4], [-4.6, 53.3], [-4.1, 52.6], [-5.3, 51.9], [-3.9, 51.6],
  [-3.2, 51.45], [-3.4, 51.2], [-4.2, 51.2], [-5.7, 50.05], [-5.2, 49.95], [-4.1, 50.35], [-3.5, 50.45], [-2.45, 50.6], [-1.3, 50.75],
  [-0.1, 50.8], [0.25, 50.73], [0.97, 50.92],
];

export const BELGIUM_LUX: LL[] = [
  [2.55, 51.09], [3.37, 51.37], [4.25, 51.37], [5.0, 51.48], [5.85, 51.15], [5.7, 50.75], [6.1, 50.65], [6.4, 50.32], [6.13, 50.13],
  [6.5, 49.8], [6.36, 49.47], [5.8, 49.5], [5.4, 49.62], [4.85, 49.8], [4.85, 50.15], [4.15, 49.98], [3.9, 50.35], [3.2, 50.75], [2.6, 50.8],
];

export type Proj = (ll: LL) => Pt;
export const makeProj = (lonMin: number, latMax: number, ky: number, x0: number, y0: number, lat0 = 47): Proj => {
  const kx = ky * Math.cos((lat0 * Math.PI) / 180);
  return ([lon, lat]) => [x0 + (lon - lonMin) * kx, y0 + (latMax - lat) * ky];
};

export const Land: React.FC<{outline: LL[]; proj: Proj; at: number; dur?: number; fill?: string; seed?: number}> = ({outline, proj, at, dur = 30, fill = C.land, seed = 3}) => {
  const parts = useMemo(() => [{pts: outline.map(proj), closed: true, fill, amp: 1.5, w: 6}], [outline, proj, fill]);
  return <Drawing parts={parts} at={at} dur={dur} fillDur={10} seed={seed} />;
};

export const Dot: React.FC<{p: Pt; at: number; label?: string; color?: string; dx?: number; dy?: number; size?: number; r?: number}> = ({p, at, label, color = C.red, dx = 18, dy = -14, size = 40, r = 11}) => {
  const f = useCurrentFrame();
  const s = popScale(f, at, 8);
  if (s <= 0) return null;
  return (
    <g>
      <circle cx={p[0]} cy={p[1]} r={r * s} fill={color} stroke={C.ink} strokeWidth={4} />
      {label ? (
        <text x={p[0] + dx} y={p[1] + dy} fontFamily={FONT_LABEL} fontSize={size} fill={C.ink} opacity={prog(f, at + 4, 6)} textAnchor={dx < 0 ? 'end' : 'start'}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

export const Path: React.FC<{lls: LL[]; proj: Proj; at: number; dur?: number; color?: string; w?: number; dash?: boolean}> = ({lls, proj, at, dur = 20, color = C.blue, w = 7}) => {
  const d = useMemo(() => markerPath(lls.map(proj), false, seedOf('path', lls[0][0], lls[0][1]), 1.2), [lls, proj]);
  return <Stroke d={d} at={at} dur={dur} color={color} w={w} />;
};

// Sea areas (their inland edges are hidden under the land drawn on top)
export const FRANCE_SEA: LL[] = [[-5.2, 51.0], [-3.6, 51.25], [-1.8, 51.1], [0.0, 51.05], [1.4, 51.35], [2.4, 51.3], [2.6, 51.12], [1.7, 50.6], [0.5, 49.9], [-0.5, 49.2], [-0.5, 44.2], [-1.2, 43.35], [-2.2, 43.5], [-3.1, 44.3], [-3.9, 45.4], [-4.9, 46.6], [-5.5, 47.6], [-5.75, 48.6], [-5.6, 49.6]];
export const BRITAIN_SEA: LL[] = [[-5.6, 59.1], [-3.0, 59.15], [-1.2, 58.2], [-0.9, 56.8], [0.4, 55.2], [1.2, 53.9], [2.2, 52.9], [2.3, 51.6], [1.6, 50.8], [0.0, 50.35], [-2.5, 50.1], [-4.8, 49.65], [-6.3, 49.85], [-6.0, 51.2], [-5.6, 52.3], [-5.3, 53.4], [-5.6, 54.6], [-6.6, 55.4], [-7.1, 56.6], [-6.8, 57.8]];

export const Sea: React.FC<{lls: LL[]; proj: Proj; at: number; dur?: number}> = ({lls, proj, at, dur = 22}) => {
  const pts = useMemo(() => lls.map(proj), [lls, proj]);
  return <MarkerFill pts={pts} color={C.sea} at={at} dur={dur} shade={0} />;
};
