// Publishing package v2: three thumbnails for YouTube Test & Compare (1280x720).
// Rules: max 3 objects, max 4 words, must not repeat the title, marker-whiteboard style, no Nazi symbols, no gore.
import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {Burst, C, Icon, Scribble, Stroke} from '../../components/draw';
import {Clerk, Rifleman, ThumbText} from '../../components/faces';
import {Fig} from '../../components/figure';
import {I} from '../../components/icons';
import {useFonts} from '../../components/VideoFromTimeline';
import {SceneProvider} from '../../lib/scene';

const FAKE = {i: 0, block: 'thumb', vo: '', mood: '', start: 0, end: 100, voStart: 0, voEnd: 100, words: []};

const Frame: React.FC<{children: React.ReactNode; seed?: number}> = ({children, seed = 3}) => {
  useFonts();
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      <SceneProvider scene={FAKE as any} offset={50}>
        <svg width={1280} height={720} viewBox="0 0 1280 720">
          <defs>
            <filter id="wobT2" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves={2} seed={seed} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={3} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <radialGradient id="vig" cx="50%" cy="50%" r="75%">
              <stop offset="60%" stopColor="#000" stopOpacity={0} />
              <stop offset="100%" stopColor="#000" stopOpacity={0.18} />
            </radialGradient>
          </defs>
          <rect width={1280} height={720} fill={C.board} />
          <image href={staticFile('paper.png')} x={0} y={0} width={1920} height={1080} transform="scale(0.667)" />
          <g filter="url(#wobT2)">{children}</g>
          <rect width={1280} height={720} fill="url(#vig)" />
        </svg>
      </SceneProvider>
    </AbsoluteFill>
  );
};

/** A — "SAME ARMY?": exhausted rifleman in the mud vs smiling clerk with coffee (emotional contrast). */
export const ThumbA: React.FC = () => (
  <Frame seed={4}>
    {/* left half: mud + rain-dark ground */}
    <Scribble d="M0,0 L610,0 L560,720 L0,720 Z" box={[0, 0, 620, 720]} color="#8a7a62" at={0} instant opacity={0.55} sp={26} w={22} />
    <Scribble d="M0,560 Q300,520 590,560 L560,720 L0,720 Z" box={[0, 500, 600, 220]} color="#6e5236" at={0} instant opacity={0.8} />
    {/* right half: warm office */}
    <Scribble d="M650,0 L1280,0 L1280,720 L600,720 Z" box={[600, 0, 680, 720]} color={C.yellow} at={0} instant opacity={0.35} sp={30} w={22} />
    <Stroke d="M630,-10 L580,730" at={0} instant w={10} />
    <Rifleman x={300} y={330} s={1.35} mood="tired" look={[0.9, -0.2]} />
    <Clerk x={980} y={350} s={1.25} mood="smug" />
    <ThumbText text="SAME ARMY?" x={640} y={680} size={112} color={C.red} highlight={C.yellow} rot={-2} width={640} />
  </Frame>
);

/** B — "ALL FOR HIM?": worried rifleman close-up, endless queue of support troops behind him. */
export const ThumbB: React.FC = () => {
  const n = 16;
  return (
    <Frame seed={7}>
      <Scribble d="M0,470 Q320,430 640,460 T1280,450 L1280,720 L0,720 Z" box={[0, 420, 1280, 300]} color={C.green} at={0} instant opacity={0.4} sp={24} w={20} />
      <Stroke d="M0,470 Q320,430 640,460 T1280,450" at={0} instant w={6} />
      {/* the line, shrinking toward the horizon */}
      {Array.from({length: n}).map((_, i) => {
        const t = i / (n - 1);
        const x = 760 - t * 720;
        const y = 600 - t * 140;
        const s = 1.05 - t * 0.75;
        return <Fig key={i} x={x} y={y} s={s} color="#c9c4b8" helmet={false} mode="instant" />;
      })}
      {/* red arrow from the line to him */}
      <path d="M200,250 Q560,120 860,240" fill="none" stroke={C.red} strokeWidth={14} strokeLinecap="round" />
      <path d="M820,200 L866,244 L806,262" fill="none" stroke={C.red} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <Rifleman x={1040} y={330} s={1.3} mood="worried" look={[-0.9, 0]} />
      <ThumbText text="ALL FOR HIM?" x={420} y={150} size={100} color={C.ink} highlight={C.yellow} rot={-3} width={700} />
    </Frame>
  );
};

/** C — "5,958 TRUCKS. ONE DAY.": shocked rifleman + convoy snaking from the horizon. */
export const ThumbC: React.FC = () => {
  const road = (t: number): [number, number] => {
    const p0 = [700, 300];
    const p1 = [1100, 470];
    const p2 = [700, 760];
    return [
      (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
      (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
    ];
  };
  const trucks = [0.03, 0.12, 0.23, 0.37, 0.54, 0.76];
  return (
    <Frame seed={9}>
      <Scribble d="M0,320 Q300,280 640,305 T1280,290 L1280,720 L0,720 Z" box={[0, 270, 1280, 450]} color={C.green} at={0} instant opacity={0.38} sp={24} w={20} />
      <Stroke d="M0,320 Q300,280 640,305 T1280,290" at={0} instant w={6} />
      <path d="M690,302 Q1090,470 620,740 L800,740 Q1140,470 712,302 Z" fill="#e2d3ad" stroke={C.ink} strokeWidth={6} />
      {trucks.map((t, i) => {
        const [x, y] = road(t);
        const s = 0.12 + t * 0.62;
        return <Icon key={i} def={I.truck} x={x} y={y - 62 * s} s={s} mode="instant" flip={t < 0.3} />;
      })}
      <Rifleman x={270} y={350} s={1.3} mood="shocked" look={[0.9, -0.3]} />
      <ThumbText text="5,958" x={1250} y={135} size={124} anchor="end" highlight={C.yellow} width={420} />
      <ThumbText text="TRUCKS." x={1250} y={225} size={80} anchor="end" width={380} />
      <ThumbText text="ONE DAY." x={1250} y={318} size={96} anchor="end" color={C.red} width={470} />
    </Frame>
  );
};
