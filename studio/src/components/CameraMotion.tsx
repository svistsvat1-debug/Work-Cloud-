import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

export type Punch = {at: number; strength?: number};

/**
 * Constant handheld micro-motion + shake/zoom punches on key frames.
 * `punches[].at` is in frames relative to this component's timeline.
 */
export const CameraMotion: React.FC<{punches?: Punch[]; idle?: number; children: React.ReactNode}> = ({
  punches = [],
  idle = 1,
  children,
}) => {
  const f = useCurrentFrame();
  let x = (Math.sin(f / 9) * 2.2 + Math.sin(f / 4.3 + 1) * 1.1) * idle;
  let y = (Math.cos(f / 11) * 2.2 + Math.sin(f / 5.1 + 2) * 1.0) * idle;
  let rot = Math.sin(f / 23) * 0.25 * idle;
  let scale = 1;
  for (const p of punches) {
    const d = f - p.at;
    if (d < 0 || d > 14) continue;
    const s = p.strength ?? 1;
    const decay = Math.pow(1 - d / 14, 2);
    x += (random(`px${p.at}-${f}`) - 0.5) * 34 * s * decay;
    y += (random(`py${p.at}-${f}`) - 0.5) * 34 * s * decay;
    rot += (random(`pr${p.at}-${f}`) - 0.5) * 1.6 * s * decay;
    scale += 0.07 * s * Math.exp(-d / 3.5);
  }
  return (
    <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`}}>
      {children}
    </AbsoluteFill>
  );
};
