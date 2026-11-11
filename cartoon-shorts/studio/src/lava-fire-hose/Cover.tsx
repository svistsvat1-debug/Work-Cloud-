import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, WorldScene, useLavaFont} from './Short';

// Shorts cover: the frame-0 premise (the guy with a fire hose vs. the living lava) + the cover text.
export const LavaFireHoseCover: React.FC = () => {
  useLavaFont();
  const txt = {
    fontFamily: FONT,
    color: '#FFFFFF',
    WebkitTextStroke: '22px #000',
    paintOrder: 'stroke fill',
    textAlign: 'center' as const,
    lineHeight: 0.95,
  };
  return (
    <AbsoluteFill>
      <WorldScene t={3.6} camOverride={{x: 760, y: 1440, k: 1.16}} />
      <AbsoluteFill style={{alignItems: 'center', top: 250, left: -90}}>
        <div style={{...txt, fontSize: 150, transform: 'rotate(-4deg)'}}>USE THE</div>
        <div style={{...txt, fontSize: 190, color: '#5FC8FF', transform: 'rotate(-4deg)', marginTop: 6}}>OCEAN?</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
