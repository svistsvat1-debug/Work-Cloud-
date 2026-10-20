import React, {useId} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

/** Whip pan entry with horizontal motion blur. */
export const WhipTransition: React.FC<{from?: 'left' | 'right'; duration?: number; children: React.ReactNode}> = ({
  from = 'right',
  duration = 6,
  children,
}) => {
  const f = useCurrentFrame();
  const id = useId().replace(/:/g, '');
  const p = interpolate(f, [0, duration], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.exp)});
  const x = (1 - p) * 1100 * (from === 'right' ? 1 : -1);
  const blur = (1 - p) * 60;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`, filter: blur > 0.5 ? `url(#whip${id})` : undefined}}>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id={`whip${id}`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>
      {children}
    </AbsoluteFill>
  );
};
