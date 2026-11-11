// Big expressive marker-style characters for thumbnails & close-ups (reusable).
import React from 'react';
import {C, circ} from './draw';

const INK = C.ink;
const SKIN = '#FFF4E6';
const W = 8; // outline width at scale 1

type Mood = 'worried' | 'shocked' | 'smug' | 'tired';

/** Eyes + brows + mouth for a head centred at 0,0 with radius 100. look = pupil offset (-1..1). */
const FaceParts: React.FC<{mood: Mood; look?: [number, number]}> = ({mood, look = [0.5, 0]}) => {
  const [lx, ly] = look;
  const eye = (cx: number) => {
    if (mood === 'smug') {
      // closed happy eyes
      return <path d={`M${cx - 22},${-2} Q${cx},${-22} ${cx + 22},${-2}`} fill="none" stroke={INK} strokeWidth={W} strokeLinecap="round" />;
    }
    const ry = mood === 'shocked' ? 30 : mood === 'tired' ? 16 : 25;
    return (
      <g>
        <ellipse cx={cx} cy={-4} rx={22} ry={ry} fill="#fff" stroke={INK} strokeWidth={W * 0.75} />
        <circle cx={cx + lx * 9} cy={-4 + ly * 8} r={mood === 'shocked' ? 7 : 10} fill={INK} />
        {mood === 'tired' && <path d={`M${cx - 24},${-8} L${cx + 24},${-8}`} stroke={INK} strokeWidth={W * 0.75} />}
      </g>
    );
  };
  const brows =
    mood === 'worried' || mood === 'tired'
      ? 'M-62,-48 L-18,-58 M18,-58 L62,-48' // inner ends raised
      : mood === 'shocked'
        ? 'M-64,-62 Q-40,-80 -16,-64 M16,-64 Q40,-80 64,-62'
        : 'M-60,-46 Q-38,-56 -16,-48 M16,-48 Q38,-60 60,-50';
  const mouth =
    mood === 'worried'
      ? 'M-34,58 Q-17,44 0,56 Q17,68 34,52'
      : mood === 'shocked'
        ? ''
        : mood === 'tired'
          ? 'M-28,60 Q0,50 28,60'
          : 'M-46,40 Q0,92 46,40 Z';
  return (
    <g>
      {eye(-40)}
      {eye(40)}
      <path d={brows} fill="none" stroke={INK} strokeWidth={W} strokeLinecap="round" />
      {mood === 'shocked' && <ellipse cx={0} cy={60} rx={18} ry={24} fill="#5a2a2a" stroke={INK} strokeWidth={W * 0.8} />}
      {mouth && <path d={mouth} fill={mood === 'smug' ? '#7a2f2f' : 'none'} stroke={INK} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />}
      {(mood === 'worried' || mood === 'tired') && (
        <path d="M-60,22 Q-48,30 -34,24 M34,24 Q48,30 60,22" fill="none" stroke="#9b8a7a" strokeWidth={4} strokeLinecap="round" />
      )}
    </g>
  );
};

