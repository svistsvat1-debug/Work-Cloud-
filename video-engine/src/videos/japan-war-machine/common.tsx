// Shared palettes and small scene helpers for "What Happened to Japan's War Machine After 1945?"
import React from 'react';
import {useShot, wave, rnd, W, H, clamp} from '../../engine/core';
import {Stops} from '../../engine/fx';

export const PAL = {
  night: {sky: [[0, '#0b1424'], [0.55, '#14263a'], [1, '#22404f']] as Stops, far: '#1a2c3b', mid: '#122130', near: '#0a131c', rim: '#8fb8c4', warm: '#ffc77a', sea: ['#1c3444', '#08121a'] as [string, string]},
  dusk: {sky: [[0, '#2b2f4a'], [0.38, '#8e3b3a'], [0.68, '#e0743a'], [1, '#f9d79a']] as Stops, far: '#7a3d45', mid: '#3e2a3c', near: '#14121c', rim: '#f2a060', warm: '#ffd9a0', sea: ['#c7704a', '#2a1f2e'] as [string, string]},
  steel: {sky: [[0, '#4a5560'], [0.55, '#8a949a'], [0.8, '#d8cfae'], [1, '#efe3bb']] as Stops, far: '#6c7479', mid: '#4b5358', near: '#23292e', rim: '#f4e2a8', warm: '#ffe6a8', sea: ['#7d878a', '#3c4549'] as [string, string]},
  blue: {sky: [[0, '#1d2733'], [0.6, '#34424f'], [1, '#56646c']] as Stops, far: '#3a4752', mid: '#26313b', near: '#121a21', rim: '#cfe0e8', warm: '#ffc77a', sea: ['#3e4c55', '#1a232a'] as [string, string]},
  sepia: {sky: [[0, '#5e4a36'], [0.6, '#a88a62'], [1, '#d9c39a']] as Stops, far: '#8a6f50', mid: '#5f4a36', near: '#2e2419', rim: '#f6e2b4', warm: '#ffe2a6', sea: ['#9c8566', '#4a3b2c'] as [string, string]},
  slate: {sky: [[0, '#3a4048'], [0.6, '#6c6f72'], [0.85, '#c9a27a'], [1, '#e8c592']] as Stops, far: '#5a6066', mid: '#3a4046', near: '#1a1e22', rim: '#f3c98e', warm: '#ffd9a0', sea: ['#6d7276', '#2b3034'] as [string, string]},
  teal: {sky: [[0, '#0f2a2e'], [0.6, '#1f4a4c'], [1, '#3d6b66']] as Stops, far: '#24484a', mid: '#163235', near: '#0a1719', rim: '#a8d8d0', warm: '#ffc77a', sea: ['#2a5552', '#0b1d1f'] as [string, string]},
  cold: {sky: [[0, '#5d6f7d'], [0.6, '#9fb1bb'], [1, '#d9e3e6']] as Stops, far: '#7f919b', mid: '#5c6d77', near: '#2a3439', rim: '#ffffff', warm: '#ffe2b0', sea: ['#6f8590', '#34454e'] as [string, string]},
  green: {sky: [[0, '#26302c'], [0.6, '#4a5a52'], [1, '#7d8c7c']] as Stops, far: '#3f4c45', mid: '#2b3631', near: '#141a17', rim: '#cfe0c8', warm: '#ffdca0', sea: ['#3e4f48', '#16201c'] as [string, string]},
  khaki: {sky: [[0, '#5c5a4c'], [0.6, '#9a9478'], [1, '#d6cca6']] as Stops, far: '#7c765e', mid: '#585440', near: '#2a2820', rim: '#f4e8c0', warm: '#ffe6a8', sea: ['#7e7a64', '#3a382c'] as [string, string]},
  lagoon: {sky: [[0, '#5d8fa3'], [0.6, '#a9cfd6'], [1, '#eef3ea']] as Stops, far: '#3f7a74', mid: '#2c5d58', near: '#163432', rim: '#ffffff', warm: '#fff2c8', sea: ['#3fa6a0', '#1d5f69'] as [string, string]},
  red: {sky: [[0, '#140f1c'], [0.55, '#2a1a2a'], [0.85, '#7a2e26'], [1, '#c45a32']] as Stops, far: '#3a2028', mid: '#22141c', near: '#0d0a10', rim: '#f08a50', warm: '#ffb070', sea: ['#3a2026', '#0d0a10'] as [string, string]},
};

