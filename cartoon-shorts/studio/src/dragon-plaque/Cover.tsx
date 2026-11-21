import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DragonScene, FONT, useDragonFont} from './Short';

// Cover (1080 x 1920): the premise of frame 0 - the skull at the bottom of the well - + the cover text.
// Rule of three: the well, the skull (with its eyes), the text. Text away from the bottom ~20 % and the right edge.
export const DragonPlaqueCover: React.FC = () => {
  useDragonFont();
  return (
    <AbsoluteFill style={{backgroundColor: '#5E412F'}}>
      <DragonScene t={0.1} />
      <div
        style={{
          position: 'absolute', left: 500, top: 330, transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT, fontSize: 128, lineHeight: 1.0, textAlign: 'center', color: '#FFE45C',
          WebkitTextStroke: '26px #000', paintOrder: 'stroke fill', whiteSpace: 'nowrap',
        }}
      >
        SOLVED BY
        <br />
        TOOTH GUNK
      </div>
    </AbsoluteFill>
  );
};
