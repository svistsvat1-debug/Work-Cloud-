import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, SKY, YardScene, useMHFont} from './Short';

// Cover (1080 x 1920): the premise - a stone giant wearing his huge red stone hat, the islander looking up at it - + the
// cover text. Rule of three: the giant with the hat, the guy, the text. Text away from the bottom ~20 % and the right edge.
export const MoaiHatsCover: React.FC = () => {
  useMHFont();
  return (
    <AbsoluteFill style={{background: SKY}}>
      <YardScene t={2.4} cam={{x: 330, y: 1090, k: 0.82}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 188,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        JUST
        <br />
        <span style={{color: '#FFE45C'}}>ROLL IT?</span>
      </div>
    </AbsoluteFill>
  );
};