export type Pal = (typeof PAL)['night'];

/** water band drawn IN FRONT of a floating object to sink its lower part */
export const WaterFront: React.FC<{y: number; color: string; opacity?: number}> = ({y, color, opacity = 0.92}) => {
  const {t} = useShot();
  const d = `M-200 ${y} Q${W * 0.25} ${y - 6 + 4 * wave(t, 3)} ${W * 0.5} ${y} T${W + 200} ${y} V${H + 300} H-200Z`;
  return <path d={d} fill={color} opacity={opacity} />;
};

/** willys-style jeep silhouette, 300 units long, wheels at y=0 */
export const Jeep: React.FC<{x: number; y: number; len?: number; color?: string; flip?: boolean}> = ({x, y, len = 220, color = '#14181c', flip = false}) => {
  const s = len / 300;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill={color}>
      <path d="M10 -40 L20 -80 L120 -84 L150 -120 L160 -120 L150 -84 L290 -80 L300 -40 Z" />
      <rect x={110} y={-150} width={6} height={70} transform="rotate(-20 113 -115)" />
      <circle cx={70} cy={-26} r={28} />
      <circle cx={240} cy={-26} r={28} />
    </g>
  );
};

/** farm/airfield tractor silhouette */
export const Tractor: React.FC<{x: number; y: number; len?: number; color?: string}> = ({x, y, len = 200, color = '#14121c'}) => {
  const s = len / 200;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <rect x={20} y={-90} width={110} height={50} />
      <rect x={110} y={-150} width={60} height={70} />
      <rect x={40} y={-120} width={10} height={40} />
      <circle cx={150} cy={-38} r={38} />
      <circle cx={50} cy={-22} r={22} />
      <rect x={-60} y={-40} width={80} height={6} />
    </g>
  );
};

/** heap of broken aircraft parts */
export const WreckPile: React.FC<{x: number; y: number; w?: number; h?: number; color?: string; seed?: string}> = ({x, y, w = 600, h = 180, color = '#141018', seed = 'wp'}) => (
  <g fill={color}>
    <path d={`M${x - w / 2} ${y} Q${x - w / 4} ${y - h} ${x} ${y - h * 1.05} Q${x + w / 3} ${y - h * 0.9} ${x + w / 2} ${y}Z`} />
    {Array.from({length: 9}).map((_, i) => {
      const px = x - w * 0.4 + rnd(`${seed}x${i}`) * w * 0.8;
      const py = y - h * (0.4 + rnd(`${seed}y${i}`) * 0.6);
      const r = -60 + rnd(`${seed}r${i}`) * 120;
      const k = i % 3;
      return k === 0 ? (
        <rect key={i} x={px} y={py} width={140} height={14} transform={`rotate(${r} ${px} ${py})`} />
      ) : k === 1 ? (
        <path key={i} d={`M${px} ${py} l60 -10 l20 30 l-70 14z`} transform={`rotate(${r} ${px} ${py})`} />
      ) : (
        <circle key={i} cx={px} cy={py} r={18} />
      );
    })}
  </g>
);

/** stars twinkling in a night sky */
export const Stars: React.FC<{n?: number; color?: string; maxY?: number; seed?: string}> = ({n = 70, color = '#dfe9f0', maxY = 520, seed = 'st'}) => {
  const {t} = useShot();
  return (
    <g fill={color}>
      {Array.from({length: n}).map((_, i) => (
        <circle key={i} cx={rnd(`${seed}x${i}`) * W} cy={rnd(`${seed}y${i}`) * maxY} r={0.8 + rnd(`${seed}r${i}`) * 1.6} opacity={0.35 + 0.35 * (0.5 + 0.5 * wave(t, 2 + rnd(`${seed}p${i}`) * 3, i * 0.1))} />
      ))}
    </g>
  );
};

/** progress helper: 0..1 between a..b of shot progress */
export const useK = (a: number, b: number) => {
  const {p} = useShot();
  return clamp((p - a) / (b - a));
};
