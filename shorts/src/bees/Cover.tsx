import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ShotA} from './BeesSting';
import {INK} from './fx';

// Cover / thumbnail: the "uh-oh" bee stuck in the hand + two short lines (title stays the question).
const Line: React.FC<{text: string; y: number; size: number; color: string; rot?: number}> = ({text, y, size, color, rot = 0}) => (
  <g transform={`translate(540 ${y}) rotate(${rot})`}>
    <text textAnchor="middle" dominantBaseline="central" fontFamily="Inter" fontWeight={900} fontSize={size} fill={INK} stroke={INK} strokeWidth={size * 0.2} strokeLinejoin="round" dx={8} dy={10}>
      {text}
    </text>
    <text textAnchor="middle" dominantBaseline="central" fontFamily="Inter" fontWeight={900} fontSize={size} fill={color} stroke={INK} strokeWidth={size * 0.13} strokeLinejoin="round" paintOrder="stroke">
      {text}
    </text>
  </g>
);

export const BeesCover: React.FC = () => (
  <AbsoluteFill>
    <ShotA t={6.45} />
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <Line text="ONE STING" y={225} size={150} color="#FFFFFF" rot={-3} />
      <Line text="= GAME OVER" y={385} size={128} color="#FFD84A" rot={-3} />
    </svg>
  </AbsoluteFill>
);
