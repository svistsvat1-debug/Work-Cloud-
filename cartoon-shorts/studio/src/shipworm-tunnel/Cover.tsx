import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, SKY, useWormFont} from './Short';
import {CUT_E} from './scene';

// Cover (1080 x 1920): the guy pointing + the iron shield crawling under the river (the worm on his head) + the cover text.
// Text kept away from the bottom ~20 % and the right edge.
export const ShipwormTunnelCover: React.FC = () => {
  useWormFont();
  void CUT_E;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={15.4} cam={{x: 70, y: 560, k: 1.85}} cover />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 230,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 118,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '22px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        SHIP-EATING
        <br />
        WORM?
      </div>
    </AbsoluteFill>
  );
};
