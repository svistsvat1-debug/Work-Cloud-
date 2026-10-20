import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

/** Punch zoom on entry: 'in' rushes toward the camera, 'out' snaps back from close-up. */
export const ZoomTransition: React.FC<{dir?: 'in' | 'out'; duration?: number; children: React.ReactNode}> = ({
  dir = 'in',
  duration = 7,
  children,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, duration], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const from = dir === 'in' ? 0.62 : 1.45;
  const scale = from + (1 - from) * p;
  const blur = (1 - p) * 16;
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, opacity: 0.4 + 0.6 * Math.min(1, p * 2)}}>
      {children}
    </AbsoluteFill>
  );
};
