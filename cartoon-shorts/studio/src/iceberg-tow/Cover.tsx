import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, FONT, useITFont} from './Short';

// Cover (1080 x 1920): the guy on his tug towing the iceberg (with a face) + the cover text.
// Rule of three: the guy (on the tug), the iceberg, the text. Text away from the bottom ~20 % and the right edge.
export const IcebergTowCover: React.FC = () => {
  useITFont();
  return (
    <AbsoluteFill style={{background: '#72C5FD'}}>
      <Scene t={2.0} cam={{x: 30, y: -330, k: 0.95}} cover />
      <div
        style={{
          position: 'absolute',
          left: 480,
          top: 330,
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontFamily: FONT,
          fontSize: 150,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#FFD23F',
          WebkitTextStroke: '28px #000',
          paintOrder: 'stroke fill',
          whiteSpace: 'nowrap',
        }}
      >
        20 SHIPS?
      </div>
    </AbsoluteFill>
  );
};
