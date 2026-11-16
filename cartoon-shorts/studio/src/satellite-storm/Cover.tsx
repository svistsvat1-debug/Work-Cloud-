import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, SceneAt, useSatFont} from './Short';

// Cover (1080 x 1920): a burning satellite diving as a shooting star over the shocked guy + the cover text.
// Rule of three: the guy, the burning satellite, the text. Text away from the bottom ~20 % and the right edge.
export const SatelliteStormCover: React.FC = () => {
  useSatFont();
  return (
    <AbsoluteFill style={{background: '#0C1A4A'}}>
      <SceneAt t={24.0} coverCam={{x: 70, y: -1010, k: 1.3}} cover poseOverride="cheeks" />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 300,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 140,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        WEAK SUN
        <br />
        STORM?
      </div>
    </AbsoluteFill>
  );
};
