import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CloseScene, FONT, useSLFont} from './Short';
import {T} from './scene';

// Cover (1080 x 1920): the premise - the bearded pilot gapes at the dripping sandwich that just opened its eyes, fresh - + the
// cover text. Rule of three: the pilot, the sandwich, the text. Text away from the bottom ~20 % and the right edge.
export const SunkenLunchCover: React.FC = () => {
  useSLFont();
  return (
    <AbsoluteFill>
      <CloseScene t={T.fresh + 0.55} cam={{x: 205, y: -560, k: 2.0}} />
      <div
        style={{
          position: 'absolute',
          left: 510,
          top: 300,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 158,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{color: '#FFE45C'}}>10 MONTHS</span>
        <br />
        LATER
      </div>
    </AbsoluteFill>
  );
};
