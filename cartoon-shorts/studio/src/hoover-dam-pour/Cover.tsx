import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, useHdFont} from './Short';

// Cover (1080 x 1920): the frame-0 premise (the mixer truck pouring the canyon full + the guy pointing at it)
// + the cover text = three things. Text kept away from the bottom ~20 % and the right edge.
export const HooverDamPourCover: React.FC = () => {
  useHdFont();
  return (
    <AbsoluteFill style={{background: '#A9D8F2'}}>
      <Scene t={2.32} tr={2.32} cam={{x: 1395, y: 245, k: 1.04}} cover />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 270,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 140,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>125 YEARS</div>
        <div style={{color: '#FFD23F'}}>TO COOL</div>
      </div>
    </AbsoluteFill>
  );
};
