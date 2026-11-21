import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BBScene, FONT, useBBFont} from './Short';

// Cover (1080 x 1920): the premise - the eager volunteer next to the IV bag (the doctor beside it) - + the cover text.
// Rule of three: the guy, the IV bag, the text. Text away from the bottom ~20 % and the right edge.
export const ButtBreathCover: React.FC = () => {
  useBBFont();
  return (
    <AbsoluteFill>
      <BBScene t={4.4} cam={{x: 880, y: 1250, k: 1.18}} cover />
      <div
        style={{
          position: 'absolute', left: 500, top: 420, transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT, fontSize: 120, lineHeight: 1.0, textAlign: 'center', color: '#FFE45C',
          WebkitTextStroke: '26px #000', paintOrder: 'stroke fill', whiteSpace: 'nowrap',
        }}
      >
        PART 2:
        <br />
        HUMANS
      </div>
    </AbsoluteFill>
  );
};
