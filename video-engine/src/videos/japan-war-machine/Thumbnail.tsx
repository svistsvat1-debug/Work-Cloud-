// Thumbnail concept 1: "SECRET FOR 29 YEARS" - night minesweeper above a lit sea mine. Max 3 objects.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Frame, Layer, ShotClock} from '../../engine/core';
import {Sky, Glow, Sea, Rays, Particles} from '../../engine/fx';
import {FONT_STENCIL, useFontsReady} from '../../engine/text';
import {Ship, Mine} from '../../assets/ships';
import {Stars} from './common';

const Inner: React.FC = () => (
  <Frame move={{type: 'push', amount: 0}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#050b14'], [0.4, '#0f2234'], [0.5, '#1e3a4c']]} />
      <Stars n={60} maxY={420} />
      <Glow x={1560} y={180} r={360} color="#d8ecf0" core="#f4fbfb" coreR={48} />
    </Layer>
    <Layer depth={0.3}>
      {/* underwater body */}
      <defs>
        <linearGradient id="thUW" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14404a" />
          <stop offset="0.5" stopColor="#0a2228" />
          <stop offset="1" stopColor="#02080a" />
        </linearGradient>
      </defs>
      <rect x={-200} y={520} width={2400} height={800} fill="url(#thUW)" />
      <Rays x={1300} y={520} color="#bff0ec" n={5} opacity={0.08} spread={700} len={700} />
      <Glow x={1180} y={860} r={460} color="#ff9a4a" opacity={0.55} />
      <Mine x={1180} y={850} r={150} color="#0a1012" rim="#ffb070" chain={400} />
      <Particles color="#9fd6c8" n={40} opacity={0.35} seed="th" area={[600, 560, 1300, 520]} />
    </Layer>
    <Layer depth={0.5}>
      {/* sea surface line + the small minesweeper with one warm lantern */}
      <rect x={-200} y={512} width={2400} height={10} fill="#9fc8d0" opacity={0.6} />
      <Ship kind="minesweeper" x={1000} y={522} len={760} color="#03070b" rim="#cfe8f0" roll={0} />
      <Glow x={1476} y={420} r={130} color="#ffcf7a" opacity={0.95} />
      <rect x={1468} y={410} width={16} height={20} fill="#ffe0a0" />
    </Layer>
    <Layer depth={0.8}>
      <g fontFamily={FONT_STENCIL} letterSpacing={6}>
        {[['SECRET FOR', 250], ['29 YEARS', 420]].map(([txt, y], i) => (
          <text key={i} x={90} y={y as number} fontSize={i ? 210 : 150} fill="#f2e6c8" stroke="#05080c" strokeWidth={14} paintOrder="stroke">
            {txt}
          </text>
        ))}
      </g>
    </Layer>
  </Frame>
);

export const Thumbnail: React.FC = () => {
  useFontsReady();
  return (
    <AbsoluteFill>
      <ShotClock id="thumb">
        <Inner />
      </ShotClock>
    </AbsoluteFill>
  );
};
