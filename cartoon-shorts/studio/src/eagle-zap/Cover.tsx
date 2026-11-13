import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, Scene, useEagleFont} from './Short';

// Cover (1080 x 1920): the eagle on the pole top with its wings on both wires (sparks) + the guy's shocked close-up
// + the cover text = three things. Text kept away from the bottom ~20 % and the right edge.
export const EagleZapCover: React.FC = () => {
  useEagleFont();
  return (
    <AbsoluteFill style={{background: '#90D0F4'}}>
      <Scene t={14.45} tr={14.45} cam={{x: 819, y: 640, k: 1.0}} />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 250,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 138,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>6-FOOT</div>
        <div style={{color: '#FFD43B'}}>WINGS</div>
      </div>
    </AbsoluteFill>
  );
};
