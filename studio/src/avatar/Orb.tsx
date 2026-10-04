import React, {useId} from 'react';
import {C} from '../brand';
import type {AvatarState} from './useAvatar';

/** "Sunny": a glowing brand-yellow orb with a minimal face. */
export const OrbAvatar: React.FC<{s: AvatarState; width?: number}> = ({s, width = 600}) => {
  const id = useId().replace(/:/g, '');
  const {mouth, blink, brow, nod, t, speaking} = s;
  const float = Math.sin(t * 2 * Math.PI * 0.45) * 12 + nod * 10;
  const squash = 1 + (speaking ? mouth.open * 0.03 : 0);
  const eyeH = 78 * (1 - blink * 0.92);
  const eyeY = 300 - brow * 14;
  const mw = 40 + mouth.wide * 95 - mouth.round * 40;
  const mh = Math.max(7, 6 + mouth.open * 85 - mouth.press * 4);
  const aura = speaking ? 0.35 + mouth.open * 0.4 : 0.25;
  return (
    <svg viewBox="0 0 600 720" width={width} height={width * 1.2} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id={`o${id}`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#FFF7A8" />
          <stop offset="0.45" stopColor={C.yellow} />
          <stop offset="1" stopColor="#B89F00" />
        </radialGradient>
        <filter id={`b${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>
      <ellipse cx="300" cy="650" rx={170 - float} ry="22" fill="#000" opacity="0.55" />
      <g transform={`translate(0 ${float})`}>
        <circle cx="300" cy="330" r="250" fill={C.yellow} opacity={aura * 0.45} filter={`url(#b${id})`} />
        {[0, 1].map((k) => {
          const ph = ((t * 0.8 + k * 0.5) % 1 + 1) % 1;
          return <circle key={k} cx="300" cy="330" r={235 + ph * 70} fill="none" stroke={C.yellow} strokeWidth="4" opacity={(1 - ph) * aura} />;
        })}
        <g transform={`translate(300 330) scale(${1 / squash} ${squash}) translate(-300 -330)`}>
          <circle cx="300" cy="330" r="230" fill={`url(#o${id})`} />
          <ellipse cx="225" cy="215" rx="70" ry="38" fill="#fff" opacity="0.35" transform="rotate(-25 225 215)" />
          <ellipse cx="195" cy="390" rx="34" ry="18" fill="#FF9A3C" opacity="0.35" />
          <ellipse cx="405" cy="390" rx="34" ry="18" fill="#FF9A3C" opacity="0.35" />
          <rect x={235 - 22} y={eyeY - eyeH / 2} width="44" height={eyeH} rx="22" fill="#111" />
          <rect x={365 - 22} y={eyeY - eyeH / 2} width="44" height={eyeH} rx="22" fill="#111" />
          <circle cx={243} cy={eyeY - eyeH * 0.22} r={blink > 0.5 ? 0 : 7} fill="#fff" />
          <circle cx={373} cy={eyeY - eyeH * 0.22} r={blink > 0.5 ? 0 : 7} fill="#fff" />
          <rect x={300 - mw / 2} y={405 - mh / 2} width={mw} height={mh} rx={Math.min(mh / 2, 8 + mouth.round * 50)} fill="#111" />
          {mh > 30 ? <ellipse cx="300" cy={405 + mh / 2 - 10} rx={mw * 0.28} ry="9" fill="#E0605A" /> : null}
        </g>
      </g>
    </svg>
  );
};
