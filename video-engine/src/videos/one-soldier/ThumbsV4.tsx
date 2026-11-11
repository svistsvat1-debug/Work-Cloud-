// v4 "SAME ARMY?" — more clickbait: rich backgrounds, props, hands, rim light, red circle accent.
// Code-drawn SVG. Objects: rifleman, clerk, text (+ red circle annotation). No Nazi symbols, no gore.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BoldText, RealClerk, RealRifleman} from '../../components/realistic';
import {useFonts} from '../../components/VideoFromTimeline';
import {rnd} from '../../lib/anim';

const INK = '#1d1b18';
const SKIN = '#f1c9a5';
const SKIN_SH = '#d39b78';

/** Simple fist (gripping), local origin = centre. */
const Fist: React.FC<{x: number; y: number; s?: number; rot?: number; skin?: string}> = ({x, y, s = 1, rot = 0, skin = SKIN}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-34,-26 Q-40,0 -30,26 Q0,38 30,26 Q40,0 34,-26 Q0,-38 -34,-26 Z" fill={skin} stroke={INK} strokeWidth={4} />
    <path d="M-30,-8 Q0,-14 30,-8 M-30,8 Q0,2 30,8" stroke={SKIN_SH} strokeWidth={4} fill="none" />
    <path d="M-20,-26 L-20,-12 M0,-30 L0,-14 M20,-26 L20,-12" stroke={INK} strokeWidth={3} />
  </g>
);

/** M1 Garand, diagonal. */
const Garand: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = -35}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <defs>
      <linearGradient id="wood4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b5733c" />
        <stop offset="1" stopColor="#6e3f1c" />
      </linearGradient>
    </defs>
    <path d="M-260,-6 L170,-12 L176,4 L-250,14 Z" fill="#3a3a3a" stroke={INK} strokeWidth={4} />
    <path d="M-170,-18 L60,-22 L70,10 L-40,14 L-80,40 L-200,52 L-230,20 Z" fill="url(#wood4)" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-60,-20 L-60,12 M10,-22 L10,10" stroke="#4d2c12" strokeWidth={3} />
    <circle cx={140} cy={-4} r={4} fill="#ccc" />
  </g>
);

const Typewriter: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-70,-120 L70,-120 L70,-40 L-70,-40 Z" fill="#fbfaf5" stroke={INK} strokeWidth={4} />
    <path d="M-55,-100 h100 M-55,-85 h90 M-55,-70 h100 M-55,-55 h60" stroke="#8a8478" strokeWidth={3} />
    <path d="M-150,-40 L150,-40 L170,60 L-170,60 Z" fill="#2f3a3c" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-160,-48 L160,-48" stroke="#555" strokeWidth={14} strokeLinecap="round" />
    {Array.from({length: 3}).map((_, r) =>
      Array.from({length: 9}).map((__, c) => <circle key={`${r}-${c}`} cx={-120 + c * 30 + r * 8} cy={-10 + r * 22} r={9} fill="#e9e3d2" stroke={INK} strokeWidth={2} />),
    )}
  </g>
);

