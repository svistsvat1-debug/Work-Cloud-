import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, SKY, useAntFont} from './Short';

// Cover (1080 x 1920): the guy riding the sliding ice shelf with the buried bag + the ice's eyes, + the cover text.
// Rule of three: guy, the ice (with the bag inside), the text. Text away from the bottom ~20 % and the right edge.
export const AntarcticTrashCover: React.FC = () => {
  useAntFont();
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={13.0} cam={{x: -560, y: -40, k: 1.12}} cover />
      <div
        style={{
          position: 'absolute',
          left: 460,
          top: 360,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 140,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        IT MOVES?
      </div>
    </AbsoluteFill>
  );
};
