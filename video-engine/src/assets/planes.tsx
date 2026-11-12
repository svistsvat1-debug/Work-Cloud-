// Aircraft silhouettes (side view, nose right). Simplified but recognizable shapes.
import React from 'react';
import {useShot, wave} from '../engine/core';

/** single-engine carrier fighter (Zero-like), 400-unit box nose right, wheels touch y=0 */
export const Fighter: React.FC<{
  x: number;
  y: number;
  len: number;
  color?: string;
  rim?: string;
  roundel?: string; // national disc color (muted), omit for pure silhouette
  prop?: 'spin' | 'stopped' | 'none';
  gear?: boolean; // on the ground (tail-down attitude) vs flying (level)
  flip?: boolean;
  net?: string; // camouflage net color over the plane
  tilt?: number;
}> = ({x, y, len, color = '#1d1a22', rim, roundel, prop = 'stopped', gear = true, flip = false, net, tilt = 0}) => {
  const {t} = useShot();
  const s = len / 400;
  // ground attitude: nose up ~8 deg around the main wheels (x=300)
  const att = gear ? -8 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${tilt})`}>
      <g transform={`rotate(${att} 300 -14)`}>
        {gear && (
          <g fill={color}>
            <path d="M290 -60 L300 -60 L306 -16 L296 -16Z" />
            <circle cx={301} cy={-14} r={15} />
            <path d="M40 -56 L48 -56 L50 -24 L44 -24Z" />
            <circle cx={47} cy={-18} r={8} />
          </g>
        )}
        {/* fuselage: fat radial nose tapering to tail */}
        <path d="M20 -66 L30 -84 Q120 -96 250 -100 L330 -104 Q360 -104 362 -80 Q360 -58 330 -58 L250 -56 Q120 -58 30 -62 Z" fill={color} />
        {/* canopy greenhouse */}
        <path d="M200 -98 Q214 -128 252 -128 Q270 -126 286 -102 Z" fill={color} />
        {/* fin + rudder */}
        <path d="M24 -80 L14 -140 Q30 -146 46 -138 L80 -92 Z" fill={color} />
        {/* stabilizer */}
        <path d="M8 -72 L92 -76 L94 -68 L10 -66 Z" fill={color} />
        {/* low wing root + wing (side) */}
        <path d="M200 -62 Q260 -70 330 -66 L330 -54 Q260 -50 206 -52 Z" fill={color} />
        {/* cowl ring */}
        <path d="M330 -106 Q376 -106 378 -81 Q376 -56 330 -56 Z" fill={color} />
        {roundel && <circle cx={130} cy={-78} r={13} fill={roundel} opacity={0.9} />}
        {rim && <path d="M30 -84 Q120 -96 250 -100 L330 -104 Q376 -106 378 -81" fill="none" stroke={rim} strokeWidth={3.5} strokeOpacity={0.6} />}
        {prop === 'spin' && <ellipse cx={382} cy={-81} rx={6} ry={52} fill={color} opacity={0.35 + 0.1 * wave(t, 0.1)} />}
        {prop === 'stopped' && (
          <g fill={color}>
            <path d="M378 -84 Q384 -110 380 -136 L386 -136 Q390 -110 386 -84 Z" />
            <path d="M378 -78 Q384 -52 380 -28 L386 -28 Q390 -52 386 -78 Z" />
            <circle cx={384} cy={-81} r={8} />
          </g>
        )}
        {prop === 'none' && <rect x={376} y={-86} width={6} height={10} fill={color} />}
      </g>
      {net && <path d="M-10 -10 Q0 -150 200 -170 Q400 -160 420 -10 Z" fill={net} opacity={0.85} />}
    </g>
  );
};

/** loose propeller lying on the ground / in a pile */
export const LooseProp: React.FC<{x: number; y: number; len?: number; rot?: number; color?: string}> = ({x, y, len = 120, rot = 0, color = '#1d1a22'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} fill={color}>
    <path d={`M${-len / 2} -5 Q0 -12 ${len / 2} -5 L${len / 2} 5 Q0 12 ${-len / 2} 5Z`} />
    <circle cx={0} cy={0} r={9} />
  </g>
);

/** four-engine heavy bomber silhouette (side view, nose right), 1000-unit box */
export const Bomber: React.FC<{x: number; y: number; len: number; color?: string; speed?: number; rim?: string}> = ({x, y, len, color = '#141821', speed = 0, rim}) => {
  const {t} = useShot();
  const s = len / 1000;
  const xx = x + speed * t;
  return (
    <g transform={`translate(${xx} ${y + 4 * wave(t, 5)}) scale(${s})`} fill={color}>
      <path d="M40 -60 Q20 -64 30 -40 L900 -30 Q990 -36 1000 -52 Q990 -76 900 -82 L120 -80 Z" />
      <path d="M40 -60 L0 -190 L80 -186 L150 -80 Z" />
      <path d="M20 -66 L180 -70 L180 -56 L20 -54 Z" />
      <path d="M430 -56 L720 -52 L720 -40 L440 -38 Z" />
      {[480, 560, 640].map((ex, i) => (
        <ellipse key={i} cx={ex} cy={-42} rx={28} ry={12} />
      ))}
      {rim && <path d="M120 -80 L900 -82 Q990 -76 1000 -52" fill="none" stroke={rim} strokeWidth={5} strokeOpacity={0.5} />}
    </g>
  );
};

/** small cylinder dropping (aerial mine) */
export const DropMine: React.FC<{x: number; y: number; start: number; fall?: number; color?: string}> = ({x, y, start, fall = 500, color = '#141821'}) => {
  const {t} = useShot();
  const k = Math.max(0, t - start);
  if (t < start) return null;
  const yy = y + Math.min(fall, 0.5 * 260 * k * k);
  return <rect x={x - 6 - k * 30} y={yy} width={12} height={34} rx={5} fill={color} transform={`rotate(${-8} ${x} ${yy})`} />;
};
