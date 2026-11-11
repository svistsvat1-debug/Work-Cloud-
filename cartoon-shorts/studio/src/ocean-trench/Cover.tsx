import React from 'react';
import {AbsoluteFill} from 'remotion';
import {WorldScene, useTrenchFont} from './Short';

// Shorts cover: the frame-0 premise (the guy + his trash bag above the trench) + 1-4 words of cover text.
export const OceanTrenchCover: React.FC = () => {
  useTrenchFont();
  const txt = {
    fontFamily: 'OceanTrenchInter',
    color: '#FFFFFF',
    WebkitTextStroke: '22px #000',
    paintOrder: 'stroke fill',
    textAlign: 'center' as const,
    lineHeight: 0.95,
  };
  return (
    <AbsoluteFill>
      <WorldScene t={0.35} noShake camOverride={{x: 650, y: 672, k: 1.45}} />
      <AbsoluteFill style={{alignItems: 'center', top: 820, left: -40}}>
        <div style={{...txt, fontSize: 150, transform: 'rotate(-4deg)'}}>FINGERNAIL</div>
        <div style={{...txt, fontSize: 170, color: '#FFD23F', transform: 'rotate(-4deg)', marginTop: 10}}>SPEED?</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
