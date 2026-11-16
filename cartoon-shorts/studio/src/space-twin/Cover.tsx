import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneWithShake, FONT, useSPTFont} from './Short';

// Cover (1080 x 1920): the gaping brother + the stretched space twin under the red +2 IN mark + the cover text.
// Rule of three: the twin, his brother (the pair is the subject), the text. Text away from the bottom ~20 % and the right edge.
export const SpaceTwinCover: React.FC = () => {
  useSPTFont();
  return (
    <AbsoluteFill style={{background: '#FDEAAF'}}>
      <SceneWithShake t={14.1} cam={{x: 60, y: -420, k: 1.32}} cover />
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 132,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '26px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        TALLER THAN
        <br />
        HIS TWIN
      </div>
    </AbsoluteFill>
  );
};
