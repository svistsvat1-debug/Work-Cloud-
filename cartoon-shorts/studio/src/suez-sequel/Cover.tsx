import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SuezScene, FONT, useSuezFont} from './Short';

// Cover (1080 x 1920): the premise - the giant ship stuck in the sand, the excavator, the hopeful guy - + the cover text.
// Rule of three: the ship (with its straining face), the guy, the text. Text away from the bottom ~20 % and the right edge.
export const SuezSequelCover: React.FC = () => {
  useSuezFont();
  return (
    <AbsoluteFill>
      <SuezScene t={1.0} cam={{x: 1180, y: 1180, k: 1.32}} cover />
      <div
        style={{
          position: 'absolute', left: 520, top: 640, transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT, fontSize: 124, lineHeight: 1.0, textAlign: 'center', color: '#FFE45C',
          WebkitTextStroke: '26px #000', paintOrder: 'stroke fill', whiteSpace: 'nowrap',
        }}
      >
        FREE...
        <br />
        NOT QUITE
      </div>
    </AbsoluteFill>
  );
};
