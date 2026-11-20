import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SeaScene, FONT, useKitefinFont} from './Short';
import {T} from './scene';

// Cover (1080 x 1920): the glowing kitefin shark with its 'headlights' on, the guy blinded by them, + the cover text.
// Rule of three: the shark, the guy, the text. Text away from the bottom ~20 % and the right edge.
export const KitefinHeadlightsCover: React.FC = () => {
  useKitefinFont();
  return (
    <AbsoluteFill>
      <SeaScene t={T.face + 0.6} cam={{x: 540, y: 1060, k: 1.0}} cover />
      <div
        style={{
          position: 'absolute',
          left: 470,
          top: 360,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 118,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        PART 2:
        <br />
        HEADLIGHTS?
      </div>
    </AbsoluteFill>
  );
};
