import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CoverScene, FONT, NAVY, useDDFont} from './Short';

// Cover (1080 x 1920): frame 0's premise - the steel ball hanging under the gasoline float just below the surface,
// the two crew in the window - + the cover text. Rule of three: the crew (in the window), the craft, the text.
// Text away from the bottom ~20 % and the right edge.
export const DeepDiveCover: React.FC = () => {
  useDDFont();
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <CoverScene />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 470,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 160,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '30px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        ZERO
        <br />
        PHOTOS?
      </div>
    </AbsoluteFill>
  );
};
