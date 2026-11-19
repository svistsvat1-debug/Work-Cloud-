import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, RecoverScene, SL_SKY, useSLFont} from './Short';

// Cover (1080 x 1920): the premise - the soggy sandwich (with a face) back up out of the sea in the sub's hatch, sparkling,
// and the guy with his jaw dropped - + the cover text. Rule of three: the guy, the sandwich, the text.
// Text away from the bottom ~20 % and the right edge.
export const SunkenLunchCover: React.FC = () => {
  useSLFont();
  return (
    <AbsoluteFill style={{background: SL_SKY}}>
      <RecoverScene t={10.8} cam={{x: 2070, y: 1390, k: 1.32}} still />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 250,
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
        10 MONTHS
        <br />
        <span style={{color: '#FFE45C'}}>LATER</span>
      </div>
    </AbsoluteFill>
  );
};
