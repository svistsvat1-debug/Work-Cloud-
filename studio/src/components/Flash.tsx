import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../brand';

/** Full-frame flash frames (white or brand yellow) at absolute frames. */
export const Flash: React.FC<{at: {frame: number; color?: 'white' | 'yellow'; length?: number}[]}> = ({at}) => {
  const f = useCurrentFrame();
  const hit = at.find((a) => f >= a.frame && f < a.frame + (a.length ?? 4));
  if (!hit) return null;
  const len = hit.length ?? 4;
  const o = 1 - (f - hit.frame) / len;
  return <AbsoluteFill style={{backgroundColor: hit.color === 'yellow' ? C.yellow : C.white, opacity: 0.85 * o}} />;
};
