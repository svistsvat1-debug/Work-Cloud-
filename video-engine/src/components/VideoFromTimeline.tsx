import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/permanent-marker';
import '@fontsource/caveat-brush';
import {easeInOut, prog} from '../lib/anim';
import {SceneData, SceneProvider} from '../lib/scene';
import {C} from './draw';

export type Transition = 'wipe' | 'fade' | 'cut';
export type SceneDef = {C: React.FC; tr?: Transition};

const W = 1920;
const H = 1080;
const OVERLAP = 0.5; // seconds a scene stays under the next one's transition

/** Waits for the marker fonts before any frame is captured. */
export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load('64px "Permanent Marker"'), document.fonts.load('48px "Caveat Brush"')])
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};

/** Board background with paper texture. */
export const BoardBg: React.FC = () => (
  <>
    <rect x={0} y={0} width={W} height={H} fill={C.board} />
    <image href={staticFile('paper.png')} x={0} y={0} width={W} height={H} />
  </>
);

const SceneFrame: React.FC<{idx: number; tr: Transition; children: React.ReactNode}> = ({idx, tr, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const boil = Math.floor(frame / 4) % 6; // hand-drawn "boil": jitter pattern changes ~7x/s
  let clip: React.ReactNode = null;
  let opacity = 1;
  let eraser: React.ReactNode = null;
  if (idx > 0 && tr === 'wipe') {
    const p = easeInOut(prog(t, 0, 0.5));
    const x = -60 + (W + 120) * p;
    clip = (
      <clipPath id={`wipe${idx}`}>
        <rect x={0} y={0} width={Math.max(0, x)} height={H} />
      </clipPath>
    );
    if (p < 1)
      eraser = (
        <g transform={`translate(${x},${H / 2}) rotate(-8)`}>
          <rect x={-40} y={-300} width={80} height={600} rx={18} fill="#2f2f2f" opacity={0.85} />
          <rect x={-40} y={-300} width={80} height={120} rx={18} fill={C.blue} opacity={0.9} />
        </g>
      );
  } else if (idx > 0 && tr === 'fade') {
    opacity = easeInOut(prog(t, 0, 0.35));
  }
  return (
    <AbsoluteFill style={{opacity}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          {clip}
          {/* hand-drawn jitter: displacement by a pre-rendered smooth-noise image (6 variants = "boil") */}
          <filter id={`wob${idx}`} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <feImage href={staticFile(`wobble_${boil}.png`)} x={0} y={0} width={W} height={H} preserveAspectRatio="none" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={7} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g clipPath={clip ? `url(#wipe${idx})` : undefined}>
          <BoardBg />
          <g filter={process.env.NO_WOB ? undefined : `url(#wob${idx})`}>{children}</g>
        </g>
        {eraser}
      </svg>
    </AbsoluteFill>
  );
};

export const VideoFromTimeline: React.FC<{scenes: SceneData[]; defs: SceneDef[]}> = ({scenes, defs}) => {
  useFonts();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      {scenes.map((sc, i) => {
        const from = Math.round(sc.start * fps);
        const last = i === scenes.length - 1;
        const dur = Math.round((sc.end + (last ? 0 : OVERLAP)) * fps) - from;
        const def = defs[i];
        const Comp = def?.C ?? (() => null);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} name={`S${String(sc.i).padStart(2, '0')}`}>
            <SceneProvider scene={sc}>
              <SceneFrame idx={i} tr={def?.tr ?? 'fade'}>
                <Comp />
              </SceneFrame>
            </SceneProvider>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
