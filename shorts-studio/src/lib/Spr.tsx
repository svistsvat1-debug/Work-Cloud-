import React from 'react';
import {Img, staticFile} from 'remotion';
import {S} from '../phages/sprites';

/** A cut-out picture placed in world space. (ax, ay) = pivot in sprite pixels, put at world (x, y);
 * rotation and squash happen about that pivot. Children are SVG in sprite-pixel coordinates (faces, sweat...). */
export const Spr: React.FC<{
  name: string;
  x: number;
  y: number;
  ax: number;
  ay: number;
  s: number;
  sx?: number;
  sy?: number;
  rot?: number;
  flip?: boolean;
  children?: React.ReactNode;
}> = ({name, x, y, ax, ay, s, sx = 1, sy = 1, rot = 0, flip = false, children}) => {
  const m = S[name];
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `rotate(${rot}deg) scale(${s * sx * (flip ? -1 : 1)}, ${s * sy}) translate(${-ax}px, ${-ay}px)`,
        }}
      >
        <Img src={staticFile(m.src)} style={{position: 'absolute', left: 0, top: 0, width: m.w, height: m.h}} />
        {children ? (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={m.w} height={m.h}>
            {children}
          </svg>
        ) : null}
      </div>
    </div>
  );
};
