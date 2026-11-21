import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LapalmaScene, FONT, useLapalmaFont} from './Short';

// Cover (1080 x 1920): the premise - lava pouring toward the beach town, the terrified guy - + the cover text.
// Rule of three: the lava (with the volcano), the guy, the text. Text away from the bottom ~20 % and the right edge.
export const LapalmaGasCover: React.FC = () => {
  useLapalmaFont();
  return (
    <AbsoluteFill>
      <LapalmaScene t={1.9} cam={{x: 560, y: 820, k: 1.5}} cover />
      <div
        style={{
          position: 'absolute', left: 470, top: 300, transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT, fontSize: 118, lineHeight: 1.02, textAlign: 'center', color: '#FFE45C',
          WebkitTextStroke: '24px #000', paintOrder: 'stroke fill', whiteSpace: 'nowrap',
        }}
      >
        LOCKED OUT
        <br />
        2 YEARS
      </div>
    </AbsoluteFill>
  );
};
