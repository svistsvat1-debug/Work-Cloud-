import React, { useMemo } from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { buildBoards } from './boards';
import TIMING from './data/timing.json';
import MAPS from './data/maps.json';
import { El, cameraAt } from './Board';
import { useT, clamp } from './lib/draw';

export const BOARDS: any[] = buildBoards(TIMING as any, MAPS as any);

const Layer: React.FC<{ b: any; t: number }> = ({ b, t }) => {
  const fadeIn = clamp((t - b.start) / 0.25);
  const out = clamp((t - b.end) / 0.35);
  const op = Math.min(fadeIn, 1 - out);
  if (op <= 0) return null;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, opacity: op }}>
      <g transform={`translate(${-60 * out},0)`}>
        <g>
          <g transform={cameraAt(t, b)}>
            {b.els.map((e: any, i: number) => <El key={i} e={e} />)}
          </g>
        </g>
      </g>
    </svg>
  );
};

export const Main: React.FC<{ only?: number }> = ({ only }) => {
  const t = useT();
  const active = BOARDS.filter((b, i) => (only == null || only === i) && t >= b.start - 0.001 && t < b.end + 0.36);
  return (
    <AbsoluteFill style={{ backgroundColor: '#FAF8F3' }}>
      <Img src={staticFile('paper.png')} style={{ position: 'absolute', inset: 0, width: 1920, height: 1080 }} />
      {active.map((b) => <Layer key={b.from} b={b} t={t} />)}
    </AbsoluteFill>
  );
};
