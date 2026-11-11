import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timeline from './data/timeline.json';
import {MissionHud} from './components/hud';
import {SceneData, SceneProvider} from './lib/timing';
import {C, FPS, H, W} from './lib/theme';
import {SCENES} from './scenes';

const T = 12; // transition frames (overlap between scenes)

// Scenes that start a new mission (or the final block) are entered with a board erase; the rest pan.
export const ERASE_BEFORE = new Set([9, 17, 23, 29, 35, 38, 44]);

export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const load = async () => {
      const fonts = [
        new FontFace('PermanentMarker', `url(${staticFile('fonts/PermanentMarker-Regular.ttf')})`),
        new FontFace('CaveatBrush', `url(${staticFile('fonts/CaveatBrush-Regular.ttf')})`),
      ];
      for (const ff of fonts) {
        try {
          await ff.load();
          document.fonts.add(ff);
        } catch (e) {
          console.error(e);
        }
      }
      continueRender(handle);
    };
    load();
  }, [handle]);
};

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const SceneFrame: React.FC<{scene: SceneData; len: number; enter: 'pan' | 'erase' | 'none'; exit: 'pan' | 'erase' | 'none'; children: React.ReactNode}> = ({
  len,
  enter,
  exit,
  children,
}) => {
  const f = useCurrentFrame();
  let tx = 0;
  let clip: string | undefined;
  if (enter === 'pan' && f < T) tx += (1 - ease(f / T)) * W;
  if (exit === 'pan' && f > len) tx -= ease((f - len) / T) * W;
  if (enter === 'erase' && f < T) {
    const p = ease(f / T);
    clip = `inset(0 ${(1 - p) * 100}% 0 0)`;
  }
  if (exit === 'erase' && f > len) {
    const p = ease((f - len) / T);
    clip = `inset(0 0 0 ${p * 100}%)`;
  }
  return (
    <AbsoluteFill style={{clipPath: clip}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'visible'}}>
        <g transform={`translate(${tx},0)`}>{children}</g>
      </svg>
    </AbsoluteFill>
  );
};

const Eraser: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + T) return null;
  const p = ease((f - at) / T);
  const x = p * W;
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <g transform={`translate(${x},${540}) rotate(8)`}>
        <rect x={-55} y={-160} width={110} height={320} rx={18} fill={C.blue} stroke={C.ink} strokeWidth={6} />
        <rect x={-55} y={-160} width={110} height={90} rx={18} fill={C.ink} />
      </g>
    </svg>
  );
};

export const findWord = (sceneId: number, key: string, nth = 1) => {
  const sc = (timeline.scenes as SceneData[]).find((s) => s.id === sceneId);
  if (!sc) return 0;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let hit = 0;
  for (const w of sc.words) {
    if (norm(w.w) === norm(key)) {
      hit++;
      if (hit === nth) return Math.round(w.t * FPS);
    }
  }
  return Math.round(sc.start * FPS);
};

export const Video: React.FC = () => {
  useFonts();
  const scenes = timeline.scenes as SceneData[];
  const missions = [
    {start: findWord(3, 'Mission'), done: findWord(8, 'join')},
    {start: findWord(9, 'Mission'), done: findWord(16, 'joins')},
    {start: findWord(17, 'Mission'), done: findWord(22, 'joins')},
    {start: findWord(23, 'Mission'), done: findWord(26, 'joins')},
    {start: findWord(26, 'Mission'), done: findWord(28, 'joins')},
    {start: findWord(29, 'Mission'), done: findWord(34, 'joins')},
    {start: findWord(35, 'Mission'), done: findWord(37, 'answer')},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      <Img src={staticFile('paper.jpg')} style={{position: 'absolute', width: W, height: H}} />
      {scenes.map((sc, i) => {
        const from = Math.round(sc.start * FPS);
        const len = Math.round(sc.end * FPS) - from;
        const Comp = SCENES[sc.id];
        const enter = i === 0 ? 'none' : ERASE_BEFORE.has(sc.id) ? 'erase' : 'pan';
        const next = scenes[i + 1];
        const exit = !next ? 'none' : ERASE_BEFORE.has(next.id) ? 'erase' : 'pan';
        return (
          <Sequence key={sc.id} from={from} durationInFrames={len + (exit === 'none' ? 0 : T)} name={`S${sc.id}`} premountFor={0}>
            <SceneProvider scene={sc}>
              <SceneFrame scene={sc} len={len} enter={enter} exit={exit}>
                {Comp ? <Comp /> : <text x={960} y={540} fontSize={60} textAnchor="middle">{`scene ${sc.id}`}</text>}
              </SceneFrame>
            </SceneProvider>
            {exit === 'erase' ? <Eraser at={len} /> : null}
          </Sequence>
        );
      })}
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <MissionHud missions={missions} showFrom={findWord(3, 'Mission')} hideAt={Math.round(scenes[37].start * FPS)} />
      </svg>
    </AbsoluteFill>
  );
};
