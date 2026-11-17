import React from 'react';
import {clamp} from './anim';
import {Eye} from './Face';
import {SweatDrop} from './SweatDrop';

// Shared code-drawn Sun and Earth with cartoon faces (first used in sun-trash, generalised for sun-vanish).
// Both are SVG groups centred at (x, y); sw = outline width in the same units.
const INK = '#000';
export const SUN_COL = {fill: '#FFC93C', shade: '#FFAE21', ray: '#FFD95E', cheek: '#FF8A5B', mouth: '#7A2E1C'};
export const EARTH_COL = {sea: '#3E8EDE', seaShade: '#2F74C0', land: '#5DBB4F'};

export type SunMood = 'sleep' | 'calm' | 'worry' | 'happy' | 'wink' | 'shock';
export type SunFace = {look: [number, number]; open: number; mood: SunMood; sweat?: number; pupil?: [number, number]};

export const SunBody: React.FC<{x: number; y: number; r: number; sw: number; t: number; face: SunFace; sx?: number; sy?: number; id: string; glow?: boolean}> = ({
  x,
  y,
  r,
  sw,
  t,
  face,
  sx = 1,
  sy = 1,
  id,
  glow = true,
}) => {
  const n = 16;
  const spin = t * 6;
  const rays = Array.from({length: n}, (_, i) => {
    const a = ((i / n) * 360 + spin) * (Math.PI / 180);
    const w = (Math.PI / n) * 0.55;
    const r0 = r * 1.02;
    const r1 = r * (1.14 + 0.03 * Math.sin(t * 3 + i * 1.7));
    return `M ${Math.cos(a - w) * r0} ${Math.sin(a - w) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1} L ${Math.cos(a + w) * r0} ${Math.sin(a + w) * r0} Z`;
  }).join(' ');
  const L = Math.hypot(face.look[0], face.look[1]);
  const lk: [number, number] = L > 1 ? [face.look[0] / L, face.look[1] / L] : face.look;
  const fx = lk[0] * r * 0.45;
  const fy = lk[1] * r * 0.45;
  const er = r * 0.12;
  const ex = r * 0.3;
  const eyeY = fy - r * 0.06;
  const mouthY = fy + r * 0.24;
  const pupil = face.pupil ?? [lk[0] * 0.6, lk[1] * 0.6];
  const mood = face.mood;
  const brTilt = mood === 'worry' || mood === 'shock' ? -1.6 : 0;
  const arc = (cx: number, up: boolean) =>
    `M ${cx - er} ${eyeY + (up ? er * 0.3 : 0)} Q ${cx} ${eyeY + (up ? -er : er * 0.8)} ${cx + er} ${eyeY + (up ? er * 0.3 : 0)}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx}, ${sy})`}>
      {glow ? <circle r={r * 1.75} fill={`url(#${id}-glow)`} /> : null}
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0.5" stopColor="#FFE58A" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FFE58A" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle r={r} />
        </clipPath>
      </defs>
      <path d={rays} fill={SUN_COL.ray} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <circle r={r} fill={SUN_COL.fill} />
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx={r * 0.32} cy={r * 0.36} r={r} fill="none" stroke={SUN_COL.shade} strokeWidth={r * 0.28} opacity={0.75} />
        <ellipse cx={fx - ex * 1.6} cy={mouthY - r * 0.05} rx={r * 0.11} ry={r * 0.065} fill={SUN_COL.cheek} opacity={0.7} />
        <ellipse cx={fx + ex * 1.6} cy={mouthY - r * 0.05} rx={r * 0.11} ry={r * 0.065} fill={SUN_COL.cheek} opacity={0.7} />
        {mood === 'sleep' || face.open < 0.05 ? (
          <>
            <path d={arc(fx - ex, false)} fill="none" stroke={INK} strokeWidth={sw * 1.4} strokeLinecap="round" />
            <path d={arc(fx + ex, false)} fill="none" stroke={INK} strokeWidth={sw * 1.4} strokeLinecap="round" />
          </>
        ) : mood === 'happy' ? (
          <>
            <path d={arc(fx - ex, true)} fill="none" stroke={INK} strokeWidth={sw * 1.5} strokeLinecap="round" />
            <path d={arc(fx + ex, true)} fill="none" stroke={INK} strokeWidth={sw * 1.5} strokeLinecap="round" />
          </>
        ) : mood === 'wink' ? (
          <>
            <path d={arc(fx - ex, true)} fill="none" stroke={INK} strokeWidth={sw * 1.5} strokeLinecap="round" />
            <Eye x={fx + ex} y={eyeY} r={er} open={face.open} look={pupil} side={1} brow={0.75} ink={sw / er} />
          </>
        ) : (
          <>
            <Eye x={fx - ex} y={eyeY} r={er * (mood === 'shock' ? 1.25 : 1)} open={face.open} look={pupil} side={-1} brow={0.75} browTilt={brTilt} ink={sw / er} />
            <Eye x={fx + ex} y={eyeY} r={er * (mood === 'shock' ? 1.25 : 1)} open={face.open} look={pupil} side={1} brow={0.75} browTilt={brTilt} ink={sw / er} />
          </>
        )}
        {mood === 'sleep' ? (
          <path d={`M ${fx - r * 0.07} ${mouthY} L ${fx + r * 0.07} ${mouthY}`} stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" />
        ) : mood === 'worry' ? (
          <path
            d={`M ${fx - r * 0.14} ${mouthY} q ${r * 0.047} ${-r * 0.047} ${r * 0.093} 0 t ${r * 0.093} 0 t ${r * 0.093} 0`}
            fill="none"
            stroke={INK}
            strokeWidth={sw * 1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : mood === 'shock' || mood === 'calm' ? (
          <ellipse cx={fx} cy={mouthY} rx={r * (mood === 'shock' ? 0.075 : 0.05)} ry={r * (mood === 'shock' ? 0.1 : 0.06)} fill={SUN_COL.mouth} stroke={INK} strokeWidth={sw} />
        ) : (
          <path d={`M ${fx - r * 0.16} ${mouthY - r * 0.03} Q ${fx} ${mouthY + r * 0.15} ${fx + r * 0.16} ${mouthY - r * 0.03} Z`} fill={SUN_COL.mouth} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        )}
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={sw * 1.2} />
      {face.sweat && face.sweat > 0.01 ? <SweatDrop x={fx + ex * 2.1} y={eyeY - er * 0.4 + r * 0.12 * (1 - face.sweat)} r={er * 0.7} s={face.sweat} rot={12} /> : null}
    </g>
  );
};

