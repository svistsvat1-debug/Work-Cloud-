import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, LabScene, useDoomFont} from './Short';

// Shorts cover: the frame-0 premise (the scared guy holding the doomsday page) + the cover text. Three things only:
// the guy, the page, the text (the 1960 computer is left out of the cover).
export const Doomsday2026Cover: React.FC = () => {
  useDoomFont();
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
      <LabScene t={0} tl={0} cam={{x: 860, y: 1500, k: 1.02}} cover />
      <AbsoluteFill style={{alignItems: 'center', top: 120, left: -60}}>
        <div style={{...txt, fontSize: 150, transform: 'rotate(-4deg)'}}>INFINITE</div>
        <div style={{...txt, fontSize: 168, color: '#FFD54F', transform: 'rotate(-4deg)', marginTop: 4}}>PEOPLE?</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
