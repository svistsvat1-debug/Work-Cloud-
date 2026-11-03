import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Guy, POSES} from './Guy';
import {Tower} from './Tower';

/** QA sheet: every cut-out drawing on a coloured background (checks outlines / holes / glitches). */
export const PisaSheet: React.FC = () => {
  const names = Object.keys(POSES);
  return (
    <AbsoluteFill style={{background: '#7fc8a9'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {names.map((n, i) => {
          const x = 140 + (i % 4) * 265;
          const y = 380 + Math.floor(i / 4) * 400;
          return (
            <g key={n} transform={`translate(${x} ${y})`}>
              <Guy p={POSES[n]} />
              <text y={50} textAnchor="middle" fontSize={26} fontFamily="sans-serif" fill="#1b1b1f">{n}</text>
            </g>
          );
        })}
        <g transform="translate(330 1840) scale(0.62)">
          <Tower storeys={Array.from({length: 8}, () => ({on: true, dy: 0}))} face={{open: 1, mode: 'eyes', look: [0.5, 0.4], brows: 0.6}} />
        </g>
        <g transform="translate(760 1840) scale(0.62)">
          <Tower storeys={Array.from({length: 8}, (_, i) => ({on: i < 3, dy: 0}))} face={{open: 1, mode: 'eyes', look: [0, 0], brows: -0.6, lid: 0.45}} id="t2" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
