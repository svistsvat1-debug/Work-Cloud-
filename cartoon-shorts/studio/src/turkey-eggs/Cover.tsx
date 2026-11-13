import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Field, useTurkeyFont} from './Short';
import {FONT} from './parts';

// Cover (1080 x 1920): the frame-0 premise (the hungry guy with fork + knife, the turkey and its egg, which has just
// noticed him) + the cover text = three things. Text kept away from the bottom ~20 % and the right edge.
export const TurkeyEggsCover: React.FC = () => {
  useTurkeyFont();
  return (
    <AbsoluteFill style={{background: '#90D0F4'}}>
      <Field t={2.5} tr={2.5} shot="A" cam={{x: 975, y: 1480, k: 1.05}} />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 168,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>EGG OR</div>
        <div style={{color: '#FFB347'}}>DINNER?</div>
      </div>
    </AbsoluteFill>
  );
};
