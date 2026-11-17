import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FarmScene, FONT, useBNFont} from './Short';

// Cover (1080 x 1920): the premise - the farm owner on his field, the bomb asleep deep under it (cutaway) - + the cover
// text. Rule of three: the farmer, the bomb, the text. Text away from the bottom ~20 % and the right edge.
export const BuriedNukeCover: React.FC = () => {
  useBNFont();
  return (
    <AbsoluteFill>
      <FarmScene t={17.0} cam={{x: 880, y: 1500, k: 0.93}} cover />
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 880,
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
        DON&apos;T
        <br />
        DIG HERE
      </div>
    </AbsoluteFill>
  );
};
