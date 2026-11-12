import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, Scene, useNukeFont} from './Short';

// Shorts cover = the frame-0 premise (the guy roasting a marshmallow on the giant gas fire) + the cover text.
// Three things only: the guy, the burning well, the text (kept away from the bottom 20 % and the right edge).
export const NukeGasFireCover: React.FC = () => {
  useNukeFont();
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
      <Scene t={0.9} tr={0.9} cam={{x: 790, y: 1360, k: 1.08}} cover />
      <AbsoluteFill style={{alignItems: 'center', top: 150, left: -70}}>
        <div style={{...txt, fontSize: 176, transform: 'rotate(-4deg)'}}>3 YEARS</div>
        <div style={{...txt, fontSize: 150, color: '#FFD54F', transform: 'rotate(-4deg)', marginTop: 6}}>ON FIRE</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
