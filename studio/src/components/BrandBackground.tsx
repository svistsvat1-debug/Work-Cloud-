import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C} from '../brand';

/** Dark premium background: drifting yellow glow, parallax grid, film grain, vignette. */
export const BrandBackground: React.FC<{glow?: number; flipGlow?: boolean}> = ({glow = 1, flipGlow}) => {
  const f = useCurrentFrame();
  const gx = 30 + Math.sin(f / 70) * 12;
  const gy = (flipGlow ? 70 : 28) + Math.cos(f / 90) * 8;
  const grain = Math.floor(f / 2);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,230,0,${0.13 * glow}) 0%, rgba(255,230,0,0) 45%),
            radial-gradient(circle at ${100 - gx}% ${100 - gy}%, rgba(255,255,255,${0.05 * glow}) 0%, rgba(255,255,255,0) 40%),
            linear-gradient(180deg, ${C.bg2} 0%, ${C.bg} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)',
          backgroundSize: '120px 120px',
          backgroundPosition: `${(f * 0.6) % 120}px ${(f * 1.1) % 120}px`,
          maskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)',
        }}
      />
      <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'screen'}}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(random(grain) * 1000)} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)'}} />
    </AbsoluteFill>
  );
};
