import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, G, SKY, useOwlFont} from './Short';

// Cover (1080 x 1920): the guy covering his ears + the train whose roof arm howls + the cover text = three things.
// Text kept away from the bottom ~20 % and the right edge.
export const OwlPantographCover: React.FC = () => {
  useOwlFont();
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={7.85} cam={{x: 40000 - 620, y: G - 260, k: 1.3}} cover />
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 300,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        TOO LOUD?
      </div>
    </AbsoluteFill>
  );
};
