import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, FY, useMoaiFont} from './Short';

// Cover (1080 x 1920): the frame-0 premise (the moai with its eyes open + the puzzled guy) + the cover text
// = three things. Text kept away from the bottom ~20 % and the right edge.
export const MoaiWalkCover: React.FC = () => {
  useMoaiFont();
  return (
    <AbsoluteFill style={{background: '#93CFF0'}}>
      <Scene t={1.9} tr={1.9} cam={{x: 95, y: FY - 420, k: 1.8}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '24px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>THEY</div>
        <div style={{color: '#FFD23F'}}>WALKED?</div>
      </div>
    </AbsoluteFill>
  );
};
