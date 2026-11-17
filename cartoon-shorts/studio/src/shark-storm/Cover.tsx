import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BayScene, FONT, NAVY, useSHSFont} from './Short';

// Cover (1080 x 1920): frame 0's premise - the guy on the dock listening to the tagged baby sharks in the shallow bay -
// + the cover text. Rule of three: the guy, the baby sharks, the text. Text away from the bottom ~20 % and the right edge.
export const SharkStormCover: React.FC = () => {
  useSHSFont();
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <BayScene t={1.9} cam={{x: 640, y: 1010, k: 1.04}} noSign />
      <div
        style={{
          position: 'absolute',
          left: 745,
          top: 400,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 112,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        BABY
        <br />
        SHARKS
        <br />
        KNEW
      </div>
    </AbsoluteFill>
  );
};
