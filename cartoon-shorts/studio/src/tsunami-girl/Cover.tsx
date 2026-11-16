import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneWithShake, FONT, useTGFont} from './Short';

// Cover (1080 x 1920): the girl on the beach + the fizzing sea with eyes + the cover text.
// Rule of three: the girl, the sea (with its face), the text. Text away from the bottom ~20 % and the right edge.
export const TsunamiGirlCover: React.FC = () => {
  useTGFont();
  return (
    <AbsoluteFill style={{background: '#70C5FD'}}>
      <SceneWithShake t={5.6} cam={{x: 180, y: -330, k: 1.32}} cover />
      <div
        style={{
          position: 'absolute',
          left: 470,
          top: 360,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 170,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '30px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        FIZZY SEA?
      </div>
    </AbsoluteFill>
  );
};
