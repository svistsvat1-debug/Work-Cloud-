import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, useBmFont} from './Short';

// Cover (1080 x 1920): the guy pushing the brick building on its rollers (windows full of operators)
// + the cover text = three things. Text kept away from the bottom ~20 % and the right edge.
export const BuildingMoveCover: React.FC = () => {
  useBmFont();
  return (
    <AbsoluteFill style={{background: '#9AD3F1'}}>
      <Scene t={13.9} tr={13.9} cam={{x: 690, y: 470, k: 0.9}} cover />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 300,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 138,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>600 PEOPLE</div>
        <div style={{color: '#FFD23F'}}>INSIDE</div>
      </div>
    </AbsoluteFill>
  );
};
