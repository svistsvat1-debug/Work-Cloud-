import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';
import {P, wob, PAL} from './wobble';

export const BOIL = 5; // frames between redraws ("boiling" mouse lines)
export const useBoil = (seed: number) => seed + (Math.floor(useCurrentFrame() / BOIL) % 3) * 101;

type ShapeProps = {
  pts: P[]; closed?: boolean; fill?: string; at: number; draw?: number;
  sw?: number; color?: string; amp?: number; seed?: number; noStroke?: boolean;
};

// outline drawn on fast (mouse stroke), then flat "paint bucket" fill pops in
export const PShape: React.FC<ShapeProps> = ({pts, closed = true, fill, at, draw = 8, sw = 7, color = PAL.black, amp = 2.2, seed = 1, noStroke}) => {
  const f = useCurrentFrame();
  const s = useBoil(seed);
  if (f < at) return null;
  const d = wob(pts, closed, s, amp);
  const p = draw <= 0 ? 1 : interpolate(f, [at, at + draw], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const filled = fill && f >= at + draw;
  return (
    <g>
      {filled ? <path d={d} fill={fill} stroke="none" /> : null}
      {noStroke ? null : (
        <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      )}
    </g>
  );
};

// a plain line (arms, legs, cracks)
export const PLine: React.FC<Omit<ShapeProps, 'closed' | 'fill'>> = (p) => <PShape {...p} closed={false} />;

// Paint "text tool": the whole word pops in at once
export const PText: React.FC<{
  x: number; y: number; at: number; size: number; color?: string; children: string;
  font?: 'hand' | 'bang'; anchor?: 'start' | 'middle' | 'end'; rot?: number; outline?: string;
}> = ({x, y, at, size, color = PAL.black, children, font = 'hand', anchor = 'start', rot = 0, outline}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = interpolate(f, [at, at + 2, at + 5], [1.25, 0.95, 1], {extrapolateRight: 'clamp'});
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${k})`}>
      <text x={0} y={0} textAnchor={anchor} fontSize={size}
        fontFamily={font === 'hand' ? 'PatrickHand' : 'Bangers'} fill={color}
        stroke={outline} strokeWidth={outline ? size * 0.09 : 0} paintOrder="stroke" strokeLinejoin="round">
        {children}
      </text>
    </g>
  );
};

// pop-in wrapper for a whole group (scale overshoot around its pivot)
export const Pop: React.FC<{at: number; x: number; y: number; children: React.ReactNode}> = ({at, x, y, children}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = interpolate(f, [at, at + 3, at + 6], [0.6, 1.08, 1], {extrapolateRight: 'clamp'});
  return <g transform={`translate(${x},${y}) scale(${k}) translate(${-x},${-y})`}>{children}</g>;
};
