import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Cam} from './anim';

// A world-space layer: 1 world unit = k screen px, camera centre at screen (540, 960).
// `depth` > 1 makes a layer parallax like a farther plane (moves/zooms less).
export const World: React.FC<{cam: Cam; blur?: number; depth?: number; children: React.ReactNode; off?: {x: number; y: number}}> = ({
  cam,
  blur = 0,
  depth = 1,
  off = {x: 0, y: 0},
  children,
}) => {
  const k = cam.k / depth;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + off.x}px, ${960 + off.y}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
