import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CoverScene, FONT, NAVY, useSVFont} from './Short';

// Cover (1080 x 1920): frame 0's premise - the guy tanning on the beach under the smiling Sun - + the cover text.
// Rule of three: the guy, the Sun, the text (umbrella / castle / bottle hidden). Text away from the bottom ~20 % and the right edge.
export const SunVanishCover: React.FC = () => {
  useSVFont();
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <CoverScene cam={{x: 540, y: 1235, k: 1.25}} />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 640,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '30px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        8 MINUTES
        <br />
        LATE
      </div>
    </AbsoluteFill>
  );
};
