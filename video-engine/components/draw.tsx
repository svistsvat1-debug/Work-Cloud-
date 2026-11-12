import React, {useMemo} from 'react';
import {spring} from 'remotion';
import {C, FPS} from './theme';
import {Pt, Stroke, wobble, toPath, polyLen, scribble, bbox, closedPath, hashStr} from './rough';

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 2.4);
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};
export const prog = (f: number, a: number, d: number) => clamp01((f - a) / Math.max(1, d));

// pop-in with overshoot
export const pop = (f: number, inF: number, damping = 11) =>
  f < inF ? 0 : spring({frame: f - inF, fps: FPS, config: {damping, stiffness: 170, mass: 0.7}});

// fade-out when an element leaves the board
export const outAlpha = (f: number, outF?: number) => (outF === undefined ? 1 : 1 - prog(f, outF, 9));

// split one progress value across strokes in drawing order, by length
export function seqP(lens: number[], p: number): number[] {
  const tot = lens.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return lens.map((l) => {
    const a = acc / tot;
    acc += l;
    const b = acc / tot;
    return clamp01((p - a) / Math.max(1e-6, b - a));
  });
}

export const PathDraw: React.FC<{d: string; p: number; color: string; w: number; opacity?: number}> = ({d, p, color, w, opacity = 1}) => {
  if (p <= 0.002) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - Math.min(1, p)}
      opacity={opacity}
    />
  );
};

export type Fill = {pts: Pt[]; color: string; gap?: number; angle?: number; solid?: boolean};
export type Geo = {strokes: Stroke[]; fills?: Fill[]; thin?: Stroke[]};

let clipCounter = 0;

// A drawn object: scribble fills under wobbly marker outlines.
export const Drawn: React.FC<{
  geo: Geo;
  seed: number;
  p: number; // outline progress
  fp: number; // fill progress
  color?: string;
  w?: number;
  amp?: number;
}> = ({geo, seed, p, fp, color = C.ink, w = 5, amp = 2}) => {
  const m = useMemo(() => {
    const strokes = geo.strokes.map((s, i) => {
      const pts = wobble(s.pts, seed + i * 97, amp, !!s.closed);
      return {d: toPath(pts), len: polyLen(pts)};
    });
    const thin = (geo.thin || []).map((s, i) => {
      const pts = wobble(s.pts, seed + 5000 + i * 31, amp * 0.6, !!s.closed);
      return {d: toPath(pts), len: polyLen(pts)};
    });
    const fills = (geo.fills || []).map((fl, i) => {
      const b = bbox(fl.pts);
      const gap = fl.gap ?? Math.max(9, Math.min(16, Math.min(b.w, b.h) / 4));
      const sc = scribble(b.x, b.y, b.w, b.h, seed + 777 + i, gap, fl.angle ?? -0.6);
      return {clip: closedPath(fl.pts), d: toPath(sc), color: fl.color, gap, solid: fl.solid, id: `clp${(clipCounter++).toString(36)}`};
    });
    return {strokes, thin, fills};
  }, [geo, seed, amp]);
  const ps = seqP(m.strokes.map((s) => s.len), p);
  const ts = seqP(m.thin.map((s) => s.len), p);
  return (
    <g>
      {m.fills.map((fl) =>
        fp > 0.002 ? (
          <g key={fl.id}>
            <defs>
              <clipPath id={fl.id}>
                <path d={fl.clip} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${fl.id})`}>
              {fl.solid ? <path d={fl.clip} fill={fl.color} opacity={0.35 * clamp01(fp * 1.5)} /> : null}
              <PathDraw d={fl.d} p={fp} color={fl.color} w={fl.gap * 0.95} opacity={0.92} />
            </g>
          </g>
        ) : null,
      )}
      {m.thin.map((s, i) => (
        <PathDraw key={'t' + i} d={s.d} p={ts[i]} color={color} w={w * 0.55} />
      ))}
      {m.strokes.map((s, i) => (
        <PathDraw key={'s' + i} d={s.d} p={ps[i]} color={color} w={w} />
      ))}
    </g>
  );
};

export const seedOf = (s: string) => hashStr(s) % 100000;
