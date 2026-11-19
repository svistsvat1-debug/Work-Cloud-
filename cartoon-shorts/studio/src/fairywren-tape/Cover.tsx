import React from 'react';
import {AbsoluteFill} from 'remotion';
import {NetScene, FONT, useFWTFont} from './Short';

// Cover (1080 x 1920): the premise - the scientist with binoculars beside his mist net, the tiny male fairy-wren diving
// at the net with an orange strip of plastic tape streaming from his beak - + the cover text. Rule of three: the
// scientist, the bird with the tape, the text (the female is left out). Text away from the bottom ~20 % and the right edge.
export const FairywrenTapeCover: React.FC = () => {
  useFWTFont();
  return (
    <AbsoluteFill>
      <NetScene t={1.2} cam={{x: 565, y: 1010, k: 1.2}} cover />
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 128,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        NOT A PETAL
      </div>
    </AbsoluteFill>
  );
};