const Papers: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x},${y})`}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path key={i} d={`M${-70 + (i % 2) * 6},${-i * 14} l140,-4 l4,14 l-140,4 Z`} fill={i % 2 ? '#f6f2e6' : '#ece4cf'} stroke={INK} strokeWidth={2.5} />
    ))}
    <path d="M-40,-96 l70,-2 l2,12 l-70,2 Z" fill="#c93a3d" stroke={INK} strokeWidth={2.5} />
  </g>
);

export const ThumbA4: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f2630" />
            <stop offset="0.55" stopColor="#3b3f44" />
            <stop offset="1" stopColor="#2a2119" />
          </linearGradient>
          <radialGradient id="blast" cx="24%" cy="60%" r="24%">
            <stop offset="0" stopColor="#ffb347" stopOpacity={0.95} />
            <stop offset="0.35" stopColor="#e8632b" stopOpacity={0.55} />
            <stop offset="1" stopColor="#e8632b" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="office" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6d58d" />
            <stop offset="1" stopColor="#d9964a" />
          </linearGradient>
          <radialGradient id="lamp4" cx="62%" cy="22%" r="55%">
            <stop offset="0" stopColor="#fff3c4" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff3c4" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="desk4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a5a32" />
            <stop offset="1" stopColor="#5a3519" />
          </linearGradient>
          <linearGradient id="mud4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5b4330" />
            <stop offset="1" stopColor="#2e2219" />
          </linearGradient>
          <filter id="bgblur" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <filter id="smoke4" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="rim" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <clipPath id="L4">
            <path d="M0,0 L668,0 L650,90 L672,190 L640,300 L664,400 L628,520 L650,620 L610,720 L0,720 Z" />
          </clipPath>
          <clipPath id="R4">
            <path d="M668,0 L1280,0 L1280,720 L610,720 L650,620 L628,520 L664,400 L640,300 L672,190 L650,90 Z" />
          </clipPath>
          <filter id="grain4" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={0.06} />
            </feComponentTransfer>
          </filter>
          <radialGradient id="vig4" cx="50%" cy="50%" r="72%">
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
        </defs>

        {/* ================= LEFT: front line at night ================= */}
        <g clipPath="url(#L4)">
          <rect width={700} height={720} fill="url(#night)" />
          <g filter="url(#bgblur)">
            <rect width={700} height={720} fill="url(#blast)" />
            <ellipse cx={520} cy={420} rx={90} ry={40} fill="#ff9a3d" opacity={0.45} filter="url(#smoke4)" />
            {/* smoke columns */}
            <ellipse cx={150} cy={300} rx={90} ry={170} fill="#2b2b2b" opacity={0.75} filter="url(#smoke4)" />
            <ellipse cx={470} cy={260} rx={70} ry={150} fill="#353535" opacity={0.65} filter="url(#smoke4)" />
            {/* broken trees */}
            <path d="M380,420 L384,250 L370,210 M384,300 L420,262 M382,330 L350,300" stroke="#141414" strokeWidth={9} fill="none" strokeLinecap="round" />
            <path d="M560,430 L556,300 L572,270 M556,350 L530,330" stroke="#141414" strokeWidth={8} fill="none" strokeLinecap="round" />
            {/* horizon + barbed wire */}
            <path d="M0,430 Q200,400 420,425 Q560,440 700,420 L700,720 L0,720 Z" fill="#3a2c20" />
            <path d="M30,440 L36,380 M190,432 L196,374 M350,440 L354,382 M30,392 Q110,412 190,388 Q270,410 350,394" stroke="#111" strokeWidth={4} fill="none" />
          </g>
          {/* illumination flare in the sky */}
          <circle cx={110} cy={170} r={60} fill="#fff4d6" opacity={0.35} filter="url(#rim)" />
          <circle cx={110} cy={170} r={11} fill="#fffbe8" />
          <path d="M110,181 Q100,240 118,300" stroke="#d9d4c4" strokeWidth={3} fill="none" opacity={0.6} />
          {/* mud + puddles reflecting the glow */}
          <path d="M0,560 Q300,530 700,560 L700,720 L0,720 Z" fill="url(#mud4)" />
          <ellipse cx={130} cy={650} rx={90} ry={14} fill="#e8823b" opacity={0.35} />
          <ellipse cx={520} cy={690} rx={110} ry={16} fill="#e8823b" opacity={0.25} />
          {/* rim light from the blast behind him */}
          <ellipse cx={240} cy={330} rx={150} ry={190} fill="#ff9a3d" opacity={0.35} filter="url(#rim)" />
          <RealRifleman x={330} y={360} s={1.0} mood="tired" look={[0.9, 0.1]} light="right" />
          {/* foxhole parapet in front of his chest + rifle in his hands */}
          <Garand x={330} y={600} s={1.05} rot={-28} />
          <Fist x={258} y={622} s={1.0} rot={-20} />
          <Fist x={420} y={572} s={1.0} rot={-30} />
          <path d="M-20,640 Q120,600 330,628 Q520,650 700,620 L700,720 L-20,720 Z" fill="#4a3626" stroke={INK} strokeWidth={5} />
          <path d="M40,660 q30,-12 60,0 M260,670 q40,-14 80,0 M480,666 q30,-10 60,0" stroke="#2a1e15" strokeWidth={4} fill="none" />
          {/* rain */}
          {Array.from({length: 120}).map((_, i) => {
            const x = rnd(i) * 720;
            const y = rnd(i + 500) * 720;
            return <line key={i} x1={x} y1={y} x2={x - 12} y2={y + 40} stroke="#cfe0ef" strokeWidth={2} opacity={0.35} />;
          })}
        </g>

        {/* ================= RIGHT: cosy office ================= */}
        <g clipPath="url(#R4)">
          <rect x={600} width={680} height={720} fill="url(#office)" />
          <g filter="url(#bgblur)">
            {/* sunny window */}
            <rect x={1010} y={60} width={220} height={250} fill="#bfe3f5" stroke="#6b4b2a" strokeWidth={10} />
            <circle cx={1180} cy={110} r={30} fill="#fff6c8" />
            <path d="M1010,260 Q1080,200 1150,250 Q1200,210 1230,240 L1230,310 L1010,310 Z" fill="#7fae5a" />
            <path d="M1120,60 L1120,310 M1010,185 L1230,185" stroke="#6b4b2a" strokeWidth={8} />
            {/* framed map on the wall */}
            <rect x={700} y={80} width={190} height={140} fill="#e6d6b2" stroke="#6b4b2a" strokeWidth={8} />
            <path d="M720,170 Q760,120 800,150 Q840,110 870,140" stroke="#c93a3d" strokeWidth={5} fill="none" />
            <path d="M720,110 Q770,140 860,100" stroke="#8a7a5a" strokeWidth={3} fill="none" />
          </g>
          <rect x={600} width={680} height={720} fill="url(#lamp4)" />
          <RealClerk x={930} y={360} s={1.0} mood="smug" look={[0, 0]} />
          {/* desk with typewriter and paperwork */}
          <path d="M600,600 L1280,600 L1280,720 L600,720 Z" fill="url(#desk4)" />
          <path d="M600,600 L1280,600" stroke="#3d2412" strokeWidth={8} />
          <Papers x={720} y={598} />
          <Typewriter x={930} y={620} s={0.9} />
          {/* mug in hand */}
          <g>
            
            <path d="M1150,400 q-14,-24 0,-48 q14,-24 0,-48 M1176,402 q-14,-24 0,-48 q14,-24 0,-48" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
            <path d="M1120,412 L1206,412 L1200,512 Q1163,526 1126,512 Z" fill="#f4f1ea" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M1206,432 Q1244,436 1238,470 Q1232,494 1202,490" fill="none" stroke={INK} strokeWidth={8} />
            <ellipse cx={1163} cy={412} rx={43} ry={9} fill="#6b3f22" stroke={INK} strokeWidth={4} />
            <Fist x={1236} y={470} s={0.8} rot={-80} />
          </g>
          {/* clickbait accent: red circle + arrow on the coffee */}
          <ellipse cx={1170} cy={420} rx={92} ry={118} fill="none" stroke="#e8322b" strokeWidth={10} transform="rotate(-8 1170 420)" />
        </g>

        {/* torn divider */}
        <path d="M668,0 L650,90 L672,190 L640,300 L664,400 L628,520 L650,620 L610,720" fill="none" stroke="#f6f1e6" strokeWidth={20} strokeLinejoin="round" />
        <path d="M668,0 L650,90 L672,190 L640,300 L664,400 L628,520 L650,620 L610,720" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />

        <rect width={1280} height={720} filter="url(#grain4)" />
        <rect width={1280} height={720} fill="url(#vig4)" />
        <BoldText text="SAME ARMY?" x={640} y={128} size={124} fill="#ffd23f" rot={-2} />
      </svg>
    </AbsoluteFill>
  );
};
