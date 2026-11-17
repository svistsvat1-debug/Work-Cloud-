import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CastleScene, FONT, useCCFont} from './Short';

// Cover (1080 x 1920): the premise - the skinny guy in his felt hat beside his 9-ton stone gate, the castle wall at night -
// + the cover text. Rule of three: the guy, the gate, the text. Text away from the bottom ~20 % and the right edge.
export const CoralCastleCover: React.FC = () => {
  useCCFont();
  return (
    <AbsoluteFill style={{background: '#1d2759'}}>
      <CastleScene t={17.9} cam={{x: 1010, y: 1640, k: 1.2}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 520,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 132,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        6 MEN
        <br />+ A CRANE
      </div>
    </AbsoluteFill>
  );
};
