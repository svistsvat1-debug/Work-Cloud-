import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, useVpFont} from './Short';

// Cover (1080 x 1920): the guy + the bell tower standing on its sleeping poles in the mud (one object: the tower on its
// foundation) + the cover text = three things. Text kept away from the bottom ~20 % and the right edge.
export const VenicePilesCover: React.FC = () => {
  useVpFont();
  return (
    <AbsoluteFill style={{background: '#9BD2F1'}}>
      <Scene t={1.0} tr={1.0} cam={{x: 560, y: 760, k: 1.12}} />
      <div
        style={{
          position: 'absolute',
          left: 430,
          top: 300,
          transform: 'translate(-50%, -50%) rotate(-5deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>UNDER</div>
        <div style={{color: '#FFD23F'}}>THE MUD?</div>
      </div>
    </AbsoluteFill>
  );
};
