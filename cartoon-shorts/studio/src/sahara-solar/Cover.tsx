import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, useSSFont} from './Short';

// Cover (1080 x 1920): the overheated guy among the solar panels in the desert + the cover text.
// Rule of three: the guy, the panels, the text. Text away from the bottom ~20 % and the right edge.
export const SaharaSolarCover: React.FC = () => {
  useSSFont();
  return (
    <AbsoluteFill style={{background: '#A4D9FD'}}>
      <Scene t={10.0} cam={{x: 40, y: -360, k: 1.4}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 430,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 132,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        IT GETS
        <br />
        HOTTER?
      </div>
    </AbsoluteFill>
  );
};
