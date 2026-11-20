import React from 'react';
import {AbsoluteFill} from 'remotion';
import {RoofScene, FONT, usePigeonFont} from './Short';

// Cover (1080 x 1920): the premise - you on a rooftop holding out a crumb, the lazy pigeon gliding in without flapping -
// + the cover text. Rule of three: the guy, the pigeon, the text. Text away from the bottom ~20 % and the right edge.
export const PigeonLandingCover: React.FC = () => {
  usePigeonFont();
  return (
    <AbsoluteFill>
      <RoofScene t={2.0} cam={{x: 520, y: 1010, k: 0.98}} cover />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 126,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        60-METER
        <br />
        RUNWAY?
      </div>
    </AbsoluteFill>
  );
};
