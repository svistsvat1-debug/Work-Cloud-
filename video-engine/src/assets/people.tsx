// Human silhouettes: minimal faces (none), identity via headgear and outline. Minimal motion: breathing, walking.
import React from 'react';
import {useShot, wave} from '../engine/core';

export type Hat = 'jcap' | 'jsailor' | 'usSailor' | 'officer' | 'pilot' | 'usHelmet' | 'none' | 'woman' | 'child' | 'workerCap';

const HEADS: Record<Hat, (c: string) => React.ReactNode> = {
  none: () => null,
  jcap: (c) => (
    <g fill={c}>
      <path d="M-15 -168 Q0 -186 15 -168 L17 -160 L-17 -160Z" />
      <rect x={-18} y={-162} width={22} height={4} />
      <path d="M-15 -160 L-17 -142 L-6 -146 L-6 -160Z" opacity={0.95} />
      <path d="M15 -160 L17 -142 L6 -146 L6 -160Z" opacity={0.95} />
    </g>
  ),
  jsailor: (c) => <path d="M-15 -164 Q0 -184 15 -164 L18 -160 L-18 -160Z" fill={c} />,
  usSailor: (c) => <path d="M-16 -166 L-13 -178 L13 -178 L16 -166 Q0 -162 -16 -166Z" fill={c} />,
  officer: (c) => (
    <g fill={c}>
      <path d="M-18 -170 Q0 -182 20 -172 L16 -162 L-15 -162Z" />
      <rect x={-6} y={-163} width={30} height={4} />
    </g>
  ),
  pilot: (c) => (
    <g fill={c}>
      <path d="M-15 -158 Q-16 -184 0 -184 Q16 -184 15 -158 L15 -150 L-15 -150Z" />
      <rect x={-17} y={-176} width={34} height={9} rx={4} />
      <path d="M-14 -152 L-18 -140 L-9 -146Z" />
      <path d="M14 -152 L18 -140 L9 -146Z" />
    </g>
  ),
  usHelmet: (c) => <path d="M-19 -162 Q0 -192 19 -162 Z" fill={c} />,
  woman: (c) => <circle cx={-6} cy={-172} r={9} fill={c} />,
  child: () => null,
  workerCap: (c) => <path d="M-14 -168 Q0 -180 14 -168 L22 -164 L-14 -164Z" fill={c} />,
};

export const Person: React.FC<{
  x: number;
  y: number;
  h?: number; // full height in px (base figure is 180 units)
  color?: string;
  hat?: Hat;
  pose?: 'stand' | 'walk' | 'sit' | 'rail' | 'kneel';
  facing?: 1 | -1;
  rim?: string;
  item?: 'rifle' | 'bundle' | 'helmet' | 'clipboard' | 'none' | 'rope';
  seed?: number;
  skirt?: boolean;
  walkSpeed?: number;
}> = ({x, y, h = 180, color = '#141218', hat = 'none', pose = 'stand', facing = 1, rim, item = 'none', seed = 0, skirt = false, walkSpeed = 0}) => {
  const {t} = useShot();
  const s = h / 180;
  const breath = 1 + 0.008 * wave(t, 3.6, seed * 0.13);
  const ph = t * 1.6 + seed;
  const step = pose === 'walk' ? Math.sin(ph * Math.PI) : 0;
  const xx = x + walkSpeed * t * facing;
  const sitting = pose === 'sit';
  const torsoTop = sitting ? -118 : -150;
  return (
    <g transform={`translate(${xx} ${y}) scale(${facing * s} ${s * breath})`} fill={color}>
      <g transform={sitting ? 'translate(0 32)' : undefined}>
        {/* head */}
        <ellipse cx={0} cy={-162} rx={13} ry={15} />
        {HEADS[hat](color)}
        {/* neck + torso */}
        <rect x={-6} y={-150} width={12} height={10} />
        <path d={`M-22 -142 Q0 -150 22 -142 L24 -78 L-24 -78Z`} />
        {skirt && <path d="M-24 -80 L24 -80 L32 -26 L-32 -26Z" />}
        {/* arms */}
        {pose === 'rail' ? (
          <g>
            <path d="M18 -138 L40 -104 L34 -100 L14 -128Z" />
            <path d="M-18 -138 L22 -100 L16 -96 L-20 -126Z" />
          </g>
        ) : (
          <g>
            <path d={`M-22 -140 L${-28 + step * 6} -84 L${-20 + step * 6} -82 L-14 -132Z`} />
            <path d={`M22 -140 L${28 - step * 6} -84 L${20 - step * 6} -82 L14 -132Z`} />
          </g>
        )}
      </g>
      {/* legs */}
      {sitting ? (
        <path d="M-24 -50 L30 -50 L34 -30 L30 0 L20 0 L18 -34 L-24 -34Z" />
      ) : pose === 'kneel' ? (
        <path d="M-22 -80 L22 -80 L26 -36 L50 -30 L50 0 L-10 0 L-16 -30Z" />
      ) : (
        <g>
          <path d={`M-20 -80 L-2 -80 L${-6 + step * 10} 0 L${-20 + step * 10} 0Z`} />
          <path d={`M2 -80 L20 -80 L${20 - step * 10} 0 L${6 - step * 10} 0Z`} />
        </g>
      )}
      {item === 'rifle' && <rect x={18} y={-196} width={5} height={120} rx={2} transform="rotate(-14 20 -140)" />}
      {item === 'bundle' && <path d="M-46 -60 Q-40 -82 -20 -78 L-18 -40 Q-40 -36 -46 -60Z" />}
      {item === 'helmet' && <path d="M24 -96 Q38 -112 52 -96 L54 -88 L22 -88Z" />}
      {item === 'clipboard' && <rect x={18} y={-118} width={24} height={32} rx={2} transform="rotate(10 30 -100)" />}
      {item === 'rope' && <ellipse cx={30} cy={-60} rx={26} ry={12} fill="none" stroke={color} strokeWidth={6} />}
      {rim && <path d={`M-22 -142 Q0 -150 22 -142`} fill="none" stroke={rim} strokeWidth={3} strokeOpacity={0.6} />}
    </g>
  );
};

/** dense row/crowd of seated or standing figures (back view) */
export const Crowd: React.FC<{x: number; y: number; w: number; rows?: number; h?: number; color?: string; hats?: Hat[]; seed?: string; sit?: boolean}> = ({
  x,
  y,
  w,
  rows = 3,
  h = 120,
  color = '#141218',
  hats = ['jcap', 'none', 'jcap', 'woman'],
  seed = 'cr',
  sit = false,
}) => {
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const hh = h * (1 + r * 0.18);
    const n = Math.floor(w / (hh * 0.32));
    for (let i = 0; i < n; i++) {
      const xi = x + (i + (r % 2) * 0.5) * (w / n);
      out.push(
        <Person key={`${r}-${i}`} x={xi} y={y + r * hh * 0.28} h={hh} color={color} hat={hats[(i + r * 3) % hats.length]} pose={sit ? 'sit' : 'stand'} seed={i * 7 + r} skirt={hats[(i + r * 3) % hats.length] === 'woman'} />,
      );
    }
  }
  return <g>{out}</g>;
};
