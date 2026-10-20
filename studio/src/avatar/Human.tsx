import React from 'react';
import {C} from '../brand';
import type {AvatarState} from './useAvatar';

/** "Alex": flat-illustrated presenter (stylised, clearly not a real person). */
export const HumanAvatar: React.FC<{s: AvatarState; width?: number}> = ({s, width = 600}) => {
  const {mouth, blink, brow, nod, t, speaking} = s;
  const bob = Math.sin(t * 2 * Math.PI * 0.5) * 4 + nod * 7;
  const tilt = Math.sin(t * 0.7) * 1.8 - nod * 2.5 + (speaking ? Math.sin(t * 3.1) * 0.8 : 0);
  const skin = '#E9B48E';
  const skinDark = '#D69C76';
  const hair = '#221812';
  const browY = 238 - brow * 14;
  const eyeOpen = 1 - blink;
  const mw = 56 + mouth.wide * 66 - mouth.round * 30;
  const mh = Math.max(4, 4 + mouth.open * 54 - mouth.press * 3);
  const my = 418;
  return (
    <svg viewBox="0 0 600 720" width={width} height={width * 1.2} style={{overflow: 'visible'}}>
      <ellipse cx="300" cy="712" rx="230" ry="16" fill="#000" opacity="0.5" />
      <path d="M40 720 C 60 590, 170 548, 300 548 C 430 548, 540 590, 560 720 Z" fill="#141414" />
      <path d="M250 548 Q300 600 350 548" fill={skinDark} />
      <rect x="282" y="622" width="36" height="36" transform="rotate(45 300 640)" fill={C.yellow} />
      <g transform={`translate(0 ${bob}) rotate(${tilt} 300 380)`}>
        <rect x="258" y="455" width="84" height="110" rx="30" fill={skinDark} />
        <ellipse cx="148" cy="320" rx="30" ry="44" fill={skinDark} />
        <ellipse cx="452" cy="320" rx="30" ry="44" fill={skinDark} />
        <ellipse cx="300" cy="310" rx="152" ry="182" fill={skin} />
        <path d="M150 270 C 140 140, 230 92, 310 98 C 410 104, 470 160, 452 268 C 440 210, 400 178, 340 176 C 280 174, 230 168, 196 196 C 170 214, 160 240, 150 270 Z" fill={hair} />
        <rect x={205} y={browY} width="70" height="16" rx="8" fill={hair} transform={`rotate(${-4 - brow * 4} 240 ${browY})`} />
        <rect x={325} y={browY} width="70" height="16" rx="8" fill={hair} transform={`rotate(${4 + brow * 4} 360 ${browY})`} />
        {eyeOpen > 0.35 ? (
          <>
            <ellipse cx="240" cy="296" rx="15" ry={19 * eyeOpen} fill="#1A1A1A" />
            <ellipse cx="360" cy="296" rx="15" ry={19 * eyeOpen} fill="#1A1A1A" />
            <circle cx="245" cy="289" r="5" fill="#fff" />
            <circle cx="365" cy="289" r="5" fill="#fff" />
          </>
        ) : (
          <>
            <path d="M222 298 Q240 306 258 298" stroke="#1A1A1A" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M342 298 Q360 306 378 298" stroke="#1A1A1A" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        )}
        <rect x="190" y="258" width="100" height="78" rx="30" fill="none" stroke="#111" strokeWidth="9" />
        <rect x="310" y="258" width="100" height="78" rx="30" fill="none" stroke="#111" strokeWidth="9" />
        <path d="M290 290 Q300 282 310 290" stroke="#111" strokeWidth="8" fill="none" />
        <path d="M300 330 Q288 365 296 375 Q304 380 314 372" stroke={skinDark} strokeWidth="7" fill="none" strokeLinecap="round" />
        <ellipse cx="225" cy="370" rx="26" ry="14" fill="#F08C7A" opacity="0.3" />
        <ellipse cx="375" cy="370" rx="26" ry="14" fill="#F08C7A" opacity="0.3" />
        <g>
          <rect x={300 - mw / 2} y={my - mh / 2} width={mw} height={mh} rx={Math.min(mh / 2, 10 + mouth.round * 40)} fill="#3A1216" />
          {mh > 12 && mouth.teeth > 0.15 ? (
            <rect x={300 - mw / 2 + 8} y={my - mh / 2} width={mw - 16} height={Math.min(mh * 0.35, 14) * mouth.teeth + 2} rx="4" fill="#fff" />
          ) : null}
          {mh > 26 ? <ellipse cx="300" cy={my + mh / 2 - 8} rx={mw * 0.3} ry="8" fill="#D56A6A" /> : null}
          <rect
            x={300 - mw / 2 - 4}
            y={my - mh / 2 - 4}
            width={mw + 8}
            height={mh + 8}
            rx={Math.min((mh + 8) / 2, 14 + mouth.round * 40)}
            fill="none"
            stroke="#B65F58"
            strokeWidth="6"
          />
        </g>
      </g>
    </svg>
  );
};
