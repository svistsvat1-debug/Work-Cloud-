import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {Burst, C, Icon, Scribble, Stroke} from '../../components/draw';
import {Fig} from '../../components/figure';
import {I} from '../../components/icons';
import {FONT_TITLE} from '../../components/text';
import {useFonts} from '../../components/VideoFromTimeline';
import {SceneProvider} from '../../lib/scene';

// Thumbnail concept A: "The Convoy" — soldier + endless convoy + "5,958 TRUCKS. ONE DAY."
const FAKE = {i: 0, block: 'thumb', vo: '', mood: '', start: 0, end: 100, voStart: 0, voEnd: 100, words: []};

const road = (t: number): [number, number] => {
  // quadratic bezier from horizon (860,330) to the foxhole (420,690)
  const p0 = [880, 318];
  const p1 = [1180, 560];
  const p2 = [430, 700];
  const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
  const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
  return [x, y];
};

export const Thumbnail: React.FC = () => {
  useFonts();
  const trucks = [0.03, 0.09, 0.16, 0.24, 0.33, 0.43, 0.54, 0.66, 0.79];
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      <SceneProvider scene={FAKE as any} offset={50}>
        <svg width={1280} height={720} viewBox="0 0 1280 720">
          <defs>
            <filter id="wobT" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={3} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <rect width={1280} height={720} fill={C.board} />
          <image href={staticFile('paper.png')} x={0} y={0} width={1920} height={1080} transform="scale(0.667)" />
          <g filter="url(#wobT)">
            {/* horizon hills */}
            <Scribble d="M0,330 Q200,290 420,320 T880,318 T1280,300 L1280,720 L0,720 Z" box={[0, 280, 1280, 440]} color={C.green} at={0} instant opacity={0.35} sp={22} w={18} />
            <Stroke d="M0,330 Q200,290 420,320 T880,318 T1280,300" at={0} instant w={5} />
            {/* road */}
            <path d="M870,318 Q1150,560 360,720 L520,720 Q1215,560 892,318 Z" fill="#e2d3ad" stroke={C.ink} strokeWidth={5} />
            {trucks.map((t, i) => {
              const [x, y] = road(t);
              const s = 0.12 + t * 0.55;
              return <Icon key={i} def={I.truck} x={x} y={y - 60 * s} s={s} mode="instant" />;
            })}
            {/* soldier in a foxhole, looking at the convoy */}
            <Fig x={225} y={760} s={1.6} mode="instant" rifle />
            <Scribble d="M40,620 Q230,575 420,620 L420,720 L40,720 Z" box={[40, 570, 380, 150]} color="#8a6a45" at={0} instant opacity={0.9} />
            <Stroke d="M40,620 Q230,575 420,620" at={0} instant w={6} />
            {/* text: max 4 words */}
            <Burst x={1080} y={112} rx={190} ry={62} at={0} n={16} />
            <text x={1250} y={150} fontFamily={FONT_TITLE} fontSize={112} textAnchor="end" fill={C.ink} stroke={C.board} strokeWidth={14} paintOrder="stroke">5,958</text>
            <text x={1250} y={225} fontFamily={FONT_TITLE} fontSize={78} textAnchor="end" fill={C.ink} stroke={C.board} strokeWidth={12} paintOrder="stroke">TRUCKS.</text>
            <text x={1250} y={300} fontFamily={FONT_TITLE} fontSize={78} textAnchor="end" fill={C.red} stroke={C.board} strokeWidth={12} paintOrder="stroke">ONE DAY.</text>
            <path d="M900,322 Q1060,312 1252,320" fill="none" stroke={C.red} strokeWidth={9} strokeLinecap="round" />
          </g>
        </svg>
      </SceneProvider>
    </AbsoluteFill>
  );
};
