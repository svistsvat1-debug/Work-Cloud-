import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, usePWFont} from './Short';

// Cover (1080 x 1920): the guy next to the tub of mealworms under the foam mountain + the cover text.
// Rule of three: the guy, the foam mountain on the worm tub, the text. Text away from the bottom ~20 % and the right edge.
export const PlasticWormsCover: React.FC = () => {
  usePWFont();
  return (
    <AbsoluteFill style={{background: '#83CCFA'}}>
      <Scene t={4.2} cam={{x: 70, y: -380, k: 1.2}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 470,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 120,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        1 PILL
        <br />
        A DAY?
      </div>
    </AbsoluteFill>
  );
};
