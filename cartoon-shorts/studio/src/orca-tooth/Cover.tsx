import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ShoreScene, FONT, useOrcaFont} from './Short';

// Cover (1080 x 1920): the premise - the scientist with his magnifier at the killer whale's tooth slice, its growth rings
// glowing with bomb carbon except the first one - + the cover text. Rule of three: the scientist, the tooth slice, the text.
// Text away from the bottom ~20 % and the right edge.
export const OrcaToothCover: React.FC = () => {
  useOrcaFont();
  return (
    <AbsoluteFill>
      <ShoreScene t={14.2} cam={{x: 515, y: 1135, k: 1.32}} cover />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 122,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        OLDER THAN
        <br />
        THE BOMBS
      </div>
    </AbsoluteFill>
  );
};
