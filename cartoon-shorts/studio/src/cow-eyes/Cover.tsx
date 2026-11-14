import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CoverScene, FONT, useCowFont} from './Short';

// Cover (1080 x 1920): the cow with painted eyes on her butt + the sneaking lion + the cover text = three things.
// Text kept away from the bottom ~20 % and the right edge.
export const CowEyesCover: React.FC = () => {
  useCowFont();
  return (
    <AbsoluteFill>
      <CoverScene />
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 360,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 128,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        LION-PROOF?
      </div>
    </AbsoluteFill>
  );
};
