import React from 'react';

// Cartoon sweat drop (SVG): light-blue teardrop with an outline and a white glint. s = pop scale (0 hides it).
export const SweatDrop: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path
        d={`M 0 ${-r * 1.7} C ${r * 0.9} ${-r * 0.4} ${r} ${r * 0.2} 0 ${r} C ${-r} ${r * 0.2} ${-r * 0.9} ${-r * 0.4} 0 ${-r * 1.7} Z`}
        fill="#8FD3FF"
        stroke="#000"
        strokeWidth={r * 0.2}
      />
      <ellipse cx={-r * 0.32} cy={-r * 0.1} rx={r * 0.16} ry={r * 0.3} fill="#fff" />
    </g>
  );
