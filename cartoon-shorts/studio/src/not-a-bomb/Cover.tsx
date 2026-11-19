import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SP} from './sprites';
import {FONT, useNABFont} from './Short';

// Cover (0 credits): the shocked fisherman in his boat + the bomb on its parachute with worried eyes + "LOST AT SEA".
// Three things only; text kept away from the bottom 20 % and the right edge (YouTube buttons).
const F = (n: string) => staticFile(`not-a-bomb/${n}.png`);
type Info = {w: number; h: number; feet: [number, number]};
const S = (n: string) => (SP as unknown as Record<string, Info>)[n];

export const NotABombCover: React.FC = () => {
  useNABFont();
  const boat = S('boat');
  const fish = S('f_up');
  const bomb = S('bomb');
  const bs = 1.85; // boat scale
  const fs = 1.05; // fisherman scale
  const L = 380 / 714; // bomb scale: 380 px nose -> tail, hanging nose down
  return (
    <AbsoluteFill style={{background: '#71C8FE'}}>
      {/* sea plate, horizon raised to ~44 % */}
      <Img src={F('sea')} style={{position: 'absolute', left: -540, top: -1050, width: 2160, height: 3240}} />
      {/* the parachute + bomb (drawn in SVG) */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <g>
          {/* canopy */}
          {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((f, i) => (
            <line key={i} x1={760 + f * 230} y1={560} x2={760} y2={720} stroke="#2A2A2A" strokeWidth={4} />
          ))}
          <path d="M 530 560 C 520 420 620 330 760 330 C 900 330 1000 420 990 560 Q 951 590 913 560 Q 875 590 836 560 Q 798 590 760 560 Q 722 590 684 560 Q 645 590 607 560 Q 568 590 530 560 Z" fill="#fff" stroke="#000" strokeWidth={8} strokeLinejoin="round" />
          {[0.25, 0.5, 0.75].map((f, i) => (
            <path key={i} d={`M ${530 + f * 460} 562 Q ${530 + f * 460 + (f - 0.5) * 70} 430 ${760 + (f - 0.5) * 90} 334`} fill="none" stroke="#DDE2E8" strokeWidth={11} />
          ))}
          <path d="M 530 560 C 520 420 620 330 760 330 C 900 330 1000 420 990 560" fill="none" stroke="#000" strokeWidth={8} />
          {/* bomb hanging nose down */}
          <g transform={`translate(760 ${720 + 190}) rotate(-90) scale(${L})`}>
            <image href={F('bomb')} x={-369} y={-168} width={bomb.w} height={bomb.h} />
          </g>
          {/* worried eyes */}
          {[-1, 1].map((d) => (
            <g key={d} transform={`translate(${760 + d * 30} ${1000})`}>
              <ellipse rx={21} ry={25} fill="#FEFDFD" stroke="#000" strokeWidth={5} />
              <ellipse cx={0} cy={8} rx={10} ry={11} fill="#000" />
              <circle cx={4} cy={3} r={3.5} fill="#fff" />
              <path d={`M ${-19} ${-38 - d * 7} Q 0 ${-46} 19 ${-38 + d * 7}`} fill="none" stroke="#000" strokeWidth={6} strokeLinecap="round" />
            </g>
          ))}
          <path d="M 836 950 Q 850 928 842 908 Q 862 932 853 952 Q 845 963 836 950 Z" fill="#8FD3FF" stroke="#000" strokeWidth={4} />
        </g>
      </svg>
      {/* fisherman in the boat */}
      <Img src={F('f_up')} style={{position: 'absolute', left: 330 - fish.feet[0] * fs, top: 1460 - fish.feet[1] * fs, width: fish.w * fs, height: fish.h * fs}} />
      <Img src={F('boat')} style={{position: 'absolute', left: 170 - 279 * bs, top: 1440 - 215 * 1.05 * bs, width: boat.w * bs, height: boat.h * bs * 1.05}} />
      <div style={{position: 'absolute', left: -200, top: 1440, width: 1500, height: 600, background: 'rgba(61,177,234,0.45)'}} />
      {/* cover text */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 120,
          width: 760,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 150,
          lineHeight: 1.0,
          color: '#FFE45C',
          WebkitTextStroke: '20px #000',
          paintOrder: 'stroke',
          transform: 'rotate(-4deg)',
          textAlign: 'left',
        }}
      >
        LOST
        <br />
        AT SEA
      </div>
    </AbsoluteFill>
  );
};
