// Thumbnail (concept A): "NO SOCKS. EVER." — max 3 objects (soldier, foot wrap, boot), max 4 words. No symbols.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ICONS } from './lib/icons';
import { Sketch, Write, Burst } from './lib/draw';
import { Person } from './lib/people';

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#FAF8F3' }}>
    <Img src={staticFile('paper.png')} style={{ position: 'absolute', inset: 0, width: 1280, height: 720 }} />
    <svg width={1280} height={720} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="wobT" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={3} />
        </filter>
      </defs>
      <g filter="url(#wobT)">
        <Write text="NO SOCKS." x={80} y={330} size={200} at={0} dur={0.3} />
        <Write text="EVER." x={150} y={600} size={230} at={0} dur={0.3} color="#E8322B" ul />
        <Burst x={480} y={520} w={600} h={190} at={0.1} />
        <Person x={1270} y={600} s={2.75} at={0} dur={0.6} face="shock" />
        <Sketch def={ICONS.wrap} x={1700} y={420} s={1.9} at={0} dur={0.5} rot={-18} lw={9} />
        <Sketch def={ICONS.boot} x={1690} y={860} s={1.55} at={0} dur={0.5} lw={9} />
      </g>
    </svg>
  </AbsoluteFill>
);
