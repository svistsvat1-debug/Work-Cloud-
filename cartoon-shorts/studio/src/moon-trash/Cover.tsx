import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MoonTrashScene, useMoonFont} from './Short';

// Shorts cover: the frame-0 premise (the guy with his trash bag + the Moon) + 1-4 words of cover text.
export const MoonTrashCover: React.FC = () => {
  useMoonFont();
  const txt = (size: number, color: string): React.CSSProperties => ({
    fontFamily: 'MoonTrashInter',
    fontSize: size,
    color,
    WebkitTextStroke: `${Math.round(size * 0.15)}px #000`,
    paintOrder: 'stroke fill',
    lineHeight: 0.95,
    whiteSpace: 'nowrap',
  });
  return (
    <AbsoluteFill>
      <MoonTrashScene t={0.4} noShake camOverride={{x: 860, y: 900, k: 1.04}} />
      <AbsoluteFill style={{left: 50, top: 760}}>
        <div style={{transform: 'rotate(-5deg)', transformOrigin: '0 0'}}>
          <div style={txt(210, '#FFD23F')}>$1M</div>
          <div style={{...txt(108, '#FFFFFF'), marginTop: 6}}>PER KILO?</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
