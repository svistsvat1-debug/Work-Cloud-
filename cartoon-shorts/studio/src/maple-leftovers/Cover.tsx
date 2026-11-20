import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MapleScene, FONT, useMapleFont} from './Short';

// Cover (1080 x 1920): the premise - the scientist under the maple, picking a leaf, a smug test cloud on the horizon - + the
// cover text. Rule of three: the guy with the leaf, the test cloud, the text. Text away from the bottom ~20 % and the right edge.
export const MapleLeftoversCover: React.FC = () => {
  useMapleFont();
  return (
    <AbsoluteFill>
      <MapleScene t={1.2} cam={{x: 720, y: 1150, k: 1.12}} cover />
      <div
        style={{
          position: 'absolute',
          left: 470,
          top: 330,
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
        2 YEARS
        <br />
        LATE
      </div>
    </AbsoluteFill>
  );
};
