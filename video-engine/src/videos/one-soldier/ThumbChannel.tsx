// Channel-format thumbnail (standard since 2026-11-11): huge condensed text left (black + red),
// one pen-and-ink sketch illustration right, paper background. Max 3 objects, max 4 words.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import '@fontsource/anton';
import {RealRifleman} from '../../components/realistic';
import {useFonts} from '../../components/VideoFromTimeline';

const useAnton = () => {
  const [h] = useState(() => delayRender('anton'));
  useEffect(() => {
    document.fonts.load('200px "Anton"').then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};

/** Pencil-sketch support soldier (faint): body outline + hatching, optional prop. */
const Ghost: React.FC<{x: number; y: number; s: number; prop: 'pot' | 'crate' | 'typewriter' | 'wrench' | 'none'; o: number}> = ({x, y, s, prop, o}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o} fill="none" stroke="#5d5a54" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx={0} cy={-170} rx={24} ry={28} strokeWidth={4} fill="#f3eee2" />
    <path d="M-26,-178 Q0,-212 26,-178" strokeWidth={4} />
    <path d="M-40,-136 Q0,-150 40,-136 L48,-30 L-48,-30 Z" strokeWidth={4} fill="#ece6d8" />
    <path d="M-40,-136 L-56,-60 M40,-136 L56,-60 M-24,-30 L-28,40 M24,-30 L28,40" strokeWidth={5} />
    <g strokeWidth={2} opacity={0.7}>
      {Array.from({length: 7}).map((_, i) => (
        <path key={i} d={`M${10 + i * 5},${-128 + i * 4} L${-30 + i * 10},${-34}`} />
      ))}
    </g>
    {prop === 'pot' && <path d="M40,-80 h50 v34 h-50 Z M34,-80 h62" strokeWidth={4} fill="#ece6d8" />}
    {prop === 'crate' && <path d="M-110,-110 h60 v50 h-60 Z M-110,-110 l60,50" strokeWidth={4} fill="#ece6d8" />}
    {prop === 'typewriter' && <path d="M36,-96 h70 l8,34 h-86 Z M50,-96 v-22 h42 v22" strokeWidth={4} fill="#ece6d8" />}
    {prop === 'wrench' && <path d="M56,-62 L100,-110 M92,-118 l16,0 l0,16" strokeWidth={6} />}
  </g>
);

export const ThumbChannelA: React.FC = () => {
  useFonts();
  useAnton();
  const ghosts: [number, number, number, 'pot' | 'crate' | 'typewriter' | 'wrench' | 'none', number][] = [
    [690, 452, 0.5, 'none', 0.5],
    [742, 470, 0.6, 'crate', 0.58],
    [800, 492, 0.72, 'wrench', 0.66],
    [866, 518, 0.86, 'typewriter', 0.74],
    [940, 548, 1.0, 'pot', 0.82],
  ];
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <defs>
          <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="9" stroke="#2a2621" strokeWidth="2.2" />
          </pattern>
          {/* ink look: slightly desaturated, warmer colour wash */}
          <filter id="wash" x="-5%" y="-5%" width="110%" height="110%">
            <feColorMatrix type="saturate" values="0.62" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.96" intercept="0.05" />
              <feFuncG type="linear" slope="0.94" intercept="0.05" />
              <feFuncB type="linear" slope="0.88" intercept="0.04" />
            </feComponentTransfer>
          </filter>
          {/* luminance mask: hatching appears only in the darker (shadow) areas of the figure */}
          <filter id="shadowsOnly">
            <feColorMatrix type="luminanceToAlpha" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="1 0.85 0.2 0 0 0" />
            </feComponentTransfer>
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="dark" />
            <feComposite in="dark" in2="SourceGraphic" operator="in" />
          </filter>
          <mask id="shadowMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720">
            <g filter="url(#shadowsOnly)">
              <RealRifleman x={1060} y={340} s={1.05} mood="worried" look={[-0.9, 0]} light="left" flip />
            </g>
          </mask>
          <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={8} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={0.05} />
            </feComponentTransfer>
          </filter>
        </defs>
        {/* paper */}
        <rect width={1280} height={720} fill="#f4f1ea" />
        <image href={staticFile('paper.png')} x={0} y={0} width={1920} height={1080} transform="scale(0.667)" opacity={0.9} />
        {/* the hidden army: faint pencil figures receding behind him */}
        <path d="M660,470 Q820,500 1000,600" stroke="#8a857b" strokeWidth={3} fill="none" opacity={0.5} />
        {ghosts.map(([x, y, s, p, o], i) => (
          <Ghost key={i} x={x} y={y} s={s} prop={p} o={o} />
        ))}
        {/* the rifleman: colour wash + ink hatching in the shadows */}
        <g filter="url(#wash)">
          <RealRifleman x={1060} y={340} s={1.05} mood="worried" look={[-0.9, 0]} light="left" flip />
        </g>
        <rect width={1280} height={720} fill="url(#hatch)" mask="url(#shadowMask)" opacity={0.55} />
        {/* text: channel format, max 4 words */}
        <g fontFamily='"Anton", sans-serif' textAnchor="start">
          <text x={56} y={176} fontSize={128} fill="#151515" letterSpacing={2}>THE</text>
          <text x={50} y={398} fontSize={232} fill="#151515" letterSpacing={2}>HIDDEN</text>
          <text x={50} y={636} fontSize={250} fill="#d7261e" letterSpacing={3}>ARMY</text>
        </g>
        <rect width={1280} height={720} filter="url(#paperGrain)" />
      </svg>
    </AbsoluteFill>
  );
};