export type EarthFace = {mood: 'chill' | 'shock' | 'none'; glassesUp?: number; look?: [number, number]; open?: number};

// Earth (code) with optional face; night = 0..1 darkens the day side; spin rotates the land.
export const EarthBody: React.FC<{x: number; y: number; r: number; sw: number; spin?: number; id: string; face?: EarthFace; night?: number; sx?: number; sy?: number}> = ({
  x,
  y,
  r,
  sw,
  spin = 0,
  id,
  face = {mood: 'none'},
  night = 0,
  sx = 1,
  sy = 1,
}) => {
  const land = (d: string) => <path d={d} fill={EARTH_COL.land} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
  const gu = clamp(face.glassesUp ?? 0);
  const er = r * 0.15;
  const eyeY = -r * 0.08;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx}, ${sy})`}>
      <circle r={r * 1.07} fill="#9FD3FF" opacity={0.35 * (1 - night)} />
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle r={r} />
        </clipPath>
      </defs>
      <circle r={r} fill={EARTH_COL.sea} />
      <g clipPath={`url(#${id}-clip)`}>
        <g transform={`rotate(${spin})`}>
          {land(
            `M ${-r * 0.75} ${-r * 0.55} C ${-r * 0.4} ${-r * 0.85} ${-r * 0.05} ${-r * 0.7} ${-r * 0.12} ${-r * 0.4} C ${-r * 0.18} ${-r * 0.15} ${-r * 0.45} ${-r * 0.1} ${-r * 0.55} ${r * 0.15} C ${-r * 0.7} ${r * 0.35} ${-r * 0.95} ${r * 0.1} ${-r * 0.92} ${-r * 0.2} Z`,
          )}
          {land(
            `M ${r * 0.2} ${-r * 0.25} C ${r * 0.55} ${-r * 0.45} ${r * 0.85} ${-r * 0.2} ${r * 0.75} ${r * 0.15} C ${r * 0.65} ${r * 0.45} ${r * 0.4} ${r * 0.75} ${r * 0.2} ${r * 0.55} C ${r * 0.05} ${r * 0.35} ${r * 0.3} ${r * 0.15} ${r * 0.1} ${r * 0.0} Z`,
          )}
          {land(`M ${-r * 0.35} ${r * 0.55} C ${-r * 0.15} ${r * 0.5} ${0} ${r * 0.7} ${-r * 0.1} ${r * 0.85} C ${-r * 0.25} ${r * 0.95} ${-r * 0.45} ${r * 0.75} Z`)}
          <ellipse cx={r * 0.05} cy={-r * 0.62} rx={r * 0.32} ry={r * 0.08} fill="#fff" opacity={0.9} />
        </g>
        <circle cx={r * 0.3} cy={r * 0.34} r={r} fill="none" stroke={EARTH_COL.seaShade} strokeWidth={r * 0.26} opacity={0.55} />
        {night > 0.001 ? <circle r={r * 1.1} fill="#0B1236" opacity={0.62 * night} /> : null}
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={sw * 1.2} />
      {face.mood !== 'none' ? (
        <g>
          {face.mood === 'shock' ? (
            <>
              <Eye x={-r * 0.3} y={eyeY} r={er * 1.25} open={face.open ?? 1} look={face.look ?? [0, 0]} side={-1} brow={0.7} browTilt={-1.4} ink={sw / er} />
              <Eye x={r * 0.3} y={eyeY} r={er * 1.25} open={face.open ?? 1} look={face.look ?? [0, 0]} side={1} brow={0.7} browTilt={-1.4} ink={sw / er} />
              <ellipse cx={0} cy={r * 0.42} rx={r * 0.12} ry={r * 0.16} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
            </>
          ) : (
            <path d={`M ${-r * 0.2} ${r * 0.36} Q 0 ${r * 0.52} ${r * 0.2} ${r * 0.36}`} fill="none" stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" />
          )}
          {/* sunglasses: on the eyes (chill) or pushed up (shock) */}
          <g transform={`translate(0 ${-gu * r * 0.42})`}>
            <line x1={-r * 0.3} y1={eyeY} x2={r * 0.3} y2={eyeY} stroke={INK} strokeWidth={sw * 1.1} />
            <circle cx={-r * 0.3} cy={eyeY} r={r * 0.2} fill={INK} />
            <circle cx={r * 0.3} cy={eyeY} r={r * 0.2} fill={INK} />
            <circle cx={-r * 0.36} cy={eyeY - r * 0.07} r={r * 0.045} fill="#fff" opacity={0.85} />
            <circle cx={r * 0.24} cy={eyeY - r * 0.07} r={r * 0.045} fill="#fff" opacity={0.85} />
          </g>
        </g>
      ) : null}
    </g>
  );
};
