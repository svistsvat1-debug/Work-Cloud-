import React, {useId} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

const CHANNELS = {
  r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  g: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  b: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
};

/**
 * RGB-split + slice displacement glitch.
 * Plays on entry (first `duration` frames) and optionally again at `hits` (local frames).
 */
export const GlitchTransition: React.FC<{duration?: number; intensity?: number; hits?: number[]; children: React.ReactNode}> = ({
  duration = 8,
  intensity = 1,
  hits = [],
  children,
}) => {
  const f = useCurrentFrame();
  const id = useId().replace(/:/g, '');
  const starts = [0, ...hits];
  const active = starts.map((s) => f - s).find((d) => d >= 0 && d < duration);
  if (active === undefined) return <AbsoluteFill>{children}</AbsoluteFill>;

  const p = 1 - active / duration;
  const d = 26 * p * intensity * (0.6 + random(`g${f}`) * 0.8);
  const bands = 6;
  const layer = (ch: keyof typeof CHANNELS, dx: number, clip?: string, key?: string) => (
    <AbsoluteFill
      key={key ?? ch}
      style={{
        filter: `url(#${ch}${id})`,
        transform: `translateX(${dx}px)`,
        mixBlendMode: 'screen',
        clipPath: clip,
      }}
    >
      {children}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{isolation: 'isolate'}}>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        {Object.entries(CHANNELS).map(([k, v]) => (
          <filter key={k} id={`${k}${id}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={v} />
          </filter>
        ))}
      </svg>
      {layer('r', d)}
      {layer('b', -d)}
      {Array.from({length: bands}).map((_, i) => {
        const top = (i / bands) * 100;
        const shift = random(`s${f}-${i}`) > 0.55 ? (random(`o${f}-${i}`) - 0.5) * 120 * p * intensity : 0;
        return layer('g', shift, `inset(${top}% 0 ${100 - top - 100 / bands}% 0)`, `g${i}`);
      })}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(0deg, rgba(255,255,255,${0.06 * p}) 0px, rgba(255,255,255,${0.06 * p}) 2px, transparent 2px, transparent 6px)`,
        }}
      />
    </AbsoluteFill>
  );
};
