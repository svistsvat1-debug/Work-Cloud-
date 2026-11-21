import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EHScene, FONT, useEHFont} from './Short';

// Cover: the ranger (shocked) + the napping herd + the cover text (rule of three). Text away from the bottom 20 % / right edge.
export const ElephantHomeCover: React.FC = () => {
  useEHFont();
  return (
    <AbsoluteFill>
      <EHScene t={9} cover />
      <div style={{position: 'absolute', left: 500, top: 430, transform: 'translate(-50%, -50%) rotate(-4deg)', fontFamily: FONT, fontSize: 120,
        lineHeight: 1.0, textAlign: 'center', color: '#FFE45C', WebkitTextStroke: '26px #000', paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>
        500 KM
        <br />
        FROM HOME
      </div>
    </AbsoluteFill>
  );
};
