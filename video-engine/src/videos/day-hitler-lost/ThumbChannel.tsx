// Replacement thumbnail for "The Day Hitler Lost WW2" (channel format, NO Nazi symbols).
// Text: "IT WASN'T 1945" — does not repeat the title, does not reveal the answer (22 June 1941).
import React from 'react';
import {ANTON, PaperThumb, Sketch} from '../../components/sketchThumb';
import {RealRifleman} from '../../components/realistic';

/** Tear-off calendar page, date hidden behind a red question mark. */
const Calendar: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-110,-120 L110,-120 L110,130 L60,118 L20,134 L-30,116 L-70,132 L-110,120 Z" fill="#fbf8f0" stroke="#1a1a1a" strokeWidth={5} strokeLinejoin="round" />
    <path d="M-110,-120 L110,-120 L110,-60 L-110,-60 Z" fill="#c93a3d" stroke="#1a1a1a" strokeWidth={5} />
    <path d="M-60,-140 L-60,-100 M60,-140 L60,-100" stroke="#1a1a1a" strokeWidth={10} strokeLinecap="round" />
    <text x={0} y={90} textAnchor="middle" fontFamily={ANTON} fontSize={170} fill="#c93a3d">?</text>
    <path d="M-90,-36 h180 M-90,104 h40" stroke="#b9b2a2" strokeWidth={3} />
  </g>
);

export const ThumbHitlerLost: React.FC = () => (
  <PaperThumb>
    <Sketch>
      <Calendar x={800} y={430} s={0.78} rot={-7} />
      <RealRifleman x={1085} y={345} s={1.02} mood="worried" look={[-0.95, 0.25]} light="left" flip army="de" />
    </Sketch>
    <g fontFamily={ANTON}>
      <text x={52} y={250} fontSize={176} fill="#151515" letterSpacing={2}>IT WASN'T</text>
      <text x={46} y={590} fontSize={310} fill="#d7261e" letterSpacing={4}>1945</text>
    </g>
    {/* marker strike-through over 1945 */}
    <path d="M30,500 Q280,450 560,476" fill="none" stroke="#151515" strokeWidth={26} strokeLinecap="round" />
  </PaperThumb>
);
