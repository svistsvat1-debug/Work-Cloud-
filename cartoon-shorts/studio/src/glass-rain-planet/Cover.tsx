import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CoverScene, FONT, useGRPFont} from './Short';

// Cover (1080 x 1920): frame 0's premise - the swimmer testing the 'water' from his diving board above the blue planet
// (eyes open) - + the cover text. Rule of three: the guy, the planet, the text (the ship is pushed out of frame).
// Text away from the bottom ~20 % and the right edge.
export const GlassRainPlanetCover: React.FC = () => {
  useGRPFont();
  return (
    <AbsoluteFill style={{background: '#011954'}}>
      <CoverScene cam={{x: 62, y: -550, k: 0.9}} />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '30px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        IT RAINS
        <br />
        GLASS
      </div>
    </AbsoluteFill>
  );
};
