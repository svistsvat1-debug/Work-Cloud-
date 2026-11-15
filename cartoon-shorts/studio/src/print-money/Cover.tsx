import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, usePMFont} from './Short';

// Cover (1080 x 1920): the shocked guy + the baker's price board (200,000,000,000 MARKS) + the cover text.
// Text away from the bottom ~20 % and the right edge.
export const PrintMoneyCover: React.FC = () => {
  usePMFont();
  return (
    <AbsoluteFill style={{background: '#99C5EF'}}>
      <Scene t={19.75} cam={{x: 1110, y: -560, k: 0.81}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 130,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        FOR 1
        <br />
        BREAD?
      </div>
    </AbsoluteFill>
  );
};