/** Front-line rifleman bust: helmet, mud, sweat. (x,y) = head centre, s = scale (head radius 100*s). */
export const Rifleman: React.FC<{x: number; y: number; s?: number; mood?: Mood; look?: [number, number]; mud?: boolean; flip?: boolean}> = ({
  x,
  y,
  s = 1,
  mood = 'worried',
  look,
  mud = true,
  flip,
}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    {/* shoulders / uniform */}
    <path d="M-150,330 Q-150,150 -40,120 L40,120 Q150,150 150,330 Z" fill={C.olive} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M-40,120 L0,175 L40,120" fill="#59672f" stroke={INK} strokeWidth={W * 0.75} strokeLinejoin="round" />
    <path d="M-95,150 L60,330" stroke="#3f2a16" strokeWidth={18} strokeLinecap="round" />
    <path d="M-95,150 L60,330" stroke={INK} strokeWidth={3} strokeDasharray="6 10" />
    {/* head */}
    <path d={circ(0, 0, 100)} fill={SKIN} stroke={INK} strokeWidth={W} />
    {mud && (
      <g fill="#7b5b3a" opacity={0.75}>
        <ellipse cx={-62} cy={40} rx={18} ry={11} />
        <ellipse cx={54} cy={58} rx={12} ry={8} />
        <circle cx={-30} cy={70} r={6} />
        <circle cx={70} cy={20} r={5} />
      </g>
    )}
    <FaceParts mood={mood} look={look} />
    {/* sweat drop */}
    {mood !== 'smug' && <path d="M92,-30 q14,22 0,34 q-14,-12 0,-34 Z" fill="#8fd0ff" stroke={INK} strokeWidth={4} />}
    {/* helmet (M1 style) with net */}
    <path d="M-118,-20 Q-118,-138 0,-140 Q118,-138 118,-20 Z" fill={C.olive} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M-80,-120 L-30,-30 M-30,-136 L20,-30 M20,-138 L70,-34 M70,-126 L104,-62 M-104,-80 L-70,-26" stroke="#3f4a22" strokeWidth={4} opacity={0.7} />
    <path d="M-132,-22 L132,-22" stroke={INK} strokeWidth={W * 1.6} strokeLinecap="round" />
    <path d="M-104,-18 Q-100,70 -60,96 M104,-18 Q100,70 60,96" fill="none" stroke="#3f2a16" strokeWidth={6} />
  </g>
);

/** Rear-echelon clerk bust: side cap, tie, coffee mug. */
export const Clerk: React.FC<{x: number; y: number; s?: number; mood?: Mood; mug?: boolean; flip?: boolean}> = ({x, y, s = 1, mood = 'smug', mug = true, flip}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <path d="M-150,330 Q-150,150 -40,120 L40,120 Q150,150 150,330 Z" fill={C.khaki} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M-40,120 L0,160 L40,120" fill="#e9dfc4" stroke={INK} strokeWidth={W * 0.75} strokeLinejoin="round" />
    <path d="M-12,160 L12,160 L20,290 L0,312 L-20,290 Z" fill="#6b5a3a" stroke={INK} strokeWidth={W * 0.6} strokeLinejoin="round" />
    <path d={circ(0, 0, 100)} fill={SKIN} stroke={INK} strokeWidth={W} />
    <FaceParts mood={mood} look={[0, 0]} />
    {/* garrison (side) cap */}
    <path d="M-96,-52 Q-60,-120 30,-118 L100,-70 Q20,-82 -96,-52 Z" fill={C.khaki} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M-80,-60 Q0,-80 96,-72" fill="none" stroke={INK} strokeWidth={4} />
    {mug && (
      <g transform="translate(150,190)">
        <path d="M-40,-50 L40,-50 L34,40 L-34,40 Z" fill="#fff" stroke={INK} strokeWidth={W * 0.8} strokeLinejoin="round" />
        <path d="M40,-30 Q72,-24 66,6 Q60,24 36,20" fill="none" stroke={INK} strokeWidth={W * 0.8} />
        <path d="M-14,-66 q-14,-22 0,-44 M12,-66 q-14,-22 0,-44" fill="none" stroke="#aaa" strokeWidth={5} strokeLinecap="round" />
      </g>
    )}
  </g>
);

/** Thick hand-lettered thumbnail text with white halo + optional yellow marker highlight. */
export const ThumbText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  highlight?: string;
  rot?: number;
  width?: number;
}> = ({text, x, y, size, color = INK, anchor = 'middle', highlight, rot = 0, width}) => {
  const w = width ?? text.length * size * 0.62;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g transform={`rotate(${rot},${x},${y})`}>
      {highlight && <path d={`M${x0 - 20},${y - size * 0.62} L${x0 + w + 20},${y - size * 0.7} L${x0 + w + 14},${y + size * 0.14} L${x0 - 14},${y + size * 0.2} Z`} fill={highlight} opacity={0.95} />}
      <text x={x} y={y} textAnchor={anchor} fontFamily='"Permanent Marker", cursive' fontSize={size} fill="none" stroke="#fff" strokeWidth={size * 0.2} strokeLinejoin="round">
        {text}
      </text>
      <text x={x} y={y} textAnchor={anchor} fontFamily='"Permanent Marker", cursive' fontSize={size} fill={color} stroke={INK} strokeWidth={size * 0.035} strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
};
