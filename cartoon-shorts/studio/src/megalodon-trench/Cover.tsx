import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, SceneAt, useMGTFont} from './Short';

// Cover (1080 x 1920): frame 0's premise - the megalodon above the open trench - + the cover text.
// Rule of three: the megalodon, the trench, the text. Text away from the bottom ~20 % and the right edge.
export const MegalodonTrenchCover: React.FC = () => {
  useMGTFont();
  return (
    <AbsoluteFill style={{background: '#0B1838'}}>
      <SceneAt t={0.55} />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 400,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 132,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        ZERO
        <br />
        SHARKS?
      </div>
    </AbsoluteFill>
  );
};
