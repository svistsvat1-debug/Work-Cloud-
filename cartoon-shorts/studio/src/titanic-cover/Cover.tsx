import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DeckScene, FONT, NIGHT, useTCFont} from './Short';

// Cover (1080 x 1920): the premise - the Titanic hunter holding the TOP SECRET (nuclear) folder while he dreams of the
// Titanic - + the cover text. Rule of three: the guy (with the folder), the Titanic dream, the text. The officer is left out.
// Text away from the bottom ~20 % and the right edge.
export const TitanicCoverCover: React.FC = () => {
  useTCFont();
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      <DeckScene t={2.6} cam={{x: 330, y: 1330, k: 1.5}} cover />
      <div
        style={{
          position: 'absolute',
          left: 470,
          top: 300,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        12 DAYS
        <br />
        LEFT
      </div>
    </AbsoluteFill>
  );
};
