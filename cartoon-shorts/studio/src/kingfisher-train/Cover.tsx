import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, G, useKfFont} from './Short';

// Cover (1080 x 1920): the frame-0 premise (the beak-nosed train with the kingfisher on it + the puzzled guy)
// + the cover text = three things. Text kept away from the bottom ~20 % and the right edge.
export const KingfisherTrainCover: React.FC = () => {
  useKfFont();
  return (
    <AbsoluteFill style={{background: '#97D3F5'}}>
      <Scene t={3.6} tr={3.6} cam={{x: 2062, y: G - 300, k: 2.35}} cover />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 360,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 132,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '22px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>TUNNELS</div>
        <div style={{color: '#FFD23F'}}>WENT BOOM</div>
      </div>
    </AbsoluteFill>
  );
};
