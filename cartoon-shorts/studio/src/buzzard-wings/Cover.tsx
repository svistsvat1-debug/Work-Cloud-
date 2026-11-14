import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, SKY, useBuzzFont} from './Short';

// Cover (1080 x 1920): the man hanging under the tipping glider + the cover text (rule of three: man + glider, text,
// the wind cloud is the cause and stays small). Text kept away from the bottom ~20 % and the right edge.
export const BuzzardWingsCover: React.FC = () => {
  useBuzzFont();
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={5.9} cam={{x: 470, y: 520, k: 1.45}} />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 250,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 132,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        JUST
        <br />
        TWIST IT?
      </div>
    </AbsoluteFill>
  );
};
