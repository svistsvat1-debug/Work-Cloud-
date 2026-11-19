import React from 'react';
import {AbsoluteFill} from 'remotion';
import {IceScene, FONT, useCCNFont} from './Short';

// Cover (1080 x 1920): the premise - the soldier ('shh') in the town tunnel under the Greenland ice with the reactor,
// the secret plan below - + the cover text. Rule of three: the soldier, the town in the ice, the text.
// Text away from the bottom ~20 % and the right edge.
export const CampCenturyCover: React.FC = () => {
  useCCNFont();
  return (
    <AbsoluteFill>
      <IceScene t={10.95} cam={{x: 905, y: 1600, k: 0.95}} cover />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 138,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFE45C',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        600 NUKES?
      </div>
    </AbsoluteFill>
  );
};
