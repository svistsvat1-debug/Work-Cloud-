import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MarsScene, FONT, useMrmFont} from './Short';

// Cover (1080 x 1920): the premise - the little Mars helicopter hovering, the engineer watching - + the cover text.
// Rule of three: the helicopter, the guy, the text (the RULE sign is hidden). Text away from the bottom ~20 % and the right edge.
export const MarsRotorMachCover: React.FC = () => {
  useMrmFont();
  return (
    <AbsoluteFill>
      <MarsScene t={1.2} cam={{x: 600, y: 1080, k: 1.12}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 300,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 130,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        PAST
        <br />
        MACH 1?
      </div>
    </AbsoluteFill>
  );
};
