import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, SPACE, useSunFont} from './Short';

// Cover (1080 x 1920): the guy pointing up at the Sun (crosshair on its face) next to his trash rocket + the cover text.
// Rule of three: the guy, the trash rocket (with the Sun it aims at as the setting), the text.
// Text away from the bottom ~20 % and the right edge.
export const SunTrashCover: React.FC = () => {
  useSunFont();
  return (
    <AbsoluteFill style={{background: SPACE}}>
      <Scene t={3.0} cam={{x: 10, y: 1150, k: 1.75}} cover />
      <div
        style={{
          position: 'absolute',
          left: 470,
          top: 965,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 104,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '22px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        55X HARDER
        <br />
        THAN MARS
      </div>
    </AbsoluteFill>
  );
};
