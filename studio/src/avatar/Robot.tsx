import React, {useId} from 'react';
import {C} from '../brand';
import type {AvatarState} from './useAvatar';

/** "Bolt": dark robot head with a screen face; yellow LED eyes and mouth. */
export const RobotAvatar: React.FC<{s: AvatarState; width?: number}> = ({s, width = 600}) => {
  const id = useId().replace(/:/g, '');
  const {mouth, blink, brow, nod, t, speaking} = s;
  const bob = Math.sin(t * 2 * Math.PI * 0.5) * 6 + (speaking ? Math.sin(t * 2 * Math.PI * 2.1) * 2.5 : 0) + nod * 8;
  const tilt = Math.sin(t * 0.8) * 1.6 - nod * 2;
  const eyeH = 74 * (1 - blink * 0.9) + brow * 6;
  const eyeY = 262 - brow * 12;
  const mw = 60 + mouth.wide * 120 - mouth.round * 45;
  const mh = Math.max(9, 10 + mouth.open * 92 - mouth.press * 6);
  const rx = Math.min(mh / 2, 10 + mouth.round * 60);
  const antenna = 52 + Math.sin(t * 2 * Math.PI * 1.3) * (speaking ? 4 : 1.5);
  return (
    <svg viewBox="0 0 600 720" width={width} height={width * 1.2} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2A2A" />
          <stop offset="1" stopColor="#121212" />
        </linearGradient>
        <filter id={`g${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="300" cy="712" rx="230" ry="16" fill="#000" opacity="0.5" />
      <path d="M50 720 C 70 585, 180 540, 300 540 C 420 540, 530 585, 550 720 Z" fill="#161616" stroke="#2B2B2B" strokeWidth="4" />
      <rect x="282" y="612" width="36" height="36" transform="rotate(45 300 630)" fill={C.yellow} />
      <rect x="250" y="470" width="100" height="90" rx="24" fill="#1E1E1E" stroke="#2B2B2B" strokeWidth="4" />
      <g transform={`translate(0 ${bob}) rotate(${tilt} 300 330)`}>
        <line x1="300" y1="118" x2="300" y2={antenna + 18} stroke="#333" strokeWidth="10" strokeLinecap="round" />
        <circle cx="300" cy={antenna} r="18" fill={C.yellow} filter={`url(#g${id})`} />
        <rect x="64" y="245" width="52" height="120" rx="22" fill="#1E1E1E" stroke="#2E2E2E" strokeWidth="4" />
        <rect x="484" y="245" width="52" height="120" rx="22" fill="#1E1E1E" stroke="#2E2E2E" strokeWidth="4" />
        <rect x="80" y="290" width="20" height="30" rx="8" fill={C.yellow} opacity="0.8" />
        <rect x="500" y="290" width="20" height="30" rx="8" fill={C.yellow} opacity="0.8" />
        <rect x="100" y="115" width="400" height="375" rx="120" fill={`url(#h${id})`} stroke="#303030" strokeWidth="5" />
        <path d="M170 140 Q300 110 430 140 Q380 150 300 150 Q220 150 170 140 Z" fill="#fff" opacity="0.08" />
        <rect x="138" y="168" width="324" height="270" rx="86" fill="#040404" stroke="#1C1C1C" strokeWidth="4" />
        {Array.from({length: 13}).map((_, i) => (
          <line key={i} x1="150" x2="450" y1={180 + i * 20} y2={180 + i * 20} stroke="#fff" opacity="0.025" strokeWidth="2" />
        ))}
        <g filter={`url(#g${id})`}>
          <rect x={215 - 30} y={eyeY - eyeH / 2} width="60" height={eyeH} rx="28" fill={C.yellow} />
          <rect x={385 - 30} y={eyeY - eyeH / 2} width="60" height={eyeH} rx="28" fill={C.yellow} />
          <rect x={300 - mw / 2} y={370 - mh / 2} width={mw} height={mh} rx={rx} fill={C.yellow} />
        </g>
        {mouth.teeth > 0.5 && mh > 24 ? (
          <line x1={300 - mw / 2 + 10} x2={300 + mw / 2 - 10} y1={370} y2={370} stroke="#040404" strokeWidth="4" opacity={0.6} />
        ) : null}
      </g>
    </svg>
  );
};
