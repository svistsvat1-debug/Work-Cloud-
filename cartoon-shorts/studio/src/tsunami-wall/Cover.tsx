import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, useTsunamiFont} from './Short';
import {FONT} from './parts';

// Cover (1080 x 1920): the frame-0 premise (the guy with his brick, the giant wave with a face looming over the sea)
// + the cover text = three things. Text kept away from the bottom ~20 % and the right edge.
export const TsunamiWallCover: React.FC = () => {
  useTsunamiFont();
  return (
    <AbsoluteFill style={{background: '#92D2F2'}}>
      <Scene t={2.24} tr={2.24} cam={{x: 780, y: 1330, k: 1.0}} />
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 124,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#fff',
          WebkitTextStroke: '22px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        <div>10 M WASN'T</div>
        <div style={{color: '#FFB347'}}>ENOUGH</div>
      </div>
    </AbsoluteFill>
  );
};
